import type { Label, PiResult, ScottsPiOptions } from '../types';
import { assertEqualLength, assertNonEmpty } from '../validate';
import { interpretKappa } from '../interpret';

/**
 * Computes Scott's Pi for two raters.
 *
 * Scott's Pi differs from Cohen's Kappa in how expected agreement is computed.
 * Instead of using each rater's own marginal proportions separately, it uses
 * the joint (averaged) marginal proportions from both raters combined.
 *
 * Formula:
 *   Po = observed agreement proportion
 *   p_k = (count_rater1(k) + count_rater2(k)) / (2 * n)  (joint marginal)
 *   Pe  = Σ_k p_k²
 *   π   = (Po - Pe) / (1 - Pe)
 *
 * Edge case: Pe = 1 returns 1.0.
 */
export function scottPi(
  rater1: Label[],
  rater2: Label[],
  options: ScottsPiOptions = {}  // reserved for future CI support
): PiResult {
  void options;
  assertNonEmpty(rater1, 'rater1');
  assertEqualLength(rater1, rater2, '(rater1 vs rater2)');

  const n = rater1.length;

  // Build unique categories
  const categorySet = new Set<Label>();
  for (const v of rater1) categorySet.add(v);
  for (const v of rater2) categorySet.add(v);
  const categories = Array.from(categorySet).sort((a, b) => String(a).localeCompare(String(b)));

  // Observed agreement
  let agreements = 0;
  for (let i = 0; i < n; i++) {
    if (rater1[i] === rater2[i]) agreements++;
  }
  const Po = agreements / n;

  // Joint marginal proportions
  const counts = new Map<Label, number>();
  for (const v of rater1) counts.set(v, (counts.get(v) ?? 0) + 1);
  for (const v of rater2) counts.set(v, (counts.get(v) ?? 0) + 1);

  // Pe = Σ_k ((count1_k + count2_k) / (2n))²
  let Pe = 0;
  for (const count of counts.values()) {
    const pk = count / (2 * n);
    Pe += pk * pk;
  }

  if (Pe >= 1 - 1e-12) {
    return {
      metric: 'scotts-pi',
      value: 1.0,
      observed: Po,
      expected: Pe,
      interpretation: interpretKappa(1.0),
      categories,
    };
  }

  const value = (Po - Pe) / (1 - Pe);

  return {
    metric: 'scotts-pi',
    value,
    observed: Po,
    expected: Pe,
    interpretation: interpretKappa(value),
    categories,
  };
}
