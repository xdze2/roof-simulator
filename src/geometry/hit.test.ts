import { describe, it, expect } from 'vitest';
import { distToSegment, pickVertex, pickEdge, pickTarget } from './hit';
import type { Polygon } from './skeleton';

const sq: Polygon = [[0, 0], [100, 0], [100, 100], [0, 100]];

describe('hit testing', () => {
  it('distToSegment: perpendicular, endpoint clamp, degenerate', () => {
    expect(distToSegment([50, 7], [0, 0], [100, 0])).toBeCloseTo(7);
    expect(distToSegment([-3, 4], [0, 0], [100, 0])).toBeCloseTo(5);
    expect(distToSegment([3, 4], [0, 0], [0, 0])).toBeCloseTo(5);
  });
  it('pickVertex / pickEdge within radius', () => {
    expect(pickVertex(sq, [102, 3], 9)).toBe(1);
    expect(pickVertex(sq, [50, 50], 9)).toBe(-1);
    expect(pickEdge(sq, [50, 5], 9)).toBe(0);
    expect(pickEdge(sq, [95, 50], 9)).toBe(1);
    expect(pickEdge(sq, [50, 50], 9)).toBe(-1);
  });
  it('vertices win over edges; edges need a closed polygon', () => {
    expect(pickTarget(sq, [3, 2], 9, true)).toEqual({ kind: 'vertex', index: 0 });
    expect(pickTarget(sq, [50, 2], 9, true)).toEqual({ kind: 'edge', index: 0 });
    expect(pickTarget(sq, [50, 2], 9, false)).toBeNull();
    expect(pickTarget(sq, [50, 50], 9, true)).toBeNull();
  });
});
