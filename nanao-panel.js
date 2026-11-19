/**
 * nanao-panel.js - Nanao Ise (Shinken Hakkyōken / 神剣・八鏡剣 & Bakudō)
 * Entrance (0-3s):
 *   0.0-0.8s:  Eight golden octagonal mirror facets lock symmetrically around the impact center
 *   0.8-1.9s:  Pure white divine light strikes the center and refracts outward in 8 prismatic rays
 *   1.9-3.0s:  Settles into a serenely rotating octagonal mirror lattice with drifting sacred dust
 * Idle loop: Slowly turning Shinken Hakkyōken octagonal mirror + gentle 8-fold prismatic rays & light motes
 *
 * API: const nn = NanaoPanel.attach(sidebar, options);
 *      nn.open(); nn.close(); nn.replay(); nn.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 40,           // Line 17: drifting sacred gold & prismatic light motes
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 818,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.38],     // Line 20: normalized [x, y] octagonal mirror focal point
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

  class NanaoEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.motes = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'nn-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('nanao-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('nn-wash');
      this.wash.style.setProperty('--nn-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--nn-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'nn-layer nn-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('nn-flash');
      this.flash.style.setProperty('--nn-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--nn-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('nn-ring');

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

      this.motes = [];
      for (let i = 0; i < count; i++) {
        this.motes.push({
          x: r() * w,
          y: r() * h,
          vy: -(8 + r() * 18),
          size: 1.1 + r() * 2.1,
          phase: r() * TAU,
          hue: i % 3,
          alpha: 0.30 + r() * 0.54
        });
      }
    }

    _drawOctagon(ctx, r, rot) {
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = rot + (i / 8) * TAU;
        const px = Math.cos(a) * r;
        const py = Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];
      const maxLen = Math.hypot(w, h) * 0.65;

      ctx.clearRect(0, 0, w, h);

      // 1. Eight-fold prismatic divine refraction shafts (burst at 0.5s -> serene idle rays)
      const rayProg = easeOutCubic(clamp((t - 0.48) / 0.85, 0, 1));
      if (rayProg > 0.01) {
        const burstBoost = Math.exp(-Math.max(0, t - 0.55) * 1.9) * 0.38;
        const rayColors = [
          'rgba(254, 249, 195,',
          'rgba(147, 197, 253,',
          'rgba(251, 191, 36,',
          'rgba(196, 181, 253,'
        ];
        ctx.save();
        ctx.translate(ix, iy);
        ctx.rotate(t * 0.08);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * TAU;
          const shimmer = 0.62 + 0.38 * Math.sin(t * 2.1 + i * 0.9);
          const a = (0.14 + burstBoost) * shimmer * rayProg * k;
          const spread = 0.065;
          const len = maxLen * rayProg;

          const grad = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
          grad.addColorStop(0, `${rayColors[i % 4]} ${(a * 1.35).toFixed(3)})`);
          grad.addColorStop(0.55, `${rayColors[i % 4]} ${(a * 0.45).toFixed(3)})`);
          grad.addColorStop(1, `${rayColors[i % 4]} 0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang - spread) * len, Math.sin(ang - spread) * len);
          ctx.lineTo(Math.cos(ang + spread) * len, Math.sin(ang + spread) * len);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Octagonal Shinken Hakkyōken sacred mirror & Bakudō geometric lattice
      const assemble = easeOutCubic(clamp(t / 0.80, 0, 1));
      if (assemble > 0.01) {
        const baseR = Math.min(w, h) * 0.27;
        const breathe = 1 + Math.sin(t * 1.7) * 0.03;
        ctx.save();
        ctx.translate(ix, iy);

        // Outer Bakudō octagonal shield
        ctx.strokeStyle = `rgba(251, 191, 36, ${(0.42 * assemble * k).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        this._drawOctagon(ctx, baseR * (1.28 - 0.28 * assemble) * breathe, t * 0.10);
        ctx.stroke();

        // Counter-rotating inner mirror octagon
        ctx.strokeStyle = `rgba(254, 249, 195, ${(0.56 * assemble * k).toFixed(3)})`;
        ctx.fillStyle = `rgba(254, 249, 195, ${(0.06 * assemble * k).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        this._drawOctagon(ctx, baseR * 0.74 * assemble * breathe, -t * 0.14 + Math.PI / 8);
        ctx.fill();
        ctx.stroke();

        // Eight mirror facet spokes connecting outer & inner octagons
        ctx.strokeStyle = `rgba(147, 197, 253, ${(0.34 * assemble * k).toFixed(3)})`;
        ctx.lineWidth = 0.9;
        for (let i = 0; i < 8; i++) {
          const a = t * 0.10 + (i / 8) * TAU;
          ctx.beginPath();
          ctx.moveTo(Math.cos(a) * baseR * 0.34, Math.sin(a) * baseR * 0.34);
          ctx.lineTo(Math.cos(a) * baseR * breathe, Math.sin(a) * baseR * breathe);
          ctx.stroke();
        }

        // Sacred mirror central jewel
        ctx.strokeStyle = `rgba(255, 255, 255, ${(0.65 * assemble * k).toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.arc(0, 0, baseR * 0.20 * assemble, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Drifting sacred gold & prismatic dust motes
      const moteVis = clamp((t - 0.3) / 0.9, 0, 1);
      if (moteVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.motes.length; i++) {
          const m = this.motes[i];
          m.y += m.vy * dt;
          m.x += Math.sin(t * 1.1 + m.phase) * 7 * dt;
          if (m.y < -10) { m.y = h + 10; m.x = (m.x + w * 0.43) % w; }
          const tw = 0.45 + 0.55 * Math.sin(t * 3.0 + m.phase);
          const a = m.alpha * tw * moteVis * k;
          ctx.fillStyle = m.hue === 0
            ? `rgba(254, 249, 195, ${a.toFixed(3)})`
            : (m.hue === 1 ? `rgba(147, 197, 253, ${a.toFixed(3)})` : `rgba(196, 181, 253, ${a.toFixed(3)})`);
          // Crisp diamond prism mote
          ctx.beginPath();
          ctx.moveTo(m.x, m.y - m.size * 1.4);
          ctx.lineTo(m.x + m.size * 0.9, m.y);
          ctx.lineTo(m.x, m.y + m.size * 1.4);
          ctx.lineTo(m.x - m.size * 0.9, m.y);
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
      this.el.classList.remove('nn-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('nn-open');
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
      this.el.classList.remove('nn-open');
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
      this.el.classList.remove('nanao-panel');
      inst.delete(this.el);
    }
  }

  g.NanaoPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new NanaoEffect(el, opts);
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
