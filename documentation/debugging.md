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

* `logPerformance` (boolean):
  * **Purpose**: Instruments the boot sequence, DOM milestones, and all `bridgeFetch` / network calls with high-resolution timing.
  * **Outputs**: Color-coded timeline events (`▶ PHASE START`, `⏱ PERF MARK`), network request durations (`📡 NET`), and a final Waterfall Summary table displaying all recorded requests.

## Performance Profiler (`PerfProfiler`)

When `logPerformance` is `true`, a global `PerfProfiler` object is instantiated to track application bottlenecks.

* **Phases**: Wrap a block of code in `PerfProfiler.phaseStart('name')` and `PerfProfiler.phaseEnd()` to measure synchronous or asynchronous blocks.
* **Markers**: Use `PerfProfiler.mark('event_name')` to track one-off moments (e.g. `boot_dom_ready`).
* **Network Tracking**: Every call in `bridgeFetch` (via `api.js`) and direct fetches automatically logs its duration. It includes a 30-second timeout guard to prevent infinite hanging.
* **Bridge Diagnostics**: The Tampermonkey script (`bridge.js`) also logs `[BRIDGE PERF]` directly to the console so developers can differentiate between page-side event loop overhead and actual `GM_xmlhttpRequest` latency.

## Best Practices
1. **Never commit `true`**: Keep all flags (except occasionally `logPerformance` if actively diagnosing issues) set to `false` in the default repository state to ensure a clean console for end-users.
2. **Conditional Logging**: When adding new logs to complex systems, wrap them in `if (typeof DEBUG_CONFIG !== 'undefined' && DEBUG_CONFIG.flagName)`. This protects the application from crashing if `debug.js` fails to load.
