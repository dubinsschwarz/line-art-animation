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


// ------------------------------------------------------------------ the close view
// The cathedral's west front stands on the x = 0 edge facing +x (screen lower right), its
// towers cropped by the top of the card; a neighbouring house continues the edge toward
// the viewer; shops and the café run along the y = 0 edge. The camera is close (11 px a
// metre), so the ground in front of the steps is drawn as it would really be laid:
// granite courses, pebble mosaic, a medallion on the portal's axis.
export const FRONT = { y0: 2, y1: 24, recess: 1.2, cy: 13 };

/** Patterns, all in ground-plane metres (they transform with the plane). */
function groundPatterns(defs: Element) {
  // granite flags in courses 0.8 m deep running along the front, joints staggered
  const flags = el('pattern', { id: 'p-flags', width: 3.2, height: 4.2, patternUnits: 'userSpaceOnUse' }, defs);
  const fj = [];
  for (let c = 0; c < 4; c++) {
    fj.push(`M${c * 0.8} 0 L${c * 0.8} 4.2`);
    let y = [0.3, 1.1, 0.6, 1.5][c];
    while (y < 4.2) { fj.push(`M${c * 0.8} ${f(y)} L${(c + 1) * 0.8} ${f(y)}`); y += [1.1, 1.35, 0.95, 1.25][(c + Math.round(y * 3)) % 4]; }
  }
  el('path', { d: fj.join(' '), stroke: '#8a7f6c', 'stroke-width': 0.035, fill: 'none', opacity: 0.85 }, flags);
  // river-pebble mosaic: herringbone of small ellipses, dark pebbles and light ones
  for (const [id, tone, base, edge] of [['p-peb-dark', '#3c3834', '#6a635a', '#2a2724'], ['p-peb-light', '#f6f1e6', '#c4b79c', '#9c8f76']]) {
    const pt = el('pattern', { id, width: 0.6, height: 0.6, patternUnits: 'userSpaceOnUse' }, defs);
    el('rect', { width: 0.6, height: 0.6, fill: base }, pt);
    const d = [];
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      const cx = 0.1 + i * 0.2, cy = 0.1 + j * 0.2, a = (i + j) % 2 ? 0.75 : -0.75;
      const dx = Math.cos(a) * 0.075, dy = Math.sin(a) * 0.075;
      d.push(`M${f(cx - dx)} ${f(cy - dy)} L${f(cx + dx)} ${f(cy + dy)}`);
    }
    el('path', { d: d.join(' '), stroke: edge, 'stroke-width': 0.13, 'stroke-linecap': 'round', fill: 'none' }, pt);
    el('path', { d: d.join(' '), stroke: tone, 'stroke-width': 0.09, 'stroke-linecap': 'round', fill: 'none' }, pt);
  }
}

export function buildSquare(I: Iso, layers: { ground: Element; build: Element; glow: Element; defs: Element }) {
  const { ground, build, glow, defs } = layers;
  const casters: Array<(sun: Sun) => string> = [];
  const live: Array<(t: number, dt: number, wind: number, P: Palette, tau: number) => void> = [];
  const groundLights: Array<{ n: Element; k: number; thr: number }> = [];
  groundPatterns(defs);
  const spill = el('linearGradient', { id: 'p-spill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffc978', 'stop-opacity': 0.5 }, spill);
  el('stop', { offset: 1, 'stop-color': '#ffc978', 'stop-opacity': 0 }, spill);
  const pool = el('radialGradient', { id: 'p-pool' }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffd58a', 'stop-opacity': 0.5 }, pool);
  el('stop', { offset: 1, 'stop-color': '#ffd58a', 'stop-opacity': 0 }, pool);

  // ---------- the ground: granite flags everywhere, a pebble-mosaic panel before the steps
  const gp = planeGroup(ground, I.ground());
  const pw = (px: number) => M(px, I);
  surface(el('path', { d: rect(-12, -12, 70, 70), stroke: 'none' }, gp), '#e4d9c3', [0, 0, 1], 0.9);
  el('path', { d: rect(-12, -12, 70, 70), fill: 'url(#p-flags)', stroke: 'none' }, gp);
  // a few weathered or replaced stones
  const worn = [], darker = [];
  for (let i = 0; i < 140; i++) {
    const c = Math.floor(rnd(6, 60)) , y = rnd(-1, 55), len = rnd(0.8, 1.3), x = c * 0.8;
    (rnd(0, 1) < 0.5 ? worn : darker).push(rect(x + 0.03, y, x + 0.77, y + len));
  }
  surface(el('path', { d: worn.join(' '), stroke: 'none', opacity: 0.5 }, gp), '#efe7d5', [0, 0, 1], 0.9);
  surface(el('path', { d: darker.join(' '), stroke: 'none', opacity: 0.35 }, gp), '#c8bba1', [0, 0, 1], 0.9);
  // the mosaic panel: a dark border, light field, and a sixteen-point star medallion on the axis
  const px0 = 5.6, px1 = 19.4, py0 = 2.4, py1 = 23.6, cx = 12.5, cy = FRONT.cy;
  el('path', { d: rect(px0, py0, px1, py1), fill: 'url(#p-peb-light)', stroke: 'none' }, gp);
  el('path', { d: `${rect(px0, py0, px1, py1)} ${rect(px0 + 0.7, py0 + 0.7, px1 - 0.7, py1 - 0.7)}`, fill: 'url(#p-peb-dark)', 'fill-rule': 'evenodd', stroke: 'none' }, gp);
  // corner fleurons: diamonds of dark pebbles
  const corners = [[px0 + 2, py0 + 2], [px1 - 2, py0 + 2], [px0 + 2, py1 - 2], [px1 - 2, py1 - 2]];
  const petal = (x: number, y: number, a: number) => { const c = Math.cos(a), sn = Math.sin(a); return `M${x} ${y} Q${f(x + c * 0.55 - sn * 0.5)} ${f(y + sn * 0.55 + c * 0.5)} ${f(x + c * 1.3)} ${f(y + sn * 1.3)} Q${f(x + c * 0.55 + sn * 0.5)} ${f(y + sn * 0.55 - c * 0.5)} ${x} ${y}Z`; };
  el('path', { d: corners.map(([x, y]) => [0, 1, 2, 3].map((k) => petal(x, y, (k * Math.PI) / 2 + Math.PI / 4)).join(' ')).join(' '), fill: 'url(#p-peb-dark)', stroke: 'none' }, gp);
  el('path', { d: corners.map(([x, y]) => `M${x + 0.3} ${y} A0.3 0.3 0 1 0 ${x - 0.3} ${y} A0.3 0.3 0 1 0 ${x + 0.3} ${y}Z`).join(' '), fill: '#d39532', stroke: 'none' }, gp);
  // the medallion
  const R = 5, ringD = (r: number) => `M${cx + r} ${cy} A${r} ${r} 0 1 0 ${cx - r} ${cy} A${r} ${r} 0 1 0 ${cx + r} ${cy}Z`;
  el('path', { d: `${ringD(R)} ${ringD(R - 0.55)}`, fill: 'url(#p-peb-dark)', 'fill-rule': 'evenodd', stroke: 'none' }, gp);
  const star = [];
  for (let k = 0; k < 32; k++) { const a = (k / 32) * Math.PI * 2 - Math.PI / 2, r = k % 2 ? 1.5 : k % 4 === 0 ? R - 0.8 : 3.1; star.push(`${f(cx + Math.cos(a) * r)} ${f(cy + Math.sin(a) * r)}`); }
  el('path', { d: 'M' + star.join('L') + 'Z', fill: 'url(#p-peb-dark)', stroke: 'none' }, gp);
  el('path', { d: ringD(1.1), fill: 'url(#p-peb-light)', stroke: 'none' }, gp);
  el('path', { d: ringD(0.5), fill: 'url(#p-peb-dark)', stroke: 'none' }, gp);
  // granite kerbs edging the panel and the medallion
  path(gp, `${rect(px0, py0, px1, py1)} ${ringD(R)} ${ringD(R - 0.55)}`, { 'stroke-width': pw(0.7), stroke: '#6d6457' });
  // a pebble band runs out across the square on the portal's axis
  el('path', { d: rect(px1, cy - 0.8, 60, cy + 0.8), fill: 'url(#p-peb-light)', stroke: 'none' }, gp);
  el('path', { d: `${rect(px1, cy - 0.8, 60, cy - 0.55)} ${rect(px1, cy + 0.55, 60, cy + 0.8)}`, fill: 'url(#p-peb-dark)', stroke: 'none' }, gp);
  const chev = [];
  for (let x = px1 + 0.6; x < 60; x += 1.2) chev.push(`M${x} ${cy - 0.45} L${x + 0.5} ${cy} L${x} ${cy + 0.45}`);
  path(gp, chev.join(' '), { 'stroke-width': 0.12, stroke: '#4f4a44' });
  path(gp, `M${px1} ${cy - 0.8} L60 ${cy - 0.8} M${px1} ${cy + 0.8} L60 ${cy + 0.8}`, { 'stroke-width': pw(0.6), stroke: '#6d6457' });
  // the pebble patterns use fixed colours, so a veil of paper colour dims them after dark
  const veil = el('path', { d: `${rect(px0, py0, px1, py1)} ${rect(px1, cy - 0.8, 60, cy + 0.8)}`, fill: PAPER, stroke: 'none', opacity: 0 }, gp);
  // a drainage channel at the foot of the steps, a cast-iron manhole cover
  path(gp, `M4.95 0.6 L4.95 25.4 M5.25 0.6 L5.25 25.4`, { 'stroke-width': pw(0.5), stroke: '#6d6457' });
  const mh = [`M${23.2 + 0.55} 21 A0.55 0.55 0 1 0 ${23.2 - 0.55} 21 A0.55 0.55 0 1 0 ${23.2 + 0.55} 21Z`];
  for (let k = -2; k <= 2; k++) mh.push(`M${23.2 + k * 0.2} ${21 - Math.sqrt(0.3 - (k * 0.2) ** 2)} L${23.2 + k * 0.2} ${21 + Math.sqrt(0.3 - (k * 0.2) ** 2)}`);
  tint(el('path', { d: mh.join(' '), stroke: 'currentColor', 'stroke-width': pw(0.4) }, gp), '#4a4744', 0.4);

  // ---------- buildings: [x0, y0, x1, y1, height, colour, kind]
  const rows: Array<[number, number, number, number, number, string, string]> = [
    [-11, -11, 0, 1, 15, '#e8cf9e', 'corner'],
    [0.6, -11, 13, 0, 15, '#efd9b0', 'pasteleria'],
    [13, -11, 28, 0, 16.5, '#e9c9a6', 'cafe'],
    [28, -11, 46, 0, 14, '#eed6b4', 'recuerdos'],
    [-11, 27.2, 0, 40, 15, '#ecd2ae', 'ceramica'],
  ];
  const parts: Array<{ key: number; draw: () => void }> = [];
  const names = { pasteleria: 'Pastelería', cafe: 'Café de la Catedral', recuerdos: 'Recuerdos', ceramica: 'Cerámica' };
  const styles = { pasteleria: { board: '#f3ecdc', letter: '#7a2f3a', awning: '#d68a9a' }, cafe: { board: '#2f4f45', awning: '#2f5d4a' }, recuerdos: { board: '#7a2f3a', awning: '#c8463a' }, ceramica: { board: '#264d92', awning: '#3d6488' } };
  for (const [x0, y0, x1, y1, h, colour, kind] of rows) {
    parts.push({ key: I.depth((x0 + x1) / 2, (y0 + y1) / 2), draw: () => {
      const g = el('g', {}, build);
      const b = box(g, I, [x0, y0, 0], [x1, y1, h], PEN);
      surface(b.left, colour, [0, 1, 0]); surface(b.right, colour, [1, 0, 0]); surface(b.top, '#d9c6a4', [0, 0, 1]);
      const back = y1 <= 0;
      const r = gable(g, I, x0 - 0.3, y0 - 0.3, x1 + 0.3, y1 + 0.3, h, 3.6, back ? 'x' : 'y', PEN);
      surface(r.slope, '#d58a62', r.normal); surface(r.end, colour, back ? [1, 0, 0] : [0, 1, 0]);
      const tiles = [];
      if (back) for (let x = x0; x <= x1 + 0.3; x += 0.55) tiles.push(I.poly([[x, (y0 + y1) / 2, h + 3.6], [x, y1 + 0.3, h]], true));
      else for (let y = y0; y <= y1 + 0.3; y += 0.55) tiles.push(I.poly([[(x0 + x1) / 2, y, h + 3.6], [x1 + 0.3, y, h]], true));
      path(g, tiles.join(' '), { 'stroke-width': 0.4, opacity: 0.55 });
      casters.push((sun) => boxShadow(I, sun, [x0, y0, 0], [x1, y1, h + 1.8]));
      if (kind === 'corner') { floors(I, g, wallOn(g, I, [x1, y1, 0], [0, -1, 0], [1, 0, 0], y1 - y0), [1, 0, 0], 0.4, 4, 3.6, [3, 6.5, 9.5], { balcony: false }); return; }
      const facing: V3 = back ? [0, 1, 0] : [1, 0, 0];
      const wall = back ? wallOn(g, I, [x0, y1, 0], [1, 0, 0], facing, x1 - x0) : wallOn(g, I, [x1, y1, 0], [0, -1, 0], facing, y1 - y0);
      const len = back ? x1 - x0 : y1 - y0;
      const bays: number[] = [];
      for (let u = 2; u < len - 1; u += 3.4) bays.push(u);
      floors(I, g, wall, facing, 4.4, Math.round((h - 4.4) / 3.4), 3.4, bays, { shutter: { pasteleria: '#5d4a3a', cafe: '#4f6b55', recuerdos: '#3f6688', ceramica: '#4f6b55' }[kind] });
      shop(I, g, wall, facing, 0.8, len - 0.8, names[kind], styles[kind]);
      const o = wall.at(0.8, 0), e = wall.at(len - 0.8, 0);
      const sg = planeGroup(glow, I.plane(o, [e[0] - o[0], e[1] - o[1], 0], [facing[0] * 6, facing[1] * 6, 0]));
      groundLights.push({ n: el('path', { d: 'M0 0 L1 0 L1.08 1 L-0.08 1Z', fill: 'url(#p-spill)', opacity: 0 }, sg), k: 0.7, thr: 0.03 });
      if (!back) floors(I, g, wallOn(g, I, [x0, y1, 0], [1, 0, 0], [0, 1, 0], x1 - x0), [0, 1, 0], 0.4, 4, 3.4, [2.5, 6, 9], { balcony: false });
      if (kind === 'ceramica') {
        // painted plates and tile panels hung beside the door
        const spots: Array<[number, number]> = [];
        for (const u of [0.4, len - 0.4]) for (const w of [-0.8, -1.7, -2.6]) spots.push([u, w]);
        const disc = (u: number, w: number, r: number) => `M${f(u + r)} ${f(w)} A${r} ${r} 0 1 0 ${f(u - r)} ${f(w)} A${r} ${r} 0 1 0 ${f(u + r)} ${f(w)}Z`;
        tint(path(wall.g, spots.map(([u, w]) => disc(u, w, 0.36)).join(' '), { 'stroke-width': pw(0.5) }), '#f1ecdf', 0.5);
        tint(path(wall.g, spots.map(([u, w]) => disc(u, w, 0.18)).join(' '), { 'stroke-width': pw(0.3) }), '#2f6fa8', 0.4);
      }
    } });
  }

  // ---------- the cathedral: towers either side of a recessed west front, nave behind
  const stone = '#ddd0b2', stone2 = '#d2c3a2';
  const { y0: fy0, y1: fy1, recess } = FRONT;
  parts.push({ key: I.depth(-18, 13), draw: () => {
    const g = el('g', {}, build);
    const nave = box(g, I, [-34, 6, 0], [-7, 20, 21], PEN);
    surface(nave.right, stone, [1, 0, 0]); surface(nave.top, stone, [0, 0, 1]); surface(nave.left, stone, [0, 1, 0]);
    const nw = wallOn(g, I, [-34, 20, 0], [1, 0, 0], [0, 1, 0], 27);
    for (let u = 2; u < 26; u += 3.2) { windowPane(nw.g, lancet(u - 0.7, u + 0.7, -19.5, -12), 0.4); path(nw.g, lancet(u - 0.7, u + 0.7, -19.5, -12), { 'stroke-width': pw(0.5) }); }
    const roof = gable(g, I, -34.3, 5.7, -7, 20.3, 21, 8, 'x', PEN);
    surface(roof.slope, '#9c8a73', roof.normal); surface(roof.end, stone, [1, 0, 0]);
    casters.push((sun) => boxShadow(I, sun, [-34, 6, 0], [-7, 20, 25]));
  } });
  const bells: Array<{ g: SVGGElement; a: number; v: number; u: number }> = [];
  let clockHands: SVGPathElement | null = null;
  for (const [ty0, ty1, left] of [[fy0, fy0 + 7, false], [fy1 - 7, fy1, true]] as Array<[number, number, boolean]>) {
    parts.push({ key: I.depth(-3.5, (ty0 + ty1) / 2) + (left ? 0.6 : 0), draw: () => {
      const g = el('g', {}, build);
      const H = 30, cyT = (ty0 + ty1) / 2;
      const t = box(g, I, [-7, ty0, 0], [0, ty1, H], PEN);
      surface(t.left, stone2, [0, 1, 0]); surface(t.right, stone, [1, 0, 0]); surface(t.top, stone, [0, 0, 1]);
      const faces: Array<[V3, V3, V3]> = [[[0, ty1, 0], [0, -1, 0], [1, 0, 0]]];
      if (left) faces.push([[-7, ty1, 0], [1, 0, 0], [0, 1, 0]]);
      for (const [o, along, normal] of faces) {
        const w = wallOn(g, I, o, along, normal, 7), q = w.g;
        // coursed ashlar, string courses, corner buttresses
        const ash = [];
        for (let z = 0.6; z < H; z += 0.6) ash.push(`M0 ${f(-z)} L7 ${f(-z)}`);
        path(q, ash.join(' '), { 'stroke-width': pw(0.25), opacity: 0.45 });
        path(q, [9.6, 17.4, 23].map((z) => `M0 ${-z} L7 ${-z} M0 ${-z - 0.3} L7 ${-z - 0.3}`).join(' ') + ' M0.6 0 L0.6 -30 M6.4 0 L6.4 -30', { 'stroke-width': pw(0.6) });
        // a side portal, lancets, the belfry with its bells, a balustrade
        if (normal[0] === 1) {
          for (let k = 0; k < 3; k++) path(q, lancet(2.3 - k * 0.22, 4.7 + k * 0.22, -5.6 - k * 0.3, 0), { 'stroke-width': pw(0.5) });
          el('path', { d: lancet(2.6, 4.4, -5, 0), fill: '#3a2c22' }, q);
          path(q, 'M3.5 0 L3.5 -3.6', { 'stroke-width': pw(0.5) });
        }
        for (const u of [2.2, 4.8]) { windowPane(q, lancet(u - 0.45, u + 0.45, -15.6, -11.4), 0.45); path(q, lancet(u - 0.45, u + 0.45, -15.6, -11.4), { 'stroke-width': pw(0.5) }); }
        for (const u of [1.3, 4.1]) {
          el('path', { d: lancet(u, u + 1.6, -28.6, -23.8), fill: '#2a2630', opacity: 0.85 }, q);
          path(q, lancet(u, u + 1.6, -28.6, -23.8), { 'stroke-width': pw(0.55) });
          const bg = el('g', {}, q);
          tint(el('path', { d: 'M-0.42 0 Q-0.46 0.66 -0.66 1 L0.66 1 Q0.46 0.66 0.42 0 Q0.42 -0.22 0 -0.22 Q-0.42 -0.22 -0.42 0Z', stroke: 'currentColor', 'stroke-width': pw(0.4) }, bg), '#a67f3f', 0.5);
          bells.push({ g: bg, a: 0, v: 0, u: u + 0.8 });
        }
        const bal = ['M0 -29.4 L7 -29.4 M0 -28.8 L7 -28.8'];
        for (let u = 0.3; u < 7; u += 0.4) bal.push(`M${f(u)} -29.4 L${f(u)} -28.8`);
        path(q, bal.join(' '), { 'stroke-width': pw(0.4) });
        // gargoyles jutting from the corners under the belfry
        path(q, 'M0.2 -22.2 l-0.9 0.3 l-0.5 -0.3 l0.4 -0.3 l1 -0.1 M6.8 -22.2 l0.9 0.3 l0.5 -0.3 l-0.4 -0.3 l-1 -0.1', { 'stroke-width': pw(0.6) });
        // the clock on the south tower's front, keeping the scene's time
        if (left && normal[0] === 1) {
          const dial = 'M5 -20 A1.5 1.5 0 1 0 2 -20 A1.5 1.5 0 1 0 5 -20Z';
          tint(path(q, dial, { 'stroke-width': pw(0.6) }), '#f3ecdc', 0.45);
          const ticks = [];
          for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ticks.push(`M${f(3.5 + Math.sin(a) * 1.25)} ${f(-20 - Math.cos(a) * 1.25)} L${f(3.5 + Math.sin(a) * 1.05)} ${f(-20 - Math.cos(a) * 1.05)}`); }
          path(q, ticks.join(' '), { 'stroke-width': pw(0.4) });
          clockHands = path(q, '', { 'stroke-width': pw(0.7) }) as SVGPathElement;
        }
      }
      const sp = pyramid(g, I, -3.5, cyT, 3, H, 13, PEN);
      surface(sp.left, stone2, [0, 0.7, 0.7]); surface(sp.right, stone, [0.7, 0, 0.7]);
      for (const [px, py] of [[-0.6, ty0 + 0.6], [-0.6, ty1 - 0.6], [-6.4, ty1 - 0.6]]) {
        const pp = pyramid(g, I, px, py, 0.5, H, 3.4, PEN * 0.7);
        surface(pp.left, stone2, [0, 0.7, 0.7]); surface(pp.right, stone, [0.7, 0, 0.7]);
      }
      casters.push((sun) => boxShadow(I, sun, [-7, ty0, 0], [0, ty1, H]));
      casters.push((sun) => blobShadow(I, sun, -3.5, cyT, 1.6, H + 11));
    } });
  }

  // the recessed west front between the towers: the great portal, its sculpture, the rose
  parts.push({ key: I.depth(-recess, FRONT.cy) + 0.3, draw: () => {
    const g = el('g', {}, build);
    const ya = fy0 + 7, yb = fy1 - 7, W = yb - ya, xr = -recess;
    const frontD = I.poly([[xr, yb, 0], [xr, ya, 0], [xr, ya, 22], [xr, (ya + yb) / 2, 28.5], [xr, yb, 22]]);
    surface(el('path', { d: frontD, stroke: 'currentColor', 'stroke-width': PEN }, g), stone, [1, 0, 0]);
    // the south tower's inner flank shows in the recess
    const flank = el('path', { d: I.poly([[xr, ya, 0], [0, ya, 0], [0, ya, 30], [xr, ya, 30]]), stroke: 'currentColor', 'stroke-width': PEN }, g);
    surface(flank, stone2, [0, 1, 0]);
    const w = wallOn(g, I, [xr, yb, 0], [0, -1, 0], [1, 0, 0], W), q = w.g, m = W / 2;
    const ash = [];
    for (let z = 0.6; z < 22; z += 0.6) ash.push(`M0 ${f(-z)} L${W} ${f(-z)}`);
    path(q, ash.join(' '), { 'stroke-width': pw(0.25), opacity: 0.4 });
    // archivolts, each a ring of small carved figures
    const arch = (k: number) => lancet(m - 3.2 + k * 0.4, m + 3.2 - k * 0.4, -12.2 + k * 0.5, 0);
    for (let k = 0; k < 6; k++) path(q, arch(k), { 'stroke-width': pw(0.55) });
    const figs = [];
    for (let k = 0; k < 5; k++) {
      const r0 = 3.2 - k * 0.4 - 0.2, top = -12.2 + k * 0.5 + 0.25, spring = top + (6.4 - k * 0.8) * 0.75;
      for (let s = 0.08; s < 0.95; s += 0.11) {
        for (const side of [-1, 1]) {
          const a = s * Math.PI / 2;
          const x = m + side * (r0 - (r0 * 0.86) * (1 - Math.cos(a)) * 0.9), y = spring - (spring - top) * Math.sin(a);
          figs.push(`M${f(x - 0.09)} ${f(y + 0.16)} L${f(x - 0.09)} ${f(y - 0.08)} A0.09 0.09 0 0 1 ${f(x + 0.09)} ${f(y - 0.08)} L${f(x + 0.09)} ${f(y + 0.16)}Z`);
        }
      }
      for (let y = spring; y < -0.4; y += 0.55) for (const side of [-1, 1]) { const x = m + side * r0; figs.push(`M${f(x - 0.09)} ${f(y + 0.2)} L${f(x - 0.09)} ${f(y - 0.08)} A0.09 0.09 0 0 1 ${f(x + 0.09)} ${f(y - 0.08)} L${f(x + 0.09)} ${f(y + 0.2)}Z`); }
    }
    tint(el('path', { d: figs.join(' '), stroke: 'currentColor', 'stroke-width': pw(0.25) }, q), '#cbbc9c', 0.6);
    // jamb statues on pedestals under canopies, three a side
    const statue = (u: number) => `M${f(u - 0.24)} -2.4 L${f(u - 0.22)} -3.9 Q${f(u - 0.25)} -4.3 ${f(u - 0.12)} -4.35 A0.15 0.17 0 1 1 ${f(u + 0.12)} -4.35 Q${f(u + 0.25)} -4.3 ${f(u + 0.22)} -3.9 L${f(u + 0.24)} -2.4Z M${f(u - 0.3)} -2.4 L${f(u + 0.3)} -2.4 L${f(u + 0.26)} -1.9 L${f(u - 0.26)} -1.9Z M${f(u - 0.3)} -4.75 L${f(u)} -5.3 L${f(u + 0.3)} -4.75Z`;
    const jambs = [m - 2.75, m - 2.2, m - 1.65, m + 1.65, m + 2.2, m + 2.75];
    tint(el('path', { d: jambs.map(statue).join(' '), stroke: 'currentColor', 'stroke-width': pw(0.35) }, q), '#d8cbad', 0.6);
    path(q, jambs.map((u) => `M${f(u - 0.06)} -2.6 L${f(u - 0.04)} -3.8 M${f(u + 0.08)} -2.6 L${f(u + 0.06)} -3.7`).join(' '), { 'stroke-width': pw(0.25) });
    // the doors: two leaves of studded oak with iron strap hinges, a trumeau statue between
    el('path', { d: lancet(m - 1.35, m + 1.35, -6.2, 0), fill: '#2e231b' }, q);
    tint(el('path', { d: `${rect(m - 1.3, -4.3, m - 0.12, 0)} ${rect(m + 0.12, -4.3, m + 1.3, 0)}`, stroke: 'currentColor', 'stroke-width': pw(0.4) }, q), '#6b4a30', 0.5);
    const straps = [], studs = [];
    for (const y of [-0.8, -2.2, -3.6]) for (const side of [-1, 1]) straps.push(`M${f(m + side * 0.16)} ${y} L${f(m + side * 1.1)} ${y} q${f(side * 0.18)} 0 ${f(side * 0.12)} -0.16 M${f(m + side * 0.7)} ${y} q${f(side * 0.1)} -0.22 ${f(side * 0.26)} -0.18`);
    for (let y = -0.4; y > -4.1; y -= 0.45) for (const u of [m - 1.05, m - 0.6, m + 0.6, m + 1.05]) studs.push(`M${f(u + 0.03)} ${f(y)} A0.03 0.03 0 1 0 ${f(u - 0.03)} ${f(y)} A0.03 0.03 0 1 0 ${f(u + 0.03)} ${f(y)}Z`);
    path(q, straps.join(' '), { 'stroke-width': pw(0.5), stroke: '#1c1c1c' });
    el('path', { d: studs.join(' '), fill: '#1c1c1c' }, q);
    tint(el('path', { d: `M${m - 0.14} 0 L${m - 0.14} -4.3 L${m + 0.14} -4.3 L${m + 0.14} 0Z ${statue(m).replace(/-2.4/g, '-4.3').replace(/-1.9/g, '-4.3')}`, stroke: 'currentColor', 'stroke-width': pw(0.35) }, q), '#d8cbad', 0.6);
    // tympanum: a mandorla with a seated figure, two rows of small figures beneath
    path(q, `M${m - 1.4} -4.4 L${m + 1.4} -4.4 M${m - 1.3} -5.1 L${m + 1.3} -5.1`, { 'stroke-width': pw(0.45) });
    const small = [];
    for (let u = m - 1.15; u <= m + 1.16; u += 0.33) small.push(`M${f(u - 0.08)} -4.42 L${f(u - 0.08)} -4.75 A0.08 0.08 0 0 1 ${f(u + 0.08)} -4.75 L${f(u + 0.08)} -4.42Z`);
    tint(el('path', { d: small.join(' ') + ` M${m} -5.3 Q${m - 0.55} -5.9 ${m} -6.5 Q${m + 0.55} -5.9 ${m} -5.3Z`, stroke: 'currentColor', 'stroke-width': pw(0.3) }, q), '#cbbc9c', 0.6);
    // gallery of kings, rose window, gable with crockets
    const niches = [];
    for (let u = 0.5; u < W - 0.6; u += 0.78) niches.push(lancet(u, u + 0.56, -14.4, -12.8));
    path(q, niches.join(' ') + ` M0 -12.6 L${W} -12.6 M0 -14.7 L${W} -14.7`, { 'stroke-width': pw(0.45) });
    tint(el('path', { d: niches.map((_, i) => { const u = 0.78 + i * 0.78; return `M${f(u - 0.11)} -12.8 L${f(u - 0.1)} -13.6 A0.11 0.12 0 1 1 ${f(u + 0.1)} -13.6 L${f(u + 0.11)} -12.8Z`; }).join(' '), stroke: 'currentColor', 'stroke-width': pw(0.25) }, q), '#cbbc9c', 0.6);
    windowPane(q, `M${m + 3} -18.2 A3 3 0 1 0 ${m - 3} -18.2 A3 3 0 1 0 ${m + 3} -18.2Z`, 0.25);
    const tr = [`M${m + 3} -18.2 A3 3 0 1 0 ${m - 3} -18.2 A3 3 0 1 0 ${m + 3} -18.2Z M${m + 1.1} -18.2 A1.1 1.1 0 1 0 ${m - 1.1} -18.2 A1.1 1.1 0 1 0 ${m + 1.1} -18.2Z M${m + 0.4} -18.2 A0.4 0.4 0 1 0 ${m - 0.4} -18.2 A0.4 0.4 0 1 0 ${m + 0.4} -18.2Z`];
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * Math.PI * 2, a2 = ((k + 0.5) / 16) * Math.PI * 2;
      tr.push(`M${f(m + Math.cos(a) * 1.1)} ${f(-18.2 + Math.sin(a) * 1.1)} L${f(m + Math.cos(a) * 3)} ${f(-18.2 + Math.sin(a) * 3)}`);
      tr.push(`M${f(m + Math.cos(a2) * 2.75)} ${f(-18.2 + Math.sin(a2) * 2.75)} A0.32 0.32 0 1 0 ${f(m + Math.cos(a2) * 2.1)} ${f(-18.2 + Math.sin(a2) * 2.1)} A0.32 0.32 0 1 0 ${f(m + Math.cos(a2) * 2.75)} ${f(-18.2 + Math.sin(a2) * 2.75)}`);
    }
    path(q, tr.join(' '), { 'stroke-width': pw(0.5) });
    const gableD = [`M0 -22 L${W} -22 M0 -22.3 L${m} -28.5 L${W} -22.3`];
    for (let s = 0.12; s < 0.95; s += 0.12) { gableD.push(`M${f(m * s)} ${f(-22.3 - 6.2 * s)} l-0.2 -0.35`, `M${f(W - m * s)} ${f(-22.3 - 6.2 * s)} l0.2 -0.35`); }
    path(q, gableD.join(' ') + ` M${m} -28.5 L${m} -30.6 M${m - 0.6} -29.9 L${m + 0.6} -29.9`, { 'stroke-width': pw(0.6) });
    // floodlights wash the whole front after dark
    const flood = el('linearGradient', { id: 'p-flood', x1: 0, y1: 1, x2: 0, y2: 0 }, defs);
    el('stop', { offset: 0, 'stop-color': '#ffcf8a', 'stop-opacity': 0.5 }, flood);
    el('stop', { offset: 1, 'stop-color': '#ffcf8a', 'stop-opacity': 0.05 }, flood);
    groundLights.push({ n: el('path', { d: I.poly([[0, fy1, 0], [0, fy0, 0], [0, fy0, 30], [0, fy1, 30]]), fill: 'url(#p-flood)', opacity: 0 }, glow), k: 0.75, thr: 0.25 });
  } });

  // the steps: a landing in the recess, four treads across the whole front, side walls with
  // pedestals and urns, worn hollows in the treads
  parts.push({ key: I.depth(2, FRONT.cy) + 2, draw: () => {
    const g = el('g', {}, build);
    const s0 = box(g, I, [-recess, fy0 + 7, 0], [0, fy1 - 7, 1.2], PEN * 0.6);
    surface(s0.top, '#e5dac2', [0, 0, 1]); surface(s0.right, '#cfc1a2', [1, 0, 0]); surface(s0.left, '#cfc1a2', [0, 1, 0]);
    for (let i = 0; i < 4; i++) {
      const s = box(g, I, [0, fy0 - 1, 0], [4 - i, fy1 + 1, (i + 1) * 0.3], PEN * 0.6);
      surface(s.left, '#cfc1a2', [0, 1, 0]); surface(s.right, '#c9ba99', [1, 0, 0]); surface(s.top, '#e5dac2', [0, 0, 1]);
      // nosing line and a worn, paler hollow in the middle of each tread
      path(g, I.poly([[3.85 - i, fy0 - 1, (i + 1) * 0.3], [3.85 - i, fy1 + 1, (i + 1) * 0.3]], true), { 'stroke-width': 0.35, opacity: 0.6 });
      const hg = planeGroup(g, I.ground((i + 1) * 0.3));
      surface(el('path', { d: `M${3.1 - i} ${FRONT.cy - 3} Q${3.5 - i} ${FRONT.cy} ${3.1 - i} ${FRONT.cy + 3} Q${3.7 - i} ${FRONT.cy} ${3.1 - i} ${FRONT.cy - 3}Z`, stroke: 'none', opacity: 0.6 }, hg), '#f0e8d6', [0, 0, 1]);
    }
    for (const y of [fy0 - 1.6, fy1 + 1]) {
      const cw = box(g, I, [0, y, 0], [4.4, y + 0.6, 1.5], PEN * 0.6);
      surface(cw.left, stone2, [0, 1, 0]); surface(cw.right, stone, [1, 0, 0]); surface(cw.top, '#e5dac2', [0, 0, 1]);
      const pd = box(g, I, [3.7, y - 0.15, 0], [4.6, y + 0.75, 1.9], PEN * 0.6);
      surface(pd.left, stone2, [0, 1, 0]); surface(pd.right, stone, [1, 0, 0]); surface(pd.top, '#e5dac2', [0, 0, 1]);
      const c = I.p(4.15, y + 0.3, 1.9);
      surface(el('path', { d: `M${f(c[0] - 3)} ${f(c[1])} Q${f(c[0] - 4.4)} ${f(c[1] - 4)} ${f(c[0] - 2)} ${f(c[1] - 6)} L${f(c[0] - 1.2)} ${f(c[1] - 7.4)} L${f(c[0] + 1.2)} ${f(c[1] - 7.4)} L${f(c[0] + 2)} ${f(c[1] - 6)} Q${f(c[0] + 4.4)} ${f(c[1] - 4)} ${f(c[0] + 3)} ${f(c[1])}Z`, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), stone, [0.7, 0.7, 0]);
      path(g, `M${f(c[0])} ${f(c[1] - 7.4)} L${f(c[0])} ${f(c[1] - 9.6)}`, { 'stroke-width': PEN });
    }
  } });

  parts.sort((a, b) => a.key - b.key).forEach((p) => p.draw());

  const bellsApi = { poke() { bells.forEach((b, i) => (b.v += 2.4 * (i % 2 ? -1 : 1))); } };
  live.push((t, dt, wind, P, tau) => {
    bells.forEach((b) => { b.v += (-b.a * 7 - b.v * 0.6) * dt; b.a += b.v * dt; b.g.setAttribute('transform', `translate(${f(b.u)} -28.2) rotate(${f(b.a * 57.3)})`); });
    if (clockHands) { const hrs = tau * 24, ha = ((hrs % 12) / 12) * Math.PI * 2, ma = ((hrs * 60) % 60) / 60 * Math.PI * 2; clockHands.setAttribute('d', `M3.5 -20 L${f(3.5 + Math.sin(ha) * 0.75)} ${f(-20 - Math.cos(ha) * 0.75)} M3.5 -20 L${f(3.5 + Math.sin(ma) * 1.1)} ${f(-20 - Math.cos(ma) * 1.1)}`); }
    for (const l of groundLights) l.n.setAttribute('opacity', f(smooth(l.thr, l.thr + 0.25, P.lamp) * l.k));
    veil.setAttribute('opacity', f(P.inkT * 0.62));
  });
  return { casters, live, bells: bellsApi, groundLights };
}

// ------------------------------------------------------------------ square furniture (depth-sorted with people)
export interface Prop { key: number; g: SVGGElement; draw?: (t: number, dt: number, wind: number, P: Palette, tau: number) => void; shadow?: (sun: Sun) => string; hit?: Element }

export function buildProps(I: Iso, layer: Element, glow: Element, defs: Element): Prop[] {
  const props: Prop[] = [];
  const add = (x: number, y: number, fn: (g: SVGGElement) => Partial<Prop>) => { const g = el('g', {}, layer); const p = { key: I.depth(x, y), g, ...fn(g) }; props.push(p as Prop); return p as Prop; };
  const k = I.s / 6.5;   // px scale relative to the wide view
  const pw = (px: number) => M(px, I);

  // stone posts along the foot of the steps, iron chains swinging between them
  const posts: number[] = [];
  for (let y = FRONT.y0 - 0.6; y <= FRONT.y1 + 0.7; y += 2.4) posts.push(y);
  posts.forEach((y, i) => add(4.75, y, (g) => {
    const b = box(g, I, [4.58, y - 0.17, 0], [4.92, y + 0.17, 0.9], PEN * 0.6);
    surface(b.left, '#cfc1a2', [0, 1, 0]); surface(b.right, '#d8cbad', [1, 0, 0]); surface(b.top, '#e5dac2', [0, 0, 1]);
    surface(el('path', { d: ring(I, 4.75, y, 0.16, 1.02, 16), stroke: 'currentColor', 'stroke-width': PEN * 0.5 }, g), '#d8cbad', [0, 0, 1]);
    const chain = i < posts.length - 1 ? el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.9, 'stroke-dasharray': '1.1 0.7', 'stroke-linecap': 'round' }, g) : null;
    const ph = rnd(0, 6);
    return {
      shadow: (sun) => boxShadow(I, sun, [4.58, y - 0.17, 0], [4.92, y + 0.17, 1]),
      draw: chain ? (t, dt, wind) => {
        const y2 = posts[i + 1], sw = (wind * 0.06 + Math.sin(t * 1.4 + ph) * 0.03);
        const pts = [];
        for (let s = 0; s <= 10; s++) { const u = s / 10; pts.push(I.pt(4.75 + sw * 4 * u * (1 - u), y + (y2 - y) * u, 0.82 - 0.38 * 4 * u * (1 - u))); }
        chain.setAttribute('d', 'M' + pts.join('L'));
      } : undefined,
    };
  }));

  // grand iron lamp-posts with three lanterns, either side of the steps
  for (const [x, y] of [[6.6, FRONT.y0 - 0.4], [6.6, FRONT.y1 + 0.4], [30, 25]]) {
    add(x, y, (g) => {
      const b = I.p(x, y, 0), t = I.p(x, y, 4.6);
      el('path', { d: `M${f(b[0] - 3)} ${f(b[1])} L${f(b[0] + 3)} ${f(b[1])} L${f(b[0] + 1.6)} ${f(b[1] - 6)} L${f(b[0] - 1.6)} ${f(b[1] - 6)}Z`, fill: '#2a2a30', stroke: 'currentColor', 'stroke-width': PEN * 0.5 }, g);
      path(g, `M${f(b[0])} ${f(b[1] - 6)} L${f(t[0])} ${f(t[1])} M${f(t[0])} ${f(t[1] + 6)} Q${f(t[0] - 9)} ${f(t[1] + 4)} ${f(t[0] - 10)} ${f(t[1] - 2)} M${f(t[0])} ${f(t[1] + 6)} Q${f(t[0] + 9)} ${f(t[1] + 4)} ${f(t[0] + 10)} ${f(t[1] - 2)} M${f(b[0] - 1)} ${f(b[1] - 14)} q-2 -2 0 -4 M${f(b[0] + 1)} ${f(b[1] - 14)} q2 -2 0 -4`, { 'stroke-width': PEN * 1.2 });
      const heads = [[t[0] - 10, t[1] - 2], [t[0], t[1] - 5], [t[0] + 10, t[1] - 2]];
      const glass = el('path', { d: heads.map(([hx, hy]) => `M${f(hx - 2.2)} ${f(hy - 5.6)} L${f(hx + 2.2)} ${f(hy - 5.6)} L${f(hx + 1.5)} ${f(hy)} L${f(hx - 1.5)} ${f(hy)}Z`).join(' '), stroke: 'currentColor', 'stroke-width': PEN * 0.6 }, g);
      el('path', { d: heads.map(([hx, hy]) => `M${f(hx - 2.8)} ${f(hy - 5.6)} L${f(hx)} ${f(hy - 8)} L${f(hx + 2.8)} ${f(hy - 5.6)}Z M${f(hx - 1.6)} ${f(hy)} L${f(hx + 1.6)} ${f(hy)} L${f(hx)} ${f(hy + 1.6)}Z`).join(' '), fill: 'currentColor' }, g);
      const pg = planeGroup(glow, I.ground());
      const poolN = el('circle', { cx: x, cy: y, r: 6, fill: 'url(#p-pool)', opacity: 0 }, pg);
      const halo = el('circle', { cx: t[0], cy: t[1] - 3, r: 18, fill: 'url(#p-pool)', opacity: 0 }, glow);
      return {
        shadow: (sun) => blobShadow(I, sun, x, y, 0.15, 5),
        draw: (tt, dt, wind, P) => {
          const on = smooth(0.2, 0.45, P.lamp);
          glass.setAttribute('fill', rgb(mix(P.paper, toRGB('#fff1c9'), on)));
          poolN.setAttribute('opacity', f(on * 0.7)); halo.setAttribute('opacity', f(on * 0.6));
        },
      };
    });
  }

  // a small octagonal fountain with a tiled basin
  add(27, 17, (g) => {
    const cx = 27, cy = 17, r = 2.4, oct = (rr: number, z: number) => I.poly(Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, z] as V3; }));
    const sides = [];
    for (let i = 0; i < 8; i++) {
      const a0 = (i / 8) * Math.PI * 2 + Math.PI / 8, a1 = ((i + 1) / 8) * Math.PI * 2 + Math.PI / 8;
      const p0: V3 = [cx + Math.cos(a0) * r, cy + Math.sin(a0) * r, 0], p1: V3 = [cx + Math.cos(a1) * r, cy + Math.sin(a1) * r, 0];
      const n = [(Math.cos(a0) + Math.cos(a1)) / 2, (Math.sin(a0) + Math.sin(a1)) / 2];
      if (n[0] + n[1] > 0) sides.push({ d: I.poly([p0, p1, [p1[0], p1[1], 0.7], [p0[0], p0[1], 0.7]]), n: [n[0], n[1], 0] as V3 });
    }
    sides.forEach((s) => surface(el('path', { d: s.d, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#e9e1cf', s.n));
    const tiles = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 4, px = cx + Math.cos(a) * r * 0.97, py = cy + Math.sin(a) * r * 0.97;
      if (Math.cos(a) + Math.sin(a) > 0) { const q = I.p(px, py, 0.35); tiles.push(`M${f(q[0] - 2)} ${f(q[1])} L${f(q[0])} ${f(q[1] - 2)} L${f(q[0] + 2)} ${f(q[1])} L${f(q[0])} ${f(q[1] + 2)}Z`); }
    }
    tint(el('path', { d: tiles.join(' '), stroke: 'currentColor', 'stroke-width': 0.3 }, g), '#2f6fa8', 0.5);
    surface(el('path', { d: oct(r, 0.7), stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#ddd0b2', [0, 0, 1]);
    tint(el('path', { d: oct(r - 0.3, 0.68), stroke: 'none' }, g), '#9cc3cf', 0.6);
    const ripples = el('path', { fill: 'none', stroke: '#f4f8f8', 'stroke-width': 0.5, opacity: 0.7 }, g);
    surface(el('path', { d: `M${I.pt(cx - 0.25, cy, 0.6)} L${I.pt(cx - 0.2, cy, 1.8)} L${I.pt(cx + 0.2, cy, 1.8)} L${I.pt(cx + 0.25, cy, 0.6)}Z`, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#d6c7a6', [0.7, 0.7, 0]);
    surface(el('path', { d: ring(I, cx, cy, 0.8, 1.8, 24), stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#d6c7a6', [0, 0, 1]);
    const jets = el('path', { fill: 'none', stroke: '#e6f2f6', 'stroke-width': 1.1, 'stroke-linecap': 'round', opacity: 0.9 }, g);
    const jetsInk = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.35, opacity: 0.45 }, g);
    return {
      shadow: (sun) => blobShadow(I, sun, cx, cy, r, 0.7),
      draw(t) {
        const d = [];
        for (let j = 0; j < 6; j++) {
          const a = (j / 6) * Math.PI * 2 + 0.3, s = 0.05 * Math.sin(t * 9 + j);
          const top = I.p(cx, cy, 1.95), mid = I.p(cx + Math.cos(a) * 0.8, cy + Math.sin(a) * 0.8, 2.5 + s), end = I.p(cx + Math.cos(a) * 1.5, cy + Math.sin(a) * 1.5, 0.72);
          d.push(`M${f(top[0])} ${f(top[1])} Q${f(mid[0])} ${f(mid[1])} ${f(end[0])} ${f(end[1])}`);
        }
        jets.setAttribute('d', d.join(' ')); jetsInk.setAttribute('d', d.join(' '));
        const rr = [];
        for (let j = 0; j < 3; j++) rr.push(ring(I, cx, cy, 1 + ((t * 0.5 + j / 3) % 1) * 1.1, 0.69, 32));
        ripples.setAttribute('d', rr.join(' '));
      },
    };
  });

  // orange trees in pits with cast-iron grates
  for (const [x, y] of [[21, 8.5], [33, 8.5], [14, 33.5], [22, 29]]) {
    add(x, y, (g) => {
      const gg = planeGroup(g, I.ground(0.02));
      const grate = [rect(x - 0.9, y - 0.9, x + 0.9, y + 0.9), `M${x + 0.35} ${y} A0.35 0.35 0 1 0 ${x - 0.35} ${y} A0.35 0.35 0 1 0 ${x + 0.35} ${y}Z`];
      for (let a = 0; a < 16; a++) { const an = (a / 16) * Math.PI * 2; grate.push(`M${f(x + Math.cos(an) * 0.4)} ${f(y + Math.sin(an) * 0.4)} L${f(x + Math.cos(an) * 0.85)} ${f(y + Math.sin(an) * 0.85)}`); }
      tint(el('path', { d: grate.join(' '), fill: 'none', 'stroke-width': pw(0.5) }, gg), '#3a3836', 0.3, 'stroke');
      const base = I.p(x, y, 0), top = I.p(x, y, 2.3);
      el('path', { d: `M${f(base[0] - 1.2)} ${f(base[1])} L${f(top[0] - 0.8)} ${f(top[1])} L${f(top[0] + 0.8)} ${f(top[1])} L${f(base[0] + 1.2)} ${f(base[1])}Z`, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g);
      path(g, `M${f(base[0] - 1.1)} ${f(base[1] - 6)} L${f(base[0] + 1.1)} ${f(base[1] - 6)}`, { 'stroke-width': 0.4 });
      const crown = el('g', {}, g);
      const c = I.p(x, y, 3.6), Rr = 2 * I.s;
      const lumps = [];
      for (let i = 0; i <= 48; i++) { const a = (i / 48) * Math.PI * 2; const rr = Rr * (1 + 0.07 * Math.abs(Math.sin(a * 7))); lumps.push(`${f(c[0] + Math.cos(a) * rr)} ${f(c[1] + Math.sin(a) * rr * 0.86)}`); }
      surface(el('path', { d: 'M' + lumps.join('L') + 'Z', stroke: 'currentColor', 'stroke-width': PEN * 0.8 }, crown), '#a8c27e', [0.5, 0.5, 0.7], 0.9);
      const lv = [], fr = [];
      for (let i = 0; i < 60; i++) { const a = rnd(0, 6.28), d = Math.sqrt(rnd(0, 1)) * Rr * 0.88, lx = c[0] + Math.cos(a) * d, ly = c[1] + Math.sin(a) * d * 0.86, r2 = rnd(0, 6.28), L = rnd(2.4, 3.6); lv.push(`M${f(lx)} ${f(ly)} q${f(Math.cos(r2) * L / 2 - Math.sin(r2) * 1)} ${f(Math.sin(r2) * L / 2 + Math.cos(r2) * 1)} ${f(Math.cos(r2) * L)} ${f(Math.sin(r2) * L)} q${f(-Math.cos(r2) * L / 2 - Math.sin(r2) * 1)} ${f(-Math.sin(r2) * L / 2 + Math.cos(r2) * 1)} ${f(-Math.cos(r2) * L)} ${f(-Math.sin(r2) * L)}`); }
      for (let i = 0; i < 16; i++) { const a = rnd(0, 6.28), d = Math.sqrt(rnd(0, 1)) * Rr * 0.78; fr.push(`M${f(c[0] + Math.cos(a) * d + 1.7)} ${f(c[1] + Math.sin(a) * d * 0.86)} a1.7 1.7 0 1 0 -3.4 0 a1.7 1.7 0 1 0 3.4 0Z`); }
      path(crown, lv.join(' '), { 'stroke-width': 0.42 });
      tint(el('path', { d: fr.join(' '), stroke: 'currentColor', 'stroke-width': 0.35 }, crown), '#e8892b', 0.55);
      const ph = rnd(0, 6);
      return { shadow: (sun) => blobShadow(I, sun, x, y, 2, 3.6), draw: (t, dt, wind) => crown.setAttribute('transform', `translate(${f(wind * 0.6 + Math.sin(t * 1.2 + ph) * 0.3)} 0)`) };
    });
  }

  // café terrace in front of the café: round tables, bistro chairs, square parasols
  for (const [x, y] of [[16.5, 2.4], [20, 2.4], [23.5, 2.4], [27, 2.4], [18.2, 5.4], [21.8, 5.4], [25.4, 5.4]]) add(x, y, (g) => {
    const top = I.p(x, y, 0.75);
    path(g, `M${I.pt(x, y, 0)} L${f(top[0])} ${f(top[1])} M${I.pt(x - 0.25, y, 0)} L${I.pt(x + 0.25, y, 0)}`, { 'stroke-width': PEN });
    surface(el('path', { d: ring(I, x, y, 0.4, 0.75, 20), stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#cfd4d6', [0, 0, 1]);
    const pole = I.p(x, y, 2.5);
    path(g, `M${f(top[0])} ${f(top[1])} L${f(pole[0])} ${f(pole[1] - 2)}`, { 'stroke-width': PEN * 0.7 });
    const s = 1.25, ph = rnd(0, 6), canopy = el('g', {}, g), apex: V3 = [x, y, 2.62];
    const c4: V3[] = [[x - s, y - s, 2.25], [x + s, y - s, 2.25], [x + s, y + s, 2.25], [x - s, y + s, 2.25]];
    // back panels first (they are seen from above too), then the two toward the viewer
    for (const [i, j, col] of [[3, 0, '#2f5d4a'], [0, 1, '#f3ecdc'], [1, 2, '#2f5d4a'], [2, 3, '#f3ecdc']] as Array<[number, number, string]>) {
      tint(el('path', { d: I.poly([c4[i], c4[j], apex]), stroke: 'currentColor', 'stroke-width': PEN * 0.6, 'stroke-linejoin': 'round' }, canopy), col, 0.55);
    }
    const hem = [];
    for (const [a, b] of [[c4[3], c4[2]], [c4[2], c4[1]]]) for (let k = 0; k < 4; k++) {
      const p0 = I.p(a[0] + (b[0] - a[0]) * k / 4, a[1] + (b[1] - a[1]) * k / 4, 2.25), p1 = I.p(a[0] + (b[0] - a[0]) * (k + 1) / 4, a[1] + (b[1] - a[1]) * (k + 1) / 4, 2.25);
      hem.push(`M${f(p0[0])} ${f(p0[1])} Q${f((p0[0] + p1[0]) / 2)} ${f((p0[1] + p1[1]) / 2 + 2.4)} ${f(p1[0])} ${f(p1[1])}`);
    }
    tint(path(canopy, hem.join(' '), { 'stroke-width': 1.1 }), '#2f5d4a', 0.55, 'stroke');
    path(canopy, `M${I.pt(x, y, 2.62)} L${I.pt(x, y, 2.9)}`, { 'stroke-width': PEN * 0.8 });
    return { shadow: (sun) => boxShadow(I, sun, [x - s, y - s, 2.1], [x + s, y + s, 2.8]), draw: (t, dt, wind) => canopy.setAttribute('transform', `translate(${f(wind * 0.3 + Math.sin(t * 1.5 + ph) * 0.15)} 0)`) };
  });

  // stone benches, bins, a row of bicycles and a scooter by the ceramics shop
  for (const [x, y] of [[13, 27.6], [25, 30.6]]) add(x, y, (g) => {
    const s = box(g, I, [x - 1.6, y - 0.35, 0], [x + 1.6, y + 0.35, 0.45], PEN * 0.6);
    surface(s.top, '#e3d8bf', [0, 0, 1]); surface(s.left, '#cdbf9f', [0, 1, 0]); surface(s.right, '#cdbf9f', [1, 0, 0]);
    return { shadow: (sun) => boxShadow(I, sun, [x - 1.6, y - 0.35, 0], [x + 1.6, y + 0.35, 0.45]) };
  });
  for (const [x, y] of [[7.4, FRONT.y0 - 1.8], [7.4, FRONT.y1 + 1.8], [29.2, 23.8]]) add(x, y, (g) => {
    const b = I.p(x, y, 0), t = I.p(x, y, 0.9);
    tint(el('path', { d: `M${f(b[0] - 2.6)} ${f(t[1])} L${f(b[0] + 2.6)} ${f(t[1])} L${f(b[0] + 2.2)} ${f(b[1])} L${f(b[0] - 2.2)} ${f(b[1])}Z`, stroke: 'currentColor', 'stroke-width': PEN * 0.6 }, g), '#4f6b55', 0.5);
    path(g, `M${f(b[0] - 2.4)} ${f(t[1] + 2.4)} L${f(b[0] + 2.4)} ${f(t[1] + 2.4)}`, { 'stroke-width': 0.4 });
    return {};
  });
  const bike = (x: number, y: number, colour: string) => add(x, y, (g) => {
    const w1 = I.p(x - 0.55, y, 0.33), w2 = I.p(x + 0.55, y, 0.33), R = 0.33 * I.s;
    path(g, `M${f(w1[0] + R)} ${f(w1[1])} A${f(R)} ${f(R)} 0 1 0 ${f(w1[0] - R)} ${f(w1[1])} A${f(R)} ${f(R)} 0 1 0 ${f(w1[0] + R)} ${f(w1[1])} M${f(w2[0] + R)} ${f(w2[1])} A${f(R)} ${f(R)} 0 1 0 ${f(w2[0] - R)} ${f(w2[1])} A${f(R)} ${f(R)} 0 1 0 ${f(w2[0] + R)} ${f(w2[1])}`, { 'stroke-width': PEN * 0.7 });
    const seat = I.p(x - 0.2, y, 0.9), bar = I.p(x + 0.45, y, 0.95), bb = I.p(x, y, 0.32);
    tint(path(g, `M${f(w1[0])} ${f(w1[1])} L${f(bb[0])} ${f(bb[1])} L${f(seat[0])} ${f(seat[1])} L${f(w1[0])} ${f(w1[1])} M${f(bb[0])} ${f(bb[1])} L${f(bar[0])} ${f(bar[1])} L${f(w2[0])} ${f(w2[1])} M${f(seat[0])} ${f(seat[1])} L${f(bar[0] - 1)} ${f(bar[1] + 1)}`, { 'stroke-width': PEN * 0.8 }), colour, 0.5, 'stroke');
    path(g, `M${f(seat[0] - 1)} ${f(seat[1] - 0.6)} L${f(seat[0] + 1.2)} ${f(seat[1] - 0.6)} M${f(bar[0] - 1)} ${f(bar[1] - 1.4)} L${f(bar[0] + 1.4)} ${f(bar[1] - 1.6)}`, { 'stroke-width': PEN });
    return { shadow: (sun) => blobShadow(I, sun, x, y, 0.5, 0.6) };
  });
  bike(2.6, 29.6, '#c8463a'); bike(2.6, 31.2, '#2c4a73'); bike(2.6, 32.8, '#3e6b52');
  add(18, 36.4, (g) => {
    // a scooter parked at an angle
    const b = I.p(18, 36.4, 0), s = k;
    tint(el('path', { d: `M${f(b[0] - 7 * s)} ${f(b[1] - 3 * s)} Q${f(b[0] - 7.5 * s)} ${f(b[1] - 7.4 * s)} ${f(b[0] - 3.4 * s)} ${f(b[1] - 7.2 * s)} L${f(b[0] + 1 * s)} ${f(b[1] - 6.6 * s)} Q${f(b[0] + 3 * s)} ${f(b[1] - 6 * s)} ${f(b[0] + 3.6 * s)} ${f(b[1] - 3 * s)}Z M${f(b[0] + 3 * s)} ${f(b[1] - 3 * s)} L${f(b[0] + 5.4 * s)} ${f(b[1] - 10 * s)} L${f(b[0] + 6.6 * s)} ${f(b[1] - 10 * s)} L${f(b[0] + 6 * s)} ${f(b[1] - 3 * s)}Z`, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g), '#9cc3b0', 0.55);
    path(g, `M${f(b[0] - 5 * s + 2 * s)} ${f(b[1] - 1.6 * s)} A${f(1.6 * s)} ${f(1.6 * s)} 0 1 0 ${f(b[0] - 5 * s - 2 * s + 0.8 * s)} ${f(b[1] - 1.6 * s)} A${f(1.6 * s)} ${f(1.6 * s)} 0 1 0 ${f(b[0] - 5 * s + 2 * s)} ${f(b[1] - 1.6 * s)} M${f(b[0] + 6.8 * s)} ${f(b[1] - 1.6 * s)} A${f(1.6 * s)} ${f(1.6 * s)} 0 1 0 ${f(b[0] + 3.6 * s)} ${f(b[1] - 1.6 * s)} A${f(1.6 * s)} ${f(1.6 * s)} 0 1 0 ${f(b[0] + 6.8 * s)} ${f(b[1] - 1.6 * s)} M${f(b[0] + 4.6 * s)} ${f(b[1] - 10 * s)} L${f(b[0] + 7.6 * s)} ${f(b[1] - 10.6 * s)} M${f(b[0] - 5 * s)} ${f(b[1] - 7.4 * s)} L${f(b[0] - 1 * s)} ${f(b[1] - 7.6 * s)}`, { 'stroke-width': PEN * 0.8 });
    return { shadow: (sun) => blobShadow(I, sun, 18, 36.4, 0.6, 0.9) };
  });
  return props;
}
