import * as THREE from 'three';

export const color = (i: number): string => `hsl(${(i * 137.508) % 360} 62% 62%)`;
export const rgb = (i: number): [number, number, number] => {
  const c = new THREE.Color().setHSL(((i * 137.508) % 360) / 360, 0.62, 0.62);
  return [c.r * 255, c.g * 255, c.b * 255];
};
export const colorHex = (i: number): THREE.Color => new THREE.Color().setHSL(((i * 137.508) % 360) / 360, 0.62, 0.62);
