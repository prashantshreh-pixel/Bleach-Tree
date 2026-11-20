/**
 * komamura-panel.js - Sajin Komamura (Kokujō Tengen Myō'ō — Colossal Bankai Sword)
 * Entrance (0-3s):
 *   0.0-0.6s:  Kokujō Tengen Myō'ō's colossal armored samurai greatsword crashes straight down into the floor
 *   0.6-1.85s: Booming seismic shockwaves & molten bronze-gold ground fissures shatter outward from the embedded blade
 *   1.85-3.0s: Settles with the towering greatsword standing heroically in cracked earth, sweeping metallic edge glint
 *              and rising Dangai Jōe crimson-gold spirit embers & levitating rubble
 * Idle loop: Colossal embedded Bankai greatsword with periodic steel sheen, pulsing fissures, hovering stones & embers
 *
 * API: const km = KomamuraPanel.attach(sidebar, options);
 *      km.open(); km.close(); km.replay(); km.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 50,           // Line 17: Dangai Jōe bronze/crimson embers & levitating stones
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 707,               // Line 19: deterministic PRNG seed
    impact: [0.54, 0.82],    // Line 20: normalized [x, y] greatsword floor-embed point
    anchor: '#sidebar-content'
  };

  const inst = new WeakMap();
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const easeInQuart = t => Math.pow(clamp(t, 0, 1), 4);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class KomamuraEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.cracks = []; this.stones = []; this.embers = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'km-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('komamura-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('km-wash');
      this.wash.style.setProperty('--km-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--km-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'km-layer km-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('km-flash');
      this.flash.style.setProperty('--km-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--km-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('km-ring');

      this.layers = [this.wash, this.canvas, this.flash, this.ring];
      this.layers.forEach(n => el.insertBefore(n, ref));

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
      const ix = w * this.o.impact[0], iy = h * this.o.impact[1];
      const count = Math.max(14, Math.round(this.o.particles));
      const stoneCount = Math.max(7, Math.round(count * 0.28));
      const emberCount = Math.max(7, count - stoneCount);
      this.simTime = 0;

      // Branching molten seismic fissures exploding from where the colossal sword embeds
      this.cracks = [];
      for (let i = 0; i < 9; i++) {
        const baseAng = (i / 9) * TAU + (r() - 0.5) * 0.3;
        const pts = [{ x: ix, y: iy }];
        let cx = ix, cy = iy, ang = baseAng;
        for (let s = 1; s <= 5; s++) {
          const step = 22 + r() * 34;
          ang += (r() - 0.5) * 0.52;
          cx += Math.cos(ang) * step;
          cy += Math.sin(ang) * step * 0.55;
          pts.push({ x: cx, y: cy });
        }
        this.cracks.push({ pts, delay: 0.28 + r() * 0.22, width: 1.3 + r() * 1.4 });
      }

      // Levitating angular rock rubble fragments
      this.stones = [];
      for (let i = 0; i < stoneCount; i++) {
        this.stones.push({
          x: w * (0.06 + r() * 0.88),
          baseY: h * (0.64 + r() * 0.32),
          size: 3.4 + r() * 5.6,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 0.85,
          bobAmp: 6 + r() * 11,
          bobSpeed: 0.75 + r() * 0.9,
          phase: r() * TAU,
          alpha: 0.36 + r() * 0.34
        });
      }

      // Rising Dangai Jōe bronze-gold & crimson heart-embers
      this.embers = [];
      for (let i = 0; i < emberCount; i++) {
        this.embers.push({
          x: r() * w,
          y: h * (0.16 + r() * 0.86),
          vy: -(20 + r() * 40),
          size: 1.2 + r() * 2.5,
          swayP: r() * TAU,
          swayS: 1.0 + r() * 1.5,
          crimson: r() > 0.60,
          alpha: 0.34 + r() * 0.58
        });
      }
    }

    // Draws Kokujō Tengen Myō'ō's colossal armored samurai greatsword embedded powerfully in the panel
    _drawColossalSword(ctx, w, h, t, k) {
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];
      const scale = Math.min(w / 360, h / 560);
      // Heavy slamming plunge (0.0 -> 0.28s) followed by damped impact recoil shudder
      const slamProg = clamp(t / 0.28, 0, 1);
      const plungeY = (1 - easeInQuart(slamProg)) * -h * 0.95;
      const shudder = t > 0.28 && t < 0.72 ? Math.sin((t - 0.28) * 58) * Math.exp(-(t - 0.28) * 9) * 5.5 : 0;
      const tilt = 0.095 + Math.sin(t * 0.6) * 0.005;
      const swordVis = clamp(t / 0.14, 0, 1);

      ctx.save();
      ctx.translate(ix + shudder * 0.5, iy + plungeY);
      ctx.rotate(tilt);
      ctx.scale(scale, scale);

      const bladeTop = -355;
      const bladeBot = 36;
      const halfW = 31; // Massive titanic broad blade!

      // 1. Towering Dangai Jōe bronze-crimson spiritual aura blazing behind the giant blade
      const auraPulse = 0.78 + 0.22 * Math.sin(t * 2.3);
      const auraG = ctx.createLinearGradient(0, bladeTop - 60, 0, bladeBot + 20);
      auraG.addColorStop(0, 'rgba(251, 191, 36, 0)');
      auraG.addColorStop(0.35, `rgba(217, 119, 6, ${(0.24 * auraPulse * swordVis * k).toFixed(3)})`);
      auraG.addColorStop(0.75, `rgba(220, 38, 38, ${(0.20 * auraPulse * swordVis * k).toFixed(3)})`);
      auraG.addColorStop(1, 'rgba(180, 83, 9, 0)');
      ctx.fillStyle = auraG;
      ctx.beginPath();
      ctx.moveTo(-halfW * 2.1, bladeBot + 10);
      ctx.quadraticCurveTo(-halfW * 1.9, (bladeTop + bladeBot) * 0.5, 0, bladeTop - 95);
      ctx.quadraticCurveTo(halfW * 1.9, (bladeTop + bladeBot) * 0.5, halfW * 2.1, bladeBot + 10);
      ctx.closePath();
      ctx.fill();

      // 2. Massive Broad Greatsword Steel Blade (beveled dark iron spine + bright forged cutting edge)
      // Left dark forged spine facet (mune)
      const leftSteel = ctx.createLinearGradient(-halfW, 0, 4, 0);
      leftSteel.addColorStop(0, `rgba(24, 20, 18, ${(0.92 * swordVis * k).toFixed(3)})`);
      leftSteel.addColorStop(0.7, `rgba(68, 60, 56, ${(0.88 * swordVis * k).toFixed(3)})`);
      leftSteel.addColorStop(1, `rgba(120, 108, 96, ${(0.85 * swordVis * k).toFixed(3)})`);
      ctx.fillStyle = leftSteel;
      ctx.beginPath();
      ctx.moveTo(-halfW, bladeTop);
      ctx.lineTo(4, bladeTop);
      ctx.lineTo(4, bladeBot);
      ctx.lineTo(-halfW * 0.84, bladeBot);
      ctx.closePath();
      ctx.fill();

      // Right razor-honed cutting edge facet (ha)
      const rightSteel = ctx.createLinearGradient(4, 0, halfW, 0);
      rightSteel.addColorStop(0, `rgba(168, 162, 158, ${(0.84 * swordVis * k).toFixed(3)})`);
      rightSteel.addColorStop(0.62, `rgba(245, 240, 228, ${(0.88 * swordVis * k).toFixed(3)})`);
      rightSteel.addColorStop(1, `rgba(254, 243, 199, ${(0.95 * swordVis * k).toFixed(3)})`);
      ctx.fillStyle = rightSteel;
      ctx.beginPath();
      ctx.moveTo(4, bladeTop);
      ctx.lineTo(halfW, bladeTop);
      ctx.lineTo(halfW * 0.88, bladeBot);
      ctx.lineTo(4, bladeBot);
      ctx.closePath();
      ctx.fill();

      // Wavy golden-bronze hamon temper-line running down the blade's edge
      ctx.strokeStyle = `rgba(251, 191, 36, ${(0.72 * auraPulse * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      for (let y = bladeTop + 6; y <= bladeBot - 4; y += 10) {
        const hx = 14 + Math.sin(y * 0.14) * 3.8 + Math.cos(y * 0.06) * 2.2;
        if (y === bladeTop + 6) ctx.moveTo(hx, y); else ctx.lineTo(hx, y);
      }
      ctx.stroke();

      // Deep central fuller groove + razor outer blade outline
      ctx.strokeStyle = `rgba(28, 18, 12, ${(0.82 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 3.2;
      ctx.beginPath();
      ctx.moveTo(-10, bladeTop + 16);
      ctx.lineTo(-9, bladeBot - 8);
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 243, 199, ${(0.80 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-halfW, bladeTop);
      ctx.lineTo(-halfW * 0.84, bladeBot);
      ctx.moveTo(halfW, bladeTop);
      ctx.lineTo(halfW * 0.88, bladeBot);
      ctx.stroke();

      // Periodic traveling specular glint gliding down the massive steel face
      const sweepPhase = (t * 0.34) % 1;
      if (sweepPhase < 0.38) {
        const sy = bladeTop + (sweepPhase / 0.38) * (bladeBot - bladeTop);
        const sg = ctx.createLinearGradient(0, sy - 38, 0, sy + 38);
        sg.addColorStop(0, 'rgba(255, 255, 255, 0)');
        sg.addColorStop(0.5, `rgba(255, 250, 235, ${(0.52 * swordVis * k).toFixed(3)})`);
        sg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sg;
        ctx.fillRect(-halfW + 2, sy - 38, halfW * 2 - 4, 76);
      }

      // 3. Colossal Bronze Habaki Collar + Ornate Heavy Samurai Tsuba Guard (near top of blade)
      ctx.fillStyle = `rgba(217, 119, 6, ${(0.90 * swordVis * k).toFixed(3)})`;
      ctx.strokeStyle = `rgba(254, 243, 199, ${(0.72 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.fillRect(-halfW - 4, bladeTop - 16, (halfW + 4) * 2, 18);
      ctx.strokeRect(-halfW - 4, bladeTop - 16, (halfW + 4) * 2, 18);

      // Heavy flanged samurai tsuba
      const tsubaG = ctx.createLinearGradient(-64, bladeTop - 28, 64, bladeTop - 14);
      tsubaG.addColorStop(0, `rgba(120, 53, 15, ${(0.95 * swordVis * k).toFixed(3)})`);
      tsubaG.addColorStop(0.5, `rgba(251, 191, 36, ${(0.92 * swordVis * k).toFixed(3)})`);
      tsubaG.addColorStop(1, `rgba(120, 53, 15, ${(0.95 * swordVis * k).toFixed(3)})`);
      ctx.fillStyle = tsubaG;
      ctx.strokeStyle = `rgba(254, 243, 199, ${(0.75 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-64, bladeTop - 22);
      ctx.lineTo(-56, bladeTop - 32);
      ctx.lineTo(56, bladeTop - 32);
      ctx.lineTo(64, bladeTop - 22);
      ctx.lineTo(56, bladeTop - 14);
      ctx.lineTo(-56, bladeTop - 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Colossal crimson-and-gold diamond-wrapped samurai hilt (tsuka) extending upward
      const hiltTop = bladeTop - 135;
      ctx.fillStyle = `rgba(32, 10, 10, ${(0.92 * swordVis * k).toFixed(3)})`;
      ctx.strokeStyle = `rgba(217, 119, 6, ${(0.75 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-20, hiltTop, 40, 104);
      ctx.strokeRect(-20, hiltTop, 40, 104);

      // Crimson-gold braided diamond wrap along hilt
      ctx.strokeStyle = `rgba(220, 38, 38, ${(0.82 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 2.6;
      for (let hy = hiltTop + 8; hy < bladeTop - 38; hy += 18) {
        ctx.beginPath();
        ctx.moveTo(-18, hy); ctx.lineTo(0, hy + 9); ctx.lineTo(18, hy);
        ctx.moveTo(-18, hy + 18); ctx.lineTo(0, hy + 9); ctx.lineTo(18, hy + 18);
        ctx.stroke();
      }

      // Swaying crimson-gold samurai tassel cord hanging off the tsuba
      const tasselSway = Math.sin(t * 2.1) * 9;
      ctx.strokeStyle = `rgba(220, 38, 38, ${(0.76 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(52, bladeTop - 16);
      ctx.quadraticCurveTo(64 + tasselSway * 0.5, bladeTop + 26, 56 + tasselSway, bladeTop + 74);
      ctx.stroke();
      ctx.strokeStyle = `rgba(251, 191, 36, ${(0.72 * swordVis * k).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.restore();
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];

      ctx.clearRect(0, 0, w, h);

      // 1. Branching molten bronze-gold seismic earth fissures beneath the embedded greatsword
      const fissurePulse = 0.62 + 0.38 * Math.sin(t * 2.2);
      ctx.save();
      for (let i = 0; i < this.cracks.length; i++) {
        const cr = this.cracks[i];
        const ct = clamp((t - cr.delay) / 0.58, 0, 1);
        if (ct <= 0) continue;
        const maxSeg = ct * (cr.pts.length - 1);
        const fullSegs = Math.floor(maxSeg);
        const frac = maxSeg - fullSegs;

        ctx.beginPath();
        ctx.moveTo(cr.pts[0].x, cr.pts[0].y);
        for (let s = 1; s <= fullSegs; s++) ctx.lineTo(cr.pts[s].x, cr.pts[s].y);
        if (fullSegs < cr.pts.length - 1) {
          const pA = cr.pts[fullSegs], pB = cr.pts[fullSegs + 1];
          ctx.lineTo(pA.x + (pB.x - pA.x) * frac, pA.y + (pB.y - pA.y) * frac);
        }

        ctx.strokeStyle = `rgba(217, 119, 6, ${(0.38 * fissurePulse * k).toFixed(3)})`;
        ctx.lineWidth = cr.width * 3.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.strokeStyle = `rgba(254, 243, 199, ${(0.56 * fissurePulse * k).toFixed(3)})`;
        ctx.lineWidth = cr.width * 0.85;
        ctx.stroke();
      }
      ctx.restore();

      // 2. Colossal Kokujō Tengen Myō'ō Bankai Greatsword slamming & standing in the panel
      this._drawColossalSword(ctx, w, h, t, k);

      // 3. Booming seismic shockwave rings radiating from the sword embed point (0.28 - 1.75s)
      if (t > 0.26 && t < 1.90) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const rt = clamp((t - 0.28 - i * 0.14) / 1.05, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 18 + easeOutCubic(rt) * Math.max(w, h) * (0.50 + i * 0.16);
          const a = (1 - rt) * (0.56 - i * 0.12) * k;
          ctx.strokeStyle = i === 1
            ? `rgba(220, 38, 38, ${a.toFixed(3)})`
            : `rgba(251, 191, 36, ${a.toFixed(3)})`;
          ctx.lineWidth = (3.0 - i * 0.6) * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.ellipse(ix, iy, rad, rad * 0.36, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Levitating cracked stone debris & rising Dangai Jōe bronze/crimson embers
      const debrisRise = easeOutCubic(clamp((t - 0.30) / 1.15, 0, 1));
      if (debrisRise > 0.01) {
        ctx.save();
        for (let i = 0; i < this.stones.length; i++) {
          const st = this.stones[i];
          st.rot += st.rotS * dt;
          const lift = debrisRise * 28 + Math.sin(t * st.bobSpeed + st.phase) * st.bobAmp;
          ctx.save();
          ctx.translate(st.x, st.baseY - lift);
          ctx.rotate(st.rot);
          ctx.fillStyle = `rgba(48, 30, 16, ${(st.alpha * debrisRise * k).toFixed(3)})`;
          ctx.strokeStyle = `rgba(245, 158, 11, ${(st.alpha * 0.85 * debrisRise * k).toFixed(3)})`;
          ctx.lineWidth = 0.95;
          ctx.beginPath();
          ctx.moveTo(-st.size, -st.size * 0.35);
          ctx.lineTo(0, -st.size);
          ctx.lineTo(st.size * 0.9, -st.size * 0.15);
          ctx.lineTo(st.size * 0.45, st.size * 0.85);
          ctx.lineTo(-st.size * 0.7, st.size * 0.62);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }

        for (let i = 0; i < this.embers.length; i++) {
          const e = this.embers[i];
          e.swayP += e.swayS * dt;
          e.y += e.vy * dt;
          e.x += Math.sin(e.swayP) * 11 * dt;
          if (e.y < -12) { e.y = h + 12; e.x = (e.x + w * 0.37) % w; }
          const a = e.alpha * debrisRise * k;
          ctx.fillStyle = e.crimson
            ? `rgba(239, 68, 68, ${(a * 0.88).toFixed(3)})`
            : `rgba(251, 191, 36, ${(a * 0.92).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.size, 0, TAU);
          ctx.fill();
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
      this.el.classList.remove('km-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('km-open');
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
      this.el.classList.remove('km-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('komamura-panel');
      inst.delete(this.el);
    }
  }

  g.KomamuraPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new KomamuraEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
