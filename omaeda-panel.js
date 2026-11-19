/**
 * omaeda-panel.js - Marechiyo Ōmaeda (Gegetsuburi / 五形頭)
 * Entrance (0-3s):
 *   0.0-0.65s: Heavy spiked Gegetsuburi flail swings down on a forged chain and slams into the impact point
 *   0.65-1.8s: Concentric brass-gold kinetic shock-rings and gleaming metallic sparks scatter from the blow
 *   1.8-3.0s:  Settles into a slow heavy pendulum sway of the spiked morningstar with drifting gold dust
 * Idle loop: Pendulum-swaying spiked iron flail & chain links along lower backdrop + shimmering gold sparks
 *
 * API: const om = OmaedaPanel.attach(sidebar, options);
 *      om.open(); om.close(); om.replay(); om.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 40,           // Line 17: metallic bronze-gold & iron impact sparks
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 212,               // Line 19: deterministic PRNG seed
    impact: [0.62, 0.68],    // Line 20: normalized [x, y] Gegetsuburi slam point
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

  class OmaedaEffect {
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
      n.className = 'om-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('omaeda-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('om-wash');
      this.wash.style.setProperty('--om-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--om-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'om-layer om-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('om-flash');
      this.flash.style.setProperty('--om-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--om-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('om-ring');

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
      this.simTime = 0;

      this.sparks = [];
      for (let i = 0; i < count; i++) {
        const ang = r() * TAU;
        const spd = 65 + r() * 145;
        this.sparks.push({
          bx: ix, by: iy,
          bvx: Math.cos(ang) * spd,
          bvy: Math.sin(ang) * spd - 40,
          x: r() * w,
          y: r() * h,
          vy: -(12 + r() * 24),
          size: 1.4 + r() * 2.4,
          gold: r() > 0.35,
          phase: r() * TAU,
          alpha: 0.32 + r() * 0.56
        });
      }
    }

    _drawMorningstar(ctx, cx, cy, rad, rot, alpha, k) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);

      // 8 heavy conical iron spikes around the Gegetsuburi wrecking-ball head
      const spikes = 8;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * TAU;
        ctx.save();
        ctx.rotate(a);
        ctx.fillStyle = `rgba(148, 163, 184, ${(alpha * 0.72 * k).toFixed(3)})`;
        ctx.strokeStyle = `rgba(251, 191, 36, ${(alpha * 0.65 * k).toFixed(3)})`;
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(rad * 0.85, -4.5);
        ctx.lineTo(rad * 1.42, 0);
        ctx.lineTo(rad * 0.85, 4.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Metallic shaded sphere core
      const sg = ctx.createRadialGradient(-rad * 0.28, -rad * 0.28, 2, 0, 0, rad);
      sg.addColorStop(0, `rgba(254, 243, 199, ${(alpha * 0.55 * k).toFixed(3)})`);
      sg.addColorStop(0.45, `rgba(120, 113, 108, ${(alpha * 0.78 * k).toFixed(3)})`);
      sg.addColorStop(1, `rgba(28, 20, 10, ${(alpha * 0.90 * k).toFixed(3)})`);
      ctx.fillStyle = sg;
      ctx.strokeStyle = `rgba(245, 158, 11, ${(alpha * 0.75 * k).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(0, 0, rad, 0, TAU);
      ctx.fill();
      ctx.stroke();
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

      // 1. Heavy swinging Gegetsuburi flail & forged chain
      const pivotX = w * 0.22;
      const pivotY = h * 0.16;
      const chainLen = Math.hypot(ix - pivotX, iy - pivotY);
      const baseAngle = Math.atan2(iy - pivotY, ix - pivotX);
      const introSwing = clamp(t / 0.36, 0, 1);
      const damp = Math.exp(-Math.max(0, t - 0.36) * 2.1);
      const swingOffset = t < 0.36
        ? -1.25 * (1 - easeOutCubic(introSwing))
        : Math.sin((t - 0.36) * 5.2) * 0.24 * damp + Math.sin(t * 1.15) * 0.08;
      const curAngle = baseAngle + swingOffset;
      const bx = pivotX + Math.cos(curAngle) * chainLen;
      const by = pivotY + Math.sin(curAngle) * chainLen;

      // Motion swing arc blur during entrance
      if (t < 0.75) {
        const arcA = (1 - t / 0.75) * 0.36 * k;
        ctx.save();
        ctx.strokeStyle = `rgba(245, 158, 11, ${arcA.toFixed(3)})`;
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(pivotX, pivotY, chainLen, baseAngle - 1.25, curAngle);
        ctx.stroke();
        ctx.restore();
      }

      // Heavy forged chain links from pivot to morningstar head
      const flailVis = clamp(t / 0.2, 0, 1);
      ctx.save();
      const links = 14;
      for (let i = 1; i < links; i++) {
        const frac = i / links;
        const lx = pivotX + (bx - pivotX) * frac + Math.sin(frac * Math.PI) * swingOffset * 12;
        const ly = pivotY + (by - pivotY) * frac + Math.sin(frac * Math.PI) * 14;
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(curAngle);
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(245, 158, 11, ${(0.52 * flailVis * k).toFixed(3)})`
          : `rgba(148, 163, 184, ${(0.58 * flailVis * k).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.2, 3.0, 0, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      // Spiked Gegetsuburi head
      this._drawMorningstar(ctx, bx, by, 21, curAngle + t * 0.25, 0.56 * flailVis, k);

      // 2. Concentric kinetic impact shock-rings at slam point (0.34 - 1.8s)
      if (t > 0.32 && t < 1.95) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const rt = clamp((t - 0.34 - i * 0.14) / 1.1, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 18 + easeOutCubic(rt) * Math.max(w, h) * (0.44 + i * 0.14);
          const a = (1 - rt) * (0.48 - i * 0.10) * k;
          ctx.strokeStyle = i === 1
            ? `rgba(203, 213, 225, ${a.toFixed(3)})`
            : `rgba(245, 158, 11, ${a.toFixed(3)})`;
          ctx.lineWidth = (2.6 - i * 0.5) * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Burst sparks at impact (0.34-1.5s) transitioning into shimmering gold-bronze dust
      const settleMix = easeOutCubic(clamp((t - 0.95) / 1.25, 0, 1));
      if (t > 0.32) {
        const st = t - 0.32;
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.y += sp.vy * dt;
          sp.x += Math.sin(t * 1.4 + sp.phase) * 9 * dt;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.37) % w; }

          const drag = 1 - Math.exp(-st * 2.2);
          const bxP = sp.bx + sp.bvx * drag * 0.72;
          const byP = sp.by + sp.bvy * drag * 0.72 + st * st * 48;
          const px = bxP + (sp.x - bxP) * settleMix;
          const py = byP + (sp.y - byP) * settleMix;

          const shimmer = 0.5 + 0.5 * Math.sin(t * 4.2 + sp.phase);
          const a = sp.alpha * shimmer * clamp(st / 0.18, 0, 1) * k;
          ctx.fillStyle = sp.gold
            ? `rgba(251, 191, 36, ${a.toFixed(3)})`
            : `rgba(203, 213, 225, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, sp.size, 0, TAU);
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
      this.el.classList.remove('om-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('om-open');
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
      this.el.classList.remove('om-open');
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
      this.el.classList.remove('omaeda-panel');
      inst.delete(this.el);
    }
  }

  g.OmaedaPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new OmaedaEffect(el, opts);
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
