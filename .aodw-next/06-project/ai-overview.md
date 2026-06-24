# xgkb-explorer AI Overview

Last updated: 2026-06-24

## Purpose

xgkb-explorer is a React/Vite browser app for browsing a user's Xuan Guan knowledge base. It focuses on fast project-folder navigation, configurable directory entries, and in-browser file preview.

## Current Production

- URL: `https://tpr.20100706.xyz/xgkb/`
- Host: TPR server
- Static root: `/var/www/xgkb-explorer`
- Build output: `dist/`
- API base can be either the upstream service root URL or the same-origin proxy path configured by Caddy. Open API compatibility mode normalizes the same setting back to `/open-api/`.

## Core Flow

1. On first entry, the app checks local DingTalk/Cwork login state.
2. If no login session exists, the DingTalk login page is shown and waits for a user click; the settings modal is not opened automatically.
3. DingTalk OAuth uses the current app URL as callback.
4. DingTalk callback exchanges the auth code for a Cwork `xgToken`, stores the session, and initializes `TokenApiClient` with `access-token`.
5. User can still switch to explicit Open API compatibility mode and save an AppKey in the settings modal.
6. For the default personal-root entry, `useProject` calls `getPersonalProjectId`.
7. `useProjectsHub` resolves the active configured directory:
   - empty `directoryId`: personal project id + root folders
   - non-empty `directoryId`: direct child lookup with `getChildFiles(directoryId)`
   - empty display name: resolve from `batchGetMeta(directoryId)` when possible
8. Selecting a project loads files through the tree/detail components.
9. Preview uses either local renderers or the KB preview service depending on saved config.

## Important State Boundary

`projectId` is scoped to the active API client. Changing token, AppKey, auth mode, or server URL must invalidate the old `projectId`; otherwise the app can query a new user/session with a stale project id.

## AODW-Lite Policy

Keep AODW-Lite inside the repository. Treat workflow, module boundaries, decisions, and runbooks as part of the codebase so another developer or AI tool can reproduce the same operating model after cloning.

Use full documentation only for changes that affect:

- persisted config schema
- API contracts or request paths
- authentication and login callback handling
- AppKey/projectId/directory resolution
- preview strategy
- deployment or runtime environment
- security posture

Small visual or copy edits only need the normal build check.

## Current Engineering Risks

- Deployment credentials are currently part of deployment automation and should be migrated to GitHub Secrets/local environment variables.
- The app relies on external API behavior and CORS/proxy setup; manual browser verification is still needed after production deployment.
- There are limited automated tests beyond TypeScript build verification.

