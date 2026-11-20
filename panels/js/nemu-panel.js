/**
 * nemu-panel.js - Nemu Kurotsuchi (Gikon / Soul-Shaving Overdrive)
 * Entrance (0-3s):
 *   0.0-0.75s: Artificial-soul telemetry ring locks on at impact center and ignites pure cyan-white
 *   0.75-1.9s: Electric-cyan bio-neural filaments branch outward firing high-speed Mach overdrive rings
 *   1.9-3.0s:  Settles into a steady pulsing soul-core lattice with traveling synaptic light packets
 * Idle loop: Branching electric-cyan neural pathways carrying crisp traveling pulses + azure overdrive sparks
 *
 * API: const nu = NemuPanel.attach(sidebar, options);
 *      nu.open(); nu.close(); nu.replay(); nu.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: overdrive sparks & neural pulse packets
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 1207,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.40],     // Line 20: normalized [x, y] artificial-soul core center
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

  class NemuEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.traces = []; this.sparks = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'nu-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('nemu-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('nu-wash');
      this.wash.style.setProperty('--nu-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--nu-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'nu-layer nu-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('nu-flash');
      this.flash.style.setProperty('--nu-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--nu-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('nu-ring');

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

      // Branching 45-degree precision bio-neural circuit traces radiating from soul-core
      this.traces = [];
      const traceCount = 10;
      for (let i = 0; i < traceCount; i++) {
        const ang0 = (i / traceCount) * TAU + 0.15;
        const pts = [{ x: ix + Math.cos(ang0) * 26, y: iy + Math.sin(ang0) * 26 }];
        let cx = pts[0].x, cy = pts[0].y;
        let ang = ang0;
        const hops = 3 + (i % 2);
        for (let s = 0; s < hops; s++) {
          const dist = 36 + r() * 52;
          cx += Math.cos(ang) * dist;
          cy += Math.sin(ang) * dist;
          pts.push({ x: cx, y: cy });
          ang += (r() > 0.5 ? 1 : -1) * (Math.PI / 4);
        }
        this.traces.push({
          pts,
          delay: 0.36 + (i % 5) * 0.08,
          speed: 0.45 + r() * 0.45,
          phase: r(),
          indigo: i % 3 === 0
        });
      }

      // High-energy electric-cyan & pure-white overdrive sparks
      this.sparks = [];
      for (let i = 0; i < count; i++) {
        this.sparks.push({
          x: r() * w,
          y: r() * h,
          vx: (r() - 0.5) * 22,
          vy: -(18 + r() * 34),
          size: 1.0 + r() * 2.1,
          indigo: r() > 0.72,
          phase: r() * TAU,
          alpha: 0.30 + r() * 0.60
        });
      }
    }

    _samplePolyline(pts, u) {
      const segs = pts.length - 1;
      const f = clamp(u, 0, 1) * segs;
      const idx = Math.min(segs - 1, Math.floor(f));
      const frac = f - idx;
      const p0 = pts[idx], p1 = pts[idx + 1];
      return { x: p0.x + (p1.x - p0.x) * frac, y: p0.y + (p1.y - p0.y) * frac };
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];

      ctx.clearRect(0, 0, w, h);

      // 1. Artificial-soul core precision telemetry rings at impact point
      const lockIn = easeOutCubic(clamp(t / 0.65, 0, 1));
      if (lockIn > 0.01) {
        const pulse = 1 + Math.sin(t * 2.8) * 0.04;
        ctx.save();
        ctx.translate(ix, iy);

        // Soft glowing core halo
        const cg = ctx.createRadialGradient(0, 0, 2, 0, 0, 44 * pulse);
        cg.addColorStop(0, `rgba(240, 249, 255, ${(0.34 * lockIn * k).toFixed(3)})`);
        cg.addColorStop(0.5, `rgba(34, 211, 238, ${(0.16 * lockIn * k).toFixed(3)})`);
        cg.addColorStop(1, 'rgba(34, 211, 238, 0)');
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.arc(0, 0, 44 * pulse, 0, TAU);
        ctx.fill();

        // Outer precision segmented ring
        ctx.save();
        ctx.rotate(t * 0.35);
        ctx.strokeStyle = `rgba(34, 211, 238, ${(0.52 * lockIn * k).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        for (let s = 0; s < 4; s++) {
          const a0 = (s / 4) * TAU + 0.14;
          ctx.beginPath();
          ctx.arc(0, 0, 32 * (1.25 - 0.25 * lockIn) * pulse, a0, a0 + 1.15);
          ctx.stroke();
        }
        ctx.restore();

        // Counter-rotating inner bio-indigo ring
        ctx.save();
        ctx.rotate(-t * 0.52);
        ctx.strokeStyle = `rgba(129, 140, 248, ${(0.48 * lockIn * k).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 21 * pulse, 0, TAU);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        ctx.restore();
      }

      // 2. High-speed Mach overdrive shock-rings at ignition (0.35 - 1.75s)
      if (t > 0.34 && t < 1.85) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const rt = clamp((t - 0.35 - i * 0.12) / 1.0, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 20 + easeOutCubic(rt) * Math.max(w, h) * (0.48 + i * 0.14);
          const a = (1 - rt) * (0.52 - i * 0.12) * k;
          ctx.strokeStyle = i === 0
            ? `rgba(240, 249, 255, ${a.toFixed(3)})`
            : `rgba(34, 211, 238, ${a.toFixed(3)})`;
          ctx.lineWidth = (2.2 - i * 0.45) * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Branching bio-neural circuit filaments & traveling synaptic light packets
      ctx.save();
      for (let i = 0; i < this.traces.length; i++) {
        const tr = this.traces[i];
        const grow = easeOutCubic(clamp((t - tr.delay) / 0.72, 0, 1));
        if (grow <= 0.01) continue;

        const segs = tr.pts.length - 1;
        const maxF = grow * segs;
        const full = Math.floor(maxF);
        const frac = maxF - full;

        ctx.beginPath();
        ctx.moveTo(tr.pts[0].x, tr.pts[0].y);
        for (let s = 1; s <= full; s++) ctx.lineTo(tr.pts[s].x, tr.pts[s].y);
        if (full < segs) {
          const p0 = tr.pts[full], p1 = tr.pts[full + 1];
          ctx.lineTo(p0.x + (p1.x - p0.x) * frac, p0.y + (p1.y - p0.y) * frac);
        }
        ctx.strokeStyle = tr.indigo
          ? `rgba(129, 140, 248, ${(0.28 * grow * k).toFixed(3)})`
          : `rgba(34, 211, 238, ${(0.30 * grow * k).toFixed(3)})`;
        ctx.lineWidth = 1.15;
        ctx.stroke();

        // Synaptic node dots at bends
        for (let s = 1; s <= full; s++) {
          ctx.fillStyle = `rgba(165, 243, 252, ${(0.42 * grow * k).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(tr.pts[s].x, tr.pts[s].y, 2.0, 0, TAU);
          ctx.fill();
        }

        // Traveling electric-white pulse packet along the neural trace
        if (grow > 0.6) {
          const u = (t * tr.speed + tr.phase) % 1;
          const pos = this._samplePolyline(tr.pts, u);
          const pa = Math.sin(u * Math.PI) * 0.85 * k;
          ctx.fillStyle = `rgba(240, 249, 255, ${pa.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2.6, 0, TAU);
          ctx.fill();
        }
      }
      ctx.restore();

      // 4. Crisp rising electric-cyan & azure overdrive sparks
      const sparkVis = clamp((t - 0.30) / 0.85, 0, 1);
      if (sparkVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.x += (sp.vx + Math.sin(t * 2.0 + sp.phase) * 8) * dt;
          sp.y += sp.vy * dt;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.41) % w; }
          if (sp.x < -10) sp.x = w + 10;
          if (sp.x > w + 10) sp.x = -10;

          const tw = 0.45 + 0.55 * Math.sin(t * 4.0 + sp.phase);
          const a = sp.alpha * tw * sparkVis * k;
          ctx.fillStyle = sp.indigo
            ? `rgba(129, 140, 248, ${a.toFixed(3)})`
            : `rgba(103, 232, 249, ${a.toFixed(3)})`;
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
      this.el.classList.remove('nu-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('nu-open');
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
      this.el.classList.remove('nu-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('nemu-panel');
      inst.delete(this.el);
    }
  }

  g.NemuPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new NemuEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
