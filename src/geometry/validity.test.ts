import { describe, it, expect } from 'vitest';
import { polygonProblem } from './validity';
import { PRESETS } from './presets';

describe('polygonProblem', () => {
  it('accepts every preset', () => { for (const k of Object.keys(PRESETS)) expect(polygonProblem(PRESETS[k])).toBeNull(); });
  it('detects a bow-tie', () => expect(polygonProblem([[0, 0], [10, 10], [10, 0], [0, 10]])).toBe('Self-intersecting polygon'));
  it('detects duplicates and too few points', () => {
    expect(polygonProblem([[0, 0], [0, 0], [5, 5]])).toMatch(/Duplicate/);
    expect(polygonProblem([[0, 0], [1, 1]])).toMatch(/at least 3/);
  });
  it('detects zero area', () => expect(polygonProblem([[0, 0], [5, 0], [10, 0]])).toMatch(/zero area/));
});
