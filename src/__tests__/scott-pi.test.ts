import { describe, it, expect } from 'vitest';
import { scottPi } from '../metrics/scott-pi';
import { cohenKappa } from '../metrics/cohen-kappa';

describe('scottPi', () => {
  it('returns π = 1 for perfect agreement', () => {
    const r1 = ['A', 'B', 'C', 'A', 'B'];
    const r2 = ['A', 'B', 'C', 'A', 'B'];
    const result = scottPi(r1, r2);
    expect(result.metric).toBe('scotts-pi');
    expect(result.value).toBeCloseTo(1.0, 10);
    expect(result.interpretation).toBe('almost-perfect');
  });

  it('returns π near 0 when observed agreement equals expected agreement', () => {
    // Symmetric case: both raters give 50/50 A vs B; observed 50%
    const r1 = ['A', 'A', 'B', 'B'];
    const r2 = ['A', 'B', 'A', 'B'];
    const result = scottPi(r1, r2);
    // Po = 0.5; joint marginal p_A = (2+2)/(2*4) = 0.5, p_B = 0.5
    // Pe = 0.5^2 + 0.5^2 = 0.5; π = 0
    expect(result.value).toBeCloseTo(0.0, 5);
  });

  it('returns correct shape', () => {
    const r1 = ['yes', 'yes', 'no', 'yes', 'no'];
    const r2 = ['yes', 'no', 'no', 'yes', 'yes'];
    const result = scottPi(r1, r2);
    expect(result.metric).toBe('scotts-pi');
    expect(typeof result.value).toBe('number');
    expect(typeof result.observed).toBe('number');
    expect(typeof result.expected).toBe('number');
    expect(result.categories).toBeDefined();
    expect(result.interpretation).toBeDefined();
  });

  it('differs from Cohen Kappa when rater marginals differ (bias present)', () => {
    // rater1 is biased toward "yes" (4/5), rater2 is biased toward "no" (4/5)
    const r1 = ['yes', 'yes', 'yes', 'yes', 'no'];
    const r2 = ['no', 'no', 'no', 'no', 'yes'];
    const pi = scottPi(r1, r2);
    const kappa = cohenKappa(r1, r2);
    // These are different metrics; values will not be equal in biased case
    expect(pi.value).not.toBeCloseTo(kappa.value, 10);
  });

  it('equals Cohen Kappa when rater marginals are identical', () => {
    // When both raters have identical marginals, Scott's Pi = Cohen's Kappa
    const r1 = ['A', 'A', 'B', 'B', 'C', 'C'];
    const r2 = ['A', 'B', 'A', 'B', 'C', 'C'];
    // r1: 2A,2B,2C; r2: 2A,2B,2C — symmetric marginals
    const pi = scottPi(r1, r2);
    const kappa = cohenKappa(r1, r2);
    expect(pi.value).toBeCloseTo(kappa.value, 5);
  });

  it('throws for empty arrays', () => {
    expect(() => scottPi([], [])).toThrow();
  });

  it('throws for arrays of different lengths', () => {
    expect(() => scottPi(['A', 'B'], ['A'])).toThrow();
  });
});
