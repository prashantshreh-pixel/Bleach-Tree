/**
 * kira-panel.js - Izuru Kira ("Wabisuke" / The Gallows of Penance Bankai):
 * Based on Tite Kubo's official sketch: towering braided gallows cord rising
 * into an ominous executioner canopy, hanging noose loops, dragging iron chains
 * trailing from twin hooked Wabisuke scythes onto the floor, downward-pressing
 * gravitational distortion waves, sinking weight motes, and authentic "侘助" seal.
 *   const iz = KiraPanel.attach(sidebar, { impact: [0.5, 0.85], seal: [0.84, 0.9], seed: 44 });
 *   iz.open();  iz.close();  iz.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  class IZ {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.85], seal: [0.84, 0.9], seed: 44, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'iz-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('kira-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('iz-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');

      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('class', 'iz-layer iz-svg');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      [this.wash, this.svg].forEach(n => el.insertBefore(n, ref)); // behind text

      // Authentic Cinnabar Hanko Seal with "侘助" (Wabisuke)
      this.seal = this._div('iz-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#iz-rough)">' +
        '<rect x="4" y="4" width="52" height="52" rx="7" fill="#334155"/>' +
        '<rect x="8" y="8" width="44" height="44" rx="4" fill="none" stroke="rgba(241,245,249,.65)" stroke-width="1.6"/>' +
        '<!-- Wabisuke Hook motif -->' +
        '<path d="M14 16H22V26H14" fill="none" stroke="rgba(241,245,249,.4)" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<path d="M46 16H38V26H46" fill="none" stroke="rgba(241,245,249,.4)" stroke-width="1.4" stroke-linejoin="round"/>' +
        '<!-- Kanji 侘 (Wabi) left -->' +
        '<path d="M18 20V46M18 31L23 25M20 36L25 46" stroke="#f1f5f9" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M25 21H31M28 17V26" stroke="#f1f5f9" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M24 28H32V42H24Z" stroke="#f1f5f9" stroke-width="1.6" fill="none"/>' +
        '<!-- Kanji 助 (Suke) right -->' +
        '<path d="M36 22H45M36 31H45M40 18V45" stroke="#f1f5f9" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M44 26C47 26 48 29 48 35C48 42 45 46 41 46" stroke="#f1f5f9" stroke-width="1.8" stroke-linecap="round" fill="none"/>' +
        '</g></svg>';

      this.ring = this._div('iz-ring');
      [this.seal, this.ring].forEach(n => el.appendChild(n));
      this._measure();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._measure()); this.ro.observe(el); }
    }

    _measure() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540;
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8;
      this.w = w; this.h = h;
      if (ch || !this.svg.firstChild) this._geom();
    }

    _geom() {
      try {
        const { w, h } = this, r = rng(this.o.seed), f = n => (+n).toFixed(1);

        // Defs
        let defs =
          `<defs>` +
          `<filter id="iz-rough" x="-5%" y="-25%" width="110%" height="150%">` +
          `<feTurbulence type="fractalNoise" baseFrequency=".04 .08" numOctaves="2" seed="16" result="n"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>` +
          `</filter>` +
          `<linearGradient id="iz-steel-grad" x1="0%" y1="0%" x2="100%" y2="100%">` +
          `<stop offset="0%" stop-color="#f8fafc"/>` +
          `<stop offset="40%" stop-color="#94a3b8"/>` +
          `<stop offset="100%" stop-color="#334155"/>` +
          `</linearGradient>` +
          `<linearGradient id="iz-cord-grad" x1="0%" y1="100%" x2="0%" y2="0%">` +
          `<stop offset="0%" stop-color="rgba(30,41,59,0.92)"/>` +
          `<stop offset="50%" stop-color="rgba(71,85,105,0.85)"/>` +
          `<stop offset="100%" stop-color="rgba(15,23,42,0.96)"/>` +
          `</linearGradient>` +
          `</defs>`;

        // 1. TOWERING BRAIDED GALLOWS CORD / SPINAL TRUNK
        const cx = w * 0.50;
        const trunkBottom = h * 0.95, trunkTop = h * 0.16;
        let trunk = '';
        for (let s = -2; s <= 2; s++) {
          const offX = s * 3.2;
          const col = s === 0 ? 'rgba(203,213,225,0.60)' : (Math.abs(s) === 1 ? 'rgba(100,116,139,0.70)' : 'rgba(51,65,85,0.50)');
          const sw = (1.8 + (2 - Math.abs(s)) * 1.4).toFixed(1);

          let dCord = `M ${f(cx + offX)} ${f(trunkBottom)}`;
          const waves = 10;
          for (let i = 1; i <= waves; i++) {
            const yFrac = i / waves;
            const cyNode = trunkBottom - (trunkBottom - trunkTop) * yFrac;
            const sway = Math.sin(i * 1.4 + s * 0.8) * 4.5;
            dCord += ` Q ${f(cx + offX + sway)} ${f(cyNode + 14)}, ${f(cx + offX + (i % 2 === 0 ? sway * 0.5 : -sway * 0.5))} ${f(cyNode)}`;
          }
          trunk += `<path class="iz-trunk" pathLength="1" stroke="${col}" stroke-width="${sw}" d="${dCord}"/>`;
        }

        // 2. THE OMINOUS EXECUTIONER CANOPY (Gallows Tree Crown)
        const canCy = h * 0.12, canRx = w * 0.45, canRy = h * 0.08;
        let canopy =
          `<g class="iz-canopy">` +
          `<!-- Shadow aura crown -->` +
          `<ellipse cx="${f(cx)}" cy="${f(canCy)}" rx="${f(canRx * 1.1)}" ry="${f(canRy * 1.3)}" fill="rgba(15,23,42,.75)" filter="blur(8px)"/>` +
          `<!-- Tangled execution branches -->` +
          `<path d="M ${f(cx - canRx)} ${f(canCy)} ` +
          `Q ${f(cx - canRx * 0.5)} ${f(canCy - canRy * 1.4)} ${f(cx)} ${f(canCy - canRy * 1.2)} ` +
          `Q ${f(cx + canRx * 0.5)} ${f(canCy - canRy * 1.4)} ${f(cx + canRx)} ${f(canCy)} ` +
          `Q ${f(cx + canRx * 0.4)} ${f(canCy + canRy * 1.2)} ${f(cx)} ${f(canCy + canRy * 0.8)} ` +
          `Q ${f(cx - canRx * 0.4)} ${f(canCy + canRy * 1.2)} ${f(cx - canRx)} ${f(canCy)} Z" ` +
          `fill="url(#iz-cord-grad)" stroke="rgba(148,163,184,.5)" stroke-width="1.8"/>` +
          `<!-- Hanging noose cords looping from canopy -->` +
          `<path d="M ${f(cx - canRx * 0.65)} ${f(canCy + 10)} Q ${f(cx - canRx * 0.5)} ${f(canCy + 32)} ${f(cx - canRx * 0.35)} ${f(canCy + 16)}" fill="none" stroke="rgba(203,213,225,.5)" stroke-width="1.5"/>` +
          `<path d="M ${f(cx + canRx * 0.35)} ${f(canCy + 16)} Q ${f(cx + canRx * 0.5)} ${f(canCy + 32)} ${f(cx + canRx * 0.65)} ${f(canCy + 10)}" fill="none" stroke="rgba(203,213,225,.5)" stroke-width="1.5"/>` +
          `<path d="M ${f(cx - canRx * 0.2)} ${f(canCy + 14)} Q ${f(cx)} ${f(canCy + 34)} ${f(cx + canRx * 0.2)} ${f(canCy + 14)}" fill="none" stroke="rgba(226,232,240,.65)" stroke-width="1.6"/>` +
          `</g>`;

        // 3. TWIN HOOKED WABISUKE SCYTHE BLADES
        // Left hooked scythe blade
        const lbX = w * 0.20, lbY = h * 0.82;
        const dLeftBlade =
          `M ${f(lbX - 6)} ${f(lbY + 28)} ` +
          `L ${f(lbX - 2)} ${f(lbY - 32)} ` +
          `L ${f(lbX + 24)} ${f(lbY - 32)} ` +
          `L ${f(lbX + 24)} ${f(lbY - 8)} ` +
          `L ${f(lbX + 17)} ${f(lbY - 8)} ` +
          `L ${f(lbX + 17)} ${f(lbY - 26)} ` +
          `L ${f(lbX + 4)} ${f(lbY - 26)} ` +
          `L ${f(lbX)} ${f(lbY + 28)} Z`;
        const dLeftEdge =
          `M ${f(lbX + 4)} ${f(lbY - 26)} ` +
          `L ${f(lbX + 17)} ${f(lbY - 26)} ` +
          `L ${f(lbX + 17)} ${f(lbY - 8)}`;

        // Right hooked scythe blade
        const rbX = w * 0.80, rbY = h * 0.82;
        const dRightBlade =
          `M ${f(rbX + 6)} ${f(rbY + 28)} ` +
          `L ${f(rbX + 2)} ${f(rbY - 32)} ` +
          `L ${f(rbX - 24)} ${f(rbY - 32)} ` +
          `L ${f(rbX - 24)} ${f(rbY - 8)} ` +
          `L ${f(rbX - 17)} ${f(rbY - 8)} ` +
          `L ${f(rbX - 17)} ${f(rbY - 26)} ` +
          `L ${f(rbX - 4)} ${f(rbY - 26)} ` +
          `L ${f(rbX)} ${f(rbY + 28)} Z`;
        const dRightEdge =
          `M ${f(rbX - 4)} ${f(rbY - 26)} ` +
          `L ${f(rbX - 17)} ${f(rbY - 26)} ` +
          `L ${f(rbX - 17)} ${f(rbY - 8)}`;

        const blades =
          `<!-- Left Wabisuke Hooked Scythe -->` +
          `<g class="iz-blade" style="--d:.45s;--rot-start:-12deg;--rot-end:0deg">` +
          `<path d="${dLeftBlade}" fill="url(#iz-steel-grad)" stroke="#1e293b" stroke-width="1.4" stroke-linejoin="miter"/>` +
          `<path class="iz-edge-gleam" d="${dLeftEdge}"/>` +
          `</g>` +
          `<!-- Right Wabisuke Hooked Scythe -->` +
          `<g class="iz-blade" style="--d:.55s;--rot-start:12deg;--rot-end:0deg">` +
          `<path d="${dRightBlade}" fill="url(#iz-steel-grad)" stroke="#1e293b" stroke-width="1.4" stroke-linejoin="miter"/>` +
          `<path class="iz-edge-gleam" d="${dRightEdge}"/>` +
          `</g>`;

        // 4. DRAGGING IRON CHAINS COILING ACROSS THE FLOOR
        // As seen in Kubo's sketch, heavy iron chains attach to Wabisuke's pummels
        // and drag heavily across the ground, coiling at the bottom of the card
        let chains = '';
        const chainCurves = [
          // Left blade chain dragging out to bottom-left corner
          { p0: [lbX - 3, lbY + 28], p1: [lbX - 15, h * 0.90], p2: [w * 0.08, h * 0.94], p3: [w * 0.02, h * 0.97], dl: 0.35, steps: 14 },
          // Right blade chain dragging out to bottom-right corner
          { p0: [rbX + 3, rbY + 28], p1: [rbX + 15, h * 0.90], p2: [w * 0.92, h * 0.94], p3: [w * 0.98, h * 0.97], dl: 0.42, steps: 14 },
          // Sagging draped chain loop between the two scythe handles
          { p0: [lbX, lbY + 24], p1: [w * 0.34, h * 0.92], p2: [w * 0.66, h * 0.92], p3: [rbX, rbY + 24], dl: 0.50, steps: 18 },
          // Additional heavy chain coil dragging behind Kira's feet
          { p0: [cx - 14, h * 0.88], p1: [cx - 40, h * 0.96], p2: [cx + 40, h * 0.97], p3: [cx + 18, h * 0.91], dl: 0.58, steps: 16 }
        ];

        chainCurves.forEach((cc, cIdx) => {
          let linksSvg = '';
          const numSteps = cc.steps;
          for (let step = 0; step <= numSteps; step++) {
            const t = step / numSteps;
            const omt = 1 - t;
            const px = omt*omt*omt*cc.p0[0] + 3*omt*omt*t*cc.p1[0] + 3*omt*t*t*cc.p2[0] + t*t*t*cc.p3[0];
            const py = omt*omt*omt*cc.p0[1] + 3*omt*omt*t*cc.p1[1] + 3*omt*t*t*cc.p2[1] + t*t*t*cc.p3[1];
            const dx = 3*omt*omt*(cc.p1[0] - cc.p0[0]) + 6*omt*t*(cc.p2[0] - cc.p1[0]) + 3*t*t*(cc.p3[0] - cc.p2[0]);
            const dy = 3*omt*omt*(cc.p1[1] - cc.p0[1]) + 6*omt*t*(cc.p2[1] - cc.p1[1]) + 3*t*t*(cc.p3[1] - cc.p2[1]);
            const ang = (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1);

            if (step % 2 === 0) {
              linksSvg += `<rect class="iz-link-face" x="${f(px - 5.2)}" y="${f(py - 3)}" width="10.4" height="6" rx="3" transform="rotate(${ang} ${f(px)} ${f(py)})"/>`;
            } else {
              linksSvg += `<line class="iz-link-edge" x1="${f(px - 3.8)}" y1="${f(py)}" x2="${f(px + 3.8)}" y2="${f(py)}" transform="rotate(${ang} ${f(px)} ${f(py)})"/>`;
            }
          }
          chains += `<g class="iz-chain-group iz-chain" style="--d:${cc.dl}s;--dur:${(4.2 + cIdx * 0.4).toFixed(1)}s">${linksSvg}</g>`;
        });

        // 5. DOWNWARD GRAVITATIONAL DISTORTION ARCS (Weight doubling: 2x -> 4x -> 8x)
        let gravWaves = '';
        for (let g = 0; g < 3; g++) {
          const gY = h * (0.76 + g * 0.08);
          const gW = w * (0.36 + g * 0.10);
          const dWave = `M ${f(cx - gW)} ${f(gY)} Q ${f(cx)} ${f(gY + 16)}, ${f(cx + gW)} ${f(gY)}`;
          gravWaves += `<path class="iz-grav-wave" stroke="rgba(148,163,184,0.65)" stroke-width="2.0" style="--d:${(g * 1.1).toFixed(1)}s" d="${dWave}"/>`;
        }

        // 6. SINKING WEIGHT MOTES (Leaden oppressive reiatsu)
        let motes = '';
        const moteCount = 18;
        for (let m = 0; m < moteCount; m++) {
          const mx = f(w * (0.12 + r() * 0.76));
          const my = f(h * (0.55 + r() * 0.35));
          const mr = f(1.2 + r() * 2.0);
          const delay = f(r() * 3.5);
          const dur = f(2.4 + r() * 1.8);
          motes += `<circle class="iz-mote" cx="${mx}" cy="${my}" r="${mr}" style="--d:${delay}s;--dur:${dur}s"/>`;
        }

        this.svg.innerHTML = defs + trunk + canopy + blades + chains + gravWaves + motes;
      } catch (e) {
        console.error('KiraPanel _geom error:', e);
      }
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.timers.forEach(t => clearTimeout(t)); this.timers = [];
      this.el.classList.add('iz-open');
      this._measure();
    }

    close() {
      this.isOpen = false;
      this.timers.forEach(t => clearTimeout(t)); this.timers = [];
      this.el.classList.remove('iz-open');
    }

    replay() {
      this.close();
      const t = setTimeout(() => { if (this.el.classList.contains('open')) this.open(); }, 60);
      this.timers.push(t);
    }

    destroy() {
      this.close();
      if (this.ro) this.ro.disconnect();
      [this.wash, this.svg, this.seal, this.ring].forEach(n => n && n.remove());
      this.el.classList.remove('kira-panel');
      inst.delete(this.el);
    }
  }

  g.KiraPanel = {
    attach(el, o) {
      if (!el) return null;
      let it = inst.get(el);
      if (!it) it = new IZ(el, o);
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
