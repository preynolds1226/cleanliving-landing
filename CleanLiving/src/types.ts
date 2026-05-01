export type RiskLevel = 'ok' | 'caution' | 'avoid';

/** Used for affiliate routing (Amazon vs Impact) and model hints. */
export type SwapCategory =
  | 'glassBottle'
  | 'stainlessBottle'
  | 'castileSoap'
  | 'fragranceFreePersonalCare'
  | 'organicSnack'
  | 'bpaFreeStorage'
  | 'naturalFiberClothing';

export interface IngredientItem {
  name: string;
  risk: RiskLevel;
  /** Short reason for caution/avoid (optional, for tooltips) */
  reason?: string;
}

export interface HormoneInfo {
  chemical: string;
  explanation: string;
}

export interface CleanSwap {
  title: string;
  description: string;
  /** Replace with real affiliate / deep links later */
  affiliateUrl: string;
  dealNote?: string;
  /** Set when URL comes from Impact vs Amazon search */
  partner?: 'amazon' | 'impact';
}

export interface ScanResult {
  productGuess: string;
  ingredients: IngredientItem[];
  hormoneNotes: HormoneInfo[];
  purityScore: number;
  microplasticWarning?: string | null;
  cleanSwap: CleanSwap;
  /** Optional hint from the model; client validates before use */
  swapCategory?: SwapCategory;
}
