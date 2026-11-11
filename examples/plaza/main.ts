// Plaza de la Catedral — the steps of a cathedral and the square before them, seen from
// above and close, from dawn to night. Turn the hands of the tower clock to change the
// time; move the pointer to make wind; click the bells, the pigeons, the balloons, anyone.
//
// Three stacked SVGs: the square itself (ink-filtered, redrawn only when the light has
// changed enough to see), everything that moves (people, pigeons, props, bells, the clock's
// hands, their shadows), and the night's glow (blended, switched off by day).
import { el, inkDefs, run, f } from '../../lib/ink.ts';
import { iso, sunAt, wallShadow, type V3 } from '../../lib/iso.ts';
import { palette, rgb } from '../../lib/daynight.ts';
import { pointerWind } from '../../lib/motion.ts';
import { buildSquare, buildProps, shade, drawLights, put, FRONT, FOUNTAIN, WALLS, type Prop } from './build.ts';
import { seated, standing, walker, musician, balloonSeller, pigeons, type Actor, type Activity } from './people.ts';

const W = 960, H = 600;
const q = new URLSearchParams(location.search);
const host = document.querySelector('#plaza') as HTMLElement;
const layer = (attrs: Record<string, string> = {}) => { const s = el('svg', { viewBox: `0 0 ${W} ${H}`, ...attrs }); host.appendChild(s); return s; };
const base = layer({ role: 'img', 'aria-label': 'An ink drawing of the steps of a Gothic cathedral and the square before them, seen from above and close: the carved portal and rose window, the tower clock, people sitting on the steps and at a café, a tour group, a guitarist, a balloon seller, pigeons, through day and night.' });
const svg = layer({ 'aria-hidden': 'true' });                       // everything that moves
const glowSvg = layer({ 'aria-hidden': 'true', class: 'glow' });    // the night's light
const ink = inkDefs(base, 'p');
const defs = ink.defs, dynDefs = el('defs', {}, svg);
// close in: 16 px a metre, the west front and its neighbours filling the top: no sky at all
const I = iso({ scale: 16, origin: [538, 226] });

// the square: paving, shadows on it, buildings, shadows on their walls
// (the ink-wobble filter is sub-pixel at this scale but the browser re-runs it over the whole
// card every frame: it's left off here, ?ink turns it back on)
const scene = el('g', q.has('ink') ? { filter: ink.filter } : {}, base);
const groundL = el('g', {}, scene), shadowL = el('g', {}, scene), buildL = el('g', {}, scene);
// shadows fall only on the paving (the clip is shared with the moving layer)
const GROUND = I.poly([[-12, -12, 0], [70, -12, 0], [70, 70, 0], [-12, 70, 0]]);
el('path', { d: GROUND }, el('clipPath', { id: 'p-groundclip' }, defs));
shadowL.setAttribute('clip-path', 'url(#p-groundclip)');
const SHADOW = '#2d2b44';
const shadowPath = el('path', { fill: SHADOW, stroke: 'none' }, shadowL);
// moving things: their shadows, the bells and clock hands, then people, pigeons and
// furniture sorted by depth
el('path', { d: GROUND }, el('clipPath', { id: 'p-groundclip2' }, dynDefs));
const dynShadowL = el('g', { 'clip-path': 'url(#p-groundclip2)' }, svg);
const dynShadow = el('path', { fill: SHADOW, stroke: 'none' }, dynShadowL);
const dynL = el('g', {}, svg), actorL = el('g', {}, svg);
if (q.has('ink')) { dynL.setAttribute('filter', ink.filter); actorL.setAttribute('filter', ink.filter); }
const glow = el('g', { style: 'mix-blend-mode:screen' }, glowSvg);

// ------------------------------------------------------------------ time and wind
let tau = q.has('tau') ? +q.get('tau')! : q.has('start') ? +q.get('start')! : 0.42;
let frozen = q.has('tau'), scrubbing = false;
const DAY = q.has('day') ? +q.get('day')! : 240;
const wind = pointerWind(svg, 0.25);
const hint = document.querySelector('#hint')!;
const hideHint = () => hint.classList.add('gone');
setTimeout(hideHint, 14000);
const on = (n: Element, fn: () => void) => n.addEventListener('pointerdown', (e) => { e.stopPropagation(); fn(); hideHint(); });

// ------------------------------------------------------------------ the square
const square = buildSquare(I, { ground: groundL, build: buildL, glow, defs, dyn: dynL });

// the tower clock keeps the scene's time: drag its hands round to change it (the hour hand
// goes round twice a day). The dial is on the tower's x = 0 face: a pointer is taken back
// into that wall's metres (y along it, z up) to read its angle on the dial.
const [, cy0, cz0] = square.clockAt;
const toSvg = (e: PointerEvent) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM()!.inverse()); };
const dialAngle = (e: PointerEvent) => { const p = toSvg(e), y = (I.ox - p.x) / I.s, z = (I.oy + (y * I.s) / 2 - p.y) / (I.s * I.zs); return Math.atan2(-(y - cy0), z - cz0); };
const dialHit = el('path', { d: Array.from({ length: 33 }, (_, i) => { const a = (i / 32) * Math.PI * 2; return (i ? 'L' : 'M') + I.pt(0, cy0 + Math.sin(a) * 2.6, cz0 + Math.cos(a) * 2.6); }).join(' ') + 'Z', fill: 'transparent', style: 'cursor:grab' }, svg);
el('title', {}, dialHit).textContent = 'Turn the clock to change the time';
let dragA: number | null = null;
dialHit.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); dragA = dialAngle(e as PointerEvent); scrubbing = true; frozen = false; svg.setPointerCapture?.((e as PointerEvent).pointerId); (dialHit as SVGElement).style.cursor = 'grabbing'; hideHint(); });
svg.addEventListener('pointermove', (e) => {
  if (dragA === null) return;
  const a = dialAngle(e); let da = a - dragA; dragA = a;
  da = ((da + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  tau = ((tau + da / (Math.PI * 4)) % 1 + 1) % 1;
});
const endDrag = () => { dragA = null; scrubbing = false; (dialHit as SVGElement).style.cursor = 'grab'; };
svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);

const props: Prop[] = buildProps(I, actorL, glow, defs);
const flock = pigeons(I, actorL, 14.5, 23.5, 18);
const actors: Actor[] = [...flock.actors()];
const bellHit = el('path', { d: [[2, 9], [17, 24]].map(([a, b]) => `M${I.pt(0, b, 25)} L${I.pt(0, a, 25)} L${I.pt(0, a, 30)} L${I.pt(0, b, 30)}Z`).join(' '), fill: 'transparent', style: 'cursor:pointer' }, svg);
el('title', {}, bellHit).textContent = 'Ring the bells';
const ringBells = () => { square.bells.poke(); setTimeout(() => flock.flush(), 300); };
on(bellHit, ringBells);
const add = (a: Actor) => { actors.push(a); on(a.g, () => a.poke?.()); return a; };
flock.birds.forEach((b) => on(b.g, () => flock.flush()));

// the regulars: a guitarist by the alley, a balloon seller by the fountain
add(musician(I, actorL, 6.4, 26.4, 1));
add(balloonSeller(I, actorL, 17.2, 20.4, -1, () => wind.value));

// ------------------------------------------------------------------ who's sitting where
// Seats fill and empty with the hour: terraces busy at lunch and late into the night,
// the steps and benches in the day.
type Kind = 'steps' | 'terrace' | 'rest';
const busy = (k: Kind) => {
  const t = tau;
  if (k === 'terrace') return t < 0.06 ? 0.45 : t < 0.36 ? 0.05 : t < 0.46 ? 0.4 : t < 0.62 ? 0.8 : t < 0.8 ? 0.5 : 0.85;
  if (k === 'steps') return t > 0.3 && t < 0.82 ? 0.65 : t > 0.82 && t < 0.95 ? 0.35 : 0.04;
  return t > 0.3 && t < 0.86 ? 0.55 : 0.08;
};
interface Seat { x: number; y: number; z: number; px: number; facing: 1 | -1; kind: Kind; act: Activity[]; who: Actor | null; next: number }
const seats: Seat[] = [];
const seat = (x: number, y: number, z: number, px: number, facing: 1 | -1, kind: Kind, act: Activity[] = ['none']) => seats.push({ x, y, z, px, facing, kind, act, who: null, next: 0 });
const STEP_ACTS: Activity[] = ['none', 'ice', 'phone', 'book', 'drink', 'none'];
// on a step the knees come up above the hips: a low seat, feet one tread down
for (const y of [3.2, 4.4, 6.6, 8.2, 17.6, 19, 20.6, 22.4, 23.6]) seat(3.4, y, 0.3, 2.3, Math.random() < 0.8 ? 1 : -1, 'steps', STEP_ACTS);
for (const y of [2.6, 5.4, 7.6, 18.4, 21.2, 23]) seat(1.4, y, 0.9, 2.3, 1, 'steps', STEP_ACTS);
for (const [tx, ty] of [[16.5, 2.4], [20, 2.4], [23.5, 2.4], [27, 2.4], [18.2, 5.4], [21.8, 5.4], [25.4, 5.4]]) { seat(tx - 0.85, ty + 0.3, 0, 3.2, 1, 'terrace', ['drink']); seat(tx + 0.85, ty - 0.3, 0, 3.2, -1, 'terrace', ['drink']); }
for (const deg of [10, 60, 105, 160]) { const a = (deg * Math.PI) / 180, ox = Math.cos(a), oy = Math.sin(a); seat(FOUNTAIN[0] + ox * 2.85, FOUNTAIN[1] + oy * 2.85, 0, 4.6, ox - oy > 0 ? 1 : -1, 'rest', ['none', 'ice', 'phone']); }
for (const [x, y] of [[13.7, 27.6], [21.8, 19.8], [23.2, 19.8]]) seat(x, y, 0, 3, -1, 'rest', ['none', 'book', 'phone']);
// someone who feeds the pigeons from the bench, every day
add(seated(I, actorL, 12.4, 27.6, 0, 3, -1, { act: 'feed' }));

// the morning-to-evening tour group in front of the portal: a guide with a flag, listeners
let tour: Actor[] = [], tourT = 0;
function tourArrives() {
  tour = [add(standing(I, actorL, 13, 6.4, 1, { act: 'flag' }))];
  for (const [x, y] of [[14.6, 5.2], [15.3, 7.1], [16, 5.9], [16.8, 7.8], [14.7, 8.5], [17.2, 6.3], [15.6, 4.5]]) tour.push(add(standing(I, actorL, x + Math.random() * 0.3, y + Math.random() * 0.3, -1, { kid: Math.random() < 0.12 })));
}

// ------------------------------------------------------------------ people crossing
const stepsZ = (x: number, y: number) => {
  if (x >= 0 && x < 4 && y >= FRONT.y0 - 1 && y <= FRONT.y1 + 1) return Math.min(4, Math.floor(4 - x) + 1) * 0.3;
  if (x < 0 && x >= -FRONT.recess && y > FRONT.y0 + 7 && y < FRONT.y1 - 7) return 1.2;
  return 0;
};
type Pt = { x: number; y: number; pause?: number; photo?: boolean; vanish?: boolean };
// the square is closed in by houses; people come and go by the streets between them
const ENTRANCES: Pt[] = [{ x: -2.6, y: 26.4 }, { x: 22, y: 47 }, { x: 52, y: 20 }, { x: 22, y: 47 }, { x: 52, y: 20 }];
const around = (a: Pt, b: Pt): Pt[] => {
  const [cx, cy] = FOUNTAIN, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy) / L2)), px = a.x + dx * u, py = a.y + dy * u, d = Math.hypot(px - cx, py - cy);
  if (d > 4.2) return [b];
  const nx = (px - cx) / (d || 1), ny = (py - cy) / (d || 1);
  return [{ x: cx + (d ? nx : -dy / Math.sqrt(L2)) * 4.8, y: cy + (d ? ny : dx / Math.sqrt(L2)) * 4.8 }, b];
};
const route = (pts: Pt[]) => { const r: Pt[] = [pts[0]]; for (let i = 1; i < pts.length; i++) r.push(...around(r[r.length - 1], pts[i])); return r; };
const anyEntrance = () => ENTRANCES[(Math.random() * ENTRANCES.length) | 0];
function spawnWalker() {
  const r = Math.random(), lane = FRONT.cy + (Math.random() - 0.5) * 2.4;
  let pts: Pt[];
  if (r < 0.3) pts = [anyEntrance(), { x: 18 + Math.random() * 6, y: lane + (Math.random() - 0.5) * 6, pause: 2.5 + Math.random() * 3, photo: true }, { x: 6.2, y: lane }, { x: 0.4, y: lane }, { x: -1, y: lane, vanish: true }];
  else if (r < 0.45) pts = [{ x: -1, y: lane }, { x: 0.4, y: lane }, { x: 6.2, y: lane }, anyEntrance()];
  else pts = [anyEntrance(), { x: 8 + Math.random() * 22, y: 8 + Math.random() * 18, pause: Math.random() < 0.4 ? 1.5 + Math.random() * 3 : 0, photo: Math.random() < 0.35 }, anyEntrance()];
  add(walker(I, actorL, route(pts), { height: stepsZ }));
}
function spawnKid() {
  const b = flock.birds[0];
  add(walker(I, actorL, route([anyEntrance(), { x: b.x + 0.5, y: b.y + 0.5 }, { x: b.x + 6, y: b.y - 6, pause: 1 }, anyEntrance()]), { kid: true, height: stepsZ }));
}
function spawnWaiter() {
  const tables = [[16.5, 2.4], [20, 2.4], [23.5, 2.4], [27, 2.4], [18.2, 5.4], [21.8, 5.4], [25.4, 5.4]], [tx, ty] = tables[(Math.random() * tables.length) | 0];
  add(walker(I, actorL, [{ x: 20.5, y: 0.3 }, { x: 20.5, y: 1.2 }, { x: tx + 0.2, y: ty + 1, pause: 2.2 }, { x: 20.5, y: 1.2 }, { x: 20.5, y: 0.3, vanish: true }], { waiter: true }));
}
let walkT = 0, kidT = 15, waiterT = 4;
for (let k = 0; k < 7; k++) { spawnWalker(); const a = actors[actors.length - 1]; for (let s = 0; s < 40 + k * 40; s++) a.draw(s / 10, 0.1, palette(tau)); }

// ------------------------------------------------------------------ clock
const clock = document.querySelector('#clock')!;
const period = (h: number) => (h < 5 ? 'madrugada' : h < 7 ? 'amanecer' : h < 12 ? 'mañana' : h < 14 ? 'mediodía' : h < 19 ? 'tarde' : h < 21 ? 'atardecer' : 'noche');
let lastHour = -1, lastLabel = '', lastInk = '', staticTau = -1;
const card = document.querySelector('#card') as HTMLElement;

// ------------------------------------------------------------------ shadows up the walls
// Each wall that faces the square takes the shadows of every box in front of it, clipped to
// the wall: the cathedral's front in the morning, the shops' in the afternoon.
const clipRect = (pts: Array<[number, number]>, u0: number, u1: number, h: number) => {
  let out = pts;
  const edge = (inside: (p: [number, number]) => boolean, cut: (a: [number, number], b: [number, number]) => [number, number]) => {
    const res: Array<[number, number]> = [];
    out.forEach((p, i) => { const q2 = out[(i + 1) % out.length], a = inside(p), b = inside(q2); if (a) res.push(p); if (a !== b) res.push(cut(p, q2)); });
    out = res;
  };
  const atU = (u: number) => (a: [number, number], b: [number, number]): [number, number] => [u, a[1] + ((b[1] - a[1]) * (u - a[0])) / (b[0] - a[0])];
  const atZ = (z: number) => (a: [number, number], b: [number, number]): [number, number] => [a[0] + ((b[0] - a[0]) * (z - a[1])) / (b[1] - a[1]), z];
  edge((p) => p[0] >= u0, atU(u0)); if (out.length) edge((p) => p[0] <= u1, atU(u1));
  if (out.length) edge((p) => p[1] >= 0, atZ(0)); if (out.length) edge((p) => p[1] <= h, atZ(h));
  return out;
};
function wallShadows(sun: ReturnType<typeof sunAt>) {
  const d = { x: [] as string[], y: [] as string[] };
  for (const [axis, u0, u1, h, c = 0] of WALLS) {
    for (const [a, b] of square.boxes) {
      const sh = wallShadow(sun, a, b, axis, c);
      if (!sh) continue;
      const k = axis === 'x' ? 1 : 0, poly = clipRect(sh.map((P) => [P[k], P[2]] as [number, number]), u0, u1, h);
      if (poly.length > 2) d[axis].push(I.poly(poly.map(([u, z]) => (axis === 'x' ? [c, u, z] : [u, c, z]) as V3)));
    }
  }
  for (const axis of ['x', 'y'] as const) { const n = square.wallShade[axis]; n.setAttribute('d', d[axis].join(' ')); n.setAttribute('opacity', f(0.2 * sun.strength)); }
}

// ------------------------------------------------------------------ frame
run((t, dt) => {
  dt = dt || 1 / 60;
  if (!scrubbing && !frozen) tau = (tau + dt / DAY) % 1;
  const P = palette(tau), sun = sunAt(tau);
  // the still square is only redrawn when the light has moved enough to see (every third of
  // a second or so as time runs, every frame while the clock is being turned)
  const dTau = Math.abs(tau - staticTau), due = staticTau < 0 || scrubbing || Math.min(dTau, 1 - dTau) >= 0.0015;
  if (due) {
    staticTau = tau;
    const ink = rgb(P.ink);
    if (ink !== lastInk) { lastInk = ink; host.style.color = ink; card.style.setProperty('--ink', ink); }
    host.style.setProperty('--paper', rgb(P.paper));
    shade(sun, P);
    square.staticLive(P);
    // shadows of the buildings (and the unseen ones closing the square) on the paving and
    // up the walls, and of the furniture that doesn't move
    const lamp = P.lamp > 0.005 || P.inkT > 0.05;
    glowSvg.style.display = lamp ? '' : 'none';
    if (sun.strength > 0.01) {
      const d = [...square.casters.map((c) => c(sun)), ...props.map((p) => p.shadow?.(sun) ?? '')].join(' ');
      shadowPath.setAttribute('d', d);
      shadowPath.setAttribute('opacity', f(0.2 * sun.strength));
      wallShadows(sun);
    } else { shadowPath.setAttribute('opacity', '0'); square.wallShade.x.setAttribute('opacity', '0'); square.wallShade.y.setAttribute('opacity', '0'); }
  }

  // windows light one by one with a short fade, so they're stepped every frame (only the
  // ones that change are written)
  drawLights(P, tau, dt);
  wind.step(t);
  square.live.forEach((fn) => fn(t, dt, wind.value, P, tau));
  props.forEach((p) => p.draw?.(t, dt, wind.value, P, tau));

  // seats and comings and goings
  for (const s of seats) {
    s.next -= dt;
    if (s.who?.done) s.who = null;
    if (s.next > 0) continue;
    s.next = 6 + Math.random() * 14;
    const b = busy(s.kind);
    if (!s.who && Math.random() < b) s.who = add(seated(I, actorL, s.x, s.y, s.z, s.px, s.facing, { act: s.act[(Math.random() * s.act.length) | 0] }));
    else if (s.who && Math.random() < (1 - b) * 0.5) s.who.leave?.();
  }
  tourT -= dt;
  if (tourT < 0) {
    tourT = 40 + Math.random() * 30;
    if (tour.length) { tour.forEach((a) => a.leave?.()); tour = []; }
    else if (tau > 0.35 && tau < 0.76) tourArrives();
  }
  const people = 0.2 + busy('rest') * 1.5;
  walkT -= dt * people; if (walkT < 0) { walkT = 2 + Math.random() * 4; spawnWalker(); }
  kidT -= dt; if (kidT < 0) { kidT = 30 + Math.random() * 40; if (tau > 0.3 && tau < 0.82) spawnKid(); }
  waiterT -= dt; if (waiterT < 0) { waiterT = 6 + Math.random() * 8; if (busy('terrace') > 0.3) spawnWaiter(); }
  for (const a of actors) if (a.x !== undefined && a.key < 900 && flock.near(a.x, a.y!, 1.6) && Math.random() < dt * 2) flock.flush();

  // the bells ring the hour through the day, and the pigeons go up
  const hour = Math.floor(tau * 24);
  if (lastHour >= 0 && hour !== lastHour && !scrubbing && hour >= 8 && hour <= 21) ringBells();
  lastHour = hour;

  // draw and depth-sort everyone with the square's furniture
  for (let i = actors.length - 1; i >= 0; i--) { const a = actors[i]; a.draw(t, dt, P); if (a.done) { a.g.remove(); actors.splice(i, 1); } }
  const items: Array<{ key: number; g: Element }> = [...props, ...actors];
  items.sort((a, b) => a.key - b.key);
  let prev: Element | null = null, changed = false;
  for (const it of items) { if (it.g.previousElementSibling !== prev) { changed = true; break; } prev = it.g; }
  if (changed) items.forEach((it) => actorL.appendChild(it.g));

  // people's and pigeons' shadows, merged so overlaps don't double up; someone standing in a
  // building's shadow casts none (a mask would do it exactly, but costs more than all the rest)
  if (sun.strength > 0.01) {
    const pt = svg.createSVGPoint();
    put(dynShadow, 'd', actors.map((a) => {
      if (!a.shadow) return '';
      if (a.x !== undefined) { const [sx, sy] = I.p(a.x, a.y!, 0); pt.x = sx; pt.y = sy; if ((shadowPath as SVGPathElement).isPointInFill(pt)) return ''; }
      return a.shadow(sun);
    }).join(' '));
    put(dynShadow, 'opacity', f(0.2 * sun.strength));
  } else put(dynShadow, 'opacity', '0');

  const hrs = tau * 24, h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
  const label = `<b>${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}</b> <span>${period(hrs)}</span>`;
  if (label !== lastLabel) { lastLabel = label; clock.innerHTML = label; }
});

(window as unknown as { __plaza: unknown }).__plaza = { actors, props, flock, square, setTau: (v: number) => { tau = v; frozen = true; }, get tau() { return tau; } };
