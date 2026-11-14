import * as THREE from 'three';

/** Tableau 10 categorical palette, indexed by footprint edge (roof face) */
export const TABLEAU10 = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac'];

export const color = (i: number): string => TABLEAU10[i % TABLEAU10.length];
export const colorHex = (i: number): THREE.Color => new THREE.Color(color(i));
export const rgb = (i: number): [number, number, number] => {
  const h = color(i);
  return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
};
