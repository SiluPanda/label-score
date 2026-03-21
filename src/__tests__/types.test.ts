import { describe, it, expect } from 'vitest';
import type {
  KappaResult,
  FleissKappaResult,
  AlphaResult,
  AgreementOptions,
  MetricName,
  MeasurementLevel,
  Interpretation,
  AlphaInterpretation,
} from '../types';

describe('types: compile-time shape checks', () => {
  it('KappaResult can be constructed with required fields', () => {
    const result: KappaResult = {
      metric: 'cohens-kappa',
      value: 0.75,
      observed: 0.85,
      expected: 0.40,
      interpretation: 'substantial',
    };
    expect(result.metric).toBe('cohens-kappa');
    expect(result.value).toBe(0.75);
    expect(result.observed).toBe(0.85);
    expect(result.expected).toBe(0.40);
    expect(result.interpretation).toBe('substantial');
    expect(result.ci).toBeUndefined();
    expect(result.categories).toBeUndefined();
  });

  it('FleissKappaResult has annotatorCount and itemCount', () => {
    const result: FleissKappaResult = {
      metric: 'fleiss-kappa',
      value: 0.60,
      observed: 0.70,
      expected: 0.25,
      interpretation: 'substantial',
      annotatorCount: 5,
      itemCount: 100,
    };
    expect(result.annotatorCount).toBe(5);
    expect(result.itemCount).toBe(100);
  });

  it('AlphaResult has missingCount', () => {
    const result: AlphaResult = {
      metric: 'krippendorff-alpha',
      value: 0.85,
      interpretation: 'reliable',
      level: 'nominal',
      itemCount: 50,
      annotatorCount: 3,
      missingCount: 2,
    };
    expect(result.missingCount).toBe(2);
    expect(result.itemCount).toBe(50);
    expect(result.annotatorCount).toBe(3);
  });

  it('AgreementOptions all fields optional', () => {
    const empty: AgreementOptions = {};
    expect(empty).toBeDefined();

    const full: AgreementOptions = {
      metric: 'cohens-kappa',
      level: 'ordinal',
      missingData: 'exclude',
      ci: true,
      ciLevel: 0.95,
      seed: 42,
    };
    expect(full.metric).toBe('cohens-kappa');
  });

  it('MetricName union covers all 6 metrics', () => {
    const metrics: MetricName[] = [
      'cohens-kappa',
      'fleiss-kappa',
      'krippendorff-alpha',
      'scotts-pi',
      'gwets-ac1',
      'percent-agreement',
    ];
    expect(metrics).toHaveLength(6);
  });

  it('MeasurementLevel covers all 4 values', () => {
    const levels: MeasurementLevel[] = ['nominal', 'ordinal', 'interval', 'ratio'];
    expect(levels).toHaveLength(4);
  });

  it('Interpretation covers all 6 values', () => {
    const values: Interpretation[] = [
      'poor',
      'slight',
      'fair',
      'moderate',
      'substantial',
      'almost-perfect',
    ];
    expect(values).toHaveLength(6);
  });

  it('AlphaInterpretation covers all 3 values', () => {
    const values: AlphaInterpretation[] = ['unreliable', 'tentative', 'reliable'];
    expect(values).toHaveLength(3);
  });
});
