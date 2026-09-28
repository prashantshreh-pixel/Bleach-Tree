/**
 * kisuke-panel.js - Bankai Kannonbiraki Benihime Aratame:
 * Smooth diagonal cut sewn together like a railway track with parallel rails,
 * heavy perpendicular sleeper ties, cross-braces, and a travelling suture needle.
 *   const ks = KisukePanel.attach(sidebar, { seam: 0.52, tilt: 26, ties: 14 });
 *   ks.open();  ks.close();  ks.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const T0 = 0.55, TS = 2.1; // Stitching begins at 0.55s and takes 2.1s

  class KP {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ seam: 0.52, tilt: 26, ties: 14, trackWidth: 22, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.pts = []; this.anim = null; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'ks-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }
    _svg(c) {
      const s = document.createElementNS(NS, 'svg');
      s.setAttribute('class', 'ks-layer ' + c);
      s.setAttribute('aria-hidden', 'true');
      s.setAttribute('preserveAspectRatio', 'none');
      return s;
    }

    _build() {
      const el = this.el; el.classList.add('kisuke-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;
      this.cloth = this._div('ks-cloth');
      this.back = this._svg('ks-back');
      [this.cloth, this.back].forEach(n => el.insertBefore(n, ref)); // behind text
      this.front = this._svg('ks-front');
      this.ring = this._div('ks-ring');
      [this.front, this.ring].forEach(n => el.appendChild(n)); // over text
      this._measure();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._measure()); this.ro.observe(el); }
    }

    _measure() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540;
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8; this.w = w; this.h = h;
      if (ch || !this.back.firstChild) this._geom();
    }

    _geom() {
      const { w, h } = this, N = this.o.ties, f = n => n.toFixed(1);
      const th = this.o.tilt * Math.PI / 180;
      const cx = w * 0.5, cy = h * this.o.seam;
      const ux = Math.cos(th), uy = Math.sin(th); // unit tangent along diagonal cut
      const nx = -uy, ny = ux;                   // unit normal perpendicular to cut

      const span = Math.hypot(w, h) * 1.15;
      const halfSpan = span * 0.5;
      const trackW = this.o.trackWidth;

      // 1. Cut Edges & Gap (The diagonal tear)
      const M = 24, topRail = [], botRail = [], midSeam = [];
      for (let i = 0; i <= M; i++) {
        const s = (i / M - 0.5) * span;
        const taper = Math.sin(Math.PI * i / M);
        const gap = trackW * (0.45 + 0.55 * Math.pow(taper, 0.7));
        const px = cx + ux * s, py = cy + uy * s;
        topRail.push([px + nx * gap, py + ny * gap]);
        botRail.push([px - nx * gap, py - ny * gap]);
        midSeam.push([px, py]);
      }

      const P = a => a.map((p, i) => (i ? 'L' : 'M') + f(p[0]) + ' ' + f(p[1])).join('');
      const tearPoly = P(topRail) + botRail.slice().reverse().map(p => 'L' + f(p[0]) + ' ' + f(p[1])).join('') + 'Z';

      this.back.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this.back.innerHTML =
        `<g class="ks-tear" style="transform-origin:${f(cx)}px ${f(cy)}px">` +
        `<path class="ks-gap" d="${tearPoly}"/>` +
        `<path class="ks-rail ks-rail-top" pathLength="1" d="${P(topRail)}"/>` +
        `<path class="ks-rail ks-rail-bot" pathLength="1" style="animation-delay:0.04s" d="${P(botRail)}"/>` +
        `</g>` +
        `<path class="ks-seam" d="${P(midSeam)}"/>`;

      // 2. Railway Track Ties (Sleepers + Lattice X-Braces + Rivet Spikes)
      const tieStep = (span * 0.88) / N;
      const tiesTop = [], tiesBot = [];
      let tiesSvg = '', rivetsSvg = '', latticeSvg = '';

      for (let i = 0; i <= N; i++) {
        const s = (i / N - 0.5) * (span * 0.88);
        const px = cx + ux * s, py = cy + uy * s;
        const pt = [px + nx * trackW, py + ny * trackW];
        const pb = [px - nx * trackW, py - ny * trackW];
        tiesTop.push(pt); tiesBot.push(pb);

        const d = (T0 + (i / N) * TS).toFixed(2);
        // Perpendicular Railway Sleeper Rung
        tiesSvg += `<path class="ks-tie" pathLength="1" style="--d:${d}s" d="M${f(pt[0])} ${f(pt[1])}L${f(pb[0])} ${f(pb[1])}"/>`;

        // Rivet / Spike at each rail-tie anchor
        rivetsSvg += `<circle class="ks-rivet" cx="${f(pt[0])}" cy="${f(pt[1])}" r="2" style="--d:${d}s"/>` +
                     `<circle class="ks-rivet" cx="${f(pb[0])}" cy="${f(pb[1])}" r="2" style="--d:${d}s"/>`;

        // Lattice X-bracing between track ties (railroad truss)
        if (i < N) {
          const nextS = ((i + 1) / N - 0.5) * (span * 0.88);
          const nextPx = cx + ux * nextS, nextPy = cy + uy * nextS;
          const nextPt = [nextPx + nx * trackW, nextPy + ny * trackW];
          const nextPb = [nextPx - nx * trackW, nextPy - ny * trackW];
          const xd = (+d + 0.05).toFixed(2);
          latticeSvg += `<path class="ks-lattice" pathLength="1" style="--d:${xd}s" d="M${f(pt[0])} ${f(pt[1])}L${f(nextPb[0])} ${f(nextPb[1])}"/>` +
                        `<path class="ks-lattice" pathLength="1" style="--d:${xd}s" d="M${f(pb[0])} ${f(pb[1])}L${f(nextPt[0])} ${f(nextPt[1])}"/>`;
        }
      }

      // Knot and trailing thread at the end of the track
      const lastPt = tiesTop[N];
      const knotSvg =
        `<circle class="ks-knot" cx="${f(lastPt[0])}" cy="${f(lastPt[1])}" r="4"/>` +
        `<path class="ks-tail" pathLength="1" d="M${f(lastPt[0])} ${f(lastPt[1])}Q${f(lastPt[0] + 12)} ${f(lastPt[1] + 18)} ${f(lastPt[0] + 4)} ${f(lastPt[1] + 42)}"/>` +
        `<path class="ks-tail" pathLength="1" d="M${f(lastPt[0])} ${f(lastPt[1])}Q${f(lastPt[0] - 14)} ${f(lastPt[1] + 14)} ${f(lastPt[0] - 20)} ${f(lastPt[1] + 32)}"/>`;

      // Needle styled with Benihime's golden-cream suture
      const needleAngleDeg = (th * 180 / Math.PI).toFixed(1);
      const needleSvg =
        `<g class="ks-needle">` +
        `<path d="M-26 0L24 -1.6L30 0L24 1.6Z" fill="#F4F6FA"/>` +
        `<ellipse cx="-19" cy="0" rx="3.6" ry="1" fill="#0C0D14"/>` +
        `<path d="M-24 0Q-46 -12 -72 -4" fill="none" stroke="#FDE68A" stroke-width="2" stroke-linecap="round"/>` +
        `</g>`;

      this.front.setAttribute('viewBox', `0 0 ${w} ${h}`);
      this.front.innerHTML = latticeSvg + tiesSvg + rivetsSvg + knotSvg + needleSvg;
      this.needle = this.front.querySelector('.ks-needle');

      // Keyframes for needle: Smoothly zips along the center seam with slight alternating weave
      this.pts = [];
      const stepsCount = N * 3;
      for (let i = 0; i <= stepsCount; i++) {
        const t = i / stepsCount;
        const s = (t - 0.5) * (span * 0.94);
        const wave = Math.sin(t * N * Math.PI) * (trackW * 0.65);
        this.pts.push({
          x: cx + ux * s + nx * wave,
          y: cy + uy * s + ny * wave,
          angle: (th * 180 / Math.PI) + (Math.cos(t * N * Math.PI) * 18)
        });
      }
    }

    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([
        { translate: '0 0' },
        { translate: `${-a}px ${a * 0.5}px` },
        { translate: `${a * 0.75}px ${-a * 0.4}px` },
        { translate: `${-a * 0.3}px 0` },
        { translate: '0 0' }
      ], { duration: 360, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)' });
    }

    _runNeedle() {
      if (this.rm || !this.needle || !this.needle.animate) return;
      const p = this.pts, n = p.length, kf = [];
      for (let i = 0; i < n; i++) {
        const offset = i / (n - 1);
        kf.push({
          transform: `translate(${p[i].x.toFixed(1)}px, ${p[i].y.toFixed(1)}px) rotate(${p[i].angle.toFixed(1)}deg)`,
          opacity: (i === 0 || i === n - 1) ? 0 : 1,
          offset
        });
      }
      this.anim = this.needle.animate(kf, {
        delay: T0 * 1000,
        duration: TS * 1000,
        easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        fill: 'both'
      });
    }

    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('ks-open'); void this.el.offsetWidth; this.el.classList.add('ks-open');
      this._measure();
      this._shake(6);
      this._runNeedle();
      this.timers.push(setTimeout(() => { if (this.isOpen) this._shake(3.5); }, (T0 + TS) * 1000));
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('ks-open');
      if (this.anim) { this.anim.cancel(); this.anim = null; }
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.cloth, this.back, this.front, this.ring].forEach(n => n.remove());
      this.el.classList.remove('kisuke-panel', 'ks-open'); inst.delete(this.el);
    }
  }
  g.KisukePanel = { attach(el, o) { return el ? (inst.get(el) || new KP(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
