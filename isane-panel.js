/**
 * isane-panel.js - Isane Kotetsu (Itegumo / 凍雲 & Squad 4 Kaidō Healing)
 * Entrance (0-3s):
 *   0.0-0.75s: Three slim silver Itegumo blade-glints fan gracefully apart at the impact center
 *   0.75-1.9s: Translucent jade-mint Kaidō healing wave-rings pulse upward and downward
 *   1.9-3.0s:  Settles into serene ascending healing cross-sparkles & drifting silver-blue cloud wisps
 * Idle loop: Soft pastel snow-cloud puffs + rising luminous Kaidō healing orbs & delicate jade cross-runes
 *
 * API: const is = IsanePanel.attach(sidebar, options);
 *      is.open(); is.close(); is.replay(); is.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: healing cross-runes, mint orbs & cloud wisps
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 414,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.46],     // Line 20: normalized [x, y] Itegumo triple-blade origin
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

  class IsaneEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.clouds = []; this.motes = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'is-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('isane-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('is-wash');
      this.wash.style.setProperty('--is-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--is-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'is-layer is-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('is-flash');
      this.flash.style.setProperty('--is-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--is-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('is-ring');

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
      const cloudCount = Math.max(5, Math.round(count * 0.2));
      const moteCount = Math.max(7, count - cloudCount);
      this.simTime = 0;

      // Soft Itegumo snow-cloud wisps drifting gently across
      this.clouds = [];
      for (let i = 0; i < cloudCount; i++) {
        this.clouds.push({
          x: r() * w,
          y: h * (0.14 + r() * 0.74),
          rx: 52 + r() * 48,
          ry: 22 + r() * 18,
          vx: 8 + r() * 14,
          phase: r() * TAU
        });
      }

      // Ascending Kaidō healing cross-runes & emerald-mint light motes
      this.motes = [];
      for (let i = 0; i < moteCount; i++) {
        this.motes.push({
          x: r() * w,
          y: r() * h,
          vy: -(12 + r() * 24),
          size: 2.0 + r() * 3.0,
          isCross: r() > 0.56,
          phase: r() * TAU,
          alpha: 0.30 + r() * 0.55
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

      // 1. Soft Itegumo snow-cloud puffs drifting behind content
      const cloudVis = easeOutCubic(clamp(t / 1.2, 0, 1));
      if (cloudVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.clouds.length; i++) {
          const cl = this.clouds[i];
          cl.x += cl.vx * dt;
          if (cl.x - cl.rx > w + 20) cl.x = -cl.rx - 20;
          const cy = cl.y + Math.sin(t * 0.7 + cl.phase) * 8;
          const grad = ctx.createRadialGradient(cl.x, cy, 4, cl.x, cy, cl.rx);
          grad.addColorStop(0, `rgba(186, 230, 253, ${(0.14 * cloudVis * k).toFixed(3)})`);
          grad.addColorStop(0.55, `rgba(110, 231, 183, ${(0.07 * cloudVis * k).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(cl.x, cy, cl.rx, cl.ry, 0, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Triple Itegumo silver blade fan opening at entrance (0.08 - 1.25s)
      if (t > 0.06 && t < 1.30) {
        const bt = clamp((t - 0.06) / 1.15, 0, 1);
        const fan = easeOutCubic(clamp(bt * 1.8, 0, 1));
        const fade = 1 - clamp((bt - 0.35) / 0.65, 0, 1);
        ctx.save();
        ctx.translate(ix, iy + 26);
        for (let b = -1; b <= 1; b++) {
          ctx.save();
          ctx.rotate(b * 0.34 * fan);
          const len = (b === 0 ? 115 : 86) * fan;
          const lg = ctx.createLinearGradient(0, 0, 0, -len);
          lg.addColorStop(0, 'rgba(186, 230, 253, 0)');
          lg.addColorStop(0.7, `rgba(186, 230, 253, ${(fade * 0.56 * k).toFixed(3)})`);
          lg.addColorStop(1, `rgba(255, 255, 255, ${(fade * 0.88 * k).toFixed(3)})`);
          ctx.strokeStyle = lg;
          ctx.lineWidth = b === 0 ? 2.2 : 1.6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -len);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 3. Rhythmic Squad 4 Kaidō jade healing aura rings radiating gently
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const wt = ((t * 0.36 + i / 3) % 1);
        const intro = clamp((t - 0.25) / 0.8, 0, 1);
        const rad = 16 + easeOutCubic(wt) * Math.max(w, h) * 0.48;
        const a = Math.sin(wt * Math.PI) * 0.26 * intro * k;
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(52, 211, 153, ${a.toFixed(3)})`
          : `rgba(186, 230, 253, ${(a * 0.78).toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(ix, iy, rad, rad * 0.74, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Ascending Kaidō healing cross-runes & mint light droplets
      const moteVis = clamp((t - 0.25) / 0.9, 0, 1);
      if (moteVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.motes.length; i++) {
          const m = this.motes[i];
          m.y += m.vy * dt;
          m.x += Math.sin(t * 1.2 + m.phase) * 9 * dt;
          if (m.y < -12) { m.y = h + 12; m.x = (m.x + w * 0.39) % w; }
          const glow = 0.45 + 0.55 * Math.sin(t * 2.8 + m.phase);
          const a = m.alpha * glow * moteVis * k;

          if (m.isCross) {
            ctx.strokeStyle = `rgba(110, 231, 183, ${(a * 0.95).toFixed(3)})`;
            ctx.lineWidth = 1.35;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(m.x - m.size, m.y); ctx.lineTo(m.x + m.size, m.y);
            ctx.moveTo(m.x, m.y - m.size); ctx.lineTo(m.x, m.y + m.size);
            ctx.stroke();
          } else {
            ctx.fillStyle = `rgba(209, 250, 229, ${(a * 0.85).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(m.x, m.y, m.size * 0.58, 0, TAU);
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
      this.el.classList.remove('is-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('is-open');
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
      this.el.classList.remove('is-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('isane-panel');
      inst.delete(this.el);
    }
  }

  g.IsanePanel = {
    attach(el, opts) { return el ? (inst.get(el) || new IsaneEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
