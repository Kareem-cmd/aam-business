
/* train.js */
/* AAM journey: the Riyadh Metro train, modelled on the four-car Siemens Inspiro sets of Line 1 (Blue).
   White body, black window ribbon, line-colour band above the windows that arcs round the cab. */
(function () {
  'use strict';
  var T = THREE, AAM = window.AAM, G = AAM.G, M = AAM.M, W = AAM.world, H = W.h;
  var lin = M.lin;
  var CAR = { mid: 18.6, end: 19.4, nose: 2.4, gap: 0.5 };
  var LINE = '#1877c9';
  // heights above the rail that the livery follows
  var Y = { sill: 0.66, floor: 1.12, win0: 1.92, win1: 2.98, band: 3.45 };

  // half section of the car body, smoothed and resampled every 11 cm so colour breaks can follow exact heights
  var PROF = (function () {
    var p = H.chaikin([[0, 0.6], [1.2, 0.6], [1.33, 0.68], [1.355, 1.05], [1.355, 2.25], [1.325, 2.95], [1.19, 3.38], [0.84, 3.6], [0, 3.66]], 3), acc = [0], out = [], i, k = 0;
    for (i = 1; i < p.length; i++) acc[i] = acc[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    var total = acc[p.length - 1], n = Math.round(total / 0.11);
    for (i = 0; i <= n; i++) {
      var a = total * i / n;
      while (k < p.length - 2 && acc[k + 1] < a) k++;
      var t = (a - acc[k]) / (acc[k + 1] - acc[k] || 1);
      out.push([p[k][0] + (p[k + 1][0] - p[k][0]) * t, p[k][1] + (p[k + 1][1] - p[k][1]) * t, a / total]);
    }
    return out;
  })();
  // texture row for a height on the car side
  function vAt(y) {
    for (var i = 1; i < PROF.length; i++) if (PROF[i][1] >= y && PROF[i][0] > 1) return PROF[i][2];
    return 1;
  }

  // one side of a car, unrolled: along the car from the front, and from the floor edge up to the roof centre.
  // mode 0 is the paint, 1 the light from inside, 2 the surface finish (green roughness, blue metalness)
  function drawSide(kind, mode) {
    return function (x, w, h) {
      var L = kind === 'mid' ? CAR.mid : CAR.end, r = M.rng(kind === 'mid' ? 81 : (kind === 'lead' ? 82 : 83)), i;
      var b0 = kind === 'lead' ? CAR.nose : 0, b1 = kind === 'tail' ? L - CAR.nose : L;
      var C = [
        { paint: '#eef0f1', band: LINE, glass: '#07090c', roof: '#8b9299', skirt: '#2b3037', seal: '#454b53' },
        { paint: '#000', band: '#000', glass: '#000', roof: '#000', skirt: '#000', seal: '#000' },
        { paint: 'rgb(0,95,30)', band: 'rgb(0,90,40)', glass: 'rgb(0,14,235)', roof: 'rgb(0,175,60)', skirt: 'rgb(0,200,90)', seal: 'rgb(0,150,40)' }
      ][mode];
      function X(mm) { return mm / L * w; }
      function Yy(yy) { return (1 - vAt(yy)) * h; }
      function rect(m0, m1, y0, y1, fill) { x.fillStyle = fill; x.fillRect(X(m0), Yy(y1), X(m1) - X(m0), Yy(y0) - Yy(y1)); }
      // what shows through a pane: ceiling lights, lit walls, seat backs, now and then a passenger
      function inside(m0, m1, y0, y1, stand) {
        var g = x.createLinearGradient(0, Yy(y1), 0, Yy(y0));
        g.addColorStop(0, 'rgb(255,246,228)'); g.addColorStop(0.13, 'rgb(250,236,210)'); g.addColorStop(0.2, 'rgb(150,140,124)');
        g.addColorStop(stand ? 0.99 : 0.6, 'rgb(112,104,92)'); if (!stand) { g.addColorStop(0.61, 'rgb(46,42,38)'); g.addColorStop(1, 'rgb(28,26,24)'); }
        x.fillStyle = g;
        x.fillRect(X(m0), Yy(y1), X(m1) - X(m0), Yy(y0) - Yy(y1));
        x.fillStyle = 'rgba(214,208,196,0.8)';
        x.fillRect(X(m0 + (m1 - m0) * (0.3 + r() * 0.4)), Yy(y1), 1.5, Yy(y0) - Yy(y1));
        var n = r() < 0.55 ? (r() < 0.4 ? 2 : 1) : 0, k;
        for (k = 0; k < n; k++) {
          var cx = m0 + 0.2 + r() * Math.max(0.05, m1 - m0 - 0.4), top = stand ? 2.78 - r() * 0.12 : 2.5 - r() * 0.08;
          x.fillStyle = 'rgb(20,18,17)';
          x.beginPath(); x.ellipse(X(cx), Yy(top - 0.12), X(0.1), Yy(top - 0.12) - Yy(top), 0, 0, Math.PI * 2); x.fill();
          x.fillRect(X(cx - 0.21), Yy(top - 0.2), X(0.42), Yy(y0) - Yy(top - 0.2));
        }
      }
      x.fillStyle = C.paint;
      x.fillRect(0, 0, w, h);
      x.fillStyle = C.roof;
      x.fillRect(0, 0, w, Yy(Y.band));
      rect(0, L, Y.win1, Y.band, C.band);
      rect(0, L, Y.win0, Y.win1, C.glass);
      x.fillStyle = C.skirt;
      x.fillRect(0, Yy(Y.sill), w, h - Yy(Y.sill));
      var doors = [0.17, 0.5, 0.83].map(function (f) { return b0 + (b1 - b0) * f; }), edges = [b0 + 0.25];
      doors.forEach(function (dm) { edges.push(dm - 0.86, dm + 0.86); });
      edges.push(b1 - 0.25);
      if (mode === 0) {
        x.fillStyle = 'rgba(40,46,54,0.55)';
        for (i = 1.5; i < L; i += 1.5) x.fillRect(X(i), 0, 1.5, Yy(Y.band));
        x.fillStyle = 'rgba(60,66,74,0.5)';
        x.fillRect(0, 0, w, h * 0.012);
      }
      if (mode === 1) {
        // long panes between the doors, with a pillar every 1.7 m or so
        for (i = 0; i < edges.length; i += 2) {
          var a = edges[i], b = edges[i + 1], n = Math.max(1, Math.round((b - a) / 1.75)), k;
          for (k = 0; k < n; k++) inside(a + (b - a) * k / n + 0.07, a + (b - a) * (k + 1) / n - 0.07, Y.win0 + 0.05, Y.win1 - 0.05, false);
        }
      }
      doors.forEach(function (dm) {
        rect(dm - 0.72, dm + 0.72, Y.floor, 3.05, C.paint);
        [[dm - 0.62, dm - 0.07], [dm + 0.07, dm + 0.62]].forEach(function (p) {
          if (mode === 1) inside(p[0], p[1], 1.78, 2.95, true); else rect(p[0], p[1], 1.78, 2.95, C.glass);
        });
        x.fillStyle = C.seal;
        x.fillRect(X(dm) - 1.5, Yy(3.05), 3, Yy(Y.floor) - Yy(3.05));
        x.fillRect(X(dm - 0.72) - 1, Yy(3.05), 2.5, Yy(Y.floor) - Yy(3.05));
        x.fillRect(X(dm + 0.72) - 1, Yy(3.05), 2.5, Yy(Y.floor) - Yy(3.05));
        x.fillRect(X(dm - 0.72), Yy(3.05) - 1, X(1.44), 2.5);
      });
      // destination display beside the first door
      var dz = doors[0] + 1.25;
      rect(dz, dz + 0.9, 2.66, 2.9, mode === 1 ? 'rgb(255,150,30)' : (mode === 2 ? C.glass : '#120d06'));
      if (mode === 1) { x.fillStyle = '#000'; for (i = 0; i < 9; i++) x.fillRect(X(dz + 0.05 + i * 0.1), Yy(2.9), X(0.03), Yy(2.66) - Yy(2.9)); }
    };
  }
  ['lead', 'mid', 'tail'].forEach(function (k) {
    AAM.defTex('side-' + k, [1024, 512], drawSide(k, 0));
    AAM.defTex('side-' + k + '-in', [1024, 512], drawSide(k, 1));
    AAM.defTex('side-' + k + '-fin', [1024, 512], drawSide(k, 2), { data: true });
  });

  // shadow under and beside a car: darkest under the body on the left, thinning out to the right, soft at both ends
  AAM.defTex('blob', [128, 64], function (x, w, h) {
    var id = x.createImageData(w, h), i = 0, px, py;
    for (py = 0; py < h; py++) for (px = 0; px < w; px++) {
      var u = px / w, v = py / h, across = M.sstep(0, 0.12, u) * (1 - M.sstep(0.3, 1, u)), along = M.sstep(0, 0.12, v) * M.sstep(0, 0.12, 1 - v);
      id.data[i++] = 0; id.data[i++] = 0; id.data[i++] = 0; id.data[i++] = 255 * across * along;
    }
    x.putImageData(id, 0, 0);
  });

  // Car body: the section lofted along the car. A cab end is rounded in plan, upright below the waist and raked above it.
  // Surface groups: 0 textured sides, 1 paint, 2 line colour, 3 glass, 4 underframe grey, 5 lamps
  function carGeo(kind) {
    var L = kind === 'mid' ? CAR.mid : CAR.end, NL = CAR.nose, np = PROF.length, R = 2 * np - 2, pos = [], uv = [], bins = [[], [], [], [], [], []], st = [], k, q;
    var NT = [1, 0.985, 0.96, 0.92, 0.86, 0.78, 0.68, 0.57, 0.46, 0.38, 0.3, 0.22, 0.14, 0.07];
    var zA = -L / 2 + (kind === 'lead' ? NL : 0), zB = L / 2 - (kind === 'tail' ? NL : 0), nb = Math.round((zB - zA) / 2.3);
    if (kind === 'lead') NT.forEach(function (t) { st.push([-L / 2 + NL * (1 - t), t, -1]); });
    for (k = 0; k <= nb; k++) st.push([zA + (zB - zA) * k / nb, 0, 0]);
    if (kind === 'tail') NT.slice().reverse().forEach(function (t) { st.push([L / 2 - NL * (1 - t), t, 1]); });
    function shape(x, y, t, zc, dir) {
      if (t <= 0) return [x, y, zc];
      var yy = y > 3 ? 3 + (y - 3) * (1 - 0.4 * t * t) : y;
      var back = Math.pow(t, 1.3) * Math.max(0, yy - 1.3) * 0.42 + t * Math.max(0, 0.75 - yy) * 0.9;
      return [x * Math.pow(Math.max(0, 1 - t * t * t), 1 / 3), yy, zc - dir * back];
    }
    function region(t, y) {
      if (t <= 0) return 0;
      if (y < Y.sill) return 4;
      if (t > 0.3) {
        if (t > 0.9 && y < 0.92) return 4;
        if (y > 0.95 && y < 1.17 && t > 0.6 && t < 0.93) return 5;
        return y < 1.25 ? 1 : (y < 1.5 ? 2 : (y < 3.25 ? 3 : 2));
      }
      if (t > 0.14 && y > 1.25) return 2;
      return y < Y.win0 ? 1 : (y < Y.win1 ? 3 : 2);
    }
    st.forEach(function (S) {
      for (q = 0; q < R; q++) {
        var j = q < np ? q : R - q, p = shape(PROF[j][0] * (q < np ? 1 : -1), PROF[j][1], S[1], S[0], S[2]);
        pos.push(p[0], p[1], p[2]);
        uv.push((S[0] + L / 2) / L, PROF[j][2]);
      }
    });
    for (k = 0; k < st.length - 1; k++) for (q = 0; q < R; q++) {
      var q2 = (q + 1) % R, a = k * R + q, b = k * R + q2, c = a + R, d = b + R;
      var j1 = q < np ? q : R - q, j2 = q2 < np ? q2 : R - q2;
      bins[region((st[k][1] + st[k + 1][1]) / 2, (PROF[j1][1] + PROF[j2][1]) / 2)].push(a, b, c, b, d, c);
    }
    // a plain end where the next car couples on
    [0, st.length - 1].forEach(function (e) {
      if (st[e][1] > 0) return;
      var base = pos.length / 3;
      for (q = 0; q < R; q++) { pos.push(pos[(e * R + q) * 3], pos[(e * R + q) * 3 + 1], pos[(e * R + q) * 3 + 2]); uv.push(0.5, 0.01); }
      pos.push(0, 1.9, st[e][0]); uv.push(0.5, 0.01);
      for (q = 0; q < R; q++) bins[0].push(base + q, base + (q + 1) % R, base + R);
    });
    var idx = [], g = new T.BufferGeometry(), start = 0;
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    bins.forEach(function (bn, m) { if (!bn.length) return; g.addGroup(start, bn.length, m); start += bn.length; idx = idx.concat(bn); });
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  // dir +1 runs with the journey, -1 against it; lat is the track it uses
  W.train = function (dir, lat) {
    var grp = new T.Group(), cars = [], off = 0;
    function mat(hex, rough, metal, env) { var m = H.std({ color: lin(hex), roughness: rough, metalness: metal, side: T.DoubleSide }); m.envMapIntensity = env || 1; return m; }
    var paint = mat('#eef0f1', 0.37, 0.12), band = mat(LINE, 0.35, 0.16), glass = mat('#07090c', 0.05, 0.92, 1.5), grey = mat('#2b3037', 0.8, 0.35), roofGrey = mat('#7f868d', 0.75, 0.3), steel = mat('#8c9198', 0.45, 0.9);
    function lamp(hex, i) { var m = mat('#222222', 0.3, 0.2); m.emissive = lin(hex); m.emissiveIntensity = i; return m; }
    var shade = H.flat('#000000', { map: AAM.tex('blob'), transparent: true, depthWrite: false, opacity: 0.6 });
    ['lead', 'mid', 'mid', 'tail'].forEach(function (kind, i) {
      var L = kind === 'mid' ? CAR.mid : CAR.end, car = new T.Group(), fin = AAM.tex('side-' + kind + '-fin');
      var side = H.std({ color: 0xffffff, map: AAM.tex('side-' + kind), emissive: 0xffffff, emissiveMap: AAM.tex('side-' + kind + '-in'), emissiveIntensity: 0.85, roughness: 1, metalness: 1, roughnessMap: fin, metalnessMap: fin, side: T.DoubleSide });
      side.envMapIntensity = 1.2;
      var body = new T.Mesh(carGeo(kind), [side, paint, band, glass, grey, kind === 'lead' ? lamp('#fff4dc', 2.6) : lamp('#ff2314', 2.2)]);
      body.castShadow = true;
      car.add(body);
      // underframe: two bogies with their wheels, equipment cases between them, and the gangway to the next car
      var dark = [], wheels = [], roof = [], z0 = kind === 'lead' ? -L / 2 + 4.3 : -L / 2 + 2.9, z1 = kind === 'tail' ? L / 2 - 4.3 : L / 2 - 2.9;
      [z0, z1].forEach(function (z) {
        dark.push(G.box(2.1, 0.34, 3.1, 0, 0.3, z), G.box(2.5, 0.2, 0.5, 0, 0.5, z));
        [-1.05, 1.05].forEach(function (dz) {
          dark.push(G.xf(new T.CylinderGeometry(0.07, 0.07, 1.6, 8), 0, 0.42, z + dz, 0, 0, Math.PI / 2));
          [-0.7175, 0.7175].forEach(function (x) { wheels.push(G.xf(new T.CylinderGeometry(0.42, 0.42, 0.13, 22), x, 0.42, z + dz, 0, 0, Math.PI / 2)); });
        });
      });
      [[-0.32, 2.6, 0.34], [-0.05, 1.5, 0.3], [0.14, 2.2, 0.36], [0.33, 1.3, 0.28]].forEach(function (e) {
        dark.push(G.box(2.3, e[2], e[1], 0, 0.62 - e[2], (z0 + z1) / 2 + e[0] * (z1 - z0)));
      });
      if (i < 3) dark.push(G.box(2.46, 2.9, CAR.gap + 0.24, 0, 0.55, L / 2 + CAR.gap / 2));
      if (kind !== 'mid') dark.push(G.box(0.34, 0.26, 0.9, 0, 0.5, (kind === 'lead' ? -1 : 1) * (L / 2 - 0.5)));
      // roof: two air-conditioning units, each with a pair of fans
      [-0.24, 0.24].forEach(function (f) {
        var zc = (zA(kind, L) + zB(kind, L)) / 2 + f * L;
        roof.push(G.box(1.86, 0.3, 3.3, 0, 3.58, zc));
        [-0.85, 0.85].forEach(function (dz) { dark.push(G.cyl(0.52, 0.52, 0.03, 20, 0, 3.88, zc + dz)); });
      });
      var under = new T.Mesh(G.merge(dark), grey);
      under.castShadow = true;
      car.add(under);
      car.add(new T.Mesh(G.merge(wheels), steel));
      car.add(new T.Mesh(G.merge(roof), roofGrey));
      // a soft shadow thrown to the right, away from the low sun; only shown where the ground is a photographed plate
      var blob = new T.Mesh(new T.PlaneGeometry(7.4, L + 1.6), shade);
      blob.rotation.x = -Math.PI / 2;
      blob.position.set(2.2, -0.13, 0.5);
      blob.visible = false;
      blob.userData.blob = true;
      car.add(blob);
      car.rotation.order = 'YXZ';
      car.userData.off = off + L / 2;
      off += L + CAR.gap;
      grp.add(car);
      cars.push(car);
    });
    function zA(kind, L) { return -L / 2 + (kind === 'lead' ? CAR.nose : 0); }
    function zB(kind, L) { return L / 2 - (kind === 'tail' ? CAR.nose : 0); }
    // soft glow on the lamps, so a train reads from far down the line
    cars[0].add(H.dots([-0.95, 1.06, -CAR.end / 2 + 0.6, 0.95, 1.06, -CAR.end / 2 + 0.6], '#fff3dc', 1.1));
    cars[3].add(H.dots([-0.95, 1.06, CAR.end / 2 - 0.6, 0.95, 1.06, CAR.end / 2 - 0.6], '#ff2a1c', 0.8));
    return {
      grp: grp, len: off - CAR.gap,
      // sLead is where the nose is on the line
      place: function (sLead) {
        cars.forEach(function (car) {
          var s = sLead - dir * car.userData.off;
          W.pt(s, lat, 0, car.position);
          car.rotation.y = W.yaw(s) + (dir < 0 ? Math.PI : 0);
          car.rotation.x = Math.atan(W.grade(s)) * dir;
        });
      }
    };
  };
})();

