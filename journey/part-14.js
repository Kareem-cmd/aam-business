
/* city.js */
/* AAM journey: the ordinary city around the line. Riyadh's stone-coloured blocks with lit shopfronts, office towers
   further out, mosques, and the road under the viaduct with its lamps and traffic. */
(function () {
  'use strict';
  var T = THREE, AAM = window.AAM, G = AAM.G, M = AAM.M, D = AAM.draw, W = AAM.world, H = W.h;
  var lin = M.lin, sstep = M.sstep, clamp = M.clamp;
  var TILE = 27.2;   // metres covered by one facade tile: 16 window bays of 1.7 m, 8 floors of 3.4 m

  // ---------- textures ----------
  // three facade kinds on the same grid: 0 punched windows in stone, 1 ribbon windows, 2 glass curtain wall.
  // lit draws only the windows that are on, so it lines up with the wall it belongs to
  function facade(k, lit) {
    return function (x, w, h) {
      var r = M.rng(500 + k), cw = w / 16, fh = h / 8, i, j, run = 0, col = '';
      if (lit) { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); }
      else D.noiseFill(x, w, h, function (u, v) {
        var n = M.pfbm2(u * 12, v * 12, 12, 12, 3), m = M.pfbm2(u * 3, v * 40, 3, 40, 2), g = 255 * clamp(0.9 + 0.14 * (n - 0.5) + 0.07 * (m - 0.5), 0, 1);
        return [g, g, g];
      });
      for (j = 0; j < 8; j++) {
        if (!lit) { x.fillStyle = 'rgba(0,0,0,0.16)'; x.fillRect(0, j * fh, w, 2); }
        for (i = 0; i < 16; i++) {
          if (k === 0 && (i + j * 3) % 5 === 4) continue;
          var ww = k === 0 ? cw * 0.52 : (k === 1 ? cw + 1 : cw - 2), wh = fh * (k === 0 ? 0.46 : (k === 1 ? 0.5 : 0.74));
          var wx = k === 0 ? i * cw + (cw - ww) / 2 : (k === 1 ? i * cw : i * cw + 1), wy = j * fh + fh * (k === 0 ? 0.22 : (k === 1 ? 0.2 : 0.06));
          if (!lit) {
            x.fillStyle = k === 2 ? 'rgb(38,48,62)' : 'rgb(30,35,44)';
            x.fillRect(wx, wy, ww, wh);
            if (k === 0) { x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(wx - 1, wy + wh, ww + 2, 2); }
            continue;
          }
          if (run <= 0) {
            if (r() > [0.1, 0.08, 0.07][k]) continue;
            run = k === 0 ? 1 : 1 + Math.floor(r() * 5);
            var t = r(), a = 0.35 + r() * 0.55;
            col = t < 0.55 ? 'rgba(255,208,150,' + a + ')' : (t < 0.85 ? 'rgba(255,238,212,' + a + ')' : 'rgba(190,222,255,' + a + ')');
          }
          run--;
          x.fillStyle = col;
          x.fillRect(wx + 1, wy + 1, ww - 2, wh - 2);
          if (k === 0 && r() < 0.5) { x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(wx + 1, wy + 1, ww - 2, (wh - 2) * (0.3 + r() * 0.4)); }
        }
      }
    };
  }
  [0, 1, 2].forEach(function (k) {
    AAM.defTex('wall' + k, 512, facade(k, false));
    AAM.defTex('lit' + k, 512, facade(k, true));
  });
  // forty metres of shopfronts: lit glass below, a sign above each
  AAM.defTex('shops', [1024, 64], function (x, w, h) {
    var r = M.rng(640), at = 0, signs = ['255,255,255', '255,226,170', '255,70,60', '80,230,130', '90,170,255', '255,210,60'];
    x.fillStyle = '#05070a';
    x.fillRect(0, 0, w, h);
    while (at < w - 20) {
      var bw = 40 + r() * 70;
      if (r() < 0.8) {
        var g = x.createLinearGradient(0, h * 0.34, 0, h);
        g.addColorStop(0, 'rgba(255,240,214,0.95)'); g.addColorStop(1, 'rgba(255,214,160,0.6)');
        x.fillStyle = g;
        x.fillRect(at + 3, h * 0.36, bw - 6, h * 0.6);
        x.fillStyle = 'rgba(0,0,0,0.7)';
        for (var m = at + 3 + (bw - 6) / 3; m < at + bw - 6; m += (bw - 6) / 3) x.fillRect(m, h * 0.36, 2, h * 0.6);
        x.fillStyle = 'rgba(' + signs[Math.floor(r() * signs.length)] + ',' + (0.6 + r() * 0.4) + ')';
        x.fillRect(at + 5, h * 0.07, bw - 10, h * 0.22);
      }
      at += bw;
    }
  });
  // street light climbing a wall and dying out
  AAM.defTex('wash', [8, 64], function (x, w, h) {
    var g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,214,160,0)'); g.addColorStop(1, 'rgba(255,214,160,0.34)');
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  });
  // one carriageway, 18 m across and 24 m along: four lanes between edge lines
  AAM.defTex('road', [256, 512], function (x, w, h) {
    D.noiseFill(x, w, h, function (u, v) { var n = M.pfbm2(u * 40, v * 80, 40, 80, 2), k = 44 + 16 * (n - 0.5); return [k, k * 1.02, k * 1.06]; });
    function U(mm) { return mm / 18 * w; }
    x.fillStyle = 'rgb(196,170,70)';
    x.fillRect(U(1.2), 0, 2.5, h);
    x.fillStyle = 'rgb(196,196,190)';
    x.fillRect(U(16.8), 0, 2.5, h);
    [5.1, 9, 12.9].forEach(function (mm) { x.fillRect(U(mm), 0, 2, h * 0.25); x.fillRect(U(mm), h * 0.5, 2, h * 0.25); });
  });

  // ---------- geometry bins ----------
  function bin() { return { pos: [], uv: [], col: [], idx: [] }; }
  function quad(b, p, uv, c) {
    var base = b.pos.length / 3, i;
    for (i = 0; i < 4; i++) { b.pos.push(p[i][0], p[i][1], p[i][2]); b.uv.push(uv[i][0], uv[i][1]); if (c) b.col.push(c[0], c[1], c[2]); }
    b.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  function mesh(b, mat) {
    var g = H.geoFrom(b.pos, b.uv, b.idx);
    if (b.col.length) g.setAttribute('color', new T.Float32BufferAttribute(b.col, 3));
    return new T.Mesh(g, mat);
  }
  function tint(hex, k) { var c = lin(hex); return [c.r * (k || 1), c.g * (k || 1), c.b * (k || 1)]; }

  // avoid: [[x, z, radius]] kept clear; low: [[s, side, lat]] stretches where blocks stay low so a landmark reads
  W.city = function (q, avoid, low) {
    var r = M.rng(2031), grp = new T.Group(), v = new T.Vector3(), END = W.END + 900;
    var walls = [bin(), bin(), bin()], roofs = bin(), shops = bin(), wash = bin(), pools = bin(), road = bin();
    var plant = [], poles = [], stone = [], neon = [], beacons = [], lamps = [], cellX = 64, cellS = 72, far = q.lod ? 14 : 18, s, i, k;
    var TINTS = ['#b9a98c', '#c7bca3', '#a8977a', '#96928b', '#b4b6b8', '#ad9f88'], GLASS = tint('#6d7c8e'), ROOF = tint('#22262c');
    avoid = avoid.slice();

    function corners(cx, cz, w, d, a) {
      var ca = Math.cos(a), sa = Math.sin(a);
      return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(function (p) { return [cx + p[0] * ca + p[1] * sa, cz - p[0] * sa + p[1] * ca]; });
    }
    function wall(b, p0, p1, y0, y1, u0, v0, c) {
      var len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / TILE;
      quad(b, [[p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]]], [[u0, v0 + y0 / TILE], [u0 + len, v0 + y0 / TILE], [u0 + len, v0 + y1 / TILE], [u0, v0 + y1 / TILE]], c);
    }
    // a block with its walls carried past the roof as a parapet
    function block(cx, cz, w, d, y0, y1, a, kind, c, par) {
      var cs = corners(cx, cz, w, d, a), u0 = Math.floor(r() * 16) / 16, v0 = Math.floor(r() * 8) / 8, e;
      for (e = 0; e < 4; e++) wall(walls[kind], cs[(e + 3) % 4], cs[e], y0, y1 + par, u0 + e * 0.25, v0, c);
      quad(roofs, [[cs[0][0], y1, cs[0][1]], [cs[1][0], y1, cs[1][1]], [cs[2][0], y1, cs[2][1]], [cs[3][0], y1, cs[3][1]]], [[0, 0], [1, 0], [1, 1], [0, 1]], ROOF);
      return cs;
    }
    function decal(b, x, z, half, y) { quad(b, [[x - half, y, z - half], [x + half, y, z - half], [x + half, y, z + half], [x - half, y, z + half]], [[0, 0], [1, 0], [1, 1], [0, 1]]); }
    // shopfronts and the spill of street light on the two sides the camera sees
    function street(cx, cz, w, d, a, h, right) {
      var cs = corners(cx, cz, w + 0.3, d + 0.3, a), sides = [[cs[2], cs[3]], right ? [cs[3], cs[0]] : [cs[1], cs[2]]];
      sides.forEach(function (e) {
        var len = Math.hypot(e[1][0] - e[0][0], e[1][1] - e[0][1]), u0 = r(), top = Math.min(h, 13);
        if (r() < 0.75) quad(shops, [[e[0][0], 0, e[0][1]], [e[1][0], 0, e[1][1]], [e[1][0], 3.4, e[1][1]], [e[0][0], 3.4, e[0][1]]], [[u0, 0], [u0 + len / 40, 0], [u0 + len / 40, 1], [u0, 1]]);
        quad(wash, [[e[0][0], 0, e[0][1]], [e[1][0], 0, e[1][1]], [e[1][0], top, e[1][1]], [e[0][0], top, e[0][1]]], [[0, 0], [1, 0], [1, 1], [0, 1]]);
      });
    }

    // mosques first, so the blocks keep clear of them
    [[930, -170, 0.3], [1480, 185, -0.2], [2060, -210, 0.5], [2700, 180, 0.1]].forEach(function (mq) {
      W.pt(mq[0], mq[1], 0, v);
      var x = v.x, z = v.z, a = W.yaw(mq[0]) + mq[2], mx = x + Math.cos(a) * 15 + Math.sin(a) * 15, mz = z - Math.sin(a) * 15 + Math.cos(a) * 15, e;
      function add(list, g) { list.push(G.xf(g, x, 0, z, 0, a, 0)); }
      add(stone, G.box(26, 9.5, 26, 0, 0, 0));
      add(stone, G.box(27, 0.9, 27, 0, 9.5, 0));
      add(stone, G.cyl(6.4, 6.4, 2.2, 16, 0, 10.4, 0));
      add(stone, G.xf(new T.SphereGeometry(6.2, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0, 12.6, 0));
      add(neon, G.cyl(6.5, 6.5, 0.22, 16, 0, 12.5, 0, true));
      // the minaret stands at one corner
      [[G.box(3.4, 11, 3.4, 0, 0, 0)], [G.cyl(1.25, 1.5, 19, 8, 0, 11, 0)], [G.cyl(2.1, 1.5, 1, 8, 0, 30, 0)], [G.cyl(0.9, 1.0, 7, 8, 0, 31, 0)], [G.cyl(0.03, 1.1, 4.6, 8, 0, 38, 0)]].forEach(function (p) { stone.push(G.xf(p[0], mx, 0, mz, 0, a, 0)); });
      [[2.15, 31], [1.05, 37.9], [1.55, 11]].forEach(function (n) { neon.push(G.xf(G.cyl(n[0], n[0], 0.24, 8, 0, n[1], 0, true), mx, 0, mz, 0, a, 0)); });
      beacons.push(mx, 43.2, mz);
      avoid.push([x, z, 46]);
      lamps.push(x - 20, 8, z + 20, x + 20, 8, z - 20);
    });

    for (s = 650; s < 2650; s += cellS) for (i = -far; i <= far; i++) {
      if (i === 0) continue;
      // the first row stands back from the road; towers only further out, so the landmarks keep the skyline
      var lat = i * cellX + (i > 0 ? 34 : -34) + (r() - 0.5) * 14, al = Math.abs(lat), ss = s + (r() - 0.5) * 16;
      var prob = sstep(700, 1000, ss) * (1 - 0.5 * sstep(650, 1150, al));
      var w = 22 + r() * 24, d = 24 + r() * 30, h = 7 + Math.floor(r() * 5) * 3.4, tall = r(), keep = r(), kind = r(), tn = r();
      if (keep > prob * 0.92) continue;
      var core = sstep(820, 1100, ss) * (1 - sstep(2600, 3200, ss)) * sstep(170, 300, al) * (1 - sstep(420, 900, al));
      if (tall < 0.15 * core) h = 48 + r() * 66; else if (tall < 0.4 * core) h = 27 + r() * 20;
      for (k = 0; k < low.length; k++) if (Math.abs(ss - low[k][0]) < 520 && lat * low[k][1] > 0 && al < low[k][2] + 90) h = Math.min(h, 7 + Math.floor(r() * 3) * 3.4);
      W.pt(ss, lat, 0, v);
      var ok = true;
      for (k = 0; k < avoid.length; k++) if (Math.hypot(v.x - avoid[k][0], v.z - avoid[k][1]) < avoid[k][2]) ok = false;
      if (!ok) continue;
      var a = W.yaw(ss), cx = v.x, cz = v.z, c = tint(TINTS[Math.floor(tn * TINTS.length)], 0.8 + r() * 0.3);
      if (h > 40) {
        var ph = 7 + Math.floor(r() * 2) * 3.4, tk = kind < 0.6 ? 2 : 1;
        block(cx, cz, w, d, 0, ph, a, 1, c, 0.9);
        block(cx, cz, w * 0.66, d * 0.66, ph, h, a, tk, tk === 2 ? GLASS : c, 1.2);
        plant.push(G.xf(G.box(w * 0.3, 4.5, d * 0.3, 0, 0, 0), cx, h, cz, 0, a, 0), G.xf(G.box(0.25, 9, 0.25, 0, 0, 0), cx, h + 4.5, cz, 0, a, 0));
        if (h > 62) beacons.push(cx, h + 14, cz);
      } else {
        block(cx, cz, w, d, 0, h, a, kind < 0.62 ? 0 : 1, c, 0.9);
        // stair head and plant on the roof
        var ca = Math.cos(a), sa = Math.sin(a), n = 1 + Math.floor(r() * 3);
        for (k = 0; k < n; k++) {
          var ox = (r() - 0.5) * (w - 8), oz = (r() - 0.5) * (d - 8), big = k === 0;
          plant.push(G.xf(G.box(big ? 4.5 : 1.6 + r(), big ? 3.2 : 1.2 + r(), big ? 3.6 : 1.4 + r(), 0, 0, 0), cx + ox * ca + oz * sa, h, cz - ox * sa + oz * ca, 0, a, 0));
        }
      }
      if (al < 330) street(cx, cz, w, d, a, h, lat > 0);
      if (al < 420 && r() < 0.8) { W.pt(ss + cellS / 2, lat + cellX / 2, 0, v); lamps.push(v.x, 8, v.z); decal(pools, v.x, v.z, 13, 0.1); }
    }

    // the road under the viaduct: a carriageway each side of the piers, a lamp column every 36 m
    [-1, 1].forEach(function (sd) {
      var prev = null, a2, b2;
      for (s = 900; s <= END; s += 8) {
        W.pt(s, sd * 8.5, 0, v); a2 = [v.x, 0.08, v.z];
        W.pt(s, sd * 26.5, 0, v); b2 = [v.x, 0.08, v.z];
        if (prev) quad(road, sd > 0 ? [prev[0], prev[1], b2, a2] : [prev[1], prev[0], a2, b2], [[0, (s - 8) / 24], [1, (s - 8) / 24], [1, s / 24], [0, s / 24]]);
        prev = [a2, b2];
        if ((s - 900) % 40 === 0) {
          W.pt(s, sd * 27.6, 0, v);
          poles.push(G.xf(G.box(0.2, 10.6, 0.2, 0, 0, 0), v.x, 0, v.z), G.xf(G.box(2.6, 0.14, 0.2, -sd * 1.3, 10.6, 0), v.x, 0, v.z, 0, W.yaw(s), 0));
          W.pt(s, sd * 25.2, 0, v);
          lamps.push(v.x, 10.5, v.z);
          W.pt(s, sd * 18, 0, v);
          decal(pools, v.x, v.z, 17, 0.12);
        }
      }
    });

    [0, 1, 2].forEach(function (n) {
      var mat = H.std({ color: 0xffffff, vertexColors: true, map: AAM.tex('wall' + n), emissive: 0xffffff, emissiveMap: AAM.tex('lit' + n), emissiveIntensity: 0.9, roughness: n === 2 ? 0.3 : 0.8, metalness: n === 2 ? 0.5 : 0.06, side: T.DoubleSide });
      mat.envMapIntensity = n === 2 ? 1 : 0.4;
      grp.add(mesh(walls[n], mat));
    });
    grp.add(mesh(roofs, H.std({ color: 0xffffff, vertexColors: true, roughness: 0.95, side: T.DoubleSide })));
    grp.add(new T.Mesh(G.merge(plant), H.std({ color: lin('#5d6067'), roughness: 0.85 })));
    var st = H.std({ color: lin('#cfc3a6'), map: AAM.tex('plaster'), roughness: 0.9, emissive: lin('#ffd49a'), emissiveIntensity: 0.14 });
    grp.add(new T.Mesh(G.merge(stone), st));
    grp.add(new T.Mesh(G.merge(neon), H.flat('#3fe58a', { side: T.DoubleSide })));
    grp.add(mesh(shops, H.flat('#cfcfcf', { map: AAM.tex('shops'), side: T.DoubleSide })));
    grp.add(mesh(wash, H.flat('#ffffff', { map: AAM.tex('wash'), side: T.DoubleSide, transparent: true, depthWrite: false })));
    var rd = H.std({ color: 0xffffff, map: AAM.tex('road'), roughness: 0.82, side: T.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    grp.add(mesh(road, rd));
    grp.add(mesh(pools, H.flat('#ffc98a', { map: AAM.tex('dot'), side: T.DoubleSide, transparent: true, opacity: 0.4, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
    grp.add(new T.Mesh(G.merge(poles), H.std({ color: lin('#3a3f46'), roughness: 0.7, metalness: 0.5 })));
    var bc = H.dots(beacons, '#ff3a2a', 3);
    grp.add(bc);
    grp.add(H.dots(lamps, '#ffd9a8', 2.2, { opacity: 0.9 }));
    return { grp: grp, beacons: bc };
  };

  // traffic on the road under the viaduct, a pair of lamps per car: tail lights going our way on the right, headlights coming on the left
  W.traffic = function (count) {
    var r = M.rng(77), cars = [], v = new T.Vector3(), i;
    for (i = 0; i < count; i++) {
      var same = i % 2 === 0, lane = 10.6 + Math.floor(r() * 4) * 3.6;
      cars.push({ lat: same ? lane : -lane, v: (same ? 1 : -1) * (13 + r() * 9), s0: r() * 2700 });
    }
    function make(hex, size) {
      var p = H.dots(new Array(count * 3).fill(0), hex, size);
      p.geometry.attributes.position.setUsage(T.DynamicDrawUsage);
      return p;
    }
    var red = make('#ff3524', 0.75), white = make('#fff1d6', 0.95), grp = new T.Group();
    grp.add(red);
    grp.add(white);
    return {
      grp: grp,
      update: function (time) {
        var a = red.geometry.attributes.position, b = white.geometry.attributes.position, ia = 0, ib = 0;
        cars.forEach(function (c) {
          var s = 900 + ((c.s0 + c.v * time) % 2700 + 2700) % 2700, k;
          for (k = -1; k <= 1; k += 2) {
            W.pt(s, c.lat + k * 0.72, 0, v);
            if (c.v > 0) a.setXYZ(ia++, v.x, 0.85, v.z); else b.setXYZ(ib++, v.x, 0.75, v.z);
          }
        });
        a.needsUpdate = true;
        b.needsUpdate = true;
      }
    };
  };
})();

