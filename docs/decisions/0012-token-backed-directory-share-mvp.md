# 0012 Token-backed directory share MVP

Date: 2026-07-01

## Status

Accepted for MVP.

## Context

The product needs a quick share flow for a configured bookshelf directory. A logged-in user can copy a link and send it to another person. The receiver should open the link without logging in and preview files under that directory.

This MVP intentionally prioritizes end-to-end usability. The share link carries the current user's access token in the URL hash so the receiver's browser can read the shared directory with the sharer's current identity. The token is not sent to the static web server as a query parameter, but it is still visible to the receiver and browser runtime.

## Decision

- Add a share button next to the active space switcher.
- Only concrete directory entries can be shared. The empty-directory "all spaces" entry is not shareable.
- On click, show a confirmation: whether to share the named space directory for others to preview.
- On confirmation, copy a link in the form:

```text
{origin}{pathname}#/share?directoryId=...&name=...&token=...
```

- When the app starts with `#/share`, bypass the login gate and render a dedicated read-only share page.
- The share page initializes a token API client from the hash token and only exposes directory browsing and file preview.
- The share page must not expose settings, bookshelf editing, starring, copy raw link, share again, or original new-tab file actions.
- Shared file preview must not iframe the raw `downloadUrl`. It should fetch the file, infer a preview MIME type, and render a Blob URL, matching the main app's self-preview behavior so `Content-Disposition: attachment` does not force a browser download.

## Consequences

- The receiver can preview the shared directory without login while the token remains valid.
- Token expiry or revocation will make the share link fail.
- This is not a secure permission boundary. Anyone with the link can inspect and reuse the token.
- A future production-grade version should replace this with a backend public share proxy or a scoped encrypted share payload.
