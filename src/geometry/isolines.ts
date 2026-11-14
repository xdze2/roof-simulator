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

/** level line at one height h (0 < h < maxT): one segment per non-gable face crossing t = h */
export function levelLine(sk: Skeleton, h: number): [Vec2, Vec2][] {
  const out: [Vec2, Vec2][] = [];
  sk.faces.forEach((f, i) => {
    if (f.length < 3 || sk.edges[i].w === 0) return;
    const s = faceLevelSegment(f, h);
    if (s) out.push(s);
  });
  return out;
}

/** Marching squares on a regular grid: values v[j*(nx+1)+i] at (x0+i*h, y0+j*h); valid[...] = 0 marks
 *  samples outside the polygon (cells touching one are skipped). Segments at each level in `levels`. */
export function gridIsolines(v: ArrayLike<number>, valid: ArrayLike<number>, nx: number, ny: number, x0: number, y0: number, h: number, levels: number[]): IsoSegment[] {
  const out: IsoSegment[] = [], W = nx + 1;
  for (const L of levels) {
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = j * W + i;
      const idx = [a, a + 1, a + W + 1, a + W];            // corners CCW: (i,j) (i+1,j) (i+1,j+1) (i,j+1)
      if (idx.some((k) => !valid[k])) continue;
      const cx = [i, i + 1, i + 1, i], cy = [j, j, j + 1, j + 1];
      const pts: Vec2[] = [];
      for (let e = 0; e < 4; e++) {
        const p = e, q = (e + 1) % 4, vp = v[idx[p]] - L, vq = v[idx[q]] - L;
        if ((vp < 0) !== (vq < 0)) {
          const u = vp / (vp - vq);
          pts.push([x0 + (cx[p] + u * (cx[q] - cx[p])) * h, y0 + (cy[p] + u * (cy[q] - cy[p])) * h]);
        }
      }
      if (pts.length === 2) out.push({ h: L, a: pts[0], b: pts[1] });
      else if (pts.length === 4) { out.push({ h: L, a: pts[0], b: pts[1] }, { h: L, a: pts[2], b: pts[3] }); }
    }
  }
  return out;
}
