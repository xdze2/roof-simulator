// Selected-edge box: hip/gable radios, per-edge slope slider, "global" toggle.
import { $, globalAlpha } from '../dom';
import { state } from '../state';

export function syncBox(): void {
  const { ov, sel, pts, closed } = state;
  const box = $('edgeBox'); box.hidden = !(closed && sel >= 0 && sel < pts.length);
  if (box.hidden) return;
  const o = ov[sel], gable = !!(o && o.gable), own = !gable && !!o && o.alpha !== undefined;
  const alpha = own ? o!.alpha! : globalAlpha();
  $('eN').textContent = String(sel);
  document.querySelector<HTMLInputElement>('input[name=em][value=hip]')!.checked = !gable;
  document.querySelector<HTMLInputElement>('input[name=em][value=gable]')!.checked = gable;
  const eSlope = $<HTMLInputElement>('eSlope'), eGlobal = $<HTMLInputElement>('eGlobal');
  eGlobal.checked = !gable && !own; eGlobal.disabled = gable;
  eSlope.value = String(alpha); eSlope.disabled = gable || !own;   // slider only active for a hip edge with its own slope
  $('eSlopeV').innerHTML = gable ? '&ndash;' : alpha + '&deg;';
}

/** onChange: re-run the skeleton after an edge override changed */
export function initEdgeBox(onChange: () => void, toggleGable: (i: number) => void): void {
  document.querySelectorAll<HTMLInputElement>('input[name=em]').forEach((r) => r.addEventListener('change', () => {
    const { ov, sel } = state;
    if (sel < 0) return;
    ov[sel] = r.value === 'gable' ? { gable: true } : undefined;   // back to hip: follows the global slope
    syncBox(); onChange();
  }));
  const eSlope = $<HTMLInputElement>('eSlope');
  eSlope.addEventListener('input', () => { if (state.sel < 0) return; state.ov[state.sel] = { alpha: +eSlope.value }; syncBox(); onChange(); });
  // global ON: edge follows the toolbar slope; OFF: own override, starting from the current global value
  $<HTMLInputElement>('eGlobal').addEventListener('change', (e) => {
    const { ov, sel } = state;
    if (sel < 0 || (ov[sel] && ov[sel]!.gable)) return;
    ov[sel] = (e.target as HTMLInputElement).checked ? undefined : { alpha: globalAlpha() };
    syncBox(); onChange();
  });
  addEventListener('keydown', (e) => { if ((e.key === 'g' || e.key === 'G') && state.closed && state.sel >= 0) toggleGable(state.sel); });
}
