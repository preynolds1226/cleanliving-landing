import type { VercelRequest, VercelResponse } from '@vercel/node';
import { limitAnalyzeRequest } from '../lib/ratelimit';

const SWAP_CATEGORIES = new Set([
  'glassBottle',
  'stainlessBottle',
  'castileSoap',
  'fragranceFreePersonalCare',
  'organicSnack',
  'bpaFreeStorage',
  'naturalFiberClothing',
]);

function parseSwapCategoryHint(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  return SWAP_CATEGORIES.has(s) ? s : undefined;
}

const SYSTEM = `You are an expert in consumer product safety, clean living, and toxicology.
Analyze product label images. Extract ingredient lists when visible.
Return ONLY valid JSON matching this shape (no markdown):
{
  "productGuess": "short product name or Unknown",
  "ingredients": [{ "name": "string", "risk": "ok" | "caution" | "avoid", "reason": "optional short note" }],
  "hormoneNotes": [{ "chemical": "string", "explanation": "1-2 sentences: how it may affect hormones/endocrine or thyroid" }],
  "purityScore": 1-100 (100=cleanest; penalize avoid and caution ingredients),
  "microplasticWarning": "null or short warning if polyester/nylon in textiles or plastic food contact heating concerns",
  "swapCategory": "optional, one of: glassBottle | stainlessBottle | castileSoap | fragranceFreePersonalCare | organicSnack | bpaFreeStorage | naturalFiberClothing — best bucket for the product type",
  "cleanSwap": {
    "title": "specific swap product type",
    "description": "one sentence why it's cleaner",
    "affiliateUrl": "https://example.com/affiliate-placeholder",
    "dealNote": "optional e.g. often on sale"
  }
}
Rules:
- Mark known endocrine disruptors (BPA, phthalates, parabens in some contexts, PFAS, certain UV filters) as risk "avoid" or "caution" with reason.
- Artificial colors like Red 40: "caution" or "avoid".
- If ingredients unreadable, infer conservatively and lower purityScore.
- hormoneNotes only for real endocrine-related concerns among listed ingredients.
- cleanSwap must be one concrete alternative category (glass bottle, stainless, organic brand line, etc.).`;

function normalizeResult(raw: Record<string, unknown>) {
  const ingredients = Array.isArray(raw.ingredients)
    ? (raw.ingredients as Record<string, unknown>[]).map((i) => ({
        name: String(i.name ?? 'Unknown'),
        risk: (['ok', 'caution', 'avoid'].includes(String(i.risk)) ? i.risk : 'caution') as
          | 'ok'
          | 'caution'
          | 'avoid',
        reason: i.reason != null ? String(i.reason) : undefined,
      }))
    : [];

  const hormoneNotes = Array.isArray(raw.hormoneNotes)
    ? (raw.hormoneNotes as Record<string, unknown>[]).map((h) => ({
        chemical: String(h.chemical ?? ''),
        explanation: String(h.explanation ?? ''),
      }))
    : [];

  let purityScore = Number(raw.purityScore);
  if (!Number.isFinite(purityScore)) purityScore = 50;
  purityScore = Math.max(1, Math.min(100, Math.round(purityScore)));

  const swap = raw.cleanSwap as Record<string, unknown> | undefined;
  const cleanSwap = {
    title: String(swap?.title ?? 'Cleaner alternative'),
    description: String(swap?.description ?? 'Look for minimal-ingredient or certified organic options.'),
    affiliateUrl: String(swap?.affiliateUrl ?? 'https://example.com/swap'),
    dealNote: swap?.dealNote != null ? String(swap.dealNote) : undefined,
  };

  const swapCategory = parseSwapCategoryHint(raw.swapCategory);

  return {
    productGuess: String(raw.productGuess ?? 'Unknown product'),
    ingredients,
    hormoneNotes,
    purityScore,
    microplasticWarning:
      raw.microplasticWarning != null && raw.microplasticWarning !== 'null'
        ? String(raw.microplasticWarning)
        : null,
    cleanSwap,
    ...(swapCategory ? { swapCategory } : {}),
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Cleanliving-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret =
    typeof process.env.ANALYZE_SECRET === 'string' ? process.env.ANALYZE_SECRET.trim() : '';
  if (secret) {
    const sent = String(req.headers['x-cleanliving-secret'] ?? '');
    if (sent !== secret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  // Dynamic lookup so bundlers don't replace a missing build-time env with "".
  const apiKeyRaw = process.env['OPENAI_API_KEY'];
  const apiKey = typeof apiKeyRaw === 'string' ? apiKeyRaw.trim() : '';
  if (!apiKey) {
    return res.status(500).json({ error: 'Server missing OPENAI_API_KEY' });
  }

  const fwd = String(req.headers['x-forwarded-for'] ?? '');
  const clientIp = fwd.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  const { ok: withinLimit } = await limitAnalyzeRequest(clientIp);
  if (!withinLimit) {
    return res.status(429).json({ error: 'Too many requests — try again in a minute.' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const imageBase64 = body?.imageBase64 as string | undefined;
  if (!imageBase64?.trim()) {
    return res.status(400).json({ error: 'imageBase64 required' });
  }

  const maxB64 = Math.max(
    500_000,
    Math.min(12_000_000, Number(process.env.MAX_IMAGE_BASE64_CHARS ?? 4_500_000))
  );
  if (imageBase64.length > maxB64) {
    return res.status(413).json({ error: 'Image too large — retake with slightly lower quality.' });
  }

  const model = (process.env.OPENAI_MODEL ?? 'gpt-4o-mini').trim();
  const maxTokens = Math.max(
    400,
    Math.min(4096, Number(process.env.OPENAI_MAX_TOKENS ?? 1200))
  );

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product label image and return JSON only as specified.',
              },
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${imageBase64}` },
              },
            ],
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: maxTokens,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res.status(502).json({
        error: `OpenAI error ${openaiRes.status}`,
        detail: errText.slice(0, 300),
      });
    }

    const data = (await openaiRes.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return res.status(502).json({ error: 'Empty model response' });
    }

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      return res.status(502).json({ error: 'Invalid JSON from model' });
    }

    const result = normalizeResult(parsed);
    return res.status(200).json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
