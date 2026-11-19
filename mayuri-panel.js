/**
 * mayuri-panel.js - Mayuri Kurotsuchi (Konjiki Ashisogi Jizō)
 * Entrance (0-3s):
 *   0.0-0.8s:  Golden biomechanical Ashisogi Jizō halo unfolds mechanically with radial blade-spokes
 *   0.8-2.0s:  Billowing violet-magenta and acid-chartreuse poison miasma plumes vent outward
 *   2.0-3.0s:  Settles into slowly rotating Konjiki halo mandala, drifting toxic fog, and mutagen spores
 * Idle loop: Counter-rotating golden Jizō spoked mandala + swirling violet-green vapor + glowing spores
 *
 * API: const my = MayuriPanel.attach(sidebar, options);
 *      my.open(); my.close(); my.replay(); my.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 52,           // Line 17: toxic spores & poison vapor puffs count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 1212,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.38],     // Line 20: normalized [x, y] Konjiki halo focal center
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

  class MayuriEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.plumes = []; this.spores = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'my-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('mayuri-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('my-wash');
      this.wash.style.setProperty('--my-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--my-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'my-layer my-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('my-flash');
      this.flash.style.setProperty('--my-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--my-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('my-ring');

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
      const plumeCount = Math.max(6, Math.round(count * 0.25));
      const sporeCount = Math.max(6, count - plumeCount);
      this.simTime = 0;

      // Billowing purple & chartreuse miasma cloud puffs
      this.plumes = [];
      for (let i = 0; i < plumeCount; i++) {
        this.plumes.push({
          x: r() * w,
          y: h * (0.35 + r() * 0.68),
          rad: 42 + r() * 54,
          vx: (r() - 0.5) * 16,
          vy: -(8 + r() * 14),
          acid: r() > 0.52,
          phase: r() * TAU
        });
      }

      // Bioluminescent mutagen spores
      this.spores = [];
      for (let i = 0; i < sporeCount; i++) {
        this.spores.push({
          x: r() * w,
          y: r() * h,
          vy: -(10 + r() * 24),
          size: 1.3 + r() * 2.6,
          swayP: r() * TAU,
          swayS: 1.1 + r() * 1.6,
          hue: r(),
          alpha: 0.35 + r() * 0.55
        });
      }
    }

    _drawJizoHalo(ctx, cx, cy, baseR, t, unfold, k) {
      ctx.save();
      ctx.translate(cx, cy);
      const rOuter = baseR * unfold;
      const a = 0.42 * unfold * k;

      // Outer golden halo ring with biomechanical ticks
      ctx.save();
      ctx.rotate(t * 0.22);
      ctx.strokeStyle = `rgba(234, 179, 8, ${a.toFixed(3)})`;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, rOuter, 0, TAU);
      ctx.stroke();

      // 12 protruding surgical blade-spokes
      const spokes = 12;
      for (let i = 0; i < spokes; i++) {
        const ang = (i / spokes) * TAU;
        const inner = rOuter * 0.72;
        const tip = rOuter * (1.16 + (i % 2 === 0 ? 0.14 : 0));
        ctx.save();
        ctx.rotate(ang);
        ctx.fillStyle = i % 2 === 0
          ? `rgba(250, 204, 21, ${(a * 0.92).toFixed(3)})`
          : `rgba(163, 230, 53, ${(a * 0.75).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(inner, -2.2);
        ctx.lineTo(tip, 0);
        ctx.lineTo(inner, 2.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Counter-rotating inner purple-gold alchemy ring
      ctx.save();
      ctx.rotate(-t * 0.34);
      ctx.strokeStyle = `rgba(192, 38, 211, ${(a * 0.9).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, 0, rOuter * 0.64, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      // Three Ashisogi trident-like inner arcs
      ctx.strokeStyle = `rgba(254, 240, 138, ${(a * 0.75).toFixed(3)})`;
      ctx.lineWidth = 1.3;
      for (let i = 0; i < 3; i++) {
        const ang = (i / 3) * TAU;
        ctx.beginPath();
        ctx.arc(0, 0, rOuter * 0.42, ang - 0.35, ang + 0.35);
        ctx.stroke();
      }
      ctx.restore();

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

      // 1. Billowing toxic purple & chartreuse poison vapor plumes
      const fogVis = easeOutCubic(clamp((t - 0.45) / 1.25, 0, 1));
      if (fogVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.plumes.length; i++) {
          const pl = this.plumes[i];
          pl.x += (pl.vx + Math.sin(t * 0.7 + pl.phase) * 8) * dt;
          pl.y += pl.vy * dt;
          if (pl.y < -pl.rad) { pl.y = h + pl.rad * 0.6; pl.x = (pl.x + w * 0.47) % w; }
          if (pl.x < -pl.rad) pl.x = w + pl.rad;
          if (pl.x > w + pl.rad) pl.x = -pl.rad;

          const a = 0.16 * fogVis * k;
          const grad = ctx.createRadialGradient(pl.x, pl.y, 4, pl.x, pl.y, pl.rad);
          if (pl.acid) {
            grad.addColorStop(0, `rgba(163, 230, 53, ${a.toFixed(3)})`);
            grad.addColorStop(0.55, `rgba(101, 163, 13, ${(a * 0.45).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(163, 230, 53, 0)');
          } else {
            grad.addColorStop(0, `rgba(192, 38, 211, ${(a * 1.1).toFixed(3)})`);
            grad.addColorStop(0.55, `rgba(112, 26, 117, ${(a * 0.5).toFixed(3)})`);
            grad.addColorStop(1, 'rgba(192, 38, 211, 0)');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(pl.x, pl.y, pl.rad, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Rotating golden Konjiki Ashisogi Jizō biomechanical halo
      const unfold = easeOutCubic(clamp(t / 0.85, 0, 1));
      if (unfold > 0.01) {
        this._drawJizoHalo(ctx, ix, iy, Math.min(w, h) * 0.30, t, unfold, k);
      }

      // 3. Subtle bio-telemetry horizontal scan wave (S.R.D.I. mad science accent)
      if (t > 0.9) {
        const scanY = ((t * 52) % (h + 60)) - 30;
        ctx.save();
        ctx.strokeStyle = `rgba(163, 230, 53, ${(0.12 * k).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        for (let x = 0; x <= w; x += 10) {
          const y = scanY + Math.sin(x * 0.08 + t * 7.0) * 3.5;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 4. Floating bioluminescent mutagen spores
      if (fogVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.spores.length; i++) {
          const sp = this.spores[i];
          sp.swayP += sp.swayS * dt;
          sp.y += sp.vy * dt;
          sp.x += Math.sin(sp.swayP) * 11 * dt;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.37) % w; }
          const glow = 0.5 + 0.5 * Math.sin(t * 3.5 + sp.swayP);
          const a = sp.alpha * (0.5 + 0.5 * glow) * fogVis * k;

          ctx.fillStyle = sp.hue < 0.48
            ? `rgba(163, 230, 53, ${a.toFixed(3)})`
            : (sp.hue < 0.82 ? `rgba(232, 121, 249, ${a.toFixed(3)})` : `rgba(250, 204, 21, ${a.toFixed(3)})`);
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, sp.size, 0, TAU);
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
      this.el.classList.remove('my-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('my-open');
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
      this.el.classList.remove('my-open');
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
      this.el.classList.remove('mayuri-panel');
      inst.delete(this.el);
    }
  }

  g.MayuriPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new MayuriEffect(el, opts);
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
