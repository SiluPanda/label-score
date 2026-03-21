import type { Label, KappaResult, CohensKappaOptions } from '../types';
import { assertEqualLength, assertNonEmpty } from '../validate';
import { interpretKappa } from '../interpret';

/**
 * Builds a sorted list of unique categories from two label arrays.
 */
function getCategories(rater1: Label[], rater2: Label[]): Label[] {
  const set = new Set<Label>();
  for (const v of rater1) set.add(v);
  for (const v of rater2) set.add(v);
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
}

/**
 * Builds a contingency matrix where matrix[i][j] = count of items
 * where rater1 gave categories[i] and rater2 gave categories[j].
 */
function buildContingencyMatrix(
  rater1: Label[],
  rater2: Label[],
  categories: Label[]
): number[][] {
  const idx = new Map<Label, number>(categories.map((c, i) => [c, i]));
  const k = categories.length;
  const matrix: number[][] = Array.from({ length: k }, () => new Array<number>(k).fill(0));
  for (let n = 0; n < rater1.length; n++) {
    const i = idx.get(rater1[n]);
    const j = idx.get(rater2[n]);
    if (i !== undefined && j !== undefined) {
      matrix[i][j]++;
    }
  }
  return matrix;
}

/**
 * Computes Cohen's Kappa (unweighted or weighted) for two raters.
 *
 * Unweighted: κ = (Po - Pe) / (1 - Pe)
 *   Po = observed agreement proportion
 *   Pe = expected agreement by chance (product of marginal proportions)
 *
 * Weighted (linear or quadratic): disagreements are penalised by weight w[i][j].
 *   linear:    w[i][j] = |i - j| / (k - 1)
 *   quadratic: w[i][j] = (i - j)² / (k - 1)²
 *
 * Edge case: Pe = 1 (all items in one category) returns 1.0.
 */
export function cohenKappa(
  rater1: Label[],
  rater2: Label[],
  options: CohensKappaOptions = {}
): KappaResult {
  assertNonEmpty(rater1, 'rater1');
  assertEqualLength(rater1, rater2, '(rater1 vs rater2)');

  const categories = getCategories(rater1, rater2);
  const k = categories.length;
  const n = rater1.length;
  const matrix = buildContingencyMatrix(rater1, rater2, categories);

  // Row and column marginals
  const rowMarginals = matrix.map(row => row.reduce((s, v) => s + v, 0));
  const colMarginals = Array.from({ length: k }, (_, j) =>
    matrix.reduce((s, row) => s + row[j], 0)
  );

  const weighted = options.weighted === true;
  const weightScheme = options.weights ?? 'linear';

  if (!weighted || k === 1) {
    // Unweighted kappa
    const Po = matrix.reduce((s, row, i) => s + row[i], 0) / n;
    const Pe = rowMarginals.reduce((s, ri, i) => s + (ri / n) * (colMarginals[i] / n), 0);

    if (Pe >= 1 - 1e-12) {
      return {
        metric: 'cohens-kappa',
        value: 1.0,
        observed: Po,
        expected: Pe,
        interpretation: interpretKappa(1.0),
        categories,
      };
    }

    const value = (Po - Pe) / (1 - Pe);
    return {
      metric: 'cohens-kappa',
      value,
      observed: Po,
      expected: Pe,
      interpretation: interpretKappa(value),
      categories,
    };
  }

  // Weighted kappa
  // Build weight matrix: w[i][j] = disagreement weight (0 on diagonal)
  const weights: number[][] = Array.from({ length: k }, (_, i) =>
    Array.from({ length: k }, (__, j) => {
      if (i === j) return 0;
      if (weightScheme === 'quadratic') {
        return ((i - j) ** 2) / ((k - 1) ** 2);
      }
      // linear
      return Math.abs(i - j) / (k - 1);
    })
  );

  // Po_w = 1 - weighted observed disagreement
  let observedDisagreement = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      observedDisagreement += weights[i][j] * (matrix[i][j] / n);
    }
  }
  const Po = 1 - observedDisagreement;

  // Pe_w = 1 - weighted expected disagreement
  let expectedDisagreement = 0;
  for (let i = 0; i < k; i++) {
    for (let j = 0; j < k; j++) {
      expectedDisagreement += weights[i][j] * (rowMarginals[i] / n) * (colMarginals[j] / n);
    }
  }
  const Pe = 1 - expectedDisagreement;

  if (Pe >= 1 - 1e-12) {
    return {
      metric: 'cohens-kappa',
      value: 1.0,
      observed: Po,
      expected: Pe,
      interpretation: interpretKappa(1.0),
      categories,
    };
  }

  const value = (Po - Pe) / (1 - Pe);
  return {
    metric: 'cohens-kappa',
    value,
    observed: Po,
    expected: Pe,
    interpretation: interpretKappa(value),
    categories,
  };
}
