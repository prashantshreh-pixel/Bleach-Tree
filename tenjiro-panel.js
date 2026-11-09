/**
 * tenjiro-panel.js - Tenjirō Kirinji ("The Hot Spring Demon" / Healing Waters):
 * Layered restorative mineral spring pool, concentric healing pulses,
 * thermal bubbles, 4-point healing sparkles, rising steam wisps,
 * and an authentic "癒" (Heal) hanko seal stamp.
 *   const tj = TenjiroPanel.attach(sidebar, { impact: [0.5, 0.88], seal: [0.84, 0.9], seed: 15 });
 *   tj.open();  tj.close();  tj.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  class TJ {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.88], seal: [0.84, 0.9], seed: 15, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'tj-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('tenjiro-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('tj-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');

      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('class', 'tj-layer tj-svg');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      [this.wash, this.svg].forEach(n => el.insertBefore(n, ref)); // behind the text

      // Authentic Cinnabar Hanko Seal with "癒" (Healing / Rejuvenation)
      this.seal = this._div('tj-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#tj-rough)">' +
        '<rect x="4" y="4" width="52" height="52" rx="7" fill="#991b1b"/>' +
        '<rect x="8" y="8" width="44" height="44" rx="4" fill="none" stroke="rgba(254,240,138,.6)" stroke-width="1.6"/>' +
        '<!-- Hot spring steam waves above -->' +
        '<path d="M19 16C17 19 21 21 19 24" fill="none" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M30 14C28 18 32 20 30 24" fill="none" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M41 16C39 19 43 21 41 24" fill="none" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<!-- Kanji 癒 (Heal / Cure / Rejuvenate) stylized -->' +
        '<path d="M16 28H44" stroke="#fef08a" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M22 28V50" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M17 35H22" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M17 43H22" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M27 33H40" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M33 33V49" stroke="#fef08a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M27 41H40" stroke="#fef08a" stroke-width="1.6" stroke-linecap="round"/>' +
        '<path d="M26 49H41" stroke="#fef08a" stroke-width="2" stroke-linecap="round"/>' +
        '</g></svg>';

      this.ring = this._div('tj-ring');
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

        // Defs with gradients & filters for water and healing aura
        let defs =
          `<defs>` +
          `<linearGradient id="tj-grad-deep" x1="0%" y1="0%" x2="0%" y2="100%">` +
          `<stop offset="0%" stop-color="rgba(20,184,166,0.38)"/>` +
          `<stop offset="60%" stop-color="rgba(14,116,144,0.52)"/>` +
          `<stop offset="100%" stop-color="rgba(12,74,96,0.72)"/>` +
          `</linearGradient>` +
          `<linearGradient id="tj-grad-mid" x1="0%" y1="0%" x2="0%" y2="100%">` +
          `<stop offset="0%" stop-color="rgba(45,212,191,0.42)"/>` +
          `<stop offset="50%" stop-color="rgba(56,189,248,0.30)"/>` +
          `<stop offset="100%" stop-color="rgba(15,118,110,0.55)"/>` +
          `</linearGradient>` +
          `<linearGradient id="tj-grad-front" x1="0%" y1="0%" x2="0%" y2="100%">` +
          `<stop offset="0%" stop-color="rgba(153,246,228,0.52)"/>` +
          `<stop offset="40%" stop-color="rgba(45,212,191,0.28)"/>` +
          `<stop offset="100%" stop-color="rgba(13,148,136,0.40)"/>` +
          `</linearGradient>` +
          `<filter id="tj-rough" x="-5%" y="-25%" width="110%" height="150%">` +
          `<feTurbulence type="fractalNoise" baseFrequency=".03 .08" numOctaves="2" seed="7" result="n"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>` +
          `</filter>` +
          `</defs>`;

        // Three layered healing hot-spring water waves pooling at the bottom
        const y0 = h * 0.72;
        const y1 = h * 0.78;
        const y2 = h * 0.84;

        // Deep water layer
        const dDeep =
          `M -10 ${f(h + 20)} ` +
          `L -10 ${f(y0 + 10)} ` +
          `Q ${f(w * 0.22)} ${f(y0 - 12)}, ${f(w * 0.50)} ${f(y0 + 6)} ` +
          `T ${f(w + 10)} ${f(y0 - 8)} ` +
          `L ${f(w + 10)} ${f(h + 20)} Z`;

        // Mid water layer
        const dMid =
          `M -10 ${f(h + 20)} ` +
          `L -10 ${f(y1 + 8)} ` +
          `Q ${f(w * 0.30)} ${f(y1 + 14)}, ${f(w * 0.62)} ${f(y1 - 10)} ` +
          `T ${f(w + 10)} ${f(y1 + 6)} ` +
          `L ${f(w + 10)} ${f(h + 20)} Z`;

        // Front translucent shimmering water layer
        const dFront =
          `M -10 ${f(h + 20)} ` +
          `L -10 ${f(y2 + 4)} ` +
          `Q ${f(w * 0.25)} ${f(y2 - 14)}, ${f(w * 0.52)} ${f(y2 + 8)} ` +
          `T ${f(w + 10)} ${f(y2 - 6)} ` +
          `L ${f(w + 10)} ${f(h + 20)} Z`;

        // Crest lines
        const crestDeep = `M -10 ${f(y0 + 10)} Q ${f(w * 0.22)} ${f(y0 - 12)}, ${f(w * 0.50)} ${f(y0 + 6)} T ${f(w + 10)} ${f(y0 - 8)}`;
        const crestMid = `M -10 ${f(y1 + 8)} Q ${f(w * 0.30)} ${f(y1 + 14)}, ${f(w * 0.62)} ${f(y1 - 10)} T ${f(w + 10)} ${f(y1 + 6)}`;
        const crestFront = `M -10 ${f(y2 + 4)} Q ${f(w * 0.25)} ${f(y2 - 14)}, ${f(w * 0.52)} ${f(y2 + 8)} T ${f(w + 10)} ${f(y2 - 6)}`;

        let waters =
          `<path class="tj-water-layer" fill="url(#tj-grad-deep)" style="--op:.75;--d:0s;--dur:5.2s" d="${dDeep}"/>` +
          `<path class="tj-water-crest" pathLength="1" stroke="rgba(153,246,228,.45)" stroke-width="1.5" style="--d:.15s" d="${crestDeep}"/>` +
          `<path class="tj-water-layer" fill="url(#tj-grad-mid)" style="--op:.85;--d:.15s;--dur:4.4s" d="${dMid}"/>` +
          `<path class="tj-water-crest" pathLength="1" stroke="rgba(204,251,241,.6)" stroke-width="1.8" style="--d:.3s" d="${crestMid}"/>` +
          `<path class="tj-water-layer" fill="url(#tj-grad-front)" style="--op:.95;--d:.3s;--dur:3.8s" d="${dFront}"/>` +
          `<path class="tj-water-crest" pathLength="1" stroke="rgba(254,243,199,.75)" stroke-width="2.2" style="--d:.45s" d="${crestFront}"/>`;

        // Concentric healing pulses expanding outward from the spring center
        const cx = w * 0.48, cy = h * 0.83;
        let pulses = '';
        for (let p = 0; p < 3; p++) {
          const rx = (w * 0.42).toFixed(1);
          const ry = (h * 0.12).toFixed(1);
          const dl = (p * 1.25).toFixed(2);
          pulses += `<ellipse class="tj-heal-pulse" cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" style="--d:${dl}s"/>`;
        }

        // Rising thermal rejuvenation bubbles
        let bubbles = '';
        for (let b = 0; b < 16; b++) {
          const bx = w * 0.08 + r() * (w * 0.84);
          const by = h * 0.78 + r() * (h * 0.18);
          const rad = 2.2 + r() * 3.8;
          const rise = -(70 + r() * 110).toFixed(0);
          const dl = (r() * 3.2).toFixed(2);
          const dur = (2.8 + r() * 1.8).toFixed(2);
          const col = b % 3 === 0 ? 'rgba(254,240,138,.65)' : 'rgba(153,246,228,.75)';
          bubbles +=
            `<g class="tj-bubble" style="--ty:${rise}px;--d:${dl}s;--dur:${dur}s">` +
            `<circle cx="${f(bx)}" cy="${f(by)}" r="${f(rad)}" fill="${col}" stroke="rgba(255,255,255,.7)" stroke-width=".8"/>` +
            `<circle cx="${f(bx - rad * 0.3)}" cy="${f(by - rad * 0.3)}" r="${(rad * 0.28).toFixed(1)}" fill="#ffffff"/>` +
            `</g>`;
        }

        // 4-point healing sparkles / glints floating through the spring steam
        let sparkles = '';
        for (let s = 0; s < 12; s++) {
          const sx = w * 0.12 + r() * (w * 0.76);
          const sy = h * 0.45 + r() * (h * 0.42);
          const size = 3.5 + r() * 3.5;
          const dl = (r() * 2.8).toFixed(2);
          const dur = (2.2 + r() * 1.6).toFixed(2);
          const color = s % 2 === 0 ? '#fef08a' : '#5eead4';
          sparkles +=
            `<path class="tj-sparkle" style="--sc:${color};--d:${dl}s;--dur:${dur}s" ` +
            `d="M${f(sx)} ${f(sy - size)} Q${f(sx)} ${f(sy)} ${f(sx + size)} ${f(sy)} Q${f(sx)} ${f(sy)} ${f(sx)} ${f(sy + size)} Q${f(sx)} ${f(sy)} ${f(sx - size)} ${f(sy)} Q${f(sx)} ${f(sy)} ${f(sx)} ${f(sy - size)} Z"/>`;
        }

        // Rising thermal steam wisps
        let steam = '';
        [0.22, 0.40, 0.58, 0.76].forEach((pos, idx) => {
          const sx = w * pos + (r() - 0.5) * 16;
          const sy = h * 0.76;
          const hLen = 75 + r() * 65;
          const sw = (1.6 + r() * 1.2).toFixed(1);
          const dl = (0.35 + idx * 0.3 + r() * 0.2).toFixed(2);
          const c1x = sx - 12 - r() * 10, c1y = sy - hLen * 0.35;
          const c2x = sx + 12 + r() * 10, c2y = sy - hLen * 0.70;
          const ex = sx + (r() - 0.5) * 12, ey = sy - hLen;
          steam += `<path class="tj-steam" pathLength="1" stroke-width="${sw}" style="--d:${dl}s" d="M${f(sx)} ${f(sy)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(ex)} ${f(ey)}"/>`;
        });

        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        this.svg.innerHTML =
          `${defs}` +
          `<g>${pulses}</g>` +
          `<g filter="url(#tj-rough)">${waters}</g>` +
          `<g>${bubbles}${sparkles}${steam}</g>`;
      } catch (err) {
        console.error('TenjiroPanel error:', err);
      }
    }

    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([{ translate: '0 0' }, { translate: `${-a * .3}px ${a}px` }, { translate: `${a * .2}px ${-a * .4}px` }, { translate: '0 0' }], { duration: 250, easing: 'ease-out' });
    }
    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('tj-open'); void this.el.offsetWidth; this.el.classList.add('tj-open');
      this._measure();
      this.timers.push(setTimeout(() => { if (this.isOpen) this._shake(3.0); }, 1650));
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('tj-open');
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.wash, this.svg, this.seal, this.ring].forEach(n => n.remove());
      this.el.classList.remove('tenjiro-panel', 'tj-open'); inst.delete(this.el);
    }
  }
  g.TenjiroPanel = { attach(el, o) { return el ? (inst.get(el) || new TJ(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
