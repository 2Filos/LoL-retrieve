# GitHub Setup & Authentication

This document explains how the matchup editor authenticates with GitHub using a Personal Access Token (PAT) and how to configure your repository settings.

## 1. The Target Repository

The editor is designed to pull files from and save files to a specific GitHub repository. By default, this is set to:
`2Filos/LoL-retrieve`

All matchup text files (e.g., `ryu-vs-ken.txt`) are stored at the root of this repository.

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
