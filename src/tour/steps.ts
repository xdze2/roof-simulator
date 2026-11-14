// Guided tour content: one entry per step. A step is plain data; src/ui/tour.ts applies it.
// The footprint comes from `pts` (an explicit closed polyline, plan metres, y up) or else from
// `preset` (a PRESETS key); with neither (`free`), the current drawing is kept.
// Every view setting a step leaves out goes back to its default, so steps can be opened in any order.
import type { Polygon } from '../geometry/skeleton';
import type { CameraPreset, Highlight, EdgeOverride } from '../state';
import { PRESETS, GABLES } from '../geometry/presets';

export type Mode = 'skel' | 'nearest' | 'overlay' | 'points';

export interface Step {
  id: string;                        // used in ?step=<id>
  title: string;
  html: string;                      // explanation (French), trusted HTML
  preset?: string;                   // PRESETS key
  pts?: Polygon;                     // explicit footprint, takes precedence over preset
  gables?: number[];                 // gable edge indices (edge i = vertex i -> i+1); default: the preset's GABLES
  slopes?: Record<number, number>;   // per-edge slope in degrees, overriding the global slope
  mode?: Mode;                       // default 'skel'
  slope?: number;                    // global slope in degrees, default 40
  iso?: boolean;                     // isolines, default off
  walls?: boolean;                   // default on
  camera?: CameraPreset;             // default: the automatic fit
  cut?: number;                      // level line at this fraction (0..1) of the ridge height; absent = off
  cutAnim?: boolean;                 // the level line rises from 0 to `cut`
  highlight?: Highlight;             // edges / vertices emphasised in the 2D plan
  free?: boolean;                    // keep the current drawing (free mode)
}

export const STEPS: Step[] = [
  {
    id: 'simple', title: 'Un toit simple', preset: 'rectangle',
    camera: { az: 35, el: 32, dist: 81, ty: 5 },
    html: `<p>Voici un toit à quatre pans sur un rectangle. Les quatre pans ont la <b>même pente</b>.</p>
<p>Avec une même pente partout, les <b>arêtiers</b> (les arêtes qui partent des coins) sont les <b>bissectrices</b> des angles du contour : à 45° en plan pour un coin droit.</p>
<p>Le <b>faîtage</b> relie les points où ces bissectrices se rencontrent. C'est le « squelette droit » du polygone.</p>`,
  },
  {
    id: 'hauteur', title: 'Hauteur = distance au mur', preset: 'rectangle',
    cut: 0.55, cutAnim: true,
    camera: { az: 30, el: 38, dist: 78, ty: 4 },
    html: `<p>Même pente, même hauteur à même distance du mur. La ligne rouge est la <b>courbe de niveau</b> à la hauteur de coupe (plan bleu translucide en 3D).</p>
<p>En plan, c'est le contour <b>décalé vers l'intérieur</b> : « l'eau qui monte », ou un front qui avance à vitesse constante depuis les murs.</p>
<p>Fais glisser le curseur <b>level</b> du bandeau : le front avance, et quand deux côtés se rejoignent, il laisse derrière lui le squelette. La case <b>isolines</b> affiche toutes les courbes de niveau d'un coup.</p>`,
  },
  {
    id: 'noue', title: 'Maison en L : la noue', preset: 'L',
    highlight: { vertices: [3] },
    camera: { az: 40, el: 40, dist: 96, ty: 4 },
    html: `<p>Ajoutons un coin <b>rentrant</b> (cerclé en rouge en plan) : on obtient une maison en L.</p>
<p>Les arcs <span style="color:#c4501b"><b>orange</b></span> sont les arêtiers et le faîtage (coins saillants, le toit « descend » de chaque côté). Les arcs <span style="color:#1b6fc4"><b>bleus</b></span> sont les <b>noues</b>, là où deux pans se rejoignent en creux et où l'eau s'écoule.</p>
<p>La noue part du coin rentrant, toujours sur la bissectrice, et va rejoindre le faîtage.</p>`,
  },
  {
    id: 'angles', title: 'Angles quelconques',
    pts: [[6, 8], [34, 8], [34, 20], [22, 31], [6, 24]],
    highlight: { vertices: [2, 3] },
    camera: { az: 25, el: 36, dist: 90, ty: 5 },
    html: `<p>Les murs ne sont pas forcément à angle droit. Les arêtiers restent les <b>bissectrices</b> des coins, mais ne sont plus à 45° en plan.</p>
<p>Le front décalé perd ses côtés courts en premier : chaque fois qu'un côté disparaît, deux arêtiers se rejoignent et un nouveau part. Le faîtage se brise, et certains pans deviennent des <b>triangles</b>.</p>
<p>Fais glisser un sommet ou un côté pour voir le squelette se réorganiser.</p>`,
  },
  {
    id: 'pignons', title: 'Pignons', preset: 'gableHouse',
    camera: { az: 60, el: 22, dist: 78, ty: 6 },
    html: `<p>Un côté peut être déclaré <b>pignon</b> : son pan est vertical (pente de 90°), le mur monte jusqu'au faîtage.</p>
<p>Ici les deux petits côtés sont des pignons (traits noirs épais). Le toit n'a plus que deux pans, à deux versants, avec un faîtage parallèle aux longs côtés.</p>
<p>Clique un côté puis choisis <b>Gable</b> dans la boîte qui s'ouvre (ou maj-clic, ou touche G) pour le basculer en pignon ou en pan.</p>`,
  },
  {
    id: 'pignons-l', title: 'Pignons sur une maison en L', preset: 'lGables',
    camera: { az: 35, el: 35, dist: 96, ty: 5 },
    html: `<p>Même idée sur la maison en L : deux côtés sont des pignons, et le reste du contour garde sa pente.</p>
<p>Le faîtage s'aligne sur les pignons, et la noue du coin rentrant se raccorde aux pans voisins. Observe comment le squelette se réorganise par rapport à l'étape « la noue ».</p>`,
  },
  {
    id: 'pentes', title: 'Pentes différentes', preset: 'rectangle',
    slopes: { 0: 22, 2: 58 }, highlight: { edges: [0, 2] },
    camera: { az: 20, el: 25, dist: 81, ty: 5 },
    html: `<p>Donnons au long côté du bas une pente faible (22°) et à celui du haut une pente forte (58°). Les petits côtés restent à 40°.</p>
<p>Le pan raide monte plus vite : le faîtage se décale vers le mur le plus raide, et les arêtiers <b>ne sont plus des bissectrices</b>.</p>
<p>Le principe reste le même (chaque pan est un plan, la hauteur est une distance pondérée), seul le poids de chaque côté change. Clique un côté, décoche <b>global</b> et règle sa pente.</p>`,
  },
  {
    id: 'points', title: 'Voronoï de points', preset: 'L', mode: 'points',
    camera: { az: 35, el: 42, dist: 102, ty: 3 },
    html: `<p>Changeons de point de vue : au lieu des murs, on ne regarde que les <b>sommets</b> du polygone.</p>
<p>Chaque point du plan prend la couleur de son sommet le plus proche : chaque sommet possède sa zone, c'est le <b>diagramme de Voronoï</b> des points, limité au contour.</p>
<p>Si la hauteur est la distance au sommet le plus proche, on obtient des <b>cônes renversés</b>, pointe en bas sur chaque sommet, qui se recoupent au-dessus des frontières. Ce n'est pas un toit : les murs, eux, ont disparu du calcul.</p>`,
  },
  {
    id: 'segments', title: 'Voronoï de segments (axe médian)', preset: 'U', mode: 'nearest',
    camera: { az: 30, el: 42, dist: 102, ty: 3 },
    html: `<p>Maintenant les sites sont les <b>murs</b> (des segments). Chaque point prend la couleur du mur le plus proche, et la hauteur est la vraie distance au mur.</p>
<p>Les frontières entre zones forment l'<b>axe médian</b>. Près d'un coin rentrant, la distance se mesure au sommet : on obtient des cônes arrondis (en gris hachuré), et les frontières deviennent des <b>paraboles</b>.</p>
<p>La surface obtenue est lisse et arrondie, ce n'est pas un toit à pans plans.</p>`,
  },
  {
    id: 'onglet', title: 'Pans plans : le squelette droit', preset: 'U', mode: 'overlay',
    camera: { az: 30, el: 42, dist: 102, ty: 3 },
    html: `<p>Pour avoir des <b>pans plans</b>, on mesure la distance non pas au segment mais à la <b>droite qui porte le mur</b>, restreinte à son pan. Chaque pan est alors un plan.</p>
<p>Au coin rentrant, il n'y a plus de cône ni de parabole : les pans se rejoignent en ligne droite, « en onglet ». C'est le <b>squelette droit</b>, la version à angles vifs de l'axe médian.</p>
<p>La vue superpose les deux : les couleurs sont l'axe médian, les traits noirs le squelette droit. Ils coïncident loin des coins rentrants et divergent à leur voisinage.</p>`,
  },
  {
    id: 'libre', title: 'Mode libre : dessine ton toit', free: true,
    html: `<p>À toi de jouer. Les commandes du bandeau restent actives : presets, pente, mode d'affichage, isolines, level.</p>
<p>Clique <b>Clear</b>, puis clique dans le plan pour poser des points ; clique le premier point (ou Entrée) pour fermer. Fais glisser les sommets ou les côtés pour modifier la forme ; double-clique un côté pour ajouter un point, clic droit sur un point pour le supprimer.</p>
<p>Clique un côté pour changer sa pente ou en faire un pignon.</p>`,
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
