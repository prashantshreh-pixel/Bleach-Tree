/**
 * byakuya-panel.js - Byakuya Kuchiki (Senbonzakura Kageyoshi / 千本桜景厳)
 * Entrance (0-3s):
 *   0.0-0.65s: Twin rows of ghostly katana silhouettes materialize and sink into mirror ripples
 *   0.65-1.7s: Explosive pink petal-blade scatter bursts from impact point with silver specular glints
 *   1.7-3.0s:  Settles into noble laminar S-curve orbital streams of tumbling razor sakura petals
 * Idle loop: Layered parallax 3D-tumbling sakura blade-petals catching silver gleams + ambient blossom mist
 *
 * API: const bk = ByakuyaPanel.attach(sidebar, options);
 *      bk.open(); bk.close(); bk.replay(); bk.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 96,           // Line 17: petal-blade count (idle + burst)
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 606,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.38],     // Line 20: normalized [x, y] scatter origin
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

  class ByakuyaEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0;
      this.h = 0;
      this.dpr = 1;
      this.rafId = null;
      this.timers = [];
      this.simTime = 0;
      this.lastTime = 0;
      this.rm = false;
      this.petals = [];
      this.blades = [];
      this.ripples = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'bk-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('byakuya-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('bk-wash');
      this.wash.style.setProperty('--bk-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--bk-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'bk-layer bk-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('bk-flash');
      this.flash.style.setProperty('--bk-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--bk-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('bk-ring');

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
      this.w = w;
      this.h = h;
      this.dpr = dpr;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      if (this.ctx) this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.isOpen && this.rm) this._render(2.5, 0);
    }

    _resetSim() {
      const r = mulberry32(this.o.seed);
      const count = Math.max(12, Math.round(this.o.particles));
      const w = this.w || 360;
      const h = this.h || 540;
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];

      this.simTime = 0;

      // Twin Kageyoshi blade rows flanking left and right edges
      this.blades = [];
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 4; i++) {
          const depth = i / 3;
          this.blades.push({
            x: side < 0 ? w * (0.08 + depth * 0.14) : w * (0.92 - depth * 0.14),
            baseY: h * (0.48 + depth * 0.12),
            height: h * (0.30 - depth * 0.04),
            width: 5.5 - depth * 1.1,
            delay: i * 0.055,
            alpha: 0.48 - depth * 0.10
          });
        }
      }

      // Ground mirror ripples where blades sink
      this.ripples = [];
      for (let i = 0; i < 6; i++) {
        this.ripples.push({
          x: w * (0.12 + (i / 5) * 0.76),
          y: h * (0.82 + (i % 2) * 0.06),
          phase: i * 0.14,
          maxR: 34 + r() * 34
        });
      }

      // Thousands-style layered razor sakura blade-petals
      this.petals = [];
      for (let i = 0; i < count; i++) {
        const layer = r(); // 0=far, 1=near
        const angle = r() * TAU;
        const speed = 70 + r() * 210;
        const ribbon = i % 3;
        this.petals.push({
          // Burst state
          bx: ix + (r() - 0.5) * 26,
          by: iy + (r() - 0.5) * 26,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 30,
          // Idle swirl coordinates
          x: r() * w,
          y: r() * h,
          ribbon,
          layer,
          len: 5.5 + layer * 6.5,
          wid: 2.3 + layer * 2.4,
          rot: r() * TAU,
          rotSpeed: (r() - 0.5) * 3.8,
          tumble: r() * TAU,
          tumbleSpeed: 2.2 + r() * 3.6,
          driftX: 16 + layer * 28,
          driftY: 14 + layer * 24,
          waveAmp: 18 + r() * 26,
          waveFreq: 0.8 + r() * 1.3,
          wavePhase: r() * TAU,
          hueShift: r(),
          spawnDelay: 0.42 + r() * 0.45
        });
      }
    }

    _drawPetalBlade(ctx, x, y, len, wid, rot, tumble, hueShift, alpha) {
      const flip = Math.cos(tumble);
      const edgeOn = 1 - Math.abs(flip); // Peaks when petal turns edge-on like a tiny mirror blade
      const scaleY = 0.24 + Math.abs(flip) * 0.76;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.scale(1, scaleY);

      // Sakura petal-blade shape with characteristic notched tip
      ctx.beginPath();
      ctx.moveTo(-len * 0.65, 0);
      ctx.bezierCurveTo(-len * 0.2, -wid, len * 0.45, -wid * 0.85, len * 0.75, -wid * 0.22);
      ctx.lineTo(len * 0.52, 0);
      ctx.lineTo(len * 0.75, wid * 0.22);
      ctx.bezierCurveTo(len * 0.45, wid * 0.85, -len * 0.2, wid, -len * 0.65, 0);
      ctx.closePath();

      if (edgeOn > 0.76) {
        // Metallic silver blade gleam
        ctx.fillStyle = `rgba(255, 245, 252, ${clamp(alpha * 1.25, 0, 0.95).toFixed(3)})`;
      } else if (hueShift < 0.35) {
        ctx.fillStyle = `rgba(252, 231, 243, ${(alpha * 0.85).toFixed(3)})`;
      } else if (hueShift < 0.78) {
        ctx.fillStyle = `rgba(249, 168, 212, ${(alpha * 0.9).toFixed(3)})`;
      } else {
        ctx.fillStyle = `rgba(244, 114, 182, ${(alpha * 0.82).toFixed(3)})`;
      }
      ctx.fill();

      // Razor specular edge highlight when angled toward light
      if (edgeOn > 0.68) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${(alpha * edgeOn * 0.95).toFixed(3)})`;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-len * 0.6, 0);
        ctx.lineTo(len * 0.72, 0);
        ctx.stroke();
      }
      ctx.restore();
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w;
      const h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];

      ctx.clearRect(0, 0, w, h);

      // 1. Soft atmospheric rose-sakura mist ribbons (subtle behind text)
      const mistAlpha = clamp(t / 1.4, 0, 1) * 0.16 * k;
      if (mistAlpha > 0.005) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const cy = h * (0.25 + i * 0.28) + Math.sin(t * 0.55 + i * 2.1) * 26;
          const grad = ctx.createLinearGradient(0, cy - 55, w, cy + 55);
          grad.addColorStop(0, 'rgba(244, 114, 182, 0)');
          grad.addColorStop(0.5, `rgba(249, 168, 212, ${(mistAlpha * (0.7 + 0.3 * Math.sin(t + i))).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(244, 114, 182, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(0, cy - 18);
          ctx.bezierCurveTo(w * 0.35, cy - 52, w * 0.65, cy + 32, w, cy - 8);
          ctx.lineTo(w, cy + 34);
          ctx.bezierCurveTo(w * 0.65, cy + 70, w * 0.35, cy - 10, 0, cy + 28);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      }

      // 2. Entrance phase (0 - 1.25s): Kageyoshi katana silhouettes rising and sinking into ripples
      if (t < 1.35) {
        ctx.save();
        for (let i = 0; i < this.blades.length; i++) {
          const b = this.blades[i];
          const bt = t - b.delay;
          if (bt <= 0 || bt > 1.05) continue;
          const appear = clamp(bt / 0.22, 0, 1);
          const sink = easeOutCubic(clamp((bt - 0.24) / 0.65, 0, 1));
          const fade = 1 - clamp((bt - 0.68) / 0.35, 0, 1);
          const topY = b.baseY - b.height * (1 - sink * 0.92);
          const botY = b.baseY;
          const a = b.alpha * appear * fade * k;
          if (a <= 0.01) continue;

          const grad = ctx.createLinearGradient(b.x, topY, b.x, botY);
          grad.addColorStop(0, `rgba(252, 231, 243, ${(a * 1.15).toFixed(3)})`);
          grad.addColorStop(0.55, `rgba(244, 114, 182, ${(a * 0.72).toFixed(3)})`);
          grad.addColorStop(1, 'rgba(131, 24, 67, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.moveTo(b.x, topY - 10);
          ctx.lineTo(b.x + b.width * 0.5, topY + 6);
          ctx.lineTo(b.x + b.width * 0.42, botY);
          ctx.lineTo(b.x - b.width * 0.42, botY);
          ctx.lineTo(b.x - b.width * 0.5, topY + 6);
          ctx.closePath();
          ctx.fill();

          // Spine specular gleam
          ctx.strokeStyle = `rgba(255, 255, 255, ${(a * 0.85).toFixed(3)})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(b.x, topY - 8);
          ctx.lineTo(b.x, botY);
          ctx.stroke();
        }

        // Mirror-surface concentric ripples where blades descend
        for (let i = 0; i < this.ripples.length; i++) {
          const rp = this.ripples[i];
          const rt = clamp((t - 0.2 - rp.phase) / 0.9, 0, 1);
          if (rt <= 0 || rt >= 1) continue;
          const rad = rp.maxR * easeOutCubic(rt);
          const a = (1 - rt) * 0.38 * k;
          ctx.strokeStyle = `rgba(249, 168, 212, ${a.toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rad, rad * 0.28, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 3. Entrance scatter ring at impact point (0.48 - 1.5s)
      if (t > 0.45 && t < 1.65) {
        const st = clamp((t - 0.45) / 1.15, 0, 1);
        const rad = 16 + easeOutCubic(st) * Math.max(w, h) * 0.52;
        const a = (1 - st) * 0.42 * k;
        ctx.save();
        ctx.strokeStyle = `rgba(252, 231, 243, ${a.toFixed(3)})`;
        ctx.lineWidth = 1.6 * (1 - st * 0.6);
        ctx.beginPath();
        ctx.arc(ix, iy, rad, 0, TAU);
        ctx.stroke();
        ctx.restore();
      }

      // 4. Swirling razor sakura petal-blades (burst transition 0.45-2.3s -> serene S-curve idle loop)
      const settleMix = easeOutCubic(clamp((t - 1.05) / 1.55, 0, 1));
      for (let i = 0; i < this.petals.length; i++) {
        const p = this.petals[i];
        if (t < p.spawnDelay) continue;

        const pt = t - p.spawnDelay;
        p.rot += p.rotSpeed * dt;
        p.tumble += p.tumbleSpeed * dt;

        // Advance idle laminar current
        const flowAngle = Math.sin(p.y * 0.011 + t * 0.8 + p.ribbon * 2.1) * 0.75;
        p.x += (Math.cos(flowAngle) * p.driftX + Math.sin(t * p.waveFreq + p.wavePhase) * 14) * dt;
        p.y += (p.driftY + Math.sin(flowAngle) * 12) * dt;
        if (p.x > w + 18) p.x = -18;
        if (p.x < -18) p.x = w + 18;
        if (p.y > h + 18) { p.y = -18; p.x = (p.x + w * 0.37) % w; }

        // Compute entrance burst position (radial vortex outward from impact point)
        const burstDrag = 1 - Math.exp(-pt * 1.9);
        const swirlAng = pt * (1.8 + p.layer * 1.1);
        const rawX = p.bx + p.vx * burstDrag * 0.85;
        const rawY = p.by + p.vy * burstDrag * 0.85 + pt * 18;
        const rx = ix + (rawX - ix) * Math.cos(swirlAng * 0.32) - (rawY - iy) * Math.sin(swirlAng * 0.32);
        const ry = iy + (rawX - ix) * Math.sin(swirlAng * 0.32) + (rawY - iy) * Math.cos(swirlAng * 0.32);

        const drawX = lerp(rx, p.x, settleMix);
        const drawY = lerp(ry, p.y, settleMix);

        const fadeIn = clamp(pt / 0.25, 0, 1);
        const alpha = (0.28 + p.layer * 0.56) * fadeIn * k;
        this._drawPetalBlade(ctx, drawX, drawY, p.len, p.wid, p.rot, p.tumble, p.hueShift, clamp(alpha, 0, 0.92));
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
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      this.timers.forEach(id => clearTimeout(id));
      this.timers = [];
    }

    open() {
      this._stopLoop();
      this.rm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      this.isOpen = true;
      this.el.classList.remove('bk-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('bk-open');
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
      this.el.classList.remove('bk-open');
      if (this.ctx && this.canvas) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      }
    }

    replay() {
      this.open();
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('byakuya-panel');
      inst.delete(this.el);
    }
  }

  g.ByakuyaPanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new ByakuyaEffect(el, opts);
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
