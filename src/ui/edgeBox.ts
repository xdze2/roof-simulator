// Selected-edge box: hip/gable radios, per-edge slope slider, "use global".
import { $, globalAlpha } from '../dom';
import { state } from '../state';

export function syncBox(): void {
  const { ov, sel, pts, closed } = state;
  const box = $('edgeBox'); box.hidden = !(closed && sel >= 0 && sel < pts.length);
  if (box.hidden) return;
  const o = ov[sel], gable = !!(o && o.gable), alpha = o && !o.gable ? o.alpha! : globalAlpha();
  $('eN').textContent = String(sel);
  document.querySelector<HTMLInputElement>('input[name=em][value=hip]')!.checked = !gable;
  document.querySelector<HTMLInputElement>('input[name=em][value=gable]')!.checked = gable;
  const eSlope = $<HTMLInputElement>('eSlope');
  eSlope.value = String(alpha); eSlope.disabled = gable; $('eSlopeV').innerHTML = gable ? '90&deg;' : alpha + '&deg;';
}

/** onChange: re-run the skeleton after an edge override changed */
export function initEdgeBox(onChange: () => void, toggleGable: (i: number) => void): void {
  document.querySelectorAll<HTMLInputElement>('input[name=em]').forEach((r) => r.addEventListener('change', () => {
    const { ov, sel } = state;
    if (sel < 0) return;
    ov[sel] = r.value === 'gable' ? { gable: true } : { alpha: ov[sel] && ov[sel]!.alpha || globalAlpha() };
    syncBox(); onChange();
  }));
  const eSlope = $<HTMLInputElement>('eSlope');
  eSlope.addEventListener('input', () => { if (state.sel < 0) return; state.ov[state.sel] = { alpha: +eSlope.value }; syncBox(); onChange(); });
  $('eUse').onclick = () => { if (state.sel >= 0) { state.ov[state.sel] = undefined; syncBox(); onChange(); } };
  addEventListener('keydown', (e) => { if ((e.key === 'g' || e.key === 'G') && state.closed && state.sel >= 0) toggleGable(state.sel); });
}
