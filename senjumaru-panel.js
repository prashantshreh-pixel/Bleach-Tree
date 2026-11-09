/**
 * senjumaru-panel.js - Senjumaru Shutara: the Workshop's weave (WebGL shader) + stitching needles
 *   const sj = SenjumaruPanel.attach(sidebar, { needles: 10, threads: 26 });
 *   sj.open();  sj.close();
 * Options: needles (10), threads (26), scale (0.7 = shader render resolution),
 *          weave (true), anchor ('#sidebar-content')
 * Falls back to haze + threads + needles if WebGL is unavailable.
 */
(function (g) {
  'use strict';
  const inst = new WeakMap();
  const VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const FS = `precision mediump float;
uniform vec2 R;uniform float T,I;
float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/R; float asp=R.x/R.y;
  vec2 st=vec2(uv.x*asp,uv.y)*13.0;
  // cloth backdrop: soft dark weave base
  vec2 gi=floor(st);
  float ck=mod(gi.x+gi.y,2.0);
  vec3 cloth=mix(vec3(.10,.05,.03),vec3(.13,.07,.04),ck);
  // warp/weft threads: two sets of parallel bands, each gently waved
  vec2 f=fract(st);
  float wobX=sin(st.y*1.3+T*.25)*.04;
  float wobY=sin(st.x*1.3-T*.22)*.04;
  float warp=smoothstep(.36,.5,abs(f.x-.5+wobX)*-1.0+.5);
  float weft=smoothstep(.36,.5,abs(f.y-.5+wobY)*-1.0+.5);
  // alternate which thread sits on top per cell, like a real weave
  float over=step(0.5,ck);
  float thread=max(warp*(1.0-over*0.55), weft*(1.0-(1.0-over)*0.55));
  vec3 gold=mix(vec3(.55,.36,.10),vec3(.95,.74,.32),thread);
  vec3 col=mix(cloth,gold,thread*0.9);
  // the shuttle: a bright diagonal band of light sweeping through as it's revealed
  float diag=(uv.x*asp+uv.y*1.0);
  float sweep=fract(diag*0.6 - T*0.35);
  float band=smoothstep(0.08,0.0,abs(sweep-0.5))*0.8;
  vec3 hi=vec3(1.0,.94,.75);
  col=mix(col,hi,band*thread*1.1);
  col+=hi*band*0.12;
  // reveal wipes in from the top on open, like fabric unrolling
  float reveal=smoothstep(0.0,0.12,I-(1.0-uv.y));
  float a=(0.20+thread*0.85)*I*reveal;
  gl_FragColor=vec4(col*a,a*0.92);
}`;

  class SJ {
    constructor(el, o = {}) {
      this.el = el;
      this.o = Object.assign({ needles: 10, threads: 26, scale: .7, weave: true, anchor: '#sidebar-content' }, o);
      this.isOpen = false; this.raf = null; this.t0 = 0; this.w = 0; this.h = 0; this.nd = []; this.th = [];
      this.rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      this._build(); inst.set(el, this);
    }
    _layer(c, tag) { const n = document.createElement(tag || 'div'); n.className = 'sj-layer ' + c; n.setAttribute('aria-hidden', 'true'); return n; }

    _build() {
      const el = this.el; el.classList.add('senjumaru-panel');
      let anchor = null; try { anchor = el.querySelector(':scope > ' + this.o.anchor); } catch (e) {}
      if (!anchor) anchor = el.firstChild;
      this.mist = this._layer('sj-mist'); this.weave = this._layer('sj-weave', 'canvas'); this.canvas = this._layer('sj-canvas', 'canvas');
      [this.mist, this.weave, this.canvas].forEach(n => el.insertBefore(n, anchor));
      this.ring = this._layer('sj-ring'); el.appendChild(this.ring);
      this.ctx = this.canvas.getContext('2d');
      this._initGL(); this._resize();
      if (window.ResizeObserver) { this.ro = new ResizeObserver(() => this._resize()); this.ro.observe(el); }
    }

    _initGL() {
      this.gl = null; if (!this.o.weave) return;
      const gl = this.weave.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false });
      if (!gl) return;
      const sh = (t, s) => { const x = gl.createShader(t); gl.shaderSource(x, s); gl.compileShader(x); return gl.getShaderParameter(x, gl.COMPILE_STATUS) ? x : null; };
      const vs = sh(gl.VERTEX_SHADER, VS), fs = sh(gl.FRAGMENT_SHADER, FS); if (!vs || !fs) return;
      const pr = gl.createProgram(); gl.attachShader(pr, vs); gl.attachShader(pr, fs); gl.linkProgram(pr);
      if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) return;
      gl.useProgram(pr);
      const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      this.u = { R: gl.getUniformLocation(pr, 'R'), T: gl.getUniformLocation(pr, 'T'), I: gl.getUniformLocation(pr, 'I') };
      this.gl = gl;
    }

    _resize() {
      const w = this.el.clientWidth || 360, h = this.el.clientHeight || 540, d = Math.min(devicePixelRatio || 1, 2);
      const ch = Math.abs(w - this.w) > 8 || Math.abs(h - this.h) > 8; this.w = w; this.h = h;
      this.canvas.width = Math.round(w * d); this.canvas.height = Math.round(h * d); this.ctx.setTransform(d, 0, 0, d, 0, 0);
      if (this.gl) { const s = this.o.scale * Math.min(devicePixelRatio || 1, 1.5);
        this.weave.width = Math.max(2, Math.round(w * s)); this.weave.height = Math.max(2, Math.round(h * s)); this.gl.viewport(0, 0, this.weave.width, this.weave.height); }
      if (ch || !this.th.length) this.th = Array.from({ length: this.o.threads }, () => this._thread(true));
      if (ch || !this.nd.length) this.nd = Array.from({ length: this.o.needles }, () => this._needle(true));
    }

    // a loose gold thread, drifting and curling slowly like it's caught on the air
    _thread(init) {
      return { x: Math.random() * this.w, y: init ? Math.random() * this.h : this.h + 10, vy: Math.random() * .3 + .12,
        len: Math.random() * 10 + 6, ph: Math.random() * 6.28, sp: Math.random() * .02 + .01, amp: Math.random() * 6 + 3, op: Math.random() * .4 + .3 };
    }

    // a needle that appears, stitches (glints), and fades - never travels far
    _needle(init) {
      return { x: Math.random() * this.w, y: Math.random() * this.h, ang: Math.random() * 6.28, life: init ? Math.random() : 0,
        speed: Math.random() * .006 + .004, len: Math.random() * 7 + 6 };
    }

    _tick(now) {
      if (!this.isOpen) return;
      const t = (now - this.t0) / 1000, gl = this.gl;
      if (gl) {
        const k = Math.min(1, t / 1.2), I = Math.max(.05, 1 - Math.pow(1 - k, 3));   // the weave unrolls over 1.2s
        gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(this.u.R, this.weave.width, this.weave.height); gl.uniform1f(this.u.T, t % 600); gl.uniform1f(this.u.I, I);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      const c = this.ctx, w = this.w, h = this.h; c.clearRect(0, 0, w, h);

      // loose threads drifting upward with a gentle curl
      for (const e of this.th) {
        e.y -= e.vy; e.ph += e.sp; const cx = e.x + Math.sin(e.ph) * e.amp;
        const a = e.op * (.4 + Math.max(0, e.y / h) * .6);
        c.strokeStyle = 'rgba(240,198,116,' + a + ')'; c.lineWidth = 1;
        c.beginPath(); c.moveTo(cx, e.y); c.quadraticCurveTo(cx + e.amp * .6, e.y + e.len * .5, cx, e.y + e.len); c.stroke();
        if (e.y < -14) Object.assign(e, this._thread(false));
      }

      // needles: rise, glint at mid-life, sink back - like stitches being placed
      for (const n of this.nd) {
        n.life += n.speed; if (n.life > 1) Object.assign(n, this._needle(false));
        const s = Math.sin(n.life * Math.PI);            // 0 -> 1 -> 0 across its life
        const a = s * .85, hx = Math.cos(n.ang) * n.len * s, hy = Math.sin(n.ang) * n.len * s;
        c.strokeStyle = 'rgba(255,240,210,' + a + ')'; c.lineWidth = 1.1; c.lineCap = 'round';
        c.shadowColor = 'rgba(240,198,116,.9)'; c.shadowBlur = 5 * s;
        c.beginPath(); c.moveTo(n.x - hx, n.y - hy); c.lineTo(n.x + hx, n.y + hy); c.stroke();
        // eye-glint at the needle's midpoint
        c.shadowBlur = 8 * s; c.fillStyle = 'rgba(255,250,235,' + (a * .9) + ')';
        c.beginPath(); c.arc(n.x, n.y, .9 * s, 0, 6.2832); c.fill(); c.shadowBlur = 0;
      }

      this.raf = requestAnimationFrame(nn => this._tick(nn));
    }

    open() {
      if (this.isOpen) return; this.isOpen = true; this.el.classList.add('sj-open');
      if (!this.rm) { this._resize(); this.t0 = performance.now(); cancelAnimationFrame(this.raf); this.raf = requestAnimationFrame(n => this._tick(n)); }
    }
    close() {
      if (!this.isOpen) return; this.isOpen = false; this.el.classList.remove('sj-open');
      cancelAnimationFrame(this.raf); this.raf = null;
      setTimeout(() => { if (this.isOpen) return; this.ctx.clearRect(0, 0, this.w, this.h); if (this.gl) { this.gl.clearColor(0, 0, 0, 0); this.gl.clear(this.gl.COLOR_BUFFER_BIT); } }, 800);
    }
    destroy() {
      this.close(); if (this.ro) this.ro.disconnect();
      [this.mist, this.weave, this.canvas, this.ring].forEach(n => n.remove());
      this.el.classList.remove('senjumaru-panel', 'sj-open'); inst.delete(this.el);
    }
  }
  g.SenjumaruPanel = { attach(el, o) { return el ? (inst.get(el) || new SJ(el, o)) : null; }, get(el) { return inst.get(el) || null; } };
})(typeof window !== 'undefined' ? window : this);
