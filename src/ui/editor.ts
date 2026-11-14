// Footprint editing: pointer/keyboard handling on the 2D canvas, preset loading, skeleton recompute.
import { straightSkeleton, isSimple, polyArea } from '../geometry/skeleton';
import type { Vec2 } from '../geometry/skeleton';
import { PRESETS, GABLES } from '../geometry/presets';
import { $, globalAlpha } from '../dom';
import { state } from '../state';
import { c2, draw2d, pick, evPos, snap, toScr, toWorld } from '../render/view2d';
import { build3d } from '../render/view3d';
import { syncBox } from './edgeBox';

export function weightsArr(): number[] {
  return state.pts.map((_, i) => { const o = state.ov[i]; const a = o ? (o.gable ? null : o.alpha) : globalAlpha(); return a === null ? 0 : 1 / Math.tan(a! * Math.PI / 180); });
}

export function recompute(refit: boolean): void {
  $('msg').textContent = '';
  state.sk = null;
  if (state.closed && state.pts.length >= 3) {
    if (!isSimple(state.pts)) $('msg').textContent = 'polygon self-intersects';
    else {
      try { state.sk = straightSkeleton(state.pts, weightsArr()); } catch (err) { $('msg').textContent = 'skeleton failed: ' + (err as Error).message; }
    }
  }
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
  $('msg').textContent = ''; build3d(true); draw2d();
}

function closePoly(): void {
  const { pts } = state;
  if (pts.length < 3) return;
  if (polyArea(pts) < 0) pts.reverse();   // keep edge indices aligned with the CCW skeleton polygon
  state.ov = []; state.sel = -1;
  state.closed = true; recompute(true);
}

export function initEditor(): void {
  c2.addEventListener('pointerdown', (e) => {
    const { pts } = state;
    const [x, y] = evPos(e);
    const k = pick(x, y);
    if (state.closed) {
      if (k >= 0) { state.drag = k; c2.setPointerCapture(e.pointerId); return; }
      let be = -1, bd = 9;
      for (let i = 0; i < pts.length; i++) {
        const a = toScr(pts[i]), b = toScr(pts[(i + 1) % pts.length]);
        const dx = b[0] - a[0], dy = b[1] - a[1];
        const u = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
        const d = Math.hypot(x - a[0] - u * dx, y - a[1] - u * dy);
        if (d < bd) { bd = d; be = i; }
      }
      state.sel = be;
      if (be >= 0 && e.shiftKey) toggleGable(be); else { syncBox(); draw2d(); }
      return;
    }
    if (k === 0 && pts.length >= 3) { closePoly(); return; }
    if (k >= 0) return;
    pts.push(snap(toWorld(x, y))); draw2d();
  });
  c2.addEventListener('pointermove', (e) => {
    const [x, y] = evPos(e);
    state.mouse = snap(toWorld(x, y));
    if (state.drag >= 0) { state.pts[state.drag] = [state.mouse[0], state.mouse[1]]; recomputeThrottled(); }
    else draw2d();
  });
  c2.addEventListener('pointerup', () => { state.drag = -1; });
  c2.addEventListener('dblclick', () => { if (!state.closed) { if (state.pts.length > 3) state.pts.pop(); closePoly(); } });
  addEventListener('keydown', (e) => { if (e.key === 'Enter' && !state.closed) closePoly(); });
}
