// Villagers. Each is drawn in its own space (~95 px tall, ground y 120, facing +x,
// feet centred on x 40) and placed with translate/scale, so line weight matches.
import { el, pen, shape, blot, f, pt, limb, joint, curve, shoe, PEN, PAPER } from '../../lib/ink.ts';
import { gait } from '../../lib/gait.ts';
import { FS, WATER, rnd, pick, clamp, lerp, smooth, ease, oval, rgb, hex, mix } from './kit.ts';

const RAD = Math.PI / 180;
const place = (g, X, Y, dir, s = FS) => g.setAttribute('transform', `translate(${f(X)} ${f(Y)}) scale(${f(dir * s)} ${f(s)}) translate(-40 -120)`);
const world = (X, Y, dir, lx, ly, s = FS) => [X + dir * s * (lx - 40), Y + s * (ly - 120)];
const fillOf = (c, P, k = 0.55) => rgb(mix(hex(c), mix(hex(c), [12, 16, 30], 0.6), P.inkT * k));
const solid = (lb, c = 'currentColor') => { const n = lb.g.querySelector('path'); n.classList.remove('pp'); n.setAttribute('fill', c); return lb; };
const paintPath = (g, c, w = PEN) => el('path', { fill: c, stroke: 'currentColor', 'stroke-width': w, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, g);

// ===================================================================== a woman out on an errand
// Real legs under a mid-calf skirt: gait() solves the walk (planted feet, minimum-jerk
// swing, heel-off, hip height from what the planted legs can reach). The skirt is drawn
// around the forward knee and flares at the hem, so it opens and closes with the stride;
// the shawl's tail and fringe and her free arm swing on springs. She carries a basket
// of bread or a fan. Click her and she stops, nods and says hello.
let uid = 0;
export function createWoman(parent, glow, { dir = 1, x, y, greet = () => 'Hola!' }) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const walk = gait({ kind: 'walk', stride: 21, period: 0.95 });
  const speed = walk.speed * FS;
  const [skirtC, shawlC] = pick([['#c8463a', '#f0e6cf'], ['#2c4a73', '#e8dcc0'], ['#3e6b52', '#f3ecd9'], ['#d9a441', '#3a3a40'], ['#e3ddd0', '#6b7b8c'], ['#7a2f3a', '#d8cbb0']]);
  const dotted = Math.random() < 0.2;
  const prop = Math.random() < 0.45 ? 'fan' : 'basket';
  const id = `v-skirt-${uid++}`;
  const clipPath = el('path', {}, el('clipPath', { id }, g));

  const farArm = limb(g, 3.4);
  const legs = [limb(g, 4), limb(g, 4)];
  const shoes = [blot(g), blot(g)];
  const skirt = paintPath(g, skirtC);
  const dotsG = el('g', { 'clip-path': `url(#${id})` }, g);
  const dots = el('path', { fill: '#f2ead8' }, dotsG);
  const dd = [];
  for (let r = 0; r < 8; r++) for (let c = 0; c < 7; c++) dd.push(oval(26 + c * 4.6 + (r % 2) * 2.3, 70 + r * 4.6, 0.9, 0.9));
  dots.setAttribute('d', dd.join(' '));
  const ruffle = pen(g, PEN * 0.5), fold = pen(g, PEN * 0.45);
  const upperG = el('g', {}, g);
  const torso = shape(upperG);
  const shawl = paintPath(upperG, shawlC, PEN * 0.9);
  const fringe = pen(upperG, PEN * 0.4);
  const neck = limb(upperG, 3.2);
  el('ellipse', { cx: 42, cy: 32.4, rx: 4.2, ry: 5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, upperG);
  const hair = blot(upperG);
  hair.setAttribute('d', `M37.4 31.6 Q36.4 25 41.6 24.4 Q46.6 24.2 46.4 30 Q43.6 27.2 40.6 28.4 Q38.8 29.6 37.4 31.6Z ${oval(35.8, 30.6, 3, 3.2)}`);
  const flower = paintPath(upperG, '#c8463a', PEN * 0.5);
  flower.setAttribute('d', `${oval(38.4, 26, 1.9, 1.6)} ${oval(36.8, 27.6, 1.4, 1.2)}`);
  const nearArm = limb(upperG, 3.4);
  const propG = el('g', {}, upperG);
  const basket = paintPath(propG, '#c9a46a', PEN * 0.8), weave = pen(propG, PEN * 0.4), handle = pen(propG, PEN * 0.8), loaf = paintPath(propG, '#d6a35c', PEN * 0.6);
  basket.setAttribute('d', 'M-6 4 L6 4 L4.8 11.4 L-4.8 11.4Z');
  weave.setAttribute('d', 'M-5.6 6.4 L5.6 6.4 M-5.2 8.8 L5.2 8.8 M-2.6 4 L-2.2 11.4 M0.6 4 L0.6 11.4 M3.6 4 L3.2 11.4');
  handle.setAttribute('d', 'M-5.4 4 Q-5 -3.4 0 -3.6 Q5 -3.4 5.4 4');
  loaf.setAttribute('d', 'M-3.6 4.4 L3.4 -4.6 Q4.6 -5.6 5.2 -4.4 L-1.4 4.6Z');
  const fanG = el('g', {}, upperG);
  const fan = paintPath(fanG, shawlC, PEN * 0.6), fanRibs = pen(fanG, PEN * 0.35);
  const fa = (deg) => [Math.cos(deg * RAD), Math.sin(deg * RAD)];
  const [a0, a1] = [fa(-160), fa(-50)];
  fan.setAttribute('d', `M0 0 L${f(a0[0] * 10)} ${f(a0[1] * 10)} A10 10 0 0 1 ${f(a1[0] * 10)} ${f(a1[1] * 10)}Z`);
  fanRibs.setAttribute('d', Array.from({ length: 8 }, (_, k) => { const [cx, cy] = fa(-160 + (110 * k) / 7); return `M${f(cx * 2.4)} ${f(cy * 2.4)} L${f(cx * 9.6)} ${f(cy * 9.6)}`; }).join(' '));
  if (prop === 'fan') propG.style.display = 'none'; else fanG.style.display = 'none';
  if (!dotted) dotsG.style.display = 'none';
  flower.style.display = 'none';

  const arms = [spring2(60, 9), spring2(60, 9)];
  let ph = rnd(0, 1), sw = 0, swV = 0, bA = 0, bV = 0, bowT = -1, stop = 0, hola = null;
  return {
    g, x, y, dir, speed, done: false,
    poke() {
      if (bowT >= 0) return;
      bowT = 0;
      const [hx, hy] = world(this.x, this.y, dir, 40, 14);
      hola = { t: 0, n: el('text', { x: f(hx), y: f(hy), 'font-size': 7, 'font-style': 'italic', 'font-family': 'Georgia, serif', 'text-anchor': 'middle', fill: 'currentColor' }, parent) };
      hola.n.textContent = greet();
    },
    draw(t, dt, P) {
      let nod = 0;
      if (bowT >= 0) { bowT += dt; nod = bowT < 0.6 ? 0 : bowT < 0.95 ? ease((bowT - 0.6) / 0.35) : bowT < 1.6 ? 1 : 1 - ease((bowT - 1.6) / 0.4); if (bowT > 2.4) bowT = -1; }
      stop = clamp(stop + (bowT >= 0 && bowT < 2.2 ? dt : -dt) * 2.4, 0, 1);
      const go = 1 - ease(stop);
      ph += (dt / walk.period) * go; this.x += dir * speed * dt * go;
      if (this.x < -80 || this.x > 1040) this.done = true;
      place(g, this.x, this.y, dir);
      if (hola) {
        hola.t += dt;
        const [hx, hy] = world(this.x, this.y, dir, 40, 14);
        hola.n.setAttribute('x', f(hx)); hola.n.setAttribute('y', f(hy - hola.t * 6));
        hola.n.setAttribute('opacity', f(smooth(0, 0.3, hola.t) * (1 - smooth(1.6, 2.2, hola.t))));
        if (hola.t > 2.2) { hola.n.remove(); hola = null; }
      }

      // legs, then the skirt around the forward knee
      const p = walk.pose(ph, go), b = p.bob, hip = p.hip;
      p.feet.forEach((fo, i) => { legs[i].draw([hip, fo.knee, fo.ankle], [0.3, 0.8]); shoe(shoes[i], fo.ankle, fo.pitch); });
      g.insertBefore(legs[p.front].g, skirt); g.insertBefore(shoes[p.front], skirt);
      const iF = p.front, iR = 1 - iF;
      const kF = p.feet[iF].knee, kR = p.feet[iR].knee, aF = p.feet[iF].ankle, aR = p.feet[iR].ankle;
      const hemY = 104, wB = [32.8, 67 + b], wF = [47, 67.4 + b];
      const hemF = [Math.max(50.6, kF[0] + 6, aF[0] + 2.4), hemY - 0.6], hemR = [Math.min(29.4, kR[0] - 6, aR[0] - 3), hemY];
      const kx = Math.max(kF[0] + 3, 48.6);
      const sd = `M${pt(wB)} L${pt(wF)} C${f(48.4)} ${f(76 + b)} ${f(kx)} ${f(kF[1] - 10)} ${f(kx + 1)} ${f(kF[1] - 1)} Q${f(kx + 2.2)} ${f((kF[1] + hemY) / 2)} ${pt(hemF)} Q${f((hemF[0] + hemR[0]) / 2)} ${f(hemY + 2.2)} ${pt(hemR)} Q${f(Math.min(31, hemR[0] + 2))} ${f(86 + b * 0.5)} ${pt(wB)}Z`;
      skirt.setAttribute('d', sd); clipPath.setAttribute('d', sd);
      dots.setAttribute('transform', `translate(0 ${f(b)})`);
      ruffle.setAttribute('d', `M${f(hemR[0] + 0.8)} ${f(hemY - 3.4)} Q${f((hemF[0] + hemR[0]) / 2)} ${f(hemY - 1.4)} ${f(hemF[0] - 0.8)} ${f(hemY - 4)}`);
      fold.setAttribute('d', `M${f(kR[0] + 2)} ${f(kR[1] - 4)} Q${f(kR[0] + 0.6)} ${f(kR[1] + 4)} ${f(Math.max(hemR[0] + 4, aR[0] + 1.6))} ${f(hemY - 0.6)}`);

      // upper body rides on the hip with a slight lean; the nod bends from the waist
      upperG.setAttribute('transform', `translate(0 ${f(b)}) rotate(${f(nod * 12 + 1.2 * go)} 40 67)`);
      torso.setAttribute('d', 'M36.4 43 Q33 45.6 33.4 52 Q34 60 33 67.4 L47 67.6 Q46.6 60 46.8 52 Q46.4 45 43.6 43Z');
      const stepPh = 4 * Math.PI * ph;
      swV += (30 * ((-1.6 + Math.sin(stepPh - 1) * 0.8) * go - sw) - 5 * swV) * dt; sw += swV * dt;
      shawl.setAttribute('d', `M35 42.6 Q40 40.8 45.4 42.8 Q47.6 46 46.8 50.4 Q41.6 54.4 35.4 52.6 Q${f(31.4 + sw * 0.5)} 57 ${f(29.6 + sw)} 62.6 Q32 54 33.4 47.6 Q33.6 44 35 42.6Z`);
      const fr = [];
      for (let k = 0; k <= 8; k++) { const u = k / 8, px = lerp(35.4, 29.6 + sw, u), py = lerp(52.6, 62.6, u); fr.push(`M${f(px)} ${f(py)} l${f(sw * 0.15 - 0.4)} 3.2`); }
      for (let k = 1; k <= 6; k++) { const u = k / 6, px = lerp(46.8, 35.4, u), py = lerp(50.4, 52.6, u) + Math.sin(Math.PI * u) * 1.6; fr.push(`M${f(px)} ${f(py)} l${f(sw * 0.1)} 2.6`); }
      fringe.setAttribute('d', fr.join(' '));
      neck.draw([[41.4, 44], [41.6, 37]], [0.2, 0.2]);

      // arms: the free one swings opposite the legs; the near one carries the basket or the fan
      const legSwing = (p.feet[0].ankle[0] - 40) / (walk.stride / 2);
      const farA = arms[0].step(-legSwing * 16 * go, dt) * RAD;
      const shF = [38.4, 46.4], shN = [44.2, 46.8];
      const elF = [shF[0] + 14 * Math.sin(farA), shF[1] + 14 * Math.cos(farA)];
      farArm.draw([shF.map((v, i) => v + (i ? b : 0)), [elF[0], elF[1] + b], [elF[0] + 13 * Math.sin(farA + 0.25), elF[1] + b + 13 * Math.cos(farA + 0.25)]], [0.2, 0.5]);
      if (prop === 'basket') {
        const nearA = arms[1].step(legSwing * 5 * go, dt) * RAD;
        const elb = [shN[0] + 14 * Math.sin(nearA) - 1, shN[1] + 14 * Math.cos(nearA)];
        const hand = [elb[0] + 11, elb[1] - 3];
        nearArm.draw([shN, elb, hand], [0.2, 0.4]);
        const m = [lerp(elb[0], hand[0], 0.42), lerp(elb[1], hand[1], 0.42) + 1.6];
        bV += (-bA * 16 - Math.cos(stepPh) * 1.2 * go - bV * 2) * dt; bA += bV * dt;
        propG.setAttribute('transform', `translate(${f(m[0])} ${f(m[1] + 3.4)}) rotate(${f(bA * 57.3)} 0 -3.6)`);
      } else {
        const elb = [shN[0] + 1.6, shN[1] + 12], hand = [elb[0] + 6.4, elb[1] - 9];
        nearArm.draw([shN, elb, hand], [0.2, 0.4]);
        fanG.setAttribute('transform', `translate(${f(hand[0])} ${f(hand[1])}) rotate(${f(Math.sin(t * (bowT >= 0 ? 6 : 9)) * 16 - 6)})`);
      }

      skirt.setAttribute('fill', fillOf(skirtC, P));
      [shawl, fan].forEach((n) => n.setAttribute('fill', fillOf(shawlC, P)));
      flower.setAttribute('fill', fillOf('#c8463a', P));
      basket.setAttribute('fill', fillOf('#c9a46a', P)); loaf.setAttribute('fill', fillOf('#d6a35c', P));
      dots.setAttribute('fill', fillOf('#f2ead8', P, 0.75));
    },
    remove() { g.remove(); if (hola) hola.n.remove(); },
  };
}

// a damped spring for arm swing (same as lib/motion's, inlined to keep this file's imports small)
function spring2(stiffness, damping) {
  return { x: 0, v: 0, step(target, dt) { this.v += (stiffness * (target - this.x) - damping * this.v) * dt; this.x += this.v * dt; return this.x; } };
}

// ===================================================================== schoolboy on a mama-chari
export function createCyclist(parent, glow, { dir = -1, x, y }) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const speed = 66; // scene px/s
  const R = 13.5, REAR = [18, 106.5], FRONT = [71, 106.5], BB = [41, 108];
  const wheels = [REAR, FRONT].map((c) => ({ c, tyre: el('circle', { cx: c[0], cy: c[1], r: R, fill: 'none', stroke: 'currentColor', 'stroke-width': PEN * 1.1 }, g), rim: el('circle', { cx: c[0], cy: c[1], r: R - 1.6, fill: 'none', stroke: 'currentColor', 'stroke-width': PEN * 0.45 }, g), spokes: pen(g, PEN * 0.32), hub: el('circle', { cx: c[0], cy: c[1], r: 1.4, fill: 'currentColor' }, g) }));
  const farLeg = solid(limb(g, 4.2));
  const farShoe = blot(g);
  const frame = pen(g, PEN * 1.05);
  pen(g, PEN * 0.6).setAttribute('d', `M${REAR[0] - 15} ${REAR[1] - 2} Q${REAR[0]} ${REAR[1] - 18} ${REAR[0] + 14} ${REAR[1] - 5} M${FRONT[0] - 13} ${FRONT[1] - 5} Q${FRONT[0]} ${FRONT[1] - 18} ${FRONT[0] + 14} ${FRONT[1] - 3}`);
  frame.setAttribute('d', `M64 79 Q52 103 ${BB[0]} ${BB[1]} L${REAR[0]} ${REAR[1]} L31 80 L${BB[0]} ${BB[1]} M31 80 L30 74 M64 79 L66.6 89 Q68.4 97 ${FRONT[0]} ${FRONT[1]} M64 79 L62.4 70 Q58 68 54.4 69.6`);
  const guard = shape(g, PEN * 0.6); guard.setAttribute('d', `M${BB[0] + 3} ${BB[1] - 3.6} L${REAR[0] + 1} ${REAR[1] - 3} Q${REAR[0] - 2} ${REAR[1]} ${REAR[0] + 1} ${REAR[1] + 3} L${BB[0] + 3} ${BB[1] + 3.6} Q${BB[0] + 6.4} ${BB[1]} ${BB[0] + 3} ${BB[1] - 3.6}Z`);
  const saddle = blot(g); saddle.setAttribute('d', 'M25 73 Q30 70.6 35.6 72.4 L34.6 75 L26 75Z');
  const basket = shape(g, PEN * 0.7); basket.setAttribute('d', 'M66 71 L82 71 L80.6 84 L67.4 84Z');
  pen(g, PEN * 0.35).setAttribute('d', 'M66.5 75 L81.6 75 M66.9 79.4 L81 79.4 M70 71 L70.6 84 M74 71 L74 84 M78 71 L77.4 84');
  const bag = el('path', { d: 'M68 71 Q68.5 64 74 64 Q80 64 80 71Z', fill: '#4a3a2c', stroke: 'currentColor', 'stroke-width': PEN * 0.6 }, g);
  const lamp = el('path', { d: 'M81.6 84 L85.4 84 L85.4 88 L81.6 88Z', fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN * 0.6 }, g);
  const bell = el('path', { d: 'M56 66.6 a1.8 1.8 0 0 1 3.6 0Z', fill: '#d8d2c0', stroke: 'currentColor', 'stroke-width': 0.5 }, g);
  const crank = pen(g, PEN * 0.9);
  const torso = blot(g);
  const collarB = pen(g, PEN * 0.6);
  const head = el('ellipse', { rx: 4.3, ry: 5, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const capC = blot(g);
  const nearLeg = solid(limb(g, 4.4));
  const nearShoe = blot(g);
  const arm = solid(limb(g, 3.6));
  const handC = el('ellipse', { rx: 1.7, ry: 1.4, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN * 0.7 }, g);
  const rings = pen(g, PEN * 0.6);
  const beam = el('path', { fill: dir > 0 ? 'url(#v-beamR)' : 'url(#v-beamL)', opacity: 0 }, glow);
  const beamGlow = el('circle', { r: 10, fill: 'url(#v-warmglow)', opacity: 0 }, glow);
  let dist = 0, ringT = -1;
  return {
    g, x, y, dir, done: false, kind: 'bike',
    poke() { ringT = 0; },
    get ringing() { return ringT >= 0 && ringT < 0.8; },
    draw(t, dt, P) {
      this.x += dir * speed * dt; dist += speed * dt / FS;
      if (this.x < -80 || this.x > 1040) this.done = true;
      place(g, this.x, this.y, dir);
      const wa = dist / R;
      wheels.forEach((w) => {
        const d = [];
        for (let k = 0; k < 8; k++) { const a = wa + (k * Math.PI) / 8; d.push(`M${f(w.c[0] + Math.cos(a) * (R - 1.6))} ${f(w.c[1] + Math.sin(a) * (R - 1.6))} L${f(w.c[0] - Math.cos(a) * (R - 1.6))} ${f(w.c[1] - Math.sin(a) * (R - 1.6))}`); }
        w.spokes.setAttribute('d', d.join(' '));
      });
      const ca = wa * 0.42, CR = 6.2;
      const pN = [BB[0] + Math.cos(ca) * CR, BB[1] + Math.sin(ca) * CR], pF = [BB[0] - Math.cos(ca) * CR, BB[1] - Math.sin(ca) * CR];
      crank.setAttribute('d', `M${pt(pF)} L${pt(pN)} M${f(pN[0] - 2)} ${f(pN[1])} l4 0 M${f(pF[0] - 2)} ${f(pF[1])} l4 0`);
      const bob = Math.sin(ca * 2) * 0.35;
      const hip = [31, 70.6 + bob];
      [[farLeg, farShoe, pF], [nearLeg, nearShoe, pN]].forEach(([L, S, p]) => {
        const ank = [p[0] - 0.6, p[1] - 2.2];
        L.draw([hip, joint(hip, ank, 21, 21, 1), ank], [0.2, 0.4]);
        S.setAttribute('d', `M${f(ank[0] - 2.6)} ${f(ank[1] + 0.6)} L${f(ank[0] + 4.4)} ${f(ank[1] + 0.6)} Q${f(ank[0] + 5.4)} ${f(ank[1] + 2.6)} ${f(ank[0] + 3)} ${f(ank[1] + 2.8)} L${f(ank[0] - 2.4)} ${f(ank[1] + 2.8)}Z`);
      });
      const sh = [44.6, 43 + bob];
      torso.setAttribute('d', `M${f(hip[0] - 3.6)} ${f(hip[1] + 2)} Q${f(hip[0] - 4.4)} ${f(hip[1] - 14)} ${f(sh[0] - 6)} ${f(sh[1] + 1)} Q${f(sh[0] - 1)} ${f(sh[1] - 3.4)} ${f(sh[0] + 3.4)} ${f(sh[1] + 1.6)} Q${f(sh[0] - 2)} ${f(hip[1] - 12)} ${f(hip[0] + 6)} ${f(hip[1] + 2)}Z`);
      collarB.setAttribute('d', `M${f(sh[0] - 2)} ${f(sh[1] - 1)} l3 1.6`);
      collarB.setAttribute('stroke', rgb(P.paper));
      const hc = [sh[0] + 4.2, sh[1] - 9.4];
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      capC.setAttribute('d', `M${f(hc[0] - 4.6)} ${f(hc[1] - 1.6)} Q${f(hc[0] - 4.4)} ${f(hc[1] - 7)} ${f(hc[0] + 0.4)} ${f(hc[1] - 6.8)} Q${f(hc[0] + 4.8)} ${f(hc[1] - 6.4)} ${f(hc[0] + 4.6)} ${f(hc[1] - 2)} L${f(hc[0] + 8)} ${f(hc[1] - 1.2)} L${f(hc[0] + 4.4)} ${f(hc[1] - 0.6)}Z`);
      const grip = [55.4, 69.6];
      arm.draw([[sh[0], sh[1] + 2], joint([sh[0], sh[1] + 2], grip, 11.5, 11.5, -1), grip], [0.2, 0.4]);
      handC.setAttribute('cx', grip[0]); handC.setAttribute('cy', grip[1]);
      bag.setAttribute('fill', fillOf('#4a3a2c', P));
      // bell rings
      if (ringT >= 0) { ringT += dt; if (ringT > 0.9) ringT = -1; }
      const rr = ringT >= 0 ? ringT : 0;
      rings.setAttribute('d', ringT >= 0 ? [5, 9].map((r) => `M${57.8 - r * 0.6} ${f(64 - r * 0.5)} Q57.8 ${f(64 - r * 1.1)} ${57.8 + r * 0.6} ${f(64 - r * 0.5)}`).join(' ') : '');
      rings.setAttribute('opacity', f(1 - rr));
      bell.setAttribute('transform', ringT >= 0 ? `rotate(${f(Math.sin(rr * 60) * 14 * (1 - rr))} 57.8 66.6)` : '');
      // headlamp after dark
      const on = smooth(0.35, 0.6, P.lamp);
      lamp.style.fill = rgb(mix(P.paper, hex('#fff1c2'), on));
      const [lx, ly] = world(this.x, this.y, dir, 85, 86);
      beamGlow.setAttribute('cx', f(lx)); beamGlow.setAttribute('cy', f(ly)); beamGlow.setAttribute('opacity', f(on * 0.6));
      beam.setAttribute('d', `M${f(lx)} ${f(ly - 1)} L${f(lx + dir * 70)} ${f(this.y - 5)} L${f(lx + dir * 70)} ${f(this.y + 6)} L${f(lx)} ${f(ly + 1)}Z`);
      beam.setAttribute('opacity', f(on * 0.4));
    },
    remove() { g.remove(); beam.remove(); beamGlow.remove(); },
  };
}

// ===================================================================== child with a pinwheel
export function createKid(parent, glow, { dir = 1, x, y }) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const T = 0.5, STRIDE = 8, DUTY = 0.36;
  const speed = (2 * STRIDE) / (DUTY * T) * FS;
  const legs = [0, 1].map(() => ({ L: limb(g, 3.6), S: blot(g) }));
  const farArm = limb(g, 3);
  const shorts = el('path', { fill: '#33465e', stroke: 'currentColor', 'stroke-width': PEN }, g);
  const shirt = el('path', { fill: 'url(#v-stripes)', stroke: 'currentColor', 'stroke-width': PEN }, g);
  const head = el('ellipse', { rx: 6.4, ry: 6.9, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN }, g);
  const hair = blot(g);
  const hat = el('path', { fill: '#e6cf8e', stroke: 'currentColor', 'stroke-width': PEN * 0.8 }, g);
  const band = el('path', { fill: '#b3412d' }, g);
  const arm = limb(g, 3);
  const stick = pen(g, PEN * 0.7);
  const wheel = el('g', {}, g);
  const blades = ['#d4552f', '#3f6ea8', '#e3b33d', '#4e8a5a'].map((c, k) => el('path', { d: 'M0 0 L0 -7.6 Q4.8 -6.2 4.8 -3.2Z', transform: `rotate(${k * 90})`, fill: c, stroke: 'currentColor', 'stroke-width': PEN * 0.5, 'stroke-linejoin': 'round' }, wheel));
  const pinDot = el('circle', { r: 1, fill: 'currentColor' }, wheel);
  const footKey = (u) => {
    u = ((u % 1) + 1) % 1;
    if (u < DUTY) return { x: STRIDE - (2 * STRIDE * u) / DUTY, y: 0 };
    const s = (u - DUTY) / (1 - DUTY);
    // heel kicks up behind first, then the knee drives the foot forward and down
    const xs = s * s * s * (10 - 15 * s + 6 * s * s);
    return { x: -STRIDE + 2 * STRIDE * xs - 3.5 * Math.sin(Math.PI * Math.min(1, s * 1.6)), y: -12 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.7)), 1.1) };
  };
  let ph = rnd(0, 1), spin = 0, hopT = -1;
  return {
    g, x, y, dir, done: false,
    poke() { if (hopT < 0) hopT = 0; },
    draw(t, dt, P, wind) {
      ph += dt / T; this.x += dir * speed * dt;
      if (this.x < -60 || this.x > 1020) this.done = true;
      let hop = 0;
      if (hopT >= 0) { hopT += dt; hop = Math.sin(Math.PI * Math.min(1, hopT / 0.55)) * 14; if (hopT > 0.55) hopT = -1; }
      place(g, this.x, this.y - hop * FS, dir);
      const bounce = -3 * Math.pow(Math.abs(Math.sin(2 * Math.PI * ph + 0.6)), 1.4) + 0.8; // up in flight, down at contact
      const hip = [40, 94 + bounce];
      [footKey(ph), footKey(ph + 0.5)].forEach((k, i) => {
        const a = [40 + k.x, 118 + k.y];
        legs[i].L.draw([hip, joint(hip, a, 13, 13, 1), a], [0.2, 0.4]);
        legs[i].S.setAttribute('d', `M${f(a[0] - 2)} ${f(a[1])} L${f(a[0] + 4)} ${f(a[1])} Q${f(a[0] + 5)} ${f(a[1] + 2)} ${f(a[0] + 3)} ${f(a[1] + 2)} L${f(a[0] - 2)} ${f(a[1] + 2)}Z`);
      });
      g.appendChild(legs[footKey(ph).x > footKey(ph + 0.5).x ? 0 : 1].L.g);
      g.insertBefore(farArm.g, shorts);
      const sh = [47, 72.6 + bounce]; // leaning into the run
      shorts.setAttribute('d', `M34.6 ${f(hip[1] - 4)} L46 ${f(hip[1] - 4)} L47 ${f(hip[1] + 4)} L41 ${f(hip[1] + 4.6)} L40 ${f(hip[1] + 1)} L37.6 ${f(hip[1] + 4.6)} L33.8 ${f(hip[1] + 3.6)}Z`);
      shirt.setAttribute('d', `M35 ${f(hip[1] - 3.6)} Q34.2 ${f(sh[1] + 6)} ${f(sh[0] - 6)} ${f(sh[1])} Q${f(sh[0])} ${f(sh[1] - 2.6)} ${f(sh[0] + 3)} ${f(sh[1] + 1)} Q47.4 ${f(sh[1] + 10)} 46.4 ${f(hip[1] - 3.6)}Z`);
      const hc = [sh[0] + 2.4, sh[1] - 11];
      head.setAttribute('cx', f(hc[0])); head.setAttribute('cy', f(hc[1]));
      hair.setAttribute('d', `M${f(hc[0] - 6.2)} ${f(hc[1] + 1)} Q${f(hc[0] - 6.6)} ${f(hc[1] - 6)} ${f(hc[0])} ${f(hc[1] - 6.6)} Q${f(hc[0] - 3)} ${f(hc[1] - 2)} ${f(hc[0] - 6.2)} ${f(hc[1] + 1)}Z`);
      hat.setAttribute('d', `M${f(hc[0] - 12)} ${f(hc[1] - 4)} Q${f(hc[0])} ${f(hc[1] - 8)} ${f(hc[0] + 12)} ${f(hc[1] - 4)} Q${f(hc[0])} ${f(hc[1] - 1)} ${f(hc[0] - 12)} ${f(hc[1] - 4)}Z M${f(hc[0] - 5.6)} ${f(hc[1] - 5.4)} Q${f(hc[0] - 5)} ${f(hc[1] - 12)} ${f(hc[0])} ${f(hc[1] - 12)} Q${f(hc[0] + 5)} ${f(hc[1] - 12)} ${f(hc[0] + 5.6)} ${f(hc[1] - 5.6)}Z`);
      band.setAttribute('d', `M${f(hc[0] - 5.5)} ${f(hc[1] - 7.6)} L${f(hc[0] + 5.5)} ${f(hc[1] - 7.6)} L${f(hc[0] + 5.6)} ${f(hc[1] - 5.8)} L${f(hc[0] - 5.6)} ${f(hc[1] - 5.8)}Z`);
      const swing = Math.sin(2 * Math.PI * ph) * 52;
      const fsh = [sh[0] - 2.5, sh[1] + 1.5];
      const fe = [fsh[0] + Math.sin(swing * RAD) * 8, fsh[1] + Math.cos(swing * RAD) * 8];
      farArm.draw([fsh, fe, [fe[0] + Math.sin((swing - 50) * RAD) * 8, fe[1] + Math.cos((swing - 50) * RAD) * 8]], [0.2, 0.4]);
      const hand = [56, sh[1] - 5];
      arm.draw([[sh[0], sh[1] + 1.5], [sh[0] + 4.6, sh[1] + 5], hand], [0.2, 0.4]);
      const top = [hand[0] + 3, hand[1] - 22];
      stick.setAttribute('d', `M${hand[0] - 0.6} ${f(hand[1] + 2)} L${f(top[0])} ${f(top[1])}`);
      spin += (8 + speed * 0.12 + Math.abs(wind) * 6 + (hopT >= 0 ? 30 : 0)) * dt;
      wheel.setAttribute('transform', `translate(${f(top[0])} ${f(top[1])}) rotate(${f(spin * 57.3)})`);
      blades.forEach((b, k) => b.setAttribute('fill', fillOf(['#d4552f', '#3f6ea8', '#e3b33d', '#4e8a5a'][k], P)));
      shorts.setAttribute('fill', fillOf('#33465e', P));
      hat.setAttribute('fill', fillOf('#e6cf8e', P));
    },
    remove() { g.remove(); },
  };
}

// ===================================================================== a llaüt under a lateen sail
// The traditional Catalan fishing boat: a white double-ended hull with a coloured sheer
// strake, a short mast raked forward, a long yard and a triangular sail that fills with
// the wind; a fisherman in a cap at the tiller. It sails slowly across the harbour, heels
// and bobs, leaves a wake. Click it and he waves and sings.
export function createBoat(parent, glow, { onRipple }) {
  const g = el('g', { style: 'cursor:pointer' }, parent);
  const Y = WATER + 24;
  const tilt = el('g', {}, g);
  const hull = el('path', { d: 'M-46 0 Q-48 -6 -44 -9 L42 -9 Q48 -9 50 -16 Q52 -6 44 2 Q0 6 -40 3 Q-46 2 -46 0Z', fill: '#f2eee4', stroke: 'currentColor', 'stroke-width': PEN * 0.5 }, tilt);
  const strake = el('path', { d: 'M-45 -6 L44 -6 Q48 -6.4 49.6 -12 L50.6 -10 Q48.6 -4 44 -3.6 L-45.6 -3.4Z', fill: '#2f6fa8', stroke: 'none' }, tilt);
  const eye = pen(tilt, PEN * 0.4); eye.setAttribute('d', 'M38 -5.6 q2 -1.4 4 0 q-2 1.2 -4 0');
  const sail = el('path', { fill: '#f4ecd8', stroke: 'currentColor', 'stroke-width': PEN * 0.5, 'stroke-linejoin': 'round' }, tilt);
  const seams = pen(tilt, PEN * 0.25);
  const rig = pen(tilt, PEN * 0.6);
  const man = el('g', {}, tilt);
  const body = el('path', { d: 'M-36 -9 Q-37 -16 -34.4 -19 Q-31 -20 -29.4 -17 Q-29 -12 -30 -9Z', fill: '#3d5a80', stroke: 'currentColor', 'stroke-width': PEN * 0.45 }, man);
  el('ellipse', { cx: -32.4, cy: -22.4, rx: 2.4, ry: 2.8, fill: PAPER, stroke: 'currentColor', 'stroke-width': PEN * 0.45 }, man);
  const cap = el('path', { d: 'M-35 -23.6 Q-34.6 -26.6 -32 -26.4 Q-29.6 -26.2 -29.6 -24 L-28 -23.8 L-35 -23.4Z', fill: '#2a2a30' }, man);
  const arm = pen(man, PEN * 0.6);
  const tiller = pen(tilt, PEN * 0.6);
  const lanGlow = el('circle', { r: 16, fill: 'url(#v-warmglow)', opacity: 0 }, glow);
  const lamp = el('path', { d: 'M44.4 -22 L47.6 -22 L47.2 -18 L44.8 -18Z', stroke: 'currentColor', 'stroke-width': PEN * 0.4 }, tilt);
  const notes = el('g', {}, g);
  let X = 120, songT = -1, wake = 0, fill = 0;
  const noteN = [];
  return {
    g,
    get x() { return X; },
    poke() { if (songT < 0) { songT = 0; for (let i = 0; i < 4; i++) { const n = el('text', { 'font-size': 8, fill: 'currentColor', 'font-family': 'serif' }, notes); n.textContent = i % 2 ? '♪' : '♫'; noteN.push({ t: -i * 0.35, x0: rnd(-3, 3), n }); } } },
    draw(t, dt, P, wind) {
      fill += ((0.55 + Math.abs(wind) * 0.4) - fill) * Math.min(1, dt * 2);
      X += (9 + Math.max(0, wind) * 5) * dt; if (X > 1040) X = -80;
      const heel = -2 - wind * 1.6 + Math.sin(t * 1.3) * 1.2, bob = Math.sin(t * 1.6) * 0.8;
      g.setAttribute('transform', `translate(${f(X)} ${f(Y + bob)})`);
      tilt.setAttribute('transform', `rotate(${f(heel)} 0 0)`);
      // mast raked forward, the long yard, the sail bellied by the wind
      const foot = [16, -9], head = [22, -50], yardA = [-30, -12], yardB = [44, -64], clew = [-24, -10];
      const belly = 6 + fill * 9;
      sail.setAttribute('d', `M${pt(yardA)} L${pt(yardB)} Q${f(14 + belly)} ${f(-30)} ${pt(clew)} Q${f(-10)} ${f(-16 - belly * 0.3)} ${pt(yardA)}Z`);
      seams.setAttribute('d', [0.25, 0.5, 0.75].map((u) => { const a = [lerp(yardA[0], yardB[0], u), lerp(yardA[1], yardB[1], u)]; return `M${pt(a)} Q${f(lerp(a[0], clew[0], 0.5) + belly * 0.6)} ${f(lerp(a[1], clew[1], 0.5))} ${f(lerp(a[0], clew[0], 0.95))} ${f(lerp(a[1], clew[1], 0.95))}`; }).join(' '));
      rig.setAttribute('d', `M${pt(foot)} L${pt(head)} M${pt(yardA)} L${pt(yardB)} M${pt(head)} L44 -12 M${pt(clew)} L-36 -11 M46 -18 L46 -24`);
      tiller.setAttribute('d', 'M-44 -6 L-31 -13');
      lamp.setAttribute('fill', rgb(mix(P.paper, hex('#ffd38a'), smooth(0.3, 0.55, P.lamp))));
      lanGlow.setAttribute('cx', f(X + 46)); lanGlow.setAttribute('cy', f(Y + bob - 20)); lanGlow.setAttribute('opacity', f(smooth(0.3, 0.55, P.lamp) * 0.6));
      // the fisherman steers; when poked he waves his free arm
      const wave = songT >= 0 && songT < 2.4 ? Math.sin(songT * 10) : 0;
      arm.setAttribute('d', songT >= 0 && songT < 2.4 ? `M-31.4 -17.6 L-28 ${f(-24 + wave)} L${f(-27 + wave * 1.6)} ${f(-29)}` : 'M-31.4 -17.6 L-31 -13');
      hull.setAttribute('fill', fillOf('#f2eee4', P, 0.75)); strake.setAttribute('fill', fillOf('#2f6fa8', P)); sail.setAttribute('fill', fillOf('#f4ecd8', P, 0.7)); body.setAttribute('fill', fillOf('#3d5a80', P));
      wake -= dt; if (wake < 0) { wake = rnd(0.9, 1.6); onRipple(X - 44, WATER + 26); }
      if (songT >= 0) songT += dt; if (songT > 3.4) songT = -1;
      for (let i = noteN.length - 1; i >= 0; i--) {
        const n = noteN[i]; n.t += dt;
        if (n.t < 0) { n.n.setAttribute('opacity', 0); continue; }
        n.n.setAttribute('x', f(-30 + n.x0 + n.t * 8)); n.n.setAttribute('y', f(-30 - n.t * 14 + Math.sin(n.t * 6) * 2));
        n.n.setAttribute('opacity', f(Math.max(0, 1 - n.t / 1.8)));
        if (n.t > 1.8) { n.n.remove(); noteN.splice(i, 1); }
      }
    },
  };
}
