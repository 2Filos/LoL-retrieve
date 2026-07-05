/**
 * sync.js
 * Core logic for syncing matchups between GitHub and the Local Editor
 */

/**
 * Resolves search terms, builds target path rules, fetches notes from GitHub
 * or retrieves active local storage drafts, and populates the text editor.
 */
async function loadMatchup() {
    const enemyName = document.getElementById('enemyChamp').value;
    const myName = document.getElementById('myChamp').value;

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

    const opggLink = document.getElementById('opggLink');
    if (opggLink) {
        opggLink.href = `https://op.gg/lol/champions/${myKey.toLowerCase()}/counters/${role}?region=global&tier=platinum_plus&target_champion=${enemyKey.toLowerCase()}`;
        opggLink.style.display = 'inline-flex';
    }

    const lolaLink = document.getElementById('lolaLink');
    if (lolaLink) {
        lolaLink.href = `https://lolalytics.com/lol/${myKey.toLowerCase()}/vs/${enemyKey.toLowerCase()}/build/?vslane=${role}&tier=platinum_plus&patch=30`;
        lolaLink.style.display = 'inline-flex';
    }

    const path = `matchups/${enemyKey}/${myKey}.md`;
    const label = `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
    const draftKey = `draft_matchup:${enemyKey}/${myKey}`;

    await loadMatchupByPath(path, label, draftKey, enemyKey, myKey);
}

/**
 * Loads the General Notes matchup from GitHub or local drafts.
 */
async function loadGeneralNotes() {
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

    const path = 'Notes.md';
    const label = 'Notes';
    const draftKey = 'draft_matchup:Notes';

    await loadMatchupByPath(path, label, draftKey, null, null);
}

/**
 * Helper function to fetch notes from GitHub or load local drafts
 * for a specific path, setting the activeMatchup state.
 */
async function loadMatchupByPath(path, label, draftKey, enemyKey = null, myKey = null) {
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

    statusEl.innerText = `Searching for ${label}...`;
    if (conflictBanner) conflictBanner.style.display = 'none';
    updateDiscardButtonState(false);
    currentSha = null;
    githubTextCache = null;

    // Check for local draft cache
    const localDraft = localStorage.getItem(draftKey);

    // Fallback load in offline-only mode
    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        fileLabel.innerText = `${label} (Local Draft)`;
        editorEl.value = localDraft || "";
        editorEl.disabled = false;
        statusEl.innerText = "Offline Mode: Draft active.";
        updateDiscardButtonState(localDraft !== null);
        updateDetectedLinks();
        updateStarButtonUI();
        return;
    }

    const config = getAPIConfig();
    try {
        // Fetch files metadata from repository contents endpoint
        const response = await bridgeFetch(config.url + path, { headers: config.headers });

        if (response.isExpired) {
            const tokenErrEl = document.getElementById('tokenExpiredError');
            if (tokenErrEl) tokenErrEl.style.display = 'block';
            return;
        }

        if (response.status === 404) {
            // File does not exist on GitHub yet
            statusEl.innerText = `${label} not found on GitHub.\n Ready to create new file.`;
            fileLabel.innerText = `New File: ${label}`;
            editorEl.value = localDraft || "";
            editorEl.disabled = false;
            updateDiscardButtonState(true);
            updateDetectedLinks();
        } else if (response.ok) {
            // File loaded successfully
            const data = response.json();
            currentSha = data.sha; // Save SHA to track current revision

            // Decodes Base64 to UTF-8 text safely
            const decodedText = decodeURIComponent(escape(atob(data.content)));
            githubTextCache = decodedText; // Cache remote contents

            // CONFLICT CHECK:
            // Compare local draft cache content with remote version loaded from GitHub.
            if (localDraft !== null && localDraft !== decodedText) {
                if (conflictBanner) conflictBanner.style.display = 'flex'; // reveal conflict warning banner
                editorEl.value = localDraft; // Default display local edits
                statusEl.innerText = "Conflict! Unsaved local edits differ from GitHub version.";
                updateDiscardButtonState(true);
                updateDetectedLinks();
            } else {
                // Synced state: No local variations
                if (localDraft !== null) {
                    localStorage.removeItem(draftKey); // Clear redundant draft
                    renderLocalDrafts();
                }
                editorEl.value = decodedText;
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
        editorEl.value = localDraft || "";
        editorEl.disabled = false;
        updateDiscardButtonState(localDraft !== null);
        updateDetectedLinks();
    }

    updateStarButtonUI();
}

/**
 * Encodes local changes in Base64 and pushes them to GitHub.
 * Resets local cache and SHA tags upon success.
 */
async function saveToGitHub() {
    if (!activeMatchup.path) return;

    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        document.getElementById('status').innerText = "Saved draft locally. (Cannot sync: Bridge or Config offline).";
        return;
    }

    const config = getAPIConfig();
    const path = activeMatchup.path;
    const textContent = document.getElementById('editor').value;
    const statusEl = document.getElementById('status');

    statusEl.innerText = "Syncing changes to GitHub...";

    // Encode text to Base64 safely resolving UTF-8 multibyte characters
    const encodedContent = btoa(unescape(encodeURIComponent(textContent)));
    const bodyData = {
        message: `Sync: updated ${activeMatchup.label}`,
        content: encodedContent
    };

    // Provide SHA checksum if updating an existing file, else GitHub throws 409 conflict
    if (currentSha) bodyData.sha = currentSha;

    try {
        const response = await bridgeFetch(config.url + path, {
            method: 'PUT',
            headers: config.headers,
            body: JSON.stringify(bodyData)
        });

        if (response.ok) {
            const result = response.json();
            currentSha = result.content.sha; // Update currentSha with GitHub's new version reference

            // Delete local draft cache
            localStorage.removeItem(activeMatchup.draftKey);
            renderLocalDrafts();
            updateDiscardButtonState(false);
            const conflictBanner = document.getElementById('conflictBanner');
            if (conflictBanner) conflictBanner.style.display = 'none';

            statusEl.innerText = "Changes safely synced to GitHub!";
        } else {
            statusEl.innerText = `Sync failed (Status ${response.status}). Kept local draft.`;
        }
    } catch (err) {
        statusEl.innerText = "Sync error: " + err.message + ". Draft saved locally.";
    }
}
