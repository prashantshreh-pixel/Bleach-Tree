/**
 * yachiru-panel.js - Yachiru Kusajishi (Awakened Bankai Spirit / Nozarashi)
 * Entrance (0-3s):
 *   0.0-0.6s:  Crimson-magenta reiatsu shock-rings surge outward as rising spirit flames gather below
 *   0.6-1.8s:  Yachiru's manifested Bankai Oni-Spirit ascends from the abyss — curved glowing horns ignite,
 *              blazing feral golden-white eyes snap open, and staggered spectral mimic slashes tear across
 *   1.8-3.0s:  Settles into the breathing, levitating Bankai Spirit silhouette wreathed in flowing magenta-crimson
 *              spiritual flames, glowing eyes, and drifting sakura-crimson spirit wisps
 * Idle loop: Living undulating Bankai Oni-Spirit aura, pulsing demon eyes & horns, rising spirit wisps & echo slashes
 *
 * API: const yc = YachiruPanel.attach(sidebar, options);
 *      yc.open(); yc.close(); yc.replay(); yc.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 54,           // Line 17: rising Bankai spirit wisps & golden sparks count
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 1111,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.48],     // Line 20: normalized [x, y] Bankai spirit manifestation focus
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

  class YachiruEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.wisps = []; this.flames = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'yc-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('yachiru-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('yc-wash');
      this.wash.style.setProperty('--yc-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--yc-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'yc-layer yc-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('yc-flash');
      this.flash.style.setProperty('--yc-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--yc-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('yc-ring');

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

      // Wild spiritual flame-mane tendrils flowing up from the Bankai Spirit
      this.flames = [];
      for (let i = 0; i < 11; i++) {
        const frac = (i / 10) - 0.5; // -0.5 .. +0.5
        this.flames.push({
          xOff: frac * 155,
          yOff: -12 + Math.abs(frac) * 44,
          len: 68 + (1 - Math.abs(frac) * 1.4) * 58 + r() * 24,
          width: 14 + r() * 12,
          lean: frac * 0.65,
          phase: r() * TAU,
          speed: 3.0 + r() * 2.2
        });
      }

      // Rising Bankai crimson-magenta spirit wisps & blazing golden-pink sparks
      this.wisps = [];
      for (let i = 0; i < count; i++) {
        this.wisps.push({
          x: r() * w,
          y: r() * h,
          vy: -(20 + r() * 44),
          vx: (r() - 0.5) * 14,
          size: 1.2 + r() * 2.9,
          swayP: r() * TAU,
          swayS: 1.3 + r() * 1.9,
          tone: r(), // crimson / magenta / gold
          isRibbon: r() > 0.72,
          alpha: 0.30 + r() * 0.58
        });
      }
    }

    // Draws Yachiru's manifested Bankai Oni-Spirit (Nozarashi): spirit-flames, curved horns, piercing eyes & tattered aura
    _drawBankaiSpirit(ctx, w, h, t, rise, k) {
      const cx = w * this.o.impact[0];
      const baseCy = h * (this.o.impact[1] + 0.08);
      const lift = (1 - rise) * 78;
      const floatY = Math.sin(t * 1.55) * 7;
      const cy = baseCy + lift + floatY;
      const sc = Math.min(w, h) / 360;
      const breathe = 1 + Math.sin(t * 2.1) * 0.025;
      const alpha = rise * k;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc * breathe, sc * breathe);

      // 1. Towering translucent crimson-magenta spiritual aura backdrop
      const auraGrad = ctx.createRadialGradient(0, -18, 12, 0, 12, 168);
      auraGrad.addColorStop(0, `rgba(244, 63, 94, ${(0.34 * alpha).toFixed(3)})`);
      auraGrad.addColorStop(0.48, `rgba(236, 72, 153, ${(0.20 * alpha).toFixed(3)})`);
      auraGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.ellipse(0, 6, 155, 195, 0, 0, TAU);
      ctx.fill();

      // 2. Wild undulating Bankai spiritual flame-mane tendrils surging upward
      for (let i = 0; i < this.flames.length; i++) {
        const fl = this.flames[i];
        const wave = Math.sin(t * fl.speed + fl.phase) * 14;
        const tipX = fl.xOff + fl.lean * fl.len + wave;
        const tipY = fl.yOff - fl.len;

        const fg = ctx.createLinearGradient(fl.xOff, fl.yOff + 40, tipX, tipY);
        fg.addColorStop(0, `rgba(159, 18, 57, ${(0.36 * alpha).toFixed(3)})`);
        fg.addColorStop(0.55, `rgba(244, 63, 94, ${(0.26 * alpha).toFixed(3)})`);
        fg.addColorStop(1, 'rgba(236, 72, 153, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(fl.xOff - fl.width, fl.yOff + 48);
        ctx.quadraticCurveTo(fl.xOff - fl.width * 0.5 + wave * 0.5, fl.yOff - fl.len * 0.45, tipX, tipY);
        ctx.quadraticCurveTo(fl.xOff + fl.width * 0.5 + wave * 0.3, fl.yOff - fl.len * 0.45, fl.xOff + fl.width, fl.yOff + 48);
        ctx.closePath();
        ctx.fill();
      }

      // 3. Ethereal draped Oni-Spirit shoulders, tattered spirit robe & head silhouette
      const bodyGrad = ctx.createLinearGradient(0, -76, 0, 175);
      bodyGrad.addColorStop(0, `rgba(42, 8, 24, ${(0.76 * alpha).toFixed(3)})`);
      bodyGrad.addColorStop(0.45, `rgba(136, 19, 55, ${(0.56 * alpha).toFixed(3)})`);
      bodyGrad.addColorStop(1, 'rgba(22, 5, 16, 0)');
      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = `rgba(244, 63, 94, ${(0.45 * alpha).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-118, 172);
      ctx.bezierCurveTo(-112, 84, -84, 34, -46, 18);
      ctx.bezierCurveTo(-52, -16, -42, -56, 0, -64);
      ctx.bezierCurveTo(42, -56, 52, -16, 46, 18);
      ctx.bezierCurveTo(84, 34, 112, 84, 118, 172);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Jagged ethereal collar / spiritual armor crest across shoulders
      ctx.strokeStyle = `rgba(251, 207, 232, ${(0.34 * alpha).toFixed(3)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(-68, 36);
      ctx.lineTo(-34, 54);
      ctx.lineTo(0, 38);
      ctx.lineTo(34, 54);
      ctx.lineTo(68, 36);
      ctx.stroke();

      // 4. Iconic curved Bankai Oni-Spirit horns (luminous ivory-pink with rose-crimson rim)
      const hornIgnite = easeOutCubic(clamp((t - 0.32) / 0.75, 0, 1));
      if (hornIgnite > 0.01) {
        for (let s = -1; s <= 1; s += 2) {
          const hg = ctx.createLinearGradient(s * 24, -46, s * 78, -124);
          hg.addColorStop(0, `rgba(159, 18, 57, ${(0.78 * hornIgnite * alpha).toFixed(3)})`);
          hg.addColorStop(0.55, `rgba(244, 114, 182, ${(0.82 * hornIgnite * alpha).toFixed(3)})`);
          hg.addColorStop(1, `rgba(255, 241, 246, ${(0.95 * hornIgnite * alpha).toFixed(3)})`);
          ctx.fillStyle = hg;
          ctx.strokeStyle = `rgba(253, 224, 71, ${(0.55 * hornIgnite * alpha).toFixed(3)})`;
          ctx.lineWidth = 1.1;

          ctx.beginPath();
          ctx.moveTo(s * 22, -46);
          ctx.bezierCurveTo(s * 54, -56, s * 86, -86, s * 72, -126 * hornIgnite - 20 * (1 - hornIgnite));
          ctx.bezierCurveTo(s * 66, -94, s * 44, -74, s * 34, -36);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Secondary lower cheek-spike / brow horn accent
          ctx.beginPath();
          ctx.moveTo(s * 36, -24);
          ctx.quadraticCurveTo(s * 62, -32, s * 74, -50);
          ctx.quadraticCurveTo(s * 54, -20, s * 38, -14);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 5. Piercing blazing feral Bankai Spirit eyes (snap open at 0.44s & glow golden-white)
      const eyeOpen = easeOutCubic(clamp((t - 0.44) / 0.36, 0, 1));
      if (eyeOpen > 0.01) {
        const eyeFlare = t > 0.44 ? Math.exp(-(t - 0.44) * 2.8) * 0.55 : 0;
        const eyePulse = 0.84 + 0.16 * Math.sin(t * 3.1) + eyeFlare;

        for (let s = -1; s <= 1; s += 2) {
          const ex = s * 17;
          const ey = -22;

          // Eye glow halo
          const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 20 * eyePulse);
          eg.addColorStop(0, `rgba(254, 249, 195, ${(0.82 * eyeOpen * alpha).toFixed(3)})`);
          eg.addColorStop(0.45, `rgba(253, 224, 71, ${(0.42 * eyeOpen * alpha).toFixed(3)})`);
          eg.addColorStop(1, 'rgba(244, 63, 94, 0)');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(ex, ey, 20 * eyePulse, 0, TAU);
          ctx.fill();

          // Sharp tilted fierce Oni eye shape
          ctx.fillStyle = `rgba(255, 253, 232, ${clamp(0.95 * eyeOpen * alpha, 0, 0.98).toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(ex - s * 11, ey + 3);
          ctx.quadraticCurveTo(ex, ey - 5.5 * eyeOpen, ex + s * 12, ey - 4.5);
          ctx.quadraticCurveTo(ex + s * 2, ey + 5 * eyeOpen, ex - s * 11, ey + 3);
          ctx.closePath();
          ctx.fill();

          // Fiery crimson slit pupil
          ctx.fillStyle = `rgba(225, 29, 72, ${(0.88 * eyeOpen * alpha).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(ex + s * 1, ey - 0.5, 1.4, 3.2 * eyeOpen, s * 0.18, 0, TAU);
          ctx.fill();

          // Trailing spiritual eye-flame wisp
          const tailWave = Math.sin(t * 5.6 + s) * 4;
          ctx.strokeStyle = `rgba(253, 224, 71, ${(0.48 * eyeOpen * alpha).toFixed(3)})`;
          ctx.lineWidth = 1.4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(ex + s * 10, ey - 4);
          ctx.quadraticCurveTo(ex + s * 28, ey - 10 + tailWave, ex + s * 42, ey - 18 - tailWave * 0.6);
          ctx.stroke();
        }

        // Subtle fierce spiritual grin / fangs glint underneath
        ctx.strokeStyle = `rgba(251, 207, 232, ${(0.42 * eyeOpen * alpha).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-16, 0);
        ctx.quadraticCurveTo(0, 9, 16, 0);
        ctx.stroke();
      }

      ctx.restore();
    }

    // Staggered Sanpo Kenjū / Nozarashi phantom mimic slash-arcs tearing across the spirit aura
    _drawSpiritSlashes(ctx, ix, iy, w, h, localT, strength, k) {
      const slashes = [
        { delay: 0.00, dy: -34, rad: Math.min(w, h) * 0.38, col: 'rgba(244, 63, 94,',  a0: -2.45, a1: -0.58 },
        { delay: 0.18, dy:  -4, rad: Math.min(w, h) * 0.42, col: 'rgba(253, 224, 71,', a0: -2.25, a1: -0.42 },
        { delay: 0.36, dy:  28, rad: Math.min(w, h) * 0.36, col: 'rgba(236, 72, 153,', a0: -2.55, a1: -0.72 }
      ];
      ctx.save();
      for (let i = 0; i < slashes.length; i++) {
        const s = slashes[i];
        const lt = (localT - s.delay) / 0.65;
        if (lt <= 0 || lt >= 1) continue;
        const sweep = easeOutCubic(clamp(lt * 1.9, 0, 1));
        const fade = 1 - clamp((lt - 0.28) / 0.72, 0, 1);
        const curA = s.a0 + (s.a1 - s.a0) * sweep;

        ctx.strokeStyle = `${s.col} ${(fade * 0.66 * strength * k).toFixed(3)})`;
        ctx.lineWidth = 5.8 * fade;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(ix, iy + s.dy + s.rad * 0.42, s.rad, s.a0, curA);
        ctx.stroke();

        ctx.strokeStyle = `rgba(255, 250, 240, ${(fade * 0.88 * strength * k).toFixed(3)})`;
        ctx.lineWidth = 1.4 * fade;
        ctx.beginPath();
        ctx.arc(ix, iy + s.dy + s.rad * 0.42, s.rad, s.a0, curA);
        ctx.stroke();
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

      // 1. Entrance Bankai awakening spiritual pressure shock-rings (0.05 - 1.75s)
      if (t > 0.04 && t < 1.85) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const rt = clamp((t - 0.08 - i * 0.16) / 1.15, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 18 + easeOutCubic(rt) * Math.max(w, h) * (0.48 + i * 0.14);
          const a = (1 - rt) * (0.50 - i * 0.10) * k;
          ctx.strokeStyle = i === 1
            ? `rgba(253, 224, 71, ${a.toFixed(3)})`
            : `rgba(244, 63, 94, ${a.toFixed(3)})`;
          ctx.lineWidth = (2.6 - i * 0.5) * (1 - rt * 0.5);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Yachiru's manifested Bankai Oni-Spirit ascending & breathing behind content
      const rise = easeOutCubic(clamp((t - 0.12) / 1.05, 0, 1));
      if (rise > 0.01) {
        this._drawBankaiSpirit(ctx, w, h, t, rise, k);
      }

      // 3. Entrance triple spectral mimic slashes (0.55 - 1.75s) + periodic idle echoes
      if (t > 0.54 && t < 1.85) {
        this._drawSpiritSlashes(ctx, ix, iy, w, h, t - 0.55, 0.95, k);
      }
      if (t > 3.0) {
        const cyc = (t - 3.0) % 5.4;
        if (cyc < 1.2) {
          this._drawSpiritSlashes(ctx, ix, iy + 12, w, h, cyc, 0.52, k);
        }
      }

      // 4. Rising crimson-magenta Bankai spiritual wisps & blazing gold sparks
      const wispVis = clamp((t - 0.15) / 0.85, 0, 1);
      if (wispVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.wisps.length; i++) {
          const sp = this.wisps[i];
          sp.swayP += sp.swayS * dt;
          sp.y += sp.vy * dt;
          sp.x += (sp.vx + Math.sin(sp.swayP) * 16) * dt;
          if (sp.y < -18) { sp.y = h + 14; sp.x = (sp.x + w * 0.41) % w; }
          if (sp.x < -12) sp.x = w + 12;
          if (sp.x > w + 12) sp.x = -12;

          const pulse = 0.55 + 0.45 * Math.sin(t * 4.2 + sp.swayP);
          const a = sp.alpha * pulse * wispVis * k;
          const col = sp.tone < 0.46
            ? `rgba(244, 63, 94, ${a.toFixed(3)})`
            : (sp.tone < 0.80 ? `rgba(236, 72, 153, ${a.toFixed(3)})` : `rgba(253, 224, 71, ${a.toFixed(3)})`);

          if (sp.isRibbon) {
            ctx.strokeStyle = col;
            ctx.lineWidth = Math.max(1.2, sp.size * 0.72);
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(sp.x, sp.y);
            ctx.quadraticCurveTo(sp.x + Math.sin(sp.swayP) * 6, sp.y + 8, sp.x - sp.vx * 0.15, sp.y + 16);
            ctx.stroke();
          } else {
            ctx.fillStyle = col;
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
      this.el.classList.remove('yc-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('yc-open');
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
      this.el.classList.remove('yc-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('yachiru-panel');
      inst.delete(this.el);
    }
  }

  g.YachiruPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new YachiruEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
