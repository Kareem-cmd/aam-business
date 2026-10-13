
/* lm-diriyah.js */
/* Historic Diriyah (At-Turaif): Najdi mud-brick palace blocks with battered walls, triangular vents and a towered perimeter wall. */
(function () {
  'use strict';
  var AAM = window.AAM, G = AAM.G, M = AAM.M;

  AAM.reg({
    id: 'diriyah', ar: 'الدرعية التاريخية', en: 'At-Turaif, Diriyah', city: 'الدرعية',
    real: 'حتى 23 م تقريبًا', dims: 'مجموعة قصور 80 × 60 م · أعلى كتلة 23 م', photos: '15 (السور والبرج)',
    ground: 'sand', scene: 5, view: { th: 64, ph: 80, zoom: 0.74, ty: 0.42 },
    form: [
      'كتل طينية متلاصقة بارتفاعات مختلفة وجدران مائلة للداخل، على طراز قصر سلوى.',
      'صفوف وفتحات مثلثة في أعلى الجدران، وشرفات مثلثة على الأسطح.',
      'أساس حجري فاتح تحت الجدران الطينية.',
      'سور خارجي ببرجين دائريين، وجدران متهدمة القمة، ونخيل وادي حنيفة.'
    ],
    mats: [['اللبن الطيني', '#c2935a', 'خشن'], ['الأساس الحجري', '#c4b594', 'حجر جيري'], ['الخشب', '#5a3a22', 'أبواب'], ['الفتحات', '#2a1c10', 'داكنة']],
    simp: ['LOD1: تبقى صفوف الفتحات الرئيسية فقط، وتقل الشرفات والنخيل.', 'LOD2: الكتل والسور والبرجان بلا فتحات ولا شرفات.'],
    check: 'لا توجد صورة مخصصة لحي الطريف في المجموعة. التكوين مبني على الطراز النجدي الموثّق لقصر سلوى، وتوزيع الكتل تقريبي.',
    build: function (m, q) {
      var i, k;
      m.mat('mud', { color: '#c2935a', map: 'plaster', bump: 'plaster', bumpScale: 0.07, world: 7, rough: 0.97, night: { emissive: '#ff9448', i: 0.11 } });
      m.mat('stone', { color: '#c4b594', map: 'plaster', world: 3, rough: 0.95 });
      m.mat('wood', { color: '#5a3a22', map: 'plaster', world: 2, rough: 0.85, clay: '#b9b5ad' });
      m.mat('dark', { color: '#2a1c10', rough: 1, clay: '#8f8b84', shadow: false });
      G.palmMats(m);

      var BAT = 0.07;
      function merlon(x, y0, z, ry, s) {
        m.add('mud', G.xf(G.extrude([[-0.45 * s, 0], [0.45 * s, 0], [0, 1.1 * s]], 0.5), x, y0, z, 0, ry, 0));
      }
      function tri(x, y, z, ry, s) {
        m.add('dark', G.xf(G.extrude([[-0.5 * s, 0], [0.5 * s, 0], [0, 0.9 * s]], 0.08), x, y, z, 0, ry, 0));
      }
      // battered block with optional parapet, vents and a stone footing
      function block(cx, cz, w, d, h, o) {
        o = o || {};
        var g = G.box(w, h, d, 0, 0, 0);
        G.taper(g, function (y) { return 1 - BAT * y / h; });
        m.add('mud', G.xf(g, cx, 0, cz));
        m.add('stone', G.box(w + 0.5, 1.3, d + 0.5, cx, 0, cz));
        var tw = w * (1 - BAT), td = d * (1 - BAT), j, n, t;
        if (o.parapet && q.mid) {
          var st = q.hi ? 1.5 : 3;
          n = Math.floor(tw / st);
          for (j = 0; j < n; j++) { t = (j + 0.5) / n - 0.5; merlon(cx + t * tw, h, cz + td / 2 - 0.26, 0, 1); merlon(cx + t * tw, h, cz - td / 2 + 0.26, 0, 1); }
          n = Math.floor(td / st);
          for (j = 0; j < n; j++) { t = (j + 0.5) / n - 0.5; merlon(cx + tw / 2 - 0.26, h, cz + t * td, Math.PI / 2, 1); merlon(cx - tw / 2 + 0.26, h, cz + t * td, Math.PI / 2, 1); }
        }
        // rows of triangular vents under the roof line, on every side
        (o.rows || []).forEach(function (row) {
          if (!q.mid || (!q.hi && row.minor)) return;
          var y = h * row.y, sc = 1 - BAT * row.y, fw, hd, c;
          for (k = 0; k < 4; k++) {
            fw = (k % 2 === 0 ? w : d) * sc; hd = (k % 2 === 0 ? d : w) * sc / 2 + 0.03;
            n = Math.max(2, Math.floor(fw / (row.gap || 1.6)) - 1);
            for (j = 0; j < n; j++) {
              t = (j + 0.5) / n - 0.5;
              c = [t * fw * 0.86, hd];
              var a = k * Math.PI / 2, wx = cx + c[0] * Math.cos(a) + c[1] * Math.sin(a), wz = cz - c[0] * Math.sin(a) + c[1] * Math.cos(a);
              tri(wx, y, wz, a, row.s || 0.6);
            }
          }
        });
        // the stacked-triangle motif typical of Najdi facades
        if (o.motif && q.hi) {
          var my = h * 0.5, hd2 = d * (1 - BAT * 0.5) / 2 + 0.03, r, c2;
          for (r = 0; r < 3; r++) for (c2 = 0; c2 <= r; c2++) tri(cx + o.motif + (c2 - r / 2) * 0.9, my - r * 0.85, cz + hd2 + BAT * d / 2 * (r * 0.85 / h), 0, 0.62);
        }
        if (o.door) {
          m.add('wood', G.box(1.7, 2.9, 0.16, cx + o.door, 0, cz + d / 2 + 0.02));
          m.add('mud', G.box(2.3, 0.35, 0.3, cx + o.door, 2.9, cz + d / 2));
        }
      }

      block(-12, 0, 18, 16, 19, { parapet: true, rows: [{ y: 0.9, gap: 1.5 }, { y: 0.8, gap: 1.5, minor: true }, { y: 0.45, gap: 4, s: 0.7, minor: true }], motif: 4, door: -4 });
      block(7, -3, 16, 18, 14.5, { parapet: true, rows: [{ y: 0.88, gap: 1.5 }, { y: 0.5, gap: 4, s: 0.7, minor: true }], motif: -2, door: 3 });
      block(-1, -17, 10, 10, 23, { parapet: true, rows: [{ y: 0.93, gap: 1.4 }, { y: 0.85, gap: 1.4, minor: true }, { y: 0.6, gap: 3, s: 0.7 }] });
      block(-28, 3, 12, 13, 12, { parapet: true, rows: [{ y: 0.86, gap: 1.6 }] });
      block(22, 7, 13, 11, 10, { rows: [{ y: 0.84, gap: 1.6 }], door: -2 });
      block(21, -13, 12, 12, 16.5, { parapet: true, rows: [{ y: 0.9, gap: 1.5 }, { y: 0.55, gap: 3.5, s: 0.7, minor: true }] });
      block(-25, -15, 14, 12, 8.5, { rows: [{ y: 0.82, gap: 1.8, minor: true }] });

      // walls with weathered, uneven tops
      function ruin(x, z, len, hh, ry, seed) {
        var r = M.rng(seed), pts = [[-len / 2, 0], [len / 2, 0]], n = 9, j;
        for (j = n; j >= 0; j--) pts.push([-len / 2 + len * j / n, hh * (0.55 + 0.45 * r())]);
        m.add('mud', G.xf(G.extrude(pts, 1.1), x, 0, z, 0, ry, 0));
      }
      ruin(-36, -4, 16, 7, Math.PI / 2, 11);
      ruin(33, -3, 20, 6.5, Math.PI / 2, 12);
      ruin(8, -26, 30, 6, 0, 13);

      // perimeter wall with two round towers
      var wl = 66, wz = 24, wh = 7.2;
      m.add('mud', G.xf(G.extrude([[-1.1, 0], [1.1, 0], [0.7, wh], [-0.7, wh]], wl), -3, 0, wz, 0, Math.PI / 2, 0));
      m.add('stone', G.box(wl, 1.1, 2.5, -3, 0, wz));
      if (q.mid) for (i = 0; i < Math.floor(wl / (q.hi ? 1.5 : 3)); i++) merlon(-3 - wl / 2 + (i + 0.5) * (q.hi ? 1.5 : 3), wh, wz, 0, 0.9);
      if (q.hi) for (i = -wl / 2 + 3; i < wl / 2 - 2; i += 2.6) tri(-3 + i, wh - 1.9, wz + 0.82, 0, 0.5);
      [[-37, 4.6, 13], [31, 4.2, 11.5]].forEach(function (t) {
        var rb = t[1], hh = t[2], rt = rb * 0.76, a;
        m.add('mud', G.lathe([[rb, 0], [rb * 0.98, 1], [rt, hh - 1.6], [rt + 0.12, hh - 1.3], [rt + 0.12, hh], [rt - 0.5, hh], [rt - 0.5, hh - 0.9], [0, hh - 0.9]], q.n(28), t[0], 0, wz));
        m.add('stone', G.cyl(rb + 0.1, rb + 0.25, 1.2, q.n(28), t[0], 0, wz));
        if (q.mid) for (k = 0; k < (q.hi ? 14 : 7); k++) { a = k / (q.hi ? 14 : 7) * Math.PI * 2; merlon(t[0] + Math.sin(a) * (rt - 0.2), hh, wz + Math.cos(a) * (rt - 0.2), a, 0.8); }
        if (q.hi) for (k = 0; k < 12; k++) { a = k / 12 * Math.PI * 2; var rr = rb - (rb - rt) * 0.62 + 0.03; tri(t[0] + Math.sin(a) * rr, hh * 0.62, wz + Math.cos(a) * rr, a, 0.5); }
      });
      // gateway through the wall
      m.add('mud', G.box(7, 9.4, 3, -3, 0, wz));
      m.add('wood', G.box(2.6, 4.2, 0.2, -3, 0, wz + 1.55));
      if (q.mid) for (i = -2; i <= 2; i++) merlon(-3 + i * 1.4, 9.4, wz + 1.2, 0, 0.9);

      if (q.mid) {
        var palms = [[-18, 34, 9], [-10, 38, 10.5], [6, 35, 8.5], [18, 39, 10], [-44, 32, 9.5], [42, 30, 9], [-30, 40, 8], [30, 42, 9.5], [-48, 10, 10], [46, 8, 8.5]];
        palms.slice(0, q.hi ? 10 : 5).forEach(function (p, pi) { G.palm(m, p[0], p[1], p[2], 20 + pi, q); });
      }
    }
  });
})();

