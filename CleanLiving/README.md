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

Copy `.env.example` to `.env` and fill in the values you need for local development.

## Security

`EXPO_PUBLIC_*` variables are **embedded in the compiled app bundle** and can be read by anyone who extracts it. They provide obfuscation and rate-limiting, not confidentiality:

- Keep your OpenAI API key **on the proxy server only** — never set `EXPO_PUBLIC_OPENAI_API_KEY` in preview or production builds. The production EAS profile (`eas.json`) explicitly clears this variable.
- `EXPO_PUBLIC_ANALYZE_SECRET` is a shared guard that the proxy can check to reject requests from outside the app. It is not a substitute for server-side quotas and auth.
- Actual secret management belongs in EAS Secrets (for CI/CD) or your server's environment (for the proxy).

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
