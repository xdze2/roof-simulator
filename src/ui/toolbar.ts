// Header toolbar: clear, presets, reset-all, slope, walls, mode.
import { $ } from '../dom';
import { state } from '../state';
import { draw2d } from '../render/view2d';
import { build3d } from '../render/view3d';
import { clearAll, loadPreset, recompute } from './editor';
import { syncBox } from './edgeBox';

const updNote = (): void => { $('note').textContent = $<HTMLSelectElement>('mode').value !== 'skel' ? 'weights ignored in this mode' : ''; };

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
  updNote();
}

/** apply ?mode= from the URL to the select */
export function setMode(m: string): void { $<HTMLSelectElement>('mode').value = m; updNote(); }
