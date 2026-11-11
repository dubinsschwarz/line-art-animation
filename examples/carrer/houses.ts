// Carrer de la Mar — a Barcelona street by the harbour, drawn once, plus the parts
// that live: rooms that light up floor by floor, wooden roll-down blinds people raise
// and lower, laundry and a Catalan flag in the wind, the pharmacy's green cross,
// a bookshop's mural shutter, plane trees, parakeets on the roof-terrace line.
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
// night: how much of the colour a surface keeps after dark (moonlit stucco keeps some; leaves do not)
const wash = (n, c, k, night = 0) => { washes.push({ n, c: hex(c), k, night }); return n; };
const NIGHT_SAND = hex('#d6b27c'), DUSK_SHADE = hex('#3e3026');
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

// ------------------------------------------------------------------ Barcelona: floors, façades, balconies
// The street is a row of tall blocks: a stone ground floor (planta baixa) 64 high, then
// floors of 46, each with French doors (balconeres) onto small iron balconies.
const GF = 280, FLOOR = 46;
const floorY = (n) => GF - FLOOR * n;        // top of floor n; n = 1 is the first floor
const STONE = '#d8cbb0', IRON = 'currentColor';
const GOLD = '#d4b057', LETTER = '"Cormorant SC","Iowan Old Style",Palatino,Georgia,serif', LETTER_I = '"Cormorant","Iowan Old Style",Palatino,Georgia,serif';
const TRENCADIS = ['#2f6fa8', '#3e8f6a', '#e0b33a', '#d0573e', '#f1ece0', '#6aa7c9', '#8cb45a'];

function sign(g, x, y, s, size, { font = LETTER, fill = GOLD, k = 0.3, italic = false, spacing = 0, weight = 700, anchor = 'middle' } = {}) {
  const n = el('text', { x: f(x), y: f(y), 'font-size': size, 'font-family': font, 'font-weight': weight, 'text-anchor': anchor, 'dominant-baseline': 'central' }, g);
  if (italic) n.setAttribute('font-style', 'italic');
  if (spacing) n.setAttribute('letter-spacing', spacing);
  tint(n, fill, k);
  n.textContent = s;
  return n;
}

/** Broken-tile mosaic (trencadís) filling a band: irregular shards in Gaudí's palette. */
function trencadis(g, x0, y0, x1, y1, size = 2.6) {
  const byColour = TRENCADIS.map(() => []);
  for (let y = y0; y < y1 - 0.4; y += size) for (let x = x0; x < x1 - 0.4; x += size) {
    const j = () => srnd(-0.4, 0.4), xa = x + 0.25, ya = y + 0.25, xb = Math.min(x1, x + size) - 0.25, yb = Math.min(y1, y + size) - 0.25;
    byColour[(srnd(0, 1) * TRENCADIS.length) | 0].push(`M${f(xa + j())} ${f(ya + j())} L${f(xb + j())} ${f(ya + j())} L${f(xb + j())} ${f(yb + j())} L${f(xa + j())} ${f(yb + j())}Z`);
  }
  byColour.forEach((d, i) => d.length && tint(el('path', { d: d.join(' '), stroke: 'currentColor', 'stroke-width': 0.12 }, g), TRENCADIS[i], 0.5));
}

/** A block: colour-washed stucco above a rusticated stone ground floor, string courses at
 *  every floor, a cornice with dentils and a parapet (balustrade or plain with urns). */
function edifici(g, x0, x1, floors, { colour, k = 0.55, parapet = 'balustrade' }) {
  const top = floorY(floors);
  wash(S(g, rect(x0, top, x1, BASE)), colour, k, 0.48);
  wash(S(g, rect(x0, GF, x1, BASE), SP * 0.9), STONE, 0.6, 0.36);
  const ash = [];
  for (let y = GF + 8, r = 0; y < BASE; y += 8, r++) {
    ash.push(`M${x0} ${y} L${x1} ${y}`);
    for (let x = x0 + (r % 2 ? 7 : 18); x < x1; x += 22) ash.push(`M${x} ${y - 8} L${x} ${y}`);
  }
  P(g, ash.join(' '), SP * 0.32);
  for (let n = 1; n < floors; n++) S(g, rect(x0 - 1, floorY(n) - 1.2, x1 + 1, floorY(n) + 1.2), SP * 0.55);
  S(g, rect(x0 - 1.6, GF - 2.4, x1 + 1.6, GF + 1), SP * 0.7);
  S(g, `M${x0 - 4} ${top} L${x1 + 4} ${top} L${x1 + 2.4} ${top + 4} L${x0 - 2.4} ${top + 4}Z`, SP * 0.9);
  const dent = [];
  for (let x = x0 + 1; x < x1 - 1; x += 3.2) dent.push(rect(f(x), top + 4, f(x + 1.6), top + 6));
  B(g, dent.join(' '));
  if (parapet === 'balustrade') {
    S(g, rect(x0 - 2, top - 2, x1 + 2, top), SP * 0.7);
    S(g, rect(x0 - 3, top - 14, x1 + 3, top - 11.4), SP * 0.8);
    const bal = [];
    for (let x = x0 + 2; x < x1 - 1; x += 4.4) bal.push(`M${f(x)} ${top - 2} q-1.5 -2.6 0 -4.4 q1.5 -1.8 0 -5`);
    P(g, bal.join(' '), SP * 0.45);
    for (let x = x0 - 2; x <= x1 + 2; x += (x1 - x0 + 4) / Math.max(1, Math.round((x1 - x0) / 46))) S(g, rect(f(x - 2), top - 14, f(x + 2), top), SP * 0.7);
  } else {
    S(g, rect(x0 - 2, top - 9, x1 + 2, top), SP * 0.8);
    S(g, rect(x0 - 3, top - 11, x1 + 3, top - 8.6), SP * 0.8);
    for (const x of [x0 + 2, x1 - 2]) { S(g, `M${x - 3} ${top - 11} Q${x - 3.6} ${top - 16} ${x} ${top - 17} Q${x + 3.6} ${top - 16} ${x + 3} ${top - 11}Z`, SP * 0.7); S(g, oval(x, top - 18.4, 1.4, 1.4), SP * 0.6); }
  }
  return { top };
}

/** Wooden roll-down blind (persiana enrotllable) hung from the lintel: a rolled bundle at the
 *  top, a slatted sheet lowered part way, a pull cord. Click it and someone raises or lowers it. */
function persiana(g, x0, x1, y0, y1, frac, colour) {
  const grp = el('g', { style: 'cursor:pointer' }, g);
  const sheet = paint(grp, colour, '', SP * 0.55);
  const slats = pen(grp, SP * 0.28);
  const roll = paint(grp, colour, `M${f(x0)} ${f(y0 - 0.6)} Q${f(x0 - 1.4)} ${f(y0 - 2.4)} ${f(x0)} ${f(y0 - 4.2)} L${f(x1)} ${f(y0 - 4.2)} Q${f(x1 + 1.4)} ${f(y0 - 2.4)} ${f(x1)} ${f(y0 - 0.6)}Z`, SP * 0.55);
  const cord = pen(grp, SP * 0.3);
  let cur = frac, target = frac, sway = 0, sv = 0, lastW = 0;
  return {
    grp,
    poke() { target = target > 0.5 ? rnd(0.04, 0.2) : rnd(0.62, 0.9); },
    draw(t, dt, wind) {
      cur += (target - cur) * Math.min(1, dt * 1.4);
      sv += (-sway * 12 + (wind - lastW) * 6 + Math.sin(t * 1.3 + x0) * 0.04 - sv * 2.2) * dt; sway += sv * dt; lastW = wind;
      const h = (y1 - y0) * cur, yb = y0 + h, sw = sway * 2.6 * cur;
      sheet.setAttribute('d', `M${f(x0)} ${f(y0)} L${f(x1)} ${f(y0)} L${f(x1 + sw)} ${f(yb)} L${f(x0 + sw)} ${f(yb)}Z`);
      const d = [];
      for (let y = y0 + 1.8; y < yb - 0.5; y += 1.8) { const u = (y - y0) / Math.max(1, h); d.push(`M${f(x0 + sw * u)} ${f(y)} L${f(x1 + sw * u)} ${f(y)}`); }
      slats.setAttribute('d', d.join(' '));
      const cx = (x0 + x1) / 2 + sw;
      cord.setAttribute('d', `M${f(cx)} ${f(yb)} L${f(cx + sway)} ${f(Math.min(y1 - 2, yb + 6))}`);
    },
  };
}

/** Small balcony: slab on scroll brackets and an iron railing. 'iron' is the everyday
 *  Barcelona rail with a band of rings; 'modernista' is wavy, seaweed-like ironwork over a
 *  mosaic-faced slab. */
function balconet(g, x0, x1, y, style = 'iron') {
  S(g, `M${x0 - 1.4} ${y} L${x1 + 1.4} ${y} L${x1 + 0.4} ${y + 3.2} L${x0 - 0.4} ${y + 3.2}Z`, SP * 0.75);
  P(g, `M${x0 + 2} ${y + 3.2} q0 4 3 4.6 M${x1 - 2} ${y + 3.2} q0 4 -3 4.6`, SP * 0.55);
  const d = [];
  if (style === 'modernista') {
    trencadis(g, x0, y + 0.4, x1, y + 2.9, 1.6);
    const mid = (x0 + x1) / 2;
    d.push(`M${x0} ${y - 11} Q${f(mid)} ${y - 16} ${x1} ${y - 11}`, `M${x0} ${y - 1} L${x1} ${y - 1}`);
    for (let x = x0 + 1.5; x < x1 - 0.5; x += 3) { const top = y - 11 - 5 * Math.sin(Math.PI * (x - x0) / (x1 - x0)); d.push(`M${f(x)} ${y - 1} Q${f(x + 1.8)} ${f((y + top) / 2)} ${f(x + 0.4)} ${f(top)}`); }
    d.push(`M${f(mid - 5)} ${y - 3} C${f(mid - 5)} ${y - 9} ${f(mid + 3)} ${y - 10} ${f(mid + 3)} ${y - 6} C${f(mid + 3)} ${y - 4} ${f(mid)} ${y - 4} ${f(mid)} ${y - 6}`);
  } else {
    d.push(`M${x0} ${y - 13} L${x1} ${y - 13} M${x0} ${y - 11.6} L${x1} ${y - 11.6} M${x0} ${y - 1.2} L${x1} ${y - 1.2}`);
    for (let x = x0; x <= x1 + 0.1; x += 2.8) d.push(`M${f(x)} ${y - 11.6} L${f(x)} ${y - 1.2}`);
    for (let x = x0 + 1.4; x < x1 - 1; x += 2.8) d.push(`M${f(x + 1.1)} ${y - 9.6} a1.1 1.1 0 1 0 0.1 0`);
  }
  P(g, d.join(' '), SP * 0.48);
}

/** One bay of a floor: a stone-framed French door, its room, its blind and its balcony. */
function balconera(g, glowG, cx, n, { w = 16, style = 'iron', blind = srnd(0.12, 0.75), blindColour = '#5d7a52', lintel = 'plain', pots = 0, thr = undefined } = {}) {
  const yTop = floorY(n), yFloor = yTop + FLOOR;
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = yTop + 10, y1 = yFloor - 0.6;
  S(g, rect(x0 - 2.4, y0 - 2.4, x1 + 2.4, y1), SP * 0.6);
  if (lintel === 'pediment') S(g, `M${x0 - 4} ${y0 - 2.4} L${cx} ${y0 - 7.4} L${x1 + 4} ${y0 - 2.4}Z`, SP * 0.6);
  else if (lintel === 'keystone') S(g, `M${cx - 2.2} ${y0 - 2.4} L${cx - 2.8} ${y0 - 6.4} L${cx + 2.8} ${y0 - 6.4} L${cx + 2.2} ${y0 - 2.4}Z`, SP * 0.6);
  else if (lintel === 'organic') S(g, `M${x0 - 4} ${y0 - 2.4} Q${x0 - 3} ${y0 - 8} ${cx} ${y0 - 7.4} Q${x1 + 3} ${y0 - 8} ${x1 + 4} ${y0 - 2.4}Z`, SP * 0.6);
  const room = pane(g, glowG, x0, y0, x1, y1, thr === undefined ? {} : { thr });
  P(g, `${rect(x0, y0, x1, y1)} M${cx} ${y0} L${cx} ${y1} M${x0} ${f(y0 + (y1 - y0) * 0.3)} L${x1} ${f(y0 + (y1 - y0) * 0.3)} M${x0} ${f(y0 + (y1 - y0) * 0.62)} L${x1} ${f(y0 + (y1 - y0) * 0.62)}`, SP * 0.45);
  const bl = persiana(g, x0 - 0.8, x1 + 0.8, y0, y1, blind, blindColour);
  if (style !== 'none') balconet(g, x0 - 5, x1 + 5, yFloor, style);
  for (let i = 0; i < pots; i++) maceta(g, lerp(x0 - 3, x1 + 3, pots > 1 ? i / (pots - 1) : 0.5), yFloor - 13, { colour: i % 2 ? TERRACOTTA : BLUE, s: 0.75 });
  return { room, blind: bl, rail: [x0 - 5, x1 + 5, yFloor - 13] };
}

/** Washing on a line, each piece a pendulum in the wind; click it and it flaps. */
function bugada(g, x0, x1, y, sag, items) {
  const grp = el('g', { style: 'cursor:pointer' }, g);
  const ly = (x) => y + sag * 4 * ((x - x0) / (x1 - x0)) * (1 - (x - x0) / (x1 - x0));
  P(grp, `M${x0} ${y} Q${(x0 + x1) / 2} ${y + sag * 2} ${x1} ${y}`, SP * 0.4);
  const pieces = items.map(([x, w, h, c, kind]) => ({ x, w, h, kind, a: 0, v: 0, ph: srnd(0, 6), n: paint(grp, c, '', SP * 0.5), pegs: pen(grp, SP * 0.5) }));
  let gust = 0;
  return {
    grp,
    poke() { gust = 1; pieces.forEach((p) => (p.v += rnd(2, 4))); },
    draw(t, dt, wind) {
      gust = Math.max(0, gust - dt);
      pieces.forEach((p) => {
        p.v += (-p.a * 9 + wind * 0.9 + Math.sin(t * 2.3 + p.ph) * 0.25 - p.v * 1.6) * dt; p.a += p.v * dt;
        const top = ly(p.x), s = p.a * p.h * 0.5, s2 = p.a * p.h * 0.3;
        let d;
        if (p.kind === 'shirt') d = `M${f(p.x - p.w / 2)} ${f(top)} L${f(p.x + p.w / 2)} ${f(top)} L${f(p.x + p.w / 2 + 2 + s2)} ${f(top + 3)} L${f(p.x + p.w / 2 + s2 * 0.6)} ${f(top + 4.6)} L${f(p.x + p.w / 2 - 0.6 + s)} ${f(top + p.h)} L${f(p.x - p.w / 2 + 0.6 + s)} ${f(top + p.h)} L${f(p.x - p.w / 2 + s2 * 0.6)} ${f(top + 4.6)} L${f(p.x - p.w / 2 - 2 + s2)} ${f(top + 3)}Z`;
        else d = `M${f(p.x - p.w / 2)} ${f(top)} L${f(p.x + p.w / 2)} ${f(top)} Q${f(p.x + p.w / 2 + s * 0.4)} ${f(top + p.h * 0.6)} ${f(p.x + p.w / 2 + s)} ${f(top + p.h)} L${f(p.x - p.w / 2 + s)} ${f(top + p.h)} Q${f(p.x - p.w / 2 + s * 0.4)} ${f(top + p.h * 0.6)} ${f(p.x - p.w / 2)} ${f(top)}Z`;
        p.n.setAttribute('d', d);
        p.pegs.setAttribute('d', `M${f(p.x - p.w / 2 + 1)} ${f(top - 1)} l0 2.2 M${f(p.x + p.w / 2 - 1)} ${f(top - 1)} l0 2.2`);
      });
    },
  };
}

/** The Catalan flag (senyera) hung from a balcony rail: four red stripes on gold, rippling. */
function senyera(g, x0, x1, y, h) {
  const grp = el('g', { style: 'cursor:pointer' }, g);
  const stripes = Array.from({ length: 9 }, (_, i) => tint(el('path', { stroke: 'none' }, grp), i % 2 ? '#c8302c' : '#f2c230', 0.5));
  const edge = pen(grp, SP * 0.5);
  let a = 0, v = 0;
  return {
    grp,
    poke() { v += 3; },
    draw(t, dt, wind) {
      v += (-a * 8 + wind * 0.5 + Math.sin(t * 1.7) * 0.1 - v * 1.4) * dt; a += v * dt;
      const pt2 = (u, s) => { const yy = y + h * s; const w = Math.sin(t * 3 + u * 5 + s * 2) * 0.8 * s; return [lerp(x0, x1, u) + a * h * 0.5 * s + w, yy + Math.sin(t * 2.4 + u * 6) * 0.5 * s]; };
      stripes.forEach((n, i) => {
        const s0 = i / 9, s1 = (i + 1) / 9, top = [], bot = [];
        for (let k = 0; k <= 6; k++) { top.push(pt2(k / 6, s0)); bot.push(pt2(k / 6, s1)); }
        n.setAttribute('d', 'M' + top.map(pt).join('L') + 'L' + bot.reverse().map(pt).join('L') + 'Z');
      });
      const outline = [];
      for (let k = 0; k <= 6; k++) outline.push(pt2(0, k / 6));
      for (let k = 0; k <= 6; k++) outline.push(pt2(k / 6, 1));
      for (let k = 6; k >= 0; k--) outline.push(pt2(1, k / 6));
      edge.setAttribute('d', 'M' + outline.map(pt).join('L'));
    },
  };
}

/** London plane (plàtan), the tree of every Barcelona street: a tall trunk with the
 *  camouflage bark, a broad light-green crown of maple-like leaves, seed balls hanging.
 *  Shake it and leaves come down. */
function platan(g, x, ground) {
  const grp = el('g', { style: 'cursor:pointer' }, g);
  P(grp, `M${x - 10} ${ground + 0.6} L${x + 10} ${ground + 0.6} M${x - 11} ${ground + 2.4} L${x + 11} ${ground + 2.4}`, SP * 0.6);
  S(grp, `M${x - 4} ${ground} Q${x - 3} ${ground - 40} ${x - 5} ${ground - 80} L${x + 2.4} ${ground - 82} Q${x + 3} ${ground - 40} ${x + 4.2} ${ground}Z`, SP * 0.9);
  const patches = [];
  for (let i = 0; i < 18; i++) { const py = ground - srnd(4, 78), px = x + srnd(-2.6, 2), r = srnd(1, 2.2); patches.push(`M${f(px - r)} ${f(py)} q${f(r * 0.4)} ${f(-r)} ${f(r)} ${f(-r * 0.6)} q${f(r)} ${f(r * 0.2)} ${f(r * 0.8)} ${f(r * 0.9)} q${f(-r * 0.6)} ${f(r * 0.6)} ${f(-r * 1.8)} ${f(-r * 0.3)}Z`); }
  tint(el('path', { d: patches.join(' '), stroke: 'none' }, grp), '#b8b48c', 0.5);
  P(grp, `M${x - 3} ${ground - 70} Q${x - 14} ${ground - 84} ${x - 24} ${ground - 96} M${x + 1} ${ground - 74} Q${x + 12} ${ground - 90} ${x + 22} ${ground - 100} M${x - 1} ${ground - 80} L${x} ${ground - 112}`, SP * 0.9);
  const crown = el('g', {}, grp);
  const cy = ground - 112;
  [[x, cy - 6, 34], [x - 28, cy + 10, 22], [x + 28, cy + 8, 24], [x - 14, cy - 22, 22], [x + 16, cy - 20, 20], [x, cy + 16, 22]].forEach(([cx, cy2, r]) => {
    const pts = [];
    for (let i = 0; i <= 80; i++) { const a = (i / 80) * Math.PI * 2; const rr = r + 2.2 * Math.abs(Math.sin(a * 7)) - 0.7 * Math.sin(a * 3); pts.push([cx + rr * Math.cos(a), cy2 + rr * 0.72 * Math.sin(a)]); }
    wash(S(crown, 'M' + pts.map(pt).join('L') + 'Z', SP * 0.8), '#c6d896', 0.8);
  });
  // shade under each clump, then scattered leaves at every angle
  const shadeD = [];
  [[x, cy + 8, 30], [x - 28, cy + 20, 18], [x + 28, cy + 18, 19], [x, cy + 28, 18]].forEach(([sx, sy, r]) => shadeD.push(`M${f(sx - r)} ${f(sy)} Q${f(sx)} ${f(sy + r * 0.32)} ${f(sx + r)} ${f(sy)} Q${f(sx)} ${f(sy + r * 0.1)} ${f(sx - r)} ${f(sy)}Z`));
  wash(el('path', { d: shadeD.join(' '), opacity: 0.55 }, crown), '#8faa62', 0.8);
  const leaves = [], balls = [], leafPts = [];
  for (let i = 0; i < 150; i++) {
    const a = srnd(0, 6.28), d = Math.sqrt(srnd(0, 1)), r = srnd(0, 6.28), L = srnd(2.8, 4);
    const lx = x + Math.cos(a) * 46 * d, ly = cy + Math.sin(a) * 28 * d, c = Math.cos(r) * L, sn = Math.sin(r) * L;
    leafPts.push([lx, ly]);
    leaves.push(`M${f(lx)} ${f(ly)} q${f(c / 2 - sn * 0.4)} ${f(sn / 2 + c * 0.4)} ${f(c)} ${f(sn)} q${f(-c / 2 - sn * 0.4)} ${f(-sn / 2 + c * 0.4)} ${f(-c)} ${f(-sn)}`);
  }
  P(crown, leaves.join(' '), SP * 0.36);
  for (let i = 0; i < 9; i++) { const bx = x + srnd(-40, 40), by = cy + srnd(4, 24); balls.push(`M${f(bx)} ${f(by - 3)} L${f(bx)} ${f(by)} ${oval(bx, by + 1.2, 1.2, 1.2)}`); }
  P(crown, balls.join(' '), SP * 0.4);
  let shake = 0;
  return {
    g: grp, x, blossoms: leafPts,
    poke() { shake = 1; },
    draw(t, dt, wind) {
      shake = Math.max(0, shake - dt * 1.4);
      crown.setAttribute('transform', `translate(${f(Math.sin(t * 36) * shake * 2.4 + wind * 0.9 + Math.sin(t * 1.1 + x) * 0.4)} ${f(Math.cos(t * 29) * shake)})`);
    },
  };
}

/** Pharmacy cross: a green LED cross on a bracket that cycles a pulse pattern, the time and
 *  the temperature, as they do all over Spain. Click to step through its displays. */
function creu(g, glowG, cx, cy) {
  const grp = el('g', { style: 'cursor:pointer' }, g);
  P(grp, `M${cx + 9} ${cy} L${cx + 13} ${cy} M${cx + 13} ${cy - 3} L${cx + 13} ${cy + 3}`, SP * 0.7);
  const a = 3.6, L = 9;
  const crossD = `M${cx - a} ${cy - L} L${cx + a} ${cy - L} L${cx + a} ${cy - a} L${cx + L} ${cy - a} L${cx + L} ${cy + a} L${cx + a} ${cy + a} L${cx + a} ${cy + L} L${cx - a} ${cy + L} L${cx - a} ${cy + a} L${cx - L} ${cy + a} L${cx - L} ${cy - a} L${cx - a} ${cy - a}Z`;
  el('path', { d: crossD, fill: '#0c1410', stroke: 'currentColor', 'stroke-width': SP * 0.7 }, grp);
  const leds = el('path', { d: crossD, fill: '#2fd06a', opacity: 0.85 }, grp);
  const inner = el('path', { d: `M${cx - a + 1} ${cy - L + 1} L${cx + a - 1} ${cy - L + 1} L${cx + a - 1} ${cy + L - 1} L${cx - a + 1} ${cy + L - 1}Z M${cx - L + 1} ${cy - a + 1} L${cx + L - 1} ${cy - a + 1} L${cx + L - 1} ${cy + a - 1} L${cx - L + 1} ${cy + a - 1}Z`, fill: '#bff5c9', opacity: 0 }, grp);
  const readout = el('text', { x: cx, y: cy + 0.3, 'font-size': 4.2, 'font-family': 'ui-monospace,Menlo,Consolas,monospace', 'font-weight': 700, fill: '#d9ffe2', 'text-anchor': 'middle', 'dominant-baseline': 'central' }, grp);
  const glow = el('circle', { cx, cy, r: 16, fill: 'url(#v-crossglow)', opacity: 0 }, glowG);
  let mode = 0, modeT = 0, manual = 0;
  return {
    grp,
    poke() { mode = (mode + 1) % 3; modeT = 0; manual = 6; },
    draw(t, dt, tau, P_) {
      modeT += dt; manual = Math.max(0, manual - dt);
      if (!manual && modeT > 3.2) { mode = (mode + 1) % 3; modeT = 0; }
      const hrs = tau * 24, h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
      const temp = Math.round(19 + 7 * Math.sin(Math.PI * clamp((tau - 0.3) / 0.6, 0, 1)));
      readout.textContent = mode === 1 ? `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` : mode === 2 ? `${temp}°C` : '';
      const pulse = mode === 0 ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
      inner.setAttribute('opacity', f(pulse * 0.8));
      leds.setAttribute('opacity', f(0.72 + 0.2 * P_.lamp));
      glow.setAttribute('opacity', f(0.15 + 0.55 * P_.lamp));
    },
  };
}

/** A rolling steel shop shutter, painted with a mural, pulled down out of hours. */
function persianaMetal(g, x0, x1, y0, y1, open) {
  const grp = el('g', {}, g);
  const clipId = `v-shutter-${paneId++}`;
  const cp = el('clipPath', { id: clipId }, DEFS);
  const clipRect = el('path', { d: '' }, cp);
  const body = el('g', { 'clip-path': `url(#${clipId})` }, grp);
  tint(el('path', { d: rect(x0, y0, x1, y1), stroke: 'currentColor', 'stroke-width': SP * 0.6 }, body), '#b9bec2', 0.5);
  const ribs = [];
  for (let y = y0 + 2; y < y1; y += 2.2) ribs.push(`M${x0} ${f(y)} L${x1} ${f(y)}`);
  P(body, ribs.join(' '), SP * 0.25);
  // the mural: a sun over waves, a bird, a scrawled tag
  tint(el('path', { d: `M${x0} ${y1 - 8} Q${x0 + 10} ${y1 - 14} ${x0 + 20} ${y1 - 9} Q${x0 + 30} ${y1 - 4} ${x0 + 40} ${y1 - 10} Q${x0 + 52} ${y1 - 15} ${x1} ${y1 - 9} L${x1} ${y1} L${x0} ${y1}Z`, stroke: 'none', opacity: 0.85 }, body), '#3f86b8', 0.5);
  tint(el('path', { d: oval(x0 + (x1 - x0) * 0.68, y0 + (y1 - y0) * 0.38, 8, 8), stroke: 'none', opacity: 0.9 }, body), '#f0b23a', 0.5);
  tint(el('path', { d: oval(x0 + (x1 - x0) * 0.68, y0 + (y1 - y0) * 0.38, 5, 5), stroke: 'none', opacity: 0.9 }, body), '#e3603c', 0.5);
  tint(el('path', { d: `M${x0 + 12} ${y0 + 14} q3 -3 6 0 q3 -3 6 0`, fill: 'none', 'stroke-width': 1 }, body), '#2a2a30', 0.3, 'stroke');
  tint(el('path', { d: `M${x0 + 6} ${y1 - 18} q4 -6 8 -1 q2 -5 6 -1 l3 -3 q2 4 -1 6 q4 2 7 -2`, fill: 'none', 'stroke-width': 1.1, 'stroke-linecap': 'round' }, body), '#d23c8c', 0.4, 'stroke');
  const boxD = rect(x0 - 1.6, y0 - 4, x1 + 1.6, y0);
  S(grp, boxD, SP * 0.8);
  let show = -1;
  return {
    draw(t, dt, tau) {
      const isOpen = tau > open[0] && tau < open[1];
      show = show < 0 ? (isOpen ? 0 : 1) : clamp(show + (isOpen ? -dt : dt) * 0.4, 0, 1);
      clipRect.setAttribute('d', rect(x0 - 1, y0, x1 + 1, f(y0 + (y1 - y0) * ease(show))));
      body.setAttribute('transform', `translate(0 ${f(-(1 - ease(show)) * (y1 - y0))})`);
    },
  };
}

/** A tiled panel (for the bodega): cobalt corners and bands on a cream glaze, grout showing. */
function rajoles(g, x0, y0, cols, rows, T) {
  const x1 = x0 + cols * T, y1 = y0 + rows * T;
  tint(el('path', { d: rect(f(x0), f(y0), f(x1), f(y1)), stroke: 'currentColor', 'stroke-width': SP * 0.6 }, g), '#f3ecda', 0.62);
  const b = T * 0.34;
  tint(el('path', { d: `${rect(f(x0 + 0.5), f(y0 + 0.5), f(x1 - 0.5), f(y1 - 0.5))} ${rect(f(x0 + 0.5 + b), f(y0 + 0.5 + b), f(x1 - 0.5 - b), f(y1 - 0.5 - b))}`, 'fill-rule': 'evenodd' }, g), '#264d92', 0.25);
  return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, grout() {
    const d = [];
    for (let c = 1; c < cols; c++) d.push(`M${f(x0 + c * T)} ${f(y0)} L${f(x0 + c * T)} ${f(y1)}`);
    for (let r = 1; r < rows; r++) d.push(`M${f(x0)} ${f(y0 + r * T)} L${f(x1)} ${f(y0 + r * T)}`);
    tint(el('path', { d: d.join(' '), fill: 'none', 'stroke-width': 0.22, opacity: 0.75 }, g), '#a99d84', 0.3, 'stroke');
  } };
}

// ------------------------------------------------------------------ the street
export function buildStreet(layers, defs) {
  const { back, houses: hg, front, glow } = layers;
  const g = (parent) => el('g', {}, parent);
  DEFS = defs;
  const glowGrad = el('radialGradient', { id: 'v-warmglow' }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffd58a', 'stop-opacity': 0.6 }, glowGrad);
  el('stop', { offset: 0.45, 'stop-color': '#ffb85c', 'stop-opacity': 0.28 }, glowGrad);
  el('stop', { offset: 1, 'stop-color': '#ffb85c', 'stop-opacity': 0 }, glowGrad);
  const crossGrad = el('radialGradient', { id: 'v-crossglow' }, defs);
  el('stop', { offset: 0, 'stop-color': '#5dff95', 'stop-opacity': 0.55 }, crossGrad);
  el('stop', { offset: 1, 'stop-color': '#5dff95', 'stop-opacity': 0 }, crossGrad);

  const windows = [], lanterns = [], norens = [], blinds = [], lines = [], extras = [];
  const bay = (grp, cx, n, opts = {}) => { const b = balconera(grp, glow, cx, n, opts); windows.push(b.room); blinds.push(b.blind); return b; };

  // ================= B1 · ochre block over the pharmacy, x 0–200
  const b1 = g(hg);
  edifici(b1, 2, 198, 5, { colour: '#e7c487', k: 0.6 });
  for (let n = 1; n <= 5; n++) [50, 100, 150].forEach((cx, i) => bay(b1, cx, n, { lintel: n === 1 ? 'pediment' : 'keystone', blindColour: '#5d7a52', pots: (n + i) % 3 === 0 ? 2 : 0 }));
  // the pharmacy: a Modernista front in dark green wood, gilded lettering on black glass
  paint(b1, '#24402f', rect(16, 283, 184, BASE), SP * 0.9);
  paint(b1, '#121815', rect(22, 286, 178, 299), SP * 0.7);
  P(b1, rect(23.6, 287.6, 176.4, 297.4), SP * 0.3);
  sign(b1, 100, 292.6, 'Farmàcia', 8.6, { spacing: 1.6 });
  const stained = [];
  for (let x = 24; x < 176; x += 6.4) if (x < 86 || x > 112) stained.push([x, ['#e0a83a', '#3e8f6a', '#2f6fa8', '#c8463a'][Math.floor(x / 6.4) % 4]]);
  stained.forEach(([x, c]) => paint(b1, c, `M${f(x)} 309 L${f(x)} 304 Q${f(x + 2.6)} 300.8 ${f(x + 5.2)} 304 L${f(x + 5.2)} 309Z`, SP * 0.3));
  windows.push(pane(b1, glow, 24, 311, 82, 337, { room: 'shop', thr: 0.02, lateOff: 0.93 }));
  windows.push(pane(b1, glow, 118, 311, 176, 337, { room: 'shop', thr: 0.02, lateOff: 0.93 }));
  windows.push(pane(b1, glow, 88, 302, 112, BASE - 1, { room: 'shop', thr: 0.02, lateOff: 0.93 }));
  P(b1, `${rect(24, 311, 82, 337)} ${rect(118, 311, 176, 337)} ${rect(88, 302, 112, BASE - 1)} M100 302 L100 343 M24 324 L82 324 M118 324 L176 324`, SP * 0.5);
  // apothecary jars on the shelves
  const jars = [];
  for (const [a, b] of [[28, 80], [122, 174]]) for (const y of [323.6, 336.4]) for (let x = a + 3; x < b - 2; x += 7) jars.push(`M${x - 1.8} ${y} L${x - 1.8} ${y - 4.6} Q${x - 1.8} ${y - 5.8} ${x - 0.8} ${y - 5.8} L${x - 0.8} ${y - 7} L${x + 0.8} ${y - 7} L${x + 0.8} ${y - 5.8} Q${x + 1.8} ${y - 5.8} ${x + 1.8} ${y - 4.6} L${x + 1.8} ${y}Z`);
  tint(el('path', { d: jars.join(' '), stroke: 'currentColor', 'stroke-width': 0.3 }, b1), '#eef0ea', 0.5);
  const goldLines = tint(el('path', { d: 'M16 283 L184 283 M84 300 L84 343 M116 300 L116 343 M20 300 L180 300', fill: 'none', 'stroke-width': 0.6 }, b1), GOLD, 0.35, 'stroke');
  const cross = creu(b1, glow, 186, 262);
  extras.push({ draw: (t, dt, wind, tau, P_) => cross.draw(t, dt, tau, P_) });

  // ================= B2 · Modernista building, x 200–400
  const b2 = g(hg);
  // the chimney of the bakery's oven
  const chim = g(back);
  S(chim, rect(222, 60, 232, 96), SP * 0.8); S(chim, rect(219, 56, 235, 60), SP * 0.8);
  edifici(b2, 202, 398, 4, { colour: '#efdfc0', k: 0.6, parapet: 'plain' });
  // undulating crown faced with trencadís, and a corner tower with a tiled dome
  const crown = 'M202 87 Q218 72 236 80 Q258 66 282 78 Q300 62 320 76 Q338 68 356 80 L356 87Z';
  S(b2, crown, SP * 0.9);
  const cg = el('g', { 'clip-path': 'url(#v-crownclip)' }, b2);
  el('path', { d: crown }, el('clipPath', { id: 'v-crownclip' }, defs));
  trencadis(cg, 202, 60, 356, 88, 2.4);
  P(b2, 'M202 87 Q218 72 236 80 Q258 66 282 78 Q300 62 320 76 Q338 68 356 80', SP * 0.9);
  S(b2, rect(358, 58, 396, 96), SP * 0.9);
  for (let x = 362; x < 394; x += 9) { S(b2, `M${x} 90 L${x} 70 A3.2 3.2 0 0 1 ${x + 6.4} 70 L${x + 6.4} 90Z`, SP * 0.5); }
  const dome = 'M356 58 Q358 34 377 30 Q396 34 398 58Z';
  paint(b2, '#5f9c78', dome, SP * 0.9);
  const scales = [];
  for (let y = 36; y < 58; y += 3.6) for (let x = 358; x < 398; x += 4) scales.push(`M${x} ${y} q2 2.4 4 0`);
  el('path', { d: scales.join(' '), 'clip-path': 'url(#v-domeclip)', fill: 'none', stroke: 'currentColor', 'stroke-width': 0.3 }, b2);
  el('path', { d: dome }, el('clipPath', { id: 'v-domeclip' }, defs));
  P(b2, 'M377 30 L377 18 M372.4 22.6 L381.6 22.6 M373.4 19.4 L380.6 25.8 M380.6 19.4 L373.4 25.8', SP * 0.8);
  S(b2, oval(377, 31, 2, 1.6), SP * 0.6);
  // first floor: a projecting stained-glass gallery (tribuna)
  S(b2, 'M240 279 L240 238 Q240 232 246 232 L354 232 Q360 232 360 238 L360 279 Q300 286 240 279Z', SP * 0.9);
  for (const [a, b] of [[246, 278], [284, 316], [322, 354]]) {
    windows.push(pane(b2, glow, a, 246, b, 274, {}));
    P(b2, `${rect(a, 246, b, 274)} M${(a + b) / 2} 246 L${(a + b) / 2} 274`, SP * 0.45);
    for (let x = a; x < b - 0.1; x += (b - a) / 4) paint(b2, ['#e0a83a', '#3e8f6a', '#2f6fa8', '#c8463a'][Math.round((x - a) / ((b - a) / 4)) % 4], rect(f(x + 0.4), 236.4, f(x + (b - a) / 4 - 0.4), 242.6), SP * 0.25);
  }
  trencadis(b2, 246, 275.6, 354, 279, 1.8);
  for (let n = 2; n <= 4; n++) [240, 300, 360].forEach((cx, i) => bay(b2, cx, n, { style: 'modernista', lintel: 'organic', blindColour: '#7b5a3a', pots: (n + i) % 2 ? 1 : 0 }));
  // ground floor: the building's iron-and-glass door, the bookshop, the bakery
  S(b2, arched(282, 318, 286), SP * 0.9);
  windows.push(pane(b2, glow, 286, 290, 314, BASE - 1, { room: 'shop', thr: 0.1, d: arched(286, 314, 290, BASE - 1) }));
  P(b2, `M300 304 L300 343 M286 318 L314 318 M292 304 q8 -8 16 0 M290 330 q10 -6 20 0`, SP * 0.6);
  // bookshop with a mural-painted steel shutter
  paint(b2, '#6e2a2a', rect(206, 284, 278, 296), SP * 0.8);
  sign(b2, 242, 290.2, 'Llibreria', 7.2, { fill: '#f1e4c6', spacing: 1 });
  windows.push(pane(b2, glow, 208, 298, 276, BASE - 1, { room: 'shop', thr: 0.03, lateOff: 0.88 }));
  const books = [];
  for (const y of [318, 336]) for (let x = 210; x < 274; x += 2.2) books.push([x, y, srnd(6, 9), ['#7a2f3a', '#2c4a73', '#3e6b52', '#d9a441', '#5a3a7a', '#c8463a'][(srnd(0, 1) * 6) | 0]]);
  const byC = {};
  books.forEach(([x, y, h, c]) => { (byC[c] = byC[c] || []).push(rect(f(x), f(y - h), f(x + 1.8), y)); });
  Object.entries(byC).forEach(([c, d]) => tint(el('path', { d: (d as string[]).join(' '), stroke: 'currentColor', 'stroke-width': 0.2 }, b2), c, 0.5));
  P(b2, `M208 318.4 L276 318.4 ${rect(208, 298, 276, BASE - 1)}`, SP * 0.5);
  const shutter = persianaMetal(b2, 207, 277, 297, BASE - 0.5, [0.39, 0.86]);
  extras.push({ draw: (t, dt, wind, tau) => shutter.draw(t, dt, tau) });
  // bakery: a painted wooden fascia, loaves in the window
  paint(b2, '#efe2c2', rect(322, 284, 394, 296), SP * 0.8);
  sign(b2, 358, 290.2, 'Forn de Pa', 7, { fill: '#7a4a24', spacing: 0.8, k: 0.4 });
  windows.push(pane(b2, glow, 324, 298, 392, BASE - 1, { room: 'shop', thr: 0.02, lateOff: 0.86 }));
  const loaves = [], sticks = [];
  for (let x = 330; x < 388; x += 10) loaves.push(oval(x, 312, 4.2, 2.4));
  for (let x = 328; x < 380; x += 7) sticks.push(`M${x} 330 L${x + 11} 325.6 Q${x + 12.4} 325.6 ${x + 12} 327 L${x + 1} 331.4Z`);
  paint(b2, '#d6a35c', loaves.join(' ') + ' ' + sticks.join(' '), SP * 0.45);
  P(b2, `M324 315 L392 315 M324 332 L392 332 ${rect(324, 298, 392, BASE - 1)}`, SP * 0.5);

  // ================= B3 · narrow pink block, laundry and a flag, x 400–520
  const b3 = g(hg);
  edifici(b3, 402, 518, 5, { colour: '#efc5b2', k: 0.6 });
  const b3bays = [];
  for (let n = 1; n <= 5; n++) [434, 486].forEach((cx) => b3bays.push(bay(b3, cx, n, { w: 15, blindColour: '#8a6a3c', lintel: 'keystone', pots: n === 1 ? 2 : 0 })));
  // washing strung between the balconies on the third and fourth floors
  for (const n of [3, 4]) {
    const y = floorY(n) + FLOOR - 13;
    const line = bugada(b3, 418, 502, y, 2.4, n === 3
      ? [[426, 7, 9, '#f3efe6', 'towel'], [440, 9, 10, '#7fa7c9', 'shirt'], [458, 7, 8, '#e0b33a', 'towel'], [474, 9, 10, '#c8463a', 'shirt'], [492, 6, 7, '#f3efe6', 'towel']]
      : [[430, 9, 10, '#3e6b52', 'shirt'], [450, 6, 8, '#f3efe6', 'towel'], [466, 9, 10, '#f3efe6', 'shirt'], [484, 7, 9, '#d36a8a', 'towel']]);
    lines.push(line);
  }
  const flag = senyera(b3, 476, 496, floorY(2) + FLOOR - 13, 14);
  lines.push(flag);
  // grocer's (queviures): painted sign, striped awning, fruit out on the pavement
  S(b3, rect(404, 283, 516, 292), SP * 0.7);
  sign(b3, 450, 287.6, 'Queviures', 6.8, { fill: '#2f5d4a', spacing: 1, k: 0.4 });
  windows.push(pane(b3, glow, 406, 296, 514, BASE - 1, { room: 'shop', thr: 0.02, lateOff: 0.9 }));
  P(b3, `${rect(406, 296, 514, BASE - 1)} M460 296 L460 343`, SP * 0.5);
  norens.push(toldo(b3, 404, 516, 296, { open: [0.33, 0.86], depth: 13 }));
  const crates = g(front);
  [[410, '#e8892b'], [426, '#f0d24a'], [442, '#c8302c'], [458, '#8cb45a'], [474, '#5a3a7a']].forEach(([x, c]) => {
    const cx = x as number;
    S(crates, `M${cx} 340 L${cx + 14} 340 L${cx + 14} 349 L${cx} 349Z`, SP * 0.6);
    P(crates, `M${cx} 344.4 L${cx + 14} 344.4`, SP * 0.35);
    const fr = [];
    for (let k = 0; k < 4; k++) fr.push(oval(cx + 2.4 + k * 3.1, 338.6 - (k % 2) * 0.6, 1.6, 1.6));
    paint(crates, c as string, fr.join(' '), SP * 0.35);
  });
  P(crates, 'M406 349 L492 349 M408 349 L408 352 M490 349 L490 352', SP * 0.6);

  // ================= B4 · lower block with a roof terrace and the vermouth bar, x 520–740
  const b4 = g(hg);
  edifici(b4, 522, 738, 3, { colour: '#cdd9d6', k: 0.6 });
  for (let n = 1; n <= 3; n++) [566, 630, 694].forEach((cx, i) => bay(b4, cx, n, { blindColour: '#556d82', lintel: 'pediment', pots: (n * 3 + i) % 4 === 0 ? 2 : 0 }));
  // the terrat: stair tower, water tank, an aerial, washing poles
  const terrat = g(back);
  S(terrat, rect(696, 108, 734, 130), SP * 0.9);
  S(terrat, rect(694, 104, 736, 108), SP * 0.8);
  S(terrat, rect(704, 113, 716, 130), SP * 0.6);
  S(terrat, 'M718 104 L718 92 Q718 88 726 88 Q734 88 734 92 L734 104Z', SP * 0.8);
  P(terrat, 'M718 96 L734 96 M708 104 L708 76 M700 84 L716 84 M702 80 L714 80 M704 76 L712 76', SP * 0.6);
  P(terrat, 'M556 128 L556 100 M552 100 L560 100', SP * 0.8);
  const wireY = (x) => { const u = clamp((x - 556) / (696 - 556), 0, 1); return 103 + 5 * 4 * u * (1 - u); };
  P(terrat, `M556 103 Q626 113 696 103`, SP * 0.45);
  lines.push(bugada(terrat, 556, 696, 110, 2.6, [[574, 9, 10, '#f3efe6', 'shirt'], [600, 12, 9, '#7fa7c9', 'towel'], [628, 9, 10, '#e0b33a', 'shirt'], [652, 12, 9, '#f3efe6', 'towel'], [676, 8, 9, '#c8463a', 'towel']]));
  // the bodega: barrels inside, a tiled sign, a strip curtain at the door
  const tl = rajoles(b4, 562, 282.6, 15, 3, 4.4);
  sign(b4, tl.cx, tl.cy - 0.2, 'Bodega · Vermut', 6.8, { font: LETTER_I, italic: true, fill: '#264d92', weight: 600, k: 0.25 });
  tl.grout();
  windows.push(pane(b4, glow, 528, 298, 648, BASE - 1, { room: 'shop', thr: 0.02, lateOff: 1.05 }));
  const cask = (cx, cy, r) => { paint(b4, '#b98a5a', oval(cx, cy, r, r), SP * 0.7); P(b4, `${oval(cx, cy, r - 1.6, r - 1.6)} M${cx - r + 1.6} ${cy} L${cx + r - 1.6} ${cy}`, SP * 0.35); };
  [[536, 312], [552, 312], [544, 300.6]].forEach(([x, y]) => cask(x, y, 7.4));
  const bottlesB = [];
  for (let x = 610; x < 644; x += 4.4) bottlesB.push(`M${x} 312 L${x} 306 Q${x} 304.6 ${x + 0.8} 304.4 L${x + 0.8} 301.6 L${x + 1.8} 301.6 L${x + 1.8} 304.4 Q${x + 2.6} 304.6 ${x + 2.6} 306 L${x + 2.6} 312Z`);
  B(b4, bottlesB.join(' '));
  P(b4, `M606 312.4 L646 312.4 ${rect(528, 298, 648, BASE - 1)}`, SP * 0.5);
  S(b4, rect(528, 322, 648, 326), SP * 0.8);
  paint(b4, '#7a5236', rect(530, 326, 646, BASE), SP * 0.6);
  S(b4, rect(654, 290, 724, BASE), SP * 0.9);
  windows.push(pane(b4, glow, 658, 294, 720, BASE - 1, { room: 'shop', thr: 0.02, lateOff: 1.05 }));
  norens.push(cortina(b4, 658, 720, 295, 46, { open: [0.33, 1.04], colours: ['#c8302c', '#f3ecda', '#2f5d4a', '#f3ecda'] }));
  lanterns.push(farol(b4, glow, 730, 288, 726));
  // out front: a mosaic bench (the cat's) and the café table
  const out = g(front);
  S(out, 'M514 330 Q543 326 574 330 L574 334 Q543 330 514 334Z', SP * 0.8);
  S(out, 'M516 334 Q543 330 572 334 L572 350 L516 350Z', SP * 0.7);
  const bc = el('g', { 'clip-path': 'url(#v-benchclip)' }, out);
  el('path', { d: 'M516 334 Q543 330 572 334 L572 350 L516 350Z' }, el('clipPath', { id: 'v-benchclip' }, defs));
  trencadis(bc, 516, 330, 572, 350, 2.2);
  const benchTop = bc;
  S(out, oval(602, 326, 13, 2), SP * 0.8);
  P(out, 'M602 328 L602 350 M594 352 L602 348 L610 352', SP * 0.8);
  S(out, 'M597 324.8 L596.6 319 L599.6 319 L599.2 324.8Z', SP * 0.45);
  P(out, 'M582 336 L592 336 M584 336 L584 352 M590 336 L590 352 M582.6 336 L582 318 Q582 314 585 314 M614 336 L624 336 M616 336 L616 352 M622 336 L622 352 M623.4 336 L624 318 Q624 314 621 314', SP * 0.7);
  const parasol = benchTop;

  // ================= B5 · Eixample block with sgraffito, x 740–960
  const b5 = g(hg);
  edifici(b5, 742, 958, 4, { colour: '#f0deac', k: 0.6 });
  for (let n = 1; n <= 4; n++) [790, 850, 910].forEach((cx, i) => bay(b5, cx, n, { lintel: n === 1 ? 'pediment' : 'keystone', blindColour: '#5d7a52', pots: (n + i) % 3 === 1 ? 1 : 0 }));
  // sgraffito: floral panels scratched through the stucco between the bays
  const sg = [];
  for (let n = 1; n <= 4; n++) for (const cx of [820, 880]) {
    const y = floorY(n) + 23;
    sg.push(`M${cx} ${y + 14} Q${cx - 1} ${y} ${cx} ${y - 14}`, `M${cx} ${y + 4} q-6 -2 -7 -8 q5 1 7 8 M${cx} ${y - 4} q6 -2 7 -8 q-5 1 -7 8 M${cx} ${y + 10} q5 -1 6 -6 q-4 1 -6 6`, oval(cx, y - 15, 1.8, 1.8));
  }
  tint(el('path', { d: sg.join(' '), fill: 'none', 'stroke-width': 0.55 }, b5), '#c79a52', 0.55, 'stroke');
  // ground floor: a grand front door and two grilled windows
  S(b5, arched(830, 870, 284), SP * 0.9);
  paint(b5, '#5a3a24', arched(834, 866, 288), SP * 0.8);
  P(b5, 'M850 308 L850 344 M834 308 L866 308 M840 296 q10 -8 20 0', SP * 0.5);
  windows.push(pane(b5, glow, 836, 289, 864, 306, { thr: 0.1, d: 'M836 306 L836 304 A14 14 0 0 1 864 304 L864 306Z' }));
  windows.push(ventana(b5, glow, 760, 296, 800, 330, { grille: true, shutters: false, pots: 2 }));
  windows.push(ventana(b5, glow, 900, 296, 940, 330, { grille: true, shutters: false, pots: 2 }));
  lanterns.push(farol(b5, glow, 818, 292, 822));
  lanterns.push(farol(b5, glow, 882, 292, 878));
  // the street plaque, Barcelona style: white marble, black serif, the district number
  tint(el('path', { d: rect(894, 262, 954, 278), stroke: 'currentColor', 'stroke-width': SP * 0.6 }, b5), '#f4f2ec', 0.55);
  P(b5, rect(895.6, 263.6, 952.4, 276.4), SP * 0.3);
  sign(b5, 920, 266.6, 'Carrer de', 3.2, { font: LETTER_I, italic: true, fill: '#1c1c1c', weight: 600, k: 0.2 });
  sign(b5, 920, 272.4, 'la Mar', 6, { fill: '#1c1c1c', k: 0.2, spacing: 0.6 });
  P(b5, 'M944 264.6 L950.4 264.6 L950.4 270 L944 270Z', SP * 0.3);
  sign(b5, 947.2, 267.4, '1', 3.6, { fill: '#1c1c1c', k: 0.2 });
  tint(el('path', { d: rect(842, 277.6, 858, 285.6), stroke: 'currentColor', 'stroke-width': SP * 0.5 }, b5), '#f4f2ec', 0.55);
  sign(b5, 850, 281.8, '23', 5, { fill: '#1c1c1c', k: 0.2 });

  // ---------- a Modernista street lamp
  const lampG = g(front);
  S(lampG, 'M396 352 L397.4 262 L400.6 262 L402 352Z', SP * 0.8);
  S(lampG, 'M392 352 L406 352 L404 344 L394 344Z', SP * 0.7);
  P(lampG, 'M399 270 Q387 266 385 256 Q385 250 390 250 M399 270 Q411 266 413 256 Q413 250 408 250 M395 300 q-4 -2 -2 -6 M403 300 q4 -2 2 -6 M397 330 q2 -4 4 0', SP * 0.7);
  B(lampG, 'M385.4 249 L394.6 249 L393 246 L387 246Z M403.4 249 L412.6 249 L411 246 L405 246Z M387 259.6 L393 259.6 L392 261.2 L388 261.2Z M405 259.6 L411 259.6 L410 261.2 L406 261.2Z M397.4 262 L400.6 262 L400 258 L398 258Z');
  const streetLamp = el('path', { d: 'M386 249 L394 249 L393 259.6 L387 259.6Z M404 249 L412 249 L411 259.6 L405 259.6Z', fill: PAPER, stroke: 'currentColor', 'stroke-width': SP * 0.6 }, lampG);
  const cone = el('linearGradient', { id: 'v-cone', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffe2a8', 'stop-opacity': 0.32 }, cone);
  el('stop', { offset: 1, 'stop-color': '#ffe2a8', 'stop-opacity': 0.06 }, cone);
  const lampCone = el('path', { d: 'M385 260 L413 260 L449 352 L349 352Z', fill: 'url(#v-cone)', opacity: 0 }, glow);
  const lampGlow = el('circle', { cx: 399, cy: 254, r: 30, fill: 'url(#v-warmglow)', opacity: 0 }, glow);
  const lampPool = el('ellipse', { cx: 399, cy: 356, rx: 46, ry: 9, fill: 'url(#v-warmglow)', opacity: 0 }, glow);

  // ---------- the street: panot pavement with its four-ring flower, setts in the road
  const street = g(front);
  P(street, `M0 ${BASE} L960 ${BASE}`, SP);
  const panot = [];
  for (let x = 0; x < 960; x += 9) {
    panot.push(`M${x} ${BASE} L${x - 1.2} ${BASE + 8}`);
    for (const [dx, dy] of [[2.6, 2.2], [6.4, 2.2], [2.2, 5.6], [6, 5.6]]) panot.push(oval(x + dx, BASE + dy, 1.2, 0.6));
  }
  P(street, panot.join(' '), SP * 0.28);
  P(street, `M0 ${BASE + 8.6} L960 ${BASE + 8.6} M0 ${BASE + 10} L960 ${BASE + 10}`, SP * 0.55);
  const setts = [];
  for (let i = 0; i < 120; i++) { const x = srnd(0, 960), y = srnd(356, 382), r = srnd(2.2, 3.4); setts.push(`M${f(x - r)} ${f(y)} q${f(r)} ${f(-r * 0.45)} ${f(r * 2)} 0`); }
  P(street, setts.join(' '), SP * 0.36);

  // ---------- plane trees along the pavement
  const trees = [platan(front, 492, 351), platan(front, 742, 351)];
  const blossoms = trees.flatMap((tr) => tr.blossoms);

  // ---------- the canary on the narrow block's fourth-floor balcony
  const cageOuter = g(b3);
  const cage = el('g', {}, cageOuter);
  P(cage, 'M0 0 L0 4.4', SP * 0.45);
  S(cage, oval(0, 5.4, 1.2, 1.2), SP * 0.45);
  S(cage, 'M-5.4 21 L-5.4 11 Q-5.4 6.4 0 6.4 Q5.4 6.4 5.4 11 L5.4 21Z', SP * 0.6);
  const bird = el('g', {}, cage);
  paint(bird, '#f1c93a', 'M-2.4 0 Q-2 -2.2 0.6 -2 Q2.8 -1.8 2.8 0.2 Q1.4 1.8 -1.6 1.4 L-4 2.4 L-2.4 0.6Z', SP * 0.45);
  paint(bird, '#f1c93a', oval(2.4, -2.4, 1.3, 1.2), SP * 0.4);
  B(bird, 'M3.6 -2.6 L4.8 -2.2 L3.6 -1.8Z');
  P(cage, 'M-2.7 7 L-2.7 21 M0 6.4 L0 21 M2.7 7 L2.7 21 M-3.6 16.6 L3.6 16.6', SP * 0.38);
  paint(cage, '#7a5236', rect(-6.2, 21, 6.2, 23.4), SP * 0.55);
  const notes = el('g', {}, cageOuter);
  const furin = (() => {
    const x = 420, y = floorY(5) + 10;
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
        const u = hopT >= 0 ? ease(hopT) : 1, k = hopT >= 0 ? lerp(hop ? 0 : 1, hop, u) : hop;
        bird.setAttribute('transform', `translate(${f(lerp(0.6, -1.4, k))} ${f(lerp(15.4, 19.6, k) - (hopT >= 0 ? Math.sin(Math.PI * u) * 3 : 0))}) scale(${hop ? -1 : 1} 1)`);
        song = Math.max(0, song - dt);
        if (song > 0 && Math.random() < dt * 5) { const n = el('text', { 'font-size': 6, fill: 'currentColor', 'font-family': 'serif' }, notes); n.textContent = Math.random() < 0.5 ? '♪' : '♫'; noteN.push({ t: 0, x0: rnd(-2, 2), n }); }
        for (let i = noteN.length - 1; i >= 0; i--) {
          const n = noteN[i]; n.t += dt;
          n.n.setAttribute('x', f(x + 4 + n.x0 + n.t * 7)); n.n.setAttribute('y', f(y + 14 - n.t * 14 + Math.sin(n.t * 7) * 1.4));
          n.n.setAttribute('opacity', f(Math.max(0, 1 - n.t / 1.4)));
          if (n.t > 1.4) { n.n.remove(); noteN.splice(i, 1); }
        }
      },
      poke() { v += 2.2; song = 2.4; },
      ring() { song = 1.6; },
    };
  })();

  // ---------- the evening regular at the café table, with his vermouth
  const regular = (() => {
    const grp = el('g', { opacity: 0, style: 'pointer-events:none' }, out);
    const legs = [solid(limb(grp, 2.6, SP * 0.75), '#2f3446'), solid(limb(grp, 2.6, SP * 0.75), '#2f3446')];
    const feet = [blot(grp), blot(grp)];
    paint(grp, '#a9bdd0', 'M583.4 334 Q582.6 325 584 318.6 Q587.4 316.4 591 318.6 Q591.8 326 590.4 334Z', SP * 0.75);
    const head = el('g', {}, grp);
    el('ellipse', { cx: 588.6, cy: 312.6, rx: 2.4, ry: 2.9, fill: PAPER, stroke: 'currentColor', 'stroke-width': SP * 0.75 }, head);
    paint(head, '#cfcac0', 'M586.3 312.2 Q586 309.2 588.6 309.4 Q590.6 309.4 590.9 311 Q589 310.6 587.6 311.6Z', SP * 0.4);
    const arm = limb(grp, 2.2, SP * 0.7);
    const glass = el('g', {}, grp);
    paint(glass, '#8a2a1a', 'M-1.1 -3.4 L1.1 -3.4 L0.9 -0.8 L-0.9 -0.8Z', SP * 0.35);
    P(glass, 'M-0.4 -2.4 L0.6 -2.4', SP * 0.25);
    let sipT = -1, next = 3;
    return {
      draw(t, dt, tau) {
        const here = tau > 0.5 || tau < 0.02;
        grp.setAttribute('opacity', f(clamp(+grp.getAttribute('opacity') + (here ? dt : -dt) * 0.5, 0, 1)));
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

  // ---------- applyRed: flat colours follow the night
  let lastInk = -1;
  return {
    windows, lanterns, norens, furin, blinds, lines, trees, blossoms, cross, pails: [],
    parasol, benchTop, bench: { x0: 516, x1: 572, y: 330 },
    chimney: [227, 54] as [number, number],
    wireY, wireSpan: [556, 696],
    lamp: { node: streetLamp, cone: lampCone, glow: lampGlow, pool: lampPool, x: 399, y: 254 },
    drawLife(t, dt, wind, tau, P_) {
      regular.draw(t, dt, tau);
      lines.forEach((l) => l.draw(t, dt, wind));
      blinds.forEach((b) => b.draw(t, dt, wind));
      extras.forEach((e) => e.draw(t, dt, wind, tau, P_));
    },
    applyRed(P_) {
      washes.forEach((w) => {
        // by day the wash sits on the paper; after dark, walls keep a dim sand tone, shaded toward dusk
        const c = w.night ? mix(mix(w.c, NIGHT_SAND, P_.inkT * 0.55), DUSK_SHADE, P_.inkT * 0.4) : w.c;
        w.n.style.fill = rgb(mix(P_.paper, c, w.k * (1 - P_.inkT * 0.88) + w.night * P_.inkT));
      });
      if (Math.abs(P_.inkT - lastInk) < 0.003) return;
      lastInk = P_.inkT;
      tinted.forEach((t) => t.n.setAttribute(t.attr, rgb(mix(t.c, mix(t.c, NIGHT, 0.6), P_.inkT * t.k))));
    },
  };
}
