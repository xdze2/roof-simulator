import { describe, it, expect } from 'vitest';
import { STEPS, stepShape } from './steps';
import { PRESETS } from '../geometry/presets';
import { straightSkeleton, polyArea } from '../geometry/skeleton';
import { polygonProblem } from '../geometry/validity';
import type { EdgeOverride } from '../state';

const weights = (n: number, ov: EdgeOverride[]) =>
  Array.from({ length: n }, (_, i) => { const o = ov[i]; return o?.gable ? 0 : 1 / Math.tan((o?.alpha ?? 40) * Math.PI / 180); });

describe('tour steps', () => {
  it('ids are unique', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length);
  });
  for (const s of STEPS) it(`${s.id}: footprint and references are valid`, () => {
    if (s.preset) expect(PRESETS[s.preset]).toBeDefined();
    const shape = stepShape(s);
    if (s.free) { expect(shape).toBeNull(); return; }
    expect(shape).not.toBeNull();
    const { pts, ov } = shape!, n = pts.length;
    expect(polygonProblem(pts)).toBeNull();
    expect(polyArea(pts)).toBeGreaterThan(0);                 // CCW, so edge indices are kept as written
    for (const i of [...(s.highlight?.edges ?? []), ...(s.highlight?.vertices ?? []), ...ov.keys()]) expect(i).toBeLessThan(n);
    if (s.cut !== undefined) { expect(s.cut).toBeGreaterThan(0); expect(s.cut).toBeLessThan(1); }
    expect(() => straightSkeleton(pts, weights(n, ov))).not.toThrow();
  });
  it('gables come from the preset unless given; slopes become per-edge overrides', () => {
    expect(stepShape({ id: 'a', title: '', html: '', preset: 'gableHouse' })!.ov[1]).toEqual({ gable: true });
    expect(stepShape({ id: 'b', title: '', html: '', preset: 'gableHouse', gables: [] })!.ov.filter(Boolean)).toEqual([]);
    expect(stepShape({ id: 'c', title: '', html: '', preset: 'rectangle', slopes: { 2: 58 } })!.ov[2]).toEqual({ alpha: 58 });
  });
});
