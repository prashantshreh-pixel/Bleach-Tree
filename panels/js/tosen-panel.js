/**
 * tosen-panel.js - Kaname Tōsen (Suzumushi Tsuishiki: Enma Kōrogi)
 * Entrance (0-3s):
 *   0.0-0.85s: Pitch-black Enma Kōrogi sensory dome ring expands from impact with a sharp violet ping
 *   0.85-2.0s: Concentric cricket acoustic sonar ripples radiate while Benihikō spectral needle-blades fan out
 *   2.0-3.0s:  Settles into sensory-void gloom punctuated by rhythmic sonar rings and orbiting blade-needles
 * Idle loop: Rhythmic acoustic stridulation rings + slow-orbiting luminous Benihikō needles & void motes
 *
 * API: const ts = TosenPanel.attach(sidebar, options);
 *      ts.open(); ts.close(); ts.replay(); ts.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: Benihikō needle-blades & sonic motes count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 909,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.42],     // Line 20: normalized [x, y] Enma Kōrogi dome epicenter
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

  class TosenEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.needles = []; this.motes = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'ts-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('tosen-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('ts-wash');
      this.wash.style.setProperty('--ts-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--ts-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'ts-layer ts-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('ts-flash');
      this.flash.style.setProperty('--ts-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--ts-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('ts-ring');

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
      const needleCount = Math.max(8, Math.round(count * 0.45));
      const moteCount = Math.max(4, count - needleCount);
      this.simTime = 0;

      // Spectral Benihikō floating blade-needles
      this.needles = [];
      for (let i = 0; i < needleCount; i++) {
        const ringIdx = i % 2;
        this.needles.push({
          angle: (i / needleCount) * TAU + r() * 0.3,
          rad: (ringIdx === 0 ? 78 : 132) + r() * 34,
          speed: (ringIdx === 0 ? 0.22 : -0.16) * (0.8 + r() * 0.4),
          len: 12 + r() * 14,
          phase: r() * TAU,
          emerald: r() > 0.72,
          delay: 0.48 + r() * 0.55
        });
      }

      // Sensory-void floating acoustic dust motes
      this.motes = [];
      for (let i = 0; i < moteCount; i++) {
        this.motes.push({
          x: r() * w,
          y: r() * h,
          vx: (r() - 0.5) * 10,
          vy: (r() - 0.5) * 10,
          r: 1.0 + r() * 1.9,
          phase: r() * TAU,
          emerald: r() > 0.65
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
      const maxDim = Math.hypot(w, h);

      ctx.clearRect(0, 0, w, h);

      // 1. Enma Kōrogi dark sensory-deprivation dome ring sweeping outward (0.0 - 1.25s)
      if (t < 1.35) {
        const dtDome = clamp(t / 1.15, 0, 1);
        const rad = easeOutCubic(dtDome) * maxDim * 0.75;
        const rimAlpha = (1 - dtDome * 0.65) * 0.65 * k;
        ctx.save();
        ctx.strokeStyle = `rgba(192, 132, 252, ${rimAlpha.toFixed(3)})`;
        ctx.lineWidth = 3.2 * (1 - dtDome * 0.5);
        ctx.beginPath();
        ctx.arc(ix, iy, rad, 0, TAU);
        ctx.stroke();

        // Dark void core trailing the expanding boundary
        const vg = ctx.createRadialGradient(ix, iy, rad * 0.1, ix, iy, Math.max(2, rad));
        vg.addColorStop(0, `rgba(6, 2, 14, ${(0.35 * (1 - dtDome * 0.4) * k).toFixed(3)})`);
        vg.addColorStop(0.85, `rgba(22, 8, 42, ${(0.22 * (1 - dtDome * 0.5) * k).toFixed(3)})`);
        vg.addColorStop(1, 'rgba(168, 85, 247, 0)');
        ctx.fillStyle = vg;
        ctx.beginPath();
        ctx.arc(ix, iy, rad, 0, TAU);
        ctx.fill();
        ctx.restore();
      }

      // 2. Continuous cricket-stridulation concentric acoustic sonar waves (Suzumushi)
      ctx.save();
      const waveCount = 4;
      const period = 3.2;
      for (let i = 0; i < waveCount; i++) {
        const wt = ((t + (i / waveCount) * period) % period) / period;
        const introScale = clamp(t / 0.9, 0, 1);
        const rad = 14 + easeOutCubic(wt) * Math.max(w, h) * 0.62;
        const a = Math.sin(wt * Math.PI) * (1 - wt * 0.45) * 0.34 * introScale * k;
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(192, 132, 252, ${a.toFixed(3)})`
          : `rgba(74, 222, 128, ${(a * 0.72).toFixed(3)})`;
        ctx.lineWidth = 1.4 * (1 - wt * 0.5);
        ctx.beginPath();
        // Slightly harmonic undulating acoustic ring
        const segs = 48;
        for (let s = 0; s <= segs; s++) {
          const ang = (s / segs) * TAU;
          const ripple = Math.sin(ang * 8 + t * 5.0 + i) * (2.5 * (1 - wt));
          const px = ix + Math.cos(ang) * (rad + ripple);
          const py = iy + Math.sin(ang) * (rad + ripple);
          if (s === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();

      // 3. Hovering Benihikō spectral blade-needles fanning & orbiting outward
      ctx.save();
      for (let i = 0; i < this.needles.length; i++) {
        const nd = this.needles[i];
        if (t < nd.delay) continue;
        const nIntro = easeOutCubic(clamp((t - nd.delay) / 0.75, 0, 1));
        nd.angle += nd.speed * dt;
        const curRad = nd.rad * (0.28 + 0.72 * nIntro) + Math.sin(t * 1.9 + nd.phase) * 5;
        const nx = ix + Math.cos(nd.angle) * curRad;
        const ny = iy + Math.sin(nd.angle) * curRad * 1.12;
        const shimmer = 0.55 + 0.45 * Math.sin(t * 3.4 + nd.phase);
        const a = 0.62 * nIntro * shimmer * k;

        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(nd.angle);
        ctx.fillStyle = nd.emerald
          ? `rgba(134, 239, 172, ${(a * 0.85).toFixed(3)})`
          : `rgba(233, 213, 255, ${(a * 0.90).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(nd.len * 0.6, 0);
        ctx.lineTo(-nd.len * 0.2, -1.6);
        ctx.lineTo(-nd.len * 0.6, 0);
        ctx.lineTo(-nd.len * 0.2, 1.6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // 4. Sensory-void drifting sonic motes
      const moteVis = clamp((t - 0.3) / 1.0, 0, 1);
      if (moteVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.motes.length; i++) {
          const m = this.motes[i];
          m.x += m.vx * dt;
          m.y += m.vy * dt;
          if (m.x < -8) m.x = w + 8;
          if (m.x > w + 8) m.x = -8;
          if (m.y < -8) m.y = h + 8;
          if (m.y > h + 8) m.y = -8;
          const pulse = 0.35 + 0.65 * Math.sin(t * 2.6 + m.phase);
          const a = pulse * 0.55 * moteVis * k;
          ctx.fillStyle = m.emerald
            ? `rgba(74, 222, 128, ${a.toFixed(3)})`
            : `rgba(192, 132, 252, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(m.x, m.y, m.r, 0, TAU);
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
      this.el.classList.remove('ts-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('ts-open');
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
      this.el.classList.remove('ts-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('tosen-panel');
      inst.delete(this.el);
    }
  }

  g.TosenPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new TosenEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
