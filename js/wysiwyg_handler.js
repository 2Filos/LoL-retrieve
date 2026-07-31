/**
 * wysiwyg_handler.js
 * Encapsulates the initialization and interaction with the QuillJS editor.
 */

let quillEditor = null;

function initWysiwygEditor() {
    if (quillEditor) return; // Already initialized

    if (typeof Quill === 'undefined') {
        console.error("[WYSIWYG] Quill library not found.");
        document.getElementById('quill-editor').innerText = "Error: Quill library failed to load from CDN.";
        return;
    }

    try {
        // Initialize Quill with no toolbar and imageResize module enabled
        quillEditor = new Quill('#quill-editor', {
            modules: {
                toolbar: false, // Completely disable the toolbar to look like a raw textarea
                imageResize: {
                    displaySize: true // Shows the size of the image when resizing
                }
            },
            theme: 'snow', // Use snow theme but with toolbar disabled
            placeholder: 'Write your analysis here... (Paste or drop images to insert them)'
        });
    } catch (e) {
        console.error("[WYSIWYG] Failed to initialize Quill:", e);
        document.getElementById('quill-editor').innerText = "Error initializing WYSIWYG editor: " + e.message;
        return;
    }

    // We can emit a custom event to let sync_save know about changes,
    // or sync_save can bind directly to quillEditor.on('text-change', ...)
    quillEditor.on('text-change', function(delta, oldDelta, source) {
        if (source === 'user') {
            // Trigger the same autosave logic as the native textarea
            if (typeof triggerAutoSave === 'function') {
                triggerAutoSave();
            }
        }
    });
}

function setWysiwygContent(htmlContent) {
    if (!quillEditor) return;
    if (!htmlContent || htmlContent.trim() === "") {
        quillEditor.setText('');
    } else {
        quillEditor.clipboard.dangerouslyPasteHTML(htmlContent);
    }
}

function getWysiwygContent() {
    if (!quillEditor) return "";
    return quillEditor.root.innerHTML;
}

function focusWysiwygEditor() {
    if (quillEditor) {
        quillEditor.focus();
    }
}

// Initialize it lazily when the script loads since it's at the bottom of the body
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initWysiwygEditor();
    });
} else {
    initWysiwygEditor();
}
