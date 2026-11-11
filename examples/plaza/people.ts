// people.ts — the square's people and pigeons, seen from above.
//
// Figures are upright "billboards" drawn at the screen point of their feet, in profile
// facing screen-left or screen-right (whichever way they're heading or looking), with a
// soft ground shadow that follows the sun. They're designed at ~12 px tall and scaled by
// the camera (scale(I.s / 6.5)), so a close view gets bigger figures; at ~19 px they carry
// both arms, shoes, hats, bags and long hair, and something to do with their hands.
import { el, f, PAPER } from '../../lib/ink.ts';
import { type Iso, type Sun, blobShadow } from '../../lib/iso.ts';
import { toRGB, rgb, mix, type Palette } from '../../lib/daynight.ts';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]): T => a[(Math.random() * a.length) | 0];
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const ease = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const LW = 0.42;   // figure pen in design units
const CLOTHES = ['#2c4a73', '#c8463a', '#3e6b52', '#d9a441', '#7a2f3a', '#e3ddd0', '#6b7b8c', '#2a2a30', '#b0523a', '#5a3a7a', '#e07a9a', '#f3ecdc'];
const HAIR = ['#2a2420', '#5a3a24', '#8a6a3c', '#cfcac0', '#1c1c1c', '#b0703a'];
const night = (c: string, P: Palette, k = 0.55) => rgb(mix(toRGB(c), mix(toRGB(c), [12, 16, 30], 0.6), P.inkT * k));

export type Activity = 'none' | 'drink' | 'ice' | 'phone' | 'book' | 'photo' | 'flag' | 'guitar' | 'tray' | 'balloons' | 'feed';
interface Pose { facing: 1 | -1; walk?: number; seat?: number; act?: Activity; u?: number; wave?: number; kid?: boolean; t?: number }

// ------------------------------------------------------------------ one figure
function figure(parent: Element, k: number, { kid = false } = {}) {
  const g = el('g', {}, parent);
  const inner = el('g', { transform: `scale(${f(k)})` }, g);
  const top = pick(CLOTHES), bottom = pick(['#2a2a30', '#3d5a80', '#6b5a48', '#c9b99a', top]), hair = pick(HAIR);
  const skirt = Math.random() < 0.3, longHair = Math.random() < 0.35;
  const hat = kid ? (Math.random() < 0.4 ? 'cap' : '') : pick(['', '', '', '', 'sun', 'cap']);
  const bag = kid ? '' : pick(['', '', 'pack', 'tote']);
  const bagC = pick(['#6b4a30', '#2a2a30', '#c8463a', '#3e6b52', '#d9a441']);
  const scoop = pick(['#f3d1dc', '#f6efd8', '#c99a6a']);
  const S = (attrs: Record<string, string | number>) => el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': LW, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...attrs }, inner);
  const pack = S({ 'stroke-width': LW * 0.8 });
  const farArm = S({ 'stroke-width': LW * 1.5 });
  const legA = S({ 'stroke-width': LW * 1.6 }), legB = S({ 'stroke-width': LW * 1.6 });
  const shoes = S({ fill: 'currentColor', stroke: 'none' });
  const body = S({});
  const hairBack = S({ stroke: 'none' });
  const head = el('circle', { r: 1.3, fill: PAPER, stroke: 'currentColor', 'stroke-width': LW }, inner);
  const hairN = S({ stroke: 'none' });
  const hatN = S({ 'stroke-width': LW * 0.8 });
  const tote = S({ 'stroke-width': LW * 0.8 });
  const arm = S({ 'stroke-width': LW * 1.5 });
  const prop = S({ 'stroke-width': LW * 0.7 });
  const prop2 = S({ 'stroke-width': LW * 0.6 });
  return {
    g,
    pose(p: Pose, P: Palette) {
      const d = p.facing, s = kid ? 0.72 : 1, t = p.t ?? 0;
      let hip: [number, number], sh: [number, number], feet: Array<[number, number]>;
      if (p.seat !== undefined) {
        const hs = p.seat;
        hip = [-d * 0.2, -hs - 0.4];
        const knee: [number, number] = [d * 2.2, -hs - (hs < 3 ? 1.2 : 0.4)];
        feet = [[d * 2.5, 0], [d * 2.0, 0.25]];
        legA.setAttribute('d', `M${f(hip[0])} ${f(hip[1])} L${f(knee[0])} ${f(knee[1])} L${f(feet[0][0])} ${f(feet[0][1] - 0.3)}`);
        legB.setAttribute('d', `M${f(hip[0] - d * 0.4)} ${f(hip[1])} L${f(knee[0] - d * 0.5)} ${f(knee[1] + 0.2)} L${f(feet[1][0])} ${f(feet[1][1] - 0.3)}`);
        sh = [d * 0.15, hip[1] - 4.3];
      } else {
        const sw = p.walk !== undefined ? Math.sin(p.walk * Math.PI * 2) * 1.35 * s : 0.35;
        const lift = p.walk !== undefined ? Math.max(0, Math.sin(p.walk * Math.PI * 2 + 1.6)) * 0.3 : 0;
        hip = [0, -5.5 * s - lift];
        feet = [[sw, 0], [-sw, 0]];
        legA.setAttribute('d', `M${f(hip[0])} ${f(hip[1])} L${f(sw)} -0.3`);
        legB.setAttribute('d', `M${f(hip[0])} ${f(hip[1])} L${f(-sw)} -0.3`);
        sh = [d * 0.2, hip[1] - 4.2 * s];
      }
      shoes.setAttribute('d', feet.map(([x, y]) => `M${f(x - d * 0.4)} ${f(y - 0.55)} L${f(x + d * 0.75)} ${f(y - 0.5)} Q${f(x + d * 0.95)} ${f(y - 0.15)} ${f(x + d * 0.6)} ${f(y)} L${f(x - d * 0.45)} ${f(y)}Z`).join(' '));
      const hw = 1.25 * s, low = skirt && p.seat === undefined ? hip[1] + 2.4 : hip[1] + 0.6;
      body.setAttribute('d', `M${f(hip[0] - hw * (skirt ? 1.25 : 1))} ${f(low)} Q${f(sh[0] - hw * 1.1)} ${f(sh[1] + 2)} ${f(sh[0] - hw)} ${f(sh[1] + 0.5)} Q${f(sh[0])} ${f(sh[1] - 0.4)} ${f(sh[0] + hw)} ${f(sh[1] + 0.5)} Q${f(sh[0] + hw * 1.1)} ${f(sh[1] + 2)} ${f(hip[0] + hw * (skirt ? 1.25 : 1))} ${f(low)}Z`);
      body.setAttribute('fill', night(top, P));
      legA.setAttribute('stroke', night(bottom, P, 0.4)); legB.setAttribute('stroke', night(bottom, P, 0.4));
      const hc: [number, number] = [sh[0] + d * 0.25, sh[1] - 1.7 * (kid ? 0.9 : 1)], hr = kid ? 1.15 : 1.3;
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1])); head.setAttribute('r', f(hr));
      hairN.setAttribute('d', `M${f(hc[0] - d * 1.35)} ${f(hc[1] + 0.3)} Q${f(hc[0] - d * 1.2)} ${f(hc[1] - 1.5)} ${f(hc[0] + d * 0.4)} ${f(hc[1] - 1.35)} Q${f(hc[0] - d * 0.4)} ${f(hc[1] - 0.6)} ${f(hc[0] - d * 1.35)} ${f(hc[1] + 0.3)}Z`);
      hairBack.setAttribute('d', longHair ? `M${f(hc[0] - d * 0.6)} ${f(hc[1] - 1)} Q${f(hc[0] - d * 1.9)} ${f(hc[1] + 0.6)} ${f(hc[0] - d * 1.5)} ${f(hc[1] + 2.6)} L${f(hc[0] - d * 0.6)} ${f(hc[1] + 2.4)}Z` : '');
      hairN.setAttribute('fill', night(hair, P, 0.3)); hairBack.setAttribute('fill', night(hair, P, 0.3));
      if (hat === 'sun') hatN.setAttribute('d', `M${f(hc[0] - 2.3)} ${f(hc[1] - 0.6)} Q${f(hc[0])} ${f(hc[1] - 1.4)} ${f(hc[0] + 2.3)} ${f(hc[1] - 0.6)} Q${f(hc[0])} ${f(hc[1] - 0.1)} ${f(hc[0] - 2.3)} ${f(hc[1] - 0.6)}Z M${f(hc[0] - 1.1)} ${f(hc[1] - 0.9)} Q${f(hc[0] - 1)} ${f(hc[1] - 2.1)} ${f(hc[0])} ${f(hc[1] - 2.1)} Q${f(hc[0] + 1)} ${f(hc[1] - 2.1)} ${f(hc[0] + 1.1)} ${f(hc[1] - 0.9)}Z`);
      else if (hat === 'cap') hatN.setAttribute('d', `M${f(hc[0] - 1.3)} ${f(hc[1] - 0.4)} Q${f(hc[0] - 1.2)} ${f(hc[1] - 1.6)} ${f(hc[0])} ${f(hc[1] - 1.6)} Q${f(hc[0] + 1.2)} ${f(hc[1] - 1.6)} ${f(hc[0] + 1.3)} ${f(hc[1] - 0.5)} L${f(hc[0] + d * 2.2)} ${f(hc[1] - 0.4)}Z`);
      else hatN.setAttribute('d', '');
      hatN.setAttribute('fill', night(hat === 'sun' ? '#e6cf8e' : top, P));
      if (bag === 'pack') pack.setAttribute('d', `M${f(sh[0] - d * 1.2)} ${f(sh[1] + 0.6)} L${f(sh[0] - d * 2.2)} ${f(sh[1] + 0.9)} L${f(sh[0] - d * 2.2)} ${f(sh[1] + 3.6)} L${f(sh[0] - d * 1.1)} ${f(sh[1] + 3.6)}Z`); else pack.setAttribute('d', '');
      pack.setAttribute('fill', night(bagC, P));
      // the arms and what the hands are doing
      const shp: [number, number] = [sh[0] + d * 0.5, sh[1] + 0.6], shf: [number, number] = [sh[0] - d * 0.4, sh[1] + 0.6];
      const u = p.u ?? 0, act = p.act ?? 'none';
      let hand: [number, number], farHand: [number, number];
      prop.setAttribute('d', ''); prop2.setAttribute('d', '');
      if (p.wave) hand = [shp[0] + d * (0.8 + Math.sin(p.wave * 18) * 0.6), shp[1] - 3.2];
      else if (act === 'photo') hand = [shp[0] + d * 2.2, shp[1] - 1.4];
      else if (act === 'flag') hand = [shp[0] + d * 0.9, shp[1] - 3.4];
      else if (act === 'tray') hand = [shp[0] + d * 2.4, shp[1] - 0.6];
      else if (act === 'phone') hand = [shp[0] + d * 1.3, shp[1] - 1.6];
      else if (act === 'book') hand = [shp[0] + d * 2.2, shp[1] + 1.4];
      else if (act === 'guitar') hand = [shp[0] + d * 1.2, shp[1] + 2.6 + Math.sin(t * 14) * 0.5];
      else if (act === 'balloons') hand = [shp[0] + d * 0.8, shp[1] - 2.6];
      else if (act === 'feed') hand = [shp[0] + d * (1.6 + u * 1.2), shp[1] + 2 - u * 1.2];
      else if (act === 'drink' || act === 'ice') hand = [shp[0] + d * (2 - u * 1.2), shp[1] + 2.6 - u * 4.2];
      else if (p.seat !== undefined) hand = [shp[0] + d * 2.2, shp[1] + 2.8];
      else { const a = p.walk !== undefined ? -Math.sin(p.walk * Math.PI * 2) * 0.9 : 0; hand = [shp[0] + d * a, shp[1] + 3.6 * s]; }
      if (p.seat !== undefined) farHand = act === 'book' || act === 'guitar' ? [shf[0] + d * 2.4, shf[1] + 2] : [shf[0] + d * 1.8, shf[1] + 3.2];
      else { const a = p.walk !== undefined ? Math.sin(p.walk * Math.PI * 2) * 0.9 : 0; farHand = act === 'photo' ? [shf[0] + d * 2.2, shf[1] - 1.2] : [shf[0] + d * a, shf[1] + 3.6 * s]; }
      arm.setAttribute('d', `M${f(shp[0])} ${f(shp[1])} Q${f((shp[0] + hand[0]) / 2 + d * 0.3)} ${f((shp[1] + hand[1]) / 2 + 0.6)} ${f(hand[0])} ${f(hand[1])}`);
      farArm.setAttribute('d', `M${f(shf[0])} ${f(shf[1])} Q${f((shf[0] + farHand[0]) / 2 + d * 0.3)} ${f((shf[1] + farHand[1]) / 2 + 0.6)} ${f(farHand[0])} ${f(farHand[1])}`);
      arm.setAttribute('stroke', night(top, P, 0.4)); farArm.setAttribute('stroke', night(top, P, 0.5));
      if (bag === 'tote' && act !== 'guitar') tote.setAttribute('d', `M${f(shp[0])} ${f(shp[1])} L${f(hip[0] + d * 1.6)} ${f(hip[1] + 0.2)} M${f(hip[0] + d * 0.8)} ${f(hip[1] - 0.6)} L${f(hip[0] + d * 2.4)} ${f(hip[1] - 0.6)} L${f(hip[0] + d * 2.2)} ${f(hip[1] + 1.6)} L${f(hip[0] + d * 1)} ${f(hip[1] + 1.6)}Z`); else tote.setAttribute('d', '');
      tote.setAttribute('fill', night(bagC, P));
      const [hx, hy] = hand;
      if (act === 'photo') { prop.setAttribute('d', `M${f(hx - 0.7)} ${f(hy - 0.6)} L${f(hx + 0.7)} ${f(hy - 0.6)} L${f(hx + 0.7)} ${f(hy + 0.5)} L${f(hx - 0.7)} ${f(hy + 0.5)}Z`); prop.setAttribute('fill', '#2a2a30'); }
      else if (act === 'phone') { prop.setAttribute('d', `M${f(hx - 0.3)} ${f(hy - 0.6)} L${f(hx + 0.3)} ${f(hy - 0.6)} L${f(hx + 0.3)} ${f(hy + 0.5)} L${f(hx - 0.3)} ${f(hy + 0.5)}Z`); prop.setAttribute('fill', '#2a2a30'); }
      else if (act === 'book') { prop.setAttribute('d', `M${f(hx - 1.6 * d)} ${f(hy - 0.9)} L${f(hx + 0.2 * d)} ${f(hy - 0.5)} L${f(hx + 0.2 * d)} ${f(hy + 0.4)} L${f(hx - 1.6 * d)} ${f(hy)}Z`); prop.setAttribute('fill', night('#c8463a', P)); }
      else if (act === 'tray') { prop.setAttribute('d', `M${f(hx - 1.8)} ${f(hy - 0.2)} L${f(hx + 1.8)} ${f(hy - 0.2)} M${f(hx - 0.6)} ${f(hy - 0.2)} l0 -0.9 M${f(hx + 0.5)} ${f(hy - 0.2)} l0 -0.7`); prop.setAttribute('fill', 'none'); }
      else if (act === 'drink') { prop.setAttribute('d', `M${f(hx - 0.4)} ${f(hy - 0.8)} L${f(hx + 0.4)} ${f(hy - 0.8)} L${f(hx + 0.3)} ${f(hy)} L${f(hx - 0.3)} ${f(hy)}Z`); prop.setAttribute('fill', PAPER); }
      else if (act === 'ice') { prop.setAttribute('d', `M${f(hx - 0.45)} ${f(hy - 0.5)} L${f(hx + 0.45)} ${f(hy - 0.5)} L${f(hx)} ${f(hy + 0.9)}Z`); prop.setAttribute('fill', night('#d6a35c', P)); prop2.setAttribute('d', `M${f(hx + 0.55)} ${f(hy - 0.6)} A0.55 0.55 0 1 0 ${f(hx - 0.55)} ${f(hy - 0.6)}Z`); prop2.setAttribute('fill', night(scoop, P)); }
      else if (act === 'flag') { prop.setAttribute('d', `M${f(hx)} ${f(hy + 1.2)} L${f(hx)} ${f(hy - 6)}`); prop.setAttribute('fill', 'none'); prop2.setAttribute('d', `M${f(hx)} ${f(hy - 6)} Q${f(hx + d * 1.4)} ${f(hy - 6.6 + Math.sin(t * 5) * 0.3)} ${f(hx + d * 2.6)} ${f(hy - 6)} L${f(hx + d * 2.6)} ${f(hy - 4.4)} Q${f(hx + d * 1.4)} ${f(hy - 5 + Math.sin(t * 5) * 0.3)} ${f(hx)} ${f(hy - 4.4)}Z`); prop2.setAttribute('fill', night('#e3603c', P)); }
      else if (act === 'guitar') { prop.setAttribute('d', `M${f(hip[0] + d * 0.6)} ${f(hip[1] - 2.6)} Q${f(hip[0] + d * 2.6)} ${f(hip[1] - 2.8)} ${f(hip[0] + d * 2.4)} ${f(hip[1] - 1)} Q${f(hip[0] + d * 2.2)} ${f(hip[1] + 0.6)} ${f(hip[0] + d * 0.4)} ${f(hip[1] - 0.4)} Q${f(hip[0] - d * 0.2)} ${f(hip[1] - 1.6)} ${f(hip[0] + d * 0.6)} ${f(hip[1] - 2.6)}Z`); prop.setAttribute('fill', night('#b8783e', P)); prop2.setAttribute('d', `M${f(hip[0] + d * 1.4)} ${f(hip[1] - 1.6)} L${f(hip[0] + d * 5.2)} ${f(hip[1] - 5)} M${f(hip[0] + d * 5)} ${f(hip[1] - 5.2)} l${f(d * 0.6)} -0.4`); }
      else if (act === 'feed' && u > 0.6) { prop.setAttribute('d', `M${f(hx + d * 0.6)} ${f(hy)} l${f(d * 0.4)} 0.6 M${f(hx + d * 0.9)} ${f(hy - 0.3)} l${f(d * 0.5)} 0.8`); prop.setAttribute('fill', 'none'); }
    },
  };
}

// ------------------------------------------------------------------ actors
export interface Actor { key: number; g: SVGGElement; draw(t: number, dt: number, P: Palette): void; shadow?(sun: Sun): string; done?: boolean; poke?(): void; x?: number; y?: number; leave?(): void }
const scaleOf = (I: Iso) => I.s / 6.5;

/** Someone seated: on a chair, a bench, the fountain's rim or the steps. They sip, read,
 *  look at their phone or eat an ice cream, glance about, and in time get up and go. */
export function seated(I: Iso, layer: Element, x: number, y: number, z: number, seatPx: number, facing: 1 | -1, { act = 'none' as Activity } = {}): Actor {
  const fig = figure(layer, scaleOf(I)), p = I.p(x, y, z);
  fig.g.style.cursor = 'pointer';
  let sipT = -1, next = rnd(2, 9), wave = 0, look = 0, op = 0, leaving = false;
  const a: Actor = {
    key: I.depth(x, y, z), g: fig.g, x, y,
    poke() { wave = 1.4; },
    leave() { leaving = true; },
    shadow: (sun) => (op > 0.3 ? blobShadow(I, sun, x, y, 0.3, 1.1, z) : ''),
    draw(t, dt, P) {
      op = clamp(op + (leaving ? -dt : dt) * 0.8, 0, 1);
      if (leaving && op <= 0) a.done = true;
      next -= dt;
      if (next < 0) { next = rnd(4, 12); if ((act === 'drink' || act === 'ice' || act === 'feed') && Math.random() < 0.7) sipT = 0; else look = Math.random() < 0.5 ? 1.4 : 0; }
      let u = 0;
      if (sipT >= 0) { sipT += dt; u = sipT < 0.6 ? ease(sipT / 0.6) : sipT < 1.6 ? 1 : 1 - ease((sipT - 1.6) / 0.6); if (sipT > 2.2) sipT = -1; }
      wave = Math.max(0, wave - dt); look = Math.max(0, look - dt);
      fig.pose({ facing: (look > 0 && act !== 'book' && act !== 'phone' ? -facing : facing) as 1 | -1, seat: seatPx, act, u, wave: wave > 0 ? t : 0, t }, P);
      fig.g.setAttribute('transform', `translate(${f(p[0])} ${f(p[1])})`);
      fig.g.setAttribute('opacity', f(op));
    },
  };
  return a;
}

/** Someone standing about: part of a tour group, the guide with a flag, a photographer.
 *  They shift their weight, turn to look, take photos; they fade out when told to leave. */
export function standing(I: Iso, layer: Element, x: number, y: number, facing: 1 | -1, { act = 'none' as Activity, kid = false } = {}): Actor {
  const fig = figure(layer, scaleOf(I), { kid }), p = I.p(x, y, 0);
  fig.g.style.cursor = 'pointer';
  let op = 0, leaving = false, wave = 0, next = rnd(1, 6), turn = 0, photo = 0;
  const a: Actor = {
    key: I.depth(x, y), g: fig.g, x, y,
    poke() { wave = 1.4; },
    leave() { leaving = true; },
    shadow: (sun) => (op > 0.3 ? blobShadow(I, sun, x, y, 0.3, kid ? 1.1 : 1.65) : ''),
    draw(t, dt, P) {
      op = clamp(op + (leaving ? -dt : dt) * 0.9, 0, 1);
      if (leaving && op <= 0) a.done = true;
      next -= dt;
      if (next < 0) { next = rnd(2.5, 7); const r = Math.random(); if (r < 0.3) turn = 2; else if (r < 0.55 && act === 'none') photo = 2.4; }
      turn = Math.max(0, turn - dt); photo = Math.max(0, photo - dt); wave = Math.max(0, wave - dt);
      const sway = Math.sin(t * 0.8 + x) * 0.25;
      fig.pose({ facing: (turn > 0 ? -facing : facing) as 1 | -1, act: photo > 0 ? 'photo' : act, wave: wave > 0 ? t : 0, kid, t }, P);
      fig.g.setAttribute('transform', `translate(${f(p[0] + sway)} ${f(p[1])})`);
      fig.g.setAttribute('opacity', f(op));
    },
  };
  return a;
}

/** Someone crossing the square along a list of points, pausing at some (to look up, to take
 *  a photo), then leaving by a side street or into the cathedral. */
export function walker(I: Iso, layer: Element, route: Array<{ x: number; y: number; pause?: number; photo?: boolean; vanish?: boolean }>, { kid = false, waiter = false, height = (_x: number, _y: number): number => 0 } = {}): Actor {
  const fig = figure(layer, scaleOf(I), { kid });
  fig.g.style.cursor = 'pointer';
  let i = 0, x = route[0].x, y = route[0].y, phase = rnd(0, 1), pause = 0, facing: 1 | -1 = 1, wave = 0, op = 0, fading = false;
  const speed = kid ? rnd(1.8, 2.6) : waiter ? 1.4 : rnd(1.0, 1.45);
  const a: Actor = {
    key: I.depth(x, y), g: fig.g, x, y,
    poke() { wave = 1.4; pause = Math.max(pause, 1.4); },
    shadow: (sun) => (op > 0.3 ? blobShadow(I, sun, x, y, 0.3, kid ? 1.1 : 1.65, height(x, y)) : ''),
    draw(t, dt, P) {
      op = clamp(op + (fading ? -dt : dt) * 1.4, 0, 1);
      if (fading && op <= 0) { a.done = true; return; }
      wave = Math.max(0, wave - dt);
      let moving = false;
      if (pause > 0) pause -= dt;
      else if (i < route.length - 1) {
        const tgt = route[i + 1], dx = tgt.x - x, dy = tgt.y - y, dist = Math.hypot(dx, dy), step = speed * dt;
        if (dist <= step) { x = tgt.x; y = tgt.y; i++; pause = tgt.pause ?? 0; if (tgt.vanish || i === route.length - 1) fading = true; }
        else { x += (dx / dist) * step; y += (dy / dist) * step; moving = true; phase += step / (kid ? 1.0 : 1.4); }
        const sx = dx - dy;  // screen-x component of the heading
        if (Math.abs(sx) > 0.05) facing = sx > 0 ? 1 : -1;
      }
      const photo = !moving && pause > 0 && route[i].photo;
      fig.pose({ facing, walk: moving ? phase : undefined, wave: wave > 0 ? t : 0, act: photo ? 'photo' : waiter ? 'tray' : 'none', kid, t }, P);
      const z = height(x, y), s = I.p(x, y, z);
      fig.g.setAttribute('transform', `translate(${f(s[0])} ${f(s[1])})`);
      fig.g.setAttribute('opacity', f(op));
      a.key = I.depth(x, y, z); a.x = x; a.y = y;
    },
  };
  return a;
}

/** A guitarist on a folding stool with the case open at his feet; notes rise as he plays,
 *  and faster when someone drops a coin (click). */
export function musician(I: Iso, layer: Element, x: number, y: number, facing: 1 | -1): Actor {
  const k = scaleOf(I), fig = figure(layer, k), p = I.p(x, y, 0);
  const extra = el('g', {}, fig.g);
  const c = I.p(x + 1.0, y - 0.4, 0), cx = c[0] - p[0], cy = c[1] - p[1];
  el('path', { d: `M${f(cx - 8)} ${f(cy)} L${f(cx + 2)} ${f(cy - 5)} L${f(cx + 8)} ${f(cy - 2)} L${f(cx - 2)} ${f(cy + 3)}Z`, fill: '#3a2c22', stroke: 'currentColor', 'stroke-width': 0.6 }, extra);
  el('path', { d: `M${f(cx - 6.4)} ${f(cy - 0.1)} L${f(cx + 1.6)} ${f(cy - 4)} L${f(cx + 6.4)} ${f(cy - 1.9)} L${f(cx - 1.6)} ${f(cy + 2)}Z`, fill: '#7a2f3a' }, extra);
  const coins = el('path', { fill: '#e0b14a', stroke: 'currentColor', 'stroke-width': 0.2 }, extra);
  el('path', { d: `M${-2.5 * k} 0 L${-1.5 * k} ${-3.4 * k} M${1.4 * k} 0 L${0.6 * k} ${-3.4 * k} M${-2 * k} ${-3.4 * k} L${1.2 * k} ${-3.4 * k}`, stroke: 'currentColor', 'stroke-width': 0.7, fill: 'none' }, extra);
  const notes = el('g', {}, fig.g);
  const noteN: Array<{ t: number; x0: number; n: SVGTextElement }> = [];
  let n = 6, fervour = 0;
  fig.g.style.cursor = 'pointer';
  const a: Actor = {
    key: I.depth(x, y), g: fig.g, x, y,
    poke() { fervour = 3; n = Math.min(20, n + 1); },
    shadow: (sun) => blobShadow(I, sun, x, y, 0.35, 1.2),
    draw(t, dt, P) {
      fervour = Math.max(0, fervour - dt);
      fig.pose({ facing, seat: 3.4, act: 'guitar', t: t * (1 + fervour * 0.6) }, P);
      fig.g.setAttribute('transform', `translate(${f(p[0])} ${f(p[1])})`);
      const cd = [];
      for (let i = 0; i < n; i++) { const qx = cx - 3.6 + (i % 5) * 1.8, qy = cy - 0.6 + Math.floor(i / 5) * 0.8 - (i % 5) * 0.4; cd.push(`M${f(qx + 0.5)} ${f(qy)} a0.5 0.35 0 1 0 -1 0 a0.5 0.35 0 1 0 1 0Z`); }
      coins.setAttribute('d', cd.join(' '));
      if (Math.random() < dt * (1.2 + fervour * 2)) { const tn = el('text', { 'font-size': 7, fill: 'currentColor', 'font-family': 'serif' }, notes) as SVGTextElement; tn.textContent = Math.random() < 0.5 ? '♪' : '♫'; noteN.push({ t: 0, x0: rnd(-2, 2), n: tn }); }
      for (let i = noteN.length - 1; i >= 0; i--) {
        const q = noteN[i]; q.t += dt;
        q.n.setAttribute('x', f(facing * 6 + q.x0 + q.t * 7 * facing)); q.n.setAttribute('y', f(-20 - q.t * 12 + Math.sin(q.t * 6) * 1.5));
        q.n.setAttribute('opacity', f(Math.max(0, 1 - q.t / 2)));
        if (q.t > 2) { q.n.remove(); noteN.splice(i, 1); }
      }
    },
  };
  return a;
}

/** A balloon seller with a bunch of balloons bobbing on their strings in the wind. Click and
 *  one gets away: it rises and drifts off; another is tied on a while later. */
export function balloonSeller(I: Iso, layer: Element, x: number, y: number, facing: 1 | -1, wind: () => number): Actor {
  const k = scaleOf(I), fig = figure(layer, k), p = I.p(x, y, 0);
  const COLS = ['#e3603c', '#f0c93a', '#3f86b8', '#e07a9a', '#8cb45a', '#c8463a', '#5a3a7a', '#f3ecdc'];
  const bunch = el('g', {}, fig.g);
  const balloons = COLS.map((c, i) => ({ c, a: rnd(-0.3, 0.3), v: 0, len: rnd(16, 24) * k * 0.6, ang: (i / COLS.length - 0.5) * 1.1, free: -1, fx: 0, fy: 0, s: el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.35 }, bunch), n: el('path', { stroke: 'currentColor', 'stroke-width': 0.5 }, bunch) }));
  fig.g.style.cursor = 'pointer';
  const a: Actor = {
    key: I.depth(x, y), g: fig.g, x, y,
    poke() { const b = balloons.find((q) => q.free < 0); if (b) { b.free = 0; b.fx = 0; b.fy = 0; } },
    shadow: (sun) => blobShadow(I, sun, x, y, 0.35, 1.7),
    draw(t, dt, P) {
      fig.pose({ facing, act: 'balloons', t }, P);
      fig.g.setAttribute('transform', `translate(${f(p[0])} ${f(p[1])})`);
      const hx = facing * 1.4 * k, hy = -11.4 * k;
      balloons.forEach((b, i) => {
        if (b.free >= 0) { b.free += dt; b.fx += (6 + wind() * 8) * dt; b.fy -= 14 * dt; if (b.free > 9) { b.free = -1; b.fx = 0; b.fy = 0; } }
        else { b.v += (-b.a * 6 + wind() * 0.35 + Math.sin(t * 1.3 + i) * 0.1 - b.v * 1.4) * dt; b.a += b.v * dt; }
        const ang = b.ang + b.a, bx = hx + Math.sin(ang) * b.len + b.fx, by = hy - Math.cos(ang) * b.len + b.fy, r = 2.2 * k * 0.8;
        b.n.setAttribute('d', `M${f(bx)} ${f(by + r * 1.15)} Q${f(bx - r * 1.2)} ${f(by + r * 0.4)} ${f(bx - r)} ${f(by - r * 0.4)} A${f(r)} ${f(r)} 0 0 1 ${f(bx + r)} ${f(by - r * 0.4)} Q${f(bx + r * 1.2)} ${f(by + r * 0.4)} ${f(bx)} ${f(by + r * 1.15)}Z`);
        b.n.setAttribute('fill', night(b.c, P, 0.5));
        const op = b.free < 0 ? 1 : Math.max(0, 1 - b.free / 9);
        b.n.setAttribute('opacity', f(op)); b.s.setAttribute('opacity', f(op));
        b.s.setAttribute('d', b.free < 0 ? `M${f(hx)} ${f(hy)} Q${f((hx + bx) / 2 + Math.sin(t + i) * 0.6)} ${f((hy + by) / 2)} ${f(bx)} ${f(by + r * 1.15)}` : `M${f(bx)} ${f(by + r * 1.15)} q${f(Math.sin(t * 3) * 1.2)} 4 0 8`);
      });
    },
  };
  return a;
}

// ------------------------------------------------------------------ pigeons
/** A flock pecking about the paving. flush() sends them up in a loop over the square to
 *  settle again a few seconds later; anyone running at them flushes them too. */
export function pigeons(I: Iso, layer: Element, cx: number, cy: number, n = 16) {
  const k = scaleOf(I);
  const birds = Array.from({ length: n }, () => {
    const g = el('g', { style: 'cursor:pointer' }, layer);
    const inner = el('g', { transform: `scale(${f(k)})` }, g);
    const body = el('path', { stroke: 'currentColor', 'stroke-width': 0.3 }, inner);
    const wings = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.45, 'stroke-linecap': 'round' }, inner);
    return { g, body, wings, x: cx + rnd(-4, 4), y: cy + rnd(-3, 3), z: 0, dir: Math.random() < 0.5 ? 1 : -1, peck: rnd(0, 6), next: rnd(0.5, 3), hop: 0, fly: -1, from: [0, 0], to: [0, 0], loop: rnd(5, 9), grey: pick(['#8f939c', '#a3a6ad', '#7d818c', '#b9b6b0']) };
  });
  const api = {
    birds,
    home: [cx, cy],
    flush() { birds.forEach((b) => { if (b.fly < 0) { b.fly = 0; b.from = [b.x, b.y]; b.to = [api.home[0] + rnd(-4, 4), api.home[1] + rnd(-3, 3)]; b.loop = rnd(5, 9); } }); },
    near(x: number, y: number, r = 3) { return birds.some((b) => b.fly < 0 && Math.hypot(b.x - x, b.y - y) < r); },
    actors(): Actor[] {
      return birds.map((b) => {
        const a: Actor = {
          key: 0, g: b.g,
          poke: () => api.flush(),
          draw(t: number, dt: number, P: Palette) {
            if (b.fly >= 0) {
              b.fly += dt / b.loop;
              const u = b.fly, an = u * Math.PI * 2;
              b.x = b.from[0] + (b.to[0] - b.from[0]) * u + Math.sin(an) * 9; b.y = b.from[1] + (b.to[1] - b.from[1]) * u - Math.sin(an) * 6;
              b.z = Math.sin(Math.PI * u) * 14;
              b.dir = Math.cos(an) > 0 ? 1 : -1;
              if (u >= 1) { b.fly = -1; b.z = 0; }
            } else {
              b.next -= dt;
              if (b.next < 0) { b.next = rnd(0.6, 3); if (Math.random() < 0.5) b.dir *= -1; else b.hop = 1; }
              if (b.hop > 0) { b.hop = Math.max(0, b.hop - dt * 3); b.x += b.dir * dt * 0.9; }
            }
            const s = I.p(b.x, b.y, b.z), d = b.dir, flying = b.fly >= 0;
            const bob = flying ? 0 : Math.max(0, Math.sin(t * 6 + b.peck)) * 0.6;
            b.body.setAttribute('d', `M${f(-1.3 * d)} -0.9 Q${f(-0.2 * d)} -2 ${f(0.9 * d)} -1.3 L${f(1.4 * d)} ${f(-1.9 + bob)} L${f(1.2 * d)} ${f(-1 + bob * 0.5)} Q${f(0.2 * d)} 0 ${f(-1.3 * d)} -0.9Z`);
            b.body.setAttribute('fill', night(b.grey, P, 0.6));
            const fl = Math.sin(t * 30 + b.peck) * 1.6;
            b.wings.setAttribute('d', flying ? `M0 -1.4 L${f(-1.4 * d)} ${f(-1.4 - fl)} M0.3 -1.4 L${f(1.2 * d)} ${f(-1.4 - fl * 0.8)}` : '');
            b.g.setAttribute('transform', `translate(${f(s[0])} ${f(s[1])})`);
            a.key = flying ? 999 : I.depth(b.x, b.y);
            a.x = b.x; a.y = b.y;
          },
          // a bird in the air casts a small dot pushed along the sun, not a streak from the ground
          shadow: (sun: Sun) => blobShadow(I, sun, b.x + sun.cast[0] * b.z, b.y + sun.cast[1] * b.z, 0.15, 0.3),
        };
        return a;
      });
    },
  };
  return api;
}
