// Guided tour: left panel (step list, explanation, prev/next) and application of a step to the views.
import { $ } from '../dom';
import { state } from '../state';
import { STEPS, stepShape } from '../tour/steps';
import type { Step } from '../tour/steps';
import { draw2d, resize2d } from '../render/view2d';
import { setCamera, resize3d } from '../render/view3d';
import { loadShape, recompute } from './editor';
import { setMode, setSlope, setCut } from './toolbar';
import { syncBox } from './edgeBox';

/** set every view parameter of the step (defaults for the ones it leaves out), then its footprint */
export function applyStep(s: Step): void {
  setMode(s.mode ?? 'skel');
  setSlope(s.slope ?? 40);
  $<HTMLInputElement>('iso').checked = !!s.iso;
  $<HTMLInputElement>('walls').checked = s.walls ?? true;
  const shape = stepShape(s);
  if (shape) loadShape(shape.pts, shape.ov);
  else { state.highlight = null; state.sel = -1; state.selVertex = -1; syncBox(); recompute(false); }
  state.highlight = s.highlight ?? null;
  if (s.camera && shape) setCamera(s.camera);
  setCut(s.cut ?? null, !!s.cutAnim);   // also redraws the plan
  draw2d();
}

export interface Tour { go: (i: number | string, doApply?: boolean) => void; readonly index: number; steps: Step[] }

export function initTour(root: HTMLElement, steps: Step[] = STEPS): Tour {
  root.innerHTML = `<div class="tour-head"><b>Visite guidée</b> <span class="tour-count"></span></div>
<ol class="tour-list"></ol><div class="tour-body"></div>
<div class="tour-nav"><button class="tour-prev">&larr; Précédent</button><button class="tour-next">Suivant &rarr;</button></div>`;
  const q = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T;
  const list = q('.tour-list'), body = q('.tour-body'), count = q('.tour-count');
  const prev = q<HTMLButtonElement>('.tour-prev'), next = q<HTMLButtonElement>('.tour-next');
  let cur = -1;
  steps.forEach((s, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.textContent = s.title; b.onclick = () => go(i); li.appendChild(b); list.appendChild(li);
  });

  function show(i: number, applied: boolean): void {
    cur = i; const s = steps[i];
    count.textContent = `étape ${i + 1}/${steps.length}`;
    body.innerHTML = `<h2>${s.title}</h2>${s.html}`;
    [...list.children].forEach((li, k) => li.classList.toggle('on', k === i));
    prev.disabled = i === 0; next.disabled = i === steps.length - 1;
    const u = new URL(location.href); u.searchParams.set('step', s.id);
    if (applied) { u.searchParams.delete('preset'); u.searchParams.delete('mode'); }   // the step now owns them
    history.replaceState(null, '', u);
  }
  function go(i: number | string, doApply = true): void {
    const k = typeof i === 'string' ? steps.findIndex((s) => s.id === i) : i;
    if (k < 0 || k >= steps.length) return;
    show(k, doApply); if (doApply) applyStep(steps[k]);
  }
  prev.onclick = () => go(cur - 1); next.onclick = () => go(cur + 1);

  // PageUp / PageDown step through the tour (arrow keys stay with sliders and selects)
  addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'PageDown') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
  });
  // header button: show / hide the panel
  const toggle = $<HTMLButtonElement>('tourToggle');
  const sync = (): void => { toggle.setAttribute('aria-pressed', String(!root.hidden)); resize2d(); resize3d(); };
  toggle.onclick = () => { root.hidden = !root.hidden; sync(); };
  toggle.setAttribute('aria-pressed', 'true');

  return { go, get index() { return cur; }, steps };
}
