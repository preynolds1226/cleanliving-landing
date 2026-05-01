# CleanLiving (Expo)

Scan ingredient labels, view scores and swaps, explore curated picks. Data stays on-device unless you export or use network analysis (see Privacy Policy).

## Prerequisites

- **Node.js 20 LTS** is recommended for Metro and tooling. Newer Node versions may hit file-watcher quirks on Windows.
- npm (ships with Node).

## Setup

```bash
cd CleanLiving
npm ci
```

Optional: set `EXPO_PUBLIC_SENTRY_DSN` in `.env` (or EAS secrets) so production builds report crashes to Sentry. Without it, the app runs normally and Sentry stays disabled.

## Scripts

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm start`    | Expo dev server                      |
| `npm run typecheck` | `tsc --noEmit`                 |
| `npm test`     | Jest                                 |
| `npm run lint` | ESLint (Expo config)                 |
| `npm run verify` | typecheck + test + lint          |

Pre-push (via `simple-git-hooks`): runs `npm run verify`.

## Maestro (optional E2E smoke)

Install [Maestro](https://maestro.mobile.dev/), start the app in the simulator or on device, then from this folder:

```bash
maestro test maestro/home.yaml
```

Adjust `appId` in the flow file if your Android package / iOS bundle id changes.
