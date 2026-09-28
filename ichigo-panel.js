/**
 * ichigo-panel.js - Getsuga Tensho entrance: crescent slash, then black-red reiatsu keeps rising
 *   const ic = IchigoPanel.attach(sidebar, { impact: [0.5, 0.45], angle: -32, wisps: 1 });
 *   ic.open();  ic.close();  ic.replay();   // replay = fire the slash again
 * Particle motion is time-based (dt), so it looks the same at 60Hz and 120Hz.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg', R = Math.random;

  class IP {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.45], angle: -32, wisps: 1, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.raf = null; this.p = []; this.t0 = 0; this.last = 0; this.acc = 0;
      this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'ic-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('ichigo-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;
      this.shade = this._div('ic-shade');
      this.canvas = document.createElement('canvas'); this.canvas.className = 'ic-layer ic-canvas'; this.canvas.setAttribute('aria-hidden', 'true');
      el.insertBefore(this.shade, ref); el.insertBefore(this.canvas, ref);      // behind the text
      this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('class', 'ic-layer ic-svg');
      this.svg.setAttribute('aria-hidden', 'true'); this.svg.setAttribute('preserveAspectRatio', 'none');
      this.flash = this._div('ic-flash'); this.ring = this._div('ic-ring');
      [this.svg, this.flash, this.ring].forEach(n => el.appendChild(n));      // over the text
      this.ctx = this.canvas.getContext('2d');
      this._measure();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._measure()); this.ro.observe(el); }
    }

    _measure() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540, d = Math.min(window.devicePixelRatio || 1, 2);
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8;
      this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d); this.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (ch || !this.svg.firstChild) this._geom();
    }

    /* crescent in local coords: travels along +x, tips at (-t, +-b), bulge at x=c, rotated by o.angle */
    _geom() {
      const { w, h } = this, [ix, iy] = this.o.impact, cx = w * ix, cy = h * iy, d = Math.hypot(w, h);
      const b = d * .42, c = d * .24, th = d * .085, t = 12, C1 = 2 * c + t, C2 = 2 * (c - th) + t, Rr = d * .5 + c + 20;
      const front = `M${-t} ${-b}Q${C1.toFixed(0)} 0 ${-t} ${b.toFixed(0)}`, back = `Q${C2.toFixed(0)} 0 ${-t} ${-b.toFixed(0)}Z`;
      this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this.svg.innerHTML =
        `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${this.o.angle})"><g class="ic-slash" style="--R:${Rr.toFixed(0)}px">` +
        `<path d="${front}${back}" fill="#050203"/>` +
        `<path d="${front}" fill="none" stroke="rgba(255,40,30,.9)" stroke-width="16" stroke-linecap="round" opacity=".5"/>` +
        `<path d="${front}" fill="none" stroke="#ff3b30" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="${front}" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g></g>`;
      this.flash.style.setProperty('--ix', (ix * 100) + '%'); this.flash.style.setProperty('--iy', (iy * 100) + '%');
    }

    _spawn(pre) {
      const { w, h } = this, side = R(), max = 1.6 + R() * 1.6;
      let x, y, vx;
      if (side < .72) { x = R() * w; y = h + 12; vx = (R() - .5) * 20; }
      else { const left = side < .86; x = left ? -8 : w + 8; y = h * (.3 + R() * .7); vx = (left ? 1 : -1) * (8 + R() * 16); }
      this.p.push({ x, y, vx, vy: -(30 + R() * 70), s: 14 + R() * 24, ph: R() * 6.28, fr: 1 + R() * 1.5, life: pre ? R() * max * .5 : 0, max, spark: false });
      if (R() < .4) this.p.push({ x: x + (R() - .5) * 30, y, vx: vx * 1.5, vy: -(90 + R() * 150), s: 1 + R() * 1.6, ph: R() * 6.28, fr: 3, life: 0, max: .8 + R() * .9, spark: true });
    }

    _tick(now) {
      if (!this.isOpen) return;
      const dt = Math.min((now - this.last) / 1000, .05); this.last = now;
      const t = (now - this.t0) / 1000, { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      this.acc += (t < .4 ? 0 : Math.min(1, (t - .4) / .9)) * this.o.wisps * 34 * dt;
      while (this.acc >= 1 && this.p.length < 260) { this.acc--; this._spawn(false); }
      this.acc = Math.min(this.acc, 1);
      for (let i = this.p.length - 1; i >= 0; i--) {
        const s = this.p[i]; s.life += dt;
        if (s.life > s.max) { this.p.splice(i, 1); continue; }
        const k = s.life / s.max, a = Math.sin(k * Math.PI);
        s.x += (s.vx + Math.sin(t * s.fr + s.ph) * 22) * dt; s.y += s.vy * dt;
        if (s.spark) {
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${90 + (R() * 90 | 0)},70,${a})`;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, 6.2832); ctx.fill(); continue;
        }
        const r = s.s * (.6 + .9 * k);
        ctx.globalCompositeOperation = 'lighter';                       // red under-glow, pushed below the plume
        let gr = ctx.createRadialGradient(s.x, s.y + r * .45, 0, s.x, s.y + r * .45, r * 1.5);
        gr.addColorStop(0, `rgba(255,35,20,${.34 * a})`); gr.addColorStop(1, 'rgba(255,35,20,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(s.x, s.y + r * .45, r * 1.5, 0, 6.2832); ctx.fill();
        ctx.globalCompositeOperation = 'source-over';                   // soft black plume, stretched upward
        ctx.save(); ctx.translate(s.x, s.y); ctx.scale(.75, 1.35);
        gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        gr.addColorStop(0, `rgba(0,0,0,${.8 * a})`); gr.addColorStop(.55, `rgba(0,0,0,${.45 * a})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill(); ctx.restore();
      }
      ctx.globalCompositeOperation = 'source-over';
      this.raf = requestAnimationFrame(n => this._tick(n));
    }

    /* shake through WAAPI so it never fights the theme rules' `animation` in index.html */
    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([{ translate: '0 0' }, { translate: `${-a}px ${a * .5}px` }, { translate: `${a * .75}px ${-a * .5}px` },
        { translate: `${-a * .5}px ${a * .25}px` }, { translate: `${a * .25}px 0` }, { translate: '0 0' }], { duration: 420, easing: 'ease-out' });
    }
    _later(fn, ms) { this.timers.push(setTimeout(() => { if (this.isOpen) fn(); }, ms)); }

    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('ic-open'); void this.el.offsetWidth; this.el.classList.add('ic-open');
      this.p = []; this.acc = 0; this.t0 = this.last = performance.now();
      if (!this.rm) {
        this._measure();
        for (let i = 0; i < 26; i++) this._spawn(true);
        cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(n => this._tick(n));
        this._shake(6); this._later(() => this._shake(7), 480);          // impact, then the crescent crossing the centre
      }
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('ic-open'); cancelAnimationFrame(this.raf); this.raf = null;
      setTimeout(() => { if (!this.isOpen) this.ctx.clearRect(0, 0, this.w, this.h); }, 300);
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.shade, this.canvas, this.svg, this.flash, this.ring].forEach(n => n.remove());
      this.el.classList.remove('ichigo-panel', 'ic-open'); inst.delete(this.el);
    }
  }
  g.IchigoPanel = { attach(el, o) { return el ? (inst.get(el) || new IP(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
