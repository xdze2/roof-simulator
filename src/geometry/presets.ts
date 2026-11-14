import type { Polygon } from './skeleton';

// Preset footprints (plan coordinates in metres, y up).
export const PRESETS: Record<string, Polygon> = {
  rectangle: [[8, 10], [32, 10], [32, 22], [8, 22]],
  L: [[8, 6], [34, 6], [34, 18], [20, 18], [20, 32], [8, 32]],
  T: [[6, 8], [34, 8], [34, 18], [24, 18], [24, 32], [16, 32], [16, 18], [6, 18]],
  U: [[6, 6], [34, 6], [34, 30], [25, 30], [25, 16], [15, 16], [15, 30], [6, 30]],
  irregular: [[6, 8], [30, 5], [36, 18], [26, 17], [31, 31], [17, 27], [14, 15], [5, 22]],
  gableHouse: [[8, 10], [32, 10], [32, 22], [8, 22]],
  lGables: [[8, 6], [34, 6], [34, 18], [20, 18], [20, 32], [8, 32]],
};
// edges (index i = vertex i -> i+1) that start as gables
export const GABLES: Record<string, number[]> = { gableHouse: [1, 3], lGables: [1, 4] };
