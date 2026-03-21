# label-score

Inter-annotator agreement metrics in JavaScript. Zero dependencies.

## Installation

```bash
npm install label-score
```

## Quick Start

```ts
import { interpretKappa, interpretAlpha } from 'label-score';

// Interpret a Cohen's Kappa value using the Landis & Koch (1977) scale
interpretKappa(0.75); // => 'substantial'
interpretKappa(0.42); // => 'moderate'
interpretKappa(-0.1); // => 'poor'

// Interpret a Krippendorff's Alpha value
interpretAlpha(0.85); // => 'reliable'
interpretAlpha(0.72); // => 'tentative'
interpretAlpha(0.50); // => 'unreliable'
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

## Planned Metrics

The following metrics are planned for future releases:

- Cohen's Kappa (unweighted and weighted)
- Fleiss' Kappa (N annotators)
- Scott's Pi
- Krippendorff's Alpha (nominal, ordinal, interval, ratio)
- Gwet's AC1

## Requirements

- Node.js >= 18

## License

MIT
