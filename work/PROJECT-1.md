# Project 1: YouTube Links, Sync State, and Tab-Split Regression Fixes

## User Direct Instructions
> new project file: there are issues with the youtube links and save to github states. add links sometimes doesn't work, it opens popups i insert everything but no new link appears. under pending local notes there's often some odd behaviour. stuff keeps showing up there even when i click the sync button there located. I think one issue might be that after the split into two "tabs" things got weird. look into these issues, try to understand where the problems are, create a new project file for this, update project present, look into documentation, if information on these topics is already present use it to orient yourself, otherwise as part of the project plan out an expansion of the documentation. I ONLY want you to generate the PROJECT- file and an implementation plan (separate from project file as by antigravity IDE approach). note that i'll have the plan be executed by a lesser AI, so make sure it's bulletproof, clear, detailed, thorough in its understanding of the problem and in its instructions. context continue work on this task until the implementation plan is up to standard

> **Follow-up clarifications (2026-07-13):**
> - Matchups have Plan (left) + Notes (right). General has Notes (left) + VODs (right). Both tabs exist and are actively used.
> - **Both the main Sync GitHub button AND the sidebar Sync button must sync BOTH tabs** for the given matchup/general context in a single click.
> - Links/metadata are intentionally shared across both tabs of a matchup or general context. Metadata lives only in the primary file.
> - The currently loaded matchup should **NEVER** appear in the Pending Local Drafts list, even if it has unsaved changes.
> - Old matchups that were already synced keep reappearing in pending drafts — likely a false-conflict or metadata ghost issue.
> - "Add Link" failure observed on the Garen vs Camille matchup regardless of which tab is selected. Also reports of slow/unreliable GitHub sync ("keeps sending me back to local unsynced").

## Objectives
- [x] **Investigate**: Deep-dive into the six identified bug clusters across `boot.js`, `sync.js`, `storage.js`, and `ui.js`.
- [x] **Goal 1**: Fix the "Add Link" flow so newly created custom metadata links reliably appear in the Links panel after the modal is saved.
- [x] **Goal 2**: Fix the "Pending Local Drafts" sidebar so entries are correctly cleared after the Sync button is clicked and succeeds.
- [x] **Goal 3**: Eliminate false conflict detections that arise from metadata being appended to non-primary tab drafts.
- [x] **Goal 4**: Fix the undefined `localDraft` variable in offline/fallback mode that silently swallows content.
- [x] **Goal 5**: Fix the broken draft-key format mismatch in `renderSavedMatchups()` that prevents YouTube link detection from local drafts.
- [x] **Goal 6**: Make the main "Sync GitHub" footer button sync BOTH tabs (not just the active one), matching the sidebar Sync behavior.
- [x] **Goal 7**: Update documentation to reflect all fixes and the post-tab-split state model.

## Known Ambiguities & Open Questions
- **All critical ambiguities resolved** via user clarification on 2026-07-13.

## Implementation Plan
> The detailed, step-by-step implementation plan is maintained separately in the Antigravity IDE implementation plan artifact. This section provides a high-level roadmap.

### Phase 1: Autosave Metadata Regression (Root Cause)
Fix the autosave handler in `boot.js` so it only appends metadata to drafts of the primary file, matching the behavior of `saveToGitHub()` and `saveDraftBeforeSwitch()`.

### Phase 2: "Add Link" Silent Failure
Ensure `activeMetadata` is always initialized with safe defaults before the modal save logic runs, and persist metadata changes to the primary draft even when editing from a non-primary tab.

### Phase 3: Pending Drafts Persist After Sync
Strip metadata from non-primary file drafts before syncing, and fix the draft-key format mismatch in `renderSavedMatchups()`.

### Phase 4: Undefined Variable in Offline Mode
Replace the three occurrences of `localDraft` with `localDraftText` in `sync.js`.

### Phase 5: Main Sync Button — Sync Both Tabs
Refactor `saveToGitHub()` in `sync.js` to also sync the other tab's draft (the one not currently displayed in the editor) after the primary sync succeeds.

### Phase 6: Documentation Updates
Update `documentation/html_editor.md`, `AGENTS.md`, and `GEMINI.md` to document the metadata-primary-only rule and the tab-split state model post-fixes.

## Addressed Ambiguities / Design Decisions
- **2026-07-13**: Confirmed that the plan/notes two-tab system uses `activePageSide` ('left'/'right') rather than the originally planned `activePageType` ('notes'/'plan'/'vod'). The implementation diverged from `plan_editor_pages.md`, dropping the separate left/right toggle groups in favor of a single two-button toggle.
- **2026-07-13**: The `plan_editor_pages.md` originally proposed separate SHA tracking per page type. This was never implemented — `currentSha` is reset on every `loadMatchupByPath()` call (sync.js L104), meaning SHAs are inherently per-tab. This is correct behavior and not a bug.
- **2026-07-13**: User confirmed: main Sync GitHub button must sync BOTH tabs in one click. The currently loaded matchup must NEVER appear in the pending drafts list. Metadata is intentionally shared across tabs.
- **2026-07-13**: VOD tab is NOT used for matchups (only for General Notes as Notes-vod.md). The `-vod` suffix should remain in the codebase for the General context only.

## Changelog / Status
- 2026-07-13 - Created project plan. Five bug clusters identified and root-caused via source code analysis.
- 2026-07-13 - User clarification round. Added Goal 6 (main Sync button syncs both tabs). Resolved all ambiguities. Updated implementation plan.
- 2026-07-13 - Executed Phases 1-6. Tab regression and link sync issues resolved.
- 2026-07-13 - Discovered and fixed "Stuck Drafts" bugs (cache-busted GET SHAs, and empty string falsy check bypass).
- 2026-07-13 - Added centralized debugging toggle (`js/debug.js`) and finalized documentation (`sync_and_youtube_systems.md` and `debugging.md`). Project closed.

## Updates to Documentation
- **Completed**: `documentation/html_editor.md` — Documented the metadata-primary-only autosave rule, the relationship between `activePageSide` and metadata ownership, the corrected draft-key format, and the dual-tab sync behavior.
- **Completed**: `AGENTS.md` and `GEMINI.md` — Added new rules about the metadata-primary-only constraint and dual-tab sync requirement.
- **Completed**: Added `documentation/sync_and_youtube_systems.md` and `documentation/debugging.md` for architectural reference.
