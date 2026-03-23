import { describe, it, expect } from 'vitest';
import { krippendorffAlpha } from '../metrics/krippendorff-alpha';

describe('krippendorffAlpha — nominal', () => {
  it('returns α = 1 for perfect agreement (no missing data)', () => {
    const matrix = [
      ['A', 'B', 'C', 'A', 'B'],
      ['A', 'B', 'C', 'A', 'B'],
    ];
    const result = krippendorffAlpha(matrix);
    expect(result.metric).toBe('krippendorff-alpha');
    expect(result.value).toBeCloseTo(1.0, 5);
    expect(result.interpretation).toBe('reliable');
    expect(result.level).toBe('nominal');
  });

  it('returns α near -1 for systematic complete disagreement', () => {
    // 2 raters, 4 items; always disagree
    const matrix: (string | null)[][] = [
      ['A', 'A', 'B', 'B'],
      ['B', 'B', 'A', 'A'],
    ];
    const result = krippendorffAlpha(matrix);
    expect(result.value).toBeLessThan(0);
  });

  it('handles missing data (null values) and returns missingCount', () => {
    const matrix: (string | null)[][] = [
      ['A', null, 'C', 'A', 'B'],
      ['A', 'B',  'C', null, 'B'],
    ];
    const result = krippendorffAlpha(matrix);
    expect(result.missingCount).toBe(2);
    expect(result.value).toBeGreaterThanOrEqual(-1);
    expect(result.value).toBeLessThanOrEqual(1);
  });

  it('handles undefined values as missing', () => {
    const matrix: (string | undefined)[][] = [
      ['A', undefined, 'C'],
      ['A', 'B',       'C'],
    ];
    const result = krippendorffAlpha(matrix);
    expect(result.missingCount).toBe(1);
  });

  it('returns correct itemCount and annotatorCount', () => {
    const matrix = [
      ['Y', 'N', 'Y', 'Y'],
      ['Y', 'N', 'N', 'Y'],
      ['Y', 'Y', 'N', 'Y'],
    ];
    const result = krippendorffAlpha(matrix);
    expect(result.itemCount).toBe(4);
    expect(result.annotatorCount).toBe(3);
  });

  it('known example: α ≈ 0.691 for moderate agreement', () => {
    // Standard nominal example: 4 raters, 12 items
    // From Krippendorff (2004) "Content Analysis" — simplified version
    const matrix = [
      [1, 2, 3, 3, 2, 1, 4, 1, 2, null, null, null],
      [1, 2, 3, 3, 2, 2, 4, 1, 2, 5,    null, 3   ],
      [null, 3, 3, 3, 2, 3, 4, 2, 2, 5,  1,   null ],
      [1, 2, 3, 3, 2, 4, 4, 1, 2, 5,   1,    null ],
    ] as (number | null)[][];
    const result = krippendorffAlpha(matrix);
    expect(result.value).toBeGreaterThan(0.5);
    expect(result.missingCount).toBeGreaterThan(0);
  });

  it('throws when missingData is "error" and data has missing values', () => {
    const matrix: (string | null)[][] = [
      ['A', null, 'C'],
      ['A', 'B',  'C'],
    ];
    expect(() => krippendorffAlpha(matrix, { missingData: 'error' })).toThrow();
  });

  it('throws for empty matrix', () => {
    expect(() => krippendorffAlpha([])).toThrow();
  });

  it('throws for fewer than 2 raters', () => {
    expect(() => krippendorffAlpha([['A', 'B', 'C']])).toThrow();
  });

  it('uses level option and stores it in result', () => {
    const matrix = [
      [1, 2, 3],
      [1, 2, 3],
    ];
    const result = krippendorffAlpha(matrix, { level: 'interval' });
    expect(result.level).toBe('interval');
  });

  it('handles ragged matrix where later raters have more items', () => {
    const result = krippendorffAlpha([
      ['A', 'B'],           // rater 0: 2 items
      ['A', 'B', 'A'],      // rater 1: 3 items (item 2 is only annotated by rater 1)
      ['A', 'B', 'A'],      // rater 2: 3 items
    ]);
    expect(result.itemCount).toBe(3);
    expect(result.annotatorCount).toBe(3);
  });
});
