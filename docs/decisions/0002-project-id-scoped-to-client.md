# 0002 - Project ID Is Scoped To The API Client

Date: 2026-06-23

## Status

Accepted

## Context

The personal project id returned by `getPersonalProjectId` is user-specific. When the AppKey changes, a previously loaded project id can belong to a different user.

Using a stale project id with a new AppKey can make the UI look empty even when both AppKeys are valid.

## Decision

Treat `projectId` as derived state owned by the active `KbApiClient`.

When AppKey or server URL changes and a new client is created, invalidate the existing personal project id and load it again before querying folders.

## Consequences

- AppKey switching is safe across users.
- Project hub loading must wait for a valid personal project id only when the active directory entry has an empty `directoryId`.
- Future config changes that replace the client must preserve this invalidation behavior.

