// The street: four Andalusian houses and a callejón under an arch, drawn once, plus
// the parts that live: windows that light, strip curtains and an awning in the wind,
// iron lanterns, a canary in its cage, shutters someone opens, orange trees that drop
// their fruit, and the bells in the espadaña.
import { el, pen, shape, blot, f, pt, limb, solid, PAPER } from '../../lib/ink.ts';
import { BASE, SP, srnd, rnd, lerp, clamp, smooth, ease, oval, rgb, hex, mix } from './kit.ts';

const SERIF = '"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif';
const CLAY = '#ecbf9c', TERRACOTTA = '#bf6a43', BLUE = '#2f5d9a', GREEN = '#3e6b52', ALBERO = '#e8c87c',
  GERANIUM = '#c8463a', ORANGE = '#e8892b', BRONZE = '#a67f3f', WOOD = '#7a5236', CASK = '#c09062',
  CANARY = '#f1c93a', HAM = '#9b4a35', TILE = '#f4efe2', BREAD = '#d6a35c';
const WARM = hex('#ffcf7e');
const NIGHT = [12, 16, 30];

// ------------------------------------------------------------------ drawing kit
const P = (g, d, w = SP) => { const n = pen(g, w); n.setAttribute('d', d); return n; };
const S = (g, d, w = SP) => { const n = shape(g, w); n.setAttribute('d', d); return n; };
const B = (g, d) => { const n = blot(g); n.setAttribute('d', d); return n; };
const rect = (x0, y0, x1, y1) => `M${x0} ${y0} L${x1} ${y0} L${x1} ${y1} L${x0} ${y1}Z`;

// Every flat colour registers here, so applyRed() can push it toward the night palette.
const tinted = [];
const tint = (n, c, k = 0.55, attr = 'fill') => { tinted.push({ n, c: hex(c), k, attr }); n.setAttribute(attr, c); return n; };
const paint = (g, c, d, w = SP) => tint(el('path', { d, fill: c, stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g), c);

function text(g, x, y, s, size, { weight = 600, anchor = 'middle', fill = 'currentColor', italic = false, spacing = 0 } = {}) {
  const n = el('text', { x, y, 'font-size': size, 'font-family': SERIF, 'font-weight': weight, 'text-anchor': anchor, 'dominant-baseline': 'central' }, g);
  if (italic) n.setAttribute('font-style', 'italic');
  if (spacing) n.setAttribute('letter-spacing', spacing);
  if (fill === 'currentColor') n.setAttribute('fill', fill); else tint(n, fill, 0.2);
  n.textContent = s;
  return n;
}

/** Low roof of curved clay tiles (teja árabe) seen from the street: cover and channel tiles
 *  end-on along the eave, courses overlapping up to a ridge of cap tiles, a whitewashed cornice. */
function tejado(g, { x0, x1, eave, ridge, tile = 4.6, inset = 7 }) {
  paint(g, CLAY, `M${x0} ${eave} L${x1} ${eave} L${x1 - inset} ${ridge} L${x0 + inset} ${ridge}Z`);
  const span = x1 - x0, h = eave - ridge, half = tile / 2;
  const rowX = (x, y) => lerp(x, lerp(x0 + inset, x1 - inset, (x - x0) / span), (eave - y) / h);
  const lines = [], courses = [];
  let wave = `M${x0 + 1} ${eave}`;
  for (let x = x0 + 1; x < x1 - tile; x += tile) {
    wave += ` Q${f(x + half / 2)} ${f(eave - 2.4)} ${f(x + half)} ${eave} Q${f(x + half * 1.5)} ${f(eave + 0.9)} ${f(x + tile)} ${eave}`;
    lines.push(`M${f(x)} ${eave - 0.4} L${f(rowX(x, ridge + 1))} ${ridge + 1}`, `M${f(x + half)} ${eave - 0.4} L${f(rowX(x + half, ridge + 1))} ${ridge + 1}`);
    for (let y = eave - 3.8; y > ridge + 2; y -= 3.8) {
      const a = rowX(x, y), b = rowX(x + half, y);
      courses.push(`M${f(a)} ${f(y)} Q${f((a + b) / 2)} ${f(y - 1.3)} ${f(b)} ${f(y)}`);
    }
  }
  P(g, lines.join(' '), SP * 0.38);
  P(g, courses.join(' '), SP * 0.38);
  P(g, wave, SP * 0.7);
  S(g, rect(x0 + inset - 3, ridge - 3, x1 - inset + 3, ridge + 0.6), SP * 0.8);
  const caps = [];
  for (let x = x0 + inset - 3; x < x1 - inset; x += 5) caps.push(`M${f(x)} ${ridge - 0.4} Q${f(x + 2.5)} ${ridge - 3.6} ${f(x + 5)} ${ridge - 0.4}`);
  P(g, caps.join(' '), SP * 0.45);
  S(g, rect(x0 + 3, eave, x1 - 3, eave + 3.4), SP * 0.8);
  P(g, `M${x0 + 6} ${eave + 5.4} L${x1 - 6} ${eave + 5.4}`, SP * 0.5);
}

/** Whitewashed wall with an albero-painted plinth (zócalo). */
const washes = [];
const wash = (n, c, k) => { washes.push({ n, c: hex(c), k }); return n; };
function muro(g, x0, y0, x1, colour = '#fbf5e6', k = 0.35) {
  wash(S(g, rect(x0, y0, x1, BASE)), colour, k);
  paint(g, ALBERO, rect(x0, BASE - 11, x1, BASE), SP * 0.7);
}

/** Green louvred shutter leaf. */
function louvred(g, x0, y0, x1, y1, colour = GREEN) {
  paint(g, colour, rect(x0, y0, x1, y1), SP * 0.7);
  const d = [rect(x0 + 1.3, y0 + 1.3, x1 - 1.3, y1 - 1.3)];
  for (let y = y0 + 3.4; y < y1 - 2; y += 2.4) d.push(`M${f(x0 + 1.3)} ${f(y)} L${f(x1 - 1.3)} ${f(y)}`);
  P(g, d.join(' '), SP * 0.35);
}

/** Wall pot with geraniums. Standing on y, or hanging from a nail at y. */
function maceta(g, x, y, { hang = false, colour = BLUE, s = 1, trail = false } = {}) {
  const top = hang ? y + 3 : y - 5.4 * s, bot = top + 5.4 * s;
  if (hang) P(g, `M${x} ${y - 1} L${x} ${top}`, SP * 0.5);
  P(g, `M${f(x - 3.2 * s)} ${f(top)} q-1 -3 1 -4.6 M${f(x + 3.2 * s)} ${f(top)} q1 -3 -1 -4.6 M${x} ${f(top)} q0 -4 1.6 -6`, SP * 0.5);
  if (trail) P(g, `M${f(x - 3 * s)} ${f(bot - 1)} q-2 4 0 8 q1 2 -0.6 4 M${f(x + 3 * s)} ${f(bot - 1)} q2 5 -0.6 9`, SP * 0.45);
  paint(g, colour, `M${f(x - 3.8 * s)} ${f(top)} L${f(x + 3.8 * s)} ${f(top)} L${f(x + 2.8 * s)} ${f(bot)} L${f(x - 2.8 * s)} ${f(bot)}Z`, SP * 0.7);
  P(g, `M${f(x - 3.6 * s)} ${f(top + 1.4 * s)} L${f(x + 3.6 * s)} ${f(top + 1.4 * s)}`, SP * 0.35);
  const spots = [[-2.6, -4.2], [1.2, -6.2], [3, -3.6], [-0.6, -2.6]].slice(0, srnd(0, 1) < 0.5 ? 3 : 4);
  paint(g, GERANIUM, spots.map(([dx, dy]) => oval(x + dx * s, top + dy * s, 1.6 * s, 1.4 * s)).join(' '), SP * 0.4);
}

/** Projecting iron window grille: bars, two cross rails, a crest of C-scrolls, a sill with pots. */
function reja(g, x0, y0, x1, y1, pots = 0) {
  const d = [rect(x0, y0, x1, y1)];
  for (let x = x0 + 4.2; x < x1 - 1.5; x += 4.2) d.push(`M${f(x)} ${y0} L${f(x)} ${y1}`);
  [0.3, 0.7].forEach((k) => { const y = f(lerp(y0, y1, k)); d.push(`M${x0} ${y} L${x1} ${y}`); });
  const n = Math.max(1, Math.round((x1 - x0) / 14));
  for (let i = 0; i < n; i++) {
    const cx = lerp(x0, x1, (i + 0.5) / n);
    d.push(`M${f(cx - 5)} ${y0} Q${f(cx - 5.4)} ${f(y0 - 5)} ${f(cx - 1.6)} ${f(y0 - 5)} Q${f(cx - 0.2)} ${f(y0 - 4.6)} ${f(cx - 0.8)} ${f(y0 - 3)}`,
      `M${f(cx + 5)} ${y0} Q${f(cx + 5.4)} ${f(y0 - 5)} ${f(cx + 1.6)} ${f(y0 - 5)} Q${f(cx + 0.2)} ${f(y0 - 4.6)} ${f(cx + 0.8)} ${f(y0 - 3)}`);
  }
  P(g, d.join(' '), SP * 0.55);
  S(g, rect(x0 - 2.4, y1, x1 + 2.4, y1 + 2.4), SP * 0.7);
  for (let i = 0; i < pots; i++) maceta(g, lerp(x0 + 6, x1 - 6, pots > 1 ? i / (pots - 1) : 0.5), y1);
}

/** Balcony: a thin slab on iron brackets with a railing of balusters and a band of rings. */
function balcon(g, x0, x1, y, h = 16) {
  S(g, `M${x0 - 3} ${y} L${x1 + 3} ${y} L${x1 + 1.4} ${y + 3.4} L${x0 - 1.4} ${y + 3.4}Z`, SP * 0.8);
  P(g, `M${x0 + 3} ${y + 3.4} q0 4.6 3.6 5.4 M${x1 - 3} ${y + 3.4} q0 4.6 -3.6 5.4`, SP * 0.6);
  const d = [`M${x0} ${y - h} L${x1} ${y - h} M${x0} ${y - h + 3} L${x1} ${y - h + 3} M${x0} ${y - 1.2} L${x1} ${y - 1.2}`];
  for (let x = x0; x <= x1 + 0.1; x += 3.6) d.push(`M${f(x)} ${f(y - h + 3)} L${f(x)} ${f(y - 1.2)}`);
  for (let x = x0 + 1.8; x < x1; x += 3.6) d.push(`M${f(x + 1.1)} ${f(y - h + 1.5)} a1.1 1.1 0 1 0 0.1 0`);
  P(g, d.join(' '), SP * 0.5);
}

// ------------------------------------------------------------------ signs
// One family, as on a real Andalusian street: hand-painted glazed tiles (azulejos) in
// cobalt and ochre on a cream glaze, laid on a true tile grid with grout lines showing
// through the paint, and lettering from the same sign-painter's hand: small capitals
// for names, an italic for the secondary line. The bakery's sign is painted straight
// onto the whitewash instead, in the same colours and hand.
const GLAZE = '#f3ecda', COBALT = '#264d92', OCHRE = '#d39532', OCHRE_DEEP = '#9a6418';
const CAPS = '"IM Fell English SC","Iowan Old Style",Palatino,Georgia,serif';
const ITAL = '"IM Fell English","Iowan Old Style",Palatino,Georgia,serif';

function lettering(g, x, y, s, size, { font = CAPS, fill = COBALT, k = 0.25, italic = false, spacing = 0, weight = 400 } = {}) {
  const n = el('text', { x: f(x), y: f(y), 'font-size': size, 'font-family': font, 'font-weight': weight, 'text-anchor': 'middle', 'dominant-baseline': 'central' }, g);
  if (italic) n.setAttribute('font-style', 'italic');
  if (spacing) n.setAttribute('letter-spacing', spacing);
  tint(n, fill, k);
  n.textContent = s;
  return n;
}

/** A four-petalled tile flower, the commonest corner motif. */
const rosette = (cx, cy, r) => [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => oval(cx + dx * r * 0.55, cy + dy * r * 0.55, r * 0.42, r * 0.42)).join(' ');

/** A tiled panel: cols × rows tiles of side T, glaze varying slightly tile to tile, a painted
 *  border (cobalt corner tiles with an ochre flower, cobalt and ochre bands between them) or a
 *  plain double rule. Call the returned grout() after painting the content. */
function tiled(g, x0, y0, cols, rows, T, { frame = 'corners' } = {}) {
  const x1 = x0 + cols * T, y1 = y0 + rows * T;
  tint(el('path', { d: rect(f(x0), f(y0), f(x1), f(y1)), stroke: 'currentColor', 'stroke-width': SP * 0.6 }, g), GLAZE, 0.62);
  const shade = [];
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) if (srnd(0, 1) < 0.3) shade.push(rect(f(x0 + c * T + 0.2), f(y0 + r * T + 0.2), f(x0 + (c + 1) * T - 0.2), f(y0 + (r + 1) * T - 0.2)));
  tint(el('path', { d: shade.join(' '), opacity: 0.4 }, g), '#e3d4b2', 0.62);
  if (frame === 'corners') {
    const b = T * 0.34;
    const band = (inset, w) => `${rect(f(x0 + inset), f(y0 + inset), f(x1 - inset), f(y1 - inset))} ${rect(f(x0 + inset + w), f(y0 + inset + w), f(x1 - inset - w), f(y1 - inset - w))}`;
    tint(el('path', { d: band(0.5, b), 'fill-rule': 'evenodd' }, g), COBALT, 0.25);
    tint(el('path', { d: band(0.5 + b + 0.35, 0.55), 'fill-rule': 'evenodd' }, g), OCHRE, 0.3);
    const corners = [[x0, y0], [x1 - T, y0], [x0, y1 - T], [x1 - T, y1 - T]];
    tint(el('path', { d: corners.map(([cx, cy]) => rect(f(cx + 0.5), f(cy + 0.5), f(cx + T - 0.5), f(cy + T - 0.5))).join(' ') }, g), COBALT, 0.25);
    tint(el('path', { d: corners.map(([cx, cy]) => rosette(cx + T / 2, cy + T / 2, T * 0.42)).join(' ') }, g), OCHRE, 0.3);
    tint(el('path', { d: corners.map(([cx, cy]) => oval(cx + T / 2, cy + T / 2, T * 0.1, T * 0.1)).join(' ') }, g), GLAZE, 0.62);
  } else {
    tint(el('path', { d: `${rect(f(x0 + 0.7), f(y0 + 0.7), f(x1 - 0.7), f(y1 - 0.7))} ${rect(f(x0 + 1.5), f(y0 + 1.5), f(x1 - 1.5), f(y1 - 1.5))}`, fill: 'none', 'stroke-width': 0.42 }, g), COBALT, 0.25, 'stroke');
    tint(el('path', { d: [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([cx, cy]) => oval(cx + (cx === x0 ? 2.6 : -2.6), cy + (cy === y0 ? 2.6 : -2.6), 0.75, 0.75)).join(' ') }, g), OCHRE, 0.3);
  }
  return {
    x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2,
    grout() {
      const d = [];
      for (let c = 1; c < cols; c++) d.push(`M${f(x0 + c * T)} ${f(y0)} L${f(x0 + c * T)} ${f(y1)}`);
      for (let r = 1; r < rows; r++) d.push(`M${f(x0)} ${f(y0 + r * T)} L${f(x1)} ${f(y0 + r * T)}`);
      tint(el('path', { d: d.join(' '), fill: 'none', 'stroke-width': 0.22, opacity: 0.75 }, g), '#a99d84', 0.3, 'stroke');
    },
  };
}

/** Bodega: a long tiled panel — the name in capitals between bunches of grapes, the trade below. */
function signBodega(g, x, y) {
  const p = tiled(g, x, y, 13, 5, 4.4);
  lettering(g, p.cx, p.y0 + 9.4, 'Bodega', 9.2, { spacing: 0.9 });
  lettering(g, p.cx, p.y0 + 16.2, 'vinos de Jerez · 1924', 3.6, { font: ITAL, italic: true, fill: OCHRE_DEEP });
  const grapes = (gx, gy, s) => {
    const berries = [[0, 0], [2, 0], [4, 0], [1, 1.8], [3, 1.8], [2, 3.6]].map(([dx, dy]) => oval(gx + (dx - 2) * s * 0.55, gy + dy * s * 0.55, s * 0.55, s * 0.55));
    tint(el('path', { d: berries.join(' '), stroke: 'currentColor', 'stroke-width': 0.2 }, g), '#5b3a7a', 0.25);
    tint(el('path', { d: `M${f(gx)} ${f(gy - 0.4)} q-0.6 -1.6 0.6 -2.6 M${f(gx + 0.2)} ${f(gy - 1.8)} q1.6 -1.6 3.2 -0.6 q-1.4 1.4 -3.2 0.6Z`, fill: 'none', 'stroke-width': 0.5 }, g), '#4f7a3a', 0.3, 'stroke');
  };
  grapes(p.x0 + 8.2, p.cy - 2.4, 1.15); grapes(p.x1 - 8.2, p.cy - 2.4, 1.15);
  p.grout();
}

/** Bar: a tiled panel with the name in the italic hand, a branch of oranges at each end. */
function signBar(g, x, y) {
  const p = tiled(g, x, y, 19, 4, 4.3);
  lettering(g, p.cx, p.cy - 0.6, 'Bar El Naranjo', 7.4, { font: ITAL, italic: true });
  const fruit = (fx, dir) => {
    tint(el('path', { d: `M${f(fx - dir * 2.6)} ${f(p.cy - 3)} q${f(dir * 2.4)} -1.6 ${f(dir * 4.6)} -0.4 q${f(-dir * 2)} 1.8 ${f(-dir * 4.6)} 0.4Z`, stroke: 'currentColor', 'stroke-width': 0.2 }, g), '#4f7a3a', 0.3);
    tint(el('path', { d: `${oval(fx, p.cy + 0.6, 1.9, 1.9)} ${oval(fx + dir * 3.2, p.cy + 1.6, 1.6, 1.6)}`, stroke: 'currentColor', 'stroke-width': 0.22 }, g), ORANGE, 0.3);
  };
  fruit(p.x0 + 8.6, 1); fruit(p.x1 - 8.6, -1);
  p.grout();
}

/** Street-name plaque, the Seville way: "Calle" small and italic, the name in capitals, a painted sun. */
function signCalle(g, x, y) {
  const p = tiled(g, x, y, 9, 3, 4.4, { frame: 'rule' });
  lettering(g, p.cx + 3, p.y0 + 4.4, 'Calle', 3.2, { font: ITAL, italic: true });
  lettering(g, p.cx + 3, p.y0 + 9, 'del Sol', 5.4, { spacing: 0.4 });
  const sx = p.x0 + 6.4, sy = p.cy, rays = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; rays.push(`M${f(sx + Math.cos(a) * 2.3)} ${f(sy + Math.sin(a) * 2.3)} L${f(sx + Math.cos(a) * (k % 2 ? 3.2 : 3.8))} ${f(sy + Math.sin(a) * (k % 2 ? 3.2 : 3.8))}`); }
  tint(el('path', { d: rays.join(' '), fill: 'none', 'stroke-width': 0.45, 'stroke-linecap': 'round' }, g), OCHRE, 0.3, 'stroke');
  tint(el('path', { d: oval(sx, sy, 1.9, 1.9), stroke: 'currentColor', 'stroke-width': 0.25 }, g), OCHRE, 0.3);
  p.grout();
}

/** House number: four tiles, a cobalt ring, the numeral. */
function signNumber(g, x, y, num) {
  const p = tiled(g, x, y, 1, 1, 11, { frame: 'rule' });
  tint(el('path', { d: oval(p.cx, p.cy, 3.9, 3.9), fill: 'none', 'stroke-width': 0.4 }, g), COBALT, 0.25, 'stroke');
  lettering(g, p.cx, p.cy + 0.4, num, 7.6);
  p.grout();
}

/** The bakery's name painted straight onto the whitewash: shadowed capitals between rules,
 *  sheaves of wheat at either end, the oven's boast underneath. */
function signPainted(g, cx, y) {
  lettering(g, cx + 0.5, y + 0.5, 'Panadería', 9.4, { fill: OCHRE, k: 0.5, spacing: 1 });
  lettering(g, cx, y, 'Panadería', 9.4, { k: 0.4, spacing: 1 });
  lettering(g, cx, y + 7.8, '— horno de leña —', 3.9, { font: ITAL, italic: true, fill: OCHRE_DEEP, k: 0.45 });
  tint(el('path', { d: `M${cx - 38} ${y - 6.6} L${cx + 38} ${y - 6.6} M${cx - 30} ${y + 4.6} L${cx + 30} ${y + 4.6}`, fill: 'none', 'stroke-width': 0.4 }, g), COBALT, 0.4, 'stroke');
  const wheat = (wx, dir) => {
    tint(el('path', { d: `M${wx} ${y + 5} Q${f(wx + dir * 1.4)} ${y} ${f(wx + dir * 0.6)} ${y - 6.4}`, fill: 'none', 'stroke-width': 0.45 }, g), OCHRE_DEEP, 0.45, 'stroke');
    const grains = [];
    for (let k = 0; k < 5; k++) { const gy = y - 5.4 + k * 1.8, gx = wx + dir * (0.7 - k * 0.12); grains.push(`M${f(gx)} ${f(gy)} q-1.6 -0.2 -2.2 -1.2 q1.4 -0.2 2.2 1.2Z M${f(gx)} ${f(gy + 0.3)} q1.6 -0.2 2.2 -1.2 q-1.4 -0.2 -2.2 1.2Z`); }
    tint(el('path', { d: grains.join(' '), stroke: 'currentColor', 'stroke-width': 0.15 }, g), OCHRE, 0.45);
  };
  wheat(cx - 41.5, 1); wheat(cx + 41.5, -1);
}

/** A window pane: glass with a sky reflection by day; after dark, a small room behind it,
 *  lit by its own lamp (a pendant or a table lamp) with the light falling off into warm
 *  shadow, a piece of furniture in silhouette, now and then someone crossing the room,
 *  and in a few homes the blue flicker of a television. Ground-floor openings also
 *  spill light onto the pavement. Drawn first; bars and grilles go on top. */
let DEFS = null, paneId = 0;
const GLASS = hex('#b7cdd8'), NIGHT_GLASS = hex('#060912');
function pane(g, glowG, x0, y0, x1, y1, { thr = srnd(0.15, 0.6), lateOff = srnd(0, 1) < 0.45 ? srnd(0.93, 1.12) : 9, warmth = srnd(0, 1), d = null, room = 'home' } = {}) {
  const shapeD = d || rect(x0, y0, x1, y1);
  const W = x1 - x0, H = y1 - y0, id = `v-room-${paneId++}`;
  const n = el('path', { d: shapeD, fill: PAPER }, g);
  const clip = el('clipPath', { id: id + '-c' }, DEFS);
  el('path', { d: shapeD }, clip);
  const inner = el('g', { 'clip-path': `url(#${id}-c)`, opacity: 0 }, g);
  const pendant = room !== 'home' || srnd(0, 1) < 0.55;
  const lampXs = room === 'shop' && W > 60 ? [x0 + W * 0.27, x0 + W * 0.73] : [x0 + W * srnd(0.3, 0.7)];
  const lampY = pendant ? y0 + Math.min(H * 0.3, 12) : y1 - Math.min(H * 0.42, 14);
  const light = mix(hex('#ffeec4'), hex('#f2a24c'), warmth);
  const grad = el('radialGradient', { id, gradientUnits: 'userSpaceOnUse', cx: f((lampXs[0] + lampXs[lampXs.length - 1]) / 2), cy: f(lampY), r: f(Math.max(W * (lampXs.length > 1 ? 0.7 : 0.95), H * 0.95)) }, DEFS);
  el('stop', { offset: 0, 'stop-color': rgb(mix(hex('#fff0cc'), light, 0.3)) }, grad);
  el('stop', { offset: 0.16, 'stop-color': rgb(mix(light, hex('#6b3a22'), 0.12)) }, grad);
  el('stop', { offset: 0.55, 'stop-color': rgb(mix(light, hex('#5a2f1a'), 0.62)) }, grad);
  el('stop', { offset: 1, 'stop-color': '#24140c' }, grad);
  el('path', { d: rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1), fill: `url(#${id})` }, inner);
  // the room's things, backlit
  const fd = [], fl = [];
  if (room === 'home') {
    if (H > 24 && W > 20) { const px = x0 + W * srnd(0.15, 0.5), py = y0 + H * 0.22; fl.push(rect(f(px), f(py), f(px + W * 0.3), f(py + H * 0.2))); }
    const kind = srnd(0, 1);
    if (kind < 0.35) { // sofa back with a cushion
      const a = x0 + W * 0.08, b = x0 + W * 0.8, top = y1 - H * 0.3;
      fd.push(`M${f(a)} ${y1 + 1} L${f(a)} ${f(top + 3)} Q${f(a)} ${f(top)} ${f(a + 3)} ${f(top)} L${f(b - 3)} ${f(top)} Q${f(b)} ${f(top)} ${f(b)} ${f(top + 3)} L${f(b)} ${y1 + 1}Z`);
      fl.push(`M${f(a + W * 0.12)} ${f(top + 1.6)} q${f(W * 0.08)} -2.6 ${f(W * 0.16)} 0`);
    } else if (kind < 0.7) { // bookcase against one side, shelves catching the light
      const bx = srnd(0, 1) < 0.5 ? x0 - 1 : x1 - W * 0.32, bw = W * 0.33, top = y0 + H * 0.18;
      fd.push(rect(f(bx), f(top), f(bx + bw), y1 + 1));
      for (let y = top + 4; y < y1; y += 5.2) fl.push(`M${f(bx + 1.2)} ${f(y)} L${f(bx + bw - 1.2)} ${f(y)}`);
    } else { // table and a chair
      const tx = x0 + W * srnd(0.25, 0.55), ty = y1 - H * 0.26;
      fd.push(`M${f(tx - W * 0.2)} ${f(ty)} L${f(tx + W * 0.2)} ${f(ty)} L${f(tx + W * 0.2)} ${f(ty + 1.4)} L${f(tx + W * 0.16)} ${f(ty + 1.4)} L${f(tx + W * 0.16)} ${y1 + 1} L${f(tx + W * 0.13)} ${y1 + 1} L${f(tx + W * 0.13)} ${f(ty + 1.4)} L${f(tx - W * 0.13)} ${f(ty + 1.4)} L${f(tx - W * 0.13)} ${y1 + 1} L${f(tx - W * 0.16)} ${y1 + 1} L${f(tx - W * 0.16)} ${f(ty + 1.4)} L${f(tx - W * 0.2)} ${f(ty + 1.4)}Z`);
      const cx = tx + W * 0.3;
      fd.push(`M${f(cx)} ${f(ty - H * 0.2)} L${f(cx + 1.2)} ${f(ty - H * 0.2)} L${f(cx + 1.2)} ${f(ty + 2)} L${f(cx + 5)} ${f(ty + 2)} L${f(cx + 5)} ${y1 + 1} L${f(cx + 3.8)} ${y1 + 1} L${f(cx + 3.8)} ${f(ty + 3.2)} L${f(cx + 1.2)} ${f(ty + 3.2)} L${f(cx + 1.2)} ${y1 + 1} L${f(cx)} ${y1 + 1}Z`);
    }
  }
  el('path', { d: fd.join(' '), fill: '#3e2416', opacity: 0.82 }, inner);
  el('path', { d: fl.join(' '), fill: 'none', stroke: '#3e2416', 'stroke-width': 0.5, opacity: 0.7 }, inner);
  // the lamp(s)
  const lampD = [], cord = [];
  for (const lx of lampXs) {
    if (pendant) {
      cord.push(`M${f(lx)} ${y0 - 1} L${f(lx)} ${f(lampY - 1.6)}`);
      lampD.push(`M${f(lx - 3)} ${f(lampY + 1.4)} L${f(lx - 1.2)} ${f(lampY - 1.6)} L${f(lx + 1.2)} ${f(lampY - 1.6)} L${f(lx + 3)} ${f(lampY + 1.4)}Z`);
    } else {
      cord.push(`M${f(lx)} ${f(lampY + 2)} L${f(lx)} ${y1 + 1} M${f(lx - 3)} ${f(y1 - H * 0.16)} L${f(lx + 3)} ${f(y1 - H * 0.16)}`);
      lampD.push(`M${f(lx - 3.4)} ${f(lampY + 2)} L${f(lx - 2)} ${f(lampY - 2)} L${f(lx + 2)} ${f(lampY - 2)} L${f(lx + 3.4)} ${f(lampY + 2)}Z`);
    }
  }
  el('path', { d: cord.join(' '), fill: 'none', stroke: '#3e2416', 'stroke-width': 0.5 }, inner);
  el('path', { d: lampD.join(' '), fill: '#fff4d6', stroke: '#5a3a24', 'stroke-width': 0.35 }, inner);
  const who = el('path', { fill: '#2b1a10', opacity: 0.86 }, inner);
  const tv = room === 'home' && srnd(0, 1) < 0.16 ? el('path', { d: rect(x0 - 1, y0 - 1, x1 + 1, y1 + 1), fill: '#8fb2ff', opacity: 0 }, inner) : null;
  // daylight reflection on the glass
  const refl = el('path', { 'clip-path': `url(#${id}-c)`, d: `M${f(x0 + W * 0.12)} ${y1} L${f(x0 + W * 0.5)} ${y0} L${f(x0 + W * 0.66)} ${y0} L${f(x0 + W * 0.28)} ${y1}Z M${f(x0 + W * 0.72)} ${y1} L${f(x0 + W * 0.95)} ${f(y0 + H * 0.4)} L${f(x0 + W * 1.05)} ${f(y0 + H * 0.4)} L${f(x0 + W * 0.8)} ${y1}Z`, fill: '#ffffff', opacity: 0 }, g);
  const glow = el('ellipse', { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: W * 0.75 + 8, ry: H * 0.75 + 8, fill: 'url(#v-warmglow)', opacity: 0 }, glowG);
  // light thrown out onto the pavement: a soft pool, wider than the opening, fading outward
  const spill = y1 > 300 ? el('ellipse', { cx: f((x0 + x1) / 2), cy: BASE + 12, rx: f(W * 0.75 + 14), ry: 13, fill: 'url(#v-warmglow)', opacity: 0 }, glowG) : null;
  let walker = null, nextWalk = srnd(1, 12), tvN = 0, tvT = 0;
  return {
    n, glow, thr, lateOff, warmth, x0, y0, x1, y1, lit: 0,
    draw(t, dt, P_) {
      const day = 1 - P_.inkT, lit = this.lit;
      n.style.fill = rgb(mix(mix(P_.paper, GLASS, 0.5 * day), NIGHT_GLASS, 0.42 * P_.inkT));
      inner.setAttribute('opacity', f(lit * 0.94));
      refl.setAttribute('opacity', f(0.5 * day * (1 - lit)));
      glow.setAttribute('opacity', f(lit * 0.26));
      if (spill) spill.setAttribute('opacity', f(lit * 0.32));
      // someone crossing the room, sometimes pausing
      if (lit > 0.3 && room !== 'none') {
        if (!walker) { nextWalk -= dt; if (nextWalk < 0) { const dir = Math.random() < 0.5 ? 1 : -1; walker = { x: dir > 0 ? x0 - 8 : x1 + 8, dir, v: rnd(6, 10), pause: Math.random() < 0.5 ? rnd(1, 3.5) : 0, at: x0 + W * rnd(0.3, 0.7), t: 0 }; } }
        if (walker) {
          walker.t += dt;
          const pausing = walker.pause > 0 && Math.abs(walker.x - walker.at) < 1;
          if (pausing) walker.pause -= dt; else walker.x += walker.dir * walker.v * dt;
          const hx = walker.x, hy = y0 + Math.max(6, H * 0.36) + (pausing ? 0 : Math.abs(Math.sin(walker.t * 6)) * -0.5);
          who.setAttribute('d', `${oval(hx, hy, 2.2, 2.7)} M${f(hx - 5.4)} ${f(hy + 24)} L${f(hx - 5.2)} ${f(hy + 8)} Q${f(hx - 5)} ${f(hy + 3.8)} ${f(hx)} ${f(hy + 3.4)} Q${f(hx + 5)} ${f(hy + 3.8)} ${f(hx + 5.2)} ${f(hy + 8)} L${f(hx + 5.4)} ${f(hy + 24)}Z`);
          if ((walker.dir > 0 && walker.x > x1 + 9) || (walker.dir < 0 && walker.x < x0 - 9)) { walker = null; who.setAttribute('d', ''); nextWalk = rnd(6, 22); }
        }
      }
      if (tv) {
        tvT -= dt; if (tvT < 0) { tvT = rnd(0.08, 0.4); tvN = Math.random(); }
        tv.setAttribute('opacity', f(lit * (0.14 + 0.22 * tvN)));
      }
    },
  };
}

/** Window with a painted surround, glazing bars, open shutters and, on the ground floor, a reja. */
function ventana(g, glowG, x0, y0, x1, y1, { grille = false, shutters = true, pots = 0, shutterColour = GREEN, ...light }: { grille?: boolean; shutters?: boolean; pots?: number; shutterColour?: string; thr?: number; lateOff?: number; room?: string } = {}) {
  paint(g, ALBERO, rect(x0 - 3.4, y0 - 3.4, x1 + 3.4, y1 + 3.4), SP * 0.55);
  const w = pane(g, glowG, x0, y0, x1, y1, light);
  const my = f(y0 + (y1 - y0) * 0.36), mx = f((x0 + x1) / 2);
  P(g, `${rect(x0, y0, x1, y1)} M${mx} ${y0} L${mx} ${y1} M${x0} ${my} L${x1} ${my}`, SP * 0.6);
  if (shutters) { const sw = (x1 - x0) / 2; louvred(g, x0 - 3.4 - sw, y0 - 1, x0 - 3.4, y1 + 1, shutterColour); louvred(g, x1 + 3.4, y0 - 1, x1 + 3.4 + sw, y1 + 1, shutterColour); }
  if (grille) reja(g, x0 - 2.4, y0 - 2, x1 + 2.4, y1 + 1, pots);
  return w;
}

/** Arched opening path (round arch springing at ys). */
const arched = (x0, x1, top, bottom = BASE) => { const r = (x1 - x0) / 2; return `M${x0} ${bottom} L${x0} ${top + r} A${r} ${r} 0 0 1 ${x1} ${top + r} L${x1} ${bottom}Z`; };

/** Strip curtain (cortina de tiras) across an open shop door, taken in after hours. */
function cortina(g, x0, x1, y, len, { open = [0.3, 0.9], colours = [GREEN, ALBERO, '#b3412d'] } = {}) {
  const grp = el('g', {}, g);
  P(grp, `M${x0 - 1} ${y} L${x1 + 1} ${y}`, SP * 1.1);
  const n = Math.round((x1 - x0) / 3.2), w = (x1 - x0) / n;
  const strips = Array.from({ length: n }, (_, i) => ({ x: x0 + i * w, w: w - 0.7, a: 0, v: 0, ph: srnd(0, 6),
    n: tint(el('path', { stroke: 'currentColor', 'stroke-width': SP * 0.4, 'stroke-linejoin': 'round' }, grp), colours[i % colours.length]) }));
  return { grp, open, show: 1, first: undefined as number | undefined,
    draw(t, dt, wind, tau) {
      const [o0, o1] = this.open;
      const isOpen = o1 > 1 ? tau > o0 || tau < o1 - 1 : tau > o0 && tau < o1;
      this.show = this.first === undefined ? (this.first = 1, isOpen ? 1 : 0) : clamp(this.show + (isOpen ? dt : -dt) * 0.8, 0, 1);
      grp.setAttribute('opacity', f(this.show));
      grp.setAttribute('transform', `translate(0 ${f(-(1 - ease(this.show)) * 6)})`);
      strips.forEach((s, i) => {
        s.v += (-s.a * 26 + wind * 2.8 + Math.sin(t * 2.1 + s.ph) * 0.7 - s.v * 3) * dt;
        s.a += s.v * dt;
        const sw = s.a * len * 0.5, flt = Math.sin(t * 3.7 + i * 0.9) * 0.6;
        s.n.setAttribute('d', `M${f(s.x)} ${y} L${f(s.x + s.w)} ${y} Q${f(s.x + s.w + sw * 0.4)} ${f(y + len * 0.6)} ${f(s.x + s.w + sw + flt)} ${f(y + len)} L${f(s.x + sw + flt)} ${f(y + len)} Q${f(s.x + sw * 0.4)} ${f(y + len * 0.6)} ${f(s.x)} ${y}Z`);
      });
    },
    poke() { strips.forEach((s) => (s.v += 2.5 + Math.random() * 2.5)); },
  };
}

/** Striped awning (toldo) over a shop front: rolled out in business hours, valance flapping. */
function toldo(g, x0, x1, y, { open = [0.36, 0.82], depth = 15 } = {}) {
  const grp = el('g', {}, g);
  S(grp, rect(x0 - 2, y - 3, x1 + 2, y), SP * 0.8); // roller box
  const n = Math.round((x1 - x0) / 7.5), w = (x1 - x0) / n;
  const stripes = Array.from({ length: n }, (_, i) => tint(el('path', { stroke: 'currentColor', 'stroke-width': SP * 0.5, 'stroke-linejoin': 'round' }, grp), i % 2 ? TILE : GREEN));
  const valance = Array.from({ length: n }, (_, i) => tint(el('path', { stroke: 'currentColor', 'stroke-width': SP * 0.5, 'stroke-linejoin': 'round' }, grp), i % 2 ? TILE : GREEN));
  let a = 0, v = 0;
  return { grp, open, show: 1, first: undefined as number | undefined,
    draw(t, dt, wind, tau) {
      const [o0, o1] = this.open;
      const isOpen = tau > o0 && tau < o1;
      this.show = this.first === undefined ? (this.first = 1, isOpen ? 1 : 0) : clamp(this.show + (isOpen ? dt : -dt) * 0.35, 0, 1);
      const e = ease(this.show), d = 0.6 + depth * e;
      v += (-a * 18 + wind * 1.4 + Math.sin(t * 2.1) * 0.3 - v * 3) * dt; a += v * dt;
      stripes.forEach((s, i) => { const xa = x0 + i * w; s.setAttribute('d', rect(f(xa), y, f(xa + w), f(y + d))); });
      valance.forEach((s, i) => {
        const xa = x0 + i * w, yb = y + d, flap = (a * 2 + Math.sin(t * 4 + i * 0.7) * 0.25 * Math.abs(wind)) * e;
        s.setAttribute('d', `M${f(xa)} ${f(yb)} L${f(xa + w)} ${f(yb)} L${f(xa + w + flap)} ${f(yb + 4 * e)} Q${f(xa + w / 2 + flap)} ${f(yb + 6.4 * e)} ${f(xa + flap)} ${f(yb + 4 * e)}Z`);
        s.setAttribute('opacity', f(e));
      });
    },
    poke() { v += 3; },
  };
}

/** Wrought-iron lantern on a wall arm, swinging a little, lit at dusk. */
function farol(g, glowG, x, y, wallX, { r = 4.2, h = 9 } = {}) {
  const s = Math.sign(x - wallX) || 1;
  P(g, `M${wallX} ${y - 10} L${wallX} ${y - 1} M${wallX} ${y - 6} L${x} ${y - 6} M${wallX} ${y - 2} Q${f((wallX + x) / 2)} ${y - 2.4} ${f(x - s * 1.4)} ${y - 5.6} M${f(x + s * 1.2)} ${y - 6} q${f(s * 1.6)} 0 ${f(s * 1.6)} 1.4`, SP * 0.7);
  const grp = el('g', {}, g);
  const body = el('path', { d: `M${-r} 4 L${r} 4 L${f(r * 0.66)} ${4 + h} L${f(-r * 0.66)} ${4 + h}Z`, fill: PAPER, stroke: 'currentColor', 'stroke-width': SP * 0.7 }, grp);
  P(grp, `M0 -3.4 L0 0 M${f(-r - 0.8)} 3.6 L0 -0.2 L${f(r + 0.8)} 3.6 M0 4 L0 ${4 + h}`, SP * 0.6);
  B(grp, `M${f(-r - 1)} 3.2 L${f(r + 1)} 3.2 L${f(r + 1)} 4.4 L${f(-r - 1)} 4.4Z M${f(-r * 0.7)} ${3.6 + h} L${f(r * 0.7)} ${3.6 + h} L${f(r * 0.4)} ${5.6 + h} L${f(-r * 0.4)} ${5.6 + h}Z M-0.8 ${5.6 + h} L0.8 ${5.6 + h} L0 ${8 + h}Z`);
  const glow = el('circle', { r: 15 + r, fill: 'url(#v-warmglow)', opacity: 0 }, glowG);
  const pool = el('ellipse', { cx: x, cy: BASE + 9, rx: 20, ry: 4.6, fill: 'url(#v-warmglow)', opacity: 0 }, glowG);
  const top = y - 2.6;
  return { grp, body, glow, x, y, h, a: srnd(-0.04, 0.04), v: 0, ph: srnd(0, 6), thr: srnd(0.1, 0.3),
    draw(t, dt, wind, P_) {
      this.v += (-this.a * 14 + wind * 0.25 + Math.sin(t * 0.9 + this.ph) * 0.08 - this.v * 1.6) * dt;
      this.a += this.v * dt;
      grp.setAttribute('transform', `translate(${this.x} ${top}) rotate(${f(-this.a * 57.3)})`);
      const lit = smooth(this.thr, this.thr + 0.2, P_.lamp);
      body.setAttribute('fill', rgb(mix(P_.paper, WARM, lit * 0.95)));
      const k = 4 + h / 2;
      glow.setAttribute('cx', f(this.x - Math.sin(this.a) * k)); glow.setAttribute('cy', f(top + Math.cos(this.a) * k));
      const flick = 0.85 + 0.15 * Math.sin(t * 7 + this.ph) * Math.sin(t * 3.3);
      glow.setAttribute('opacity', f(lit * flick * 0.6));
      pool.setAttribute('opacity', f(lit * flick * 0.34));
    },
    poke() { this.v += (Math.random() < 0.5 ? -1 : 1) * (1.6 + Math.random()); },
  };
}

/** Seville orange tree in its pit on the pavement: leafy crown, oranges, white azahar blossom.
 *  Shake it and a couple of oranges drop, bounce and roll; new ones ripen back slowly. */
function naranjo(g, x, ground) {
  const grp = el('g', { style: 'cursor:pointer' }, g);
  P(grp, `M${x - 11} ${ground + 0.6} L${x + 11} ${ground + 0.6} M${x - 12.6} ${ground + 2.6} L${x + 12.6} ${ground + 2.6}`, SP * 0.6);
  S(grp, `M${x - 3.2} ${ground} Q${x - 2.2} ${ground - 22} ${x - 4} ${ground - 44} L${x + 1.6} ${ground - 46} Q${x + 2.6} ${ground - 22} ${x + 3.4} ${ground}Z`, SP * 0.9);
  P(grp, `M${x - 3} ${ground - 12} Q${x} ${ground - 13.4} ${x + 3.2} ${ground - 12} M${x - 1} ${ground - 30} q1.4 3 0.4 6`, SP * 0.5); // limewash line, bark
  P(grp, `M${x - 3} ${ground - 40} Q${x - 10} ${ground - 50} ${x - 16} ${ground - 56} M${x} ${ground - 44} Q${x + 6} ${ground - 54} ${x + 14} ${ground - 60} M${x - 1} ${ground - 45} L${x - 1} ${ground - 62}`, SP * 0.8);
  const crown = el('g', {}, grp);
  const cy = ground - 70;
  [[x, cy - 4, 22], [x - 18, cy + 6, 15], [x + 18, cy + 5, 16], [x - 8, cy - 14, 14], [x + 10, cy - 13, 13]].forEach(([cx, cy2, r]) => {
    const pts = [];
    for (let i = 0; i <= 72; i++) { const a = (i / 72) * Math.PI * 2; const rr = r + 1.5 * Math.abs(Math.sin(a * 9)) - 0.5 * Math.sin(a * 4); pts.push([cx + rr * Math.cos(a), cy2 + rr * 0.8 * Math.sin(a)]); }
    S(crown, 'M' + pts.map(pt).join('L') + 'Z', SP * 0.8);
  });
  // small glossy leaves, each an almond with a midrib, scattered at every angle
  const leaves = [];
  for (let i = 0; i < 150; i++) {
    const a = srnd(0, 6.28), d = Math.sqrt(srnd(0, 1)), r = srnd(0, 6.28), L = srnd(2.6, 3.6);
    const lx = x + Math.cos(a) * 31 * d, ly = cy - 4 + Math.sin(a) * 20 * d, c = Math.cos(r) * L, s = Math.sin(r) * L;
    leaves.push(`M${f(lx)} ${f(ly)} q${f(c / 2 - s * 0.35)} ${f(s / 2 + c * 0.35)} ${f(c)} ${f(s)} q${f(-c / 2 - s * 0.35)} ${f(-s / 2 + c * 0.35)} ${f(-c)} ${f(-s)}`);
  }
  P(crown, leaves.join(' '), SP * 0.38);
  const fruit = [];
  for (let i = 0; i < 16; i++) {
    const a = srnd(0, 6.28), d = 0.25 + 0.7 * Math.sqrt(srnd(0, 1));
    const fx = x + Math.cos(a) * 28 * d, fy = cy - 2 + Math.sin(a) * 17 * d;
    fruit.push({ x: fx, y: fy, n: paint(crown, ORANGE, oval(fx, fy, 2.2, 2.2), SP * 0.5), dn: paint(grp, ORANGE, '', SP * 0.5), re: 1, gone: false });
  }
  const blossoms = [], bl = [];
  for (let i = 0; i < 26; i++) {
    const a = srnd(0, 6.28), d = Math.sqrt(srnd(0, 1));
    const bx = x + Math.cos(a) * 30 * d, by = cy - 4 + Math.sin(a) * 19 * d;
    blossoms.push([bx, by]); bl.push(oval(bx, by, 0.9, 0.9));
  }
  el('path', { d: bl.join(' '), fill: PAPER, stroke: 'currentColor', 'stroke-width': SP * 0.35 }, crown);

  const drops = [];
  let shake = 0;
  return {
    g: grp, x, blossoms,
    poke() {
      shake = 1;
      const hanging = fruit.filter((o) => !o.gone);
      for (let k = 0; k < 2 && hanging.length; k++) {
        const o = hanging.splice((Math.random() * hanging.length) | 0, 1)[0];
        o.gone = true; o.n.setAttribute('opacity', 0);
        drops.push({ o, x: o.x, y: o.y, vx: rnd(-16, 16), vy: rnd(-12, 0), land: rnd(ground + 6, ground + 24), t: 0, bounces: 0 });
      }
    },
    draw(t, dt, wind) {
      shake = Math.max(0, shake - dt * 1.5);
      crown.setAttribute('transform', `translate(${f(Math.sin(t * 40) * shake * 2.2 + wind * 0.7 + Math.sin(t * 1.3 + x) * 0.3)} ${f(Math.cos(t * 31) * shake)})`);
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]; d.t += dt;
        if (d.bounces < 3) {
          d.vy += 420 * dt; d.y += d.vy * dt; d.x += d.vx * dt;
          if (d.y > d.land) { d.y = d.land; d.vy *= -0.38; d.vx *= 0.8; d.bounces++; }
        } else { d.x += d.vx * dt; d.vx *= Math.pow(0.35, dt); }
        const fade = d.t > 7 ? Math.max(0, 1 - (d.t - 7)) : 1;
        d.o.dn.setAttribute('d', oval(d.x, d.y - 2.2, 2.2, 2.2));
        d.o.dn.setAttribute('opacity', f(fade));
        if (fade <= 0) { d.o.dn.setAttribute('d', ''); d.o.gone = false; d.o.re = 0; drops.splice(i, 1); }
      }
      fruit.forEach((o) => { if (!o.gone && o.re < 1) { o.re = Math.min(1, o.re + dt * 0.25); o.n.setAttribute('opacity', f(o.re)); } });
    },
  };
}

/** Bougainvillea: a woody vine climbing a wall and spilling over in clumps of magenta bracts. */
function buganvilla(g, stem, clumps) {
  const grp = el('g', {}, g);
  P(grp, stem, SP * 0.7);
  const leaves = [], a = [], b = [];
  clumps.forEach(([cx, cy, r]) => {
    for (let i = 0; i < r * 4; i++) {
      const ang = srnd(0, 6.28), d = Math.sqrt(srnd(0, 1)) * r, x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d * 0.8;
      (srnd(0, 1) < 0.55 ? a : b).push(`M${f(x - 1.2)} ${f(y)} q0.4 -1.6 1.2 -1.2 q0.8 -0.6 1.2 1 q-0.2 1.4 -1.2 1.2 q-1.2 0.2 -1.2 -1Z`);
      if (i % 3 === 0) { const r2 = srnd(0, 6.28); leaves.push(`M${f(x)} ${f(y)} q${f(Math.cos(r2) * 1.4 - Math.sin(r2) * 0.6)} ${f(Math.sin(r2) * 1.4 + Math.cos(r2) * 0.6)} ${f(Math.cos(r2) * 2.8)} ${f(Math.sin(r2) * 2.8)}`); }
    }
  });
  P(grp, leaves.join(' '), SP * 0.35);
  paint(grp, '#b8236f', a.join(' '), SP * 0.22);
  paint(grp, '#dc4f97', b.join(' '), SP * 0.22);
  const ph = srnd(0, 6);
  return { draw(t, wind) { grp.setAttribute('transform', `translate(${f(wind * 0.35 + Math.sin(t * 1.1 + ph) * 0.18)} 0)`); } };
}

// ------------------------------------------------------------------ the street
export function buildStreet(layers, defs) {
  const { back, houses: hg, front, glow } = layers;
  const g = (parent) => el('g', {}, parent);
  const glowGrad = el('radialGradient', { id: 'v-warmglow' }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffd58a', 'stop-opacity': 0.6 }, glowGrad);
  el('stop', { offset: 0.45, 'stop-color': '#ffb85c', 'stop-opacity': 0.28 }, glowGrad);
  el('stop', { offset: 1, 'stop-color': '#ffb85c', 'stop-opacity': 0 }, glowGrad);

  DEFS = defs;
  const windows = [], lanterns = [], norens = [];

  // ---------- espadaña: the church's bell gable rising behind the roofs, a stork on top
  const tower = g(back);
  S(tower, 'M436 262 L436 112 Q436 104 444 102 Q452 100 454 92 L462 92 Q464 100 472 102 Q480 104 480 112 L480 262Z', SP);
  P(tower, 'M434 112 L482 112 M434 156 L482 156 M436 159 L480 159', SP * 0.55);
  S(tower, oval(436, 104, 1.8, 1.8), SP * 0.6); S(tower, oval(480, 104, 1.8, 1.8), SP * 0.6);
  P(tower, 'M458 92 L458 77 M453.4 82 L462.6 82', SP * 0.9);
  const openings = [[441, 455], [461, 475]];
  openings.forEach(([a, b]) => S(tower, `M${a} 150 L${a} 127 A7 7 0 0 1 ${b} 127 L${b} 150Z`, SP * 0.8));
  P(tower, 'M440 150 L456 150 M460 150 L476 150', SP * 0.9); // sills
  // stork's nest on the right shoulder, the stork standing in it
  P(tower, 'M466 102 L483 101.6 M467 100.4 l-2 -1.4 M470 99.6 l1 -2 M478 99.8 l3 -1.6 M482 101 l2.6 -0.4 M468 101 q6 -2.6 14 -0.6', SP * 0.6);
  S(tower, 'M469 99 Q470 92.4 476 92.6 Q480.6 93 480 97 Q478 99.6 469 99Z', SP * 0.7);
  B(tower, 'M469.2 98.4 Q468 96 470.6 94.6 L473 97.4Z');
  P(tower, 'M478.6 94 Q480.6 89 478.6 84.6', SP * 0.9);
  S(tower, oval(478.8, 83.6, 1.6, 1.4), SP * 0.6);
  tint(el('path', { d: 'M480.2 83.4 L485.6 85.4', 'stroke-width': 0.9, 'stroke-linecap': 'round', fill: 'none' }, tower), '#c8463a', 0.5, 'stroke');
  // two bells that swing when rung
  const bellG = openings.map(([a, b]) => {
    const grp = el('g', {}, tower);
    const body = paint(grp, BRONZE, 'M-4.6 0 Q-5 7 -6.8 10.4 L6.8 10.4 Q5 7 4.6 0 Q4.6 -2 0 -2 Q-4.6 -2 -4.6 0Z', SP * 0.7);
    P(grp, 'M-6 8.6 L6 8.6', SP * 0.4);
    B(grp, 'M-5.4 -4.4 L5.4 -4.4 L5.4 -2.4 L-5.4 -2.4Z');
    const clapper = pen(grp, SP * 0.7);
    return { grp, body, clapper, x: (a + b) / 2, y: 126, a: 0, v: 0, ca: 0, cv: 0 };
  });
  const bellRings = pen(tower, SP * 0.5);
  let ringing = 0;
  const bells = {
    hit: null as SVGPathElement | null,
    poke() { ringing = 1; bellG.forEach((b, i) => setTimeout(() => (b.v += 1.6), i * 380)); },
    draw(t, dt) {
      ringing = Math.max(0, ringing - dt * 0.35);
      bellG.forEach((b) => {
        b.v += (-b.a * 7 - b.v * 0.6) * dt; b.a += b.v * dt;
        b.cv += (-(b.ca - b.a * 0.4) * 22 - b.cv * 2.2) * dt; b.ca += b.cv * dt;
        b.grp.setAttribute('transform', `translate(${b.x} ${b.y}) rotate(${f(b.a * 57.3)})`);
        const ca = b.ca - b.a;
        b.clapper.setAttribute('d', `M0 0 L${f(Math.sin(-ca) * 9)} ${f(Math.cos(ca) * 9)} M${f(Math.sin(-ca) * 9 - 0.8)} ${f(Math.cos(ca) * 9)} l1.6 0`);
      });
      bellRings.setAttribute('d', ringing > 0.02 ? [12, 18].map((r) => `M${f(458 - r * 1.6)} ${f(118 - r * 0.2)} Q${f(458 - r * 2)} ${f(130)} ${f(458 - r * 1.6)} ${f(142 + r * 0.2)} M${f(458 + r * 1.6)} ${f(118 - r * 0.2)} Q${f(458 + r * 2)} ${f(130)} ${f(458 + r * 1.6)} ${f(142 + r * 0.2)}`).join(' ') : '');
      bellRings.setAttribute('opacity', f(ringing * (0.6 + 0.4 * Math.sin(t * 9))));
    },
  };

  // ---------- callejón between H2 and H3: whitewashed walls, steps, an arch through to a patio
  const alley = g(back);
  S(alley, rect(432, 236, 482, BASE), SP * 0.6);
  S(alley, 'M432 244 L449 280 L449 312 L432 344Z', SP * 0.6);
  S(alley, 'M482 244 L465 280 L465 312 L482 344Z', SP * 0.6);
  P(alley, 'M432 336 L449 310 M482 336 L465 310', SP * 0.4);
  S(alley, 'M449 312 L449 292 A8 8 0 0 1 465 292 L465 312Z', SP * 0.7);
  const alleyLamp = pane(alley, glow, 451.5, 292, 462.5, 312, { thr: 0.05, lateOff: 9, d: 'M451.5 312 L451.5 293 A5.5 5.5 0 0 1 462.5 293 L462.5 312Z', room: 'none' });
  windows.push(alleyLamp);
  P(alley, 'M449 312 L465 312 M445 320 L469 320 M440 330 L474 330 M436 338 L478 338', SP * 0.45);
  const cob = [];
  [[457, 341, 3, 1], [447, 341, 3, 1], [467, 341, 3, 1], [452, 334, 2.4, 0.8], [462, 334, 2.4, 0.8], [457, 325, 2, 0.7], [450, 316, 1.6, 0.5], [463, 316, 1.6, 0.5]].forEach(([cx, cy, rx, ry]) => cob.push(oval(cx, cy, rx, ry)));
  P(alley, cob.join(' '), SP * 0.35);
  maceta(alley, 440, 280, { hang: true, s: 0.75, trail: true });
  maceta(alley, 475, 284, { hang: true, s: 0.7 });

  // ================= H1 · bodega x 18–236
  const h1 = g(hg);
  muro(h1, 22, 210, 232);
  tejado(h1, { x0: 14, x1: 240, eave: 210, ridge: 194 });
  windows.push(ventana(h1, glow, 46, 222, 74, 258, {}));
  windows.push(ventana(h1, glow, 178, 222, 206, 258, { thr: 0.4 }));
  balcon(h1, 42, 78, 258, 13); balcon(h1, 174, 210, 258, 13);
  signBodega(h1, 97.4, 227);
  P(h1, 'M22 268 L232 268 M22 270.6 L232 270.6', SP * 0.55);
  windows.push(ventana(h1, glow, 34, 284, 78, 322, { grille: true, shutters: false, pots: 2 }));
  // open arched doorway with a strip curtain
  S(h1, arched(102, 154, 278), SP * 0.9);
  windows.push(pane(h1, glow, 106, 282, 150, BASE - 1, { thr: 0.05, lateOff: 0.95, d: arched(106, 150, 282, BASE - 1), room: 'shop' }));
  P(h1, 'M112 318 L144 318 M112 318 L112 343 M144 318 L144 343', SP * 0.4); // the counter inside
  norens.push(cortina(h1, 106, 150, 304, 34, { open: [0.29, 0.97] }));
  lanterns.push(farol(h1, glow, 94, 284, 100));
  // casks (toneles) stacked heads-out, chalked
  const cask = (cx, cy, r, label = '') => {
    paint(h1, CASK, oval(cx, cy, r, r), SP * 0.9);
    P(h1, `${oval(cx, cy, r - 2, r - 2)} M${cx - r + 2.6} ${cy - 4.4} L${cx + r - 2.6} ${cy - 4.4} M${cx - r + 2} ${cy + 0.6} L${cx + r - 2} ${cy + 0.6} M${cx - r + 2.8} ${cy + 5.6} L${cx + r - 2.8} ${cy + 5.6}`, SP * 0.42);
    B(h1, oval(cx, cy + 8.4, 1.2, 1));
    if (label) text(h1, cx, cy - 1.8, label, 4.6, { weight: 600, italic: true, fill: TILE });
  };
  cask(178, 330.4, 13, 'Fino'); cask(206, 330.4, 13, 'Oloroso'); cask(192, 305.6, 13, '1924');
  B(h1, 'M168 344 L171 339 L174 344Z M196 344 L199 339 L202 344Z M210 344 L213 339 L216 344Z');
  [170, 192, 214].forEach((x) => maceta(h1, x, 274, { hang: true, s: 0.8 }));
  maceta(h1, 222, BASE, { colour: TERRACOTTA, s: 1.4 });

  // ================= H2 · three-storey house x 236–432
  const h2 = g(hg);
  muro(h2, 242, 168, 426, '#f3dc9e', 0.62);
  tejado(h2, { x0: 234, x1: 434, eave: 168, ridge: 152 });
  windows.push(ventana(h2, glow, 264, 180, 290, 204, { thr: 0.5 }));
  windows.push(ventana(h2, glow, 378, 180, 404, 204, { thr: 0.35, lateOff: 1.05 }));
  S(h2, oval(334, 192, 6.4, 6.4), SP * 0.8);
  P(h2, `${oval(334, 192, 4.6, 4.6)} M329.4 192 L338.6 192 M334 187.4 L334 196.6`, SP * 0.45);
  P(h2, 'M242 212 L426 212 M242 214.6 L426 214.6', SP * 0.55);
  // first floor: two balcony doors; the left one's shutters open when you knock
  paint(h2, ALBERO, rect(264.6, 216.6, 303.4, 252), SP * 0.55);
  const shutWin = pane(h2, glow, 268, 220, 300, 252, { thr: 0.12, lateOff: 1.08 });
  windows.push(shutWin);
  windows.push(ventana(h2, glow, 366, 220, 398, 252, { thr: 0.3 }));
  const clip = el('clipPath', { id: 'v-shutclip' }, defs);
  el('path', { d: rect(268, 220, 300, 252) }, clip);
  const interior = el('g', { 'clip-path': 'url(#v-shutclip)', opacity: 0 }, h2);
  const room = el('path', { d: rect(268, 220, 300, 252), fill: '#3a2c22' }, interior);
  const person = g(interior);
  S(person, 'M274 252 Q275 239 284 237 Q293 239 294 252Z', SP * 0.8);
  S(person, oval(284, 230, 4.4, 5.4), SP * 0.8);
  B(person, 'M279.6 229 Q279.6 222 284.4 222 Q289 222 289 229 Q287 225.6 284.4 226 Q281.6 225.6 279.6 229Z');
  const waveArm = limb(person, 3, SP * 0.7);
  P(h2, `${rect(268, 220, 300, 252)} M284 220 L284 252 M268 232 L300 232`, SP * 0.6);
  const leafL = paint(h2, GREEN, '', SP * 0.7), leafR = paint(h2, GREEN, '', SP * 0.7);
  const louvreL = pen(h2, SP * 0.35), louvreR = pen(h2, SP * 0.35);
  balcon(h2, 254, 412, 252, 18);
  [262, 290, 322, 346, 374, 404].forEach((x, i) => maceta(h2, x, 236, { hang: true, s: 0.85, trail: i % 2 === 0, colour: i % 3 === 1 ? TERRACOTTA : BLUE }));
  signCalle(h2, 345, 262.4);
  // ground floor: two grilled windows and the front door
  windows.push(ventana(h2, glow, 252, 286, 292, 324, { grille: true, shutters: false, pots: 2 }));
  windows.push(ventana(h2, glow, 370, 286, 414, 324, { grille: true, shutters: false, pots: 3, thr: 0.25 }));
  S(h2, arched(302, 358, 274), SP * 0.9);
  paint(h2, WOOD, arched(306, 354, 278), SP * 0.8);
  const studs = [];
  for (let y = 308; y < 340; y += 8) for (const x of [311, 321, 339, 349]) studs.push(oval(x, y, 0.7, 0.7));
  P(h2, 'M330 302 L330 344 M306 302 L354 302 M310 304 L326 304 L326 341 L310 341Z M334 304 L350 304 L350 341 L334 341Z', SP * 0.45);
  B(h2, studs.join(' ') + ' ' + oval(330, 320, 1, 1));
  P(h2, oval(326, 322, 1.8, 2.4), SP * 0.5); // knocker
  signNumber(h2, 324.6, 284.4, '7');
  maceta(h2, 298, BASE, { colour: TERRACOTTA, s: 1.5 });
  maceta(h2, 363, BASE, { colour: TERRACOTTA, s: 1.5 });
  // the canary's cage hangs under the balcony
  const cageOuter = g(h2);
  const cage = el('g', {}, cageOuter);
  P(cage, 'M0 0 L0 4.4', SP * 0.45);
  S(cage, oval(0, 5.4, 1.2, 1.2), SP * 0.45);
  S(cage, 'M-5.4 21 L-5.4 11 Q-5.4 6.4 0 6.4 Q5.4 6.4 5.4 11 L5.4 21Z', SP * 0.6);
  const bird = el('g', {}, cage);
  paint(bird, CANARY, 'M-2.4 0 Q-2 -2.2 0.6 -2 Q2.8 -1.8 2.8 0.2 Q1.4 1.8 -1.6 1.4 L-4 2.4 L-2.4 0.6Z', SP * 0.45);
  paint(bird, CANARY, oval(2.4, -2.4, 1.3, 1.2), SP * 0.4);
  B(bird, 'M3.6 -2.6 L4.8 -2.2 L3.6 -1.8Z');
  P(cage, 'M-2.7 7 L-2.7 21 M0 6.4 L0 21 M2.7 7 L2.7 21 M-3.6 16.6 L3.6 16.6', SP * 0.38);
  paint(cage, WOOD, rect(-6.2, 21, 6.2, 23.4), SP * 0.55);
  const notes = el('g', {}, cageOuter);

  // ---------- the arch over the callejón, with a hanging lamp
  const arco = g(hg);
  S(arco, 'M429 232 L485 232 L485 272 A28 28 0 0 0 429 272Z', SP);
  const vous = [];
  for (let k = 0; k <= 8; k++) { const a = Math.PI + (k / 8) * Math.PI; vous.push(`M${f(457 + Math.cos(a) * 28)} ${f(272 + Math.sin(a) * 28)} L${f(457 + Math.cos(a) * 33)} ${f(272 + Math.sin(a) * 33)}`); }
  P(arco, vous.join(' ') + ' M429 234.4 L485 234.4', SP * 0.45);
  const vines = [buganvilla(arco, 'M428 344 Q425 304 429 268 Q432 242 446 236 M430 290 q-4 -6 -2 -14 M440 238 q10 -6 22 -3',
    [[431, 240, 7], [443, 235, 7], [455, 233, 5], [466, 235, 4], [428, 254, 6], [426, 270, 5], [428, 286, 4]])];

  // ================= H3 · bar x 482–704
  const h3 = g(hg);
  muro(h3, 488, 214, 698, '#f1cbb6', 0.6);
  tejado(h3, { x0: 480, x1: 706, eave: 214, ridge: 198 });
  [[506, 530], [582, 606], [658, 682]].forEach(([a, b], i) => {
    windows.push(ventana(h3, glow, a, 222, b, 250, { thr: [0.45, 0.2, 0.55][i], shutterColour: '#3d6488' }));
    balcon(h3, a - 4, b + 4, 250, 11);
  });
  signBar(h3, 521.2, 259.6);
  // open bar front: hams on a rail, bottles on a shelf, a tiled counter
  windows.push(pane(h3, glow, 492, 280, 614, 318, { thr: 0.02, lateOff: 1.05, room: 'shop' }));
  P(h3, 'M492 280 L614 280 M492 280 L492 344 M614 280 L614 344', SP * 0.8);
  P(h3, 'M506 297 L552 297 M566 312 L608 312', SP * 0.5);
  [512, 526, 540].forEach((x) => {
    P(h3, `M${x} 297 L${x} 299`, SP * 0.4);
    paint(h3, HAM, `M${x - 1} 300 L${x + 1} 300 Q${x + 4.6} 307 ${x + 3} 313 Q${x} 316 ${x - 3} 313 Q${x - 4.6} 307 ${x - 1} 300Z`, SP * 0.6);
    B(h3, `M${x - 1} 298.6 L${x + 1} 298.6 L${x + 1} 300.4 L${x - 1} 300.4Z`);
  });
  const bottles = [];
  for (let x = 568; x < 606; x += 5) bottles.push(`M${x} 312 L${x} 305 Q${x} 303.6 ${x + 0.8} 303.4 L${x + 0.8} 300.6 L${x + 1.8} 300.6 L${x + 1.8} 303.4 Q${x + 2.6} 303.6 ${x + 2.6} 305 L${x + 2.6} 312Z`);
  B(h3, bottles.join(' '));
  S(h3, rect(492, 318, 614, 323), SP * 0.9);
  paint(h3, WOOD, rect(494, 323, 612, 344), SP * 0.7);
  const panels = [];
  for (let x = 497; x < 606; x += 14.6) panels.push(rect(x, 326, x + 11.6, 341));
  P(h3, panels.join(' '), SP * 0.4);
  S(h3, oval(530, 316.4, 6, 1.4), SP * 0.6); S(h3, oval(578, 316.4, 6, 1.4), SP * 0.6);
  paint(h3, '#c9a24a', 'M527 315.6 q3 -2.6 6 0Z M575 315.6 q3 -2.6 6 0Z', SP * 0.4);
  S(h3, 'M556.4 318 L555.6 309.6 L559.6 309.6 L558.8 318Z', SP * 0.5);
  norens.push(toldo(h3, 490, 616, 280, { open: [0.36, 0.83] }));
  // the door, open, with its strip curtain
  S(h3, rect(620, 274, 696, BASE), SP * 0.9);
  windows.push(pane(h3, glow, 624, 278, 692, BASE - 1, { thr: 0.02, lateOff: 1.06, room: 'shop' }));
  norens.push(cortina(h3, 624, 692, 279, 54, { open: [0.33, 1.04], colours: ['#b3412d', TILE, GREEN, TILE] }));
  lanterns.push(farol(h3, glow, 611, 264, 617));
  // out front: a tiled bench (the cat's) and a café table
  const out = g(front);
  S(out, rect(514, 330, 574, 334), SP * 0.9);
  paint(out, TILE, rect(516, 334, 572, 350), SP * 0.7);
  const bt = [];
  for (let x = 516; x < 572; x += 7) bt.push(`M${x} 334 L${x} 350`);
  P(out, bt.join(' ') + ' M516 342 L572 342', SP * 0.3);
  const bd = [];
  for (let x = 519.5; x < 572; x += 7) for (const y of [338, 346]) bd.push(`M${x - 2.2} ${y} L${x} ${y - 2.2} L${x + 2.2} ${y} L${x} ${y + 2.2}Z`);
  const benchTop = paint(out, BLUE, bd.join(' '), 0);
  S(out, oval(602, 326, 13, 2), SP * 0.8);
  P(out, 'M602 328 L602 350 M594 352 L602 348 L610 352', SP * 0.8);
  S(out, 'M597 324.8 L596.6 319 L599.6 319 L599.2 324.8Z', SP * 0.45);
  P(out, 'M582 336 L592 336 M584 336 L584 352 M590 336 L590 352 M582.6 336 L582 318 Q582 314 585 314 M614 336 L624 336 M616 336 L616 352 M622 336 L622 352 M623.4 336 L624 318 Q624 314 621 314', SP * 0.7);
  const parasol = benchTop;
  // an evening regular on the left café chair, now and then lifting his glass of wine
  const regular = (() => {
    const grp = el('g', { opacity: 0, style: 'pointer-events:none' }, out);
    const legs = [solid(limb(grp, 2.6, SP * 0.75), '#2f3446'), solid(limb(grp, 2.6, SP * 0.75), '#2f3446')];
    const feet = [blot(grp), blot(grp)];
    const shirt = paint(grp, '#a9bdd0', 'M583.4 334 Q582.6 325 584 318.6 Q587.4 316.4 591 318.6 Q591.8 326 590.4 334Z', SP * 0.75);
    const head = el('g', {}, grp);
    el('ellipse', { cx: 588.6, cy: 312.6, rx: 2.4, ry: 2.9, fill: PAPER, stroke: 'currentColor', 'stroke-width': SP * 0.75 }, head);
    paint(head, '#cfcac0', 'M586.3 312.2 Q586 309.2 588.6 309.4 Q590.6 309.4 590.9 311 Q589 310.6 587.6 311.6Z', SP * 0.4);
    const arm = limb(grp, 2.2, SP * 0.7);
    const glass = el('g', {}, grp);
    paint(glass, '#7a1f2a', 'M-1.1 -3.4 L1.1 -3.4 L0.8 -1.2 Q0 -0.6 -0.8 -1.2Z', SP * 0.35);
    P(glass, 'M0 -0.8 L0 0.8 M-0.9 0.8 L0.9 0.8', SP * 0.35);
    let sipT = -1, next = 3;
    return {
      draw(t, dt, tau) {
        const here = tau > 0.6 || tau < 0.02;
        const op = +grp.getAttribute('opacity');
        grp.setAttribute('opacity', f(clamp(op + (here ? dt : -dt) * 0.5, 0, 1)));
        legs[0].draw([[587.6, 333.6], [595, 334.2], [595.4, 348.6]], [0.2, 0.4]);
        legs[1].draw([[586.4, 334], [593.4, 335], [592.6, 349]], [0.2, 0.4]);
        feet[0].setAttribute('d', 'M594 348.4 L598.4 348.4 Q599 350.4 597.4 350.4 L594 350.4Z');
        feet[1].setAttribute('d', 'M591.2 348.8 L595.6 348.8 Q596.2 350.6 594.6 350.6 L591.2 350.6Z');
        next -= dt; if (next < 0 && sipT < 0) { sipT = 0; next = rnd(6, 12); }
        let sip = 0;
        if (sipT >= 0) { sipT += dt; sip = sipT < 0.8 ? ease(sipT / 0.8) : sipT < 1.8 ? 1 : 1 - ease((sipT - 1.8) / 0.8); if (sipT > 2.6) sipT = -1; }
        head.setAttribute('transform', `rotate(${f(-sip * 10 + Math.sin(t * 0.7) * 2)} 588.6 315)`);
        const hand = [lerp(597.6, 591.4, sip), lerp(324.6, 313.6, sip)], elbow = [lerp(593.4, 595, sip), lerp(326.6, 321, sip)];
        arm.draw([[589.6, 319.6], elbow, hand], [0.2, 0.3]);
        glass.setAttribute('transform', `translate(${f(hand[0] + 0.6)} ${f(hand[1] + 0.4)}) rotate(${f(-sip * 35)})`);
      },
    };
  })();

  // ================= H4 · panadería x 704–948
  const h4 = g(hg);
  const chim = g(back);
  S(chim, 'M742 238 L742 204 L754 204 L754 238Z', SP * 0.9);
  S(chim, rect(739, 200, 757, 204), SP * 0.9);
  P(chim, 'M742 214 L754 214 M742 224 L754 224', SP * 0.4);
  muro(h4, 708, 236, 944);
  tejado(h4, { x0: 700, x1: 952, eave: 236, ridge: 220 });
  // curved Baroque gable over the shop with a clock that keeps the scene's time
  S(h4, 'M772 241 Q772 228 784 225 Q796 222 800 212 Q806 195 826 193 Q846 195 852 212 Q856 222 868 225 Q880 228 880 241Z', SP);
  P(h4, 'M778 238 Q780 230 788 228 Q800 225 804 214 Q809 199 826 197 Q843 199 848 214 Q852 225 864 228 Q872 230 874 238', SP * 0.45);
  S(h4, oval(772, 238, 2, 2), SP * 0.6); S(h4, oval(880, 238, 2, 2), SP * 0.6); S(h4, oval(826, 191, 2.2, 2.2), SP * 0.6);
  S(h4, oval(826, 213, 9, 9), SP * 0.9);
  const ticks = [];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; ticks.push(`M${f(826 + Math.sin(a) * 7.2)} ${f(213 - Math.cos(a) * 7.2)} L${f(826 + Math.sin(a) * (k % 3 ? 6.2 : 5.4))} ${f(213 - Math.cos(a) * (k % 3 ? 6.2 : 5.4))}`); }
  P(h4, ticks.join(' '), SP * 0.45);
  const hourHand = pen(h4, SP * 1.0), minHand = pen(h4, SP * 0.6);
  windows.push(ventana(h4, glow, 728, 248, 752, 268, { grille: true, shutters: false, pots: 1, thr: 0.5 }));
  windows.push(ventana(h4, glow, 900, 248, 924, 268, { grille: true, shutters: false, pots: 1, thr: 0.3 }));
  signPainted(h4, 826, 254);
  P(h4, 'M708 276 L944 276 M708 278.6 L944 278.6', SP * 0.55);
  // shop windows with bread on the shelves
  const bread = (x0, x1) => {
    P(h4, `M${x0} 301 L${x1} 301 M${x0} 315 L${x1} 315`, SP * 0.5);
    const loaves = [], scores = [], sticks = [];
    for (let x = x0 + 7; x < x1 - 4; x += 11) { loaves.push(oval(x, 298.4, 4.6, 2.6)); scores.push(`M${x - 2} 297.6 l1.4 -1 M${x} 297.8 l1.4 -1 M${x + 2} 298 l1.4 -1`); }
    for (let x = x0 + 4; x < x1 - 12; x += 8) sticks.push(`M${x} 314 L${x + 12} 309.6 Q${x + 13.4} 309.6 ${x + 13} 311 L${x + 1} 315.4Z`);
    paint(h4, BREAD, loaves.join(' ') + ' ' + sticks.join(' '), SP * 0.5);
    P(h4, scores.join(' '), SP * 0.4);
  };
  windows.push(ventana(h4, glow, 722, 286, 790, 328, { shutters: false, thr: 0.02, lateOff: 0.94, room: 'shop' }));
  bread(722, 790);
  windows.push(ventana(h4, glow, 862, 286, 930, 328, { shutters: false, thr: 0.02, lateOff: 0.94, room: 'shop' }));
  bread(862, 930);
  S(h4, arched(804, 848, 280), SP * 0.9);
  windows.push(pane(h4, glow, 808, 284, 844, BASE - 1, { thr: 0.0, lateOff: 9, d: arched(808, 844, 284, BASE - 1), room: 'shop' }));
  norens.push(cortina(h4, 808, 844, 303, 34, { open: [0.27, 0.6], colours: [TILE, '#b3412d'] }));
  lanterns.push(farol(h4, glow, 798, 286, 802));
  lanterns.push(farol(h4, glow, 854, 286, 850));
  maceta(h4, 714, BASE, { colour: TERRACOTTA, s: 1.6 }); maceta(h4, 938, BASE, { colour: TERRACOTTA, s: 1.6 });
  vines.push(buganvilla(h4, 'M935 336 Q933 300 938 270 Q941 250 930 244 M938 290 q4 -8 2 -16',
    [[938, 250, 6], [928, 244, 6], [916, 242, 5], [940, 266, 5], [936, 282, 4]]));

  // ---------- the street lamp under the arch
  const lampG = g(front);
  P(lampG, 'M457 244 L457 249.4', SP * 0.6);
  B(lampG, 'M451.4 249 L462.6 249 L461.6 252 L452.4 252Z M453.6 263 L460.4 263 L459 265.4 L455 265.4Z');
  const streetLamp = el('path', { d: 'M452.4 252 L461.6 252 L460 263 L454 263Z', fill: PAPER, stroke: 'currentColor', 'stroke-width': SP * 0.6 }, lampG);
  P(lampG, 'M457 252 L457 263', SP * 0.4);
  const cone = el('linearGradient', { id: 'v-cone', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffe2a8', 'stop-opacity': 0.32 }, cone);
  el('stop', { offset: 1, 'stop-color': '#ffe2a8', 'stop-opacity': 0.06 }, cone);
  const lampCone = el('path', { d: 'M453 264 L461 264 L506 352 L408 352Z', fill: 'url(#v-cone)', opacity: 0 }, glow);
  const lampGlow = el('circle', { cx: 457, cy: 258, r: 34, fill: 'url(#v-warmglow)', opacity: 0 }, glow);
  const lampPool = el('ellipse', { cx: 457, cy: 356, rx: 46, ry: 9, fill: 'url(#v-warmglow)', opacity: 0 }, glow);

  // ---------- wires strung from the bell gable; sparrows sit on the right-hand ones
  const wireY = (x) => {
    if (x >= 480) { const u = (x - 480) / (970 - 480); return 116 + (110 - 116) * u + 26 * 4 * u * (1 - u); }
    const u = (436 - x) / (436 + 10); return 116 + (104 - 116) * u + 22 * 4 * u * (1 - u);
  };
  const wires = g(back);
  const wd = [];
  for (const [a, b, off] of [[480, 970, 0], [436, -10, 0], [480, 970, 7], [436, -10, 7]]) {
    const pts = []; for (let k = 0; k <= 30; k++) { const x = lerp(a, b, k / 30); pts.push([x, wireY(x) + off * (1 + 0.3 * Math.sin(k)) * (k / 30)]); }
    wd.push('M' + pts.map(pt).join('L'));
  }
  P(wires, wd.join(' '), SP * 0.5);
  P(wires, 'M480 113 l3 0 M480 119 l3 0 M436 113 l-3 0 M436 119 l-3 0', SP * 0.8);

  // ---------- the street itself: cobbles and a kerb of stone
  const street = g(front);
  P(street, `M0 ${BASE} L960 ${BASE}`, SP);
  const cobbles = [];
  for (let i = 0; i < 90; i++) { const x = srnd(0, 960), y = srnd(350, 381); const r = srnd(2.2, 3.6); cobbles.push(`M${f(x - r)} ${f(y)} q${f(r)} ${f(-r * 0.5)} ${f(r * 2)} 0`); }
  P(street, cobbles.join(' '), SP * 0.4);
  const gut = [];
  for (let x = 0; x < 960; x += srnd(16, 26)) gut.push(`M${f(x)} ${BASE} L${f(x)} ${BASE + 4}`);
  P(street, `M0 ${BASE + 4} L960 ${BASE + 4} ` + gut.join(' '), SP * 0.5);

  // ---------- orange trees along the pavement
  const trees = [naranjo(front, 238, 351), naranjo(front, 708, 351)];
  const blossoms = trees.flatMap((tr) => tr.blossoms);

  // ---------- the canary
  const furin = (() => {
    const x = 404, y = 255.4;
    let a = 0, v = 0, hop = 0, hopT = -1, next = 2, song = 0;
    const noteN = [];
    return {
      x, y,
      draw(t, dt, wind) {
        v += (-a * 12 + wind * 0.6 - v * 1.6) * dt; a += v * dt;
        cage.setAttribute('transform', `translate(${x} ${y}) rotate(${f(-a * 57.3)})`);
        next -= dt;
        if (next < 0 && hopT < 0) { hopT = 0; next = rnd(1.2, 4); }
        if (hopT >= 0) { hopT += dt / 0.3; if (hopT >= 1) { hopT = -1; hop = 1 - hop; } }
        const u = hopT >= 0 ? ease(hopT) : 1, from = hop ? 0 : 1, to = hop;
        const k = hopT >= 0 ? lerp(from, to, u) : hop;
        const bx = lerp(0.6, -1.4, k), by = lerp(15.4, 19.6, k) - (hopT >= 0 ? Math.sin(Math.PI * u) * 3 : 0);
        bird.setAttribute('transform', `translate(${f(bx)} ${f(by)}) scale(${hop ? -1 : 1} 1)`);
        song = Math.max(0, song - dt);
        if (song > 0 && Math.random() < dt * 5) noteN.push({ t: 0, x0: rnd(-2, 2), n: Object.assign(el('text', { 'font-size': 6, fill: 'currentColor', 'font-family': 'serif' }, notes), { textContent: Math.random() < 0.5 ? '♪' : '♫' }) });
        for (let i = noteN.length - 1; i >= 0; i--) {
          const n = noteN[i]; n.t += dt;
          n.n.setAttribute('x', f(x + 4 + n.x0 + n.t * 7)); n.n.setAttribute('y', f(y + 14 - n.t * 14 + Math.sin(n.t * 7) * 1.4));
          n.n.setAttribute('opacity', f(Math.max(0, 1 - n.t / 1.4)));
          if (n.t > 1.4) { n.n.remove(); noteN.splice(i, 1); }
        }
      },
      poke() { v += 2.2; song = 2.4; },
      ring() { song = 1.6; },
      get swing() { return v; },
    };
  })();

  // ---------- the shutters someone opens to see who knocked
  const shoji = (() => {
    let s = -1;
    const x0 = 268, x1 = 300, y0 = 220, y1 = 252, w = (x1 - x0) / 2;
    const leaf = (hinge, sgn, th) => {
      const X = hinge + sgn * w * Math.cos(th), grow = Math.sin(th) * 2.6;
      const d = `M${hinge} ${y0} L${f(X)} ${f(y0 - grow)} L${f(X)} ${f(y1 + grow)} L${hinge} ${y1}Z`;
      const lines = [];
      for (let k = 1; k < 13; k++) { const u = k / 13; lines.push(`M${hinge} ${f(lerp(y0, y1, u))} L${f(X)} ${f(lerp(y0 - grow, y1 + grow, u))}`); }
      return [d, lines.join(' ')];
    };
    return {
      hit: rect(266, 216, 302, 254),
      poke() { if (s < 0) s = 0; },
      draw(t, dt, P_) {
        let open = 0;
        if (s >= 0) { s += dt; open = s < 0.7 ? ease(s / 0.7) : s < 4.4 ? 1 : 1 - ease((s - 4.4) / 0.7); if (s > 5.1) s = -1; }
        const th = open * Math.PI * 0.97;
        const [dl, ll] = leaf(x0, 1, th), [dr, lr] = leaf(x1, -1, th);
        leafL.setAttribute('d', dl); louvreL.setAttribute('d', ll);
        leafR.setAttribute('d', dr); louvreR.setAttribute('d', lr);
        interior.setAttribute('opacity', f(open > 0.001 ? 1 : 0));
        room.setAttribute('fill', rgb(mix(hex('#4a3a2c'), hex('#f0a85a'), shutWin.lit * 0.85)));
        const lean = ease(clamp((s - 0.5) / 0.6, 0, 1)) * (1 - ease(clamp((s - 4.0) / 0.5, 0, 1)));
        person.setAttribute('transform', `translate(${f((1 - lean) * 22)} 0)`);
        const wv = Math.sin(Math.max(0, s - 1.1) * 9) * 0.5 * lean;
        waveArm.draw([[277, 240], [273, 233], [273 + Math.sin(wv) * 5, 224 - Math.cos(wv) * 2]], [0.2, 0.2]);
      },
    };
  })();

  // ---------- applyRed: every flat colour follows the night, but only when the ink has moved
  let lastInk = -1;
  return {
    windows, lanterns, norens, furin, shoji, bells, trees, blossoms, pails: [],
    parasol, benchTop, alleyLamp,
    bench: { x0: 516, x1: 572, y: 330 },
    chimney: [748, 198] as [number, number],
    wireY,
    lamp: { node: streetLamp, cone: lampCone, glow: lampGlow, pool: lampPool, x: 457, y: 258 },
    drawLife(t, dt, wind, tau) { vines.forEach((v) => v.draw(t, wind)); regular.draw(t, dt, tau); },
    drawClock(tau) {
      const hrs = tau * 24, ha = ((hrs % 12) / 12) * Math.PI * 2, ma = ((hrs * 60) % 60) / 60 * Math.PI * 2;
      hourHand.setAttribute('d', `M826 213 L${f(826 + Math.sin(ha) * 4.4)} ${f(213 - Math.cos(ha) * 4.4)}`);
      minHand.setAttribute('d', `M826 213 L${f(826 + Math.sin(ma) * 6.6)} ${f(213 - Math.cos(ma) * 6.6)}`);
    },
    applyRed(P_) {
      washes.forEach((w) => { w.n.style.fill = rgb(mix(P_.paper, w.c, w.k * (1 - P_.inkT * 0.88))); });
      if (Math.abs(P_.inkT - lastInk) < 0.003) return;
      lastInk = P_.inkT;
      tinted.forEach((t) => t.n.setAttribute(t.attr, rgb(mix(t.c, mix(t.c, NIGHT, 0.6), P_.inkT * t.k))));
    },
  };
}
