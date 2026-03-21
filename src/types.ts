export type Label = string | number;

export type MeasurementLevel = 'nominal' | 'ordinal' | 'interval' | 'ratio';

export type MetricName =
  | 'cohens-kappa'
  | 'fleiss-kappa'
  | 'krippendorff-alpha'
  | 'scotts-pi'
  | 'gwets-ac1'
  | 'percent-agreement';

export type AnnotationTriple = {
  item: string | number;
  annotator: string | number;
  label: Label;
};

export type Interpretation = 'poor' | 'slight' | 'fair' | 'moderate' | 'substantial' | 'almost-perfect';

export type AlphaInterpretation = 'unreliable' | 'tentative' | 'reliable';

export interface ConfidenceInterval {
  lower: number;
  upper: number;
  level: number; // e.g. 0.95
}

export interface KappaResult {
  metric: MetricName;
  value: number;
  observed: number;
  expected: number;
  interpretation: Interpretation;
  ci?: ConfidenceInterval;
  categories?: Label[];
}

export interface FleissKappaResult {
  metric: 'fleiss-kappa';
  value: number;
  observed: number;
  expected: number;
  interpretation: Interpretation;
  ci?: ConfidenceInterval;
  perCategory?: Record<string, number>;
  annotatorCount: number;
  itemCount: number;
}

export interface AlphaResult {
  metric: 'krippendorff-alpha';
  value: number;
  interpretation: AlphaInterpretation;
  level: MeasurementLevel;
  ci?: ConfidenceInterval;
  itemCount: number;
  annotatorCount: number;
  missingCount: number;
}

export interface PiResult {
  metric: 'scotts-pi';
  value: number;
  observed: number;
  expected: number;
  interpretation: Interpretation;
  ci?: ConfidenceInterval;
  categories?: Label[];
}

export interface AC1Result {
  metric: 'gwets-ac1';
  value: number;
  observed: number;
  expected: number;
  interpretation: Interpretation;
  ci?: ConfidenceInterval;
}

export interface ConfusionMatrix {
  labels: Label[];
  matrix: number[][];
  /** matrix[i][j] = count of annotator1 saying label[i], annotator2 saying label[j] */
}

export interface CohensKappaOptions {
  weighted?: boolean;
  weights?: 'linear' | 'quadratic';
  ci?: boolean;
  ciLevel?: number;
  ciBootstrapSamples?: number;
  seed?: number;
}

export interface FleissKappaOptions {
  ci?: boolean;
  ciLevel?: number;
  ciBootstrapSamples?: number;
  seed?: number;
}

export interface KrippendorffOptions {
  level?: MeasurementLevel;
  ci?: boolean;
  ciLevel?: number;
  ciBootstrapSamples?: number;
  seed?: number;
  missingData?: 'exclude' | 'error';
}

export interface ScottsPiOptions {
  ci?: boolean;
  ciLevel?: number;
  ciBootstrapSamples?: number;
  seed?: number;
}

export interface AC1Options {
  ci?: boolean;
  ciLevel?: number;
  ciBootstrapSamples?: number;
  seed?: number;
}

export interface AgreementOptions {
  metric?: MetricName;
  level?: MeasurementLevel;
  missingData?: 'exclude' | 'error';
  ci?: boolean;
  ciLevel?: number;
  seed?: number;
}

export interface CIOptions {
  level?: number;
  bootstrapSamples?: number;
  seed?: number;
}

export interface AgreementReport {
  metric: MetricName;
  value: number;
  interpretation: Interpretation | AlphaInterpretation;
  ci?: ConfidenceInterval;
}
