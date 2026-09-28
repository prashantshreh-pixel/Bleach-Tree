/**
 * glass-panel.js - Aizen entrance: glass cracks, then everything falls away
 *   const gl = GlassPanel.attach(sidebar, { impact: [0.7, 0.3] });
 *   gl.open();  gl.close();  gl.strike(fx, fy)   // replay, re-striking at 0..1 coords
 * The crack web is the outline of the falling pieces, so what cracks is what falls.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const COL = ['255,255,255', '200,190,255', '170,200,255'];

  class GP {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.7, 0.3], rays: 12, seed: 7, chips: 18, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.raf = null; this.sh = []; this.t0 = 0; this.fell = false; this.w = 0; this.h = 0;
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'gs-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('glass-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      this.glass = this._div('gs-glass'); el.insertBefore(this.glass, anchor || el.firstChild);
      this.svg = document.createElementNS(NS, 'svg'); this.svg.setAttribute('class', 'gs-layer gs-svg');
      this.svg.setAttribute('aria-hidden', 'true'); this.svg.setAttribute('preserveAspectRatio', 'none');
      this.sweep = this._div('gs-sweep'); this.flash = this._div('gs-flash'); this.ring = this._div('gs-ring');
      this.canvas = document.createElement('canvas'); this.canvas.className = 'gs-layer gs-canvas'; this.canvas.setAttribute('aria-hidden', 'true');
      [this.sweep, this.svg, this.canvas, this.flash, this.ring].forEach(n => el.appendChild(n));
      this.ctx = this.canvas.getContext('2d');
      this._measure();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._measure()); this.ro.observe(el); }
    }

    _measure() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540, d = Math.min(devicePixelRatio || 1, 2);
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8;
      this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d); this.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (ch || !this.svg.firstChild) this._geom();
    }

    _geom() {
      const { w, h } = this, r = rng(this.o.seed), [ix, iy] = this.o.impact, cx = w * ix, cy = h * iy, R = this.o.rays;
      const far = Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy)) * 1.08;
      const rad = []; for (let q = 22; q < far; q *= 1.5) rad.push(q); rad.push(far);
      const ang = []; for (let i = 0; i < R; i++) ang.push((i + (r() - .5) * .6) / R * 6.2832);
      const P = ang.map(a => rad.map(q => { const l = (r() - .5) * q * .07; return [cx + Math.cos(a) * q - Math.sin(a) * l, cy + Math.sin(a) * q + Math.cos(a) * l]; }));
      const f = n => n.toFixed(1), T = rad.map(q => q / far * .4), L = rad.length;
      let cells = '', lines = '', gl = '';
      for (let i = 0; i < R; i++) {
        const j = (i + 1) % R;
        lines += `<path class="gs-line" pathLength="1" style="--d:${(r() * .08).toFixed(2)}s" d="M${f(cx)} ${f(cy)}${P[i].map(p => 'L' + f(p[0]) + ' ' + f(p[1])).join('')}"/>`;
        for (let k = -1; k < L - 1; k++) {
          const q = k < 0 ? [[cx, cy], P[i][0], P[j][0]] : [P[i][k], P[i][k + 1], P[j][k + 1], P[j][k]];
          const o = (r() < .1 ? .14 : .03 + r() * .08).toFixed(3);
          cells += `<polygon points="${q.map(p => f(p[0]) + ',' + f(p[1])).join(' ')}" style="fill:rgb(${COL[Math.floor(r() * 3)]});--o:${o};--d:${(T[k + 1] + .05).toFixed(2)}s;` +
            `--fd:${(1.2 + rad[Math.max(k, 0)] / far * .45 + r() * .12).toFixed(2)}s;--fdur:${(1 + r() * .5).toFixed(2)}s;` +
            `--fx:${((r() - .5) * 70).toFixed(0)}px;--fy:${(h + 160 + r() * 160).toFixed(0)}px;--fr:${((r() - .5) * 260).toFixed(0)}deg"/>`;
        }
        for (let k = 1; k < L - 1; k += 2) {
          const a = P[i][k], b = P[j][k];
          if (r() > .22) lines += `<path class="gs-line" pathLength="1" style="--d:${(T[k] + .05).toFixed(2)}s" d="M${f(a[0])} ${f(a[1])}L${f(b[0])} ${f(b[1])}"/>`;
          if (a[0] > 0 && a[0] < w && a[1] > 0 && a[1] < h && r() < .3) gl += `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="1.3" style="--d:${(r() * 1.2).toFixed(1)}s;--t:${(1.2 + r() * 1.2).toFixed(1)}s"/>`;
        }
      }
      this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this.svg.innerHTML = `<g class="gs-cells">${cells}</g><g class="gs-shadow">${lines}</g><g class="gs-hi">${lines}</g><g class="gs-glints">${gl}</g>`;
      this.flash.style.setProperty('--ix', (ix * 100) + '%'); this.flash.style.setProperty('--iy', (iy * 100) + '%');
    }

    _spawn(x, y, vx, vy, s) { this.sh.push({ x, y, vx, vy, s, a: Math.random() * 6.28, va: (Math.random() - .5) * .3, life: 0, max: 60 + Math.random() * 50 }); }

    _tick() {
      if (!this.isOpen) return;
      const { ctx, w, h } = this; ctx.clearRect(0, 0, w, h);
      if (!this.fell && performance.now() - this.t0 > 1300) {          // the pane lets go: extra falling chips
        this.fell = true;
        for (let i = 0; i < 28; i++) this._spawn(Math.random() * w, Math.random() * h * .8, (Math.random() - .5) * .8, Math.random() * 1.2, 2 + Math.random() * 5);
      }
      ctx.shadowColor = 'rgba(190,170,255,.9)'; ctx.shadowBlur = 6;
      for (let i = this.sh.length - 1; i >= 0; i--) {
        const s = this.sh[i]; s.vy += .18; s.x += s.vx; s.y += s.vy; s.vx *= .995; s.a += s.va; s.life++;
        if (s.life > s.max || s.y > h + 20) { this.sh.splice(i, 1); continue; }
        const al = 1 - s.life / s.max;
        ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.a); ctx.beginPath();
        ctx.moveTo(0, -s.s); ctx.lineTo(s.s * .8, s.s * .6); ctx.lineTo(-s.s * .7, s.s * .5); ctx.closePath();
        ctx.fillStyle = 'rgba(225,220,255,' + .35 * al + ')'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,' + .9 * al + ')'; ctx.lineWidth = .8; ctx.stroke(); ctx.restore();
      }
      this.raf = requestAnimationFrame(() => this._tick());
    }

    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('gs-open'); void this.el.offsetWidth; this.el.classList.add('gs-open');
      this.sh = []; this.fell = false; this.t0 = performance.now();
      if (!this.rm) {
        this._measure();
        const cx = this.w * this.o.impact[0], cy = this.h * this.o.impact[1];
        for (let i = 0; i < this.o.chips; i++) { const a = Math.random() * 6.28, s = 2 + Math.random() * 4;
          this._spawn(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6, Math.cos(a) * s, Math.sin(a) * s - 1.2, 2.5 + Math.random() * 4); }
        cancelAnimationFrame(this.raf); this._tick();
      }
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.el.classList.remove('gs-open'); cancelAnimationFrame(this.raf); this.raf = null;
      setTimeout(() => { if (!this.isOpen) this.ctx.clearRect(0, 0, this.w, this.h); }, 600);
    }
    strike(fx, fy) { this.o.impact = [fx, fy]; this._geom(); this.isOpen = false; this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.glass, this.svg, this.sweep, this.flash, this.ring, this.canvas].forEach(n => n.remove());
      this.el.classList.remove('glass-panel', 'gs-open'); inst.delete(this.el);
    }
  }
  g.GlassPanel = { attach(el, o) { return el ? (inst.get(el) || new GP(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
