const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, 'js');

// --- SPLIT storage.js ---
const storageContent = fs.readFileSync(path.join(jsDir, 'storage.js'), 'utf8');
const storageLines = storageContent.split('\n');

const storageDraftsContent = `/**
 * storage_drafts.js
 * Local draft persistence, conflict resolution, and sidebar draft rendering.
 * Handles background syncing of drafts directly from the sidebar.
 */\n` + storageLines.slice(5, 308).join('\n');

const storageSavedContent = `/**
 * storage_saved.js
 * Manages saved/starred matchups list caching and sidebar rendering.
 * Includes YouTube icon resolution via dual-layer link extraction.
 */\n` + storageLines.slice(308).join('\n');

fs.writeFileSync(path.join(jsDir, 'storage_drafts.js'), storageDraftsContent);
fs.writeFileSync(path.join(jsDir, 'storage_saved.js'), storageSavedContent);


// --- SPLIT sync.js ---
const syncContent = fs.readFileSync(path.join(jsDir, 'sync.js'), 'utf8');
const syncLines = syncContent.split('\n');

const syncLoadContent = `/**
 * sync_load.js
 * Logic for fetching notes from GitHub, resolving file paths, 
 * handling offline fallbacks, and triggering conflict detection.
 */\n` + syncLines.slice(5, 276).join('\n');

const syncSaveContent = `/**
 * sync_save.js
 * Core logic for pushing local drafts to GitHub.
 * Handles Base64 encoding, SHA revision tracking, dual-tab syncing,
 * and global YouTube links index updates.
 */\n` + syncLines.slice(276).join('\n');

fs.writeFileSync(path.join(jsDir, 'sync_load.js'), syncLoadContent);
fs.writeFileSync(path.join(jsDir, 'sync_save.js'), syncSaveContent);


// --- SPLIT ui.js ---
const uiContent = fs.readFileSync(path.join(jsDir, 'ui.js'), 'utf8');
const uiLines = uiContent.split('\n');

const uiLinksContent = `/**
 * ui_links.js
 * Parses and extracts URLs from the editor text.
 * Generates domain-specific icons and renders the detected link badge panel
 * with drag-to-reorder support.
 */\n` + uiLines.slice(5, 250).join('\n');

const uiTabsContent = `/**
 * ui_tabs.js
 * Controls the main editor tab system (Notes/Plan or Notes/VODs).
 * Handles path resolution, tab switching, and content-presence indicators.
 */\n` + uiLines.slice(294, 511).join('\n');

const uiModalContent = `/**
 * ui_modal.js
 * Manages the link edit modal state (open/save/delete).
 * Handles both text-extracted markdown links and custom invisible metadata links.
 */\n` + uiLines.slice(578, 770).join('\n');

const uiCoreContent = `/**
 * ui_core.js
 * General DOM manipulation and UI feedback states.
 * Handles champion portrait icon rendering, discard button confirmation flow,
 * quick search auto-fill input, and textarea height persistence.
 */\n` + 
 uiLines.slice(250, 294).join('\n') + '\n' +
 uiLines.slice(511, 578).join('\n') + '\n' +
 uiLines.slice(770).join('\n');

fs.writeFileSync(path.join(jsDir, 'ui_links.js'), uiLinksContent);
fs.writeFileSync(path.join(jsDir, 'ui_tabs.js'), uiTabsContent);
fs.writeFileSync(path.join(jsDir, 'ui_modal.js'), uiModalContent);
fs.writeFileSync(path.join(jsDir, 'ui_core.js'), uiCoreContent);

console.log("Files split successfully.");
