# xgkb-explorer AI Overview

Last updated: 2026-06-23

## Purpose

xgkb-explorer is a React/Vite browser app for browsing a user's Xuan Guan knowledge base. It focuses on fast project-folder navigation, configurable directory entries, and in-browser file preview.

## Current Production

- URL: `https://tpr.20100706.xyz/xgkb/`
- Host: TPR server
- Static root: `/var/www/xgkb-explorer`
- Build output: `dist/`
- API base can be either the upstream Open API URL or the same-origin proxy path configured by Caddy.

## Core Flow

1. User saves an AppKey and server URL in the settings modal.
2. `useApiClient` creates a `KbApiClient`.
3. For the default personal-root entry, `useProject` calls `getPersonalProjectId`.
4. `useProjectsHub` resolves the active configured directory:
   - empty `directoryId`: personal project id + root folders
   - non-empty `directoryId`: direct child lookup with `getChildFiles(directoryId)`
   - empty display name: resolve from `batchGetMeta(directoryId)` when possible
5. Selecting a project loads files through the tree/detail components.
6. Preview uses either local renderers or the KB preview service depending on saved config.

## Important State Boundary

`projectId` is scoped to the active API client. Changing AppKey or server URL must invalidate the old `projectId`; otherwise the app can query a new user with a stale project id.

## AODW-Lite Policy

Keep AODW-Lite inside the repository. Treat workflow, module boundaries, decisions, and runbooks as part of the codebase so another developer or AI tool can reproduce the same operating model after cloning.

Use full documentation only for changes that affect:

- persisted config schema
- API contracts or request paths
- AppKey/projectId/directory resolution
- preview strategy
- deployment or runtime environment
- security posture

Small visual or copy edits only need the normal build check.

## Current Engineering Risks

- Deployment credentials are currently part of deployment automation and should be migrated to GitHub Secrets/local environment variables.
- The app relies on external API behavior and CORS/proxy setup; manual browser verification is still needed after production deployment.
- There are limited automated tests beyond TypeScript build verification.

