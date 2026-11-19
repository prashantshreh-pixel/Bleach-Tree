/**
 * hisagi-panel.js - Shuhei Hisagi (Kazeshini / Fushi no Kōjyō)
 * Entrance (0-3s):
 *   0.0-0.75s: Twin double-bladed Kazeshini scythes spin inward on opposite arcs, clashing sparks at impact
 *   0.75-1.9s: Circular dark-teal gale wind-arcs radiate while the connecting chain snaps taut between them
 *   1.9-3.0s:  Settles into menacing twin orbiting pinwheel scythes joined by a swaying black-iron chain
 * Idle loop: Linked rotating Kazeshini scythes on smooth counter-orbits, curving wind trails, metallic sparks
 *
 * API: const hs = HisagiPanel.attach(sidebar, options);
 *      hs.open(); hs.close(); hs.replay(); hs.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 40,           // Line 17: cutting gale streaks & iron sparks count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 969,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.46],     // Line 20: normalized [x, y] twin-scythe orbit center
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

  class HisagiEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.gusts = []; this.sparks = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'hs-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('hisagi-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('hs-wash');
      this.wash.style.setProperty('--hs-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--hs-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'hs-layer hs-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('hs-flash');
      this.flash.style.setProperty('--hs-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--hs-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('hs-ring');

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
      const gustCount = Math.max(6, Math.round(count * 0.35));
      const sparkCount = Math.max(6, count - gustCount);
      this.simTime = 0;

      // Swirling cutting-wind orbital arcs
      this.gusts = [];
      for (let i = 0; i < gustCount; i++) {
        this.gusts.push({
          rad: 42 + r() * 138,
          angle: r() * TAU,
          span: 0.45 + r() * 0.75,
          speed: (r() > 0.5 ? 1 : -1) * (1.0 + r() * 1.6),
          alpha: 0.16 + r() * 0.24
        });
      }

      // Metallic silver & teal sparks
      this.sparks = [];
      for (let i = 0; i < sparkCount; i++) {
        this.sparks.push({
          x: r() * w,
          y: r() * h,
          vx: (r() - 0.5) * 30,
          vy: (r() - 0.5) * 30,
          size: 1.0 + r() * 2.0,
          teal: r() > 0.45,
          phase: r() * TAU
        });
      }
    }

    _drawKazeshini(ctx, x, y, rot, scale, alpha, k) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(scale, scale);

      // Motion blur ring
      ctx.strokeStyle = `rgba(45, 212, 191, ${(alpha * 0.35 * k).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, 26, 0, TAU);
      ctx.stroke();

      // Double-ended S-curved Kazeshini pinwheel blades (black body + silver outer edge)
      for (let b = 0; b < 2; b++) {
        ctx.save();
        ctx.rotate(b * Math.PI);
        ctx.fillStyle = `rgba(15, 23, 42, ${(alpha * 0.88 * k).toFixed(3)})`;
        ctx.strokeStyle = `rgba(226, 232, 240, ${(alpha * 0.85 * k).toFixed(3)})`;
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.quadraticCurveTo(22, -24, 30, -4);
        ctx.quadraticCurveTo(18, -8, 6, 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // Central iron ring hub
      ctx.strokeStyle = `rgba(148, 163, 184, ${(alpha * 0.9 * k).toFixed(3)})`;
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5, 0, TAU);
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

      // 1. Expanding gale shock-rings after scythe clash (0.32 - 1.75s)
      if (t > 0.30 && t < 1.85) {
        ctx.save();
        for (let i = 0; i < 2; i++) {
          const rt = clamp((t - 0.32 - i * 0.16) / 1.15, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 14 + easeOutCubic(rt) * Math.max(w, h) * (0.48 + i * 0.15);
          const a = (1 - rt) * 0.42 * k;
          ctx.strokeStyle = `rgba(45, 212, 191, ${a.toFixed(3)})`;
          ctx.lineWidth = 1.8 * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Cutting gale orbital wind arcs
      const intro = easeOutCubic(clamp(t / 1.1, 0, 1));
      ctx.save();
      for (let i = 0; i < this.gusts.length; i++) {
        const gArc = this.gusts[i];
        gArc.angle += gArc.speed * dt;
        const a = gArc.alpha * intro * k;
        ctx.strokeStyle = i % 2 === 0
          ? `rgba(45, 212, 191, ${a.toFixed(3)})`
          : `rgba(203, 213, 225, ${(a * 0.72).toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.arc(ix, iy, gArc.rad * (0.5 + 0.5 * intro), gArc.angle, gArc.angle + gArc.span);
        ctx.stroke();
      }
      ctx.restore();

      // 3. Twin Kazeshini pinwheel scythes & linking iron chain
      const approach = easeOutCubic(clamp(t / 0.42, 0, 1));
      const settle = easeOutCubic(clamp((t - 0.42) / 1.15, 0, 1));
      const orbitAng = t * 0.52 - 0.6;
      const orbitRx = (1 - approach) * w * 0.65 + settle * w * 0.31;
      const orbitRy = (1 - approach) * h * 0.25 + settle * h * 0.23;

      const s1x = ix + Math.cos(orbitAng) * orbitRx;
      const s1y = iy + Math.sin(orbitAng) * orbitRy;
      const s2x = ix - Math.cos(orbitAng) * orbitRx;
      const s2y = iy - Math.sin(orbitAng) * orbitRy;

      // Connecting black-iron chain curving between the twin scythes
      const chainVis = clamp((t - 0.28) / 0.5, 0, 1);
      if (chainVis > 0.01) {
        const sagX = ix + Math.sin(t * 2.2) * 16;
        const sagY = iy + 28 + Math.cos(t * 1.9) * 14;
        ctx.save();
        const links = 18;
        for (let i = 0; i <= links; i++) {
          const u = i / links;
          const omu = 1 - u;
          const lx = omu * omu * s1x + 2 * omu * u * sagX + u * u * s2x;
          const ly = omu * omu * s1y + 2 * omu * u * sagY + u * u * s2y;
          const dx = 2 * omu * (sagX - s1x) + 2 * u * (s2x - sagX);
          const dy = 2 * omu * (sagY - s1y) + 2 * u * (s2y - sagY);
          const ang = Math.atan2(dy, dx);

          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(ang);
          ctx.strokeStyle = i % 2 === 0
            ? `rgba(148, 163, 184, ${(0.58 * chainVis * k).toFixed(3)})`
            : `rgba(71, 85, 105, ${(0.68 * chainVis * k).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.ellipse(0, 0, 4.6, 2.2, 0, 0, TAU);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // Spin faster during entrance clash, steady lethal rotation during idle
      const spinPhase = t * (3.8 + (1 - settle) * 5.2);
      this._drawKazeshini(ctx, s1x, s1y, spinPhase, 0.92, 0.65 * intro, k);
      this._drawKazeshini(ctx, s2x, s2y, -spinPhase, 0.92, 0.65 * intro, k);

      // 4. Drifting iron & teal gale sparks
      if (intro > 0.05) {
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.x += sp.vx * dt;
          sp.y += sp.vy * dt;
          if (sp.x < -8) sp.x = w + 8;
          if (sp.x > w + 8) sp.x = -8;
          if (sp.y < -8) sp.y = h + 8;
          if (sp.y > h + 8) sp.y = -8;

          const tw = 0.4 + 0.6 * Math.sin(t * 3.6 + sp.phase);
          const a = tw * 0.62 * intro * k;
          ctx.fillStyle = sp.teal
            ? `rgba(94, 234, 212, ${a.toFixed(3)})`
            : `rgba(226, 232, 240, ${a.toFixed(3)})`;
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

    open() {
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.isOpen = true;
      this.el.classList.remove('hs-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('hs-open');
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
      this.el.classList.remove('hs-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('hisagi-panel');
      inst.delete(this.el);
    }
  }

  g.HisagiPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new HisagiEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
