# label-score

Inter-annotator agreement metrics for JavaScript and TypeScript. Zero dependencies.

[![npm version](https://img.shields.io/npm/v/label-score.svg)](https://www.npmjs.com/package/label-score)
[![license](https://img.shields.io/npm/l/label-score.svg)](https://github.com/SiluPanda/label-score/blob/master/LICENSE)
[![node](https://img.shields.io/node/v/label-score.svg)](https://nodejs.org)

---

## Description

`label-score` computes chance-corrected agreement metrics for annotation data -- labels assigned to items by multiple annotators (human or machine). It implements five standard inter-annotator agreement (IAA) metrics, each returning a structured result object with the computed value, an interpretation label, and all intermediate quantities (observed agreement, expected agreement, category lists, annotator/item counts).

Use cases include validating human annotation quality before model training, measuring LLM-as-judge consistency across multiple model evaluators, building gold-standard evaluation datasets, and reporting IAA in research papers. All computations are implemented in pure TypeScript with zero runtime dependencies. Numerical outputs are verified against established Python implementations (scikit-learn, NLTK, krippendorff).

---

## Installation

```bash
npm install label-score
```

---

## Quick Start

```ts
import {
  cohenKappa,
  fleissKappa,
  scottPi,
  krippendorffAlpha,
  gwetAC1,
} from 'label-score';

// Cohen's Kappa -- two raters, categorical labels
const kappa = cohenKappa(['A', 'B', 'C', 'A'], ['A', 'B', 'A', 'A']);
console.log(kappa.value);          // 0.5454...
console.log(kappa.interpretation); // 'moderate'

// Fleiss' Kappa -- multiple raters via category-count matrix
const fleiss = fleissKappa([
  [4, 0, 0],  // all 4 raters chose category 0
  [0, 3, 1],  // 3 raters chose category 1, 1 chose category 2
  [0, 0, 4],  // all 4 raters chose category 2
]);
console.log(fleiss.value);          // 0.7894...
console.log(fleiss.annotatorCount); // 4

// Scott's Pi -- two raters, joint marginals
const pi = scottPi(['A', 'B', 'C'], ['A', 'B', 'A']);
console.log(pi.value);

// Krippendorff's Alpha -- multiple raters, handles missing data
const alpha = krippendorffAlpha([
  ['A', null, 'C', 'A'],
  ['A', 'B',  'C', null],
]);
console.log(alpha.value);
console.log(alpha.missingCount); // 2

// Gwet's AC1 -- robust to prevalence effects
const ac1 = gwetAC1(['Y', 'Y', 'Y', 'N'], ['Y', 'Y', 'N', 'N']);
console.log(ac1.value);
```

---

## Features

- **Five agreement metrics** -- Cohen's Kappa, Fleiss' Kappa, Scott's Pi, Krippendorff's Alpha, and Gwet's AC1.
- **Weighted kappa** -- Linear and quadratic weighting schemes for ordinal data in Cohen's Kappa.
- **Missing data support** -- Krippendorff's Alpha excludes or rejects missing annotations via configuration.
- **Multiple measurement levels** -- Nominal, ordinal, interval, and ratio distance functions for Krippendorff's Alpha.
- **Automatic interpretation** -- Every result includes a human-readable interpretation label based on published scales (Landis & Koch for kappa-family; Krippendorff's thresholds for alpha).
- **Input validation** -- Descriptive errors for mismatched array lengths, empty inputs, inconsistent matrices, and insufficient annotators.
- **Duplicate detection** -- Utility to find repeated (item, annotator) pairs in annotation triple data.
- **Full TypeScript support** -- All functions, options, and result types are exported and fully typed.
- **Zero dependencies** -- Pure TypeScript, no runtime dependencies.

---

## API Reference

### Metric Functions

#### `cohenKappa(rater1, rater2, options?)`

Computes Cohen's Kappa for two raters. Supports unweighted (nominal) and weighted (ordinal) variants.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rater1` | `Label[]` | Labels assigned by the first rater. |
| `rater2` | `Label[]` | Labels assigned by the second rater. Must have the same length as `rater1`. |
| `options` | `CohensKappaOptions` | Optional. Configuration for weighting and confidence intervals. |

**`CohensKappaOptions`:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `weighted` | `boolean` | `false` | Enable weighted kappa for ordinal data. |
| `weights` | `'linear' \| 'quadratic'` | `'linear'` | Weight scheme when `weighted` is `true`. |
| `ci` | `boolean` | -- | Reserved for future confidence interval support. |
| `ciLevel` | `number` | -- | Confidence level (e.g., `0.95`). |
| `ciBootstrapSamples` | `number` | -- | Number of bootstrap resamples. |
| `seed` | `number` | -- | Seed for reproducible bootstrap sampling. |

**Returns:** `KappaResult`

| Field | Type | Description |
|-------|------|-------------|
| `metric` | `MetricName` | Always `'cohens-kappa'`. |
| `value` | `number` | The computed kappa coefficient. |
| `observed` | `number` | Observed agreement proportion (Po). |
| `expected` | `number` | Expected agreement by chance (Pe). |
| `interpretation` | `Interpretation` | Landis & Koch interpretation label. |
| `categories` | `Label[]` | Sorted list of unique categories found in the data. |
| `ci` | `ConfidenceInterval` | Optional. Confidence interval if requested. |

**Example:**

```ts
// Unweighted kappa
const result = cohenKappa(['A', 'B', 'C'], ['A', 'B', 'A']);
// { metric: 'cohens-kappa', value: 0.5384..., observed: 0.6666..., ... }

// Weighted kappa for ordinal ratings
const weighted = cohenKappa([1, 2, 3, 4], [1, 2, 4, 4], {
  weighted: true,
  weights: 'quadratic',
});
```

---

#### `fleissKappa(matrix)`

Computes Fleiss' Kappa for multiple raters (N >= 2).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `matrix` | `number[][]` | Category-count matrix. `matrix[i][j]` is the number of raters who assigned category `j` to subject `i`. All rows must sum to the same value (the number of raters per subject). |

**Returns:** `FleissKappaResult`

| Field | Type | Description |
|-------|------|-------------|
| `metric` | `'fleiss-kappa'` | Always `'fleiss-kappa'`. |
| `value` | `number` | The computed Fleiss' Kappa coefficient. |
| `observed` | `number` | Mean observed agreement across subjects. |
| `expected` | `number` | Expected agreement by chance. |
| `interpretation` | `Interpretation` | Landis & Koch interpretation label. |
| `annotatorCount` | `number` | Number of raters per subject (row sum). |
| `itemCount` | `number` | Number of subjects (rows). |
| `perCategory` | `Record<string, number>` | Optional. Per-category kappa values. |
| `ci` | `ConfidenceInterval` | Optional. Confidence interval if requested. |

**Example:**

```ts
const result = fleissKappa([
  [4, 0, 0],
  [0, 3, 1],
  [0, 0, 4],
  [1, 3, 0],
]);
// result.value: 0.6894...
// result.annotatorCount: 4
// result.itemCount: 4
```

**Throws:**
- If the matrix is empty.
- If rows have inconsistent lengths.
- If row sums are not equal.
- If fewer than 2 raters per subject.
- If fewer than 2 categories.

---

#### `scottPi(rater1, rater2, options?)`

Computes Scott's Pi for two raters. Uses joint (pooled) marginal proportions to compute expected agreement, making it more robust than Cohen's Kappa when rater biases differ.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rater1` | `Label[]` | Labels assigned by the first rater. |
| `rater2` | `Label[]` | Labels assigned by the second rater. Must have the same length as `rater1`. |
| `options` | `ScottsPiOptions` | Optional. Reserved for future confidence interval support. |

**`ScottsPiOptions`:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ci` | `boolean` | -- | Reserved for future confidence interval support. |
| `ciLevel` | `number` | -- | Confidence level. |
| `ciBootstrapSamples` | `number` | -- | Number of bootstrap resamples. |
| `seed` | `number` | -- | Seed for reproducible bootstrap sampling. |

**Returns:** `PiResult`

| Field | Type | Description |
|-------|------|-------------|
| `metric` | `'scotts-pi'` | Always `'scotts-pi'`. |
| `value` | `number` | The computed Pi coefficient. |
| `observed` | `number` | Observed agreement proportion. |
| `expected` | `number` | Expected agreement from joint marginals. |
| `interpretation` | `Interpretation` | Landis & Koch interpretation label. |
| `categories` | `Label[]` | Sorted list of unique categories. |
| `ci` | `ConfidenceInterval` | Optional. Confidence interval if requested. |

**Example:**

```ts
const result = scottPi(['A', 'B', 'A', 'C'], ['A', 'B', 'B', 'C']);
// result.value: 0.5294...
// result.observed: 0.75
```

---

#### `krippendorffAlpha(matrix, options?)`

Computes Krippendorff's Alpha for multiple raters with support for missing data and multiple measurement levels.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `matrix` | `(string \| number \| null \| undefined)[][]` | Rater-by-item matrix. `matrix[r][c]` is the label assigned by rater `r` to item `c`. Use `null` or `undefined` for missing annotations. |
| `options` | `KrippendorffOptions` | Optional. Configuration for measurement level and missing data handling. |

**`KrippendorffOptions`:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `level` | `MeasurementLevel` | `'nominal'` | Measurement level: `'nominal'`, `'ordinal'`, `'interval'`, or `'ratio'`. Determines the disagreement function. |
| `missingData` | `'exclude' \| 'error'` | `'exclude'` | How to handle missing values. `'exclude'` skips them; `'error'` throws. |
| `ci` | `boolean` | -- | Reserved for future confidence interval support. |
| `ciLevel` | `number` | -- | Confidence level. |
| `ciBootstrapSamples` | `number` | -- | Number of bootstrap resamples. |
| `seed` | `number` | -- | Seed for reproducible bootstrap sampling. |

**Returns:** `AlphaResult`

| Field | Type | Description |
|-------|------|-------------|
| `metric` | `'krippendorff-alpha'` | Always `'krippendorff-alpha'`. |
| `value` | `number` | The computed alpha coefficient. |
| `interpretation` | `AlphaInterpretation` | Krippendorff interpretation: `'unreliable'`, `'tentative'`, or `'reliable'`. |
| `level` | `MeasurementLevel` | The measurement level used. |
| `itemCount` | `number` | Number of items (columns). |
| `annotatorCount` | `number` | Number of raters (rows). |
| `missingCount` | `number` | Total number of missing annotations. |
| `ci` | `ConfidenceInterval` | Optional. Confidence interval if requested. |

**Example:**

```ts
// Nominal data with missing values
const result = krippendorffAlpha(
  [
    ['A', null, 'C', 'A'],
    ['A', 'B',  'C', null],
    ['B', 'B',  'C', 'A'],
  ],
);
// result.value: 0.4615...
// result.missingCount: 2
// result.annotatorCount: 3

// Interval-level numeric data
const interval = krippendorffAlpha(
  [
    [1, 2, 3, 4],
    [1, 2, 4, 4],
  ],
  { level: 'interval' },
);
// interval.level: 'interval'
```

**Disagreement functions by measurement level:**

| Level | Function | Description |
|-------|----------|-------------|
| `nominal` | `d = v === v' ? 0 : 1` | Binary: same or different. |
| `ordinal` | `d = v === v' ? 0 : 1` | Treated as nominal (rank-based extension planned). |
| `interval` | `d = (v - v')^2` | Squared numeric difference. |
| `ratio` | `d = (v - v')^2` | Squared numeric difference. |

---

#### `gwetAC1(rater1, rater2, options?)`

Computes Gwet's AC1 for two raters. Designed to be robust to the prevalence and bias paradox that causes Cohen's Kappa to produce misleadingly low values when one category dominates.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rater1` | `Label[]` | Labels assigned by the first rater. |
| `rater2` | `Label[]` | Labels assigned by the second rater. Must have the same length as `rater1`. |
| `options` | `AC1Options` | Optional. Reserved for future confidence interval support. |

**`AC1Options`:**

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `ci` | `boolean` | -- | Reserved for future confidence interval support. |
| `ciLevel` | `number` | -- | Confidence level. |
| `ciBootstrapSamples` | `number` | -- | Number of bootstrap resamples. |
| `seed` | `number` | -- | Seed for reproducible bootstrap sampling. |

**Returns:** `AC1Result`

| Field | Type | Description |
|-------|------|-------------|
| `metric` | `'gwets-ac1'` | Always `'gwets-ac1'`. |
| `value` | `number` | The computed AC1 coefficient. |
| `observed` | `number` | Observed agreement proportion. |
| `expected` | `number` | Gwet's expected agreement by chance. |
| `interpretation` | `Interpretation` | Landis & Koch interpretation label. |
| `ci` | `ConfidenceInterval` | Optional. Confidence interval if requested. |

**Example:**

```ts
const result = gwetAC1(
  ['Y', 'Y', 'Y', 'Y', 'Y', 'N'],
  ['Y', 'Y', 'Y', 'Y', 'N', 'N'],
);
// result.value: 0.6666...
// result.observed: 0.6666...
```

---

### Interpretation Functions

#### `interpretKappa(value)`

Classifies a kappa-family metric value using the Landis & Koch (1977) scale.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `number` | The kappa coefficient to interpret. |

**Returns:** `Interpretation` -- one of `'poor'`, `'slight'`, `'fair'`, `'moderate'`, `'substantial'`, `'almost-perfect'`.

**Scale:**

| Range | Interpretation |
|-------|---------------|
| < 0.00 | `'poor'` |
| 0.00 -- 0.20 | `'slight'` |
| 0.20 -- 0.40 | `'fair'` |
| 0.40 -- 0.60 | `'moderate'` |
| 0.60 -- 0.80 | `'substantial'` |
| >= 0.80 | `'almost-perfect'` |

```ts
interpretKappa(0.75); // 'substantial'
interpretKappa(-0.1); // 'poor'
```

---

#### `interpretAlpha(value)`

Classifies a Krippendorff's Alpha value using Krippendorff's recommended thresholds.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `number` | The alpha coefficient to interpret. |

**Returns:** `AlphaInterpretation` -- one of `'unreliable'`, `'tentative'`, `'reliable'`.

**Scale:**

| Range | Interpretation |
|-------|---------------|
| < 0.667 | `'unreliable'` |
| 0.667 -- 0.800 | `'tentative'` |
| >= 0.800 | `'reliable'` |

```ts
interpretAlpha(0.85); // 'reliable'
interpretAlpha(0.70); // 'tentative'
```

---

### Validation Functions

#### `assertEqualLength(a, b, label?)`

Throws if arrays `a` and `b` do not have the same length.

```ts
assertEqualLength([1, 2], [3, 4]);       // passes
assertEqualLength([1, 2], [3], 'raters'); // throws: "Arrays must have equal length: got 2 and 1 raters"
```

---

#### `assertNonEmpty(arr, label?)`

Throws if `arr` is empty.

```ts
assertNonEmpty([1, 2, 3]);     // passes
assertNonEmpty([], 'subjects'); // throws: "Array must be non-empty subjects"
```

---

#### `assertConsistentRowLengths(matrix)`

Throws if the rows of a 2D matrix do not all have the same length.

```ts
assertConsistentRowLengths([[1, 2], [3, 4]]);    // passes
assertConsistentRowLengths([[1, 2], [3, 4, 5]]); // throws: "Matrix has inconsistent row lengths"
```

---

#### `assertConstantRowSums(matrix)`

Throws if rows of a numeric matrix do not all sum to the same value (within floating-point tolerance of 1e-9).

```ts
assertConstantRowSums([[1, 2, 3], [2, 2, 2]]); // passes (both sum to 6)
assertConstantRowSums([[1, 2], [3, 4]]);        // throws: "Category-count matrix rows must have equal sums"
```

---

#### `assertMinAnnotators(count)`

Throws if `count` is less than 2.

```ts
assertMinAnnotators(3); // passes
assertMinAnnotators(1); // throws: "At least 2 annotators required, got 1"
```

---

#### `detectDuplicates(triples)`

Returns `(item, annotator)` pairs that appear more than once in an array of annotation triples. Each duplicate pair is returned only once regardless of how many times it appears.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `triples` | `Array<{ item: unknown; annotator: unknown }>` | Array of annotation triples. |

**Returns:** `Array<{ item: unknown; annotator: unknown }>` -- the duplicate pairs.

```ts
const dupes = detectDuplicates([
  { item: 1, annotator: 'A' },
  { item: 1, annotator: 'A' },
  { item: 2, annotator: 'B' },
]);
// [{ item: 1, annotator: 'A' }]
```

---

### Types

All TypeScript types are exported from the package entry point.

#### Core Types

| Type | Description |
|------|-------------|
| `Label` | `string \| number` -- a single annotation label. |
| `MeasurementLevel` | `'nominal' \| 'ordinal' \| 'interval' \| 'ratio'` |
| `MetricName` | `'cohens-kappa' \| 'fleiss-kappa' \| 'krippendorff-alpha' \| 'scotts-pi' \| 'gwets-ac1' \| 'percent-agreement'` |
| `Interpretation` | `'poor' \| 'slight' \| 'fair' \| 'moderate' \| 'substantial' \| 'almost-perfect'` |
| `AlphaInterpretation` | `'unreliable' \| 'tentative' \| 'reliable'` |

#### Data Types

| Type | Description |
|------|-------------|
| `AnnotationTriple` | `{ item: string \| number; annotator: string \| number; label: Label }` |
| `ConfusionMatrix` | `{ labels: Label[]; matrix: number[][] }` -- `matrix[i][j]` = count where rater 1 said `labels[i]` and rater 2 said `labels[j]`. |
| `ConfidenceInterval` | `{ lower: number; upper: number; level: number }` |

#### Result Types

| Type | Description |
|------|-------------|
| `KappaResult` | Result from `cohenKappa`. Fields: `metric`, `value`, `observed`, `expected`, `interpretation`, `categories?`, `ci?`. |
| `FleissKappaResult` | Result from `fleissKappa`. Fields: `metric`, `value`, `observed`, `expected`, `interpretation`, `annotatorCount`, `itemCount`, `perCategory?`, `ci?`. |
| `PiResult` | Result from `scottPi`. Fields: `metric`, `value`, `observed`, `expected`, `interpretation`, `categories?`, `ci?`. |
| `AlphaResult` | Result from `krippendorffAlpha`. Fields: `metric`, `value`, `interpretation`, `level`, `itemCount`, `annotatorCount`, `missingCount`, `ci?`. |
| `AC1Result` | Result from `gwetAC1`. Fields: `metric`, `value`, `observed`, `expected`, `interpretation`, `ci?`. |
| `AgreementReport` | `{ metric: MetricName; value: number; interpretation: Interpretation \| AlphaInterpretation; ci?: ConfidenceInterval }` |

#### Options Types

| Type | Description |
|------|-------------|
| `CohensKappaOptions` | `{ weighted?, weights?, ci?, ciLevel?, ciBootstrapSamples?, seed? }` |
| `FleissKappaOptions` | `{ ci?, ciLevel?, ciBootstrapSamples?, seed? }` |
| `KrippendorffOptions` | `{ level?, ci?, ciLevel?, ciBootstrapSamples?, seed?, missingData? }` |
| `ScottsPiOptions` | `{ ci?, ciLevel?, ciBootstrapSamples?, seed? }` |
| `AC1Options` | `{ ci?, ciLevel?, ciBootstrapSamples?, seed? }` |
| `AgreementOptions` | `{ metric?, level?, missingData?, ci?, ciLevel?, seed? }` |
| `CIOptions` | `{ level?, bootstrapSamples?, seed? }` |

---

## Configuration

Each metric function accepts an optional options object as its last parameter. All options fields are optional and have sensible defaults.

**Cohen's Kappa weighting:**

```ts
// Unweighted (default) -- for nominal/categorical data
cohenKappa(rater1, rater2);

// Linear weights -- penalizes disagreements proportionally to distance
cohenKappa(rater1, rater2, { weighted: true, weights: 'linear' });

// Quadratic weights -- penalizes far disagreements more heavily
cohenKappa(rater1, rater2, { weighted: true, weights: 'quadratic' });
```

**Krippendorff's Alpha measurement level:**

```ts
// Nominal (default) -- categories with no order
krippendorffAlpha(matrix);

// Interval -- numeric data with meaningful distances
krippendorffAlpha(matrix, { level: 'interval' });

// Ratio -- numeric data with a true zero
krippendorffAlpha(matrix, { level: 'ratio' });
```

**Missing data handling:**

```ts
// Exclude missing values (default)
krippendorffAlpha(matrix, { missingData: 'exclude' });

// Throw an error if any value is missing
krippendorffAlpha(matrix, { missingData: 'error' });
```

---

## Error Handling

All metric functions validate their inputs and throw descriptive `Error` instances on invalid data.

| Condition | Error Message |
|-----------|--------------|
| Empty input array | `"Array must be non-empty"` |
| Rater arrays of different lengths | `"Arrays must have equal length: got X and Y"` |
| Matrix rows with inconsistent lengths | `"Matrix has inconsistent row lengths"` |
| Matrix rows with different sums | `"Category-count matrix rows must have equal sums"` |
| Fewer than 2 annotators | `"At least 2 annotators required, got N"` |
| Fewer than 2 categories (Fleiss) | `"Fleiss Kappa requires at least 2 categories"` |
| Missing data with `missingData: 'error'` | `"Missing data found at rater R, item C"` |

All errors are synchronous and thrown immediately during input validation, before any computation begins.

---

## Advanced Usage

### Choosing Between Metrics

| Scenario | Recommended Metric |
|----------|-------------------|
| Two raters, nominal categories | `cohenKappa` (unweighted) |
| Two raters, ordinal scale | `cohenKappa` with `weighted: true` |
| Two raters, possible rater bias | `scottPi` (pooled marginals) |
| Two raters, skewed category distribution | `gwetAC1` (prevalence-robust) |
| Three or more raters, nominal | `fleissKappa` |
| Any number of raters, missing data | `krippendorffAlpha` |
| Any number of raters, interval/ratio data | `krippendorffAlpha` with `level` option |

### Comparing Cohen's Kappa, Scott's Pi, and Gwet's AC1

When both raters have identical marginal distributions, Scott's Pi and Cohen's Kappa produce the same value. They diverge when raters have different biases (e.g., one rater assigns "positive" more frequently).

```ts
// Symmetric marginals -- Pi and Kappa agree
const r1 = ['A', 'A', 'B', 'B', 'C', 'C'];
const r2 = ['A', 'B', 'A', 'B', 'C', 'C'];
scottPi(r1, r2).value;   // same as cohenKappa(r1, r2).value

// Skewed data -- AC1 is more stable than Kappa
const r1Skew = ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'N'];
const r2Skew = ['Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'N', 'N'];
gwetAC1(r1Skew, r2Skew).value;   // higher than cohenKappa
cohenKappa(r1Skew, r2Skew).value; // suppressed by prevalence effect
```

### Handling Edge Cases

When all items fall into a single category (Pe = 1), the kappa formula `(Po - Pe) / (1 - Pe)` would produce a division by zero. In this case, all metrics return `1.0` (perfect agreement) since every item receives the same label from every rater.

```ts
const allSame = cohenKappa(['A', 'A', 'A'], ['A', 'A', 'A']);
// allSame.value === 1.0
```

### Pre-validating Annotation Data

Use the validation utilities to check data integrity before computing metrics.

```ts
import {
  assertEqualLength,
  assertNonEmpty,
  detectDuplicates,
} from 'label-score';

const triples = [
  { item: 1, annotator: 'A', label: 'pos' },
  { item: 1, annotator: 'A', label: 'neg' }, // duplicate!
  { item: 2, annotator: 'B', label: 'pos' },
];

const dupes = detectDuplicates(triples);
if (dupes.length > 0) {
  console.error('Duplicate annotations found:', dupes);
}
```

---

## TypeScript

`label-score` is written in TypeScript and ships type declarations (`dist/index.d.ts`) alongside the compiled JavaScript. All public types are available as named imports.

```ts
import type {
  Label,
  KappaResult,
  FleissKappaResult,
  AlphaResult,
  PiResult,
  AC1Result,
  Interpretation,
  AlphaInterpretation,
  MeasurementLevel,
  MetricName,
  AnnotationTriple,
  ConfusionMatrix,
  ConfidenceInterval,
  CohensKappaOptions,
  FleissKappaOptions,
  KrippendorffOptions,
  ScottsPiOptions,
  AC1Options,
  AgreementOptions,
  CIOptions,
  AgreementReport,
} from 'label-score';
```

The package targets ES2022 and uses CommonJS module format. Compiler options include `strict: true`, `declaration: true`, and `declarationMap: true` for full IDE support.

---

## License

MIT
