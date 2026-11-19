/**
 * gin-panel.js - Gin Ichimaru (White Viper / Kamishini no Yari Snake Vibe)
 * Entrance (0-3s):
 *   0.0-0.5s:  Twin hypnotic icy-cyan vertical-slit snake eyes open ominously in the twilight indigo dark
 *   0.5-1.45s: Spectral white-silver serpent lunges in a Mach-500 fang-strike lance with vapor chevrons
 *   1.45-3.0s: Viper coils into a sleek living sinusoidal patrol across the backdrop, shedding venomous cyan Korose dust
 * Idle loop: Articulated scale-faceted spectral white snake gliding with glowing slit eyes, flicking tongue & venom mist
 *
 * API: const gn = GinPanel.attach(sidebar, options);
 *      gn.open(); gn.close(); gn.replay(); gn.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 54,           // Line 17: Korose venomous silver-cyan dust & mist motes
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 303,               // Line 19: deterministic PRNG seed
    impact: [0.5, 0.38],     // Line 20: normalized [x, y] serpent gaze & strike point
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

  class GinEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.snake = []; this.dust = [];
      this.numSegs = 40;
      this.segLen = 9.5;
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'gn-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('gin-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('gn-wash');
      this.wash.style.setProperty('--gn-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--gn-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'gn-layer gn-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('gn-flash');
      this.ring = this._div('gn-ring');

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

      // Initialize articulated white-silver spectral viper starting coiled in lower-left
      this.snake = [];
      const sx = w * 0.14, sy = h * 0.86;
      for (let i = 0; i < this.numSegs; i++) {
        this.snake.push({
          x: sx - i * this.segLen * 0.7,
          y: sy + i * this.segLen * 0.4,
          angle: -0.6
        });
      }

      // Korose venomous silver-cyan cellular dust
      this.dust = [];
      for (let i = 0; i < count; i++) {
        this.dust.push({
          x: r() * w,
          y: r() * h,
          vx: (r() - 0.5) * 14,
          vy: -(9 + r() * 19),
          size: 1.0 + r() * 2.4,
          rot: r() * TAU,
          rotS: (r() - 0.5) * 2.2,
          cyan: r() > 0.40,
          phase: r() * TAU,
          alpha: 0.24 + r() * 0.58
        });
      }
    }

    _stepSnake(t, dt, w, h) {
      const head = this.snake[0];
      // Smooth figure-8 / S-coil patrol weaving gracefully behind the sidebar content
      const u = t * 0.62;
      const targetX = w * 0.50 + Math.sin(u * 1.15) * w * 0.36;
      const targetY = h * 0.54 + Math.sin(u * 0.72) * h * 0.30 + Math.cos(u * 1.65) * 24;

      const dx = targetX - head.x;
      const dy = targetY - head.y;
      const desired = Math.atan2(dy, dx);
      let diff = desired - head.angle;
      while (diff < -Math.PI) diff += TAU;
      while (diff > Math.PI) diff -= TAU;

      // Subtle lateral serpentine head-slither oscillation
      const slither = Math.sin(t * 5.2) * 0.24;
      const turnRate = dt > 0 ? clamp(dt * 4.2, 0.04, 0.25) : 0.18;
      head.angle += diff * turnRate + slither * (dt > 0 ? dt * 3.0 : 0);

      const spd = (t < 1.15 ? 240 : 125) * (dt > 0 ? dt : 0.016);
      head.x += Math.cos(head.angle) * spd;
      head.y += Math.sin(head.angle) * spd;

      // Follow-the-leader inverse kinematics down the viper's spine
      for (let i = 1; i < this.numSegs; i++) {
        const prev = this.snake[i - 1];
        const curr = this.snake[i];
        const sdx = prev.x - curr.x;
        const sdy = prev.y - curr.y;
        curr.angle = Math.atan2(sdy, sdx);
        curr.x = prev.x - Math.cos(curr.angle) * this.segLen;
        curr.y = prev.y - Math.sin(curr.angle) * this.segLen;
      }
    }

    _drawViper(ctx, t, alpha, k) {
      const segs = this.snake;
      const n = segs.length;
      if (n < 4) return;
      const a = alpha * k;

      // Build left & right tapered body silhouette polygons
      const leftPts = [], rightPts = [];
      for (let i = 0; i < n; i++) {
        const frac = i / (n - 1);
        // Sleek muscular viper taper: narrow neck -> thick mid-body -> needle-sharp tail
        const radius = (i === 0 ? 5.0 : (i === 1 ? 6.5 : 10.5 * Math.sin(Math.pow(1 - frac, 0.72) * Math.PI * 0.88) + 1.1));
        const perp = segs[i].angle + Math.PI / 2;
        leftPts.push({ x: segs[i].x + Math.cos(perp) * radius, y: segs[i].y + Math.sin(perp) * radius });
        rightPts.push({ x: segs[i].x - Math.cos(perp) * radius, y: segs[i].y - Math.sin(perp) * radius });
      }

      ctx.save();
      // 1. Soft cold cyan-silver venom aura around the slithering serpent
      ctx.beginPath();
      ctx.moveTo(segs[0].x, segs[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(segs[i].x, segs[i].y);
      ctx.strokeStyle = `rgba(103, 232, 249, ${(0.22 * a).toFixed(3)})`;
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // 2. Sculpted white-silver viper body polygon
      const bodyGrad = ctx.createLinearGradient(segs[0].x, segs[0].y, segs[n - 1].x, segs[n - 1].y);
      bodyGrad.addColorStop(0, `rgba(241, 245, 249, ${(0.86 * a).toFixed(3)})`);
      bodyGrad.addColorStop(0.42, `rgba(148, 163, 184, ${(0.76 * a).toFixed(3)})`);
      bodyGrad.addColorStop(0.82, `rgba(51, 65, 85, ${(0.64 * a).toFixed(3)})`);
      bodyGrad.addColorStop(1, `rgba(30, 27, 75, ${(0.25 * a).toFixed(3)})`);

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = `rgba(207, 250, 254, ${(0.58 * a).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(leftPts[0].x, leftPts[0].y);
      for (let i = 1; i < n; i++) ctx.lineTo(leftPts[i].x, leftPts[i].y);
      for (let i = n - 1; i >= 0; i--) ctx.lineTo(rightPts[i].x, rightPts[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 3. Iridescent diamond viper scale chevrons running down the spine
      ctx.strokeStyle = `rgba(22, 24, 54, ${(0.46 * a).toFixed(3)})`;
      ctx.lineWidth = 1.0;
      for (let i = 2; i < n - 4; i += 2) {
        const s = segs[i];
        const frac = i / (n - 1);
        const wScale = 7.5 * (1 - frac * 0.72);
        const ca = Math.cos(s.angle), sa = Math.sin(s.angle);
        const px = -sa, py = ca;
        ctx.beginPath();
        ctx.moveTo(s.x - ca * 4 + px * wScale, s.y - sa * 4 + py * wScale);
        ctx.lineTo(s.x + ca * 4.5, s.y + sa * 4.5);
        ctx.lineTo(s.x - ca * 4 - px * wScale, s.y - sa * 4 - py * wScale);
        ctx.stroke();
      }

      // Razor silver dorsal highlight spine
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.56 * a).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(segs[0].x, segs[0].y);
      for (let i = 1; i < n - 3; i++) ctx.lineTo(segs[i].x, segs[i].y);
      ctx.stroke();

      // 4. Triangular Viper Head, glowing icy-cyan slit eyes & flicking forked tongue
      const head = segs[0];
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(head.angle);

      // Flicking forked viper tongue (flicks periodically every ~3.2s)
      const flick = (t % 3.2);
      if (flick < 0.42) {
        const fExt = Math.sin((flick / 0.42) * Math.PI);
        const tLen = 14 + fExt * 16;
        const wiggle = Math.sin(t * 42) * 2.5;
        ctx.strokeStyle = `rgba(103, 232, 249, ${(0.82 * a).toFixed(3)})`;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.quadraticCurveTo(15 + tLen * 0.5, wiggle, 15 + tLen, wiggle * 0.5);
        ctx.moveTo(15 + tLen, wiggle * 0.5);
        ctx.lineTo(15 + tLen + 5.5, wiggle * 0.5 - 3.6);
        ctx.moveTo(15 + tLen, wiggle * 0.5);
        ctx.lineTo(15 + tLen + 5.5, wiggle * 0.5 + 3.6);
        ctx.stroke();
      }

      // Sharp diamond-triangular viper skull
      ctx.fillStyle = `rgba(241, 245, 249, ${(0.94 * a).toFixed(3)})`;
      ctx.strokeStyle = `rgba(103, 232, 249, ${(0.82 * a).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(19, 0);
      ctx.lineTo(5, -9.5);
      ctx.lineTo(-9, -8.5);
      ctx.lineTo(-5, 0);
      ctx.lineTo(-9, 8.5);
      ctx.lineTo(5, 9.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Piercing ice-cyan glowing viper eyes with dark vertical slits
      for (let side = -1; side <= 1; side += 2) {
        ctx.fillStyle = `rgba(103, 232, 249, ${(0.96 * a).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(5.5, side * 4.8, 3.2, 1.8, side * 0.25, 0, TAU);
        ctx.fill();
        ctx.fillStyle = `rgba(15, 23, 42, ${(0.95 * a).toFixed(3)})`;
        ctx.fillRect(5.0, side * 4.8 - 1.5, 1.0, 3.0);
      }
      ctx.restore();
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

      // 1. Ominous giant spectral slit snake eyes opening in the dark during entrance (0.0 - 1.15s)
      if (t < 1.25) {
        const open = easeOutCubic(clamp(t / 0.42, 0, 1));
        const fade = 1 - clamp((t - 0.65) / 0.58, 0, 1);
        const ea = open * fade * 0.85 * k;
        if (ea > 0.01) {
          ctx.save();
          for (let s = -1; s <= 1; s += 2) {
            const ex = ix + s * 42;
            const ey = iy;
            const eg = ctx.createRadialGradient(ex, ey, 2, ex, ey, 34);
            eg.addColorStop(0, `rgba(103, 232, 249, ${(ea * 0.55).toFixed(3)})`);
            eg.addColorStop(1, 'rgba(103, 232, 249, 0)');
            ctx.fillStyle = eg;
            ctx.beginPath();
            ctx.arc(ex, ey, 34, 0, TAU);
            ctx.fill();

            ctx.fillStyle = `rgba(165, 243, 252, ${ea.toFixed(3)})`;
            ctx.beginPath();
            ctx.moveTo(ex - s * 24, ey + 4);
            ctx.quadraticCurveTo(ex, ey - 10 * open, ex + s * 22, ey - 5);
            ctx.quadraticCurveTo(ex, ey + 9 * open, ex - s * 24, ey + 4);
            ctx.closePath();
            ctx.fill();

            // Vertical serpent slit pupil
            ctx.fillStyle = `rgba(10, 12, 28, ${(ea * 0.95).toFixed(3)})`;
            ctx.beginPath();
            ctx.ellipse(ex, ey - 0.5, 2.2, 7.5 * open, 0, 0, TAU);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      // 2. Mach-500 Kamishini no Yari fang-strike lance at 0.46 - 1.25s
      if (t > 0.45 && t < 1.30) {
        const lt = (t - 0.46) / 0.78;
        const ext = easeOutCubic(clamp(lt * 2.5, 0, 1));
        const fade = 1 - clamp((lt - 0.30) / 0.70, 0, 1);
        const x0 = -16, y0 = h * 0.68;
        const x1 = x0 + (w + 48) * ext;
        const y1 = y0 - h * 0.46 * ext;
        ctx.save();
        ctx.strokeStyle = `rgba(103, 232, 249, ${(fade * 0.45 * k).toFixed(3)})`;
        ctx.lineWidth = 7.5 * fade;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.stroke();

        ctx.strokeStyle = `rgba(240, 249, 255, ${(fade * 0.95 * k).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Living slithering spectral white-silver viper
      const snakeVis = easeOutCubic(clamp((t - 0.32) / 0.85, 0, 1));
      if (dt > 0) {
        this._stepSnake(t, dt, w, h);
      } else if (t > 0 && this.snake.length) {
        // Static settled pose for prefers-reduced-motion
        for (let kStep = 0; kStep < 40; kStep++) this._stepSnake(kStep * 0.06, 0.04, w, h);
      }
      if (snakeVis > 0.01) {
        this._drawViper(ctx, t, snakeVis * 0.78, k);
      }

      // 4. Drifting venomous silver-cyan Korose cellular sliver dust
      const dustVis = clamp((t - 0.35) / 1.0, 0, 1);
      if (dustVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.dust.length; i++) {
          const d = this.dust[i];
          d.rot += d.rotS * dt;
          d.x += (d.vx + Math.sin(t * 1.1 + d.phase) * 7) * dt;
          d.y += d.vy * dt;
          if (d.y < -12) { d.y = h + 12; d.x = (d.x + w * 0.41) % w; }
          if (d.x < -12) d.x = w + 12;
          if (d.x > w + 12) d.x = -12;

          const shimmer = 0.5 + 0.5 * Math.sin(t * 3.6 + d.phase);
          const a = d.alpha * (0.45 + 0.55 * shimmer) * dustVis * k;
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.rot);
          ctx.fillStyle = d.cyan
            ? `rgba(103, 232, 249, ${a.toFixed(3)})`
            : `rgba(226, 232, 240, ${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(0, -d.size * 1.6);
          ctx.lineTo(d.size * 0.65, 0);
          ctx.lineTo(0, d.size * 1.6);
          ctx.lineTo(-d.size * 0.65, 0);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
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
      this.el.classList.remove('gn-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('gn-open');
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
      this.el.classList.remove('gn-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('gin-panel');
      inst.delete(this.el);
    }
  }

  g.GinPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new GinEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
