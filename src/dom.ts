export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

/** global roof slope in degrees (toolbar slider) */
export const globalAlpha = (): number => +$<HTMLInputElement>('slope').value;

/** level-line height as a fraction of the ridge height (toolbar "level" slider), or null when off */
export const cutFraction = (): number | null => (!noRoof() && $<HTMLInputElement>('cutOn').checked ? +$<HTMLInputElement>('cut').value / 100 : null);

/** roof method (toolbar select): 'none' | 'skel' | 'nearest' | 'points' */
export const getMode = (): string => $<HTMLSelectElement>('mode').value;

/** "no roof" method: walls and footprint only */
export const noRoof = (): boolean => getMode() === 'none';

/** methods with a roof height field (nearest segment / vertex) */
export const isFieldMode = (mode: string): boolean => mode === 'nearest' || mode === 'points';

/** the skeleton arcs are drawn: always for the skeleton, on request (View > skeleton) over a field method */
export const showsArcs = (mode: string): boolean => mode === 'skel' || (isFieldMode(mode) && $<HTMLInputElement>('arcs').checked);

/** a skeleton arc is a ridge when it is horizontal (both ends at the same height) */
export const isRidge = (ta: number, tb: number, maxT: number): boolean => Math.abs(ta - tb) < 1e-6 * Math.max(1, maxT);
