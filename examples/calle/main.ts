// Calle del Sol — an Andalusian street by the river, from dawn to night, drawn in pen.
// Drag the sun or moon to change the time; move the pointer to make wind;
// click people, the shutters, lanterns, the canary, the bells, the orange trees,
// the palm, the cat, the birds, the water.
import { el, inkDefs, run, f } from '../../lib/ink.ts';
import { W, H, LANE, WATER, rnd, pick, clamp, lerp, smooth, rgb, hex, mix } from './kit.ts';
import { createSky, palette } from './sky.ts';
import { buildStreet } from './houses.ts';
import { buildCanal } from './canal.ts';
import { createWoman, createCyclist, createKid, createBoat } from './people.ts';
import { createCat, createSparrows, createSwallows, createPetals, createSmoke } from './critters.ts';

const q = new URLSearchParams(location.search);
const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'village', role: 'img',
  'aria-label': 'An ink drawing of an Andalusian street with whitewashed houses, a bodega, a tapas bar and a bakery beside a river, under a church bell gable, through day and night.' });
const ink = inkDefs(svg, 'v');
document.querySelector('#village').appendChild(svg);
const defs = ink.defs;
const grad = (id: string, stops: Array<[number, string, number]>, attrs: { radial?: boolean; x1?: number; x2?: number } = {}) => { const g = el(attrs.radial ? 'radialGradient' : 'linearGradient', attrs.radial ? { id } : { id, x1: attrs.x1 ?? 0, y1: 0, x2: attrs.x2 ?? 1, y2: 0 }, defs); stops.forEach(([o, c, a]) => el('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, g)); };
grad('v-beamR', [[0, '#fff1c2', 0.55], [1, '#fff1c2', 0]]);
grad('v-beamL', [[0, '#fff1c2', 0], [1, '#fff1c2', 0.55]]);
grad('v-cateye', [[0, '#e8ff9a', 1], [1, '#c8ff6a', 0]], { radial: true });

const layer = (parent: Element = svg, attrs: Record<string, string> = {}) => el('g', attrs, parent);
const skyL = layer();
const scene = layer(svg, { filter: ink.filter });
const back = layer(scene), birdsL = layer(scene), ground = layer(scene), houses = layer(scene), front = layer(scene);
const catL = layer(scene), walkers = layer(scene), canalL = layer(scene), boatL = layer(scene), willowL = layer(scene), petalL = layer(scene, { style: 'pointer-events:none' });
const glow = layer(svg, { style: 'mix-blend-mode:screen;pointer-events:none' });

// ------------------------------------------------------------------ time
let tau = q.has('tau') ? +q.get('tau') : q.has('start') ? +q.get('start') : 0.66; // ?tau pins the time, ?start just sets it
let scrub = null, frozenTau = q.has('tau');
const DAY_SECONDS = q.has('day') ? +q.get('day') : 180; // ?day=30 → a full cycle in 30 s
// People always move at a natural pace (a sped-up gait looks fake); when a day is
// compressed only the arrivals come more often, so the street stays busy. ?life= overrides.
const LIFE = q.has('life') ? +q.get('life') : 1;
const TRAFFIC = Math.max(1, Math.sqrt(180 / DAY_SECONDS));
const card = document.querySelector<HTMLElement>('#card')!;
if (q.has('capture')) document.body.classList.add('capture');

// ------------------------------------------------------------------ wind from the pointer
let wind = 0.3, windTarget = 0.3, lastX = null, lastT = 0;
svg.addEventListener('pointermove', (e) => {
  const now = performance.now();
  if (lastX !== null && !svg.classList.contains('scrubbing')) windTarget = clamp(windTarget + ((e.clientX - lastX) / Math.max(8, now - lastT)) * 0.8, -2.4, 2.4);
  lastX = e.clientX; lastT = now;
});
const on = (node, fn) => node.addEventListener('pointerdown', (e) => { e.stopPropagation(); fn(e); hint.done(); });
const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };

// ------------------------------------------------------------------ world
const sky = createSky(svg, skyL, defs, {
  onScrub: (v) => { scrub = v; if (v !== null) { tau = v; frozenTau = false; hint.done(); } },
  onShoot: () => palette(tau).night > 0.4,
});
const street = buildStreet({ back, houses, front, glow }, defs);
const canal = buildCanal({ ground, canalL, willowL, glow }, defs);
const smoke = createSmoke(back, street.chimney);
const sparrows = createSparrows(birdsL, { wireY: street.wireY });
const swallows = createSwallows(birdsL);
const petals = createPetals(petalL, { blossoms: street.blossoms, canal });
const cat = createCat(catL, glow, { x: 548, y: 330 });
const boat = createBoat(boatL, glow, { onRipple: (x, y) => canal.ring(x, y, 2) });

// reflections in the water under every light source
street.windows.forEach((w) => canal.addRefl(() => w.lit, (w.x0 + w.x1) / 2, Math.min(40, (w.x1 - w.x0) * 0.8)));
street.lanterns.forEach((l) => canal.addRefl(() => smooth(l.thr, l.thr + 0.2, P.lamp), l.x, 8));
canal.addRefl(() => smooth(0.2, 0.45, P.lamp), 457, 14);

// interactions on the scenery
street.lanterns.forEach((l) => { l.grp.style.cursor = 'pointer'; on(l.grp, () => l.poke()); });
street.norens.forEach((n) => { n.grp.style.cursor = 'pointer'; on(n.grp, () => n.poke()); });
const hits = layer(scene);
const hitPath = (d, title, fn) => { const n = el('path', { d, fill: 'transparent', style: 'cursor:pointer' }, hits); el('title', {}, n).textContent = title; on(n, fn); return n; };
hitPath(street.shoji.hit, 'Knock on the shutters', () => street.shoji.poke());
hitPath('M396 254 L412 254 L412 281 L396 281Z', 'Whistle to the canary', () => street.furin.poke());
const ringBells = () => { street.bells.poke(); setTimeout(() => sparrows.flush(), 250); };
street.bells.hit = hitPath('M436 90 L480 90 L480 160 L436 160Z', 'Ring the bells', ringBells);
street.trees.forEach((tr) => on(tr.g, () => { tr.poke(); petals.burst(30, tr.blossoms); }));
on(sparrows.hit, () => sparrows.flush());
on(cat.hit, () => cat.poke());
on(boat.g, () => boat.poke());
willowL.style.cursor = 'pointer';
on(willowL, () => canal.willowPoke());
const waterHit = el('rect', { x: 0, y: WATER, width: W, height: H - WATER, fill: 'transparent', style: 'cursor:pointer' }, canalL);
on(waterHit, (e) => { const p = toSvg(e); canal.poke(p.x, p.y); });
canalL.insertBefore(waterHit, canalL.children[2] || null);

// ------------------------------------------------------------------ villagers
const people = [];
const spawn = { woman: 0, bike: 7, kid: 4 };
function addPerson(kind: 'woman' | 'bike' | 'kid', x?: number) {
  const dir = Math.random() < 0.5 ? 1 : -1;
  const sx = x ?? (dir > 0 ? -60 : W + 60);
  let p;
  if (kind === 'woman') p = createWoman(walkers, glow, { dir, x: sx, y: LANE.back + rnd(-1, 1) });
  if (kind === 'bike') p = createCyclist(walkers, glow, { dir, x: sx, y: LANE.front + rnd(-1, 1) });
  if (kind === 'kid') p = createKid(walkers, glow, { dir, x: sx, y: LANE.mid + rnd(-1, 1) });
  on(p.g, () => { p.poke(); if (p.kind === 'bike') setTimeout(() => sparrows.flush(), 150); });
  people.push(p);
}

// ------------------------------------------------------------------ hud
const clock = document.querySelector('#clock'), hintN = document.querySelector('#hint');
const hint = { shown: true, done() { if (this.shown) { this.shown = false; hintN.classList.add('gone'); } } };
setTimeout(() => hint.done(), 14000);
const period = (h) => (h < 5 ? 'madrugada' : h < 7 ? 'amanecer' : h < 12 ? 'mañana' : h < 14 ? 'mediodía' : h < 19 ? 'tarde' : h < 21 ? 'atardecer' : 'noche');
let lastHour = -1;

// ------------------------------------------------------------------ frame
let P = palette(tau);
let started = false;
run((t, dt) => {
  dt = dt || 1 / 60;
  if (scrub === null && !frozenTau) tau = (tau + dt / DAY_SECONDS) % 1;
  P = palette(tau);
  svg.style.color = rgb(P.ink);
  svg.style.setProperty('--paper', rgb(P.paper));
  card.style.setProperty('--ink', rgb(P.ink));

  windTarget = lerp(windTarget, 0.3 + 0.25 * Math.sin(t * 0.21) + 0.15 * Math.sin(t * 0.67), 0.012);
  wind = lerp(wind, windTarget, 0.05);

  sky.draw(tau, t, dt, P, wind);
  street.applyRed(P);
  const sinceDusk = (tau - 0.75 + 1) % 1;
  street.windows.forEach((w) => {
    let lit = smooth(w.thr, w.thr + 0.25, P.lamp);
    if (w.lateOff < 9 && sinceDusk > w.lateOff - 0.75 && sinceDusk < 0.5) lit = 0;
    w.lit = lerp(w.lit, lit, 0.08);
    w.draw(t, dt, P);
  });
  const L = street.lamp, lampOn = smooth(0.2, 0.45, P.lamp);
  L.node.style.fill = rgb(mix(P.paper, hex('#fff1c9'), lampOn));
  L.cone.setAttribute('opacity', f(lampOn * 0.45));
  L.glow.setAttribute('opacity', f(lampOn * 0.55));
  L.pool.setAttribute('opacity', f(lampOn * 0.4));

  street.norens.forEach((n) => n.draw(t, dt, wind, tau, P));
  street.lanterns.forEach((l) => l.draw(t, dt, wind, P));
  street.furin.draw(t, dt, wind);
  street.shoji.draw(t, dt, P);
  street.trees.forEach((tr) => tr.draw(t, dt, wind));
  street.bells.draw(t, dt);
  street.drawLife(t, dt, wind, tau);
  street.drawClock(tau);
  // the bells ring the hour through the day
  const hourNow = Math.floor(tau * 24);
  if (lastHour >= 0 && hourNow !== lastHour && scrub === null && hourNow >= 8 && hourNow <= 21) ringBells();
  lastHour = hourNow;

  smoke.draw(t, dt, P, wind, tau);
  sparrows.draw(t, dt, P);
  swallows.draw(t, dt, P);
  petals.draw(t, dt, P, wind);
  cat.draw(t, dt, P);
  canal.draw(t, dt, P, wind, null, tau, lampOn);
  boat.draw(t, dt * LIFE, P, wind);

  // villagers: spawn on their own schedules, draw back-to-front
  if (!started) { started = true; addPerson('woman', 300); addPerson('woman', 760); addPerson('bike', 560); }
  const dayish = tau > 0.28 && tau < 0.9, lateNight = tau > 0.98 || tau < 0.22, paseo = tau > 0.72 && tau < 0.97;
  for (const k in spawn) {
    spawn[k] -= dt * TRAFFIC;
    if (spawn[k] < 0) {
      if (k === 'woman') { spawn[k] = paseo ? rnd(5, 10) : rnd(10, 18); if (!lateNight || Math.random() < 0.3) addPerson('woman'); }
      if (k === 'bike') { spawn[k] = rnd(9, 16); if (!lateNight) addPerson('bike'); }
      if (k === 'kid') { spawn[k] = paseo ? rnd(9, 16) : rnd(14, 24); if (dayish) addPerson('kid'); }
    }
  }
  for (let i = people.length - 1; i >= 0; i--) { const p = people[i]; p.draw(t, dt * LIFE, P, wind); if (p.done) { p.remove(); people.splice(i, 1); } else if (p.ringing && Math.random() < dt * 4) sparrows.flush(); }
  people.slice().sort((a, b) => a.y - b.y).forEach((p) => walkers.appendChild(p.g));

  // clock
  const hrs = tau * 24, h = Math.floor(hrs), m = Math.floor((hrs - h) * 60);
  clock.innerHTML = `<b>${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}</b> <span>${period(hrs)}</span>`;
});

(window as unknown as { __village: unknown }).__village = { addPerson, setTau: (v) => { tau = v; frozenTau = true; }, get tau() { return tau; }, people, sparrows, cat, boat, canal, street, petals };
