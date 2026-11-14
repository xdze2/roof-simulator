import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Skeleton } from '../geometry/skeleton';
import { makeNearest } from '../geometry/nearest';
import { $ } from '../dom';
import { state, WALL_H } from '../state';
import { colorHex } from './colors';

const c3 = $<HTMLCanvasElement>('c3d');
const renderer = new THREE.WebGLRenderer({ canvas: c3, antialias: true, preserveDrawingBuffer: true });
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdfe6ea);
const camera = new THREE.PerspectiveCamera(40, 1, 0.5, 500);
const controls = new OrbitControls(camera, c3);
controls.enableDamping = true;
scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.5); sun.position.set(-30, 50, 25); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ color: 0xb8c4a8 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02; scene.add(ground);
const grid = new THREE.GridHelper(200, 100, 0x8a9a7a, 0x9fae90); grid.position.y = 0; scene.add(grid);
let group = new THREE.Group(); scene.add(group);
camera.position.set(20, 42, 62); controls.target.set(20, 4, -20); controls.update();

interface P2 { x: number; y: number }

function earClip(f: P2[]): [number, number, number][] { // f: CCW simple polygon -> index triples
  const idx = f.map((_, i) => i), tris: [number, number, number][] = [];
  const cr = (a: P2, b: P2, c: P2) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  let guard = 0;
  while (idx.length > 3 && guard++ < 1000) {
    let cut = false;
    for (let k = 0; k < idx.length; k++) {
      const i0 = idx[(k + idx.length - 1) % idx.length], i1 = idx[k], i2 = idx[(k + 1) % idx.length];
      const a = f[i0], b = f[i1], c = f[i2];
      const area = cr(a, b, c);
      if (area < 1e-12) continue;
      let inside = false;
      for (const j of idx) {
        if (j === i0 || j === i1 || j === i2) continue;
        const p = f[j];
        if (cr(a, b, p) >= -1e-12 && cr(b, c, p) >= -1e-12 && cr(c, a, p) >= -1e-12) { inside = true; break; }
      }
      if (inside) continue;
      tris.push([i0, i1, i2]); idx.splice(k, 1); cut = true; break;
    }
    if (!cut) { // degenerate (collinear) leftovers: drop a collinear vertex
      let k = 0, m = Infinity;
      for (let q = 0; q < idx.length; q++) {
        const a = f[idx[(q + idx.length - 1) % idx.length]], b = f[idx[q]], c = f[idx[(q + 1) % idx.length]];
        const v = Math.abs(cr(a, b, c)); if (v < m) { m = v; k = q; }
      }
      idx.splice(k, 1);
    }
  }
  if (idx.length === 3) tris.push([idx[0], idx[1], idx[2]]);
  return tris;
}

// plan (x,y) -> three (x, z, -y)
function buildField(sk: Skeleton, k: number): void {
  const P = sk.poly, n = P.length, nn = makeNearest(P);
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of P) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
  const N = 200, h = Math.max(x1 - x0, y1 - y0) / N;
  const nx = Math.ceil((x1 - x0) / h) + 1, ny = Math.ceil((y1 - y0) / h) + 1;
  const H = new Float32Array((nx + 1) * (ny + 1)), S = new Int32Array((nx + 1) * (ny + 1)).fill(-1);
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) {
    const q = nn.query(x0 + i * h, y0 + j * h);
    if (q) { H[j * (nx + 1) + i] = q.d; S[j * (nx + 1) + i] = q.site; }
  }
  const cols = P.map((_, i) => colorHex(i)), grey = new THREE.Color(0x9a9a9a);
  const pos: number[] = [], col: number[] = [];
  const V = (i: number, j: number) => { const q = H[j * (nx + 1) + i]; pos.push(x0 + i * h, WALL_H + q * k, -(y0 + j * h)); };
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, ids = [S[a], S[a + 1], S[a + nx + 1], S[a + nx + 2]];
    if (ids.some((s) => s < 0)) continue;            // drop cells not fully inside
    const s = ids[0] === ids[3] || ids[1] === ids[2] ? ids[0] : ids[1]; // owner: majority-ish
    const c = s < n ? cols[s] : grey;
    V(i, j); V(i + 1, j); V(i + 1, j + 1); V(i, j); V(i + 1, j + 1); V(i, j + 1);
    for (let m = 0; m < 6; m++) col.push(c.r, c.g, c.b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  group.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })));
}

export function build3d(refit: boolean): void {
  const sk = state.sk;
  scene.remove(group);
  group.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
  group = new THREE.Group(); scene.add(group);
  if (!sk) return;
  const k = Math.tan(+$<HTMLInputElement>('slope').value * Math.PI / 180);
  if ($<HTMLSelectElement>('mode').value !== 'skel') buildField(sk, k);
  else sk.faces.forEach((f, i) => {
    if (f.length < 3) return;
    const pos: number[] = [];
    const e = sk.edges[i], gable = e.w === 0;
    // roof height = time t; a gable face is a vertical polygon, triangulated in (s along the edge, z)
    const tri = gable ? earClip(f.map((p) => ({ x: (p.x - sk.poly[i][0]) * e.dx + (p.y - sk.poly[i][1]) * e.dy, y: p.t }))) : earClip(f);
    for (const [a, b, c] of tri) for (const q of [a, b, c]) pos.push(f[q].x, WALL_H + f[q].t, -f[q].y);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    group.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: gable ? 0xe9e2d0 : colorHex(i), side: THREE.DoubleSide })));
  });
  if ($<HTMLInputElement>('walls').checked) {
    const P = sk.poly, pos: number[] = [];
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length];
      const A0 = [a[0], 0, -a[1]], B0 = [b[0], 0, -b[1]], A1 = [a[0], WALL_H, -a[1]], B1 = [b[0], WALL_H, -b[1]];
      pos.push(...A0, ...B0, ...B1, ...A0, ...B1, ...A1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals();
    group.add(new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0xe9e2d0, side: THREE.DoubleSide })));
  }
  // footprint outline at eaves
  const lp = sk.poly.map((p) => new THREE.Vector3(p[0], WALL_H, -p[1]));
  group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(lp), new THREE.LineBasicMaterial({ color: 0x222222 })));
  if (refit) {
    let cx = 0, cy = 0; for (const p of sk.poly) { cx += p[0]; cy += p[1]; }
    cx /= sk.poly.length; cy /= sk.poly.length;
    controls.target.set(cx, 4, -cy); camera.position.set(cx + 42, 36, -cy + 40); controls.update();
  }
}

export function resize3d(): void {
  const r = c3.getBoundingClientRect();
  renderer.setPixelRatio(devicePixelRatio || 1); renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / Math.max(1, r.height); camera.updateProjectionMatrix();
}
export function loop(): void { controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
