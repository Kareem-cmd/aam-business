
/* lm-kingdom.js */
/* Kingdom Centre, Riyadh: lens-plan glass tower with an inverted parabolic opening closed by a sky bridge. */
(function () {
  'use strict';
  var AAM = window.AAM, G = AAM.G;

  AAM.defTex('kcGlass', 512, function (x, w, h) { AAM.draw.glass(x, w, h, 4, 8, 21, { lo: 236, range: 16, hLine: 0.22, vLine: 0.16, spandrel: 0.14 }); });
  AAM.defTex('kcLit', [512, 1024], function (x, w, h) { AAM.draw.lit(x, w, h, 8, 32, 22, 0.3); });

  AAM.reg({
    id: 'kingdom', ar: 'برج المملكة', en: 'Kingdom Centre', city: 'الرياض',
    real: '302 م', dims: 'مسقط عدسي 70 × 35 م · ارتفاع 302 م', photos: '15، 16، 18',
    ground: 'plaza', scene: 1, view: { th: 70, ph: 86 },
    form: [
      'مسقط عدسي بحافتين حادتين، وواجهتان منحنيتان من الزجاج العاكس.',
      'فتحة على شكل قطع مكافئ مقلوب تبدأ عند ثلثي الارتفاع (199 م) وتتسع نحو القمة.',
      'جسر علوي يغلق الفتحة عند القمة، وسطحه السفلي مقوّس قليلًا.',
      'إطار فضي حول الفتحة يضيء بالأخضر في النمط الليلي، كما في الصورة 18.'
    ],
    mats: [['زجاج الواجهة', '#86a9cb', 'عاكس، معدنية 0.92'], ['إطار الفتحة والسقف', '#e3e7ec', 'ألمنيوم فضي'], ['القاعدة', '#c8c5bf', 'حجر فاتح'], ['زجاج القاعدة', '#31465c', 'داكن']],
    simp: ['LOD1: نصف عدد الشرائح في الواجهة، ويبقى القوس والجسر.', 'LOD2: ربع الشرائح، وتُحذف أنابيب الإطار.'],
    check: 'القاعدة مبسّطة إلى كتلتين عدسيتين. جناحا المركز التجاري غير مفصّلين.',
    build: function (m, q) {
      var H = 302, a = 35, b = 17.5, R = (a * a + b * b) / (2 * b), y0 = 199, wTop = 29.5;
      // intersection of the parabola with the bridge soffit
      var tE = Math.sqrt((H - 8 - y0) / (H - y0 + 4)), wE = wTop * tE;
      function zf(x) { return Math.sqrt(Math.max(0, R * R - x * x)) - (R - b); }
      function wv(y) { return y <= y0 ? 0 : wTop * Math.sqrt((y - y0) / (H - y0)); }
      function yPar(x) { var t = x / wTop; return y0 + t * t * (H - y0); }
      function soffit(x) { var t = x / wTop; return (H - 8) - 4 * t * t; }
      // exact normals for the two circular-arc facades, so the halves join without a seam
      function lensNormals(g, face) {
        var p = g.attributes.position.array, n = g.attributes.normal.array, i, s;
        for (i = 0; i < p.length; i += 3) { s = p[i] / R; n[i] = s; n[i + 1] = 0; n[i + 2] = face * Math.sqrt(1 - s * s); }
        return g;
      }
      var uvFn = function (u, v, o, k) { return k === 0 ? o[0] / 12 : o[1] / 30.4; };

      m.mat('glass', { color: '#6fa6d6', map: 'kcGlass', rough: 0.16, metal: 0.62, env: 1.25, clay: '#d2d5d9', night: { color: '#2f4c72', emissive: '#ffe0ae', map: 'kcLit', i: 1.15 } });
      m.mat('glassTop', { color: '#6fa6d6', map: 'kcGlass', rough: 0.16, metal: 0.62, env: 1.25, clay: '#d2d5d9', night: { color: '#22395a' } });
      m.mat('rim', { color: '#e3e7ec', rough: 0.32, metal: 0.9, double: true, night: { color: '#0c3a20', emissive: '#00d455', i: 1.0 } });
      m.mat('stone', { color: '#c8c5bf', map: 'plaster', world: 14, rough: 0.9 });
      m.mat('podGlass', { color: '#31465c', map: 'kcGlass', world: 16, rough: 0.12, metal: 0.85, clay: '#c2c5c9', night: { emissive: '#ffd9a0', map: 'kcLit', i: 0.9 } });

      var nx = q.n(18), nLow = q.n(40), nUp = q.n(64);
      function shell(yA, yB, rows, key) {
        [-1, 1].forEach(function (sign) {
          [1, -1].forEach(function (face) {
            var g = G.grid(nx, rows, function (u, v, o) {
              var y = yA + (yB - yA) * v, w = wv(y), xs = w + u * (a - w);
              o[0] = sign * xs; o[1] = y; o[2] = face * zf(xs);
            }, { flip: sign * face < 0, uvFn: uvFn });
            m.add(key, lensNormals(g, face));
          });
        });
      }
      shell(0, y0, nLow, 'glass');
      shell(y0, H, nUp, 'glassTop');

      // sky bridge: fills the top of the opening above the arched soffit
      [1, -1].forEach(function (face) {
        var g = G.grid(q.n(36), 3, function (u, v, o) {
          var x = -wTop + 2 * wTop * u, ax = Math.abs(x), yb = Math.max(soffit(ax), yPar(ax));
          o[0] = x; o[1] = yb + (H - yb) * v; o[2] = face * zf(ax);
        }, { flip: face < 0, uvFn: uvFn });
        m.add('glassTop', lensNormals(g, face));
      });
      m.add('rim', G.grid(q.n(36), 1, function (u, v, o) {
        var x = -wE + 2 * wE * u;
        o[0] = x; o[1] = soffit(Math.abs(x)); o[2] = zf(Math.abs(x)) * (1 - 2 * v);
      }));
      // inner walls of the opening
      [-1, 1].forEach(function (sign) {
        m.add('rim', G.grid(1, q.n(48), function (u, v, o) {
          var w = wE * v;
          o[0] = sign * w; o[1] = yPar(w); o[2] = zf(w) * (1 - 2 * u);
        }));
      });
      // roof
      m.add('rim', G.grid(q.n(40), 2, function (u, v, o) {
        var x = -a + 2 * a * u;
        o[0] = x; o[1] = H; o[2] = zf(Math.abs(x)) * (1 - 2 * v);
      }));
      // frame around the opening, front and back
      if (q.mid) {
        [1, -1].forEach(function (face) {
          var pts = [], n = q.n(60), i, w, x;
          for (i = 0; i <= n; i++) { w = wE * (1 - 2 * i / n); pts.push([-w, yPar(Math.abs(w)), face * (zf(Math.abs(w)) + 0.25)]); }
          for (i = 1; i < n; i++) { x = wE - 2 * wE * i / n; pts.push([x, soffit(Math.abs(x)), face * (zf(Math.abs(x)) + 0.25)]); }
          pts.push(pts[0]);
          m.add('rim', G.sweep(pts, 0.95, 6));
        });
      }

      // podium: two stacked lens-plan tiers
      function lensPlan(ap, bp, n) {
        var Rp = (ap * ap + bp * bp) / (2 * bp), pts = [], i, x;
        for (i = 0; i <= n; i++) { x = -ap + 2 * ap * i / n; pts.push([x, Math.sqrt(Math.max(0, Rp * Rp - x * x)) - (Rp - bp)]); }
        for (i = n - 1; i > 0; i--) { x = -ap + 2 * ap * i / n; pts.push([x, -(Math.sqrt(Math.max(0, Rp * Rp - x * x)) - (Rp - bp))]); }
        return pts;
      }
      var pn = q.n(28);
      m.add('stone', G.prism(lensPlan(98, 40, pn), 15));
      m.add('podGlass', G.xf(G.prism(lensPlan(98.4, 40.4, pn), 8), 0, 3.5, 0));
      m.add('stone', G.xf(G.prism(lensPlan(72, 29, pn), 7), 0, 15, 0));
      m.add('podGlass', G.xf(G.prism(lensPlan(72.3, 29.3, pn), 4), 0, 16.5, 0));
    }
  });
})();

