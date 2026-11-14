import type { Vec2 } from '../geometry/skeleton';
import { makeNearest } from '../geometry/nearest';
import { $, globalAlpha } from '../dom';
import { state } from '../state';
import { color, rgb } from './colors';

export const c2 = $<HTMLCanvasElement>('c2d');
const ctx = c2.getContext('2d')!;

export const VIEW = { w: 1, h: 1, s: 10, ox: 0, oy: 0 };
export function resize2d(): void {
  const r = c2.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  c2.width = Math.round(r.width * dpr); c2.height = Math.round(r.height * dpr);
  VIEW.w = r.width; VIEW.h = r.height;
  VIEW.s = Math.min(r.width, r.height) / 42;
  VIEW.ox = r.width / 2 - 20 * VIEW.s; VIEW.oy = r.height / 2 + 19 * VIEW.s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw2d();
}
export const toScr = (p: Vec2): Vec2 => [VIEW.ox + p[0] * VIEW.s, VIEW.oy - p[1] * VIEW.s];
export const toWorld = (x: number, y: number): Vec2 => [(x - VIEW.ox) / VIEW.s, (VIEW.oy - y) / VIEW.s];

export function draw2d(): void {
  const { pts, closed, sk, mouse } = state;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  // grid
  ctx.strokeStyle = '#e6e6df'; ctx.lineWidth = 1; ctx.beginPath();
  for (let g = -10; g <= 50; g += 5) {
    const a = toScr([g, -10]), b = toScr([g, 50]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    const c = toScr([-10, g]), d = toScr([50, g]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  }
  ctx.stroke();
  const mode = $<HTMLSelectElement>('mode').value;
  if (sk && closed && mode !== 'skel') drawNearest2d();
  if (sk && closed) {
    if (mode === 'skel') sk.faces.forEach((f, i) => {
      ctx.beginPath();
      f.forEach((p, k) => { const s = toScr([p.x, p.y]); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
      ctx.closePath(); ctx.fillStyle = color(i); ctx.fill();
    });
    ctx.lineWidth = 2;
    if (mode !== 'nearest') for (const a of sk.arcs) {
      const p = toScr([sk.nodes[a.a].x, sk.nodes[a.a].y]), q = toScr([sk.nodes[a.b].x, sk.nodes[a.b].y]);
      ctx.strokeStyle = mode === 'overlay' ? (a.reflex ? '#0a2a66' : '#111') : a.reflex ? '#1b6fc4' : '#c4501b';
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    ctx.fillStyle = '#333';
    if (mode !== 'nearest') for (const nd of sk.nodes) { if (nd.t < 1e-9) continue; const s = toScr([nd.x, nd.y]); ctx.beginPath(); ctx.arc(s[0], s[1], 2.5, 0, 7); ctx.fill(); }
  }
  // footprint
  if (pts.length) {
    ctx.strokeStyle = '#111'; ctx.lineWidth = 2.5; ctx.beginPath();
    pts.forEach((p, k) => { const s = toScr(p); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
    if (closed) ctx.closePath();
    else if (mouse) { const s = toScr(mouse); ctx.lineTo(s[0], s[1]); }
    ctx.stroke();
    if (closed) decorateEdges();
    pts.forEach((p, k) => {
      const s = toScr(p); ctx.beginPath(); ctx.arc(s[0], s[1], k === 0 && !closed ? 6 : 4, 0, 7);
      ctx.fillStyle = k === 0 && !closed ? '#e33' : '#111'; ctx.fill();
    });
  }
}

function decorateEdges(): void {
  const { pts, ov, sel } = state;
  const n = pts.length, g = globalAlpha();
  ctx.font = '12px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const a = toScr(pts[i]), b = toScr(pts[(i + 1) % n]), o = ov[i];
    const gable = o && o.gable;
    if (i === sel) { ctx.strokeStyle = 'rgba(230,40,40,.55)'; ctx.lineWidth = 9; ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
    if (gable) { ctx.strokeStyle = '#6b2d00'; ctx.lineWidth = 6; ctx.setLineDash([9, 5]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]); }
    if (gable || (o && o.alpha !== g)) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;   // inward side on screen (CCW world, y flipped)
      const tx = (a[0] + b[0]) / 2 + nx * 13, ty = (a[1] + b[1]) / 2 + ny * 13;
      const txt = gable ? 'gable' : o!.alpha + '°';
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(tx - 18, ty - 8, 36, 16);
      ctx.fillStyle = gable ? '#6b2d00' : '#111'; ctx.fillText(txt, tx, ty);
    }
  }
  ctx.setLineDash([]);
}

const off = document.createElement('canvas');
const CELL = 2;
function drawNearest2d(): void {
  const sk = state.sk!;
  const w = Math.ceil(VIEW.w / CELL), h = Math.ceil(VIEW.h / CELL);
  off.width = w; off.height = h;
  const o = off.getContext('2d')!, img = o.createImageData(w, h), d = img.data;
  const nn = makeNearest(sk.poly), n = sk.poly.length;
  const cols = sk.poly.map((_, i) => rgb(i));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const wp = toWorld((i + 0.5) * CELL, (j + 0.5) * CELL);
    const q = nn.query(wp[0], wp[1]);
    if (!q) continue;
    let c: number[];
    if (q.site < n) c = cols[q.site];
    else c = (((i + j) >> 1) & 1) ? [200, 200, 200] : [150, 150, 150]; // reflex vertex: grey hatching
    const k = (j * w + i) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  o.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, w * CELL, h * CELL);
}

export function pick(x: number, y: number, r = 9): number {
  const { pts } = state;
  for (let i = 0; i < pts.length; i++) {
    const s = toScr(pts[i]);
    if (Math.hypot(s[0] - x, s[1] - y) <= r) return i;
  }
  return -1;
}
export const evPos = (e: MouseEvent): Vec2 => { const r = c2.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
export const snap = (w: Vec2): Vec2 => (w[0] = Math.round(w[0] * 2) / 2, w[1] = Math.round(w[1] * 2) / 2, w);
