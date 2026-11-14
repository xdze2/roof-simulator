// Straight skeleton of a simple polygon (no holes), event-driven wavefront
// (Felkel & Obdrzalek style, events recomputed from the live wavefront at each step).
//
// Wavefront model: edge i is the line  n_i . x = c_i + w_i t  (n_i = inward unit normal, w_i = 1 unweighted).
// A wavefront vertex between edges (eL, eR) moves with velocity v: n_L.v = w_L, n_R.v = w_R.
// Tie rule at equal event times (within tol): edge events before split events; otherwise first found.
// Events: edge event (a wavefront edge shrinks to length 0), split event (a reflex
// vertex runs into a wavefront edge). Degenerate case: a new vertex whose two edges
// are anti-parallel (wavefront collapses to a segment) is resolved by the "ridge rule".
//
// straightSkeleton(points) -> { poly, nodes, arcs, faces, maxT }
//   poly  : CCW polygon [[x,y],...]; edge i = poly[i] -> poly[i+1]
//   nodes : [{x,y,t}]  (t = arrival time = height / tan(slope))
//   arcs  : [{a,b,l,r,reflex}] skeleton arcs between node ids; l,r = the two edges
//   faces : faces[i] = polygon [{x,y,t}] of the roof plane of edge i (CCW)

export function polyArea(P) {
  let a = 0;
  for (let i = 0; i < P.length; i++) {
    const p = P[i], q = P[(i + 1) % P.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

function segInter(a, b, c, d) { // proper or touching intersection of segments ab, cd
  const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const o1 = o(a, b, c), o2 = o(a, b, d), o3 = o(c, d, a), o4 = o(c, d, b);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

// proper self-crossing test (touching/collinear overlap not detected, fine for a UI guard)
export function isSimple(P) {
  const n = P.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (j === i + 1 || (i === 0 && j === n - 1)) continue;
      if (segInter(P[i], P[(i + 1) % n], P[j], P[(j + 1) % n])) return false;
    }
  }
  return true;
}

// weights[i] (optional, default 1) = horizontal speed w_e = cot(alpha_e) of edge i (poly[i] -> poly[i+1]):
// time t is then the roof height z; w = 0 is a gable (the edge never moves).
export function straightSkeleton(input, weights) {
  const P0 = input.map((p) => (Array.isArray(p) ? [p[0], p[1]] : [p.x, p.y]));
  const W0 = P0.map((_, i) => (weights && weights[i] != null ? weights[i] : 1));
  // drop consecutive duplicates (the edge leaving a kept point is the one leaving the last duplicate)
  let P = [], W = [];
  const m0 = P0.length;
  const dup = P0.map((p, i) => { const q = P0[(i + m0 - 1) % m0]; return Math.hypot(p[0] - q[0], p[1] - q[1]) <= 1e-12; });
  for (let i = 0; i < m0; i++) {
    if (dup[i]) continue;
    let j = i; while (dup[(j + 1) % m0] && (j + 1) % m0 !== i) j++;
    P.push(P0[i]); W.push(W0[j % m0]);
  }
  if (P.length < 3) throw new Error('need at least 3 points');
  if (polyArea(P) < 0) { // CCW: edge k of the reversed polygon is original edge (n-2-k) mod n
    const nn0 = P.length;
    P.reverse(); W = P.map((_, k) => W[(nn0 - 2 - k + 2 * nn0) % nn0]);
  }
  const n = P.length;
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (const p of P) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
  const scale = Math.max(maxx - minx, maxy - miny, 1e-9);
  const tol = scale * 1e-7;

  const E = [];
  for (let i = 0; i < n; i++) {
    const a = P[i], b = P[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / len, dy = (b[1] - a[1]) / len;
    const nx = -dy, ny = dx;
    E.push({ dx, dy, nx, ny, c: nx * a[0] + ny * a[1], w: W[i] });
  }

  const nodes = [];
  const arcs = [];
  const arcKeys = new Set();
  function nodeAt(x, y, t) {
    for (let i = 0; i < nodes.length; i++) {
      if (Math.hypot(nodes[i].x - x, nodes[i].y - y) < tol * 3 && Math.abs(nodes[i].t - t) < tol * 3) return i; // same plan point at another height = a point on a gable wall
    }
    nodes.push({ x, y, t });
    return nodes.length - 1;
  }
  function addArc(a, b, l, r, reflex) {
    if (a === b) return;
    const key = a < b ? a + '_' + b : b + '_' + a;
    if (arcKeys.has(key)) return;
    arcKeys.add(key);
    arcs.push({ a, b, l, r, reflex: !!reflex });
  }

  let vid = 0;
  const active = new Set();
  function makeVertex(px, py, t0, eL, eR, node) {
    const L = E[eL], R = E[eR];
    const det = L.nx * R.ny - L.ny * R.nx;
    const v = { id: vid++, px, py, t0, eL, eR, node, prev: null, next: null, vx: null, vy: null, anti: false, reflex: false };
    if (Math.abs(det) < 1e-9) {
      if (L.nx * R.nx + L.ny * R.ny > 0) { const w = (L.w + R.w) / 2; v.vx = w * L.nx; v.vy = w * L.ny; } else v.anti = true;
    } else { // n_L.v = w_L, n_R.v = w_R
      v.vx = (L.w * R.ny - L.ny * R.w) / det;
      v.vy = (L.nx * R.w - L.w * R.nx) / det;
    }
    v.reflex = L.dx * R.dy - L.dy * R.dx < -1e-12;
    return v;
  }
  const posX = (v, t) => (v.vx === null ? v.px : v.px + v.vx * (t - v.t0));
  const posY = (v, t) => (v.vy === null ? v.py : v.py + v.vy * (t - v.t0));

  // initial LAV
  const init = [];
  for (let i = 0; i < n; i++) {
    const node = nodeAt(P[i][0], P[i][1], 0);
    init.push(makeVertex(P[i][0], P[i][1], 0, (i + n - 1) % n, i, node));
  }
  // node ids must equal vertex indices for the base edges
  const baseNode = init.map((v) => v.node);
  for (let i = 0; i < n; i++) {
    init[i].prev = init[(i + n - 1) % n];
    init[i].next = init[(i + 1) % n];
    active.add(init[i]);
  }

  let now = 0;

  function cycleSize(v) {
    let k = 1, w = v.next;
    while (w !== v && k < 100000) { k++; w = w.next; }
    return k;
  }

  function killVertexArc(v, node) {
    addArc(v.node, node, v.eL, v.eR, v.reflex);
  }

  function finish(v) { // cycle of size <= 2: wavefront has collapsed
    const cyc = [v];
    if (v.next !== v) cyc.push(v.next);
    const ids = [];
    for (const w of cyc) {
      const nd = nodeAt(posX(w, now), posY(w, now), now);
      killVertexArc(w, nd);
      ids.push(nd);
      active.delete(w);
    }
    if (ids.length === 2 && ids[0] !== ids[1]) addArc(ids[0], ids[1], cyc[0].eL, cyc[0].eR, false);
  }

  // new vertex X with anti-parallel edges: the strip between eL and eR has collapsed to a segment
  function ridge(X, queue) {
    const P0 = X.prev, N0 = X.next;
    const d = E[X.eL];
    const px = posX(X, now), py = posY(X, now);
    const xNode = nodeAt(px, py, now);
    const s = (w) => posX(w, now) * d.dx + posY(w, now) * d.dy;
    const sp = s(P0), sn = s(N0);
    const diff = sn - sp;
    active.delete(X);
    if (Math.abs(diff) < tol * 3) {
      const mx = (posX(P0, now) + posX(N0, now)) / 2, my = (posY(P0, now) + posY(N0, now)) / 2;
      const m = nodeAt(mx, my, now);
      killVertexArc(P0, m); killVertexArc(N0, m);
      addArc(xNode, m, X.eL, X.eR, false);
      active.delete(P0); active.delete(N0);
      if (P0.prev === N0) return; // whole cycle gone
      const Q = P0.prev, R = N0.next;
      const M = makeVertex(mx, my, now, P0.eL, N0.eR, m);
      M.prev = Q; M.next = R; Q.next = M; R.prev = M;
      active.add(M); queue.push(M);
    } else if (diff > 0) { // N0 lies between P0 and X: e0 piece P0..N0 survives
      const nn = nodeAt(posX(N0, now), posY(N0, now), now);
      killVertexArc(N0, nn);
      addArc(xNode, nn, X.eL, X.eR, false);
      active.delete(N0);
      const Np = makeVertex(posX(N0, now), posY(N0, now), now, X.eL, N0.eR, nn);
      Np.prev = P0; Np.next = N0.next; P0.next = Np; N0.next.prev = Np;
      active.add(Np); queue.push(Np);
    } else { // P0 lies between N0 and X: e2 piece N0..P0 survives
      const pn = nodeAt(posX(P0, now), posY(P0, now), now);
      killVertexArc(P0, pn);
      addArc(xNode, pn, X.eL, X.eR, false);
      active.delete(P0);
      const Pp = makeVertex(posX(P0, now), posY(P0, now), now, P0.eL, X.eR, pn);
      Pp.prev = P0.prev; Pp.next = N0; P0.prev.next = Pp; N0.prev = Pp;
      active.add(Pp); queue.push(Pp);
    }
  }

  function settle(list) {
    const q = list.slice();
    while (q.length) {
      const v = q.pop();
      if (!active.has(v)) continue;
      if (cycleSize(v) <= 2) { finish(v); continue; }
      if (v.anti) ridge(v, q);
    }
  }

  const maxIter = 40 * n + 200;
  for (let iter = 0; active.size > 0; iter++) {
    if (iter > maxIter) throw new Error('straight skeleton: too many events (degenerate input?)');
    let best = null;
    const consider = (c) => {
      if (!best || c.t < best.t - tol || (c.t <= best.t + tol && c.type < best.type) ||
          (c.type === best.type && c.t < best.t)) best = c;
    };
    for (const V of active) {
      if (V.vx === null) continue;
      const bx = V.px - V.vx * V.t0, by = V.py - V.vy * V.t0;
      // edge event V--next
      const N = V.next;
      if (N !== V && N.vx !== null) {
        const dvx = V.vx - N.vx, dvy = V.vy - N.vy, dd = dvx * dvx + dvy * dvy;
        const e = E[V.eR];
        if (dd > 1e-14 && dvx * e.dx + dvy * e.dy > 1e-9) { // edge is shrinking
          const rx = (N.px - N.vx * N.t0) - bx, ry = (N.py - N.vy * N.t0) - by;
          const t = (dvx * rx + dvy * ry) / dd;
          const resid = Math.hypot(dvx * t - rx, dvy * t - ry);
          if (resid < tol * 10 && t >= now - tol && t >= Math.max(V.t0, N.t0) - tol) {
            consider({ t, type: 0, V, N });
          }
        }
      }
      // split events for reflex V
      if (V.reflex) {
        for (const W of active) {
          const N2 = W.next;
          if (W === V || N2 === V || W.vx === null || N2.vx === null) continue;
          const e = E[W.eR];
          const den = e.nx * V.vx + e.ny * V.vy - e.w;
          if (Math.abs(den) < 1e-12) continue;
          const t = (e.c - (e.nx * bx + e.ny * by)) / den;
          if (!(t >= now - tol)) continue;
          const dist0 = e.nx * (bx + V.vx * now) + e.ny * (by + V.vy * now) - e.c - e.w * now;
          if (dist0 < -tol) continue;
          const Bx = bx + V.vx * t, By = by + V.vy * t;
          const wx = posX(W, t), wy = posY(W, t), nx_ = posX(N2, t), ny_ = posY(N2, t);
          const s = (Bx - wx) * e.dx + (By - wy) * e.dy;
          const L = (nx_ - wx) * e.dx + (ny_ - wy) * e.dy;
          if (s >= -tol && s <= L + tol) consider({ t, type: 1, V, W, N: N2 });
        }
      }
    }
    if (!best) {
      // nothing left to happen but vertices remain: close whatever is left
      const rest = [...active];
      for (const v of rest) if (active.has(v)) { if (cycleSize(v) <= 2) finish(v); else { for (const w of [...active]) active.delete(w); } }
      break;
    }
    now = Math.max(now, best.t);
    const t = now;
    if (best.type === 0) {
      const { V, N } = best;
      const x = (posX(V, t) + posX(N, t)) / 2, y = (posY(V, t) + posY(N, t)) / 2;
      const nd = nodeAt(x, y, t);
      killVertexArc(V, nd); killVertexArc(N, nd);
      active.delete(V); active.delete(N);
      const M = makeVertex(x, y, t, V.eL, N.eR, nd);
      const Q = V.prev, R = N.next;
      M.prev = Q; M.next = R; Q.next = M; R.prev = M;
      active.add(M);
      settle([M]);
    } else {
      const { V, W, N } = best;
      const x = posX(V, t), y = posY(V, t);
      const nd = nodeAt(x, y, t);
      killVertexArc(V, nd);
      const Vp = V.prev, Vn = V.next;
      active.delete(V);
      const eIdx = W.eR;
      const A = makeVertex(x, y, t, V.eL, eIdx, nd);
      const B = makeVertex(x, y, t, eIdx, V.eR, nd);
      A.prev = Vp; Vp.next = A; A.next = N; N.prev = A;
      B.prev = W; W.next = B; B.next = Vn; Vn.prev = B;
      active.add(A); active.add(B);
      settle([A, B]);
    }
  }

  // ---- faces: trace the cycle of arcs labelled by each edge ----
  const faces = [];
  for (let e = 0; e < n; e++) {
    const u = baseNode[e], w = baseNode[(e + 1) % n];
    const adj = new Map();
    const link = (a, b) => {
      if (!adj.has(a)) adj.set(a, new Set());
      if (!adj.has(b)) adj.set(b, new Set());
      adj.get(a).add(b); adj.get(b).add(a);
    };
    for (const a of arcs) if (a.l === e || a.r === e) link(a.a, a.b);
    const path = [u, w];
    let prev = u, cur = w, guard = 0;
    while (cur !== u && guard++ < nodes.length + 5) {
      const cand = [...(adj.get(cur) || [])].filter((k) => k !== prev && !(cur === w && prev === u && k === u));
      if (!cand.length) break;
      let nxt = cand[0];
      if (cand.length > 1) { // keep the face on the left: take the sharpest left turn
        let bestA = -Infinity;
        const ix = nodes[cur].x - nodes[prev].x, iy = nodes[cur].y - nodes[prev].y;
        for (const k of cand) {
          const ox = nodes[k].x - nodes[cur].x, oy = nodes[k].y - nodes[cur].y;
          const ang = Math.atan2(ix * oy - iy * ox, ix * ox + iy * oy);
          if (ang > bestA) { bestA = ang; nxt = k; }
        }
      }
      prev = cur; cur = nxt;
      if (cur !== u) path.push(cur);
    }
    faces.push(path.map((k) => ({ x: nodes[k].x, y: nodes[k].y, t: nodes[k].t, node: k })));
  }
  let maxT = 0;
  for (const nd of nodes) maxT = Math.max(maxT, nd.t);
  return { poly: P, nodes, arcs, faces, maxT, edges: E, weights: W };
}
