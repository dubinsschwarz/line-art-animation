// Plaza de la Catedral — the steps of a cathedral and the square before them, seen from
// above and close, from dawn to night. Drag the sun or moon to change the time; move the
// pointer to make wind; click the bells, the pigeons, the musician, the balloons, anyone.
import { el, inkDefs, run, f } from '../../lib/ink.ts';
import { iso, sunAt } from '../../lib/iso.ts';
import { palette, applyPalette, rgb } from '../../lib/daynight.ts';
import { pointerWind } from '../../lib/motion.ts';
import { buildSquare, buildProps, shade, drawLights, FRONT, type Prop } from './build.ts';
import { seated, standing, walker, musician, balloonSeller, pigeons, type Actor, type Activity } from './people.ts';

const W = 960, H = 600;
const q = new URLSearchParams(location.search);
const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'An ink drawing of the steps of a Gothic cathedral and the square before them, seen from above: the carved portal and rose window, people sitting on the steps and at a café, a tour group, a guitarist, a balloon seller, pigeons, through day and night.' });
const ink = inkDefs(svg, 'p');
document.querySelector('#plaza')!.appendChild(svg);
const defs = ink.defs;
// close in: 11 px a metre, the west front filling the upper left
const I = iso({ scale: 11, origin: [453, 278] });

// layers, back to front
const skyG = el('linearGradient', { id: 'p-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
const s0 = el('stop', { offset: 0 }, skyG), s1 = el('stop', { offset: 1 }, skyG);
el('rect', { x: 0, y: 0, width: W, height: H, fill: 'url(#p-sky)' }, svg);
const starsG = el('g', {}, svg);
const stars = Array.from({ length: 50 }, () => el('circle', { cx: f(Math.random() * W), cy: f(Math.random() * 150), r: f(0.4 + Math.random() * 0.6), fill: '#f5efda' }, starsG));
const skyBodies = el('g', {}, svg);
const scene = el('g', { filter: ink.filter }, svg);
const groundL = el('g', {}, scene), shadowL = el('g', {}, scene), buildL = el('g', {}, scene), actorL = el('g', {}, scene);
const glow = el('g', { style: 'mix-blend-mode:screen;pointer-events:none' }, svg);
// shadows fall only on the paving (never into the sky behind the roofs)
const shadowClip = el('clipPath', { id: 'p-groundclip' }, defs);
el('path', { d: I.poly([[-12, -12, 0], [70, -12, 0], [70, 70, 0], [-12, 70, 0]]) }, shadowClip);
shadowL.setAttribute('clip-path', 'url(#p-groundclip)');
const shadowPath = el('path', { fill: '#2d2b44', stroke: 'none' }, shadowL);

// ------------------------------------------------------------------ time and wind
let tau = q.has('tau') ? +q.get('tau')! : q.has('start') ? +q.get('start')! : 0.42;
let frozen = q.has('tau'), scrubbing = false;
const DAY = q.has('day') ? +q.get('day')! : 240;
const wind = pointerWind(svg, 0.25);
const hint = document.querySelector('#hint')!;
const hideHint = () => hint.classList.add('gone');
setTimeout(hideHint, 14000);
const on = (n: Element, fn: () => void) => n.addEventListener('pointerdown', (e) => { e.stopPropagation(); fn(); hideHint(); });

// the sun and moon cross the strip of sky right to left (east is screen-right); drag them to scrub
const sunArc = (u: number) => [930 - 860 * u, 112 - 86 * Math.sin(Math.PI * u)];
const sunN = el('g', { style: 'cursor:grab' }, skyBodies);
el('circle', { r: 46, fill: 'url(#p-pool)', opacity: 0.6 }, sunN);
const sunDisk = el('circle', { r: 15, stroke: 'currentColor', 'stroke-width': 0.8 }, sunN);
const moonN = el('g', { style: 'cursor:grab' }, skyBodies);
el('path', { d: 'M0 -11 A11 11 0 1 1 0 11 A7 11 0 1 0 0 -11Z', fill: '#f3ecd6' }, moonN);
let dragging: 'sun' | 'moon' | null = null;
const toSvgX = (e: PointerEvent) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM()!.inverse()).x; };
for (const [n, kind] of [[sunN, 'sun'], [moonN, 'moon']] as const) n.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); dragging = kind; scrubbing = true; frozen = false; svg.setPointerCapture?.(e.pointerId); hideHint(); });
svg.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const u = Math.max(0, Math.min(1, (930 - toSvgX(e)) / 860));
  tau = dragging === 'sun' ? 0.25 + u * 0.5 : (0.75 + u * 0.5) % 1;
});
const endDrag = () => { dragging = null; scrubbing = false; };
svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);

// ------------------------------------------------------------------ the square
const square = buildSquare(I, { ground: groundL, build: buildL, glow, defs });
const props: Prop[] = buildProps(I, actorL, glow, defs);
const flock = pigeons(I, actorL, 14.5, 23.5, 18);
const actors: Actor[] = [...flock.actors()];
const bellHit = el('path', { d: `M${I.pt(0, FRONT.y1, 22)} L${I.pt(0, FRONT.y0, 22)} L${I.pt(0, FRONT.y0, 30)} L${I.pt(0, FRONT.y1, 30)}Z`, fill: 'transparent', style: 'cursor:pointer' }, scene);
el('title', {}, bellHit).textContent = 'Ring the bells';
const ringBells = () => { square.bells.poke(); setTimeout(() => flock.flush(), 300); };
on(bellHit, ringBells);
const add = (a: Actor) => { actors.push(a); on(a.g, () => a.poke?.()); return a; };
flock.birds.forEach((b) => on(b.g, () => flock.flush()));

// the regulars: a guitarist by the alley, a balloon seller by the fountain
add(musician(I, actorL, 6.4, 26.4, 1));
add(balloonSeller(I, actorL, 24.2, 21.6, -1, () => wind.value));

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
for (const deg of [10, 60, 105]) { const a = (deg * Math.PI) / 180, ox = Math.cos(a), oy = Math.sin(a); seat(27 + ox * 2.85, 17 + oy * 2.85, 0, 4.6, ox - oy > 0 ? 1 : -1, 'rest', ['none', 'ice', 'phone']); }
for (const x of [13.7, 24.3, 25.7]) seat(x, x < 20 ? 27.6 : 30.6, 0, 3, -1, 'rest', ['none', 'book', 'phone']);
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
const ENTRANCES: Pt[] = [{ x: -2.6, y: 26.4 }, { x: 22, y: 38 }, { x: 31, y: 29 }, { x: 40, y: 20 }, { x: 49, y: 6 }, { x: 12, y: 47 }];
const around = (a: Pt, b: Pt): Pt[] => {
  const cx = 27, cy = 17, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
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
  else pts = [anyEntrance(), { x: 8 + Math.random() * 30, y: 9 + Math.random() * 24, pause: Math.random() < 0.4 ? 1.5 + Math.random() * 3 : 0, photo: Math.random() < 0.35 }, anyEntrance()];
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
let lastHour = -1;

// ------------------------------------------------------------------ frame
run((t, dt) => {
  dt = dt || 1 / 60;
  if (!scrubbing && !frozen) tau = (tau + dt / DAY) % 1;
  const P = palette(tau), sun = sunAt(tau);
  applyPalette(svg as SVGSVGElement, P);
  (document.querySelector('#card') as HTMLElement).style.setProperty('--ink', rgb(P.ink));
  s0.setAttribute('stop-color', rgb(P.top)); s1.setAttribute('stop-color', rgb(P.bottom));
  starsG.setAttribute('opacity', f(P.night));
  stars.forEach((s, i) => s.setAttribute('opacity', f(0.6 + 0.4 * Math.sin(t * (0.7 + (i % 5) * 0.3) + i))));
  const su = (tau - 0.25) / 0.5, mu = (((tau - 0.75) % 1) + 1) % 1 / 0.5;
  if (su > -0.03 && su < 1.03) { const [x, y] = sunArc(Math.max(0, Math.min(1, su))); sunN.setAttribute('transform', `translate(${f(x)} ${f(y)})`); sunN.style.display = ''; sunDisk.setAttribute('fill', rgb(P.sunset > 0.1 ? [244, 160, 110] : [252, 244, 222])); } else sunN.style.display = 'none';
  if (mu <= 1.02) { const [x, y] = sunArc(Math.min(1, mu)); moonN.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(-24)`); moonN.style.display = ''; } else moonN.style.display = 'none';

  wind.step(t);
  shade(sun, P);
  drawLights(P, tau, dt);
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

  // one shadow layer, all casters merged so overlaps don't double up
  if (sun.strength > 0.01) {
    const d = [...square.casters.map((c) => c(sun)), ...props.map((p) => p.shadow?.(sun) ?? ''), ...actors.map((a) => a.shadow?.(sun) ?? '')].join(' ');
    shadowPath.setAttribute('d', d);
    shadowPath.setAttribute('opacity', f(0.2 * sun.strength));
  } else shadowPath.setAttribute('opacity', '0');

  const hrs = tau * 24, h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
  clock.innerHTML = `<b>${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}</b> <span>${period(hrs)}</span>`;
});

(window as unknown as { __plaza: unknown }).__plaza = { actors, props, flock, square, setTau: (v: number) => { tau = v; frozen = true; }, get tau() { return tau; } };
