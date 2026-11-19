/**
 * soifon-panel.js - Soi Fon (Jakuhō Raikōben — Bankai Hornet Markings & Detonation)
 * Entrance (0-3s):
 *   0.0-0.65s: Precision Jakuhō Raikōben segmented targeting rings & bold obsidian-gold Bankai hornet stripes lock on,
 *              stamping Soi Fon's iconic black-and-gold double-winged Bankai hornet marking across the backdrop
 *   0.65-1.7s: Blazing golden missile lance strikes the locked marking, detonating colossal concentric Bankai blast rings
 *   1.7-3.0s:  Settles into the prominent pulsing Bankai hornet crest, banded chevron markings, rotating reticle & wind sparks
 * Idle loop: Prominent obsidian-gold Bankai hornet marking + banded warhead stripes + rotating lock-on arcs + Shunpo streaks
 *
 * API: const sf = SoifonPanel.attach(sidebar, options);
 *      sf.open(); sf.close(); sf.replay(); sf.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 46,           // Line 17: golden blast embers & Shunpo wind streaks
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 202,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.46],     // Line 20: normalized [x, y] Bankai marking & lock-on center
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

  class SoifonEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.streaks = []; this.sparks = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'sf-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('soifon-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('sf-wash');
      this.wash.style.setProperty('--sf-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--sf-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'sf-layer sf-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('sf-flash');
      this.flash.style.setProperty('--sf-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--sf-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('sf-ring');

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
      const count = Math.max(14, Math.round(this.o.particles));
      const streakCount = Math.max(6, Math.round(count * 0.35));
      const sparkCount = Math.max(8, count - streakCount);
      this.simTime = 0;

      this.streaks = [];
      for (let i = 0; i < streakCount; i++) {
        this.streaks.push({
          x: r() * w,
          y: r() * h,
          len: 34 + r() * 72,
          speed: 220 + r() * 300,
          angle: -0.58 + (r() - 0.5) * 0.14,
          emerald: r() > 0.72,
          alpha: 0.18 + r() * 0.34
        });
      }

      this.sparks = [];
      for (let i = 0; i < sparkCount; i++) {
        this.sparks.push({
          x: r() * w,
          y: r() * h,
          vy: -(18 + r() * 38),
          vx: (r() - 0.5) * 20,
          size: 1.2 + r() * 2.4,
          amber: r() > 0.45,
          phase: r() * TAU,
          alpha: 0.34 + r() * 0.56
        });
      }
    }

    // Draws Soi Fon's iconic bold Bankai Hornet Markings (Jakuhō Raikōben stripe bands + grand Hōmonka crest + lock-on arcs)
    _drawBankaiMarkings(ctx, cx, cy, w, h, t, lockProg, blastFlare, k) {
      const sc = (Math.min(w, h) / 360) * (1 + Math.sin(t * 2.1) * 0.025 + blastFlare * 0.14);
      const a = clamp((0.55 + blastFlare * 0.45) * lockProg * k, 0, 0.94);

      // 1. Diagonal Jakuhō Raikōben black-and-gold hornet warhead stripe bands flanking top-right & bottom-left
      ctx.save();
      const drawStripeCorner = (ox, oy, ang) => {
        ctx.save();
        ctx.translate(ox, oy);
        ctx.rotate(ang);
        for (let i = 0; i < 4; i++) {
          const sx = -85 + i * 28;
          ctx.fillStyle = i % 2 === 0
            ? `rgba(250, 204, 21, ${(0.22 * lockProg * k).toFixed(3)})`
            : `rgba(12, 12, 16, ${(0.56 * lockProg * k).toFixed(3)})`;
          ctx.strokeStyle = `rgba(250, 204, 21, ${(0.34 * lockProg * k).toFixed(3)})`;
          ctx.lineWidth = 0.9;
          ctx.beginPath();
          ctx.moveTo(sx, -16);
          ctx.lineTo(sx + 16, -16);
          ctx.lineTo(sx + 6, 16);
          ctx.lineTo(sx - 10, 16);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      };
      drawStripeCorner(w * 0.80, h * 0.15, -0.45);
      drawStripeCorner(w * 0.22, h * 0.88, -0.45);
      ctx.restore();

      // 2. Central Bankai Hornet Marking Crest & Segmented Targeting Reticle
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);

      // Outer segmented Bankai lock-on targeting ring (counter-rotating)
      ctx.save();
      ctx.rotate(t * 0.24);
      const outerR = 114 * (1.28 - 0.28 * lockProg);
      ctx.strokeStyle = `rgba(250, 204, 21, ${(0.44 * a).toFixed(3)})`;
      ctx.lineWidth = 2.0;
      for (let i = 0; i < 6; i++) {
        const a0 = (i / 6) * TAU + 0.12;
        ctx.beginPath();
        ctx.arc(0, 0, outerR, a0, a0 + 0.72);
        ctx.stroke();
      }
      // 6 sharp inward targeting chevron ticks
      ctx.fillStyle = `rgba(254, 240, 138, ${(0.62 * a).toFixed(3)})`;
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU;
        ctx.save();
        ctx.rotate(ang);
        ctx.beginPath();
        ctx.moveTo(outerR - 2, 0);
        ctx.lineTo(outerR - 12, -3.5);
        ctx.lineTo(outerR - 12, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Inner hexagonal hornet-cell frame
      ctx.save();
      ctx.rotate(-t * 0.16);
      ctx.strokeStyle = `rgba(245, 158, 11, ${(0.52 * a).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * TAU - Math.PI / 6;
        const px = Math.cos(ang) * 86;
        const py = Math.sin(ang) * 86;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      // Iconic Grand Bankai Hornet-Butterfly Marking (bold obsidian-black + luminous gold filigree)
      ctx.fillStyle = `rgba(12, 11, 14, ${(0.84 * a).toFixed(3)})`;
      ctx.strokeStyle = blastFlare > 0.08
        ? `rgba(255, 253, 230, ${(0.95 * a).toFixed(3)})`
        : `rgba(250, 204, 21, ${(0.88 * a).toFixed(3)})`;
      ctx.lineWidth = 2.0;
      ctx.lineJoin = 'round';

      for (let s = -1; s <= 1; s += 2) {
        // Grand sweeping upper hornet-butterfly wing
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.bezierCurveTo(s * 26, -64, s * 84, -52, s * 72, -6);
        ctx.bezierCurveTo(s * 50, 10, s * 22, 6, 0, 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Inner golden Bankai marking stripe inside upper wing
        ctx.strokeStyle = `rgba(250, 204, 21, ${(0.72 * a).toFixed(3)})`;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(s * 16, -12);
        ctx.quadraticCurveTo(s * 44, -36, s * 58, -12);
        ctx.stroke();

        // Lower jagged stinger-wing
        ctx.strokeStyle = `rgba(250, 204, 21, ${(0.88 * a).toFixed(3)})`;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(0, 4);
        ctx.bezierCurveTo(s * 42, 12, s * 62, 46, s * 32, 64);
        ctx.bezierCurveTo(s * 16, 48, s * 9, 28, 0, 18);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Segmented black-and-gold striped hornet abdomen / stinger center
      ctx.fillStyle = `rgba(250, 204, 21, ${(0.92 * a).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(10, -4);
      ctx.lineTo(7, 26);
      ctx.lineTo(0, 56);
      ctx.lineTo(-7, 26);
      ctx.lineTo(-10, -4);
      ctx.closePath();
      ctx.fill();

      // Three unmistakable obsidian hornet stripes across the golden body
      ctx.fillStyle = `rgba(12, 11, 14, ${(0.92 * a).toFixed(3)})`;
      ctx.fillRect(-8.5, -2, 17, 5);
      ctx.fillRect(-7.5, 11, 15, 5);
      ctx.fillRect(-5.5, 24, 11, 5);

      // Swept hornet antennae
      ctx.strokeStyle = `rgba(254, 240, 138, ${(0.86 * a).toFixed(3)})`;
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-4, -32); ctx.quadraticCurveTo(-18, -52, -30, -56);
      ctx.moveTo(4, -32);  ctx.quadraticCurveTo(18, -52, 30, -56);
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

      // 1. Incoming Jakuhō Raikōben golden missile streak slamming into the target mark (0.28 - 0.72s)
      if (t > 0.24 && t < 0.76) {
        const lt = (t - 0.24) / 0.48;
        const prog = easeOutCubic(clamp(lt * 1.65, 0, 1));
        const fade = 1 - clamp((lt - 0.55) / 0.45, 0, 1);
        const sx = w * 1.15, sy = -30;
        const cx = sx + (ix - sx) * prog;
        const cy = sy + (iy - sy) * prog;

        ctx.save();
        const lg = ctx.createLinearGradient(sx, sy, cx, cy);
        lg.addColorStop(0, 'rgba(250, 204, 21, 0)');
        lg.addColorStop(0.7, `rgba(249, 115, 22, ${(fade * 0.72 * k).toFixed(3)})`);
        lg.addColorStop(1, `rgba(255, 253, 230, ${(fade * 0.96 * k).toFixed(3)})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = 6.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Bankai Hornet Marking Crest & Banded Targeting Reticle
      const lockProg = easeOutCubic(clamp(t / 0.58, 0, 1));
      const blastFlare = t > 0.52 ? Math.exp(-(t - 0.52) * 2.6) : 0;
      if (lockProg > 0.01) {
        this._drawBankaiMarkings(ctx, ix, iy, w, h, t, lockProg, blastFlare, k);
      }

      // 3. Massive Jakuhō Raikōben golden concentric Bankai shock-rings (0.52 - 2.0s)
      if (t > 0.50 && t < 2.15) {
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const rt = clamp((t - 0.52 - i * 0.11) / 1.15, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 16 + easeOutCubic(rt) * Math.max(w, h) * (0.54 + i * 0.15);
          const a = (1 - rt) * (0.60 - i * 0.11) * k;
          ctx.strokeStyle = i === 1
            ? `rgba(249, 115, 22, ${a.toFixed(3)})`
            : `rgba(250, 204, 21, ${a.toFixed(3)})`;
          ctx.lineWidth = (3.2 - i * 0.55) * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 4. Shunpo high-velocity diagonal wind streaks & amber-gold blast sparks
      const idleVis = clamp((t - 0.55) / 0.9, 0, 1);
      if (idleVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.streaks.length; i++) {
          const s = this.streaks[i];
          const dx = Math.cos(s.angle), dy = Math.sin(s.angle);
          s.x += dx * s.speed * dt;
          s.y += dy * s.speed * dt;
          if (s.x > w + 90 || s.y < -90) {
            s.x = -60 + ((i * 73) % (w + 60));
            s.y = h + 40 + ((i * 41) % 90);
          }
          const a = s.alpha * idleVis * k;
          const lg = ctx.createLinearGradient(s.x, s.y, s.x - dx * s.len, s.y - dy * s.len);
          lg.addColorStop(0, s.emerald ? `rgba(52, 211, 153, ${a.toFixed(3)})` : `rgba(250, 204, 21, ${a.toFixed(3)})`);
          lg.addColorStop(1, 'rgba(250, 204, 21, 0)');
          ctx.strokeStyle = lg;
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.moveTo(s.x, s.y);
          ctx.lineTo(s.x - dx * s.len, s.y - dy * s.len);
          ctx.stroke();
        }

        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.x += (sp.vx + Math.sin(t * 2.1 + sp.phase) * 10) * dt;
          sp.y += sp.vy * dt;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.43) % w; }
          if (sp.x < -10) sp.x = w + 10;
          if (sp.x > w + 10) sp.x = -10;

          const tw = 0.5 + 0.5 * Math.sin(t * 4.5 + sp.phase);
          const a = sp.alpha * tw * idleVis * k;
          ctx.fillStyle = sp.amber
            ? `rgba(249, 115, 22, ${a.toFixed(3)})`
            : `rgba(254, 240, 138, ${a.toFixed(3)})`;
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
      this.el.classList.remove('sf-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('sf-open');
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
      this.el.classList.remove('sf-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('soifon-panel');
      inst.delete(this.el);
    }
  }

  g.SoifonPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new SoifonEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
