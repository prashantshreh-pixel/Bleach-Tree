/**
 * sasakibe-panel.js - Chōjirō Sasakibe ("Kōkō Gonryō Rikyū" / Lightning Palace):
 * The ancient Bankai of Solemn Spirit: celestial golden thunder dome,
 * vertical golden lightning pillars (palace columns), branching electric arcs,
 * Gonryōmaru rapier channeling axis, plasma motes, and "厳霊" seal.
 *   const skb = SasakibePanel.attach(sidebar, { impact: [0.5, 0.12], seal: [0.84, 0.9], seed: 33 });
 *   skb.open();  skb.close();  skb.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  class SKB {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.12], seal: [0.84, 0.9], seed: 33, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'skb-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('sasakibe-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('skb-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');

      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('class', 'skb-layer skb-svg');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      [this.wash, this.svg].forEach(n => el.insertBefore(n, ref)); // behind the text

      this.flash = this._div('skb-flash');

      // Authentic Cinnabar Hanko Seal with "厳霊" (Gonryō) & Lightning motif
      this.seal = this._div('skb-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#skb-rough)">' +
        '<rect x="4" y="4" width="52" height="52" rx="7" fill="#854d0e"/>' +
        '<rect x="8" y="8" width="44" height="44" rx="4" fill="none" stroke="rgba(254,240,138,.7)" stroke-width="1.6"/>' +
        '<!-- Lightning zigzags on sides -->' +
        '<path d="M12 16L17 24L13 28L18 36" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
        '<path d="M48 16L43 24L47 28L42 36" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
        '<!-- Kanji 厳 (Strict / Solemn) left -->' +
        '<path d="M22 18H28M25 15V23" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M21 24H29V32H21Z" stroke="#fef08a" stroke-width="1.6" fill="none"/>' +
        '<path d="M23 37L20 47M27 37L30 47" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<!-- Kanji 霊 (Spirit / Soul) right -->' +
        '<path d="M33 18H41M37 15V22" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M34 26H40M34 30H40" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M33 34H41V46H33Z" stroke="#fef08a" stroke-width="1.6" fill="none"/>' +
        '<path d="M37 34V46" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round"/>' +
        '</g></svg>';

      this.ring = this._div('skb-ring');
      [this.flash, this.seal, this.ring].forEach(n => el.appendChild(n));
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

        // Defs with lightning glow filters
        let defs =
          `<defs>` +
          `<filter id="skb-rough" x="-5%" y="-25%" width="110%" height="150%">` +
          `<feTurbulence type="fractalNoise" baseFrequency=".04 .09" numOctaves="2" seed="18" result="n"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" xChannelSelector="R" yChannelSelector="G"/>` +
          `</filter>` +
          `<filter id="skb-glow-heavy" x="-20%" y="-20%" width="140%" height="140%">` +
          `<feGaussianBlur stdDeviation="6" result="blur"/>` +
          `<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>` +
          `</filter>` +
          `<linearGradient id="skb-dome-grad" x1="0%" y1="0%" x2="0%" y2="100%">` +
          `<stop offset="0%" stop-color="#ffffff"/>` +
          `<stop offset="25%" stop-color="#fef08a"/>` +
          `<stop offset="70%" stop-color="#f59e0b"/>` +
          `<stop offset="100%" stop-color="rgba(245,158,11,0)"/>` +
          `</linearGradient>` +
          `</defs>`;

        // 1. CELESTIAL THUNDER DOME (Overhead Bankai Canopy)
        const domeCx = w * 0.50, domeCy = h * 0.08, domeRx = w * 0.44, domeRy = h * 0.07;
        const dDome =
          `M ${f(domeCx - domeRx)} ${f(domeCy)} ` +
          `Q ${f(domeCx)} ${f(domeCy - domeRy * 1.5)} ${f(domeCx + domeRx)} ${f(domeCy)} ` +
          `Q ${f(domeCx)} ${f(domeCy + domeRy * 0.8)} ${f(domeCx - domeRx)} ${f(domeCy)} Z`;

        let dome =
          `<g class="skb-dome" filter="url(#skb-glow-heavy)">` +
          `<!-- Radiant Dome Aura -->` +
          `<ellipse cx="${f(domeCx)}" cy="${f(domeCy)}" rx="${f(domeRx * 1.15)}" ry="${f(domeRy * 1.3)}" fill="rgba(254,240,138,.3)" filter="blur(8px)"/>` +
          `<path d="${dDome}" fill="url(#skb-dome-grad)"/>` +
          `<ellipse cx="${f(domeCx)}" cy="${f(domeCy)}" rx="${f(domeRx)}" ry="${f(domeRy * 0.5)}" fill="none" stroke="#ffffff" stroke-width="2.2"/>` +
          `<ellipse cx="${f(domeCx)}" cy="${f(domeCy + 4)}" rx="${f(domeRx * 0.75)}" ry="${f(domeRy * 0.35)}" fill="none" stroke="rgba(254,240,138,.8)" stroke-width="1.6"/>` +
          `</g>`;

        // 2. VERTICAL GOLDEN LIGHTNING PILLARS (Palace Columns)
        // 7 majestic pillars streaming down from the thunder canopy
        const pillarXPositions = [0.12, 0.24, 0.38, 0.50, 0.62, 0.76, 0.88];
        let pillars = '';
        pillarXPositions.forEach((pxRatio, idx) => {
          const px = w * pxRatio;
          const pyStart = domeCy + (Math.abs(pxRatio - 0.5) * 12);
          const pyEnd = h + 15;
          const dPillar = `M ${f(px)} ${f(pyStart)} L ${f(px)} ${f(pyEnd)}`;
          const dl = (0.12 + Math.abs(pxRatio - 0.5) * 0.4).toFixed(2);
          const dur = (0.28 + r() * 0.15).toFixed(2);

          pillars +=
            `<g class="skb-pillar" style="--d:${dl}s;--dur:${dur}s">` +
            `<!-- Outer Golden Plasma Sleeve -->` +
            `<path d="${dPillar}" stroke="rgba(250,204,21,.38)" stroke-width="14" filter="blur(4px)"/>` +
            `<!-- Mid High-Voltage Beam -->` +
            `<path d="${dPillar}" stroke="rgba(254,240,138,.8)" stroke-width="5"/>` +
            `<!-- White-Hot Core -->` +
            `<path d="${dPillar}" stroke="#ffffff" stroke-width="1.8"/>` +
            `</g>`;
        });

        // 3. BRANCHING ZIGZAG LIGHTNING ARCS (Electrical Discharges)
        let bolts = '';
        const boltSeeds = [
          { x: w * 0.50, y: h * 0.14, tx: w * 0.28, ty: h * 0.36, dl: 0.25 },
          { x: w * 0.50, y: h * 0.14, tx: w * 0.72, ty: h * 0.38, dl: 0.32 },
          { x: w * 0.38, y: h * 0.40, tx: w * 0.14, ty: h * 0.60, dl: 0.45 },
          { x: w * 0.62, y: h * 0.42, tx: w * 0.86, ty: h * 0.62, dl: 0.40 },
          { x: w * 0.50, y: h * 0.55, tx: w * 0.35, ty: h * 0.75, dl: 0.50 },
          { x: w * 0.50, y: h * 0.55, tx: w * 0.65, ty: h * 0.78, dl: 0.55 }
        ];

        boltSeeds.forEach(bs => {
          let bx = bs.x, by = bs.y;
          const steps = 5;
          let pathD = `M ${f(bx)} ${f(by)}`;
          for (let s = 1; s <= steps; s++) {
            const frac = s / steps;
            const nx = bs.x + (bs.tx - bs.x) * frac + (r() - 0.5) * 26;
            const ny = bs.y + (bs.ty - bs.y) * frac + (r() - 0.5) * 16;
            pathD += ` L ${f(nx)} ${f(ny)}`;
          }
          bolts += `<path class="skb-bolt" pathLength="1" stroke="#fef08a" stroke-width="2.2" style="--d:${bs.dl}s;--dur:.35s" d="${pathD}"/>`;
        });

        // 4. GONRYŌMARU RAPIER SILHOUETTE (Channeling Axis)
        // Elegant golden cup-hilt rapier pointing upwards in the lower center
        const swX = w * 0.50, swY = h * 0.82;
        const bladeTop = h * 0.35;
        let sword =
          `<g class="skb-sword">` +
          `<!-- Rapier Needle Blade -->` +
          `<path d="M ${f(swX)} ${f(swY - 14)} L ${f(swX)} ${f(bladeTop)}" stroke="#ffffff" stroke-width="2.4" filter="drop-shadow(0 0 6px #facc15)"/>` +
          `<!-- Blade Tip Energy Spark -->` +
          `<circle cx="${f(swX)}" cy="${f(bladeTop)}" r="4" fill="#ffffff" filter="drop-shadow(0 0 8px #fef08a)"/>` +
          `<!-- Spherical Bell Guard (Gonryōmaru Gold Cup Hilt) -->` +
          `<ellipse cx="${f(swX)}" cy="${f(swY - 10)}" rx="13" ry="7" fill="#eab308" stroke="#fef08a" stroke-width="1.5"/>` +
          `<path d="M ${f(swX - 13)} ${f(swY - 10)} Q ${f(swX)} ${f(swY + 8)} ${f(swX + 13)} ${f(swY - 10)}" fill="#ca8a04" stroke="#fef08a" stroke-width="1.2"/>` +
          `<!-- Grip & Pommel -->` +
          `<rect x="${f(swX - 2.5)}" y="${f(swY - 3)}" width="5" height="18" rx="2" fill="#713f12" stroke="#eab308" stroke-width="1"/>` +
          `<circle cx="${f(swX)}" cy="${f(swY + 18)}" r="3.5" fill="#facc15"/>` +
          `</g>`;

        // 5. SPARKLING PLASMA MOTES / LIGHTNING RAIN
        let motes = '';
        for (let m = 0; m < 26; m++) {
          const mx = w * 0.08 + r() * (w * 0.84);
          const my = h * 0.12 + r() * (h * 0.76);
          const rad = 1.2 + r() * 2.5;
          const dl = (r() * 2.2).toFixed(2);
          const dur = (2.4 + r() * 1.8).toFixed(2);
          const col = m % 3 === 0 ? '#ffffff' : (m % 2 === 0 ? '#fef08a' : '#facc15');
          const offX = ((r() - 0.5) * 14).toFixed(0);
          const offY = ((r() - 0.5) * 18).toFixed(0);

          motes +=
            `<circle class="skb-mote" cx="${f(mx)}" cy="${f(my)}" r="${f(rad)}" ` +
            `style="--mc:${col};--tx:${offX}px;--ty:${offY}px;--d:${dl}s;--dur:${dur}s"/>`;
        }

        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        this.svg.innerHTML =
          `${defs}` +
          `<g>${dome}</g>` +
          `<g>${pillars}</g>` +
          `<g>${bolts}</g>` +
          `<g>${sword}</g>` +
          `<g>${motes}</g>`;
      } catch (err) {
        console.error('SasakibePanel error:', err);
      }
    }

    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([{ translate: '0 0' }, { translate: `${-a * .3}px ${a}px` }, { translate: `${a * .4}px ${-a * .3}px` }, { translate: '0 0' }], { duration: 280, easing: 'ease-out' });
    }
    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('skb-open'); void this.el.offsetWidth; this.el.classList.add('skb-open');
      this._measure();
      this.timers.push(setTimeout(() => { if (this.isOpen) this._shake(4.2); }, 180));
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('skb-open');
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.wash, this.svg, this.flash, this.seal, this.ring].forEach(n => n.remove());
      this.el.classList.remove('sasakibe-panel', 'skb-open'); inst.delete(this.el);
    }
  }
  g.SasakibePanel = { attach(el, o) { return el ? (inst.get(el) || new SKB(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
