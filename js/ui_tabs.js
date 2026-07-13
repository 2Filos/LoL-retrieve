/**
 * ui_tabs.js
 * Controls the main editor tab system (Notes/Plan or Notes/VODs).
 * Handles path resolution, tab switching, and content-presence indicators.
 */

// --- Editor Page Tab System ---

/**
 * Resolves the appropriate file path and draft key based on the active matchup context.
 * 
 * In a Matchup context (e.g. Garen vs Camille):
 * - Left Tab: Plan (`matchups/...-plan.md`)
 * - Right Tab: Notes (`matchups/... .md`)
 * 
 * In a General Notes context:
 * - Left Tab: Notes (`Notes.md`)
 * - Right Tab: VODs (`Notes-vod.md`)
 * 
 * @param {object} matchup - Object containing `enemyKey` and `myKey`.
 * @param {string} side - The active tab side ('left' or 'right').
 * @returns {object} An object containing the `path` and `draftKey` properties.
 */
function resolvePagePath(matchup, side) {
    const isMatchup = matchup.enemyKey && matchup.myKey;
    if (!isMatchup) {
        // General Notes context
        if (side === 'right') {
            return { path: 'Notes-vod.md', draftKey: 'draft_matchup:Notes-vod' };
        }
        return { path: 'Notes.md', draftKey: 'draft_matchup:Notes' };
    }
    // Matchup context
    if (side === 'left') {
        return {
            path: `matchups/${matchup.enemyKey}/${matchup.myKey}-plan.md`,
            draftKey: `draft_matchup:${matchup.enemyKey}/${matchup.myKey}-plan`
        };
    }
    return {
        path: `matchups/${matchup.enemyKey}/${matchup.myKey}.md`,
        draftKey: `draft_matchup:${matchup.enemyKey}/${matchup.myKey}`
    };
}

/**
 * Updates the tab button labels and active states based on current context.
 * Called after every matchup or general notes load.
 */
function updateTabLabels() {
    const tabLeft = document.getElementById('tabLeft');
    const tabRight = document.getElementById('tabRight');
    const tabGroup = document.getElementById('editorTabs');
    if (!tabLeft || !tabRight || !tabGroup) return;

    const isMatchup = activeMatchup.enemyKey && activeMatchup.myKey;
    tabGroup.style.display = 'flex';

    if (isMatchup) {
        tabLeft.textContent = 'Plan';
        tabRight.textContent = 'Notes';
    } else {
        tabLeft.textContent = 'Notes';
        tabRight.textContent = 'VODs';
    }

    tabLeft.classList.toggle('active', activePageSide === 'left');
    tabRight.classList.toggle('active', activePageSide === 'right');

    updateTabIndicators();
}

/**
 * Checks if the left and right tabs have content and updates their indicator styles.
 */
async function updateTabIndicators() {
    const tabLeft = document.getElementById('tabLeft');
    const tabRight = document.getElementById('tabRight');
    if (!tabLeft || !tabRight || !activeMatchup) return;

    const leftInfo = resolvePagePath(activeMatchup, 'left');
    const rightInfo = resolvePagePath(activeMatchup, 'right');
    const isMatchup = activeMatchup.enemyKey && activeMatchup.myKey;
    const isLeftPrimary = !isMatchup; // General: left is Notes. Matchup: right is Notes.

    const isGarenCamille = activeMatchup && activeMatchup.myKey === 'Garen' && activeMatchup.enemyKey === 'Camille';

    /**
     * Helper function to determine if a specific tab has any content.
     * Evaluates local editor state, local storage drafts, and remote GitHub files in that order.
     * 
     * @param {object} info - Object containing `path` and `draftKey` from resolvePagePath.
     * @param {boolean} isPrimary - Whether this tab represents the primary metadata-bearing file.
     * @returns {Promise<boolean>} True if the file contains text content, otherwise false.
     */
    async function hasContent(info, isPrimary) {
        // 0. If checking the active tab, we already know the content!
        if (info.path === activeMatchup.path) {
            const editorText = document.getElementById('editor').value.trim();
            if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
                console.log(`[DEBUG EditorFlow] Indicator check for ${info.path}: Active in editor (clean length: ${editorText.length})`);
            }
            return editorText.length > 0;
        }

        // 1. Check local draft first
        let draft = localStorage.getItem(info.draftKey);
        if (draft !== null) {
            let clean = draft.replace(/\n?\n?<!-- METADATA: .*? -->/, '').trim();
            if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
                console.log(`[DEBUG EditorFlow] Indicator check for ${info.path}: Found local draft (clean length: ${clean.length})`);
                if (isGarenCamille) {
                    console.log(`[DEBUG EditorFlow] [Garen vs Camille] LOCAL DRAFT CONTENT (${info.path}):\n"${clean}"`);
                }
            }
            return clean.length > 0;
        }
        // 2. Fallback to checking github if no local draft
        try {
            if (typeof bridgeFetch !== 'undefined' && typeof getAPIConfig !== 'undefined') {
                const config = getAPIConfig();
                const url = `${config.url}${info.path}`;
                const response = await bridgeFetch(url, {
                    method: 'GET',
                    headers: config.headers
                });
                
                if (response && response.status === 200 && typeof response.json === 'function') {
                    const data = await response.json();
                    if (data && data.content) {
                        // Decode base-64 multi-byte UTF-8
                        const decoded = decodeURIComponent(escape(atob(data.content)));
                        let clean = decoded.replace(/\n?\n?<!-- METADATA: .*? -->/, '').trim();
                        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
                            console.log(`[DEBUG EditorFlow] Indicator check for ${info.path}: Found remote file (clean length: ${clean.length})`);
                            if (isGarenCamille) {
                                console.log(`[DEBUG EditorFlow] [Garen vs Camille] REMOTE GITHUB CONTENT (${info.path}):\n"${clean}"`);
                            }
                        }
                        return clean.length > 0;
                    }
                }
            }
        } catch (e) {
            // Ignore fetch errors, file likely doesn't exist
        }
        if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
            console.log(`[DEBUG EditorFlow] Indicator check for ${info.path}: No content found`);
        }
        return false;
    }

    const [leftHasContent, rightHasContent] = await Promise.all([
        hasContent(leftInfo, isLeftPrimary),
        hasContent(rightInfo, !isLeftPrimary)
    ]);

    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] Tab Indicators updated -> Left (Plan/Notes): ${leftHasContent}, Right (Notes/VODs): ${rightHasContent}`);
    }

    tabLeft.classList.toggle('has-content', leftHasContent);
    tabRight.classList.toggle('has-content', rightHasContent);
}

/**
 * Saves the current textarea content as a local draft before switching tabs,
 * so edits aren't lost.
 */
function saveDraftBeforeSwitch() {
    if (!activeMatchup.draftKey) return;
    const editorEl = document.getElementById('editor');
    if (!editorEl) return;

    const textContent = editorEl.value;
    const existingDraft = localStorage.getItem(activeMatchup.draftKey);
    
    // Determine if text has actually changed compared to the loaded remote state
    const baseText = typeof githubTextCache !== 'undefined' && githubTextCache !== null ? githubTextCache : "";
    const hasUnsavedTextEdits = (textContent !== baseText);

    if (existingDraft === null && !hasUnsavedTextEdits) {
        // No edits made and no draft currently exists.
        // Skip creating a phantom draft.
        return;
    }

    // Only append metadata to the primary file
    const isMatchup = activeMatchup.enemyKey && activeMatchup.myKey;
    const isPrimary = (isMatchup && activePageSide === 'right') ||
                      (!isMatchup && activePageSide === 'left');
    const fullText = isPrimary ? appendMetadata(textContent) : textContent;
    localStorage.setItem(activeMatchup.draftKey, fullText);
    renderLocalDrafts();
}

/**
 * Handles clicking a tab button to switch between editor pages.
 * Saves current draft, updates state, and reloads the appropriate file.
 * 
 * @param {string} side - The tab side to switch to ('left' or 'right').
 */
function switchEditorTab(side) {
    if (side === activePageSide) return;
    
    if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.logEditorFlow) {
        console.log(`[DEBUG EditorFlow] Switched Tab from ${activePageSide} to ${side}`);
    }

    // Save current content before switching
    saveDraftBeforeSwitch();

    activePageSide = side;
    localStorage.setItem('editor_active_tab_side', side);

    // Update button active states
    const tabLeft = document.getElementById('tabLeft');
    const tabRight = document.getElementById('tabRight');
    if (tabLeft) tabLeft.classList.toggle('active', side === 'left');
    if (tabRight) tabRight.classList.toggle('active', side === 'right');

    // Compute new path and reload
    const pathInfo = resolvePagePath(activeMatchup, side);

    // Update activeMatchup path/draftKey for the new tab
    activeMatchup.path = pathInfo.path;
    activeMatchup.draftKey = pathInfo.draftKey;

    loadMatchupByPath(pathInfo.path, activeMatchup.label, pathInfo.draftKey,
                      activeMatchup.enemyKey, activeMatchup.myKey);
}
