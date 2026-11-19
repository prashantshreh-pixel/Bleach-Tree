/**
 * ukitake-panel.js - Jūshirō Ukitake (Sōgyo no Kotowari & Mimihagi)
 * Entrance (0-3s):
 *   0.0-0.8s:  Cerulean energy pulse arcs into the left focus, drawing the crimson talisman cord taut
 *   0.8-1.9s:  Five golden-red ofuda charms ignite sequentially along the cord, redirecting the twin azure ribbon
 *   1.9-3.0s:  Settles into a tranquil lemniscate (infinity) twin-fish stream + quiet Mimihagi stillness ripples
 * Idle loop: Twin pearl-azure spirit streams weaving through 5 glowing talismans + calm water-ink ripples
 *
 * API: const uk = UkitakePanel.attach(sidebar, options);
 *      uk.open(); uk.close(); uk.replay(); uk.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: flowing azure stream motes & talisman sparks
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 1313,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.46],     // Line 20: normalized [x, y] twin-blade lemniscate center
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

  class UkitakeEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null; this.timers = [];
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.sparks = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'uk-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('ukitake-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('uk-wash');
      this.wash.style.setProperty('--uk-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--uk-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'uk-layer uk-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('uk-flash');
      this.ring = this._div('uk-ring');

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
      const count = Math.max(12, Math.round(this.o.particles));
      this.simTime = 0;

      // Stream motes riding along the twin-fish infinity flow + ambient talisman dust
      this.sparks = [];
      for (let i = 0; i < count; i++) {
        this.sparks.push({
          u: r() * TAU,
          speed: 0.65 + r() * 0.75,
          offset: (r() - 0.5) * 26,
          size: 1.2 + r() * 2.2,
          gold: r() > 0.74,
          phase: r() * TAU
        });
      }
    }

    _lemniscate(cx, cy, rx, ry, u) {
      const s = Math.sin(u), c = Math.cos(u);
      const denom = 1 + s * s;
      return {
        x: cx + (rx * c) / denom,
        y: cy + (ry * s * c) / denom
      };
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];
      const rx = w * 0.42;
      const ry = h * 0.24;

      ctx.clearRect(0, 0, w, h);

      // 1. Mimihagi dark stillness ripples quietly breathing near the bottom-center
      const stillVis = clamp((t - 0.4) / 1.2, 0, 1);
      if (stillVis > 0.01) {
        const my = h * 0.80;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const cyc = ((t * 0.28 + i / 3) % 1);
          const rad = 18 + easeOutCubic(cyc) * w * 0.44;
          const a = (1 - cyc) * 0.26 * stillVis * k;
          ctx.strokeStyle = `rgba(148, 163, 184, ${a.toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(ix, my, rad, rad * 0.30, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Twin Sōgyo no Kotowari infinity ribbon currents (absorbs left -> redirects right)
      const flowIntro = easeOutCubic(clamp(t / 1.4, 0, 1));
      ctx.save();
      for (let strand = 0; strand < 2; strand++) {
        const phaseShift = strand * Math.PI;
        const steps = 64;
        ctx.beginPath();
        for (let s = 0; s <= steps; s++) {
          const frac = s / steps;
          if (frac > flowIntro) break;
          const u = frac * TAU + t * 0.45 + phaseShift;
          const pt = this._lemniscate(ix, iy, rx, ry, u);
          const wave = Math.sin(frac * TAU * 2 + t * 2.4 + strand) * 4;
          if (s === 0) ctx.moveTo(pt.x, pt.y + wave);
          else ctx.lineTo(pt.x, pt.y + wave);
        }
        ctx.strokeStyle = strand === 0
          ? `rgba(56, 189, 248, ${(0.36 * flowIntro * k).toFixed(3)})`
          : `rgba(224, 242, 254, ${(0.28 * flowIntro * k).toFixed(3)})`;
        ctx.lineWidth = strand === 0 ? 3.2 : 1.5;
        ctx.stroke();
      }

      // Bright traveling absorption/redirection energy pulse gliding around the infinity loop
      if (t > 0.1) {
        const pulseU = t * 1.45;
        const pHead = this._lemniscate(ix, iy, rx, ry, pulseU);
        const pg = ctx.createRadialGradient(pHead.x, pHead.y, 1, pHead.x, pHead.y, 26);
        pg.addColorStop(0, `rgba(240, 249, 255, ${(0.72 * k).toFixed(3)})`);
        pg.addColorStop(0.45, `rgba(56, 189, 248, ${(0.34 * k).toFixed(3)})`);
        pg.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = pg;
        ctx.beginPath();
        ctx.arc(pHead.x, pHead.y, 26, 0, TAU);
        ctx.fill();
      }
      ctx.restore();

      // 3. Crimson connecting cord & 5 glowing rectangular ofuda talisman charms
      const cordY = iy + Math.sin(t * 1.2) * 3;
      const cordProg = easeOutCubic(clamp((t - 0.35) / 0.85, 0, 1));
      if (cordProg > 0.01) {
        const xLeft = ix - rx * 0.86 * cordProg;
        const xRight = ix + rx * 0.86 * cordProg;
        ctx.save();
        ctx.strokeStyle = `rgba(245, 158, 11, ${(0.42 * cordProg * k).toFixed(3)})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(xLeft, cordY);
        ctx.quadraticCurveTo(ix, cordY + 14 + Math.sin(t * 1.8) * 4, xRight, cordY);
        ctx.stroke();

        // Five ofuda paper talismans igniting sequentially (0.55s -> 1.25s)
        for (let i = 0; i < 5; i++) {
          const delay = 0.52 + i * 0.14;
          if (t < delay) continue;
          const ignite = easeOutCubic(clamp((t - delay) / 0.35, 0, 1));
          const frac = (i + 0.5) / 5;
          const tx = xLeft + (xRight - xLeft) * frac;
          const sag = Math.sin(frac * Math.PI) * (10 + Math.sin(t * 1.8) * 3);
          const ty = cordY + sag;
          const sway = Math.sin(t * 2.0 + i * 0.9) * 0.09;
          const flare = t - delay < 0.7 ? Math.exp(-(t - delay) * 3.8) : 0;

          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(sway);
          ctx.fillStyle = `rgba(15, 23, 42, ${(0.76 * ignite * k).toFixed(3)})`;
          ctx.strokeStyle = flare > 0.1
            ? `rgba(254, 243, 199, ${(0.9 * ignite * k).toFixed(3)})`
            : `rgba(245, 158, 11, ${(0.68 * ignite * k).toFixed(3)})`;
          ctx.lineWidth = 1.1;
          ctx.fillRect(-5.5, 0, 11, 20);
          ctx.strokeRect(-5.5, 0, 11, 20);

          // Tiny interior crimson seal glyph stroke
          ctx.strokeStyle = `rgba(56, 189, 248, ${(0.75 * ignite * k).toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 4); ctx.lineTo(0, 16);
          ctx.moveTo(-2.5, 8); ctx.lineTo(2.5, 8);
          ctx.moveTo(-2.5, 13); ctx.lineTo(2.5, 13);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }

      // 4. Flowing azure spirit-stream sparks & golden talisman dust
      const sparkVis = clamp((t - 0.35) / 1.0, 0, 1);
      if (sparkVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.u += sp.speed * dt;
          const pt = this._lemniscate(ix, iy, rx * 1.06, ry * 1.15, sp.u);
          const px = pt.x + Math.cos(sp.phase + t) * sp.offset;
          const py = pt.y + Math.sin(sp.phase + t * 1.3) * sp.offset;
          const tw = 0.45 + 0.55 * Math.sin(t * 3.2 + sp.phase);
          const a = tw * 0.72 * sparkVis * k;
          ctx.fillStyle = sp.gold
            ? `rgba(251, 191, 36, ${a.toFixed(3)})`
            : `rgba(186, 230, 253, ${a.toFixed(3)})`;
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
      this.el.classList.remove('uk-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('uk-open');
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
      this.el.classList.remove('uk-open');
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
      this.el.classList.remove('ukitake-panel');
      inst.delete(this.el);
    }
  }

  g.UkitakePanel = {
    attach(el, opts) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new UkitakeEffect(el, opts);
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
