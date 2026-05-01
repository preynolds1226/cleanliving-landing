# cleanliving-api (Vercel)

Minimal HTTPS proxy for label analysis so you **do not** ship your model API key in the iOS app.

## Deploy

1. Deploy this folder to Vercel (new project, root set to `cleanliving-api`).
2. Set env vars in Vercel (see below).
3. After changing env vars, **redeploy** Production.

## Endpoint

- `POST /api/analyze`
- Body:

```json
{ "imageBase64": "<base64-jpeg>" }
```

## Environment variables

| Name | Required | Description |
|------|----------|-------------|
| `OPENAI_API_KEY` | **Yes** | OpenAI API key |
| `ANALYZE_SECRET` | No | If set, clients must send header `X-Cleanliving-Secret` with the same value |
| `OPENAI_MODEL` | No | Default `gpt-4o-mini` (vision-capable, lower cost than `gpt-4o`) |
| `OPENAI_MAX_TOKENS` | No | Default `1200` (capped 400–4096) |
| `MAX_IMAGE_BASE64_CHARS` | No | Default `4500000` (~3.4MB JPEG); rejects larger payloads with **413** |
| `UPSTASH_REDIS_REST_URL` | No | With `UPSTASH_REDIS_REST_TOKEN`, enables per-IP rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis token |
| `RATELIMIT_PER_MINUTE` | No | Default `30` (max **300**) requests per IP per minute when Upstash is configured |

## App config

In the Expo app (`CleanLiving/.env`):

- `EXPO_PUBLIC_ANALYZE_API_URL=https://<your-vercel-domain>/api/analyze`
- `EXPO_PUBLIC_ANALYZE_SECRET=<same-as-ANALYZE_SECRET>` (only if enabled)

## Optional: Upstash rate limiting

1. Create a Redis database at [Upstash](https://upstash.com/).
2. Copy **REST URL** and **REST TOKEN** into Vercel env.
3. Redeploy. Without these vars, rate limiting is skipped (still enforces max image size).
