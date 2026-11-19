/**
 * renji-panel.js - Renji Abarai (Sōō Zabimaru / 双王蛇尾丸)
 * Entrance (0-3s):
 *   0.0-0.75s: Segmented ivory-crimson Zabimaru bone-blade whip lashes diagonally across impact point
 *   0.75-1.85s: Vertebrae spine coils into a sinuous S-arch while glowing scarlet reiatsu links surge
 *   1.85-3.0s: Settles into a breathing articulated skeletal serpent-blade curve & rising vermilion sparks
 * Idle loop: Flexing articulated bone-blade segments pulsing with crimson-orange energy seams & embers
 *
 * API: const rj = RenjiPanel.attach(sidebar, options);
 *      rj.open(); rj.close(); rj.replay(); rj.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 46,           // Line 17: Higa Zekkō vermilion-orange sparks count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 616,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.44],     // Line 20: normalized [x, y] whip-crack focal point
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

  class RenjiEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.sparks = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'rj-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('renji-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('rj-wash');
      this.wash.style.setProperty('--rj-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--rj-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'rj-layer rj-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('rj-flash');
      this.ring = this._div('rj-ring');

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

      this.sparks = [];
      for (let i = 0; i < count; i++) {
        this.sparks.push({
          x: r() * w,
          y: r() * h,
          vx: (r() - 0.5) * 26,
          vy: -(24 + r() * 48),
          size: 1.2 + r() * 2.5,
          orange: r() > 0.45,
          phase: r() * TAU,
          alpha: 0.35 + r() * 0.58
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

      // 1. Twin beast-claw slash bursts at impact point during entrance (0.20 - 1.20s)
      if (t > 0.18 && t < 1.25) {
        const st = clamp((t - 0.18) / 0.95, 0, 1);
        const fade = Math.sin(st * Math.PI);
        ctx.save();
        for (let c = -1; c <= 1; c++) {
          const offset = c * 18;
          const span = (0.3 + easeOutCubic(st) * 0.7) * w * 0.44;
          ctx.strokeStyle = c === 0
            ? `rgba(254, 243, 199, ${(fade * 0.72 * k).toFixed(3)})`
            : `rgba(239, 68, 68, ${(fade * 0.58 * k).toFixed(3)})`;
          ctx.lineWidth = c === 0 ? 2.4 : 1.7;
          ctx.beginPath();
          ctx.moveTo(ix - span, iy - span * 0.55 + offset);
          ctx.quadraticCurveTo(ix + offset * 0.4, iy + offset * 0.5, ix + span, iy + span * 0.48 + offset);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Articulated Sōō Zabimaru bone-blade whip spine curving along backdrop
      const segCount = 16;
      const whipExtend = easeOutCubic(clamp(t / 0.95, 0, 1));
      const settle = easeOutCubic(clamp((t - 0.75) / 1.15, 0, 1));
      const pts = [];
      for (let i = 0; i < segCount; i++) {
        const frac = i / (segCount - 1);
        if (frac > whipExtend) break;
        const lashAmp = (1 - settle) * 44 * Math.sin(t * 9.5 - frac * 4.5);
        const idleWave = Math.sin(t * 1.9 - frac * 3.8) * (24 + frac * 18);
        const px = w * (0.14 + frac * 0.74) + Math.sin(frac * Math.PI * 2 + t * 1.3) * 28 + lashAmp * 0.45;
        const py = h * (0.94 - frac * 0.78) + idleWave + lashAmp * 0.35;
        pts.push({ x: px, y: py, frac });
      }

      if (pts.length >= 2) {
        ctx.save();
        // Glowing crimson reiatsu energy cord connecting vertebrae segments
        ctx.strokeStyle = `rgba(239, 68, 68, ${(0.45 * k).toFixed(3)})`;
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(251, 146, 60, ${(0.72 * k).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // Individual razor-spiked ivory bone-blade segments
        for (let i = 1; i < pts.length; i++) {
          const p0 = pts[i - 1], p1 = pts[i];
          const mx = (p0.x + p1.x) * 0.5, my = (p0.y + p1.y) * 0.5;
          const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x);
          const taper = 1 - p1.frac * 0.32;
          const segL = 13 * taper;
          const segW = 5.4 * taper;
          const pulse = 0.55 + 0.45 * Math.sin(t * 3.2 - i * 0.45);

          ctx.save();
          ctx.translate(mx, my);
          ctx.rotate(ang);
          ctx.fillStyle = `rgba(38, 12, 12, ${(0.78 * k).toFixed(3)})`;
          ctx.strokeStyle = `rgba(254, 243, 199, ${(0.52 * pulse * k).toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          // Jagged Zabimaru fang-segment silhouette
          ctx.moveTo(-segL * 0.55, -segW * 0.5);
          ctx.lineTo(segL * 0.35, -segW * 0.95);
          ctx.lineTo(segL * 0.65, 0);
          ctx.lineTo(segL * 0.35, segW * 0.95);
          ctx.lineTo(-segL * 0.55, segW * 0.5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Red energy core dot in each joint
          ctx.fillStyle = `rgba(239, 68, 68, ${(0.68 * pulse * k).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(0, 0, 1.8 * taper, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
      }

      // 3. Feral vermilion & orange Higa Zekkō sparks
      const sparkVis = clamp((t - 0.25) / 0.85, 0, 1);
      if (sparkVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const s = this.sparks[i];
          s.x += (s.vx + Math.sin(t * 2.2 + s.phase) * 14) * dt;
          s.y += s.vy * dt;
          if (s.y < -12) { s.y = h + 12; s.x = (s.x + w * 0.53) % w; }
          if (s.x < -12) s.x = w + 12;
          if (s.x > w + 12) s.x = -12;

          const a = s.alpha * sparkVis * k;
          ctx.fillStyle = s.orange
            ? `rgba(251, 146, 60, ${a.toFixed(3)})`
            : `rgba(248, 113, 113, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y - s.size * 1.5);
          ctx.lineTo(s.x + s.size * 0.7, s.y);
          ctx.lineTo(s.x, s.y + s.size * 1.5);
          ctx.lineTo(s.x - s.size * 0.7, s.y);
          ctx.closePath();
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
      this.el.classList.remove('rj-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('rj-open');
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
      this.el.classList.remove('rj-open');
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
      this.el.classList.remove('renji-panel');
      inst.delete(this.el);
    }
  }

  g.RenjiPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new RenjiEffect(el, opts);
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
