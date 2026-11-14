export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

/** global roof slope in degrees (toolbar slider) */
export const globalAlpha = (): number => +$<HTMLInputElement>('slope').value;

/** level-line height as a fraction of the ridge height (toolbar "level" slider), or null when off */
export const cutFraction = (): number | null => ($<HTMLInputElement>('cutOn').checked ? +$<HTMLInputElement>('cut').value / 100 : null);

/** display modes that draw the skeleton arcs */
export const showsArcs = (mode: string): boolean => mode === 'skel' || mode === 'overlay';
