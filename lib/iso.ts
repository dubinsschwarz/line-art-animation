// iso.ts — a quasi-isometric camera for line-art scenes seen from above.
//
// World units are metres: x runs to screen right-down, y to screen left-down, z up.
//   sx = ox + (x − y)·s        sy = oy + (x + y)·s/2 − z·s·zs
// This is the 2:1 "pixel-art isometric" (dimetric) projection: no perspective, so every
// plane in the world maps onto the screen by one affine transform. That is the trick the
// whole module rests on: draw a façade, a pavement or an awning flat, in its own metres,
// exactly as ink.ts draws elevations, then lay it onto its plane with plane()/wall().
//
// Visible faces of anything box-shaped are always the top, the +y face (screen left)
// and the +x face (screen right). Put tall things along the two back edges (small x+y)
// and keep the front open; draw back to front by x + y (depth()).

import { el, f, type Vec } from './ink.ts';

export type V3 = readonly [number, number, number];

export interface Iso {
  s: number; zs: number; ox: number; oy: number;
  /** Screen point of a world point. */
  p(x: number, y: number, z?: number): Vec;
  /** "sx sy" for path strings. */
  pt(x: number, y: number, z?: number): string;
  /** Path through world points, closed unless open = true. */
  poly(points: readonly V3[], open?: boolean): string;
  /** SVG transform putting local 2D coordinates (u, w) on the plane origin + u·U + w·W. */
  plane(origin: V3, U: V3, W: V3): string;
  /** A wall: local u runs along `along` (left to right as seen), local w is height going DOWN
   *  (w = −3 is 3 m up), so elevation drawings with the ground at w = 0 drop straight in. */
  wall(origin: V3, along: V3): string;
  /** The ground (or any level z): local u = x, w = y. */
  ground(z?: number): string;
  /** Painter's-algorithm key: draw smaller first. */
  depth(x: number, y: number, z?: number): number;
}

export function iso({ scale = 7, zScale = 1, origin = [480, 200] as readonly number[] } = {}): Iso {
  const s = scale, zs = zScale, [ox, oy] = origin;
  const p = (x: number, y: number, z = 0): Vec => [ox + (x - y) * s, oy + ((x + y) * s) / 2 - z * s * zs];
  const pt = (x: number, y: number, z = 0) => { const q = p(x, y, z); return `${f(q[0])} ${f(q[1])}`; };
  const plane = (o: V3, U: V3, W: V3) => {
    const a = p(o[0], o[1], o[2]), u = p(o[0] + U[0], o[1] + U[1], o[2] + U[2]), w = p(o[0] + W[0], o[1] + W[1], o[2] + W[2]);
    return `matrix(${f(u[0] - a[0])} ${f(u[1] - a[1])} ${f(w[0] - a[0])} ${f(w[1] - a[1])} ${f(a[0])} ${f(a[1])})`;
  };
  return {
    s, zs, ox, oy, p, pt,
    poly: (pts, open = false) => 'M' + pts.map((q) => pt(q[0], q[1], q[2])).join('L') + (open ? '' : 'Z'),
    plane,
    wall: (o, along) => plane(o, along, [0, 0, -1]),
    ground: (z = 0) => plane([0, 0, z], [1, 0, 0], [0, 1, 0]),
    depth: (x, y, z = 0) => x + y + z * 0.01,
  };
}

/** A group whose children are drawn in a plane's local metres (see Iso.plane / wall / ground).
 *  Pen widths inside are in metres too: px / I.s. */
export const planeGroup = (parent: Element, transform: string, attrs: Record<string, string | number> = {}): SVGGElement =>
  el('g', { transform, ...attrs }, parent);

// ------------------------------------------------------------------ boxes and roofs

export interface BoxFaces { top: SVGPathElement; left: SVGPathElement; right: SVGPathElement }
/** The three visible faces of an axis-aligned box from a to b (a < b on every axis).
 *  left is the +y face, right the +x face. Fills are left to the caller (for shading). */
export function box(parent: Element, I: Iso, a: V3, b: V3, w = 0.8): BoxFaces {
  const [x0, y0, z0] = a, [x1, y1, z1] = b;
  const face = (pts: V3[]) => el('path', { d: I.poly(pts), stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round' }, parent);
  return {
    left: face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]]),
    right: face([[x1, y1, z0], [x1, y0, z0], [x1, y0, z1], [x1, y1, z1]]),
    top: face([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]]),
  };
}

/** Gable roof over the box footprint, ridge along 'x' or 'y', eaves at z, ridge at z + h.
 *  Returns the visible slope and the visible gable end (both may be shaded by the caller). */
export function gable(parent: Element, I: Iso, x0: number, y0: number, x1: number, y1: number, z: number, h: number, ridge: 'x' | 'y', w = 0.8) {
  const face = (pts: V3[]) => el('path', { d: I.poly(pts), stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round' }, parent);
  if (ridge === 'y') {
    const xm = (x0 + x1) / 2;
    return {
      slope: face([[xm, y0, z + h], [xm, y1, z + h], [x1, y1, z], [x1, y0, z]]),
      end: face([[x0, y1, z], [x1, y1, z], [xm, y1, z + h]]),
      normal: [0.7, 0, 0.7] as V3,
    };
  }
  const ym = (y0 + y1) / 2;
  return {
    slope: face([[x0, ym, z + h], [x1, ym, z + h], [x1, y1, z], [x0, y1, z]]),
    end: face([[x1, y0, z], [x1, y1, z], [x1, ym, z + h]]),
    normal: [0, 0.7, 0.7] as V3,
  };
}

/** Pyramid (spire, tower cap) on a square at height z; returns its two visible faces. */
export function pyramid(parent: Element, I: Iso, cx: number, cy: number, half: number, z: number, h: number, w = 0.8) {
  const face = (pts: V3[]) => el('path', { d: I.poly(pts), stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round' }, parent);
  const apex: V3 = [cx, cy, z + h];
  return {
    left: face([[cx - half, cy + half, z], [cx + half, cy + half, z], apex]),
    right: face([[cx + half, cy + half, z], [cx + half, cy - half, z], apex]),
  };
}

// ------------------------------------------------------------------ ground shapes

/** A circle lying on level z, as a path (an ellipse on screen). */
export function ring(I: Iso, cx: number, cy: number, r: number, z = 0, n = 48): string {
  const pts: V3[] = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r, z]); }
  return I.poly(pts);
}

/** Convex hull (monotone chain) of 2D points. */
export function hull(points: Vec[]): Vec[] {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: Vec, a: Vec, b: Vec) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: Vec[] = [], hi: Vec[] = [];
  for (const q of p) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
}

// ------------------------------------------------------------------ the sun

export interface Sun {
  /** Unit vector toward the sun, horizontal part (x, y). */
  dir: [number, number];
  /** Elevation in radians (negative below the horizon). */
  elev: number;
  /** 0 at night … 1 in full sun; fades through dawn and dusk. */
  strength: number;
  /** Ground offset of a shadow per metre of height. */
  cast: [number, number];
}

/** Sun for time of day τ (0 midnight, 0.25 sunrise, 0.5 noon, 0.75 sunset). It rises at
 *  `east`, is highest toward `south` at noon, and sets opposite east. The defaults put
 *  sunrise screen-right, noon in front of the viewer, sunset screen-left, so morning and
 *  evening shadows sweep across a square whose buildings stand along the back edges. */
export function sunAt(tau: number, { east = [0.707, -0.707] as [number, number], south = [0.707, 0.707] as [number, number], maxElev = 62 } = {}): Sun {
  const phi = (Math.PI * (tau - 0.25)) / 0.5;
  const dir: [number, number] = [east[0] * Math.cos(phi) + south[0] * Math.sin(phi), east[1] * Math.cos(phi) + south[1] * Math.sin(phi)];
  const l = Math.hypot(dir[0], dir[1]) || 1;
  dir[0] /= l; dir[1] /= l;
  const elev = Math.sin(phi) * (maxElev * Math.PI) / 180;
  const strength = Math.max(0, Math.min(1, elev / 0.18));
  const k = 1 / Math.tan(Math.max(0.09, elev));
  return { dir, elev, strength, cast: [-dir[0] * k, -dir[1] * k] };
}

/** How brightly the sun lights a face with outward normal n (0 … 1), plus a little sky. */
export function lit(sun: Sun, n: V3, ambient = 0.35): number {
  const cz = Math.cos(Math.max(0, sun.elev)), sz = Math.sin(Math.max(0, sun.elev));
  const d = n[0] * sun.dir[0] * cz + n[1] * sun.dir[1] * cz + n[2] * sz;
  return ambient + (1 - ambient) * Math.max(0, d) * sun.strength;
}

/** Shadow on the ground of a box (footprint corners plus its top corners pushed along the cast). */
export function boxShadow(I: Iso, sun: Sun, a: V3, b: V3): string {
  const pts: Vec[] = [];
  for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) {
    pts.push(I.p(x + sun.cast[0] * a[2], y + sun.cast[1] * a[2], 0));
    pts.push(I.p(x + sun.cast[0] * b[2], y + sun.cast[1] * b[2], 0));
  }
  return 'M' + hull(pts).map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + 'Z';
}

/** Shadow of a point-like thing (a person, a lamp head, a crown) of height h: an ellipse
 *  stretched from its foot along the cast. */
export function blobShadow(I: Iso, sun: Sun, x: number, y: number, r: number, h: number, z = 0): string {
  const pts: Vec[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2, cx = Math.cos(a) * r, cy = Math.sin(a) * r;
    pts.push(I.p(x + cx, y + cy, z), I.p(x + cx + sun.cast[0] * h, y + cy + sun.cast[1] * h, z));
  }
  return 'M' + hull(pts).map((q) => `${f(q[0])} ${f(q[1])}`).join('L') + 'Z';
}

/** Shadow of a box on a wall: the vertical plane x = c (axis 'x', facing +x) or y = c
 *  (axis 'y', facing +y). Returns the convex polygon as world points on the plane, or null
 *  when the sun is behind the wall or the box stands behind it. Clip the result to the wall
 *  (and z ≥ 0) when drawing; combine with the box's ground shadow for the full picture. */
export function wallShadow(sun: Sun, a: V3, b: V3, axis: 'x' | 'y', c = 0): V3[] | null {
  const e = Math.max(0.02, sun.elev), cz = Math.cos(e);
  const L = [sun.dir[0] * cz, sun.dir[1] * cz, Math.sin(e)];
  const k = axis === 'x' ? 0 : 1;
  if (L[k] <= 0.03 || Math.min(a[k], b[k]) < c) return null;
  const pts: Vec[] = [];
  for (const x of [a[0], b[0]]) for (const y of [a[1], b[1]]) for (const z of [a[2], b[2]]) {
    const P = [x, y, z], t = (P[k] - c) / L[k];
    const H = [P[0] - t * L[0], P[1] - t * L[1], P[2] - t * L[2]];
    pts.push([axis === 'x' ? H[1] : H[0], H[2]]);
  }
  return hull(pts).map(([s, z]) => (axis === 'x' ? [c, s, z] : [s, c, z]) as V3);
}
