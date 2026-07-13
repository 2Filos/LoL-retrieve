/**
 * debug.js
 * Global configuration flags for enabling or disabling console logging
 * across different subsystems in the editor.
 */

const DEBUG_CONFIG = {
    // Enable to see detailed logs for the local drafts sync process (e.g. pending drafts in sidebar)
    logSync: false,
    
    // Enable to see detailed logs for YouTube index parsing and updating
    logYouTube: false,

    // Enable to see logs about the background bridge event passing
    logBridge: false,

    // Enable to see logs about metadata extraction and injection
    logMetadata: false
};
