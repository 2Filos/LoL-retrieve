/**
 * sync_load.js
 * Logic for fetching notes from GitHub, resolving file paths, 
 * handling offline fallbacks, and triggering conflict detection.
 */

/**
 * Resolves search terms, builds target path rules, fetches notes from GitHub
 * or retrieves active local storage drafts, and populates the text editor.
 */
async function loadMatchup() {
    const enemyName = document.getElementById('enemyChamp').value;
    const myName = document.getElementById('myChamp').value;    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] Triggered loadMatchup: ${myName} vs ${enemyName}`);
    }

    // Resolve display names to keys using helpers in utils.js
    const enemyKey = getChampionKeyByName(enemyName);
    const myKey = getChampionKeyByName(myName);

    if (!enemyKey || !myKey) {
        alert("Please select or enter valid champions from the list.");
        return;
    }

    // Formulate Mobalytics counters URL and display button (opens to the latter champion: enemyKey)
    const mobaLink = document.getElementById('mobalyticsLink');
    const slug = getMobalyticsSlug(enemyKey);
    if (mobaLink) {
        mobaLink.href = `https://mobalytics.gg/lol/champions/${slug}/counters`;
        mobaLink.style.display = 'inline-flex';
    }

    const roleSelect = document.getElementById('roleSelect');
    const role = roleSelect ? roleSelect.value : 'top';

    let lolaRole = role;
    if (role === 'mid') lolaRole = 'middle';
    if (role === 'adc') lolaRole = 'bottom';

    const opggLink = document.getElementById('opggLink');
    if (opggLink) {
        opggLink.href = `https://op.gg/lol/champions/${myKey.toLowerCase()}/counters/${role}?region=global&type=ranked&tier=platinum_plus&target_champion=${enemyKey.toLowerCase()}`;
        opggLink.style.display = 'inline-flex';
    }

    const lolaLink = document.getElementById('lolaLink');
    if (lolaLink) {
        lolaLink.href = `https://lolalytics.com/lol/${myKey.toLowerCase()}/vs/${enemyKey.toLowerCase()}/build/?lane=${lolaRole}&tier=platinum_plus&vslane=${lolaRole}&patch=30`;
        lolaLink.style.display = 'inline-flex';
    }

    const label = `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
    const pathInfo = resolvePagePath({ enemyKey, myKey }, activePageSide);

    await loadMatchupByPath(pathInfo.path, label, pathInfo.draftKey, enemyKey, myKey);
}

/**
 * Loads the General Notes from GitHub or local drafts.
 */
async function loadGeneralNotes() {    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] Triggered loadGeneralNotes`);
    }
    // Clear inputs so user can easily search for matchups
    document.getElementById('enemyChamp').value = '';
    document.getElementById('myChamp').value = '';

    // Hide external links
    const mobaLink = document.getElementById('mobalyticsLink');
    if (mobaLink) mobaLink.style.display = 'none';

    const opggLink = document.getElementById('opggLink');
    if (opggLink) opggLink.style.display = 'none';

    const lolaLink = document.getElementById('lolaLink');
    if (lolaLink) lolaLink.style.display = 'none';

    const pathInfo = resolvePagePath({ enemyKey: null, myKey: null }, activePageSide);

    await loadMatchupByPath(pathInfo.path, 'General', pathInfo.draftKey, null, null);
}

/**
 * Helper function to fetch notes from GitHub or load local drafts
 * for a specific path, setting the activeMatchup state.
 */
async function loadMatchupByPath(path, label, draftKey, enemyKey = null, myKey = null) {
    PerfProfiler.phaseStart(`loadMatchupByPath:${path}`);
    const statusEl = document.getElementById('status');
    const editorEl = document.getElementById('editor');
    const fileLabel = document.getElementById('currentFileLabel');
    const conflictBanner = document.getElementById('conflictBanner');

    // Set global active matchup configuration
    activeMatchup = {
        path: path,
        label: label,
        draftKey: draftKey,
        enemyKey: enemyKey,
        myKey: myKey
    };

    // Re-render local drafts so the newly active matchup is hidden and previously active ones reappear
    renderLocalDrafts();

    statusEl.innerText = `Searching for ${label}...`;
    if (conflictBanner) conflictBanner.style.display = 'none';
    updateDiscardButtonState(false);
    currentSha = null;
    githubTextCache = null;

    // Determine if we are loading the primary file
    const isMatchup = enemyKey && myKey;
    const isPrimaryFile = (isMatchup && activePageSide === 'right') || (!isMatchup && activePageSide === 'left');
    const shouldResetMetadata = isPrimaryFile;

    // Check if matchup changed (cross-tab navigation should not reset shared metadata)
    const currentMatchupKey = `${enemyKey}_${myKey}`;
    const matchupChanged = (window.lastMatchupKey !== currentMatchupKey);
    if (matchupChanged) {
        window.lastMatchupKey = currentMatchupKey;
        activeMetadata = { customLinks: [], linkOrder: [] }; // start clean
        
        // 1. Try getting metadata from primary local draft
        const primaryDraftKey = isMatchup ? `draft_matchup:${enemyKey}/${myKey}` : `draft_matchup:Notes`;
        const primaryDraftRaw = localStorage.getItem(primaryDraftKey);
        if (primaryDraftRaw) {
            const match = primaryDraftRaw.match(/<!-- METADATA: (.*?) -->/);
            if (match) {
                try {
                    const parsed = JSON.parse(match[1]);
                    activeMetadata.customLinks = parsed.customLinks || [];
                    activeMetadata.linkOrder = parsed.linkOrder || [];
                } catch(e) {}
            }
        }
        
        // 2. If not a primary file and we have bridge, asynchronously fetch primary file to get links
        if (!isPrimaryFile && typeof bridgeActive !== 'undefined' && bridgeActive && typeof CONFIG !== 'undefined' && isConfigValid) {
            const config = getAPIConfig();
            const primaryPath = isMatchup ? `matchups/${enemyKey}/${myKey}.md` : `Notes.md`;
            bridgeFetch(`${config.url}${primaryPath}?t=${Date.now()}`, { headers: config.headers })
                .then(res => { if (res.ok) return res.json(); })
                .then(data => {
                    if (data && data.content) {
                        const decoded = decodeURIComponent(escape(atob(data.content)));
                        const match = decoded.match(/<!-- METADATA: (.*?) -->/);
                        if (match) {
                            try {
                                const parsed = JSON.parse(match[1]);
                                activeMetadata.customLinks = parsed.customLinks || [];
                                activeMetadata.linkOrder = parsed.linkOrder || [];
                                updateDetectedLinks(); // Update UI
                            } catch(e) {}
                        }
                    }
                })
                .catch(e => console.error("Failed async metadata fetch", e));
        }
    }

    // Check for local draft cache
    const localDraftRaw = localStorage.getItem(draftKey);
    let localDraftText = null;
    if (localDraftRaw !== null) {
        console.log("[DEBUG] Local draft found. Length:", localDraftRaw.length);
        localDraftText = extractMetadata(localDraftRaw, shouldResetMetadata);
    } else {
        console.log("[DEBUG] No local draft found.");
        if (shouldResetMetadata) {
            activeMetadata = { customLinks: [], linkOrder: [] };
        }
    }

    // Fallback load in offline-only mode
    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        fileLabel.innerText = `${label} (Local Draft)`;
        editorEl.value = localDraftText || "";
        editorEl.disabled = false;
        statusEl.innerText = "Offline Mode: Draft active.";
        updateDiscardButtonState(localDraftText !== null);
        updateDetectedLinks();
        updateStarButtonUI();
        return;
    }

    const config = getAPIConfig();
    try {
        console.log(`[DEBUG] Fetching from GitHub: ${path}`);
        const cacheBusterUrl = `${config.url}${path}?t=${Date.now()}`;

        // Force no-cache headers to ensure we get the absolute latest SHA
        const fetchHeaders = Object.assign({}, config.headers, {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        });

        const response = await bridgeFetch(cacheBusterUrl, { headers: fetchHeaders });

        if (response.isExpired) {
            const tokenErrEl = document.getElementById('tokenExpiredError');
            if (tokenErrEl) tokenErrEl.style.display = 'block';
            return;
        }

        if (response.status === 404) {
            // File does not exist on GitHub yet
            statusEl.innerText = `${label} not found on GitHub.\n Ready to create new file.`;
            fileLabel.innerText = `New File: ${label}`;
            editorEl.value = localDraftText || "";
            editorEl.disabled = false;
            updateDiscardButtonState(true);
            updateDetectedLinks();
        } else if (response.ok) {
            // File loaded successfully
            const data = response.json();
            currentSha = data.sha; // Save SHA to track current revision
            console.log(`[DEBUG] Loaded from GitHub. currentSha is now: ${currentSha}`);

            // Decodes Base64 to UTF-8 text safely
            const decodedTextRaw = decodeURIComponent(escape(atob(data.content)));

            // CONFLICT CHECK:
            // Compare local draft cache content with remote version loaded from GitHub.
            if (localDraftRaw !== null && localDraftRaw !== decodedTextRaw) {
                console.log("[DEBUG] Conflict detected!");
                console.log("[DEBUG] localDraftRaw length:", localDraftRaw.length);
                console.log("[DEBUG] decodedTextRaw length:", decodedTextRaw.length);

                if (conflictBanner) conflictBanner.style.display = 'flex'; // reveal conflict warning banner

                // If there's a conflict, localDraftText (and activeMetadata) was already extracted above
                editorEl.value = localDraftText;

                // Cache the github remote text without overwriting our activeMetadata
                const match = decodedTextRaw.match(/<!-- METADATA: (.*?) -->/);
                githubTextCache = match ? decodedTextRaw.replace(match[0], '').trimEnd() : decodedTextRaw;

                statusEl.innerText = "Conflict!\nUnsaved local edits differ from GitHub version.";
                updateDiscardButtonState(true);
                updateDetectedLinks();
            } else {
                // Synced state: No local variations
                console.log("[DEBUG] No conflict detected.");
                if (localDraftRaw !== null) {
                    console.log("[DEBUG] Clearing redundant local draft.");
                    localStorage.removeItem(draftKey); // Clear redundant draft
                    renderLocalDrafts();
                }
                editorEl.value = extractMetadata(decodedTextRaw, shouldResetMetadata);
                githubTextCache = editorEl.value;
                statusEl.innerText = "Loaded successfully from GitHub!";
                updateDiscardButtonState(false);
                updateDetectedLinks();
            }
            fileLabel.innerText = label;
            editorEl.disabled = false;
        } else {
            statusEl.innerText = `Error code: ${response.status}`;
        }
    } catch (err) {
        statusEl.innerText = "Bridge fetch error: " + err.message;
        fileLabel.innerText = `${label} (Offline)`;
        editorEl.value = localDraftText || "";
        editorEl.disabled = false;
        updateDiscardButtonState(localDraftRaw !== null);
        updateDetectedLinks();
    }

    updateStarButtonUI();
    updateTabLabels();
    PerfProfiler.mark(`matchup_loaded:${path}`);
    PerfProfiler.phaseEnd();
}
