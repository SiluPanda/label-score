import type { Interpretation, AlphaInterpretation } from './types';

/**
 * Interprets a kappa-family metric value using the Landis & Koch (1977) scale.
 *
 * Ranges:
 *   value < 0       → 'poor'
 *   0 ≤ value < 0.20 → 'slight'
 *   0.20 ≤ value < 0.40 → 'fair'
 *   0.40 ≤ value < 0.60 → 'moderate'
 *   0.60 ≤ value < 0.80 → 'substantial'
 *   value ≥ 0.80    → 'almost-perfect'
 */
export function interpretKappa(value: number): Interpretation {
  if (value < 0) return 'poor';
  if (value < 0.20) return 'slight';
  if (value < 0.40) return 'fair';
  if (value < 0.60) return 'moderate';
  if (value < 0.80) return 'substantial';
  return 'almost-perfect';
}

/**
 * Interprets a Krippendorff's Alpha value using Krippendorff's recommended thresholds.
 *
 * Ranges:
 *   value < 0.667       → 'unreliable'
 *   0.667 ≤ value < 0.800 → 'tentative'
 *   value ≥ 0.800       → 'reliable'
 */
export function interpretAlpha(value: number): AlphaInterpretation {
  if (value < 0.667) return 'unreliable';
  if (value < 0.800) return 'tentative';
  return 'reliable';
}
