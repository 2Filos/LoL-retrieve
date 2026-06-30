# Roadmap: Mobalytics Matchup Notes Scraper & Side-by-Side Sync

This document plans the feature roadmap for integrating external Mobalytics champion counter notes into the local Matchup Portal workspace.

## Objectives
1. Create a local `/moba` folder to store retrieved counter notes for all enemy champions.
2. Expand the editor interface in `matchups.html` to support a side-by-side split screen view:
   - **Left Column**: Personal Matchup Notes (editable, synced to `matchups/{Enemy}/{Mine}.md` on GitHub).
   - **Right Column**: Mobalytics Strategy & Power Spikes notes (read-only, loaded from local `/moba/{Enemy}.md` or retrieved via background bridge fetches).
3. Implement a background checker that detects changes to Mobalytics counter pages when you select a champion.

---

## Technical Design: Phase 1 (Local Storage & Layout)

### Directory Mapping
- We will store Mobalytics counter content under `moba/{EnemyKey}.md`. E.g., `moba/Sett.md`.
- These markdown files contain fixed sections:
  - **Laning Against [Champion]**
  - **Strategy VS [Champion]**
  - **Power Spikes**

### Sidebar or Panel Integration
```
+--------------------------------------------------------+
|                      Header Banner                     |
+-------------------+------------------------------------+
|  Champion Select  |              Matchup Editor        |
|  [Ahri] vs [Yasuo] +------------------+-----------------+
|                   |  Personal Notes  |  Mobalytics     |
|  Pending Drafts   |                  |  (Read-only)    |
|  - Ahri vs Yasuo  |  - play safe     |  - avoid her E  |
|                   |  - farm under Q  |  - trade on CD  |
+-------------------+------------------+-----------------+
```

---

## Technical Design: Phase 2 (Background Sync & Scraper)

### Check on Select
- When loading a matchup (e.g. versus Sett), the browser page dispatches a background request to fetch the counter data from:
  `https://mobalytics.gg/lol/champions/sett/counters`
- Since direct fetches will be blocked by CORS, we can route it through the Tampermonkey bridge (`GM_xmlhttpRequest`).
- The script parses the HTML response using DOMParser:
  - Extracts text under `Laning Against Sett`, `Strategy VS Sett`, and `Sett Power Spikes`.
- Compares the parsed text with the local cached copy:
  - If it differs (or is missing), it updates the local file on GitHub under `moba/sett.md` (or saves to localStorage first) and notifies the user with a notification badge.
