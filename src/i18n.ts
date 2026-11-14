// Minimal i18n: EN + FR dictionaries, t(key), language persisted in localStorage and in ?lang=.
// Static HTML: data-i18n (textContent), data-i18n-title (title attr), data-i18n-html (innerHTML).
// Dynamic UI: call t() where the text is built, and re-render inside an onLangChange(cb) callback.
export type Lang = 'en' | 'fr';

const en = {
  'site.title': 'Roof Simulator',
  'site.desc': 'Draw a floor plan, get a hipped roof: an interactive straight skeleton demo in the browser.',
  'group.drawing': 'Drawing',
  'group.roof': 'Roof',
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
  'btn.resetAll': 'Reset all',
  'btn.resetAll.title': 'all edges back to the global slope',
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
  'tour.title': 'Guided tour',
  'tour.prev': '← Previous',
  'tour.next': 'Next →',
  'tour.count': 'step {i}/{n}',
  'tour.aria': 'Guided tour',
  'tour.close': 'Close the tour (free mode)',
  'about.title': 'About this demo',
  'about.close': 'Close',
  'about.aria': 'About',
  'about.refs': 'References',
  'about.body': `<p>The <b>straight skeleton</b> of a polygon is traced by its corners while every edge moves inward, parallel to itself, at constant speed. Corners stay sharp (a <i>mitered</i> offset), so at a reflex corner the offset keeps a pointed shape. A <i>rounded</i> offset, as in a Minkowski or buffer offset, would instead swing an arc of circle around it.</p>
  <p>Height = arrival time of the wavefront, times tan(slope). The result is a hip roof with all planes at the same slope; each face is one roof plane, belonging to one footprint edge. Skeleton arcs are hips and ridges (convex) or valleys (reflex).</p>
  <p>The <b>nearest-segment</b> mode shows something different: each point is coloured by its closest boundary element (an open edge, or a reflex vertex in grey), and the height is the true distance to the boundary. Its boundaries are the medial axis (Voronoi diagram of the segments): parabolic arcs next to reflex corners and circular, round cones around reflex vertices, which is the rounded counterpart of the mitered skeleton. It is sampled on a grid here, not computed exactly.</p>`,
};

const fr: Record<keyof typeof en, string> = {
  'site.title': 'Roof Simulator',
  'site.desc': 'Dessine un plan, obtiens un toit à pans : une démo interactive du squelette droit dans le navigateur.',
  'group.drawing': 'Dessin',
  'group.roof': 'Toit',
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
  'btn.resetAll': 'Tout réinitialiser',
  'btn.resetAll.title': 'toutes les arêtes reprennent la pente globale',
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
  'tour.title': 'Visite guidée',
  'tour.prev': '← Précédent',
  'tour.next': 'Suivant →',
  'tour.count': 'étape {i}/{n}',
  'tour.aria': 'Visite guidée',
  'tour.close': 'Fermer la visite (mode libre)',
  'about.title': 'À propos de cette démo',
  'about.close': 'Fermer',
  'about.aria': 'À propos',
  'about.refs': 'Références',
  'about.body': `<p>Le <b>squelette droit</b> d’un polygone est tracé par ses sommets lorsque chaque arête avance vers l’intérieur, parallèlement à elle-même, à vitesse constante. Les angles restent vifs (un décalage <i>en onglet</i>), si bien qu’à un sommet rentrant le décalage garde une pointe. Un décalage <i>arrondi</i>, comme celui d’une somme de Minkowski ou d’un buffer, ferait au contraire un arc de cercle autour de ce sommet.</p>
  <p>Hauteur = temps d’arrivée du front d’onde, multiplié par tan(pente). On obtient un toit à pans dont tous les plans ont la même pente ; chaque face est un pan de toit, rattaché à une arête du plan. Les arcs du squelette sont des arêtiers et des faîtages (convexes) ou des noues (rentrants).</p>
  <p>Le mode <b>segment le plus proche</b> montre autre chose : chaque point est coloré selon l’élément du contour le plus proche (une arête ouverte, ou un sommet rentrant en gris), et la hauteur est la vraie distance au contour. Ses frontières forment l’axe médian (diagramme de Voronoï des segments) : arcs de parabole le long des angles rentrants et cônes circulaires autour des sommets rentrants, contrepartie arrondie du squelette en onglet. Il est échantillonné sur une grille ici, pas calculé exactement.</p>`,
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
