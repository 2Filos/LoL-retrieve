/**
 * storage_drafts.js
 * Local draft persistence, conflict resolution, and sidebar draft rendering.
 * Handles background syncing of drafts directly from the sidebar.
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
 * Groups tab variants (-plan, -vod) under the same parent matchup.
 * 
 * @returns {Array<object>} List of matching draft definitions { enemy, mySide, isNotes, path, tabSuffix }.
 */
function getLocalDrafts() {
    const drafts = [];
    const seen = new Set(); // Track grouped matchup keys to avoid duplicates
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('draft_matchup:')) {
            const path = key.replace('draft_matchup:', '');
            if (path === 'Notes' || path === 'Notes-vod') {
                // General notes variants — group under one entry
                if (!seen.has('Notes')) {
                    seen.add('Notes');
                    drafts.push({
                        enemy: null,
                        mySide: null,
                        isNotes: true,
                        path: 'Notes'
                    });
                }
            } else {
                const parts = path.split('/');
                if (parts.length === 2) {
                    let mySide = parts[1];
                    // Strip tab suffixes for grouping
                    mySide = mySide.replace(/-plan$/, '').replace(/-vod$/, '');
                    const groupKey = `${parts[0]}/${mySide}`;
                    if (!seen.has(groupKey)) {
                        seen.add(groupKey);
                        drafts.push({
                            enemy: parts[0],
                            mySide: mySide,
                            isNotes: false,
                            path: groupKey
                        });
                    }
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
        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] renderLocalDrafts: Found ${drafts.length} total distinct grouped drafts in localStorage.`);
    }

    const activeDraftKey = activeMatchup?.draftKey || null;
    // For grouping: strip tab suffixes from active draft key to match against grouped drafts
    let activeGroupPath = null;
    if (activeDraftKey) {
        activeGroupPath = activeDraftKey.replace('draft_matchup:', '')
            .replace(/-plan$/, '').replace(/-vod$/, '');
        // Normalize 'Notes-vod' to 'Notes'
        if (activeGroupPath === 'Notes-vod') activeGroupPath = 'Notes';
    }
    const visibleDrafts = drafts.filter(d => activeGroupPath !== d.path);

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

/** Syncs a specific local draft directly to GitHub in the background.
 *  Handles all tab variants (base, -plan, -vod) for the given matchup.
 */
async function syncDraftDirectly(enemyKey, myKey) {
    if (!bridgeActive || typeof CONFIG === 'undefined' || !isConfigValid) {
        alert("Cannot sync: Bridge or Config is offline.");
        return;
    }

    const statusEl = document.getElementById('status');
    const config = getAPIConfig();

    // Determine which draft keys to sync based on context
    let draftEntries = [];
    if (enemyKey === null && myKey === null) {
        // General context — check both Notes and Notes-vod
        draftEntries = [
            { path: 'Notes.md', draftKey: 'draft_matchup:Notes', label: 'General (Notes)' },
            { path: 'Notes-vod.md', draftKey: 'draft_matchup:Notes-vod', label: 'General (VODs)' }
        ];
    } else {
        // Matchup context — check both base and -plan
        const label = `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
        draftEntries = [
            { path: `matchups/${enemyKey}/${myKey}.md`, draftKey: `draft_matchup:${enemyKey}/${myKey}`, label: `${label} (Notes)` },
            { path: `matchups/${enemyKey}/${myKey}-plan.md`, draftKey: `draft_matchup:${enemyKey}/${myKey}-plan`, label: `${label} (Plan)` }
        ];
    }

    // Filter to only entries that have actual drafts
    const dirtyEntries = draftEntries.filter(e => {
        const val = localStorage.getItem(e.draftKey);
        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
            console.log(`[DEBUG syncDraftDirectly] Checking draftKey: ${e.draftKey} -> exists: ${val !== null}`);
        }
        return val !== null;
    });

    if (dirtyEntries.length === 0) {
        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
            console.log("[DEBUG syncDraftDirectly] No dirty entries found! Returning early.");
        }
        return;
    }

    statusEl.innerText = `Syncing ${dirtyEntries.length} tab(s) to GitHub...`;

    let allOk = true;
    for (const entry of dirtyEntries) {
        let textContent = localStorage.getItem(entry.draftKey);
        if (textContent === null) continue;

        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
            console.log(`[DEBUG syncDraftDirectly] Processing entry: ${entry.draftKey} for path: ${entry.path}`);
        }

        /**
         * Metadata-Primary-Only Rule Validation
         * Strip metadata from non-primary files before pushing to GitHub to prevent pollution.
         * The primary file for matchups is the base Notes file (e.g. matchups/Enemy/My.md).
         */
        const isPrimaryEntry = (enemyKey !== null)
            ? entry.path === `matchups/${enemyKey}/${myKey}.md`
            : entry.path === 'Notes.md';
        if (!isPrimaryEntry) {
            const metaMatch = textContent.match(/\n?\n?<!-- METADATA: .*? -->/);
            if (metaMatch) textContent = textContent.replace(metaMatch[0], '').trimEnd();
        }

        try {
            // Fetch current SHA checksum to prevent conflict collisions
            let sha = null;
            const cacheBusterUrl = `${config.url}${entry.path}?t=${Date.now()}`;
            const fetchHeaders = Object.assign({}, config.headers, {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            });
            const response = await bridgeFetch(cacheBusterUrl, { headers: fetchHeaders });
            let skipSync = false;
            if (response.ok) {
                const data = response.json();
                sha = data.sha;
                const decodedRemote = decodeURIComponent(escape(atob(data.content)));
                if (decodedRemote === textContent) {
                    skipSync = true;
                }
            } else if (response.status === 404 && textContent.length === 0) {
                skipSync = true;
            }

            if (skipSync) {
                if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
                    console.log(`[DEBUG syncDraftDirectly] Content identical or empty. Skipping PUT. Removing draftKey: ${entry.draftKey}`);
                }
                localStorage.removeItem(entry.draftKey);
            } else {
                // Encode string safely resolving multibyte characters
                const encodedContent = btoa(unescape(encodeURIComponent(textContent)));
                const bodyData = {
                    message: `Sync: updated ${entry.label}`,
                    content: encodedContent
                };
                if (sha) bodyData.sha = sha;

                const syncResponse = await bridgeFetch(config.url + entry.path, {
                    method: 'PUT',
                    headers: config.headers,
                    body: JSON.stringify(bodyData)
                });

                if (syncResponse.ok) {
                    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
                        console.log(`[DEBUG syncDraftDirectly] syncResponse OK. Removing draftKey: ${entry.draftKey}`);
                    }
                    localStorage.removeItem(entry.draftKey);

                    // Sync status feedback logic for loaded matchup matching
                    if (activeMatchup.draftKey === entry.draftKey) {
                        const putResult = syncResponse.json();
                        currentSha = putResult.content.sha;
                        githubTextCache = textContent;
                        updateDiscardButtonState(false);
                        const conflictBanner = document.getElementById('conflictBanner');
                        if (conflictBanner) conflictBanner.style.display = 'none';
                    }
                } else {
                    allOk = false;
                    console.warn(`[WARN] syncResponse NOT OK for ${entry.draftKey}. Status: ${syncResponse.status}`);
                    statusEl.innerText = `Sync failed for ${entry.label} (Status ${syncResponse.status}).`;
                }
            }
        } catch (err) {
            allOk = false;
            console.error(`[ERROR] Error syncing ${entry.draftKey}:`, err);
            statusEl.innerText = `Sync error for ${entry.label}: ` + err.message;
        }
    }

    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logSync) {
        console.log("[DEBUG syncDraftDirectly] Finished loop. allOk:", allOk);
        
        // Log all remaining localStorage keys to see what's stuck
        const remainingKeys = Object.keys(localStorage).filter(k => k.startsWith('draft_matchup:'));
        console.log("[DEBUG syncDraftDirectly] Remaining draft keys in localStorage:", remainingKeys);
    }

    renderLocalDrafts();
    if (allOk) {
        const mainLabel = (enemyKey === null) ? 'General' : `${getChampionNameByKey(myKey)} vs ${getChampionNameByKey(enemyKey)}`;
        statusEl.innerText = `${mainLabel} successfully synced to GitHub!`;
    }
}
