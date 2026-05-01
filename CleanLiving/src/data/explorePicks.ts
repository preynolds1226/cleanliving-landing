import type { SwapCategory } from '../types';

export type ExplorePick = {
  id: string;
  /** Short label for the card */
  title: string;
  /** Why it’s a cleaner direction */
  subtitle: string;
  /** Drives the same affiliate routing as scan swaps (Amazon tag + Impact buckets). */
  category: SwapCategory;
};

/**
 * Scrollable “idea shelf” — each row opens the curated affiliate URL for that category.
 * Copy is editorial; links come from `getAffiliateSwapForCategory` in `affiliateLinks.ts`.
 */
export const EXPLORE_PICKS: ExplorePick[] = [
  {
    id: 'hydration-steel',
    title: 'Insulated steel bottles',
    subtitle: 'Cut single-use plastic and avoid hot-car leaching concerns from disposable bottles.',
    category: 'stainlessBottle',
  },
  {
    id: 'hydration-glass',
    title: 'Glass water bottles',
    subtitle: 'Great when you want zero plastic contact with your drink.',
    category: 'glassBottle',
  },
  {
    id: 'castile-all-purpose',
    title: 'Castile soap refills',
    subtitle: 'One gentle base for body, hands, or dilute for light cleaning — fewer mystery ingredients.',
    category: 'castileSoap',
  },
  {
    id: 'body-fragrance-free',
    title: 'Fragrance-free body care',
    subtitle: '“Fragrance-free” beats “unscented” for skipping undisclosed perfume blends.',
    category: 'fragranceFreePersonalCare',
  },
  {
    id: 'snack-pantry',
    title: 'Cleaner pantry snacks',
    subtitle: 'Organic options with fewer artificial colors and flavors for everyday munching.',
    category: 'organicSnack',
  },
  {
    id: 'kitchen-glass-storage',
    title: 'Glass food storage',
    subtitle: 'Meal prep and leftovers without heating in scratched plastic.',
    category: 'bpaFreeStorage',
  },
  {
    id: 'linens-natural',
    title: 'Organic cotton towels & basics',
    subtitle: 'Natural fibers shed less microplastic fuzz than polyester-heavy textiles.',
    category: 'naturalFiberClothing',
  },
  {
    id: 'hydration-steel-alt',
    title: 'Wide-mouth steel bottles',
    subtitle: 'Easier ice and cleaning — still the same low-plastic hydration swap.',
    category: 'stainlessBottle',
  },
  {
    id: 'skincare-minimal',
    title: 'Minimal-ingredient moisturizers',
    subtitle: 'Pairs well if you’re trimming parabens, dyes, and heavy fragrance.',
    category: 'fragranceFreePersonalCare',
  },
  {
    id: 'meal-prep-set',
    title: 'Meal-prep container sets',
    subtitle: 'Batch cook into glass so weekday lunches are grab-and-go.',
    category: 'bpaFreeStorage',
  },
];
