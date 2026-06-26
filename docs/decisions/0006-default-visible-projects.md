# 0006 - Default Entry Shows Visible Projects

Date: 2026-06-24

## Status

Superseded by 0010.

## Context

After DingTalk/Cwork login, the app has a user-scoped token and can query the projects visible to that user. The previous default entry treated an empty `directoryId` as the personal project root, which hid other spaces unless the user configured a directory manually.

## Decision

Use `document-database/project/findAllProjects?nameKey=&bizCode=ordinary&appCode=kz_doc` for the default entry when `directoryId` is empty.

The returned projects are displayed as space cards with `entryKind: "space"` in the API response order. Space cards do not expose project actions such as share or favorite. Selecting one loads its first-level folders through `getLevel1Folders(projectId)` and shows those folders as bookshelf candidates. Clicking a candidate saves that folder ID into `spaces` as a configured bookshelf entry and switches the active entry to it.

Configured non-empty `directoryId` entries continue to load direct child folders through `getChildFiles(directoryId)` and are marked with `entryKind: "folder"`.

## Consequences

- Fresh users see all spaces visible to their login token without opening settings.
- The default visible-space list preserves backend ordering instead of applying update-time sorting or starred grouping.
- Space cards are a navigation layer; first-level folders under a space are candidates for adding to the bookshelf.
- The default config label changes from "个人书架" to "全部空间".
- Project-root cards must not be treated as folder IDs.
- `getPersonalProjectId` remains available for compatibility but is no longer required for default startup.
