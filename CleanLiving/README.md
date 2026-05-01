# CleanLiving (Expo / React Native)

CleanLiving is an iOS-first “Live Vision” scanner prototype:

- Live camera framing overlay for ingredient labels
- AI analysis (via secure proxy) that highlights flagged ingredients
- Hormone-impact explanations
- Purity score gauge
- One-tap clean swap (affiliate-ready)
- “My Home” History + House score (local SQLite)

## Run locally

```bash
cd CleanLiving
npx expo start
```

Use Expo Go on a physical iPhone for camera.

## Environment variables

Create `.env` (copy from `.env.example`) and restart the dev server.

- `EXPO_PUBLIC_ANALYZE_API_URL`: Your HTTPS proxy endpoint (recommended for any real testing).
- `EXPO_PUBLIC_ANALYZE_SECRET`: Optional shared secret header for the proxy.
- `EXPO_PUBLIC_OPENAI_API_KEY`: Dev-only fallback (avoid shipping with this set).
- `EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG`: Optional Amazon Associates tag appended to curated links.
- `EXPO_PUBLIC_IMPACT_URL_*`: Optional Impact (or other) tracking URLs — see `.env.example`. When set for a category bucket, swaps use Impact instead of Amazon for that bucket.

## EAS / App Store (iOS)

1. In `CleanLiving`: `npx eas-cli login` (or global `eas-cli`). Run `npx eas-cli build:configure` once if the project is not linked.
2. `expo.extra.privacyPolicyUrl` in `app.json` must match your **live** policy page (see repo root `privacy.html` + GitHub Pages).
3. Production build: `npm run eas:ios` (or `npx eas-cli build --platform ios --profile production`). Internal/TestFlight-style: `npm run eas:ios:preview`.
4. After a good TestFlight build: `npm run eas:submit` submits the latest iOS build to App Store Connect (configure Apple credentials when prompted).
5. Draft App Store copy: `docs/app-store-listing.txt`.

`ios.bundleIdentifier` is set to `com.cleanliving.app` in `app.json` (change if you need a unique id).

## Backend proxy (recommended)

This repo includes a minimal Vercel serverless function in `../cleanliving-api/`:

- Endpoint: `POST /api/analyze`
- Body: `{ "imageBase64": "..." }`
- Env: `OPENAI_API_KEY` (required), `ANALYZE_SECRET` (optional)

## Privacy notes (high level)

- Camera is used to capture a label image for analysis.
- When you use the proxy, the label image is sent to your backend which calls the model provider.
- Scan history is stored locally on-device (SQLite) for the “My Home” audit log.

