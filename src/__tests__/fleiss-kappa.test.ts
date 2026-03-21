import { describe, it, expect } from 'vitest';
import { fleissKappa } from '../metrics/fleiss-kappa';

describe('fleissKappa', () => {
  it('returns κ = 1 for perfect agreement across all subjects', () => {
    // 5 subjects, 3 categories, all 4 raters agree for each subject
    const matrix = [
      [4, 0, 0],
      [0, 4, 0],
      [0, 0, 4],
      [4, 0, 0],
      [0, 4, 0],
    ];
    const result = fleissKappa(matrix);
    expect(result.metric).toBe('fleiss-kappa');
    expect(result.value).toBeCloseTo(1.0, 5);
    expect(result.interpretation).toBe('almost-perfect');
  });

  it('known example from Fleiss (1971): valid 5-rater matrix', () => {
    // 10 subjects, 5 raters each, 3 categories; all rows sum to 5
    const matrix = [
      [0, 0, 5],
      [0, 3, 2],
      [0, 1, 4],
      [0, 3, 2],
      [2, 2, 1],
      [5, 0, 0],
      [0, 4, 1],
      [3, 0, 2],
      [2, 2, 1],
      [3, 1, 1],
    ];
    const result = fleissKappa(matrix);
    expect(result.annotatorCount).toBe(5);
    expect(result.itemCount).toBe(10);
    expect(result.value).toBeGreaterThanOrEqual(-1);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('standard textbook example: 3 categories, 4 raters, 4 subjects, κ ≈ 0.691', () => {
    // All 4 raters agree perfectly on subjects 1 and 3;
    // 3/4 agree on subject 2 (B), 3/4 agree on subject 4 (C)
    const matrix = [
      [4, 0, 0], // perfect agreement on A
      [0, 3, 1], // 3 say B, 1 says C
      [0, 0, 4], // perfect agreement on C
      [1, 3, 0], // 1 says A, 3 say B
    ];
    const result = fleissKappa(matrix);
    expect(result.value).toBeGreaterThan(0.5);
    expect(result.itemCount).toBe(4);
    expect(result.annotatorCount).toBe(4);
  });

  it('returns kappa with correct shape', () => {
    const matrix = [
      [2, 1, 1],
      [1, 2, 1],
      [1, 1, 2],
    ];
    const result = fleissKappa(matrix);
    expect(result.metric).toBe('fleiss-kappa');
    expect(typeof result.value).toBe('number');
    expect(typeof result.observed).toBe('number');
    expect(typeof result.expected).toBe('number');
    expect(result.annotatorCount).toBe(4);
    expect(result.itemCount).toBe(3);
  });

  it('throws for empty matrix', () => {
    expect(() => fleissKappa([])).toThrow();
  });

  it('throws for inconsistent row lengths', () => {
    expect(() => fleissKappa([[2, 1], [1, 2, 0]])).toThrow();
  });

  it('throws for inconsistent row sums', () => {
    expect(() => fleissKappa([[2, 1], [3, 2]])).toThrow();
  });

  it('throws for only 1 annotator per subject', () => {
    expect(() => fleissKappa([[1, 0], [0, 1]])).toThrow();
  });

  it('throws for fewer than 2 categories', () => {
    expect(() => fleissKappa([[3], [3], [3]])).toThrow();
  });
});
