import type { Label, AC1Result, AC1Options } from '../types';
import { assertEqualLength, assertNonEmpty } from '../validate';
import { interpretKappa } from '../interpret';

/**
 * Computes Gwet's AC1 for two raters.
 *
 * Gwet's AC1 is designed to be robust to the prevalence and bias effects
 * that can inflate or deflate Cohen's Kappa when category distributions are skewed.
 *
 * Formula:
 *   Po      = observed agreement proportion
 *   q       = number of categories
 *   p_k     = marginal proportion for category k (average of both raters' proportions)
 *   Pe_gwet = (1/(q-1)) * Σ_k p_k * (1 - p_k)
 *   AC1     = (Po - Pe_gwet) / (1 - Pe_gwet)
 *
 * When q = 1, all items are in the same category; Pe_gwet = 0, AC1 = Po.
 * Edge case: Pe_gwet >= 1 returns 1.0.
 */
export function gwetAC1(
  rater1: Label[],
  rater2: Label[],
  options: AC1Options = {}  // reserved for future CI support
): AC1Result {
  void options;
  assertNonEmpty(rater1, 'rater1');
  assertEqualLength(rater1, rater2, '(rater1 vs rater2)');

  const n = rater1.length;

  // Build unique categories
  const categorySet = new Set<Label>();
  for (const v of rater1) categorySet.add(v);
  for (const v of rater2) categorySet.add(v);
  const categories = Array.from(categorySet);
  const q = categories.length;

  // Observed agreement
  let agreements = 0;
  for (let i = 0; i < n; i++) {
    if (rater1[i] === rater2[i]) agreements++;
  }
  const Po = agreements / n;

  // Marginal proportion for each category: average of rater1 and rater2 proportions
  const counts1 = new Map<Label, number>();
  const counts2 = new Map<Label, number>();
  for (const v of rater1) counts1.set(v, (counts1.get(v) ?? 0) + 1);
  for (const v of rater2) counts2.set(v, (counts2.get(v) ?? 0) + 1);

  let Pe = 0;
  if (q === 1) {
    // Only one category; by definition Pe_gwet = 0
    Pe = 0;
  } else {
    for (const cat of categories) {
      const p1k = (counts1.get(cat) ?? 0) / n;
      const p2k = (counts2.get(cat) ?? 0) / n;
      const pk = (p1k + p2k) / 2;
      Pe += pk * (1 - pk);
    }
    Pe /= (q - 1);
  }

  if (Pe >= 1 - 1e-12) {
    return {
      metric: 'gwets-ac1',
      value: 1.0,
      observed: Po,
      expected: Pe,
      interpretation: interpretKappa(1.0),
    };
  }

  const value = (Po - Pe) / (1 - Pe);

  return {
    metric: 'gwets-ac1',
    value,
    observed: Po,
    expected: Pe,
    interpretation: interpretKappa(value),
  };
}
