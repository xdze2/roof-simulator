// Pure vertex insert/delete on a closed polygon, keeping the per-edge settings aligned.
// Edge i runs pts[i] -> pts[i+1]; ov[i] is its setting (may be undefined / missing).
import type { Polygon, Vec2 } from './skeleton';

export const MIN_POINTS = 3;

export interface Edited<T> { pts: Polygon; ov: (T | undefined)[] }

const dense = <T>(ov: (T | undefined)[], n: number): (T | undefined)[] => Array.from({ length: n }, (_, i) => ov[i]);
const copy = <T>(o: T | undefined): T | undefined => (o && typeof o === 'object' ? { ...o } : o);

/** insert p into edge i: the edge splits into edges i and i+1, both inheriting ov[i] */
export function insertVertex<T>(pts: Polygon, ov: (T | undefined)[], i: number, p: Vec2): Edited<T> {
  const n = pts.length, o = dense(ov, n);
  const np = pts.map((q): Vec2 => [q[0], q[1]]);
  np.splice(i + 1, 0, [p[0], p[1]]);
  o.splice(i + 1, 0, copy(o[i]));
  o[i] = copy(o[i]);
  return { pts: np, ov: o };
}

/** delete vertex v: its two adjacent edges merge into the PREVIOUS edge (v-1), which keeps its setting.
 *  Returns null when that would leave fewer than MIN_POINTS points. */
export function deleteVertex<T>(pts: Polygon, ov: (T | undefined)[], v: number): Edited<T> | null {
  const n = pts.length;
  if (n <= MIN_POINTS || v < 0 || v >= n) return null;
  const o = dense(ov, n), np = pts.map((q): Vec2 => [q[0], q[1]]);
  np.splice(v, 1); o.splice(v, 1);
  return { pts: np, ov: o };
}

/** closest point to p on segment ab */
export function projectOnSegment(p: Vec2, a: Vec2, b: Vec2): Vec2 {
  const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
  const u = l2 > 0 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2)) : 0;
  return [a[0] + u * dx, a[1] + u * dy];
}
