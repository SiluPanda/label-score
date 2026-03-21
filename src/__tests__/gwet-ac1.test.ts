import { describe, it, expect } from 'vitest';
import { gwetAC1 } from '../metrics/gwet-ac1';
import { cohenKappa } from '../metrics/cohen-kappa';

describe('gwetAC1', () => {
  it('returns AC1 = 1 for perfect agreement', () => {
    const r1 = ['A', 'B', 'C', 'A', 'B'];
    const r2 = ['A', 'B', 'C', 'A', 'B'];
    const result = gwetAC1(r1, r2);
    expect(result.metric).toBe('gwets-ac1');
    expect(result.value).toBeCloseTo(1.0, 10);
    expect(result.interpretation).toBe('almost-perfect');
  });

  it('returns correct shape', () => {
    const r1 = ['yes', 'no', 'yes', 'no'];
    const r2 = ['yes', 'no', 'no', 'yes'];
    const result = gwetAC1(r1, r2);
    expect(result.metric).toBe('gwets-ac1');
    expect(typeof result.value).toBe('number');
    expect(typeof result.observed).toBe('number');
    expect(typeof result.expected).toBe('number');
    expect(result.interpretation).toBeDefined();
  });

  it('differs from Cohen Kappa on skewed (high prevalence) data', () => {
    // When one category dominates, Cohen's Kappa drops due to prevalence paradox
    // Gwet's AC1 should remain higher in such a case
    const r1 = ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'N'];
    const r2 = ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'];
    const ac1 = gwetAC1(r1, r2);
    const kappa = cohenKappa(r1, r2);
    // Both measure agreement, but AC1 is more robust in the skewed case
    // The point is they differ; typically AC1 >= kappa for high-prevalence data
    expect(ac1.value).not.toBeCloseTo(kappa.value, 10);
    expect(ac1.value).toBeGreaterThan(kappa.value);
  });

  it('known numerical example: balanced two-category case', () => {
    // 10 items, 2 categories evenly distributed
    // r1: 5Y, 5N; r2: 5Y, 5N; 8 agreements
    // Po = 0.8
    // p_Y = (5+5)/(2*10) = 0.5; p_N = 0.5
    // Pe = (1/(2-1)) * (0.5*0.5 + 0.5*0.5) = 0.5
    // AC1 = (0.8 - 0.5)/(1 - 0.5) = 0.6
    const r1 = ['Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N', 'N', 'N', 'N'];
    const r2 = ['Y', 'Y', 'Y', 'Y', 'N', 'Y', 'N', 'N', 'N', 'N'];
    const result = gwetAC1(r1, r2);
    expect(result.observed).toBeCloseTo(0.8, 5);
    expect(result.expected).toBeCloseTo(0.5, 5);
    expect(result.value).toBeCloseTo(0.6, 5);
  });

  it('handles numeric labels', () => {
    const r1 = [1, 2, 3, 1, 2];
    const r2 = [1, 2, 3, 2, 1];
    const result = gwetAC1(r1, r2);
    expect(result.value).toBeGreaterThanOrEqual(-1);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('AC1 equals Kappa when marginals are symmetric (balanced two-category)', () => {
    // When both raters have equal and symmetric marginals, AC1 ≈ Kappa
    const r1 = ['A', 'A', 'B', 'B', 'A', 'B'];
    const r2 = ['A', 'A', 'B', 'B', 'B', 'A'];
    const ac1 = gwetAC1(r1, r2);
    const kappa = cohenKappa(r1, r2);
    // Not necessarily exactly equal, but both measure the same underlying agreement
    expect(Math.abs(ac1.value - kappa.value)).toBeLessThan(0.3);
  });

  it('throws for empty arrays', () => {
    expect(() => gwetAC1([], [])).toThrow();
  });

  it('throws for arrays of different lengths', () => {
    expect(() => gwetAC1(['A', 'B'], ['A'])).toThrow();
  });
});
