/**
 * ui_modal.js
 * Manages the link edit modal state (open/save/delete).
 * Handles both text-extracted markdown links and custom invisible metadata links.
 */

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
