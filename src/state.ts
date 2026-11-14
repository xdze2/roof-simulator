import type { Vec2, Polygon, Skeleton } from './geometry/skeleton';

export const WALL_H = 4; // fixed wall height (m)

/** per-edge override: undefined (global slope) | {gable:true} | {alpha:deg} */
export interface EdgeOverride { gable?: boolean; alpha?: number }

export interface AppState {
  pts: Polygon;                          // polygon vertices [x,y] (plan metres, y up)
  closed: boolean;
  sk: Skeleton | null;
  mouse: Vec2 | null;                    // current mouse (plan coords) for the drawing preview
  drag: number;
  ov: (EdgeOverride | undefined)[];
  sel: number;                           // selected edge
}

export const state: AppState = { pts: [], closed: false, sk: null, mouse: null, drag: -1, ov: [], sel: -1 };
