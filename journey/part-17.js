
/* journey.js */
/* AAM journey: scroll drives one camera move along the metro line; the words and the stop rail follow it. */
(function () {
  'use strict';
  var T = THREE, AAM = window.AAM, M = AAM.M, W = AAM.world;
  var lin = M.lin, sstep = M.sstep, lerp = M.lerp, clamp = M.clamp;
  function $(id) { return document.getElementById(id); }

  // ---------- content: every word on screen is edited here ----------
  // a and b are the scroll positions (0 to 1) between which a line shows; each entry is [label, headline, sentence]
  var COPY = [
    { a: -1, b: 0.03, low: true, ar: ['المملكة العربية السعودية', 'من هنا تبدأ الرحلة', 'مرّر للأسفل، وادخل الخريطة مع القطار.'], en: ['Kingdom of Saudi Arabia', 'The journey starts here', 'Scroll down and follow the train into the map.'] },
    { a: 0.1, b: 0.16, ar: ['الجذور', 'طرقٌ رسمتها القوافل', 'قبل الأبراج والسكك، كانت التجارة تعبر هذه الرمال.'], en: ['Roots', 'Routes drawn by caravans', 'Long before towers and rail, trade crossed these sands.'] },
    { a: 0.185, b: 0.275, ar: ['الدرعية', 'هنا وُضع الأساس', 'من بيوت الطين في حي الطريف بدأت حكاية الدولة.'], en: ['Diriyah', 'Where the foundation was laid', 'The story of the state began among the mud-brick houses of At-Turaif.'] },
    { a: 0.3, b: 0.42, ar: ['التحوّل', 'مدينةٌ ترتفع عن الأرض', 'الخط يصعد، والرياض تُبنى من حوله.'], en: ['Transformation', 'A city lifting off the ground', 'The line climbs, and Riyadh is built around it.'] },
    { a: 0.455, b: 0.585, ar: ['الرياض اليوم', 'أفقٌ يعرفه العالم', 'مترو الرياض يعبر قلب المدينة بين أبراجها.'], en: ['Riyadh today', 'A skyline the world knows', 'Riyadh Metro runs through the heart of the city, between its towers.'] },
    { a: 0.615, b: 0.75, ar: ['الأعمال', 'حيث تُتخذ القرارات', 'عاصمةٌ تجمع الشركات ورؤوس الأموال.'], en: ['Business', 'Where decisions are made', 'A capital that gathers companies and investors.'] },
    { a: 0.78, b: 0.91, ar: ['الاستثمار', 'المحطة التالية: الفرصة', 'في المركز المالي يلتقي الخط بمستقبل الاستثمار.'], en: ['Investment', 'Next stop: opportunity', 'At the financial district, the line meets the future of investment.'] },
    { a: 0.94, b: 2, ar: ['عام الأعمال للاستثمار', 'نكمل الطريق معك', 'من الفرصة إلى الإنجاز، تبدأ خطوتك التالية مع عام الأعمال.'], en: ['Aam Al Aamal Investment', 'We go the rest of the way with you', 'From opportunity to achievement. Your next step starts with Aam Al Aamal.'] }
  ];
  // s is metres along the line, lat is metres to the right of it (negative is left)
  var PLACES = [
    { id: 'diriyah', s: 250, lat: -66, yaw: 0.95, scale: 1.25, reveal: false, H: 24 },   // At-Turaif, Diriyah
    { id: 'faisaliah', s: 1150, lat: 200, yaw: 0.5, H: 267 },                             // Al Faisaliah Tower, 267 m
    { id: 'kingdom', s: 1700, lat: -230, yaw: 0.55, H: 302 },                             // Kingdom Centre, 302 m
    { id: 'kafd', s: 2440, lat: 330, yaw: -0.35, H: 385 }                                 // KAFD, PIF Tower 385 m
  ];
  // How each landmark is lit after dark, by material: mostly dark glass with some floors still on, and the lighting
  // each one is known for (Kingdom Centre's outlined opening, Al Faisaliah's glowing globe and white frame)
  var NIGHTS = {
    kingdom: { glass: { color: '#16263c', emissive: '#ffdcae', map: 'lit2', i: 0.75 }, glassTop: { color: '#1a2e48' }, rim: { color: '#0c3a20', emissive: '#19e078', i: 0.95 }, podGlass: { emissive: '#ffd9a0', map: 'lit1', i: 0.8 } },
    faisaliah: { louver: { color: '#4b5562', emissive: '#ffe2b4', map: 'lit1', i: 0.9 }, dark: { emissive: '#ffe9c8', i: 0.1 }, white: { emissive: '#fff1dc', i: 0.32 }, beam: { emissive: '#fff4e4', i: 0.3 }, sphere: { emissive: '#ffb84a', map: 'faSphere', i: 0.75 }, steel: { emissive: '#fff4e4', i: 0.5 }, gold: { emissive: '#ffc86a', i: 0.35 } },
    kafd: { ga: { color: '#243a54', emissive: '#ffe2b4', map: 'lit2', i: 0.8 }, gb: { color: '#1b2b40', emissive: '#ffe2b4', map: 'lit2', i: 0.8 }, gc: { color: '#2c4058', emissive: '#ffe2b4', map: 'lit2', i: 0.8 } }
  };
  var STOPS = [
    { p: 0, ar: 'الخريطة', en: 'The map' }, { p: 0.15, ar: 'القافلة', en: 'The caravan' }, { p: 0.23, ar: 'الدرعية', en: 'Diriyah' }, { p: 0.39, ar: 'التحوّل', en: 'Transformation' },
    { p: 0.51, ar: 'الفيصلية', en: 'Al Faisaliah' }, { p: 0.665, ar: 'المملكة', en: 'Kingdom Centre' }, { p: 0.84, ar: 'المالية', en: 'KAFD' }, { p: 0.97, ar: 'الختام', en: 'The next chapter' }
  ];
  var TEXT = {
    ar: { brand: 'عام الأعمال للاستثمار', proto: 'نموذج تفاعلي أولي', play: 'تشغيل تلقائي', stop: 'إيقاف', full: 'جودة كاملة', light: 'نسخة خفيفة', other: 'EN', note: 'هنا ينتهي المقطع الواقعي التجريبي. ما بعده بالمجسمات السابقة إلى أن يُستكمل.' },
    en: { brand: 'Aam Al Aamal Investment', proto: 'First interactive prototype', play: 'Autoplay', stop: 'Stop', full: 'Full quality', light: 'Light version', other: 'عربي', note: 'The photoreal trial segment ends here. What follows still uses the earlier models.' }
  };

  // ---------- look ----------
  var DUSK = { top: '#0c1c4a', mid: '#5f79a6', hor: '#f3b57e', fog: '#dfa877', sun: '#ffb36e', sunI: 2.7, hs: '#9fb4e0', hg: '#a37a52', hi: 0.72, glow: 1, dens: 0.0036, bloom: 0.32 };
  var NIGHT = { top: '#00040f', mid: '#04153c', hor: '#0e3266', fog: '#0b2452', sun: '#86a5ee', sunI: 0.34, hs: '#2a4484', hg: '#070b16', hi: 0.6, glow: 0, dens: 0.0009, bloom: 0.5 };
  var SUN = new T.Vector3(-0.42, 0.2, -0.885).normalize();
  var SIDE = 5.2;   // metres the camera rides to the left of the train

  var externalProgress=0;
  function tell(type,value){parent.postMessage({aamJourney:true,type:type,value:value},location.origin)}
  addEventListener('message',function(e){if(e.origin!==location.origin||e.source!==parent||!e.data?.aamJourney)return;if(e.data.type==='progress')externalProgress=clamp(Number(e.data.value)||0,0,1);});
  var stage, scroller, journeyEl, renderer, scene, camera, composer = null, bloom = null;
  var sky, stars, sun, hemi, wall, train, opp, traffic, city;
  var lang = 'ar', light = false, reduce = false, prog = 0, time = 0, last = 0, playing = 0;
  var geom = { d0: 45, fov: 46, turn: 1, w: 1, h: 1 }, sCam, gapF, chapters = [], stops = [], envMats = [], envF = -1, blobs = [], grove;
  var cam = new T.Vector3(), look = new T.Vector3(), _c1 = new T.Color(), _c2 = new T.Color(), shadowAt = new T.Vector3(1e9, 0, 0);

  // smooth curve through [p, value] pairs that never overshoots
  function curve(keys) {
    var n = keys.length, d = [], m = [], i;
    for (i = 0; i < n - 1; i++) d[i] = (keys[i + 1][1] - keys[i][1]) / (keys[i + 1][0] - keys[i][0]);
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]);
    return function (p) {
      if (p <= keys[0][0]) return keys[0][1];
      if (p >= keys[n - 1][0]) return keys[n - 1][1];
      var k = 0;
      while (p > keys[k + 1][0]) k++;
      var h = keys[k + 1][0] - keys[k][0], t = (p - keys[k][0]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * keys[k][1] + (t3 - 2 * t2 + t) * h * m[k] + (3 * t2 - 2 * t3) * keys[k + 1][1] + (t3 - t2) * h * m[k + 1];
    };
  }
  function keys() {
    sCam = curve([[0, -geom.d0], [0.11, 0], [0.17, 62], [0.27, 250], [0.36, 560], [0.46, 900], [0.56, 1150], [0.7, 1700], [0.87, 2440], [1, 2650]]);
  }
  // how far the tail of the train runs ahead of the camera: it comes from behind, passes underneath and leads the way in
  gapF = curve([[0, -175], [0.035, -88], [0.085, 8], [0.115, 26], [0.2, 20], [1, 22]]);

  // ---------- landmarks ----------
  // A landmark first shows as contour lines every 7.5 m, then fills in from the ground up behind a bright edge
  function patchReveal(mat, U, plain) {
    mat.onBeforeCompile = function (sh) {
      sh.uniforms.uCut = U.cut; sh.uniforms.uGhost = U.ghost; sh.uniforms.uLine = U.line; sh.uniforms.uEdge = U.edge;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying float vRY;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvRY = (modelMatrix * vec4(transformed, 1.0)).y;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nvarying float vRY;\nuniform float uCut;\nuniform float uGhost;\nuniform float uLine;\nuniform vec3 uEdge;')
        .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + (plain ? 'float rvUp = 0.0;\nfloat rvW = 1.0;\nfloat rvF = 10.0;\nif (vRY > uCut) discard;' : [
          'float rvUp = step(uCut, vRY);',
          'float rvW = max(0.14, fwidth(vRY) * 0.75);',
          'float rvF = abs(fract(vRY / 7.5) - 0.5) * 7.5;',
          'if (rvUp > 0.5) {',
          '  float rvN = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));',
          '  if (rvF > rvW || rvN > uGhost) discard;',
          '}'
        ].join('\n')))
        .replace('#include <tonemapping_fragment>', 'gl_FragColor.rgb = mix(gl_FragColor.rgb + uEdge * (smoothstep(uCut - 6.0, uCut, vRY) * 1.5 + (1.0 - smoothstep(rvW * 0.5, rvW, rvF)) * uLine), uEdge * 0.9, rvUp);\n#include <tonemapping_fragment>');
    };
  }
  function buildPlace(P, q) {
    var L = AAM.byId[P.id], m = new AAM.Model(q), sc = P.scale || 1;
    L.build(m, q);
    var grp = m.finish();
    P.U = P.reveal === false ? null : { cut: { value: -5 }, ghost: { value: 1 }, line: { value: 0.3 }, edge: { value: lin('#4bb79b') } };
    grp.traverse(function (o) {
      if (!o.isMesh || !o.userData.desc) return;
      var night = NIGHTS[P.id] && NIGHTS[P.id][o.userData.key];
      if (night) o.userData.desc.night = night;
      o.material = AAM.makeMat(o.userData.desc, 'night', 0.8);
      // Clear-coated glazing keeps the architectural surfaces reflective at grazing angles.
      if(o.material.isMeshStandardMaterial && /glass|ga|gb|gc/.test(o.userData.key||'')){
        var physical=new T.MeshPhysicalMaterial();T.MeshStandardMaterial.prototype.copy.call(physical,o.material);
        physical.clearcoat=.6;physical.clearcoatRoughness=.18;physical.roughness=Math.min(.3,physical.roughness);o.material.dispose();o.material=physical;
      }
      // only what stands in the desert is reached by the sun's shadow map
      o.castShadow = o.receiveShadow = !P.U && o.userData.desc.shadow !== false;
      if (P.U) patchReveal(o.material, P.U, !!o.userData.desc.alphaTest);
    });
    grp.position.set(P.x, 0, P.z);
    grp.rotation.y = P.yaw;
    grp.scale.setScalar(sc);
    P.grp = grp;
    P.r = P.reveal === false ? 1 : 0;
    return grp;
  }

  // ---------- frame ----------
  // Where the camera sits (cam) and what it looks at (look) when it is s metres along the line.
  // It crosses the wall at Riyadh's place on the map, then drops beside the train so its lit flank shows.
  // d0 is how far out the journey starts, turn how strongly it swings toward a landmark.
  function rig(s, d0, turn) {
    var on = W.TRK * sstep(-d0 * 0.9, 0, s), lat = on - SIDE * sstep(4, 80, s), att = 0, lift = 0;
    PLACES.forEach(function (P) {
      var w = P.reveal === false ? sstep(P.s - 190, P.s - 100, s) * (1 - sstep(P.s - 35, P.s + 12, s)) : sstep(P.s - 1250, P.s - 880, s) * (1 - sstep(P.s - 320, P.s - 80, s));
      att += (P.lat > 0 ? 1 : -1) * w * (P.reveal === false ? 17 : 13) * turn;
      if (P.reveal !== false) lift += w * 12;
    });
    W.pt(s, lat, 0, cam);
    cam.y = lerp(wall.riyadh.y, W.railY(s) + 5.3 + 0.5 * sstep(400, 900, s), sstep(3, 75, s));
    W.pt(s + 70, on + att, 0, look);
    look.y = lerp(cam.y - 4.4, W.railY(s + 70) + 3 + lift, sstep(-6, 70, s));
  }
  function setCamera(p) {
    var s = sCam(p);
    rig(s, geom.d0, geom.turn);
    // Wider, elevated tracking shots keep each modern landmark in view at its named stop.
    PLACES.filter(function(P){return P.s>1500}).forEach(function(P){
      var w=sstep(P.s-520,P.s-230,s)*(1-sstep(P.s+30,P.s+200,s));
      if(w>0){var from=new T.Vector3(),to=new T.Vector3();var portrait=geom.w/geom.h<.8;W.pt(s-(portrait?520:400),P.lat>0?-65:65,0,from);from.y=W.railY(s)+105;W.pt(P.s,P.lat*(portrait?.9:.45),0,to);to.y=145;
      cam.lerp(from,w);look.lerp(to,w);}
    });
    if (!reduce) {
      cam.x += 0.1 * Math.sin(time * 0.5);
      cam.y += 0.07 * Math.sin(time * 0.37 + 1);
    }
    camera.position.copy(cam);
    camera.lookAt(look);
    return s;
  }
  // eye is the camera position the light and sky are set up around; the journey camera unless a key frame is being made
  function setLight(s, eye) {
    var n = sstep(330, 880, s), u = sky.u;
    eye = eye || camera.position;
    function mix(a, b) { return _c1.set(a).lerp(_c2.set(b), n); }
    scene.fog.color.copy(mix(DUSK.fog, NIGHT.fog));
    scene.fog.density = lerp(DUSK.dens, NIGHT.dens, sstep(40, 820, s));
    u.uLow.value.copy(scene.fog.color);
    u.uHor.value.copy(mix(DUSK.hor, NIGHT.hor));
    u.uMid.value.copy(mix(DUSK.mid, NIGHT.mid));
    u.uTop.value.copy(mix(DUSK.top, NIGHT.top));
    u.uGlow.value = lerp(DUSK.glow, NIGHT.glow, n);
    sun.color.copy(lin(DUSK.sun)).lerp(lin(NIGHT.sun), n);
    sun.intensity = lerp(DUSK.sunI, NIGHT.sunI, n);
    hemi.color.copy(lin(DUSK.hs)).lerp(lin(NIGHT.hs), n);
    hemi.groundColor.copy(lin(DUSK.hg)).lerp(lin(NIGHT.hg), n);
    hemi.intensity = lerp(DUSK.hi, NIGHT.hi, n);
    stars.material.opacity = n * 0.9;
    // reflections come from a dusk sky, so they fade with the daylight
    var ef = Math.round(lerp(1, 0.3, n) * 50) / 50;
    if (ef !== envF) { envF = ef; envMats.forEach(function (m) { m.envMapIntensity = m.userData.env * ef; }); }
    if (bloom) bloom.strength = lerp(DUSK.bloom, NIGHT.bloom, n);
    sky.mesh.position.copy(eye);
    stars.position.copy(eye);
    wall.grp.visible = s < 4;
  }
  function setPlaces(s) {
    PLACES.forEach(function (P) {
      if (!P.U) return;
      P.r = 1 - sstep(950, 1500, P.s - s);
      P.U.cut.value = P.r >= 1 ? 1e5 : (P.r <= 0 ? -5 : P.r * (P.H + 14));
      P.U.line.value = 0.3 * (1 - sstep(0.8, 1, P.r));   // the drawn lines leave once the building is whole
    });
  }
  // The low sun throws long shadows. The shadow map follows the camera through the desert and rests once night has fallen.
  function setShadow(s, eye) {
    if (light || s > 950) return;
    eye = eye || camera.position;
    sun.target.position.set(Math.round(eye.x / 8) * 8, 0, Math.round((eye.z - 100) / 8) * 8);
    sun.position.copy(sun.target.position).addScaledVector(SUN, 420);
    sun.target.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
  }
  function setCopy(p) {
    chapters.forEach(function (c) {
      var o = sstep(c.C.a, c.C.a + 0.022, p) * (1 - sstep(c.C.b, c.C.b + 0.022, p));
      c.el.style.opacity = o.toFixed(3);c.el.setAttribute('aria-hidden',o<.15?'true':'false');
      c.el.style.transform = 'translate3d(0,' + ((1 - sstep(c.C.a, c.C.a + 0.03, p)) * 22 - sstep(c.C.b, c.C.b + 0.03, p) * 14).toFixed(1) + 'px,0)';
    });
    var cur = 0;
    stops.forEach(function (st, i) { if (p >= st.S.p - 0.03) cur = i; });
    stops.forEach(function (st, i) { st.el.classList.toggle('on', i === cur);st.el.setAttribute('aria-current',i===cur?'step':'false'); st.el.classList.toggle('done', i < cur); });
    $('line').style.setProperty('--p', (cur / (stops.length - 1) * 100).toFixed(2) + '%');
    $('hint').style.opacity = (1 - sstep(0.01, 0.04, p)).toFixed(2);
  }
  function frame(p) {
    $('logo-gate').style.opacity=sstep(.94,.985,p);$('copy').style.opacity=1-sstep(.94,.975,p);
    var s = setCamera(p);
    setLight(s);
    setPlaces(s);
    train.place(s + gapF(p) + train.len);
    var lead = s + 2.4 * (1400 - s);
    opp.grp.visible = lead - s > -160 && lead - s < 1900;
    if (opp.grp.visible) opp.place(lead);
    traffic.update(time);
    city.beacons.material.opacity = 0.55 + 0.45 * Math.sin(time * 2.4);
    setShadow(s);
    setCopy(p);
    var m = skinMix(s);
    // over a photographed plate the train has no cast shadow of its own, so a soft one travels with it
    blobs.forEach(function (b) { b.visible = m > 0; b.material.opacity = 0.62 * m; });
    if (skinReady()) {
      var end = skin.keys[skin.keys.length - 1].s;
      $('note').style.opacity = (sstep(end + 20, end + 60, s) * (1 - sstep(end + 170, end + 240, s))).toFixed(2);
    }
    if (!(m > 0 && skinRender(s, m))) { if (composer) composer.render(); else renderer.render(scene, camera); }
  }

  // ---------- photoreal skin ----------
  // Key frames: from camera positions along the journey the standing world is rendered clean, turned into a
  // photograph-like image, and laid back over the 3D scene from that same position. Every pixel finds its place in the
  // world through the depth buffer, so the picture keeps true parallax; a depth map from each key position tells what
  // that key really saw. Whatever moves or glows as a line (the trains, the map wall, the route) is drawn live on top.
  var KEY = { fov: 56, w: 1376, h: 768, d0: 47 }, kcam = new T.PerspectiveCamera(KEY.fov, KEY.w / KEY.h, 0.5, 9000), skin = null;
  function depthTarget(w, h) {
    var rt = new T.WebGLRenderTarget(w, h, { format: T.RGBAFormat, encoding: T.sRGBEncoding, minFilter: T.LinearFilter, magFilter: T.LinearFilter });
    rt.depthTexture = new T.DepthTexture(w, h);
    rt.depthTexture.type = T.UnsignedIntType;
    return rt;
  }
  // under a photographed plate the towers stand whole: the drawn-line build-up belongs to the plain render only
  function solid() { PLACES.forEach(function (P) { if (P.U) { P.U.cut.value = 1e5; P.U.line.value = 0; } }); }
  // the key camera at s metres along the line, with the light as it is at that moment; aspect is the picture's width over height
  function keyView(s, aspect) {
    rig(s, KEY.d0, 1);
    kcam.aspect = aspect || KEY.w / KEY.h;
    kcam.updateProjectionMatrix();
    kcam.position.copy(cam);
    kcam.lookAt(look);
    kcam.updateMatrixWorld();
    kcam.layers.set(0);
    setLight(s, kcam.position);
    setPlaces(s);
    solid();
    setShadow(s, kcam.position);
  }
  // Depth only. Haze still decides how far the world is drawn, but with a clean edge instead of thinning it out
  // (a negative density tells the haze code so), and open building frames are closed by their stand-ins on layer 2.
  // With guard set, only the guards round the palms (layer 3) are drawn.
  function depthPass(view, target, guard) {
    var haze = scene.fog.density;
    scene.fog.density = -Math.abs(haze);
    if (guard) view.layers.set(3); else { view.layers.set(0); view.layers.enable(2); }
    renderer.setRenderTarget(target);
    renderer.render(scene, view);
    renderer.setRenderTarget(null);
    scene.fog.density = haze;
  }
  function skinSize() {
    var size = renderer.getDrawingBufferSize(new T.Vector2());
    if (skin.rt) { skin.rt.depthTexture.dispose(); skin.rt.dispose(); }
    skin.rt = depthTarget(size.x, size.y);
    skin.mat.uniforms.tColor.value = skin.rt.texture;
    skin.mat.uniforms.tDepth.value = skin.rt.depthTexture;
  }
  var QUAD_VS = 'varying vec2 vUv;\nvoid main() {\n  vUv = uv;\n  gl_Position = vec4(position.xy, 0.0, 1.0);\n}';
  // metres from the camera for a depth-buffer value (near 0.5, far 9000)
  var LIN = 'float lin(float d) { return 9000.0 / (9000.5 - (min(d, 1.0) * 2.0 - 1.0) * 8999.5); }';
  function quadScene(mat) {
    var quad = new T.Mesh(new T.PlaneGeometry(2, 2), mat), qs = new T.Scene();
    quad.frustumCulled = false;
    qs.add(quad);
    return qs;
  }
  // list: [{ s: metres along the line, src: image address, w, h: the picture's size when it is not the default,
  //          p: 1 when the picture holds palms of its own }], in order
  function skinInit(list) {
    var U = {};
    ['tColor', 'tDepth', 'tA', 'tB', 'dA', 'dB', 'mA', 'mB', 'fA', 'fB'].forEach(function (k) { U[k] = { value: null }; });
    ['uInv', 'uKA', 'uKB'].forEach(function (k) { U[k] = { value: new T.Matrix4() }; });
    U.uW = { value: new T.Vector2(1, 0) };
    U.uMix = { value: 1 };
    U.uCover = { value: 0 };   // metres along the line from which the key ahead sees the track bed
    U.uSpan = { value: 90 };   // and how far back from there its look is lent
    var mat = new T.ShaderMaterial({
      depthFunc: T.AlwaysDepth, extensions: { fragDepth: true }, uniforms: U, vertexShader: QUAD_VS,
      fragmentShader: [
        'uniform sampler2D tColor; uniform sampler2D tDepth; uniform sampler2D tA; uniform sampler2D tB; uniform sampler2D dA; uniform sampler2D dB;',
        'uniform sampler2D mA; uniform sampler2D mB; uniform sampler2D fA; uniform sampler2D fB;',
        'uniform mat4 uInv; uniform mat4 uKA; uniform mat4 uKB; uniform vec2 uW; uniform float uMix; uniform float uCover; uniform float uSpan;',
        'varying vec2 vUv;',
        LIN,
        '// the line the track follows, the same as in the scene code: sideways position and rail height at s metres',
        'float ease(float x) { x = clamp(x, 0.0, 1.0); return x * x * (3.0 - 2.0 * x); }',
        'float lineX(float s) { return 46.0 * ease((s - 300.0) / 600.0) * sin((s - 300.0) / 2300.0 * 6.2831853); }',
        'float lineY(float s) { return 2.4 + 9.6 * ease((s - 380.0) / 420.0); }',
        '// Colour a key frame holds for a point in the world, whether that key really saw the point (alpha), and how far the',
        '// key can vouch for it (sure). kf is the soft picture, two images one above the other: below, the open sky of the',
        '// picture carried across everything that stands against it; above, the picture with its own palms filled in from',
        '// around. dim is the heavily blurred picture in that direction whether the key saw the point or not: a last resort',
        '// that at least has the colours of the place.',
        'vec4 take(sampler2D ph, sampler2D kd, sampler2D km, sampler2D kf, mat4 K, vec3 wp, float sky, out float sure, out vec4 dim) {',
        '  vec4 kp = K * vec4(wp, 1.0);',
        '  vec3 k = kp.xyz / kp.w * 0.5 + 0.5;',
        '  vec2 e = smoothstep(vec2(0.0), vec2(0.03), k.xy) * smoothstep(vec2(0.0), vec2(0.03), 1.0 - k.xy);',
        '  float inside = e.x * e.y * step(0.0, kp.w);',
        '  float seen = step(lin(k.z), lin(texture2D(kd, k.xy).x) * 1.04 + 0.8);',
        '  vec2 m = texture2D(km, k.xy).xy;   // x: 0 where a palm of the picture itself is in the way, y: 1 where it shows open sky',
        '  vec2 h = vec2(k.x, clamp(k.y, 0.004, 0.996) * 0.5);',
        '  vec3 sharp = texture2D(ph, k.xy, -16.0).rgb, soft = texture2D(kf, h + vec2(0.0, 0.5 * (1.0 - sky))).rgb;',
        '  dim = vec4(texture2D(ph, k.xy, 5.5).rgb, inside);',
        '  // The sky has no depth to go by, and a picture may draw a roofline a little off. So sky is taken from the picture',
        '  // only where it shows open sky; elsewhere the sky around is used, and no outline is left hanging in the air.',
        '  sure = mix(smoothstep(0.25, 0.85, m.x), 1.0, sky);',
        '  return vec4(mix(soft, sharp, mix(sure, smoothstep(0.3, 0.9, m.y), sky)), inside * mix(seen, 1.0, sky));',
        '}',
        'void main() {',
        '  float d = texture2D(tDepth, vUv).x, sky = step(0.99999, d), sa, sb, sc;',
        '  vec4 da, db, dc;',
        '  vec4 wp = uInv * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);',
        '  wp /= wp.w;',
        '  vec4 a = take(tA, dA, mA, fA, uKA, wp.xyz, sky, sa, da);',
        '  vec4 b = take(tB, dB, mB, fB, uKB, wp.xyz, sky, sb, db);',
        '  // The track bed looks the same all along its length. The key ahead cannot see the stretch right under the camera,',
        '  // so there it lends the look of the nearest stretch it does see: rails and sleepers stay sharp and stay a double track.',
        '  float sp = -wp.z, lx = wp.x - lineX(sp), ly = wp.y - lineY(sp);',
        '  if (b.a < 0.5 && uW.y > 0.0 && abs(lx) < 4.5 && ly > -0.9 && ly < 0.5 && sp < uCover && sp > uCover - uSpan) {',
        '    float s2 = sp + ceil((uCover - sp) / 0.65) * 0.65;',
        '    vec4 c = take(tB, dB, mB, fB, uKB, vec3(lx + lineX(s2), ly + lineY(s2), -s2), 0.0, sc, dc);',
        '    if (c.a > 0.5) { b = c; sb = sc; }',
        '  }',
        '  // where only one key saw the point it carries the picture alone, and a key that is sure of a point outweighs one',
        '  // that is not; where neither saw it, the blurred picture stands in, and outside both pictures the plain render shows',
        '  float wa = a.a * (uW.x + 0.02) * (0.004 + 0.996 * sa), wb = b.a * (uW.y + 0.02) * (0.004 + 0.996 * sb);',
        '  vec3 col = (a.rgb * wa + b.rgb * wb) / max(wa + wb, 0.0001);',
        '  float qa = da.a * (uW.x + 0.02), qb = db.a * (uW.y + 0.02), whole = smoothstep(0.6, 1.0, uMix);',
        '  vec3 plain = texture2D(tColor, vUv).rgb;',
        '  vec3 under = mix(plain, (da.rgb * qa + db.rgb * qb) / max(qa + qb, 0.0001), max(da.a, db.a) * whole);',
        '  gl_FragColor = vec4(mix(plain, mix(under, col, max(a.a, b.a)), uMix), 1.0);',
        '  gl_FragDepthEXT = d;',
        '}'
      ].join('\n')
    });
    // Two things worked out once per key from its depth. x: 0 behind a palm of its own (the palm guards are drawn alone
    // into a second depth map). y: 1 where the picture shows open sky, clear of every silhouette and of its own palms.
    // Both have soft edges.
    var mask = new T.ShaderMaterial({
      depthTest: false, depthWrite: false, vertexShader: QUAD_VS,
      uniforms: { dRaw: { value: null }, dPalm: { value: null }, uAsp: { value: 1 }, uPalm: { value: 0 } },
      fragmentShader: [
        'uniform sampler2D dRaw; uniform sampler2D dPalm; uniform float uAsp; uniform float uPalm;',
        'varying vec2 vUv;',
        LIN,
        'void main() {',
        '  float d = texture2D(dRaw, vUv).x, z = lin(d), sky = step(0.99999, d), geo = 0.0;',
        '  float palm = step(lin(texture2D(dPalm, vUv).x) + 5.0, z);',
        '  for (int i = 0; i < 24; i++) {',
        '    float a = float(i) * 0.7853982, r = 0.009 * (1.0 + floor(float(i) / 8.0));   // three rings of eight',
        '    vec2 o = vec2(cos(a) / uAsp, sin(a)) * r;',
        '    geo += 1.0 - step(0.99999, texture2D(dRaw, vUv + o).x);',
        '    palm += step(lin(texture2D(dPalm, vUv + o * 0.6).x) + 5.0, z);',
        '  }',
        '  geo = smoothstep(0.0, 0.3, geo / 24.0);',
        '  palm = smoothstep(0.0, 0.5, palm / 25.0) * uPalm;',
        '  gl_FragColor = vec4(1.0 - palm, sky * (1.0 - geo) * (1.0 - palm), 0.0, 1.0);',
        '}'
      ].join('\n')
    });
    // the picture with one kind of thing left out (alpha 0 there): its smaller levels then hold only what is around it
    var fill = new T.ShaderMaterial({
      depthTest: false, depthWrite: false, vertexShader: QUAD_VS,
      uniforms: { tPh: { value: null }, tMask: { value: null }, uCh: { value: new T.Vector2(1, 0) } },
      fragmentShader: 'uniform sampler2D tPh; uniform sampler2D tMask; uniform vec2 uCh;\nvarying vec2 vUv;\nvoid main() {\n  float v = smoothstep(0.55, 0.98, dot(texture2D(tMask, vUv).xy, uCh));\n  gl_FragColor = vec4(texture2D(tPh, vUv).rgb * v, v);\n}'
    });
    // and what is around pulled across those gaps, finest level first: the sky image below, the palm image above
    var pull = new T.ShaderMaterial({
      depthTest: false, depthWrite: false, vertexShader: QUAD_VS, uniforms: { tSky: { value: null }, tPalm: { value: null } },
      fragmentShader: [
        'uniform sampler2D tSky; uniform sampler2D tPalm;',
        'varying vec2 vUv;',
        'void main() {',
        '  vec2 uv = vec2(vUv.x, fract(vUv.y * 2.0));',
        '  vec4 a = texture2D(tSky, uv, -16.0), b = texture2D(tPalm, uv, -16.0);',
        '  for (int i = 1; i < 10; i++) {',
        '    a += (1.0 - a.a) * texture2D(tSky, uv, float(i) - 1.0);',
        '    b += (1.0 - b.a) * texture2D(tPalm, uv, float(i) - 1.0);',
        '  }',
        '  vec4 c = vUv.y < 0.5 ? a : b;',
        '  gl_FragColor = vec4(c.rgb / max(c.a, 0.004), 1.0);',
        '}'
      ].join('\n')
    });
    skin = { mat: mat, qs: quadScene(mat), qc: new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), rt: null, clock: 0, mask: mask, ms: quadScene(mask), fill: fill, fs: quadScene(fill), pull: pull, ps: quadScene(pull), tmp: depthTarget(688, 384) };
    skin.keys = list.map(function (K) {
      var k = { s: K.s, aspect: (K.w || KEY.w) / (K.h || KEY.h), palms: !!K.p, img: new Image(), vp: new T.Matrix4(), rt: null, sure: null, soft: null, tex: null, loaded: false, used: 0 };
      k.img.onload = function () { k.loaded = true; };
      k.img.src = K.src;
      return k;
    });
    skinSize();
  }
  // the opening can show as soon as its first two pictures are in
  function skinReady() { return !!skin && skin.keys[0].loaded && skin.keys[Math.min(1, skin.keys.length - 1)].loaded; }
  function drop(k) {
    k.tex.dispose(); k.rt.depthTexture.dispose(); k.rt.dispose(); k.sure.dispose(); k.soft.dispose();
    k.tex = k.rt = k.sure = k.soft = null;
  }
  // the picture of key k with the part the mask marks left out, as a target whose small levels hold only the rest
  function gapsOf(k, x, y) {
    var rt = new T.WebGLRenderTarget(1024, 512, { format: T.RGBAFormat, minFilter: T.LinearMipmapLinearFilter, magFilter: T.LinearFilter, depthBuffer: false, generateMipmaps: true }), fu = skin.fill.uniforms;
    fu.tPh.value = k.tex; fu.tMask.value = k.sure.texture; fu.uCh.value.set(x, y);
    renderer.setRenderTarget(rt);
    renderer.render(skin.fs, skin.qc);
    return rt;
  }
  // A key is made ready the first time the journey comes near it: its picture goes to the graphics card and the world is
  // rendered once from its position for depth. Only a handful are held at a time; the one left longest unused is let go.
  function ensure(k) {
    k.used = ++skin.clock;
    if (k.tex || !k.loaded) return false;
    k.tex = new T.Texture(k.img);
    k.tex.minFilter = T.LinearMipmapLinearFilter;   // the small levels are the blurred picture used as a last resort
    k.tex.needsUpdate = true;
    k.rt = depthTarget(688, 384);
    keyView(k.s, k.aspect);
    k.vp.multiplyMatrices(kcam.projectionMatrix, kcam.matrixWorldInverse);
    depthPass(kcam, k.rt);
    depthPass(kcam, skin.tmp, true);
    k.sure = new T.WebGLRenderTarget(344, 192, { format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
    var mu = skin.mask.uniforms, pu = skin.pull.uniforms;
    mu.dRaw.value = k.rt.depthTexture; mu.dPalm.value = skin.tmp.depthTexture; mu.uAsp.value = k.aspect; mu.uPalm.value = k.palms ? 1 : 0;
    renderer.setRenderTarget(k.sure);
    renderer.render(skin.ms, skin.qc);
    var sky = gapsOf(k, 0, 1), palm = k.palms ? gapsOf(k, 1, 0) : sky;
    k.soft = new T.WebGLRenderTarget(512, 512, { format: T.RGBAFormat, minFilter: T.LinearFilter, magFilter: T.LinearFilter, depthBuffer: false });
    pu.tSky.value = sky.texture; pu.tPalm.value = palm.texture;
    renderer.setRenderTarget(k.soft);
    renderer.render(skin.ps, skin.qc);
    renderer.setRenderTarget(null);
    sky.dispose();
    if (palm !== sky) palm.dispose();
    var held = skin.keys.filter(function (o) { return o.tex; }).sort(function (x, y) { return x.used - y.used; });
    if (held.length > 5) drop(held[0]);
    return true;
  }
  // Two keys further apart than this are not blended into each other: the plain render carries the stretch between them.
  var REACH = 200;
  // the pair of keys around s metres: the one behind and the one ahead
  function skinPair(s) {
    var K = skin.keys, i = 0;
    while (i < K.length - 2 && s > K[i + 1].s) i++;
    return { i: i, A: K[i], B: K[Math.min(i + 1, K.length - 1)] };
  }
  // how much of the picture the key frames carry at this point of the journey: all of it between keys that reach each other
  function skinMix(s) {
    if (!skinReady()) return 0;
    var P = skinPair(s), out = 1 - sstep(P.A.s + 8, P.A.s + 60, s);
    if (s >= P.B.s) return 1 - sstep(P.B.s + 8, P.B.s + 60, s);
    return P.B.s - P.A.s <= REACH ? 1 : Math.max(out, sstep(P.B.s - 60, P.B.s - 8, s));
  }
  // returns false when the keys around this point are not in yet, and the plain render should be shown instead
  function skinRender(s, m) {
    var K = skin.keys, P = skinPair(s), i = P.i, A = P.A, B = P.B, u = skin.mat.uniforms, made = ensure(A);
    made = ensure(B) || made;
    made = ensure(K[Math.min(i + 2, K.length - 1)]) || made;
    // making a key ready moves the light and the sky to its position, so they are put back for the viewer
    if (made) { setLight(s); setPlaces(s); setShadow(s); }
    // across a stretch with no keys, each end is carried by its own key alone
    if (B.s - A.s > REACH) { if (s < (A.s + B.s) / 2) B = A; else A = B; }
    if (!A.tex) return false;
    if (!B.tex) B = A;
    // the key ahead takes over early: it saw what lies ahead from closer, so it is the sharper of the two
    var t = A === B ? 0 : sstep(0.05, 0.35, (s - A.s) / (B.s - A.s));
    if (m >= 1) {
      // the plates carry the whole picture, so the render underneath only has to supply depth
      solid();
      depthPass(camera, skin.rt);
    } else {
      camera.layers.set(0);
      renderer.setRenderTarget(skin.rt);
      renderer.render(scene, camera);
      renderer.setRenderTarget(null);
    }
    u.uInv.value.multiplyMatrices(camera.matrixWorld, camera.projectionMatrixInverse);
    u.tA.value = A.tex; u.dA.value = A.rt.depthTexture; u.mA.value = A.sure.texture; u.fA.value = A.soft.texture; u.uKA.value.copy(A.vp);
    u.tB.value = B.tex; u.dB.value = B.rt.depthTexture; u.mB.value = B.sure.texture; u.fB.value = B.soft.texture; u.uKB.value.copy(B.vp);
    u.uW.value.set(1 - t, t);
    u.uMix.value = m;
    u.uCover.value = B.s + 20;
    u.uSpan.value = Math.max(90, B.s - A.s + 70);
    renderer.render(skin.qs, skin.qc);
    // the live layer goes over the picture, against the same depth
    camera.layers.set(1);
    renderer.autoClear = false;
    renderer.render(scene, camera);
    renderer.autoClear = true;
    camera.layers.set(0);
    camera.layers.enable(1);
    return true;
  }

  // ---------- scroll ----------
  function maxScroll() { return Math.max(1, journeyEl.offsetHeight - scroller.clientHeight); }
  function target() { return externalProgress; }
  var lastDraw=0;
  function tick(now) {
    requestAnimationFrame(tick);
    if(document.hidden||now-lastDraw<(light?50:33))return;
    lastDraw=now;
    var dt = Math.min(0.1, (now - last) / 1000 || 0);
    last = now;
    time += dt;
    if (playing) {
      tell('advance',dt/36);
      if (target() >= 1) {setPlay(false);tell('skip',1);}
    }
    var tg = target();
    prog = reduce ? tg : prog + (tg - prog) * (1 - Math.exp(-dt * 6));
    if (Math.abs(tg - prog) < 0.00003) prog = tg;
    if(document.hidden||externalProgress>=1&&Math.abs(prog-1)<.0001)return;
    frame(prog);
  }
  function setPlay(on) {
    playing = on ? 1 : 0;
    $('play').textContent = TEXT[lang][on ? 'stop' : 'play'];
    $('play').setAttribute('aria-pressed', String(!!on));
  }

  // ---------- size and quality ----------
  function resize() {
    var w = stage.clientWidth, h = window.innerHeight;
    if (!w || !h) return;
    scroller.style.setProperty('--vh', h + 'px');
    geom.w = w; geom.h = h;
    var ratio = Math.min(window.devicePixelRatio || 1, light ? 1.25 : 1.75);
    renderer.setPixelRatio(ratio);
    renderer.setSize(w, h, false);
    if (composer) { composer.setPixelRatio(ratio); composer.setSize(w, h); }
    if (skin) skinSize();
    var asp = w / h;
    geom.fov = asp < 0.8 ? 54 : (asp < 1.25 ? 52 : 46);   // never taller than the key frames, which cover 56 degrees
    geom.turn = asp < 0.8 ? 1.2 : (asp < 1.25 ? 1.1 : 1);   // a tall screen sees less to each side, so the camera turns a little further toward a landmark
    camera.aspect = asp;
    camera.fov = geom.fov;
    camera.updateProjectionMatrix();
    geom.d0 = Math.max(W.mapBox.h / 0.56, W.mapBox.w / (0.84 * asp)) / (2 * Math.tan(geom.fov * Math.PI / 360));
    keys();
  }
  function setBloom() {
    if(bloom&&bloom.dispose)bloom.dispose();if(composer){composer.renderTarget1?.dispose();composer.renderTarget2?.dispose();}composer = null; bloom = null;
    if (light || !T.EffectComposer || !T.RenderPass || !T.UnrealBloomPass) return;
    try {
      var size = renderer.getDrawingBufferSize(new T.Vector2()), opt = { format: T.RGBAFormat, encoding: T.sRGBEncoding, minFilter: T.LinearFilter, magFilter: T.LinearFilter };
      var rt = renderer.capabilities.isWebGL2 && T.WebGLMultisampleRenderTarget ? new T.WebGLMultisampleRenderTarget(size.x, size.y, opt) : new T.WebGLRenderTarget(size.x, size.y, opt);
      composer = new T.EffectComposer(renderer, rt);
      composer.addPass(new T.RenderPass(scene, camera));
      bloom = new T.UnrealBloomPass(new T.Vector2(geom.w, geom.h), 0.5, 0.5, 0.86);
      if (bloom.basic) bloom.basic.toneMapped = false;
      composer.addPass(bloom);
    } catch (err) {
      composer = null; bloom = null;
    }
  }
  function setTier(l) {
    light = l;
    $('tier').textContent = TEXT[lang][light ? 'full' : 'light'];
    renderer.shadowMap.enabled = !light;
    setBloom();
    resize();
  }

  // ---------- interface ----------
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; }
  function setLang(l) {
    lang = l;
    var t = TEXT[lang], root = document.documentElement;
    root.lang = lang;
    root.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.querySelectorAll('[data-t]').forEach(function (e) { var k = e.getAttribute('data-t'); if (t[k]) e.textContent = t[k]; });
    document.querySelectorAll('[data-ar]').forEach(function (e) { e.textContent = e.getAttribute('data-' + lang); });
    $('lang').textContent = t.other;
    $('tier').textContent = t[light ? 'full' : 'light'];
    $('play').textContent = t[playing ? 'stop' : 'play'];
    chapters.forEach(function (c) { var x = c.C[lang]; c.k.textContent = x[0]; c.h.textContent = x[1]; c.s.textContent = x[2]; });
    stops.forEach(function (s) { s.t.textContent = s.S[lang]; s.el.setAttribute('aria-label', s.S[lang]); });
  }
  function buildUI() {
    COPY.forEach(function (C, i) {
      var c = el('div', 'ch' + (C.low ? ' low' : '')), k = el('p', 'eyebrow'), h = el(i ? 'h2' : 'h1'), s = el('p', 'sub');
      c.appendChild(k); c.appendChild(h); c.appendChild(s);
      $('copy').appendChild(c);
      chapters.push({ C: C, el: c, k: k, h: h, s: s });
    });
    STOPS.forEach(function (S, index) {
      var b = el('button', 'stop'), t = el('span');
      b.type = 'button';
      b.appendChild(el('i'));
      b.appendChild(t);
      b.style.setProperty('--stop-index', index);
      b.dataset.number = String(index + 1).padStart(2, '0');
      b.addEventListener('click', function () { setPlay(false); tell('goto',S.p); });
      $('line').appendChild(b);
      stops.push({ S: S, el: b, t: t });
    });
    $('skip').addEventListener('click',function(){setPlay(false);tell('skip',1)});
    $('lang').addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar'); });
    $('tier').addEventListener('click', function () { setTier(!light); });
    $('play').addEventListener('click', function () {
      if (!playing && target() > 0.985) tell('goto',0);
      setPlay(!playing);
    });
    ['wheel', 'touchstart', 'keydown'].forEach(function (ev) { scroller.addEventListener(ev, function () { if (playing) setPlay(false); }, { passive: true }); });
    // film grain: one small tile of noise, repeated over the stage
    var gc = document.createElement('canvas'), gx, gd, gi;
    gc.width = gc.height = 160;
    gx = gc.getContext('2d');
    gd = gx.createImageData(160, 160);
    for (gi = 0; gi < gd.data.length; gi += 4) { gd.data[gi] = gd.data[gi + 1] = gd.data[gi + 2] = Math.random() * 255; gd.data[gi + 3] = 255; }
    gx.putImageData(gd, 0, 0);
    $('grain').style.backgroundImage = 'url(' + gc.toDataURL() + ')';
  }

  // ---------- start ----------
  // Haze is a different colour from the sky behind it, so anything fully hazed would still show as a flat shape.
  // Past 86% haze a surface is thinned out instead, and what is far away dissolves into the sky.
  // A depth pass asks for a clean edge in place of the thinning by giving the haze a negative density (the amount of haze is the same).
  T.ShaderChunk.fog_fragment = T.ShaderChunk.fog_fragment.replace(/gl_FragColor\.rgb = mix\(/, 'if (fogFactor > (fogDensity < 0.0 ? 0.93 : 0.86 + 0.14 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))))) discard;\n\tgl_FragColor.rgb = mix(');

  function build() {
    var q = { lod: light ? 1 : 0 };
    q.hi = q.lod === 0; q.mid = q.lod <= 1; q.seg = [1, 0.5, 0.25][q.lod];
    q.n = function (v) { return Math.max(3, Math.round(v * q.seg)); };

    scene = new T.Scene();
    scene.fog = new T.FogExp2(0xffffff, 0.001);
    camera = new T.PerspectiveCamera(46, 1, 0.5, 9000);
    var pm = new T.PMREMGenerator(renderer), env = new T.CanvasTexture(W.envCanvas());
    env.mapping = T.EquirectangularReflectionMapping;
    env.encoding = T.sRGBEncoding;
    scene.environment = pm.fromEquirectangular(env).texture;
    pm.dispose();

    sun = new T.DirectionalLight(0xffffff, 1);
    sun.position.set(23, 1, -36).addScaledVector(SUN, 220);
    sun.target.position.set(23, 1, -36);
    sun.castShadow = true;
    sun.shadow.mapSize.set(light?1024:2048, light?1024:2048);
    // the sun is low, so a shallow box across its direction already covers some 300 m of ground around the camera
    var sc = sun.shadow.camera;
    sc.left = -150; sc.right = 150; sc.top = 75; sc.bottom = -60; sc.near = 20; sc.far = 900;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.08;
    scene.add(sun);
    scene.add(sun.target);
    hemi = new T.HemisphereLight(0xffffff, 0x888888, 1);
    scene.add(hemi);

    sky = W.sky();
    sky.u.uSunDir.value.copy(SUN);
    sky.u.uSun.value.set('#ffb46a');
    scene.add(sky.mesh);
    stars = W.stars();
    scene.add(stars);

    // where things stand, so the ground can be levelled under them before it is built
    var avoid = [], low = [], v = new T.Vector3();
    PLACES.forEach(function (P) {
      W.pt(P.s, P.lat, 0, v);
      P.x = v.x; P.z = v.z;
      if (P.reveal === false) W.flats.push([P.x, -P.z, 84]);
      else { avoid.push([P.x, P.z, P.id === 'kafd' ? 265 : 130]); low.push([P.s, P.lat > 0 ? 1 : -1, Math.abs(P.lat)]); }
    });
    W.flats.push([24, 36, 14]);
    [[62, 520], [-78, 640], [96, 760]].forEach(function (c) { W.pt(c[1], c[0], 0, v); W.flats.push([v.x, -v.z, 34]); avoid.push([v.x, v.z, 60]); });

    wall = W.wall();
    scene.add(wall.grp);
    scene.add(W.ground());
    scene.add(W.track(q));
    scene.add(W.station(2262, 2400));
    scene.add(W.caravan(q));
    // The old palm models stay only to cast their shadows; what is seen of a palm is drawn by the grove below.
    var palms = W.palms(q), ghost = [];
    palms.traverse(function (o) { if (o.isMesh) { o.material = AAM.makeMat(o.userData.desc, 'real', 0.6); o.castShadow = true; o.receiveShadow = false; ghost.push(o); } });
    scene.add(palms);
    var works = W.works(q);
    scene.add(works);
    PLACES.forEach(function (P) { scene.add(buildPlace(P, q)); });
    city = W.city(q, avoid, low);
    scene.add(city.grp);
    var stand = palms.userData.palms.slice(), AG = AAM.G;
    PLACES.forEach(function (P) {
      if (P.id !== 'diriyah') return;
      P.grp.updateMatrix();
      // the palms that belong to the Diriyah model, as placed in its own file (all of them at every quality: the key
      // pictures were made with all ten standing)
      [[-18, 34, 9], [-10, 38, 10.5], [6, 35, 8.5], [18, 39, 10], [-44, 32, 9.5], [42, 30, 9], [-30, 40, 8], [30, 42, 9.5], [-48, 10, 10], [46, 8, 8.5]].forEach(function (p) {
        v.set(p[0], 0, p[1]).applyMatrix4(P.grp.matrix);
        stand.push([v.x, v.y, v.z, p[2] * (P.scale || 1)]);
      });
      P.grp.traverse(function (o) { if (o.isMesh && /^palm/.test(o.userData.key)) ghost.push(o); });
    });
    ghost.forEach(function (o) { [].concat(o.material).forEach(function (m) { m.colorWrite = false; m.depthWrite = false; }); });
    grove = W.palmGrove(stand);
    scene.add(grove);
    // Stand-ins on layer 2, used only when depth is taken for the photographed plates: a building frame and a crane are
    // open work, and the picture of them has to land on something solid. Drawn last and without colour, so they change
    // nothing else.
    var hulls = [];
    W.frames.forEach(function (c) {
      W.pt(c[1], c[0], 0, v);
      var kx = v.x + Math.cos(c[3]) * 22, kz = v.z - Math.sin(c[3]) * 22;   // where its crane stands
      hulls.push(AG.xf(AG.box(30, c[2] * 3.7, 24, 0, 0, 0), v.x, 0, v.z, 0, c[3], 0), AG.box(2.8, c[4] + 10, 2.8, kx, 0, kz),
        AG.xf(AG.box(c[5] * 1.3, 3.2, 2, c[5] * 0.35, c[4] + 0.4, 0), kx, 0, kz, 0, c[6], 0));
    });
    var standIn = new T.Mesh(AG.merge(hulls), new T.MeshBasicMaterial({ color: 0x000000, colorWrite: false }));
    standIn.layers.set(2);
    standIn.renderOrder = 10;
    scene.add(standIn);
    // A guard round each palm, on layer 3. The earliest key pictures still hold palms of their own; there the picture
    // is not trusted for whatever lies behind a guard, and only its soft version is used under the live palm.
    var guards = [];
    stand.forEach(function (p) {
      guards.push(AG.xf(new T.SphereGeometry(1, 10, 7), p[0], p[1] + p[3] + 0.4, p[2], 0, 0, 0, 4.6, 3.7, 4.6), AG.cyl(0.6, 0.6, p[3], 6, p[0], p[1], p[2]));
    });
    var guard = new T.Mesh(AG.merge(guards), new T.MeshBasicMaterial({ color: 0x000000 }));
    guard.layers.set(3);
    scene.add(guard);
    // A physical, illuminated arrival portal straddles the same rail at the end of the journey.
    var gate=new T.Group(),at=new T.Vector3(),toward=new T.Vector3();W.pt(2640,0,0,at);W.pt(2500,0,0,toward);
    gate.position.copy(at);gate.position.y=W.railY(2640);toward.y=gate.position.y;gate.lookAt(toward);
    var steel=new T.MeshStandardMaterial({color:0x153544,metalness:.75,roughness:.25});
    var glow=new T.MeshBasicMaterial({color:0x73d0b3});
    function beam(w,h,d,x,y,z,mat){var m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);gate.add(m);}
    [-12,12].forEach(function(x){beam(1.1,29,1.2,x,14.5,0,steel);beam(.16,29,.18,x,14.5,.68,glow)});
    beam(25,1.2,1.2,0,29,0,steel);beam(25,.18,.18,0,28.8,.68,glow);
    new T.TextureLoader().load('../assets/logo-white.png',function(texture){texture.encoding=T.sRGBEncoding;var badge=new T.Mesh(new T.PlaneGeometry(9,9),new T.MeshBasicMaterial({map:texture,transparent:true,side:T.DoubleSide,depthWrite:false}));badge.position.set(0,23,.75);gate.add(badge);badge.layers.set(1);});
    gate.traverse(function(o){o.layers.set(1)});scene.add(gate);
    train = W.train(1, W.TRK);
    scene.add(train.grp);
    opp = W.train(-1, -W.TRK);
    scene.add(opp.grp);
    traffic = W.traffic(light ? 80 : 160);
    scene.add(traffic.grp);
    scene.traverse(function (o) {
      (o.material ? [].concat(o.material) : []).forEach(function (m) {
        if (m.isMeshStandardMaterial && envMats.indexOf(m) < 0) { m.userData.env = m.envMapIntensity; envMats.push(m); }
      });
    });
    // Layer 1 holds what is always drawn live: the trains, traffic, the map wall and the lines of light.
    // Everything else stands still on layer 0 and can be covered by photographed key frames.
    [train.grp, opp.grp, traffic.grp, wall.grp, grove].forEach(function (g) { g.traverse(function (o) { o.layers.set(1); }); });
    train.grp.traverse(function (o) { if (o.userData.blob) blobs.push(o); });
    scene.traverse(function (o) { if (o.userData.live) o.layers.set(1); });
    sun.layers.enableAll();
    hemi.layers.enableAll();
    camera.layers.enable(1);
  }
  function boot() {
    $('fallback-skip').addEventListener('click',function(){tell('skip',1)});
    stage = $('stage'); scroller = $('scroller'); journeyEl = $('journey');
    reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    light = Math.min(window.innerWidth, window.innerHeight) < 560 || (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    try {
      renderer = new T.WebGLRenderer({ canvas: $('gl'), antialias: true, powerPreference: 'high-performance' });
    } catch (err) {
      $('boot').hidden = true;
      $('fail').hidden = false;tell('fallback',true);
      return;
    }
    renderer.outputEncoding = T.sRGBEncoding;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    renderer.shadowMap.enabled = !light;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    AAM.maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    buildUI();
    build();
    setLang('ar');
    setTier(light);
    if (!sCam) keys();   // the page can start hidden with no size yet; the camera path must exist all the same
    if (window.AAM_SKIN) skinInit(window.AAM_SKIN);
    renderer.shadowMap.needsUpdate = true;
    window.addEventListener('resize', resize);
    if (window.ResizeObserver) new ResizeObserver(resize).observe(scroller);
    prog = target();
    frame(prog);
    // the loading screen stays until the first photographed plates are in (or twelve seconds have passed), so the plain render never flashes first
    (function wait(n) {
      if (!skin || skinReady() || n > 60) {document.body.classList.add('ready');$('boot').setAttribute('aria-hidden','true');tell('ready',true);} else setTimeout(function () { wait(n + 1); }, 100);
    })(0);
    requestAnimationFrame(tick);
  }

  addEventListener('wheel',function(e){e.preventDefault();setPlay(false);tell('scroll',e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?innerHeight:1));},{passive:false});
  var touchY=null;
  addEventListener('touchstart',function(e){touchY=e.touches[0]?.clientY;setPlay(false);},{passive:true});
  addEventListener('touchmove',function(e){if(touchY==null)return;var y=e.touches[0].clientY;e.preventDefault();tell('scroll',touchY-y);touchY=y;},{passive:false});
  addEventListener('keydown',function(e){if(e.target.matches('button,a,input,select'))return;var delta={ArrowDown:100,ArrowUp:-100,PageDown:innerHeight*.8,PageUp:-innerHeight*.8,' ':innerHeight*.8}[e.key];if(delta){e.preventDefault();setPlay(false);tell('scroll',delta);}});
  setTimeout(function(){try{boot()}catch(err){$('boot').hidden=true;$('fail').hidden=false;tell('fallback',true);console.error('Journey initialization failed',err)}},30);
})();

