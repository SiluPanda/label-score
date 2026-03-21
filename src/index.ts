// label-score - Inter-annotator agreement metrics in JavaScript
export type {
  Label,
  MeasurementLevel,
  MetricName,
  AnnotationTriple,
  Interpretation,
  AlphaInterpretation,
  ConfidenceInterval,
  KappaResult,
  FleissKappaResult,
  AlphaResult,
  PiResult,
  AC1Result,
  ConfusionMatrix,
  CohensKappaOptions,
  FleissKappaOptions,
  KrippendorffOptions,
  ScottsPiOptions,
  AC1Options,
  AgreementOptions,
  CIOptions,
  AgreementReport,
} from './types';
export { interpretKappa, interpretAlpha } from './interpret';
export {
  assertEqualLength,
  assertNonEmpty,
  assertConsistentRowLengths,
  assertConstantRowSums,
  assertMinAnnotators,
  detectDuplicates,
} from './validate';
