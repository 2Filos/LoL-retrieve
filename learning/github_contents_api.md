# GitHub Contents REST API & SHA Revision Tracking

To save notes directly into a repository without running a backend server, our portal interacts with the **GitHub Contents REST API**. This guide covers the API structure, how we handle UTF-8 text encoding, and how we track file SHAs to prevent overwrite conflicts.

---

## 1. The GitHub Contents API Endpoint

The GitHub Contents API allows you to retrieve, create, and update file contents via HTTP:

*   **API URL format**: `https://api.github.com/repos/{owner}/{repo}/contents/{path}`
*   **Request Headers**:
    ```http
    Authorization: token GITHUB_PERSONAL_ACCESS_TOKEN
    Accept: application/vnd.github.v3+json
    ```

---

## 2. Base64 Encoding & The UTF-8 JavaScript Bug

GitHub requires all file payloads transmitted via the Contents REST API to be encoded in **Base64**. Base64 is a binary-to-text encoding scheme that represents binary data in an ASCII string format.

### The Problem with JavaScript `atob` and `btoa`
JavaScript has two built-in functions to encode and decode Base64 strings:
*   `btoa()`: Binary-to-ASCII (Encodes a string to Base64).
*   `atob()`: ASCII-to-Binary (Decodes a Base64 string to text).

**Critical Bug**: These functions only support single-byte character sets (Latin-1). If your matchup notes contain multi-byte Unicode characters (e.g. emojis, fancy quotes `’`, accents `á`, or foreign characters), calling `btoa()` directly will **crash the application** with an error:
`Uncaught DOMException: Failed to execute 'btoa' on 'Window': The string to be encoded contains characters outside of the Latin1 range.`

### The Solution: The UTF-8 Translation Hack
To safely encode and decode UTF-8 notes, we pass them through URI components:

#### 1. Safely Encoding Text to Base64:
```javascript
const encodedContent = btoa(unescape(encodeURIComponent(textContent)));
```
*   `encodeURIComponent(text)`: Converts multi-byte characters to percent-encoded URI strings (e.g., `é` becomes `%C3%A9`).
*   `unescape(...)`: Converts the percent escapes into single-byte character representations that `btoa` can parse.
*   `btoa(...)`: Safely encodes the single-byte string into standard Base64.

#### 2. Safely Decoding Base64 to Text:
```javascript
const decodedText = decodeURIComponent(escape(atob(base64Content)));
```
*   `atob(base64Content)`: Decodes Base64 to a single-byte binary string representation.
*   `escape(...)`: Converts single-byte character strings back into percent-encoded strings.
*   `decodeURIComponent(...)`: Restores the percent escapes into their original multi-byte UTF-8 string values.

---

## 3. Git Revision Tracking via File SHAs

To write or overwrite files, GitHub uses **SHA-1 hash checksums** as unique identifiers for file revisions.

```mermaid
graph LR
    User[Update Document Request] --> ValidateSHA{Does local currentSha match remote file SHA?}
    ValidateSHA -- Yes --> Update[GitHub saves edits and returns a new SHA]
    ValidateSHA -- No --> Reject[GitHub rejects with 409 Conflict]
```

### The SHA Constraints:
1.  **Creating a New File**: If the file does not exist on GitHub, you do not need to provide a `sha` field in the request body.
2.  **Updating an Existing File**: If the file exists, you **must** pass the exact matching SHA of the remote file in the body payload:
    ```json
    {
      "message": "Sync: updated matchup notes",
      "content": "BASE64_TEXT_HERE",
      "sha": "d3b07384d113edec49eaa6238ad5ff00b7190280"
    }
    ```
    If you do not provide this field, or if the SHA you send is out-of-date (meaning someone else has pushed updates to the remote file since you loaded it), GitHub rejects the API write with a **409 Conflict** error.

### How Our Code Manages SHAs:
*   When a matchup loads, we save the `sha` tag returned from GitHub into the global `currentSha` variable.
*   When we trigger `saveToGitHub()`, we include `currentSha` in the payload body.
*   Upon a successful save, the GitHub API returns the updated file metadata. We update `currentSha` with the new SHA value returned by the API so that subsequent saves do not conflict.
