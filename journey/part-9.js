
/* lm-faisaliah.js */
/* Al Faisaliah Tower, Riyadh: square tower tapering along four curved corner beams to a point, with a golden glass sphere near the top. */
(function () {
  'use strict';
  var AAM = window.AAM, G = AAM.G, D = AAM.draw, M = AAM.M;

  // 8 bays by 8 floors: aluminium sun louvre above a strip of dark glass on every floor
  AAM.defTex('faLouver', 512, function (x, w, h) {
    var bays = 8, floors = 8, fh = h / floors, bw = w / bays, r = M.rng(31), i, j, k;
    for (j = 0; j < floors; j++) {
      for (i = 0; i < bays; i++) {
        k = 46 + r() * 20;
        x.fillStyle = D.css([k * 0.72, k * 0.95, k * 1.3]);
        x.fillRect(i * bw, j * fh + fh * 0.4, bw + 1, fh * 0.6 + 1);
      }
      x.fillStyle = '#d9dde2';
      x.fillRect(0, j * fh, w, fh * 0.4);
      x.fillStyle = 'rgba(110,120,132,0.55)';
      for (k = 1; k < 4; k++) x.fillRect(0, j * fh + fh * 0.4 * k / 4, w, 1.5);
      x.fillStyle = 'rgba(255,255,255,0.6)';
      x.fillRect(0, j * fh, w, 2);
    }
    x.fillStyle = 'rgba(20,26,34,0.45)';
    for (i = 0; i <= bays; i++) x.fillRect(i * bw - 1, 0, 2, h);
  });
  AAM.defTex('faLit', 512, function (x, w, h) {
    var bays = 8, floors = 8, fh = h / floors, bw = w / bays, r = M.rng(32), i, j;
    x.fillStyle = '#000';
    x.fillRect(0, 0, w, h);
    for (j = 0; j < floors; j++) for (i = 0; i < bays; i++) {
      if (r() > 0.55) continue;
      x.fillStyle = r() < 0.7 ? 'rgba(255,222,160,' + (0.55 + r() * 0.45) + ')' : 'rgba(235,245,255,' + (0.5 + r() * 0.4) + ')';
      x.fillRect(i * bw + 2, j * fh + fh * 0.44, bw - 4, fh * 0.5);
    }
  });
  AAM.defTex('faSphere', [512, 256], function (x, w, h) {
    D.noiseFill(x, w, h, function (u, v) {
      var n = M.pfbm2(u * 16, v * 8, 16, 8, 3), k = 0.86 + 0.24 * (n - 0.5);
      return [214 * k, 168 * k, 74 * k];
    });
    var i;
    x.strokeStyle = 'rgba(70,46,10,0.55)';
    x.lineWidth = 1.5;
    for (i = 0; i <= 24; i++) { x.beginPath(); x.moveTo(i * w / 24, 0); x.lineTo(i * w / 24, h); x.stroke(); }
    for (i = 1; i < 12; i++) { x.beginPath(); x.moveTo(0, i * h / 12); x.lineTo(w, i * h / 12); x.stroke(); }
  });

  AAM.reg({
    id: 'faisaliah', ar: 'برج الفيصلية', en: 'Al Faisaliah Tower', city: 'الرياض',
    real: '267 م', dims: 'قاعدة مربعة 52 × 52 م · ارتفاع 267 م', photos: '14، 15، 16، 18',
    ground: 'plaza', scene: 1, view: { th: 45, ph: 86 },
    form: [
      'أربعة أعمدة ركنية منحنية تلتقي في نقطة واحدة عند القمة.',
      'طوابق المكاتب حتى 176 م، بكاسرات شمس فضية أفقية فوق شريط زجاج داكن في كل طابق.',
      'ثلاثة أحزمة تدعيم على شكل V تقسم الواجهة، كما تظهر مضاءة في الصورة 18.',
      'كرة زجاجية ذهبية قطرها 24 م داخل الهيكل المفتوح، ثم شبكة فولاذية وقمة مصمتة.'
    ],
    mats: [['كاسرات الشمس', '#d9dde2', 'ألمنيوم'], ['زجاج الطوابق', '#2c3e52', 'داكن'], ['الأعمدة والتدعيم', '#ecebe6', 'خرسانة فاتحة'], ['الكرة', '#d6a84a', 'زجاج ذهبي عاكس'], ['القمة', '#cfd4da', 'فولاذ']],
    simp: ['LOD1: تُدمج قضبان الشبكة العلوية إلى النصف.', 'LOD2: تُحذف قضبان التدعيم القطرية وتبقى الكتلة والكرة والأعمدة.'],
    check: 'القاعدة والبهو الزجاجي مبسّطان إلى منصة حجرية.',
    build: function (m, q) {
      var H = 267, s0 = 26, yT = 176, yP = 183, yS = 196, rS = 12;
      function sv(y) { return s0 * (1 - Math.pow(Math.max(0, y) / H, 2.3)); }

      m.mat('louver', { color: '#ffffff', map: 'faLouver', rough: 0.34, metal: 0.45, clay: '#d6d6d2', night: { color: '#5a6676', emissive: '#ffe2b4', map: 'faLit', i: 1.25 } });
      m.mat('dark', { color: '#1d2a3a', rough: 0.12, metal: 0.8, clay: '#bdbdb9', night: { emissive: '#1fd06a', i: 0.55 } });
      m.mat('white', { color: '#ecebe6', map: 'plaster', world: 9, rough: 0.6, night: { emissive: '#25e070', i: 0.5 } });
      m.mat('beam', { color: '#ecebe6', rough: 0.55, clay: '#e2e0da' });
      m.mat('gold', { color: '#c9a04e', rough: 0.2, metal: 0.9, clay: '#cfccc4', night: { emissive: '#ffc86a', i: 0.35 } });
      m.mat('sphere', { color: '#ffffff', map: 'faSphere', rough: 0.2, metal: 1, env: 1.3, clay: '#cfccc4', night: { emissive: '#ffb84a', map: 'faSphere', i: 0.45 } });
      m.mat('steel', { color: '#cfd4da', rough: 0.3, metal: 0.9, clay: '#dcdcd8', night: { emissive: '#25e070', i: 0.7 } });
      m.mat('stone', { color: '#c9c5bd', map: 'plaster', world: 12, rough: 0.9 });

      // one face between yA and yB, pushed out by off; the other three are quarter turns of it
      function faces(key, yA, yB, rows, off, uvFn) {
        var k;
        for (k = 0; k < 4; k++) {
          m.add(key, G.xf(G.grid(1, rows, function (u, v, o) {
            var y = yA + (yB - yA) * v, s = sv(y);
            o[0] = s * (2 * u - 1); o[1] = y; o[2] = s + off;
          }, { uvFn: uvFn }), 0, 0, 0, 0, k * Math.PI / 2, 0));
        }
      }
      var floorUV = function (u, v, o, k) { return k === 0 ? o[0] / 48 : o[1] / 31.2; };
      faces('louver', 6, yT, q.n(44), 0, floorUV);
      faces('gold', yT, yP, 2, 0.05);
      m.add('gold', G.box(sv(yP) * 2, 0.8, sv(yP) * 2, 0, yP - 0.4, 0));

      // bracing belts
      [45, 103, 155].forEach(function (yk) {
        var hk = 8, sa = sv(yk), sb = sv(yk + hk), k;
        faces('dark', yk, yk + hk, 1, 0.14);
        for (k = 0; k < 4; k++) {
          var ry = k * Math.PI / 2;
          m.add('white', G.xf(G.bar([-sa, yk, sa + 0.5], [sa, yk, sa + 0.5], 0.9), 0, 0, 0, 0, ry, 0));
          m.add('white', G.xf(G.bar([-sb, yk + hk, sb + 0.5], [sb, yk + hk, sb + 0.5], 0.9), 0, 0, 0, 0, ry, 0));
          if (q.mid) {
            m.add('white', G.xf(G.bar([-sb, yk + hk, sb + 0.5], [0, yk, sa + 0.5], 1.1), 0, 0, 0, 0, ry, 0));
            m.add('white', G.xf(G.bar([sb, yk + hk, sb + 0.5], [0, yk, sa + 0.5], 1.1), 0, 0, 0, 0, ry, 0));
          }
        }
      });

      // corner beams, base to tip
      [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(function (c) {
        var pts = [], n = q.n(44), i, y, s;
        for (i = 0; i <= n; i++) { y = H * i / n; s = sv(y) + 0.3; pts.push([c[0] * s, y, c[1] * s]); }
        m.add('beam', G.sweep(pts, function (t) { return 2.4 - 1.95 * t; }, q.hi ? 8 : 5));
      });

      // sphere and its seat
      m.add('sphere', G.sphere(rS, q.n(36), q.n(24), 0, yS, 0));
      m.add('beam', G.cyl(3.2, 4.4, yS - rS - yP + 2.5, q.n(16), 0, yP, 0));

      // open steel lattice above the sphere, then the solid tip
      var rings = [209, 217, 225, 232, 239], yTip = 239, i, k;
      rings.forEach(function (y) {
        var s = sv(y) + 0.3;
        for (k = 0; k < 4; k++) m.add('steel', G.xf(G.bar([-s, y, s], [s, y, s], 0.55), 0, 0, 0, 0, k * Math.PI / 2, 0));
      });
      if (q.mid) {
        for (i = 0; i < rings.length - 1; i++) {
          var sa = sv(rings[i]) + 0.3, sb = sv(rings[i + 1]) + 0.3;
          for (k = 0; k < 4; k++) {
            m.add('steel', G.xf(G.bar([-sa, rings[i], sa], [sb, rings[i + 1], sb], 0.38), 0, 0, 0, 0, k * Math.PI / 2, 0));
            if (q.hi) m.add('steel', G.xf(G.bar([sa, rings[i], sa], [-sb, rings[i + 1], sb], 0.38), 0, 0, 0, 0, k * Math.PI / 2, 0));
          }
        }
      }
      faces('steel', yTip, H - 0.2, q.n(10), 0.3);
      m.add('steel', G.cyl(0.02, 0.5, 9, 6, 0, H - 2, 0));

      // plinth and lobby block
      m.add('stone', G.box(96, 2.2, 96, 0, 0, 0));
      m.add('dark', G.box(sv(4) * 2 - 1.5, 6, sv(4) * 2 - 1.5, 0, 2.2, 0));
    }
  });
})();

