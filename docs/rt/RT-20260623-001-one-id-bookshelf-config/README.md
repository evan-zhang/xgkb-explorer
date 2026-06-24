# RT-20260623-001 — One-ID Bookshelf Configuration

Status: Draft / Awaiting confirmation
Created: 2026-06-23
Owner: xgkb-explorer

## Problem

Current bookshelf configuration asks users to enter both:

1. knowledge-base space/project ID (`spaceId`), and
2. directory path (`path`, e.g. `Obsidian/projects`).

This is too hard for normal users. It assumes users understand the Open API's distinction between project/space IDs and folder paths. In practice, users want to paste one identifier and have the app show that bookshelf.

## Goal

Allow adding a bookshelf with **one ID** instead of `spaceId + path`.

The one ID should represent the bookshelf entry point. The app should resolve what kind of ID it is and load the right folder/project contents automatically.

## Proposed Product Behavior

When adding a bookshelf, the user enters:

- name: optional display name
- bookshelf ID: required single identifier

The app auto-detects the ID type:

1. Try as folder ID: `getChildFiles(id)`
   - If success, treat ID as a folder-root bookshelf.
   - The bookshelf projects are that folder's child folders.
2. If folder lookup fails, try as space/project ID: `getLevel1Folders(id)`
   - If success, treat ID as a project-root bookshelf.
   - The bookshelf projects are top-level folders in that space/project.
3. If both fail, show a clear validation error.

The default personal bookshelf can still use the AppKey-derived personal project ID with no explicit ID.

## Non-goals

- Do not remove backward compatibility for existing `spaceId + path` configs in this RT.
- Do not change file preview behavior.
- Do not change server deployment or Caddy config.

## Compatibility Requirements

Existing saved configs must keep working:

```ts
interface SpaceEntry {
  id: string;
  name: string;
  spaceId: string;
  path: string;
}
```

New config should be schema-compatible and migratable, for example:

```ts
interface SpaceEntry {
  id: string;
  name: string;
  spaceId: string;       // legacy
  path: string;          // legacy
  entryId?: string;      // new one-ID bookshelf root
  entryKind?: 'auto' | 'folder' | 'project';
}
```

## Open Questions

1. Should the one ID be described to users as “书架 ID”, “入口文件夹 ID”, or “知识库/目录 ID”？
2. Should the default personal bookshelf still show root folders with no ID, or should all new bookshelves require an ID?
3. If an entered ID resolves as both project and folder in edge cases, which should win?

## Acceptance Criteria

- A user can create a new bookshelf by entering only one ID.
- The UI no longer requires separate `spaceId` and `path` for the main path.
- Existing saved space/path configurations still load.
- ID validation gives actionable errors.
- Switching between old-style and new-style bookshelves works without page reload.
- `npm run build` passes.
- Browser smoke test covers:
  - default personal bookshelf
  - one-ID folder bookshelf
  - one-ID project/space bookshelf if available
  - invalid ID error
