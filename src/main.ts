import './style.css';
import { PRESETS } from './geometry/presets';
import { resize2d } from './render/view2d';
import { resize3d, loop } from './render/view3d';
import { initEditor, loadPreset, recompute, toggleGable, addPointToEdge, deletePoint } from './ui/editor';
import { initEdgeBox } from './ui/edgeBox';
import { initToolbar, setMode } from './ui/toolbar';
import { initModal } from './ui/modal';
import { initTour } from './ui/tour';
import { $ } from './dom';

declare global { interface Window { __ready?: boolean; __tour?: ReturnType<typeof initTour> } }

initEditor();
initEdgeBox(() => recompute(false), toggleGable, addPointToEdge, deletePoint);
initToolbar();
initModal();

addEventListener('resize', () => { resize2d(); resize3d(); });
resize2d(); resize3d(); loop();
const tour = initTour($('tour'));
window.__tour = tour;
// ?step=<id> opens a tour step; ?preset= / ?mode= open the free mode with that drawing; nothing = step 1
const params = new URLSearchParams(location.search);
const q = params.get('preset'), qm = params.get('mode'), qs = params.get('step');
if (qs && tour.steps.some((s) => s.id === qs)) tour.go(qs);
else if (q || qm) {
  if (qm) setMode(qm);
  loadPreset(q && PRESETS[q] ? q : 'U');
  tour.go('libre', false);
} else tour.go(0);
window.__ready = true;
