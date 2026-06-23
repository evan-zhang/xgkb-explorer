# xgkb-explorer Runbook

Last updated: 2026-06-23

## Local Development

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## Build Check

```bash
npm run build
```

This runs TypeScript build mode and Vite production build. Use it as the minimum verification before handing off a change.

## Production

- URL: `https://tpr.20100706.xyz/xgkb/`
- Static root: `/var/www/xgkb-explorer`
- Build artifact: `dist/`
- Server: Caddy serves the static app and handles the `/xgkb/` path.

## Manual Deploy

```bash
bash deploy.sh
```

Expected result:

- dependencies are installed
- `dist/` is rebuilt
- files are uploaded to `/var/www/xgkb-explorer`
- production URL continues to load at `/xgkb/`

## GitHub Actions Deploy

Deployment is defined in `.github/workflows/deploy.yml`.

Before relying on it, migrate server credentials to GitHub Secrets and reference them from the workflow. Do not add new plaintext credentials to committed files.

## Smoke Test Checklist

After any deployment, verify:

- `https://tpr.20100706.xyz/xgkb/` loads without a blank page
- settings modal can save AppKey and server URL
- personal bookshelf loads root folders
- switching AppKey reloads personal project id and folder list
- a nested folder opens
- Markdown/plain text preview works
- image or HTML preview opens in the modal and new window

## Debugging API Access

Use a safe test AppKey supplied by the user for the current session only. Do not commit it.

Check in this order:

1. `getPersonalProjectId`
2. `getLevel1Folders`
3. `getChildFiles` for a known folder
4. Preview/download endpoint only after browsing works

If direct upstream URL works but production fails, inspect Caddy proxy/path behavior. If both fail, inspect AppKey, API response body, and browser console.

## Rollback

The current deployment uploads static files directly. To roll back, redeploy a known good commit:

```bash
git checkout <known-good-commit>
npm install
npm run build
bash deploy.sh
```

Return to the working branch afterward.

