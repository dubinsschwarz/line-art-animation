// Street surface, the harbour quay with its bollards, water, reflections, a palm, a leaping mullet.
import { el, pen, shape, blot, f, pt, PAPER } from '../../lib/ink.ts';
import { W, H, BASE, EDGE, WATER, SP, rnd, srnd, clamp, lerp, smooth, ease, oval, rgb, hex, mix, wobble } from './kit.ts';

const WARM = hex('#ffcf7e');

export function buildCanal({ ground, canalL, willowL, glow }, defs) {
  // ---------- street surface and gutter
  const streetN = el('path', { d: `M-10 ${BASE} L${W + 10} ${BASE} L${W + 10} ${EDGE} L-10 ${EDGE}Z`, fill: PAPER }, ground);
  // a band of paler paving along the house fronts
  const paveN = el('path', { d: `M-10 ${BASE} L${W + 10} ${BASE} L${W + 10} ${BASE + 9} L-10 ${BASE + 9}Z`, fill: PAPER }, ground);

  // ---------- canal wall: coping stones then two courses of masonry
  const wall = el('g', {}, canalL);
  const wallN = shape(wall, SP);
  wallN.setAttribute('d', `M-10 ${EDGE} L${W + 10} ${EDGE} L${W + 10} ${WATER} L-10 ${WATER}Z`);
  const d = [`M-10 ${EDGE + 5} L${W + 10} ${EDGE + 5}`, `M-10 ${EDGE + 10.5} Q${W / 2} ${EDGE + 10} ${W + 10} ${EDGE + 10.6}`];
  for (let x = srnd(0, 20); x < W; x += srnd(28, 44)) d.push(`M${f(x)} ${EDGE} l0.4 5`);
  [[EDGE + 5, EDGE + 10.5, 0], [EDGE + 10.5, WATER, 8]].forEach(([y0, y1, o]) => {
    for (let x = srnd(0, 14) + o; x < W; x += srnd(12, 24)) d.push(`M${f(x)} ${f(y0 + 0.4)} Q${f(x + srnd(-1, 1))} ${f((y0 + y1) / 2)} ${f(x + srnd(-0.6, 0.6))} ${f(y1 - 0.4)}`);
  });
  for (let i = 0; i < 40; i++) { const x = srnd(4, W - 4), y = srnd(EDGE + 6, WATER - 2); d.push(`M${f(x)} ${f(y)} l${f(srnd(1, 2.6))} ${f(srnd(-0.3, 0.3))}`); }
  pen(wall, SP * 0.5).setAttribute('d', d.join(' '));
  // moss tufts hanging over the coping
  const moss = [];
  for (let i = 0; i < 26; i++) { const x = srnd(0, W); moss.push(`M${f(x)} ${EDGE + 5} q-1 3 0.4 5 M${f(x + 2)} ${EDGE + 5} q1 2.6 -0.2 4.4`); }
  pen(wall, SP * 0.45).setAttribute('d', moss.join(' '));
  // cast-iron mooring bollards along the quay, one with a coil of rope
  [96, 286, 470, 660, 850].forEach((x) => {
    shape(wall, SP * 0.8).setAttribute('d', `M${x - 3} ${EDGE} L${x - 2.6} ${EDGE - 5} Q${x - 4.6} ${EDGE - 6.4} ${x - 3.6} ${EDGE - 8} L${x + 3.6} ${EDGE - 8} Q${x + 4.6} ${EDGE - 6.4} ${x + 2.6} ${EDGE - 5} L${x + 3} ${EDGE}Z`);
    pen(wall, SP * 0.4).setAttribute('d', `M${x - 3.6} ${EDGE - 6.6} L${x + 3.6} ${EDGE - 6.6}`);
  });
  pen(wall, SP * 0.5).setAttribute('d', `${oval(474, EDGE - 1.2, 9, 1.6)} ${oval(474, EDGE - 2.6, 7, 1.3)} ${oval(474, EDGE - 3.8, 5, 1)} M465 ${EDGE - 1} Q450 ${EDGE + 6} 446 ${WATER + 6}`);

  // ---------- water
  const water = el('path', { d: `M-10 ${WATER} L${W + 10} ${WATER} L${W + 10} ${H + 10} L-10 ${H + 10}Z` }, canalL);
  pen(canalL, SP * 0.8).setAttribute('d', `M-10 ${WATER} L${W + 10} ${WATER}`);
  const reflG = el('g', {}, canalL);
  const ripG = el('g', {}, canalL);
  const lines = Array.from({ length: 46 }, (_, i) => ({ x: rnd(-40, W), y: WATER + 5 + (i % 9) * 8.4 + rnd(-2, 2), len: rnd(10, 34), v: rnd(4, 9), n: pen(ripG, SP * 0.5) }));
  const rings = [];
  const ringG = el('g', {}, canalL);
  const ring = (x, y, n = 1, big = 1) => { for (let i = 0; i < n; i++) rings.push({ x, y, t: -i * 0.22, big, n: el('ellipse', { fill: 'none', stroke: 'currentColor', 'stroke-width': SP * 0.55 }, ringG) }); };

  // reflections: light streaks under each lit source
  const refl = [];
  const addRefl = (src, x, w, warm = true) => {
    const strokes = Array.from({ length: 9 }, (_, k) => el('path', { stroke: warm ? '#ffcf7e' : '#f3ecd6', 'stroke-width': 1.4 - k * 0.08, 'stroke-linecap': 'round', fill: 'none' }, reflG));
    refl.push({ src, x, w, strokes, warm });
  };

  // floating petals land here
  const floating = [];
  const floatG = el('g', {}, canalL);

  // ---------- a mullet (lisa) that leaps where you click, or now and then
  const koiG = el('g', { opacity: 0 }, canalL);
  const koiBody = el('path', { fill: '#dfe2dc', stroke: 'currentColor', 'stroke-width': SP * 0.8 }, koiG);
  const koiSpots = el('path', { fill: 'none', stroke: 'currentColor', 'stroke-width': SP * 0.35 }, koiG);
  const koiFin = shape(koiG, SP * 0.6), koiEye = el('circle', { r: 0.9, fill: 'currentColor' }, koiG);
  let koi = null;
  const jump = (x) => { if (koi) return; koi = { x: clamp(x, 60, W - 60), t: 0, dir: Math.random() < 0.5 ? -1 : 1 }; ring(koi.x, WATER + 14, 2); };

  // ---------- date palm on the near bank (left): a ringed trunk, fronds that sway as pendulums
  const willow = el('g', {}, willowL);
  const trunkC = (u) => [(1 - u) * (1 - u) * 33 + 2 * u * (1 - u) * 38 + u * u * 54, lerp(384, 212, u)];
  const tl = [], tr = [];
  for (let k = 0; k <= 12; k++) { const u = k / 12, [cx, cy] = trunkC(u), hw = lerp(7.4, 5, u); tl.push([cx - hw, cy]); tr.push([cx + hw, cy]); }
  shape(willow, SP).setAttribute('d', 'M' + tl.map(pt).join('L') + 'L' + tr.reverse().map(pt).join('L') + 'Z');
  const trunkRings = [];
  for (let y = 380; y > 216; y -= 4.6) {
    const u = (384 - y) / 172, [cx] = trunkC(u), hw = lerp(7.4, 5, u), o = ((384 - y) / 4.6) % 2 ? 1.6 : -1.6;
    trunkRings.push(`M${f(cx - hw)} ${f(y)} Q${f(cx + o)} ${f(y + 2.6)} ${f(cx + hw)} ${f(y)}`);
  }
  pen(willow, SP * 0.45).setAttribute('d', trunkRings.join(' '));
  const crown = [54, 210];
  blot(willow).setAttribute('d', [[48, 218], [51, 221], [55, 220], [58, 217], [46, 222]].map(([x, y]) => oval(x, y, 1.6, 1.6)).join(' ')); // dates
  const strands = [];
  for (let i = 0; i < 17; i++) {
    const th = lerp(-196, 16, i / 16) * Math.PI / 180 + srnd(-0.08, 0.08);
    const side = Math.abs(Math.cos(th));
    strands.push({ th, len: srnd(54, 72) * (0.85 + 0.25 * side), droop: 0.6 + 0.6 * side, ph: srnd(0, 6), stiff: srnd(0.8, 1.2),
      n: pen(willow, SP * 0.6), leaves: pen(willow, SP * 0.32), a: 0, v: 0 });
  }
  let willowKick = 0;

  // ---------- fireflies (night) and moths at the street lamp
  const flies = Array.from({ length: 0 }, (_, i) => ({ cx: srnd(20, W - 20), cy: srnd(300, 460), ph: srnd(0, 50), sp: srnd(0.4, 0.9), blink: srnd(2, 5),
    n: el('circle', { r: 5.5, fill: 'url(#v-fly)' }, glow), dot: el('circle', { r: 0.9, fill: '#f1ffb4' }, glow) }));
  const fly = el('radialGradient', { id: 'v-fly' }, defs);
  el('stop', { offset: 0, 'stop-color': '#e9ff9a', 'stop-opacity': 0.9 }, fly);
  el('stop', { offset: 1, 'stop-color': '#c8ff6a', 'stop-opacity': 0 }, fly);
  const moths = Array.from({ length: 4 }, () => ({ ph: rnd(0, 6), r: rnd(5, 12), sp: rnd(3, 6), n: el('circle', { r: 0.7, fill: '#fff4d2' }, glow) }));

  return {
    ring, jump, addRefl,
    floatPetal(p) { floating.push({ x: p.x, y: WATER + rnd(3, 40), r: p.r, life: 0, n: el('ellipse', { rx: 1.5, ry: 0.7, fill: '#f6dfe4', stroke: 'currentColor', 'stroke-width': SP * 0.4 }, floatG) }); },
    poke(x, y) { if (y > WATER) { if (Math.random() < 0.7 || !koi) jump(x); ring(x, y, 3); } },
    willowPoke() { willowKick = 1; const d = Math.random() < 0.5 ? -1 : 1; strands.forEach((s) => (s.v += rnd(1, 2) * d)); },
    draw(t, dt, P, wind, lights, tau, lampOn, moonX?: number) {
      const day = 1 - P.inkT;
      water.setAttribute('fill', rgb(mix(P.paper, P.inkT > 0.5 ? hex('#0f1730') : hex('#7fb0bf'), P.inkT > 0.5 ? 0.45 : 0.52)));
      streetN.style.fill = rgb(mix(P.paper, hex('#e6d0a6'), 0.58 * (1 - P.inkT * 0.88)));
      paveN.style.fill = rgb(mix(P.paper, hex('#efe3cb'), 0.5 * (1 - P.inkT * 0.88)));
      wallN.style.fill = rgb(mix(P.paper, hex('#d9c19a'), 0.62 * (1 - P.inkT * 0.88)));
      lines.forEach((l) => {
        l.x += (l.v + wind * 4) * dt; if (l.x > W + 20) l.x = -40; if (l.x < -50) l.x = W + 10;
        const y = l.y + Math.sin(t * 1.3 + l.x * 0.04) * 0.7;
        l.n.setAttribute('d', `M${f(l.x)} ${f(y)} Q${f(l.x + l.len / 2)} ${f(y - 1.2)} ${f(l.x + l.len)} ${f(y)}`);
      });
      if (Math.random() < dt * 0.5) ring(rnd(40, W - 40), rnd(WATER + 10, H - 10), 1, 0.6);
      if (P.night < 0.5 && Math.random() < dt * 0.03) jump(rnd(120, W - 120));
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.t += dt;
        if (r.t < 0) { r.n.setAttribute('opacity', 0); continue; }
        r.n.setAttribute('cx', f(r.x)); r.n.setAttribute('cy', f(r.y));
        r.n.setAttribute('rx', f((2 + r.t * 12) * r.big)); r.n.setAttribute('ry', f((0.6 + r.t * 2.2) * r.big));
        r.n.setAttribute('opacity', f(Math.max(0, 1 - r.t / 1.6)));
        if (r.t > 1.6) { r.n.remove(); rings.splice(i, 1); }
      }
      // reflections
      refl.forEach((r) => {
        const lit = r.src();
        r.strokes.forEach((s, k) => {
          if (lit < 0.02) { s.setAttribute('d', ''); return; }
          const y = WATER + 6 + k * 6.5, jit = Math.sin(t * 2.2 + k * 1.7 + r.x * 0.1) * (2 + k * 0.5);
          const w = r.w * (1 - k * 0.07) * (0.7 + 0.3 * Math.sin(t * 1.7 + k));
          s.setAttribute('d', `M${f(r.x - w / 2 + jit)} ${f(y)} L${f(r.x + w / 2 + jit)} ${f(y)}`);
          s.setAttribute('opacity', f(lit * (0.75 - k * 0.07) * 0.55));
        });
      });
      // floating petals drift downstream
      for (let i = floating.length - 1; i >= 0; i--) {
        const p = floating[i]; p.life += dt; p.x += (6 + wind * 3) * dt; p.r += dt * 0.3;
        p.n.setAttribute('cx', f(p.x)); p.n.setAttribute('cy', f(p.y + Math.sin(t + p.x * 0.05) * 0.6));
        p.n.setAttribute('transform', `rotate(${f(p.r * 40)} ${f(p.x)} ${f(p.y)})`);
        p.n.setAttribute('opacity', f(Math.min(1, (12 - p.life) / 2)));
        if (p.life > 12 || p.x > W + 10) { p.n.remove(); floating.splice(i, 1); }
      }
      // koi leap: arc out of the water, flip, splash back in
      if (koi) {
        koi.t += dt;
        const u = koi.t / 1.1;
        if (u >= 1) { ring(koi.x + koi.dir * 30, WATER + 14, 3, 1.2); koi = null; koiG.setAttribute('opacity', 0); }
        else {
          const x = koi.x + koi.dir * 30 * u, y = WATER + 14 - 26 * Math.sin(Math.PI * u);
          const ang = Math.atan2(-26 * Math.PI * Math.cos(Math.PI * u), 30) * 57.3;
          const bend = Math.sin(u * 18) * 2;
          koiG.setAttribute('opacity', 1);
          koiG.setAttribute("transform", `translate(${f(x)} ${f(y)}) rotate(${f(ang * koi.dir)}) scale(${koi.dir} 1)`);
          koiBody.setAttribute('d', `M-11 0 Q-4 -5.4 6 -3.6 Q11 -2 12 0 Q11 2 6 3.6 Q-4 5.4 -11 0Z M-11 0 L-17 ${f(-4.5 + bend)} Q-15 0 -17 ${f(4.5 + bend)}Z`);
          koiSpots.setAttribute('d', 'M-9 -0.6 Q0 -2.6 9 -1.4 M-8 1 Q0 0.4 8 1.2');
          koiFin.setAttribute('d', `M-1 3 L-4 7.5 L2 4Z`);
          koiEye.setAttribute('cx', 9); koiEye.setAttribute('cy', -0.8);
          if (u > 0.08 && u < 0.12 && !koi.dripped) { koi.dripped = true; ring(koi.x, WATER + 12, 2, 0.9); }
        }
      }
      // palm fronds: pendulums driven by the wind; leaflets hang back along each rachis
      willowKick = Math.max(0, willowKick - dt);
      strands.forEach((s) => {
        s.v += (-s.a * 3.4 * s.stiff + wind * 0.18 + Math.sin(t * 0.8 + s.ph) * 0.05 - s.v * 1.1) * dt; s.a += s.v * dt;
        const th = s.th + s.a * 0.5, pts = [];
        for (let k = 0; k <= 18; k++) {
          const u = k / 18;
          pts.push([crown[0] + s.len * u * Math.cos(th) + s.a * 10 * u * u, crown[1] + s.len * u * Math.sin(th) + s.droop * s.len * u * u]);
        }
        s.n.setAttribute('d', 'M' + pts.map(pt).join('L'));
        const lv = [];
        for (let k = 3; k < 18; k += 2) {
          const [x, y] = pts[k], [px, py] = pts[k - 1];
          const dx = x - px, dy = y - py, l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
          const lf = 10 * Math.sin(Math.PI * Math.min(1, (k + 2) / 19)) + 2;
          // leaflets angle forward along the rachis and hang under their own weight
          for (const sg of [1, -1]) {
            const ex = x + (sg * nx * 0.8 + dx / l * 0.4) * lf, ey = y + (sg * ny * 0.8 + dy / l * 0.4) * lf + lf * 0.3;
            lv.push(`M${f(x)} ${f(y)} Q${f((x + ex) / 2 + sg * nx * 1.2)} ${f((y + ey) / 2 - 1.2)} ${f(ex)} ${f(ey)}`);
          }
        }
        s.leaves.setAttribute('d', lv.join(' '));
      });
      // fireflies: drift on slow noise, blink, only after dark
      flies.forEach((fl, i) => {
        const tt = t * fl.sp + fl.ph;
        const x = fl.cx + Math.sin(tt * 0.7) * 30 + Math.sin(tt * 1.9) * 8, y = fl.cy + Math.sin(tt * 0.9 + 1) * 16 + Math.cos(tt * 2.3) * 5;
        const b = Math.pow(Math.max(0, Math.sin(t * fl.blink + fl.ph)), 3);
        fl.n.setAttribute('cx', f(x)); fl.n.setAttribute('cy', f(y)); fl.dot.setAttribute('cx', f(x)); fl.dot.setAttribute('cy', f(y));
        fl.n.setAttribute('opacity', f(P.night * b)); fl.dot.setAttribute('opacity', f(P.night * (0.3 + 0.7 * b)));
      });
      moths.forEach((m, i) => {
        const a = t * m.sp + m.ph, x = 399 + Math.cos(a) * m.r + Math.sin(a * 2.7) * 3, y = 254 + Math.sin(a * 1.3) * m.r * 0.6;
        m.n.setAttribute('cx', f(x)); m.n.setAttribute('cy', f(y)); m.n.setAttribute('opacity', f(lampOn * (0.6 + 0.4 * Math.sin(a * 5))));
      });
    },
  };
}
