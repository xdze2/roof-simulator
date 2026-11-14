// node test_nearest.mjs
import { straightSkeleton } from './skeleton.js';
import { makeNearest, pointInPoly } from './nearest.js';
import { PRESETS } from './presets.js';

let fails = 0;
function run(name, pts) {
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
const r = run('rectangle', PRESETS.rectangle);
if (r.mism || r.reflexOwned || r.tooLow || !r.tot) fails++;
const l = run('L', PRESETS.L);
if (l.reflexOwned === 0 || l.tooLow) fails++;
for (const k of ['T', 'U', 'irregular']) { const s = run(k, PRESETS[k]); if (s.tooLow) fails++; }
console.log(fails ? 'FAIL' : 'nearest checks passed');
process.exit(fails ? 1 : 0);
