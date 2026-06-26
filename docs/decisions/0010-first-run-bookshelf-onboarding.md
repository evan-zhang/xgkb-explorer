# 0010 - First Run Requires Bookshelf Directory Selection

Date: 2026-06-26

## Status

Accepted.

## Context

The previous default config created a `personal` entry with an empty `directoryId`, which made fresh users land directly on the visible-space list. That exposed all spaces before the user had chosen a bookshelf directory.

## Decision

Fresh config now starts with an empty `spaces` list and an empty `activeSpaceId`.

When a logged-in user has no configured bookshelf entries, the app shows a first-run onboarding view with a directory picker entry point. Selecting a folder saves that folder's `directoryId` as the first bookshelf entry and switches directly into the bookshelf view.

Settings also allows zero bookshelf entries. Deleting the last entry returns the app to the same onboarding state after save.

## Consequences

- Fresh users no longer see the full visible-space list as the main screen.
- The visible-space API is still used inside the directory picker so users can browse to the folder they want.
- Manual entry creation requires a concrete `directoryId`; an empty value is not offered as a new-entry shortcut.
- Existing saved entries remain readable, including legacy empty-directory entries if they already exist in localStorage.
