// Header toolbar: clear, presets, slope, mode, isolines, level line.
import { $, getMode, isFieldMode } from '../dom';
import { draw2d } from '../render/view2d';
import { build3d, updateCut } from '../render/view3d';
import { clearAll, loadPreset, recompute } from './editor';
import { syncBox } from './edgeBox';
import { t, getLang, setLang, onLangChange } from '../i18n';
import type { Lang } from '../i18n';

/** show only the controls that mean something for the current method, and the "weights ignored" note */
function updNote(): void {
  const m = getMode(), none = m === 'none';
  $('slopeBox').hidden = none;              // no roof: no slope, no heights
  $('viewGrp').hidden = none;              // nor isolines / level line
  $('arcsBox').hidden = !isFieldMode(m);    // skeleton overlay only over a field method
  $('note').textContent = isFieldMode(m) ? t('note.weightsIgnored') : '';
}

let cutToken = 0;   // bumped to stop a running level-line animation
const cutListeners: (() => void)[] = [];
/** subscribe to every change of the level line (slider, checkbox, animation) */
export const onCutChange = (cb: () => void): void => { cutListeners.push(cb); };
const onCut = (): void => { updateCut(); draw2d(); cutListeners.forEach((f) => f()); };

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
  const preset = $<HTMLSelectElement>('preset');
  preset.addEventListener('change', () => { if (preset.value) loadPreset(preset.value); preset.value = ''; });
  const slope = $<HTMLInputElement>('slope');
  slope.addEventListener('input', () => { $('slopeV').innerHTML = slope.value + '&deg;'; syncBox(); recompute(false); });
  $('mode').addEventListener('change', () => { updNote(); syncBox(); draw2d(); build3d(false); });
  $('arcs').addEventListener('change', draw2d);
  $('iso').addEventListener('change', draw2d);
  $('cutOn').addEventListener('change', () => { cutToken++; onCut(); });
  $('cut').addEventListener('input', () => { cutToken++; $<HTMLInputElement>('cutOn').checked = true; onCut(); });
  updNote();
  const langBtns = document.querySelectorAll<HTMLButtonElement>('#langSel [data-lang]');
  const syncLang = (): void => langBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === getLang())));
  langBtns.forEach((b) => b.onclick = () => setLang(b.dataset.lang as Lang));
  onLangChange(() => { updNote(); syncLang(); });
  syncLang();
}

/** set the display mode select (?mode= or a tour step); the caller redraws */
export function setMode(m: string, arcs = false): void {
  if (m === 'overlay') { m = 'nearest'; arcs = true; }   // old ?mode=overlay links
  $<HTMLSelectElement>('mode').value = m; $<HTMLInputElement>('arcs').checked = arcs; updNote();
}

/** set the global slope slider (degrees); the caller recomputes */
export function setSlope(deg: number): void { $<HTMLInputElement>('slope').value = String(deg); $('slopeV').innerHTML = deg + '&deg;'; }
