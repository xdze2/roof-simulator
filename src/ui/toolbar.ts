// Header toolbar: clear, presets, reset-all, slope, walls, mode, isolines, level line.
import { $ } from '../dom';
import { state } from '../state';
import { draw2d } from '../render/view2d';
import { build3d, updateCut } from '../render/view3d';
import { clearAll, loadPreset, recompute } from './editor';
import { syncBox } from './edgeBox';

const updNote = (): void => { $('note').textContent = $<HTMLSelectElement>('mode').value !== 'skel' ? 'weights ignored in this mode' : ''; };

let cutToken = 0;   // bumped to stop a running level-line animation
const onCut = (): void => { updateCut(); draw2d(); };

/** set the level line: fraction of the ridge height (0..1) or null = off; anim: rise from 0 to it */
export function setCut(frac: number | null, anim = false): void {
  const tok = ++cutToken, cut = $<HTMLInputElement>('cut');
  $<HTMLInputElement>('cutOn').checked = frac !== null;
  if (frac === null || !anim) { if (frac !== null) cut.value = String(Math.round(frac * 100)); onCut(); return; }
  const t0 = performance.now(), D = 2500;
  const tick = (now: number): void => {
    if (tok !== cutToken) return;
    const u = Math.min(1, (now - t0) / D);
    cut.value = String(Math.round(frac * 100 * (1 - (1 - u) ** 2)));   // ease-out
    onCut(); if (u < 1) requestAnimationFrame(tick);
  };
  cut.value = '0'; requestAnimationFrame(tick);
}

export function initToolbar(): void {
  $('clear').onclick = clearAll;
  document.querySelectorAll<HTMLElement>('[data-preset]').forEach((b) => b.onclick = () => {
    loadPreset(b.dataset.preset!);
  });
  $('resetW').onclick = () => { state.ov = []; syncBox(); recompute(false); };
  const slope = $<HTMLInputElement>('slope');
  slope.addEventListener('input', () => { $('slopeV').innerHTML = slope.value + '&deg;'; syncBox(); recompute(false); });
  $('walls').addEventListener('change', () => build3d(false));
  $('mode').addEventListener('change', () => { updNote(); draw2d(); build3d(false); });
  $('iso').addEventListener('change', draw2d);
  $('cutOn').addEventListener('change', () => { cutToken++; onCut(); });
  $('cut').addEventListener('input', () => { cutToken++; $<HTMLInputElement>('cutOn').checked = true; onCut(); });
  updNote();
}

/** set the display mode select (?mode= or a tour step); the caller redraws */
export function setMode(m: string): void { $<HTMLSelectElement>('mode').value = m; updNote(); }

/** set the global slope slider (degrees); the caller recomputes */
export function setSlope(deg: number): void { $<HTMLInputElement>('slope').value = String(deg); $('slopeV').innerHTML = deg + '&deg;'; }
