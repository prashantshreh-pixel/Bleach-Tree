/**
 * frost-panel.js  (fixed for the Bleach network sidebar)
 *
 * Works with your existing call, no HTML changes needed:
 *   const fp = FrostPanel.attach(sidebar, { particles: 30, snow: true });
 *   fp.open();  fp.close();
 *
 * Key difference from before: it does NOT wrap your content in a new div.
 * The old wrapper (z-index:10) pushed #sidebar-bg and #sidebar-overlay above
 * the frost layers, so the dark overlay hid all the ice.
 */
(function (global) {
  'use strict';

  const instances = new WeakMap();

  class FrostPanelInstance {
    constructor(el, options = {}) {
      this.el = el;
      this.opts = Object.assign({
        particles: 45,      // snowflakes (alias: snowflakes)
        stars: 20,          // twinkling ice glints
        snow: true,
        anchor: '#sidebar-content' // effect layers are inserted right before this child
      }, options);
      if (options.snowflakes != null && options.particles == null) this.opts.particles = options.snowflakes;

      this.isOpen = false;
      this.raf = null;
      this.parts = [];
      this.w = 0; this.h = 0;
      this.reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

      this._build();
      instances.set(el, this);
    }

    _layer(cls, tag) {
      const n = document.createElement(tag || 'div');
      n.className = 'fp-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('frost-panel');

      // Find the content child so the effects sit BEHIND it but ABOVE the bg/overlay.
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.opts.anchor); } catch (e) {}
      if (!anchor) anchor = el.firstChild;

      this.mist   = this._layer('fp-mist');
      this.frost  = this._layer('fp-frost');
      this.crust  = this._layer('fp-crust');
      this.canvas = this._layer('fp-canvas', 'canvas');
      [this.mist, this.frost, this.crust, this.canvas].forEach(n => el.insertBefore(n, anchor));

      // Overlays that sit above content (pointer-events: none)
      this.sweep = this._layer('fp-sweep');
      this.ring  = this._layer('fp-ring');
      el.appendChild(this.sweep);
      el.appendChild(this.ring);

      this.ctx = this.canvas.getContext('2d');
      this._resize();
      this._seed();

      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(() => this._resize());
        this.ro.observe(el);
      } else {
        this._onResize = () => this._resize();
        window.addEventListener('resize', this._onResize);
      }
    }

    _resize() {
      const w = this.el.clientWidth || 360;
      const h = this.el.clientHeight || 540;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const changed = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8;
      this.w = w; this.h = h;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (changed && this.parts.length) this._seed();
    }

    _seed() {
      const { w, h } = this;
      this.parts = [];
      for (let i = 0; i < this.opts.particles; i++) {
        this.parts.push({
          t: 'snow',
          x: Math.random() * w, y: Math.random() * h,
          r: Math.random() * 2 + 0.6,
          vy: Math.random() * 0.9 + 0.35,
          vx: (Math.random() - 0.5) * 0.3,
          wob: Math.random() * 6.28, ws: Math.random() * 0.03 + 0.015,
          a: Math.random() * 0.5 + 0.35,
          blur: Math.random() < 0.3
        });
      }
      for (let i = 0; i < this.opts.stars; i++) {
        this.parts.push({
          t: 'star',
          x: Math.random() * w, y: Math.random() * h,
          s: Math.random() < 0.35 ? Math.random() * 1.6 + 1.6 : Math.random() * 1.1 + 0.7,
          base: Math.random() * 0.5 + 0.4,
          sp: Math.random() * 0.04 + 0.02,
          ph: Math.random() * 6.28,
          dx: (Math.random() - 0.5) * 0.12, dy: (Math.random() - 0.5) * 0.12,
          glint: Math.random() < 0.4
        });
      }
    }

    _tick() {
      if (!this.isOpen) return;
      const { ctx, w, h } = this;
      ctx.clearRect(0, 0, w, h);

      for (const p of this.parts) {
        if (p.t === 'snow') {
          p.wob += p.ws;
          p.y += p.vy;
          p.x += p.vx + Math.sin(p.wob) * 0.4;
          if (p.y > h + 8) { p.y = -8; p.x = Math.random() * w; }
          if (p.x > w + 8) p.x = -8;
          if (p.x < -8) p.x = w + 8;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fillStyle = 'rgba(224,242,254,' + p.a + ')';
          ctx.shadowColor = 'rgba(127,214,255,.9)';
          ctx.shadowBlur = p.blur ? 6 : 3;
          ctx.fill();
        } else {
          p.ph += p.sp; p.x += p.dx; p.y += p.dy;
          if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
          if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
          const a = Math.max(0.2, Math.min(1, p.base + Math.sin(p.ph) * 0.4));
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s, 0, 6.2832);
          ctx.fillStyle = 'rgba(224,242,254,' + a + ')';
          ctx.shadowColor = 'rgba(186,230,253,.95)';
          ctx.shadowBlur = p.glint ? 9 : 4;
          ctx.fill();
          if (p.glint && a > 0.6) {          // 4-point sparkle
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,' + (a - 0.4) * 0.9 + ')';
            ctx.lineWidth = 0.8;
            const f = p.s * 2.6;
            ctx.beginPath();
            ctx.moveTo(p.x - f, p.y); ctx.lineTo(p.x + f, p.y);
            ctx.moveTo(p.x, p.y - f); ctx.lineTo(p.x, p.y + f);
            ctx.stroke();
          }
        }
      }
      this.raf = requestAnimationFrame(() => this._tick());
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.el.classList.add('fp-open');      // starts every CSS animation
      if (this.opts.snow && !this.reduceMotion) {
        this._resize();
        cancelAnimationFrame(this.raf);
        this._tick();
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.el.classList.remove('fp-open');   // CSS fades everything out
      cancelAnimationFrame(this.raf);
      this.raf = null;
      // let the canvas fade out, then clear it
      setTimeout(() => { if (!this.isOpen) this.ctx.clearRect(0, 0, this.w, this.h); }, 700);
    }

    destroy() {
      this.close();
      if (this.ro) this.ro.disconnect();
      if (this._onResize) window.removeEventListener('resize', this._onResize);
      [this.mist, this.frost, this.crust, this.canvas, this.sweep, this.ring].forEach(n => n.remove());
      this.el.classList.remove('frost-panel', 'fp-open');
      instances.delete(this.el);
    }
  }

  global.FrostPanel = {
    attach(el, options) {
      if (!el) return null;
      return instances.get(el) || new FrostPanelInstance(el, options);
    },
    get(el) { return instances.get(el) || null; }
  };
})(typeof window !== 'undefined' ? window : this);
