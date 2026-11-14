import { describe, it, expect } from 'vitest';
import { isolines, faceLevelSegment, levelLine } from './isolines';
import { straightSkeleton } from './skeleton';
import { PRESETS } from './presets';
import { pointInPoly } from './nearest';

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
  it('levelLine: one level of the rectangle is its inset; nothing above the ridge', () => {
    const sk = straightSkeleton([[0, 0], [20, 0], [20, 10], [0, 10]]);
    const total = levelLine(sk, 2).reduce((a, [p, q]) => a + Math.hypot(p[0] - q[0], p[1] - q[1]), 0);
    expect(total).toBeCloseTo(2 * (16 + 6));
    expect(levelLine(sk, 6)).toEqual([]);
  });
});

describe('3D isolines', () => {
  it('skeleton contours lie on the roof: their height equals the face plane height at (x,y)', () => {
    const sk = straightSkeleton(PRESETS.L ?? Object.values(PRESETS)[0]);
    const segs = isolines(sk, 0.25);
    expect(segs.length).toBeGreaterThan(0);
    // at the segment midpoint, the plane of some containing face (fitted from 3 of its vertices) gives t = h
    for (const s of segs) {
      const m: [number, number] = [(s.a[0] + s.b[0]) / 2, (s.a[1] + s.b[1]) / 2];
      const hs = sk.faces.filter((f) => f.length >= 3 && pointInPoly(f.map((q) => [q.x, q.y] as [number, number]), m[0], m[1])).map((f) => {
        const [p0, p1, p2] = f, d1x = p1.x - p0.x, d1y = p1.y - p0.y, d2x = p2.x - p0.x, d2y = p2.y - p0.y;
        const det = d1x * d2y - d1y * d2x;
        if (Math.abs(det) < 1e-9) return NaN;
        const gx = ((p1.t - p0.t) * d2y - (p2.t - p0.t) * d1y) / det, gy = ((p2.t - p0.t) * d1x - (p1.t - p0.t) * d2x) / det;
        return p0.t + gx * (m[0] - p0.x) + gy * (m[1] - p0.y);
      });
      expect(hs.some((z) => Math.abs(z - s.h) < 1e-6)).toBe(true);
    }
  });
  it('gridIsolines of a distance-from-point field are circles of radius L', async () => {
    const { gridIsolines } = await import('./isolines');
    const nx = 60, ny = 60, h = 0.1, v = new Float32Array(61 * 61), ok = new Uint8Array(61 * 61).fill(1);
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) v[j * 61 + i] = Math.hypot(i * h - 3, j * h - 3);
    const segs = gridIsolines(v, ok, nx, ny, 0, 0, h, [1, 2]);
    expect(segs.length).toBeGreaterThan(50);
    for (const s of segs) for (const p of [s.a, s.b]) expect(Math.hypot(p[0] - 3, p[1] - 3)).toBeCloseTo(s.h, 1);
  });
});
