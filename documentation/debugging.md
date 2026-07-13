# Debugging and Telemetry

The editor includes a centralized debugging configuration system that allows developers to toggle console logs for specific subsystems without polluting the default console output.

## `js/debug.js` Configuration

The `debug.js` file exposes a global `DEBUG_CONFIG` object. It is loaded immediately after `config.js` in `matchups.html`, making it available to all subsequent scripts.

### Available Flags

* `logSync` (boolean):
  * **Purpose**: Tracks the lifecycle of GitHub synchronization operations, specifically dual-tab sync behavior and local draft processing in the sidebar.
  * **Outputs**: Draft evaluation matching, skipped files, empty file preservation, and SHA matching status.

* `logYouTube` (boolean):
  * **Purpose**: Tracks the YouTube indexing engine.
  * **Outputs**: Emits logs when a YouTube link changes state, when `youtube_links.json` is updated, and when it successfully recalculates the repository SHA.

* `logBridge` (boolean):
  * **Purpose**: Intended to track message passing across the `bridgeFetch` CustomEvent boundary (Tampermonkey proxy).

* `logMetadata` (boolean):
  * **Purpose**: Intended to track the serialization and deserialization of the JSON metadata blocks embedded within the primary markdown files.

## Best Practices
1. **Never commit `true`**: Keep all flags set to `false` in the default repository state to ensure a clean console for end-users.
2. **Conditional Logging**: When adding new logs to complex systems, wrap them in `if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.flagName)`. This protects the application from crashing if `debug.js` fails to load.
