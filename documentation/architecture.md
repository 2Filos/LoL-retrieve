# Frontend Architecture & Modularization

The League of Legends Matchup Portal uses a decoupled, modularized vanilla frontend architecture to keep the codebase maintainable and readable.

## 1. JavaScript Modules

The client-side application logic is split into several purpose-built script files, loaded in standard `<script>` tags so they can share a common global namespace (e.g., sharing the `activeMatchup` state variable) without complex bundlers.

### `boot.js`
- **Purpose**: Application lifecycle and entry point.
- **Responsibilities**: Contains the `window.onload` logic, parses URL parameters, manages the global state objects (`activeMatchup`, `currentSha`, `bridgeActive`), and attaches listeners to the core text editor.

### `ui.js`
- **Purpose**: DOM manipulation and visual feedback orchestration.
- **Responsibilities**: Updates UI text labels, toggles warning banners (like the Discard Confirmation), parses external URLs from raw markdown notes (`extractUrls`, `getLinkIcon`), and renders the dynamic link badges under the editor. Handles Champion portrait header UI toggles.

### `champions.js`
- **Purpose**: Riot Data Dragon metadata.
- **Responsibilities**: Fetches the latest patch version, downloads the official Champion roster JSON, caches it in `localStorage` to prevent slow re-fetching, and populates the auto-complete dropdowns.

### `sync.js`
- **Purpose**: Remote state synchronization logic.
- **Responsibilities**: Uses the Tampermonkey CORS bridge (`api.js`) to load files from GitHub, pushes changes back using `PUT` requests, and manages the `currentSha` cryptographic hashes to prevent edit conflicts when multiple sessions are active.

### `storage.js`
- **Purpose**: Local state and offline persistence.
- **Responsibilities**: Immediately saves text changes to `localStorage` drafts as the user types. Scans memory for unsaved notes to render the "Pending Local Drafts" sidebar. Resolves conflicts if local and remote copies diverge. Manages the "Saved Matchups" starred list.

### Supporting Scripts
- `api.js`: Low-level wrapper executing `CustomEvent` calls to talk to the Tampermonkey `bridge.js`.
- `utils.js`: Helpers for cleaning and translating champion display names into internal lookup keys.
- `config.js`: User's local credentials (ignored from version control).

---

## 2. CSS Architecture

The stylesheet is broken down to prevent styling pollution and make specific overrides easy:

### `theme.css`
- **Purpose**: Global properties and structural bones.
- **Responsibilities**: CSS variables (`:root`), font imports, element resets, typography constraints, and the main grid layouts (`.app-container`, `.main-layout`).

### `components.css`
- **Purpose**: Visual widgets and localized element styling.
- **Responsibilities**: Rules targeting individual reusable pieces: cards, sidebars, buttons, form inputs, the text editor panel, and error banners.
