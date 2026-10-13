
/* palm.js */
/* AAM journey: the date palms as they are shown. A round trunk with scaled bark, and a crown painted once, frond by frond
   and leaflet by leaflet, that turns to face the viewer. They stand on the live layer, so they keep true depth against
   the photographed plates. */
(function () {
  'use strict';
  var T = THREE, AAM = window.AAM, M = AAM.M, W = AAM.world;
  var SIZE = 512, PXM = 51, CY = 306;   // crown picture: pixels a side, pixels per metre, and the row the trunk top sits on

  function rgb(a, b, t) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * t) + ',' + Math.round(a[1] + (b[1] - a[1]) * t) + ',' + Math.round(a[2] + (b[2] - a[2]) * t) + ')'; }

  // one crown, lit by a low sun from the left; seed changes the arrangement of the fronds
  W.palmCrown = function (seed) {
    var c = document.createElement('canvas'), x = c.getContext('2d'), r = M.rng(seed), cx = SIZE / 2, fronds = [], i;
    c.width = c.height = SIZE;
    // Fronds all round the head, like a burst: the young ones stand in the middle, the old ones hang. A frond that
    // points toward the viewer or away is seen shortened.
    for (i = 0; i < 40; i++) {
      var a = ((i + r()) / 40 * 2 - 1) * 2.7 + (r() - 0.5) * 0.25;   // angle from straight up
      fronds.push({ a: a, L: (236 - Math.abs(a) * 22) * (0.5 + 0.5 * Math.pow(r(), 0.45)), z: r(), curl: (a < 0 ? -1 : 1) * (0.35 + 0.75 * r()) + (r() - 0.5) * 0.3 });
    }
    fronds.sort(function (p, q) { return p.z - q.z; });
    var DARK = [34, 36, 22], MID = [88, 82, 40], SUN = [206, 168, 88];
    fronds.forEach(function (f) {
      var n = Math.round(f.L / 1.6), k, pts = [[cx, CY]], dir;
      // the midrib leaves the head at its angle, stiff at first, and bows outward toward its tip
      for (k = 1; k <= n; k++) {
        var t = k / n;
        dir = f.a + f.curl * Math.pow(t, 1.7);
        pts.push([pts[k - 1][0] + Math.sin(dir) * f.L / n, pts[k - 1][1] - Math.cos(dir) * f.L / n]);
      }
      var shade = 0.4 + 0.6 * f.z;   // fronds at the back are in the shade of the head
      for (k = 6; k < n; k++) {
        var t2 = k / n, p = pts[k], tx = pts[k + 1 > n ? n : k + 1][0] - pts[k - 1][0], ty = pts[k + 1 > n ? n : k + 1][1] - pts[k - 1][1], tl = Math.hypot(tx, ty) || 1;
        tx /= tl; ty /= tl;
        // leaflets are short beside the length of the frond: it reads as a long narrow feather
        var len = 21 * Math.pow(Math.sin(Math.PI * (0.05 + 0.93 * t2)), 0.6) * (0.75 + 0.5 * r()), side;
        for (side = -1; side <= 1; side += 2) {
          var sw = (0.95 - 0.45 * t2) * side + (r() - 0.5) * 0.3, cs = Math.cos(sw), sn = Math.sin(sw);
          var dx = tx * cs - ty * sn, dy = tx * sn + ty * cs + 0.18;   // leaflets hang a little
          var dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
          // light: leaflets turned to the sun on the left catch it, and thin ones glow where it shines through
          var lit = M.clamp(0.3 + 0.4 * -dx + 0.22 * -dy + 0.34 * (r() - 0.5), 0, 1) * shade;
          x.fillStyle = lit < 0.5 ? rgb(DARK, MID, lit * 2) : rgb(MID, SUN, lit * 2 - 1);
          var ex = p[0] + dx * len, ey = p[1] + dy * len + len * 0.08, nx = -dy * 0.75, ny = dx * 0.75;
          x.beginPath();
          x.moveTo(p[0] + nx, p[1] + ny);
          x.lineTo(ex, ey);
          x.lineTo(p[0] - nx, p[1] - ny);
          x.fill();
        }
      }
      x.strokeStyle = rgb([64, 56, 28], [186, 156, 84], shade * 0.8);
      x.lineCap = 'round';
      for (k = 1; k <= n; k++) {
        x.lineWidth = 2.6 - 2.0 * k / n;
        x.beginPath(); x.moveTo(pts[k - 1][0], pts[k - 1][1]); x.lineTo(pts[k][0], pts[k][1]); x.stroke();
      }
    });
    // the head itself: the stubs of cut fronds, and bunches of dates hanging under it
    for (i = 0; i < 7; i++) {
      var fa = (r() - 0.5) * 2.4, fl = 26 + r() * 22, fx = cx + Math.sin(fa) * 14, bx = fx + Math.sin(fa) * fl, by = CY + 6 + fl * 0.9;
      x.strokeStyle = 'rgb(168,120,52)'; x.lineWidth = 1.6;
      x.beginPath(); x.moveTo(fx, CY - 2); x.quadraticCurveTo(fx + Math.sin(fa) * fl * 0.9, CY - 6, bx, by); x.stroke();
      for (var d = 0; d < 26; d++) {
        x.fillStyle = rgb([120, 70, 26], [214, 150, 58], r());
        x.beginPath(); x.arc(bx + (r() - 0.5) * 9, by + r() * 20, 1.5 + r(), 0, 7); x.fill();
      }
    }
    for (i = 0; i < 46; i++) {
      var ha = (r() - 0.5) * 3.0, hl = 8 + r() * 16;
      x.strokeStyle = rgb([58, 40, 24], [150, 112, 66], r() * (0.4 + 0.6 * (ha < 0 ? 1 : 0.4)));
      x.lineWidth = 3 + r() * 3;
      x.beginPath(); x.moveTo(cx + (r() - 0.5) * 16, CY + 8 - r() * 10); x.lineTo(cx + Math.sin(ha) * hl * 1.1 + (r() - 0.5) * 6, CY - Math.cos(ha) * hl + 4); x.stroke();
    }
    return c;
  };

  // bark: rows of old frond bases, each catching light on its upper edge
  function bark() {
    var c = document.createElement('canvas'), x = c.getContext('2d'), r = M.rng(77), i, j;
    c.width = 128; c.height = 256;
    x.fillStyle = 'rgb(58,43,30)'; x.fillRect(0, 0, 128, 256);
    for (j = -1; j < 19; j++) for (i = 0; i < 8; i++) {
      var px = i * 16 + (j % 2 ? 8 : 0), py = j * 14, v = r();
      x.fillStyle = rgb([92, 70, 46], [150, 120, 84], v);
      x.beginPath(); x.moveTo(px - 8, py + 3); x.lineTo(px, py - 4); x.lineTo(px + 8, py + 3); x.lineTo(px + 5, py + 13); x.lineTo(px - 5, py + 13); x.fill();
      x.fillStyle = 'rgba(30,20,12,0.55)'; x.fillRect(px - 6, py + 11, 12, 3);
      x.fillStyle = 'rgba(222,190,140,0.35)'; x.beginPath(); x.moveTo(px - 7, py + 3); x.lineTo(px, py - 3); x.lineTo(px + 7, py + 3); x.lineTo(px, py); x.fill();
      if (i === 0) { x.fillStyle = rgb([92, 70, 46], [150, 120, 84], v); x.beginPath(); x.moveTo(px + 120, py + 3); x.lineTo(px + 128, py - 4); x.lineTo(px + 136, py + 3); x.lineTo(px + 133, py + 13); x.lineTo(px + 123, py + 13); x.fill(); }
    }
    var t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.encoding = T.sRGBEncoding;
    t.anisotropy = AAM.maxAniso || 1;
    return t;
  }

  // list: where each palm stands and how tall its trunk is, [x, y, z, height]
  W.palmGrove = function (list) {
    var grp = new T.Group(), G = AAM.G, parts = [], mats = [], k;
    for (k = 0; k < 6; k++) {
      var map = new T.CanvasTexture(W.palmCrown(900 + (k % 3) * 17));
      map.encoding = T.sRGBEncoding;
      map.anisotropy = AAM.maxAniso || 1;
      if (k > 2) { map.wrapS = T.RepeatWrapping; map.repeat.x = -1; map.offset.x = 1; }   // the same three crowns, mirrored
      mats.push(new T.SpriteMaterial({ map: map, transparent: true, alphaTest: 0.06, depthWrite: false, color: 0xffffff }));
    }
    list.forEach(function (p, i) {
      var h = p[3] + 0.5, g = new T.CylinderGeometry(0.24, 0.34, h, 10, 1, true), uv = g.attributes.uv, j;
      for (j = 0; j < uv.count; j++) uv.setY(j, uv.getY(j) * h / 3.6);
      g.translate(p[0], p[1] + h / 2 - 0.3, p[2]);
      parts.push(g);
      var s = new T.Sprite(mats[(i * 7 + 3) % 6]), size = SIZE / PXM * (0.92 + 0.16 * ((i * 37) % 10) / 10);
      s.center.set(0.5, 1 - CY / SIZE);
      s.scale.set(size, size, 1);
      s.position.set(p[0], p[1] + p[3] + 0.1, p[2]);
      grp.add(s);
    });
    var trunks = new T.Mesh(G.merge(parts), new T.MeshStandardMaterial({ map: bark(), roughness: 1, metalness: 0, envMapIntensity: 0.4 }));
    grp.add(trunks);
    return grp;
  };
})();

