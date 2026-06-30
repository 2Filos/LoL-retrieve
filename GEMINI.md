# Project Context & Agent Instructions (GEMINI.md)

Welcome! This file serves as the core source of truth for the **LoL-retrieve** matchup editor project. It provides general project context and establishes rules for AI agents operating in this workspace.

---

## 1. Project Overview

**LoL-retrieve** is a local, serverless text editor designed to manage and synchronize League of Legends matchup notes directly with a remote GitHub repository. It consists of:
1.  **Frontend Editor** ([matchups.html.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html.html)): A single-page application loaded locally (`file:///` protocol) that acts as the UI.
2.  **Tampermonkey Script** ([bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js)): An active userscript acting as a CORS proxy to bypass browser security policies.
3.  **Local Credentials** ([config.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/config.js)): Local mapping configuration (ignored in Git).

---

## 2. Rules for Future AI Agents

When editing or extending this codebase, you must adhere to the following rules:

*   **Never bypass the bridge**: Do not attempt to use standard `fetch` or `XMLHttpRequest` directly to GitHub API endpoints from [matchups.html.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html.html). Standard direct calls will be blocked by browser CORS. Always route external network requests via the `bridgeFetch` CustomEvent model.
*   **Protect credentials**: Never remove `config.js` from the [.gitignore](file:///c:/Users/User/Documents/VSC/LoL-retrieve/.gitignore) file. Do not commit actual Personal Access Tokens (PATs) or sensitive credentials to the repository.
*   **Keep autosave debouncing active**: When modifying editor input handlers, always preserve a debounce delay of at least 1.5 seconds before auto-syncing to GitHub to prevent rate limits and merge conflicts.
*   **Synchronize file SHAs**: Always maintain the state of the `currentSha` variable. Ensure it is updated with the new SHA returned from every successful save response to prevent edit conflict failures on subsequent writes.
*   **Maintain `@match` patterns**: If you add new HTML files or rename existing ones, update the `// @match` rules in [bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js) to ensure the Tampermonkey script continues to load on target pages.

---

## 3. How to Use & Maintain Documentation Moving Forward

The project maintains detailed guides inside the [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) folder.

### Existing Documentation Files:
*   [github_setup.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/github_setup.md): Guide to repo configuration, generating Personal Access Tokens, and setting up credentials.
*   [tampermonkey_bridge.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/tampermonkey_bridge.md): Explanation of CORS limitations, event-driven communication (using CustomEvents), and script installation steps.
*   [html_editor.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/html_editor.md): Detail on state management, Base64 coding, and the debounced autosave synchronization cycle.

### Standard Practices for Documentation Maintenance:
1.  **Read First**: Before suggesting or implementing any feature, check this [GEMINI.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/GEMINI.md) file and read the relevant documentation files under [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) to align with established patterns.
2.  **Update on Change**: If you modify the codebase logic (e.g. adding new API options, changing the event bridge interface, or updating config properties), you must update the corresponding guides in [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation).
3.  **Document New Workflows**: If a new module is introduced, create a new `.md` file inside the [documentation/](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation) folder and link it here under the *Existing Documentation Files* list.
4.  **Extend Agent Rules**: If you introduce a new architecture rule or standard workflow constraint, write it in the *Rules for Future AI Agents* list above to ensure next-generation agents follow it.
