# 0013 Bookshelf Directory Items Include Files

Date: 2026-07-02

## Status

Accepted.

## Context

When a user configures a concrete directory as a bookshelf entry, the bookshelf previously displayed only child directories. Files directly under that directory were filtered out, so users could not see or preview them from the bookshelf UI.

## Decision

- A configured bookshelf directory represents all immediate children under that directory.
- The bookshelf UI must display both child directories and child files.
- Clicking a directory card opens the directory detail view.
- Clicking a file card opens the file preview directly.
- Share-page bookshelf views follow the same item behavior.

## Consequences

- Existing directory-only bookshelf behavior becomes more complete and matches the actual directory contents.
- The bookshelf count is treated as item count rather than only project count for configured directory entries.
