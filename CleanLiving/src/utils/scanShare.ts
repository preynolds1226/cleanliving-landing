import type { ScanResult } from '../types';

export function buildScanShareText(result: ScanResult): string {
  const lines: string[] = [
    `CleanLiving — ${result.productGuess}`,
    `Purity score: ${result.purityScore}/100`,
    '',
    'Ingredients:',
    ...result.ingredients.map((i) => `• ${i.name} (${i.risk})${i.reason ? ` — ${i.reason}` : ''}`),
  ];
  if (result.microplasticWarning) {
    lines.push('', `Microplastics: ${result.microplasticWarning}`);
  }
  if (result.hormoneNotes.length) {
    lines.push('', 'Hormone notes:');
    for (const h of result.hormoneNotes) {
      lines.push(`• ${h.chemical}: ${h.explanation}`);
    }
  }
  lines.push('', `Swap: ${result.cleanSwap.title}`, result.cleanSwap.description);
  return lines.join('\n');
}

export function buildIngredientsCopyText(result: ScanResult): string {
  return result.ingredients.map((i) => i.name).join(', ');
}
