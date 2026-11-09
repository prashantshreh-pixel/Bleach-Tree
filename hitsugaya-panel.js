/**
 * hitsugaya-panel.js - Tōshirō Hitsugaya (Daiguren Hyōrinmaru / 氷輪丸):
 * Living Ice Dragon & Realistic Crystalline Glacier Engine.
 * Features:
 * - Serpentine Ice Dragon Hyōrinmaru soaring dynamically with fluid inverse kinematics
 * - Sprawling multi-faceted crystalline dragon wings with luminous glacial membranes
 * - Majestic dragon head with crystal horns, glowing sapphire eye, and frosty mist
 * - Realistic 3D faceted crystal icicles & ground frost mist
 * - Floating Crimson Lotus ice flowers (Zekku) with radiant ruby-to-cyan glow
 * - Atmospheric diamond blizzard particles & sub-zero mist
 * - Authentic traditional "氷輪丸" Hanko seal stamp
 * - Complete removal of geometric polygon/pentagon overlays
 *   const hg = HitsugayaPanel.attach(sidebar, { impact: [0.5, 0.28], seal: [0.84, 0.9], seed: 10 });
 *   hg.open();  hg.close();  hg.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap();

  class HG {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.28], seal: [0.84, 0.9], seed: 10, anchor: '#sidebar-content' }, o);
      this.isOpen = false;
      this.w = 0; this.h = 0;
      this.dpr = 1;
      this.rafId = null;
      this.lastTime = 0;
      this.simTime = 0;
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Serpentine Ice Dragon Spine: 34 segments
      this.numSegs = 34;
      this.segDist = 13;
      this.dragon = [];
      const startX = 200, startY = 240;
      for (let i = 0; i < this.numSegs; i++) {
        this.dragon.push({
          x: startX - i * this.segDist,
          y: startY + Math.sin(i * 0.3) * 15,
          angle: 0
        });
      }

      // Dragon Frost Breath / Cold Mist particles
      this.breathMist = [];

      // Blizzard Snow Particles (36 particles)
      this.particles = [];
      for (let i = 0; i < 36; i++) {
        this.particles.push({
          x: Math.random() * 400,
          y: Math.random() * 800,
          size: 1.1 + Math.random() * 2.2,
          speedY: 0.6 + Math.random() * 1.4,
          speedX: (Math.random() - 0.5) * 0.6,
          swayPhase: Math.random() * Math.PI * 2,
          swaySpeed: 0.8 + Math.random() * 1.2,
          op: 0.35 + Math.random() * 0.55,
          isStar: Math.random() > 0.60
        });
      }

      this._build();
      inst.set(el, this);
    }

    _div(c) {
      const n = document.createElement('div');
      n.className = 'hg-layer ' + c;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('hitsugaya-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      // Glacial ambient wash
      this.wash = this._div('hg-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');

      // Living Ice Dragon HTML5 Canvas
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'hg-layer hg-canvas';
      this.canvas.setAttribute('aria-hidden', 'true');
      this.ctx = this.canvas.getContext('2d');

      [this.wash, this.canvas].forEach(n => el.insertBefore(n, ref)); // strictly behind text (z-index: 1)

      // Authentic Traditional Hanko Seal with "氷輪丸" (Hyōrinmaru)
      this.seal = this._div('hg-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 64 64" aria-hidden="true">' +
        '<!-- Frosted Round Hanko Seal Base -->' +
        '<circle cx="32" cy="32" r="28" fill="#082f49" stroke="#38bdf8" stroke-width="2"/>' +
        '<circle cx="32" cy="32" r="24" fill="none" stroke="rgba(224,242,254,0.6)" stroke-width="1.2"/>' +
        '<!-- Ice Star Accents at cardinal points -->' +
        '<circle cx="32" cy="8" r="1.5" fill="#f0f9ff"/>' +
        '<circle cx="56" cy="32" r="1.5" fill="#f0f9ff"/>' +
        '<circle cx="32" cy="56" r="1.5" fill="#f0f9ff"/>' +
        '<circle cx="8" cy="32" r="1.5" fill="#f0f9ff"/>' +
        '<!-- Kanji 氷 (Ice) top-center -->' +
        '<path d="M32 14V27M32 20L25 17M32 22L39 18M26 27L38 27" stroke="#e0f2fe" stroke-width="1.8" stroke-linecap="round"/>' +
        '<!-- Kanji 輪 (Ring/Wheel) lower-left -->' +
        '<path d="M20 32H27V48H20ZM20 37H27M20 43H27" stroke="#e0f2fe" stroke-width="1.3" fill="none"/>' +
        '<path d="M29 32H35M32 30V48M29 48H35" stroke="#e0f2fe" stroke-width="1.4" stroke-linecap="round"/>' +
        '<!-- Kanji 丸 (Circle/Maru) lower-right -->' +
        '<path d="M40 33H48M44 33V49M48 37C48 43 45 48 39 49M44 41L50 49" stroke="#e0f2fe" stroke-width="1.5" stroke-linecap="round" fill="none"/>' +
        '</svg>';

      this.ring = this._div('hg-ring');
      [this.seal, this.ring].forEach(n => el.appendChild(n));

      this._resize();
      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(() => this._resize());
        this.ro.observe(el);
      }
    }

    _resize() {
      const w = this.el.clientWidth || 360;
      const h = this.el.clientHeight || 540;
      if (w === this.w && h === this.h) return;
      this.w = w; this.h = h;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = Math.round(w * this.dpr);
      this.canvas.height = Math.round(h * this.dpr);
      this.canvas.style.width = w + 'px';
      this.canvas.style.height = h + 'px';
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.el.classList.add('hg-open');
      this._resize();
      this.lastTime = performance.now();
      this._startLoop();
    }

    close() {
      this.isOpen = false;
      this.el.classList.remove('hg-open');
      if (this.rafId) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.ctx && this.w && this.h) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }

    replay() {
      this.close();
      setTimeout(() => {
        if (this.el.classList.contains('open')) this.open();
      }, 60);
    }

    destroy() {
      this.close();
      if (this.ro) this.ro.disconnect();
      [this.wash, this.canvas, this.seal, this.ring].forEach(n => n && n.remove());
      this.el.classList.remove('hitsugaya-panel');
      inst.delete(this.el);
    }

    _startLoop() {
      if (this.rafId) return;
      const frame = (now) => {
        if (!this.isOpen) return;
        const dt = Math.min((now - this.lastTime) / 1000, 0.1);
        this.lastTime = now;
        this.simTime += dt;

        this._render(dt);
        this.rafId = requestAnimationFrame(frame);
      };
      this.rafId = requestAnimationFrame(frame);
    }

    _render(dt) {
      const ctx = this.ctx;
      if (!ctx) return;
      const { w, h, dpr } = this;
      if (!w || !h) return;

      ctx.save();
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      ctx.scale(dpr, dpr);

      const t = this.simTime;

      // 1. UPDATE DRAGON SERPENTINE MOTION
      // Wide, sweeping, majestic celestial flight trajectory across upper & middle sections
      const cx = w * 0.52;
      const cy = h * 0.38;
      const speed = this.rm ? 0.08 : 0.38;
      const flightT = t * speed;

      // Broad celestial loops
      const targetX = cx + Math.cos(flightT * 0.75) * (w * 0.38) + Math.sin(flightT * 1.5) * (w * 0.12);
      const targetY = cy + Math.sin(flightT * 1.05) * (h * 0.18) + Math.cos(flightT * 0.5) * 16;

      const head = this.dragon[0];
      const hDx = targetX - head.x;
      const hDy = targetY - head.y;
      const targetAngle = Math.atan2(hDy, hDx);

      // Smooth angular steering
      let diff = targetAngle - head.angle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;
      head.angle += diff * 0.07;

      const dist = Math.hypot(hDx, hDy);
      const moveSpeed = Math.min(dist * 0.05 + 1.2, 3.0);
      head.x += Math.cos(head.angle) * moveSpeed;
      head.y += Math.sin(head.angle) * moveSpeed;

      // Kinematic follow-the-leader chain down the spine
      for (let i = 1; i < this.numSegs; i++) {
        const prev = this.dragon[i - 1];
        const curr = this.dragon[i];
        const dx = prev.x - curr.x;
        const dy = prev.y - curr.y;
        curr.angle = Math.atan2(dy, dx);
        curr.x = prev.x - Math.cos(curr.angle) * this.segDist;
        curr.y = prev.y - Math.sin(curr.angle) * this.segDist;
      }

      // Emit Frost Breath Mist from dragon snout
      if (Math.random() < 0.45) {
        this.breathMist.push({
          x: head.x + Math.cos(head.angle) * 22,
          y: head.y + Math.sin(head.angle) * 22,
          vx: Math.cos(head.angle + (Math.random() - 0.5) * 0.6) * 1.6,
          vy: Math.sin(head.angle + (Math.random() - 0.5) * 0.6) * 1.6,
          size: 3 + Math.random() * 4,
          life: 1.0,
          decay: 0.02 + Math.random() * 0.02
        });
      }

      // 2. DRAW DRAGON BODY (Back to Front)
      this._drawBreathMist(ctx);
      this._drawDragon(ctx, t);

      // 3. DRAW FLOATING CRIMSON LOTUS PETALS (Zekku)
      this._drawCrimsonLotuses(ctx, t, w, h);

      // 4. DRAW REALISTIC 3D FACETED ICICLE SPIRES
      this._drawRealisticIceSpires(ctx, w, h);

      // 5. DRAW DRIFTING DIAMOND BLIZZARD SNOWFLAKES
      this._drawSnowfall(ctx, dt, w, h);

      ctx.restore();
    }

    _drawBreathMist(ctx) {
      for (let i = this.breathMist.length - 1; i >= 0; i--) {
        const m = this.breathMist[i];
        m.x += m.vx;
        m.y += m.vy;
        m.size += 0.25;
        m.life -= m.decay;
        if (m.life <= 0) {
          this.breathMist.splice(i, 1);
          continue;
        }

        ctx.fillStyle = `rgba(186, 230, 253, ${m.life * 0.28})`;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    _drawDragon(ctx, t) {
      const segs = this.dragon;
      const n = segs.length;

      ctx.save();

      // Ambient Glacial Glow behind Dragon
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 18;

      // Draw Serpentine Body Outer Aura
      ctx.beginPath();
      ctx.moveTo(segs[0].x, segs[0].y);
      for (let i = 1; i < n; i++) {
        const xc = (segs[i].x + segs[i - 1].x) / 2;
        const yc = (segs[i].y + segs[i - 1].y) / 2;
        ctx.quadraticCurveTo(segs[i - 1].x, segs[i - 1].y, xc, yc);
      }
      ctx.strokeStyle = 'rgba(14, 165, 233, 0.35)';
      ctx.lineWidth = 22;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Draw Main Crystalline Dragon Body
      ctx.beginPath();
      ctx.moveTo(segs[0].x, segs[0].y);
      for (let i = 1; i < n; i++) {
        const xc = (segs[i].x + segs[i - 1].x) / 2;
        const yc = (segs[i].y + segs[i - 1].y) / 2;
        ctx.quadraticCurveTo(segs[i - 1].x, segs[i - 1].y, xc, yc);
      }
      const bodyGrad = ctx.createLinearGradient(segs[0].x, segs[0].y, segs[n - 1].x, segs[n - 1].y);
      bodyGrad.addColorStop(0, '#ffffff');
      bodyGrad.addColorStop(0.25, '#bae6fd');
      bodyGrad.addColorStop(0.65, '#0284c7');
      bodyGrad.addColorStop(1, '#082f49');
      ctx.strokeStyle = bodyGrad;
      ctx.lineWidth = 14;
      ctx.stroke();

      // Sharp Specular Backbone Ridge (Ice Gleam)
      ctx.beginPath();
      ctx.moveTo(segs[0].x, segs[0].y);
      for (let i = 1; i < n; i++) {
        const xc = (segs[i].x + segs[i - 1].x) / 2;
        const yc = (segs[i].y + segs[i - 1].y) / 2;
        ctx.quadraticCurveTo(segs[i - 1].x, segs[i - 1].y, xc, yc);
      }
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 2.4;
      ctx.stroke();

      ctx.shadowBlur = 0; // reset blur for crisp crystal facets

      // Dorsal Crystalline Spines (Ripple with serpentine movement)
      for (let i = 3; i < n - 4; i += 2) {
        const seg = segs[i];
        const normal = seg.angle + Math.PI / 2;
        const spineLen = 14 - Math.abs(i - 14) * 0.45;
        const sx = seg.x + Math.cos(normal) * spineLen;
        const sy = seg.y + Math.sin(normal) * spineLen;

        ctx.fillStyle = 'rgba(224, 242, 254, 0.9)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(seg.x - Math.cos(seg.angle) * 3, seg.y - Math.sin(seg.angle) * 3);
        ctx.lineTo(sx, sy);
        ctx.lineTo(seg.x + Math.cos(seg.angle) * 3, seg.y + Math.sin(seg.angle) * 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // 2b. SPRAWLING ARTICULATED CRYSTALLINE WINGS (Sprouting from segment 6)
      const wingBase = segs[6];
      const wingAngle = wingBase.angle;
      const flap = Math.sin(t * 3.8) * 0.38; // majestic wing flap rhythm

      // Left Wing
      this._drawWing(ctx, wingBase.x, wingBase.y, wingAngle - Math.PI / 2 + flap, 1);
      // Right Wing
      this._drawWing(ctx, wingBase.x, wingBase.y, wingAngle + Math.PI / 2 - flap, -1);

      // 2c. CRESCENT BLADE TAIL (Hyōrinmaru's signature chain blade tail)
      const tail = segs[n - 1];
      ctx.save();
      ctx.translate(tail.x, tail.y);
      ctx.rotate(tail.angle);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(0, 0, 12, -Math.PI / 2, Math.PI / 2, false);
      ctx.quadraticCurveTo(-5, 0, 0, -Math.PI / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // 2d. MAJESTIC DRAGON HEAD
      this._drawDragonHead(ctx, segs[0], t);

      ctx.restore();
    }

    _drawWing(ctx, x, y, angle, side) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      const span = 58;
      // 4 articulated crystal wing fingers
      const p1x = span * 0.95, p1y = -side * 22;
      const p2x = span * 0.85, p2y = side * 2;
      const p3x = span * 0.65, p3y = side * 20;
      const p4x = span * 0.40, p4y = side * 32;

      // Translucent multi-faceted glacial wing membrane
      const wingGrad = ctx.createLinearGradient(0, 0, span, 0);
      wingGrad.addColorStop(0, 'rgba(240, 249, 255, 0.45)');
      wingGrad.addColorStop(0.5, 'rgba(125, 211, 252, 0.22)');
      wingGrad.addColorStop(1, 'rgba(2, 132, 199, 0.08)');

      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = 'rgba(240, 249, 255, 0.85)';
      ctx.lineWidth = 1.2;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.lineTo(p4x, p4y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp ice wing strut bones
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(p1x, p1y);
      ctx.moveTo(0, 0); ctx.lineTo(p2x, p2y);
      ctx.moveTo(0, 0); ctx.lineTo(p3x, p3y);
      ctx.stroke();

      // Specular diamond wing tips
      ctx.fillStyle = '#ffffff';
      [ [p1x, p1y], [p2x, p2y], [p3x, p3y], [p4x, p4y] ].forEach(([px, py]) => {
        ctx.beginPath();
        ctx.arc(px, py, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
    }

    _drawDragonHead(ctx, head, t) {
      ctx.save();
      ctx.translate(head.x, head.y);
      ctx.rotate(head.angle);

      // Crystalline Dragon Snout & Skull
      ctx.fillStyle = '#e0f2fe';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.3;

      ctx.beginPath();
      ctx.moveTo(-12, -7);
      ctx.lineTo(16, -5);
      ctx.lineTo(28, 2);
      ctx.lineTo(14, 7);
      ctx.lineTo(-10, 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Lower Jaw with Icicle Teeth
      ctx.beginPath();
      ctx.moveTo(-4, 7);
      ctx.lineTo(18, 7);
      ctx.lineTo(10, 13);
      ctx.lineTo(-2, 12);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Sharp white fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(12, 7); ctx.lineTo(14, 11); ctx.lineTo(16, 7);
      ctx.moveTo(6, 7); ctx.lineTo(8, 11); ctx.lineTo(10, 7);
      ctx.fill();

      // Sweeping Crystalline Antlers / Horns (jutting backwards)
      ctx.fillStyle = '#bae6fd';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;

      // Main upper crystal horn
      ctx.beginPath();
      ctx.moveTo(2, -5);
      ctx.quadraticCurveTo(-16, -16, -35, -20);
      ctx.quadraticCurveTo(-18, -7, -2, -3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Secondary lower crystal horn
      ctx.beginPath();
      ctx.moveTo(-1, -2);
      ctx.quadraticCurveTo(-14, -5, -25, -7);
      ctx.quadraticCurveTo(-12, 0, -2, 3);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Flowing Whiskers (undulating smoothly in the airstream)
      const wSway = Math.sin(t * 3.5) * 4.5;
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.95)';
      ctx.lineWidth = 1.3;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.quadraticCurveTo(8, -14 + wSway, -26, -20 + wSway * 1.5);
      ctx.moveTo(18, 4);
      ctx.quadraticCurveTo(6, 16 - wSway, -22, 24 - wSway * 1.5);
      ctx.stroke();

      // Piercing Sapphire Eye (blinks / pulses with cold brilliance)
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(10, -1, 3.0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.arc(10, -1, 1.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    _drawCrimsonLotuses(ctx, t, w, h) {
      const lotuses = [
        { x: w * 0.76, y: h * 0.16, r: 12, speed: 0.8 },
        { x: w * 0.86, y: h * 0.27, r: 10, speed: -0.6 },
        { x: w * 0.72, y: h * 0.35, r: 8.5, speed: 0.9 }
      ];

      ctx.save();
      lotuses.forEach((lotus, idx) => {
        const rot = t * lotus.speed + idx * 1.2;
        const breath = 1 + Math.sin(t * 2.5 + idx) * 0.08;
        const rad = lotus.r * breath;

        ctx.save();
        ctx.translate(lotus.x, lotus.y);
        ctx.rotate(rot);

        // Radiant crimson-to-cyan gradient
        const grad = ctx.createRadialGradient(0, 0, 1, 0, 0, rad);
        grad.addColorStop(0, '#f43f5e');
        grad.addColorStop(0.45, '#e11d48');
        grad.addColorStop(0.85, '#38bdf8');
        grad.addColorStop(1, '#0284c7');

        ctx.fillStyle = grad;
        ctx.strokeStyle = '#fecdd3';
        ctx.lineWidth = 1.1;

        // 4-pointed diamond lotus petals
        ctx.beginPath();
        ctx.moveTo(0, -rad);
        ctx.quadraticCurveTo(rad * 0.3, -rad * 0.3, rad, 0);
        ctx.quadraticCurveTo(rad * 0.3, rad * 0.3, 0, rad);
        ctx.quadraticCurveTo(-rad * 0.3, rad * 0.3, -rad, 0);
        ctx.quadraticCurveTo(-rad * 0.3, -rad * 0.3, 0, -rad);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // White crystalline core glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });
      ctx.restore();
    }

    _drawRealisticIceSpires(ctx, w, h) {
      ctx.save();

      // Ground Frost Mist (atmospheric glow along bottom)
      const mistGrad = ctx.createRadialGradient(w * 0.5, h, 20, w * 0.5, h, w * 0.55);
      mistGrad.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
      mistGrad.addColorStop(0.6, 'rgba(14, 116, 144, 0.10)');
      mistGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, h * 0.85, w, h * 0.15);

      // Realistic 3D Faceted Crystal Spire Helper
      const drawPrism = (bx, by, width, height, tilt) => {
        const apexX = bx + tilt;
        const apexY = by - height;

        // Left illuminated facet
        const leftGrad = ctx.createLinearGradient(bx - width / 2, by, apexX, apexY);
        leftGrad.addColorStop(0, 'rgba(8, 47, 73, 0.6)');
        leftGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.55)');
        leftGrad.addColorStop(1, 'rgba(240, 249, 255, 0.95)');
        ctx.fillStyle = leftGrad;
        ctx.beginPath();
        ctx.moveTo(bx - width / 2, by);
        ctx.lineTo(bx, by);
        ctx.lineTo(apexX, apexY);
        ctx.closePath();
        ctx.fill();

        // Right shadow facet
        const rightGrad = ctx.createLinearGradient(bx, by, apexX, apexY);
        rightGrad.addColorStop(0, 'rgba(3, 7, 18, 0.7)');
        rightGrad.addColorStop(0.6, 'rgba(2, 132, 199, 0.45)');
        rightGrad.addColorStop(1, 'rgba(186, 230, 253, 0.8)');
        ctx.fillStyle = rightGrad;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx + width / 2, by);
        ctx.lineTo(apexX, apexY);
        ctx.closePath();
        ctx.fill();

        // Specular center ridge line (sharp crystalline glint)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(apexX, apexY);
        ctx.stroke();

        // Subtle outer crystal border
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.5)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(bx - width / 2, by);
        ctx.lineTo(apexX, apexY);
        ctx.lineTo(bx + width / 2, by);
        ctx.stroke();
      };

      // Left corner staggered crystal cluster
      drawPrism(w * 0.04, h, 24, 75, 4);
      drawPrism(w * 0.11, h, 20, 55, -2);
      drawPrism(w * 0.18, h, 22, 68, 6);
      drawPrism(w * 0.25, h, 18, 40, 3);

      // Right corner staggered crystal cluster
      drawPrism(w * 0.96, h, 24, 75, -4);
      drawPrism(w * 0.89, h, 20, 55, 2);
      drawPrism(w * 0.82, h, 22, 68, -6);
      drawPrism(w * 0.75, h, 18, 40, -3);

      ctx.restore();
    }

    _drawSnowfall(ctx, dt, w, h) {
      ctx.save();
      this.particles.forEach(p => {
        p.y += p.speedY;
        p.swayPhase += p.swaySpeed * dt;
        p.x += Math.sin(p.swayPhase) * 0.6 + p.speedX;

        // Wrap around
        if (p.y > h + 10) {
          p.y = -10;
          p.x = Math.random() * w;
        }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        ctx.fillStyle = `rgba(240, 249, 255, ${p.op})`;
        if (p.isStar) {
          // 4-pointed diamond sparkle
          ctx.beginPath();
          ctx.moveTo(p.x, p.y - p.size * 1.5);
          ctx.lineTo(p.x + p.size, p.y);
          ctx.lineTo(p.x, p.y + p.size * 1.5);
          ctx.lineTo(p.x - p.size, p.y);
          ctx.closePath();
          ctx.fill();
        } else {
          // Soft circular snow mote
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }
  }

  g.HitsugayaPanel = {
    attach(el, o) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new HG(el, o);
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
