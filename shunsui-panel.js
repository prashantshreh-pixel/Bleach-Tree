/**
 * shunsui-panel.js - Shunsui Kyōraku (Katen Kyōkotsu: Karamatsu Shinjū — Black & Yellow Bankai)
 * Entrance (0-3s):
 *   0.0-0.8s:  Pitch-black Kageoni shadow pools & rising obsidian ink tendrils engulf the stage while twin yellow gleams cross
 *   0.8-2.0s:  Luminous imperial-yellow Act IV fate-threads snap taut across the black void and vibrate harmonically
 *   2.0-3.0s:  Settles into stark black-and-yellow theatrical gloom with golden-rimmed ink-water ripples & drifting gold petals
 * Idle loop: Pitch-black shadow tendrils & abyssal water ripples, humming yellow-gold threads, drifting golden leaves/motes
 *
 * API: const sh = ShunsuiPanel.attach(sidebar, options);
 *      sh.open(); sh.close(); sh.replay(); sh.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 48,           // Line 17: drifting yellow-gold autumn petals & shadow sparks
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 808,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.42],     // Line 20: normalized [x, y] Bankai stage focal point
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
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.threads = []; this.petals = []; this.inkPools = []; this.tendrils = [];
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

      // Pitch-black shadow-ink pools with golden-yellow theatrical water rings
      this.inkPools = [];
      for (let i = 0; i < 5; i++) {
        this.inkPools.push({
          x: w * (0.14 + r() * 0.72),
          y: h * (0.22 + r() * 0.66),
          baseR: 42 + r() * 48,
          phase: r() * TAU,
          speed: 0.42 + r() * 0.34
        });
      }

      // Rising pitch-black Karamatsu Shinjū shadow-ink tendrils framed with faint gold edge
      this.tendrils = [];
      for (let i = 0; i < 7; i++) {
        this.tendrils.push({
          x: w * (0.06 + (i / 6) * 0.88),
          height: h * (0.34 + r() * 0.36),
          width: 14 + r() * 18,
          phase: r() * TAU,
          speed: 0.85 + r() * 0.75
        });
      }

      // Luminous electric yellow-gold Act IV fate-threads cutting across the black stage
      this.threads = [
        { y1: 0.22, y2: 0.34, delay: 0.52, amp: 16, freq: 11.8, bright: true  },
        { y1: 0.54, y2: 0.44, delay: 0.68, amp: 20, freq: 9.4,  bright: true  },
        { y1: 0.74, y2: 0.86, delay: 0.84, amp: 14, freq: 13.2, bright: false },
        { y1: 0.88, y2: 0.66, delay: 0.98, amp: 12, freq: 10.6, bright: false }
      ];

      // Drifting golden-yellow autumn ginkgo petals & radiant amber-yellow motes
      this.petals = [];
      for (let i = 0; i < count; i++) {
        const isSpark = r() > 0.64;
        this.petals.push({
          x: r() * w,
          y: r() * h,
          size: isSpark ? (1.2 + r() * 2.1) : (4.4 + r() * 4.6),
          vx: -10 - r() * 14,
          vy: 14 + r() * 20,
          swayP: r() * TAU,
          swayS: 0.95 + r() * 1.15,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 1.9,
          isSpark,
          pale: r() > 0.55,
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

      // 1. Rising pitch-black Kageoni shadow-ink tendrils with delicate golden edge rim
      const shadowRise = easeOutCubic(clamp(t / 1.15, 0, 1));
      if (shadowRise > 0.01) {
        ctx.save();
        for (let i = 0; i < this.tendrils.length; i++) {
          const td = this.tendrils[i];
          const sway = Math.sin(t * td.speed + td.phase) * 16;
          const topY = h - td.height * shadowRise;
          const gGrad = ctx.createLinearGradient(td.x, h, td.x + sway, topY);
          gGrad.addColorStop(0, `rgba(2, 2, 3, ${(0.88 * shadowRise * k).toFixed(3)})`);
          gGrad.addColorStop(0.7, `rgba(10, 9, 6, ${(0.52 * shadowRise * k).toFixed(3)})`);
          gGrad.addColorStop(1, 'rgba(10, 9, 6, 0)');
          ctx.fillStyle = gGrad;
          ctx.beginPath();
          ctx.moveTo(td.x - td.width, h);
          ctx.quadraticCurveTo(td.x - td.width * 0.4 + sway * 0.5, (h + topY) * 0.5, td.x + sway, topY);
          ctx.quadraticCurveTo(td.x + td.width * 0.4 + sway * 0.4, (h + topY) * 0.5, td.x + td.width, h);
          ctx.closePath();
          ctx.fill();

          // Faint haunting yellow-gold shadow rim
          ctx.strokeStyle = `rgba(250, 204, 21, ${(0.16 * shadowRise * k).toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(td.x - td.width * 0.7, h);
          ctx.quadraticCurveTo(td.x - td.width * 0.3 + sway * 0.5, (h + topY) * 0.5, td.x + sway, topY);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Pitch-black ink-water pools & golden-yellow concentric ripples (Act III: Dangyo no Fuchi)
      ctx.save();
      for (let i = 0; i < this.inkPools.length; i++) {
        const p = this.inkPools[i];
        const rad = p.baseR * (0.35 + 0.65 * shadowRise);
        const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, rad);
        grad.addColorStop(0, `rgba(2, 2, 3, ${(0.78 * shadowRise * k).toFixed(3)})`);
        grad.addColorStop(0.68, `rgba(16, 14, 6, ${(0.38 * shadowRise * k).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(2, 2, 3, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rad * 1.25, rad * 0.58, 0, 0, TAU);
        ctx.fill();

        const cyc = (t * p.speed + p.phase) % 1;
        const rr = rad * (0.24 + cyc * 1.22);
        const ra = (1 - cyc) * 0.34 * shadowRise * k;
        ctx.strokeStyle = `rgba(250, 204, 21, ${ra.toFixed(3)})`;
        ctx.lineWidth = 1.05;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y, rr * 1.25, rr * 0.44, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Entrance twin crossed golden Katen Kyōkotsu gleams cutting the black void (0.08 - 1.15s)
      if (t > 0.08 && t < 1.18) {
        const st = clamp((t - 0.08) / 0.95, 0, 1);
        const a = Math.sin(st * Math.PI) * 0.68 * k;
        ctx.save();
        ctx.translate(ix, iy);
        for (let s = -1; s <= 1; s += 2) {
          ctx.save();
          ctx.rotate(s * 0.56);
          const span = (0.35 + easeOutCubic(st) * 0.65) * w * 0.48;
          const gGrad = ctx.createLinearGradient(-span, 0, span, 0);
          gGrad.addColorStop(0, 'rgba(250, 204, 21, 0)');
          gGrad.addColorStop(0.5, `rgba(254, 249, 195, ${a.toFixed(3)})`);
          gGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.strokeStyle = gGrad;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(-span, -12 * s);
          ctx.quadraticCurveTo(0, 16 * s, span, -12 * s);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 4. Act IV: Luminous golden-yellow fate-threads snapping taut across the black stage
      ctx.save();
      for (let i = 0; i < this.threads.length; i++) {
        const th = this.threads[i];
        const tt = t - th.delay;
        if (tt <= 0) continue;
        const drawFrac = easeOutCubic(clamp(tt / 0.52, 0, 1));
        const pluck = Math.exp(-Math.max(0, tt - 0.34) * 1.8) * th.amp;
        const idleHum = 1.8 * Math.sin(t * 2.2 + i * 1.7);
        const vib = Math.sin(tt * th.freq) * pluck + idleHum;

        const x2 = w * drawFrac;
        const y1 = h * th.y1;
        const y2 = h * th.y2;
        const midX = x2 * 0.5;
        const midY = (y1 + y2) * 0.5 + vib;

        // Luminous yellow-gold outer aura
        ctx.strokeStyle = th.bright
          ? `rgba(250, 204, 21, ${(0.38 * k).toFixed(3)})`
          : `rgba(202, 138, 4, ${(0.32 * k).toFixed(3)})`;
        ctx.lineWidth = 5.0;
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Razor-sharp pale-yellow silk core
        ctx.strokeStyle = `rgba(254, 249, 195, ${(0.84 * k).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(0, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Drifting golden-yellow autumn ginkgo petals & luminous amber sparks
      const petalVis = clamp((t - 0.30) / 1.0, 0, 1);
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
          if (p.isSpark) {
            ctx.fillStyle = p.pale
              ? `rgba(254, 249, 195, ${(a * 0.88).toFixed(3)})`
              : `rgba(250, 204, 21, ${(a * 0.88).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, TAU);
            ctx.fill();
          } else {
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.fillStyle = p.pale
              ? `rgba(253, 224, 71, ${(a * 0.78).toFixed(3)})`
              : `rgba(234, 179, 8, ${(a * 0.82).toFixed(3)})`;
            // Stylized golden ginkgo/autumn fan petal
            ctx.beginPath();
            ctx.moveTo(-p.size * 0.65, 0);
            ctx.quadraticCurveTo(0, -p.size * 0.85, p.size * 0.72, -p.size * 0.28);
            ctx.lineTo(p.size * 0.45, 0);
            ctx.lineTo(p.size * 0.72, p.size * 0.28);
            ctx.quadraticCurveTo(0, p.size * 0.85, -p.size * 0.65, 0);
            ctx.closePath();
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

    open() {
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
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
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.el.classList.remove('sh-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('shunsui-panel');
      inst.delete(this.el);
    }
  }

  g.ShunsuiPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new ShunsuiEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
