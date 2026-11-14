// Minimal i18n: EN + FR dictionaries, t(key), language persisted in localStorage and in ?lang=.
// Static HTML: data-i18n (textContent), data-i18n-title (title attr), data-i18n-html (innerHTML).
// Dynamic UI: call t() where the text is built, and re-render inside an onLangChange(cb) callback.
export type Lang = 'en' | 'fr';

const en = {
  'site.title': 'Roof Simulator',
  'site.desc': 'Draw a floor plan, get a hipped roof: an interactive straight skeleton demo in the browser.',
  'group.drawing': 'Drawing',
  'group.roof': 'Algorithm',
  'group.view': 'View',
  'btn.clear': 'Clear',
  'btn.clear.title': 'remove the drawing',
  'preset.placeholder': 'Preset…',
  'preset.label': 'Preset footprint',
  'preset.rectangle': 'Rectangle',
  'preset.L': 'L',
  'preset.T': 'T',
  'preset.U': 'U',
  'preset.irregular': 'Irregular',
  'preset.gableHouse': 'Gable house',
  'preset.lGables': 'L with gables',
  'mode.label': 'Method',
  'mode.skel': 'Straight skeleton',
  'mode.nearest': 'Nearest segment (Voronoi / medial axis)',
  'mode.overlay': 'Overlay (nearest + skeleton arcs)',
  'mode.points': 'Nearest vertex (Voronoi of points)',
  'slope.label': 'Slope',
  'iso.label': 'isolines',
  'cut.label': 'level',
  'cut.title': 'level line and horizontal cut plane, as a fraction of the ridge height',
  'btn.tour': 'Guided tour',
  'btn.tour.title': 'show / hide the guided tour (PageUp / PageDown: previous / next step)',
  'btn.about': 'About',
  'lang.label': 'Language',
  'note.weightsIgnored': 'weights ignored in this mode',
  'edge.title': 'Edge',
  'edge.hip': 'Hip',
  'edge.gable': 'Gable (speed=0)',
  'edge.slope': 'slope=',
  'edge.global': 'global',
  'edge.global.title': 'on: this edge follows the global slope (toolbar); off: it has its own slope',
  'edge.add': 'Add point',
  'edge.add.title': 'insert a point at the middle of this edge (or double-click the edge)',
  'edge.help': 'click an edge to select it; shift-click or key G toggles gable',
  'vert.title': 'Point',
  'vert.delete': 'Delete point',
  'vert.delete.title': 'or press Delete / right-click the point',
  'hint': 'click to add points; click the first point, double-click or Enter to close; drag points or edges to edit; double-click an edge to add a point; select a point + Delete (or right-click it) to remove it.',
  'legend.outline': 'wall / outline',
  'legend.gable': 'gable (speed 0)',
  'legend.ridgeAll': 'ridge / hip / valley',
  'legend.hipRidge': 'hip / ridge',
  'legend.valley': 'valley',
  'legend.isolines': 'isolines (every {step} m)',
  'legend.level': 'level line',
  'err.minPoints': 'A polygon needs at least {n} points',
  'err.skelFailed': 'Skeleton computation failed: {msg}',
  'err.tooFew': 'Polygon needs at least 3 points',
  'err.duplicate': 'Duplicate points (zero-length edge)',
  'err.selfIntersect': 'Self-intersecting polygon',
  'err.zeroArea': 'Degenerate polygon (zero area)',
  'cap.2d': '2D top view',
  'cap.3d': '3D view',
  'tour.title': 'Guided tour',
  'tour.aria': 'Guided tour',
  'tour.close': 'Close the tour (free mode)',
  'tour.hide': 'Hide',
  'about.title': 'About Roof Simulator',
  'about.close': 'Close',
  'about.aria': 'About',
  'about.body': `<p><b>Roof Simulator</b> is a small interactive demo: draw a floor plan, get a hipped roof. It is free software under the <b>MIT license</b>; source code and issues: <a href="https://github.com/xdze2/roof-simulator" target="_blank" rel="noopener">github.com/xdze2/roof-simulator</a>.</p>
  <h3>Implementation</h3>
  <ul>
    <li>Written in <b>TypeScript</b>, bundled with <b>Vite</b>; the only runtime dependency is <b>three.js</b>. No backend: everything runs in your browser.</li>
    <li>The geometry (event-driven straight skeleton with vertex events, nearest-segment and nearest-point fields, isolines) is plain TypeScript, unit-tested with Vitest.</li>
    <li>The plan is drawn on a <b>2D canvas</b>; the roof is rendered in 3D with <b>WebGL</b> through three.js (orbit controls, shadows).</li>
    <li>The guided tour is a list of steps, each one setting the drawing, the method and the camera.</li>
  </ul>
  <p>Built with Claude Code.</p>`,
};

const fr: Record<keyof typeof en, string> = {
  'site.title': 'Roof Simulator',
  'site.desc': 'Dessine un plan, obtiens un toit à pans : une démo interactive du squelette droit dans le navigateur.',
  'group.drawing': 'Dessin',
  'group.roof': 'Algorithme',
  'group.view': 'Affichage',
  'btn.clear': 'Effacer',
  'btn.clear.title': 'effacer le dessin',
  'preset.placeholder': 'Modèle…',
  'preset.label': 'Plan prédéfini',
  'preset.rectangle': 'Rectangle',
  'preset.L': 'L',
  'preset.T': 'T',
  'preset.U': 'U',
  'preset.irregular': 'Irrégulier',
  'preset.gableHouse': 'Maison à pignons',
  'preset.lGables': 'L avec pignons',
  'mode.label': 'Méthode',
  'mode.skel': 'Squelette droit',
  'mode.nearest': 'Segment le plus proche (Voronoï / axe médian)',
  'mode.overlay': 'Superposition (plus proche + arcs du squelette)',
  'mode.points': 'Sommet le plus proche (Voronoï de points)',
  'slope.label': 'Pente',
  'iso.label': 'isolignes',
  'cut.label': 'niveau',
  'cut.title': 'ligne de niveau et plan de coupe horizontal, en fraction de la hauteur du faîtage',
  'btn.tour': 'Visite guidée',
  'btn.tour.title': 'afficher / masquer la visite guidée (PageUp / PageDown : étape précédente / suivante)',
  'btn.about': 'À propos',
  'lang.label': 'Langue',
  'note.weightsIgnored': 'poids ignorés dans ce mode',
  'edge.title': 'Arête',
  'edge.hip': 'Croupe',
  'edge.gable': 'Pignon (vitesse=0)',
  'edge.slope': 'pente=',
  'edge.global': 'globale',
  'edge.global.title': 'activé : cette arête suit la pente globale (barre d’outils) ; désactivé : elle a sa propre pente',
  'edge.add': 'Ajouter un point',
  'edge.add.title': 'insérer un point au milieu de cette arête (ou double-clic sur l’arête)',
  'edge.help': 'clique sur une arête pour la sélectionner ; Maj+clic ou la touche G bascule en pignon',
  'vert.title': 'Point',
  'vert.delete': 'Supprimer le point',
  'vert.delete.title': 'ou touche Suppr / clic droit sur le point',
  'hint': 'clique pour ajouter des points ; clique sur le premier point, double-clic ou Entrée pour fermer ; glisse les points ou les arêtes pour modifier ; double-clic sur une arête pour ajouter un point ; sélectionne un point + Suppr (ou clic droit) pour le retirer.',
  'legend.outline': 'mur / contour',
  'legend.gable': 'pignon (vitesse 0)',
  'legend.ridgeAll': 'faîtage / arêtier / noue',
  'legend.hipRidge': 'arêtier / faîtage',
  'legend.valley': 'noue',
  'legend.isolines': 'isolignes (tous les {step} m)',
  'legend.level': 'ligne de niveau',
  'err.minPoints': 'Un polygone nécessite au moins {n} points',
  'err.skelFailed': 'Échec du calcul du squelette : {msg}',
  'err.tooFew': 'Un polygone nécessite au moins 3 points',
  'err.duplicate': 'Points en double (arête de longueur nulle)',
  'err.selfIntersect': 'Polygone auto-sécant',
  'err.zeroArea': 'Polygone dégénéré (aire nulle)',
  'cap.2d': 'Vue de dessus 2D',
  'cap.3d': 'Vue 3D',
  'tour.title': 'Visite guidée',
  'tour.aria': 'Visite guidée',
  'tour.close': 'Fermer la visite (mode libre)',
  'tour.hide': 'Masquer',
  'about.title': 'À propos de Roof Simulator',
  'about.close': 'Fermer',
  'about.aria': 'À propos',
  'about.body': `<p><b>Roof Simulator</b> est une petite démo interactive : dessine un plan, obtiens un toit à pans. C’est un logiciel libre sous <b>licence MIT</b> ; code source et tickets : <a href="https://github.com/xdze2/roof-simulator" target="_blank" rel="noopener">github.com/xdze2/roof-simulator</a>.</p>
  <h3>Réalisation</h3>
  <ul>
    <li>Écrit en <b>TypeScript</b>, assemblé avec <b>Vite</b> ; la seule dépendance à l’exécution est <b>three.js</b>. Pas de serveur : tout tourne dans ton navigateur.</li>
    <li>La géométrie (squelette droit par événements, avec événements de sommet, champs du segment et du point le plus proche, isolignes) est du TypeScript pur, testé avec Vitest.</li>
    <li>Le plan est dessiné sur un <b>canvas 2D</b> ; le toit est rendu en 3D en <b>WebGL</b> via three.js (rotation à la souris, ombres).</li>
    <li>La visite guidée est une liste d’étapes, chacune réglant le dessin, la méthode et la caméra.</li>
  </ul>
  <p>Réalisé avec Claude Code.</p>`,
};

export type Key = keyof typeof en;
export const DICT: Record<Lang, Record<Key, string>> = { en, fr };

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'fr';
function initialLang(): Lang {
  try { const q = new URLSearchParams(location.search).get('lang'); if (isLang(q)) return q; } catch { /* ignore */ }
  try { const s = localStorage.getItem('lang'); if (isLang(s)) return s; } catch { /* ignore */ }
  return 'en';
}
let lang: Lang = initialLang();
const listeners: Array<(l: Lang) => void> = [];

export const getLang = (): Lang => lang;
/** translate a key; {name} placeholders are filled from params */
export function t(key: Key, params?: Record<string, string | number>): string {
  const s = DICT[lang][key] ?? DICT.en[key] ?? key;
  return params ? s.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m)) : s;
}
/** subscribe to language changes (also fired by setLang); returns an unsubscribe function */
export function onLangChange(cb: (l: Lang) => void): () => void {
  listeners.push(cb);
  return () => { const i = listeners.indexOf(cb); if (i >= 0) listeners.splice(i, 1); };
}

/** apply data-i18n* attributes under root (default: the whole document) and set <html lang> */
export function applyI18n(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((e) => { e.textContent = t(e.dataset.i18n as Key); });
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((e) => { e.title = t(e.dataset.i18nTitle as Key); });
  root.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((e) => { e.setAttribute('aria-label', t(e.dataset.i18nAria as Key)); });
  root.querySelectorAll<HTMLElement>('[data-i18n-html]').forEach((e) => { e.innerHTML = t(e.dataset.i18nHtml as Key); });
  document.documentElement.lang = lang;
  document.title = t('site.title');
}

export function setLang(l: Lang): void {
  lang = l;
  try { localStorage.setItem('lang', l); } catch { /* ignore */ }
  try { const u = new URL(location.href); u.searchParams.set('lang', l); history.replaceState(null, '', u); } catch { /* ignore */ }
  applyI18n();
  listeners.slice().forEach((cb) => cb(l));
}

/** apply the initial language to the static HTML (call once on load, after the DOM exists) */
export function initI18n(): void { applyI18n(); }
