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
    const listEl = document.getElementById('detectedLinksList');

    if (!editorEl || !container || !listEl) return;

    const urls = extractUrls(editorEl.value);

    listEl.innerHTML = '';
    if (urls.length === 0) {
        return; // Keep list area empty if no URLs found
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
    const modal = document.getElementById('linkEditModal');
    const displayInput = document.getElementById('linkEditDisplay');
    const urlInput = document.getElementById('linkEditUrl');
    const originalInput = document.getElementById('linkEditOriginalText');

    if (!modal || !displayInput || !urlInput || !originalInput) return;

    // Pre-fill inputs. If it was a raw URL without a display name, default display to empty.
    displayInput.value = item.display || "";
    urlInput.value = item.url;
    originalInput.value = item.original;

    modal.style.display = 'flex';
    displayInput.focus();
}

/** Closes the link edit modal */
function closeLinkEditModal() {
    const modal = document.getElementById('linkEditModal');
    if (modal) modal.style.display = 'none';
}

/** 
 * Saves the edited link by performing a bulk string replacement across the entire text editor.
 * Replaces the original raw URL (or original markdown link) with the newly formatted markdown string.
 */
function saveLinkEditModal() {
    const displayInput = document.getElementById('linkEditDisplay').value.trim();
    const urlInput = document.getElementById('linkEditUrl').value.trim();
    const originalText = document.getElementById('linkEditOriginalText').value;

    if (!urlInput || !originalText) {
        alert("URL cannot be empty.");
        return;
    }

    const editor = document.getElementById('editor');
    if (!editor) return;

    // Construct standard Markdown link format. If display is empty, fallback to raw URL format.
    const newMarkdown = displayInput ? `[${displayInput}](${urlInput})` : urlInput;

    // Replace all instances of the original string with the new markdown format in the text editor
    editor.value = editor.value.split(originalText).join(newMarkdown);

    // Trigger an input event to force the debounced autosave and re-render the Links list
    editor.dispatchEvent(new Event('input'));

    closeLinkEditModal();
}
