# Lesson 6: Sync and GitHub Flow

This lesson explains how the app moves the editor content from the local browser to GitHub.

The big idea is that the editor can work locally first, and then sync that content to a remote repository when the user chooses to do so.

This is also a good place to notice that the app is intentionally manual about syncing. The project does not auto-push every keystroke. The user triggers sync deliberately, which keeps the workflow more controlled.

### What to look for in the real file
In [api.js](../api.js) and [editor.js](../editor.js), look for the place where the sync action is triggered and the place where the request is prepared. That is where the local editor turns into a remote update.

---

## 1. Why syncing matters

A local draft is useful, but it is still only stored in the browser.

If the user wants the note to be preserved in a shared repository, the app needs a way to send that content somewhere else.

That is what the sync flow does.

It turns local work into a remote file update.

---

## 2. What the app is syncing

The app is syncing matchup notes.

Those notes are stored as text content.

When the user saves or syncs a file, the app sends the current content to GitHub so that the repository contains the latest version.

---

## 3. What GitHub API is involved

The app talks to the GitHub Contents API.

That API is used for reading and updating repository files.

In this project, it is part of the network layer that handles repository communication.

So the app does not just write to the browser. It also talks to GitHub over the network.

---

## 4. Why the app needs a token

To update files on GitHub, the app needs authorization.

That authorization is usually provided through a personal access token.

The token is a credential that proves the app is allowed to interact with the repository.

Without a valid token, the sync step cannot succeed.

---

## 5. What is a repository

A repository is a place where files are stored and versioned.

In this project, the repository holds the matchup note files.

That means the app is acting like a local editor for files that also live remotely.

---

## 6. What is a file path

Each matchup note is stored under a specific path.

That path tells the app where the file lives in the repository.

This is important because the app needs to know which file it is editing and which file it should update.

---

## 7. Why the app uses Base64

When content is sent to GitHub, it is often encoded as Base64.

Base64 is a way of converting text into a safe representation for transport.

The reason is that GitHub’s contents API expects file content in that form.

So the app takes the note text, converts it, and sends it in encoded form.

---

## 8. What is a SHA

A SHA is a hash value that represents the current version of a file.

It works like a fingerprint.

If the file changes even a little, the SHA changes too.

The app uses the SHA to avoid overwriting the wrong version of a file.

This is important when the local draft and the remote file have both changed.

---

## 9. Why the SHA matters for conflicts

If the app tries to upload a new version without knowing the latest remote version, it could overwrite someone else’s change.

So the app keeps track of the current SHA and sends it with the new content.

That helps GitHub verify that the update is still based on the correct version.

---

## 10. What happens when the user clicks sync

A typical sync flow looks like this:

1. the user clicks the sync button
2. the app gathers the current note content
3. it prepares the request body
4. it includes the current SHA
5. it sends the request through the network layer
6. GitHub responds with the updated file information
7. the app updates its state and clears the local draft if appropriate

This is the end-to-end save flow from the editor to the remote repository.

---

## 11. The role of the API layer

The sync logic is not directly implemented in the visible editor interface.

Instead, the app uses an API layer that handles the networking details.

That layer is responsible for:
- building requests
- sending them to GitHub
- handling responses
- checking authorization
- passing the result back to the editor logic

This separation keeps the UI code cleaner and the network behavior more organized.

---

## 12. What this teaches you about the app architecture

This lesson shows that the app is built in layers.

There is:
- the visible editor UI
- the logic that manages editor state
- the API layer that handles network requests
- the remote repository that stores the actual files

That layered architecture is one of the most important ideas in the project.

---

## 13. What to remember

The main ideas from this lesson are:
- syncing moves local work into a remote repository
- GitHub needs authorization through a token
- the app uses the GitHub contents API
- Base64 is used for safe file content transport
- the SHA helps prevent overwrite conflicts
- the API layer handles network communication separately from the UI

---

### Bridge to the project
- Read [api.js](../api.js#L56-L85) and [api.js](../api.js#L105-L140) to see how the bridge request is set up before the GitHub call is made.
- Take another look at [api.js](../api.js#L188-L207) and compare that network flow with the deeper explanation in [learning/github_contents_api.md](github_contents_api.md).

## 14. Practice question

Try to explain these in your own words:
- Why does the app need to sync content to GitHub?
- What is a SHA and why does it matter?
- Why is Base64 used in the sync process?
- What role does the API layer play?

If you can answer those, you are ready for the next lesson.
