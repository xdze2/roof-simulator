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
}

export const STEPS: Step[] = [
  {
    id: 'simple', preset: 'rectangle',
    camera: { az: 35, el: 32, dist: 81, ty: 5 },
    title: { en: 'A simple roof', fr: 'Un toit simple' },
    html: {
      en: `<p>Here is a hipped roof on a rectangle. All four faces have the <b>same slope</b>.</p>
<p>With the same slope everywhere, the <b>hips</b> (the edges running from the corners) are the <b>angle bisectors</b> of the outline: 45° in plan for a right-angled corner.</p>
<p>The <b>ridge</b> joins the points where these bisectors meet. It is the polygon's "straight skeleton".</p>`,
      fr: `<p>Voici un toit à quatre pans sur un rectangle. Les quatre pans ont la <b>même pente</b>.</p>
<p>Avec une même pente partout, les <b>arêtiers</b> (les arêtes qui partent des coins) sont les <b>bissectrices</b> des angles du contour : à 45° en plan pour un coin droit.</p>
<p>Le <b>faîtage</b> relie les points où ces bissectrices se rencontrent. C'est le « squelette droit » du polygone.</p>`,
    },
  },
  {
    id: 'hauteur', preset: 'rectangle',
    cut: 0.55, cutAnim: true, controls: ['cut'],
    camera: { az: 30, el: 38, dist: 78, ty: 4 },
    title: { en: 'Height = distance to the wall', fr: 'Hauteur = distance au mur' },
    html: {
      en: `<p>Same slope, same height at the same distance from the wall. The red line is the <b>contour line</b> at the cut height (translucent blue plane in 3D).</p>
<p>In plan, it is the outline <b>offset inwards</b>: "rising water", or a front advancing at constant speed from the walls.</p>
<p>Drag the <b>level</b> slider just below: the front advances, and when two sides meet it leaves the skeleton behind it. The <b>isolines</b> checkbox in the toolbar shows all the contour lines at once.</p>`,
      fr: `<p>Même pente, même hauteur à même distance du mur. La ligne rouge est la <b>courbe de niveau</b> à la hauteur de coupe (plan bleu translucide en 3D).</p>
<p>En plan, c'est le contour <b>décalé vers l'intérieur</b> : « l'eau qui monte », ou un front qui avance à vitesse constante depuis les murs.</p>
<p>Fais glisser le curseur <b>niveau</b> juste en dessous : le front avance, et quand deux côtés se rejoignent, il laisse derrière lui le squelette. La case <b>isolignes</b> de la barre d'outils affiche toutes les courbes de niveau d'un coup.</p>`,
    },
  },
  {
    id: 'noue', preset: 'L',
    highlight: { vertices: [3] },
    camera: { az: 40, el: 40, dist: 96, ty: 4 },
    title: { en: 'L-shaped house: the valley', fr: 'Maison en L : la noue' },
    html: {
      en: `<p>Let us add a <b>reflex</b> corner (circled in red in the plan): we get an L-shaped house.</p>
<p>The <span style="color:#c4501b"><b>orange</b></span> arcs are the hips and the ridge (convex corners, the roof slopes down on both sides). The <span style="color:#1b6fc4"><b>blue</b></span> arcs are the <b>valleys</b>, where two faces meet in a trough and the water runs off.</p>
<p>The valley starts at the reflex corner, always along the bisector, and runs to the ridge.</p>`,
      fr: `<p>Ajoutons un coin <b>rentrant</b> (cerclé en rouge en plan) : on obtient une maison en L.</p>
<p>Les arcs <span style="color:#c4501b"><b>orange</b></span> sont les arêtiers et le faîtage (coins saillants, le toit « descend » de chaque côté). Les arcs <span style="color:#1b6fc4"><b>bleus</b></span> sont les <b>noues</b>, là où deux pans se rejoignent en creux et où l'eau s'écoule.</p>
<p>La noue part du coin rentrant, toujours sur la bissectrice, et va rejoindre le faîtage.</p>`,
    },
  },
  {
    id: 'angles',
    pts: [[6, 8], [34, 8], [34, 20], [22, 31], [6, 24]],
    highlight: { vertices: [2, 3] },
    camera: { az: 25, el: 36, dist: 90, ty: 5 },
    title: { en: 'Arbitrary angles', fr: 'Angles quelconques' },
    html: {
      en: `<p>Walls need not meet at right angles. The hips are still the <b>bisectors</b> of the corners, but they are no longer at 45° in plan.</p>
<p>The offset front loses its short sides first: each time a side vanishes, two hips meet and a new one starts. The ridge breaks, and some faces become <b>triangles</b>.</p>
<p>Drag a vertex or an edge to watch the skeleton reorganise.</p>`,
      fr: `<p>Les murs ne sont pas forcément à angle droit. Les arêtiers restent les <b>bissectrices</b> des coins, mais ne sont plus à 45° en plan.</p>
<p>Le front décalé perd ses côtés courts en premier : chaque fois qu'un côté disparaît, deux arêtiers se rejoignent et un nouveau part. Le faîtage se brise, et certains pans deviennent des <b>triangles</b>.</p>
<p>Fais glisser un sommet ou un côté pour voir le squelette se réorganiser.</p>`,
    },
  },
  {
    id: 'pignons', preset: 'gableHouse',
    camera: { az: 60, el: 22, dist: 78, ty: 6 },
    title: { en: 'Gables', fr: 'Pignons' },
    html: {
      en: `<p>An edge can be declared a <b>gable</b>: its face is vertical (90° slope) and the wall rises up to the ridge.</p>
<p>Here the two short sides are gables (thick black lines). The roof has only two faces, a gable roof, with a ridge parallel to the long sides.</p>
<p>Click an edge, then choose <b>Gable</b> in the box that opens (or shift-click, or press G) to switch it between gable and sloped face.</p>`,
      fr: `<p>Un côté peut être déclaré <b>pignon</b> : son pan est vertical (pente de 90°), le mur monte jusqu'au faîtage.</p>
<p>Ici les deux petits côtés sont des pignons (traits noirs épais). Le toit n'a plus que deux pans, à deux versants, avec un faîtage parallèle aux longs côtés.</p>
<p>Clique un côté puis choisis <b>Pignon</b> dans la boîte qui s'ouvre (ou maj-clic, ou touche G) pour le basculer en pignon ou en pan.</p>`,
    },
  },
  {
    id: 'pignons-l', preset: 'lGables',
    camera: { az: 35, el: 35, dist: 96, ty: 5 },
    title: { en: 'Gables on an L-shaped house', fr: 'Pignons sur une maison en L' },
    html: {
      en: `<p>Same idea on the L-shaped house: two edges are gables, and the rest of the outline keeps its slope.</p>
<p>The ridge lines up with the gables, and the valley from the reflex corner joins the neighbouring faces. Notice how the skeleton reorganises compared with the "valley" step.</p>`,
      fr: `<p>Même idée sur la maison en L : deux côtés sont des pignons, et le reste du contour garde sa pente.</p>
<p>Le faîtage s'aligne sur les pignons, et la noue du coin rentrant se raccorde aux pans voisins. Observe comment le squelette se réorganise par rapport à l'étape « la noue ».</p>`,
    },
  },
  {
    id: 'pentes', preset: 'rectangle',
    slopes: { 0: 22, 2: 58 }, highlight: { edges: [0, 2] },
    camera: { az: 20, el: 25, dist: 81, ty: 5 },
    title: { en: 'Different slopes', fr: 'Pentes différentes' },
    html: {
      en: `<p>Let us give the long bottom edge a low slope (22°) and the top one a steep slope (58°). The short sides stay at 40°.</p>
<p>The steep face climbs faster: the ridge moves towards the steepest wall, and the hips are <b>no longer bisectors</b>.</p>
<p>The principle is the same (each face is a plane, the height is a weighted distance); only the weight of each edge changes. Click an edge, untick <b>global</b> and set its slope.</p>`,
      fr: `<p>Donnons au long côté du bas une pente faible (22°) et à celui du haut une pente forte (58°). Les petits côtés restent à 40°.</p>
<p>Le pan raide monte plus vite : le faîtage se décale vers le mur le plus raide, et les arêtiers <b>ne sont plus des bissectrices</b>.</p>
<p>Le principe reste le même (chaque pan est un plan, la hauteur est une distance pondérée), seul le poids de chaque côté change. Clique un côté, décoche <b>globale</b> et règle sa pente.</p>`,
    },
  },
  {
    id: 'points', preset: 'L', mode: 'points',
    camera: { az: 35, el: 42, dist: 102, ty: 3 },
    title: { en: 'Voronoi diagram of points', fr: 'Voronoï de points' },
    html: {
      en: `<p>Let us change viewpoint: instead of the walls, we only look at the polygon's <b>vertices</b>.</p>
<p>Each point of the plane takes the colour of its nearest vertex: every vertex owns a zone, the <b>Voronoi diagram</b> of the points, clipped to the outline.</p>
<p>If the height is the distance to the nearest vertex, we get <b>inverted cones</b>, tip down on each vertex, intersecting above the boundaries. This is not a roof: the walls have vanished from the computation.</p>`,
      fr: `<p>Changeons de point de vue : au lieu des murs, on ne regarde que les <b>sommets</b> du polygone.</p>
<p>Chaque point du plan prend la couleur de son sommet le plus proche : chaque sommet possède sa zone, c'est le <b>diagramme de Voronoï</b> des points, limité au contour.</p>
<p>Si la hauteur est la distance au sommet le plus proche, on obtient des <b>cônes renversés</b>, pointe en bas sur chaque sommet, qui se recoupent au-dessus des frontières. Ce n'est pas un toit : les murs, eux, ont disparu du calcul.</p>`,
    },
  },
  {
    id: 'segments', preset: 'U', mode: 'nearest',
    camera: { az: 30, el: 42, dist: 102, ty: 3 },
    title: { en: 'Voronoi diagram of segments (medial axis)', fr: 'Voronoï de segments (axe médian)' },
    html: {
      en: `<p>Now the sites are the <b>walls</b> (segments). Each point takes the colour of the nearest wall, and the height is the true distance to the wall.</p>
<p>The boundaries between zones form the <b>medial axis</b>. Near a reflex corner the distance is measured to the vertex: we get rounded cones (hatched grey), and the boundaries become <b>parabolas</b>.</p>
<p>The resulting surface is smooth and rounded, not a roof with flat faces.</p>`,
      fr: `<p>Maintenant les sites sont les <b>murs</b> (des segments). Chaque point prend la couleur du mur le plus proche, et la hauteur est la vraie distance au mur.</p>
<p>Les frontières entre zones forment l'<b>axe médian</b>. Près d'un coin rentrant, la distance se mesure au sommet : on obtient des cônes arrondis (en gris hachuré), et les frontières deviennent des <b>paraboles</b>.</p>
<p>La surface obtenue est lisse et arrondie, ce n'est pas un toit à pans plans.</p>`,
    },
  },
  {
    id: 'onglet', preset: 'U', mode: 'overlay',
    camera: { az: 30, el: 42, dist: 102, ty: 3 },
    title: { en: 'Flat faces: the straight skeleton', fr: 'Pans plans : le squelette droit' },
    html: {
      en: `<p>To get <b>flat faces</b>, we measure the distance not to the segment but to the <b>line carrying the wall</b>, restricted to its face. Each face is then a plane.</p>
<p>At the reflex corner there is no more cone or parabola: the faces meet along a straight line, a mitre. This is the <b>straight skeleton</b>, the sharp-cornered version of the medial axis.</p>
<p>The view overlays both: the colours are the medial axis, the black lines the straight skeleton. They coincide away from reflex corners and diverge near them.</p>`,
      fr: `<p>Pour avoir des <b>pans plans</b>, on mesure la distance non pas au segment mais à la <b>droite qui porte le mur</b>, restreinte à son pan. Chaque pan est alors un plan.</p>
<p>Au coin rentrant, il n'y a plus de cône ni de parabole : les pans se rejoignent en ligne droite, « en onglet ». C'est le <b>squelette droit</b>, la version à angles vifs de l'axe médian.</p>
<p>La vue superpose les deux : les couleurs sont l'axe médian, les traits noirs le squelette droit. Ils coïncident loin des coins rentrants et divergent à leur voisinage.</p>`,
    },
  },
  {
    id: 'libre', free: true,
    title: { en: 'Free mode: draw your own roof', fr: 'Mode libre : dessine ton toit' },
    html: {
      en: `<p>Over to you. The toolbar controls stay active: presets, slope, method, isolines, level.</p>
<p>Click <b>Clear</b>, then click in the plan to place points; click the first point (or press Enter) to close. Drag vertices or edges to reshape; double-click an edge to add a point, right-click a point to delete it.</p>
<p>Click an edge to change its slope or make it a gable.</p>`,
      fr: `<p>À toi de jouer. Les commandes du bandeau restent actives : modèles, pente, méthode, isolignes, niveau.</p>
<p>Clique <b>Effacer</b>, puis clique dans le plan pour poser des points ; clique le premier point (ou Entrée) pour fermer. Fais glisser les sommets ou les côtés pour modifier la forme ; double-clique un côté pour ajouter un point, clic droit sur un point pour le supprimer.</p>
<p>Clique un côté pour changer sa pente ou en faire un pignon.</p>`,
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
