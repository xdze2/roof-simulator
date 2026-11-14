// Nearest-segment field of a simple CCW polygon, sampled point-wise (no exact Voronoi).
// Sites: each edge i as an OPEN segment (id i, perpendicular foot must fall inside the
// segment) and each REFLEX vertex as a point site (id n + vertex index).
// Convex vertices need no site: for an interior point the nearest boundary point is
// then always the foot on an edge.

import type { Polygon } from './skeleton';

export function pointInPoly(P: Polygon, x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
    const a = P[i], b = P[j];
    if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
  }
  return inside;
}

export interface NearestHit { site: number; d: number }
export interface Nearest { query: (x: number, y: number) => NearestHit | null; reflex: number[]; n: number }

export function makeNearest(P: Polygon): Nearest {
  const n = P.length;
  const segs = P.map((a, i) => {
    const b = P[(i + 1) % n];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return { ax: a[0], ay: a[1], dx: (b[0] - a[0]) / len, dy: (b[1] - a[1]) / len, len };
  });
  const reflex: number[] = []; // vertex indices
  for (let i = 0; i < n; i++) {
    const p = segs[(i + n - 1) % n], q = segs[i];
    if (p.dx * q.dy - p.dy * q.dx < -1e-12) reflex.push(i);
  }
  // returns {site, d} (site < n: edge; else n + vertex index) or null if outside the polygon
  function query(x: number, y: number): NearestHit | null {
    if (!pointInPoly(P, x, y)) return null;
    let best = Infinity, site = -1;
    for (let i = 0; i < n; i++) {
      const s = segs[i];
      const u = (x - s.ax) * s.dx + (y - s.ay) * s.dy;
      if (u < 0 || u > s.len) continue;
      const d = Math.abs((x - s.ax) * -s.dy + (y - s.ay) * s.dx);
      if (d < best) { best = d; site = i; }
    }
    for (const v of reflex) {
      const d = Math.hypot(x - P[v][0], y - P[v][1]);
      if (d < best - 1e-12) { best = d; site = n + v; }
    }
    return { site, d: best };
  }
  return { query, reflex, n };
}
