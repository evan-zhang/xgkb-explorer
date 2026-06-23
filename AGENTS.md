# AGENTS.md - xgkb-explorer

This repository uses AODW-Lite: a small, versioned workflow for keeping product intent, module boundaries, and verification close to the code.

## Default Workflow

Use the smallest process that matches the change.

- Tiny changes: state the issue, edit, run `npm run build`, and summarize the diff.
- Product, API, state, preview, storage, or deployment changes: use AODW-Lite.
- Risky deployment or credential changes: document the decision first and ask before changing production access.

## AODW-Lite Checklist

Before editing:

1. Read `.aodw-next/06-project/ai-overview.md`.
2. Check `.aodw-next/06-project/modules-index.yaml` for the affected module owner/boundary.
3. For behavior changes, add or update a short decision record in `docs/decisions/`.
4. For operational changes, update `docs/runbook.md`.

Before finishing:

1. Run `npm run build`.
2. Check `git status --short`.
3. Call out any unverified browser or production behavior.

## Project Invariants

- AppKey is user-specific and must not be committed.
- Personal `projectId` belongs to the active `KbApiClient`; when AppKey/server changes, reload it.
- Directory entries are located by `directoryId`; an empty `directoryId` means the personal knowledge-base root.
- Directory entry names are display-only and may be resolved from `batchGetMeta(directoryId)`.
- Preview behavior is user-facing; keep self-render, KB preview, download URL, and new-window behavior consistent.
- Production is served at `https://tpr.20100706.xyz/xgkb/` from `/var/www/xgkb-explorer`.

## Files To Keep In Sync

- `src/lib/config.ts`: persisted browser config schema and migrations.
- `src/lib/api.ts`: API contract and request/response handling.
- `src/lib/hooks.ts`: app state, project lookup, directory traversal, content loading.
- `src/App.tsx`: top-level state wiring and config lifecycle.
- `src/components/FileViewerModal.tsx` and `src/components/FilePreview.tsx`: preview behavior.
- `deploy.sh`, `.github/workflows/deploy.yml`, `docs/runbook.md`: deployment path and verification.

