# 0007 - Self Preview Uses Download Info URL

Date: 2026-06-24

## Status

Accepted

## Context

The file content extraction API `document-database/file/getFullFileContent` can return 404 or otherwise fail for preview use cases. For self-render preview, the knowledge-base service now expects the app to call `document-database/upDownload/getDownloadInfo?fileId=...&forceDownload=false` and use the returned `downloadUrl` as the preview address.

## Decision

- File preview self mode calls `getDownloadInfo(fileId)` with default `forceDownload=false`, fetches the returned `downloadUrl`, and opens a Blob URL for browser preview.
- Markdown files are rendered into a styled HTML document Blob URL after fetching the file text, so the new preview tab has a reloadable URL instead of an `about:blank` document.
- The file grid "open in new tab" self-mode path uses the same Blob URL strategy.
- File clicks in the project detail view reuse the same new-tab opening strategy instead of opening an in-app modal.
- `getFullFileContent` remains available for text extraction scenarios such as README/index card summaries.

## Consequences

- Self preview no longer calls `getFullFileContent`.
- File click and context-menu new-tab behavior stay aligned.
- The storage URL can keep download-oriented headers; the browser preview uses a locally created Blob URL.
- Markdown previews are readable without relying on the browser's plain text rendering.
- Preview Blob URLs are kept alive for the current app session instead of being revoked shortly after opening, so a newly opened preview tab can be refreshed.
- If storage CORS blocks `fetch(downloadUrl)`, the app shows an error page with a fallback download link.
- Browser smoke verification is still needed with a real logged-in token and a real file id.
