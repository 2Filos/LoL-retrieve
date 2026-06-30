# HTML Frontend & State Management

This document details the structure, behavior, and lifecycle events of the frontend editor page ([matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html)).

## 1. UI Elements & Layout

The editor interface features a slate-blue and teal design, including:
*   **Security Error Banners**: Banners alerting you to configuration issues (missing `config.js`), active token issues (GitHub token expiration), or bridge script status (inactive Tampermonkey userscript).
*   **Autocomplete Selectors**: Separate **Enemy Champion** and **My Champion** search inputs mapped to native `<datalist>` dropdown elements. These are loaded dynamically from Riot Games Data Dragon and cached in local storage.
*   **Mobalytics Counters Link**: A button equipped with the Mobalytics logo that opens the counter statistics for the selected enemy champion in a background browser tab without taking active focus.
*   **Pending Local Drafts Sidebar**: A panel listing all unsynced local drafts saved in `localStorage`.
*   **Conflict Resolution Banner**: A warning element that appears if a file is loaded from GitHub but differing unsynced edits exist in local storage, allowing the user to select which version to preserve.
*   **Editor Panel**: A text writing area (`<textarea>`) styled with softer slate colors for legibility.
*   **Status Bar**: Displays real-time sync, loading, and connection status information.

---

## 2. Page Lifecycle

### A. Initialization
When the page loads:
1.  **Bridge Diagnostic**: The page dispatches a recurring ping event (`PingTampermonkeyBridge`) every 200ms up to 15 times to negotiate a handshake.
    *   If no pong is received, the page defaults to **Bridge Offline / Local-Only Mode**, loading champions from the local cache and allowing editing of local drafts.
    *   If the handshake succeeds, the page connects online.
2.  **Champion Loading**:
    *   The page checks `localStorage` for `lol_champions_cache`.
    *   If missing or outdated, it fetches patch versions from Riot Games Data Dragon (`versions.json`) and pulls down the complete list of champion IDs and display names.
    *   The champion objects are stored in cache and populated into the search autocomplete lists.
3.  **Authentication**: Checks the token validity against the GitHub API `/user` endpoint. If valid, the online sync actions are unlocked.
4.  **Auto-Load Restore (F5)**: If the browser reloads and restores values in the "Enemy Champion" and "My Champion" input fields from a previous session, the script automatically triggers `loadMatchup()` to restore the edit session status, update the title, and show the Mobalytics link.

### B. Loading a Matchup (`loadMatchup`)
1.  Resolves inputs using helper functions in `utils.js` (e.g. mapping `Dr. Mundo` to `dr-mundo` or `MonkeyKing` to `wukong` for Mobalytics).
2.  Sets the Mobalytics link URL to `https://mobalytics.gg/lol/champions/{slug}/counters` and displays the button.
3.  Requests file data from the GitHub contents API at `matchups/{EnemyKey}/{MyKey}.md`.
4.  **If the file exists on GitHub (200)**:
    *   If a differing local draft exists in `localStorage`, the editor shows the **Conflict Resolution Banner**.
    *   Otherwise, it clears any identical local drafts and displays the GitHub content, updating `currentSha`.
5.  **If the file does not exist (404)**:
    *   Enters "New Draft" mode. Loads any existing local storage draft or starts with a clean slate.

### C. Editing and Local Auto-Saving
1.  On input keystrokes, the editor instantly saves the draft to `localStorage` under `draft_matchup:{EnemyKey}/{MyKey}`.
2.  Updates the list in the sidebar.
3.  Allows the user to manually sync these changes to GitHub by clicking the "Sync to GitHub" button.

### D. Saving to GitHub (`saveToGitHub`)
1.  Sends the Base64-encoded markdown text inside a PUT commit body to `matchups/{EnemyKey}/{MyKey}.md`.
2.  Upon a successful response:
    *   Updates `currentSha` with the new commit SHA returned by GitHub (critical to prevent subsequent conflicts).
    *   Clears the local draft from `localStorage` and updates the sidebar.

---

## 3. Link Recognition & Management

The editor dynamically parses and highlights external links (like YouTube or OP.GG) included in the notes:
1.  **Extraction**: Every time a matchup load completes, conflict resolution occurs, or the user edits notes, the text is scanned for URLs starting with `http://`, `https://`, or `www.`.
2.  **Visual Layout**: The links panel is **permanently visible** directly **below the editor textarea**. If multiple links are detected within the note, they are stacked **vertically** within the panel for a cleaner, organized structure. If no links are detected, the panel remains visible but empty.
3.  **Domain-specific Favicons / Icons**:
    *   **YouTube**: Displays a custom red YouTube play SVG icon.
    *   **OP.GG**: Displays a custom blue `OP` label.
    *   **Mobalytics**: Displays a purple hexagon SVG icon.
    *   **Lolalytics**: Displays a red `LA` label.
    *   **Others**: A generic network link SVG icon.
4.  **Background Tab Controls (`...` Button)**:
    *   Clicking the link text itself navigates to the target page in a new focused tab.
    *   Clicking the **`...`** button next to the link sends an `OpenBackgroundTab` CustomEvent to the bridge. The bridge invokes `GM_openInTab(url, { active: false })` to load the URL in a non-focused background tab, allowing you to queue up multiple guides/videos without interrupting your current workspace window.

