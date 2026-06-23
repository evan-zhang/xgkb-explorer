# Implementation Plan

## Phase 1 — Schema & Resolver

1. Extend `SpaceEntry` in `src/lib/config.ts` with optional:
   - `entryId?: string`
   - `entryKind?: 'auto' | 'folder' | 'project'`
2. Add a resolver helper in `src/lib/hooks.ts` or `src/lib/api.ts`:
   - input: `entryId`, `personalProjectId`, legacy `spaceId/path`
   - output: `{ rootKind, rootId, files }`
3. Precedence:
   - if `entryId` exists: use one-ID resolver
   - else use legacy `spaceId/path`
   - else default personal root

## Phase 2 — Config UI

1. Replace the primary add-book form with:
   - Name
   - Bookshelf ID
2. Hide legacy `spaceId/path` fields behind an “高级设置 / legacy mode” disclosure.
3. Add validation button/state: “检测 ID”.
4. Store `entryId` and `entryKind: 'auto'`.

## Phase 3 — Project Loading

1. Update `useProjectsHub` to accept active `SpaceEntry` or new resolver fields.
2. For folder-root bookshelf, use `getChildFiles(entryId)` and show child folders as projects.
3. For project-root bookshelf, use `getLevel1Folders(entryId)`.
4. Keep README/project-card preview behavior unchanged.

## Phase 4 — Verification

1. `npm run build`
2. Manual browser smoke tests:
   - old personal root
   - new folder ID bookshelf
   - new project ID bookshelf
   - invalid ID
3. Confirm localStorage old config migrates and still appears.

## Rollback

Because this only changes client-side schema and loading logic, rollback is reverting the commit. Existing old fields remain preserved.
