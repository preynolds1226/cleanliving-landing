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

## Before App Store / TestFlight

1. **GitHub Pages** — Enable Pages on this repo (`main`, root). Confirm the privacy URL loads (must match `CleanLiving/app.json` → `extra.privacyPolicyUrl`).
2. **Support email** — Replace `support@yourdomain.com` in `index.html` and `privacy.html`.
3. **EAS** — See [`CleanLiving/README.md`](CleanLiving/README.md): `eas login`, then `npm run eas:ios` from `CleanLiving/`.
4. **Secrets** — Copy `CleanLiving/.env.example` → `.env` and Vercel envs; never commit real keys.

## Docs

- App Store draft copy: `CleanLiving/docs/app-store-listing.txt`
- In-app privacy draft: `CleanLiving/PRIVACY.md` (user-facing text is `privacy.html`)
