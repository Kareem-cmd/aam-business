
/* core.js */
/* AAM landmark preview: shared toolkit (numbers, noise, canvas textures, geometry, materials). */
(function () {
  'use strict';
  var T = THREE;
  var AAM = window.AAM = { LM: [], byId: {} };
  AAM.reg = function (L) { AAM.LM.push(L); AAM.byId[L.id] = L; };

  // ---------- numbers ----------
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function sstep(a, b, x) { return smooth((x - a) / (b - a)); }
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------- value noise ----------
  var PERM = new Uint8Array(512);
  (function () {
    var r = rng(1337), p = [], i, j, t;
    for (i = 0; i < 256; i++) p[i] = i;
    for (i = 255; i > 0; i--) { j = Math.floor(r() * (i + 1)); t = p[i]; p[i] = p[j]; p[j] = t; }
    for (i = 0; i < 512; i++) PERM[i] = p[i & 255];
  })();
  function h3(ix, iy, iz) { return PERM[(PERM[(PERM[ix & 255] + iy) & 255] + iz) & 255] / 255; }
  // 3D value noise in [-1, 1]
  function noise3(x, y, z) {
    var ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
    var fx = x - ix, fy = y - iy, fz = z - iz;
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
    var a = h3(ix, iy, iz), b = h3(ix + 1, iy, iz), c = h3(ix, iy + 1, iz), d = h3(ix + 1, iy + 1, iz);
    var e = h3(ix, iy, iz + 1), f = h3(ix + 1, iy, iz + 1), g = h3(ix, iy + 1, iz + 1), h = h3(ix + 1, iy + 1, iz + 1);
    return lerp(lerp(lerp(a, b, u), lerp(c, d, u), v), lerp(lerp(e, f, u), lerp(g, h, u), v), w) * 2 - 1;
  }
  function fbm(x, y, z, oct) {
    var s = 0, a = 0.5, f = 1, i;
    for (i = 0; i < oct; i++) { s += a * noise3(x * f, y * f, z * f); f *= 2.03; a *= 0.5; }
    return s;
  }
  // periodic 2D noise in [0, 1], for tileable textures
  function pn2(x, y, px, py) {
    var ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    var u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    function hh(i, j) { i = ((i % px) + px) % px; j = ((j % py) + py) % py; return PERM[(PERM[i & 255] + j) & 255] / 255; }
    return lerp(lerp(hh(ix, iy), hh(ix + 1, iy), u), lerp(hh(ix, iy + 1), hh(ix + 1, iy + 1), u), v);
  }
  function pfbm2(x, y, px, py, oct) {
    var s = 0, a = 0.5, f = 1, n = 0, i;
    for (i = 0; i < oct; i++) { s += a * pn2(x * f, y * f, px * f, py * f); n += a; f *= 2; a *= 0.5; }
    return s / n;
  }

  // ---------- colour ----------
  function lin(hex) { return new T.Color(hex).convertSRGBToLinear(); }
  function rgb(hex) { var c = new T.Color(hex); return [c.r * 255, c.g * 255, c.b * 255]; }
  function mixRGB(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function css(c, a) { return 'rgba(' + Math.round(clamp(c[0], 0, 255)) + ',' + Math.round(clamp(c[1], 0, 255)) + ',' + Math.round(clamp(c[2], 0, 255)) + ',' + (a === undefined ? 1 : a) + ')'; }

  // ---------- canvas textures ----------
  var TEX = {}, GEN = {};
  // size is a number or [w, h]; opts.data = true keeps the texture linear (bump, roughness)
  function defTex(name, size, draw, opts) {
    GEN[name] = { w: size.length ? size[0] : size, h: size.length ? size[1] : size, draw: draw, opts: opts || {} };
  }
  function tex(name) {
    if (!name) return null;
    if (TEX[name]) return TEX[name];
    var g = GEN[name];
    if (!g) { console.warn('AAM: texture not defined:', name); return null; }
    var c = document.createElement('canvas');
    c.width = g.w; c.height = g.h;
    g.draw(c.getContext('2d'), g.w, g.h);
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.anisotropy = AAM.maxAniso || 4;
    if (!g.opts.data) t.encoding = T.sRGBEncoding;
    TEX[name] = t;
    return t;
  }
  // fn(u, v) returns [r, g, b] or [r, g, b, a] in 0..255; v = 0 is the top row of the canvas
  function noiseFill(x, w, h, fn) {
    var id = x.createImageData(w, h), d = id.data, i = 0, px, py, c;
    for (py = 0; py < h; py++) for (px = 0; px < w; px++) {
      c = fn(px / w, py / h);
      d[i++] = c[0]; d[i++] = c[1]; d[i++] = c[2]; d[i++] = c.length > 3 ? c[3] : 255;
    }
    x.putImageData(id, 0, 0);
  }

  // neutral detail maps: the material colour supplies the hue
  defTex('plaster', 512, function (x, w, h) {
    noiseFill(x, w, h, function (u, v) {
      var n = pfbm2(u * 5, v * 5, 5, 5, 5), m = pfbm2(u * 48, v * 48, 48, 48, 2), s = pfbm2(u * 3, v * 60, 3, 60, 2);
      var k = 255 * clamp(0.82 + 0.26 * (n - 0.5) + 0.1 * (m - 0.5) + 0.06 * (s - 0.5), 0, 1);
      return [k, k, k];
    });
  });
  defTex('grain', 512, function (x, w, h) {
    noiseFill(x, w, h, function (u, v) {
      var warp = pfbm2(u * 4, v * 4, 4, 4, 3) * 0.05;
      var l = pfbm2(u * 2, (v + warp) * 64, 2, 64, 3), n = pfbm2(u * 24, v * 24, 24, 24, 3);
      var k = 255 * clamp(0.66 + 0.4 * l + 0.14 * (n - 0.5), 0, 1);
      return [k, k, k];
    });
  });
  defTex('sand', 512, function (x, w, h) {
    noiseFill(x, w, h, function (u, v) {
      var n = pfbm2(u * 6, v * 6, 6, 6, 4), m = pfbm2(u * 64, v * 64, 64, 64, 2);
      var rip = Math.sin((v * 40 + pfbm2(u * 4, v * 4, 4, 4, 3) * 5) * Math.PI * 2);
      var k = 255 * clamp(0.86 + 0.14 * (n - 0.5) + 0.08 * (m - 0.5) + 0.02 * rip, 0, 1);
      return [k, k, k];
    });
  });
  defTex('paving', 512, function (x, w, h) {
    var r = rng(77), n = 8, s = w / n, i, j, k;
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) {
      k = 226 + r() * 14;
      x.fillStyle = css([k, k, k]);
      x.fillRect(i * s, j * s, s, s);
    }
    x.strokeStyle = 'rgba(70,66,60,0.3)';
    x.lineWidth = 1.5;
    for (i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, h); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); }
  });
  // generic curtain wall: cols x rows glass panels per tile, neutral so glass colour comes from the material
  // o: { lo, range } panel brightness, { hLine, vLine } joint opacity, { spandrel } share of each row
  function drawGlass(x, w, h, cols, rows, seed, o) {
    o = o || {};
    var r = rng(seed), cw = w / cols, rh = h / rows, i, j, k;
    var lo = o.lo === undefined ? 226 : o.lo, range = o.range === undefined ? 26 : o.range;
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      k = lo + r() * range;
      x.fillStyle = css([k, k, k]);
      x.fillRect(i * cw, j * rh, cw + 1, rh + 1);
      if (o.spandrel) { x.fillStyle = 'rgba(40,50,64,0.22)'; x.fillRect(i * cw, j * rh, cw + 1, rh * o.spandrel); }
    }
    x.fillStyle = 'rgba(30,38,50,' + (o.hLine === undefined ? 0.5 : o.hLine) + ')';
    for (j = 0; j <= rows; j++) x.fillRect(0, j * rh - 1, w, 2);
    x.fillStyle = 'rgba(30,38,50,' + (o.vLine === undefined ? 0.28 : o.vLine) + ')';
    for (i = 0; i <= cols; i++) x.fillRect(i * cw - 0.75, 0, 1.5, h);
  }
  // lit windows for night mode: black with a share of warm panels
  function drawLit(x, w, h, cols, rows, seed, share) {
    var r = rng(seed), cw = w / cols, rh = h / rows, i, j, t;
    x.fillStyle = '#000';
    x.fillRect(0, 0, w, h);
    for (j = 0; j < rows; j++) for (i = 0; i < cols; i++) {
      if (r() > share) continue;
      t = r();
      x.fillStyle = t < 0.6 ? 'rgba(255,214,150,' + (0.5 + r() * 0.5) + ')' : (t < 0.85 ? 'rgba(255,240,214,' + (0.5 + r() * 0.5) + ')' : 'rgba(190,225,255,' + (0.4 + r() * 0.4) + ')');
      x.fillRect(i * cw + cw * 0.12, j * rh + rh * 0.22, cw * 0.76, rh * 0.6);
    }
  }
  defTex('glass', 512, function (x, w, h) { drawGlass(x, w, h, 4, 8, 11, { spandrel: 0.22 }); });
  defTex('glassLit', [512, 1024], function (x, w, h) { drawLit(x, w, h, 8, 32, 12, 0.34); });

  // ---------- geometry ----------
  var G = {};
  var _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _p = new T.Vector3(), _s = new T.Vector3();
  // move, rotate, scale in place
  G.xf = function (geo, x, y, z, rx, ry, rz, sx, sy, sz) {
    _e.set(rx || 0, ry || 0, rz || 0);
    _q.setFromEuler(_e);
    _p.set(x || 0, y || 0, z || 0);
    _s.set(sx === undefined ? 1 : sx, sy === undefined ? 1 : sy, sz === undefined ? 1 : sz);
    geo.applyMatrix4(_m.compose(_p, _q, _s));
    return geo;
  };
  // boxes and cylinders sit on y0 (their base), which is how buildings are measured
  G.box = function (w, h, d, x, y0, z, ry) { return G.xf(new T.BoxGeometry(w, h, d), x || 0, (y0 || 0) + h / 2, z || 0, 0, ry || 0, 0); };
  G.cyl = function (rt, rb, h, seg, x, y0, z, open) { return G.xf(new T.CylinderGeometry(rt, rb, h, seg, 1, !!open), x || 0, (y0 || 0) + h / 2, z || 0); };
  G.sphere = function (r, ws, hs, x, y, z) { return G.xf(new T.SphereGeometry(r, ws, hs), x || 0, y || 0, z || 0); };
  // profile is [[radius, height], ...] from bottom to top
  G.lathe = function (profile, seg, x, y, z) {
    var pts = profile.map(function (p) { return new T.Vector2(p[0], p[1]); });
    return G.xf(new T.LatheGeometry(pts, seg), x || 0, y || 0, z || 0);
  };
  function shapeOf(pts, holes) {
    var s = new T.Shape(), i;
    s.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    (holes || []).forEach(function (hp) {
      var p = new T.Path();
      p.moveTo(hp[0][0], hp[0][1]);
      for (i = 1; i < hp.length; i++) p.lineTo(hp[i][0], hp[i][1]);
      p.closePath();
      s.holes.push(p);
    });
    return s;
  }
  // outline in the XY plane, extruded along Z and centred on z = 0
  G.extrude = function (pts, depth, holes, bevel) {
    var o = { depth: depth, bevelEnabled: !!bevel, curveSegments: 8 };
    if (bevel) { o.bevelThickness = bevel.t; o.bevelSize = bevel.s; o.bevelSegments = bevel.n || 2; }
    var g = new T.ExtrudeGeometry(shapeOf(pts, holes), o);
    g.translate(0, 0, -depth / 2);
    return g;
  };
  // plan is [[x, z], ...]; the prism rises from y = 0 to h
  G.prism = function (plan, h, holes) {
    var flip = function (p) { return [p[0], -p[1]]; };
    var g = new T.ExtrudeGeometry(shapeOf(plan.map(flip), (holes || []).map(function (hp) { return hp.map(flip); })), { depth: h, bevelEnabled: false });
    g.rotateX(-Math.PI / 2);
    return g;
  };
  // parametric surface: fn(u, v, out) fills out[0..2]; faces +Z when u runs along +X and v along +Y
  G.grid = function (nu, nv, fn, opt) {
    opt = opt || {};
    var n = (nu + 1) * (nv + 1), pos = new Float32Array(n * 3), uv = new Float32Array(n * 2), idx = [], o = [0, 0, 0], i, j, k = 0;
    var us = opt.us || 1, vs = opt.vs || 1;
    for (j = 0; j <= nv; j++) for (i = 0; i <= nu; i++) {
      fn(i / nu, j / nv, o);
      pos[k * 3] = o[0]; pos[k * 3 + 1] = o[1]; pos[k * 3 + 2] = o[2];
      uv[k * 2] = opt.uvFn ? opt.uvFn(i / nu, j / nv, o, 0) : i / nu * us;
      uv[k * 2 + 1] = opt.uvFn ? opt.uvFn(i / nu, j / nv, o, 1) : j / nv * vs;
      k++;
    }
    for (j = 0; j < nv; j++) for (i = 0; i < nu; i++) {
      var a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
      if (opt.flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  // square bar between two points
  G.bar = function (a, b, w, d) {
    var dir = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), len = dir.length();
    var g = new T.BoxGeometry(w, len, d === undefined ? w : d);
    var q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
    g.applyMatrix4(new T.Matrix4().compose(new T.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new T.Vector3(1, 1, 1)));
    return g;
  };
  // tube along a polyline; rad is a number or fn(t) for a taper
  G.sweep = function (pts, rad, sides, opt) {
    opt = opt || {};
    var n = pts.length, pos = [], uv = [], idx = [], i, j;
    var tan = new T.Vector3(), nrm = new T.Vector3(), bin = new T.Vector3(), prev = null;
    for (i = 0; i < n; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      tan.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      if (!prev) {
        nrm.set(Math.abs(tan.y) > 0.9 ? 1 : 0, Math.abs(tan.y) > 0.9 ? 0 : 1, 0).cross(tan).normalize();
      } else {
        nrm.copy(prev).addScaledVector(tan, -prev.dot(tan)).normalize();
      }
      bin.crossVectors(tan, nrm).normalize();
      prev = nrm.clone();
      var r = typeof rad === 'function' ? rad(i / (n - 1)) : rad;
      for (j = 0; j <= sides; j++) {
        var ang = j / sides * Math.PI * 2 + (opt.phase || 0), c = Math.cos(ang) * r, s = Math.sin(ang) * r;
        pos.push(pts[i][0] + nrm.x * c + bin.x * s, pts[i][1] + nrm.y * c + bin.y * s, pts[i][2] + nrm.z * c + bin.z * s);
        uv.push(j / sides * (opt.us || 1), i / (n - 1) * (opt.vs || 1));
      }
    }
    for (i = 0; i < n - 1; i++) for (j = 0; j < sides; j++) {
      var A = i * (sides + 1) + j, B = A + 1, C = A + sides + 1, D = C + 1;
      idx.push(A, B, C, B, D, C);
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  // one geometry from many (position, normal, uv, optional colour)
  G.merge = function (list) {
    var vc = 0, ic = 0, i, g, k, hasCol = false;
    for (i = 0; i < list.length; i++) {
      g = list[i];
      if (!g.attributes.normal) g.computeVertexNormals();
      vc += g.attributes.position.count;
      ic += g.index ? g.index.count : g.attributes.position.count;
      if (g.attributes.color) hasCol = true;
    }
    var pos = new Float32Array(vc * 3), nor = new Float32Array(vc * 3), uv = new Float32Array(vc * 2);
    var col = hasCol ? new Float32Array(vc * 3) : null;
    var idx = vc > 65535 ? new Uint32Array(ic) : new Uint16Array(ic), vo = 0, io = 0;
    for (i = 0; i < list.length; i++) {
      g = list[i];
      var n = g.attributes.position.count;
      pos.set(g.attributes.position.array, vo * 3);
      nor.set(g.attributes.normal.array, vo * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
      if (col) { if (g.attributes.color) col.set(g.attributes.color.array, vo * 3); else col.fill(1, vo * 3, (vo + n) * 3); }
      if (g.index) { var ia = g.index.array; for (k = 0; k < ia.length; k++) idx[io++] = ia[k] + vo; }
      else for (k = 0; k < n; k++) idx[io++] = vo + k;
      vo += n;
      g.dispose();
    }
    var out = new T.BufferGeometry();
    out.setAttribute('position', new T.BufferAttribute(pos, 3));
    out.setAttribute('normal', new T.BufferAttribute(nor, 3));
    out.setAttribute('uv', new T.BufferAttribute(uv, 2));
    if (col) out.setAttribute('color', new T.BufferAttribute(col, 3));
    out.setIndex(new T.BufferAttribute(idx, 1));
    return out;
  };
  // texture coordinates in metres, projected along each face's dominant axis
  G.uvWorld = function (geo, s) {
    var g = geo.index ? geo.toNonIndexed() : geo, a = g.attributes.position.array, n = g.attributes.position.count;
    var uv = new Float32Array(n * 2), i, k;
    for (i = 0; i < n; i += 3) {
      var o = i * 3;
      var ux = a[o + 3] - a[o], uy = a[o + 4] - a[o + 1], uz = a[o + 5] - a[o + 2];
      var vx = a[o + 6] - a[o], vy = a[o + 7] - a[o + 1], vz = a[o + 8] - a[o + 2];
      var nx = Math.abs(uy * vz - uz * vy), ny = Math.abs(uz * vx - ux * vz), nz = Math.abs(ux * vy - uy * vx);
      for (k = 0; k < 3; k++) {
        var j = i + k, X = a[j * 3], Y = a[j * 3 + 1], Z = a[j * 3 + 2];
        if (ny >= nx && ny >= nz) { uv[j * 2] = X / s; uv[j * 2 + 1] = Z / s; }
        else if (nx >= nz) { uv[j * 2] = Z / s; uv[j * 2 + 1] = Y / s; }
        else { uv[j * 2] = X / s; uv[j * 2 + 1] = Y / s; }
      }
    }
    g.setAttribute('uv', new T.BufferAttribute(uv, 2));
    if (g !== geo) geo.dispose();
    return g;
  };
  G.uvScale = function (geo, su, sv, ou, ov) {
    var a = geo.attributes.uv.array, i;
    for (i = 0; i < a.length; i += 2) { a[i] = a[i] * su + (ou || 0); a[i + 1] = a[i + 1] * sv + (ov || 0); }
    return geo;
  };
  // keep the geometry's own texture coordinates when its material maps in metres
  G.keep = function (geo) { geo.userData.keepUV = true; return geo; };
  // scale X and Z by fn(y): tapers, batters and flares
  G.taper = function (geo, fn) {
    var a = geo.attributes.position.array, i, s;
    for (i = 0; i < a.length; i += 3) { s = fn(a[i + 1]); a[i] *= s; a[i + 2] *= s; }
    geo.attributes.position.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
  };
  // per-vertex colour from fn(x, y, z, nx, ny, nz) returning sRGB 0..1
  G.colorize = function (geo, fn) {
    var p = geo.attributes.position.array, nn = geo.attributes.normal.array, n = geo.attributes.position.count;
    var c = new Float32Array(n * 3), i, o, v;
    for (i = 0; i < n; i++) {
      o = i * 3;
      v = fn(p[o], p[o + 1], p[o + 2], nn[o], nn[o + 1], nn[o + 2]);
      c[o] = Math.pow(clamp(v[0], 0, 1), 2.2); c[o + 1] = Math.pow(clamp(v[1], 0, 1), 2.2); c[o + 2] = Math.pow(clamp(v[2], 0, 1), 2.2);
    }
    geo.setAttribute('color', new T.BufferAttribute(c, 3));
    return geo;
  };
  // smooth organic surface from a signed distance field (naive surface nets, no lookup tables)
  G.surfaceNets = function (sdf, mn, mx, res) {
    var nx = res[0], ny = res[1], nz = res[2], sx = nx + 1, sy = ny + 1, sz = nz + 1;
    var dx = (mx[0] - mn[0]) / nx, dy = (mx[1] - mn[1]) / ny, dz = (mx[2] - mn[2]) / nz;
    var val = new Float32Array(sx * sy * sz), i, j, k, n = 0, c, e;
    for (k = 0; k < sz; k++) for (j = 0; j < sy; j++) for (i = 0; i < sx; i++) val[n++] = sdf(mn[0] + i * dx, mn[1] + j * dy, mn[2] + k * dz);
    var cell = new Int32Array(nx * ny * nz), pos = [], idx = [];
    var CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    var ED = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    var v = new Float32Array(8);
    for (k = 0; k < nz; k++) for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var mask = 0;
      for (c = 0; c < 8; c++) {
        v[c] = val[(i + CO[c][0]) + sx * ((j + CO[c][1]) + sy * (k + CO[c][2]))];
        if (v[c] < 0) mask |= 1 << c;
      }
      var ci = i + nx * (j + ny * k);
      if (mask === 0 || mask === 255) { cell[ci] = -1; continue; }
      var px = 0, py = 0, pz = 0, cnt = 0;
      for (e = 0; e < 12; e++) {
        var a = ED[e][0], b = ED[e][1];
        if ((v[a] < 0) !== (v[b] < 0)) {
          var t = v[a] / (v[a] - v[b]);
          px += CO[a][0] + (CO[b][0] - CO[a][0]) * t;
          py += CO[a][1] + (CO[b][1] - CO[a][1]) * t;
          pz += CO[a][2] + (CO[b][2] - CO[a][2]) * t;
          cnt++;
        }
      }
      cell[ci] = pos.length / 3;
      pos.push(mn[0] + (i + px / cnt) * dx, mn[1] + (j + py / cnt) * dy, mn[2] + (k + pz / cnt) * dz);
    }
    function cid(a, b, c2) { return cell[a + nx * (b + ny * c2)]; }
    function quad(a, b, c2, d, flip) {
      if (a < 0 || b < 0 || c2 < 0 || d < 0) return;
      if (flip) idx.push(a, c2, b, a, d, c2); else idx.push(a, b, c2, a, c2, d);
    }
    for (k = 0; k < sz; k++) for (j = 0; j < sy; j++) for (i = 0; i < sx; i++) {
      var v0 = val[i + sx * (j + sy * k)], inside = v0 < 0;
      if (i < nx && j > 0 && j < ny && k > 0 && k < nz && inside !== (val[(i + 1) + sx * (j + sy * k)] < 0)) {
        quad(cid(i, j - 1, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i, j - 1, k), !inside);
      }
      if (j < ny && i > 0 && i < nx && k > 0 && k < nz && inside !== (val[i + sx * ((j + 1) + sy * k)] < 0)) {
        quad(cid(i - 1, j, k - 1), cid(i, j, k - 1), cid(i, j, k), cid(i - 1, j, k), inside);
      }
      if (k < nz && i > 0 && i < nx && j > 0 && j < ny && inside !== (val[i + sx * (j + sy * (k + 1))] < 0)) {
        quad(cid(i - 1, j - 1, k), cid(i, j - 1, k), cid(i, j, k), cid(i - 1, j, k), !inside);
      }
    }
    var g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  // signed distance to a polygon in 2D (negative inside)
  G.sdPoly = function (pts, x, y) {
    var d = 1e30, s = 1, i, j, n = pts.length;
    for (i = 0, j = n - 1; i < n; j = i, i++) {
      var ax = pts[j][0], ay = pts[j][1], bx = pts[i][0], by = pts[i][1];
      var ex = bx - ax, ey = by - ay, wx = x - ax, wy = y - ay;
      var t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey), 0, 1), qx = wx - ex * t, qy = wy - ey * t;
      d = Math.min(d, qx * qx + qy * qy);
      var c1 = y >= ay, c2 = y < by, c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  };

  // ---------- weathered layered rock ----------
  // Adds bedding ledges, roughness and vertical cracks to a base distance field, meshes it, and colours it in strata.
  // o: { seed, amp (metres of relief), bed (bed thickness), cell, pal [[r,g,b]...] 0..1, dark, dust, foot, uv }
  G.rock = function (base, mn, mx, o) {
    var sd = o.seed || 0, amp = o.amp === undefined ? 1 : o.amp, bed = o.bed || 3, cell = o.cell || 1;
    var lim = 5 * amp + 2 * cell;
    function warp(x, y, z) { return fbm(x * 0.05 + sd, y * 0.05, z * 0.05 + sd, 3); }
    function sdf(x, y, z) {
      var d = base(x, y, z);
      if (d > lim || d < -lim) return d;
      var w = warp(x, y, z);
      var led = Math.sin((y / bed + w * 1.6) * Math.PI * 2), fine = Math.sin((y / (bed * 0.27) + w * 3) * Math.PI * 2);
      var rough = fbm(x * 0.08 + sd, y * 0.08, z * 0.08, 4), big = fbm(x * 0.028 + sd, y * 0.028 + 9, z * 0.028, 2);
      var crack = Math.pow(1 - Math.abs(noise3(x * 0.15 + sd, y * 0.018, z * 0.15)), 6);
      return d + amp * (0.3 * led + 0.1 * fine + 2.1 * rough + 2.2 * crack + 2.6 * big);
    }
    var res = [Math.ceil((mx[0] - mn[0]) / cell), Math.ceil((mx[1] - mn[1]) / cell), Math.ceil((mx[2] - mn[2]) / cell)];
    var g = G.surfaceNets(sdf, mn, mx, res), pal = o.pal, dark = o.dark, dust = o.dust;
    function pick(s) {
      var f = clamp(s, 0, 0.9999) * (pal.length - 1), i = Math.floor(f);
      return mixRGB(pal[i], pal[i + 1], f - i);
    }
    G.colorize(g, function (x, y, z, nx, ny) {
      var t = y / bed + warp(x, y, z) * 1.6, ft = Math.floor(t);
      var a = noise3(ft * 7.31 + sd, 1.7, 3.1) * 0.5 + 0.5, b = noise3((ft + 1) * 7.31 + sd, 1.7, 3.1) * 0.5 + 0.5;
      var c = pick(lerp(a, b, smooth((t - ft - 0.35) / 0.3)));
      var streak = fbm(x * 0.4 + sd, y * 0.03, z * 0.4, 3) * 0.5 + 0.5;
      c = mixRGB(c, dark, 0.5 * sstep(0.42, 0.7, streak) * sstep(0.45, 0.9, 1 - Math.abs(ny)));
      var dusty = 0.4 * sstep(0.6, 0.97, ny) + (o.foot ? 0.45 * (1 - sstep(0, o.foot, y)) : 0);
      c = mixRGB(c, dust, clamp(dusty, 0, 0.8));
      var gn = 0.88 + 0.24 * (noise3(x * 1.3, y * 1.3, z * 1.3) * 0.5 + 0.5);
      return [c[0] * gn, c[1] * gn, c[2] * gn];
    });
    var p = g.attributes.position.array, uv = g.attributes.uv.array, i, s = o.uv || 9;
    for (i = 0; i < p.length / 3; i++) { uv[i * 2] = (p[i * 3] + p[i * 3 + 2] * 0.6) / s; uv[i * 2 + 1] = p[i * 3 + 1] / s; }
    return G.keep(g);
  };

  // ---------- date palm, shared by several scenes ----------
  defTex('frond', [256, 64], function (x, w, h) {
    var i, n = 46, t, len;
    x.clearRect(0, 0, w, h);
    x.strokeStyle = '#7f9650';
    x.lineWidth = 2.2;
    for (i = 0; i < n; i++) {
      t = (i + 0.5) / n;
      len = h * 0.48 * Math.sin(Math.PI * Math.min(1, t * 1.15)) + 3;
      x.beginPath(); x.moveTo(t * w, h / 2); x.lineTo(t * w + len * 0.75, h / 2 - len); x.stroke();
      x.beginPath(); x.moveTo(t * w, h / 2); x.lineTo(t * w + len * 0.75, h / 2 + len); x.stroke();
    }
    x.strokeStyle = '#a9b46a';
    x.lineWidth = 3;
    x.beginPath(); x.moveTo(0, h / 2); x.lineTo(w, h / 2); x.stroke();
  });
  defTex('bark', 128, function (x, w, h) {
    var i, j;
    x.fillStyle = '#b89a78';
    x.fillRect(0, 0, w, h);
    x.strokeStyle = 'rgba(60,40,22,0.7)';
    x.lineWidth = 3;
    for (j = 0; j < 8; j++) for (i = -1; i < 5; i++) {
      x.beginPath();
      x.moveTo(i * w / 4 + (j % 2) * w / 8, j * h / 8);
      x.lineTo(i * w / 4 + (j % 2) * w / 8 + w / 8, j * h / 8 + h / 8);
      x.lineTo(i * w / 4 + (j % 2) * w / 8 + w / 4, j * h / 8);
      x.stroke();
    }
  });
  G.palmMats = function (m) {
    m.mat('palmTrunk', { color: '#8a6a48', map: 'bark', rough: 0.95, clay: '#c9c5bd' });
    m.mat('palmLeaf', { color: '#ffffff', map: 'frond', alphaTest: 0.35, double: true, rough: 0.8, clay: '#cfcbc3' });
  };
  // h = trunk height in metres; lean bends the trunk a little
  G.palm = function (m, x, z, h, seed, q) {
    var r = rng(seed), pts = [], n = 6, i, lx = (r() - 0.5) * 1.6, lz = (r() - 0.5) * 1.6;
    for (i = 0; i <= n; i++) { var t = i / n; pts.push([x + lx * t * t, h * t, z + lz * t * t]); }
    m.add('palmTrunk', G.sweep(pts, function (t) { return 0.36 - 0.12 * t; }, q && q.lod === 2 ? 5 : 8, { us: 2, vs: h / 1.2 }));
    var cx = x + lx, cz = z + lz, count = q && q.lod === 2 ? 7 : (q && q.lod === 1 ? 11 : 17);
    for (i = 0; i < count; i++) {
      var az = i / count * Math.PI * 2 + r() * 0.5, tier = i % 3, el = [1.0, 0.45, -0.05][tier] + (r() - 0.5) * 0.2;
      var L = (3.4 + r() * 1.1) * (h / 9 * 0.35 + 0.65), droop = [0.9, 1.5, 2.1][tier], dx = Math.cos(az), dz = Math.sin(az);
      (function (az2, el2, L2, droop2, dx2, dz2) {
        m.add('palmLeaf', G.keep(G.grid(5, 1, function (u, v, o) {
          var along = Math.cos(el2) * L2 * u, up = Math.sin(el2) * L2 * u - droop2 * u * u, side = (v - 0.5) * 1.15;
          o[0] = cx + dx2 * along - dz2 * side;
          o[1] = h - 0.1 + up;
          o[2] = cz + dz2 * along + dx2 * side;
        })));
      })(az, el, L, droop, dx, dz);
    }
  };

  // ---------- model: geometry grouped by material, merged at the end ----------
  function Model(q) { this.q = q; this.geos = {}; this.mats = {}; this.extras = []; }
  Model.prototype.mat = function (key, desc) { this.mats[key] = desc; return this; };
  Model.prototype.add = function (key, geo) {
    if (geo) (this.geos[key] || (this.geos[key] = [])).push(geo);
    return this;
  };
  Model.prototype.finish = function () {
    var grp = new T.Group(), k, i;
    for (k in this.geos) {
      var d = this.mats[k];
      if (!d) { console.warn('AAM: material not defined:', k); d = this.mats[k] = { color: '#ff00ff' }; }
      var list = this.geos[k];
      if (d.world) for (i = 0; i < list.length; i++) if (!list[i].userData.keepUV) list[i] = G.uvWorld(list[i], d.world);
      var mg = G.merge(list);
      if (d.flat) { mg = mg.toNonIndexed(); mg.computeVertexNormals(); }
      var mesh = new T.Mesh(mg, null);
      mesh.userData.desc = d;
      mesh.userData.key = k;
      mesh.castShadow = d.shadow !== false;
      mesh.receiveShadow = d.receive !== false;
      grp.add(mesh);
    }
    for (i = 0; i < this.extras.length; i++) grp.add(this.extras[i]);
    grp.userData.mats = this.mats;
    return grp;
  };

  // material for one mesh in one display mode ('real', 'night', 'clay')
  function makeMat(d, mode, envScale) {
    var o = { roughness: d.rough === undefined ? 0.88 : d.rough, metalness: d.metal || 0, side: d.double ? T.DoubleSide : T.FrontSide };
    if (mode === 'clay') {
      o.color = lin(d.clay || '#d9d5cd');
      o.roughness = 0.92;
      o.metalness = 0;
      if (d.bump) { o.bumpMap = tex(d.bump); o.bumpScale = d.bumpScale || 0.03; }
      if (d.alphaTest) { o.map = tex(d.map); o.alphaTest = d.alphaTest; }
      var cm = new T.MeshStandardMaterial(o);
      cm.envMapIntensity = envScale;
      return cm;
    }
    o.color = lin(d.color || '#ffffff');
    if (d.map) o.map = tex(d.map);
    if (d.bump) { o.bumpMap = tex(d.bump); o.bumpScale = d.bumpScale || 0.03; }
    if (d.vc) o.vertexColors = true;
    if (d.alphaTest) o.alphaTest = d.alphaTest;
    if (d.opacity !== undefined) { o.transparent = true; o.opacity = d.opacity; }
    if (d.emissive) {
      o.emissive = lin(d.emissive);
      o.emissiveIntensity = d.emissiveI === undefined ? 1 : d.emissiveI;
      if (d.emissiveMap) o.emissiveMap = tex(d.emissiveMap);
    }
    if (mode === 'night' && d.night) {
      var n = d.night;
      if (n.color) o.color = lin(n.color);
      if (n.emissive) {
        o.emissive = lin(n.emissive);
        o.emissiveIntensity = n.i === undefined ? 1 : n.i;
        o.emissiveMap = n.map ? tex(n.map) : null;
      }
      if (n.rough !== undefined) o.roughness = n.rough;
    }
    var m = new T.MeshStandardMaterial(o);
    m.envMapIntensity = (d.env === undefined ? 1 : d.env) * envScale;
    return m;
  }

  AAM.G = G;
  AAM.Model = Model;
  AAM.makeMat = makeMat;
  AAM.tex = tex;
  AAM.defTex = defTex;
  AAM.draw = { noiseFill: noiseFill, glass: drawGlass, lit: drawLit, css: css, rgb: rgb, mix: mixRGB };
  AAM.M = { clamp: clamp, lerp: lerp, smooth: smooth, sstep: sstep, rng: rng, noise3: noise3, fbm: fbm, pn2: pn2, pfbm2: pfbm2, lin: lin };
})();

