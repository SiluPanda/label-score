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
export { cohenKappa } from './metrics/cohen-kappa';
export { fleissKappa } from './metrics/fleiss-kappa';
export { scottPi } from './metrics/scott-pi';
export { krippendorffAlpha } from './metrics/krippendorff-alpha';
export { gwetAC1 } from './metrics/gwet-ac1';
