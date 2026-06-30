# HTML Frontend & State Management

This document details the structure, behavior, and lifecycle events of the frontend editor page ([matchups.html.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html.html)).

## 1. UI Elements & Layout

The editor interface consists of:
*   **Security Error Banners**: Banners that alert the user to configuration issues (missing `config.js` or expired GitHub tokens).
*   **Input Fields**: A text input to type the matchup file name (e.g. `garen-vs-darius`) and a button to load/bind the file. These are disabled by default until authentication succeeds.
*   **Editor Panel**: A large `<textarea>` where content is read and modified.
*   **Status Bar**: Displays immediate feedback (e.g. "Initializing...", "Loaded successfully!", "Typing...", "Changes safely saved online!").

## 2. Page Lifecycle

### A. Initialization
When the page loads:
1.  It attempts to import `config.js`. If `config.js` fails to load, `handleConfigMissing()` is called, disabling the UI and displaying a configuration error banner.
2.  `window.onload` triggers `checkTokenValidity()`, sending a request to the GitHub user API via the bridge.
3.  On success, the token success message is shown and the input fields are unlocked.

### B. Loading a Matchup (`loadMatchup`)
1.  The user inputs a matchup name. The editor appends `.txt` if it's not already present.
2.  The editor requests the file data from the GitHub API repository contents endpoint:
    `https://api.github.com/repos/{repo}/contents/{filename}.txt`
3.  **If the file exists (Status 200)**:
    *   GitHub returns the content encoded in Base64.
    *   The editor decodes it using safe UTF-8 conversion: `decodeURIComponent(escape(atob(data.content)))`.
    *   The editor updates `currentSha` with the file's SHA hash (critical for future saves).
    *   The text is loaded into the editor, and the textarea is enabled.
4.  **If the file does not exist (Status 404)**:
    *   The editor enters "new file creation" mode.
    *   `currentSha` is set to `null`.
    *   The textarea is cleared and enabled.

### C. Editing and Debounced Autosave
To prevent spamming the GitHub API with requests on every keystroke, the editor uses a debouncing mechanism:
1.  An event listener monitors `input` events on the `<textarea>`.
2.  When the user types, any pending autosave timer is cancelled (`clearTimeout(autoSaveTimeout)`).
3.  A new timer is scheduled to run `saveToGitHub()` after **1.5 seconds (1500ms)** of typing inactivity.

### D. Saving to GitHub (`saveToGitHub`)
1.  The text content is encoded to Base64: `btoa(unescape(encodeURIComponent(textContent)))`.
2.  A JSON body is created containing:
    *   `message`: Commit message (`Automated sync: updated {filename}`)
    *   `content`: The Base64 string.
    *   `sha`: The `currentSha` of the existing file (omitted if creating a new file).
3.  A `PUT` request is dispatched via the bridge.
4.  Upon a successful response:
    *   GitHub returns the updated file metadata, including a new SHA.
    *   The editor updates `currentSha` with the new SHA. This ensures subsequent autosaves do not trigger a merge conflict error.
