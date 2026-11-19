/**
 * shunsui-panel.js - Shunsui Kyōraku (Katen Kyōkotsu: Karamatsu Shinjū)
 * Entrance (0-3s):
 *   0.0-0.8s: Kageoni shadow-ink pools expand from impact + twin Katen blade-glints cross
 *   0.8-2.0s: Glowing crimson Act IV fate-threads stretch taut and pluck with harmonic ripples
 *   2.0-3.0s: Settles into melancholic ink-water rings, humming threads, and drifting kimono petals
 * Idle loop: Slow-drifting pale rose kimono petals & golden dust over pulsing dark-water ripples
 *
 * API: const sh = ShunsuiPanel.attach(sidebar, options);
 *      sh.open(); sh.close(); sh.replay(); sh.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: kimono petals & golden sake-dust count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 808,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.42],     // Line 20: normalized [x, y] shadow-ink focal point
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

  class ShunsuiEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.threads = []; this.petals = []; this.inkPools = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'sh-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('shunsui-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('sh-wash');
      this.wash.style.setProperty('--sh-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--sh-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'sh-layer sh-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('sh-flash');
      this.ring = this._div('sh-ring');

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

      // Kageoni dark-ink shadow pools
      this.inkPools = [];
      for (let i = 0; i < 5; i++) {
        this.inkPools.push({
          x: w * (0.16 + r() * 0.68),
          y: h * (0.20 + r() * 0.65),
          baseR: 36 + r() * 44,
          phase: r() * TAU,
          speed: 0.45 + r() * 0.35
        });
      }

      // Act IV crimson fate-threads spanning the panel
      this.threads = [
        { y1: 0.24, y2: 0.36, delay: 0.58, amp: 14, freq: 11.5, gold: false },
        { y1: 0.56, y2: 0.46, delay: 0.72, amp: 18, freq: 9.2,  gold: true  },
        { y1: 0.76, y2: 0.85, delay: 0.88, amp: 12, freq: 13.0, gold: false },
        { y1: 0.88, y2: 0.68, delay: 1.02, amp: 10, freq: 10.4, gold: false }
      ];

      // Kimono blossom petals & warm golden motes
      this.petals = [];
      for (let i = 0; i < count; i++) {
        const isGold = r() > 0.72;
        this.petals.push({
          x: r() * w,
          y: r() * h,
          size: isGold ? (1.2 + r() * 1.8) : (4.2 + r() * 4.8),
          vx: -8 - r() * 14,
          vy: 12 + r() * 20,
          swayP: r() * TAU,
          swayS: 0.9 + r() * 1.1,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 1.8,
          isGold,
          alpha: 0.32 + r() * 0.5
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

      // 1. Kageoni shadow-ink pools & concentric water ripples (Act III: Dangyo no Fuchi)
      const poolIntro = easeOutCubic(clamp(t / 1.1, 0, 1));
      ctx.save();
      for (let i = 0; i < this.inkPools.length; i++) {
        const p = this.inkPools[i];
        const rad = p.baseR * (0.35 + 0.65 * poolIntro);
        const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(12, 4, 24, ${(0.52 * poolIntro * k).toFixed(3)})`);
        grad.addColorStop(0.7, `rgba(48, 12, 42, ${(0.22 * poolIntro * k).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(12, 4, 24, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rad * 1.2, rad * 0.62, 0, 0, TAU);
        ctx.fill();

        // Slow water-ripple rings on each ink pool
        const cyc = (t * p.speed + p.phase) % 1;
        const rr = rad * (0.25 + cyc * 1.15);
        const ra = (1 - cyc) * 0.24 * poolIntro * k;
        ctx.strokeStyle = `rgba(244, 114, 182, ${ra.toFixed(3)})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr * 1.2, rr * 0.45, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Entrance twin Katen Kyōkotsu crossed crescent gleams (0.1 - 1.1s)
      if (t > 0.08 && t < 1.15) {
        const st = clamp((t - 0.08) / 0.95, 0, 1);
        const a = Math.sin(st * Math.PI) * 0.52 * k;
        ctx.save();
        ctx.translate(ix, iy);
        for (let s = -1; s <= 1; s += 2) {
          ctx.save();
          ctx.rotate(s * 0.58);
          const span = (0.35 + easeOutCubic(st) * 0.65) * w * 0.48;
          const gGrad = ctx.createLinearGradient(-span, 0, span, 0);
          gGrad.addColorStop(0, 'rgba(225, 29, 72, 0)');
          gGrad.addColorStop(0.5, `rgba(254, 226, 226, ${a.toFixed(3)})`);
          gGrad.addColorStop(1, 'rgba(225, 29, 72, 0)');
          ctx.strokeStyle = gGrad;
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          ctx.moveTo(-span, -12 * s);
          ctx.quadraticCurveTo(0, 16 * s, span, -12 * s);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 3. Act IV: Itokiribasami Chizome no Nodobue — glowing crimson fate-threads
      ctx.save();
      for (let i = 0; i < this.threads.length; i++) {
        const th = this.threads[i];
        const tt = t - th.delay;
        if (tt <= 0) continue;
        const drawFrac = easeOutCubic(clamp(tt / 0.55, 0, 1));
        const pluck = Math.exp(-Math.max(0, tt - 0.35) * 1.8) * th.amp;
        const idleHum = 1.6 * Math.sin(t * 2.1 + i * 1.7);
        const vib = Math.sin(tt * th.freq) * pluck + idleHum;

        const x2 = w * drawFrac;
        const y1 = h * th.y1;
        const y2 = h * th.y2;
        const midX = x2 * 0.5;
        const midY = (y1 + y2) * 0.5 + vib;

        // Soft crimson outer aura
        ctx.strokeStyle = th.gold
          ? `rgba(251, 191, 36, ${(0.24 * k).toFixed(3)})`
          : `rgba(225, 29, 72, ${(0.34 * k).toFixed(3)})`;
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Razor-sharp inner silk core
        ctx.strokeStyle = th.gold
          ? `rgba(254, 243, 199, ${(0.75 * k).toFixed(3)})`
          : `rgba(255, 228, 230, ${(0.72 * k).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 4. Drifting kimono blossoms & warm golden dust
      const petalVis = clamp((t - 0.35) / 1.1, 0, 1);
      if (petalVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.petals.length; i++) {
          const p = this.petals[i];
          p.swayP += p.swayS * dt;
          p.rot += p.rotS * dt;
          p.x += (p.vx + Math.sin(p.swayP) * 14) * dt;
          p.y += p.vy * dt;
          if (p.y > h + 14) { p.y = -14; p.x = (p.x + w * 0.63) % w; }
          if (p.x < -14) p.x = w + 14;
          if (p.x > w + 14) p.x = -14;

          const a = p.alpha * petalVis * k;
          if (p.isGold) {
            ctx.fillStyle = `rgba(251, 191, 36, ${(a * 0.8).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, TAU);
            ctx.fill();
          } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = `rgba(244, 114, 182, ${(a * 0.72).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.56, 0, 0, TAU);
            ctx.fill();
            ctx.fillStyle = `rgba(255, 228, 230, ${(a * 0.5).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(-p.size * 0.2, 0, p.size * 0.35, p.size * 0.2, 0, 0, TAU);
            ctx.fill();
            ctx.restore();
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

    _stopLoop() {
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.timers.forEach(id => clearTimeout(id));
      this.timers = [];
    }

    open() {
      this._stopLoop();
      this.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.isOpen = true;
      this.el.classList.remove('sh-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('sh-open');
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
      this.el.classList.remove('sh-open');
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
      this.el.classList.remove('shunsui-panel');
      inst.delete(this.el);
    }
  }

  g.ShunsuiPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new ShunsuiEffect(el, opts);
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
