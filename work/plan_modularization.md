# Workspace Plan: Modularization & Educational Context

This document outlines the architecture, directory layout, and learning references created during the modularization of the League of Legends Matchup Portal.

---

## 1. Objectives

1.  **Code Decoupling**: Separate concerns of the frontend into HTML (structure), CSS (presentation), and JS (logic).
2.  **Logic Separation**: Split client-side scripting into UI orchestration (`editor.js`) and API/CORS bridge networking (`api.js`).
3.  **Vibe Coder Onboarding**: Build self-documenting code with comprehensive comments and detailed conceptual guides under the `learning/` directory.

---

## 2. Decoupled Architecture

The project is structured into independent components linked together in `matchups.html`:

```mermaid
graph TD
    matchups[matchups.html] --> style[style.css]
    matchups --> utils[utils.js]
    matchups --> config[config.js]
    matchups --> api[api.js]
    matchups --> editor[editor.js]
    
    editor --> utils
    editor --> config
    editor --> api
    
    api -.-> bridge[bridge.js in Tampermonkey]
```

### Script Execution Sequence:
1.  **`utils.js`**: Champion naming, mapping lookups, and slug resolving.
2.  **`config.js`**: Personal credentials mapping (local GitHub credentials).
3.  **`api.js`**: CORS proxy client wrappers, authorization checks, and connection checks.
4.  **`editor.js`**: DOM element definitions, draft cache trackers, edit triggers, and event loops.

---

## 3. Educational Guides Index

Detailed guides explaining the advanced web principles utilized by this application are saved in the `learning/` folder:

*   [CORS & Tampermonkey Bridges](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/cors_bypassing_userscripts.md): Understand cross-origin resource sharing, browser security layers, and event-based userscript proxies.
*   [Local Storage & Concurrency Control](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/local_drafts_persistence.md): Explore offline-first caching, storage triggers, and resolution flows for sync conflicts.
*   [GitHub Contents REST API & SHAs](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/github_contents_api.md): Learn about encoding binary/text files into Base64, updating contents via REST endpoints, and tracking revisions using cryptographic SHAs.
