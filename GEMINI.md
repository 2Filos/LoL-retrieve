# Project Context & Agent Instructions (GEMINI.md)

Welcome! This file serves as the core source of truth for the **LoL-retrieve** matchup editor project. It provides general project context and establishes rules for AI agents operating in this workspace.

---

## 1. Project Overview

**LoL-retrieve** is a local, serverless text editor designed to manage and synchronize League of Legends matchup notes directly with a remote GitHub repository. It consists of:
1.  **Frontend Editor** ([matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html)): A single-page application loaded locally (`file:///` protocol) that acts as the UI structure.
2.  **Design Tokens** ([css/theme.css](file:///c:/Users/User/Documents/VSC/LoL-retrieve/css/theme.css)): CSS custom properties, typography, layout grid, and structural styling.
3.  **Component Styles** ([css/components.css](file:///c:/Users/User/Documents/VSC/LoL-retrieve/css/components.css)): Visual widget styling for forms, buttons, panels, editor, link badges, and banners.
4.  **Utility Helpers** ([js/utils.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/utils.js)): Champion name translation, Mobalytics slug mapping, and metadata serialization functions.
5.  **Champion Data** ([js/champions.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/champions.js)): Riot Data Dragon API wrapper with localStorage caching and offline fallback.
6.  **API Client Layer** ([js/api.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/api.js)): CORS bridge communication, GitHub token validation, Riot API fetch, and YouTube index fetching.
7.  **Local Storage** ([js/storage.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/storage.js)): Draft persistence, conflict resolution, saved matchup management, and sidebar rendering.
8.  **GitHub Sync** ([js/sync.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/sync.js)): Remote file loading, conflict detection, SHA tracking, and YouTube index sync pipeline.
9.  **UI Orchestration** ([js/ui.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/ui.js)): DOM manipulation, URL extraction, link modal, editor tabs, portraits, quick search, drag-reorder.
10. **Boot Sequence** ([js/boot.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/js/boot.js)): Application initialization, URL parameter parsing, state setup, and autosave listener.
11. **Tampermonkey Bridge** ([bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js)): An active userscript acting as a CORS proxy to bypass browser security policies.
12. **Local Credentials** ([config.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/config.js)): Local mapping configuration (ignored in Git).
13. **YouTube Index** ([youtube_links.json](file:///c:/Users/User/Documents/VSC/LoL-retrieve/youtube_links.json)): Global matchup-to-YouTube-URL mapping synced to GitHub.
14. **Matchup Folders** (`matchups/`): Contains champion-specific folders for every enemy champion, inside of which individual matchup markdown (`.md`) files are saved.
15. **Work Planning** (`work/`): Dedicated space for roadmap and feature planning requirements documents.
16. **Educational Materials** (`learning/`): Contains guides explaining advanced web development concepts for onboarding/learning.

---

## 2. Rules for Future AI Agents

When editing or extending this codebase, you must adhere to the following rules:

*   **Never bypass the bridge**: Do not attempt to use standard `fetch` or `XMLHttpRequest` directly to GitHub API endpoints from [matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html). Standard direct calls will be blocked by browser CORS. Always route external network requests via the `bridgeFetch` CustomEvent model.
*   **Protect credentials**: Never remove `config.js` from the [.gitignore](file:///c:/Users/User/Documents/VSC/LoL-retrieve/.gitignore) file. Do not commit actual Personal Access Tokens (PATs) or sensitive credentials to the repository.
*   **Manual GitHub Sync**: Local draft saving is instantaneous upon typing. However, synchronization to GitHub must never be automatic/debounced; it is triggered only via the manual "Sync to GitHub" button to prevent unnecessary commits and conflicts.
*   **Synchronize file SHAs**: Always maintain the state of the `currentSha` variable. Ensure it is updated with the new SHA returned from every successful save response to prevent edit conflict failures on subsequent writes.
*   **Maintain `@match` patterns**: If you add new HTML files or rename existing ones, update the `// @match` rules in [bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js) to ensure the Tampermonkey script continues to load on target pages.
*   **Follow Matchup Folder Directory rules**: All matchups must follow the structure `matchups/{EnemyKey}/{MyKey}.md`. Use the mapping helpers in `js/utils.js` to ensure champion keys and slugs translate cleanly.
*   **Respect the file organization**: JavaScript files live in `js/`, CSS files live in `css/`, and only `matchups.html`, `config.js`, and `bridge.js` remain in the project root. When adding new scripts or stylesheets, place them in the appropriate subdirectory and update `matchups.html` references.
*   **Do not overuse browser/Chrome subagents**: Avoid launching the browser subagent excessively to verify simple UI changes. Use it only when necessary for complex interactive checks. If a verification is simple or it is faster to ask the user to refresh and verify it directly, just ask the user.

---

## 3. How to Use & Maintain Documentation Moving Forward

The project maintains detailed guides inside the [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) folder and plans inside the [work/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/work) folder.

### Existing Documentation Files:
*   [architecture.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/architecture.md): Detailed breakdown of the modular JS (8 scripts) and CSS (2 files) architecture with load order and responsibilities.
*   [github_setup.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/github_setup.md): Guide to repo configuration, generating Personal Access Tokens, file structure on GitHub, and the YouTube links index system.
*   [tampermonkey_bridge.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/tampermonkey_bridge.md): Explanation of CORS limitations, event-driven communication (using CustomEvents), background tab opening, and script installation steps.
*   [html_editor.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/html_editor.md): Complete UI element catalog, full page lifecycle (boot → load → edit → save → tab switch), link management system, YouTube VOD integration, and conflict resolution flow.
*   [plan_mobalytics.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/work/plan_mobalytics.md): Roadmap and requirements definition for split-screen editor views and automatic Mobalytics scraping checks.
*   [plan_modularization.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/work/plan_modularization.md): Architectural design for the decoupled stylesheets and scripts modularization.
*   [study_companion.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/work/study_companion.md): Tutor companion roadmap explaining study order and analogies for beginner web developers.
*   [ui_and_links_overhaul.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/work/ui_and_links_overhaul.md): Detailed technical post-mortem of the UI overhaul: cloneNode bug, modal flexbox, CSS Grid sidebar, YouTube VOD detection, and background tab binding.
*   [cors_bypassing_userscripts.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/cors_bypassing_userscripts.md): Educational deep-dive explaining SOP, CORS, and Tampermonkey event bridge proxy messaging.
*   [local_drafts_persistence.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/local_drafts_persistence.md): Educational deep-dive explaining Web Storage APIs and editor conflict resolution states.
*   [github_contents_api.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/github_contents_api.md): Educational deep-dive explaining Base64 multi-byte UTF-8 encoding/decoding and git SHAs revision rules.

### Standard Practices for Documentation Maintenance:
1.  **Read First**: Before suggesting or implementing any feature, check this [GEMINI.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/GEMINI.md) file and read the relevant documentation files under [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) to align with established patterns.
2.  **Update on Change**: If you modify the codebase logic (e.g. adding new API options, changing the event bridge interface, or updating config properties), you must update the corresponding guides in [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation).
3.  **Document New Workflows**: If a new module is introduced, create a new `.md` file inside the [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) folder and link it here under the *Existing Documentation Files* list.
4.  **Extend Agent Rules**: If you introduce a new architecture rule or standard workflow constraint, write it in the *Rules for Future AI Agents* list above to ensure next-generation agents follow it.
