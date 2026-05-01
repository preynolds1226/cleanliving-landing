# CleanLiving (monorepo)

| Path | What it is |
|------|------------|
| [`CleanLiving/`](CleanLiving/) | Expo / React Native iOS app (scanner, history, swaps) |
| [`cleanliving-api/`](cleanliving-api/) | Vercel serverless proxy for label analysis (`POST /api/analyze`) |
| [`index.html`](index.html) / [`privacy.html`](privacy.html) | Marketing + **public privacy policy** (GitHub Pages) |

## Clone (e.g. on your Mac)

```bash
git clone https://github.com/preynolds1226/cleanliving-landing.git
cd cleanliving-landing
```

## Already done in-repo (any machine)

- App + API code, landing + `privacy.html`, `app.json` privacy URL, App Store draft copy, npm scripts for EAS, privacy links in the app (Home, result, history).

## Finishing touches — **on your Mac only**

Do these in order; everything else is optional polish.

1. **`git pull`** in `cleanliving-landing`.
2. **`cd CleanLiving && npm install`**
3. **GitHub Pages** (browser): repo **Settings → Pages** → branch **`main`**, folder **`/`**. Wait for deploy, then open your `privacy.html` URL in a **private window** (must match `app.json` exactly).
4. **Support email**: find/replace `support@yourdomain.com` in **`index.html`** and **`privacy.html`**, then commit + push (or do once you own the address).
5. **`.env`**: copy `CleanLiving/.env.example` → `.env` with production `EXPO_PUBLIC_ANALYZE_API_URL` (and secret if you use it). Confirm Vercel has `OPENAI_API_KEY` and redeploy if you changed env.
6. **EAS**: `cd CleanLiving` → `npx eas-cli login` → if first time, `npx eas-cli build:configure` → **`npm run eas:ios`** (production). Complete Apple signing prompts.
7. **TestFlight / App Store Connect**: paste text from `CleanLiving/docs/app-store-listing.txt` (update URLs if you change domain). Screenshots from a real device.
8. **Submit** (after TestFlight looks good): `npm run eas:submit` from `CleanLiving`, or upload the `.ipa` / use Transporter as you prefer.

## Docs

- App Store draft copy: `CleanLiving/docs/app-store-listing.txt`
- In-app privacy draft: `CleanLiving/PRIVACY.md` (user-facing text is `privacy.html`)
