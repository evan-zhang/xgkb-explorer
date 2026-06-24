# 0005 - Token API Client Is The Default Knowledge-Base Client

Date: 2026-06-24

## Status

Accepted

## Context

DingTalk/Cwork login now returns an `xgToken`. The app no longer needs to treat that token as an Open API AppKey.

The knowledge-base browser still needs the same high-level API methods (`getChildFiles`, `getFullFileContent`, preview ticket creation, sharing), but the authentication header and base URL differ between login-token access and Open API access.

## Decision

Keep one UI-facing `KbApiClient` contract and split concrete clients by authentication mode.

- `TokenApiClient` is the default after login.
- When a saved auth session has an `xgToken`, client initialization must prefer `TokenApiClient` even if older local config still says `open-api`.
- `TokenApiClient` sends the session token in the `access-token` header.
- `TokenApiClient` uses the service root URL; if a saved URL ends in `/open-api/`, it normalizes that suffix away.
- `OpenApiClient` remains as an explicit compatibility mode and sends `appKey`.
- `OpenApiClient` normalizes the configured service URL back to an `/open-api/` base.
- Persisted config stores `apiMode`, `serverUrl`, optional legacy `appKey`, preview settings, and directory entries.

## Consequences

- Login-token access no longer overloads the `appKey` field.
- AppKey is no longer required for normal use after DingTalk/Cwork login.
- Existing saved `/open-api/` server URLs remain usable because both clients normalize the URL for their mode.
- Manual browser verification is still needed because the token API contract is external to this app.
