/**
 * ukitake-panel.js - Jūshirō Ukitake (Sōgyo no Kotowari — Twin Swords Emerging from Behind)
 * Entrance (0-3s):
 *   0.0-0.95s: Twin Sōgyo no Kotowari blades (with iconic forked reverse-hook tips) slide and unsheathe outward
 *              in opposite diagonal arcs from behind a central depth-shadow veil
 *   0.95-1.95s: Crimson connecting cord snaps between the two hilts and 5 glowing ofuda talismans ignite sequentially,
 *              channeling a cerulean energy current from the left sword tip through the charms out the right tip
 *   1.95-3.0s: Settles into hovering twin blades framed behind the card, swaying talisman cord & serene azure sparks
 * Idle loop: Slowly breathing crossed twin swords emerging from behind + traveling absorption/redirection energy pulse
 *
 * API: const uk = UkitakePanel.attach(sidebar, options);
 *      uk.open(); uk.close(); uk.replay(); uk.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 44,           // Line 17: flowing azure stream motes & talisman gold sparks
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 1313,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.50],     // Line 20: normalized [x, y] twin-sword origin behind center
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

  class UkitakeEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
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
      const w = this.w || 360, h = this.h || 540;
      const count = Math.max(12, Math.round(this.o.particles));
      this.simTime = 0;

      this.sparks = [];
      for (let i = 0; i < count; i++) {
        this.sparks.push({
          x: r() * w,
          y: r() * h,
          vy: -(10 + r() * 22),
          vx: (r() - 0.5) * 14,
          size: 1.1 + r() * 2.2,
          gold: r() > 0.72,
          phase: r() * TAU,
          alpha: 0.30 + r() * 0.55
        });
      }
    }

    // Draws one of Sōgyo no Kotowari's iconic blades (with its reverse-hook spine prong near tip)
    // and returns exact world coordinates of its pommel & tip so the talisman cord & energy beam link directly to it.
    _drawSogyoBlade(ctx, cx, cy, side, emerge, sc, t, k) {
      // side = -1 (left sword pointing upper-left), +1 (right sword pointing upper-right)
      const hover = Math.sin(t * 1.4 + side) * 4;
      const baseAngle = side * 0.54; // Crossed outward from behind center
      const curAngle = side * lerp(0.18, 0.54, emerge);
      const slideOut = lerp(-42, 34, emerge); // Slides outward from behind the central shadow plane
      const depthScale = sc * lerp(0.76, 1.0, emerge);
      const a = clamp(emerge * 0.92 * k, 0, 0.96);

      const tx = cx + side * slideOut;
      const ty = cy + hover;

      const toWorld = (lx, ly) => {
        const sx = lx * depthScale, sy = ly * depthScale;
        const c = Math.cos(curAngle), s = Math.sin(curAngle);
        return { x: tx + sx * c - sy * s, y: ty + sx * s + sy * c };
      };

      ctx.save();
      ctx.translate(tx, ty);
      ctx.rotate(curAngle);
      ctx.scale(depthScale, depthScale);

      // Subtle cerulean blade-aura glow behind steel
      const auraG = ctx.createLinearGradient(0, 120, 0, -235);
      auraG.addColorStop(0, 'rgba(56, 189, 248, 0)');
      auraG.addColorStop(0.55, `rgba(56, 189, 248, ${(0.22 * a).toFixed(3)})`);
      auraG.addColorStop(1, `rgba(224, 242, 254, ${(0.30 * a).toFixed(3)})`);
      ctx.fillStyle = auraG;
      ctx.beginPath();
      ctx.ellipse(0, -65, 22, 185, 0, 0, TAU);
      ctx.fill();

      // Main slender blade with Sōgyo no Kotowari's unmistakable reverse-hook prong near the upper spine
      const steelG = ctx.createLinearGradient(-11, 0, 11, 0);
      steelG.addColorStop(0, `rgba(30, 58, 95, ${(0.88 * a).toFixed(3)})`);
      steelG.addColorStop(0.45, `rgba(186, 230, 253, ${(0.88 * a).toFixed(3)})`);
      steelG.addColorStop(0.85, `rgba(240, 249, 255, ${(0.94 * a).toFixed(3)})`);
      steelG.addColorStop(1, `rgba(125, 211, 252, ${(0.88 * a).toFixed(3)})`);

      ctx.fillStyle = steelG;
      ctx.strokeStyle = `rgba(224, 242, 254, ${(0.82 * a).toFixed(3)})`;
      ctx.lineWidth = 1.3;
      ctx.lineJoin = 'round';

      // Blade faces outward (side = -1 -> cutting edge left, reverse hook right; side = +1 -> mirrored)
      ctx.beginPath();
      ctx.moveTo(-side * 7.5, 68);
      ctx.lineTo(-side * 6.5, -138);
      // Iconic Sōgyo no Kotowari reverse-hooked rear fin/notch near the upper third!
      ctx.lineTo(-side * 19, -118);
      ctx.lineTo(-side * 14, -158);
      ctx.lineTo(-side * 6.5, -172);
      ctx.lineTo(0, -228); // Razor sword point
      ctx.lineTo(side * 8.5, -184);
      ctx.lineTo(side * 8.5, 68);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Razor specular gleam running along outer cutting edge
      ctx.strokeStyle = `rgba(255, 255, 255, ${(0.90 * a).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(side * 7.2, 64);
      ctx.lineTo(side * 7.2, -182);
      ctx.lineTo(0, -226);
      ctx.stroke();

      // Rectangular bronze-gold tsuba guard + habaki collar
      ctx.fillStyle = `rgba(217, 119, 6, ${(0.90 * a).toFixed(3)})`;
      ctx.fillRect(-10, 56, 20, 12);
      ctx.fillStyle = `rgba(15, 23, 42, ${(0.92 * a).toFixed(3)})`;
      ctx.strokeStyle = `rgba(245, 158, 11, ${(0.82 * a).toFixed(3)})`;
      ctx.lineWidth = 1.5;
      ctx.fillRect(-20, 68, 40, 10);
      ctx.strokeRect(-20, 68, 40, 10);

      // Crimson-and-navy wrapped hilt (tsuka) descending behind center
      ctx.fillStyle = `rgba(18, 24, 42, ${(0.92 * a).toFixed(3)})`;
      ctx.strokeStyle = `rgba(220, 38, 38, ${(0.72 * a).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      ctx.fillRect(-7.5, 78, 15, 76);
      ctx.strokeRect(-7.5, 78, 15, 76);
      for (let hy = 84; hy < 146; hy += 12) {
        ctx.beginPath();
        ctx.moveTo(-7, hy); ctx.lineTo(7, hy + 6);
        ctx.moveTo(7, hy);  ctx.lineTo(-7, hy + 6);
        ctx.stroke();
      }

      // Golden pommel ring (kashira) where the talisman cord anchors
      ctx.strokeStyle = `rgba(245, 158, 11, ${(0.86 * a).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 158, 5, 0, TAU);
      ctx.stroke();

      ctx.restore();

      return {
        tip: toWorld(0, -226),
        guard: toWorld(0, 72),
        pommel: toWorld(0, 158),
        angle: baseAngle
      };
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);
      const ix = w * this.o.impact[0];
      const iy = h * this.o.impact[1];
      const sc = Math.min(w / 360, h / 560);

      ctx.clearRect(0, 0, w, h);

      // 1. Mimihagi quiet dark stillness ripples breathing near the base
      const stillVis = clamp((t - 0.35) / 1.1, 0, 1);
      if (stillVis > 0.01) {
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const cyc = ((t * 0.26 + i / 3) % 1);
          const rad = 20 + easeOutCubic(cyc) * w * 0.46;
          const a = (1 - cyc) * 0.26 * stillVis * k;
          ctx.strokeStyle = `rgba(148, 163, 184, ${a.toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.ellipse(ix, h * 0.84, rad, rad * 0.28, 0, 0, TAU);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 2. Twin Sōgyo no Kotowari Swords sliding & emerging outward from behind center
      const emergeL = easeOutCubic(clamp(t / 0.88, 0, 1));
      const emergeR = easeOutCubic(clamp((t - 0.10) / 0.88, 0, 1));
      const leftSword = this._drawSogyoBlade(ctx, ix, iy, -1, emergeL, sc, t, k);
      const rightSword = this._drawSogyoBlade(ctx, ix, iy, 1, emergeR, sc, t, k);

      // Soft central depth-shadow veil over where the hilts cross, enhancing the "emerging from behind" illusion
      const veilG = ctx.createRadialGradient(ix, iy + 54 * sc, 6, ix, iy + 54 * sc, 82 * sc);
      veilG.addColorStop(0, `rgba(6, 10, 22, ${(0.72 * k).toFixed(3)})`);
      veilG.addColorStop(0.55, `rgba(10, 18, 36, ${(0.34 * k).toFixed(3)})`);
      veilG.addColorStop(1, 'rgba(6, 10, 22, 0)');
      ctx.fillStyle = veilG;
      ctx.beginPath();
      ctx.arc(ix, iy + 54 * sc, 82 * sc, 0, TAU);
      ctx.fill();

      // 3. Swaying crimson braided cord linking both hilts + 5 glowing golden-white ofuda talismans
      const cordProg = easeOutCubic(clamp((t - 0.55) / 0.72, 0, 1));
      if (cordProg > 0.01) {
        const p0 = leftSword.pommel;
        const p2 = rightSword.pommel;
        const ctrlX = (p0.x + p2.x) * 0.5 + Math.sin(t * 1.6) * 8;
        const ctrlY = Math.max(p0.y, p2.y) + 52 * sc + Math.cos(t * 1.9) * 6;

        ctx.save();
        // Crimson braided rope
        ctx.strokeStyle = `rgba(220, 38, 38, ${(0.72 * cordProg * k).toFixed(3)})`;
        ctx.lineWidth = 2.6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.quadraticCurveTo(ctrlX, ctrlY, p2.x, p2.y);
        ctx.stroke();

        ctx.strokeStyle = `rgba(245, 158, 11, ${(0.55 * cordProg * k).toFixed(3)})`;
        ctx.lineWidth = 0.9;
        ctx.stroke();

        // Five iconic ofuda talisman charms hanging cleanly along the swaying rope
        const pulseCycle = (t * 0.42) % 1; // Energy absorption -> 5 charms -> redirection cycle
        for (let i = 0; i < 5; i++) {
          const delay = 0.72 + i * 0.13;
          if (t < delay) continue;
          const ignite = easeOutCubic(clamp((t - delay) / 0.34, 0, 1));
          const u = (i + 1) / 6;
          const omu = 1 - u;
          const tx = omu * omu * p0.x + 2 * omu * u * ctrlX + u * u * p2.x;
          const ty = omu * omu * p0.y + 2 * omu * u * ctrlY + u * u * p2.y;
          const sway = Math.sin(t * 2.1 + i * 0.85) * 0.11;
          const activeGlow = Math.exp(-Math.pow((pulseCycle - (0.28 + i * 0.11)) * 12, 2));

          ctx.save();
          ctx.translate(tx, ty);
          ctx.rotate(sway);
          ctx.fillStyle = activeGlow > 0.25
            ? `rgba(24, 54, 88, ${(0.88 * ignite * k).toFixed(3)})`
            : `rgba(12, 18, 36, ${(0.82 * ignite * k).toFixed(3)})`;
          ctx.strokeStyle = activeGlow > 0.25
            ? `rgba(224, 242, 254, ${(0.95 * ignite * k).toFixed(3)})`
            : `rgba(245, 158, 11, ${(0.76 * ignite * k).toFixed(3)})`;
          ctx.lineWidth = 1.2;
          ctx.fillRect(-6, 0, 12, 22);
          ctx.strokeRect(-6, 0, 12, 22);

          // Glowing seal ink strokes
          ctx.strokeStyle = activeGlow > 0.25
            ? `rgba(125, 211, 252, ${(0.95 * ignite * k).toFixed(3)})`
            : `rgba(56, 189, 248, ${(0.75 * ignite * k).toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(0, 4); ctx.lineTo(0, 18);
          ctx.moveTo(-3, 8); ctx.lineTo(3, 8);
          ctx.moveTo(-3, 14); ctx.lineTo(3, 14);
          ctx.stroke();
          ctx.restore();
        }

        // Traveling azure-white energy orb: enters left tip -> glides down blade -> arcs across 5 charms -> blasts out right tip!
        if (t > 1.05) {
          let ox, oy;
          if (pulseCycle < 0.28) {
            const f = pulseCycle / 0.28;
            ox = lerp(leftSword.tip.x, p0.x, f);
            oy = lerp(leftSword.tip.y, p0.y, f);
          } else if (pulseCycle < 0.72) {
            const f = (pulseCycle - 0.28) / 0.44;
            const omf = 1 - f;
            ox = omf * omf * p0.x + 2 * omf * f * ctrlX + f * f * p2.x;
            oy = omf * omf * p0.y + 2 * omf * f * ctrlY + f * f * p2.y;
          } else {
            const f = (pulseCycle - 0.72) / 0.28;
            ox = lerp(p2.x, rightSword.tip.x, f);
            oy = lerp(p2.y, rightSword.tip.y, f);
          }
          const og = ctx.createRadialGradient(ox, oy, 1, ox, oy, 22);
          og.addColorStop(0, `rgba(255, 255, 255, ${(0.92 * k).toFixed(3)})`);
          og.addColorStop(0.45, `rgba(56, 189, 248, ${(0.48 * k).toFixed(3)})`);
          og.addColorStop(1, 'rgba(56, 189, 248, 0)');
          ctx.fillStyle = og;
          ctx.beginPath();
          ctx.arc(ox, oy, 22, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }

      // 4. Drifting serene pearl-azure & gold spirit motes
      const sparkVis = clamp((t - 0.30) / 0.9, 0, 1);
      if (sparkVis > 0.01) {
        ctx.save();
        for (let i = 0; i < this.sparks.length; i++) {
          const sp = this.sparks[i];
          sp.x += (sp.vx + Math.sin(t * 1.1 + sp.phase) * 9) * dt;
          sp.y += sp.vy * dt;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.43) % w; }
          if (sp.x < -10) sp.x = w + 10;
          if (sp.x > w + 10) sp.x = -10;
          const tw = 0.45 + 0.55 * Math.sin(t * 3.1 + sp.phase);
          const a = sp.alpha * tw * sparkVis * k;
          ctx.fillStyle = sp.gold
            ? `rgba(251, 191, 36, ${a.toFixed(3)})`
            : `rgba(186, 230, 253, ${a.toFixed(3)})`;
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
      if (this.rafId !== null) { cancelAnimationFrame(this.rafId); this.rafId = null; }
      this.el.classList.remove('uk-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('ukitake-panel');
      inst.delete(this.el);
    }
  }

  g.UkitakePanel = {
    attach(el, opts) { return el ? (inst.get(el) || new UkitakeEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
