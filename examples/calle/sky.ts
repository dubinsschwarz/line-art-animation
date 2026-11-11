// Sky, sun, moon, stars and the day/night palette.
// Time of day τ ∈ [0,1): 0 midnight, 0.25 dawn, 0.5 noon, 0.75 dusk.
import { el, pen, shape, blot, f, pt, PAPER } from '../../lib/ink.ts';
import { W, SP, rnd, srnd, clamp, lerp, smooth, ramp, rgb, hex, mix, lum, oval } from './kit.ts';

const SKY_TOP = [[0, '#0d1222'], [0.19, '#131a30'], [0.235, '#3d4066'], [0.27, '#a9c2dc'], [0.33, '#9cc8e8'], [0.5, '#8ec2ea'], [0.68, '#a3cbe6'], [0.735, '#e2b88e'], [0.762, '#5a5279'], [0.80, '#1b2140'], [0.86, '#0d1222']];
const SKY_BOT = [[0, '#1a2240'], [0.19, '#283050'], [0.235, '#d49884'], [0.27, '#f7c9a2'], [0.33, '#e4f0f1'], [0.5, '#e8f3f4'], [0.68, '#f7e8cc'], [0.735, '#f49a66'], [0.762, '#d47f68'], [0.80, '#383a60'], [0.86, '#1a2240']];
const PAPERS = [[0, '#1a2036'], [0.19, '#1f263e'], [0.235, '#4a4561'], [0.27, '#ede4d8'], [0.33, '#fbf8f1'], [0.5, '#fdfcf8'], [0.68, '#faf4e8'], [0.735, '#f0dbc4'], [0.756, '#5d5571'], [0.80, '#262c48'], [0.86, '#1a2036']];
const INK_DARK = hex('#1c1c1c'), INK_LIGHT = hex('#efe6cf');

export function palette(tau) {
  const top = ramp(SKY_TOP, tau), bot = ramp(SKY_BOT, tau), paper = ramp(PAPERS, tau);
  const L = lum(paper);
  const inkT = smooth(0.56, 0.36, L);
  return {
    top, bot, paper,
    ink: mix(INK_DARK, INK_LIGHT, inkT),
    inkT,
    lamp: smooth(0.78, 0.4, L),            // how dark it is for lamps (windows add their own threshold)
    night: smooth(0.42, 0.1, lum(top)),    // stars, moon glow, fireflies
    sunset: Math.max(smooth(0.67, 0.735, tau) * smooth(0.79, 0.745, tau), smooth(0.215, 0.245, tau) * smooth(0.3, 0.26, tau)),
  };
}

const sunArc = (u) => [40 + 880 * u, 300 - 236 * Math.sin(Math.PI * u)];
const moonArc = (u) => [60 + 840 * u, 290 - 205 * Math.sin(Math.PI * u)];
const SUN_SPAN = [0.225, 0.55], MOON_SPAN = [0.775, 0.45];

export function createSky(svg, root, defs, { onScrub, onShoot }) {
  // gradient sky
  const grad = el('linearGradient', { id: 'v-sky', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
  const s0 = el('stop', { offset: 0 }, grad), s1 = el('stop', { offset: 1 }, grad);
  const glowSun = el('radialGradient', { id: 'v-sunglow' }, defs);
  el('stop', { offset: 0, 'stop-color': '#ffd9a0', 'stop-opacity': 0.55 }, glowSun);
  el('stop', { offset: 1, 'stop-color': '#ffd9a0', 'stop-opacity': 0 }, glowSun);
  const glowMoon = el('radialGradient', { id: 'v-moonglow' }, defs);
  el('stop', { offset: 0, 'stop-color': '#e9e4ff', 'stop-opacity': 0.35 }, glowMoon);
  el('stop', { offset: 1, 'stop-color': '#e9e4ff', 'stop-opacity': 0 }, glowMoon);

  const g = el('g', {}, root);
  el('rect', { x: -20, y: -20, width: W + 40, height: 520, fill: 'url(#v-sky)' }, g);

  // stars
  const starG = el('g', {}, g);
  const stars = Array.from({ length: 90 }, () => {
    const x = srnd(0, W), y = srnd(6, 250), r = srnd(0.35, 1.05);
    return { n: el('circle', { cx: f(x), cy: f(y), r: f(r), fill: '#f5efda' }, starG), ph: srnd(0, 6), sp: srnd(0.6, 2.4), big: r > 0.9, spark: null as SVGPathElement | null };
  });
  stars.filter((s) => s.big).forEach((s) => {
    const x = +s.n.getAttribute('cx'), y = +s.n.getAttribute('cy');
    s.spark = el('path', { d: `M${x - 2.6} ${y} L${x + 2.6} ${y} M${x} ${y - 2.6} L${x} ${y + 2.6}`, stroke: '#f5efda', 'stroke-width': 0.35, opacity: 0.6 }, starG);
  });
  const shoots = [];

  // sun & moon (draggable)
  const sunG = el('g', { class: 'drag', style: 'cursor:grab' }, g);
  const sunGlow = el('circle', { r: 70, fill: 'url(#v-sunglow)' }, sunG);
  const sunDisk = el('circle', { r: 21, stroke: 'currentColor', 'stroke-width': SP }, sunG);
  el('title', {}, sunG).textContent = 'Drag the sun to change the time';
  const moonG = el('g', { class: 'drag', style: 'cursor:grab' }, g);
  el('circle', { r: 60, fill: 'url(#v-moonglow)' }, moonG);
  const moonDisk = el('path', { fill: '#f3ecd6', stroke: '#f3ecd6', 'stroke-width': 0.6 }, moonG);
  const moonShade = el('path', { fill: 'none', stroke: '#cfc6ad', 'stroke-width': 0.5, opacity: 0.7 }, moonG);
  el('title', {}, moonG).textContent = 'Drag the moon to change the time';

  // clouds drifting in the day sky, white-bodied, paper-dark at night
  const mist = el('g', {}, g);
  const bands = [[120, 92, 150], [520, 64, 190], [760, 120, 130], [330, 140, 100]].map(([x, y, w]) => ({ x, y, w, v: rnd(1.2, 2.6), body: el('path', { fill: PAPER, opacity: 0.92 }, mist), n: pen(mist, SP * 0.75) }));
  // fair-weather cumulus: a flat base and a mound of round billows, highest in the middle
  let lastBody = '';
  const cloudD = (x, y, w) => {
    const n = Math.max(4, Math.round(w / 26)), H = w * 0.2;
    const ws = Array.from({ length: n }, (_, i) => 0.7 + 0.6 * Math.abs(Math.sin(i * 1.9 + w * 0.37)));
    const sum = ws.reduce((a, b) => a + b, 0);
    const pts = [[x, y]];
    let acc = 0;
    for (let i = 1; i < n; i++) {
      acc += (ws[i - 1] / sum) * w;
      pts.push([x + acc, y - H * Math.pow(Math.sin(Math.PI * acc / w), 0.8) * (0.85 + 0.25 * Math.sin(i * 2.7 + w))]);
    }
    pts.push([x + w, y]);
    let body = `M${f(x)} ${f(y)}`;
    for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; body += ` A${f(Math.hypot(bx - ax, by - ay) * 0.6)} ${f(Math.hypot(bx - ax, by - ay) * 0.6)} 0 0 1 ${f(bx)} ${f(by)}`; }
    lastBody = body + 'Z';
    let d = `M${f(x - 3)} ${f(y)} Q${f(x + w / 2)} ${f(y + 1)} ${f(x + w + 3)} ${f(y)} M${f(x)} ${f(y)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], r = Math.hypot(bx - ax, by - ay) * 0.6;
      d += ` A${f(r)} ${f(r)} 0 0 1 ${f(bx)} ${f(by)}`;
      if (i > 0 && i < pts.length - 2) d += ` M${f(ax + (bx - ax) * 0.1)} ${f(ay + 4)} q1.6 -2.6 4 -2.2 M${f(bx)} ${f(by)}`;
    }
    return d;
  };

  // far hills with a Moorish castle and cypresses, in diluted ink
  const far = el('g', { opacity: 0.42 }, g);
  const farFills = [];
  farFills.push([el('path', { d: 'M0 262 Q80 238 170 222 Q240 206 300 214 Q360 222 420 208 Q470 196 520 188 Q600 176 660 198 Q720 218 790 206 Q860 192 960 214 L960 350 L0 350Z' }, far), '#9fb27a']);
  pen(far, SP * 0.8).setAttribute('d', 'M0 262 Q80 238 170 222 Q240 206 300 214 Q360 222 420 208 Q470 196 520 188 Q600 176 660 198 Q720 218 790 206 Q860 192 960 214');
  pen(far, SP * 0.55).setAttribute('d', 'M140 228 q20 -6 40 -4 M300 216 q16 -2 30 2 M560 186 q26 -4 44 4 M820 202 q18 -4 32 0');
  drawCastle(far, 588, 182);
  [[548, 186, 22], [556, 188, 16], [632, 192, 20], [170, 222, 18], [180, 223, 13], [330, 216, 17], [800, 204, 19], [810, 206, 14]].forEach(([x, y, h]) => farFills.push([drawCypress(far, x, y, h), '#3f5a3a']));
  // olive groves dotting the hills
  const olives = [];
  for (let i = 0; i < 26; i++) { const x = srnd(10, 950), y = 238 + srnd(-6, 30); olives.push(oval(x, y, srnd(2.4, 4), srnd(1.8, 2.6))); }
  farFills.push([el('path', { d: olives.join(' '), stroke: 'currentColor', 'stroke-width': SP * 0.5 }, far), '#7d8f5a']);

  // dragging: pointer x along the arc → time
  let drag = null;
  const toSvg = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  const start = (kind) => (e) => { e.preventDefault(); e.stopPropagation(); drag = kind; svg.setPointerCapture?.(e.pointerId); svg.classList.add('scrubbing'); };
  sunG.addEventListener('pointerdown', start('sun'));
  moonG.addEventListener('pointerdown', start('moon'));
  svg.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const p = toSvg(e);
    if (drag === 'sun') onScrub(SUN_SPAN[0] + SUN_SPAN[1] * clamp((p.x - 40) / 880, 0, 1));
    else onScrub((MOON_SPAN[0] + MOON_SPAN[1] * clamp((p.x - 60) / 840, 0, 1)) % 1);
  });
  const end = () => { if (drag) { drag = null; svg.classList.remove('scrubbing'); onScrub(null); } };
  svg.addEventListener('pointerup', end);
  svg.addEventListener('pointercancel', end);

  // night sky click → shooting star
  const skyHit = el('rect', { x: 0, y: 0, width: W, height: 160, fill: 'transparent' }, g);
  skyHit.addEventListener('pointerdown', (e) => { if (onShoot()) { const p = toSvg(e); shoot(p.x, p.y); } });
  g.insertBefore(skyHit, sunG);
  function shoot(x, y) {
    shoots.push({ x: x - 30, y: y - 18, t: 0, dir: Math.random() < 0.5 ? -1 : 1, n: el('path', { stroke: '#fff6dc', 'stroke-width': 0.9, 'stroke-linecap': 'round', fill: 'none' }, starG) });
  }

  return {
    shoot,
    draw(tau, t, dt, P, wind) {
      s0.setAttribute('stop-color', rgb(P.top));
      s1.setAttribute('stop-color', rgb(P.bot));
      starG.setAttribute('opacity', f(P.night));
      if (P.night > 0.01) stars.forEach((s) => {
        const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
        s.n.setAttribute('opacity', f(tw));
        if (s.spark) s.spark.setAttribute('opacity', f(tw * 0.7));
      });
      if (P.night > 0.6 && Math.random() < dt * 0.04) shoot(rnd(100, 860), rnd(30, 110));
      for (let i = shoots.length - 1; i >= 0; i--) {
        const s = shoots[i]; s.t += dt;
        const u = s.t / 0.9, x = s.x + s.dir * 120 * u, y = s.y + 60 * u;
        s.n.setAttribute('d', `M${f(x)} ${f(y)} L${f(x - s.dir * 34 * (1 - u))} ${f(y - 17 * (1 - u))}`);
        s.n.setAttribute('opacity', f(Math.sin(Math.PI * Math.min(1, u))));
        if (u >= 1) { s.n.remove(); shoots.splice(i, 1); }
      }

      // sun
      const su = (tau - SUN_SPAN[0]) / SUN_SPAN[1];
      if (su > -0.05 && su < 1.05) {
        const [x, y] = sunArc(clamp(su, 0, 1));
        sunG.setAttribute('transform', `translate(${f(x)} ${f(y + (su < 0 || su > 1 ? 30 : 0))})`);
        sunG.style.display = '';
        sunDisk.setAttribute('fill', rgb(mix(hex('#fbf3df'), hex('#df5a3a'), P.sunset)));
        sunGlow.setAttribute('opacity', f(0.35 + 0.65 * P.sunset));
      } else sunG.style.display = 'none';

      // moon (waxing crescent drawn with two arcs)
      const mu = (((tau - MOON_SPAN[0]) % 1) + 1) % 1 / MOON_SPAN[1];
      if (mu <= 1.02) {
        const [x, y] = moonArc(clamp(mu, 0, 1));
        moonG.setAttribute('transform', `translate(${f(x)} ${f(y)}) rotate(-24)`);
        moonG.style.display = '';
        moonG.setAttribute('opacity', f(smooth(0, 0.08, mu) * smooth(1.02, 0.94, mu)));
        const r = 15;
        moonDisk.setAttribute('d', `M0 ${-r} A${r} ${r} 0 1 1 0 ${r} A${r * 0.62} ${r} 0 1 0 0 ${-r}Z`);
        moonShade.setAttribute('d', `M3 -6 a2.4 1.8 0 1 0 0.1 0 M8 4 a1.6 1.3 0 1 0 0.1 0`);
      } else moonG.style.display = 'none';

      // mist bands — strongest in the morning
      mist.setAttribute('opacity', f(0.85 - 0.5 * P.night));
      farFills.forEach(([n, c]) => { n.style.fill = rgb(mix(hex(c), P.paper, Math.min(1, P.inkT * 0.85 + 0.1))); });
      bands.forEach((b) => {
        b.x += (b.v + wind * 3) * dt; if (b.x > W + 40) b.x = -b.w - 40; if (b.x < -b.w - 60) b.x = W + 30;
        b.n.setAttribute('d', cloudD(b.x, b.y, b.w));
        b.body.setAttribute('d', lastBody);
        b.body.style.fill = rgb(mix(P.paper, hex('#f8b48c'), P.sunset * 0.7));
      });
    },
  };
}

function drawCastle(g, cx, baseY) {
  // a crenellated curtain wall between two square towers, the keep rising behind
  const cren = (x0, y0, x1, y1) => {
    let d = `M${x0} ${y1} L${x0} ${y0}`;
    for (let x = x0; x < x1 - 0.1; x += 4) d += ` L${f(x)} ${f(y0 - 2.6)} L${f(Math.min(x + 2.2, x1))} ${f(y0 - 2.6)} L${f(Math.min(x + 2.2, x1))} ${y0} L${f(Math.min(x + 4, x1))} ${y0}`;
    return d + ` L${x1} ${y1}Z`;
  };
  shape(g, SP * 0.75).setAttribute('d', cren(cx - 12, baseY - 40, cx + 12, baseY));
  shape(g, SP * 0.75).setAttribute('d', cren(cx - 44, baseY - 16, cx + 44, baseY));
  shape(g, SP * 0.75).setAttribute('d', cren(cx - 52, baseY - 26, cx - 38, baseY));
  shape(g, SP * 0.75).setAttribute('d', cren(cx + 38, baseY - 24, cx + 52, baseY));
  pen(g, SP * 0.5).setAttribute('d', `M${cx - 2} ${baseY - 30} l0 5 M${cx + 3} ${baseY - 30} l0 5 M${cx - 46} ${baseY - 18} l0 4 M${cx + 44} ${baseY - 16} l0 4 M${cx - 4} ${baseY} l0 -5 a4 4 0 0 1 8 0 l0 5`);
}

function drawCypress(g, x, y, h) {
  const n = shape(g, SP * 0.7);
  n.setAttribute('d', `M${x} ${y} Q${x - h * 0.17} ${y - h * 0.45} ${x} ${y - h} Q${x + h * 0.17} ${y - h * 0.45} ${x} ${y}Z`);
  return n;
}
