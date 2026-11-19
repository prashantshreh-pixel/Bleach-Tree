/**
 * gin-panel.js - Gin Ichimaru (Shinsō / Kamishini no Yari)
 * Entrance (0-3s):
 *   0.0-0.35s: Razor-thin fox-eye silver glint narrows at the impact point
 *   0.35-1.15s: Three Mach-500 hypersonic blade thrusts lance across with vapor shock-cone chevrons
 *   1.15-3.0s: Blade dissolves into shimmering turquoise-silver Korose cellular poison dust
 * Idle loop: Drifting lethal silver-cyan Korose dust shards + periodic supersonic hairline glints
 *
 * API: const gn = GinPanel.attach(sidebar, options);
 *      gn.open(); gn.close(); gn.replay(); gn.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 56,           // Line 17: Korose cellular dust shards count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 303,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.36],     // Line 20: normalized [x, y] thrust intersection point
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

  class GinEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.dust = []; this.thrusts = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'gn-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('gin-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('gn-wash');
      this.wash.style.setProperty('--gn-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--gn-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'gn-layer gn-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('gn-flash');
      this.ring = this._div('gn-ring');

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
      const count = Math.max(12, Math.round(this.o.particles));
      this.simTime = 0;

      // Three Mach-500 entrance thrusts (Butō Renjin rapid succession)
      this.thrusts = [
        { start: 0.30, dur: 0.56, angle: -0.44, ox: -0.05, oy: 0.58 },
        { start: 0.52, dur: 0.54, angle: 0.24,  ox: -0.05, oy: 0.28 },
        { start: 0.74, dur: 0.62, angle: -0.18, ox: 1.05,  oy: 0.72, reverse: true }
      ];

      // Korose dissolving cellular sliver dust
      this.dust = [];
      for (let i = 0; i < count; i++) {
        this.dust.push({
          x: r() * w,
          y: r() * h,
          vx: (r() - 0.5) * 14,
          vy: -(8 + r() * 18),
          size: 1.1 + r() * 2.5,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 2.4,
          cyan: r() > 0.42,
          phase: r() * TAU,
          alpha: 0.25 + r() * 0.60
        });
      }
    }

    _drawThrust(ctx, w, h, th, lt, k) {
      const extend = easeOutCubic(clamp(lt * 2.8, 0, 1));
      const fade = 1 - clamp((lt - 0.32) / 0.68, 0, 1);
      if (fade <= 0.01) return;

      const x0 = w * th.ox;
      const y0 = h * th.oy;
      const dir = th.reverse ? -1 : 1;
      const maxLen = Math.hypot(w, h) * 1.15;
      const curLen = maxLen * extend;
      const dx = Math.cos(th.angle) * dir;
      const dy = Math.sin(th.angle) * dir;
      const x1 = x0 + dx * curLen;
      const y1 = y0 + dy * curLen;

      ctx.save();
      // Cyan vapor outer corridor
      ctx.strokeStyle = `rgba(103, 232, 249, ${(fade * 0.42 * k).toFixed(3)})`;
      ctx.lineWidth = 6.5 * fade;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Blinding white-silver needle core
      ctx.strokeStyle = `rgba(240, 249, 255, ${(fade * 0.95 * k).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // Mach shock-cone chevrons along the path
      const perpX = -dy, perpY = dx;
      for (let c = 1; c <= 4; c++) {
        const frac = c * 0.20;
        if (extend < frac) break;
        const cx = x0 + dx * (maxLen * frac);
        const cy = y0 + dy * (maxLen * frac);
        const spread = 18 + (1 - fade) * 22;
        ctx.strokeStyle = `rgba(165, 243, 252, ${(fade * 0.46 * k).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(cx - dx * 22 + perpX * spread, cy - dy * 22 + perpY * spread);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx - dx * 22 - perpX * spread, cy - dy * 22 - perpY * spread);
        ctx.stroke();
      }
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

      // 1. Narrowing fox-eye silver glint at impact point (0.0 - 0.55s)
      if (t < 0.60) {
        const gt = t / 0.60;
        const a = Math.sin(gt * Math.PI) * 0.72 * k;
        const rx = 6 + easeOutCubic(gt) * 58;
        ctx.save();
        ctx.strokeStyle = `rgba(240, 249, 255, ${a.toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ix - rx, iy);
        ctx.quadraticCurveTo(ix, iy - 6 * (1 - gt * 0.5), ix + rx, iy);
        ctx.quadraticCurveTo(ix, iy + 6 * (1 - gt * 0.5), ix - rx, iy);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Mach-500 entrance thrusts (0.30 - 1.40s)
      for (let i = 0; i < this.thrusts.length; i++) {
        const th = this.thrusts[i];
        const lt = (t - th.start) / th.dur;
        if (lt > 0 && lt < 1) this._drawThrust(ctx, w, h, th, lt, k);
      }

      // 3. Idle periodic pinpoint hypersonic glint across periphery (every 4.8s)
      if (t > 2.2) {
        const cyc = ((t - 2.2) % 4.8) / 0.45;
        if (cyc < 1) {
          const idx = Math.floor((t - 2.2) / 4.8);
          const yBand = h * (0.24 + ((idx * 37) % 58) / 100);
          const fade = Math.sin(cyc * Math.PI) * 0.45 * k;
          const xEnd = w * easeOutCubic(cyc);
          ctx.save();
          const lg = ctx.createLinearGradient(0, yBand, xEnd, yBand - 36);
          lg.addColorStop(0, 'rgba(103, 232, 249, 0)');
          lg.addColorStop(0.85, `rgba(224, 242, 254, ${fade.toFixed(3)})`);
          lg.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.strokeStyle = lg;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, yBand);
          ctx.lineTo(xEnd, yBand - 36);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 4. Dissolving Korose silver-cyan cellular sliver dust
      const dustVis = clamp((t - 0.65) / 1.15, 0, 1);
      if (dustVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.dust.length; i++) {
          const d = this.dust[i];
          d.rot += d.rotS * dt;
          d.x += (d.vx + Math.sin(t * 1.1 + d.phase) * 7) * dt;
          d.y += d.vy * dt;
          if (d.y < -12) { d.y = h + 12; d.x = (d.x + w * 0.41) % w; }
          if (d.x < -12) d.x = w + 12;
          if (d.x > w + 12) d.x = -12;

          const shimmer = 0.5 + 0.5 * Math.sin(t * 3.8 + d.phase);
          const a = d.alpha * (0.45 + 0.55 * shimmer) * dustVis * k;

          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.fillStyle = d.cyan
            ? `rgba(103, 232, 249, ${a.toFixed(3)})`
            : `rgba(226, 232, 240, ${a.toFixed(3)})`;
          // Razor-sliver diamond crystal
          ctx.beginPath();
          ctx.moveTo(0, -d.size * 1.7);
          ctx.lineTo(d.size * 0.65, 0);
          ctx.lineTo(0, d.size * 1.7);
          ctx.lineTo(-d.size * 0.65, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
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
      this.el.classList.remove('gn-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('gn-open');
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
      this.el.classList.remove('gn-open');
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
      this.el.classList.remove('gin-panel');
      inst.delete(this.el);
    }
  }

  g.GinPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new GinEffect(el, opts);
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
