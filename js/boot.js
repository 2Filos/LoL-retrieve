/**
 * boot.js
 * Application initialization and global state for LoL Matchup Portal
 */

// --- Global Editor State variables ---
let currentSha = null;        // Cryptographic revision tracker returned from GitHub to prevent edit collisions
let CHAMPIONS = [];           // Array of objects { key, name } loaded from Riot Games' champion catalog
let githubTextCache = null;   // Cached text of the last loaded document straight from GitHub (used to resolve conflicts)
let ddragonVersion = null;    // Latest DDragon patch version string (e.g. "14.13.1") for champion icon URLs
let activeMatchup = {         // Active loaded matchup metadata
    path: null,
    label: null,
    draftKey: null,
    enemyKey: null,
    myKey: null
};
let activeMetadata = {        // Invisible custom links and order metadata
    customLinks: [],
    linkOrder: []
};
let activePageSide = 'right'; // Which tab is active: 'left' or 'right'
                              // Matchups: left=Plan, right=Notes
                              // General:  left=Notes, right=VODs

// --- Application Boot Loop ---
window.onload = async () => {
    console.log(`[PROCEDURAL_TEST] Page Booted / Reloaded at ${new Date().toISOString()}`);
    PerfProfiler.phaseStart('boot');
    // Restore last-active tab side from localStorage
    const savedTabSide = localStorage.getItem('editor_active_tab_side');
    if (savedTabSide && (savedTabSide === 'left' || savedTabSide === 'right')) {
        activePageSide = savedTabSide;
    }
    const editorEl = document.getElementById('editor');
    const fileLabel = document.getElementById('currentFileLabel');
    const statusEl = document.getElementById('status');
    // Check URL parameters early to prevent General Notes flicker if loading a specific matchup
    let urlEnemy = null;
    let urlMy = null;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('enemy') && urlParams.has('my')) {
        urlEnemy = urlParams.get('enemy');
        urlMy = urlParams.get('my');
    } else {
        let rawParams = window.location.hash.substring(1) || window.location.search.substring(1);
        if (rawParams) {
            const vsRegex = /^(.*?)(?:-vs-|vs)(.*)$/i;
            const match = rawParams.match(vsRegex);
            if (match) {
                urlMy = decodeURIComponent(match[1]).trim();
                urlEnemy = decodeURIComponent(match[2]).trim();
            } else if (rawParams.includes('-')) {
                const parts = rawParams.split('-');
                if (parts.length === 2) {
                    urlMy = decodeURIComponent(parts[0]).trim();
                    urlEnemy = decodeURIComponent(parts[1]).trim();
                }
            }
        }
    }

    const hasUrlMatchup = Boolean(urlEnemy && urlMy);
    const prefilledEnemy = document.getElementById('enemyChamp')?.value;
    const prefilledMy = document.getElementById('myChamp')?.value;
    const hasFormMatchup = Boolean(prefilledEnemy && prefilledMy);
    
    const willLoadMatchup = hasUrlMatchup || hasFormMatchup;

    if (editorEl && fileLabel && statusEl) {
        if (!willLoadMatchup) {
            // Delay the 'Notes' visual rendering by 100ms. 
            // If the script finishes booting fast, loadGeneralNotes() naturally takes over.
            // If the bridge check hangs, this provides the offline fallback gracefully without an instant snap.
            window.notesFallbackTimer = setTimeout(() => {
                const notesDraft = localStorage.getItem('draft_matchup:Notes');
                fileLabel.innerText = 'Notes';
                if (notesDraft !== null) {
                    editorEl.value = notesDraft;
                    editorEl.disabled = false;
                    statusEl.innerText = 'Status: Loading default notes...';
                    updateDiscardButtonState(true);
                } else {
                    editorEl.value = 'Loading default notes...';
                    editorEl.disabled = true;
                    statusEl.innerText = 'Status: Loading default notes...';
                    updateDiscardButtonState(false);
                }
                updateDetectedLinks();
            }, 100);
        } else {
            // Delay the 'Loading Matchup' visual rendering by 200ms to avoid flicker on fast loads.
            window.matchupFallbackTimer = setTimeout(() => {
                fileLabel.innerText = 'Loading Matchup...';
                editorEl.value = 'Fetching requested matchup...';
                editorEl.disabled = true;
                statusEl.innerText = 'Status: Booting bridge and loading requested matchup...';
                updateDiscardButtonState(false);
            }, 200);
        }
    }

    // 1. Establish bridge connectivity status
    PerfProfiler.mark('boot_dom_ready');
    const bridgeOk = await checkBridgeStatus();

    // 2. Add listener to external links to support background tab opening via the bridge
    const setupBgTabLink = (id) => {
        const link = document.getElementById(id);
        if (link) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const url = e.currentTarget.href;
                if (url && url !== '#' && !url.endsWith('#')) {
                    if (bridgeActive) {
                        window.dispatchEvent(new CustomEvent("OpenBackgroundTab", {
                            detail: { url: url }
                        }));
                    } else {
                        window.open(url, '_blank');
                    }
                }
            });
        }
    };
    setupBgTabLink('mobalyticsLink');
    setupBgTabLink('opggLink');
    setupBgTabLink('lolaLink');

    if (bridgeOk) {
        bridgeActive = true;
        // Hide bridge warnings if connected
        const bridgeErrEl = document.getElementById('bridgeError');
        if (bridgeErrEl) bridgeErrEl.style.display = 'none';

        // Load Riot DDragon lists
        PerfProfiler.phaseStart('loadChampionsList');
        await loadChampionsList();
        PerfProfiler.mark('champions_loaded');
        PerfProfiler.phaseEnd();

        // Authorize with GitHub credentials
        if (typeof CONFIG !== 'undefined' && isConfigValid) {
            // Token check blocks boot (needed for sync button state)
            await checkTokenValidity();
            renderSavedMatchups();
        } else {
            const connStatusEl = document.getElementById('connectionStatus');
            if (connStatusEl) {
                connStatusEl.className = 'status-badge offline';
                connStatusEl.innerText = 'Offline Mode';
            }
        }
    } else {
        // Fallback settings if bridge is offline
        bridgeActive = false;
        const bridgeErrEl = document.getElementById('bridgeError');
        const connStatusEl = document.getElementById('connectionStatus');
        const statusEl = document.getElementById('status');

        if (bridgeErrEl) bridgeErrEl.style.display = 'block';
        if (connStatusEl) {
            connStatusEl.className = 'status-badge offline';
            connStatusEl.innerText = 'Bridge Offline';
        }
        if (statusEl) statusEl.innerText = 'Status: Bridge unavailable. Operating in local-only mode.';

        // Populates UI using offline static backup catalogs
        await loadChampionsList();

        // Enable select elements so they work in local-only storage cache mode
        document.getElementById('enemyChamp').disabled = false;
        document.getElementById('myChamp').disabled = false;
        document.getElementById('loadBtn').disabled = false;
    }

    // 3. Render any draft objects stored in localStorage
    renderLocalDrafts();

    // Render saved matchups
    renderSavedMatchups();

    // 4. Set inputs and trigger final load based on URL or defaults
    if (hasUrlMatchup) {
        // Update input fields using utils.js helpers to ensure proper formatting
        const enemyKey = getChampionKeyByName(urlEnemy) || urlEnemy;
        const myKey = getChampionKeyByName(urlMy) || urlMy;
        document.getElementById('enemyChamp').value = getChampionNameByKey(enemyKey);
        document.getElementById('myChamp').value = getChampionNameByKey(myKey);
    }

    const enemyVal = document.getElementById('enemyChamp').value;
    const myVal = document.getElementById('myChamp').value;
    
    // Clear the fallback timers if they haven't executed yet, since we are doing the real load now
    if (window.notesFallbackTimer) clearTimeout(window.notesFallbackTimer);
    if (window.matchupFallbackTimer) clearTimeout(window.matchupFallbackTimer);

    PerfProfiler.mark('boot_content_loading');
    if (enemyVal && myVal) {
        await loadMatchup();
    } else {
        await loadGeneralNotes();
    }
    PerfProfiler.mark('boot_content_loaded');
    PerfProfiler.phaseEnd(); // end 'boot' phase
    PerfProfiler.printSummary();

    // Fire YouTube index fetch in background AFTER boot completes
    // This is non-critical (only affects sidebar VOD icons) and often slow/502
    if (bridgeActive && typeof CONFIG !== 'undefined' && isConfigValid) {
        fetchYoutubeLinksIndex().then(() => {
            renderSavedMatchups(); // re-render with fresh VOD data
        });
    }
};

/**
 * Dynamic event handler triggered on textarea inputs.
 * Auto-saves drafts locally immediately upon user typing.
 */
let autosaveTimeoutId;
document.getElementById('editor').addEventListener('input', () => {
    clearTimeout(autosaveTimeoutId);
    autosaveTimeoutId = setTimeout(() => {
        if (!activeMatchup.draftKey) return;

        const textContent = document.getElementById('editor').value;

        // Only append metadata to the primary file draft, matching saveToGitHub() and saveDraftBeforeSwitch()
        const isMatchup = activeMatchup.enemyKey && activeMatchup.myKey;
        const isPrimaryFile = (isMatchup && activePageSide === 'right') ||
                              (!isMatchup && activePageSide === 'left');
        const fullText = isPrimaryFile ? appendMetadata(textContent) : textContent;
        localStorage.setItem(activeMatchup.draftKey, fullText);
        renderLocalDrafts(); // Refresh list display
        
        console.log(`[PROCEDURAL_TEST] Editor autosave triggered for ${activeMatchup.path} (Length: ${textContent.length})`);

        if (typeof updateTabIndicators === 'function') {
            updateTabIndicators();
        }

        updateDiscardButtonState(true);
        document.getElementById('status').innerText = "Typing... saved draft locally.";
        updateDetectedLinks();
    }, 500); // 500ms debounce
});
