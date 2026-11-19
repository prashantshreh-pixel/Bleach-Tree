/**
 * unohana-panel.js - Retsu / Yachiru Unohana (Minazuki / 皆尽)
 * Entrance (0-3s):
 *   0.0-0.65s: Calm Squad 4 jade-teal healing ripple pulses, then parts cleanly
 *   0.65-1.9s: Razor crimson katana arc cleaves diagonally as viscous dark-crimson Minazuki waves surge upward
 *   1.9-3.0s:  Settles into undulating multi-layer blood-acid tides with rising crimson droplets & blade arcs
 * Idle loop: Slow boiling arterial waves at the base, floating luminous crimson orbs, periodic sword-edge arcs
 *
 * API: const un = UnohanaPanel.attach(sidebar, options);
 *      un.open(); un.close(); un.replay(); un.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 46,           // Line 17: rising crimson mist droplets & embers
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 404,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.45],     // Line 20: normalized [x, y] katana cleave origin
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

  class UnohanaEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.drops = []; this.arcs = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'un-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('unohana-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('un-wash');
      this.wash.style.setProperty('--un-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--un-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'un-layer un-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('un-flash');
      this.ring = this._div('un-ring');

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

      this.drops = [];
      for (let i = 0; i < count; i++) {
        this.drops.push({
          x: r() * w,
          y: h * (0.45 + r() * 0.58),
          r: 1.3 + r() * 3.1,
          vy: -(16 + r() * 36),
          swayP: r() * TAU,
          swayS: 1.0 + r() * 1.4,
          alpha: 0.28 + r() * 0.56,
          bright: r() > 0.72
        });
      }

      this.arcs = [
        { cx: 0.48, cy: 0.44, rad: 0.44, a0: -0.9, a1: 0.85, period: 5.4, offset: 0.55 },
        { cx: 0.56, cy: 0.62, rad: 0.36, a0: 2.2,  a1: 3.7,  period: 6.2, offset: 2.6  }
      ];
    }

    _drawWave(ctx, w, h, baseY, amp, freq, phase, colorTop, colorBot) {
      const grad = ctx.createLinearGradient(0, baseY - amp, 0, h);
      grad.addColorStop(0, colorTop);
      grad.addColorStop(1, colorBot);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let x = 0; x <= w; x += 12) {
        const y = baseY + Math.sin(x * freq + phase) * amp + Math.cos(x * freq * 0.52 - phase * 0.7) * (amp * 0.45);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];

      ctx.clearRect(0, 0, w, h);

      // 1. Fleeting Squad 4 serene jade-teal healing aura (0.0 - 0.9s), replaced by Kenpachi crimson
      if (t < 1.05) {
        const jadeT = t / 1.05;
        const jadeA = Math.sin(jadeT * Math.PI) * 0.42 * k;
        const rad = 24 + easeOutCubic(jadeT) * Math.max(w, h) * 0.45;
        ctx.save();
        ctx.strokeStyle = `rgba(45, 212, 191, ${jadeA.toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(ix, iy, rad, 0, TAU);
        ctx.stroke();

        const jg = ctx.createRadialGradient(ix, iy, 0, ix, iy, rad * 0.85);
        jg.addColorStop(0, `rgba(20, 184, 166, ${(jadeA * 0.45).toFixed(3)})`);
        jg.addColorStop(1, 'rgba(19, 78, 74, 0)');
        ctx.fillStyle = jg;
        ctx.beginPath();
        ctx.arc(ix, iy, rad * 0.85, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      // 2. Multi-layer viscous dark-crimson Minazuki tides surging upward from 0.55s onward
      const tideRise = easeOutCubic(clamp((t - 0.50) / 1.35, 0, 1));
      if (tideRise > 0.01) {
        const lift = (1 - tideRise) * h * 0.42;
        this._drawWave(ctx, w, h, h * 0.72 + lift, 14, 0.016, t * 1.15,
          `rgba(127, 29, 29, ${(0.34 * tideRise * k).toFixed(3)})`,
          `rgba(45, 6, 10, ${(0.62 * tideRise * k).toFixed(3)})`);
        this._drawWave(ctx, w, h, h * 0.80 + lift, 11, 0.022, -t * 1.45 + 1.8,
          `rgba(185, 28, 28, ${(0.40 * tideRise * k).toFixed(3)})`,
          `rgba(69, 10, 10, ${(0.72 * tideRise * k).toFixed(3)})`);
        this._drawWave(ctx, w, h, h * 0.88 + lift, 8, 0.028, t * 1.9 + 3.2,
          `rgba(220, 38, 38, ${(0.38 * tideRise * k).toFixed(3)})`,
          `rgba(28, 4, 8, ${(0.82 * tideRise * k).toFixed(3)})`);

        // Specular crimson crest rim on middle wave
        ctx.save();
        ctx.strokeStyle = `rgba(252, 165, 165, ${(0.28 * tideRise * k).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          const y = h * 0.80 + lift + Math.sin(x * 0.022 - t * 1.45 + 1.8) * 11 + Math.cos(x * 0.0114 + t * 1.015 - 1.26) * 4.95;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. Arterial katana-blade fluid slash arcs (entrance + periodic slow idle glides)
      ctx.save();
      for (let i = 0; i < this.arcs.length; i++) {
        const a = this.arcs[i];
        const local = t - a.offset;
        if (local < 0) continue;
        const cyc = (local % a.period) / 1.05;
        if (cyc > 1) continue;
        const sweep = easeOutCubic(clamp(cyc * 1.4, 0, 1));
        const fade = 1 - clamp((cyc - 0.35) / 0.65, 0, 1);
        const alpha = fade * (i === 0 && local < 1.2 ? 0.72 : 0.42) * k;
        const cx = w * a.cx, cy = h * a.cy, rad = Math.min(w, h) * a.rad;
        const curEnd = a.a0 + (a.a1 - a.a0) * sweep;

        ctx.strokeStyle = `rgba(220, 38, 38, ${(alpha * 0.65).toFixed(3)})`;
        ctx.lineWidth = 7.0 * fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(cx, cy, rad, a.a0, curEnd);
        ctx.stroke();

        ctx.strokeStyle = `rgba(254, 226, 226, ${(alpha * 0.9).toFixed(3)})`;
        ctx.lineWidth = 1.5 * fade;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, a.a0, curEnd);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Rising crimson Minazuki droplets & vapor bubbles
      if (tideRise > 0.05) {
        ctx.save();
        for (let i = 0; i < this.drops.length; i++) {
          const d = this.drops[i];
          d.swayP += d.swayS * dt;
          d.y += d.vy * dt;
          d.x += Math.sin(d.swayP) * 9 * dt;
          if (d.y < h * 0.14) {
            d.y = h * 0.96;
            d.x = (d.x + w * 0.43) % w;
          }
          const hFade = clamp((d.y - h * 0.14) / (h * 0.35), 0, 1);
          const a = d.alpha * hFade * tideRise * k;
          ctx.fillStyle = d.bright
            ? `rgba(252, 165, 165, ${(a * 0.9).toFixed(3)})`
            : `rgba(220, 38, 38, ${(a * 0.8).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, TAU);
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
      this.el.classList.remove('un-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('un-open');
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
      this.el.classList.remove('un-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('unohana-panel');
      inst.delete(this.el);
    }
  }

  g.UnohanaPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new UnohanaEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
