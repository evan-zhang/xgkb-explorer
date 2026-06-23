# 0001 - Adopt AODW-Lite

Date: 2026-06-23

## Status

Accepted

## Context

xgkb-explorer started as a focused browser app, but it now has several boundaries where small changes can create user-visible failures:

- user AppKey and server URL configuration
- personal project id discovery
- multi-space path resolution
- localStorage schema migration
- preview mode selection
- production deployment under `/xgkb/`

The recent stale-project-id issue showed that the app needs explicit state-boundary documentation, not just code changes.

## Decision

Adopt AODW-Lite and commit it to the repository.

The workflow lives in:

- `AGENTS.md` for AI/developer tool instructions
- `.aodw-next/06-project/ai-overview.md` for architecture and operating context
- `.aodw-next/06-project/modules-index.yaml` for module boundaries and verification
- `docs/runbook.md` for deployment and smoke tests
- `docs/decisions/` for design decisions

## Scope

Use AODW-Lite for changes that affect product behavior, API state, persisted configuration, preview strategy, deployment, or security posture.

Do not require it for tiny copy, style, or single-component fixes unless they touch a listed module invariant.

## Consequences

- The methodology travels with the codebase when cloned or opened in another development tool.
- New developers can find module boundaries before editing.
- AI coding agents get repository-local rules instead of relying on chat history.
- Documentation must be kept short and updated when module behavior changes.

