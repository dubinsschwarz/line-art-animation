// Plaza de la Catedral — a cathedral square seen from above, from dawn to night.
// Drag the sun or moon to change the time; move the pointer to make wind; click the
// bells, the pigeons, anyone sitting or walking.
import { el, inkDefs, run, f } from '../../lib/ink.ts';
import { iso, sunAt } from '../../lib/iso.ts';
import { palette, applyPalette, rgb } from '../../lib/daynight.ts';
import { pointerWind } from '../../lib/motion.ts';
import { buildSquare, buildProps, shade, drawLights, type Prop } from './build.ts';
import { seated, walker, pigeons, type Actor } from './people.ts';

const W = 960, H = 600;
const q = new URLSearchParams(location.search);
const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'An ink drawing of a cathedral square seen from above: a Gothic cathedral with twin spires, shops and cafés around the square, a fountain, people sitting and walking, pigeons, through day and night.' });
const ink = inkDefs(svg, 'p');
document.querySelector('#plaza')!.appendChild(svg);
const defs = ink.defs;
const I = iso({ scale: 6.5, origin: [451, 252] });

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
// shadows fall only on the slab
const shadowClip = el('clipPath', { id: 'p-slabclip' }, defs);
el('path', { d: I.poly([[-12.5, -12.5, 0], [50.5, -12.5, 0], [50.5, 41.5, 0], [-12.5, 41.5, 0]]) }, shadowClip);
shadowL.setAttribute('clip-path', 'url(#p-slabclip)');
const shadowPath = el('path', { fill: '#2d2b44', stroke: 'none' }, shadowL);

// ------------------------------------------------------------------ time and wind
let tau = q.has('tau') ? +q.get('tau')! : q.has('start') ? +q.get('start')! : 0.4;
let frozen = q.has('tau'), scrubbing = false;
const DAY = q.has('day') ? +q.get('day')! : 240;
const wind = pointerWind(svg, 0.25);
const hint = document.querySelector('#hint')!;
const hideHint = () => hint.classList.add('gone');
setTimeout(hideHint, 14000);
const on = (n: Element, fn: () => void) => n.addEventListener('pointerdown', (e) => { e.stopPropagation(); fn(); hideHint(); });

// the sun and moon cross the strip of sky right to left (east is screen-right); drag them to scrub
const sunArc = (u: number) => [900 - 840 * u, 96 - 74 * Math.sin(Math.PI * u)];
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
  const u = Math.max(0, Math.min(1, (900 - toSvgX(e)) / 840));
  tau = dragging === 'sun' ? 0.25 + u * 0.5 : (0.75 + u * 0.5) % 1;
});
const endDrag = () => { dragging = null; scrubbing = false; };
svg.addEventListener('pointerup', endDrag); svg.addEventListener('pointercancel', endDrag);

// ------------------------------------------------------------------ the square
const square = buildSquare(I, { ground: groundL, build: buildL, glow, defs });
const props: Prop[] = buildProps(I, actorL, glow, defs);
const flock = pigeons(I, actorL, 21, 30, 16);
const actors: Actor[] = [...flock.actors()];
const bellHit = el('path', { d: `M${I.pt(13, 0, 23)} L${I.pt(35, 0, 23)} L${I.pt(35, 0, 30)} L${I.pt(13, 0, 30)}Z`, fill: 'transparent', style: 'cursor:pointer' }, scene);
el('title', {}, bellHit).textContent = 'Ring the bells';
const ringBells = () => { square.bells.poke(); setTimeout(() => flock.flush(), 300); };
on(bellHit, ringBells);
flock.birds.forEach((b) => on(b.g, () => flock.flush()));

// ------------------------------------------------------------------ who's sitting where
// Seats fill and empty with the hour: terraces busy at lunch and late into the night,
// steps and benches in the day.
type Kind = 'steps' | 'terrace' | 'rest';
const busy = (k: Kind) => {
  const t = tau;
  if (k === 'terrace') return t < 0.06 ? 0.45 : t < 0.36 ? 0.05 : t < 0.46 ? 0.35 : t < 0.62 ? 0.75 : t < 0.8 ? 0.45 : 0.85;
  if (k === 'steps') return t > 0.3 && t < 0.82 ? 0.6 : t > 0.82 && t < 0.95 ? 0.3 : 0.04;
  return t > 0.3 && t < 0.86 ? 0.5 : 0.08;
};
const seats: Array<{ x: number; y: number; z: number; px: number; facing: 1 | -1; kind: Kind; who: Actor | null; next: number }> = [];
const seat = (x: number, y: number, z: number, px: number, facing: 1 | -1, kind: Kind) => seats.push({ x, y, z, px, facing, kind, who: null, next: 0 });
// on a step the knees come up above the hips: a low seat, feet one tread down
for (const x of [14, 15.2, 18.5, 21.2, 27.4, 29.8, 31, 33.6]) seat(x, 3.4, 0.3, 2.3, Math.random() < 0.75 ? -1 : 1, 'steps');
for (const x of [16.6, 23.8, 32.2]) seat(x, 2.4, 0.6, 2.3, -1, 'steps');
for (const deg of [-12, 38, 92]) { const a = (deg * Math.PI) / 180, ox = Math.cos(a), oy = Math.sin(a); seat(28 + ox * 4.05, 22 + oy * 4.05, 0, 4.9, ox - oy > 0 ? 1 : -1, 'rest'); }
for (const [x, y, fc] of [[20.5, 21.2, 1], [20.5, 22.8, 1], [35.5, 21.4, -1], [35.5, 22.6, -1], [27.2, 14.4, -1], [28.8, 14.4, -1], [27.2, 29.6, 1], [28.8, 29.6, 1]] as Array<[number, number, 1 | -1]>) seat(x, y, 0, 3.2, fc, 'rest');
for (const [tx, ty] of [[2.6, 3.4], [6.2, 3.4], [9.8, 3.4], [4.4, 7], [8, 7], [3.4, 28.4], [3.4, 32], [3.4, 35.6], [7, 30.2], [7, 33.8]]) { seat(tx - 0.85, ty + 0.3, 0, 3.2, 1, 'terrace'); seat(tx + 0.85, ty - 0.3, 0, 3.2, -1, 'terrace'); }

// ------------------------------------------------------------------ people crossing
const stepsZ = (x: number, y: number) => (x > 12.5 && x < 35.5 && y >= 0 && y < 4 ? Math.min(4, Math.floor(4 - y) + 1) * 0.3 : 0);
type Pt = { x: number; y: number; pause?: number; photo?: boolean; vanish?: boolean };
const ENTRANCES: Pt[] = [{ x: 0.6, y: 13.5 }, { x: 16, y: 40.6 }, { x: 26, y: 40.6 }, { x: 38, y: 40.6 }, { x: 49.6, y: 12 }, { x: 49.6, y: 30 }, { x: 46, y: 40.6 }];
const around = (a: Pt, b: Pt): Pt[] => {
  // detour round the fountain (centre 28,22) if the straight line passes too close
  const cx = 28, cy = 22, dx = b.x - a.x, dy = b.y - a.y, L2 = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((cx - a.x) * dx + (cy - a.y) * dy) / L2)), px = a.x + dx * u, py = a.y + dy * u, d = Math.hypot(px - cx, py - cy);
  if (d > 6.5) return [b];
  const nx = (px - cx) / (d || 1), ny = (py - cy) / (d || 1);
  return [{ x: cx + (d ? nx : -dy / Math.sqrt(L2)) * 7.2, y: cy + (d ? ny : dx / Math.sqrt(L2)) * 7.2 }, b];
};
const route = (pts: Pt[]) => { const r: Pt[] = [pts[0]]; for (let i = 1; i < pts.length; i++) r.push(...around(r[r.length - 1], pts[i])); return r; };
function spawnWalker() {
  const start = ENTRANCES[(Math.random() * ENTRANCES.length) | 0];
  const r = Math.random();
  let pts: Pt[];
  if (r < 0.3) pts = [start, { x: 24 + (Math.random() - 0.5) * 6, y: 12 + Math.random() * 3, pause: 2.5 + Math.random() * 3, photo: true }, { x: 24, y: 4.4 }, { x: 24 + (Math.random() - 0.5) * 2, y: 0.4, vanish: true }];
  else if (r < 0.45) pts = [{ x: 24, y: 0.4 }, { x: 24, y: 4.6 }, ENTRANCES[(Math.random() * ENTRANCES.length) | 0]];
  else pts = [start, { x: 14 + Math.random() * 28, y: 10 + Math.random() * 24, pause: Math.random() < 0.4 ? 1.5 + Math.random() * 3 : 0, photo: Math.random() < 0.3 }, ENTRANCES[(Math.random() * ENTRANCES.length) | 0]];
  actors.push(walker(I, actorL, route(pts), { height: stepsZ }));
}
function spawnKid() {
  const b = flock.birds[0], start = ENTRANCES[1 + ((Math.random() * 3) | 0)];
  actors.push(walker(I, actorL, route([start, { x: b.x, y: b.y + 0.5 }, { x: b.x - 6, y: b.y - 6, pause: 1 }, ENTRANCES[(Math.random() * ENTRANCES.length) | 0]]), { kid: true, height: stepsZ }));
}
function spawnWaiter() {
  const tables = [[2.6, 3.4], [6.2, 3.4], [9.8, 3.4], [4.4, 7], [8, 7]], [tx, ty] = tables[(Math.random() * tables.length) | 0];
  actors.push(walker(I, actorL, [{ x: 6, y: 0.4 }, { x: 6, y: 1.4 }, { x: tx + 0.2, y: ty + 1, pause: 2.2 }, { x: 6, y: 1.4 }, { x: 6, y: 0.4, vanish: true }], { waiter: true }));
}
let walkT = 0, kidT = 20, waiterT = 4;
for (let k = 0; k < 6; k++) { spawnWalker(); const a = actors[actors.length - 1] as any; for (let s = 0; s < 40 + k * 40; s++) a.draw(s / 10, 0.1, palette(tau)); }

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
    if (!s.who && Math.random() < b) { s.who = seated(I, actorL, s.x, s.y, s.z, s.px, s.facing, { drinks: s.kind === 'terrace' }); actors.push(s.who); on(s.who.g, () => s.who?.poke?.()); }
    else if (s.who && Math.random() < (1 - b) * 0.5) (s.who as any).leave();
  }
  const people = 0.15 + busy('rest') * 1.4;
  walkT -= dt * people; if (walkT < 0) { walkT = 2 + Math.random() * 4; spawnWalker(); const a = actors[actors.length - 1]; on(a.g, () => a.poke?.()); }
  kidT -= dt; if (kidT < 0) { kidT = 30 + Math.random() * 40; if (tau > 0.3 && tau < 0.8) spawnKid(); }
  waiterT -= dt; if (waiterT < 0) { waiterT = 6 + Math.random() * 8; if (busy('terrace') > 0.3) spawnWaiter(); }
  for (const a of actors) if ((a as any).x !== undefined && flock.near((a as any).x, (a as any).y, 2.2) && (a as any).g && Math.random() < dt * 3) flock.flush();

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
