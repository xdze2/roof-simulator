// Sampled distance field of the field modes ('nearest', 'overlay' -> nearest segment; 'points' -> nearest vertex)
// and its contour lines. Shared by the 2D plan and the 3D view so both show the same isolines.
// Height in field modes = distance * k (k = tan(slope)), so a contour every `step` m of height is a
// distance contour every step / k m.
import type { Polygon } from './skeleton';
import { fieldFor } from './nearest';
import { gridIsolines } from './isolines';
import type { IsoSegment } from './isolines';

export interface FieldGrid {
  nx: number; ny: number; x0: number; y0: number; h: number;
  /** distance at (x0 + i*h, y0 + j*h), index j*(nx+1)+i */
  H: Float32Array;
  /** owning site (edge i, or n + reflex vertex; vertex i in 'points'), -1 outside the polygon */
  S: Int32Array;
  /** 1 where the sample is inside the polygon */
  ok: Uint8Array;
  dmax: number;
}

let gridKey = '', gridVal: FieldGrid | null = null;

/** field sampled on a regular grid of ~N cells along the longer bbox side (cached for the last polygon/mode) */
export function sampleField(P: Polygon, mode: string, N = 200): FieldGrid {
  N = Math.max(1, Math.min(400, Math.floor(N)));   // hard cap: at most ~400x400 samples
  const key = (mode === 'points' ? 'p' : 'n') + N + ':' + P.map((p) => p[0] + ',' + p[1]).join(';');
  if (key === gridKey && gridVal) return gridVal;
  const nn = fieldFor(mode, P);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const h = Math.max(x1 - x0, y1 - y0) / N;
  if (!(h > 0) || !isFinite(h)) return { nx: 0, ny: 0, x0: 0, y0: 0, h: 1, H: new Float32Array(1), S: new Int32Array(1).fill(-1), ok: new Uint8Array(1), dmax: 0 };   // degenerate polygon
  const nx = Math.min(N + 1, Math.ceil((x1 - x0) / h) + 1), ny = Math.min(N + 1, Math.ceil((y1 - y0) / h) + 1);
  const H = new Float32Array((nx + 1) * (ny + 1)), S = new Int32Array((nx + 1) * (ny + 1)).fill(-1);
  const ok = new Uint8Array(H.length);
  let dmax = 0;
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const q = nn.query(x0 + i * h, y0 + j * h);
    if (q) { H[j * (nx + 1) + i] = q.d; S[j * (nx + 1) + i] = q.site; ok[j * (nx + 1) + i] = 1; if (q.d > dmax) dmax = q.d; }
  }
  gridKey = key; gridVal = { nx, ny, x0, y0, h, H, S, ok, dmax };
  contKey = '';
  return gridVal;
}

let contKey = '', contVal: IsoSegment[] = [];

/** contour segments of the sampled field at roof heights step, 2*step, ... (height = distance * k); `h` of each segment is the height */
export function fieldContours(g: FieldGrid, k: number, step: number): IsoSegment[] {
  const key = k + '/' + step;
  if (contKey === key && contGrid === g) return contVal;
  const levels: number[] = [];
  if (k > 0 && step > 0) for (let m = 1; m * step < g.dmax * k - 1e-9 && m <= 500; m++) levels.push(m * step / k);
  contVal = gridIsolines(g.H, g.ok, g.nx, g.ny, g.x0, g.y0, g.h, levels).map((sg) => ({ ...sg, h: sg.h * k }));
  contKey = key; contGrid = g;
  return contVal;
}
let contGrid: FieldGrid | null = null;

/** convenience: isolines of the height function of `mode` for polygon P (plan coordinates; seg.h = height) */
export function fieldIsolines(P: Polygon, mode: string, k: number, step: number, N = 200): IsoSegment[] {
  return fieldContours(sampleField(P, mode, N), k, step);
}

