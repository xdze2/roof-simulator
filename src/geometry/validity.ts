// Footprint validity checks; returns a human-readable problem or null when the polygon is usable.
import { isSimple, polyArea } from './skeleton';
import type { Polygon } from './skeleton';

export function polygonProblem(P: Polygon): string | null {
  if (P.length < 3) return 'Polygon needs at least 3 points';
  for (let i = 0; i < P.length; i++) {
    const a = P[i], b = P[(i + 1) % P.length];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-9) return 'Duplicate points (zero-length edge)';
  }
  if (!isSimple(P)) return 'Self-intersecting polygon';
  if (Math.abs(polyArea(P)) < 1e-9) return 'Degenerate polygon (zero area)';
  return null;
}
