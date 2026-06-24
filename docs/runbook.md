# xgkb-explorer Runbook

Last updated: 2026-06-24

## Local Development

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173/`.

## Local DingTalk Login

DingTalk validates the OAuth `redirect_uri` domain against the app's "Login and Share" callback-domain allowlist. `http://127.0.0.1:5173/` can fail that check if `127.0.0.1` is not allowed for the DingTalk app.

For local login testing:

1. Configure DingTalk to allow `127.0.0.1`, or serve the same app from a development domain that is configured in DingTalk's callback-domain allowlist.
2. Open the app from that allowed host and start DingTalk login.
3. The app derives the OAuth callback URL from the current browser URL.

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
- settings modal can save authentication mode, server URL, preview mode, and directory entries
- personal bookshelf loads root folders
- switching authentication mode or server URL reloads personal project id and folder list
- a nested folder opens
- Markdown/plain text preview works
- image or HTML preview opens in the modal and new window

## Debugging API Access

Normal knowledge-base access uses the DingTalk/Cwork `xgToken` as the `access-token` request header. Open API AppKey access is available only through the explicit compatibility mode.

Use a safe test AppKey supplied by the user for the current session only when debugging Open API compatibility. Do not commit it.

Check in this order:

1. `getPersonalProjectId`
2. `getLevel1Folders`
3. `getChildFiles` for a known folder
4. Preview/download endpoint only after browsing works

If direct upstream URL works but production fails, inspect Caddy proxy/path behavior. If both fail, inspect the auth mode, token/AppKey, API response body, and browser console.

## Rollback

The current deployment uploads static files directly. To roll back, redeploy a known good commit:

```bash
git checkout <known-good-commit>
npm install
npm run build
bash deploy.sh
```

Return to the working branch afterward.

