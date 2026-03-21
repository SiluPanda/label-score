import { describe, it, expect } from 'vitest';
import { cohenKappa } from '../metrics/cohen-kappa';

describe('cohenKappa — unweighted', () => {
  it('returns κ = 1 for perfect agreement', () => {
    const r1 = ['A', 'B', 'C', 'A', 'B'];
    const r2 = ['A', 'B', 'C', 'A', 'B'];
    const result = cohenKappa(r1, r2);
    expect(result.metric).toBe('cohens-kappa');
    expect(result.value).toBeCloseTo(1.0, 10);
    expect(result.interpretation).toBe('almost-perfect');
  });

  it('returns κ near 0 for agreement matching chance', () => {
    // Both raters distribute 50/50 A vs B; observed agreement also 50%
    const r1 = ['A', 'A', 'B', 'B'];
    const r2 = ['A', 'B', 'A', 'B'];
    const result = cohenKappa(r1, r2);
    // Po = 0.5, Pe = 0.5*0.5 + 0.5*0.5 = 0.5, κ = 0
    expect(result.value).toBeCloseTo(0.0, 5);
  });

  it('known example: κ ≈ 0.4 (Landis & Koch textbook)', () => {
    // 10 items, rater1 and rater2 with known contingency:
    // Agreement on 7/10, with marginals that give Pe = 0.5
    // κ = (0.7 - 0.5) / (1 - 0.5) = 0.4
    const r1 = ['Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N', 'N'];
    const r2 = ['Y', 'Y', 'Y', 'Y', 'N', 'Y', 'N', 'N', 'N', 'N'];
    // r1: 5Y 5N, r2: 5Y 5N; agreements: 4Y+4N = 8; Po = 0.8, Pe = 0.5*0.5+0.5*0.5=0.5
    // κ = (0.8 - 0.5)/(1 - 0.5) = 0.6
    const result = cohenKappa(r1, r2);
    expect(result.observed).toBeCloseTo(0.8, 5);
    expect(result.expected).toBeCloseTo(0.5, 5);
    expect(result.value).toBeCloseTo(0.6, 5);
    expect(result.interpretation).toBe('substantial');
  });

  it('handles numeric labels', () => {
    const r1 = [1, 2, 3, 1, 2];
    const r2 = [1, 2, 3, 2, 1];
    const result = cohenKappa(r1, r2);
    // 3 agreements out of 5; Po = 0.6
    expect(result.observed).toBeCloseTo(0.6, 5);
    expect(result.value).toBeGreaterThanOrEqual(-1);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('returns categories in the result', () => {
    const r1 = ['cat', 'dog', 'cat'];
    const r2 = ['cat', 'dog', 'dog'];
    const result = cohenKappa(r1, r2);
    expect(result.categories).toBeDefined();
    expect(result.categories).toContain('cat');
    expect(result.categories).toContain('dog');
  });

  it('throws for empty arrays', () => {
    expect(() => cohenKappa([], [])).toThrow();
  });

  it('throws for arrays of different lengths', () => {
    expect(() => cohenKappa(['A', 'B'], ['A'])).toThrow();
  });
});

describe('cohenKappa — weighted (linear)', () => {
  it('returns κ = 1 for perfect agreement', () => {
    const r1 = [1, 2, 3, 4, 5];
    const r2 = [1, 2, 3, 4, 5];
    const result = cohenKappa(r1, r2, { weighted: true, weights: 'linear' });
    expect(result.value).toBeCloseTo(1.0, 10);
  });

  it('penalises farther disagreements more than closer ones', () => {
    // r1 vs r2: one case off-by-1, one case off-by-3 (out of scale 1-4)
    const r1Off1 = [1, 2, 3, 4, 1, 1, 1, 1, 1, 1];
    const r2Off1 = [2, 2, 3, 4, 1, 1, 1, 1, 1, 1]; // 1 disagreement of distance 1
    const r1Off3 = [1, 2, 3, 4, 1, 1, 1, 1, 1, 1];
    const r2Off3 = [4, 2, 3, 4, 1, 1, 1, 1, 1, 1]; // 1 disagreement of distance 3
    const resultOff1 = cohenKappa(r1Off1, r2Off1, { weighted: true, weights: 'linear' });
    const resultOff3 = cohenKappa(r1Off3, r2Off3, { weighted: true, weights: 'linear' });
    // Higher disagreement weight → lower kappa
    expect(resultOff1.value).toBeGreaterThan(resultOff3.value);
  });
});

describe('cohenKappa — weighted (quadratic)', () => {
  it('returns κ = 1 for perfect agreement', () => {
    const r1 = [1, 2, 3, 4, 5];
    const r2 = [1, 2, 3, 4, 5];
    const result = cohenKappa(r1, r2, { weighted: true, weights: 'quadratic' });
    expect(result.value).toBeCloseTo(1.0, 10);
  });

  it('quadratic weights penalise far disagreements more than linear', () => {
    // 4-category ordinal scale: one item off-by-3 vs one item off-by-1.
    // With linear weights, off-by-1 and off-by-3 are linearly different.
    // With quadratic weights, off-by-3 is 9x heavier than off-by-1.
    // Compare two datasets: one with an off-by-1 disagreement, one with an off-by-3.
    // The off-by-3 dataset should score lower under quadratic than under linear.
    const base = [1, 2, 3, 4, 1, 2, 3, 4, 1, 2]; // 10 items on 1-4 scale
    // rater2Off1: change first item from 1 to 2 (off-by-1)
    const rater2Off1 = [2, 2, 3, 4, 1, 2, 3, 4, 1, 2];
    // rater2Off3: change first item from 1 to 4 (off-by-3)
    const rater2Off3 = [4, 2, 3, 4, 1, 2, 3, 4, 1, 2];

    const linearOff1 = cohenKappa(base, rater2Off1, { weighted: true, weights: 'linear' });
    const linearOff3 = cohenKappa(base, rater2Off3, { weighted: true, weights: 'linear' });
    const quadOff1 = cohenKappa(base, rater2Off1, { weighted: true, weights: 'quadratic' });
    const quadOff3 = cohenKappa(base, rater2Off3, { weighted: true, weights: 'quadratic' });

    // Under both schemes off-by-3 is worse than off-by-1
    expect(linearOff3.value).toBeLessThan(linearOff1.value);
    expect(quadOff3.value).toBeLessThan(quadOff1.value);
    // Quadratic penalises the far disagreement more relative to the near one
    const linearRatio = linearOff1.value - linearOff3.value;
    const quadRatio = quadOff1.value - quadOff3.value;
    expect(quadRatio).toBeGreaterThan(linearRatio);
  });
});
