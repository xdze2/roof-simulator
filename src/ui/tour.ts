// Guided tour: floating assistant panel (accordion of steps) and application of a step to the views.
import { $ } from '../dom';
import { state } from '../state';
import { STEPS, stepShape } from '../tour/steps';
import type { Step } from '../tour/steps';
import { draw2d, resize2d } from '../render/view2d';
import { setCamera, resize3d } from '../render/view3d';
import { loadShape, recompute } from './editor';
import { setMode, setSlope, setCut, onCutChange } from './toolbar';
import { syncBox } from './edgeBox';
import { t, getLang, applyI18n, onLangChange } from '../i18n';

/** set every view parameter of the step (defaults for the ones it leaves out), then its footprint */
export function applyStep(s: Step): void {
  setMode(s.mode ?? 'skel');
  setSlope(s.slope ?? 40);
  $<HTMLInputElement>('iso').checked = !!s.iso;
  const shape = stepShape(s);
  if (shape) loadShape(shape.pts, shape.ov);
  else { state.highlight = null; state.sel = -1; state.selVertex = -1; syncBox(); recompute(false); }
  state.highlight = s.highlight ?? null;
  if (s.camera && shape) setCamera(s.camera);
  setCut(s.cut ?? null, !!s.cutAnim);   // also redraws the plan
  draw2d();
}

export interface Tour {
  go: (i: number | string, doApply?: boolean) => void;
  open: () => void;
  close: () => void;
  readonly index: number;
  readonly isOpen: boolean;
  steps: Step[];
}

export function initTour(root: HTMLElement, steps: Step[] = STEPS): Tour {
  root.innerHTML = `<div class="tour-head"><b data-i18n="tour.title"></b>
<button class="tour-x" data-i18n="tour.hide" data-i18n-aria="tour.close" data-i18n-title="tour.close"></button></div>
<ol class="tour-list"></ol>`;
  applyI18n(root);
  const q = <T extends HTMLElement>(sel: string): T => root.querySelector(sel) as T;
  const list = q('.tour-list'), closeBtn = q('.tour-x');
  const toggle = $<HTMLButtonElement>('tourToggle');
  let cur = -1, collapsed = false;   // collapsed: no step open (cur stays the last active one)
  const freeStep = steps.find((s) => s.free);

  /** in-step controls, bound to the toolbar ones */
  const syncCut = (): void => {
    const tb = $<HTMLInputElement>('cut');
    list.querySelectorAll<HTMLInputElement>('.tour-cut').forEach((r) => { r.value = tb.value; });
    list.querySelectorAll<HTMLElement>('.tour-cutv').forEach((b) => { b.textContent = $('cutV').textContent; });
  };
  onCutChange(syncCut);
  function controlsFor(s: Step): HTMLElement | null {
    if (!s.controls?.length) return null;
    const box = document.createElement('div'); box.className = 'tour-ctl';
    for (const c of s.controls) if (c === 'cut') {
      box.innerHTML = `<label>${t('cut.label')} <input class="tour-cut" type="range" min="0" max="100"> <b class="tour-cutv"></b></label>`;
      box.querySelector('input')!.addEventListener('input', (e) => {
        const tb = $<HTMLInputElement>('cut'); tb.value = (e.target as HTMLInputElement).value;
        tb.dispatchEvent(new Event('input'));   // the toolbar handler stops any animation and redraws
      });
    }
    return box;
  }

  function render(): void {
    const lang = getLang();
    list.replaceChildren();
    steps.forEach((s, i) => {
      const li = document.createElement('li'), b = document.createElement('button'), d = document.createElement('div');
      b.className = 'tour-title'; b.textContent = s.title[lang]; b.setAttribute('aria-expanded', String(i === cur && !collapsed));
      b.onclick = () => (i === cur && !collapsed ? collapse() : go(i));
      d.className = 'tour-step'; d.innerHTML = s.html[lang];
      const ctl = controlsFor(s); if (ctl) d.appendChild(ctl);
      li.classList.toggle('on', i === cur && !collapsed); li.append(b, d); list.appendChild(li);
    });
    syncCut();
  }

  function show(i: number, applied: boolean): void {
    cur = i; collapsed = false; const s = steps[i];
    [...list.children].forEach((li, k) => {
      li.classList.toggle('on', k === i);
      li.querySelector('.tour-title')!.setAttribute('aria-expanded', String(k === i));
    });
    syncCut();
    (list.children[i] as HTMLElement).scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (!root.hidden) setUrl(s.id, applied);
  }
  /** clicking the open step again closes it: nothing is re-applied, the drawing stays */
  function collapse(): void {
    collapsed = true;
    [...list.children].forEach((li) => {
      li.classList.remove('on'); li.querySelector('.tour-title')!.setAttribute('aria-expanded', 'false');
    });
  }
  function setUrl(id: string | null, applied = false): void {
    const u = new URL(location.href);
    if (id) u.searchParams.set('step', id); else u.searchParams.delete('step');
    if (applied) { u.searchParams.delete('preset'); u.searchParams.delete('mode'); }   // the step now owns them
    history.replaceState(null, '', u);
  }
  function go(i: number | string, doApply = true): void {
    const k = typeof i === 'string' ? steps.findIndex((s) => s.id === i) : i;
    if (k < 0 || k >= steps.length) return;
    show(k, doApply); if (doApply) applyStep(steps[k]);
  }

  const relayout = (): void => {
    toggle.setAttribute('aria-pressed', String(!root.hidden)); toggle.setAttribute('aria-expanded', String(!root.hidden));
    toggle.hidden = !root.hidden;   // the reopen card only shows while the panel is closed
    resize2d(); resize3d();
  };
  function open(): void {
    if (!root.hidden) return;
    root.hidden = false; relayout();
    if (cur >= 0) show(cur, false); else go(0);   // reopen on the last step, keeping the drawing
  }
  /** closing = free mode: keep the drawing, drop highlights, no forced cut / display settings */
  function close(): void {
    if (root.hidden) return;
    root.hidden = true; relayout();
    if (freeStep) applyStep(freeStep);
    setUrl(null);
  }

  onLangChange(() => { applyI18n(root); render(); resize2d(); resize3d(); });   // no re-apply: the user's drawing stays
  closeBtn.onclick = close;
  toggle.onclick = () => (root.hidden ? open() : close());

  // PageUp / PageDown step through the tour while it is open (arrow keys stay with sliders and selects)
  addEventListener('keydown', (e) => {
    if (root.hidden) return;
    if (e.key === 'PageDown') { e.preventDefault(); go(cur + 1); }
    else if (e.key === 'PageUp') { e.preventDefault(); go(cur - 1); }
  });

  render(); relayout();
  return { go, open, close, get index() { return cur; }, get isOpen() { return !root.hidden; }, steps };
}
