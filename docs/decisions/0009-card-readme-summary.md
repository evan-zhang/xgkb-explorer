# 0009 - Bookshelf Cards Use README Summary

Date: 2026-06-26

## Status

Accepted.

## Context

Bookshelf cards previously fell back to "暂无简介" when no summary was available. Directory entries can include a `README.md` file in their default directory, which is a better source for the card summary.

## Decision

For folder-backed bookshelf cards, load the card summary from a `README.md` file directly under that folder. Resolve the file bytes through `getDownloadInfo(readmeId).downloadUrl` and browser `fetch`, because `getFullFileContent` is no longer a valid source for this card summary path. If `README.md` is absent or unreadable, show "暂无简介".

Project-root space navigation cards remain navigation-only and do not need a README summary.

## Consequences

- Users can control card summaries by editing `README.md` in the corresponding directory.
- The lookup stays local to the card's folder and does not recursively scan descendants.
- The summary path uses the same download-info contract as file preview instead of the invalid full-content API.
- Missing README files retain the existing "暂无简介" fallback.
