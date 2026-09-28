/**
 * flame-panel.js - Ryujin Jakka: real fire (WebGL shader) + rising embers
 *   const fl = FlamePanel.attach(sidebar, { embers: 40 });
 *   fl.open();  fl.close();
 * Options: embers (40), fireHeight (0.3 = flame bases ~30% up, tips higher),
 *          scale (0.7 = shader render resolution), fire (true)
 * Falls back to glow + embers if WebGL is unavailable.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap();
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 R;uniform float T,I,H;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),h(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<5;i++){v+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y; float x=uv.x*asp;
  // heat turbulence bends the flame sideways more as it rises
  float bend=(fbm(vec2(x*2.2,uv.y*1.8-T*1.5))-.5)*(.12+uv.y*.9);
  float xx=x+bend;
  // every tongue gets its own height, changing over time (dancing flame tops)
  float tn=fbm(vec2(xx*7.,T*.8));
  float fl=.9+.1*sin(T*8.+xx*5.);
  // fine detail streaming upward eats the flame into pointed wisps
  float d=fbm(vec2(xx*10.,uv.y*3.5-T*2.6));
  // bottom flames
  float hb=H*(.3+1.3*tn)*fl*I;
  float yb=uv.y/max(hb,.001);
  float fb=clamp(1.-yb-(d-.32)*yb*2.,0.,1.);
  // side flames climbing the edges
  float side=min(uv.x,1.-uv.x);
  float env=clamp(1.-side/.14,0.,1.);
  float hs=H*(1.2+2.2*tn)*fl*I;
  float ys=uv.y/max(hs,.001);
  float fs=clamp(1.-ys-(d-.32)*ys*2.,0.,1.)*env;
  // glowing ember bed at the very bottom
  float bed=smoothstep(.09,0.,uv.y)*(.55+.45*d)*I;
  float f=max(max(fb,fs*.9),bed);
  f=pow(f,1.25)*.93;
  vec3 c=mix(vec3(.55,.03,0.),vec3(1.,.28,.02),smoothstep(.05,.4,f));   // deep red -> orange
  c=mix(c,vec3(1.,.7,.15),smoothstep(.35,.7,f));                        // -> yellow
  c=mix(c,vec3(1.,.95,.7),smoothstep(.7,.95,f));                        // -> white-hot core
  float a=smoothstep(.03,.2,f);
  gl_FragColor=vec4(c*a,a);
}`;

  class FI {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ embers: 40, fireHeight: .3, scale: .7, fire: true, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.raf = null; this.t0 = 0; this.w = 0; this.h = 0; this.em = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _layer(c, tag) { const n = document.createElement(tag || 'div'); n.className = 'fl-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('flame-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      if (!anchor) anchor = el.firstChild;
      this.mist = this._layer('fl-mist'); this.fire = this._layer('fl-fire', 'canvas'); this.canvas = this._layer('fl-canvas', 'canvas');
      [this.mist, this.fire, this.canvas].forEach(n => el.insertBefore(n, anchor));
      this.ring = this._layer('fl-ring'); el.appendChild(this.ring);
      this.ctx = this.canvas.getContext('2d');
      this._initGL(); this._resize();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._resize()); this.ro.observe(el); }
    }

    _initGL() {
      this.gl = null; if (!this.o.fire) return;
      const gl = this.fire.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return;
      const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = { R: gl.getUniformLocation(pr, 'R'), T: gl.getUniformLocation(pr, 'T'), I: gl.getUniformLocation(pr, 'I'), H: gl.getUniformLocation(pr, 'H') };
      this.gl = gl;
    }

    _resize() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540, d = Math.min(devicePixelRatio || 1, 2);
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8; this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d); this.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (this.gl) { const s = this.o.scale * Math.min(devicePixelRatio || 1, 1.5);
        this.fire.width = Math.max(2, Math.round(w * s)); this.fire.height = Math.max(2, Math.round(h * s)); this.gl.viewport(0, 0, this.fire.width, this.fire.height); }
      if (ch || !this.em.length) this.em = Array.from({ length: this.o.embers }, () => this._ember(true));
    }

    _ember(init) {
      return { x: Math.random() * this.w, y: init ? Math.random() * this.h : this.h + 6, r: Math.random() * 1.7 + .6, vy: Math.random() * 1 + .45,
        sw: Math.random() * 6.28, ss: Math.random() * .05 + .02, hot: Math.random() < .35, fl: Math.random() * 6.28 };
    }

    _tick(now) {
      if (!this.isOpen) return;
      const t = (now - this.t0) / 1000, gl = this.gl;
      if (gl) {
        const k = Math.min(1, t / 1.4), I = Math.max(.05, 1 - Math.pow(1 - k, 3));   // ignite over 1.4s
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.u.R, this.fire.width, this.fire.height); gl.uniform1f(this.u.T, t % 1000); gl.uniform1f(this.u.I, I); gl.uniform1f(this.u.H, this.o.fireHeight);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const c = this.ctx, w = this.w, h = this.h; c.clearRect(0, 0, w, h);
      for (const e of this.em) {
        e.sw += e.ss; e.fl += .18; e.y -= e.vy; e.x += Math.sin(e.sw) * .5;
        if (e.y < -6) Object.assign(e, this._ember(false));
        const a = (.25 + Math.max(0, e.y / h) * .75) * (.75 + .25 * Math.sin(e.fl));
        c.beginPath(); c.arc(e.x, e.y, e.r, 0, 6.2832);
        c.fillStyle = e.hot ? 'rgba(255,225,140,' + a + ')' : 'rgba(255,120,40,' + a + ')';
        c.shadowColor = 'rgba(255,110,20,.95)'; c.shadowBlur = e.hot ? 10 : 6; c.fill();
      }
      this.raf = requestAnimationFrame(n => this._tick(n));
    }

    open() {
      if (this.isOpen) return; this.isOpen = true; this.el.classList.add('fl-open');
      if (!this.rm) { this._resize(); this.t0 = performance.now(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(n => this._tick(n)); }
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false; this.el.classList.remove('fl-open');
      cancelAnimationFrame(this.raf); this.raf = null;
      setTimeout(() => { if (this.isOpen) return; this.ctx.clearRect(0, 0, this.w, this.h); if (this.gl) { this.gl.clearColor(0, 0, 0, 0); this.gl.clear(this.gl.COLOR_BUFFER_BIT); } }, 700);
    }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.mist, this.fire, this.canvas, this.ring].forEach(n => n.remove());
      this.el.classList.remove('flame-panel', 'fl-open'); inst.delete(this.el);
    }
  }
  g.FlamePanel = { attach(el, o) { return el ? (inst.get(el) || new FI(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
