
/* lm-kafd.js */
/* King Abdullah Financial District (KAFD), Riyadh: a cluster of faceted, crystal-like glass towers led by the PIF Tower. */
(function () {
  'use strict';
  var T = THREE, AAM = window.AAM, G = AAM.G, D = AAM.draw, M = AAM.M;

  // glass panels crossed by a diagonal grid of fins
  AAM.defTex('kfGlass', 512, function (x, w, h) {
    var i;
    D.glass(x, w, h, 4, 8, 51, { lo: 196, range: 44, hLine: 0.38, vLine: 0.16 });
    x.strokeStyle = 'rgba(245,248,252,0.3)';
    x.lineWidth = 4;
    for (i = -2; i <= 2; i++) {
      x.beginPath(); x.moveTo(i * w / 2, 0); x.lineTo(i * w / 2 + w / 2, h); x.stroke();
      x.beginPath(); x.moveTo(i * w / 2 + w / 2, 0); x.lineTo(i * w / 2, h); x.stroke();
    }
  });
  AAM.defTex('kfLit', [512, 1024], function (x, w, h) { D.lit(x, w, h, 8, 32, 52, 0.42); });

  AAM.reg({
    id: 'kafd', ar: 'أبراج المالية', en: 'KAFD Financial District', city: 'الرياض',
    real: 'برج الصندوق 385 م', dims: 'مجموعة 7 أبراج على 380 × 300 م · من 95 إلى 385 م', photos: 'لا توجد صورة',
    ground: 'plaza', scene: 0.8, view: { th: 58, ph: 82, zoom: 0.8, ty: 0.45 },
    form: [
      'أبراج زجاجية بأوجه مائلة مثلثة كالبلورات، وهي السمة المميزة لمركز الملك عبدالله المالي.',
      'برج صندوق الاستثمارات العامة (385 م) في الوسط: قاعدة مربعة تتحول أوجهها إلى مثلثات وتنتهي بقمة مائلة.',
      'أبراج أقل ارتفاعًا بقمم مقطوعة بزوايا مختلفة، ومبانٍ منخفضة مضلّعة عند القاعدة.',
      'شبكة قطرية من الزعانف على الزجاج.'
    ],
    mats: [['زجاج أزرق', '#7ea4c6', 'عاكس'], ['زجاج داكن', '#4f6a86', 'عاكس'], ['زجاج فضي', '#a9bccb', 'عاكس'], ['الساحة', '#c9c1b2', 'حجر']],
    simp: ['LOD1: تُحذف المباني المنخفضة.', 'LOD2: خمسة أبراج فقط.'],
    check: 'لا توجد صورة للمالية ضمن الصور المرسلة. الأبراج هنا تمثّل طراز المنطقة البلوري، وليست نسخًا مقيسة من مبانٍ بعينها. أرسل صورة لأطابقها.',
    build: function (m, q) {
      var gm = function (c, n) { return { color: c, map: 'kfGlass', rough: 0.12, metal: 0.72, env: 1.25, flat: true, clay: '#d3d5d8', night: { color: n, emissive: '#ffe2b4', map: 'kfLit', i: 1.0 } }; };
      m.mat('ga', gm('#5f93c8', '#324d6c'));
      m.mat('gb', gm('#36516f', '#25384f'));
      m.mat('gc', gm('#7ea6c2', '#3c5068'));
      m.mat('stone', { color: '#c9c1b2', map: 'plaster', world: 12, rough: 0.9 });
      G.palmMats(m);

      // faceted solid from rings of [x, y, z] points (same count in each ring), flat-shaded
      function crystal(key, rings, cx, cz, ry) {
        var pos = [], uv = [], r, i, n = rings[0].length;
        function tri(a, b, c, ua, ub, uc) {
          if ((a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) || (b[0] === c[0] && b[1] === c[1] && b[2] === c[2]) || (a[0] === c[0] && a[1] === c[1] && a[2] === c[2])) return;
          pos.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
          uv.push(ua, a[1] / 30, ub, b[1] / 30, uc, c[1] / 30);
        }
        for (r = 0; r < rings.length - 1; r++) {
          var A = rings[r], B = rings[r + 1], u = 0;
          for (i = 0; i < n; i++) {
            var j = (i + 1) % n, len = Math.hypot(A[j][0] - A[i][0], A[j][2] - A[i][2]) || Math.hypot(B[j][0] - B[i][0], B[j][2] - B[i][2]);
            var u1 = u + len / 14;
            tri(A[i], A[j], B[j], u, u1, u1);
            tri(A[i], B[j], B[i], u, u1, u);
            u = u1;
          }
        }
        var top = rings[rings.length - 1], c = [0, 0, 0];
        top.forEach(function (p) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; });
        for (i = 0; i < n; i++) tri(top[i], top[(i + 1) % n], c, 0, 1, 0.5);
        var g = new T.BufferGeometry();
        g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
        g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
        g.computeVertexNormals();
        m.add(key, G.keep(G.xf(g, cx, 0, cz, 0, ry || 0, 0)));
      }
      // ring helpers: points go counter-clockwise seen from above
      function rect(w, d, y, o) {
        o = o || {};
        var hw = w / 2, hd = d / 2, sx = o.sx || 0, sz = o.sz || 0, t = o.tilt || [0, 0, 0, 0];
        return [[hw + sx, y + t[0], hd + sz], [hw + sx, y + t[1], -hd + sz], [-hw + sx, y + t[2], -hd + sz], [-hw + sx, y + t[3], hd + sz]];
      }
      function dbl(pts) { var o = []; pts.forEach(function (p) { o.push(p, p); }); return o; }
      function mids(pts) { var o = [], n = pts.length, i; for (i = 0; i < n; i++) { var a = pts[i], b = pts[(i + 1) % n], mm = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]; o.push(mm, mm); } return o; }
      // corners cut by c along each edge: 8 points from 4
      function cut(pts, c) {
        var o = [], n = pts.length, i;
        for (i = 0; i < n; i++) {
          var p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
          var la = Math.hypot(a[0] - p[0], a[2] - p[2]), lb = Math.hypot(b[0] - p[0], b[2] - p[2]);
          o.push([p[0] + (a[0] - p[0]) * c / la, p[1], p[2] + (a[2] - p[2]) * c / la], [p[0] + (b[0] - p[0]) * c / lb, p[1], p[2] + (b[2] - p[2]) * c / lb]);
        }
        return o;
      }
      function scaleRing(pts, s) { return pts.map(function (p) { return [p[0] * s, p[1], p[2] * s]; }); }

      // PIF Tower: square base whose corners are cut away with height until the plan turns 45 degrees
      var b0 = rect(62, 62, 0), r150 = cut(rect(64, 64, 150), 15), r300 = scaleRing(mids(rect(62, 62, 300)), 0.94);
      var topR = scaleRing(mids(rect(62, 62, 0, { tilt: [385, 356, 346, 372] })), 0.5);
      // the 8-point rings start one step apart, so shift the mid rings to line the facets up
      function shift(pts) { return pts.slice(1).concat([pts[0]]); }
      crystal('ga', [dbl(b0), r150, shift(r300), shift(topR)], 0, 0, 0.3);

      // tall slab with a diagonal crown
      crystal('gb', [rect(48, 34, 0), rect(50, 35, 150, { sx: 2 }), rect(46, 33, 262, { sx: 4, tilt: [41, 41, 0, 0] })], -98, 36, -0.2);
      // hexagonal tower twisting as it tapers
      (function () {
        var rings = [], k, i;
        for (k = 0; k <= 4; k++) {
          var y = 240 * k / 4, rad = 24 * (1 - 0.3 * k / 4), ring = [];
          for (i = 0; i < 6; i++) { var a = -i / 6 * Math.PI * 2 + k * 0.2; ring.push([Math.cos(a) * rad, y + (k === 4 ? 14 * Math.cos(a) : 0), Math.sin(a) * rad]); }
          rings.push(ring);
        }
        crystal('gc', rings, 92, 58, 0);
      })();
      crystal('ga', [rect(62, 24, 0), rect(52, 24, 120, { sx: -5 }), rect(40, 22, 188, { sx: -11, tilt: [0, 0, 14, 14] })], -62, -84, 0.5);
      crystal('gc', [dbl(rect(40, 40, 0)), cut(rect(42, 42, 90), 12), cut(rect(36, 36, 150, { tilt: [0, 10, 18, 6] }), 14)], 124, -62, 0.6);
      if (q.lod < 2) {
        crystal('gb', [rect(38, 30, 0), rect(34, 34, 70), rect(28, 26, 122, { sz: 3, tilt: [10, 0, 0, 10] })], -154, -34, -0.4);
        crystal('ga', [dbl(rect(34, 34, 0)), cut(rect(36, 36, 55), 10), cut(rect(30, 30, 96, { tilt: [8, 0, 0, 8] }), 11)], 40, 116, 0.2);
      }
      // low faceted pavilions
      if (q.hi) {
        crystal('gc', [rect(44, 30, 0), rect(36, 24, 26, { sx: 3, tilt: [8, 0, 0, 6] })], -40, 100, 0.3);
        crystal('gb', [rect(36, 36, 0), rect(26, 30, 34, { sz: -3, tilt: [0, 8, 4, 0] })], 150, 30, -0.3);
        crystal('ga', [rect(50, 26, 0), rect(44, 20, 22, { tilt: [0, 0, 7, 7] })], 20, -120, 0.1);
        crystal('gc', [rect(30, 30, 0), rect(22, 24, 30, { sx: 2, tilt: [6, 0, 0, 0] })], -130, 80, 0.8);
      }
      m.add('stone', G.box(400, 1.2, 330, -8, 0, 0));
      if (q.mid) [[-20, 60], [10, 70], [60, -10], [-70, -20], [-110, -70], [80, -110], [150, -10], [-150, 30], [0, 150], [70, 130]].forEach(function (p, i) { G.palm(m, p[0], p[1], 9 + (i % 3), 80 + i, q); });
    }
  });
})();

