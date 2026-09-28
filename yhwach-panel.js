/**
 * yhwach-panel.js - "The Almighty" eyes: multi-pupil Quincy eyes spiral in and converge on one point, then a flash at the end
 *   const yh = YhwachPanel.attach(sidebar, { center: [0.5, 0.4], eyes: 80 });
 *   yh.open();  yh.close();  yh.replay();
 * FLASH_AT (seconds) must match the animation-delay of .yh-flash / .yh-halo in the CSS.
 * Time-based (dt): identical at 60Hz and 120Hz.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), R = Math.random, TAU = 6.2832, FLASH_AT = 2.7;

  class YP {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ center: [0.5, 0.4], eyes: 80, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.raf = null; this.m = []; this.t0 = 0; this.w = 0; this.h = 0;
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'yh-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('yhwach-panel');
      this.canvas = document.createElement('canvas'); this.canvas.className = 'yh-layer yh-canvas'; this.canvas.setAttribute('aria-hidden', 'true');
      this.flash = this._div('yh-flash'); this.halo = this._div('yh-halo'); this.ring = this._div('yh-ring');
      [this.canvas, this.flash, this.halo, this.ring].forEach(n => el.appendChild(n));
      [this.flash, this.halo].forEach(n => { n.style.setProperty('--sx', (this.o.center[0] * 100) + '%'); n.style.setProperty('--sy', (this.o.center[1] * 100) + '%'); });
      this.ctx = this.canvas.getContext('2d');
      this._measure();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._measure()); this.ro.observe(el); }
    }
    _measure() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540, d = Math.min(window.devicePixelRatio || 1, 2);
      this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d); this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }

    /* every eye is scheduled up front: it starts at s and lands on the centre at T (all land just before the flash) */
    _plan() {
      const { w, h } = this, cx = w * this.o.center[0], cy = h * this.o.center[1], per = 2 * (w + h);
      this.m = [];
      const count = this.o.eyes || this.o.stars || 80;
      for (let i = 0; i < count; i++) {
        const q = R() * per; let x, y;
        if (q < w) { x = q; y = 0; } else if (q < w + h) { x = w; y = q - w; } else if (q < 2 * w + h) { x = q - w - h; y = h; } else { x = 0; y = q - 2 * w - h; }
        const T = FLASH_AT - .45 + R() * .4, s = R() * 1.5;
        this.m.push({
          a0: Math.atan2(y - cy, x - cx),
          r0: Math.hypot(x - cx, y - cy),
          turns: 1.1 + R() * 1.1,
          s,
          D: T - s,
          size: 5 + R() * 6.5,
          blinkSpeed: 3 + R() * 5,
          blinkPhase: R() * TAU,
          tilt: (R() - 0.5) * 0.6
        });
      }
    }

    /* Almighty multi-pupil Quincy eye */
    _eye(x, y, s, angle, blink, alpha, isHead) {
      if (s < 1.2 || alpha <= 0.01) return;
      const c = this.ctx;
      c.save();
      c.translate(x, y);
      c.rotate(angle);

      const h = Math.max(0.6, s * 0.48 * blink);

      // 1. Sclera (almond eye shape)
      c.beginPath();
      c.moveTo(-s, 0);
      c.quadraticCurveTo(0, -h, s, 0);
      c.quadraticCurveTo(0, h, -s, 0);
      c.closePath();

      c.fillStyle = isHead ? `rgba(235, 245, 255, ${0.92 * alpha})` : `rgba(180, 210, 255, ${0.60 * alpha})`;
      c.shadowColor = isHead ? 'rgba(170, 210, 255, 0.95)' : 'rgba(150, 190, 245, 0.7)';
      c.shadowBlur = isHead ? 9 : 4;
      c.fill();

      // 2. Eye outline
      c.strokeStyle = `rgba(15, 20, 35, ${0.85 * alpha})`;
      c.lineWidth = Math.max(0.6, s * 0.09);
      c.stroke();

      // 3. Multi-pupils (The Almighty tri-pupils / multi-pupils)
      if (h > 1.4) {
        c.shadowBlur = 0;
        const pr = Math.max(0.6, s * 0.15 * blink);
        const pCore = `rgba(10, 5, 20, ${0.95 * alpha})`;
        const pGlow = `rgba(235, 45, 55, ${0.88 * alpha})`;

        // 3 pupils: left, center, right
        const offsets = [-s * 0.42, 0, s * 0.42];
        for (let i = 0; i < 3; i++) {
          const px = offsets[i];
          // Crimson rim
          c.beginPath();
          c.arc(px, 0, pr * 1.35, 0, 6.2832);
          c.fillStyle = pGlow;
          c.fill();

          // Dark pupil core
          c.beginPath();
          c.arc(px, 0, pr * 0.8, 0, 6.2832);
          c.fillStyle = pCore;
          c.fill();
        }
      }

      c.restore();
    }

    _tick(now) {
      if (!this.isOpen) return;
      const t = (now - this.t0) / 1000, { ctx, w, h } = this, cx = w * this.o.center[0], cy = h * this.o.center[1];
      ctx.clearRect(0, 0, w, h);
      for (const p of this.m) {
        const u = (t - p.s) / p.D; if (u <= 0 || u >= 1) continue;
        for (let k = 0; k < 4; k++) {
          const v = u - k * .022; if (v <= 0) break;
          const r = p.r0 * Math.pow(1 - v, 1.7), a = p.a0 + p.turns * TAU * Math.pow(v, .85);
          const al = Math.min(1, v * 6) * Math.min(1, (1 - v) * 7) * (1 - k * .22);
          const blink = Math.max(0.18, Math.abs(Math.sin(t * p.blinkSpeed + p.blinkPhase)));
          const eyeAngle = a + Math.PI * 0.5 + p.tilt;
          this._eye(cx + Math.cos(a) * r, cy + Math.sin(a) * r, p.size * (1 - k * .14), eyeAngle, blink, al, k === 0);
        }
      }
      if (t < FLASH_AT + .1) this.raf = requestAnimationFrame(n => this._tick(n));
      else { this.raf = null; ctx.clearRect(0, 0, w, h); }
    }

    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('yh-open'); void this.el.offsetWidth; this.el.classList.add('yh-open');
      this.t0 = performance.now();
      if (!this.rm) { this._measure(); this._plan(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(n => this._tick(n)); }
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.el.classList.remove('yh-open'); cancelAnimationFrame(this.raf); this.raf = null;
      setTimeout(() => { if (!this.isOpen) this.ctx.clearRect(0, 0, this.w, this.h); }, 300);
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.canvas, this.flash, this.halo, this.ring].forEach(n => n.remove());
      this.el.classList.remove('yhwach-panel', 'yh-open'); inst.delete(this.el);
    }
  }
  g.YhwachPanel = { attach(el, o) { return el ? (inst.get(el) || new YP(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
