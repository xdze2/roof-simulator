// Footprint editing: pointer/keyboard handling on the 2D canvas, preset loading, skeleton recompute.
import { straightSkeleton, polyArea } from '../geometry/skeleton';
import type { Vec2, Polygon } from '../geometry/skeleton';
import { insertVertex, deleteVertex, projectOnSegment, MIN_POINTS } from '../geometry/edit';
import { polygonProblem } from '../geometry/validity';
import { PRESETS, GABLES } from '../geometry/presets';
import { $, globalAlpha } from '../dom';
import { state } from '../state';
import type { EdgeOverride } from '../state';
import { c2, draw2d, pickAt, evPos, snap, toWorld } from '../render/view2d';
import { build3d } from '../render/view3d';
import { syncBox } from './edgeBox';
import { t, onLangChange } from '../i18n';
import type { Key } from '../i18n';

export function weightsArr(): number[] {
  return state.pts.map((_, i) => { const o = state.ov[i]; const a = o ? (o.gable ? null : o.alpha) : globalAlpha(); return a === null ? 0 : 1 / Math.tan(a! * Math.PI / 180); });
}

// polygonProblem() returns English text (kept for its tests); map it to a dictionary key for display
const PROBLEM_KEYS: Record<string, Key> = {
  'Polygon needs at least 3 points': 'err.tooFew', 'Duplicate points (zero-length edge)': 'err.duplicate',
  'Self-intersecting polygon': 'err.selfIntersect', 'Degenerate polygon (zero area)': 'err.zeroArea',
};
let msgFn: (() => string) | null = null;   // current message, re-rendered on language change
function showMsg(fn: (() => string) | null): void {
  msgFn = fn;
  const msg = $('msg'); msg.textContent = fn ? '\u26a0 ' + fn() : ''; msg.hidden = !fn;
}
onLangChange(() => showMsg(msgFn));
function setProblem(problem: string | null): void {
  state.invalid = problem;
  showMsg(problem ? () => (PROBLEM_KEYS[problem] ? t(PROBLEM_KEYS[problem]) : problem) : null);
}

export function recompute(refit: boolean): void {
  let problem: string | null = null, skelErr: string | null = null;
  state.sk = null;
  if (state.closed) {
    problem = polygonProblem(state.pts);
    if (!problem) {
      try { state.sk = straightSkeleton(state.pts, weightsArr()); } catch (err) { skelErr = (err as Error).message; problem = 'Skeleton computation failed: ' + skelErr; }
    }
  }
  setProblem(problem);
  if (skelErr !== null) { const m = skelErr; showMsg(() => t('err.skelFailed', { msg: m })); }
  draw2d(); build3d(refit);
}
let rafPending = false;
function recomputeThrottled(): void { if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; recompute(false); }); }

export function toggleGable(i: number): void {
  const { ov } = state;
  ov[i] = ov[i] && ov[i]!.gable ? undefined : { gable: true }; syncBox(); recompute(false);
}

/** insert a point into edge i (at p, default the edge midpoint); both halves keep the edge's settings */
export function addPointToEdge(i: number, p?: Vec2): void {
  const { pts } = state, a = pts[i], b = pts[(i + 1) % pts.length];
  const r = insertVertex(pts, state.ov, i, p ?? [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  state.pts = r.pts; state.ov = r.ov; state.sel = i; state.selVertex = -1; state.hover = null; state.highlight = null;
  syncBox(); recompute(false);
}

/** delete vertex v; its two edges merge, keeping the previous edge's settings; at least 3 points stay */
export function deletePoint(v: number): void {
  const r = deleteVertex(state.pts, state.ov, v);
  if (!r) { showMsg(() => t('err.minPoints', { n: MIN_POINTS })); return; }
  state.pts = r.pts; state.ov = r.ov; state.sel = -1; state.selVertex = -1; state.hover = null; state.highlight = null;
  syncBox(); recompute(false);
}

/** replace the footprint by a closed polygon (copied) with per-edge overrides */
export function loadShape(pts: Polygon, ov: (EdgeOverride | undefined)[] = []): void {
  state.pts = pts.map((p): Vec2 => [p[0], p[1]]); state.closed = true; state.sel = -1; state.selVertex = -1;
  state.hover = null; state.highlight = null; state.ov = ov.slice();
  if (polyArea(state.pts) < 0) { state.pts.reverse(); state.ov = []; }   // keep edge indices aligned with the CCW skeleton polygon
  syncBox(); recompute(true);
}

export function loadPreset(name: string): void {
  const ov: EdgeOverride[] = []; for (const i of GABLES[name] || []) ov[i] = { gable: true };
  loadShape(PRESETS[name], ov);
}

export function clearAll(): void {
  state.ov = []; state.sel = -1; state.selVertex = -1; state.highlight = null; syncBox(); state.pts = []; state.closed = false; state.sk = null;
  state.hover = null; setProblem(null); c2.style.cursor = ''; build3d(true); draw2d();
}

function closePoly(): void {
  const { pts } = state;
  if (pts.length < 3) return;
  if (polyArea(pts) < 0) pts.reverse();   // keep edge indices aligned with the CCW skeleton polygon
  state.ov = []; state.sel = -1; state.selVertex = -1;
  state.closed = true; recompute(true);
}

function updateCursor(): void {
  const dragging = state.drag >= 0 || state.dragEdge;
  const h = state.hover;
  c2.style.cursor = dragging ? 'grabbing' : h ? 'grab' : '';
}

export function initEditor(): void {
  c2.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    const { pts } = state;
    const [x, y] = evPos(e);
    const hit = pickAt(x, y);
    if (state.closed) {
      if (hit && hit.kind === 'vertex') { state.selVertex = hit.index; state.sel = -1; syncBox(); state.drag = hit.index; state.hover = hit; c2.setPointerCapture(e.pointerId); updateCursor(); return; }
      state.sel = hit ? hit.index : -1; state.selVertex = -1;
      if (hit && e.shiftKey) toggleGable(hit.index);
      else {
        if (hit) {
          const i = hit.index, start = snap(toWorld(x, y)), n = pts.length;
          state.dragEdge = { i, start: [start[0], start[1]], p0: [...pts[i]], p1: [...pts[(i + 1) % n]] };
          state.hover = hit; c2.setPointerCapture(e.pointerId); updateCursor();
        }
        syncBox(); draw2d();
      }
      return;
    }
    if (hit && hit.index === 0 && pts.length >= 3) { closePoly(); return; }
    if (hit) return;
    pts.push(snap(toWorld(x, y))); draw2d();
  });
  c2.addEventListener('pointermove', (e) => {
    const [x, y] = evPos(e);
    state.mouse = snap(toWorld(x, y));
    const de = state.dragEdge, n = state.pts.length;
    if (state.drag >= 0) { state.pts[state.drag] = [state.mouse[0], state.mouse[1]]; recomputeThrottled(); }
    else if (de) {
      const dx = state.mouse[0] - de.start[0], dy = state.mouse[1] - de.start[1];
      state.pts[de.i] = [de.p0[0] + dx, de.p0[1] + dy];
      state.pts[(de.i + 1) % n] = [de.p1[0] + dx, de.p1[1] + dy];
      recomputeThrottled();
    } else { state.hover = pickAt(x, y); updateCursor(); draw2d(); }
  });
  const endDrag = (e: PointerEvent): void => {
    state.drag = -1; state.dragEdge = null;
    const [x, y] = evPos(e); state.hover = pickAt(x, y); updateCursor(); draw2d();
  };
  c2.addEventListener('pointerup', endDrag);
  c2.addEventListener('pointercancel', endDrag);
  c2.addEventListener('pointerleave', () => { if (state.drag < 0 && !state.dragEdge) { state.hover = null; state.mouse = null; updateCursor(); draw2d(); } });
  c2.addEventListener('dblclick', (e) => {
    if (!state.closed) { if (state.pts.length > 3) state.pts.pop(); closePoly(); return; }
    const [x, y] = evPos(e), hit = pickAt(x, y);
    if (!hit || hit.kind !== 'edge') return;
    const { pts } = state, i = hit.index, a = pts[i], b = pts[(i + 1) % pts.length];
    const q = projectOnSegment(toWorld(x, y), a, b);
    const sn = snap([q[0], q[1]]);   // keep the snap grid only when the snapped point stays on the edge
    const on = projectOnSegment(sn, a, b);
    addPointToEdge(i, Math.hypot(on[0] - sn[0], on[1] - sn[1]) < 1e-9 ? sn : [Math.round(q[0] * 100) / 100, Math.round(q[1] * 100) / 100]);
  });
  c2.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (!state.closed) return;
    const [x, y] = evPos(e), hit = pickAt(x, y);
    if (hit && hit.kind === 'vertex') deletePoint(hit.index);
  });
  addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !state.closed) closePoly();
    const t = e.target as HTMLElement;
    if ((e.key === 'Delete' || e.key === 'Backspace') && state.closed && state.selVertex >= 0 && t.tagName !== 'INPUT' && t.tagName !== 'SELECT') { e.preventDefault(); deletePoint(state.selVertex); }
  });
}
