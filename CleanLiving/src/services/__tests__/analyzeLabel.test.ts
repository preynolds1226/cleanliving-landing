import { normalizeResult } from '../analyzeLabel';

const BASE = {
  productGuess: 'Test Soap',
  ingredients: [
    { name: 'Water', risk: 'ok' },
    { name: 'Fragrance', risk: 'avoid', reason: 'Undisclosed mix' },
  ],
  hormoneNotes: [{ chemical: 'Fragrance', explanation: 'May contain phthalates.' }],
  purityScore: 72,
  microplasticWarning: null,
  cleanSwap: {
    title: 'Castile soap',
    description: 'Clean swap.',
    affiliateUrl: 'https://example.com',
  },
  swapCategory: 'castileSoap',
};

describe('normalizeResult', () => {
  it('passes through a well-formed result', () => {
    const r = normalizeResult(BASE);
    expect(r.productGuess).toBe('Test Soap');
    expect(r.purityScore).toBe(72);
    expect(r.ingredients).toHaveLength(2);
    expect(r.ingredients[0].risk).toBe('ok');
    expect(r.hormoneNotes).toHaveLength(1);
    expect(r.swapCategory).toBe('castileSoap');
  });

  it('falls back gracefully when fields are missing', () => {
    const r = normalizeResult({});
    expect(r.productGuess).toBe('Unknown product');
    expect(r.ingredients).toEqual([]);
    expect(r.hormoneNotes).toEqual([]);
    expect(r.purityScore).toBe(50);
    expect(r.microplasticWarning).toBeNull();
    expect(r.cleanSwap.title).toBe('Cleaner alternative');
    expect(r.swapCategory).toBeUndefined();
  });

  it('coerces an unknown risk value to "caution"', () => {
    const r = normalizeResult({
      ...BASE,
      ingredients: [{ name: 'Mystery', risk: 'unknown' }],
    });
    expect(r.ingredients[0].risk).toBe('caution');
  });

  it('clamps purityScore to [1, 100]', () => {
    expect(normalizeResult({ ...BASE, purityScore: 0 }).purityScore).toBe(1);
    expect(normalizeResult({ ...BASE, purityScore: 999 }).purityScore).toBe(100);
    expect(normalizeResult({ ...BASE, purityScore: -5 }).purityScore).toBe(1);
  });

  it('rounds a fractional purityScore', () => {
    expect(normalizeResult({ ...BASE, purityScore: 67.8 }).purityScore).toBe(68);
  });

  it('defaults purityScore to 50 when non-numeric (NaN)', () => {
    expect(normalizeResult({ ...BASE, purityScore: 'high' }).purityScore).toBe(50);
    expect(normalizeResult({ ...BASE, purityScore: undefined }).purityScore).toBe(50);
  });

  it('clamps purityScore to 1 when the value coerces to 0 (e.g. null)', () => {
    // Number(null) === 0, which is finite and gets clamped to the minimum of 1
    expect(normalizeResult({ ...BASE, purityScore: null }).purityScore).toBe(1);
  });

  it('treats the string "null" as a null microplasticWarning', () => {
    const r = normalizeResult({ ...BASE, microplasticWarning: 'null' });
    expect(r.microplasticWarning).toBeNull();
  });

  it('preserves a real microplasticWarning string', () => {
    const r = normalizeResult({ ...BASE, microplasticWarning: 'Contains polyester.' });
    expect(r.microplasticWarning).toBe('Contains polyester.');
  });

  it('ignores an unknown swapCategory', () => {
    const r = normalizeResult({ ...BASE, swapCategory: 'unknownCategory' });
    expect(r.swapCategory).toBeUndefined();
  });

  it('handles non-array ingredients gracefully', () => {
    const r = normalizeResult({ ...BASE, ingredients: 'not an array' });
    expect(r.ingredients).toEqual([]);
  });

  it('drops the reason field when absent on an ingredient', () => {
    const r = normalizeResult({
      ...BASE,
      ingredients: [{ name: 'Water', risk: 'ok' }],
    });
    expect(r.ingredients[0].reason).toBeUndefined();
  });
});
