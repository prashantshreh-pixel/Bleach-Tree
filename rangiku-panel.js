/**
 * rangiku-panel.js - Rangiku Matsumoto (Haineko / 灰猫 — Volumetric Ash-Fog)
 * Entrance (0-3s):
 *   0.0-0.8s:  Silver Haineko katana cuts across impact and dissolves tip-to-hilt into curling plumes of dense ash smoke
 *   0.8-2.1s:  Three parallax layers of billowing volumetric ash-fog banks roll in across the panel
 *   2.1-3.0s:  Settles into enveloping slow-drifting rolling ash-fog with suspended silver ash flecks & hidden blade glints
 * Idle loop: Layered volumetric smoky ash-fog drifting continuously + fine floating ash + crisp hidden razor flashes
 *
 * API: const rg = RangikuPanel.attach(sidebar, options);
 *      rg.open(); rg.close(); rg.replay(); rg.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 56,           // Line 17: volumetric ash-fog clouds + fine suspended ash specks
    intensity: 1.0,          // Line 18: fog density & glint multiplier (0.4 - 1.6)
    seed: 1010,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.46],     // Line 20: normalized [x, y] Haineko vaporization focal point
    anchor: '#sidebar-content'
  };

  const inst = new WeakMap();
  const TAU = Math.PI * 2;
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOutCubic = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  class RangikuEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.fogBanks = []; this.specks = []; this.slashes = [];
      this.puffSprites = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'rg-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    // Pre-render 3 soft multi-lobe volumetric ash-cloud sprites for silky 60fps fog rendering
    _buildFogSprites() {
      this.puffSprites = [];
      if (typeof document === 'undefined') return;
      const r = mulberry32(this.o.seed + 77);
      const tones = [
        [226, 232, 240], // pale silver ash veil
        [168, 179, 196], // mid smoky ash cloud
        [100, 114, 134]  // dense slate-ash fog bank
      ];
      for (let s = 0; s < 3; s++) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const cctx = c.getContext && c.getContext('2d');
        if (!cctx) continue;
        const [cr, cg, cb] = tones[s];
        // Compose 7 overlapping soft lobes for natural cloudy ash volume
        for (let lobe = 0; lobe < 7; lobe++) {
          const ox = 64 + (r() - 0.5) * 44;
          const oy = 64 + (r() - 0.5) * 32;
          const rad = 24 + r() * 26;
          const gGrad = cctx.createRadialGradient(ox, oy, 2, ox, oy, rad);
          gGrad.addColorStop(0, `rgba(${cr},${cg},${cb},0.34)`);
          gGrad.addColorStop(0.55, `rgba(${cr},${cg},${cb},0.14)`);
          gGrad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          cctx.fillStyle = gGrad;
          cctx.beginPath();
          cctx.arc(ox, oy, rad, 0, TAU);
          cctx.fill();
        }
        this.puffSprites.push(c);
      }
    }

    _build() {
      const el = this.el;
      el.classList.add('rangiku-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('rg-wash');
      this.wash.style.setProperty('--rg-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--rg-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'rg-layer rg-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('rg-flash');
      this.ring = this._div('rg-ring');

      this.layers = [this.wash, this.canvas, this.flash, this.ring];
      this.layers.forEach(n => el.insertBefore(n, ref));

      this._buildFogSprites();
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
      const count = Math.max(16, Math.round(this.o.particles));
      const fogCount = Math.max(14, Math.min(34, Math.round(count * 0.48)));
      const speckCount = Math.max(10, count - fogCount);
      this.simTime = 0;

      // Multi-depth rolling volumetric ash-fog banks
      this.fogBanks = [];
      for (let i = 0; i < fogCount; i++) {
        const tier = i % 3; // 0=deep low fog, 1=mid billowing smoke, 2=high airy silver mist
        const baseY = tier === 0
          ? h * (0.64 + r() * 0.38)
          : (tier === 1 ? h * (0.28 + r() * 0.56) : h * (0.08 + r() * 0.64));
        const dir = tier === 1 ? -1 : 1;
        this.fogBanks.push({
          tier,
          spriteIdx: tier,
          bx: ix + (r() - 0.5) * 90,
          by: iy + (r() - 0.5) * 50,
          x: r() * (w + 180) - 90,
          y: baseY,
          rx: (tier === 0 ? 135 : (tier === 1 ? 115 : 95)) + r() * 65,
          ry: (tier === 0 ? 85 : (tier === 1 ? 74 : 62)) + r() * 38,
          vx: dir * ((tier === 0 ? 10 : (tier === 1 ? 16 : 22)) + r() * 14),
          bobAmp: 8 + r() * 14,
          bobSpeed: 0.45 + r() * 0.6,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 0.16,
          phase: r() * TAU,
          alpha: (tier === 0 ? 0.52 : (tier === 1 ? 0.42 : 0.34)) + r() * 0.18,
          delay: 0.24 + r() * 0.52
        });
      }

      // Fine suspended microscopic ash grains drifting inside the fog
      this.specks = [];
      for (let i = 0; i < speckCount; i++) {
        this.specks.push({
          x: r() * w,
          y: r() * h,
          vx: 8 + r() * 20,
          vy: -(4 + r() * 14),
          size: 0.8 + r() * 1.9,
          phase: r() * TAU,
          glintFreq: 1.4 + r() * 2.4,
          alpha: 0.24 + r() * 0.52
        });
      }

      // Hidden Haineko blade-slash glints cutting silently through the fog
      this.slashes = [
        { x0: 0.14, y0: 0.62, x1: 0.86, y1: 0.34, start: 1.15, period: 5.2 },
        { x0: 0.82, y0: 0.76, x1: 0.18, y1: 0.52, start: 3.40, period: 5.8 }
      ];
    }

    _drawCloud(ctx, fb, x, y, alpha) {
      const spr = this.puffSprites[fb.spriteIdx];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(fb.rot);
      if (spr && typeof ctx.drawImage === 'function') {
        ctx.globalAlpha = clamp(alpha, 0, 0.95);
        ctx.drawImage(spr, -fb.rx, -fb.ry, fb.rx * 2, fb.ry * 2);
        ctx.globalAlpha = 1;
      } else {
        // Fallback radial fog puff if drawImage is unavailable (e.g., headless mock)
        const gGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, fb.rx);
        gGrad.addColorStop(0, `rgba(203, 213, 225, ${(alpha * 0.48).toFixed(3)})`);
        gGrad.addColorStop(0.6, `rgba(148, 163, 184, ${(alpha * 0.18).toFixed(3)})`);
        gGrad.addColorStop(1, 'rgba(148, 163, 184, 0)');
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, fb.rx, fb.ry, 0, 0, TAU);
        ctx.fill();
      }
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

      // 1. Soft dense ash-fog floor bank anchoring the bottom
      const floorVis = easeOutCubic(clamp((t - 0.35) / 1.35, 0, 1));
      if (floorVis > 0.01) {
        const fg = ctx.createLinearGradient(0, h, 0, h * 0.32);
        fg.addColorStop(0, `rgba(148, 163, 184, ${(0.34 * floorVis * k).toFixed(3)})`);
        fg.addColorStop(0.45, `rgba(203, 213, 225, ${(0.14 * floorVis * k).toFixed(3)})`);
        fg.addColorStop(1, 'rgba(203, 213, 225, 0)');
        ctx.fillStyle = fg;
        ctx.fillRect(0, h * 0.32, w, h * 0.68);
      }

      // 2. Haineko silver katana vaporizing tip-to-hilt into ash-fog (0.0 - 0.98s)
      if (t < 1.02) {
        const appear = clamp(t / 0.18, 0, 1);
        const dissolve = clamp((t - 0.22) / 0.74, 0, 1);
        const rem = 1 - dissolve;
        if (rem > 0.02) {
          const x0 = ix - w * 0.34, y0 = iy + h * 0.14;
          const x1 = lerp(x0, ix + w * 0.34, rem);
          const y1 = lerp(y0, iy - h * 0.14, rem);
          ctx.save();
          ctx.strokeStyle = `rgba(241, 245, 249, ${(appear * rem * 0.85 * k).toFixed(3)})`;
          ctx.lineWidth = 2.8;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();

          // Billowing vaporization puff right at the eroding tip
          const pg = ctx.createRadialGradient(x1, y1, 2, x1, y1, 34);
          pg.addColorStop(0, `rgba(248, 250, 252, ${(appear * 0.62 * k).toFixed(3)})`);
          pg.addColorStop(0.5, `rgba(148, 163, 184, ${(appear * 0.34 * k).toFixed(3)})`);
          pg.addColorStop(1, 'rgba(148, 163, 184, 0)');
          ctx.fillStyle = pg;
          ctx.beginPath();
          ctx.arc(x1, y1, 34, 0, TAU);
          ctx.fill();
          ctx.restore();
        }
      }

      // 3. Multi-depth volumetric rolling ash-fog clouds (billow out from blade -> drift endlessly)
      const spreadMix = easeOutCubic(clamp((t - 0.35) / 1.65, 0, 1));
      for (let i = 0; i < this.fogBanks.length; i++) {
        const fb = this.fogBanks[i];
        if (t < fb.delay) continue;
        const lt = t - fb.delay;
        fb.rot += fb.rotS * dt;
        fb.x += fb.vx * dt;
        if (fb.vx > 0 && fb.x - fb.rx > w + 40) fb.x = -fb.rx - 30;
        if (fb.vx < 0 && fb.x + fb.rx < -40) fb.x = w + fb.rx + 30;

        const targetY = fb.y + Math.sin(t * fb.bobSpeed + fb.phase) * fb.bobAmp;
        const drawX = lerp(fb.bx, fb.x, spreadMix);
        const drawY = lerp(fb.by, targetY, spreadMix);
        const fadeIn = easeOutCubic(clamp(lt / 0.85, 0, 1));
        const breathe = 0.82 + 0.18 * Math.sin(t * 0.9 + fb.phase);
        this._drawCloud(ctx, fb, drawX, drawY, fb.alpha * fadeIn * breathe * k);
      }

      // 4. Hidden Haineko razor slash-glints flickering inside the ash-fog
      ctx.save();
      for (let i = 0; i < this.slashes.length; i++) {
        const sl = this.slashes[i];
        const local = t - sl.start;
        if (local < 0) continue;
        const cyc = (local % sl.period) / 0.62;
        if (cyc > 1) continue;
        const sweep = easeOutCubic(clamp(cyc * 1.9, 0, 1));
        const fade = 1 - clamp((cyc - 0.25) / 0.75, 0, 1);
        const x0 = w * sl.x0, y0 = h * sl.y0;
        const x1 = lerp(x0, w * sl.x1, sweep);
        const y1 = lerp(y0, h * sl.y1, sweep);

        const lg = ctx.createLinearGradient(x0, y0, x1, y1);
        lg.addColorStop(0, 'rgba(226, 232, 240, 0)');
        lg.addColorStop(0.65, `rgba(255, 255, 255, ${(fade * 0.72 * k).toFixed(3)})`);
        lg.addColorStop(1, `rgba(253, 186, 116, ${(fade * 0.45 * k).toFixed(3)})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = 1.6 * fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();

      // 5. Fine suspended ash specks & sharp metallic glints floating in the fog
      const speckVis = clamp((t - 0.35) / 1.0, 0, 1);
      if (speckVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.specks.length; i++) {
          const sp = this.specks[i];
          sp.x += (sp.vx + Math.sin(t * 0.8 + sp.phase) * 9) * dt;
          sp.y += sp.vy * dt;
          if (sp.x > w + 10) sp.x = -10;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.31) % w; }

          const glint = Math.pow(Math.max(0, Math.sin(t * sp.glintFreq + sp.phase)), 16);
          const a = sp.alpha * speckVis * k;
          if (glint > 0.35) {
            const rStar = sp.size * (2.4 + glint * 2.0);
            ctx.fillStyle = `rgba(255, 255, 255, ${clamp(a * 1.4, 0, 0.95).toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y - rStar);
            ctx.lineTo(sp.x + rStar * 0.25, sp.y - rStar * 0.25);
            ctx.lineTo(sp.x + rStar, sp.y);
            ctx.lineTo(sp.x + rStar * 0.25, sp.y + rStar * 0.25);
            ctx.lineTo(sp.x, sp.y + rStar);
            ctx.lineTo(sp.x - rStar * 0.25, sp.y + rStar * 0.25);
            ctx.lineTo(sp.x - rStar, sp.y);
            ctx.lineTo(sp.x - rStar * 0.25, sp.y - rStar * 0.25);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillStyle = `rgba(226, 232, 240, ${(a * 0.72).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, sp.size, 0, TAU);
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

    open() {
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.isOpen = true;
      this.el.classList.remove('rg-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('rg-open');
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
      this.el.classList.remove('rg-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('rangiku-panel');
      inst.delete(this.el);
    }
  }

  g.RangikuPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new RangikuEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
