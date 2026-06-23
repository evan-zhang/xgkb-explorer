# RT Status — One-ID Bookshelf Configuration

status: implemented-on-main / docs-updated
created: 2026-06-23
updated: 2026-06-23

## Summary

The product direction was to reduce bookshelf configuration from `spaceId + path` to a single directory entry ID. The current main branch already implements this as `SpaceEntry.directoryId`:

- empty `directoryId` = personal root, resolved through `getPersonalProjectId()` + `getLevel1Folders(projectId)`
- non-empty `directoryId` = directory-root bookshelf, resolved through `getChildFiles(directoryId)`
- optional display name can be auto-derived with `batchGetMeta(directoryId)` when available

## Current Phase

Implementation exists on main. AODW project docs and module docs have been updated to reflect current code.

## Remaining Follow-up

- Browser smoke test after next deploy.
- Confirm whether a project/space ID mode is still needed, or if directory ID is sufficient.
