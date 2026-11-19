/**
 * momo-panel.js - Momo Hinamori (Tobiume / 飛梅 — Burning Forked Sword)
 * Entrance (0-3s):
 *   0.0-0.75s: Tobiume's signature forked 3-pronged katana materializes & ignites white-hot hilt-to-tip
 *   0.75-1.9s: Blazing orange-scarlet fireballs launch directly off the three burning prongs, blooming into scorched rings
 *   1.9-3.0s:  Settles into the superheated smoldering forked blade radiating licking flame-veils & rising embers
 * Idle loop: Glowing molten forked Tobiume blade with living flame edges, periodic prong fireball launches & sparks
 *
 * API: const mm = MomoPanel.attach(sidebar, options);
 *      mm.open(); mm.close(); mm.replay(); mm.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 56,           // Line 17: burning embers, heat sparks & ash-cinders count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 505,               // Line 19: deterministic PRNG seed
    impact: [0.62, 0.56],    // Line 20: normalized [x, y] Tobiume ignition center
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

  class MomoEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.embers = []; this.fireballs = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'mm-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('momo-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('mm-wash');
      this.wash.style.setProperty('--mm-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--mm-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'mm-layer mm-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('mm-flash');
      this.flash.style.setProperty('--mm-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--mm-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('mm-ring');

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
      this.simTime = 0;

      // Blazing fireballs launched from Tobiume's three forked tips
      this.fireballs = [
        { tip: 0, tx: 0.24, ty: 0.22, start: 0.56, period: 4.8, maxR: 52 },
        { tip: 1, tx: 0.78, ty: 0.26, start: 0.86, period: 5.4, maxR: 46 },
        { tip: 2, tx: 0.34, ty: 0.44, start: 1.18, period: 5.9, maxR: 48 }
      ];

      // Burning sword embers & glowing heat cinders
      this.embers = [];
      for (let i = 0; i < count; i++) {
        const nearSword = r() > 0.38;
        this.embers.push({
          x: nearSword ? w * (0.34 + r() * 0.56) : r() * w,
          y: h * (0.20 + r() * 0.84),
          vy: -(22 + r() * 48),
          vx: (r() - 0.5) * 18,
          size: 1.0 + r() * 2.6,
          swayP: r() * TAU,
          swayS: 1.4 + r() * 2.2,
          tone: r(), // gold / orange / plum-red
          streak: r() > 0.65,
          alpha: 0.34 + r() * 0.58
        });
      }
    }

    // Draws Tobiume's distinctive 3-pronged forked katana glowing white-hot with licking blade flames
    _drawBurningTobiume(ctx, w, h, t, ignite, k) {
      const cx = w * this.o.impact[0];
      const cy = h * this.o.impact[1];
      const scale = Math.min(w, h) / 360;
      const pulse = 0.78 + 0.22 * Math.sin(t * 3.4);
      const angle = -0.34 + Math.sin(t * 0.8) * 0.015;

      // Compute exact tip coordinates in screen space so fireballs launch directly off the prongs
      const localToWorld = (lx, ly) => {
        const sx = lx * scale, sy = ly * scale;
        const c = Math.cos(angle), s = Math.sin(angle);
        return { x: cx + sx * c - sy * s, y: cy + sx * s + sy * c };
      };
      const tips = [
        localToWorld(0, -182),      // Main central blade tip
        localToWorld(46, -124),     // Upper-right forked branch prong
        localToWorld(-44, -84)      // Lower-left forked branch prong
      ];

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      // 1. Living flickering flame veil hugging the burning sword edges
      const flameLayers = [
        { width: 28, col: `rgba(220, 38, 38, ${(0.24 * ignite * pulse * k).toFixed(3)})`, speed: 5.5, amp: 9 },
        { width: 17, col: `rgba(255, 107, 53, ${(0.34 * ignite * pulse * k).toFixed(3)})`, speed: 7.4, amp: 6.5 },
        { width: 9,  col: `rgba(254, 240, 138, ${(0.42 * ignite * pulse * k).toFixed(3)})`, speed: 9.2, amp: 3.8 }
      ];
      for (let f = 0; f < flameLayers.length; f++) {
        const fl = flameLayers[f];
        ctx.fillStyle = fl.col;
        ctx.beginPath();
        ctx.moveTo(0, 48);
        for (let y = 44; y >= -190; y -= 12) {
          const frac = clamp((48 - y) / 238, 0, 1);
          const taper = Math.sin(frac * Math.PI);
          const lick = Math.sin(y * 0.065 + t * fl.speed + f * 1.4) * fl.amp * taper;
          ctx.lineTo(fl.width * (0.45 + 0.55 * taper) + lick, y);
        }
        ctx.lineTo(0, -198 - Math.sin(t * fl.speed) * 6);
        for (let y = -190; y <= 44; y += 12) {
          const frac = clamp((48 - y) / 238, 0, 1);
          const taper = Math.sin(frac * Math.PI);
          const lick = Math.cos(y * 0.07 - t * fl.speed + f) * fl.amp * taper;
          ctx.lineTo(-fl.width * (0.45 + 0.55 * taper) + lick, y);
        }
        ctx.closePath();
        ctx.fill();
      }

      // 2. Forged Tobiume 3-pronged forked blade body (dark heated steel + glowing orange-white edge)
      const heatGrad = ctx.createLinearGradient(0, 56, 0, -184);
      heatGrad.addColorStop(0, `rgba(60, 14, 14, ${(0.82 * ignite * k).toFixed(3)})`);
      heatGrad.addColorStop(0.45, `rgba(185, 28, 28, ${(0.78 * ignite * k).toFixed(3)})`);
      heatGrad.addColorStop(0.78, `rgba(255, 107, 53, ${(0.88 * ignite * k).toFixed(3)})`);
      heatGrad.addColorStop(1, `rgba(254, 249, 195, ${(0.95 * ignite * k).toFixed(3)})`);

      ctx.fillStyle = heatGrad;
      ctx.strokeStyle = `rgba(254, 240, 138, ${(0.78 * ignite * pulse * k).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.lineJoin = 'round';

      // Main blade shaft
      ctx.beginPath();
      ctx.moveTo(-6, 54);
      ctx.lineTo(-4.8, -148);
      ctx.lineTo(0, -184);
      ctx.lineTo(4.8, -148);
      ctx.lineTo(6, 54);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Right forked plum-branch prong (curves up-right)
      ctx.beginPath();
      ctx.moveTo(4, -56);
      ctx.quadraticCurveTo(32, -74, 46, -124);
      ctx.quadraticCurveTo(22, -96, 4.5, -82);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Left forked plum-branch prong (curves up-left)
      ctx.beginPath();
      ctx.moveTo(-4, -18);
      ctx.quadraticCurveTo(-30, -34, -44, -84);
      ctx.quadraticCurveTo(-20, -56, -4.5, -42);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Incandescent white-hot center fuller & prong veins racing up during entrance
      const veinProg = easeOutCubic(clamp(t / 0.72, 0, 1));
      ctx.strokeStyle = `rgba(255, 255, 240, ${(0.88 * veinProg * pulse * k).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 48);
      ctx.lineTo(0, 48 - 226 * veinProg);
      if (veinProg > 0.45) {
        ctx.moveTo(-4, -30);
        ctx.quadraticCurveTo(-24, -48, -42 * veinProg, -82 * veinProg);
      }
      if (veinProg > 0.62) {
        ctx.moveTo(4, -68);
        ctx.quadraticCurveTo(26, -86, 44 * veinProg, -121 * veinProg);
      }
      ctx.stroke();

      // Plum-blossom tsuba guard + crimson-wrapped hilt
      ctx.fillStyle = `rgba(42, 12, 16, ${(0.88 * ignite * k).toFixed(3)})`;
      ctx.strokeStyle = `rgba(251, 113, 133, ${(0.72 * ignite * k).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, 56, 18, 6.5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = `rgba(28, 10, 14, ${(0.85 * ignite * k).toFixed(3)})`;
      ctx.fillRect(-5.5, 62, 11, 66);
      ctx.strokeStyle = `rgba(251, 113, 133, ${(0.55 * ignite * k).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      for (let gy = 68; gy <= 122; gy += 10) {
        ctx.beginPath();
        ctx.moveTo(-5, gy); ctx.lineTo(5, gy + 5);
        ctx.moveTo(5, gy);  ctx.lineTo(-5, gy + 5);
        ctx.stroke();
      }

      // Glowing heat-shimmer halos at all 3 burning prong tips
      const tipPts = [[0, -182], [46, -124], [-44, -84]];
      for (let i = 0; i < tipPts.length; i++) {
        const [tx, ty] = tipPts[i];
        const rad = 18 + Math.sin(t * 5.2 + i * 1.7) * 4;
        const tg = ctx.createRadialGradient(tx, ty, 1, tx, ty, rad);
        tg.addColorStop(0, `rgba(255, 255, 230, ${(0.78 * ignite * k).toFixed(3)})`);
        tg.addColorStop(0.45, `rgba(255, 107, 53, ${(0.42 * ignite * k).toFixed(3)})`);
        tg.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(tx, ty, rad, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      return tips;
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);

      ctx.clearRect(0, 0, w, h);

      // 1. Rising heat-glow floor behind the burning blade
      const ignite = easeOutCubic(clamp(t / 0.72, 0, 1));
      if (ignite > 0.01) {
        const hg = ctx.createLinearGradient(0, h, 0, h * 0.42);
        hg.addColorStop(0, `rgba(234, 88, 12, ${(0.24 * ignite * k).toFixed(3)})`);
        hg.addColorStop(0.55, `rgba(220, 38, 38, ${(0.09 * ignite * k).toFixed(3)})`);
        hg.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = hg;
        ctx.fillRect(0, h * 0.42, w, h * 0.58);
      }

      // 2. Superheated forked Tobiume katana + licking blade flames
      const tips = this._drawBurningTobiume(ctx, w, h, t, ignite, k);

      // 3. Incandescent fireballs launching off the burning prongs & bursting into scorched rings
      ctx.save();
      for (let i = 0; i < this.fireballs.length; i++) {
        const fb = this.fireballs[i];
        const local = t - fb.start;
        if (local < 0) continue;
        const cyc = (local % fb.period) / 1.55;
        if (cyc > 1) continue;

        const origin = tips[fb.tip];
        const endX = w * fb.tx;
        const endY = h * fb.ty;

        if (cyc < 0.45) {
          // Launching fiery orb arcing from prong tip toward detonation point
          const u = easeOutCubic(cyc / 0.45);
          const ox = origin.x + (endX - origin.x) * u;
          const oy = origin.y + (endY - origin.y) * u - Math.sin(u * Math.PI) * 28;
          const og = ctx.createRadialGradient(ox, oy, 1, ox, oy, 18);
          og.addColorStop(0, `rgba(255, 255, 240, ${(0.90 * k).toFixed(3)})`);
          og.addColorStop(0.45, `rgba(255, 107, 53, ${(0.62 * k).toFixed(3)})`);
          og.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = og;
          ctx.beginPath();
          ctx.arc(ox, oy, 18, 0, TAU);
          ctx.fill();

          // Molten fire trail back toward the prong
          const lg = ctx.createLinearGradient(origin.x, origin.y, ox, oy);
          lg.addColorStop(0, 'rgba(255, 107, 53, 0)');
          lg.addColorStop(1, `rgba(254, 240, 138, ${(0.58 * k).toFixed(3)})`);
          ctx.strokeStyle = lg;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(origin.x, origin.y);
          ctx.quadraticCurveTo((origin.x + ox) * 0.5, (origin.y + oy) * 0.5 - 18, ox, oy);
          ctx.stroke();
        } else {
          // Fiery plum-scorch starburst detonation
          const bu = (cyc - 0.45) / 0.55;
          const expand = easeOutCubic(bu);
          const fade = 1 - bu;
          const rad = fb.maxR * expand;

          const bg = ctx.createRadialGradient(endX, endY, 1, endX, endY, rad);
          bg.addColorStop(0, `rgba(254, 249, 195, ${(fade * 0.65 * k).toFixed(3)})`);
          bg.addColorStop(0.45, `rgba(255, 107, 53, ${(fade * 0.36 * k).toFixed(3)})`);
          bg.addColorStop(1, 'rgba(220, 38, 38, 0)');
          ctx.fillStyle = bg;
          ctx.beginPath();
          ctx.arc(endX, endY, rad, 0, TAU);
          ctx.fill();

          ctx.strokeStyle = `rgba(251, 113, 133, ${(fade * 0.55 * k).toFixed(3)})`;
          ctx.lineWidth = 1.6 * fade;
          ctx.beginPath();
          ctx.arc(endX, endY, rad * 0.92, 0, TAU);
          ctx.stroke();

          // Five blazing fiery streaks radiating outward like a scorching plum blossom
          for (let p = 0; p < 5; p++) {
            const a = (p / 5) * TAU + i * 0.5;
            const x1 = endX + Math.cos(a) * rad * 0.35;
            const y1 = endY + Math.sin(a) * rad * 0.35;
            const x2 = endX + Math.cos(a) * rad * 1.05;
            const y2 = endY + Math.sin(a) * rad * 1.05;
            ctx.strokeStyle = `rgba(254, 240, 138, ${(fade * 0.72 * k).toFixed(3)})`;
            ctx.lineWidth = 1.4 * fade;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }
      ctx.restore();

      // 4. Rising burning embers & bright forge sparks
      const emberVis = clamp((t - 0.18) / 0.8, 0, 1);
      if (emberVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.embers.length; i++) {
          const e = this.embers[i];
          e.swayP += e.swayS * dt;
          e.y += e.vy * dt;
          e.x += (e.vx + Math.sin(e.swayP) * 18) * dt;
          if (e.y < -16) {
            e.y = h + 12;
            e.x = w * (0.12 + ((i * 37) % 78) / 100);
          }
          if (e.x < -12) e.x = w + 12;
          if (e.x > w + 12) e.x = -12;

          const flicker = 0.55 + 0.45 * Math.sin(t * 6.5 + e.swayP);
          const a = e.alpha * flicker * emberVis * k;
          const col = e.tone < 0.34
            ? `rgba(254, 240, 138, ${a.toFixed(3)})`
            : (e.tone < 0.72 ? `rgba(255, 107, 53, ${a.toFixed(3)})` : `rgba(251, 113, 133, ${a.toFixed(3)})`);

          if (e.streak) {
            ctx.strokeStyle = col;
            ctx.lineWidth = Math.max(1, e.size * 0.65);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(e.x, e.y);
            ctx.lineTo(e.x - e.vx * 0.12, e.y - e.vy * 0.16);
            ctx.stroke();
          } else {
            ctx.fillStyle = col;
            ctx.beginPath();
            ctx.arc(e.x, e.y, e.size, 0, TAU);
            ctx.fill();
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
      this.el.classList.remove('mm-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('mm-open');
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
      this.el.classList.remove('mm-open');
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
      this.el.classList.remove('momo-panel');
      inst.delete(this.el);
    }
  }

  g.MomoPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new MomoEffect(el, opts);
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
