# label-score

Inter-annotator agreement metrics in JavaScript. Zero dependencies.

## Installation

```bash
npm install label-score
```

## Quick Start

```ts
import {
  cohenKappa,
  fleissKappa,
  scottPi,
  krippendorffAlpha,
  gwetAC1,
  interpretKappa,
  interpretAlpha,
} from 'label-score';

// Cohen's Kappa (two raters)
const kappa = cohenKappa(['A', 'B', 'C', 'A'], ['A', 'B', 'A', 'A']);
console.log(kappa.value);          // e.g. 0.6
console.log(kappa.interpretation); // 'substantial'

// Fleiss' Kappa (multiple raters via count matrix)
const fleiss = fleissKappa([
  [4, 0, 0],  // 4 raters assigned category 0 to item 0
  [0, 3, 1],  // 3 raters assigned category 1, 1 rater assigned category 2
  [0, 0, 4],  // 4 raters assigned category 2 to item 2
]);
console.log(fleiss.value); // e.g. 0.86

// Scott's Pi (two raters, joint marginals)
const pi = scottPi(['A', 'B', 'C'], ['A', 'B', 'A']);

// Krippendorff's Alpha (multiple raters, handles missing data)
const alpha = krippendorffAlpha([
  ['A', null, 'C', 'A'],
  ['A', 'B',  'C', null],
]);
console.log(alpha.missingCount); // 2

// Gwet's AC1 (robust to prevalence effects)
const ac1 = gwetAC1(['Y', 'Y', 'Y', 'N'], ['Y', 'Y', 'N', 'N']);
```

## Interpretation Scales

### Kappa-family (Landis & Koch 1977)

| Range           | Interpretation   |
|-----------------|------------------|
| < 0.00          | poor             |
| 0.00 -- 0.20    | slight           |
| 0.20 -- 0.40    | fair             |
| 0.40 -- 0.60    | moderate         |
| 0.60 -- 0.80    | substantial      |
| >= 0.80         | almost-perfect   |

### Krippendorff's Alpha

| Range           | Interpretation |
|-----------------|----------------|
| < 0.667         | unreliable     |
| 0.667 -- 0.800  | tentative      |
| >= 0.800        | reliable       |

## Exports

### Metric Functions

#### `cohenKappa(rater1, rater2, options?): KappaResult`

Cohen's Kappa for two raters. Accepts two arrays of labels of equal length.

```ts
// Unweighted
cohenKappa(['A', 'B', 'C'], ['A', 'B', 'A']);

// Weighted (linear or quadratic) — for ordinal categories
cohenKappa([1, 2, 3, 4], [1, 2, 4, 4], { weighted: true, weights: 'quadratic' });
```

Options: `weighted` (boolean), `weights` (`'linear'` | `'quadratic'`).

Returns `KappaResult` with `metric`, `value`, `observed`, `expected`, `interpretation`, `categories`.

---

#### `fleissKappa(matrix): FleissKappaResult`

Fleiss' Kappa for multiple raters (N >= 2).

Input: `matrix[n_subjects][n_categories]` where each cell is the count of raters who assigned that category to that subject. All rows must sum to the same value (the number of raters).

```ts
fleissKappa([
  [4, 0, 0],
  [0, 3, 1],
  [1, 1, 2],
]);
```

Returns `FleissKappaResult` with `metric`, `value`, `observed`, `expected`, `interpretation`, `annotatorCount`, `itemCount`.

---

#### `scottPi(rater1, rater2, options?): PiResult`

Scott's Pi for two raters. Uses joint (averaged) marginal proportions to compute expected agreement, unlike Cohen's Kappa which uses each rater's individual marginals. This makes Scott's Pi more robust in the presence of rater bias.

```ts
scottPi(['A', 'B', 'A', 'C'], ['A', 'B', 'B', 'C']);
```

Returns `PiResult` with `metric`, `value`, `observed`, `expected`, `interpretation`, `categories`.

---

#### `krippendorffAlpha(matrix, options?): AlphaResult`

Krippendorff's Alpha for multiple raters, with support for missing data.

Input: `matrix[n_raters][n_items]`. Missing values are `null` or `undefined`; they are excluded from the calculation by default. Set `options.missingData = 'error'` to throw on missing data instead.

```ts
krippendorffAlpha([
  ['A', null, 'C', 'A'],
  ['A', 'B',  'C', null],
  ['B', 'B',  'C', 'A'],
]);
```

Options: `level` (`'nominal'` | `'ordinal'` | `'interval'` | `'ratio'`, default `'nominal'`), `missingData` (`'exclude'` | `'error'`).

Returns `AlphaResult` with `metric`, `value`, `interpretation`, `level`, `itemCount`, `annotatorCount`, `missingCount`.

---

#### `gwetAC1(rater1, rater2, options?): AC1Result`

Gwet's AC1 for two raters. Designed to be robust to the prevalence and bias paradox that can cause Cohen's Kappa to behave unexpectedly when one category dominates.

```ts
gwetAC1(['Y', 'Y', 'Y', 'Y', 'Y', 'N'], ['Y', 'Y', 'Y', 'Y', 'N', 'N']);
```

Returns `AC1Result` with `metric`, `value`, `observed`, `expected`, `interpretation`.

---

### Interpretation Functions

- **`interpretKappa(value: number): Interpretation`** -- Classifies a kappa-family metric value using the Landis & Koch scale.
- **`interpretAlpha(value: number): AlphaInterpretation`** -- Classifies a Krippendorff's Alpha value using Krippendorff's recommended thresholds.

### Validation Functions

- **`assertEqualLength(a, b, label?)`** -- Throws if two arrays have different lengths.
- **`assertNonEmpty(arr, label?)`** -- Throws if an array is empty.
- **`assertConsistentRowLengths(matrix)`** -- Throws if rows of a 2D matrix have inconsistent lengths.
- **`assertConstantRowSums(matrix)`** -- Throws if rows of a numeric matrix do not sum to the same value.
- **`assertMinAnnotators(count)`** -- Throws if the annotator count is less than 2.
- **`detectDuplicates(triples)`** -- Returns duplicate (item, annotator) pairs from an array of annotation triples.

### Types

All TypeScript types are exported for use in consuming code:

`Label`, `MeasurementLevel`, `MetricName`, `AnnotationTriple`, `Interpretation`, `AlphaInterpretation`, `ConfidenceInterval`, `KappaResult`, `FleissKappaResult`, `AlphaResult`, `PiResult`, `AC1Result`, `ConfusionMatrix`, `CohensKappaOptions`, `FleissKappaOptions`, `KrippendorffOptions`, `ScottsPiOptions`, `AC1Options`, `AgreementOptions`, `CIOptions`, `AgreementReport`

## Requirements

- Node.js >= 18

## License

MIT
