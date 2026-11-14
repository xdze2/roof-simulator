// Guided tour content: one entry per step. A step is plain data; src/ui/tour.ts applies it.
// The footprint comes from `pts` (an explicit closed polyline, plan metres, y up) or else from
// `preset` (a PRESETS key); with neither (`free`), the current drawing is kept.
// Every view setting a step leaves out goes back to its default, so steps can be opened in any order.
import type { Polygon } from '../geometry/skeleton';
import type { CameraPreset, Highlight, EdgeOverride } from '../state';
import { PRESETS, GABLES } from '../geometry/presets';
import type { Lang } from '../i18n';

export type L10n = Record<Lang, string>;
export type StepControl = 'cut';   // a control rendered inside the open step, bound to the toolbar one

export type Mode = 'skel' | 'nearest' | 'overlay' | 'points';

export interface Step {
  id: string;                        // used in ?step=<id>
  title: L10n;
  html: L10n;                        // explanation, trusted HTML
  controls?: StepControl[];          // controls shown under the explanation
  preset?: string;                   // PRESETS key
  pts?: Polygon;                     // explicit footprint, takes precedence over preset
  gables?: number[];                 // gable edge indices (edge i = vertex i -> i+1); default: the preset's GABLES
  slopes?: Record<number, number>;   // per-edge slope in degrees, overriding the global slope
  mode?: Mode;                       // default 'skel'
  slope?: number;                    // global slope in degrees, default 40
  iso?: boolean;                     // isolines, default off
  camera?: CameraPreset;             // default: the automatic fit
  cut?: number;                      // level line at this fraction (0..1) of the ridge height; absent = off
  cutAnim?: boolean;                 // the level line rises from 0 to `cut`
  highlight?: Highlight;             // edges / vertices emphasised in the 2D plan
  free?: boolean;                    // keep the current drawing (free mode)
  noRoof?: boolean;                  // walls only, the roof is not drawn yet
}

export const STEPS: Step[] = [
  {
    id: 'question', preset: 'rectangle', noRoof: true,
    camera: { az: 35, el: 32, dist: 81, ty: 5 },
    title: { en: 'Where does the ridge go?', fr: 'Où passe le faîtage ?' },
    html: {
      en: `<p>The carpenter gets the plan of the walls and one rule of the trade: every wall has the same height, and every face of the roof has the <b>same slope</b>.</p>
<p>From that alone, where do the ridge and the hips go? Try to picture it, then open the next step.</p>`,
      fr: `<p>Le charpentier reçoit le plan des murs et une règle du métier : tous les murs ont la même hauteur, et tous les pans du toit ont la <b>même pente</b>.</p>
<p>Avec ça seulement, où passent le faîtage et les arêtiers ? Essaie de l'imaginer, puis ouvre l'étape suivante.</p>`,
    },
  },
  {
    id: 'simple', preset: 'rectangle',
    camera: { az: 35, el: 32, dist: 81, ty: 5 },
    title: { en: 'A hipped roof', fr: 'Un toit à quatre pans' },
    html: {
      en: `<p>On a rectangle, the answer is a hipped roof. The <b>hips</b> leave each corner at 45° in plan: they are the <b>angle bisectors</b> of the outline.</p>
<p>The <b>ridge</b> joins the points where they meet.</p>`,
      fr: `<p>Sur un rectangle, on obtient un toit à quatre pans. Les <b>arêtiers</b> partent de chaque coin à 45° en plan : ce sont les <b>bissectrices</b> des angles du contour.</p>
<p>Le <b>faîtage</b> relie les points où elles se rencontrent.</p>`,
    },
  },
  {
    id: 'hauteur', preset: 'rectangle',
    cut: 0.55, cutAnim: true, controls: ['cut'],
    camera: { az: 30, el: 38, dist: 78, ty: 4 },
    title: { en: 'Height = distance to the wall', fr: 'Hauteur = distance au mur' },
    html: {
      en: `<p>A <b>purlin</b> (a horizontal timber) sits at the same height all along, so it runs parallel to the walls, set back by the same distance. With one slope everywhere, height is simply proportional to the distance to the wall.</p>
<p>The red line is such a level line: the outline <b>offset inwards</b>. Two faces meet where they have the same height, so at the same distance from two walls: on the bisector. Drag the <b>level</b> slider below to move the front.</p>`,
      fr: `<p>Une <b>panne</b> est à la même hauteur sur toute sa longueur : elle court parallèle aux murs, en retrait d'une même distance. Avec une seule pente, la hauteur est simplement proportionnelle à la distance au mur.</p>
<p>La ligne rouge est une telle ligne de niveau : le contour <b>décalé vers l'intérieur</b>. Deux pans se rejoignent là où ils ont la même hauteur, donc à même distance de deux murs : sur la bissectrice. Fais glisser le curseur <b>niveau</b> ci-dessous pour faire avancer le front.</p>`,
    },
  },
  {
    id: 'noue', preset: 'L',
    highlight: { vertices: [3] },
    camera: { az: 40, el: 40, dist: 96, ty: 4 },
    title: { en: 'L-shaped house: the valley', fr: 'Maison en L : la noue' },
    html: {
      en: `<p>An L-shaped house has an inward corner (circled in red). There the two faces meet in a trough, the <b>valley</b>, where the rain collects.</p>
<p>It is still a bisector, but of a <b>reflex</b> corner, so it points into the house. <span style="color:#c4501b"><b>Orange</b></span>: hips and ridge. <span style="color:#1b6fc4"><b>Blue</b></span>: valleys.</p>`,
      fr: `<p>Une maison en L a un coin rentrant (cerclé en rouge). Là, les deux pans se rejoignent en creux : c'est la <b>noue</b>, où l'eau de pluie se rassemble.</p>
<p>C'est encore une bissectrice, mais d'un coin <b>rentrant</b> : elle part vers l'intérieur de la maison. En <span style="color:#c4501b"><b>orange</b></span> : arêtiers et faîtage. En <span style="color:#1b6fc4"><b>bleu</b></span> : les noues.</p>`,
    },
  },
  {
    id: 'segments', preset: 'U', mode: 'nearest',
    camera: { az: 30, el: 42, dist: 102, ty: 3 },
    title: { en: 'A false trail: distance to the wall', fr: 'Fausse piste : la distance au mur' },
    html: {
      en: `<p>Let us take "height = distance to the wall" literally, with the true distance to each wall segment. Near an inward corner, the nearest point of the wall is the <b>corner post itself</b>: the roof bulges into a cone (hatched grey). You cannot build that with straight timbers.</p>
<p>The coloured zones are the <b>Voronoi diagram of the segments</b> (the medial axis). Around reflex corners its boundaries become <b>parabolas</b>.</p>`,
      fr: `<p>Prenons « hauteur = distance au mur » au pied de la lettre, avec la vraie distance à chaque segment de mur. Près d'un coin rentrant, le point du mur le plus proche, c'est le <b>poteau d'angle lui-même</b> : le toit se bombe en cône (gris hachuré). Impossible à construire avec des bois droits.</p>
<p>Les zones colorées forment le <b>diagramme de Voronoï des segments</b> (l'axe médian). Autour des coins rentrants, ses frontières deviennent des <b>paraboles</b>.</p>`,
    },
  },
  {
    id: 'points', preset: 'L', mode: 'points',
    camera: { az: 35, el: 42, dist: 102, ty: 3 },
    title: { en: 'Aside: only the corners', fr: 'Parenthèse : les coins seulement' },
    html: {
      en: `<p>A thought experiment: what if only the corners counted? Each point takes the colour of its nearest corner, the classic <b>Voronoi diagram</b> of points. The height gives upside-down cones, and the walls have vanished from the computation. Not a roof, but the simplest case of "nearest site".</p>`,
      fr: `<p>Une expérience de pensée : et si seuls les coins comptaient ? Chaque point prend la couleur du coin le plus proche, c'est le <b>diagramme de Voronoï</b> classique des points. La hauteur donne des cônes renversés, et les murs ont disparu du calcul. Pas un toit, mais le cas le plus simple de « site le plus proche ».</p>`,
    },
  },
  {
    id: 'onglet', preset: 'U', mode: 'overlay',
    camera: { az: 30, el: 42, dist: 102, ty: 3 },
    title: { en: 'Flat faces: the straight skeleton', fr: 'Pans plans : le squelette droit' },
    html: {
      en: `<p>The carpenter's way: each face belongs to <b>its</b> wall and keeps its slope all the way up. At the inward corner, two faces meet in a straight cut, like a <b>mitre joint</b>.</p>
<p>In other words, measure the distance to the <b>line carrying the wall</b>, restricted to its face: every face is a plane. This is the <b>straight skeleton</b> (black lines), drawn over the medial axis (colours). They agree away from reflex corners and part ways near them.</p>`,
      fr: `<p>La façon du charpentier : chaque pan appartient à <b>son</b> mur et garde sa pente jusqu'en haut. Au coin rentrant, deux pans se rejoignent en ligne droite, <b>en onglet</b>.</p>
<p>Autrement dit, on mesure la distance à la <b>droite qui porte le mur</b>, restreinte à son pan : chaque pan est un plan. C'est le <b>squelette droit</b> (traits noirs), superposé à l'axe médian (couleurs). Ils coïncident loin des coins rentrants et divergent à leur voisinage.</p>`,
    },
  },
  {
    id: 'complexe', preset: 'irregular',
    iso: true, cut: 0.5, cutAnim: true, controls: ['cut'],
    camera: { az: 35, el: 40, dist: 100, ty: 4 },
    title: { en: 'A complex case', fr: 'Un cas complexe' },
    html: {
      en: `<p>On a real house, tracing this by hand takes hours. The computer does what the level line showed: push every wall inwards at the same speed and watch the front.</p>
<p>Only two things can happen. A short side <b>shrinks to nothing</b>: two hips merge and a new one starts. Or a reflex corner <b>hits the opposite side</b>: the front splits in two. Drag the <b>level</b> slider to see both, or drag a vertex to reshape the house.</p>`,
      fr: `<p>Sur une vraie maison, tracer l'épure à la main prend des heures. L'ordinateur fait ce que montrait la ligne de niveau : pousser tous les murs vers l'intérieur à la même vitesse et regarder le front.</p>
<p>Il ne peut se passer que deux choses. Un côté court <b>se réduit à rien</b> : deux arêtiers se rejoignent et un nouveau part. Ou un coin rentrant <b>touche le côté d'en face</b> : le front se coupe en deux. Fais glisser le curseur <b>niveau</b> pour voir les deux, ou déplace un sommet pour changer la maison.</p>`,
    },
  },
  {
    id: 'pentes', preset: 'rectangle',
    slopes: { 0: 22, 2: 58 }, highlight: { edges: [0, 2] },
    camera: { az: 20, el: 25, dist: 81, ty: 5 },
    title: { en: 'Different slopes', fr: 'Pentes différentes' },
    html: {
      en: `<p>A steeper face on the weather side, a gentler one over a porch: here the bottom face is at 22°, the top one at 58°. The steep face climbs faster, so the ridge moves towards it and the hips are <b>no longer bisectors</b>.</p>
<p>Each wall's front now moves at its own speed: a <b>weighted</b> straight skeleton. Click an edge, untick <b>global</b> and set its slope.</p>`,
      fr: `<p>Un pan plus raide côté intempéries, un plus doux au-dessus d'un auvent : ici le pan du bas est à 22°, celui du haut à 58°. Le pan raide monte plus vite, le faîtage se décale vers lui et les arêtiers <b>ne sont plus des bissectrices</b>.</p>
<p>Chaque mur fait avancer son front à sa propre vitesse : c'est un squelette droit <b>pondéré</b>. Clique un côté, décoche <b>globale</b> et règle sa pente.</p>`,
    },
  },
  {
    id: 'pignons', preset: 'lGables',
    camera: { az: 35, el: 35, dist: 96, ty: 5 },
    title: { en: 'Gables', fr: 'Pignons' },
    html: {
      en: `<p>A <b>gable</b> wall rises vertically up to the ridge (thick black lines). It is the limit case of the previous step: a 90° slope, so that wall's front does not move at all, and the ridge runs straight to it.</p>
<p>Click an edge, then choose <b>Gable</b> (or shift-click, or press G) to switch it.</p>`,
      fr: `<p>Un mur <b>pignon</b> monte à la verticale jusqu'au faîtage (traits noirs épais). C'est le cas limite de l'étape précédente : une pente de 90°, donc le front de ce mur n'avance pas du tout, et le faîtage vient droit sur lui.</p>
<p>Clique un côté puis choisis <b>Pignon</b> (ou maj-clic, ou touche G) pour le basculer.</p>`,
    },
  },
  {
    id: 'libre', free: true,
    title: { en: 'Free mode: draw your own roof', fr: 'Mode libre : dessine ton toit' },
    html: {
      en: `<p>Over to you. Click <b>Clear</b>, then click in the plan to place points; click the first point (or press Enter) to close. Drag vertices or edges to reshape; double-click an edge to add a point, right-click a point to delete it. Click an edge to change its slope or make it a gable.</p>
<p>Not handled yet: walls of different heights, flat-topped roofs, inner courtyards.</p>
<p>Further reading: Aichholzer et al. (1995), <i>A novel type of skeleton for polygons</i>; Eppstein &amp; Erickson (1999), <i>Raising roofs, crashing cycles, and playing pool</i>; Felkel &amp; Obdržálek (1998), <i>Straight skeleton implementation</i>; Biedl et al. (2015), <i>Weighted straight skeletons in the plane</i>; CGAL, <i>2D Straight Skeleton and Polygon Offsetting</i>.</p>`,
      fr: `<p>À toi de jouer. Clique <b>Effacer</b>, puis clique dans le plan pour poser des points ; clique le premier point (ou Entrée) pour fermer. Fais glisser les sommets ou les côtés ; double-clique un côté pour ajouter un point, clic droit sur un point pour le supprimer. Clique un côté pour changer sa pente ou en faire un pignon.</p>
<p>Pas encore géré : murs de hauteurs différentes, toits terrasses, cours intérieures.</p>
<p>Pour aller plus loin : Aichholzer et al. (1995), <i>A novel type of skeleton for polygons</i> ; Eppstein &amp; Erickson (1999), <i>Raising roofs, crashing cycles, and playing pool</i> ; Felkel &amp; Obdržálek (1998), <i>Straight skeleton implementation</i> ; Biedl et al. (2015), <i>Weighted straight skeletons in the plane</i> ; CGAL, <i>2D Straight Skeleton and Polygon Offsetting</i>.</p>`,
    },
  },
];

/** footprint and per-edge overrides of a step, or null for a free step (keep the current drawing) */
export function stepShape(s: Step): { pts: Polygon; ov: EdgeOverride[] } | null {
  const pts = s.pts ?? (s.preset ? PRESETS[s.preset] : undefined);
  if (!pts) return null;
  const ov: EdgeOverride[] = [];
  for (const i of s.gables ?? (s.pts ? [] : GABLES[s.preset!] ?? [])) ov[i] = { gable: true };
  for (const [i, a] of Object.entries(s.slopes ?? {})) ov[+i] = { alpha: a };
  return { pts, ov };
}
