import { t, onLangChange } from '../i18n';
import type { Vec2 } from '../geometry/skeleton';
import { fieldFor } from '../geometry/nearest';
import { pickTarget } from '../geometry/hit';
import type { Hit } from '../geometry/hit';
import { isolines, levelLine } from '../geometry/isolines';
import { $, globalAlpha, cutFraction, showsArcs } from '../dom';
import { state, GRID_STEP, ISO_STEP } from '../state';
import { color, rgb } from './colors';

export const c2 = $<HTMLCanvasElement>('c2d');
const ctx = c2.getContext('2d')!;

export const VIEW = { w: 1, h: 1, s: 10, ox: 0, oy: 0 };
/** the floating tour column covers the left of the plan canvas (wide layout): the plan is fitted to what is left */
function coveredLeft(): number {
  const col = $('tourCol'), main = $('main');
  if (getComputedStyle(col).position !== 'absolute') { main.style.removeProperty('--inset'); return 0; }
  const card = [...col.children].find((e) => !(e as HTMLElement).hidden) as HTMLElement | undefined;
  const inset = card ? Math.ceil(card.getBoundingClientRect().right - main.getBoundingClientRect().left) + 8 : 0;
  main.style.setProperty('--inset', inset + 'px');   // overlays and pane widths follow
  return inset;
}
export function resize2d(): void {
  const inset = coveredLeft();
  const r = c2.getBoundingClientRect(), dpr = devicePixelRatio || 1;
  c2.width = Math.round(r.width * dpr); c2.height = Math.round(r.height * dpr);
  VIEW.w = r.width; VIEW.h = r.height;
  const aw = Math.max(r.width - inset, 120);
  VIEW.s = Math.min(aw, r.height) / 42;
  VIEW.ox = inset + aw / 2 - 20 * VIEW.s; VIEW.oy = r.height / 2 + 19 * VIEW.s;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw2d();
}
export const toScr = (p: Vec2): Vec2 => [VIEW.ox + p[0] * VIEW.s, VIEW.oy - p[1] * VIEW.s];
export const toWorld = (x: number, y: number): Vec2 => [(x - VIEW.ox) / VIEW.s, (VIEW.oy - y) / VIEW.s];

let legendKey = '';
onLangChange(() => { legendKey = ''; draw2d(); });
function updateLegend(iso: boolean, mode: string): void {
  const { sk, closed, ov } = state;
  const items: [string, number, string, string][] = [['#111', 2, 'solid', t('legend.outline')]];
  if (closed && ov.some((o) => o && o.gable)) items.push(['#000', 5, 'solid', t('legend.gable')]);
  if (sk && closed && showsArcs(mode)) {
    if (iso) items.push(['#d32f2f', 2, 'solid', t('legend.ridgeAll')]);
    else items.push(['#c4501b', 2, 'solid', t('legend.hipRidge')], ['#1b6fc4', 2, 'solid', t('legend.valley')]);
  }
  if (sk && closed && iso) items.push(['#bdbdbd', 1, 'solid', t('legend.isolines', { step: ISO_STEP })]);
  if (sk && closed && cutFraction() !== null) items.push(['#d00000', 3, 'solid', t('legend.level')]);
  const key = JSON.stringify(items);
  if (key === legendKey) return;
  legendKey = key;
  $('legend').innerHTML = items.map(([c, w, st, label]) => `<div class="li"><i style="border-top-width:${w}px;border-color:${c};border-top-style:${st}"></i>${label}</div>`).join('');
}

export function draw2d(): void {
  const { pts, closed, sk, mouse } = state;
  ctx.clearRect(0, 0, VIEW.w, VIEW.h);
  // grid
  ctx.strokeStyle = '#e6e6df'; ctx.lineWidth = 1; ctx.beginPath();
  for (let g = -2 * GRID_STEP; g <= 10 * GRID_STEP; g += GRID_STEP) {
    const a = toScr([g, -2 * GRID_STEP]), b = toScr([g, 10 * GRID_STEP]); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
    const c = toScr([-2 * GRID_STEP, g]), d = toScr([10 * GRID_STEP, g]); ctx.moveTo(c[0], c[1]); ctx.lineTo(d[0], d[1]);
  }
  ctx.stroke();
  const mode = $<HTMLSelectElement>('mode').value;
  const iso = $<HTMLInputElement>('iso').checked;
  updateLegend(iso, mode);
  if (sk && closed && iso) drawIsolines(sk);   // contour lines replace the face colours
  if (sk && closed && mode !== 'skel' && !iso) drawNearest2d();
  if (sk && closed) {
    if (mode === 'skel' && !iso) sk.faces.forEach((f, i) => {
      ctx.beginPath();
      f.forEach((p, k) => { const s = toScr([p.x, p.y]); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
      ctx.closePath(); ctx.fillStyle = color(i); ctx.fill();
    });
    ctx.lineWidth = 2;
    if (showsArcs(mode)) for (const a of sk.arcs) {
      const p = toScr([sk.nodes[a.a].x, sk.nodes[a.a].y]), q = toScr([sk.nodes[a.b].x, sk.nodes[a.b].y]);
      ctx.strokeStyle = iso ? '#d32f2f' : mode === 'overlay' ? (a.reflex ? '#0a2a66' : '#111') : a.reflex ? '#1b6fc4' : '#c4501b';
      ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    }
    ctx.fillStyle = '#333';
    if (showsArcs(mode) && !iso) for (const nd of sk.nodes) { if (nd.t < 1e-9) continue; const s = toScr([nd.x, nd.y]); ctx.beginPath(); ctx.arc(s[0], s[1], 2.5, 0, 7); ctx.fill(); }
  }
  // footprint
  const bad = !!state.invalid, ink = bad ? '#d32f2f' : '#111';
  if (pts.length) {
    if (bad && closed) {
      ctx.beginPath(); pts.forEach((p, k) => { const s = toScr(p); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
      ctx.closePath(); ctx.fillStyle = 'rgba(211,47,47,.18)'; ctx.fill();
    }
    ctx.strokeStyle = ink; ctx.lineWidth = iso && !bad ? 1.5 : 2.5; ctx.beginPath();
    pts.forEach((p, k) => { const s = toScr(p); k ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
    if (closed) ctx.closePath();
    else if (mouse) { const s = toScr(mouse); ctx.lineTo(s[0], s[1]); }
    ctx.stroke();
    if (sk && closed && showsArcs(mode)) drawLevelLine(sk);
    if (closed) decorateEdges();
    drawHighlight();
    drawHover(); drawSelVertex();
    pts.forEach((p, k) => {
      const s = toScr(p); ctx.beginPath(); ctx.arc(s[0], s[1], k === 0 && !closed ? 6 : 4, 0, 7);
      ctx.fillStyle = k === 0 && !closed ? '#e33' : ink; ctx.fill();
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
    if (gable) { ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.lineCap = 'butt'; }
    if (!gable && o && o.alpha !== g) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const nx = (b[1] - a[1]) / len, ny = -(b[0] - a[0]) / len;   // inward side on screen (CCW world, y flipped)
      const tx = (a[0] + b[0]) / 2 + nx * 13, ty = (a[1] + b[1]) / 2 + ny * 13;
      const txt = o!.alpha + '°';
      ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fillRect(tx - 18, ty - 8, 36, 16);
      ctx.fillStyle = '#111'; ctx.fillText(txt, tx, ty);
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
  const nn = fieldFor($<HTMLSelectElement>('mode').value, sk.poly), n = sk.poly.length;
  // level line in field modes: height = distance * tan(slope), so the line is where d = h / tan(slope)
  const cf = cutFraction(), L = cf === null ? null : cf * sk.maxT / Math.tan(globalAlpha() * Math.PI / 180), tol = 0.6 * CELL / VIEW.s;
  const cols = sk.poly.map((_, i) => rgb(i));
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const wp = toWorld((i + 0.5) * CELL, (j + 0.5) * CELL);
    const q = nn.query(wp[0], wp[1]);
    if (!q) continue;
    let c: number[];
    if (q.site < n) c = cols[q.site];
    else c = (((i + j) >> 1) & 1) ? [200, 200, 200] : [150, 150, 150]; // reflex vertex: grey hatching
    if (L !== null && Math.abs(q.d - L) < tol) c = [208, 0, 0];
    const k = (j * w + i) * 4; d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255;
  }
  o.putImageData(img, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(off, 0, 0, w * CELL, h * CELL);
}

export const PICK_R = 9;
/** vertex (priority) or edge under the screen position */
export const pickAt = (x: number, y: number): Hit => pickTarget(state.pts.map(toScr), [x, y], PICK_R, state.closed);

function drawSelVertex(): void {
  const { selVertex, pts } = state;
  if (selVertex < 0 || selVertex >= pts.length) return;
  const s = toScr(pts[selVertex]);
  ctx.beginPath(); ctx.arc(s[0], s[1], 8, 0, 7); ctx.strokeStyle = 'rgba(230,40,40,.8)'; ctx.lineWidth = 2.5; ctx.stroke();
}

function drawHover(): void {
  const { hover, pts, drag, dragEdge } = state;
  if (!hover || hover.index >= pts.length) return;
  const active = drag >= 0 || !!dragEdge;
  ctx.strokeStyle = active ? 'rgba(25,118,210,.75)' : 'rgba(25,118,210,.5)';
  ctx.fillStyle = 'rgba(25,118,210,.25)';
  if (hover.kind === 'vertex') {
    const s = toScr(pts[hover.index]);
    ctx.beginPath(); ctx.arc(s[0], s[1], 10, 0, 7); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  } else {
    const a = toScr(pts[hover.index]), b = toScr(pts[(hover.index + 1) % pts.length]);
    ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.lineCap = 'butt';
  }
}

function drawIsolines(sk: NonNullable<typeof state.sk>): void {
  ctx.strokeStyle = '#bdbdbd'; ctx.lineWidth = 0.75; ctx.beginPath();
  for (const s of isolines(sk, ISO_STEP)) { const a = toScr(s.a), b = toScr(s.b); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
  ctx.stroke();
}

export const evPos = (e: MouseEvent): Vec2 => { const r = c2.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
export const snap = (w: Vec2): Vec2 => (w[0] = Math.round(w[0] * 2) / 2, w[1] = Math.round(w[1] * 2) / 2, w);

/** level line (skeleton mode): red with a white halo so it reads over the face colours */
function drawLevelLine(sk: NonNullable<typeof state.sk>): void {
  const cf = cutFraction();
  if (cf === null) return;
  const segs = levelLine(sk, cf * sk.maxT);
  ctx.lineCap = 'round';
  for (const [col, lw] of [['rgba(255,255,255,.9)', 6], ['#d00000', 3]] as const) {
    ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath();
    for (const [p, q] of segs) { const a = toScr(p), b = toScr(q); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
}

/** guided-tour emphasis: amber band on edges, red ring on vertices */
function drawHighlight(): void {
  const { highlight: hl, pts } = state, n = pts.length;
  if (!hl) return;
  ctx.strokeStyle = 'rgba(255,170,0,.6)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  for (const i of hl.edges ?? []) {
    if (i >= n) continue;
    const a = toScr(pts[i]), b = toScr(pts[(i + 1) % n]); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.lineCap = 'butt'; ctx.strokeStyle = '#e33'; ctx.lineWidth = 3;
  for (const i of hl.vertices ?? []) {
    if (i >= n) continue;
    const a = toScr(pts[i]); ctx.beginPath(); ctx.arc(a[0], a[1], 12, 0, 7); ctx.stroke();
  }
}
