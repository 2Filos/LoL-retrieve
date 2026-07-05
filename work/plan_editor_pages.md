# Plan: Multi-Page Editor (Plan / Notes / VODs)

**Status:** Planning  
**Created:** 2026-07-05

---

## Problem Statement

Currently, the matchup editor has a single text area that edits one file per matchup (`matchups/{EnemyKey}/{MyKey}.md`). Users want to split their matchup knowledge into multiple conceptual "pages" per matchup:

1. **Plan** — Reflective, miscellaneous notes about a matchup (game plans, strategies, theory-crafting).
2. **Notes** — Condensed, quick-reference notes (the existing `.md` files).
3. **VODs** — VOD review notes (timestamps, observations from replays).

Each page maps to a separate markdown file on GitHub:
- `{MyKey}.md` → Notes (existing)
- `{MyKey}-plan.md` → Plan (new)
- `{MyKey}-vod.md` → VODs (new)

---

## UI Design

### Tab Bar (between editor header and textarea)

Two **toggle button groups** placed between the portraits/conflict-banner row and the textarea:

```
┌────────────────────────────────────────────────────────────────────┐
│  [Garen portrait] VS [Riven portrait] ★   ⚠ Conflict: [L] [G]   │
├────────────────────────────────────────────────────────────────────┤
│   [Plan] [Notes]                              [Notes] [VODs]      │ ← NEW TAB BAR
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   textarea content here...                                         │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

**Layout changes:**
- Move conflict banner to the LEFT of the editor header.
- Two toggle groups sit side-by-side on a new row.
- Active tab: darker background (subdued, not bright).
- Inactive tab: slightly brighter/lighter background, but NOT as bright as the teal Sync button.

### Persistence
- Firefox remembers which tab was last active via `localStorage`.
- On load, restores the last active tab per toggle group.

---

## File Structure Impact

For a matchup like `Garen vs Riven`:

```
matchups/
  Riven/
    Garen.md          ← Notes (existing)
    Garen-plan.md     ← Plan (new)
    Garen-vod.md      ← VODs (new)
```

---

## State Management

### New global variables needed:
- `activePageType` — which page type is currently displayed: `'notes'`, `'plan'`, or `'vod'`
- Separate SHA tracking per page type within the active matchup

### localStorage keys:
- `editor_active_page_left` — last selected left toggle (`'plan'` or `'notes'`)
- `editor_active_page_right` — last selected right toggle (`'notes'` or `'vods'`)
- Draft keys follow pattern: `draft_matchup:{EnemyKey}/{MyKey}` (notes), `draft_matchup:{EnemyKey}/{MyKey}-plan` (plan), `draft_matchup:{EnemyKey}/{MyKey}-vod` (vod)

### Path resolution:
- Notes: `matchups/{EnemyKey}/{MyKey}.md`
- Plan: `matchups/{EnemyKey}/{MyKey}-plan.md`
- VODs: `matchups/{EnemyKey}/{MyKey}-vod.md`

---

## Open Questions

1. **Conflict banner placement**: Move to left of header row vs. move to its own row above the tab bar?
2. **General Notes behavior**: Should the Plan/Notes/VODs tabs appear for General Notes too, or only for champion matchups?
3. **Draft rendering in sidebar**: Should the sidebar drafts list show which page type a draft belongs to (e.g., "Garen vs Riven (Plan)")?

---

## Implementation Phases

### Phase 1: Tab Bar UI
- Add HTML structure for the two toggle groups
- Add CSS styles for tab buttons (active/inactive states)
- Wire up localStorage persistence for tab selection

### Phase 2: Multi-File Loading
- Modify `loadMatchup()` / `loadMatchupByPath()` to accept page type
- Resolve correct GitHub path based on active tab
- Track separate SHAs per page type

### Phase 3: Draft System Updates
- Update draft key patterns to include page type suffix
- Update `getLocalDrafts()` to parse new key format
- Update `renderLocalDrafts()` to show page type labels

### Phase 4: Sync & Conflict Updates
- Ensure `saveToGitHub()` uses the correct path for active page type
- Handle conflicts per-page independently
- Update `syncDraftDirectly()` for new key patterns

---

## Files Affected
- `matchups.html` — Tab bar HTML, conflict banner repositioning
- `components.css` — Tab button styles
- `sync.js` — Path resolution, SHA tracking per page
- `storage.js` — Draft key patterns, rendering labels
- `boot.js` — Tab state restoration, global variables
- `ui.js` — Tab switching handlers
