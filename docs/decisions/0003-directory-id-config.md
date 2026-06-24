# 0003 - Directory ID Is The Configured Entry Locator

Date: 2026-06-23

## Status

Accepted, amended by 0006-default-visible-projects

## Context

The previous directory configuration used `spaceId` plus a slash-delimited path. Loading walked the tree segment by segment and matched folder names exactly.

Name-path matching is fragile when folders are renamed, contain whitespace differences, or have duplicate names under different parents.

## Decision

Use directory ID as the configured locator for directory entries.

The settings UI stores only:

- `directoryId`: the folder ID to load
- `name`: optional display label

When `directoryId` is present, the hub loads child folders directly with `getChildFiles(directoryId)`. If `name` is empty, the app resolves a display name from `batchGetMeta(directoryId)` when possible.

The original fallback for an empty `directoryId` was the personal root. This was changed by `0006-default-visible-projects`: an empty `directoryId` now means the current user's visible project list from `findAllProjects`.

## Consequences

- Directory lookup is stable across renames.
- Duplicate folder names no longer affect configured entries.
- Legacy `spaceId` and `path` fields are normalized out of persisted config.
- Existing old path-only entries cannot be losslessly converted to directory IDs and fall back to the personal root until reconfigured.
