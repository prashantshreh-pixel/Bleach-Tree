/**
 * soifon-panel.js - Soi Fon (Suzumebachi / Hōmonka & Shunkō Wind)
 * Entrance (0-3s):
 *   0.0-0.6s:  First supersonic sting etches the geometric Hōmonka (hornet-butterfly crest) at impact
 *   0.6-1.45s: Second lethal sting strikes the exact mark (Nigeki Kessatsu), erupting concentric golden rings
 *   1.45-3.0s: Settles into pulsing Hōmonka crest, razor Shunpo speed-lines, and emerald-gold Shunkō sparks
 * Idle loop: Breathing geometric hornet-flower crest, darting diagonal Shunpo wind streaks, Shunkō eddies
 *
 * API: const sf = SoifonPanel.attach(sidebar, options);
 *      sf.open(); sf.close(); sf.replay(); sf.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: Shunpo speed-lines & Shunkō wind-sparks
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 202,               // Line 19: deterministic PRNG seed
    impact: [0.62, 0.34],    // Line 20: normalized [x, y] Hōmonka double-strike mark
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
      this.rafId = null; this.timers = [];
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
      const count = Math.max(12, Math.round(this.o.particles));
      const streakCount = Math.max(6, Math.round(count * 0.42));
      const sparkCount = Math.max(6, count - streakCount);
      this.simTime = 0;

      // High-velocity Shunpo afterimage wind streaks
      this.streaks = [];
      for (let i = 0; i < streakCount; i++) {
        this.streaks.push({
          x: r() * w,
          y: r() * h,
          len: 36 + r() * 78,
          speed: 240 + r() * 340,
          angle: -0.58 + (r() - 0.5) * 0.14,
          emerald: r() > 0.58,
          alpha: 0.20 + r() * 0.36
        });
      }

      // Shunkō orbiting wind-sparks
      this.sparks = [];
      for (let i = 0; i < sparkCount; i++) {
        this.sparks.push({
          angle: r() * TAU,
          rad: 26 + r() * 145,
          speed: (r() > 0.5 ? 1 : -1) * (1.2 + r() * 2.1),
          size: 1.2 + r() * 2.0,
          emerald: r() > 0.45,
          phase: r() * TAU
        });
      }
    }

    _drawHomonka(ctx, cx, cy, scale, rot, alpha, glowGold) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.scale(scale, scale);

      // Stylized butterfly-hornet Hōmonka crest (two symmetrical pointed wings + diamond abdomen)
      ctx.fillStyle = `rgba(18, 18, 22, ${(alpha * 0.72).toFixed(3)})`;
      ctx.strokeStyle = glowGold
        ? `rgba(254, 240, 138, ${(alpha * 0.95).toFixed(3)})`
        : `rgba(250, 204, 21, ${(alpha * 0.85).toFixed(3)})`;
      ctx.lineWidth = 1.4;

      for (let s = -1; s <= 1; s += 2) {
        // Upper wing
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.bezierCurveTo(s * 14, -28, s * 38, -22, s * 32, -3);
        ctx.bezierCurveTo(s * 22, 4, s * 10, 2, 0, 1);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Lower sting wing
        ctx.beginPath();
        ctx.moveTo(0, 2);
        ctx.bezierCurveTo(s * 18, 6, s * 28, 20, s * 15, 28);
        ctx.bezierCurveTo(s * 8, 22, s * 4, 12, 0, 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Hornet core diamond + twin antennae
      ctx.fillStyle = `rgba(250, 204, 21, ${(alpha * 0.92).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(4.2, 0);
      ctx.lineTo(0, 18);
      ctx.lineTo(-4.2, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = `rgba(250, 204, 21, ${(alpha * 0.8).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(-2, -13); ctx.quadraticCurveTo(-8, -22, -13, -24);
      ctx.moveTo(2, -13);  ctx.quadraticCurveTo(8, -22, 13, -24);
      ctx.stroke();

      // Surrounding hexagonal reticle frame
      ctx.strokeStyle = `rgba(250, 204, 21, ${(alpha * 0.42).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU - Math.PI / 6;
        const px = Math.cos(a) * 44;
        const py = Math.sin(a) * 44;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath();
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

      // 1. First sting needle lance (0.05 - 0.45s) & Second lethal sting (0.62 - 1.05s)
      const stings = [
        { start: 0.05, dur: 0.38, ang: -0.68, gold: false },
        { start: 0.62, dur: 0.42, ang: 2.46,  gold: true  }
      ];
      ctx.save();
      for (let i = 0; i < stings.length; i++) {
        const s = stings[i];
        const lt = (t - s.start) / s.dur;
        if (lt <= 0 || lt >= 1) continue;
        const prog = easeOutCubic(clamp(lt * 1.6, 0, 1));
        const fade = 1 - lt;
        const dist = 170 * (1 - prog);
        const tail = 220;
        const dx = Math.cos(s.ang), dy = Math.sin(s.ang);
        const x0 = ix - dx * (dist + tail), y0 = iy - dy * (dist + tail);
        const x1 = ix - dx * dist,          y1 = iy - dy * dist;

        const lg = ctx.createLinearGradient(x0, y0, x1, y1);
        lg.addColorStop(0, 'rgba(250, 204, 21, 0)');
        lg.addColorStop(0.75, `rgba(250, 204, 21, ${(fade * 0.72 * k).toFixed(3)})`);
        lg.addColorStop(1, `rgba(255, 255, 255, ${(fade * 0.95 * k).toFixed(3)})`);
        ctx.strokeStyle = lg;
        ctx.lineWidth = s.gold ? 2.6 : 1.8;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Concentric golden hornet shockwaves on 2nd strike (0.68 - 1.95s)
      if (t > 0.68 && t < 2.15) {
        ctx.save();
        for (let rIdx = 0; rIdx < 3; rIdx++) {
          const rt = clamp((t - 0.68 - rIdx * 0.12) / 1.05, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = 12 + easeOutCubic(rt) * Math.max(w, h) * (0.48 + rIdx * 0.14);
          const a = (1 - rt) * (rIdx === 0 ? 0.56 : 0.34) * k;
          ctx.strokeStyle = rIdx === 2
            ? `rgba(52, 211, 153, ${a.toFixed(3)})`
            : `rgba(250, 204, 21, ${a.toFixed(3)})`;
          ctx.lineWidth = (2.4 - rIdx * 0.5) * (1 - rt * 0.6);
          ctx.beginPath();
          ctx.arc(ix, iy, rad, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Hōmonka crest stamped at impact point (appears after 1st sting, flares on 2nd, breathes in idle)
      if (t > 0.16) {
        const appear = easeOutCubic(clamp((t - 0.16) / 0.28, 0, 1));
        const secondFlare = t > 0.68 ? Math.exp(-(t - 0.68) * 3.2) * 0.38 : 0;
        const breathe = 1 + Math.sin(t * 2.2) * 0.04 + secondFlare;
        const alpha = clamp((0.36 + secondFlare * 0.9) * appear * k, 0, 0.85);
        this._drawHomonka(ctx, ix, iy, (0.85 + 0.15 * appear) * breathe, Math.sin(t * 0.6) * 0.06, alpha, secondFlare > 0.06);
      }

      // 4. Shunpo diagonal wind speed-lines (idle velocity)
      const windVis = clamp((t - 0.85) / 0.9, 0, 1);
      if (windVis > 0.01) {
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
          const a = s.alpha * windVis * k;
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
        ctx.restore();
      }

      // 5. Shunkō orbital gale sparks
      if (windVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.angle += sp.speed * dt;
          const wobble = Math.sin(t * 2.4 + sp.phase) * 8;
          const px = ix + Math.cos(sp.angle) * (sp.rad + wobble);
          const py = iy + Math.sin(sp.angle) * (sp.rad * 0.72 + wobble);
          const pulse = 0.45 + 0.55 * Math.sin(t * 4.5 + sp.phase);
          const a = pulse * 0.65 * windVis * k;
          ctx.fillStyle = sp.emerald
            ? `rgba(110, 231, 183, ${a.toFixed(3)})`
            : `rgba(254, 240, 138, ${a.toFixed(3)})`;
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
      this._stopLoop();
      this.el.classList.remove('sf-open');
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
      this.el.classList.remove('soifon-panel');
      inst.delete(this.el);
    }
  }

  g.SoifonPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new SoifonEffect(el, opts);
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
