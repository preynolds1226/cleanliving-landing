import type { HormoneInfo, IngredientItem, ScanResult } from '../types';
import { getAffiliateSwapForCategory, parseSwapCategoryHint } from './affiliateLinks';

const SYSTEM = `You are an expert in consumer product safety, clean living, and toxicology.
Analyze product label images. Extract ingredient lists when visible.
Return ONLY valid JSON matching this shape (no markdown):
{
  "productGuess": "short product name or Unknown",
  "ingredients": [{ "name": "string", "risk": "ok" | "caution" | "avoid", "reason": "optional short note" }],
  "hormoneNotes": [{ "chemical": "string", "explanation": "1-2 sentences: how it may affect hormones/endocrine or thyroid" }],
  "purityScore": 1-100 (100=cleanest; penalize avoid and caution ingredients),
  "microplasticWarning": "null or short warning if polyester/nylon in textiles or plastic food contact heating concerns",
  "swapCategory": "optional: one of glassBottle | stainlessBottle | castileSoap | fragranceFreePersonalCare | organicSnack | bpaFreeStorage | naturalFiberClothing — best bucket for curated affiliate routing",
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

export function normalizeResult(raw: Record<string, unknown>): ScanResult {
  const ingredients: IngredientItem[] = Array.isArray(raw.ingredients)
    ? (raw.ingredients as Record<string, unknown>[]).map((i) => ({
        name: String(i.name ?? 'Unknown'),
        risk: (['ok', 'caution', 'avoid'].includes(String(i.risk))
          ? i.risk
          : 'caution') as IngredientItem['risk'],
        reason: i.reason != null ? String(i.reason) : undefined,
      }))
    : [];

  const hormoneNotes: HormoneInfo[] = Array.isArray(raw.hormoneNotes)
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

export function getMockScanResult(): ScanResult {
  const swap = getAffiliateSwapForCategory('castileSoap');
  return {
    swapCategory: 'castileSoap',
    productGuess: 'Moisturizing body wash (demo)',
    ingredients: [
      { name: 'Water', risk: 'ok' },
      { name: 'Sodium laureth sulfate', risk: 'caution', reason: 'Can irritate skin; ethoxylation concerns' },
      { name: 'Fragrance (parfum)', risk: 'avoid', reason: 'Undisclosed mix; may include phthalates' },
      { name: 'Red 40', risk: 'avoid', reason: 'Synthetic dye' },
      { name: 'Methylisothiazolinone', risk: 'avoid', reason: 'Strong sensitizer' },
    ],
    hormoneNotes: [
      {
        chemical: 'Fragrance / phthalates',
        explanation:
          'Some fragrance formulations use phthalates as fixatives; certain phthalates are linked to hormone-disrupting effects in animal studies.',
      },
    ],
    purityScore: 34,
    microplasticWarning:
      'If packaging is single-use plastic, heating or UV exposure can increase transfer of additives; consider refilling from bulk.',
    cleanSwap: {
      title: 'Fragrance-free castile soap in glass',
      description: 'Short ingredient list, no synthetic dyes—use a pump dispenser you keep.',
      affiliateUrl: swap.affiliateUrl,
      dealNote: swap.dealNote ?? 'Curated link — replace with your partner feed later',
      partner: swap.partner,
    },
  };
}

export type AnalyzeOptions = {
  /** Full URL to analyze endpoint, e.g. https://your-app.vercel.app/api/analyze */
  apiUrl?: string;
  /** Must match server ANALYZE_SECRET when the proxy is configured with a secret */
  apiSecret?: string;
  /**
   * Dev-only fallback: calls OpenAI from the device. Do not ship production builds with this set;
   * prefer apiUrl so the key stays on the server.
   */
  openAiKey?: string;
};

async function analyzeViaProxy(
  base64Jpeg: string,
  apiUrl: string,
  apiSecret: string | undefined
): Promise<ScanResult> {
  const url = apiUrl.trim();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (apiSecret?.trim()) headers['X-Cleanliving-Secret'] = apiSecret.trim();

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ imageBase64: base64Jpeg }),
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text) as unknown;
  } catch {
    throw new Error(`Analyze failed (${res.status}): ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    const err = body as { error?: string; detail?: string };
    throw new Error(err.error ?? err.detail ?? `Analyze failed (${res.status})`);
  }

  return normalizeResult(body as Record<string, unknown>);
}

async function analyzeViaOpenAiDirect(base64Jpeg: string, apiKey: string): Promise<ScanResult> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
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
              image_url: { url: `data:image/jpeg;base64,${base64Jpeg}` },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Vision API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('No response from model');

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid JSON from model');
  }

  return normalizeResult(parsed);
}

/**
 * Prefer `apiUrl` (HTTPS proxy) for production. Direct OpenAI is for local dev when no proxy is deployed.
 */
export async function analyzeLabelFromBase64(
  base64Jpeg: string,
  options: AnalyzeOptions = {}
): Promise<ScanResult> {
  const { apiUrl, apiSecret, openAiKey } = options;

  if (apiUrl?.trim()) {
    return analyzeViaProxy(base64Jpeg, apiUrl, apiSecret);
  }

  if (openAiKey?.trim()) {
    return analyzeViaOpenAiDirect(base64Jpeg, openAiKey);
  }

  return getMockScanResult();
}
