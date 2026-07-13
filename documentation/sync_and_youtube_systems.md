# Sync and YouTube Indexing Subsystems

This document explains the architecture behind the editor's GitHub synchronization capabilities, conflict resolution systems, and global YouTube indexing feature.

## 1. Dual-Tab Synchronization

Because the editor natively supports a split-view paradigm (Matchups have `Notes` and `Plan`, General has `Notes` and `VODs`), the sync system must handle pushing state for two independent files under the hood.

### The Problem
Users intuitively expect that hitting the footer "Sync GitHub" button while viewing a matchup will save *all* work related to that matchup, regardless of which tab they are currently viewing. If they edit the Plan, swap to Notes, and hit Sync, they expect the Plan edits to sync too.

### The Implementation (`js/sync.js`)
When `saveToGitHub()` is invoked:
1. **Primary Sync**: It syncs the currently active tab (the one the user is looking at). It pulls the current SHA, updates the file, and clears its local draft cache.
2. **Secondary Sync (Dual-Tab)**: It automatically calculates the `otherSide` of the current view (e.g. if looking at Notes, it calculates Plan). It uses `resolvePagePath` to find the secondary file's draft in `localStorage`. 
3. If a draft exists, it safely strips metadata (to enforce the Metadata-Primary-Only rule) and pushes the secondary draft to GitHub in the background.

## 2. Local Drafts and Stale SHA Caching

The `storage.js` module handles the "Pending Local Drafts" sidebar. This sidebar allows users to sync drafts that they abandoned without clicking "Sync GitHub".

### Cache-Busting Requirement
A major issue identified with the GitHub API (`bridgeFetch`) is aggressive browser caching of `GET` requests. 
When a user clicks "Sync" on a local draft, the system must perform a `GET` request to fetch the latest `SHA` of the file, followed by a `PUT` request to update it.

If the browser caches the `GET` request, the editor will send an outdated `SHA` to GitHub, resulting in a silent `409 Conflict` error, causing the draft to become permanently stuck in the sidebar.
**Rule**: All `GET` requests used to fetch `SHA`s prior to a `PUT` MUST append `?t=${Date.now()}` and use `no-cache` headers.

## 3. Empty Draft Preservation
If a user deletes all text from a secondary tab (like Plan), the draft becomes an empty string (`""`). 
To ensure this deletion is synced to GitHub, iteration blocks evaluating local drafts must explicitly check `if (textContent === null) continue;`. Checking `if (!textContent)` is unsafe, as it treats empty strings as falsy and silently abandons the sync process.

## 4. YouTube Indexing (`youtube_links.json`)

The editor maintains a global index of all YouTube links attached to matchups, which drives the "Play" buttons on the sidebar.

### Extraction Logic
1. It first checks `activeMetadata.linkOrder` and `activeMetadata.customLinks` for any URL containing `youtube.com` or `youtu.be`.
2. If no link is found in metadata, it falls back to parsing the raw markdown text with a regex.

### The Shared Index
When a sync occurs, `sync.js` cross-references the extracted link against the `youtube_links_index` stored in `localStorage`.
If the link has changed, it updates the local index, translates it to JSON, and pushes `youtube_links.json` to the root of the GitHub repository.

### Sub-Page Protection Guard
If a user is saving a sub-page (like Plan or VODs) and no YouTube link is found, the system *does not* delete the link from the global index. This protects against the index being accidentally wiped because the link was defined in the `Notes` tab but the user synced from the `Plan` tab.
