import './style.css';
import { PRESETS } from './geometry/presets';
import { resize2d } from './render/view2d';
import { resize3d, loop } from './render/view3d';
import { initEditor, loadPreset, recompute, toggleGable, addPointToEdge, deletePoint } from './ui/editor';
import { initEdgeBox } from './ui/edgeBox';
import { initToolbar, setMode } from './ui/toolbar';
import { initModal } from './ui/modal';

declare global { interface Window { __ready?: boolean } }

initEditor();
initEdgeBox(() => recompute(false), toggleGable, addPointToEdge, deletePoint);
initToolbar();
initModal();

addEventListener('resize', () => { resize2d(); resize3d(); });
resize2d(); resize3d(); loop();
const params = new URLSearchParams(location.search);
const q = params.get('preset');
const qm = params.get('mode'); if (qm) setMode(qm);
loadPreset(q && PRESETS[q] ? q : 'U');
window.__ready = true;
