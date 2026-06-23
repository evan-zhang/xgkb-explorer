# 0004 - DingTalk Login Gates App Entry

Date: 2026-06-23

## Status

Accepted

## Context

The app previously opened the settings modal on first entry when no AppKey was saved. The desired entry behavior is now user authentication first: if the browser has no login session, the app should start DingTalk/Cwork login instead of prompting for manual configuration.

The DingTalk login guide requires frontend-only Cwork API calls, adaptive callback URLs, and full page reload on logout because the DingTalk QR SDK leaves global listeners behind.

## Decision

Gate app entry with a local DingTalk/Cwork login session.

- Missing login shows `DingTalkLogin`; the settings modal is not opened automatically.
- Login actions wait for a user click after enterprises load.
- Callback URLs are derived from `window.location.origin` plus the current base path.
- Login success stores `xg_token`, `corp_id`, and user metadata in localStorage.
- Logout clears login storage and reloads the page.

The existing settings modal remains available from the header for knowledge-base server, AppKey, preview, and directory-entry configuration.

## Consequences

- Real login requires `VITE_CWORK_APP_CODE`.
- Local login requires opening the app from a host allowed by DingTalk's callback-domain settings.
- Browser smoke testing must cover launch login, QR login, and callback cleanup.
- If the Cwork `xgToken` is not accepted by the knowledge-base Open API `appKey` header, the user can still configure AppKey manually from settings; the auth boundary remains separate.
