/**
 * kirio-panel.js - Kirio Hikifune ("The Ruler of Grain" / Gatonden Feast & Cage of Life):
 * Multi-branched Inochi no Ori (Cage of Life) lattice, steaming soul-food
 * feast bowl, rising aromatic food steam, golden Gikongan candies,
 * jade leaves, life blossoms, and an authentic "穀" (Grain) hanko seal.
 *   const kr = KirioPanel.attach(sidebar, { impact: [0.5, 0.88], seal: [0.84, 0.9], seed: 21 });
 *   kr.open();  kr.close();  kr.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap(), NS = 'http://www.w3.org/2000/svg';
  const rng = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0], u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; };

  class KR {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ impact: [0.5, 0.88], seal: [0.84, 0.9], seed: 21, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.w = 0; this.h = 0; this.timers = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _div(c) { const n = document.createElement('div'); n.className = 'kr-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('kirio-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      const ref = anchor || el.firstChild;

      this.wash = this._div('kr-wash');
      this.wash.style.setProperty('--ix', (this.o.impact[0] * 100) + '%');
      this.wash.style.setProperty('--iy', (this.o.impact[1] * 100) + '%');

      this.svg = document.createElementNS(NS, 'svg');
      this.svg.setAttribute('class', 'kr-layer kr-svg');
      this.svg.setAttribute('aria-hidden', 'true');
      this.svg.setAttribute('preserveAspectRatio', 'none');
      [this.wash, this.svg].forEach(n => el.insertBefore(n, ref)); // behind the text

      // Authentic Emerald & Gold Hanko Seal with "穀" (Ruler of Grain / Feast)
      this.seal = this._div('kr-seal');
      this.seal.style.left = (this.o.seal[0] * 100) + '%';
      this.seal.style.top = (this.o.seal[1] * 100) + '%';
      this.seal.innerHTML =
        '<svg viewBox="0 0 60 60" aria-hidden="true"><g filter="url(#kr-rough)">' +
        '<rect x="4" y="4" width="52" height="52" rx="7" fill="#065f46"/>' +
        '<rect x="8" y="8" width="44" height="44" rx="4" fill="none" stroke="rgba(253,230,138,.65)" stroke-width="1.6"/>' +
        '<!-- Kanji 穀 (Grain / Nourishment) stylized -->' +
        '<path d="M18 18H28M23 15V24" stroke="#fde68a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M17 28L29 25M27 21L21 31" stroke="#fde68a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M33 16H43M38 14V23" stroke="#fde68a" stroke-width="1.8" stroke-linecap="round"/>' +
        '<path d="M18 36H42" stroke="#fde68a" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M30 32V50" stroke="#fde68a" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M30 38L21 47M30 40L39 48" stroke="#fde68a" stroke-width="1.8" stroke-linecap="round"/>' +
        '</g></svg>';

      this.ring = this._div('kr-ring');
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

        // Defs with texture & filters
        let defs =
          `<defs>` +
          `<filter id="kr-rough" x="-5%" y="-25%" width="110%" height="150%">` +
          `<feTurbulence type="fractalNoise" baseFrequency=".035 .08" numOctaves="2" seed="9" result="n"/>` +
          `<feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/>` +
          `</filter>` +
          `<radialGradient id="kr-candy-glow" cx="50%" cy="50%" r="50%">` +
          `<stop offset="0%" stop-color="#fffbeb"/>` +
          `<stop offset="45%" stop-color="#fbbf24"/>` +
          `<stop offset="100%" stop-color="rgba(245,158,11,0)"/>` +
          `</radialGradient>` +
          `</defs>`;

        // 1. Inochi no Ori (Cage of Life) - dense multi-branch network growing from both sides
        // Left primary bough
        const LP0 = [-w * 0.05, h * 0.90], LA1 = [w * 0.18, h * 0.70], LA2 = [w * 0.32, h * 0.85],
              LP1 = [w * 0.52, h * 0.68], LB1 = [w * 0.72, h * 0.52], LB2 = [w * 0.88, h * 0.65], LP2 = [w * 1.05, h * 0.55];
        const dLeft = `M${f(LP0[0])} ${f(LP0[1])}C${f(LA1[0])} ${f(LA1[1])} ${f(LA2[0])} ${f(LA2[1])} ${f(LP1[0])} ${f(LP1[1])}C${f(LB1[0])} ${f(LB1[1])} ${f(LB2[0])} ${f(LB2[1])} ${f(LP2[0])} ${f(LP2[1])}`;
        const atL = t => t < .5 ? bez(LP0, LA1, LA2, LP1, t * 2) : bez(LP1, LB1, LB2, LP2, (t - .5) * 2);

        // Right primary bough arching inwards and crossing over (forming the cage)
        const RP0 = [w * 1.05, h * 0.92], RA1 = [w * 0.82, h * 0.74], RA2 = [w * 0.65, h * 0.88],
              RP1 = [w * 0.45, h * 0.73], RB1 = [w * 0.25, h * 0.58], RB2 = [w * 0.12, h * 0.70], RP2 = [-w * 0.04, h * 0.60];
        const dRight = `M${f(RP0[0])} ${f(RP0[1])}C${f(RA1[0])} ${f(RA1[1])} ${f(RA2[0])} ${f(RA2[1])} ${f(RP1[0])} ${f(RP1[1])}C${f(RB1[0])} ${f(RB1[1])} ${f(RB2[0])} ${f(RB2[1])} ${f(RP2[0])} ${f(RP2[1])}`;
        const atR = t => t < .5 ? bez(RP0, RA1, RA2, RP1, t * 2) : bez(RP1, RB1, RB2, RP2, (t - .5) * 2);

        // Intertwining branch ribbons (dense sacred wood)
        let boughs = '';
        for (let k = -3; k <= 3; k++) {
          const c = 1 - Math.abs(k) / 4;
          const col = k === 0 ? 'rgba(217,155,67,.65)' : (k % 2 === 0 ? 'rgba(52,211,153,.45)' : 'rgba(146,96,42,.55)');
          const L = (.82 + c * .18).toFixed(2);
          const wd = (2.2 + c * 5.0 + r() * 1.5).toFixed(1);
          const dyL = k * 3.8 + (r() - .5) * 2;
          const dyR = -k * 3.4 + (r() - .5) * 2;
          boughs += `<path class="kr-bough" pathLength="1" transform="translate(0 ${f(dyL)})" stroke="${col}" stroke-width="${wd}" style="--L:${L};--d:${(.08 + Math.abs(k) * .06).toFixed(2)}s;--dur:${(.95 + r() * .2).toFixed(2)}s" d="${dLeft}"/>`;
          if (Math.abs(k) <= 2) {
            boughs += `<path class="kr-bough" pathLength="1" transform="translate(0 ${f(dyR)})" stroke="${col}" stroke-width="${(wd * .85).toFixed(1)}" style="--L:${L};--d:${(.18 + Math.abs(k) * .06).toFixed(2)}s;--dur:${(.95 + r() * .2).toFixed(2)}s" d="${dRight}"/>`;
          }
        }

        // Secondary sprouting twigs, leaves, and blossoms along both boughs
        let twigs = '', leaves = '', blooms = '';
        const samplePoints = [
          { fn: atL, t: 0.18, dir: -1 }, { fn: atL, t: 0.36, dir: 1 }, { fn: atL, t: 0.54, dir: -1 }, { fn: atL, t: 0.72, dir: 1 }, { fn: atL, t: 0.88, dir: -1 },
          { fn: atR, t: 0.22, dir: 1 }, { fn: atR, t: 0.42, dir: -1 }, { fn: atR, t: 0.62, dir: 1 }, { fn: atR, t: 0.80, dir: -1 }
        ];

        samplePoints.forEach((sp, i) => {
          const p = sp.fn(sp.t);
          const len = 28 + r() * 32;
          const ang = (-0.85 + sp.dir * 0.4) + (r() - 0.5) * 0.25;
          const tx = p[0] + Math.cos(ang) * len, ty = p[1] + Math.sin(ang) * len;
          const cx = (p[0] + tx) * 0.5 + sp.dir * 8, cy = (p[1] + ty) * 0.5 - 6;
          const dl = (0.42 + i * 0.1).toFixed(2);

          twigs += `<path class="kr-bough" pathLength="1" stroke="rgba(180,130,60,.55)" stroke-width="2.2" style="--L:1;--d:${dl}s;--dur:.65s" d="M${f(p[0])} ${f(p[1])}Q${f(cx)} ${f(cy)} ${f(tx)} ${f(ty)}"/>`;

          // Jade leaves
          const ldl = (+dl + 0.28).toFixed(2);
          const deg = (ang * 180 / Math.PI).toFixed(0);
          leaves += `<ellipse class="kr-leaf" cx="${f(cx)}" cy="${f(cy)}" rx="6" ry="2.6" fill="rgba(52,211,153,.7)" transform="rotate(${deg} ${f(cx)} ${f(cy)})" style="--d:${ldl}s"/>`;

          // Sakura-life blossoms
          const bdl = (+dl + 0.4).toFixed(2);
          let petals = '';
          for (let a = 0; a < 5; a++) {
            const pa = (a * 72) * Math.PI / 180;
            const px = tx + Math.cos(pa) * 3.6, py = ty + Math.sin(pa) * 3.6;
            petals += `<circle cx="${f(px)}" cy="${f(py)}" r="2.4" fill="rgba(251,207,232,.85)"/>`;
          }
          blooms += `<g class="kr-bloom" style="--d:${bdl}s">${petals}<circle cx="${f(tx)}" cy="${f(ty)}" r="1.7" fill="#fde68a"/></g>`;
        });

        // 2. FOOD ELEMENTS: Gatonden Soul-Food Feast Bowl & Food Infusion
        // Stylized Japanese Lacquer Feast Bowl (Gohan-wan / Feast Platter) at the base center
        const bx = w * 0.50, by = h * 0.86;
        let foodBowl =
          `<g class="kr-food-bowl">` +
          `<!-- Bowl Base / Footring -->` +
          `<path d="M ${f(bx - 22)} ${f(by + 16)} L ${f(bx + 22)} ${f(by + 16)} L ${f(bx + 16)} ${f(by + 20)} L ${f(bx - 16)} ${f(by + 20)} Z" fill="#991b1b" stroke="#fde68a" stroke-width=".8"/>` +
          `<!-- Deep Lacquer Bowl Body -->` +
          `<path d="M ${f(bx - 44)} ${f(by + 2)} Q ${f(bx)} ${f(by + 26)} ${f(bx + 44)} ${f(by + 2)} Q ${f(bx)} ${f(by - 2)} ${f(bx - 44)} ${f(by + 2)} Z" fill="#7f1d1d" stroke="#f59e0b" stroke-width="1.2"/>` +
          `<!-- Golden Rim Highlight -->` +
          `<ellipse cx="${f(bx)}" cy="${f(by + 2)}" rx="44" ry="7" fill="none" stroke="#fde68a" stroke-width="1.4"/>` +
          `<!-- Heaping Mound of Steaming Soul-Food / Spirit Rice & Delicacies -->` +
          `<path d="M ${f(bx - 38)} ${f(by + 1)} Q ${f(bx - 24)} ${f(by - 22)} ${f(bx)} ${f(by - 24)} Q ${f(bx + 24)} ${f(by - 22)} ${f(bx + 38)} ${f(by + 1)} Z" fill="#fef08a" stroke="rgba(245,158,11,.6)" stroke-width="1"/>` +
          `<!-- Vitality Garnish & Food Infusion Essence -->` +
          `<circle cx="${f(bx)}" cy="${f(by - 12)}" r="4" fill="#ef4444"/>` +
          `<circle cx="${f(bx - 12)}" cy="${f(by - 8)}" r="2.8" fill="#10b981"/>` +
          `<circle cx="${f(bx + 12)}" cy="${f(by - 8)}" r="2.8" fill="#f59e0b"/>` +
          `</g>`;

        // Rising curling food steam wisps from the hot feast
        let foodSteam = '';
        [-14, 0, 14].forEach((off, idx) => {
          const sx = bx + off;
          const sy = by - 24;
          const hLen = 60 + r() * 40;
          const sw = (1.5 + r() * 0.8).toFixed(1);
          const dl = (0.55 + idx * 0.25).toFixed(2);
          const c1x = sx - 10, c1y = sy - hLen * 0.35;
          const c2x = sx + 10, c2y = sy - hLen * 0.70;
          const ex = sx + (r() - 0.5) * 8, ey = sy - hLen;
          foodSteam += `<path class="kr-food-steam" pathLength="1" stroke-width="${sw}" style="--d:${dl}s" d="M${f(sx)} ${f(sy)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(ex)} ${f(ey)}"/>`;
        });

        // Golden Gikongan Soul Candies / Delicacies nestled on branches
        let candies = '';
        const candySpots = [
          { x: w * 0.26, y: h * 0.72 },
          { x: w * 0.74, y: h * 0.70 },
          { x: w * 0.38, y: h * 0.60 },
          { x: w * 0.64, y: h * 0.58 }
        ];
        candySpots.forEach((cs, i) => {
          const rad = 5.5 + r() * 2;
          const dl = (0.75 + i * 0.18).toFixed(2);
          candies +=
            `<g class="kr-candy" style="--d:${dl}s">` +
            `<circle cx="${f(cs.x)}" cy="${f(cs.y)}" r="${(rad * 1.8).toFixed(1)}" fill="url(#kr-candy-glow)"/>` +
            `<circle cx="${f(cs.x)}" cy="${f(cs.y)}" r="${f(rad)}" fill="#fbbf24" stroke="#ffffff" stroke-width=".8"/>` +
            `<circle cx="${f(cs.x - rad * 0.28)}" cy="${f(cs.y - rad * 0.28)}" r="${(rad * 0.3).toFixed(1)}" fill="#fffbeb"/>` +
            `</g>`;
        });

        // Rising golden soul-grain motes (vitality)
        let motes = '';
        for (let i = 0; i < 16; i++) {
          const p = atL(0.12 + r() * 0.80);
          const a = -Math.PI * (0.2 + r() * 0.6);
          const dist = 16 + r() * 45;
          const rad = 1.2 + r() * 2.2;
          const col = i % 3 === 0 ? '#6ee7b7' : '#fde68a';
          motes += `<circle class="kr-mote" cx="${f(p[0])}" cy="${f(p[1])}" r="${f(rad)}" style="--c:${col};--tx:${(Math.cos(a) * dist).toFixed(0)}px;--ty:${(Math.sin(a) * dist).toFixed(0)}px;--d:${(0.65 + r() * 0.45).toFixed(2)}s"/>`;
        }

        this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
        this.svg.innerHTML =
          `${defs}` +
          `<path class="kr-glow" d="${dLeft}"/>` +
          `<path class="kr-glow" d="${dRight}"/>` +
          `<g filter="url(#kr-rough)">${boughs}${twigs}</g>` +
          `<g>${leaves}${blooms}${candies}${foodBowl}${foodSteam}${motes}</g>`;
      } catch (err) {
        console.error('KirioPanel error:', err);
      }
    }

    _shake(a) {
      if (this.rm || !this.el.animate) return;
      this.el.animate([{ translate: '0 0' }, { translate: `${-a * .3}px ${a}px` }, { translate: `${a * .2}px ${-a * .4}px` }, { translate: '0 0' }], { duration: 250, easing: 'ease-out' });
    }
    open() {
      if (this.isOpen) return; this.isOpen = true;
      this.el.classList.remove('kr-open'); void this.el.offsetWidth; this.el.classList.add('kr-open');
      this._measure();
      this.timers.push(setTimeout(() => { if (this.isOpen) this._shake(3.0); }, 1650));
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false;
      this.timers.forEach(clearTimeout); this.timers = [];
      this.el.classList.remove('kr-open');
    }
    replay() { this.close(); this.open(); }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.wash, this.svg, this.seal, this.ring].forEach(n => n.remove());
      this.el.classList.remove('kirio-panel', 'kr-open'); inst.delete(this.el);
    }
  }
  g.KirioPanel = { attach(el, o) { return el ? (inst.get(el) || new KR(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
