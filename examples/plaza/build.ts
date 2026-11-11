// build.ts — the cathedral square's architecture and furniture, drawn once. Parts that
// live (lit windows, the bells, the fountain, awnings, lamps) come back with draw().
//
// Every façade is drawn flat in its own metres (u along the wall, w = −height) inside a
// group that lib/iso.ts maps onto the wall, so windows, signs and arches are drawn the
// way the street examples draw elevations.
import { el, f, PAPER } from '../../lib/ink.ts';
import { type Iso, type V3, type Sun, box, gable, pyramid, ring, lit, boxShadow, blobShadow, planeGroup } from '../../lib/iso.ts';
import { toRGB, rgb, mix, type Palette, type RGB } from '../../lib/daynight.ts';
import { seeded } from '../../lib/motion.ts';

const rnd = seeded(23);
const smooth = (e0: number, e1: number, x: number) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const PEN = 0.75;          // px, scene pen
const M = (px: number, I: Iso) => px / I.s;   // a pen width in px, expressed in metres for plane groups

// ------------------------------------------------------------------ colour and light
// Surfaces register here with their outward normal; shade() recolours them each frame
// from the sun (direction and strength) and the day/night palette.
interface Shaded { n: Element; normal: V3; c: RGB; k: number; attr: string }
const shaded: Shaded[] = [];
const SHADE = toRGB('#6f6c8a'), MOONLIT = toRGB('#3e3026');
const surface = (n: Element, colour: string, normal: V3, k = 0.85, attr = 'fill') => { shaded.push({ n, normal, c: toRGB(colour), k, attr }); return n; };
// flat colours that only follow day and night (signs, awnings, clothes of things)
interface Tinted { n: Element; c: RGB; k: number; attr: string }
const tinted: Tinted[] = [];
const tint = <T extends Element>(n: T, colour: string, k = 0.55, attr = 'fill'): T => { tinted.push({ n, c: toRGB(colour), k, attr }); n.setAttribute(attr, colour); return n; };

export function shade(sun: Sun, P: Palette) {
  for (const s of shaded) {
    const L = lit(sun, s.normal);
    const day = mix(P.paper, mix(s.c, SHADE, (1 - L) * 0.5), s.k);
    const night = mix(P.paper, mix(s.c, MOONLIT, 0.45), 0.4 * s.k);
    s.n.setAttribute(s.attr, rgb(mix(day, night, P.inkT)));
  }
  for (const t of tinted) t.n.setAttribute(t.attr, rgb(mix(t.c, mix(t.c, [12, 16, 30], 0.6), P.inkT * t.k)));
}

const path = (parent: Element, d: string, attrs: Record<string, string | number> = {}) =>
  el('path', { d, fill: 'none', stroke: 'currentColor', 'stroke-width': PEN, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', ...attrs }, parent);
const rect = (u0: number, w0: number, u1: number, w1: number) => `M${f(u0)} ${f(w0)} L${f(u1)} ${f(w0)} L${f(u1)} ${f(w1)} L${f(u0)} ${f(w1)}Z`;
const lancet = (u0: number, u1: number, wTop: number, wBot: number) => { const r = (u1 - u0) * 0.86, m = (u0 + u1) / 2, ws = wTop + (u1 - u0) * 0.75; return `M${f(u0)} ${f(wBot)} L${f(u0)} ${f(ws)} A${f(r)} ${f(r)} 0 0 1 ${f(m)} ${f(wTop)} A${f(r)} ${f(r)} 0 0 1 ${f(u1)} ${f(ws)} L${f(u1)} ${f(wBot)}Z`; };

// ------------------------------------------------------------------ windows that light
export interface Light { n: Element; thr: number; late: number; lit: number; warm: RGB }
const lights: Light[] = [];
const GLASS = toRGB('#a9bfcb'), DARK_GLASS = toRGB('#0d1220');
function windowPane(g: Element, d: string, thr = rnd(0.15, 0.6)) {
  const n = el('path', { d, stroke: 'currentColor', 'stroke-width': 0.08 }, g);
  lights.push({ n, thr, late: rnd(0, 1) < 0.4 ? rnd(0.93, 1.1) : 9, lit: 0, warm: mix(toRGB('#ffe2a6'), toRGB('#f3a24e'), rnd(0, 1)) });
  return n;
}
export function drawLights(P: Palette, tau: number, dt: number) {
  const sinceDusk = (tau - 0.75 + 1) % 1;
  for (const w of lights) {
    let on = smooth(w.thr, w.thr + 0.25, P.lamp);
    if (w.late < 9 && sinceDusk > w.late - 0.75 && sinceDusk < 0.5) on = 0;
    w.lit += (on - w.lit) * Math.min(1, dt * 3);
    const glass = mix(mix(P.paper, GLASS, 0.6 * (1 - P.inkT)), DARK_GLASS, 0.4 * P.inkT);
    w.n.setAttribute('fill', rgb(mix(glass, w.warm, w.lit * 0.85)));
  }
}

// ------------------------------------------------------------------ a wall to draw on
interface Wall { g: SVGGElement; at(u: number, h: number, d?: number): V3; len: number }
function wallOn(parent: Element, I: Iso, o: V3, along: V3, normal: V3, len: number): Wall {
  return {
    g: planeGroup(parent, I.wall(o, along)),
    at: (u, h, d = 0) => [o[0] + along[0] * u + normal[0] * d, o[1] + along[1] * u + normal[1] * d, o[2] + h],
    len,
  };
}

/** Rows of windows with shutters and small balconies on the upper floors. */
function floors(I: Iso, parent: Element, wall: Wall, normal: V3, z0: number, n: number, fh: number, bays: number[], { shutter = '#4f6b55', balcony = true } = {}) {
  const g = wall.g, pw = M(0.7, I);
  for (let k = 0; k < n; k++) {
    const base = -(z0 + k * fh);
    for (const u of bays) {
      const w = 1.1, h = fh * 0.62, top = base - fh * 0.78;
      windowPane(g, rect(u - w / 2, top, u + w / 2, top + h));
      path(g, `${rect(u - w / 2, top, u + w / 2, top + h)} M${f(u)} ${f(top)} L${f(u)} ${f(top + h)}`, { 'stroke-width': pw * 0.7 });
      tint(path(g, rect(u - w / 2 - 0.62, top, u - w / 2 - 0.08, top + h), { 'stroke-width': pw * 0.6 }), shutter, 0.6);
      tint(path(g, rect(u + w / 2 + 0.08, top, u + w / 2 + 0.62, top + h), { 'stroke-width': pw * 0.6 }), shutter, 0.6);
      if (balcony && k > 0) {
        // the slab, seen from above, then its railing on a plane 0.7 m out from the wall
        const a = wall.at(u - 1.1, z0 + k * fh), b = wall.at(u + 1.1, z0 + k * fh);
        const ao = wall.at(u - 1.1, z0 + k * fh, 0.7), bo = wall.at(u + 1.1, z0 + k * fh, 0.7);
        surface(path(parent, I.poly([a, b, bo, ao]), { 'stroke-width': PEN * 0.7 }), '#efe7d6', [0, 0, 1]);
        const rail = planeGroup(parent, I.wall(wall.at(u - 1.1, 0, 0.7), [(b[0] - a[0]) / 2.2, (b[1] - a[1]) / 2.2, 0]));
        const d = [`M0 ${f(base - 0.9)} L2.2 ${f(base - 0.9)}`];
        for (let x = 0; x <= 2.2; x += 0.24) d.push(`M${f(x)} ${f(base - 0.9)} L${f(x)} ${f(base)}`);
        path(rail, d.join(' '), { 'stroke-width': pw * 0.5 });
      }
    }
  }
}

/** A shop front on the ground floor: a glazed opening that lights up, a sign board, an awning. */
function shop(I: Iso, parent: Element, wall: Wall, normal: V3, u0: number, u1: number, name: string, { board = '#2f4f45', letter = '#e9d9a8', awning = '#b3412d' } = {}) {
  const g = wall.g, h = 3.0;
  windowPane(g, rect(u0, -h, u1, -0.1), 0.03);
  const d = [rect(u0, -h, u1, -0.1)];
  for (let u = u0 + 1.4; u < u1 - 0.4; u += 1.6) d.push(`M${f(u)} ${f(-h)} L${f(u)} -0.1`);
  path(g, d.join(' '), { 'stroke-width': M(0.6, I) });
  tint(path(g, rect(u0, -h - 1.1, u1, -h - 0.1), { 'stroke-width': M(0.6, I) }), board, 0.5);
  const t = el('text', { x: f((u0 + u1) / 2), y: f(-h - 0.6), 'font-size': 0.78, 'font-family': '"Cormorant SC","Iowan Old Style",Georgia,serif', 'font-weight': 700, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'letter-spacing': 0.06 }, g);
  t.textContent = name;
  tint(t, letter, 0.35);
  // the awning: a striped plane sloping out and down from just under the sign
  const top0 = wall.at(u0, h - 0.05), out = 1.6, drop = 0.7;
  const U: V3 = [(wall.at(1, 0)[0] - wall.at(0, 0)[0]), (wall.at(1, 0)[1] - wall.at(0, 0)[1]), 0];
  const W: V3 = [normal[0] * out, normal[1] * out, -drop];
  const ag = planeGroup(parent, I.plane(top0, U, W));
  const n = Math.max(2, Math.round((u1 - u0) / 0.7)), sw = (u1 - u0) / n;
  for (let i = 0; i < n; i++) tint(path(ag, rect(i * sw, 0, (i + 1) * sw, 1), { 'stroke-width': M(0.4, I) }), i % 2 ? '#f3ecdc' : awning, 0.55);
  const val = [];
  for (let i = 0; i < n; i++) val.push(`M${f(i * sw)} 1 Q${f((i + 0.5) * sw)} 1.28 ${f((i + 1) * sw)} 1`);
  path(ag, val.join(' '), { 'stroke-width': M(0.5, I) });
}

// ------------------------------------------------------------------ the square
export function buildSquare(I: Iso, layers: { ground: Element; build: Element; glow: Element; defs: Element }) {
  const { ground, build, glow, defs } = layers;
  const casters: Array<(sun: Sun) => string> = [];
  const live: Array<(t: number, dt: number, wind: number, P: Palette, tau: number) => void> = [];

  // ---------- paving: a grid of stone slabs, a ring of darker setts around the fountain
  const slab = box(ground, I, [-12.5, -12.5, -1.8], [50.5, 41.5, 0], PEN);
  surface(slab.top, '#e4d8bf', [0, 0, 1], 0.9); surface(slab.left, '#b9a57e', [0, 1, 0], 0.9); surface(slab.right, '#b9a57e', [1, 0, 0], 0.9);
  const strata = [];
  for (const z of [-0.6, -1.2]) strata.push(I.poly([[-12.5, 41.5, z], [50.5, 41.5, z], [50.5, -12.5, z]], true));
  path(ground, strata.join(' '), { 'stroke-width': 0.4, opacity: 0.6 });
  const gp = planeGroup(ground, I.ground());
  path(gp, 'M-12.5 39.6 L48.6 39.6 L48.6 -12.5', { 'stroke-width': M(0.5, I) });
  surface(el('path', { d: rect(0, 0, 48, 38), stroke: 'currentColor', 'stroke-width': M(0.8, I) }, gp), '#ece2cb', [0, 0, 1], 0.9);
  const grid = [];
  for (let x = 2; x < 48; x += 2) grid.push(`M${x} 0 L${x} 38`);
  for (let y = 2; y < 38; y += 2) grid.push(`M0 ${y} L48 ${y}`);
  path(gp, grid.join(' '), { 'stroke-width': M(0.32, I), opacity: 0.55 });
  surface(el('path', { d: `M${28 + 7} 22 A7 7 0 1 0 ${28 - 7} 22 A7 7 0 1 0 ${28 + 7} 22Z M${28 + 4.8} 22 A4.8 4.8 0 1 1 ${28 - 4.8} 22 A4.8 4.8 0 1 1 ${28 + 4.8} 22Z`, 'fill-rule': 'evenodd', stroke: 'currentColor', 'stroke-width': M(0.5, I) }, gp), '#d6c6a3', [0, 0, 1], 0.9);
  const rays = [];
  for (let k = 0; k < 24; k++) { const a = (k / 24) * Math.PI * 2; rays.push(`M${f(28 + Math.cos(a) * 4.8)} ${f(22 + Math.sin(a) * 4.8)} L${f(28 + Math.cos(a) * 7)} ${f(22 + Math.sin(a) * 7)}`); }
  path(gp, rays.join(' '), { 'stroke-width': M(0.35, I) });
  path(gp, 'M0 38 L48 38 L48 0', { 'stroke-width': M(1, I) });

  // light thrown on the ground by shop fronts and lamps (in the glow layer, ground plane)
  const gl = planeGroup(glow, I.ground());
  const spill = el('linearGradient', { id: 'p-spill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffc978', 'stop-opacity': 0.55 }, spill);
  el('stop', { offset: 1, 'stop-color': '#ffc978', 'stop-opacity': 0 }, spill);
  const pool = el('radialGradient', { id: 'p-pool' }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffd58a', 'stop-opacity': 0.55 }, pool);
  el('stop', { offset: 1, 'stop-color': '#ffd58a', 'stop-opacity': 0 }, pool);
  const groundLights: Array<{ n: Element; k: number; thr: number }> = [];

  // ---------- buildings: back row (y < 0) and left row (x < 0); [x0,y0,x1,y1, height, colour]
  const rows: Array<[number, number, number, number, number, string, string]> = [
    [-11, -11, 0, 0, 14, '#e8cf9e', 'corner'],
    [0, -11, 12, 0, 13.5, '#efd9b0', 'cafe'],
    [36, -11, 48, 0, 11, '#e9c0a6', 'recuerdos'],
    [-11, 0, 0, 12, 13.5, '#f0dcb6', 'heladeria'],
    [-11, 15, 0, 26, 10.5, '#e7c9a0', 'libreria'],
    [-11, 26, 0, 38, 13.5, '#ecd2ae', 'claustro'],
  ];
  const parts: Array<{ key: number; draw: () => void }> = [];
  for (const [x0, y0, x1, y1, h, colour, kind] of rows) {
    parts.push({ key: I.depth((x0 + x1) / 2, (y0 + y1) / 2), draw: () => {
      const g = el('g', {}, build);
      const b = box(g, I, [x0, y0, 0], [x1, y1, h], PEN);
      surface(b.left, colour, [0, 1, 0]); surface(b.right, colour, [1, 0, 0]); surface(b.top, '#d9c6a4', [0, 0, 1]);
      const back = y1 <= 0 && kind !== 'corner';
      const r = gable(g, I, x0 - 0.3, y0 - 0.3, x1 + 0.3, y1 + 0.3, h, 3.4, back ? 'x' : 'y', PEN);
      surface(r.slope, '#d58a62', r.normal); surface(r.end, colour, back ? [1, 0, 0] : [0, 1, 0]);
      // tile courses on the visible slope
      const tiles = [];
      if (back) for (let x = x0; x <= x1 + 0.3; x += 0.9) tiles.push(I.poly([[x, (y0 + y1) / 2, h + 3.4], [x, y1 + 0.3, h]], true));
      else for (let y = y0; y <= y1 + 0.3; y += 0.9) tiles.push(I.poly([[(x0 + x1) / 2, y, h + 3.4], [x1 + 0.3, y, h]], true));
      path(g, tiles.join(' '), { 'stroke-width': 0.35, opacity: 0.6 });
      casters.push((sun) => boxShadow(I, sun, [x0, y0, 0], [x1, y1, h + 1.7]));
      if (kind === 'corner') {
        floors(I, g, wallOn(g, I, [x0, y1, 0], [1, 0, 0], [0, 1, 0], x1 - x0), [0, 1, 0], 0.4, 4, 3.4, [2.5, 5.5, 8.5], { balcony: false });
        floors(I, g, wallOn(g, I, [x1, y1, 0], [0, -1, 0], [1, 0, 0], y1 - y0), [1, 0, 0], 0.4, 4, 3.4, [2.5, 5.5, 8.5]);
        return;
      }
      // the façade that faces the square
      const facing: V3 = back ? [0, 1, 0] : [1, 0, 0];
      const wall = back ? wallOn(g, I, [x0, y1, 0], [1, 0, 0], facing, x1 - x0) : wallOn(g, I, [x1, y1, 0], [0, -1, 0], facing, y1 - y0);
      const len = back ? x1 - x0 : y1 - y0;
      const bays = len > 11.5 ? [2.2, 6, 9.8] : [2.2, 5.5, 8.8];
      floors(I, g, wall, facing, 4.2, Math.round((h - 4.2) / 3.2), 3.2, bays, { shutter: ['#4f6b55', '#5d4a3a', '#3f6688'][Math.floor(rnd(0, 3))] });
      const names = { cafe: 'Café de la Catedral', recuerdos: 'Recuerdos', heladeria: 'Heladería', libreria: 'Librería', claustro: 'Restaurante El Claustro' };
      const styles = { cafe: { board: '#2f4f45', awning: '#2f5d4a' }, recuerdos: { board: '#7a2f3a', awning: '#c8463a' }, heladeria: { board: '#f3ecdc', letter: '#c8463a', awning: '#e07a9a' }, libreria: { board: '#264d92', awning: '#3d6488' }, claustro: { board: '#3a2c22', letter: '#e0b14a', awning: '#b3412d' } };
      shop(I, g, wall, facing, 0.8, len - 0.8, names[kind], styles[kind]);
      // its light falls out onto the paving after dark
      const o = wall.at(0.8, 0), e = wall.at(len - 0.8, 0);
      const sg = planeGroup(glow, I.plane(o, [e[0] - o[0], e[1] - o[1], 0], [facing[0] * 6, facing[1] * 6, 0]));
      groundLights.push({ n: el('path', { d: 'M0 0 L1 0 L1.08 1 L-0.08 1Z', fill: 'url(#p-spill)', opacity: 0 }, sg), k: 0.75, thr: 0.03 });
      // the back row's side wall at the street's end
      if (back && x1 === 48) floors(I, g, wallOn(g, I, [x1, y1, 0], [0, -1, 0], [1, 0, 0], y1 - y0), [1, 0, 0], 0.4, 3, 3.4, [3, 7.5], { balcony: false });
      if (!back && y1 === 38) floors(I, g, wallOn(g, I, [x0, y1, 0], [1, 0, 0], [0, 1, 0], x1 - x0), [0, 1, 0], 0.4, 4, 3.2, [2.5, 6, 9], { balcony: false });
    } });
  }

  // ---------- the cathedral: nave and crossing behind, two towers and the west front
  const stone = '#ddd0b2';
  parts.push({ key: I.depth(24, -20), draw: () => {
    const g = el('g', {}, build);
    const nave = box(g, I, [17, -33, 0], [31, -7, 19], PEN);
    surface(nave.right, stone, [1, 0, 0]); surface(nave.top, stone, [0, 0, 1]); surface(nave.left, stone, [0, 1, 0]);
    const nw = wallOn(g, I, [31, -7, 0], [0, -1, 0], [1, 0, 0], 26);
    for (let u = 2; u < 25; u += 3.2) { windowPane(nw.g, lancet(u - 0.7, u + 0.7, -17.5, -11), 0.4); path(nw.g, lancet(u - 0.7, u + 0.7, -17.5, -11), { 'stroke-width': M(0.5, I) }); }
    // buttresses with pinnacles and flying arches onto the clerestory
    for (let y = -30; y < -8; y += 3.2) {
      const bb = box(g, I, [32.2, y - 0.45, 0], [33.4, y + 0.45, 11], PEN * 0.8);
      surface(bb.left, stone, [0, 1, 0]); surface(bb.right, stone, [1, 0, 0]); surface(bb.top, stone, [0, 0, 1]);
      const pp = pyramid(g, I, 32.8, y, 0.45, 11, 1.4, PEN * 0.7);
      surface(pp.left, stone, [0, 0.7, 0.7]); surface(pp.right, stone, [0.7, 0, 0.7]);
      path(g, `M${I.pt(32.4, y, 10)} Q${I.pt(32, y, 15.6)} ${I.pt(31, y, 16)}`, { 'stroke-width': PEN * 0.9 });
    }
    const roof = gable(g, I, 16.6, -33.3, 31.4, -6.7, 19, 7.5, 'y', PEN);
    surface(roof.slope, '#9c8a73', roof.normal); surface(roof.end, stone, [0, 1, 0]);
    const lines = [];
    for (let y = -33; y < -7; y += 1.1) lines.push(I.poly([[24, y, 26.5], [31.4, y, 19]], true));
    path(g, lines.join(' '), { 'stroke-width': 0.3, opacity: 0.55 });
    // the crossing lantern and its spire
    const lt = box(g, I, [21.8, -28.2, 19], [26.2, -23.8, 25.5], PEN);
    surface(lt.left, stone, [0, 1, 0]); surface(lt.right, stone, [1, 0, 0]); surface(lt.top, stone, [0, 0, 1]);
    const lw = wallOn(g, I, [26.2, -23.8, 19], [0, -1, 0], [1, 0, 0], 4.4);
    for (const u of [1.2, 3.2]) { windowPane(lw.g, lancet(u - 0.45, u + 0.45, -5.6, -2.6), 0.5); path(lw.g, lancet(u - 0.45, u + 0.45, -5.6, -2.6), { 'stroke-width': M(0.5, I) }); }
    const ls = pyramid(g, I, 24, -26, 2.2, 25.5, 7.5, PEN);
    surface(ls.left, '#9c8a73', [0, 0.7, 0.7]); surface(ls.right, '#9c8a73', [0.7, 0, 0.7]);
    casters.push((sun) => boxShadow(I, sun, [17, -33, 0], [31, -7, 23]));
  } });

  const bellNodes: Array<{ g: SVGGElement; a: number; v: number }> = [];
  for (const [tx0, tx1] of [[13, 20], [28, 35]]) {
    parts.push({ key: I.depth((tx0 + tx1) / 2, -3.5) + 0.5, draw: () => {
      const g = el('g', {}, build);
      const H = 29, cx = (tx0 + tx1) / 2;
      const t = box(g, I, [tx0, -7, 0], [tx1, 0, H], PEN);
      surface(t.left, stone, [0, 1, 0]); surface(t.right, stone, [1, 0, 0]); surface(t.top, stone, [0, 0, 1]);
      for (const [o, along, normal, len] of [[[tx0, 0, 0], [1, 0, 0], [0, 1, 0], 7], [[tx1, 0, 0], [0, -1, 0], [1, 0, 0], 7]] as Array<[V3, V3, V3, number]>) {
        const w = wallOn(g, I, o, along, normal, len), pw = M(0.6, I);
        path(w.g, [9, 16, 22.6].map((z) => `M0 ${-z} L7 ${-z}`).join(' ') + ' M0.4 0 L0.4 -29 M6.6 0 L6.6 -29', { 'stroke-width': pw });
        windowPane(w.g, lancet(2.9, 4.1, -14.6, -10.6), 0.4);
        path(w.g, lancet(2.9, 4.1, -14.6, -10.6), { 'stroke-width': pw });
        // the belfry: two tall openings with bells hanging in them
        for (const u of [1.4, 4.2]) {
          el('path', { d: lancet(u, u + 1.4, -28, -23.4), fill: '#2a2630', opacity: 0.85 }, w.g);
          path(w.g, lancet(u, u + 1.4, -28, -23.4), { 'stroke-width': pw });
          const bg = el('g', {}, w.g);
          tint(el('path', { d: 'M-0.38 0 Q-0.42 0.6 -0.6 0.9 L0.6 0.9 Q0.42 0.6 0.38 0 Q0.38 -0.2 0 -0.2 Q-0.38 -0.2 -0.38 0Z', stroke: 'currentColor', 'stroke-width': pw * 0.6 }, bg), '#a67f3f', 0.5);
          bellNodes.push({ g: bg, a: 0, v: 0, ...{ u: u + 0.7 } } as any);
        }
        // balustrade at the top
        const bal = [`M0 -29 L7 -29 M0 -28.4 L7 -28.4`];
        for (let u = 0.3; u < 7; u += 0.45) bal.push(`M${f(u)} -29 L${f(u)} -28.4`);
        path(w.g, bal.join(' '), { 'stroke-width': pw * 0.7 });
      }
      // octagonal spire as a pyramid with crockets, and four corner pinnacles
      const sp = pyramid(g, I, cx, -3.5, 2.9, H, 12, PEN);
      surface(sp.left, stone, [0, 0.7, 0.7]); surface(sp.right, stone, [0.7, 0, 0.7]);
      const crockets = [];
      for (let k = 1; k < 9; k++) {
        const u = k / 9;
        for (const [ex, ey] of [[-2.9, 2.9], [2.9, 2.9], [2.9, -2.9]]) {
          const q = I.p(cx + ex * (1 - u), -3.5 + ey * (1 - u), H + 12 * u);
          crockets.push(`M${f(q[0])} ${f(q[1])} l${ex < 0 ? -1.2 : 1.2} -0.8`);
        }
      }
      path(g, crockets.join(' '), { 'stroke-width': 0.45 });
      path(g, `M${I.pt(cx, -3.5, H + 12)} L${I.pt(cx, -3.5, H + 14.4)} M${I.pt(cx - 0.6, -3.5, H + 13.6)} L${I.pt(cx + 0.6, -3.5, H + 13.6)}`, { 'stroke-width': PEN * 0.9 });
      for (const [px, py] of [[tx0 + 0.6, -0.6], [tx1 - 0.6, -0.6], [tx1 - 0.6, -6.4]]) {
        const pp = pyramid(g, I, px, py, 0.5, H, 3.2, PEN * 0.7);
        surface(pp.left, stone, [0, 0.7, 0.7]); surface(pp.right, stone, [0.7, 0, 0.7]);
      }
      casters.push((sun) => boxShadow(I, sun, [tx0, -7, 0], [tx1, 0, H]));
      casters.push((sun) => blobShadow(I, sun, cx, -3.5, 1.5, H + 10));
    } });
  }

  // the west front between the towers: portals, rose window, a gable with pinnacles
  parts.push({ key: I.depth(24, -0.5) + 0.4, draw: () => {
    const g = el('g', {}, build);
    const front = el('path', { d: I.poly([[20, 0, 0], [28, 0, 0], [28, 0, 21.5], [24, 0, 27.5], [20, 0, 21.5]]), stroke: 'currentColor', 'stroke-width': PEN }, g);
    surface(front, stone, [0, 1, 0]);
    const w = wallOn(g, I, [20, 0, 0], [1, 0, 0], [0, 1, 0], 8), pw = M(0.6, I);
    // the portal: a deep pointed arch with archivolts and a tympanum
    for (let k = 0; k < 4; k++) path(w.g, lancet(1.7 - k * 0.32, 6.3 + k * 0.32, -8.6 - k * 0.4, 0), { 'stroke-width': pw * 0.8 });
    el('path', { d: lancet(2.5, 5.5, -7.6, 0), fill: '#3a2c22' }, w.g);
    path(w.g, 'M4 0 L4 -5.2 M2.5 -5.2 L5.5 -5.2', { 'stroke-width': pw });
    // gallery of niches with saints
    const niches = [];
    for (let u = 0.6; u < 7.6; u += 0.9) niches.push(lancet(u, u + 0.6, -12.6, -10.6));
    path(w.g, niches.join(' '), { 'stroke-width': pw * 0.6 });
    // rose window: a ring of lights with tracery
    windowPane(w.g, 'M6.8 -16 A2.8 2.8 0 1 0 1.2 -16 A2.8 2.8 0 1 0 6.8 -16Z', 0.25);
    const tr = ['M6.8 -16 A2.8 2.8 0 1 0 1.2 -16 A2.8 2.8 0 1 0 6.8 -16Z M5.2 -16 A1.2 1.2 0 1 0 2.8 -16 A1.2 1.2 0 1 0 5.2 -16Z'];
    for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; tr.push(`M${f(4 + Math.cos(a) * 1.2)} ${f(-16 + Math.sin(a) * 1.2)} L${f(4 + Math.cos(a) * 2.8)} ${f(-16 + Math.sin(a) * 2.8)}`); }
    path(w.g, tr.join(' '), { 'stroke-width': pw * 0.8 });
    path(w.g, 'M0 -21.5 L8 -21.5 M0 -9.4 L8 -9.4', { 'stroke-width': pw });
    for (const [px] of [[20.4], [27.6]]) { const pp = pyramid(g, I, px, 0.4, 0.5, 21.5, 3, PEN * 0.7); surface(pp.left, stone, [0, 0.7, 0.7]); surface(pp.right, stone, [0.7, 0, 0.7]); }
    path(g, `M${I.pt(24, 0, 27.5)} L${I.pt(24, 0, 30)} M${I.pt(23.4, 0, 29.2)} L${I.pt(24.6, 0, 29.2)}`, { 'stroke-width': PEN });
    // floodlights wash the front after dark
    const flood = el('linearGradient', { id: 'p-flood', x1: 0, y1: 1, x2: 0, y2: 0 }, defs);
    el('stop', { offset: 0, 'stop-color': '#ffcf8a', 'stop-opacity': 0.55 }, flood);
    el('stop', { offset: 1, 'stop-color': '#ffcf8a', 'stop-opacity': 0.06 }, flood);
    const fl = el('path', { d: I.poly([[13, 0, 0], [35, 0, 0], [35, 0, 29], [28, 0, 29], [24, 0, 27.5], [20, 0, 29], [13, 0, 29]]), fill: 'url(#p-flood)', opacity: 0 }, glow);
    groundLights.push({ n: fl, k: 0.8, thr: 0.25 });
  } });

  // the steps up to the west front, the long sides of each tread lit and shaded
  parts.push({ key: I.depth(24, 2), draw: () => {
    const g = el('g', {}, build);
    for (let i = 0; i < 4; i++) {
      const s = box(g, I, [12.5 - (3 - i) * 0, 0, 0], [35.5, 4 - i, (i + 1) * 0.3], PEN * 0.7);
      surface(s.left, '#cfc1a2', [0, 1, 0]); surface(s.right, '#cfc1a2', [1, 0, 0]); surface(s.top, '#e3d8bf', [0, 0, 1]);
    }
  } });

  parts.sort((a, b) => a.key - b.key).forEach((p) => p.draw());

  const bells = {
    ring: 0,
    poke() { this.ring = 1; bellNodes.forEach((b, i) => (b.v += 2.6 * (i % 2 ? -1 : 1))); },
  };
  live.push((t, dt) => {
    bells.ring = Math.max(0, bells.ring - dt * 0.3);
    bellNodes.forEach((b: any) => { b.v += (-b.a * 7 - b.v * 0.6) * dt; b.a += b.v * dt; b.g.setAttribute('transform', `translate(${f(b.u)} -27.4) rotate(${f(b.a * 57.3)})`); });
  });
  live.push((t, dt, wind, P) => { for (const l of groundLights) l.n.setAttribute('opacity', f(smooth(l.thr, l.thr + 0.25, P.lamp) * l.k)); });

  return { casters, live, bells, gl, groundLights };
}

// ------------------------------------------------------------------ square furniture (depth-sorted with people)
export interface Prop { key: number; g: SVGGElement; draw?: (t: number, dt: number, wind: number, P: Palette, tau: number) => void; shadow?: (sun: Sun) => string; hit?: Element }

export function buildProps(I: Iso, layer: Element, glow: Element, defs: Element): Prop[] {
  const props: Prop[] = [];
  const add = (x: number, y: number, fn: (g: SVGGElement) => Partial<Prop>) => { const g = el('g', {}, layer); const p = { key: I.depth(x, y), g, ...fn(g) }; props.push(p as Prop); return p as Prop; };

  // the fountain: a round basin, a column with a bowl, water arcing out of it
  add(28, 22, (g) => {
    const cx = 28, cy = 22;
    surface(el('path', { d: ring(I, cx, cy, 3.6, 0.7), stroke: 'currentColor', 'stroke-width': PEN }, g), '#ddd0b2', [0, 0, 1]);
    const rim = [];
    for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI - Math.PI * 0.25; rim.push([cx + Math.cos(a) * 3.6, cy + Math.sin(a) * 3.6]); }
    surface(el('path', { d: 'M' + rim.map(([x, y]) => I.pt(x, y, 0.7)).join('L') + 'L' + rim.slice().reverse().map(([x, y]) => I.pt(x, y, 0)).join('L') + 'Z', stroke: 'currentColor', 'stroke-width': PEN }, g), '#cfc1a2', [0.7, 0.7, 0]);
    const water = tint(el('path', { d: ring(I, cx, cy, 3.1, 0.65), stroke: 'none' }, g), '#9cc3cf', 0.6);
    const ripples = el('path', { fill: 'none', stroke: '#f4f8f8', 'stroke-width': 0.4, opacity: 0.8 }, g);
    surface(el('path', { d: `M${I.pt(cx - 0.35, cy, 0.6)} L${I.pt(cx - 0.3, cy, 2.4)} L${I.pt(cx + 0.3, cy, 2.4)} L${I.pt(cx + 0.35, cy, 0.6)}Z`, stroke: 'currentColor', 'stroke-width': PEN * 0.8 }, g), '#d6c7a6', [0.7, 0.7, 0]);
    surface(el('path', { d: ring(I, cx, cy, 1.1, 2.4, 24), stroke: 'currentColor', 'stroke-width': PEN * 0.8 }, g), '#d6c7a6', [0, 0, 1]);
    const jets = el('path', { fill: 'none', stroke: '#e6f2f6', 'stroke-width': 0.8, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    const jetsInk = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.3, opacity: 0.5 }, g);
    return {
      shadow: (sun) => blobShadow(I, sun, cx, cy, 3.6, 0.7),
      draw(t) {
        const d = [];
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + 0.2, s = 0.06 * Math.sin(t * 9 + k);
          const top = I.p(cx, cy, 2.6), mid = I.p(cx + Math.cos(a) * 1.0, cy + Math.sin(a) * 1.0, 3.3 + s), end = I.p(cx + Math.cos(a) * 1.9, cy + Math.sin(a) * 1.9, 0.75);
          d.push(`M${f(top[0])} ${f(top[1])} Q${f(mid[0])} ${f(mid[1])} ${f(end[0])} ${f(end[1])}`);
        }
        jets.setAttribute('d', d.join(' ')); jetsInk.setAttribute('d', d.join(' '));
        const r = [];
        for (let k = 0; k < 3; k++) { const rr = 1.4 + ((t * 0.6 + k / 3) % 1) * 1.6; r.push(ring(I, cx, cy, rr, 0.66, 32)); }
        ripples.setAttribute('d', r.join(' '));
        ripples.setAttribute('opacity', f(0.5));
      },
    };
  });

  // orange trees in square pits down the open right side and the front
  for (const [x, y] of [[44, 7], [44, 17], [44, 27], [20, 34.5], [10, 34.5]]) {
    add(x, y, (g) => {
      path(g, I.poly([[x - 0.9, y - 0.9, 0.02], [x + 0.9, y - 0.9, 0.02], [x + 0.9, y + 0.9, 0.02], [x - 0.9, y + 0.9, 0.02]]), { 'stroke-width': PEN * 0.6 });
      const base = I.p(x, y, 0), top = I.p(x, y, 2.2);
      el('path', { d: `M${f(base[0] - 0.7)} ${f(base[1])} L${f(top[0] - 0.5)} ${f(top[1])} L${f(top[0] + 0.5)} ${f(top[1])} L${f(base[0] + 0.7)} ${f(base[1])}Z`, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g);
      const crown = el('g', {}, g);
      const c = I.p(x, y, 3.3), R = 1.9 * I.s;
      const lumps = [];
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2; const rr = R * (1 + 0.08 * Math.abs(Math.sin(a * 6))); lumps.push(`${f(c[0] + Math.cos(a) * rr)} ${f(c[1] + Math.sin(a) * rr * 0.86)}`); }
      surface(el('path', { d: 'M' + lumps.join('L') + 'Z', stroke: 'currentColor', 'stroke-width': PEN * 0.8 }, crown), '#a8c27e', [0.5, 0.5, 0.7], 0.9);
      const lv = [], fr = [];
      for (let i = 0; i < 26; i++) { const a = rnd(0, 6.28), d = Math.sqrt(rnd(0, 1)) * R * 0.85, lx = c[0] + Math.cos(a) * d, ly = c[1] + Math.sin(a) * d * 0.86, r2 = rnd(0, 6.28); lv.push(`M${f(lx)} ${f(ly)} q${f(Math.cos(r2) * 1.4)} ${f(Math.sin(r2) * 1.4 - 0.8)} ${f(Math.cos(r2) * 2.6)} ${f(Math.sin(r2) * 2.6)}`); }
      for (let i = 0; i < 9; i++) { const a = rnd(0, 6.28), d = Math.sqrt(rnd(0, 1)) * R * 0.75; fr.push(`M${f(c[0] + Math.cos(a) * d + 1.2)} ${f(c[1] + Math.sin(a) * d * 0.86)} a1.2 1.2 0 1 0 -2.4 0 a1.2 1.2 0 1 0 2.4 0Z`); }
      path(crown, lv.join(' '), { 'stroke-width': 0.4 });
      tint(el('path', { d: fr.join(' '), stroke: 'currentColor', 'stroke-width': 0.3 }, crown), '#e8892b', 0.55);
      const ph = rnd(0, 6);
      return { shadow: (sun) => blobShadow(I, sun, x, y, 1.9, 3.3), draw: (t, dt, wind) => crown.setAttribute('transform', `translate(${f(wind * 0.5 + Math.sin(t * 1.2 + ph) * 0.25)} 0)`) };
    });
  }

  // iron street lamps; their light pools on the paving
  for (const [x, y] of [[12, 8], [40, 8], [8, 26], [36, 32]]) {
    add(x, y, (g) => {
      const b = I.p(x, y, 0), t = I.p(x, y, 4.2);
      path(g, `M${f(b[0])} ${f(b[1])} L${f(t[0])} ${f(t[1])} M${f(b[0] - 1.2)} ${f(b[1])} L${f(b[0] + 1.2)} ${f(b[1])}`, { 'stroke-width': PEN * 1.1 });
      const head = el('path', { d: `M${f(t[0] - 1.6)} ${f(t[1])} L${f(t[0] + 1.6)} ${f(t[1])} L${f(t[0] + 1.1)} ${f(t[1] + 3.4)} L${f(t[0] - 1.1)} ${f(t[1] + 3.4)}Z`, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g);
      el('path', { d: `M${f(t[0] - 2)} ${f(t[1])} L${f(t[0])} ${f(t[1] - 1.6)} L${f(t[0] + 2)} ${f(t[1])}Z`, fill: 'currentColor' }, g);
      const pg = planeGroup(glow, I.ground());
      const poolN = el('circle', { cx: x, cy: y, r: 5, fill: 'url(#p-pool)', opacity: 0 }, pg);
      const halo = el('circle', { cx: t[0], cy: t[1] + 1.6, r: 9, fill: 'url(#p-pool)', opacity: 0 }, glow);
      return {
        shadow: (sun) => blobShadow(I, sun, x, y, 0.12, 4.2),
        draw: (tt, dt, wind, P) => {
          const on = smooth(0.2, 0.45, P.lamp);
          head.setAttribute('fill', rgb(mix(P.paper, toRGB('#fff1c9'), on)));
          poolN.setAttribute('opacity', f(on * 0.75)); halo.setAttribute('opacity', f(on * 0.7));
        },
      };
    });
  }

  // café terraces: tables with square parasols in front of the café and the restaurant
  const terrace = (cells: Array<[number, number]>, canvas: string) => cells.forEach(([x, y]) => add(x, y, (g) => {
    const top = I.p(x, y, 0.75);
    path(g, `M${I.pt(x, y, 0)} L${f(top[0])} ${f(top[1])}`, { 'stroke-width': PEN });
    surface(el('path', { d: ring(I, x, y, 0.45, 0.75, 20), stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#f3ecdc', [0, 0, 1]);
    const pole = I.p(x, y, 2.4);
    path(g, `M${f(top[0])} ${f(top[1])} L${f(pole[0])} ${f(pole[1] - 2)}`, { 'stroke-width': PEN * 0.7 });
    const s = 1.3, ph = rnd(0, 6);
    const canopy = el('g', {}, g);
    const faces = [[[x - s, y + s, 2.15], [x + s, y + s, 2.15]], [[x + s, y + s, 2.15], [x + s, y - s, 2.15]]] as Array<[V3, V3]>;
    for (const [a, b] of faces) tint(el('path', { d: I.poly([a, b, [x, y, 2.75]]), stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, canopy), canvas, 0.55);
    tint(el('path', { d: I.poly([[x - s, y - s, 2.15], [x - s, y + s, 2.15], [x, y, 2.75]]), stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, canopy), '#f3ecdc', 0.55);
    return { shadow: (sun) => boxShadow(I, sun, [x - s, y - s, 2.1], [x + s, y + s, 2.7]), draw: (t, dt, wind) => canopy.setAttribute('transform', `translate(${f(wind * 0.25 + Math.sin(t * 1.5 + ph) * 0.12)} 0)`) };
  }));
  terrace([[2.6, 3.4], [6.2, 3.4], [9.8, 3.4], [4.4, 7], [8, 7]], '#2f5d4a');
  terrace([[3.4, 28.4], [3.4, 32], [3.4, 35.6], [7, 30.2], [7, 33.8]], '#b3412d');

  // benches facing the fountain
  for (const [x, y, ax] of [[19.5, 22, 'y'], [36.5, 22, 'y'], [28, 13.5, 'x'], [28, 30.5, 'x']] as Array<[number, number, string]>) {
    add(x, y, (g) => {
      const a: V3 = ax === 'y' ? [x - 0.3, y - 1.6, 0.42] : [x - 1.6, y - 0.3, 0.42];
      const b: V3 = ax === 'y' ? [x + 0.3, y + 1.6, 0.48] : [x + 1.6, y + 0.3, 0.48];
      for (const [lx, ly] of ax === 'y' ? [[x, y - 1.3], [x, y + 1.3]] : [[x - 1.3, y], [x + 1.3, y]]) path(g, `M${I.pt(lx, ly, 0)} L${I.pt(lx, ly, 0.42)}`, { 'stroke-width': PEN * 0.8 });
      const s = box(g, I, a, b, PEN * 0.6);
      tint(s.top, '#7a5236', 0.5); tint(s.left, '#5f3f28', 0.5); tint(s.right, '#5f3f28', 0.5);
      return { shadow: (sun) => boxShadow(I, sun, a, b) };
    });
  }
  return props;
}
