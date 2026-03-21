import { describe, it, expect } from 'vitest';
import {
  assertEqualLength,
  assertNonEmpty,
  assertConsistentRowLengths,
  assertConstantRowSums,
  assertMinAnnotators,
  detectDuplicates,
} from '../validate';

describe('assertEqualLength', () => {
  it('passes when arrays have equal lengths', () => {
    expect(() => assertEqualLength([1, 2, 3], ['a', 'b', 'c'])).not.toThrow();
  });

  it('passes for two empty arrays', () => {
    expect(() => assertEqualLength([], [])).not.toThrow();
  });

  it('throws when arrays have different lengths', () => {
    expect(() => assertEqualLength([1, 2], [1])).toThrow(
      'Arrays must have equal length: got 2 and 1'
    );
  });

  it('includes optional label in error message', () => {
    expect(() => assertEqualLength([1, 2], [1], 'annotators')).toThrow(
      'Arrays must have equal length: got 2 and 1 annotators'
    );
  });
});

describe('assertNonEmpty', () => {
  it('passes for a non-empty array', () => {
    expect(() => assertNonEmpty([1, 2, 3])).not.toThrow();
  });

  it('throws for an empty array', () => {
    expect(() => assertNonEmpty([])).toThrow('Array must be non-empty');
  });

  it('includes optional label in error message', () => {
    expect(() => assertNonEmpty([], 'labels')).toThrow('Array must be non-empty labels');
  });
});

describe('assertConsistentRowLengths', () => {
  it('passes for a matrix with consistent row lengths', () => {
    expect(() => assertConsistentRowLengths([[1, 2], [3, 4], [5, 6]])).not.toThrow();
  });

  it('passes for an empty matrix', () => {
    expect(() => assertConsistentRowLengths([])).not.toThrow();
  });

  it('passes for a single-row matrix', () => {
    expect(() => assertConsistentRowLengths([[1, 2, 3]])).not.toThrow();
  });

  it('throws when rows have different lengths', () => {
    expect(() => assertConsistentRowLengths([[1, 2], [3, 4, 5]])).toThrow(
      'Matrix has inconsistent row lengths'
    );
  });
});

describe('assertConstantRowSums', () => {
  it('passes when all rows have equal sums', () => {
    expect(() => assertConstantRowSums([[1, 2, 3], [2, 2, 2], [0, 0, 6]])).not.toThrow();
  });

  it('passes for an empty matrix', () => {
    expect(() => assertConstantRowSums([])).not.toThrow();
  });

  it('passes for a single row', () => {
    expect(() => assertConstantRowSums([[3, 2, 1]])).not.toThrow();
  });

  it('throws when rows have different sums', () => {
    expect(() => assertConstantRowSums([[1, 2], [3, 4]])).toThrow(
      'Category-count matrix rows must have equal sums'
    );
  });

  it('passes with floating-point values within tolerance', () => {
    expect(() => assertConstantRowSums([[0.1, 0.2, 0.7], [0.4, 0.4, 0.2]])).not.toThrow();
  });
});

describe('assertMinAnnotators', () => {
  it('passes for exactly 2 annotators', () => {
    expect(() => assertMinAnnotators(2)).not.toThrow();
  });

  it('passes for more than 2 annotators', () => {
    expect(() => assertMinAnnotators(5)).not.toThrow();
  });

  it('throws for 1 annotator', () => {
    expect(() => assertMinAnnotators(1)).toThrow('At least 2 annotators required, got 1');
  });

  it('throws for 0 annotators', () => {
    expect(() => assertMinAnnotators(0)).toThrow('At least 2 annotators required, got 0');
  });
});

describe('detectDuplicates', () => {
  it('returns empty array when there are no duplicates', () => {
    const triples = [
      { item: 1, annotator: 'A' },
      { item: 1, annotator: 'B' },
      { item: 2, annotator: 'A' },
    ];
    expect(detectDuplicates(triples)).toEqual([]);
  });

  it('returns the duplicate pair when a pair appears more than once', () => {
    const triples = [
      { item: 1, annotator: 'A' },
      { item: 1, annotator: 'A' },
      { item: 2, annotator: 'B' },
    ];
    const result = detectDuplicates(triples);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ item: 1, annotator: 'A' });
  });

  it('returns each duplicate pair only once even when it appears 3 times', () => {
    const triples = [
      { item: 'x', annotator: 1 },
      { item: 'x', annotator: 1 },
      { item: 'x', annotator: 1 },
    ];
    const result = detectDuplicates(triples);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ item: 'x', annotator: 1 });
  });

  it('returns multiple duplicate pairs when several pairs are duplicated', () => {
    const triples = [
      { item: 1, annotator: 'A' },
      { item: 1, annotator: 'A' },
      { item: 2, annotator: 'B' },
      { item: 2, annotator: 'B' },
      { item: 3, annotator: 'C' },
    ];
    const result = detectDuplicates(triples);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual({ item: 1, annotator: 'A' });
    expect(result).toContainEqual({ item: 2, annotator: 'B' });
  });

  it('returns empty array for an empty input', () => {
    expect(detectDuplicates([])).toEqual([]);
  });
});
