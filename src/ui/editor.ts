// Footprint editing: pointer/keyboard handling on the 2D canvas, preset loading, skeleton recompute.
import { straightSkeleton, polyArea } from '../geometry/skeleton';
import type { Vec2 } from '../geometry/skeleton';
import { polygonProblem } from '../geometry/validity';
import { PRESETS, GABLES } from '../geometry/presets';
import { $, globalAlpha } from '../dom';
import { state } from '../state';
import { c2, draw2d, pickAt, evPos, snap, toWorld } from '../render/view2d';
import { build3d } from '../render/view3d';
import { syncBox } from './edgeBox';

export function weightsArr(): number[] {
  return state.pts.map((_, i) => { const o = state.ov[i]; const a = o ? (o.gable ? null : o.alpha) : globalAlpha(); return a === null ? 0 : 1 / Math.tan(a! * Math.PI / 180); });
}

function setProblem(problem: string | null): void {
  state.invalid = problem;
  const msg = $('msg'); msg.textContent = problem ? '\u26a0 ' + problem : ''; msg.hidden = !problem;
}

export function recompute(refit: boolean): void {
  let problem: string | null = null;
  state.sk = null;
  if (state.closed) {
    problem = polygonProblem(state.pts);
    if (!problem) {
      try { state.sk = straightSkeleton(state.pts, weightsArr()); } catch (err) { problem = 'Skeleton computation failed: ' + (err as Error).message; }
    }
  }
  setProblem(problem);
  draw2d(); build3d(refit);
}
let rafPending = false;
function recomputeThrottled(): void { if (rafPending) return; rafPending = true; requestAnimationFrame(() => { rafPending = false; recompute(false); }); }

export function toggleGable(i: number): void {
  const { ov } = state;
  ov[i] = ov[i] && ov[i]!.gable ? undefined : { gable: true }; syncBox(); recompute(false);
}

export function loadPreset(name: string): void {
  state.pts = PRESETS[name].map((p): Vec2 => [p[0], p[1]]); state.closed = true; state.sel = -1;
  state.ov = []; for (const i of GABLES[name] || []) state.ov[i] = { gable: true };
  recompute(true);
}

export function clearAll(): void {
  state.ov = []; state.sel = -1; syncBox(); state.pts = []; state.closed = false; state.sk = null;
  state.hover = null; setProblem(null); c2.style.cursor = ''; build3d(true); draw2d();
}

function closePoly(): void {
  const { pts } = state;
  if (pts.length < 3) return;
  if (polyArea(pts) < 0) pts.reverse();   // keep edge indices aligned with the CCW skeleton polygon
  state.ov = []; state.sel = -1;
  state.closed = true; recompute(true);
}

function updateCursor(): void {
  const dragging = state.drag >= 0 || state.dragEdge;
  const h = state.hover;
  c2.style.cursor = dragging ? 'grabbing' : h ? (h.kind === 'vertex' ? 'grab' : 'move') : '';
}

export function initEditor(): void {
  c2.addEventListener('pointerdown', (e) => {
    const { pts } = state;
    const [x, y] = evPos(e);
    const hit = pickAt(x, y);
    if (state.closed) {
      if (hit && hit.kind === 'vertex') { state.drag = hit.index; state.hover = hit; c2.setPointerCapture(e.pointerId); updateCursor(); return; }
      state.sel = hit ? hit.index : -1;
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
  c2.addEventListener('dblclick', () => { if (!state.closed) { if (state.pts.length > 3) state.pts.pop(); closePoly(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !state.closed) closePoly(); });
}
