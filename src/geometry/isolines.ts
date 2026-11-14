// Roof height contour lines. Each skeleton face is planar (t = roof height above the eaves),
// so its intersection with the horizontal plane t = h is a single segment (faces are
// monotone in the slope direction): collect the crossings of the face boundary and keep the farthest pair.
import type { Skeleton, Vec2 } from './skeleton';

export interface IsoSegment { h: number; a: Vec2; b: Vec2 }

const EPS = 1e-9;

export function faceLevelSegment(f: { x: number; y: number; t: number }[], h: number): [Vec2, Vec2] | null {
  const hits: Vec2[] = [];
  const add = (p: Vec2) => { if (!hits.some((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) < 1e-7)) hits.push(p); };
  for (let i = 0; i < f.length; i++) {
    const p = f[i], q = f[(i + 1) % f.length], dp = p.t - h, dq = q.t - h;
    if (Math.abs(dp) < EPS) add([p.x, p.y]);
    else if (dp * dq < 0) { const u = dp / (dp - dq); add([p.x + u * (q.x - p.x), p.y + u * (q.y - p.y)]); }
  }
  let best: [Vec2, Vec2] | null = null, bd = 1e-7;
  for (let i = 0; i < hits.length; i++) for (let j = i + 1; j < hits.length; j++) {
    const d = Math.hypot(hits[i][0] - hits[j][0], hits[i][1] - hits[j][1]);
    if (d > bd) { bd = d; best = [hits[i], hits[j]]; }
  }
  return best;
}

/** contour segments at heights step, 2*step, ... below the ridge; gable faces (vertical) are skipped */
export function isolines(sk: Skeleton, step: number): IsoSegment[] {
  const out: IsoSegment[] = [];
  if (!(step > 0)) return out;
  const levels = Math.min(500, Math.ceil(sk.maxT / step));
  for (let k = 1; k <= levels; k++) {
    const h = k * step;
    if (h >= sk.maxT - EPS) break;
    sk.faces.forEach((f, i) => {
      if (f.length < 3 || sk.edges[i].w === 0) return;
      const s = faceLevelSegment(f, h);
      if (s) out.push({ h, a: s[0], b: s[1] });
    });
  }
  return out;
}
