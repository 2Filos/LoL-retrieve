# AI Companion Study Guide: LoL-retrieve

Welcome, AI Coding Assistant! This document serves as the master context and instructional roadmap for tutoring the user (who understands general programming logic, but is new to JS, HTML, or CSS) on how this serverless matchup portal operates.

When the user asks questions or requests modifications to this codebase, **always refer to this guide** to keep explanations aligned with their learning path and current technical baseline.

---

## 1. User Baseline & Pedagogical Rules
*   **The User Knows**: Basic coding logic (variables, if/else conditions, simple functions, key-value stores).
*   **The User is New to**: Web frontend elements, browser DOM APIs, CSS selectors, Javascript asynchronous flows (Promises/Events), and web security concepts (CORS/SOP).
*   **Pedagogical Rules**:
    *   **Avoid jargon**: Do not assume familiarity with JS/CSS frameworks. Explain Vanilla CSS, HTML5, and native JS using real-world analogies.
    *   **Visual metaphors**: Explain DOM operations (e.g. `document.getElementById`) as "finding a mailbox by its label" and local storage as "a sticky note on the browser's dashboard."
    *   **Visual code traces**: When explaining a flow, trace variables step-by-step through the files.

---

## 2. Directory & Study Roadmap

Advise the user to study the codebase in this specific sequence to build knowledge incrementally:

### Phase 1: Structure & Styling (The Visual Skeleton)
1.  **[matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html)**: The structural skeleton.
    *   *Concepts to teach*: HTML tags (`<div>`, `<textarea>`, `<input>`), linking external stylesheets/scripts, and native browser datalists.
2.  **[style.css](file:///c:/Users/User/Documents/VSC/LoL-retrieve/style.css)**: The aesthetic layer.
    *   *Concepts to teach*: CSS variables (`:root`), Flexbox (`display: flex`), CSS Grid (`display: grid`), hover transitions, and mobile layouts (`@media`).

### Phase 2: Simple Logic & Local Storage (Data Manipulation)
3.  **[utils.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/utils.js)**: Straightforward helper functions.
    *   *Concepts to teach*: Champion name matching (e.g., `"K'Sante"` -> `"Ksante"`) and slug conversions for third-party links (e.g., `"MonkeyKing"` -> `"wukong"`).
4.  **[learning/local_drafts_persistence.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/local_drafts_persistence.md)**: Conceptual guide on Web Storage.
    *   *Concepts to teach*: Caching text changes in `localStorage`, namespaces, page reload recovery, and resolving local-vs-remote conflicts.
5.  **[editor.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js)**: The layout controller.
    *   *Concepts to teach*: Hooking into keystroke inputs, immediate autosaving, scraping URLs from note content, building HTML lists dynamically, JSON serialization/deserialization for list persistence, and writing generic file-loading helpers.

### Phase 3: The CORS Security Wall & Asynchronous API Sync
6.  **[learning/cors_bypassing_userscripts.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/cors_bypassing_userscripts.md)**: Explains the Same-Origin Policy (SOP).
    *   *Concepts to teach*: Why local `file:///` URLs are sandboxed, and how browser extensions (Tampermonkey) bypass CORS limits.
7.  **[api.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/api.js)**: The network requests client.
    *   *Concepts to teach*: Asynchronous JavaScript (Promises, async/await), pings/pongs, custom window event listeners, and API credential authorization checks.
8.  **[bridge.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js)**: The privileged userscript.
    *   *Concepts to teach*: Tampermonkey metadata rules (`@grant`, `@connect`), cross-context message passing, and running `GM_xmlhttpRequest`.
9.  **[learning/github_contents_api.md](file:///c:/Users/User/Documents/VSC/LoL-retrieve/learning/github_contents_api.md)**: Explains the GitHub REST API.
    *   *Concepts to teach*: GitHub Content API endpoints, Base64 translations, UTF-8 safety hacks, and SHA checksums for git collision prevention.

---

## 3. Step-by-Step Code Traces

Use these tracing walkthroughs to show the user exactly how code flows across different files:

### Walkthrough A: Tracing a Keystroke (Autosave Loop)
When the user types a character inside the notepad editor, the following flow is triggered:

```
[Keystroke in Textarea]
         │
         ▼
[editor.js] Event Listener: document.getElementById('editor').addEventListener('input', ...)
         │
         ├─► Reads input values: myChamp (e.g. "Darius"), enemyChamp (e.g. "Garen")
         ├─► Normalizes names using utils.js: getChampionKeyByName("Darius") -> "Darius"
         │                                    getChampionKeyByName("Garen") -> "Garen"
         ├─► Generates storage key: "draft_matchup:Garen/Darius"
         │
         ▼
[Browser Storage] localStorage.setItem("draft_matchup:Garen/Darius", "play safe...")
         │
         ▼
[editor.js] Calls renderLocalDrafts() -> scans localStorage and updates Sidebar HTML
```

### Walkthrough B: Tracing a GitHub Sync Request
When the user clicks the "Sync to GitHub" button:

```
[Click Sync Button]
         │
         ▼
[editor.js] saveToGitHub() is called
         │
         ├─► Encodes text to Base64 safely: btoa(unescape(encodeURIComponent(text)))
         ├─► Builds body JSON: { message: "...", content: "BASE64_TEXT", sha: currentSha }
         │
         ▼
[api.js] bridgeFetch("https://api.github.com/...", options) is called
         │
         ├─► Generates unique requestId: "xyz123"
         ├─► Starts listening for event: "FromTampermonkeyBridge_xyz123"
         ├─► Dispatches CustomEvent: "ToTampermonkeyBridge" containing request payload
         │
         ▼
[bridge.js] (Tampermonkey context) hears "ToTampermonkeyBridge"
         │
         ├─► Extracts URL, headers, and body
         ├─► Executes privileged: GM_xmlhttpRequest()
         ├─► Receives network response from GitHub
         ├─► Dispatches CustomEvent: "FromTampermonkeyBridge_xyz123" containing response
         │
         ▼
[api.js] Response listener triggers, resolves the Promise with GitHub data
         │
         ▼
[editor.js] Clears local storage "draft_matchup:Garen/Darius"
          ├─► Updates currentSha with new SHA returned by GitHub (prevents overwrite conflicts)
          ├─► Hides conflict banners, refreshes sidebar draft lists
```

### Walkthrough C: Tracing Star/Save Toggle and Sidebar Update
When the user clicks the Star button to save/favorite a matchup:

```
[Click Star Button]
         │
         ▼
[editor.js] toggleSaveMatchup() is called
         │
         ├─► Retrieves saved matchups array from localStorage: getSavedMatchups()
         ├─► Checks if current matchup (enemyKey/myKey) is already present
         ├─► If present, removes it; if absent, appends it
         ├─► Saves the updated array to localStorage: saveMatchupsList(saved) (using JSON.stringify)
         │
         ├─► Calls updateStarButtonUI() to toggle SVG icon filled/stroke class
         ├─► Calls renderSavedMatchups() to rebuild the Sidebar HTML list
         │
         ▼
[Browser Storage] localStorage.setItem("saved_matchups", "[{\"enemyKey\":\"Ahri\",\"myKey\":\"Yasuo\"}]")
         │
         ▼
[UI Sidebar] Re-rendered saved list: Yasuo vs Ahri displays with an "Edit" shortcut, below General Notes
```

---

## 4. Key Functions & Variables Quick Guide

Use this table to quickly point the user to the correct file and function when studying specific behaviors:

### Visual Styles
*   **Variable Custom Colors**: In [style.css:L11-27](file:///c:/Users/User/Documents/VSC/LoL-retrieve/style.css#L11-L27) (`:root`).
*   **Columns Grid Layout**: In [style.css:L105-115](file:///c:/Users/User/Documents/VSC/LoL-retrieve/style.css#L105-L115) (`.main-layout`).
*   **Mobility Layout Collapse**: In [style.css:L111-115](file:///c:/Users/User/Documents/VSC/LoL-retrieve/style.css#L111-L115) (`@media`).

### Champion Mapping
*   **Convert Displays to Keys**: In [utils.js:L39-44](file:///c:/Users/User/Documents/VSC/LoL-retrieve/utils.js#L39-L44) (`getChampionKeyByName`).
*   **Get Mobalytics Slug Formats**: In [utils.js:L11-31](file:///c:/Users/User/Documents/VSC/LoL-retrieve/utils.js#L11-L31) (`getMobalyticsSlug`).

### CORS & Network Operations
*   **Ping diagnostic checks**: In [api.js:L53-83](file:///c:/Users/User/Documents/VSC/LoL-retrieve/api.js#L53-L83) (`checkBridgeStatus`).
*   **CustomEvent Bridge dispatcher**: In [api.js:L85-133](file:///c:/Users/User/Documents/VSC/LoL-retrieve/api.js#L85-L133) (`bridgeFetch`).
*   **Greasemonkey request proxy**: In [bridge.js:L77-113](file:///c:/Users/User/Documents/VSC/LoL-retrieve/bridge.js#L77-L113) (`ToTampermonkeyBridge` listener).

### UI & Draft Caching
*   **Page startup loop**: In [editor.js:L186-241](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js#L186-L241) (`window.onload`).
*   **Autosave trigger listener**: In [editor.js:L495-513](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js#L495-L513) (`editor input event listener`).
*   **Conflict checks and loads**: In [editor.js:L368-472](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js#L368-L472) (`loadMatchup`).
*   **Commit updates to GitHub**: In [editor.js:L515-567](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js#L515-L567) (`saveToGitHub`).
*   **Note URLs parser**: In [editor.js:L29-44](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js#L29-L44) (`extractUrls`).

### Saved Matchups & General Notes
*   **Load General Notes**: In [editor.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js) (`loadGeneralNotes`).
*   **Load Matchup by Path**: In [editor.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js) (`loadMatchupByPath`).
*   **Toggle Saved Matchup**: In [editor.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js) (`toggleSaveMatchup`).
*   **Render Saved List**: In [editor.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js) (`renderSavedMatchups`).
*   **Sync Draft Directly**: In [editor.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/editor.js) (`syncDraftDirectly`).

---

## 5. Web Concepts Analogy Cheat Sheet

Explain basic frontend terms to the user using these analogies:

| Web Term | Meaning | Metaphor/Analogy |
| :--- | :--- | :--- |
| **DOM** (Document Object Model) | The browser's internal tree structure of the HTML page. | **A house blueprint**. Javascript uses it to find specific rooms (elements) to paint walls (change styling) or build doors (add content). |
| **Event Listener** | A JS trigger that waits for an action (click, keystroke, load) and runs code. | **A tripwire or motion sensor**. When someone walks past (performs an action), it rings a bell (executes a function). |
| **CORS / SOP** | Security checks preventing websites from reading other sites' data. | **A strict office building security guard**. Checks IDs at the door and blocks visitors unless they are explicitly whitelisted on the guest list. |
| **CustomEvents** | Custom notifications sent through the browser window. | **Intercom messages**. One script yells `"ToTampermonkeyBridge"` and the other script hears it. |
| **Base64** | Text-based encoding representing binary data using 64 safe characters. | **A postal code system translation**. Converts special characters into safe ASCII postal codes that won't get scrambled in transit. |
| **Git SHA** | Cryptographic hash code tracking the exact version state of a file. | **A unique digital fingerprint**. If even a single comma changes, the entire fingerprint changes. |
| **Async / Await** | Syntax allowing code to pause and wait for a network call to complete without freezing the browser. | **Ordering at a restaurant**. You place your order (call a Promise), receive a buzzer (the Await handler), and go sit down. You get notified once the food is ready, instead of standing at the counter. |
| **localStorage** | Local key-value database built into the browser. | **A sticky note stuck on your browser's dashboard**. It stays there even if you shut down the PC, until you explicitly peel it off (delete it). |
| **JSON Serialization** | Converting data (like a list of saved matchups) into a single string for storage. | **Packing a suitcase**. You cannot easily ship clothes loose, so you pack them tightly into a single suitcase (serialize to JSON string) to store or mail it, then unpack it on the other side (deserialize with JSON.parse) to wear them again. |
