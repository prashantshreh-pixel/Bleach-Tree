/**
 * komamura-panel.js - Sajin Komamura (Kokujō Tengen Myō'ō: Dangai Jōe)
 * Entrance (0-3s):
 *   0.0-0.65s: Heavy downward Tengen blade-cleave impacts lower panel with golden shockwave rings
 *   0.65-1.85s: Molten bronze-gold seismic earth fissures branch out as angular rock debris levitates
 *   1.85-3.0s: Settles into pulsing molten fissures, samurai shoulder-rope knot motif, and rising embers
 * Idle loop: Slowly rising Dangai Jōe bronze-crimson embers, floating seismic stones, pulsing earth veins
 *
 * API: const km = KomamuraPanel.attach(sidebar, options);
 *      km.open(); km.close(); km.replay(); km.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 46,           // Line 17: bronze embers & hovering seismic debris
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 707,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.72],     // Line 20: normalized [x, y] Tengen seismic impact point
    anchor: '#sidebar-content'
  };

  const inst = new WeakMap();
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

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
      this.rafId = null; this.timers = [];
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
      const count = Math.max(12, Math.round(this.o.particles));
      const stoneCount = Math.max(6, Math.round(count * 0.28));
      const emberCount = Math.max(6, count - stoneCount);
      this.simTime = 0;

      // Branching molten seismic earth fissures radiating from Tengen's slam
      this.cracks = [];
      const rays = 8;
      for (let i = 0; i < rays; i++) {
        const baseAng = (i / rays) * TAU + (r() - 0.5) * 0.35;
        const segs = 5;
        const pts = [{ x: ix, y: iy }];
        let cx = ix, cy = iy, ang = baseAng;
        for (let s = 1; s <= segs; s++) {
          const step = 24 + r() * 34;
          ang += (r() - 0.5) * 0.55;
          cx += Math.cos(ang) * step;
          cy += Math.sin(ang) * step * 0.72;
          pts.push({ x: cx, y: cy });
        }
        this.cracks.push({ pts, delay: 0.28 + r() * 0.25, width: 1.2 + r() * 1.3 });
      }

      // Gravity-lifted angular stone debris fragments
      this.stones = [];
      for (let i = 0; i < stoneCount; i++) {
        this.stones.push({
          x: w * (0.08 + r() * 0.84),
          baseY: h * (0.58 + r() * 0.36),
          size: 3.5 + r() * 5.2,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 0.8,
          bobAmp: 6 + r() * 10,
          bobSpeed: 0.7 + r() * 0.9,
          phase: r() * TAU,
          alpha: 0.32 + r() * 0.35
        });
      }

      // Rising Dangai Jōe bronze-gold and crimson heart-embers
      this.embers = [];
      for (let i = 0; i < emberCount; i++) {
        this.embers.push({
          x: r() * w,
          y: h * (0.2 + r() * 0.85),
          vy: -(18 + r() * 34),
          size: 1.2 + r() * 2.4,
          swayP: r() * TAU,
          swayS: 0.9 + r() * 1.4,
          crimson: r() > 0.62,
          alpha: 0.35 + r() * 0.55
        });
      }
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];

      ctx.clearRect(0, 0, w, h);

      // 1. Heavy downward vertical blade slam (0.0 - 0.55s)
      if (t < 0.65) {
        const drop = easeOutCubic(clamp(t / 0.28, 0, 1));
        const fade = 1 - clamp((t - 0.26) / 0.38, 0, 1);
        const yTip = iy * drop;
        ctx.save();
        const bg = ctx.createLinearGradient(ix, 0, ix, yTip);
        bg.addColorStop(0, 'rgba(217, 119, 6, 0)');
        bg.addColorStop(0.75, `rgba(251, 191, 36, ${(fade * 0.42 * k).toFixed(3)})`);
        bg.addColorStop(1, `rgba(254, 243, 199, ${(fade * 0.85 * k).toFixed(3)})`);
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.moveTo(ix - 10, 0);
        ctx.lineTo(ix + 10, 0);
        ctx.lineTo(ix + 3, yTip);
        ctx.lineTo(ix, yTip + 14);
        ctx.lineTo(ix - 3, yTip);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      // 2. Seismic impact shockwaves expanding from slam point (0.28 - 1.65s)
      if (t > 0.26 && t < 1.85) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const rt = clamp((t - 0.28 - i * 0.14) / 1.05, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 14 + easeOutCubic(rt) * Math.max(w, h) * (0.48 + i * 0.15);
          const a = (1 - rt) * (0.50 - i * 0.10) * k;
          ctx.strokeStyle = i === 1
            ? `rgba(220, 38, 38, ${a.toFixed(3)})`
            : `rgba(251, 191, 36, ${a.toFixed(3)})`;
          ctx.lineWidth = (2.6 - i * 0.5) * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.ellipse(ix, iy, rad, rad * 0.42, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Branching molten-gold seismic fissures (spread 0.3-1.2s, pulse gently in idle)
      const fissurePulse = 0.55 + 0.45 * Math.sin(t * 2.1);
      ctx.save();
      for (let i = 0; i < this.cracks.length; i++) {
        const cr = this.cracks[i];
        const ct = clamp((t - cr.delay) / 0.65, 0, 1);
        if (ct <= 0) continue;
        const maxSeg = ct * (cr.pts.length - 1);
        const fullSegs = Math.floor(maxSeg);
        const frac = maxSeg - fullSegs;

        ctx.beginPath();
        ctx.moveTo(cr.pts[0].x, cr.pts[0].y);
        for (let s = 1; s <= fullSegs; s++) {
          ctx.lineTo(cr.pts[s].x, cr.pts[s].y);
        }
        if (fullSegs < cr.pts.length - 1) {
          const pA = cr.pts[fullSegs], pB = cr.pts[fullSegs + 1];
          ctx.lineTo(pA.x + (pB.x - pA.x) * frac, pA.y + (pB.y - pA.y) * frac);
        }

        // Warm outer glow
        ctx.strokeStyle = `rgba(217, 119, 6, ${(0.34 * fissurePulse * k).toFixed(3)})`;
        ctx.lineWidth = cr.width * 3.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Crisp molten gold core
        ctx.strokeStyle = `rgba(254, 243, 199, ${(0.48 * fissurePulse * k).toFixed(3)})`;
        ctx.lineWidth = cr.width * 0.8;
        ctx.stroke();
      }
      ctx.restore();

      // 4. Stylized Tengen Myō'ō braided gold shoulder-cord emblem pulsing quietly at top backdrop
      const emblemVis = easeOutCubic(clamp((t - 0.7) / 1.1, 0, 1));
      if (emblemVis > 0.01) {
        const ex = w * 0.5, ey = h * 0.28;
        const ea = emblemVis * (0.14 + 0.06 * Math.sin(t * 1.8)) * k;
        ctx.save();
        ctx.strokeStyle = `rgba(251, 191, 36, ${ea.toFixed(3)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.arc(ex, ey, Math.min(w, h) * 0.22, 0, TAU);
        ctx.stroke();
        ctx.strokeStyle = `rgba(220, 38, 38, ${(ea * 0.8).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(ex, ey, Math.min(w, h) * 0.17, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // 5. Levitating seismic stone debris fragments
      const debrisRise = easeOutCubic(clamp((t - 0.35) / 1.2, 0, 1));
      if (debrisRise > 0.01) {
        ctx.save();
        for (let i = 0; i < this.stones.length; i++) {
          const st = this.stones[i];
          st.rot += st.rotS * dt;
          const lift = debrisRise * 24 + Math.sin(t * st.bobSpeed + st.phase) * st.bobAmp;
          const sy = st.baseY - lift;
          ctx.save();
          ctx.translate(st.x, sy);
          ctx.rotate(st.rot);
          ctx.fillStyle = `rgba(54, 34, 18, ${(st.alpha * debrisRise * k).toFixed(3)})`;
          ctx.strokeStyle = `rgba(245, 158, 11, ${(st.alpha * 0.85 * debrisRise * k).toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(-st.size, -st.size * 0.4);
          ctx.lineTo(0, -st.size);
          ctx.lineTo(st.size * 0.9, -st.size * 0.2);
          ctx.lineTo(st.size * 0.5, st.size * 0.85);
          ctx.lineTo(-st.size * 0.7, st.size * 0.65);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 6. Rising Dangai Jōe bronze-gold & crimson heart-embers
      if (debrisRise > 0.01) {
        ctx.save();
        for (let i = 0; i < this.embers.length; i++) {
          const e = this.embers[i];
          e.swayP += e.swayS * dt;
          e.y += e.vy * dt;
          e.x += Math.sin(e.swayP) * 10 * dt;
          if (e.y < -10) { e.y = h + 10; e.x = (e.x + w * 0.31) % w; }
          const a = e.alpha * debrisRise * k;
          ctx.fillStyle = e.crimson
            ? `rgba(239, 68, 68, ${(a * 0.85).toFixed(3)})`
            : `rgba(251, 191, 36, ${(a * 0.9).toFixed(3)})`;
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

    _stopLoop() {
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.timers.forEach(id => clearTimeout(id));
      this.timers = [];
    }

    open() {
      this._stopLoop();
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
      this._stopLoop();
      this.el.classList.remove('km-open');
      if (this.ctx && this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }
    }

    replay() { this.open(); }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('komamura-panel');
      inst.delete(this.el);
    }
  }

  g.KomamuraPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new KomamuraEffect(el, opts);
      return {
        open: () => it.open(),
        close: () => it.close(),
        replay: () => it.replay(),
        destroy: () => it.destroy(),
        _inst: it
      };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
