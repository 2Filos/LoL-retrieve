/**
 * ui.js
 * DOM manipulation, URL extraction, and UI feedback states
 */

/**
 * Parses and extracts all valid URLs (HTTP/HTTPS/www) from raw text.
 * Also parses Markdown-formatted links [text](url).
 * 
 * @param {string} text - Matchup markdown content.
 * @returns {Array<object>} Unique list of matching link objects {url, display, original}.
 */
function extractUrls(text) {
    if (!text) return [];
    
    const results = [];
    
    // First, find all markdown links [text](url)
    const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+|www\.[^\s\)]+)\)/gi;
    let match;
    const mdMatches = [];
    while ((match = mdRegex.exec(text)) !== null) {
        mdMatches.push({
            display: match[1],
            url: match[2],
            original: match[0],
            index: match.index
        });
    }
    
    // Then find raw URLs, but skip the ones that are inside the markdown links we already found
    const rawRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
    while ((match = rawRegex.exec(text)) !== null) {
        let url = match[0];
        let cleaned = url;
        while (/[.,;:!?)]$/.test(cleaned)) {
            cleaned = cleaned.slice(0, -1);
        }
        
        // Check if this raw URL is part of an already found markdown link
        const isInsideMd = mdMatches.some(m => match.index >= m.index && match.index < m.index + m.original.length);
        if (!isInsideMd) {
            results.push({
                display: null,
                url: cleaned,
                original: cleaned
            });
        }
    }
    
    // Combine and deduplicate by URL (preferring Markdown links if duplicates exist)
    const combined = [...mdMatches, ...results];
    const unique = [];
    const seen = new Set();
    
    for (const item of combined) {
        if (!seen.has(item.url)) {
            seen.add(item.url);
            unique.push(item);
        }
    }
    
    return unique;
}

/**
 * Returns matching domain icons or initials to overlay on links.
 * 
 * @param {string} url - Target URL.
 * @returns {string} String containing SVG HTML or badge HTML.
 */
function getLinkIcon(url) {
    let domain = "";
    try {
        const parsed = new URL(url.startsWith('http') ? url : 'https://' + url);
        domain = parsed.hostname.toLowerCase();
    } catch (e) {
        // Fallback default link icon if URL parsing fails
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
    }

    if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="#ef4444"><path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`;
    }
    if (domain.includes('op.gg')) {
        return `<span style="font-size: 8px; font-weight: bold; background: #5383e8; color: white; padding: 1px 3px; border-radius: 2px; line-height: 1.2; font-family: sans-serif; display: inline-block;">OP</span>`;
    }
    if (domain.includes('mobalytics.gg')) {
        return `<svg width="12" height="12" viewBox="0 0 24 24" fill="#5f3bf4"><polygon points="12 2 22 7 22 17 12 22 2 17 2 7"/></svg>`;
    }
    if (domain.includes('lolalytics.com')) {
        return `<span style="font-size: 8px; font-weight: bold; background: #c8102e; color: white; padding: 1px 3px; border-radius: 2px; line-height: 1.2; font-family: sans-serif; display: inline-block;">LA</span>`;
    }
    return `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`;
}

/**
 * Scans the current editor text area, extracts URLs, and populates the 
 * detected link badge list underneath the editor.
 */
function updateDetectedLinks() {
    const editorEl = document.getElementById('editor');
    const container = document.getElementById('detectedLinksContainer');
    let listEl = document.getElementById('detectedLinksList');

    if (!editorEl || !container || !listEl) return;

    let urls = extractUrls(editorEl.value);

    // Merge in custom hidden metadata links
    if (typeof activeMetadata !== 'undefined' && activeMetadata.customLinks) {
        activeMetadata.customLinks.forEach(cl => {
            const existing = urls.find(u => u.url === cl.url);
            if (!existing) {
                urls.push({
                    url: cl.url,
                    display: cl.display,
                    original: "", // Empty string means it's a custom invisible link
                    customId: cl.customId
                });
            }
        });
    }

    // Reset old drag listeners on the container by replacing it with a fresh clone BEFORE adding items
    const freshList = listEl.cloneNode(false);
    listEl.parentNode.replaceChild(freshList, listEl);
    listEl = freshList; // update our reference to the new active DOM element

    listEl.innerHTML = '';
    if (urls.length === 0) {
        return; // Keep list area empty if no URLs found
    }

    // Sort by user's dragged order
    if (typeof activeMetadata !== 'undefined' && activeMetadata.linkOrder && activeMetadata.linkOrder.length > 0) {
        urls.sort((a, b) => {
            let idxA = activeMetadata.linkOrder.indexOf(a.url);
            let idxB = activeMetadata.linkOrder.indexOf(b.url);
            if (idxA === -1) idxA = 999;
            if (idxB === -1) idxB = 999;
            return idxA - idxB;
        });
    }

    urls.forEach(item => {
        const url = item.url;
        const cleanHref = url.startsWith('http') ? url : 'https://' + url;
        let displayUrl = url.replace(/https?:\/\/(www\.)?/, '');
        
        let linkText = item.display || displayUrl;
        if (linkText.length > 30) {
            linkText = linkText.substring(0, 27) + '...'; // Truncate long URLs for display
        }

        // Assemble link badge card
        const badge = document.createElement('div');
        badge.className = 'link-badge';
        badge.draggable = true;
        badge.dataset.url = url;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'link-icon';
        iconSpan.innerHTML = getLinkIcon(url);

        const link = document.createElement('a');
        link.href = cleanHref;
        link.target = '_blank';
        link.textContent = linkText;
        link.title = url;

        // Custom Edit Button
        const editBtn = document.createElement('button');
        editBtn.className = 'bg-tab-btn';
        editBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
        editBtn.title = 'Edit Link Formatting';
        editBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLinkEditModal(item);
        };

        // Special "..." button allowing browser background tab opening (via bridge.js)
        const bgBtn = document.createElement('button');
        bgBtn.className = 'bg-tab-btn';
        bgBtn.textContent = '...';
        bgBtn.title = 'Open in background tab';
        bgBtn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (bridgeActive) {
                // Route background tab opening request to bridge context
                window.dispatchEvent(new CustomEvent("OpenBackgroundTab", {
                    detail: { url: cleanHref }
                }));
            } else {
                window.open(cleanHref, '_blank');
            }
        };

        badge.appendChild(iconSpan);
        badge.appendChild(link);
        badge.appendChild(editBtn);
        badge.appendChild(bgBtn);
        listEl.appendChild(badge);
    });

    // Drag and Drop HTML5 Event Handlers for Reordering (attach to listEl)
    let draggedItem = null;

    listEl.addEventListener('dragstart', function(e) {
        const target = e.target.closest('.link-badge');
        if (!target) return;
        draggedItem = target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox drag
        setTimeout(() => target.style.opacity = '0.4', 0);
    });

    listEl.addEventListener('dragover', function(e) {
        e.preventDefault();
        const target = e.target.closest('.link-badge');
        if (target && target !== draggedItem) {
            const rect = target.getBoundingClientRect();
            // Next determines if we insert before or after the target based on mouse Y position
            const next = (e.clientY - rect.top)/(rect.bottom - rect.top) > 0.5;
            listEl.insertBefore(draggedItem, next && target.nextSibling || target);
        }
    });

    listEl.addEventListener('dragend', function(e) {
        const target = e.target.closest('.link-badge');
        if (target) target.style.opacity = '1';
        draggedItem = null;
        
        // Save the new visual order to the hidden activeMetadata
        if (typeof activeMetadata !== 'undefined') {
            const newOrder = [];
            listEl.querySelectorAll('.link-badge').forEach(b => {
                if (b.dataset.url) newOrder.push(b.dataset.url);
            });
            activeMetadata.linkOrder = newOrder;
            
            // Trigger auto-save immediately to cache order
            const editor = document.getElementById('editor');
            if (editor) editor.dispatchEvent(new Event('input'));
        }
    });
}

// --- Discard Draft UI Confirmation Helpers ---

/** Shows the discard button when a matchup is active and disables it if there is no draft.
 *  The button is rendered in the sync control row, but only enabled when a draft exists.
 */
function updateDiscardButtonState(hasDraft) {
    const discardBtn = document.getElementById('discardBtn');
    const discardConfirmGroup = document.getElementById('discardConfirmGroup');
    if (!discardBtn || !discardConfirmGroup) return;

    discardBtn.style.display = 'inline-block';
    discardBtn.disabled = !hasDraft;
    discardConfirmGroup.style.display = 'none';
}

/** Hides the confirmation controls and shows the main discard button.
 *  The discard button stays visible at all times after editor load.
 */
function hideDiscardConfirm() {
    const discardBtn = document.getElementById('discardBtn');
    const discardConfirmGroup = document.getElementById('discardConfirmGroup');
    if (!discardBtn || !discardConfirmGroup) return;

    discardConfirmGroup.style.display = 'none';
}

/** Shows the confirmation row for the discard action if the button is enabled. */
function showDiscardConfirm() {
    const discardBtn = document.getElementById('discardBtn');
    const discardConfirmGroup = document.getElementById('discardConfirmGroup');
    if (!discardBtn || !discardConfirmGroup || discardBtn.disabled) return;

    discardConfirmGroup.style.display = 'inline-flex';
}

// --- Links Panel Toggle ---
function toggleLinksPanel() {
    const container = document.getElementById('detectedLinksContainer');
    if (container) {
        container.classList.toggle('collapsed');
    }
}

// --- Editor Page Tab System ---

/**
 * Resolves the correct file path and draft key based on the active matchup
 * context and which tab side ('left' or 'right') is selected.
 * 
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

// --- Textarea Height Persistence ---
(function () {
    // Wait for DOM to load if included in head, but usually runs at end of body.
    window.addEventListener('DOMContentLoaded', () => {
        const editor = document.getElementById('editor');
        if (!editor) return;

        // Observe resize via ResizeObserver
        let resizeTimeout;
        const observer = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                localStorage.setItem('matchup_editor_height', editor.style.height);
            }, 200);
        });
        observer.observe(editor);
    });
})();

// --- Champion Portrait Icons UI Update ---
function updateChampionPortraits() {
    const portraits = document.getElementById('matchupPortraits');
    const fileLabel = document.getElementById('currentFileLabel');
    const myIcon = document.getElementById('myChampIcon');
    const enemyIcon = document.getElementById('enemyChampIcon');
    const myName = document.getElementById('myChampName');
    const enemyName = document.getElementById('enemyChampName');

    if (!portraits || !fileLabel) return;

    // Check if we have a real matchup loaded (not General Notes)
    if (typeof activeMatchup !== 'undefined' && activeMatchup && activeMatchup.myKey && activeMatchup.enemyKey) {
        // Show portrait block, hide text label
        portraits.style.display = 'flex';
        fileLabel.style.display = 'none';

        // Use DDragon for champion icons (latest patch)
        const version = typeof ddragonVersion !== 'undefined' && ddragonVersion ? ddragonVersion : '14.13.1';
        myIcon.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${activeMatchup.myKey}.png`;
        myIcon.alt = activeMatchup.myKey;
        enemyIcon.src = `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${activeMatchup.enemyKey}.png`;
        enemyIcon.alt = activeMatchup.enemyKey;

        // Set names below icons
        const myDisplayName = typeof getChampionNameByKey === 'function' ? getChampionNameByKey(activeMatchup.myKey) : activeMatchup.myKey;
        const enemyDisplayName = typeof getChampionNameByKey === 'function' ? getChampionNameByKey(activeMatchup.enemyKey) : activeMatchup.enemyKey;
        myName.textContent = myDisplayName;
        enemyName.textContent = enemyDisplayName;
    } else {
        // No matchup — show text label, hide portraits
        portraits.style.display = 'none';
        fileLabel.style.display = 'inline';
    }
}

// Observe DOM changes on the fileLabel to trigger portrait updates automatically
window.addEventListener('DOMContentLoaded', () => {
    const _fileLabelEl = document.getElementById('currentFileLabel');
    if (_fileLabelEl) {
        const _labelObserver = new MutationObserver(() => {
            updateChampionPortraits();
        });
        _labelObserver.observe(_fileLabelEl, { childList: true, characterData: true, subtree: true });
    }
});

// --- Link Formatting Modal UI ---

/** Opens the edit modal and populates it with the target link's metadata */
function openLinkEditModal(item) {
    try {
        const modal = document.getElementById('linkEditModal');
        const displayInput = document.getElementById('linkEditDisplay');
        const urlInput = document.getElementById('linkEditUrl');
        const originalInput = document.getElementById('linkEditOriginalText');

        const deleteBtn = document.getElementById('linkDeleteBtn');

        if (!modal) { alert("Missing linkEditModal"); return; }
        if (!displayInput) { alert("Missing linkEditDisplay"); return; }
        if (!urlInput) { alert("Missing linkEditUrl"); return; }
        if (!originalInput) { alert("Missing linkEditOriginalText"); return; }

        if (item) {
            // We are EDITING an existing link (either text-extracted or custom)
            displayInput.value = item.display || "";
            urlInput.value = item.url;
            originalInput.value = item.original || "";
            
            // Auto-migrate old custom links that lack a customId
            if (item.original === "" && !item.customId) {
                item.customId = "custom_" + Date.now() + Math.floor(Math.random() * 1000);
                if (typeof activeMetadata !== 'undefined' && activeMetadata.customLinks) {
                    const legacyLink = activeMetadata.customLinks.find(l => l.url === item.url && l.display === item.display);
                    if (legacyLink) legacyLink.customId = item.customId;
                }
            }
            
            modal.dataset.customId = item.customId || "";
            if (deleteBtn) deleteBtn.style.display = 'inline-block'; // Show delete for existing links
        } else {
            // We are CREATING a brand new invisible custom metadata link
            displayInput.value = "";
            urlInput.value = "";
            originalInput.value = "";
            modal.dataset.customId = "custom_" + Date.now();
            if (deleteBtn) deleteBtn.style.display = 'none'; // Hide delete for new links
        }

        modal.style.display = 'flex';
        displayInput.focus();
    } catch (err) {
        alert("Edit Modal Error: " + err.message);
        console.error(err);
    }
}

/** Closes the link edit modal */
function closeLinkEditModal() {
    const modal = document.getElementById('linkEditModal');
    if (modal) modal.style.display = 'none';
}

/** 
 * Deletes the currently opened link.
 */
function deleteLinkEditModal() {
    const modal = document.getElementById('linkEditModal');
    const customId = modal.dataset.customId;
    const originalText = document.getElementById('linkEditOriginalText').value;
    const editor = document.getElementById('editor');

    if (customId && typeof activeMetadata !== 'undefined' && activeMetadata.customLinks) {
        // Delete invisible custom link
        const idx = activeMetadata.customLinks.findIndex(l => l.customId === customId);
        if (idx > -1) {
            const oldUrl = activeMetadata.customLinks[idx].url;
            activeMetadata.customLinks = [
                ...activeMetadata.customLinks.slice(0, idx),
                ...activeMetadata.customLinks.slice(idx + 1)
            ];
            activeMetadata.linkOrder = activeMetadata.linkOrder.filter(u => u !== oldUrl);
        }
    } else if (originalText && editor) {
        // Delete in-text markdown link by removing it entirely
        editor.value = editor.value.split(originalText).join("");
    }

    if (editor) editor.dispatchEvent(new Event('input'));
    updateDetectedLinks();

    // If we're on a non-primary tab, persist metadata to the primary draft explicitly
    const isMatchupCtx = activeMatchup.enemyKey && activeMatchup.myKey;
    const isPrimaryFileCtx = (isMatchupCtx && activePageSide === 'right') ||
                              (!isMatchupCtx && activePageSide === 'left');
    if (!isPrimaryFileCtx) {
        const primaryDraftKey = isMatchupCtx
            ? `draft_matchup:${activeMatchup.enemyKey}/${activeMatchup.myKey}`
            : 'draft_matchup:Notes';
        let primaryRaw = localStorage.getItem(primaryDraftKey);
        if (primaryRaw) {
            // Strip existing metadata block, then re-append updated metadata
            const metaMatch = primaryRaw.match(/\n?\n?<!-- METADATA: .*? -->/);
            if (metaMatch) primaryRaw = primaryRaw.replace(metaMatch[0], '');
            localStorage.setItem(primaryDraftKey, appendMetadata(primaryRaw.trimEnd()));
        }
    }

    closeLinkEditModal();
}

/** 
 * Saves the edited link by updating custom metadata or modifying text content.
 */
function saveLinkEditModal() {
    const modal = document.getElementById('linkEditModal');
    const displayInput = document.getElementById('linkEditDisplay').value.trim();
    const urlInput = document.getElementById('linkEditUrl').value.trim();
    const originalText = document.getElementById('linkEditOriginalText').value;
    const customId = modal.dataset.customId;

    const editor = document.getElementById('editor');
    if (!editor) return;

    if (!urlInput) {
        if (customId) {
            // Delete existing custom link or discard new one
            if (typeof activeMetadata !== 'undefined' && activeMetadata.customLinks) {
                const idx = activeMetadata.customLinks.findIndex(l => l.customId === customId);
                if (idx > -1) {
                    const oldUrl = activeMetadata.customLinks[idx].url;
                    activeMetadata.customLinks.splice(idx, 1);
                    activeMetadata.linkOrder = activeMetadata.linkOrder.filter(u => u !== oldUrl);
                }
            }
        } else {
            alert("URL cannot be empty.");
            return;
        }
    } else if (customId) {
        // Route 1: It's a Custom Invisible Link (Metadata-only)
        if (typeof activeMetadata === 'undefined' || !activeMetadata) {
            window.activeMetadata = { customLinks: [], linkOrder: [] };
        }
        if (!activeMetadata.customLinks) activeMetadata.customLinks = [];
        if (!activeMetadata.linkOrder) activeMetadata.linkOrder = [];
        
        const idx = activeMetadata.customLinks.findIndex(l => l.customId === customId);
        if (idx > -1) {
            // Update existing custom link
            const oldUrl = activeMetadata.customLinks[idx].url;
            if (oldUrl !== urlInput) {
                // Update order array if url changed
                const orderIdx = activeMetadata.linkOrder.indexOf(oldUrl);
                if (orderIdx > -1) activeMetadata.linkOrder[orderIdx] = urlInput;
            }
            activeMetadata.customLinks[idx].display = displayInput;
            activeMetadata.customLinks[idx].url = urlInput;
        } else {
            // Add brand new custom link
            activeMetadata.customLinks.push({
                customId: customId,
                display: displayInput,
                url: urlInput
            });
            activeMetadata.linkOrder.push(urlInput);
        }
    } else if (originalText) {
        // Route 2: It's a Text-Extracted Link
        const newMarkdown = displayInput ? `[${displayInput}](${urlInput})` : urlInput;
        editor.value = editor.value.split(originalText).join(newMarkdown);
    }

    // Trigger an input event to force the debounced autosave
    editor.dispatchEvent(new Event('input'));
    
    // Instantly refresh the UI so the user doesn't have to wait 500ms
    updateDetectedLinks();

    // If we're on a non-primary tab, persist metadata to the primary draft explicitly
    const isMatchupCtx = activeMatchup.enemyKey && activeMatchup.myKey;
    const isPrimaryFileCtx = (isMatchupCtx && activePageSide === 'right') ||
                              (!isMatchupCtx && activePageSide === 'left');
    if (!isPrimaryFileCtx) {
        const primaryDraftKey = isMatchupCtx
            ? `draft_matchup:${activeMatchup.enemyKey}/${activeMatchup.myKey}`
            : 'draft_matchup:Notes';
        let primaryRaw = localStorage.getItem(primaryDraftKey);
        if (primaryRaw) {
            // Strip existing metadata block, then re-append updated metadata
            const metaMatch = primaryRaw.match(/\n?\n?<!-- METADATA: .*? -->/);
            if (metaMatch) primaryRaw = primaryRaw.replace(metaMatch[0], '');
            localStorage.setItem(primaryDraftKey, appendMetadata(primaryRaw.trimEnd()));
        }
    }

    closeLinkEditModal();
}

// --- Auto-fill Matchup Input ---
window.addEventListener('DOMContentLoaded', () => {
    const quickInput = document.getElementById('quickMatchup');
    if (quickInput) {
        quickInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const match = val.match(/^(.+?)\s+vs\s+(.+?)(?:\s+(top|jungle|jng|mid|adc|support|sup))?$/i);
            
            if (match) {
                const champA_raw = match[1].trim();
                const champB_raw = match[2].trim();
                const roleInput = match[3] ? match[3].toLowerCase() : null;

                // Validate if both inputs are fully typed known champions
                const isChampA = typeof getChampionKeyByName === 'function' ? getChampionKeyByName(champA_raw) : CHAMPIONS.find(c => c.name.toLowerCase() === champA_raw.toLowerCase());
                const isChampB = typeof getChampionKeyByName === 'function' ? getChampionKeyByName(champB_raw) : CHAMPIONS.find(c => c.name.toLowerCase() === champB_raw.toLowerCase());

                if (isChampA && isChampB) {
                    const myChampEl = document.getElementById('myChamp');
                    const enemyChampEl = document.getElementById('enemyChamp');
                    
                    if (myChampEl && enemyChampEl) {
                        const capitalize = (s) => s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                        myChampEl.value = (typeof getChampionNameByKey === 'function') ? (getChampionNameByKey(isChampA) || capitalize(champA_raw)) : capitalize(champA_raw);
                        enemyChampEl.value = (typeof getChampionNameByKey === 'function') ? (getChampionNameByKey(isChampB) || capitalize(champB_raw)) : capitalize(champB_raw);
                    }

                    if (roleInput) {
                        const roleSelect = document.getElementById('roleSelect');
                        if (roleSelect) {
                            let roleVal = roleInput;
                            if (roleInput === 'jng') roleVal = 'jungle';
                            if (roleInput === 'sup') roleVal = 'support';
                            
                            Array.from(roleSelect.options).forEach(opt => {
                                if (opt.value === roleVal) {
                                    roleSelect.value = roleVal;
                                }
                            });
                        }
                    }
                }
            }
        });

        quickInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const loadBtn = document.getElementById('loadBtn');
                if (loadBtn && !loadBtn.disabled) {
                    loadBtn.click();
                }
            }
        });
    }
});
