import { AFFILIATE_OFFERS } from '../data/affiliateCatalog';
import type { ScanResult } from '../types';

function amazonSearchUrl(query: string, associateTag: string | undefined): string {
  const k = encodeURIComponent(query);
  const base = `https://www.amazon.com/s?k=${k}`;
  if (associateTag?.trim()) {
    return `${base}&tag=${encodeURIComponent(associateTag.trim())}`;
  }
  return base;
}

function corpusForMatching(result: ScanResult): string {
  const ing = result.ingredients.map((i) => `${i.name} ${i.reason ?? ''}`).join(' ');
  const swap = `${result.cleanSwap.title} ${result.cleanSwap.description}`;
  const micro = result.microplasticWarning ?? '';
  return `${result.productGuess} ${ing} ${swap} ${micro}`.toLowerCase();
}

function scoreOffer(text: string, offer: (typeof AFFILIATE_OFFERS)[0]): number {
  let score = 0;
  for (const kw of offer.keywords) {
    if (text.includes(kw.toLowerCase())) score += 2;
  }
  return score;
}

/**
 * Picks a curated affiliate search URL and deal hint from catalog + env tag.
 * Keeps model-generated swap copy; replaces generic example.com links.
 */
export function applyAffiliateToResult(
  result: ScanResult,
  associateTag: string | undefined
): ScanResult {
  const text = corpusForMatching(result);
  let best = AFFILIATE_OFFERS[0];
  let bestScore = scoreOffer(text, best);
  for (const offer of AFFILIATE_OFFERS.slice(1)) {
    const s = scoreOffer(text, offer);
    if (s > bestScore) {
      best = offer;
      bestScore = s;
    }
  }

  const url = amazonSearchUrl(best.searchQuery, associateTag);
  const dealNote = best.dealNote ?? result.cleanSwap.dealNote;

  return {
    ...result,
    cleanSwap: {
      ...result.cleanSwap,
      affiliateUrl: url,
      dealNote: dealNote ?? result.cleanSwap.dealNote,
    },
  };
}
