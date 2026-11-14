import { describe, it, expect } from 'vitest';
import { insertVertex, deleteVertex, projectOnSegment } from './edit';
import type { Polygon } from './skeleton';

type O = { gable?: boolean; alpha?: number };
const sq: Polygon = [[0, 0], [10, 0], [10, 10], [0, 10]];

describe('insertVertex', () => {
  it('splits edge i; both halves inherit its settings (independent copies)', () => {
    const ov: (O | undefined)[] = [undefined, { gable: true }, { alpha: 30 }];
    const r = insertVertex(sq, ov, 1, [10, 5]);
    expect(r.pts).toEqual([[0, 0], [10, 0], [10, 5], [10, 10], [0, 10]]);
    expect(r.ov).toEqual([undefined, { gable: true }, { gable: true }, { alpha: 30 }, undefined]);
    expect(r.ov[1]).not.toBe(r.ov[2]);
    expect(sq.length).toBe(4);   // input untouched
  });
  it('works on the closing edge', () => {
    const r = insertVertex(sq, [undefined, undefined, undefined, { alpha: 20 }], 3, [0, 5]);
    expect(r.pts[4]).toEqual([0, 5]);
    expect(r.ov[3]).toEqual({ alpha: 20 }); expect(r.ov[4]).toEqual({ alpha: 20 });
  });
});

describe('deleteVertex', () => {
  const pent: Polygon = [[0, 0], [10, 0], [10, 10], [5, 14], [0, 10]];
  const ov: (O | undefined)[] = [{ alpha: 10 }, { alpha: 20 }, { alpha: 30 }, { alpha: 40 }, { alpha: 50 }];
  it('merges the two adjacent edges keeping the previous edge setting', () => {
    const r = deleteVertex(pent, ov, 2)!;
    expect(r.pts.length).toBe(4);
    expect(r.ov).toEqual([{ alpha: 10 }, { alpha: 20 }, { alpha: 40 }, { alpha: 50 }]);
  });
  it('vertex 0: previous edge is the last one', () => {
    const r = deleteVertex(pent, ov, 0)!;
    expect(r.pts[0]).toEqual([10, 0]);
    expect(r.ov).toEqual([{ alpha: 20 }, { alpha: 30 }, { alpha: 40 }, { alpha: 50 }]);
  });
  it('refuses to go below 3 points', () => {
    expect(deleteVertex([[0, 0], [1, 0], [0, 1]], [], 0)).toBeNull();
    expect(deleteVertex(sq, [], 9)).toBeNull();
    expect(deleteVertex(sq, [], 0)!.pts.length).toBe(3);
  });
});

describe('projectOnSegment', () => {
  it('projects and clamps', () => {
    expect(projectOnSegment([4, 3], [0, 0], [10, 0])).toEqual([4, 0]);
    expect(projectOnSegment([-4, 3], [0, 0], [10, 0])).toEqual([0, 0]);
  });
});
