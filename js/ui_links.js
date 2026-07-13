/**
 * ui_links.js
 * Parses and extracts URLs from the editor text.
 * Generates domain-specific icons and renders the detected link badge panel
 * with drag-to-reorder support.
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
