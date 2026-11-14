import { describe, it, expect } from 'vitest';
import { sampleField, fieldIsolines } from './field';
import type { Polygon } from './skeleton';

const sq: Polygon = [[0, 0], [10, 0], [10, 10], [0, 10]];

describe('fieldIsolines', () => {
  it('square, nearest: contour at distance d is the inward offset square', () => {
    const k = 0.5, step = 0.5; // height 0.5 -> d = 1, height 1 -> d = 2 ...
    const segs = fieldIsolines(sq, 'nearest', k, step);
    for (const m of [1, 2, 3]) {
      const d = (m * step) / k, ss = segs.filter((s) => Math.abs(s.h - m * step) < 1e-6);
      expect(ss.length).toBeGreaterThan(10);
      for (const s of ss) for (const p of [s.a, s.b]) {
        const cheb = Math.min(p[0], p[1], 10 - p[0], 10 - p[1]);
        expect(cheb).toBeCloseTo(d, 1);
      }
    }
  });
  it('points mode: contours near a vertex are circles around it', () => {
    const segs = fieldIsolines(sq, 'points', 1, 1); // d = 1, 2 around the nearest vertex
    const ss = segs.filter((s) => Math.abs(s.h - 2) < 1e-6 && s.a[0] < 3 && s.a[1] < 3 && s.b[0] < 3 && s.b[1] < 3);
    expect(ss.length).toBeGreaterThan(5);
    for (const s of ss) for (const p of [s.a, s.b]) expect(Math.hypot(p[0], p[1])).toBeCloseTo(2, 1);
  });
  it('is cached and levels stop below the maximum height', () => {
    const g = sampleField(sq, 'nearest');
    expect(sampleField(sq, 'nearest')).toBe(g);
    const segs = fieldIsolines(sq, 'nearest', 1, 1);
    expect(Math.max(...segs.map((s) => s.h))).toBeLessThan(g.dmax);
  });
});
