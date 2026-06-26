# 0008 - Directory Picker For Configured Entries

Date: 2026-06-26

## Status

Accepted.

## Context

Settings previously required users to type a `directoryId` when adding a configured directory entry. That is stable for storage, but it exposes an implementation detail and raises the setup bar for non-technical users.

The app already has the APIs needed to browse the user's visible spaces and child folders:

- `findAllProjects` for visible spaces.
- `getLevel1Folders(projectId)` for the first folder level under a space.
- `getChildFiles(directoryId)` for nested folders.

## Decision

Keep `directoryId` as the persisted locator, but make the primary settings flow a directory tree picker.

The picker loads folders lazily:

- Root nodes are visible spaces.
- Expanding a space loads first-level folders.
- Expanding a folder loads child folders.
- Only folder nodes can be selected as configured entries.

Manual `directoryId` input remains as an advanced fallback.

## Consequences

- Normal users can add entries by selecting a folder instead of copying IDs.
- The persisted config remains stable across folder renames.
- The picker must handle loading, empty, error, duplicate, and permission-loss states.
- Tree loading should be cached per modal session and avoid preloading a full large tree.
