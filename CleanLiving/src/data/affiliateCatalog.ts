/**
 * Curated “clean swap” search intents. URLs are Amazon search pages; add your Associates tag via env.
 * Replace queries with your preferred merchant / deep links when you have partner APIs.
 */
export type AffiliateOffer = {
  id: string;
  keywords: string[];
  /** Amazon search query (or path segment after /s?k=) */
  searchQuery: string;
  /** Static “deal finder” hint — swap for real promos or API-driven copy later */
  dealNote?: string;
};

export const AFFILIATE_OFFERS: AffiliateOffer[] = [
  {
    id: 'castile-personal-care',
    keywords: [
      'soap',
      'wash',
      'shampoo',
      'cleanser',
      'sulfate',
      'body wash',
      'lather',
      'paraben',
      'fragrance',
    ],
    searchQuery: 'fragrance free castile soap refill',
    dealNote: 'Bulk / refill sizes often price out lowest per ounce — check cart promos.',
  },
  {
    id: 'glass-stainless-drink',
    keywords: ['plastic', 'bottle', 'water bottle', 'PET', 'microplastic', 'single-use'],
    searchQuery: 'stainless steel insulated water bottle 32 oz',
    dealNote: 'Outdoor retailers frequently run 20–30% off bottles before summer.',
  },
  {
    id: 'food-storage',
    keywords: ['food', 'container', 'microwave', 'BPA', 'plastic wrap', 'takeout'],
    searchQuery: 'glass food storage containers bamboo lid set',
    dealNote: 'Look for “buy more save more” kitchen sales around holidays.',
  },
  {
    id: 'skincare-minimal',
    keywords: ['lotion', 'cream', 'moisturizer', 'cosmetic', 'paraben', 'PEG', 'dye'],
    searchQuery: 'fragrance free moisturizer minimal ingredients eczema',
    dealNote: 'Subscribe-and-save can stack with brand coupons on some listings.',
  },
  {
    id: 'laundry-clean',
    keywords: ['detergent', 'laundry', 'surfactant', 'optical brightener', '1,4-dioxane'],
    searchQuery: 'fragrance free laundry detergent plant based HE',
    dealNote: 'Club-size bags often beat per-load cost during warehouse promos.',
  },
  {
    id: 'textile-natural',
    keywords: ['polyester', 'nylon', 'microfiber', 'fleece', 'synthetic fabric'],
    searchQuery: 'organic cotton towels GOTS',
    dealNote: 'Linens see deeper discounts in January white sales.',
  },
];
