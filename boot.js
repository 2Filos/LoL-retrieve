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

// --- Application Boot Loop ---
window.onload = async () => {
    const editorEl = document.getElementById('editor');
    const fileLabel = document.getElementById('currentFileLabel');
    const statusEl = document.getElementById('status');
    if (editorEl && fileLabel && statusEl) {
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
    }

    // 1. Establish bridge connectivity status
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
        await loadChampionsList();

        // Authorize with GitHub credentials
        if (typeof CONFIG !== 'undefined' && isConfigValid) {
            await checkTokenValidity();
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

    // 4. Auto-restore search inputs, check URL parameters, or default to General Notes
    let urlEnemy = null;
    let urlMy = null;

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('enemy') && urlParams.has('my')) {
        urlEnemy = urlParams.get('enemy');
        urlMy = urlParams.get('my');
    } else {
        // Parse from hash or raw search string (e.g. #GarenvsDarius, ?GarenvsDarius)
        let rawParams = window.location.hash.substring(1) || window.location.search.substring(1);
        if (rawParams) {
            // Try to match variations of "vs" like "GarenvsDarius" or "Garen-vs-Darius"
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

    if (urlEnemy && urlMy) {
        // Update input fields using utils.js helpers to ensure proper formatting
        const enemyKey = getChampionKeyByName(urlEnemy) || urlEnemy;
        const myKey = getChampionKeyByName(urlMy) || urlMy;
        document.getElementById('enemyChamp').value = getChampionNameByKey(enemyKey);
        document.getElementById('myChamp').value = getChampionNameByKey(myKey);
    }

    const enemyVal = document.getElementById('enemyChamp').value;
    const myVal = document.getElementById('myChamp').value;
    if (enemyVal && myVal) {
        loadMatchup();
    } else {
        loadGeneralNotes();
    }
};

/**
 * Dynamic event handler triggered on textarea inputs.
 * Auto-saves drafts locally immediately upon user typing.
 */
document.getElementById('editor').addEventListener('input', () => {
    if (!activeMatchup.draftKey) return;

    const textContent = document.getElementById('editor').value;

    // Save current content to localStorage
    localStorage.setItem(activeMatchup.draftKey, textContent);
    renderLocalDrafts(); // Refresh list display

    updateDiscardButtonState(true);
    document.getElementById('status').innerText = "Typing... saved draft locally.";
    updateDetectedLinks();
});
