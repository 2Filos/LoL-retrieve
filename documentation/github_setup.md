# GitHub Setup & Authentication

This document explains how the matchup editor authenticates with GitHub using a Personal Access Token (PAT) and how to configure your repository settings.

## 1. The Target Repository

The editor is designed to pull files from and save files to a specific GitHub repository. By default, this is set to:
`2Filos/LoL-retrieve`

### File Structure on GitHub
All matchup files are organized in a directory structure:
*   **Matchup Notes**: `matchups/{EnemyKey}/{MyKey}.md` — The primary notes file for a specific matchup.
*   **Matchup Plans**: `matchups/{EnemyKey}/{MyKey}-plan.md` — An optional companion plan file for the same matchup (accessed via the "Plan" tab).
*   **General Notes**: `Notes.md` — A standalone notes file at the repository root.
*   **General VODs**: `Notes-vod.md` — A standalone VOD reference file at the repository root (accessed via the "VODs" tab on General Notes).
*   **YouTube Index**: `youtube_links.json` — A global mapping of `{EnemyKey}_{MyKey}` to YouTube VOD URLs, auto-synced when saving matchups containing YouTube links.

## 2. Generating a GitHub Personal Access Token (PAT)

Because the editor modifies files in your repository, it requires write access. You must generate a token with the appropriate scopes:

1.  Log in to your GitHub account.
2.  Navigate to **Settings** -> **Developer Settings** -> **Personal Access Tokens**.
3.  You can use either **Fine-grained tokens** or **Tokens (classic)**:
    *   **Fine-grained tokens (Recommended)**:
        *   Give it a name and expiration date.
        *   Under **Repository access**, select **Only select repositories** and choose your matchup repository (e.g., `LoL-retrieve`).
        *   Under **Permissions** -> **Repository permissions**, find **Contents** and set it to **Read and write**.
    *   **Tokens (classic)**:
        *   Select the **repo** scope (which grants full control of private and public repositories).
4.  Click **Generate token** and copy it immediately. *You will not be able to see it again.*

## 3. Local Configuration (`config.js`)

Create a file named [config.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/config.js) in the root directory. Paste the following template and replace the placeholders with your actual details:

```javascript
// config.js
const CONFIG = {
    GITHUB_TOKEN: "your_github_token_here",
    GITHUB_REPO: "owner/repo" // e.g., "2Filos/LoL-retrieve"
};
```

> [!WARNING]
> The [config.js](file:///c:/Users/User/Documents/VSC/LoL-retrieve/config.js) file contains sensitive credentials. It is added to the [.gitignore](file:///c:/Users/User/Documents/VSC/LoL-retrieve/.gitignore) file to ensure you never accidentally commit your token to GitHub.

## 4. Token Validity Verification

When you open [matchups.html](file:///c:/Users/User/Documents/VSC/LoL-retrieve/matchups.html), the editor performs a security and credentials check:
1.  It sends a request to `https://api.github.com/user` using the provided token.
2.  If the token is valid, the UI elements (input fields and buttons) are unlocked.
3.  If the token is expired (e.g., after the expiration limit you set on GitHub) or invalid, the editor shows a warning banner and blocks input to prevent data loss.

## 5. YouTube Links Index (`youtube_links.json`)

The editor maintains a global YouTube links index file on GitHub at `youtube_links.json`. This file maps matchup keys to YouTube VOD URLs, enabling the Saved Matchups sidebar to show active YouTube icons even for matchups that haven't been opened recently.

### How It Works
1.  **On Boot**: The editor fetches `youtube_links.json` from GitHub, caches its content in `localStorage` (`youtube_links_index`), and stores its SHA for future updates.
2.  **On Save**: After successfully saving a matchup to GitHub, the editor checks if a YouTube link exists in the saved content (from custom metadata links or raw markdown text). If the link is new or changed compared to the index, the editor automatically PUTs an updated `youtube_links.json` to GitHub.
3.  **On Render**: The Saved Matchups sidebar reads from the cached index to determine which matchups should display active (red) vs inactive (grey) YouTube icons.
