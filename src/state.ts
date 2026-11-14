import type { Hit } from './geometry/hit';
import type { Vec2, Polygon, Skeleton } from './geometry/skeleton';

export const WALL_H = 4; // fixed wall height (m)
export const GRID_STEP = 5; // grid cell (m), shared by the 2D and 3D views; lines pass through multiples of it in plan coordinates
export const ISO_STEP = 0.25; // isoline spacing (m of roof height)

/** per-edge override: undefined (global slope) | {gable:true} | {alpha:deg} */
export interface EdgeOverride { gable?: boolean; alpha?: number }

export interface AppState {
  pts: Polygon;                          // polygon vertices [x,y] (plan metres, y up)
  closed: boolean;
  sk: Skeleton | null;
  mouse: Vec2 | null;                    // current mouse (plan coords) for the drawing preview
  drag: number;                          // dragged vertex, -1 if none
  dragEdge: { i: number; start: Vec2; p0: Vec2; p1: Vec2 } | null;  // dragged edge: grab point + original endpoints
  hover: Hit;                            // vertex/edge under the pointer
  invalid: string | null;                // geometry problem (shown in red) or null
  ov: (EdgeOverride | undefined)[];
  sel: number;                           // selected edge
  selVertex: number;                     // selected vertex (-1 none); exclusive with sel
}

export const state: AppState = { pts: [], closed: false, sk: null, mouse: null, drag: -1, dragEdge: null, hover: null, invalid: null, ov: [], sel: -1, selVertex: -1 };
