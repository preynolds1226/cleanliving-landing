import type { ScanResult, SwapCategory } from '../types';

const AMAZON_TAG = process.env.EXPO_PUBLIC_AMAZON_ASSOCIATE_TAG;

/** Impact.com (or other) tracking URLs — set any bucket to prefer Impact over Amazon for that category group. */
function impactUrlForSwapCategory(category: SwapCategory): string | undefined {
  const skincare: SwapCategory[] = ['fragranceFreePersonalCare', 'castileSoap'];
  const snack: SwapCategory[] = ['organicSnack'];
  const home: SwapCategory[] = ['bpaFreeStorage', 'glassBottle', 'stainlessBottle'];
  const apparel: SwapCategory[] = ['naturalFiberClothing'];

  if (skincare.includes(category)) {
    return process.env.EXPO_PUBLIC_IMPACT_URL_SKINCARE?.trim() || undefined;
  }
  if (snack.includes(category)) {
    return process.env.EXPO_PUBLIC_IMPACT_URL_SNACK?.trim() || undefined;
  }
  if (home.includes(category)) {
    return process.env.EXPO_PUBLIC_IMPACT_URL_HOME?.trim() || undefined;
  }
  if (apparel.includes(category)) {
    return process.env.EXPO_PUBLIC_IMPACT_URL_APPAREL?.trim() || undefined;
  }
  return undefined;
}

function withAmazonTag(url: string): string {
  const tag = AMAZON_TAG?.trim();
  if (!tag) return url;
  const u = new URL(url);
  if (!u.searchParams.get('tag')) u.searchParams.set('tag', tag);
  return u.toString();
}

const VALID_SWAP: ReadonlySet<string> = new Set<SwapCategory>([
  'glassBottle',
  'stainlessBottle',
  'castileSoap',
  'fragranceFreePersonalCare',
  'organicSnack',
  'bpaFreeStorage',
  'naturalFiberClothing',
]);

export function parseSwapCategoryHint(raw: unknown): SwapCategory | undefined {
  if (typeof raw !== 'string') return undefined;
  const s = raw.trim();
  if (VALID_SWAP.has(s)) return s as SwapCategory;
  return undefined;
}

export type CuratedSwap = {
  affiliateUrl: string;
  dealNote?: string;
  partner: 'amazon' | 'impact';
};

/**
 * Curated swap: prefers Impact when env URLs are set for that category bucket, else Amazon search + Associates tag.
 */
export function getAffiliateSwapForCategory(category: SwapCategory): CuratedSwap {
  const impact = impactUrlForSwapCategory(category);
  if (impact) {
    return {
      affiliateUrl: impact,
      dealNote: 'Partner link (Impact)',
      partner: 'impact',
    };
  }

  switch (category) {
    case 'castileSoap':
      return {
        affiliateUrl: withAmazonTag(
          'https://www.amazon.com/s?k=castile+soap+glass+bottle'
        ),
        dealNote: 'Deals vary — check today’s price',
        partner: 'amazon',
      };
    case 'glassBottle':
      return {
        affiliateUrl: withAmazonTag('https://www.amazon.com/s?k=glass+water+bottle'),
        dealNote: 'Often on sale in multi-packs',
        partner: 'amazon',
      };
    case 'stainlessBottle':
      return {
        affiliateUrl: withAmazonTag('https://www.amazon.com/s?k=stainless+steel+water+bottle'),
        dealNote: 'Look for 18/8 stainless',
        partner: 'amazon',
      };
    case 'fragranceFreePersonalCare':
      return {
        affiliateUrl: withAmazonTag('https://www.amazon.com/s?k=fragrance+free+body+wash'),
        dealNote: 'Filter for “fragrance-free” (not “unscented”)',
        partner: 'amazon',
      };
    case 'organicSnack':
      return {
        affiliateUrl: withAmazonTag('https://www.amazon.com/s?k=organic+snacks+no+artificial+colors'),
        dealNote: 'Watch for Subscribe & Save discounts',
        partner: 'amazon',
      };
    case 'bpaFreeStorage':
      return {
        affiliateUrl: withAmazonTag('https://www.amazon.com/s?k=glass+food+storage+containers'),
        dealNote: 'Glass + silicone seals tends to be cleaner',
        partner: 'amazon',
      };
    case 'naturalFiberClothing':
      return {
        affiliateUrl: withAmazonTag(
          'https://www.amazon.com/s?k=organic+cotton+clothing+women'
        ),
        dealNote: 'Natural fibers shed less microplastic than polyester blends',
        partner: 'amazon',
      };
    default:
      return {
        affiliateUrl: withAmazonTag(
          'https://www.amazon.com/s?k=fragrance+free+cleaning+products'
        ),
        dealNote: 'Curated search — verify ingredients on the listing',
        partner: 'amazon',
      };
  }
}

function isPlaceholderAffiliateUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  return (
    u.includes('example.com') ||
    u.includes('example.org') ||
    u.includes('affiliate-placeholder') ||
    u.includes('yourdomain')
  );
}

/** Heuristic category from scan text (used when model has no swapCategory). */
export function inferSwapCategoryFromScan(result: ScanResult): SwapCategory {
  const hinted = result.swapCategory;
  if (hinted && VALID_SWAP.has(hinted)) {
    return hinted;
  }

  const text = [
    result.productGuess,
    result.cleanSwap.title,
    result.cleanSwap.description,
    result.microplasticWarning ?? '',
    ...result.ingredients.map((i) => `${i.name} ${i.reason ?? ''}`),
  ]
    .join(' ')
    .toLowerCase();

  if (/toothpaste|tooth paste|dental|mouthwash|oral care/.test(text)) {
    return 'fragranceFreePersonalCare';
  }
  if (/detergent|laundry|dish soap|surface cleaner|all.purpose cleaner|bleach/.test(text)) {
    return 'fragranceFreePersonalCare';
  }
  if (/polyester|nylon|microplastic|fleece|acrylic|spandex|lycra|elastane/.test(text)) {
    return 'naturalFiberClothing';
  }
  if (/storage|tupperware|leftover|meal prep|food container|microwave safe container/.test(text)) {
    return 'bpaFreeStorage';
  }
  if (
    /snack|cereal|granola|protein bar|gummy|candy|chips(?!board)|cracker|cookie|organic food/.test(
      text
    )
  ) {
    return 'organicSnack';
  }
  if (/water bottle|hydration|single.use|single use|plastic bottle|pet bottle/.test(text)) {
    return 'stainlessBottle';
  }
  if (/glass bottle|drinkware glass/.test(text)) {
    return 'glassBottle';
  }
  if (/castile|dr\.?\s*bronner|bronner/.test(text)) {
    return 'castileSoap';
  }
  if (
    /soap|shampoo|body wash|cleanser|lotion|conditioner|deodorant|sunscreen|skincare|cosmetic|makeup|parfum|fragrance/.test(
      text
    )
  ) {
    return 'fragranceFreePersonalCare';
  }
  return 'fragranceFreePersonalCare';
}

/** Real swap URL; overrides model `example.com` placeholders. */
export function getEffectiveSwapUrl(result: ScanResult): string {
  const raw = result.cleanSwap.affiliateUrl;
  if (!isPlaceholderAffiliateUrl(raw)) {
    return raw;
  }
  const cat = inferSwapCategoryFromScan(result);
  return getAffiliateSwapForCategory(cat).affiliateUrl;
}

/** Full cleanSwap with non-placeholder URL + partner metadata (for history). */
export function withEffectiveAffiliate(result: ScanResult): ScanResult {
  if (!isPlaceholderAffiliateUrl(result.cleanSwap.affiliateUrl)) {
    return result;
  }
  const cat = inferSwapCategoryFromScan(result);
  const curated = getAffiliateSwapForCategory(cat);
  return {
    ...result,
    cleanSwap: {
      ...result.cleanSwap,
      affiliateUrl: curated.affiliateUrl,
      dealNote: curated.dealNote ?? result.cleanSwap.dealNote,
      partner: curated.partner,
    },
  };
}
