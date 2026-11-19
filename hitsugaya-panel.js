/**
 * hitsugaya-panel.js - Tōshirō Hitsugaya (Daiguren Hyōrinmaru / 氷輪丸 — Realistic Ice Dragon)
 * Modeled directly on Hitsugaya's glacial dragon artwork:
 *   - Towering sculptural S-curved translucent sapphire-ice dragon torso & ventral crystal belly plates
 *   - Massive articulated glacial wings with spiked elbow crests, ice-finger struts & frost-veined tattered membranes
 *   - Fierce 3/4 faceted crystal dragon head with multi-spire jagged ice crown & blazing white glacial eyes
 *   - Sweeping coiled ice tail behind the wing, billowing sub-zero frost breath, Zekku crimson lotuses & diamond snow
 * Entrance (0-3s):
 *   0.0-0.85s: Sub-zero frost mist sweeps inward as the sculpted glacial wings unfurl & S-curved torso crystallizes
 *   0.85-1.9s: Jagged ice-crown dragon head rises, blazing white eyes ignite with a cold flash & frost breath billows
 *   1.9-3.0s:  Settles into slow majestic breathing of wings, neck & tail amid drifting glacial mist & diamond snow
 *
 * API: const hg = HitsugayaPanel.attach(sidebar, options);
 *      hg.open(); hg.close(); hg.replay(); hg.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 19-22 to customize) ---
  const DEFAULTS = {
    particles: 48,           // Line 20: diamond blizzard snowflakes & ice crystal shards
    intensity: 1.0,          // Line 21: brightness & glacial glow multiplier (0.4 - 1.6)
    seed: 10,                // Line 22: deterministic PRNG seed
    impact: [0.42, 0.34],    // Line 23: normalized [x, y] Ice Dragon head & gaze focal point
    seal: [0.84, 0.90],
    anchor: '#sidebar-content'
  };

  const inst = new WeakMap();
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class HitsugayaEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.snow = []; this.breath = []; this.mistSprites = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'hg-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _buildMistSprites() {
      this.mistSprites = [];
      if (typeof document === 'undefined') return;
      const r = mulberry32(this.o.seed + 31);
      const tones = [
        [125, 211, 252], // pale glacial cyan frost mist
        [14, 116, 164]   // deep sapphire sub-zero fog
      ];
      for (let s = 0; s < 2; s++) {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const cctx = c.getContext && c.getContext('2d');
        if (!cctx) continue;
        const [cr, cg, cb] = tones[s];
        for (let lobe = 0; lobe < 6; lobe++) {
          const ox = 64 + (r() - 0.5) * 42;
          const oy = 64 + (r() - 0.5) * 32;
          const rad = 24 + r() * 24;
          const gGrad = cctx.createRadialGradient(ox, oy, 2, ox, oy, rad);
          gGrad.addColorStop(0, `rgba(${cr},${cg},${cb},0.28)`);
          gGrad.addColorStop(0.55, `rgba(${cr},${cg},${cb},0.10)`);
          gGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          cctx.fillStyle = gGrad;
          cctx.beginPath();
          cctx.arc(ox, oy, rad, 0, TAU);
          cctx.fill();
        }
        this.mistSprites.push(c);
      }
    }

    _build() {
      const el = this.el;
      el.classList.add('hitsugaya-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('hg-wash');
      this.wash.style.setProperty('--hg-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--hg-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'hg-layer hg-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('hg-flash');
      this.flash.style.setProperty('--hg-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--hg-iy', (this.o.impact[1] * 100) + '%');

      // Authentic Traditional Hanko Seal with "氷輪丸" (Hyōrinmaru)
      this.seal = this._div('hg-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<circle cx="32" cy="32" r="28" fill="#082f49" stroke="#38bdf8" stroke-width="2"/>' +
        '<circle cx="32" cy="32" r="24" fill="none" stroke="rgba(224,242,254,0.6)" stroke-width="1.2"/>' +
        '<path d="M32 14V27M32 20L25 17M32 22L39 18M26 27L38 27" stroke="#e0f2fe" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M20 32H27V48H20ZM20 37H27M20 43H27" stroke="#e0f2fe" stroke-width="1.3" fill="none"/>' +
        '<path d="M29 32H35M32 30V48M29 48H35" stroke="#e0f2fe" stroke-width="1.4" stroke-linecap="round"/>' +
        '<path d="M40 33H48M44 33V49M48 37C48 43 45 48 39 49M44 41L50 49" stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round" fill="none"/>' +
        '</svg>';

      this.ring = this._div('hg-ring');

      this.layers = [this.wash, this.canvas, this.seal, this.flash, this.ring];
      this.layers.forEach(n => el.insertBefore(n, ref));

      this._buildMistSprites();
      this._measure(true);
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this._measure(false));
        this.ro.observe(el);
      }
    }

    _measure(force) {
      const w = Math.max(1, this.el.clientWidth || 360);
      const h = Math.max(1, this.el.clientHeight || 540);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (!force && w === this.w && h === this.h && dpr === this.dpr) return;
      this.w = w; this.h = h; this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.isOpen && this.rm) this._render(2.5, 0);
    }

    _resetSim() {
      const r = mulberry32(this.o.seed);
      const w = this.w || 360, h = this.h || 540;
      const count = Math.max(16, Math.round(this.o.particles));
      this.simTime = 0;

      // Blizzard snow & floating razor diamond crystal shards
      this.snow = [];
      for (let i = 0; i < count; i++) {
        this.snow.push({
          x: r() * w,
          y: r() * h,
          size: 1.0 + r() * 2.5,
          vy: 18 + r() * 40,
          vx: -10 + r() * 22,
          swayP: r() * TAU,
          swayS: 0.9 + r() * 1.4,
          isShard: r() > 0.58,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 2.2,
          alpha: 0.30 + r() * 0.62
        });
      }

      // Billowing frost-breath mist puffs leaking from dragon's jaws
      this.breath = [];
      for (let i = 0; i < 8; i++) {
        this.breath.push({
          phase: i / 8,
          dx: -18 + r() * 68,
          dy: 46 + r() * 88,
          spriteIdx: i % 2
        });
      }
    }

    // Helper: draw a 3D two-facet glacial ice crystal shard (bright lit left facet + dark sapphire right facet)
    _drawCrystalShard(ctx, x0, y0, xTip, yTip, halfBase, alpha) {
      const dx = xTip - x0, dy = yTip - y0;
      const len = Math.hypot(dx, dy) || 1;
      const nx = -dy / len, ny = dx / len;
      const lx = x0 + nx * halfBase, ly = y0 + ny * halfBase;
      const rx = x0 - nx * halfBase, ry = y0 - ny * halfBase;

      // Illuminated glacial cyan-white facet
      const lg = ctx.createLinearGradient(lx, ly, xTip, yTip);
      lg.addColorStop(0, `rgba(14, 116, 164, ${(0.72 * alpha).toFixed(3)})`);
      lg.addColorStop(0.55, `rgba(125, 211, 252, ${(0.84 * alpha).toFixed(3)})`);
      lg.addColorStop(1, `rgba(240, 251, 255, ${(0.96 * alpha).toFixed(3)})`);
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(lx, ly); ctx.lineTo(xTip, yTip);
      ctx.closePath();
      ctx.fill();

      // Deep sapphire shadow facet
      const rg = ctx.createLinearGradient(rx, ry, xTip, yTip);
      rg.addColorStop(0, `rgba(4, 21, 41, ${(0.88 * alpha).toFixed(3)})`);
      rg.addColorStop(0.65, `rgba(12, 74, 110, ${(0.76 * alpha).toFixed(3)})`);
      rg.addColorStop(1, `rgba(186, 230, 253, ${(0.82 * alpha).toFixed(3)})`);
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(rx, ry); ctx.lineTo(xTip, yTip);
      ctx.closePath();
      ctx.fill();

      // Razor specular ridge down the middle
      ctx.strokeStyle = `rgba(240, 251, 255, ${(0.82 * alpha).toFixed(3)})`;
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      ctx.moveTo(x0, y0); ctx.lineTo(xTip, yTip);
      ctx.stroke();
    }

    // Draws one massive realistic articulated glacial wing with elbow ice-crests, finger struts & frost-veined tattered membrane
    _drawRealisticWing(ctx, ox, oy, side, unfold, breathe, t, a) {
      // side = -1 (left grand wing), +1 (right sprawling wing)
      const flap = Math.sin(t * 1.15 + (side > 0 ? 0.3 : 0)) * 9 * breathe;
      const spread = unfold;

      // Key anatomical wing joints (shoulder -> elbow spike -> wingtip + 3 inner fingers)
      const elbowX = ox + side * (56 * spread);
      const elbowY = oy - (58 * spread) + flap * 0.45;
      const tipX   = ox + side * (174 * spread);
      const tipY   = oy - (34 * spread) + flap * 1.15;

      const f1X = ox + side * (154 * spread), f1Y = oy + (26 * spread) + flap * 0.9;
      const f2X = ox + side * (112 * spread), f2Y = oy + (66 * spread) + flap * 0.65;
      const f3X = ox + side * (62 * spread),  f3Y = oy + (84 * spread) + flap * 0.4;
      const rootX = ox + side * 8,            rootY = oy + 52;

      ctx.save();
      // 1. Translucent frosted sapphire-ice wing membrane with scalloped tattered trailing edge
      const memG = ctx.createLinearGradient(ox, oy - 50, tipX, f2Y);
      memG.addColorStop(0, `rgba(12, 74, 110, ${(0.56 * a).toFixed(3)})`);
      memG.addColorStop(0.45, `rgba(34, 167, 216, ${(0.34 * a).toFixed(3)})`);
      memG.addColorStop(0.85, `rgba(125, 211, 252, ${(0.22 * a).toFixed(3)})`);
      memG.addColorStop(1, `rgba(4, 21, 41, ${(0.40 * a).toFixed(3)})`);
      ctx.fillStyle = memG;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(elbowX, elbowY - 12, tipX, tipY);
      ctx.quadraticCurveTo((tipX + f1X) * 0.5 - side * 12, (tipY + f1Y) * 0.5 + 8, f1X, f1Y);
      ctx.quadraticCurveTo((f1X + f2X) * 0.5 - side * 10, (f1Y + f2Y) * 0.5 - 6, f2X, f2Y);
      ctx.quadraticCurveTo((f2X + f3X) * 0.5 - side * 8,  (f2Y + f3Y) * 0.5 - 10, f3X, f3Y);
      ctx.quadraticCurveTo((f3X + rootX) * 0.5, (f3Y + rootY) * 0.5 - 12, rootX, rootY);
      ctx.closePath();
      ctx.fill();

      // Internal translucent ice-crack fracture veins across the membrane
      ctx.strokeStyle = `rgba(186, 230, 253, ${(0.32 * a).toFixed(3)})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(elbowX, elbowY);
      ctx.lineTo((tipX + f1X) * 0.48, (tipY + f1Y) * 0.52);
      ctx.moveTo(elbowX + side * 18, elbowY + 12);
      ctx.lineTo((f1X + f2X) * 0.52, (f1Y + f2Y) * 0.50);
      ctx.moveTo(ox + side * 24, oy + 14);
      ctx.lineTo((f2X + f3X) * 0.54, (f2Y + f3Y) * 0.48);
      ctx.stroke();

      // Scalloped frosted bottom rim highlight
      ctx.strokeStyle = `rgba(186, 230, 253, ${(0.45 * a).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(tipX, tipY);
      ctx.quadraticCurveTo((tipX + f1X) * 0.5 - side * 12, (tipY + f1Y) * 0.5 + 8, f1X, f1Y);
      ctx.quadraticCurveTo((f1X + f2X) * 0.5 - side * 10, (f1Y + f2Y) * 0.5 - 6, f2X, f2Y);
      ctx.quadraticCurveTo((f2X + f3X) * 0.5 - side * 8,  (f2Y + f3Y) * 0.5 - 10, f3X, f3Y);
      ctx.stroke();

      // 2. Sculpted 3D Glacial Ice Wing-Finger Struts
      const fingers = [[tipX, tipY], [f1X, f1Y], [f2X, f2Y], [f3X, f3Y]];
      for (let i = 0; i < fingers.length; i++) {
        this._drawCrystalShard(ctx, elbowX, elbowY, fingers[i][0], fingers[i][1], i === 0 ? 4.4 : 2.6, a * 0.92);
      }

      // Thick armored upper wing-arm bone (shoulder -> elbow)
      this._drawCrystalShard(ctx, ox, oy, elbowX, elbowY, 7.5, a);

      // Dramatic jagged glacial ice spikes erupting from the wing elbow crest (iconic in Hitsugaya Dragon.jpg!)
      this._drawCrystalShard(ctx, elbowX, elbowY, elbowX + side * 14, elbowY - 34, 4.6, a);
      this._drawCrystalShard(ctx, elbowX - side * 8, elbowY + 6, elbowX - side * 14, elbowY - 22, 3.4, a * 0.9);
      ctx.restore();
    }

    // Draws the sculpted realistic glacial Hyōrinmaru Ice Dragon modeled directly on Hitsugaya Dragon.jpg
    _drawRealisticIceDragon(ctx, w, h, t, emerge, k) {
      const sc = Math.min(w / 360, h / 560);
      const breathe = Math.sin(t * 1.45);
      const a = emerge * 0.92 * k;

      // Key sculptural anchors matching Hitsugaya Dragon.jpg's grand silhouette
      const headX = w * this.o.impact[0] + Math.sin(t * 0.85) * 4;
      const headY = h * this.o.impact[1] + breathe * 4.5 + (1 - emerge) * 32;
      const chestX = headX - 24 * sc;
      const chestY = headY + 135 * sc + breathe * 2;
      const baseX = headX - 6 * sc;
      const baseY = h * 0.94;

      // 1. Sweeping Coiled Glacial Tail arching gracefully across the upper-right behind the wing
      ctx.save();
      const tailSway = Math.sin(t * 1.05 + 1.1) * 10 * sc;
      const tailPts = [];
      for (let i = 0; i <= 18; i++) {
        const u = i / 18;
        const px = lerp(chestX + 18 * sc, w * 0.92, Math.sin(u * Math.PI * 0.72)) + Math.sin(u * 4.2 + t * 0.9) * 14 * sc * u;
        const py = lerp(chestY + 35 * sc, headY - 12 * sc, u) - Math.sin(u * Math.PI) * 52 * sc + tailSway * u;
        tailPts.push({ x: px, y: py, r: (12 * (1 - u * 0.78) + 2) * sc });
      }
      // Shaded coiled tail body
      ctx.beginPath();
      for (let i = 0; i < tailPts.length; i++) {
        const p = tailPts[i];
        const next = tailPts[Math.min(tailPts.length - 1, i + 1)];
        const ang = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2;
        const lx = p.x + Math.cos(ang) * p.r, ly = p.y + Math.sin(ang) * p.r;
        if (i === 0) ctx.moveTo(lx, ly); else ctx.lineTo(lx, ly);
      }
      for (let i = tailPts.length - 1; i >= 0; i--) {
        const p = tailPts[i];
        const next = tailPts[Math.min(tailPts.length - 1, i + 1)];
        const ang = Math.atan2(next.y - p.y, next.x - p.x) + Math.PI / 2;
        ctx.lineTo(p.x - Math.cos(ang) * p.r, p.y - Math.sin(ang) * p.r);
      }
      ctx.closePath();
      const tailG = ctx.createLinearGradient(chestX, chestY, w * 0.85, headY);
      tailG.addColorStop(0, `rgba(4, 21, 41, ${(0.78 * a).toFixed(3)})`);
      tailG.addColorStop(0.55, `rgba(14, 116, 164, ${(0.62 * a).toFixed(3)})`);
      tailG.addColorStop(1, `rgba(186, 230, 253, ${(0.72 * a).toFixed(3)})`);
      ctx.fillStyle = tailG;
      ctx.strokeStyle = `rgba(125, 211, 252, ${(0.45 * a).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.fill();
      ctx.stroke();

      // Razor glacial blade-fin at the tail tip
      const tEnd = tailPts[tailPts.length - 1];
      const tPrev = tailPts[tailPts.length - 3];
      const tAng = Math.atan2(tEnd.y - tPrev.y, tEnd.x - tPrev.x);
      this._drawCrystalShard(ctx, tEnd.x, tEnd.y, tEnd.x + Math.cos(tAng) * 28 * sc, tEnd.y + Math.sin(tAng) * 28 * sc, 6.5 * sc, a * 0.9);
      ctx.restore();

      // 2. Massive Articulated Left & Right Glacial Wings unfurling from behind the muscular chest
      const wingUnfold = easeOutCubic(clamp((t - 0.12) / 1.05, 0, 1));
      if (wingUnfold > 0.02) {
        this._drawRealisticWing(ctx, chestX - 10 * sc, chestY - 12 * sc, -1, wingUnfold, 1, t, a * 0.92);
        this._drawRealisticWing(ctx, chestX + 26 * sc, chestY - 8 * sc,  1, wingUnfold, 1, t, a * 0.95);
      }

      // 3. Towering Muscular S-Curved Glacial Dragon Neck & Chest (3D cross-shaded with ventral belly scales!)
      const neckPts = [];
      const steps = 22;
      for (let i = 0; i <= steps; i++) {
        const u = i / steps; // 0 = base near bottom, 1 = crown behind head
        const omt = 1 - u;
        // Grand sculptural S-curve from bottom-left sweeping back then curving gracefully into the downward-gazing head
        const p0 = { x: baseX, y: baseY };
        const p1 = { x: chestX - 38 * sc, y: chestY + 26 * sc };
        const p2 = { x: headX - 58 * sc, y: headY - 46 * sc };
        const p3 = { x: headX - 6 * sc, y: headY - 10 * sc };
        const nx = omt*omt*omt*p0.x + 3*omt*omt*u*p1.x + 3*omt*u*u*p2.x + u*u*u*p3.x;
        const ny = omt*omt*omt*p0.y + 3*omt*omt*u*p1.y + 3*omt*u*u*p2.y + u*u*u*p3.y;
        const dx = 3*omt*omt*(p1.x - p0.x) + 6*omt*u*(p2.x - p1.x) + 3*u*u*(p3.x - p2.x);
        const dy = 3*omt*omt*(p1.y - p0.y) + 6*omt*u*(p2.y - p1.y) + 3*u*u*(p3.y - p2.y);
        const ang = Math.atan2(dy, dx);
        const rad = (29 * (1 - u * 0.42) + Math.sin(u * Math.PI) * 8) * sc;
        neckPts.push({ x: nx, y: ny, ang, rad });
      }

      ctx.save();
      // Neck & torso silhouette polygon
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const p = neckPts[i];
        const px = p.x + Math.cos(p.ang + Math.PI / 2) * p.rad;
        const py = p.y + Math.sin(p.ang + Math.PI / 2) * p.rad;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      for (let i = steps; i >= 0; i--) {
        const p = neckPts[i];
        ctx.lineTo(p.x - Math.cos(p.ang + Math.PI / 2) * p.rad, p.y - Math.sin(p.ang + Math.PI / 2) * p.rad);
      }
      ctx.closePath();

      // Rich glacial sapphire -> translucent aqua -> luminous frosted white cross-gradient
      const neckG = ctx.createLinearGradient(chestX - 50 * sc, chestY, chestX + 46 * sc, headY);
      neckG.addColorStop(0, `rgba(4, 21, 41, ${(0.92 * a).toFixed(3)})`);
      neckG.addColorStop(0.38, `rgba(12, 74, 110, ${(0.88 * a).toFixed(3)})`);
      neckG.addColorStop(0.72, `rgba(34, 167, 216, ${(0.84 * a).toFixed(3)})`);
      neckG.addColorStop(1, `rgba(224, 242, 254, ${(0.92 * a).toFixed(3)})`);
      ctx.fillStyle = neckG;
      ctx.strokeStyle = `rgba(186, 230, 253, ${(0.55 * a).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.fill();
      ctx.stroke();

      // Overlapping translucent glacial ventral belly-plates & swept-back dorsal icicle ridges
      for (let i = 2; i < steps - 1; i++) {
        const p = neckPts[i];
        const ca = Math.cos(p.ang), sa = Math.sin(p.ang);
        const nx = -sa, ny = ca; // Left/dorsal normal

        // Luminous ventral ice belly-plate curve across the front of the neck/chest
        ctx.strokeStyle = `rgba(186, 230, 253, ${(0.42 * a).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(p.x - nx * p.rad * 0.85, p.y - ny * p.rad * 0.85);
        ctx.quadraticCurveTo(p.x + ca * 5 * sc, p.y + sa * 5 * sc, p.x + nx * p.rad * 0.25, p.y + ny * p.rad * 0.25);
        ctx.stroke();

        // Swept-back faceted dorsal icicle crest along the outer spine
        if (i % 2 === 0 && i < steps - 2) {
          const sx0 = p.x + nx * p.rad * 0.72;
          const sy0 = p.y + ny * p.rad * 0.72;
          const sLen = (16 + Math.sin((i / steps) * Math.PI) * 12) * sc;
          const tipX = sx0 + (nx * 0.82 - ca * 0.55) * sLen;
          const tipY = sy0 + (ny * 0.82 - sa * 0.55) * sLen;
          this._drawCrystalShard(ctx, sx0, sy0, tipX, tipY, 3.8 * sc, a * 0.92);
        }
      }

      // Jagged crystalline ice shoulder-spikes erupting around the chest/wing roots (seen in Hitsugaya Dragon.jpg!)
      this._drawCrystalShard(ctx, chestX - 18 * sc, chestY + 22 * sc, chestX - 58 * sc, chestY - 26 * sc, 7.5 * sc, a);
      this._drawCrystalShard(ctx, chestX - 8 * sc,  chestY + 28 * sc, chestX - 36 * sc, chestY - 38 * sc, 6.0 * sc, a);
      this._drawCrystalShard(ctx, chestX + 20 * sc, chestY + 26 * sc, chestX + 54 * sc, chestY - 18 * sc, 6.8 * sc, a);
      ctx.restore();

      // 4. Fierce, Hyper-Detailed 3/4 Faceted Crystal Dragon Head (modeled on Hitsugaya Dragon.jpg!)
      ctx.save();
      ctx.translate(headX, headY);
      ctx.rotate(0.18 + Math.sin(t * 1.1) * 0.03);
      ctx.scale(sc, sc);

      // Sweeping multi-spire jagged ice crown / crystal antlers exploding upward & back
      const crownShards = [
        [-14, -18, -32, -74, 6.2],
        [-4,  -22, -6,  -84, 6.8],
        [6,   -20, 22,  -78, 6.4],
        [14,  -14, 44,  -62, 5.5],
        [-20, -10, -52, -46, 5.2],
        [18,  -4,  48,  -28, 4.6],
        [-18,  2,  -46, -18, 4.2]
      ];
      for (let i = 0; i < crownShards.length; i++) {
        const [x0, y0, xt, yt, bw] = crownShards[i];
        this._drawCrystalShard(ctx, x0, y0, xt, yt, bw, a);
      }

      // Chiseled crystalline dragon skull & snout tapering sharply downward
      const skullG = ctx.createLinearGradient(-22, -26, 22, 46);
      skullG.addColorStop(0, `rgba(224, 242, 254, ${(0.95 * a).toFixed(3)})`);
      skullG.addColorStop(0.45, `rgba(56, 189, 248, ${(0.90 * a).toFixed(3)})`);
      skullG.addColorStop(1, `rgba(8, 47, 73, ${(0.94 * a).toFixed(3)})`);
      ctx.fillStyle = skullG;
      ctx.strokeStyle = `rgba(240, 251, 255, ${(0.85 * a).toFixed(3)})`;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.moveTo(0, -28);
      ctx.lineTo(24, -14);
      ctx.lineTo(20, 12);
      ctx.lineTo(10, 40);
      ctx.lineTo(0, 48);
      ctx.lineTo(-10, 40);
      ctx.lineTo(-20, 12);
      ctx.lineTo(-24, -14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Faceted nasal ridge & crystalline cheekbones
      ctx.strokeStyle = `rgba(240, 251, 255, ${(0.82 * a).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(0, -24); ctx.lineTo(0, 44);
      ctx.moveTo(-20, -10); ctx.lineTo(-8, 12); ctx.lineTo(0, 44);
      ctx.moveTo(20, -10);  ctx.lineTo(8, 12);  ctx.lineTo(0, 44);
      ctx.stroke();

      // Snarling razor icicle fangs gleaming at the jaw tip
      ctx.fillStyle = `rgba(255, 255, 255, ${(0.94 * a).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(-8, 36); ctx.lineTo(-5, 49); ctx.lineTo(-2, 39);
      ctx.moveTo(8, 36);  ctx.lineTo(5, 49);  ctx.lineTo(2, 39);
      ctx.fill();

      // Piercing, Blazing Icy-White Dragon Eyes with intense glacial bloom (signature look from Hitsugaya Dragon.jpg!)
      const eyeIgnite = easeOutCubic(clamp((t - 0.42) / 0.45, 0, 1));
      if (eyeIgnite > 0.01) {
        const eyeFlare = t > 0.45 ? Math.exp(-(t - 0.45) * 2.5) * 0.45 : 0;
        const ep = 0.85 + 0.15 * Math.sin(t * 3.0) + eyeFlare;

        for (let s = -1; s <= 1; s += 2) {
          const ex = s * 10.5, ey = 5;
          const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 22 * ep);
          eg.addColorStop(0, `rgba(255, 255, 255, ${(0.98 * eyeIgnite * a).toFixed(3)})`);
          eg.addColorStop(0.35, `rgba(186, 230, 253, ${(0.62 * eyeIgnite * a).toFixed(3)})`);
          eg.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(ex, ey, 22 * ep, 0, TAU);
          ctx.fill();

          // Sharp menacing slanted dragon eye slit
          ctx.fillStyle = `rgba(255, 255, 255, ${(0.98 * eyeIgnite * a).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(ex - s * 7.5, ey - 3.5);
          ctx.lineTo(ex + s * 6.5, ey + 2.5);
          ctx.lineTo(ex - s * 1.5, ey + 5.0);
          ctx.closePath();
          ctx.fill();

          // Cold light wisp streaming off the fierce glowing eyes
          ctx.strokeStyle = `rgba(224, 242, 254, ${(0.56 * eyeIgnite * a).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(ex + s * 4, ey);
          ctx.quadraticCurveTo(ex + s * 22, ey - 8 + Math.sin(t * 4.5 + s) * 3, ex + s * 36, ey - 16);
          ctx.stroke();
        }
      }

      ctx.restore();
      return { snoutX: headX - 4 * sc, snoutY: headY + 46 * sc };
    }

    _drawCrimsonLotuses(ctx, t, w, h, vis, k) {
      const lotuses = [
        { x: w * 0.79, y: h * 0.14, r: 11.5, speed: 0.72 },
        { x: w * 0.88, y: h * 0.25, r: 9.5,  speed: -0.58 },
        { x: w * 0.74, y: h * 0.31, r: 8.0,  speed: 0.85 }
      ];
      ctx.save();
      for (let i = 0; i < lotuses.length; i++) {
        const l = lotuses[i];
        const rad = l.r * (1 + Math.sin(t * 2.4 + i) * 0.08);
        ctx.save();
        ctx.translate(l.x, l.y);
        ctx.rotate(t * l.speed + i * 1.2);
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, rad);
        grad.addColorStop(0, `rgba(244, 63, 94, ${(0.88 * vis * k).toFixed(3)})`);
        grad.addColorStop(0.5, `rgba(225, 29, 72, ${(0.76 * vis * k).toFixed(3)})`);
        grad.addColorStop(0.88, `rgba(56, 189, 248, ${(0.82 * vis * k).toFixed(3)})`);
        grad.addColorStop(1, `rgba(2, 132, 199, ${(0.78 * vis * k).toFixed(3)})`);
        ctx.fillStyle = grad;
        ctx.strokeStyle = `rgba(254, 205, 211, ${(0.78 * vis * k).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, -rad);
        ctx.quadraticCurveTo(rad * 0.3, -rad * 0.3, rad, 0);
        ctx.quadraticCurveTo(rad * 0.3, rad * 0.3, 0, rad);
        ctx.quadraticCurveTo(-rad * 0.3, rad * 0.3, -rad, 0);
        ctx.quadraticCurveTo(-rad * 0.3, -rad * 0.3, 0, -rad);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = `rgba(255, 255, 255, ${(0.92 * vis * k).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(0, 0, 1.7, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    _drawIceSpires(ctx, w, h, vis, k) {
      const a = vis * k;
      // Glacial floor mist
      const mg = ctx.createRadialGradient(w * 0.5, h, 16, w * 0.5, h, w * 0.62);
      mg.addColorStop(0, `rgba(56, 189, 248, ${(0.24 * a).toFixed(3)})`);
      mg.addColorStop(0.6, `rgba(14, 116, 144, ${(0.12 * a).toFixed(3)})`);
      mg.addColorStop(1, 'rgba(14, 116, 144, 0)');
      ctx.fillStyle = mg;
      ctx.fillRect(0, h * 0.80, w, h * 0.20);

      // Left & right staggered 3D faceted crystal spire clusters
      const spires = [
        [w * 0.04, h, w * 0.05, h - 76 * vis, 12],
        [w * 0.12, h, w * 0.11, h - 54 * vis, 10],
        [w * 0.20, h, w * 0.22, h - 42 * vis, 9],
        [w * 0.96, h, w * 0.95, h - 78 * vis, 12],
        [w * 0.88, h, w * 0.89, h - 56 * vis, 10],
        [w * 0.80, h, w * 0.78, h - 42 * vis, 9]
      ];
      for (let i = 0; i < spires.length; i++) {
        const [x0, y0, xt, yt, bw] = spires[i];
        this._drawCrystalShard(ctx, x0, y0, xt, yt, bw, a * 0.88);
      }
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);

      ctx.clearRect(0, 0, w, h);

      const emerge = easeOutCubic(clamp(t / 1.15, 0, 1));

      // 1. Sculpted Realistic Glacial Hyōrinmaru Ice Dragon
      const snout = this._drawRealisticIceDragon(ctx, w, h, t, emerge, k);

      // 2. Billowing sub-zero frost-breath plumes streaming downward from the dragon's jaws
      if (t > 0.55) {
        for (let i = 0; i < this.breath.length; i++) {
          const br = this.breath[i];
          const u = ((t - 0.55) * 0.36 + br.phase) % 1;
          const bx = snout.snoutX + br.dx * easeOutCubic(u);
          const by = snout.snoutY + br.dy * u;
          const rad = 22 + u * 64;
          const alpha = Math.sin(u * Math.PI) * 0.44 * k;
          const spr = this.mistSprites[br.spriteIdx];
          if (spr && typeof ctx.drawImage === 'function') {
            ctx.save();
            ctx.globalAlpha = clamp(alpha, 0, 0.85);
            ctx.drawImage(spr, bx - rad, by - rad * 0.72, rad * 2, rad * 1.44);
            ctx.restore();
          } else {
            const bg = ctx.createRadialGradient(bx, by, 2, bx, by, rad);
            bg.addColorStop(0, `rgba(186, 230, 253, ${(alpha * 0.45).toFixed(3)})`);
            bg.addColorStop(1, 'rgba(56, 189, 248, 0)');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(bx, by, rad, 0, TAU);
            ctx.fill();
          }
        }
      }

      // 3. Floating Zekku Crimson Lotus ice flowers
      const detailVis = easeOutCubic(clamp((t - 0.4) / 0.9, 0, 1));
      if (detailVis > 0.01) {
        this._drawCrimsonLotuses(ctx, t, w, h, detailVis, k);
        this._drawIceSpires(ctx, w, h, detailVis, k);
      }

      // 4. Diamond blizzard snowflakes & glinting ice shards
      const snowVis = clamp((t - 0.2) / 0.85, 0, 1);
      if (snowVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.snow.length; i++) {
          const p = this.snow[i];
          p.swayP += p.swayS * dt;
          p.rot += p.rotS * dt;
          p.y += p.vy * dt;
          p.x += (p.vx + Math.sin(p.swayP) * 14) * dt;
          if (p.y > h + 12) { p.y = -12; p.x = (p.x + w * 0.37) % w; }
          if (p.x < -12) p.x = w + 12;
          if (p.x > w + 12) p.x = -12;

          const a = p.alpha * snowVis * k;
          ctx.fillStyle = `rgba(240, 249, 255, ${a.toFixed(3)})`;
          if (p.isShard) {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.beginPath();
            ctx.moveTo(0, -p.size * 1.6);
            ctx.lineTo(p.size * 0.75, 0);
            ctx.lineTo(0, p.size * 1.6);
            ctx.lineTo(-p.size * 0.75, 0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, TAU);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    _tick(now) {
      if (!this.isOpen) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - this.lastTime) / 1000));
      this.lastTime = now;
      this.simTime += dt;
      this._render(this.simTime, dt);
      this.rafId = requestAnimationFrame(this._tick);
    }

    open() {
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.isOpen = true;
      this.el.classList.remove('hg-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('hg-open');
      if (this.rm) {
        this._render(2.5, 0);
      } else {
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(this._tick);
      }
    }

    close() {
      this.isOpen = false;
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.el.classList.remove('hg-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('hitsugaya-panel');
      inst.delete(this.el);
    }
  }

  g.HitsugayaPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new HitsugayaEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
