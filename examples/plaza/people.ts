// people.ts — the square's people and pigeons, seen from above at about 7 px a metre.
//
// At aerial scale a person is ~12 px tall: posture, placement and motion carry everything,
// detail carries nothing. Figures are upright "billboards" drawn at the screen point of
// their feet, in profile facing screen-left or screen-right (whichever way they're heading
// or looking), with a soft ground shadow that follows the sun.
import { el, f, PAPER } from '../../lib/ink.ts';
import { type Iso, type Sun, blobShadow } from '../../lib/iso.ts';
import { toRGB, rgb, mix, type Palette } from '../../lib/daynight.ts';

const rnd = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]): T => a[(Math.random() * a.length) | 0];
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const ease = (t: number) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
const LW = 0.55;   // figure pen, px
const CLOTHES = ['#2c4a73', '#c8463a', '#3e6b52', '#d9a441', '#7a2f3a', '#e3ddd0', '#6b7b8c', '#2a2a30', '#b0523a', '#5a3a7a'];
const HAIR = ['#2a2420', '#5a3a24', '#8a6a3c', '#cfcac0', '#1c1c1c'];
const night = (c: string, P: Palette, k = 0.55) => rgb(mix(toRGB(c), mix(toRGB(c), [12, 16, 30], 0.6), P.inkT * k));

// ------------------------------------------------------------------ one figure
interface Pose { facing: 1 | -1; walk?: number; seat?: number; drink?: number; wave?: number; camera?: number; kid?: boolean; tray?: boolean }
function figure(parent: Element) {
  const g = el('g', {}, parent);
  const top = pick(CLOTHES), bottom = pick(['#2a2a30', '#3d5a80', '#6b5a48', top]), hair = pick(HAIR), skirt = Math.random() < 0.35;
  const legA = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': LW * 1.4, 'stroke-linecap': 'round' }, g);
  const legB = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': LW * 1.4, 'stroke-linecap': 'round' }, g);
  const body = el('path', { stroke: 'currentColor', 'stroke-width': LW }, g);
  const arm = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': LW * 1.1, 'stroke-linecap': 'round' }, g);
  const head = el('circle', { r: 1.3, fill: PAPER, stroke: 'currentColor', 'stroke-width': LW }, g);
  const hairN = el('path', {}, g);
  const prop = el('path', { stroke: 'currentColor', 'stroke-width': LW * 0.7 }, g);
  return {
    g,
    pose(p: Pose, P: Palette) {
      const d = p.facing, s = p.kid ? 0.72 : 1;
      let hip: [number, number], sh: [number, number];
      if (p.seat !== undefined) {
        const hs = p.seat;
        hip = [0, -hs - 0.4];
        const knee: [number, number] = [d * 2.3, -hs - (hs < 3 ? 1.2 : 0.4)];
        legA.setAttribute('d', `M${f(hip[0])} ${f(hip[1])} L${f(knee[0])} ${f(knee[1])} L${f(d * 2.5)} 0`);
        legB.setAttribute('d', `M${f(hip[0] - d * 0.4)} ${f(hip[1])} L${f(knee[0] - d * 0.5)} ${f(knee[1] + 0.2)} L${f(d * 2.1)} 0.2`);
        sh = [d * 0.35, hip[1] - 4.3];
      } else {
        const sw = p.walk !== undefined ? Math.sin(p.walk * Math.PI * 2) * 1.35 * s : 0.35;
        const lift = p.walk !== undefined ? Math.max(0, Math.sin(p.walk * Math.PI * 2 + 1.6)) * 0.3 : 0;
        hip = [0, -5.5 * s - lift];
        legA.setAttribute('d', `M${f(hip[0])} ${f(hip[1])} L${f(sw)} 0`);
        legB.setAttribute('d', `M${f(hip[0])} ${f(hip[1])} L${f(-sw)} 0`);
        sh = [d * 0.2, hip[1] - 4.2 * s];
      }
      const hw = 1.25 * s, low = skirt && p.seat === undefined ? hip[1] + 2.4 : hip[1] + 0.6;
      body.setAttribute('d', `M${f(hip[0] - hw * (skirt ? 1.25 : 1))} ${f(low)} Q${f(sh[0] - hw * 1.1)} ${f(sh[1] + 2)} ${f(sh[0] - hw)} ${f(sh[1] + 0.5)} Q${f(sh[0])} ${f(sh[1] - 0.4)} ${f(sh[0] + hw)} ${f(sh[1] + 0.5)} Q${f(sh[0] + hw * 1.1)} ${f(sh[1] + 2)} ${f(hip[0] + hw * (skirt ? 1.25 : 1))} ${f(low)}Z`);
      body.setAttribute('fill', night(top, P));
      legA.setAttribute('stroke', night(bottom, P, 0.4)); legB.setAttribute('stroke', night(bottom, P, 0.4));
      const hc: [number, number] = [sh[0] + d * 0.25, sh[1] - 1.7 * (p.kid ? 0.9 : 1)];
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1])); head.setAttribute('r', f(p.kid ? 1.15 : 1.3));
      hairN.setAttribute('d', `M${f(hc[0] - d * 1.35)} ${f(hc[1] + 0.3)} Q${f(hc[0] - d * 1.2)} ${f(hc[1] - 1.5)} ${f(hc[0] + d * 0.4)} ${f(hc[1] - 1.35)} Q${f(hc[0] - d * 0.4)} ${f(hc[1] - 0.6)} ${f(hc[0] - d * 1.35)} ${f(hc[1] + 0.3)}Z`);
      hairN.setAttribute('fill', night(hair, P, 0.3));
      // the near arm: swinging, holding a cup to the lips, waving, lifting a camera, carrying a tray
      const shp: [number, number] = [sh[0] + d * 0.5, sh[1] + 0.6];
      let hand: [number, number];
      if (p.wave) hand = [shp[0] + d * (0.8 + Math.sin(p.wave * 18) * 0.6), shp[1] - 3.2];
      else if (p.camera) hand = [shp[0] + d * 2.2, shp[1] - 1.4];
      else if (p.tray) hand = [shp[0] + d * 2.4, shp[1] - 0.6];
      else if (p.drink) hand = [shp[0] + d * (2 - p.drink * 1.2), shp[1] + 2.6 - p.drink * 4.2];
      else if (p.seat !== undefined) hand = [shp[0] + d * 2.2, shp[1] + 2.8];
      else { const a = p.walk !== undefined ? -Math.sin(p.walk * Math.PI * 2) * 0.9 : 0; hand = [shp[0] + d * a, shp[1] + 3.6 * s]; }
      arm.setAttribute('d', `M${f(shp[0])} ${f(shp[1])} L${f(hand[0])} ${f(hand[1])}`);
      if (p.camera) prop.setAttribute('d', `M${f(hand[0] - 0.7)} ${f(hand[1] - 0.6)} L${f(hand[0] + 0.7)} ${f(hand[1] - 0.6)} L${f(hand[0] + 0.7)} ${f(hand[1] + 0.5)} L${f(hand[0] - 0.7)} ${f(hand[1] + 0.5)}Z`);
      else if (p.tray) prop.setAttribute('d', `M${f(hand[0] - 1.8)} ${f(hand[1] - 0.2)} L${f(hand[0] + 1.8)} ${f(hand[1] - 0.2)} M${f(hand[0] - 0.6)} ${f(hand[1] - 0.2)} l0 -0.9 M${f(hand[0] + 0.5)} ${f(hand[1] - 0.2)} l0 -0.7`);
      else if (p.drink !== undefined) prop.setAttribute('d', `M${f(hand[0] - 0.4)} ${f(hand[1] - 0.8)} L${f(hand[0] + 0.4)} ${f(hand[1] - 0.8)} L${f(hand[0] + 0.3)} ${f(hand[1])} L${f(hand[0] - 0.3)} ${f(hand[1])}Z`);
      else prop.setAttribute('d', '');
      prop.setAttribute('fill', p.camera ? '#2a2a30' : PAPER);
    },
  };
}

// ------------------------------------------------------------------ actors
export interface Actor { key: number; g: SVGGElement; draw(t: number, dt: number, P: Palette): void; shadow?(sun: Sun): string; done?: boolean; poke?(): void }

/** Someone seated: on a chair, a bench, the fountain's rim or the cathedral steps. They
 *  drink, glance about, and now and then get up and leave, or someone new sits down. */
export function seated(I: Iso, layer: Element, x: number, y: number, z: number, seatPx: number, facing: 1 | -1, { drinks = false } = {}): Actor {
  const fig = figure(layer), p = I.p(x, y, z);
  fig.g.style.cursor = 'pointer';
  let sipT = -1, next = rnd(2, 9), wave = 0, look = 0, op = 0, leaving = false;
  const a: Actor = {
    key: I.depth(x, y, z), g: fig.g,
    poke() { wave = 1.4; },
    shadow: (sun) => (op > 0.3 ? blobShadow(I, sun, x, y, 0.3, z + 1.1) : ''),
    draw(t, dt, P) {
      op = clamp(op + (leaving ? -dt : dt) * 0.8, 0, 1);
      if (leaving && op <= 0) a.done = true;
      next -= dt;
      if (next < 0) { next = rnd(4, 12); if (drinks && Math.random() < 0.6) sipT = 0; else look = Math.random() < 0.5 ? 1.2 : 0; }
      let drink = 0;
      if (sipT >= 0) { sipT += dt; drink = sipT < 0.6 ? ease(sipT / 0.6) : sipT < 1.6 ? 1 : 1 - ease((sipT - 1.6) / 0.6); if (sipT > 2.2) sipT = -1; }
      wave = Math.max(0, wave - dt); look = Math.max(0, look - dt);
      const d = (look > 0 ? -facing : facing) as 1 | -1;
      fig.pose({ facing: d, seat: seatPx, drink: drinks ? drink : undefined, wave: wave > 0 ? t : 0 }, P);
      fig.g.setAttribute('transform', `translate(${f(p[0])} ${f(p[1])})`);
      fig.g.setAttribute('opacity', f(op));
    },
  };
  (a as any).leave = () => (leaving = true);
  return a;
}

/** Someone crossing the square: along a list of points, pausing at some of them (to look
 *  at the cathedral, to take a photo), then leaving by a side street or into the cathedral. */
export function walker(I: Iso, layer: Element, route: Array<{ x: number; y: number; pause?: number; photo?: boolean; vanish?: boolean }>, { kid = false, waiter = false, height = (_x: number, _y: number): number => 0 } = {}): Actor {
  const fig = figure(layer);
  fig.g.style.cursor = 'pointer';
  let i = 0, x = route[0].x, y = route[0].y, phase = rnd(0, 1), pause = 0, facing: 1 | -1 = 1, wave = 0, op = 0, fading = false;
  const speed = kid ? rnd(1.8, 2.6) : waiter ? 1.4 : rnd(1.0, 1.45);
  const a: Actor = {
    key: 0, g: fig.g,
    poke() { wave = 1.4; pause = Math.max(pause, 1.4); },
    shadow: (sun) => (op > 0.3 ? blobShadow(I, sun, x, y, 0.3, (kid ? 1.1 : 1.6)) : ''),
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
      fig.pose({ facing, walk: moving ? phase : undefined, wave: wave > 0 ? t : 0, camera: photo ? 1 : 0, kid, tray: waiter }, P);
      const z = height(x, y), s = I.p(x, y, z);
      fig.g.setAttribute('transform', `translate(${f(s[0])} ${f(s[1])})`);
      fig.g.setAttribute('opacity', f(op));
      a.key = I.depth(x, y, z);
      (a as any).x = x; (a as any).y = y;
    },
  };
  a.key = I.depth(x, y);
  return a;
}

// ------------------------------------------------------------------ pigeons
/** A flock pecking about the paving. flush() sends them up in a loop over the square to
 *  settle again a few seconds later; anyone running at them flushes them too. */
export function pigeons(I: Iso, layer: Element, cx: number, cy: number, n = 16) {
  const birds = Array.from({ length: n }, () => {
    const g = el('g', { style: 'cursor:pointer' }, layer);
    const body = el('path', { stroke: 'currentColor', 'stroke-width': 0.35 }, g);
    const wings = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': 0.5, 'stroke-linecap': 'round' }, g);
    return { g, body, wings, x: cx + rnd(-4, 4), y: cy + rnd(-3, 3), z: 0, dir: Math.random() < 0.5 ? 1 : -1, peck: rnd(0, 6), next: rnd(0.5, 3), hop: 0, fly: -1, from: [0, 0], to: [0, 0], loop: rnd(5, 9), grey: pick(['#8f939c', '#a3a6ad', '#7d818c', '#b9b6b0']) };
  });
  const api = {
    birds,
    flush() { birds.forEach((b) => { if (b.fly < 0) { b.fly = 0; b.from = [b.x, b.y]; b.to = [cx + rnd(-6, 6), cy + rnd(-4, 4)]; b.loop = rnd(5, 9); } }); },
    near(x: number, y: number, r = 3) { return birds.some((b) => b.fly < 0 && Math.hypot(b.x - x, b.y - y) < r); },
    actors(): Actor[] {
      return birds.map((b) => ({
        key: 0, g: b.g,
        poke: () => api.flush(),
        draw(t: number, dt: number, P: Palette) {
          if (b.fly >= 0) {
            b.fly += dt / b.loop;
            const u = b.fly, a = u * Math.PI * 2;
            b.x = b.from[0] + (b.to[0] - b.from[0]) * u + Math.sin(a) * 9; b.y = b.from[1] + (b.to[1] - b.from[1]) * u - Math.sin(a) * 6;
            b.z = Math.sin(Math.PI * u) * 14;
            b.dir = Math.cos(a) > 0 ? 1 : -1;
            if (u >= 1) { b.fly = -1; b.z = 0; }
          } else {
            b.next -= dt;
            if (b.next < 0) { b.next = rnd(0.6, 3); if (Math.random() < 0.5) b.dir *= -1; else b.hop = 1; }
            if (b.hop > 0) { b.hop = Math.max(0, b.hop - dt * 3); b.x += b.dir * dt * 0.9; }
          }
          const s = I.p(b.x, b.y, b.z), d = b.dir, flying = b.fly >= 0;
          const bob = flying ? 0 : Math.max(0, Math.sin(t * 6 + b.peck)) * 0.6;
          b.body.setAttribute('d', `M${f(-1.3 * d)} -0.9 Q${f(-0.2 * d)} -2 ${f(0.9 * d)} -1.3 L${f((1.4) * d)} ${f(-1.9 + bob)} L${f(1.2 * d)} ${f(-1 + bob * 0.5)} Q${f(0.2 * d)} 0 ${f(-1.3 * d)} -0.9Z`);
          b.body.setAttribute('fill', night(b.grey, P, 0.6));
          const fl = Math.sin(t * 30 + b.peck) * 1.6;
          b.wings.setAttribute('d', flying ? `M0 -1.4 L${f(-1.4 * d)} ${f(-1.4 - fl)} M0.3 -1.4 L${f(1.2 * d)} ${f(-1.4 - fl * 0.8)}` : '');
          b.g.setAttribute('transform', `translate(${f(s[0])} ${f(s[1])})`);
          (this as Actor).key = flying ? 999 : I.depth(b.x, b.y);
        },
        // a bird in the air casts a small dot pushed along the sun, not a streak from the ground
        shadow: (sun: Sun) => blobShadow(I, sun, b.x + sun.cast[0] * b.z, b.y + sun.cast[1] * b.z, 0.15, 0.3),
      }));
    },
  };
  return api;
}
