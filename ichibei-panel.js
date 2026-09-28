/**
 * ichibei-panel.js - sumi-e ink: paper wash, dry-brush stroke, splatter, drips, red hanko seal
 *   const ib = IchibeiPanel.attach(sidebar, { impact: [0.1, 0.78], seal: [0.84, 0.9], seed: 5 });
 *   ib.open();  ib.close();  ib.replay();
 * The stroke is a bundle of offset "bristles" (different widths/lengths), roughened with an SVG displacement filter.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };

  class IB {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.1, 0.78], seal: [0.84, 0.9], seed: 5, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'ib-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('ichibei-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;
      this.wash = this._div('ib-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%'); this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');
      this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('class', 'ib-layer ib-svg');
      this.svg.setAttribute('aria-hidden', 'true'); this.svg.setAttribute('preserveAspectRatio', 'none');
      [this.wash, this.svg].forEach(n => el.insertBefore(n, ref));                    // behind the text
      this.seal = this._div('ib-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%'; this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML = '<svg viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#ib-rough)"><rect x="4" y="4" width="52" height="52" rx="5" fill="#c1272d"/>' +
        '<rect x="9" y="9" width="42" height="42" rx="3" fill="none" stroke="rgba(0,0,0,.28)" stroke-width="1.6"/>' +
        '<path d="M15 30H45" stroke="#160a0b" stroke-width="7.5" stroke-linecap="round"/></g></svg>';   // the bar is the character 一 (ichi)
      this.ring = this._div('ib-ring'); [this.seal, this.ring].forEach(n => el.appendChild(n));
      this._measure();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._measure()); this.ro.observe(el); }
    }
    _measure() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540;
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8; this.w = w; this.h = h;
      if (ch || !this.svg.firstChild) this._geom();
    }

    _geom() {
      const { w, h } = this, r = rng(this.o.seed), f = n => n.toFixed(1);
      // one sweeping stroke: two cubic segments, low across the panel
      const P0 = [-w * .05, h * .80], A1 = [w * .22, h * .60], A2 = [w * .36, h * .92], P1 = [w * .60, h * .72], B1 = [w * .80, h * .55], B2 = [w * .92, h * .78], P2 = [w * 1.06, h * .66];
      const d = `M${f(P0[0])} ${f(P0[1])}C${f(A1[0])} ${f(A1[1])} ${f(A2[0])} ${f(A2[1])} ${f(P1[0])} ${f(P1[1])}C${f(B1[0])} ${f(B1[1])} ${f(B2[0])} ${f(B2[1])} ${f(P2[0])} ${f(P2[1])}`;
      const at = t => t < .5 ? bez(P0, A1, A2, P1, t * 2) : bez(P1, B1, B2, P2, (t - .5) * 2);
      let bristles = '';
      for (let k = -5; k <= 5; k++) {                                                   // centre bristles are wider and longer
        const c = 1 - Math.abs(k) / 6, L = (.72 + c * .28 - r() * .08).toFixed(2), wd = (4 + c * 12 + r() * 3).toFixed(1);
        bristles += `<path class="ib-b" pathLength="1" transform="translate(0 ${f(k * 2.7 + (r() - .5) * 2)})" stroke-width="${wd}" style="--L:${L};--d:${(.1 + r() * .12).toFixed(2)}s;--dur:${(.9 + r() * .25).toFixed(2)}s" d="${d}"/>`;
      }
      let drips = '', dots = '';
      [.27, .4, .53, .68, .82].forEach((t, i) => {                                       // drips hang from the lower edge of the stroke
        const p = at(t), len = 26 + r() * 62, x = p[0] + (r() - .5) * 8, y = p[1] + 6 + r() * 4, sw = (2.6 + r() * 2).toFixed(1), dl = (1.0 + i * .2 + r() * .3).toFixed(2);
        drips += `<path class="ib-drip" pathLength="1" stroke-width="${sw}" style="--d:${dl}s" d="M${f(x)} ${f(y)}L${f(x + (r() - .5) * 4)} ${f(y + len)}"/>` +
          `<circle class="ib-bulb" cx="${f(x)}" cy="${f(y)}" r="${(sw / 2 + 1.2).toFixed(1)}" style="--d:${dl}s;--len:${len.toFixed(0)}px"/>`;
      });
      for (let i = 0; i < 16; i++) {                                                     // splatter around the tail of the stroke
        const p = at(.72 + r() * .25), a = r() * 6.28, dist = 14 + r() * 46, rad = .9 + r() * r() * 5;
        dots += `<circle class="ib-dot" cx="${f(p[0])}" cy="${f(p[1])}" r="${rad.toFixed(1)}" style="--tx:${(Math.cos(a) * dist).toFixed(0)}px;--ty:${(Math.sin(a) * dist - 6).toFixed(0)}px;--d:${(.75 + r() * .35).toFixed(2)}s"/>`;
      }
      this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this.svg.innerHTML =
        `<defs><filter id="ib-rough" x="-5%" y="-25%" width="110%" height="150%"><feTurbulence type="fractalNoise" baseFrequency=".035 .09" numOctaves="3" seed="4" result="n"/>` +
        `<feDisplacementMap in="SourceGraphic" in2="n" scale="9" xChannelSelector="R" yChannelSelector="G"/></filter></defs>` +
        `<path class="ib-bleed" d="${d}"/><g filter="url(#ib-rough)">${bristles}${drips}${dots}</g>`;
    }

    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([{ translate: '0 0' }, { translate: `${-a * .3}px ${a}px` }, { translate: `${a * .2}px ${-a * .4}px` }, { translate: '0 0' }], { duration: 260, easing: 'ease-out' });
    }
    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('ib-open'); void this.el.offsetWidth; this.el.classList.add('ib-open');
      this._measure();
      this.timers.push(setTimeout(() => { if (this.isOpen) this._shake(4); }, 1850));   // the seal lands
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('ib-open');
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.wash, this.svg, this.seal, this.ring].forEach(n => n.remove());
      this.el.classList.remove('ichibei-panel', 'ib-open'); inst.delete(this.el);
    }
  }
  g.IchibeiPanel = { attach(el, o) { return el ? (inst.get(el) || new IB(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
