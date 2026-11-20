/**
 * mayuri-panel.js - Mayuri Kurotsuchi (Konjiki Ashisogi Jizō — Baby Form & Poison Mist)
 * Entrance (0-3s):
 *   0.0-0.85s: Volumetric toxic violet & acid-chartreuse poison mist billows upward while the golden halo unfolds
 *   0.85-1.95s: Giant golden Konjiki Ashisogi Jizō caterpillar-baby form rises eerily out of the fog, staring hollow eyes
 *              ignite, metallic torso surgical blades fan outward, and lethal poison plumes exhale from its mouth
 *   1.95-3.0s: Settles into the hovering golden Bankai baby wreathed in thick rolling poison mist & rising spores
 * Idle loop: Gently breathing golden Bankai baby with rotating halo, protruding blades, rolling poison clouds & spores
 *
 * API: const my = MayuriPanel.attach(sidebar, options);
 *      my.open(); my.close(); my.replay(); my.destroy();
 */
(function (g) {
  'use strict';

  // --- TUNING DEFAULTS (edit lines 16-20 to customize) ---
  const DEFAULTS = {
    particles: 56,           // Line 17: volumetric poison mist clouds + mutagen spores
    intensity: 1.0,          // Line 18: brightness & alpha multiplier (0.4 - 1.6)
    seed: 1212,              // Line 19: deterministic PRNG seed
    impact: [0.5, 0.50],     // Line 20: normalized [x, y] Bankai baby manifestation point
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

  class MayuriEffect {
    constructor(el, opts = {}) {
      this.el = el;
      this.o = Object.assign({}, DEFAULTS, opts);
      this.isOpen = false;
      this.w = 0; this.h = 0; this.dpr = 1;
      this.rafId = null;
      this.simTime = 0; this.lastTime = 0; this.rm = false;
      this.mists = []; this.exhalePuffs = []; this.spores = [];
      this.mistSprites = [];
      this._tick = this._tick.bind(this);
      this._build();
      inst.set(el, this);
    }

    _div(cls) {
      const n = document.createElement('div');
      n.className = 'my-layer ' + cls;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    // Pre-render 2 multi-lobe volumetric poison-mist sprites (toxic violet & acid chartreuse)
    _buildMistSprites() {
      this.mistSprites = [];
      if (typeof document === 'undefined') return;
      const r = mulberry32(this.o.seed + 55);
      const tones = [
        [168, 42, 212], // poisonous royal-magenta violet
        [152, 224, 52]  // lethal acid chartreuse
      ];
      for (let s = 0; s < 2; s++) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 128;
        const cctx = c.getContext && c.getContext('2d');
        if (!cctx) continue;
        const [cr, cg, cb] = tones[s];
        for (let lobe = 0; lobe < 7; lobe++) {
          const ox = 64 + (r() - 0.5) * 44;
          const oy = 64 + (r() - 0.5) * 34;
          const rad = 24 + r() * 25;
          const grad = cctx.createRadialGradient(ox, oy, 2, ox, oy, rad);
          grad.addColorStop(0, `rgba(${cr},${cg},${cb},0.34)`);
          grad.addColorStop(0.55, `rgba(${cr},${cg},${cb},0.14)`);
          grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
          cctx.fillStyle = grad;
          cctx.beginPath();
          cctx.arc(ox, oy, rad, 0, TAU);
          cctx.fill();
        }
        this.mistSprites.push(c);
      }
    }

    _build() {
      const el = this.el;
      el.classList.add('mayuri-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('my-wash');
      this.wash.style.setProperty('--my-ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--my-iy', (this.o.impact[1] * 100) + '%');

      this.canvas = document.createElement('canvas');
      this.canvas.className = 'my-layer my-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      this.flash = this._div('my-flash');
      this.flash.style.setProperty('--my-ix', (this.o.impact[0] * 100) + '%');
      this.flash.style.setProperty('--my-iy', (this.o.impact[1] * 100) + '%');

      this.ring = this._div('my-ring');

      this.layers = [this.wash, this.canvas, this.flash, this.ring];
      this.layers.forEach(n => el.insertBefore(n, ref));

      this._buildMistSprites();
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
      const count = Math.max(16, Math.round(this.o.particles));
      const mistCount = Math.max(12, Math.min(26, Math.round(count * 0.40)));
      const sporeCount = Math.max(8, count - mistCount);
      this.simTime = 0;

      // Rolling ambient poison-mist banks (back & foreground)
      this.mists = [];
      for (let i = 0; i < mistCount; i++) {
        this.mists.push({
          fg: i % 3 === 0, // 1/3 drift in front of the golden baby, 2/3 billow behind
          spriteIdx: i % 2,
          x: r() * (w + 140) - 70,
          y: h * (0.28 + r() * 0.76),
          rx: 82 + r() * 68,
          ry: 56 + r() * 40,
          vx: (i % 2 === 0 ? 1 : -1) * (12 + r() * 18),
          vy: -(4 + r() * 10),
          rot: r() * TAU,
          rotS: (r() - 0.5) * 0.22,
          phase: r() * TAU,
          alpha: 0.34 + r() * 0.24
        });
      }

      // Exhaled toxic gas plumes billowing straight out from the Bankai baby's mouth
      this.exhalePuffs = [];
      for (let i = 0; i < 8; i++) {
        this.exhalePuffs.push({
          phase: i / 8,
          spreadX: (r() - 0.5) * 145,
          driftY: 45 + r() * 85,
          spriteIdx: i % 2
        });
      }

      // Bioluminescent toxic mutagen spores
      this.spores = [];
      for (let i = 0; i < sporeCount; i++) {
        this.spores.push({
          x: r() * w,
          y: r() * h,
          vy: -(12 + r() * 26),
          size: 1.2 + r() * 2.5,
          swayP: r() * TAU,
          swayS: 1.1 + r() * 1.6,
          hue: r(),
          alpha: 0.34 + r() * 0.56
        });
      }
    }

    _drawMistCloud(ctx, spriteIdx, x, y, rx, ry, rot, alpha) {
      const spr = this.mistSprites[spriteIdx];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      if (spr && typeof ctx.drawImage === 'function') {
        ctx.globalAlpha = clamp(alpha, 0, 0.92);
        ctx.drawImage(spr, -rx, -ry, rx * 2, ry * 2);
        ctx.globalAlpha = 1;
      } else {
        const gGrad = ctx.createRadialGradient(0, 0, 4, 0, 0, rx);
        if (spriteIdx === 1) {
          gGrad.addColorStop(0, `rgba(163, 230, 53, ${(alpha * 0.45).toFixed(3)})`);
          gGrad.addColorStop(1, 'rgba(163, 230, 53, 0)');
        } else {
          gGrad.addColorStop(0, `rgba(192, 38, 211, ${(alpha * 0.45).toFixed(3)})`);
          gGrad.addColorStop(1, 'rgba(192, 38, 211, 0)');
        }
        ctx.fillStyle = gGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draws Konjiki Ashisogi Jizō — the iconic giant golden caterpillar-baby Bankai with halo & chest blades
    _drawBankaiBaby(ctx, w, h, t, rise, k) {
      const cx = w * this.o.impact[0];
      const baseCy = h * (this.o.impact[1] + 0.08);
      const lift = (1 - rise) * 86;
      const hover = Math.sin(t * 1.35) * 6;
      const cy = baseCy + lift + hover;
      const sc = Math.min(w, h) / 360;
      const a = rise * 0.84 * k;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(sc, sc);

      // 1. Rotating Ornate Golden Konjiki Halo Ring behind the baby's head
      ctx.save();
      ctx.translate(0, -68);
      ctx.rotate(t * 0.20);
      ctx.strokeStyle = `rgba(234, 179, 8, ${(0.58 * a).toFixed(3)})`;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.arc(0, 0, 86, 0, TAU);
      ctx.stroke();

      ctx.strokeStyle = `rgba(254, 240, 138, ${(0.42 * a).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.arc(0, 0, 74, 0, TAU);
      ctx.stroke();
      ctx.setLineDash([]);

      for (let i = 0; i < 12; i++) {
        const ang = (i / 12) * TAU;
        ctx.save();
        ctx.rotate(ang);
        ctx.fillStyle = `rgba(250, 204, 21, ${(0.56 * a).toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(85, -3.5);
        ctx.lineTo(100, 0);
        ctx.lineTo(85, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // 2. Segmented Golden Caterpillar Lower Body (curved rings receding into poison mist)
      for (let seg = 3; seg >= 0; seg--) {
        const sy = 54 + seg * 38;
        const sw = 88 - seg * 8;
        const sh = 30;
        const segGrad = ctx.createRadialGradient(-18, sy - 8, 6, 0, sy, sw);
        segGrad.addColorStop(0, `rgba(234, 179, 8, ${(0.54 * a).toFixed(3)})`);
        segGrad.addColorStop(0.55, `rgba(133, 77, 14, ${(0.62 * a).toFixed(3)})`);
        segGrad.addColorStop(1, `rgba(38, 16, 48, ${(0.42 * a).toFixed(3)})`);
        ctx.fillStyle = segGrad;
        ctx.strokeStyle = `rgba(250, 204, 21, ${(0.38 * a).toFixed(3)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(0, sy, sw, sh, 0, 0, TAU);
        ctx.fill();
        ctx.stroke();
      }

      // 3. Draped Crimson-Purple & Gold Jizō Cape Collar around the neck/shoulders
      const capeGrad = ctx.createLinearGradient(0, -10, 0, 62);
      capeGrad.addColorStop(0, `rgba(112, 26, 117, ${(0.78 * a).toFixed(3)})`);
      capeGrad.addColorStop(0.65, `rgba(74, 14, 78, ${(0.82 * a).toFixed(3)})`);
      capeGrad.addColorStop(1, `rgba(30, 8, 42, ${(0.55 * a).toFixed(3)})`);
      ctx.fillStyle = capeGrad;
      ctx.strokeStyle = `rgba(250, 204, 21, ${(0.62 * a).toFixed(3)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-88, 52);
      ctx.quadraticCurveTo(-76, 8, -44, -8);
      ctx.quadraticCurveTo(0, 12, 44, -8);
      ctx.quadraticCurveTo(76, 8, 88, 52);
      ctx.quadraticCurveTo(44, 34, 0, 56);
      ctx.quadraticCurveTo(-44, 34, -88, 52);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // 4. Protruding Metallic Silver Surgical Chest Blades fanning outward from the collar
      const bladeOut = easeOutCubic(clamp((t - 0.65) / 0.65, 0, 1));
      if (bladeOut > 0.01) {
        const bladeAngles = [-0.88, -0.46, 0, 0.46, 0.88];
        for (let i = 0; i < bladeAngles.length; i++) {
          const ang = bladeAngles[i];
          const bLen = (48 + (i === 2 ? 16 : 0)) * bladeOut;
          ctx.save();
          ctx.translate(Math.sin(ang) * 44, 28 + Math.cos(ang) * 10);
          ctx.rotate(ang);
          ctx.fillStyle = `rgba(241, 245, 249, ${(0.76 * bladeOut * a).toFixed(3)})`;
          ctx.strokeStyle = `rgba(163, 230, 53, ${(0.62 * bladeOut * a).toFixed(3)})`;
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.moveTo(-3.2, 0);
          ctx.lineTo(0, bLen);
          ctx.lineTo(3.2, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }

      // 5. Giant Sculpted Golden Baby Head (cherubic cheeks, brow bumps, haunting hollow stare)
      const headG = ctx.createRadialGradient(-18, -86, 8, 0, -64, 68);
      headG.addColorStop(0, `rgba(254, 240, 138, ${(0.82 * a).toFixed(3)})`);
      headG.addColorStop(0.45, `rgba(217, 159, 14, ${(0.82 * a).toFixed(3)})`);
      headG.addColorStop(0.85, `rgba(133, 77, 14, ${(0.86 * a).toFixed(3)})`);
      headG.addColorStop(1, `rgba(58, 28, 20, ${(0.78 * a).toFixed(3)})`);
      ctx.fillStyle = headG;
      ctx.strokeStyle = `rgba(254, 240, 138, ${(0.55 * a).toFixed(3)})`;
      ctx.lineWidth = 1.5;

      // Iconic chubby golden baby head silhouette + ears
      ctx.beginPath();
      ctx.ellipse(0, -66, 56, 54, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();

      // Side baby ears
      ctx.beginPath();
      ctx.ellipse(-55, -62, 9, 14, -0.15, 0, TAU);
      ctx.ellipse(55, -62, 9, 14, 0.15, 0, TAU);
      ctx.fill();
      ctx.stroke();

      // Central Jizō forehead gem / third-eye seal
      ctx.fillStyle = `rgba(192, 38, 211, ${(0.85 * a).toFixed(3)})`;
      ctx.strokeStyle = `rgba(254, 240, 138, ${(0.85 * a).toFixed(3)})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(0, -94, 4.5, 0, TAU);
      ctx.fill();
      ctx.stroke();

      // Haunting wide staring glowing chartreuse-ivory eyes (open cleanly at 0.55s)
      const eyeOpen = easeOutCubic(clamp((t - 0.52) / 0.42, 0, 1));
      const eyeGlow = 0.8 + 0.2 * Math.sin(t * 2.8);
      for (let s = -1; s <= 1; s += 2) {
        const ex = s * 22, ey = -70;
        // Dark hollow socket rim
        ctx.fillStyle = `rgba(28, 8, 38, ${(0.88 * a).toFixed(3)})`;
        ctx.beginPath();
        ctx.ellipse(ex, ey, 14, 11 * (0.2 + 0.8 * eyeOpen), 0, 0, TAU);
        ctx.fill();

        if (eyeOpen > 0.05) {
          const eg = ctx.createRadialGradient(ex, ey, 1, ex, ey, 16 * eyeGlow);
          eg.addColorStop(0, `rgba(236, 252, 203, ${(0.94 * eyeOpen * a).toFixed(3)})`);
          eg.addColorStop(0.55, `rgba(163, 230, 53, ${(0.58 * eyeOpen * a).toFixed(3)})`);
          eg.addColorStop(1, 'rgba(163, 230, 53, 0)');
          ctx.fillStyle = eg;
          ctx.beginPath();
          ctx.arc(ex, ey, 16 * eyeGlow, 0, TAU);
          ctx.fill();

          ctx.fillStyle = `rgba(247, 254, 231, ${(0.95 * eyeOpen * a).toFixed(3)})`;
          ctx.beginPath();
          ctx.ellipse(ex, ey, 10, 7.5 * eyeOpen, 0, 0, TAU);
          ctx.fill();

          // Tiny eerie pinhole pupil
          ctx.fillStyle = `rgba(26, 8, 36, ${(0.92 * a).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(ex, ey, 2.3, 0, TAU);
          ctx.fill();
        }
      }

      // Eerie gaping grimacing baby mouth exhaling toxic purple-green miasma
      const mouthOpen = 0.55 + 0.45 * Math.sin(t * 1.9);
      ctx.fillStyle = `rgba(38, 6, 48, ${(0.92 * a).toFixed(3)})`;
      ctx.strokeStyle = `rgba(217, 119, 6, ${(0.75 * a).toFixed(3)})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(0, -34, 24, 9 + mouthOpen * 5, 0, 0, TAU);
      ctx.fill();
      ctx.stroke();

      // Glowing toxic gas glow inside the open mouth
      const mg = ctx.createRadialGradient(0, -34, 2, 0, -34, 22);
      mg.addColorStop(0, `rgba(163, 230, 53, ${(0.58 * a).toFixed(3)})`);
      mg.addColorStop(0.6, `rgba(192, 38, 211, ${(0.32 * a).toFixed(3)})`);
      mg.addColorStop(1, 'rgba(192, 38, 211, 0)');
      ctx.fillStyle = mg;
      ctx.beginPath();
      ctx.arc(0, -34, 22, 0, TAU);
      ctx.fill();

      // Grimacing ivory teeth bars
      ctx.strokeStyle = `rgba(254, 249, 195, ${(0.62 * a).toFixed(3)})`;
      ctx.lineWidth = 1.2;
      for (let tx = -16; tx <= 16; tx += 8) {
        ctx.beginPath();
        ctx.moveTo(tx, -41);
        ctx.lineTo(tx, -27);
        ctx.stroke();
      }

      ctx.restore();
      return { mouthX: cx, mouthY: cy - 34 * sc };
    }

    _render(t, dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const w = this.w, h = this.h;
      const k = clamp(this.o.intensity, 0.3, 2.0);

      ctx.clearRect(0, 0, w, h);

      const fogIntro = easeOutCubic(clamp(t / 1.15, 0, 1));

      // 1. Background rolling poison-mist clouds behind the Bankai baby
      for (let i = 0; i < this.mists.length; i++) {
        const m = this.mists[i];
        m.rot += m.rotS * dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        if (m.y + m.ry < -20) { m.y = h + m.ry * 0.6; m.x = (m.x + w * 0.41) % w; }
        if (m.vx > 0 && m.x - m.rx > w + 40) m.x = -m.rx - 20;
        if (m.vx < 0 && m.x + m.rx < -40) m.x = w + m.rx + 20;
        if (!m.fg) {
          this._drawMistCloud(ctx, m.spriteIdx, m.x, m.y, m.rx, m.ry, m.rot, m.alpha * fogIntro * k);
        }
      }

      // 2. Giant Golden Konjiki Ashisogi Jizō Bankai Baby Form rising out of the mist
      const babyRise = easeOutCubic(clamp((t - 0.15) / 1.15, 0, 1));
      let mouth = { mouthX: w * 0.5, mouthY: h * 0.48 };
      if (babyRise > 0.01) {
        mouth = this._drawBankaiBaby(ctx, w, h, t, babyRise, k);
      }

      // 3. Exhaled toxic purple-and-chartreuse poison mist plumes billowing from the baby's mouth
      if (t > 0.55) {
        for (let i = 0; i < this.exhalePuffs.length; i++) {
          const ep = this.exhalePuffs[i];
          const u = ((t - 0.55) * 0.34 + ep.phase) % 1;
          const ex = mouth.mouthX + ep.spreadX * easeOutCubic(u);
          const ey = mouth.mouthY + ep.driftY * u + Math.sin(u * Math.PI * 2 + i) * 14;
          const rad = 28 + u * 88;
          const alpha = Math.sin(u * Math.PI) * 0.52 * k;
          this._drawMistCloud(ctx, ep.spriteIdx, ex, ey, rad, rad * 0.72, u * 1.4 + i, alpha);
        }
      }

      // 4. Foreground translucent poison-mist veils curling across the lower panel
      for (let i = 0; i < this.mists.length; i++) {
        const m = this.mists[i];
        if (m.fg) {
          this._drawMistCloud(ctx, m.spriteIdx, m.x, m.y, m.rx, m.ry, m.rot, m.alpha * 0.75 * fogIntro * k);
        }
      }

      // 5. Rising bioluminescent mutagen spores
      if (fogIntro > 0.05) {
        ctx.save();
        for (let i = 0; i < this.spores.length; i++) {
          const sp = this.spores[i];
          sp.swayP += sp.swayS * dt;
          sp.y += sp.vy * dt;
          sp.x += Math.sin(sp.swayP) * 11 * dt;
          if (sp.y < -10) { sp.y = h + 10; sp.x = (sp.x + w * 0.37) % w; }
          const glow = 0.5 + 0.5 * Math.sin(t * 3.6 + sp.swayP);
          const a = sp.alpha * (0.5 + 0.5 * glow) * fogIntro * k;
          ctx.fillStyle = sp.hue < 0.48
            ? `rgba(163, 230, 53, ${a.toFixed(3)})`
            : (sp.hue < 0.82 ? `rgba(232, 121, 249, ${a.toFixed(3)})` : `rgba(250, 204, 21, ${a.toFixed(3)})`);
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
      this.el.classList.remove('my-open');
      void this.el.offsetWidth;
      this._measure(true);
      this._resetSim();
      this.el.classList.add('my-open');
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
      this.el.classList.remove('my-open');
      if (this.ctx) this.ctx.clearRect(0, 0, this.w, this.h);
    }

    destroy() {
      this.close();
      if (this.ro) { this.ro.disconnect(); this.ro = null; }
      this.layers.forEach(n => n && n.remove());
      this.el.classList.remove('mayuri-panel');
      inst.delete(this.el);
    }
  }

  g.MayuriPanel = {
    attach(el, opts) { return el ? (inst.get(el) || new MayuriEffect(el, opts)) : null; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
