import { describe, it, expect } from 'vitest';
import { straightSkeleton } from './skeleton';
import type { Polygon } from './skeleton';
import { makeNearest, makePointsField, pointInPoly } from './nearest';
import { PRESETS } from './presets';

let fails = 0;
function run(name: string, pts: Polygon) {
  const sk = straightSkeleton(pts), P = sk.poly, nn = makeNearest(P);
  let mism = 0, tot = 0, reflexOwned = 0, tooLow = 0;
  for (let x = 0; x <= 40; x += 0.37) for (let y = 0; y <= 40; y += 0.37) {
    const q = nn.query(x, y);
    if (!q) continue;
    const fi = sk.faces.findIndex((f) => pointInPoly(f.map((p) => [p.x, p.y]), x, y));
    if (fi < 0) continue;
    tot++;
    const e = sk.edges[fi];
    const dLine = e.nx * x + e.ny * y - e.c;            // skeleton height of this point (plane of its face)
    if (q.site >= P.length) reflexOwned++;
    else if (q.site !== fi) {                            // tie tolerance: both planes give ~ same height
      const o = sk.edges[q.site];
      if (Math.abs(o.nx * x + o.ny * y - o.c - dLine) > 1e-6) mism++;
    }
    if (q.d < dLine - 1e-6) tooLow++;                    // true distance can never be below the skeleton height
  }
  console.log(`${name}: samples=${tot} owner mismatches=${mism} reflex-vertex-owned=${reflexOwned} dist<height=${tooLow}`);
  return { mism, reflexOwned, tooLow, tot };
}
describe('nearest-segment field', () => {
it('matches the skeleton heights', () => {
fails = 0;
const r = run('rectangle', PRESETS.rectangle);
if (r.mism || r.reflexOwned || r.tooLow || !r.tot) fails++;
const l = run('L', PRESETS.L);
if (l.reflexOwned === 0 || l.tooLow) fails++;
for (const k of ['T', 'U', 'irregular']) { const s = run(k, PRESETS[k]); if (s.tooLow) fails++; }
console.log(fails ? 'FAIL' : 'nearest checks passed');
expect(fails).toBe(0);
});
});

describe('makePointsField', () => {
  it('owner is the closest vertex; outside gives null', () => {
    const f = makePointsField([[0, 0], [10, 0], [10, 6], [0, 6]]);
    expect(f.query(1, 1)).toEqual({ site: 0, d: Math.hypot(1, 1) });
    expect(f.query(9, 5)!.site).toBe(2);
    expect(f.query(-1, 1)).toBeNull();
  });
});
