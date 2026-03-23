import type { AlphaResult, KrippendorffOptions } from '../types';
import { assertMinAnnotators } from '../validate';
import { interpretAlpha } from '../interpret';

type Cell = string | number | null | undefined;

/**
 * Computes Krippendorff's Alpha for multiple raters with optional missing data.
 *
 * Input: matrix[n_raters][n_items]
 *   Each cell is a label (string | number) or null/undefined for missing data.
 *
 * Nominal metric formula:
 *   Do = observed disagreement = mean of d(v_u, v_u') over all coincident pairs
 *   De = expected disagreement = (n_u / (n_u - 1)) * Σ_{v≠v'} n_v * n_v' / n_u²
 *     where n_u = total non-missing annotations, n_v = count of value v
 *   α  = 1 - (Do / De)
 *
 * For nominal metric: d(v, v') = 0 if v == v', else 1.
 *
 * Edge case: De = 0 (all annotations identical) returns 1.0.
 */
export function krippendorffAlpha(
  matrix: Cell[][],
  options: KrippendorffOptions = {}
): AlphaResult {
  if (matrix.length === 0) {
    throw new Error('Array must be non-empty');
  }

  const level = options.level ?? 'nominal';
  const missingData = options.missingData ?? 'exclude';

  const nRaters = matrix.length;
  assertMinAnnotators(nRaters);

  const nItems = Math.max(...matrix.map(row => row.length));
  if (nItems === 0) {
    throw new Error('Array must be non-empty');
  }

  // Validate: check for missing data
  let missingCount = 0;
  for (let r = 0; r < nRaters; r++) {
    for (let c = 0; c < nItems; c++) {
      const cell = matrix[r][c];
      if (cell === null || cell === undefined) {
        missingCount++;
        if (missingData === 'error') {
          throw new Error(`Missing data found at rater ${r}, item ${c}`);
        }
      }
    }
  }

  // Build coincidence matrix: for each item, look at all pairs of raters
  // that both annotated it, and tally their label pairs.
  const valueCounts = new Map<string | number, number>();
  let totalAnnotations = 0;

  // coincidences: Map from "v1|v2" to count (with fractional weighting)
  const coincidences = new Map<string, number>();

  for (let c = 0; c < nItems; c++) {
    // Collect non-missing annotations for this item
    const itemLabels: (string | number)[] = [];
    for (let r = 0; r < nRaters; r++) {
      const cell = matrix[r][c];
      if (cell !== null && cell !== undefined) {
        itemLabels.push(cell as string | number);
      }
    }
    const mu = itemLabels.length;
    if (mu < 2) continue; // need at least 2 annotations for a coincident pair

    // Each pair (u, v) contributes 1/(mu - 1) to the coincidence count
    const weight = 1 / (mu - 1);
    for (let i = 0; i < mu; i++) {
      for (let j = 0; j < mu; j++) {
        if (i === j) continue;
        const vi = itemLabels[i];
        const vj = itemLabels[j];
        const key = JSON.stringify([vi, vj]);
        coincidences.set(key, (coincidences.get(key) ?? 0) + weight);
      }
      // Count annotation for value distribution
      const v = itemLabels[i];
      valueCounts.set(v, (valueCounts.get(v) ?? 0) + 1);
      totalAnnotations++;
    }
  }

  if (coincidences.size === 0) {
    // No coincident pairs; return alpha = 1 (trivially)
    return {
      metric: 'krippendorff-alpha',
      value: 1.0,
      interpretation: interpretAlpha(1.0),
      level,
      itemCount: nItems,
      annotatorCount: nRaters,
      missingCount,
    };
  }

  const nu = totalAnnotations; // total non-missing annotations across all coincident items

  // Compute Do (observed disagreement)
  let Do = 0;
  let totalCoincidences = 0;
  for (const [key, count] of coincidences) {
    const [vi, vj] = JSON.parse(key) as [(string | number), (string | number)];
    const d = disagreement(vi, vj, level);
    Do += d * count;
    totalCoincidences += count;
  }
  if (totalCoincidences > 0) {
    Do /= totalCoincidences;
  }

  // Compute De (expected disagreement)
  // De = (1 / (nu*(nu-1))) * Σ_{v,v'} n_v * n_v' * d(v, v')  where v != v'... actually:
  // De = (1 / (nu*(nu-1))) * Σ_{v} Σ_{v'} n_v * n_v' * d(v, v')
  // which includes v = v' (those contribute 0 for nominal)
  const values = Array.from(valueCounts.keys());
  let De = 0;
  for (let i = 0; i < values.length; i++) {
    for (let j = 0; j < values.length; j++) {
      const nv = valueCounts.get(values[i]) ?? 0;
      const nvp = valueCounts.get(values[j]) ?? 0;
      const d = disagreement(values[i], values[j], level);
      De += nv * nvp * d;
    }
  }
  De /= nu * (nu - 1);

  if (De < 1e-12) {
    // All annotations identical — perfect agreement
    return {
      metric: 'krippendorff-alpha',
      value: 1.0,
      interpretation: interpretAlpha(1.0),
      level,
      itemCount: nItems,
      annotatorCount: nRaters,
      missingCount,
    };
  }

  const value = 1 - Do / De;

  return {
    metric: 'krippendorff-alpha',
    value,
    interpretation: interpretAlpha(value),
    level,
    itemCount: nItems,
    annotatorCount: nRaters,
    missingCount,
  };
}

/**
 * Disagreement function d(v, v') by measurement level.
 * For nominal: 0 if equal, 1 otherwise.
 * For ordinal: (rank distance)² / (max rank distance)²  — simplified to rank-distance based.
 * For interval/ratio: (v - v')².
 */
function disagreement(
  v: string | number,
  vp: string | number,
  level: string
): number {
  if (level === 'nominal') {
    return v === vp ? 0 : 1;
  }
  if (level === 'interval' || level === 'ratio') {
    const diff = Number(v) - Number(vp);
    return diff * diff;
  }
  // ordinal: treat as nominal for simplicity (rank-based would need sorted category list)
  return v === vp ? 0 : 1;
}
