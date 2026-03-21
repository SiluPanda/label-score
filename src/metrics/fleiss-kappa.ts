import type { FleissKappaResult } from '../types';
import { assertNonEmpty, assertConsistentRowLengths, assertConstantRowSums, assertMinAnnotators } from '../validate';
import { interpretKappa } from '../interpret';

/**
 * Computes Fleiss' Kappa for multiple raters.
 *
 * Input: matrix[n_subjects][n_categories]
 *   matrix[i][j] = number of raters who assigned category j to subject i
 *   All rows must sum to the same value n (the number of raters per subject).
 *
 * Formula:
 *   P̄  = (1/n_subjects) * Σ_i P_i
 *   P_i = (1 / (n*(n-1))) * (Σ_j n_ij*(n_ij - 1))
 *   p_j = (1 / (n_subjects * n)) * Σ_i n_ij   (marginal proportion for category j)
 *   P̄_e = Σ_j p_j²
 *   κ   = (P̄ - P̄_e) / (1 - P̄_e)
 */
export function fleissKappa(matrix: number[][]): FleissKappaResult {
  assertNonEmpty(matrix, 'matrix');
  assertConsistentRowLengths(matrix);
  assertConstantRowSums(matrix);

  const N = matrix.length;         // number of subjects
  const k = matrix[0].length;      // number of categories

  if (k < 2) {
    throw new Error('Fleiss Kappa requires at least 2 categories');
  }

  // n = number of raters per subject (row sum, constant across rows)
  const n = matrix[0].reduce((s, v) => s + v, 0);

  assertMinAnnotators(n);

  // p_j: marginal proportion for each category
  const pj = Array.from({ length: k }, (_, j) =>
    matrix.reduce((s, row) => s + row[j], 0) / (N * n)
  );

  // P_i: per-subject agreement
  const Pi = matrix.map(row => {
    const sumSquares = row.reduce((s, nij) => s + nij * (nij - 1), 0);
    return sumSquares / (n * (n - 1));
  });

  const Pbar = Pi.reduce((s, p) => s + p, 0) / N;
  const Pe = pj.reduce((s, p) => s + p * p, 0);

  if (Pe >= 1 - 1e-12) {
    return {
      metric: 'fleiss-kappa',
      value: 1.0,
      observed: Pbar,
      expected: Pe,
      interpretation: interpretKappa(1.0),
      annotatorCount: n,
      itemCount: N,
    };
  }

  const value = (Pbar - Pe) / (1 - Pe);

  return {
    metric: 'fleiss-kappa',
    value,
    observed: Pbar,
    expected: Pe,
    interpretation: interpretKappa(value),
    annotatorCount: n,
    itemCount: N,
  };
}
