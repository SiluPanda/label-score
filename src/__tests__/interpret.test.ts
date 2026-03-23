import { describe, it, expect } from 'vitest';
import { interpretKappa, interpretAlpha } from '../interpret';

describe('interpretKappa', () => {
  it('returns "poor" for values below 0', () => {
    expect(interpretKappa(-0.1)).toBe('poor');
  });

  it('returns "slight" for 0 (boundary)', () => {
    expect(interpretKappa(0)).toBe('slight');
  });

  it('returns "slight" for 0.19 (just below fair boundary)', () => {
    expect(interpretKappa(0.19)).toBe('slight');
  });

  it('returns "fair" for 0.2 (boundary)', () => {
    expect(interpretKappa(0.2)).toBe('fair');
  });

  it('returns "fair" for 0.39 (just below moderate boundary)', () => {
    expect(interpretKappa(0.39)).toBe('fair');
  });

  it('returns "moderate" for 0.4 (boundary)', () => {
    expect(interpretKappa(0.4)).toBe('moderate');
  });

  it('returns "moderate" for 0.59 (just below substantial boundary)', () => {
    expect(interpretKappa(0.59)).toBe('moderate');
  });

  it('returns "substantial" for 0.6 (boundary)', () => {
    expect(interpretKappa(0.6)).toBe('substantial');
  });

  it('returns "substantial" for 0.79 (just below almost-perfect boundary)', () => {
    expect(interpretKappa(0.79)).toBe('substantial');
  });

  it('returns "almost-perfect" for 0.8 (boundary)', () => {
    expect(interpretKappa(0.8)).toBe('almost-perfect');
  });

  it('returns "almost-perfect" for 1.0 (perfect agreement)', () => {
    expect(interpretKappa(1.0)).toBe('almost-perfect');
  });

  it('returns "poor" for NaN', () => {
    expect(interpretKappa(NaN)).toBe('poor');
  });
});

describe('interpretAlpha', () => {
  it('returns "unreliable" for 0', () => {
    expect(interpretAlpha(0)).toBe('unreliable');
  });

  it('returns "unreliable" for 0.666 (just below tentative boundary)', () => {
    expect(interpretAlpha(0.666)).toBe('unreliable');
  });

  it('returns "tentative" for 0.667 (boundary)', () => {
    expect(interpretAlpha(0.667)).toBe('tentative');
  });

  it('returns "tentative" for 0.799 (just below reliable boundary)', () => {
    expect(interpretAlpha(0.799)).toBe('tentative');
  });

  it('returns "reliable" for 0.8 (boundary)', () => {
    expect(interpretAlpha(0.8)).toBe('reliable');
  });

  it('returns "reliable" for 1.0 (perfect reliability)', () => {
    expect(interpretAlpha(1.0)).toBe('reliable');
  });

  it('returns "unreliable" for NaN', () => {
    expect(interpretAlpha(NaN)).toBe('unreliable');
  });
});
