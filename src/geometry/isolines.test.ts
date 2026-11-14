import { describe, it, expect } from 'vitest';
import { isolines, faceLevelSegment } from './isolines';
import { straightSkeleton } from './skeleton';
import { PRESETS } from './presets';

const len = (s: { a: number[]; b: number[] }) => Math.hypot(s.a[0] - s.b[0], s.a[1] - s.b[1]);

describe('isolines', () => {
  it('faceLevelSegment on a trapezoid face', () => {
    const f = [{ x: 0, y: 0, t: 0 }, { x: 10, y: 0, t: 0 }, { x: 7, y: 3, t: 3 }, { x: 3, y: 3, t: 3 }];
    const s = faceLevelSegment(f, 1)!;
    expect(Math.hypot(s[0][0] - s[1][0], s[0][1] - s[1][1])).toBeCloseTo(8);
    expect(s[0][1]).toBeCloseTo(1); expect(s[1][1]).toBeCloseTo(1);
    expect(faceLevelSegment(f, 5)).toBeNull();
  });
  it('rectangle 10x6: each level is the inset rectangle', () => {
    const sk = straightSkeleton([[0, 0], [10, 0], [10, 6], [0, 6]]);
    const segs = isolines(sk, 1);
    expect(new Set(segs.map((s) => s.h))).toEqual(new Set([1, 2]));   // ridge level (3) excluded
    for (const h of [1, 2]) {
      const total = segs.filter((s) => s.h === h).reduce((a, s) => a + len(s), 0);
      expect(total).toBeCloseTo(2 * ((10 - 2 * h) + (6 - 2 * h)));
    }
  });
  it('L preset: all contour levels are below the ridge', () => {
    const sk = straightSkeleton(PRESETS.L);
    const segs = isolines(sk, 0.75);
    expect(segs.length).toBeGreaterThan(0);
    for (const s of segs) expect(s.h).toBeLessThan(sk.maxT);
  });
  it('invalid step gives nothing; gable faces are skipped', () => {
    const sk = straightSkeleton([[0, 0], [10, 0], [10, 6], [0, 6]], [1, 0, 1, 0]);
    expect(isolines(sk, 0)).toEqual([]);
    expect(isolines(sk, 1).length).toBeGreaterThan(0);
  });
});
