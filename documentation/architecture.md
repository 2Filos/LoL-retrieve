# Frontend Architecture & Modularization

The League of Legends Matchup Portal uses a decoupled, modularized vanilla frontend architecture to keep the codebase maintainable and readable.

## 1. JavaScript Modules

The client-side application logic is split into several purpose-built script files, loaded in standard `<script>` tags so they can share a common global namespace (e.g., sharing the `activeMatchup` state variable) without complex bundlers.

### `utils.js`
- **Purpose**: Champion name translation and metadata serialization helpers.
- **Responsibilities**: Converts user-friendly display names (e.g., "K'Sante", "Xin Zhao") to internal Riot Data Dragon keys (e.g., "Ksante", "XinZhao"). Generates Mobalytics URL slugs for counter links. Provides `extractMetadata()` and `appendMetadata()` to manage invisible JSON metadata blocks embedded at the end of `.md` files.

### `champions.js`
- **Purpose**: Riot Data Dragon metadata loading and caching.
- **Responsibilities**: Fetches the latest patch version from Riot's DDragon API, downloads the official champion roster JSON, caches it in `localStorage` (key: `lol_champions_cache`) to prevent redundant refetching, and populates the autocomplete `<datalist>` dropdowns. Includes a hardcoded offline fallback list for when the network is unavailable.

### `api.js`
- **Purpose**: Networking and CORS bridge client layer.
- **Responsibilities**: Implements the `bridgeFetch()` function that routes HTTP requests through Tampermonkey's privileged `GM_xmlhttpRequest` via `CustomEvent` messaging. Provides `fetchDirectOrBridge()` for endpoints that may work with standard `fetch` (like DDragon). Handles GitHub PAT validation (`checkTokenValidity()`), config error UI (`handleConfigMissing()`), and the ping/pong bridge diagnostic (`checkBridgeStatus()`). Also manages the global YouTube links index fetch (`fetchYoutubeLinksIndex()`).

### `storage_drafts.js`
- **Purpose**: Local draft persistence and conflict resolution.
- **Responsibilities**: Scans `localStorage` for unsaved draft keys, groups tab variants, and renders the "Pending Local Drafts" sidebar panel. Provides conflict resolution (`resolveConflict()`) and draft discard logic. Handles background sync of individual draft cards (`syncDraftDirectly()`).

### `storage_saved.js`
- **Purpose**: Saved matchup management.
- **Responsibilities**: Manages the "Saved Matchups" starred list (CRUD operations, alphabetical sorting, character truncation, YouTube icon detection via dual-layer link extraction) and renders the sidebar.

### `sync_load.js`
- **Purpose**: Fetching and loading remote state.
- **Responsibilities**: Implements `loadMatchup()` to resolve champion inputs and build file paths. The core `loadMatchupByPath()` function fetches files from GitHub via the CORS bridge, performs conflict detection between local drafts and remote copies, manages the `currentSha` revision tracker, and handles cross-tab metadata resolution.

### `sync_save.js`
- **Purpose**: Pushing state to GitHub.
- **Responsibilities**: Encodes content in Base64, PUTs to GitHub, updates SHA, triggers dual-tab syncing, and runs the YouTube links index sync pipeline.

### `ui_links.js`
- **Purpose**: Link extraction and rendering.
- **Responsibilities**: Parses and extracts URLs from editor text (`extractUrls()`), generates domain-specific icons (`getLinkIcon()`), and renders the detected link badge panel with drag-to-reorder support.

### `ui_modal.js`
- **Purpose**: Link formatting modal.
- **Responsibilities**: Manages the link edit modal (open/save/delete for both text-extracted and custom metadata links).

### `ui_tabs.js`
- **Purpose**: Editor tab system.
- **Responsibilities**: Handles path resolution (`resolvePagePath()`), updates tab labels, manages content-presence indicators (`updateTabIndicators()`), and handles tab switching (`switchEditorTab()`).

### `ui_core.js`
- **Purpose**: General DOM manipulation and UI feedback.
- **Responsibilities**: Manages discard button state, textarea height persistence via `ResizeObserver`, champion portrait icon rendering, and the quick search auto-fill input.

### `boot.js`
- **Purpose**: Application lifecycle and entry point.
- **Responsibilities**: Contains the `window.onload` initialization sequence, parses URL parameters and hash fragments to auto-load matchups, manages global state objects (`activeMatchup`, `currentSha`, `CHAMPIONS`, `githubTextCache`, `ddragonVersion`, `activeMetadata`, `activePageSide`), sets up background tab link handlers, orchestrates the boot pipeline (bridge check → champions load → token validation → YouTube index fetch → saved matchups render → drafts render → auto-load), and attaches the debounced autosave listener to the editor textarea.

### Supporting Files
- `config.js`: User's local credentials containing `CONFIG.GITHUB_TOKEN` and `CONFIG.GITHUB_REPO` (gitignored, never committed).
- `bridge.js`: Tampermonkey CORS proxy userscript — installed separately in the browser extension, not loaded by `<script src>`.

---

## 2. CSS Architecture

The stylesheet is broken down to prevent styling pollution and make specific overrides easy:

### `theme.css`
- **Purpose**: Global design tokens, typography, and structural layout.
- **Responsibilities**: CSS custom properties (`:root` variables for colors, borders, shadows, gradients), box-sizing reset, body styling, the `.app-container` max-width wrapper, the `header` bar with gradient background, the `h1` gradient text effect, `.status-badge` variants (online/offline/pinging), the `.main-layout` responsive CSS Grid (250px sidebar + 1fr editor), `.card` base styles with hover glow effects, and the `.sidebar` flex column.

### `components.css`
- **Purpose**: Visual widgets and localized component styling.
- **Responsibilities**: Form inputs and labels, all button variants (`.btn-secondary`, `.btn-danger`, `.btn-discard`, `.btn-gold-sm`, `.btn-outline-sm`, `.btn-sync-sm`), the pending local drafts sidebar (`.drafts-panel`, `.draft-card`, `.draft-actions`), saved matchups sidebar (`.saved-panel`), star/favorite button (`.star-btn`), editor page tabs (`.tab-btn`, `.editor-tab-group`), the main text editor panel (`.editor-card`, `.editor-header`, `.editor-title`, textarea), champion portrait layout (`.matchup-portraits`, `.portrait-stack`, `.champion-portrait`, `.vs-label`), the footer action bar (`.editor-actions`, `.status-text`), error and warning banners (`.error-banner`, `.warning-banner`, `.banner-buttons`), and the detected links section (`.detected-links-container`, `.link-badge`, `.bg-tab-btn`) with collapsible toggle support.

---

## 3. Script Load Order

The HTML loads scripts in a strict order at the end of `<body>` to ensure dependency resolution:

```
1. utils.js        — Pure helpers, no dependencies
2. config.js       — User credentials (onerror triggers handleConfigMissing)
3. champions.js    — Depends on: global CHAMPIONS array, fetchDirectOrBridge (api.js loads later but champions.js only runs when called)
4. storage_drafts.js — Depends on: utils.js helpers, activeMatchup state
5. storage_saved.js  — Depends on: storage_drafts.js, ui helpers
6. sync_load.js      — Depends on: utils.js, api.js, storage/ui helpers
7. sync_save.js      — Depends on: sync_load.js, api.js, storage/ui helpers
8. api.js          — Depends on: config.js CONFIG object
9. ui_core.js      — Depends on: state
10. ui_links.js    — Depends on: utils.js
11. ui_modal.js    — Depends on: ui_links.js
12. ui_tabs.js     — Depends on: sync_load.js
8. boot.js         — Entry point, depends on everything above
```

All scripts share a single global namespace. State variables like `currentSha`, `CHAMPIONS`, `activeMatchup`, `activeMetadata`, `activePageSide`, `bridgeActive`, and `isConfigValid` are declared in `boot.js` or `api.js` and accessed globally by all other modules.
