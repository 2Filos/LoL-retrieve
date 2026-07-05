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

    // Prepare enriched data for sorting
    const enrichedSaved = saved.map(m => {
        return {
            ...m,
            myName: getChampionNameByKey(m.myKey),
            enemyName: getChampionNameByKey(m.enemyKey)
        };
    });

    // Sort alphabetically by myName, then by enemyName
    enrichedSaved.sort((a, b) => {
        const nameA = a.myName.toLowerCase();
        const nameB = b.myName.toLowerCase();
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        const enemyA = a.enemyName.toLowerCase();
        const enemyB = b.enemyName.toLowerCase();
        if (enemyA < enemyB) return -1;
        if (enemyA > enemyB) return 1;
        return 0;
    });

    let prevMyName = null;

    enrichedSaved.forEach(m => {
        const myName = m.myName;
        const enemyName = m.enemyName;

        let displayMyName = myName;
        if (myName === prevMyName) {
            displayMyName = '...';
        } else if (myName.length > 6) {
            displayMyName = myName.substring(0, 6);
        }
        prevMyName = myName;

        let displayEnemyName = enemyName;
        if (enemyName.length > 6) {
            displayEnemyName = enemyName.substring(0, 6);
        }

        let ytLink = null;
        const matchupKey = `${m.enemyKey}_${m.myKey}`;

        // 1. Check global index first (enables icons without needing a local draft)
        try {
            const globalLinks = JSON.parse(localStorage.getItem('youtube_links_index') || '{}');
            if (globalLinks[matchupKey]) {
                ytLink = globalLinks[matchupKey];
            }
        } catch (e) { }

        // 2. Fallback to parsing local draft if it exists
        const draftKey = `draft_${m.enemyKey}_${m.myKey}`;
        const localDraft = localStorage.getItem(draftKey);
        if (!ytLink && localDraft) {
            // Check for metadata first
            const match = localDraft.match(/<!-- METADATA: (.*?) -->/);
            if (match) {
                try {
                    const meta = JSON.parse(match[1]);
                    if (meta.customLinks) {
                        const yt = meta.customLinks.find(l => l.url.includes('youtube.com') || l.url.includes('youtu.be'));
                        if (yt) ytLink = yt.url;
                    }
                } catch (e) { }
            }
            if (!ytLink) {
                // regex search in text
                const ytMatch = localDraft.match(/https?:\/\/(www\.)?(youtube\.com|youtu\.be)[^\s\)]+/);
                if (ytMatch) ytLink = ytMatch[0];
            }
        }

        let ytIconHtml = '';
        if (ytLink) {
            ytIconHtml = `<a href="${ytLink}" title="Watch VOD in background" style="cursor: pointer; color: var(--danger); text-decoration: none; transform: translateY(1px); display: inline-block;" onclick="event.preventDefault(); event.stopPropagation(); if(typeof bridgeActive !== 'undefined' && bridgeActive) { window.dispatchEvent(new CustomEvent('OpenBackgroundTab', {detail: {url: '${ytLink}'}})); } else { window.open('${ytLink}', '_blank'); }">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>`;
        } else {
            ytIconHtml = `<span style="color: var(--text-secondary); opacity: 0.5; transform: translateY(1px); display: inline-block;" title="No YouTube link found">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </span>`;
        }

        html += `
            <div class="draft-card">
                <div class="draft-info">
                    <div style="display: grid; grid-template-columns: 40px 16px 42px auto; align-items: center; gap: 4px; font-size: 12px; font-weight: bold;">
                        <span style="text-align: left; ${myName === prevMyName ? 'opacity: 0.5;' : ''}" title="${myName}">${displayMyName}</span>
                        <span style="text-align: center; opacity: 0.6; font-size: 10px; font-weight: normal;">vs</span>
                        <span style="text-align: left; white-space: nowrap;" title="${enemyName}">${displayEnemyName}</span>
                        <span style="display: flex; align-items: center;">${ytIconHtml}</span>
                    </div>
                </div>
                <div class="draft-actions">
                    <button class="btn-outline-sm" onclick="loadDraft('${m.enemyKey}', '${m.myKey}')">Edit</button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}
