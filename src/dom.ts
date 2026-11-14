export const $ = <T extends HTMLElement = HTMLElement>(id: string): T => document.getElementById(id) as T;

/** global roof slope in degrees (toolbar slider) */
export const globalAlpha = (): number => +$<HTMLInputElement>('slope').value;
