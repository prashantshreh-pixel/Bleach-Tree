/**
 * soulking-panel.js - Soul King (Reio): pillar of divine light (WebGL shader) + drifting reishi motes
 *   const sk = SoulKingPanel.attach(sidebar, { motes: 46 });
 *   sk.open();  sk.close();
 * Options: motes (46), intensity (1 = pillar brightness), scale (0.7 = shader render resolution),
 *          beam (true), anchor ('#sidebar-content')
 * Falls back to glow + halo + motes if WebGL is unavailable.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap();
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 R;uniform float T,I,B;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y;
  vec2 p=vec2((uv.x-.5)*asp,uv.y);
  // the beam descends from the top on ignition
  float reveal=smoothstep(0.,.18,I*1.18-(1.-uv.y));
  // slow sway: the pillar breathes, it never flickers
  float sway=(fbm(vec2(uv.y*1.6,T*.22))-.5)*.09;
  float dx=p.x+sway;
  // narrow bright core + wide soft aura
  float wc=.02+.012*fbm(vec2(uv.y*3.,T*.5));
  float core=exp(-(dx*dx)/(wc*wc));
  float aura=exp(-(dx*dx)/(.14*.14));
  // light bands rising along the pillar
  float band=.62+.38*sin(uv.y*20.-T*2.4+fbm(vec2(dx*8.,uv.y*4.))*4.);
  // god rays fanning from a source above the panel
  vec2 q=vec2(p.x,uv.y-1.3);
  float ang=atan(q.x,-q.y);
  float rays=pow(fbm(vec2(ang*10.,T*.1)),2.2)*smoothstep(1.7,.15,length(q));
  // crystal glints: sharp facets that catch light inside the aura
  float sp=smoothstep(.84,.9,n(vec2(p.x*24.+sway*20.,uv.y*24.-T*.7)))*(.35+aura);
  // pooled light at the base, like the pillar meeting the floor of the world
  float pool=smoothstep(.16,0.,uv.y)*exp(-(p.x*p.x)/(.3*.3));
  float f=(core*band*1.1+aura*.5+rays*.55)*reveal+sp*.7*reveal+pool*.75*I;
  f=clamp(f*B,0.,1.);
  // violet edge -> gold body -> white core
  vec3 c=mix(vec3(.45,.35,.95),vec3(1.,.82,.4),smoothstep(.08,.5,f));
  c=mix(c,vec3(1.,.98,.9),smoothstep(.55,.95,f));
  // faint prismatic fringe where the aura falls off
  vec3 pr=.5+.5*vec3(sin(dx*38.+T*.6),sin(dx*38.+T*.6+2.1),sin(dx*38.+T*.6+4.2));
  c=mix(c,pr,.16*aura*(1.-core)*smoothstep(.1,.5,f));
  float a=smoothstep(.02,.32,f)*.92;
  gl_FragColor=vec4(c*a,a);
}`;

  class SK {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ motes: 46, intensity: 1, scale: .7, beam: true, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.raf = null; this.t0 = 0; this.w = 0; this.h = 0; this.pt = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _layer(c, tag) { const n = document.createElement(tag || 'div'); n.className = 'sk-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('soulking-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      if (!anchor) anchor = el.firstChild;
      this.mist = this._layer('sk-mist'); this.halo = this._layer('sk-halo');
      this.beam = this._layer('sk-beam', 'canvas'); this.canvas = this._layer('sk-canvas', 'canvas');
      [this.mist, this.halo, this.beam, this.canvas].forEach(n => el.insertBefore(n, anchor));
      this.ring = this._layer('sk-ring'); el.appendChild(this.ring);
      this.ctx = this.canvas.getContext('2d');
      this._initGL(); this._resize();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._resize()); this.ro.observe(el); }
    }

    _initGL() {
      this.gl = null; if (!this.o.beam) return;
      const gl = this.beam.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return;
      const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = { R: gl.getUniformLocation(pr, 'R'), T: gl.getUniformLocation(pr, 'T'), I: gl.getUniformLocation(pr, 'I'), B: gl.getUniformLocation(pr, 'B') };
      this.gl = gl;
    }

    _resize() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540, d = Math.min(devicePixelRatio || 1, 2);
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8; this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d); this.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (this.gl) { const s = this.o.scale * Math.min(devicePixelRatio || 1, 1.5);
        this.beam.width = Math.max(2, Math.round(w * s)); this.beam.height = Math.max(2, Math.round(h * s)); this.gl.viewport(0, 0, this.beam.width, this.beam.height); }
      if (ch || !this.pt.length) this.pt = Array.from({ length: this.o.motes }, () => this._mote(true));
    }

    // reishi mote: drifts upward and is slowly drawn toward the pillar
    _mote(init) {
      const k = Math.random();
      return { x: Math.random() * this.w, y: init ? Math.random() * this.h : this.h + 6, r: Math.random() * 1.5 + .5, vy: Math.random() * .55 + .2,
        sw: Math.random() * 6.28, ss: Math.random() * .03 + .01, tw: Math.random() * 6.28,
        kind: k < .5 ? 0 : k < .82 ? 1 : 2,   // 0 gold, 1 white, 2 violet
        star: Math.random() < .14 };
    }

    _tick(now) {
      if (!this.isOpen) return;
      const t = (now - this.t0) / 1000, gl = this.gl;
      if (gl) {
        const k = Math.min(1, t / 1.6), I = Math.max(.05, 1 - Math.pow(1 - k, 3));   // beam descends over 1.6s
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.u.R, this.beam.width, this.beam.height); gl.uniform1f(this.u.T, t % 600); gl.uniform1f(this.u.I, I); gl.uniform1f(this.u.B, this.o.intensity);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const c = this.ctx, w = this.w, h = this.h, cx = w / 2; c.clearRect(0, 0, w, h);
      const COL = ['255,224,138', '255,250,236', '175,150,255'];
      for (const e of this.pt) {
        e.sw += e.ss; e.tw += .07; e.y -= e.vy; e.x += Math.sin(e.sw) * .35 + (cx - e.x) * .0009;
        if (e.y < -6) Object.assign(e, this._mote(false));
        const a = (.2 + Math.max(0, e.y / h) * .6) * (.7 + .3 * Math.sin(e.tw));
        const col = COL[e.kind];
        c.shadowColor = 'rgba(' + col + ',.95)'; c.shadowBlur = e.star ? 12 : 7; c.fillStyle = 'rgba(' + col + ',' + a + ')';
        if (e.star) {   // four-point glint
          const L = e.r * 4.2 * (.7 + .3 * Math.sin(e.tw));
          c.fillRect(e.x - L, e.y - .45, L * 2, .9); c.fillRect(e.x - .45, e.y - L, .9, L * 2);
        } else { c.beginPath(); c.arc(e.x, e.y, e.r, 0, 6.2832); c.fill(); }
      }
      this.raf = requestAnimationFrame(n => this._tick(n));
    }

    open() {
      if (this.isOpen) return; this.isOpen = true; this.el.classList.add('sk-open');
      if (!this.rm) { this._resize(); this.t0 = performance.now(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(n => this._tick(n)); }
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false; this.el.classList.remove('sk-open');
      cancelAnimationFrame(this.raf); this.raf = null;
      setTimeout(() => { if (this.isOpen) return; this.ctx.clearRect(0, 0, this.w, this.h); if (this.gl) { this.gl.clearColor(0, 0, 0, 0); this.gl.clear(this.gl.COLOR_BUFFER_BIT); } }, 900);
    }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.mist, this.halo, this.beam, this.canvas, this.ring].forEach(n => n.remove());
      this.el.classList.remove('soulking-panel', 'sk-open'); inst.delete(this.el);
    }
  }
  g.SoulKingPanel = { attach(el, o) { return el ? (inst.get(el) || new SK(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
