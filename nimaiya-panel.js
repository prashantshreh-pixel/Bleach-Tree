/**
 * nimaiya-panel.js - Ōetsu Nimaiya ("God of the Sword" / Sayafushi & Asauchi):
 * Asauchi blade sentinels, Sayafushi's instantaneous razor-sharp dimensional cut,
 * crystal quench-tank fluid, blade gleams, fine steel sparks, and an
 * authentic "刀神" (God of the Sword) hanko seal.
 *   const nm = NimaiyaPanel.attach(sidebar, { impact: [0.5, 0.85], seal: [0.84, 0.9], seed: 27 });
 *   nm.open();  nm.close();  nm.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  class NM {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.85], seal: [0.84, 0.9], seed: 27, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'nm-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('nimaiya-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('nm-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');

      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('class', 'nm-layer nm-svg');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      [this.wash, this.svg].forEach(n => el.insertBefore(n, ref)); // behind the text

      // Authentic Cinnabar Hanko Seal with "刀神" (God of the Sword)
      this.seal = this._div('nm-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#nm-rough)">' +
        '<rect x="4" y="4" width="52" height="52" rx="7" fill="#881337"/>' +
        '<rect x="8" y="8" width="44" height="44" rx="4" fill="none" stroke="rgba(254,240,138,.65)" stroke-width="1.6"/>' +
        '<!-- Katana blade crest -->' +
        '<path d="M14 14L46 46M14 18L18 14M42 46L46 42" stroke="rgba(254,240,138,.35)" stroke-width="1.2"/>' +
        '<!-- Kanji 刀 (Sword) left side -->' +
        '<path d="M18 20H28C30 20 31 22 31 25V38C31 43 28 45 23 45" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round" fill="none"/>' +
        '<path d="M22 25L16 41" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>' +
        '<!-- Kanji 神 (God / Kami) right side -->' +
        '<path d="M35 18V45" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M35 27L43 23M35 34L44 38" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M41 18H47V33H41Z" stroke="#fef08a" stroke-width="1.8" fill="none"/>' +
        '<path d="M44 33V47" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>' +
        '</g></svg>';

      this.ring = this._div('nm-ring');
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

        // Defs with gradients & filters
        let defs =
          `<defs>` +
          `<filter id="nm-rough" x="-5%" y="-25%" width="110%" height="150%">` +
          `<feTurbulence type="fractalNoise" baseFrequency=".04 .08" numOctaves="2" seed="14" result="n"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>` +
          `</filter>` +
          `<linearGradient id="nm-steel-grad" x1="0%" y1="0%" x2="100%" y2="100%">` +
          `<stop offset="0%" stop-color="#f8fafc"/>` +
          `<stop offset="45%" stop-color="#94a3b8"/>` +
          `<stop offset="100%" stop-color="#334155"/>` +
          `</linearGradient>` +
          `</defs>`;

        // 1. Asauchi Standing Katana Sentinels at the base of the Phoenix Palace
        const bladeConfigs = [
          { x: w * 0.12, hBlade: h * 0.46, ang: -6, op: 0.65, dl: 0.05 },
          { x: w * 0.28, hBlade: h * 0.52, ang: -2, op: 0.85, dl: 0.15 },
          { x: w * 0.50, hBlade: h * 0.58, ang: 1, op: 0.95, dl: 0.25 },
          { x: w * 0.72, hBlade: h * 0.50, ang: 4, op: 0.80, dl: 0.18 },
          { x: w * 0.88, hBlade: h * 0.44, ang: 7, op: 0.60, dl: 0.10 }
        ];

        let blades = '';
        bladeConfigs.forEach(b => {
          const bx = b.x, by = h + 15, blen = b.hBlade;
          const bW = 8.5; // blade thickness
          const tipY = by - blen;
          // Katana curved profile
          const dBlade =
            `M ${f(bx - bW * 0.5)} ${f(by)} ` +
            `L ${f(bx - bW * 0.4)} ${f(tipY + 18)} ` +
            `Q ${f(bx)} ${f(tipY)}, ${f(bx + bW * 0.5)} ${f(tipY + 6)} ` +
            `L ${f(bx + bW * 0.5)} ${f(by)} Z`;

          // Hamon edge curve
          const dHamon =
            `M ${f(bx + bW * 0.45)} ${f(by)} ` +
            `L ${f(bx + bW * 0.45)} ${f(tipY + 12)} ` +
            `Q ${f(bx)} ${f(tipY + 4)}, ${f(bx - bW * 0.35)} ${f(tipY + 16)}`;

          blades +=
            `<g class="nm-blade" transform="rotate(${b.ang} ${f(bx)} ${f(by)})" style="--op:${b.op};--d:${b.dl}s">` +
            `<path d="${dBlade}" fill="url(#nm-steel-grad)" stroke="rgba(255,255,255,.6)" stroke-width=".8"/>` +
            `<path class="nm-hamon" pathLength="1" d="${dHamon}" style="--d:${(b.dl + 0.2).toFixed(2)}s"/>` +
            `</g>`;
        });

        // 2. Sayafushi Instantaneous Razor-Sharp Dimensional Slash
        // A clean, lethal diagonal cut across the sidebar from top-right to lower-left
        const p1 = [w * 1.05, h * 0.18];
        const p2 = [-w * 0.05, h * 0.82];
        const dSlash = `M ${f(p1[0])} ${f(p1[1])} L ${f(p2[0])} ${f(p2[1])}`;

        let slash =
          `<path class="nm-slash-flare" d="${dSlash}"/>` +
          `<path class="nm-slash" pathLength="1" stroke-width="2.6" d="${dSlash}"/>`;

        // 3. Diamond Blade Gleams (4-point star glints on tips & edge)
        let gleams = '';
        const gleamPositions = [
          { x: w * 0.28, y: h * 0.52 },
          { x: w * 0.50, y: h * 0.44 },
          { x: w * 0.72, y: h * 0.54 },
          { x: w * 0.65, y: h * 0.32 },
          { x: w * 0.35, y: h * 0.68 }
        ];
        gleamPositions.forEach((gp, i) => {
          const size = 3.5 + r() * 3.5;
          const dl = (0.35 + i * 0.3).toFixed(2);
          const dur = (2.2 + r() * 1.5).toFixed(2);
          const col = i % 2 === 0 ? '#ffffff' : '#38bdf8';
          gleams +=
            `<path class="nm-gleam" style="--gc:${col};--d:${dl}s;--dur:${dur}s" ` +
            `d="M${f(gp.x)} ${f(gp.y - size)} Q${f(gp.x)} ${f(gp.y)} ${f(gp.x + size)} ${f(gp.y)} Q${f(gp.x)} ${f(gp.y)} ${f(gp.x)} ${f(gp.y + size)} Q${f(gp.x)} ${f(gp.y)} ${f(gp.x - size)} ${f(gp.y)} Q${f(gp.x)} ${f(gp.y)} ${f(gp.x)} ${f(gp.y - size)} Z"/>`;
        });

        // 4. Sayafushi Quench Fluid Specular Bubbles
        let bubbles = '';
        for (let b = 0; b < 12; b++) {
          const bx = w * 0.12 + r() * (w * 0.76);
          const by = h * 0.65 + r() * (h * 0.28);
          const rad = 2.0 + r() * 3.2;
          const rise = -(60 + r() * 95).toFixed(0);
          const dl = (r() * 3).toFixed(2);
          const dur = (2.8 + r() * 1.6).toFixed(2);
          bubbles +=
            `<g class="nm-bubble" style="--ty:${rise}px;--d:${dl}s;--dur:${dur}s">` +
            `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(rad)}" fill="rgba(56,189,248,.35)" stroke="rgba(255,255,255,.75)" stroke-width=".7"/>` +
            `<circle cx="${f(bx - rad * 0.28)}" cy="${f(by - rad * 0.28)}" r="${(rad * 0.28).toFixed(1)}" fill="#ffffff"/>` +
            `</g>`;
        }

        // 5. Fine Forge Steel Sparks
        let sparks = '';
        for (let s = 0; s < 14; s++) {
          const sx = w * 0.2 + r() * (w * 0.6);
          const sy = h * 0.6 + r() * (h * 0.3);
          const a = -Math.PI * (0.2 + r() * 0.6);
          const dist = 14 + r() * 40;
          const rad = 1.0 + r() * 1.8;
          const col = s % 2 === 0 ? '#fde68a' : '#ffffff';
          sparks += `<circle class="nm-spark" cx="${f(sx)}" cy="${f(sy)}" r="${f(rad)}" style="--sc:${col};--tx:${(Math.cos(a) * dist).toFixed(0)}px;--ty:${(Math.sin(a) * dist).toFixed(0)}px;--d:${(0.4 + r() * 0.5).toFixed(2)}s"/>`;
        }

        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        this.svg.innerHTML =
          `${defs}` +
          `<g>${blades}</g>` +
          `<g>${slash}</g>` +
          `<g>${bubbles}${sparks}${gleams}</g>`;
      } catch (err) {
        console.error('NimaiyaPanel error:', err);
      }
    }

    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([{ translate: '0 0' }, { translate: `${-a * .3}px ${a}px` }, { translate: `${a * .2}px ${-a * .4}px` }, { translate: '0 0' }], { duration: 250, easing: 'ease-out' });
    }
    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('nm-open'); void this.el.offsetWidth; this.el.classList.add('nm-open');
      this._measure();
      this.timers.push(setTimeout(() => { if (this.isOpen) this._shake(3.2); }, 380));
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('nm-open');
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.wash, this.svg, this.seal, this.ring].forEach(n => n.remove());
      this.el.classList.remove('nimaiya-panel', 'nm-open'); inst.delete(this.el);
    }
  }
  g.NimaiyaPanel = { attach(el, o) { return el ? (inst.get(el) || new NM(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
