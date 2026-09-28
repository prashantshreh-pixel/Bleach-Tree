/**
 * kenpachi-panel.js - Kenpachi Zaraki: "Drink, Nozarashi!"
 * Meteor Cutting Animation (Clean, kinetic rock cleave - No fire/flame):
 * 1. Colossal cold basalt asteroid hurtles down with supersonic atmospheric shockwaves & speed streaks.
 * 2. Blinding, razor-sharp Nozarashi cleave slices cleanly across the meteor with screen tremor & impact flash.
 * 3. The asteroid splits into two clean stone halves along the razor line with a golden reiatsu cut glint.
 * 4. The cleaved stone slabs tumble and separate into the void with realistic rock fracture cross-sections.
 * 5. Eruption of fractured stone shrapnel, tumbling boulders, and dust puffs.
 * 6. Background WebGL raw spiritual pressure (deep crimson & golden-yellow) + reishi sparks.
 *
 *   const kp = KenpachiPanel.attach(sidebar, { meteor: true, sparks: 24 });
 *   kp.open();  kp.close();  kp.replay();
 */
(function (g) {
  'use strict';
  const inst = new WeakMap();
  const TAU = Math.PI * 2;
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 R;uniform float T,I,B;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y; float x=uv.x*asp;
  // uneven pulse of raw spiritual pressure
  float pulse=pow(.5+.5*sin(T*3.4),3.)*.6+pow(.5+.5*sin(T*3.4+1.1),6.)*.4;
  float bend=(fbm(vec2(x*1.8,uv.y*1.4-T*1.0))-.5)*(.08+uv.y*.6);
  float xx=x+bend;
  float tn=fbm(vec2(xx*3.2,T*1.1));
  // Keep flames concentrated strictly at the bottom
  float hh=(.10+.12*tn)*(.8+.2*pulse)*I;
  float e=clamp(1.-uv.y/max(hh,.001),0.,1.);
  // sharp, jagged upward pressure streaks
  float r1=pow(1.-abs(2.*fbm(vec2(xx*14.,uv.y*.9-T*3.0))-1.),4.);
  float r2=pow(1.-abs(2.*fbm(vec2(xx*28.+7.,uv.y*1.3-T*4.5))-1.),6.);
  float f=e*(.20+1.2*r1+.75*r2);
  float side=min(uv.x,1.-uv.x);
  float env=clamp(1.-side/.16,0.,1.);
  float hs=(.14+.16*tn)*I;
  float fs=clamp(1.-uv.y/max(hs,.001),0.,1.)*env*(.2+1.4*r1);
  f=max(f,fs*.7);
  // Strict ceiling: flames smoothly vanish before reaching 24% height from bottom
  f*=smoothstep(.24,.05,uv.y);
  f=pow(clamp(f*B,0.,1.),1.25);
  // Pure Kenpachi: dark blood crimson -> fierce blood red -> golden-yellow blade edge -> bone white (NO fire orange)
  vec3 c=mix(vec3(.22,.01,.04),vec3(.78,.04,.10),smoothstep(.05,.45,f));
  c=mix(c,vec3(.96,.78,.18),smoothstep(.52,.86,f));
  c=mix(c,vec3(1.,1.,.96),smoothstep(.88,1.,f));
  float a=smoothstep(.05,.28,f)*.88;
  gl_FragColor=vec4(c*a,a);
}`;

  class KP {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({
        meteor: true,
        sparks: 24,
        slashes: true,
        slashEvery: [2.8, 5.0],
        intensity: 0.9,
        scale: 0.7,
        aura: true,
        anchor: '#sidebar-content'
      }, o);

      this.isOpen = false;
      this.raf = null;
      this.t0 = 0;
      this.w = 0;
      this.h = 0;
      this.sp = [];
      this.cuts = [];
      this.debris = [];
      this.dustPuffs = [];
      this.nextCut = 0;
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Meteor State
      this.meteor = null;
      this.mainSlash = null;
      this.shockwave = null;

      this._build();
      inst.set(el, this);
    }

    _layer(c, tag) {
      const n = document.createElement(tag || 'div');
      n.className = 'kz-layer ' + c;
      n.setAttribute('aria-hidden', 'true');
      return n;
    }

    _build() {
      const el = this.el;
      el.classList.add('kenpachi-panel');
      let anchor = null;
      try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      if (!anchor) anchor = el.firstChild;

      this.mist = this._layer('kz-mist');
      this.press = this._layer('kz-press');
      this.aura = this._layer('kz-aura', 'canvas');
      this.zaraki = this._layer('kz-zaraki');
      this.zaraki.innerHTML = '<img src="Asset/GIF/zaraki.gif" alt="Zaraki Kenpachi" />';
      this.canvas = this._layer('kz-canvas', 'canvas');

      [this.mist, this.press, this.aura, this.zaraki, this.canvas].forEach(n => el.insertBefore(n, anchor));

      this.flash = this._layer('kz-flash');
      this.ring = this._layer('kz-ring');
      el.appendChild(this.flash);
      el.appendChild(this.ring);

      this.ctx = this.canvas.getContext('2d');
      this._initGL();
      this._resize();
      if (window.ResizeObserver) {
        this.ro = new ResizeObserver(() => this._resize());
        this.ro.observe(el);
      }
    }

    _initGL() {
      this.gl = null;
      if (!this.o.aura) return;
      const gl = this.aura.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return;
      const sh = (t, s) => {
        const x = gl.createShader(t);
        gl.shaderSource(x, s);
        gl.compileShader(x);
        return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null;
      };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS);
      if (!vs || !fs) return;
      const pr = gl.createProgram();
      gl.attachShader(pr, vs);
      gl.attachShader(pr, fs);
      gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      const b = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = {
        R: gl.getUniformLocation(pr, 'R'),
        T: gl.getUniformLocation(pr, 'T'),
        I: gl.getUniformLocation(pr, 'I'),
        B: gl.getUniformLocation(pr, 'B')
      };
      this.gl = gl;
    }

    _resize() {
      const w = this.el.clientWidth || 360,
            h = this.el.clientHeight || 540,
            d = Math.min(window.devicePixelRatio || 1, 2);
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8;
      this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d);
      this.canvas.height = Math.round(h * d);
      this.ctx.setTransform(d, 0, 0, d, 0, 0);

      if (this.gl) {
        const s = this.o.scale * Math.min(window.devicePixelRatio || 1, 1.5);
        this.aura.width = Math.max(2, Math.round(w * s));
        this.aura.height = Math.max(2, Math.round(h * s));
        this.gl.viewport(0, 0, this.aura.width, this.aura.height);
      }

      if (ch || !this.sp.length) {
        this.sp = Array.from({ length: this.o.sparks }, () => this._spark(true));
      }
    }

    // Spiritual pressure spark (golden-yellow or blood-crimson)
    _spark(init) {
      return {
        x: Math.random() * this.w,
        y: init ? Math.random() * this.h : this.h + 8,
        vy: Math.random() * 2.2 + 1.0,
        len: Math.random() * 8 + 3,
        w: Math.random() * 1.1 + 0.5,
        jit: Math.random() * 1.1 + 0.3,
        color: Math.random() < 0.45 ? 'gold' : 'crimson'
      };
    }

    // Screen Tremor via WAAPI
    _shake(a, dur) {
      if (this.rm || !this.el.animate) return;
      const kf = [{ translate: '0 0' }];
      for (let i = 1; i <= 8; i++) {
        const k = 1 - i / 9;
        kf.push({
          translate: `${((Math.random() - 0.5) * 2 * a * k).toFixed(1)}px ${((Math.random() - 0.5) * 2 * a * k * 0.85).toFixed(1)}px`
        });
      }
      kf.push({ translate: '0 0' });
      this.el.animate(kf, { duration: dur, easing: 'cubic-bezier(0.1, 0.9, 0.2, 1)' });
    }

    _flashOnce() {
      if (this.flash.animate) {
        this.flash.animate([
          { opacity: 0.85, transform: 'scale(1)' },
          { opacity: 0, transform: 'scale(1.04)' }
        ], { duration: 320, easing: 'ease-out' });
      }
    }

    // Initialize the Solid Asteroid
    _initMeteor() {
      const w = this.w, h = this.h;
      const cx = w * 0.52;
      const cy = h * 0.38;
      const baseR = Math.min(w, h) * 0.22; // ~78px
      const th = 33 * Math.PI / 180;        // 33° diagonal clean cleave
      const ux = Math.cos(th), uy = Math.sin(th);
      const nx = -uy, ny = ux;

      // Seed irregular polygon outline (rocky basalt)
      const verts = [];
      const N = 32;
      for (let i = 0; i < N; i++) {
        const a = (i / N) * TAU;
        const r = baseR * (0.88 + 0.14 * Math.sin(a * 3) + 0.10 * Math.cos(a * 6) + 0.06 * Math.sin(a * 10));
        verts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }

      // Natural stone craters
      const craters = [
        { x: -baseR * 0.35, y: -baseR * 0.25, r: baseR * 0.22 },
        { x: baseR * 0.15,  y: -baseR * 0.40, r: baseR * 0.16 },
        { x: -baseR * 0.15, y: baseR * 0.25,  r: baseR * 0.26 },
        { x: baseR * 0.35,  y: baseR * 0.15,  r: baseR * 0.18 }
      ];

      // Geological stress fractures
      const fractures = [
        [{ x: -baseR * 0.6, y: -baseR * 0.1 }, { x: -baseR * 0.2, y: -baseR * 0.15 }, { x: 0, y: -baseR * 0.35 }],
        [{ x: -baseR * 0.1, y: baseR * 0.1 },  { x: baseR * 0.2, y: baseR * 0.2 },   { x: baseR * 0.5, y: baseR * 0.05 }],
        [{ x: -baseR * 0.3, y: baseR * 0.4 },  { x: baseR * 0.0, y: baseR * 0.45 },  { x: baseR * 0.35, y: baseR * 0.38 }]
      ];

      this.meteor = {
        cx, cy, baseR, th, ux, uy, nx, ny, verts, craters, fractures,
        tCut: 0.36,       // Cut moment at 0.36 seconds
        cutExecuted: false,
        duration: 3.2
      };

      this.mainSlash = null;
      this.shockwave = null;
      this.debris = [];
      this.dustPuffs = [];
    }

    // Execute the Nozarashi cleave strike
    _executeCleave(nowSec) {
      const m = this.meteor;
      m.cutExecuted = true;
      this.el.classList.add('kz-cut-done');

      // 1. Tremor & Flash
      this._flashOnce();
      this._shake(16, 520);

      // 2. Colossal Nozarashi Blade Cleave
      const span = Math.hypot(this.w, this.h) * 1.25;
      this.mainSlash = {
        x0: m.cx - m.ux * span * 0.5,
        y0: m.cy - m.uy * span * 0.5,
        x1: m.cx + m.ux * span * 0.5,
        y1: m.cy + m.uy * span * 0.5,
        t: nowSec,
        dur: 0.44
      };

      // 3. Kinetic Shockwave Ring (compressive air blast)
      this.shockwave = {
        cx: m.cx,
        cy: m.cy,
        t: nowSec,
        dur: 0.58,
        maxR: Math.min(this.w, this.h) * 0.72
      };

      // 4. Shattered Stone Shrapnel (Clean rock shards, NO fire embers)
      for (let i = 0; i < 44; i++) {
        const side = Math.random() < 0.5 ? -1 : 1;
        const speed = 110 + Math.random() * 320;
        const tangSpread = (Math.random() - 0.5) * 150;
        const vx = side * m.nx * speed + m.ux * tangSpread;
        const vy = side * m.ny * speed + m.uy * tangSpread - 30;
        const sz = 3 + Math.random() * 7;
        this.debris.push({
          x: m.cx + (Math.random() - 0.5) * m.baseR * 0.8,
          y: m.cy + (Math.random() - 0.5) * m.baseR * 0.8,
          vx, vy,
          rot: Math.random() * TAU,
          vrot: (Math.random() - 0.5) * 10,
          sz,
          life: 0,
          maxLife: 1.1 + Math.random() * 1.3,
          shade: 0.15 + Math.random() * 0.25 // grey stone tone
        });
      }

      // 5. Impact Dust Puffs
      for (let i = 0; i < 6; i++) {
        this.dustPuffs.push({
          x: m.cx + (Math.random() - 0.5) * m.baseR * 0.6,
          y: m.cy + (Math.random() - 0.5) * m.baseR * 0.6,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40 - 20,
          r: 16 + Math.random() * 24,
          life: 0,
          maxLife: 0.8 + Math.random() * 0.5
        });
      }
    }

    // Draw one cleaved stone half
    _drawMeteorHalf(c, m, side, prog) {
      const ease = 1 - Math.pow(1 - Math.min(1, prog), 2.2);
      const sep = ease * (m.baseR * 1.15 + 38);
      const driftY = ease * (m.baseR * 0.52);
      const rot = side * ease * 0.22;

      const hx = m.cx + side * m.nx * sep;
      const hy = m.cy + side * m.ny * sep + driftY;

      const alpha = prog < 0.65 ? 1 : Math.max(0, 1 - (prog - 0.65) / 0.35);
      if (alpha <= 0.01) return;

      c.save();
      c.globalAlpha = alpha;
      c.translate(hx, hy);
      c.rotate(rot);

      // Clip to half-plane along the cut line
      const L = 900, H = 900;
      c.beginPath();
      c.moveTo(-L * m.ux, -L * m.uy);
      c.lineTo(L * m.ux, L * m.uy);
      c.lineTo(L * m.ux + side * H * m.nx, L * m.uy + side * H * m.ny);
      c.lineTo(-L * m.ux + side * H * m.nx, -L * m.uy + side * H * m.ny);
      c.closePath();
      c.clip();

      // 1. Basalt Rock Body (Cold, solid stone)
      c.beginPath();
      m.verts.forEach((v, i) => {
        if (i === 0) c.moveTo(v.x, v.y);
        else c.lineTo(v.x, v.y);
      });
      c.closePath();

      const rockGrad = c.createRadialGradient(-m.baseR * 0.25, -m.baseR * 0.25, 6, 0, 0, m.baseR * 1.05);
      rockGrad.addColorStop(0, '#363a44');    // Granite slate highlight
      rockGrad.addColorStop(0.45, '#1e2126'); // Basalt body
      rockGrad.addColorStop(0.85, '#111317'); // Dark shadow stone
      rockGrad.addColorStop(1, '#08090b');
      c.fillStyle = rockGrad;
      c.fill();

      // Rock edge definition
      c.strokeStyle = 'rgba(75, 85, 100, 0.45)';
      c.lineWidth = 1.6;
      c.stroke();

      // 2. Natural Craters
      m.craters.forEach(cr => {
        c.beginPath();
        c.arc(cr.x, cr.y, cr.r, 0, TAU);
        c.fillStyle = '#0e1014';
        c.fill();
        c.strokeStyle = 'rgba(90, 100, 120, 0.35)';
        c.lineWidth = 1.2;
        c.stroke();
      });

      // 3. Stress Fractures
      c.strokeStyle = 'rgba(10, 12, 16, 0.9)';
      c.lineWidth = 2.0;
      m.fractures.forEach(pts => {
        c.beginPath();
        pts.forEach((p, i) => { if (i === 0) c.moveTo(p.x, p.y); else c.lineTo(p.x, p.y); });
        c.stroke();
      });

      // 4. THE CLEAN SLICED STONE FACE
      // Natural fractured rock face interior (graphite/slate grey)
      const faceDepth = 26 * (1 - prog * 0.45);
      c.fillStyle = '#17191e';
      c.beginPath();
      c.moveTo(-L * m.ux, -L * m.uy);
      c.lineTo(L * m.ux, L * m.uy);
      c.lineTo(L * m.ux + side * faceDepth * m.nx, L * m.uy + side * faceDepth * m.ny);
      c.lineTo(-L * m.ux + side * faceDepth * m.nx, -L * m.uy + side * faceDepth * m.ny);
      c.closePath();
      c.fill();

      // Sharp Reiatsu Cut Edge Glint (Nozarashi's razor-sharp golden/white edge)
      const glintFade = Math.max(0, 1 - prog * 1.5);
      if (glintFade > 0.02) {
        c.beginPath();
        c.moveTo(-m.baseR * 1.4 * m.ux, -m.baseR * 1.4 * m.uy);
        c.lineTo(m.baseR * 1.4 * m.ux, m.baseR * 1.4 * m.uy);
        c.strokeStyle = `rgba(250, 204, 21, ${0.9 * glintFade})`; // Golden reiatsu glint
        c.lineWidth = 2.4;
        c.shadowColor = '#facc15';
        c.shadowBlur = 8;
        c.stroke();

        // Bone-white blade core line
        c.strokeStyle = `rgba(255, 255, 255, ${glintFade})`;
        c.lineWidth = 1.2;
        c.stroke();
        c.shadowBlur = 0;
      }

      c.restore();
    }

    _drawMeteor(c, nowSec) {
      if (!this.o.meteor || !this.meteor) return;
      const m = this.meteor;
      const dt = nowSec;

      // Phase 1: Incoming Asteroid with Supersonic Shockwaves (NO fire flames)
      if (dt < m.tCut) {
        const enterProg = dt / m.tCut;
        const curY = m.cy - (1 - enterProg) * 85;
        const curX = m.cx - (1 - enterProg) * 35;
        const scale = 0.76 + enterProg * 0.24;

        c.save();
        c.translate(curX, curY);
        c.scale(scale, scale);

        // Supersonic Air-Compression Shockwave Rings
        c.strokeStyle = 'rgba(215, 230, 255, 0.35)';
        c.lineWidth = 1.8;
        c.beginPath();
        c.ellipse(0, m.baseR * 0.35, m.baseR * 1.25, m.baseR * 0.65, -0.45, 0, TAU);
        c.stroke();

        c.strokeStyle = 'rgba(215, 230, 255, 0.20)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.ellipse(0, m.baseR * 0.6, m.baseR * 1.5, m.baseR * 0.8, -0.45, 0, TAU);
        c.stroke();

        // Speed displacement streaks behind the rock
        c.strokeStyle = 'rgba(200, 215, 235, 0.25)';
        c.lineWidth = 1.4;
        for (let i = -2; i <= 2; i++) {
          const sx = i * 20;
          c.beginPath();
          c.moveTo(sx, -m.baseR * 0.4);
          c.lineTo(sx - 35, -m.baseR * 1.6);
          c.stroke();
        }

        // Asteroid Rock Body
        c.beginPath();
        m.verts.forEach((v, i) => { if (i === 0) c.moveTo(v.x, v.y); else c.lineTo(v.x, v.y); });
        c.closePath();

        const rockGrad = c.createRadialGradient(-m.baseR * 0.25, -m.baseR * 0.25, 6, 0, 0, m.baseR * 1.05);
        rockGrad.addColorStop(0, '#363a44');
        rockGrad.addColorStop(0.45, '#1e2126');
        rockGrad.addColorStop(0.85, '#111317');
        rockGrad.addColorStop(1, '#08090b');
        c.fillStyle = rockGrad;
        c.shadowColor = 'rgba(15, 18, 24, 0.9)';
        c.shadowBlur = 12;
        c.fill();
        c.shadowBlur = 0;

        c.strokeStyle = 'rgba(80, 90, 105, 0.5)';
        c.lineWidth = 1.6;
        c.stroke();

        // Craters
        m.craters.forEach(cr => {
          c.beginPath();
          c.arc(cr.x, cr.y, cr.r, 0, TAU);
          c.fillStyle = '#0e1014';
          c.fill();
        });

        c.restore();
        return;
      }

      // Phase 2: Cleave Trigger
      if (!m.cutExecuted) {
        this._executeCleave(nowSec);
      }

      // Phase 3: The Two Cleaved Halves Splitting
      const splitTime = dt - m.tCut;
      const prog = splitTime / (m.duration - m.tCut);

      if (prog <= 1.05) {
        // Draw Half 1 (Top-Left)
        this._drawMeteorHalf(c, m, -1, prog);
        // Draw Half 2 (Bottom-Right)
        this._drawMeteorHalf(c, m, 1, prog);
      }
    }

    // Kenpachi's Nozarashi Blade Slash (Razor gold & blood reiatsu beam)
    _drawCleaveSlash(c, nowSec) {
      if (!this.mainSlash) return;
      const s = this.mainSlash;
      const age = nowSec - s.t;
      if (age > s.dur) {
        this.mainSlash = null;
        return;
      }

      const p = age / s.dur;
      const alpha = 1 - Math.pow(p, 1.8);

      c.save();
      c.lineCap = 'round';

      // 1. Violent blood-crimson spiritual pressure shockwave
      c.strokeStyle = `rgba(200, 20, 35, ${0.65 * alpha})`;
      c.lineWidth = 22 * (1 - p * 0.4);
      c.shadowColor = 'rgba(216, 18, 42, 0.9)';
      c.shadowBlur = 20;
      c.beginPath();
      c.moveTo(s.x0, s.y0);
      c.lineTo(s.x1, s.y1);
      c.stroke();

      // 2. Razor-sharp golden cutting edge (Nozarashi's signature yellow reiatsu)
      c.strokeStyle = `rgba(250, 204, 21, ${0.95 * alpha})`;
      c.lineWidth = 7 * (1 - p * 0.3);
      c.shadowColor = '#facc15';
      c.shadowBlur = 12;
      c.beginPath();
      c.moveTo(s.x0, s.y0);
      c.lineTo(s.x1, s.y1);
      c.stroke();

      // 3. Laser-sharp bone-white core line
      c.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      c.lineWidth = 2.6;
      c.shadowColor = '#ffffff';
      c.shadowBlur = 6;
      c.beginPath();
      c.moveTo(s.x0, s.y0);
      c.lineTo(s.x1, s.y1);
      c.stroke();

      c.shadowBlur = 0;
      c.restore();
    }

    // Compressive kinetic air blast ring
    _drawShockwave(c, nowSec) {
      if (!this.shockwave) return;
      const sw = this.shockwave;
      const age = nowSec - sw.t;
      if (age > sw.dur) {
        this.shockwave = null;
        return;
      }
      const p = age / sw.dur;
      const r = p * sw.maxR;
      const alpha = (1 - p) * 0.75;

      c.save();
      c.beginPath();
      c.arc(sw.cx, sw.cy, r, 0, TAU);
      // Kinetic white/gold shockwave
      c.strokeStyle = `rgba(240, 245, 255, ${alpha})`;
      c.lineWidth = Math.max(1, 3.5 * (1 - p));
      c.shadowColor = 'rgba(250, 204, 21, 0.8)';
      c.shadowBlur = 10;
      c.stroke();
      c.restore();
    }

    // Solid stone shrapnel & dust
    _drawDebris(c, dt) {
      const g = 460;
      // 1. Dust puffs
      for (let i = this.dustPuffs.length - 1; i >= 0; i--) {
        const dp = this.dustPuffs[i];
        dp.life += dt;
        if (dp.life > dp.maxLife) {
          this.dustPuffs.splice(i, 1);
          continue;
        }
        dp.x += dp.vx * dt;
        dp.y += dp.vy * dt;
        dp.r += 12 * dt;
        const a = (1 - dp.life / dp.maxLife) * 0.22;
        c.fillStyle = `rgba(60, 65, 75, ${a})`;
        c.beginPath();
        c.arc(dp.x, dp.y, dp.r, 0, TAU);
        c.fill();
      }

      // 2. Stone rubble shards
      for (let i = this.debris.length - 1; i >= 0; i--) {
        const d = this.debris[i];
        d.life += dt;
        if (d.life > d.maxLife || d.y > this.h + 20) {
          this.debris.splice(i, 1);
          continue;
        }

        d.vy += g * dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.rot += d.vrot * dt;

        const p = d.life / d.maxLife;
        const alpha = Math.min(1, (1 - p) * 2.2);

        c.save();
        c.translate(d.x, d.y);
        c.rotate(d.rot);
        c.globalAlpha = alpha;

        // Solid rock colors (dark grey/granite)
        const gray = Math.round(d.shade * 255);
        c.fillStyle = `rgb(${gray}, ${gray + 4}, ${gray + 8})`;
        c.beginPath();
        c.rect(-d.sz * 0.5, -d.sz * 0.5, d.sz, d.sz * 0.7);
        c.fill();
        c.strokeStyle = 'rgba(90, 100, 115, 0.4)';
        c.lineWidth = 0.8;
        c.stroke();

        c.restore();
      }
    }

    // Occasional sharp blade cleaves
    _slash(now) {
      const w = this.w, h = this.h;
      const dir = Math.random() < 0.5 ? 1 : -1;
      const y0 = h * (0.06 + Math.random() * 0.42);
      const drop = h * (0.24 + Math.random() * 0.44);
      this.cuts.push({
        x0: dir > 0 ? -24 : w + 24,
        y0,
        x1: dir > 0 ? w + 24 : -24,
        y1: y0 + drop,
        t: now,
        dur: 240 + Math.random() * 70,
        fired: false
      });
    }

    _scheduleCut(now) {
      const [a, b] = this.o.slashEvery;
      this.nextCut = now + (a + Math.random() * (b - a)) * 1000;
    }

    _drawCuts(c, now) {
      this.cuts = this.cuts.filter(s => {
        const age = now - s.t;
        const p = Math.min(1, age / s.dur);
        const q = 1 - Math.pow(1 - p, 2);
        const px = f => s.x0 + (s.x1 - s.x0) * f;
        const py = f => s.y0 + (s.y1 - s.y0) * f;

        if (p < 1) {
          const hx = px(q), hy = py(q);
          const tq = Math.max(0, q - 0.45);
          const tx = px(tq), ty = py(tq);
          const gr = c.createLinearGradient(tx, ty, hx, hy);
          gr.addColorStop(0, 'rgba(216,18,42,0)');
          gr.addColorStop(0.55, 'rgba(250,204,21,0.7)');
          gr.addColorStop(1, 'rgba(255,255,255,1)');
          c.lineCap = 'round';
          c.shadowColor = 'rgba(250,204,21,0.9)';
          c.shadowBlur = 10;
          c.strokeStyle = gr;
          c.lineWidth = 2.6;
          c.beginPath();
          c.moveTo(tx, ty);
          c.lineTo(hx, hy);
          c.stroke();
          c.shadowBlur = 0;
          return true;
        }

        if (!s.fired) {
          s.fired = true;
          this._flashOnce();
        }

        const a2 = (age - s.dur) / 380;
        if (a2 >= 1) return false;
        c.lineCap = 'round';
        c.strokeStyle = `rgba(255, 255, 255, ${(1 - a2) * 0.75})`;
        c.lineWidth = 1.4 * (1 - a2) + 0.3;
        c.beginPath();
        c.moveTo(s.x0, s.y0);
        c.lineTo(s.x1, s.y1);
        c.stroke();
        return true;
      });
    }

    _tick(now) {
      if (!this.isOpen) return;
      const nowSec = (now - this.t0) / 1000;
      const dt = 0.016;

      // 1. WebGL Spiritual Pressure Background (ignites ONLY after meteor cleave)
      const gl = this.gl;
      if (gl) {
        let I = 0;
        if (this.meteor && this.meteor.cutExecuted) {
          const cutAge = Math.max(0, nowSec - this.meteor.tCut);
          const k = Math.min(1, cutAge / 0.6);
          I = (1 - Math.pow(1 - k, 3)) * 0.85;
        }
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.u.R, this.aura.width, this.aura.height);
        gl.uniform1f(this.u.T, nowSec % 600);
        gl.uniform1f(this.u.I, I);
        gl.uniform1f(this.u.B, this.o.intensity);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }

      // 2. 2D Canvas Elements
      const c = this.ctx, w = this.w, h = this.h;
      c.clearRect(0, 0, w, h);

      // (a) Rising Spiritual Pressure Sparks (Yellow/Red reishi glints)
      for (const e of this.sp) {
        e.y -= e.vy;
        e.x += (Math.random() - 0.5) * e.jit;
        if (e.y < -12) Object.assign(e, this._spark(false));
        const a = 0.22 + Math.max(0, e.y / h) * 0.65;
        c.strokeStyle = e.color === 'gold' ? `rgba(250, 204, 21, ${a})` : `rgba(225, 29, 72, ${a})`;
        c.lineWidth = e.w;
        c.lineCap = 'round';
        c.shadowColor = e.color === 'gold' ? 'rgba(250, 204, 21, 0.8)' : 'rgba(225, 29, 72, 0.8)';
        c.shadowBlur = 5;
        c.beginPath();
        c.moveTo(e.x, e.y);
        c.lineTo(e.x, e.y + e.len);
        c.stroke();
      }
      c.shadowBlur = 0;

      // (b) Clean Asteroid Descent & Clean Cleave
      this._drawMeteor(c, nowSec);
      this._drawCleaveSlash(c, nowSec);
      this._drawShockwave(c, nowSec);
      this._drawDebris(c, dt);

      // (c) Secondary Slashes
      if (this.o.slashes) {
        if (now > this.nextCut && nowSec > 1.8) {
          this._slash(now);
          this._scheduleCut(now);
        }
        this._drawCuts(c, now);
      }

      this.raf = requestAnimationFrame(n => this._tick(n));
    }

    cutMeteor() {
      if (!this.isOpen) return;
      this._initMeteor();
      this.t0 = performance.now();
    }

    open() {
      if (this.isOpen) return;
      this.isOpen = true;
      this.el.classList.remove('kz-cut-done');
      this.el.classList.add('kz-open');
      if (!this.rm) {
        this._resize();
        this._initMeteor();
        this.t0 = performance.now();
        this.cuts = [];
        this._scheduleCut(this.t0 + 1400);
        cancelAnimationFrame(this.raf);
        this.raf = requestAnimationFrame(n => this._tick(n));
      }
    }

    close() {
      if (!this.isOpen) return;
      this.isOpen = false;
      this.el.classList.remove('kz-open', 'kz-cut-done');
      cancelAnimationFrame(this.raf);
      this.raf = null;
      setTimeout(() => {
        if (this.isOpen) return;
        this.ctx.clearRect(0, 0, this.w, this.h);
        if (this.gl) {
          this.gl.clearColor(0, 0, 0, 0);
          this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        }
      }, 700);
    }

    replay() {
      this.close();
      this.open();
    }

    destroy() {
      this.close();
      if (this.ro) this.ro.disconnect();
      [this.mist, this.press, this.aura, this.zaraki, this.canvas, this.flash, this.ring].forEach(n => n.remove());
      this.el.classList.remove('kenpachi-panel', 'kz-open', 'kz-cut-done');
      inst.delete(this.el);
    }
  }

  g.KenpachiPanel = {
    attach(el, o) { return el ? (inst.get(el) || new KP(el, o)) : null; },
    get(el) { return inst.get(el) || null; }
  };
})(typeof window !== 'undefined' ? window : this);
