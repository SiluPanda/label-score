/**
 * Throws if a and b do not have the same length.
 */
export function assertEqualLength(a: unknown[], b: unknown[], label?: string): void {
  if (a.length !== b.length) {
    const suffix = label ? ` ${label}` : '';
    throw new Error(`Arrays must have equal length: got ${a.length} and ${b.length}${suffix}`);
  }
}

/**
 * Throws if arr is empty.
 */
export function assertNonEmpty(arr: unknown[], label?: string): void {
  if (arr.length === 0) {
    const suffix = label ? ` ${label}` : '';
    throw new Error(`Array must be non-empty${suffix}`);
  }
}

/**
 * Throws if the rows of a 2-D matrix do not all have the same length.
 */
export function assertConsistentRowLengths(matrix: unknown[][]): void {
  if (matrix.length === 0) return;
  const expectedLen = matrix[0].length;
  for (let i = 1; i < matrix.length; i++) {
    if (matrix[i].length !== expectedLen) {
      throw new Error('Matrix has inconsistent row lengths');
    }
  }
}

/**
 * Throws if rows of a numeric matrix do not all sum to the same value
 * (within floating-point tolerance).
 */
export function assertConstantRowSums(matrix: number[][]): void {
  if (matrix.length === 0) return;
  const rowSum = (row: number[]) => row.reduce((acc, v) => acc + v, 0);
  const expected = rowSum(matrix[0]);
  const tolerance = 1e-9;
  for (let i = 1; i < matrix.length; i++) {
    const s = rowSum(matrix[i]);
    if (Math.abs(s - expected) > tolerance) {
      throw new Error('Category-count matrix rows must have equal sums');
    }
  }
}

/**
 * Throws if count is less than 2.
 */
export function assertMinAnnotators(count: number): void {
  if (count < 2) {
    throw new Error(`At least 2 annotators required, got ${count}`);
  }
}

/**
 * Returns the (item, annotator) pairs that appear more than once in the given
 * array of triples. Each duplicate pair is returned only once.
 */
export function detectDuplicates(
  triples: Array<{ item: unknown; annotator: unknown }>
): Array<{ item: unknown; annotator: unknown }> {
  const seen = new Map<string, { item: unknown; annotator: unknown }>();
  const duplicates = new Map<string, { item: unknown; annotator: unknown }>();

  for (const triple of triples) {
    const key = JSON.stringify([triple.item, triple.annotator]);
    if (seen.has(key)) {
      duplicates.set(key, { item: triple.item, annotator: triple.annotator });
    } else {
      seen.set(key, { item: triple.item, annotator: triple.annotator });
    }
  }

  return Array.from(duplicates.values());
}
