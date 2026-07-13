# HTML Frontend & State Management

This document details the structure, behavior, and lifecycle events of the frontend editor page ([matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html)).
For details on how the javascript is split into modules, please refer to [architecture.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/documentation/architecture.md).

## 1. UI Elements & Layout

The editor interface features a slate-blue and teal design, including:

### Error & Status Banners
*   **Config Missing Banner** (`#configError`): Alerts if `config.js` failed to load.
*   **Bridge Inactive Banner** (`#bridgeError`): Detailed instructions for enabling Tampermonkey with numbered steps for Chrome/Edge and Firefox users.
*   **Token Expired Banner** (`#tokenExpiredError`): Warns when GitHub rejects the Personal Access Token.
*   **Connection Status Badge** (`#connectionStatus`): Pill badge in the header showing `Pinging...`, `Connected`, `Offline`, `Bridge Offline`, `Bad Credentials`, or `Config Error`.

### Matchup Selection (Sidebar)
*   **Quick Search Input** (`#quickMatchup`): A text field that accepts patterns like `Garen vs Sett Top`. When both champion names are recognized from the champion catalog and the role is valid, it auto-fills the separate My/Enemy inputs and role dropdown below.
*   **Champion Inputs** (`#myChamp`, `#enemyChamp`): Autocomplete text fields backed by a `<datalist>` populated from Riot Data Dragon champion data (cached in `localStorage`).
*   **Role Selector** (`#roleSelect`): Dropdown for Top/Jng/Mid/ADC/Sup — used for constructing OP.GG and Lolalytics URLs.
*   **Load Matchup Button** (`#loadBtn`): Triggers the `loadMatchup()` flow.

### Pending Local Drafts Panel (Sidebar)
*   Lists all unsynced local drafts stored in `localStorage` (keys matching `draft_matchup:*`).
*   Tab variants (base, `-plan`, `-vod`) are grouped under a single parent matchup entry.
*   The currently active matchup is filtered out of the list to avoid redundancy.
*   Each card has a **Sync** button (pushes to GitHub in the background) and an **Edit** button (loads the matchup into the editor).

### Saved Matchups Panel (Sidebar)
*   A permanent "General" card at the top links to the General Notes page.
*   Below it, all starred matchups are rendered in a strict **4-column CSS Grid**: Player Champion (40px) | `vs` (16px) | Enemy Champion (42px) | YouTube icon (auto).
*   Names exceeding 6 characters are truncated with full-name hover tooltips.
*   Repeated player champion names collapse to `...` for cleaner visual grouping.
*   Sorted alphabetically: first by player champion, then by enemy champion.
*   **YouTube VOD Icon**: Always rendered in the 4th grid column. Red and clickable if a YouTube link exists (opens in background tab via bridge). Grey and inert (`opacity: 0.5`) if no link found.

### Editor Panel (Main Area)
*   **Champion Portraits Header** (`#matchupPortraits`): When a matchup is loaded, shows circular DDragon champion icons with names below, separated by a "VS" label. Hidden for General Notes (plain text label shown instead via `#currentFileLabel`).
*   **Star Button** (`#starBtn`): Toggles the active matchup's saved/starred status. Filled gold when saved, outline when not. Hidden for General Notes.
*   **VSM Pair Badge** (`#vsmPairBadge`): Header badge showing the currently loaded matchup pair.
*   **Editor Tabs** (`#editorTabs`): Two-button toggle group in the header:
    *   **Matchup context**: `Plan` (left) / `Notes` (right) — maps to `{Key}-plan.md` and `{Key}.md`.
    *   **General context**: `Notes` (left) / `VODs` (right) — maps to `Notes.md` and `Notes-vod.md`.
    *   Active tab side is persisted in `localStorage` (`editor_active_tab_side`).
*   **Conflict Banner** (`#conflictBanner`): Inline warning with red background that appears when local draft text differs from the GitHub version. Shows "Unsynced conflict:" with two resolution buttons: **Use Local** (keeps draft, hides banner) and **Use GitHub** (overwrites editor with remote copy, deletes local draft).
*   **Textarea** (`#editor`): Monospace editor (`Fira Code`) with resizable height. Height is persisted in `localStorage` and restored immediately on load via an inline `<script>` block to prevent visual flicker.

### Links Panel (Below Editor)
*   **Detected Links Container** (`#detectedLinksContainer`): Collapsible panel that extracts and displays all URLs found in the editor text plus custom metadata-only links.
*   **Link Badges**: Horizontal wrapping badges with domain-specific icons:
    *   YouTube: Red play SVG
    *   OP.GG: Blue `OP` label
    *   Mobalytics: Purple hexagon SVG
    *   Lolalytics: Red `LA` label
    *   Others: Generic chain-link SVG
*   Each badge has an **Edit** button (opens the link edit modal) and a **`...`** button (opens in background tab via bridge).
*   **Drag-to-Reorder**: Badges support HTML5 drag-and-drop. Reordered positions are saved to `activeMetadata.linkOrder` and persisted via the autosave cycle.
*   **Add Link Button**: Opens the modal to create a new invisible custom link (stored only in metadata, not in editor text).

### Link Edit Modal
*   Modal overlay with Display Text and URL fields.
*   Supports editing both text-extracted links (modifies the editor text directly) and custom metadata links (modifies `activeMetadata.customLinks`).
*   Delete button available for existing links (removes from metadata or text).
*   Legacy links without `customId` are auto-migrated with JIT ID generation.

### Footer Action Bar
*   **Status Text** (`#status`): Shows real-time sync, loading, conflict, and autosave messages.
*   **External Site Buttons**: Lolalytics, OP.GG, and Mobalytics buttons with favicon icons. Each opens the relevant counter/matchup page in a background tab via the bridge (falls back to `window.open` if bridge is offline). Visible only when a matchup is loaded.
*   **Discard Button** (`#discardBtn`): Always visible when a matchup is loaded. Enabled when a local draft exists. Clicking shows a "Yes/No" confirmation row (`#discardConfirmGroup`). Confirming deletes the local draft and reloads the clean GitHub version.
*   **Sync GitHub Button** (`#syncBtn`): Manual push to GitHub. Disabled when credentials are invalid. Enabled once token validation passes.

---

## 2. Page Lifecycle

### A. Initialization (`boot.js → window.onload`)
When the page loads:

1.  **Tab Restoration**: Restores the last-active tab side (`left` or `right`) from `localStorage`.
2.  **URL Parameter Parsing**: Checks for matchup targets via:
    *   Query parameters: `?enemy=Garen&my=Darius`
    *   Hash/query shorthand: `#GarenvsDarius`, `?Garen-vs-Darius`
    *   If found, sets `willLoadMatchup = true` and suppresses the General Notes fallback.
3.  **Fallback Timers**: Sets delayed timers (100ms for Notes, 200ms for Matchup) to render placeholder content. These prevent blank-screen flicker while the bridge handshake runs.
4.  **Bridge Diagnostic**: Dispatches `PingTampermonkeyBridge` every 200ms up to 15 times.
    *   **If bridge responds**: Sets `bridgeActive = true`, hides bridge error banner.
    *   **If no response**: Sets `bridgeActive = false`, shows bridge error banner and enters local-only mode.
5.  **Background Tab Link Setup**: Wires up click handlers on Mobalytics, OP.GG, and Lolalytics buttons to route through `OpenBackgroundTab` bridge event.
6.  **Champion Loading**: Loads champion data from Riot DDragon API (with `localStorage` cache). Populates `<datalist>` dropdown and enables input fields.
7.  **Token Validation**: If bridge is online and `config.js` is valid, validates the GitHub PAT via `/user` endpoint. Unlocks or locks the Sync button accordingly.
8.  **YouTube Index Fetch**: Fetches `youtube_links.json` from the GitHub repo, caches in `localStorage` (`youtube_links_index`), and stores the file SHA for future updates.
9.  **Saved Matchups Render**: Builds the sidebar list from `localStorage` (`saved_matchups`).
10. **Local Drafts Render**: Scans `localStorage` for `draft_matchup:*` keys and renders the pending drafts panel.
11. **Final Load**: Clears fallback timers. If URL parameters or pre-filled inputs specify a matchup, calls `loadMatchup()`. Otherwise calls `loadGeneralNotes()`.
12. **Autosave Listener**: Attaches a debounced (500ms) `input` listener to the editor textarea that saves current content (with metadata) to `localStorage` on every keystroke.

### B. Loading a Matchup (`sync.js → loadMatchup`)
1.  Resolves champion display names to keys using `utils.js` helpers.
2.  Constructs and sets external site URLs (Mobalytics, OP.GG, Lolalytics) using the role selector value.
3.  Resolves the active tab's file path via `resolvePagePath()` (e.g., `matchups/Sett/Garen.md` or `matchups/Sett/Garen-plan.md`).
4.  Calls `loadMatchupByPath()` with the resolved path, draft key, and champion keys.

### C. Loading by Path (`sync.js → loadMatchupByPath`)
1.  Updates `activeMatchup` global state. Re-renders the local drafts panel.
2.  **Metadata Resolution**: On matchup change, extracts metadata from the primary local draft. If loading a secondary tab (Plan/VODs), asynchronously fetches the primary file from GitHub to get shared link metadata.
3.  **Local Draft Check**: Reads `localStorage` for the current draft key. Extracts metadata if present.
4.  **Offline Mode**: If bridge/config is offline, loads the local draft directly and returns.
5.  **GitHub Fetch**: Fetches the file from GitHub with cache-busting headers.
    *   **404**: File doesn't exist yet. Enters "New Draft" mode.
    *   **200 with conflict**: Local draft differs from GitHub version → shows `conflictBanner` with resolution buttons, displays the local version in the editor.
    *   **200 no conflict**: Synced state. Clears any redundant identical draft from `localStorage`.
6.  Updates champion portraits, star button, and tab labels.

### D. Editing and Local Auto-Saving
1.  On input keystrokes (debounced 500ms), the editor saves content + appended metadata to `localStorage` under the active `draftKey`.
    *   **Metadata Appendage Rule**: The autosave cycle only appends the hidden `<!-- METADATA: {...} -->` block to drafts of the *primary* file (Notes tab for matchups, Notes tab for General). Non-primary tab drafts (Plan, VODs) are saved as plain text without metadata. This prevents false conflict detections and metadata duplication across tabs.
2.  Updates the pending drafts sidebar.
3.  Updates the detected links panel.

### E. Saving to GitHub (`sync.js → saveToGitHub`)
*   **Dual-Tab Sync**: Both the main "Sync GitHub" button and the sidebar "Sync" button sync BOTH tabs' drafts for the active matchup or General context. The main button first syncs the currently displayed tab, then automatically syncs the other tab's draft if one exists in `localStorage`. Metadata is stripped from non-primary tab files before push to prevent pollution.
1.  Appends metadata to the primary file only (Notes for matchups, Notes for General).
2.  Encodes to Base64 (with UTF-8 multibyte safety via `btoa(unescape(encodeURIComponent(...)))`).
3.  PUTs to GitHub with the current SHA (or without SHA for new files).
4.  On success:
    *   Updates `currentSha` with the new revision from GitHub.
    *   **YouTube Index Sync**: Extracts YouTube links from the saved text. If the link changed, updates `youtube_links.json` on GitHub (fetching/updating its SHA) and refreshes `localStorage`.
    *   Clears the local draft, hides conflict banner, re-renders drafts and saved matchups.

### F. Tab Switching (`ui.js → switchEditorTab`)
1.  Saves current editor content as a local draft before switching.
2.  Updates `activePageSide` and persists to `localStorage`.
3.  Computes the new file path via `resolvePagePath()` and calls `loadMatchupByPath()`.

---

## 3. Link Recognition & Management

The editor dynamically parses, highlights, and manages external links:

### Text-Extracted Links
*   Every time content changes, `extractUrls()` scans for raw URLs (`http://`, `https://`, `www.`) and Markdown-formatted links (`[text](url)`).
*   Markdown links get their display text preserved; raw URLs are cleaned of trailing punctuation.
*   Deduplication favors Markdown links over raw URL duplicates.

### Custom Metadata Links
*   Users can add invisible links via the "Add Link" button that opens the link edit modal.
*   Custom links are stored in `activeMetadata.customLinks` (array of `{customId, display, url}` objects).
*   They are appended to the `.md` file as a hidden HTML comment: `<!-- METADATA: {...} -->`.
*   Metadata is only appended to the primary file (Notes tab for matchups, Notes tab for General).
*   **Cross-Tab Persistence**: When adding or editing a custom link while on a non-primary tab (Plan/VODs), the system explicitly persists the updated metadata to the primary tab's local draft. This ensures metadata changes are not lost when switching tabs or reloading.

### Link Ordering
*   All links (text-extracted + custom) are merged and sorted according to `activeMetadata.linkOrder`.
*   Users can drag-and-drop link badges to reorder. The new order is saved immediately via the autosave cycle.

### YouTube VOD System
*   **Global Index** (`youtube_links.json`): A JSON file on GitHub mapping `{EnemyKey}_{MyKey}` to YouTube URLs.
*   **Dual-Layer Detection**: The saved matchups sidebar checks for YouTube links in two layers:
    1.  The global index (`localStorage: youtube_links_index`)
    2.  Local draft metadata and raw text (regex fallback)
*   **Sidebar Icons**: Red clickable YouTube icon (opens in background tab) or grey inert icon for matchups without VOD links.
*   **Auto-Sync**: When saving to GitHub, the system compares the current YouTube link with the index. If changed, it auto-updates `youtube_links.json` on GitHub.

### Background Tab Opening
*   The `...` button on link badges and the YouTube sidebar icons dispatch `OpenBackgroundTab` CustomEvents.
*   The Tampermonkey bridge intercepts these and uses `GM_openInTab(url, {active: false})` to open the link without stealing focus.
*   Falls back to `window.open` if the bridge is offline.
