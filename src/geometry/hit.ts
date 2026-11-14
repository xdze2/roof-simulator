// Pointer hit-testing on a polygon (works in any 2D space, e.g. screen pixels).
import type { Vec2, Polygon } from './skeleton';

/** distance from p to segment ab */
export function distToSegment(p: Vec2, a: Vec2, b: Vec2): number {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const u = l2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return Math.hypot(p[0] - a[0] - u * dx, p[1] - a[1] - u * dy);
}

/** index of the first vertex within r of p, or -1 */
export function pickVertex(P: Polygon, p: Vec2, r: number): number {
  for (let i = 0; i < P.length; i++) if (Math.hypot(P[i][0] - p[0], P[i][1] - p[1]) <= r) return i;
  return -1;
}

/** index of the closest edge i (P[i] -> P[i+1], closed) within r of p, or -1 */
export function pickEdge(P: Polygon, p: Vec2, r: number): number {
  let best = -1, bd = r;
  for (let i = 0; i < P.length; i++) {
    const d = distToSegment(p, P[i], P[(i + 1) % P.length]);
    if (d <= bd) { bd = d; best = i; }
  }
  return best;
}

export type Hit = { kind: 'vertex' | 'edge'; index: number } | null;

/** vertices take priority over edges; edges are only considered when the polygon is closed */
export function pickTarget(P: Polygon, p: Vec2, r: number, closed: boolean): Hit {
  const v = pickVertex(P, p, r);
  if (v >= 0) return { kind: 'vertex', index: v };
  if (closed) { const e = pickEdge(P, p, r); if (e >= 0) return { kind: 'edge', index: e }; }
  return null;
}
