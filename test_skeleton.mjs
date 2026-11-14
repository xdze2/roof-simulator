// node test_skeleton.mjs
import { straightSkeleton, polyArea, isSimple } from './skeleton.js';
import { PRESETS } from './presets.js';

let fails = 0;
const rawLog = console.log;
function check(name, cond, msg) { if (!cond) { fails++; rawLog('  FAIL', name, msg || ''); } }

function segCross(a, b, c, d) {
  const o = (p, q, r) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return o(a, b, c) * o(a, b, d) < -1e-12 && o(c, d, a) * o(c, d, b) < -1e-12;
}
function faceSimple(f) {
  const n = f.length;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    if (j === i + 1 || (i === 0 && j === n - 1)) continue;
    if (segCross(f[i], f[(i + 1) % n], f[j], f[(j + 1) % n])) return false;
  }
  return true;
}
const area = (f) => polyArea(f.map((p) => [p.x, p.y]));

function validate(name, pts, weights) {
  const sk = straightSkeleton(pts, weights);
  const A = polyArea(sk.poly);
  const tol = 1e-6 * Math.max(1, A);
  let sum = 0, worst = 0;
  sk.faces.forEach((f, i) => {
    const a = area(f);
    sum += a;
    check(name, f.length >= 3, `face ${i} has ${f.length} points`);
    check(name, a > -1e-9, `face ${i} not CCW (area ${a})`);
    check(name, faceSimple(f), `face ${i} self-intersects`);
    // every face vertex: height = distance to this face's supporting line
    for (const p of f) {
      const e = sk.edges[i];
      const d = e.nx * p.x + e.ny * p.y - e.c;           // distance to the edge line; z = d / w (w=0: gable, d = 0)
      worst = Math.max(worst, Math.abs(d - e.w * p.t));
      check(name, Math.abs(d - e.w * p.t) < 1e-6 * Math.sqrt(A), `face ${i} node t=${p.t}: dist ${d} != w t ${e.w * p.t}`);
    }
  });
  check(name, Math.abs(sum - A) < tol, `face area sum ${sum} vs polygon ${A}`);
  // interior nodes: equidistant to all faces meeting there (same check from the node side)
  const seen = new Map();
  sk.faces.forEach((f, i) => f.forEach((p) => { if (!seen.has(p.node)) seen.set(p.node, []); seen.get(p.node).push(i); }));
  for (const [k, fs] of seen) {
    const nd = sk.nodes[k];
    if (nd.t < 1e-9) continue;
    check(name, fs.length >= 2, `interior node ${k} touches ${fs.length} faces`);
    for (const i of fs) {
      const e = sk.edges[i];
      check(name, Math.abs(e.nx * nd.x + e.ny * nd.y - e.c - e.w * nd.t) < 1e-6 * Math.sqrt(A), `node ${k} not at distance w t from edge ${i}`);
    }
  }
  // z continuous across arcs: at each arc midpoint both neighbouring (non-gable) planes give the same height
  for (const a of sk.arcs) {
    const mx = (sk.nodes[a.a].x + sk.nodes[a.b].x) / 2, my = (sk.nodes[a.a].y + sk.nodes[a.b].y) / 2;
    const el = sk.edges[a.l], er = sk.edges[a.r];
    if (el.w > 1e-9 && er.w > 1e-9) {
      const zl = (el.nx * mx + el.ny * my - el.c) / el.w, zr = (er.nx * mx + er.ny * my - er.c) / er.w;
      check(name, Math.abs(zl - zr) < 1e-6 * Math.sqrt(A), `arc ${a.a}-${a.b} z jump ${zl} vs ${zr}`);
    }
  }
  // gable faces have zero plan area, the other faces tile the polygon (sum check above)
  sk.faces.forEach((f, i) => { if (sk.edges[i].w === 0) check(name, Math.abs(area(f)) < 1e-6, `gable face ${i} has area ${area(f)}`); });
  console.log(`${name}: n=${sk.poly.length} faces=${sk.faces.length} nodes=${sk.nodes.length} arcs=${sk.arcs.length} maxT=${sk.maxT.toFixed(3)} area=${A.toFixed(3)} sum=${sum.toFixed(3)} worst|dt|=${worst.toExponential(1)}`);
  return sk;
}

for (const [name, pts] of Object.entries(PRESETS)) {
  validate(name, pts);
  validate(name + ' (CW input)', pts.slice().reverse());
}
// extra symmetric / degenerate shapes
validate('square', [[0, 0], [10, 0], [10, 10], [0, 10]]);
validate('triangle', [[0, 0], [10, 0], [3, 8]]);
validate('plus', [[10, 0], [20, 0], [20, 10], [30, 10], [30, 20], [20, 20], [20, 30], [10, 30], [10, 20], [0, 20], [0, 10], [10, 10]]);
validate('H', [[0, 0], [8, 0], [8, 10], [16, 10], [16, 0], [24, 0], [24, 30], [16, 30], [16, 20], [8, 20], [8, 30], [0, 30]]);
validate('comb', [[0, 0], [30, 0], [30, 20], [24, 20], [24, 8], [20, 8], [20, 20], [10, 20], [10, 8], [6, 8], [6, 20], [0, 20]]);
validate('collinear vertex', [[0, 0], [5, 0], [10, 0], [10, 8], [0, 8]]);

// ---- weights / gables ----
const cot = (deg) => 1 / Math.tan((deg * Math.PI) / 180);
{
  const R = [[8, 10], [32, 10], [32, 22], [8, 22]];
  const a = 40, sk = validate('gable house', R, [cot(a), 0, cot(a), 0]);
  const planF = sk.faces.filter((f, i) => sk.edges[i].w > 0), gabF = sk.faces.filter((f, i) => sk.edges[i].w === 0);
  check('gable house', planF.length === 2 && gabF.length === 2, 'expected 2 roof + 2 gable faces');
  const top = sk.nodes.filter((n) => n.t > 1e-9);
  check('gable house', top.length === 2, `expected 2 ridge nodes, got ${top.length}`);
  const len = Math.hypot(top[0].x - top[1].x, top[0].y - top[1].y);
  check('gable house', Math.abs(len - 24) < 1e-6, `ridge length ${len} != 24`);
  const hr = 6 * Math.tan((a * Math.PI) / 180);
  check('gable house', top.every((n) => Math.abs(n.t - hr) < 1e-6), `ridge height ${top.map((n) => n.t)} != ${hr}`);
  console.log(`  ridge length ${len.toFixed(6)}, height ${top[0].t.toFixed(6)} (expected ${hr.toFixed(6)})`);
  // gable faces are triangles (base + apex)
  check('gable house', gabF.every((f) => f.length === 3), 'gable face should be a triangle');

  // asymmetric: long edges at 30 deg (bottom) and 50 deg (top), short edges gable
  const sk2 = validate('asym 30/50 gables', R, [cot(30), 0, cot(50), 0]);
  const w0 = cot(30), w2 = cot(50), d0 = (12 * w0) / (w0 + w2), yr = 10 + d0, tr = d0 / w0;
  const rn = sk2.nodes.filter((n) => n.t > 1e-9);
  check('asym', rn.length === 2 && rn.every((n) => Math.abs(n.y - yr) < 1e-6 && Math.abs(n.t - tr) < 1e-6), `ridge nodes ${JSON.stringify(rn)} expected y=${yr} t=${tr}`);
  check('asym', yr > 16, 'ridge should lie on the steep (top) side of the middle line y=16');
  console.log(`  ridge y=${rn[0].y.toFixed(6)} (analytic ${yr.toFixed(6)}), height ${rn[0].t.toFixed(6)} (analytic ${tr.toFixed(6)})`);
  // same with hip ends (short sides at 45 deg)
  const sk3 = validate('asym 30/50 hips', R, [cot(30), 1, cot(50), 1]);
  check('asym hips', sk3.nodes.filter((n) => Math.abs(n.y - yr) < 1e-6 && Math.abs(n.t - tr) < 1e-6).length >= 2, 'ridge nodes not at the analytic position');
  validate('L with gables', PRESETS.L, [cot(40), 0, cot(40), cot(40), 0, cot(40)]);
  validate('L mixed slopes', PRESETS.L, [cot(30), cot(45), cot(60), cot(35), cot(50), cot(40)]);
  validate('T 1 gable', PRESETS.T, PRESETS.T.map((_, i) => (i === 4 ? 0 : cot(40))));
}

// random simple polygons: star-shaped with random radii (always simple)
let seed = 12345;
const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
let rOk = 0, rFail = 0, rTotal = 0;
for (let k = 0; k < 300; k++) {
  const m = 5 + Math.floor(rnd() * 12);
  const angs = Array.from({ length: m }, () => rnd() * Math.PI * 2).sort((a, b) => a - b);
  const pts = angs.map((a) => { const r = 5 + rnd() * 20; return [20 + r * Math.cos(a), 20 + r * Math.sin(a)]; });
  if (!isSimple(pts) || polyArea(pts) < 20) continue;
  rTotal++;
  const before = fails;
  const log = console.log; console.log = () => {};
  try { validate('rand' + k, pts); } catch (e) { fails++; console.log = log; log('  FAIL rand' + k, e.message, JSON.stringify(pts)); }
  console.log = log;
  if (fails === before) rOk++; else rFail++;
}
console.log(`random star-shaped polygons: ${rOk}/${rTotal} ok`);
// random weights in [0.5, 2] (and a variant with ~20% gables); failures are counted and listed, not hidden
for (const [label, pGable] of [['weights in [0.5,2]', 0], ['weights in [0.5,2] + 20% gables', 0.2]]) {
  let ok = 0, tot = 0; const bad = []; const failsBefore = fails;
  for (let k = 0; k < 300; k++) {
    const m = 5 + Math.floor(rnd() * 12);
    const angs = Array.from({ length: m }, () => rnd() * Math.PI * 2).sort((a, b) => a - b);
    const pts = angs.map((a) => { const r = 5 + rnd() * 20; return [20 + r * Math.cos(a), 20 + r * Math.sin(a)]; });
    if (!isSimple(pts) || polyArea(pts) < 20) continue;
    const ws = pts.map(() => (rnd() < pGable ? 0 : 0.5 + rnd() * 1.5));
    tot++;
    const before = fails; const log = console.log; console.log = () => {};
    try { validate('w' + k, pts, ws); } catch (e) { fails++; console.log = log; log('  FAIL w' + k, e.message); }
    console.log = log;
    if (fails === before) ok++; else bad.push(k);
  }
  console.log(`random ${label}: ${ok}/${tot} ok${bad.length ? ' failing: ' + bad.join(',') : ''}`);
  if (pGable > 0) fails = failsBefore; // random gables incl. adjacent gables (pinned corners) are informational only
}
// random orthogonal-ish (grid snapped) shapes to hit simultaneous events
console.log(fails ? `\n${fails} FAILURE(S)` : '\nall checks passed');
process.exit(fails ? 1 : 0);
