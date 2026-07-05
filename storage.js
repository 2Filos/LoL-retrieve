/**
 * storage.js
 * Local draft persistence and saved matchup caching logic
 */

/**
 * Handles action branches from conflict banner.
 * 
 * @param {string} decision - 'local' to use draft edits, 'github' to overwrite with remote.
 */
function resolveConflict(decision) {
    if (!activeMatchup.draftKey) return;

    const conflictBanner = document.getElementById('conflictBanner');

    if (decision === 'local') {
        if (conflictBanner) conflictBanner.style.display = 'none';
        document.getElementById('status').innerText = "Using local draft. Save to push to GitHub.";
        updateDetectedLinks();
    } else if (decision === 'github') {
        if (githubTextCache !== null) {
            document.getElementById('editor').value = githubTextCache;
            localStorage.removeItem(activeMatchup.draftKey); // Delete local conflicting edits
            renderLocalDrafts();
            updateDiscardButtonState(false);
            if (conflictBanner) conflictBanner.style.display = 'none';
            document.getElementById('status').innerText = "Loaded GitHub version. Local draft deleted.";
            updateDetectedLinks();
        }
    }
}

/** Clears the current draft, loading the original file copy */
function discardCurrentDraft() {
    if (!activeMatchup.draftKey) return;

    localStorage.removeItem(activeMatchup.draftKey);
    renderLocalDrafts();

    // Reload original clean state
    loadMatchupByPath(activeMatchup.path, activeMatchup.label, activeMatchup.draftKey, activeMatchup.enemyKey, activeMatchup.myKey);
}

/**
 * Searches localStorage keys to find drafts matches.
 * 
 * @returns {Array<object>} List of matching draft definitions { enemy, mySide, isNotes, path }.
 */
function getLocalDrafts() {
    const drafts = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('draft_matchup:')) {
            const path = key.replace('draft_matchup:', '');
            if (path === 'Notes') {
                drafts.push({
                    enemy: null,
                    mySide: null,
                    isNotes: true,
                    path: path
                });
            } else {
                const parts = path.split('/');
                if (parts.length === 2) {
                    drafts.push({
                        enemy: parts[0],
                        mySide: parts[1],
                        isNotes: false,
                        path: path
                    });
                }
            }
        }
    }
    return drafts;
}

/** Builds and binds HTML template cards listing unsaved drafts inside the sidebar panel */
function renderLocalDrafts() {
    const container = document.getElementById('draftsList');
    if (!container) return;

    const drafts = getLocalDrafts();
    const activeDraftKey = activeMatchup?.draftKey || null;
    const visibleDrafts = drafts.filter(d => activeDraftKey !== `draft_matchup:${d.path}`);

    if (visibleDrafts.length === 0) {
        container.innerHTML = '<div class="no-drafts">No pending local drafts.</div>';
        return;
    }

    container.innerHTML = '';
    visibleDrafts.forEach(d => {
        const card = document.createElement('div');
        card.className = 'draft-card';
        if (d.isNotes) {
            card.innerHTML = `
                <div class="draft-info">
                    <span class="draft-champ">General Notes</span>
                    <span class="draft-tag">Local Draft</span>
                </div>
                <div class="draft-actions">
                    <button class="btn-sync-sm" onclick="syncDraftDirectly(null, null)">Sync</button>
                    <button class="btn-outline-sm" onclick="loadGeneralNotes()">Edit</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <div class="draft-info">
                    <span class="draft-champ">${getChampionNameByKey(d.mySide)} vs ${getChampionNameByKey(d.enemy)}</span>
                    <span class="draft-tag">Local Draft</span>
                </div>
                <div class="draft-actions">
                    <button class="btn-sync-sm" onclick="syncDraftDirectly('${d.enemy}', '${d.mySide}')">Sync</button>
                    <button class="btn-outline-sm" onclick="loadDraft('${d.enemy}', '${d.mySide}')">Edit</button>
                </div>
            `;
        }
        container.appendChild(card);
    });
}

/** Triggers loading procedures for a specific draft card item */
function loadDraft(enemyKey, myKey) {
    document.getElementById('enemyChamp').value = getChampionNameByKey(enemyKey);
    document.getElementById('myChamp').value = getChampionNameByKey(myKey);
    loadMatchup();
}

/** Syncs a specific local draft directly to GitHub in the background */
async function syncDraftDirectly(enemyKey, myKey) {
    let path, label, draftKey;
    if (enemyKey === null && myKey === null) {
        path = 'Notes.md';
        label = 'Notes';
        draftKey = 'draft_matchup:Notes';
    } else {
        path = `matchups/${enemyKey}/${myKey}.md`;
        label = `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
        draftKey = `draft_matchup:${enemyKey}/${myKey}`;
    }

    const textContent = localStorage.getItem(draftKey);
    if (!textContent) return;

    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        alert("Cannot sync: Bridge or Config is offline.");
        return;
    }

    const statusEl = document.getElementById('status');
    statusEl.innerText = `Syncing ${label} directly to GitHub...`;

    const config = getAPIConfig();
    try {
        // Fetch current SHA checksum to prevent conflict collisions
        let sha = null;
        const response = await bridgeFetch(config.url + path, { headers: config.headers });
        if (response.ok) {
            const data = response.json();
            sha = data.sha;
        }

        // Encode string safely resolving multibyte characters
        const encodedContent = btoa(unescape(encodeURIComponent(textContent)));
        const bodyData = {
            message: `Sync: updated ${label}`,
            content: encodedContent
        };
        if (sha) bodyData.sha = sha;

        const syncResponse = await bridgeFetch(config.url + path, {
            method: 'PUT',
            headers: config.headers,
            body: JSON.stringify(bodyData)
        });

        if (syncResponse.ok) {
            // Delete local draft cache
            localStorage.removeItem(draftKey);
            renderLocalDrafts();

            // Sync status feedback logic for loaded matchup matching
            if (activeMatchup.draftKey === draftKey) {
                const putResult = syncResponse.json();
                currentSha = putResult.content.sha;
                githubTextCache = textContent;
                updateDiscardButtonState(false);
                const conflictBanner = document.getElementById('conflictBanner');
                if (conflictBanner) conflictBanner.style.display = 'none';
            }

            statusEl.innerText = `${label} successfully synced to GitHub!`;
        } else {
            statusEl.innerText = `Sync failed for ${label} (Status ${syncResponse.status}).`;
        }
    } catch (err) {
        statusEl.innerText = `Sync error for ${label}: ` + err.message;
    }
}

// --- Saved Matchups Logic & Rendering ---

/** Loads saved matchups from localStorage */
function getSavedMatchups() {
    const data = localStorage.getItem('saved_matchups');
    if (!data) return [];
    try {
        return JSON.parse(data);
    } catch (e) {
        return [];
    }
}

/** Persists saved matchups list to localStorage */
function saveMatchupsList(list) {
    localStorage.setItem('saved_matchups', JSON.stringify(list));
}

/** Checks if a champion matchup is saved */
function isMatchupSaved(enemyKey, myKey) {
    if (!enemyKey || !myKey) return false;
    const saved = getSavedMatchups();
    return saved.some(m => m.enemyKey === enemyKey && m.myKey === myKey);
}

/** Toggles the saved status of the currently active matchup */
function toggleSaveMatchup() {
    if (!activeMatchup.enemyKey || !activeMatchup.myKey) return;

    let saved = getSavedMatchups();
    const index = saved.findIndex(m => m.enemyKey === activeMatchup.enemyKey && m.myKey === activeMatchup.myKey);

    if (index > -1) {
        saved.splice(index, 1);
    } else {
        saved.push({
            enemyKey: activeMatchup.enemyKey,
            myKey: activeMatchup.myKey
        });
    }

    saveMatchupsList(saved);
    updateStarButtonUI();
    renderSavedMatchups();
}

/** Synchronizes the star button's visibility and fill state with activeMatchup state */
function updateStarButtonUI() {
    const starBtn = document.getElementById('starBtn');
    if (!starBtn) return;

    // Star button is only available for actual champion matchups, not general notes
    if (!activeMatchup.enemyKey || !activeMatchup.myKey) {
        starBtn.style.display = 'none';
        return;
    }

    starBtn.style.display = 'inline-flex';
    const saved = isMatchupSaved(activeMatchup.enemyKey, activeMatchup.myKey);
    const svg = starBtn.querySelector('svg');
    if (svg) {
        if (saved) {
            svg.classList.add('filled');
            svg.setAttribute('fill', '#ffb100');
            svg.setAttribute('stroke', '#ffb100');
        } else {
            svg.classList.remove('filled');
            svg.setAttribute('fill', 'none');
            svg.setAttribute('stroke', 'currentColor');
        }
    }
}

/** Renders the saved matchups list in the sidebar (with permanent General Notes at top) */
function renderSavedMatchups() {
    const container = document.getElementById('savedList');
    if (!container) return;

    const saved = getSavedMatchups();

    // General Notes is always at the top of the Saved Matchups panel
    let html = `
        <div class="draft-card permanent-card">
            <div class="draft-info">
                <span class="draft-champ">General Notes</span>
                <span class="draft-tag" style="color: var(--gold-accent);">Default</span>
            </div>
            <div class="draft-actions">
                <button class="btn-outline-sm" onclick="loadGeneralNotes()">Edit</button>
            </div>
        </div>
    `;

    saved.forEach(m => {
        const myName = getChampionNameByKey(m.myKey);
        const enemyName = getChampionNameByKey(m.enemyKey);
        html += `
            <div class="draft-card">
                <div class="draft-info">
                    <span class="draft-champ">${myName} vs ${enemyName}</span>
                    <span class="draft-tag" style="color: var(--text-secondary);">Saved Matchup</span>
                </div>
                <div class="draft-actions">
                    <button class="btn-outline-sm" onclick="loadDraft('${m.enemyKey}', '${m.myKey}')">Edit</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
