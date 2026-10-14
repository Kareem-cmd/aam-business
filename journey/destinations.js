/* Continuous coastal landscape. All positions are measured along the same rail as the train. */
(function(){
 'use strict';
 var T=THREE,A=window.AAM,W=A.world,G=A.G,M=A.M,ss=M.sstep;
 function coast(s){return -245+90*ss(3400,3800,s)-600*ss(4400,5350,s)-700*ss(5350,6000,s)+18*Math.sin(s*.007);}
 function ground(lat,s){
  var beach=ss(coast(s),coast(s)+65,lat),edge=ss(90,280,Math.abs(lat));
  var ridge=(55+65*(.5+.5*Math.sin(s*.006)))*Math.pow(.5+.5*Math.sin(lat*.009+s*.0015),2);
  var mountains=ss(4300,5200,s)*edge*(ridge+38*M.fbm(lat*.009,1,s*.007,3));
  return -1.5+beach*(1.5+Math.max(0,mountains));
 }
 W.destinations=function(){
  var all=new T.Group(),sets=[],waterUniforms=[],batches={},rng=M.rng?M.rng(58):null;
  function rand(n){var v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)}
  function tex(type){var c=document.createElement('canvas');c.width=c.height=512;var x=c.getContext('2d');x.fillStyle=type==='glass'?'#254451':'#cbb99c';x.fillRect(0,0,512,512);
   if(type==='glass'){for(var r=0;r<20;r++)for(var col=0;col<10;col++){x.fillStyle=['#30505f','#426675','#274856','#728183'][Math.floor(rand(r*10+col)*4)];x.fillRect(col*51+2,r*25+2,47,21);if(rand(r*91+col)>.84){x.fillStyle='#ccb68c';x.fillRect(col*51+6,r*25+5,35,12)}}}
   else {for(var n=0;n<18000;n++){var a=rand(n);x.fillStyle=a>.5?'rgba(60,44,30,.045)':'rgba(255,248,222,.09)';x.fillRect(rand(n+3)*512,rand(n+19)*512,2,2)}for(var row=0;row<20;row++){x.fillStyle='rgba(66,46,33,.1)';x.fillRect(0,row*26,512,1)}}
   var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
  }
  var sandTex=tex('stone'),glassTex=tex('glass');
  function mat(color,extra){return new T.MeshStandardMaterial(Object.assign({color:M.lin(color),roughness:.8,envMapIntensity:.5},extra||{}))}
  var materials={stone:mat('#d8c8ad',{map:sandTex}),plaster:mat('#c1b295',{map:sandTex}),sand:mat('#bd9669',{map:sandTex}),wood:mat('#4c655b'),dark:mat('#172b32'),glass:mat('#658d9d',{map:glassTex,metalness:.18,roughness:.5,envMapIntensity:.25}),rock:mat('#a57956',{map:sandTex}),green:mat('#375c42',{side:T.DoubleSide}),metal:mat('#678489',{metalness:.65,roughness:.3}),light:new T.MeshBasicMaterial({color:M.lin('#b3eadb')}),warm:new T.MeshBasicMaterial({color:M.lin('#e6bd7b')})};
  function flush(name){var group=new T.Group();Object.keys(batches).forEach(function(k){var geo=G.merge(batches[k]);geo.computeBoundingSphere();group.add(new T.Mesh(geo,materials[k]))});batches={};group.name=name;all.add(group);return group}
  function add(k,g){(batches[k]||(batches[k]=[])).push(g)}
  function box(k,w,h,d,s,lat,y,rot){var p=new T.Vector3();W.pt(s,lat,0,p);add(k,G.xf(new T.BoxGeometry(w,h,d),p.x,y+h/2,p.z,0,W.yaw(s)+(rot||0),0))}
  function path(k,pts,r){add(k,new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.max(20,pts.length*5),r,5,false))}
  function point(s,lat,y){var p=new T.Vector3();W.pt(s,lat,0,p);p.y=y;return p}
  function palm(s,lat,h){var y=ground(lat,s);path('wood',[point(s,lat,y),point(s+1,lat+1,y+h)],.45);
   for(var n=0;n<9;n++){var angle=n*Math.PI*2/9,base=point(s,lat,y+h);var blade=G.grid(7,2,function(u,v,o){var reach=u*7.5,half=Math.sin(Math.PI*u)*.75,cross=(v*2-1)*half;o[0]=base.x+Math.cos(angle)*reach-Math.sin(angle)*cross;o[1]=base.y+Math.sin(Math.PI*u)*1.6-u*u*3.2-Math.abs(cross)*.3;o[2]=base.z+Math.sin(angle)*reach+Math.cos(angle)*cross;});add('green',blade);}

  }
  // A continuous terrain strip replaces disconnected rectangular display bases.
  for(var start=2700;start<7600;start+=600){
   var terrain=G.grid(72,48,function(u,v,o){var s=start+v*600,lat=coast(s)+(1800-coast(s))*u;o[0]=W.px(s)+lat;o[1]=ground(lat,s);o[2]=-s;},{uvFn:function(u,v,o,k){return k===0?o[0]/70:o[2]/70}});
   G.colorize(terrain,function(x,y,z){var t=ss(10,70,y),n=M.noise3(x*.03,0,z*.03)*.06;return [.58+n-t*.15,.43+n-t*.13,.27+n-t*.1]});
   var tm=mat('#ffffff',{map:sandTex,bumpMap:sandTex,bumpScale:.3,vertexColors:true});all.add(new T.Mesh(terrain,tm));
  }
  // A single coast-following ocean, with depth colour, soft foam, waves and view-dependent reflection.
  var ocean=G.grid(52,250,function(u,v,o){var s=2500+v*5400,lat=coast(s)-u*5000;o[0]=W.px(s)+lat;o[1]=-.45;o[2]=-s;},{uvFn:function(u,v,o,k){return k===0?u*5000:v*5400}});
  var wu={time:{value:0},fogColor:{value:new T.Color('#728b9a')},fogDensity:{value:.0005}};waterUniforms.push(wu);
  var water=new T.ShaderMaterial({uniforms:wu,side:T.DoubleSide,extensions:{derivatives:true},vertexShader:`varying vec3 world;varying float shore;uniform float time;void main(){vec3 p=position;shore=uv.x;float strength=smoothstep(0.,40.,shore);p.y+=strength*(sin(p.x*.045+time*.45)*.28+sin(p.z*.065+p.x*.021-time*.3)*.17);world=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 world;varying float shore;uniform float time;uniform vec3 fogColor;uniform float fogDensity;void main(){vec3 V=normalize(cameraPosition-world);float a=world.x*.13+world.z*.07+time*.6;float b=world.z*.19-world.x*.05-time*.4;vec3 N=normalize(vec3(cos(a)*.13,1.,sin(b)*.1));float fres=pow(1.-max(dot(N,V),0.),4.);vec3 c=mix(vec3(.018,.29,.29),vec3(.012,.085,.16),smoothstep(0.,180.,shore));c=mix(c,vec3(.39,.56,.62),fres*.65);float spec=pow(max(dot(reflect(normalize(vec3(-.4,-.8,-.3)),N),V),0.),90.);c+=vec3(.9,.75,.48)*spec*.45;float foam=(1.-smoothstep(1.,6.,shore+sin(world.z*.14+time)*1.8))*.55;c=mix(c,vec3(.72,.81,.74),foam);float fog=1.-exp(-pow(length(cameraPosition-world)*fogDensity,2.));gl_FragColor=vec4(mix(c,fogColor,min(.92,fog)),1.);}`});
  all.add(new T.Mesh(ocean,water));
  // Urban fabric carries the eye out of Riyadh and all the way through Jeddah.
  for(var i=0;i<118;i++){
   var s=2650+i*9.1,side=i%2?-1:1,lat=side*(38+Math.floor(i/2)%3*34),h=15+rand(i)*35,w=14+rand(i+200)*7,y=ground(lat,s);
   box(i%3?'stone':'plaster',w,h,19,s,lat,y);box('stone',w+1.5,1,20,s,lat,y+h);
   for(var f=0;f<Math.floor(h/5)-1;f++){for(var j=-1;j<=1;j++){box('wood',2.7,3,1.4,s-10,lat+j*4,y+4+f*5);box('dark',1.8,2.3,1.5,s-10.15,lat+j*4,y+4.3+f*5)}box('plaster',w+.3,.25,.6,s-10.3,lat,y+8+f*5)}
  }
  for(var s=2750;s<3650;s+=28){palm(s,-25,10+(s%3));box('stone',5,.5,9,s,-26,ground(-26,s));}
  flush('continuous-jeddah-streets');
  // Corniche paving follows the shoreline rather than sitting on a square platform.
  var walk=G.grid(3,180,function(u,v,o){var s=2750+v*1700,lat=coast(s)+15+u*12;o[0]=W.px(s)+lat;o[1]=ground(lat,s)+.15;o[2]=-s;});all.add(new T.Mesh(walk,materials.stone));
  for(var s=3000;s<4450;s+=36){var lat=coast(s)+34;palm(s,lat,12);box('metal',.25,6,.25,s,lat+5,ground(lat+5,s));box('warm',1.4,.18,.8,s,lat+5,ground(lat+5,s)+6)}
  // Fountain spray is a volume of fine droplets, not glowing wire arches.
  var drops=[];for(var i=0;i<900;i++){var t=rand(i),a=rand(i+909)*Math.PI*2,rad=(1-t)*19,p=point(3210+Math.sin(a)*rad,coast(3210)-35+Math.cos(a)*rad,1+t*80);drops.push(p.x,p.y,p.z)}
  var dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(drops,3));all.add(new T.Points(dg,new T.PointsMaterial({color:0xc9dfdc,size:.65,transparent:true,opacity:.6,depthWrite:false,map:A.tex('dot')})));
  // Villas, boardwalks and reefs continue alongside the rail along the Red Sea.
  for(var i=0;i<28;i++){var s=3630+i*27,lat=coast(s)-18-(i%3)*14;box('wood',18,1,22,s,lat,3);box('stone',13,6,15,s,lat,4);box('glass',11,4,.5,s-7.8,lat,5);box('wood',20,.7,24,s,lat,10);box('wood',3,.6,Math.abs(lat-coast(s))+18,s,coast(s)-10,3,Math.PI/2);[-6,6].forEach(function(x){box('wood',.65,4,.65,s-6,lat+x,-1);box('wood',.65,4,.65,s+6,lat+x,-1)})}
  flush('coastal-promenade-and-resorts');
  // NEOM is aligned to the track: two facades, a clear central corridor, interior terraces and overhead bridges.
  for(var i=0;i<30;i++){var s=4450+i*26;[-1,1].forEach(function(side){var h=72+18*Math.sin(i*.3),lat=side*49;box('glass',25,h,25,s,lat,1);box('metal',.6,h,26,s,lat-side*12.6,1);for(var f=1;f<12;f++){box('metal',.75,.28,25.5,s,side*36.1,f*6);if(f%3===1)box('warm',.1,.08,19,s,side*35.65,f*6+.3)}box('stone',13,1.5,24,s,side*27,2);box('green',5,.7,17,s,side*25,3.5);if(i%2===0){palm(s,side*28,8);box('warm',.3,.2,18,s,side*21,4)}});
   if(i%7===2){box('glass',102,4,8,s,0,38);box('metal',105,.5,9,s,0,37.5)}
  }
  [4430,5230].forEach(function(s){[-25,25].forEach(function(lat){box('stone',2,34,3,s,lat,0)});box('stone',52,2,3,s,0,34);box('light',48,.2,.5,s-1.8,0,33.8)});
  flush('neom-through-city-interior');
  // Qiddiya sits in the same mountain terrain, with a valley kept clear for the train.
  var roller=[];for(var i=0;i<=72;i++){var a=i/72*Math.PI*2;roller.push(point(5600+Math.sin(a)*155,-125+Math.cos(a)*65,35+Math.sin(a*3)*18+Math.cos(a)*12))}path('metal',roller,1.1);path('light',roller.map(function(p){return p.clone().add(new T.Vector3(0,.3,0))}),.13);roller.filter(function(_,i){return i%5===0}).forEach(function(p){path('metal',[new T.Vector3(p.x,0,p.z),p],.7)});
  for(var i=0;i<13;i++){var s=5420+i*31;box('stone',16,9,19,s,45,1);box('wood',19,.8,22,s,45,10);box('glass',12,5,.5,s-10,45,3);palm(s,29,10)}
  var ring=[];for(var i=0;i<=48;i++){var a=i/48*Math.PI*2,p=point(5750+Math.cos(a)*27,-90,35+Math.sin(a)*27);ring.push(p);if(i%6===0){path('metal',[point(5750,-90,35),p],.3);box('glass',3,3,3,5750+Math.cos(a)*27,-90,32+Math.sin(a)*27)}}path('stone',ring,.7);path('metal',[point(5734,-90,0),point(5750,-90,35),point(5766,-90,0)],.8);
  for(var s=5900;s<6360;s+=28){palm(s,-26,11);palm(s,26,11);box('stone',8,.6,14,s,27,0);box('stone',8,.6,14,s,-27,0)}
  flush('qiddiya-valley-and-arrival');
  all.userData.update=function(s,p,fog){waterUniforms.forEach(function(u){u.time.value=p*70;u.fogColor.value.copy(fog)});};
  sets.push({id:'continuous-landscape',s:4400,lat:0,group:all});return sets;
 };
})();
