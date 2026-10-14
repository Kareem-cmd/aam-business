/* Continuous coastal landscape. All positions are measured along the same rail as the train. */
(function(){
 'use strict';
 var T=THREE,A=window.AAM,W=A.world,G=A.G,M=A.M,ss=M.sstep;
 function coast(s){return -245+90*ss(3400,3800,s)-600*ss(4400,5350,s)-700*ss(5350,6000,s)+18*Math.sin(s*.007);}
 function ground(lat,s){
  var beach=ss(coast(s),coast(s)+65,lat),edge=ss(90,280,Math.abs(lat));
  var ridge=(55+65*(.5+.5*Math.sin(s*.006)))*Math.pow(.5+.5*Math.sin(lat*.009+s*.0015),2);
  var mountains=ss(4300,5200,s)*edge*(ridge+38*M.fbm(lat*.009,1,s*.007,3));
  var cliffEdge=124+Math.sin(s*.018)*9+Math.sin(s*.043)*3;
  var cliff=ss(5300,5420,s)*(1-ss(6040,6160,s))*ss(cliffEdge,cliffEdge+24,lat)*42;
  return -1.5+beach*(1.5+Math.max(0,mountains))+cliff;
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
  // Regional landmarks are authored silhouettes; shared materials keep them in a few draw calls.
  materials.ivory=mat('#ece2ca',{map:sandTex,roughness:.72});
  materials.copper=mat('#937049',{metalness:.5,roughness:.48});
  materials.mirror=mat('#aac1cc',{metalness:.78,roughness:.22,envMapIntensity:.75});
  materials.interior=mat('#284a59',{map:glassTex,metalness:.12,roughness:.64});
  materials.pool=mat('#2c9da2',{metalness:.25,roughness:.2});
  if(A.realism){['stone','plaster','ivory'].forEach(function(k){materials[k].color.copy(M.lin('#e8dfce'));A.realism.surface(materials[k],'plaster',4)});A.realism.surface(materials.rock,'rock',12);A.realism.surface(materials.sand,'sand',15);['glass','interior'].forEach(function(k){materials[k].userData.realGlass=true});materials.mirror.color.copy(M.lin('#b9c4c6'));materials.mirror.roughness=.12;materials.mirror.metalness=.92;materials.mirror.envMapIntensity=1.1;}
  function shape(k,g,s,lat,y,sx,sy,sz,rot){var p=point(s,lat,y);add(k,G.xf(g,p.x,p.y,p.z,0,W.yaw(s)+(rot||0),0,sx||1,sy||1,sz||1))}
  function ellipsoid(k,s,lat,y,rx,ry,rz,half){shape(k,new T.SphereGeometry(1,k==='green'?8:24,k==='green'?6:12,0,Math.PI*2,0,half?Math.PI/2:Math.PI),s,lat,y,rx,ry,rz)}
  function column(k,s,lat,y,r,h,top){shape(k,new T.CylinderGeometry(top===undefined?r:top,r,h,12),s,lat,y+h/2)}
  function arch(s,lat,y,r,k){var pts=[];for(var a=0;a<=16;a++){var t=a/16*Math.PI;pts.push(point(s,lat+Math.cos(t)*r,y+Math.sin(t)*r))}path(k||'ivory',pts,.35)}
  function tree(s,lat,y,h){column('wood',s,lat,y,.22,h*.6);
   ellipsoid('green',s,lat,y+h*.8,h*.3,h*.35,h*.3);
   ellipsoid('green',s+h*.18,lat-h*.2,y+h*.65,h*.27,h*.27,h*.25);
   ellipsoid('green',s-h*.18,lat+h*.22,y+h*.7,h*.25,h*.3,h*.28);
  }
  function palm(s,lat,h){var y=ground(lat,s);path('wood',[point(s,lat,y),point(s+1,lat+1,y+h)],.45);
   for(var n=0;n<9;n++){var angle=n*Math.PI*2/9,base=point(s,lat,y+h);var blade=G.grid(7,2,function(u,v,o){var reach=u*7.5,half=Math.sin(Math.PI*u)*.75,cross=(v*2-1)*half;o[0]=base.x+Math.cos(angle)*reach-Math.sin(angle)*cross;o[1]=base.y+Math.sin(Math.PI*u)*1.6-u*u*3.2-Math.abs(cross)*.3;o[2]=base.z+Math.sin(angle)*reach+Math.cos(angle)*cross;});add('green',blade);}

  }
  // A continuous terrain strip replaces disconnected rectangular display bases.
  for(var start=2700;start<7600;start+=600){
   var terrain=G.grid(110,48,function(u,v,o){var s=start+v*600,lat=coast(s)+(1800-coast(s))*u;o[0]=W.px(s)+lat;o[1]=ground(lat,s);o[2]=-s;},{uvFn:function(u,v,o,k){return k===0?o[0]/70:o[2]/70}});
   G.colorize(terrain,function(x,y,z){var t=ss(10,70,y),n=M.noise3(x*.03,0,z*.03)*.06;return [.94+n-t*.12,.89+n-t*.12,.79+n-t*.09]});
   var tm=mat('#ffffff',{vertexColors:true});if(A.realism)A.realism.surface(tm,'terrain',15);all.add(new T.Mesh(terrain,tm));
  }
  // A single coast-following ocean, with depth colour, soft foam, waves and view-dependent reflection.
  var ocean=G.grid(52,250,function(u,v,o){var s=2500+v*5400,lat=coast(s)-u*5000;o[0]=W.px(s)+lat;o[1]=-.45;o[2]=-s;},{uvFn:function(u,v,o,k){return k===0?u*5000:v*5400}});
  var wu={time:{value:0},fogColor:{value:new T.Color('#728b9a')},fogDensity:{value:.0005}};waterUniforms.push(wu);
  var water=new T.ShaderMaterial({uniforms:wu,side:T.DoubleSide,extensions:{derivatives:true},vertexShader:`varying vec3 world;varying float shore;uniform float time;void main(){vec3 p=position;shore=uv.x;float strength=smoothstep(0.,40.,shore);p.y+=strength*(sin(p.x*.045+time*.45)*.28+sin(p.z*.065+p.x*.021-time*.3)*.17);world=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 world;varying float shore;uniform float time;uniform vec3 fogColor;uniform float fogDensity;void main(){vec3 V=normalize(cameraPosition-world);float a=world.x*.13+world.z*.07+time*.6;float b=world.z*.19-world.x*.05-time*.4;vec3 N=normalize(vec3(cos(a)*.13,1.,sin(b)*.1));float fres=pow(1.-max(dot(N,V),0.),4.);vec3 c=mix(vec3(.018,.29,.29),vec3(.012,.085,.16),smoothstep(0.,180.,shore));c=mix(c,vec3(.39,.56,.62),fres*.65);float spec=pow(max(dot(reflect(normalize(vec3(-.4,-.8,-.3)),N),V),0.),90.);c+=vec3(.9,.75,.48)*spec*.45;float foam=(1.-smoothstep(1.,6.,shore+sin(world.z*.14+time)*1.8))*.55;c=mix(c,vec3(.72,.81,.74),foam);float fog=1.-exp(-pow(length(cameraPosition-world)*fogDensity,2.));gl_FragColor=vec4(mix(c,fogColor,min(.92,fog)),1.);}`});
  all.add(A.realism?A.realism.water(ocean,water):new T.Mesh(ocean,water));
  // Urban fabric carries the eye out of Riyadh and all the way through Jeddah.
  for(var i=0;i<76;i++){
   var s=2650+i*13.7,side=i%2?-1:1,lat=side*(43+Math.floor(i/2)%3*34),h=13+rand(i)*26,w=14+rand(i+200)*7,y=ground(lat,s);
   if(s>3200&&side<0&&Math.abs(lat)>70)continue;
   box(i%3?'stone':'plaster',w,h,19,s,lat,y);box('stone',w+1.5,1,20,s,lat,y+h);
   // Projecting timber roshan bays, carved screens, parapets and shaded shop openings.
   for(var f=0;f<Math.floor(h/5)-1;f++){for(var j=-1;j<=1;j++){var bx=lat+j*4,by=y+4+f*5;
    box('wood',3.2,3.8,2,s-10,bx,by);box('dark',2.6,2.8,.25,s-11.15,bx,by+.4);
    for(var sl=-2;sl<=2;sl++)box('wood',.12,3,.18,s-11.35,bx+sl*.48,by+.3);
    for(var sl=0;sl<4;sl++)box('wood',2.8,.12,.2,s-11.4,bx,by+.5+sl*.75);
    box('copper',3.6,.3,2.5,s-10,bx,by+3.8);
   }box('plaster',w+.3,.25,.6,s-10.3,lat,y+8+f*5)}
   for(var j=-1;j<=1;j++){box('dark',3,4,.2,s-9.7,lat+j*4,y);arch(s-10,lat+j*4,y+3,1.5);}
   if(i%3===0)for(var j=-2;j<=2;j++)box('ivory',1,1.2,.8,s-9.5,lat+j*3,y+h+1);
   if(i%4===0){box('ivory',w*.6,4,10,s+2,lat,y+h);box('wood',w*.65,.4,11,s+2,lat,y+h+4);}
  }
  // Waterfront mosque: raised colonnade, turquoise dome and slender minaret.
  var ms=3370,ml=coast(ms)+18;
  box('ivory',64,2,64,ms,ml,4);
  for(var a=-2;a<=2;a++)for(var b=-2;b<=2;b++)column('ivory',ms+a*12,ml+b*12,-2,.75,6);
  box('ivory',35,10,35,ms,ml,6);ellipsoid('pool',ms,ml,17,17,13,17,true);
  column('copper',ms,ml,29,.2,4);ellipsoid('copper',ms,ml,33,.7,.7,.7);
  for(var side=-1;side<=1;side+=2)for(var a=-2;a<=2;a++){
   column('ivory',ms+side*27,ml+a*11,6,.5,7);arch(ms+side*27,ml+a*11,11,5);
   ellipsoid('ivory',ms+side*24,ml+a*10,14,4,3,4,true);
  }
  column('ivory',ms+22,ml+22,6,2.1,43,1.3);
  column('ivory',ms+22,ml+22,35,3.1,1);column('ivory',ms+22,ml+22,44,2.7,1);
  column('pool',ms+22,ml+22,49,1.7,8,0);
  // A curved waterfront tower gives the modern skyline a distinct counterpoint to Al Balad.
  for(var f=0;f<28;f++){var h=f*4.6,w=30*(1-f/35),z=3470+Math.sin(f/28*Math.PI)*9;
   box('glass',w,4.3,22,z,100,h);box('ivory',w+1,.3,23,z,100,h+4.3);
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
  for(var i=0;i<18;i++){var s=3680+i*38,lat=coast(s)-36-(i%3)*20;
   box('wood',27,.8,30,s,lat,2.6);
   ellipsoid('mirror',s,lat,7.4,12+(i%3),6.6,10,false);
   ellipsoid('interior',s-8.7,lat,7.3,9.2,4.1,1.6,false);
   box('pool',12,.3,6,s-12,lat,3.1);box('ivory',13,.25,.5,s-15.1,lat,3.1);
   var span=coast(s)-lat+24;box('wood',span,.5,2.5,s+8,(lat+coast(s)+24)/2,2.6);
   [-9,9].forEach(function(x){column('metal',s-9,lat+x,-2,.4,5);column('metal',s+9,lat+x,-2,.4,5)});
  }
  flush('coastal-promenade-and-resorts');
  // NEOM is aligned to the track: two facades, a clear central corridor, interior terraces and overhead bridges.
  for(var i=0;i<30;i++){var s=4450+i*26;[-1,1].forEach(function(side){
   var h=92+12*Math.sin(i*.3),lat=side*49;
   box('mirror',25,h,25.7,s,lat,1);
   // Recessed inner neighbourhoods: distinct voids, bridges, gardens and occupied floor plates.
   box('interior',.8,h-4,25.8,s,side*36,2);
   box('ivory',1.1,h,1.2,s-12,side*35.4,1);
   for(var f=0;f<8;f++){
    var y=5+f*11,depth=5+rand(i*71+f*13+side)*9;
    if((i+f+(side>0?1:0))%5===0)continue;
    var center=side*(36-depth/2);
    box('ivory',depth,1.1,22,s,center,y);
    box('metal',.25,1.4,22,s,side*(36-depth),y+1.1);
    box('interior',.5,7,18,s,side*34.8,y+1.2);
    for(var pane=-1;pane<=1;pane++)box('copper',.3,7,.22,s+pane*6,side*34.4,y+1.2);
    if((i+f)%3===0){
     box('stone',3,1.1,12,s+3,side*(37-depth),y+1.2);
     box('green',2.8,.65,11.8,s+3,side*(37-depth),y+2.3);
     tree(s+5,side*(37-depth),y+2.8,4);
    }
    if(f%2===0)box('warm',.12,.12,17,s,side*(36.15-depth),y+.6);
   }
   box('ivory',14,1.5,24,s,side*26,2);box('green',5,.7,17,s,side*25,3.5);
   if(i%2===0){palm(s,side*28,8);box('warm',.3,.2,18,s,side*21,4)}
  });
   if(i%7===2){
    var by=39+(i%3)*9;
    box('ivory',74,1.2,9,s,0,by);box('green',64,.5,5,s,0,by+1.2);
    [-4,4].forEach(function(z){box('metal',74,1.3,.25,s+z,0,by+1.2);});
    for(var x=-24;x<=24;x+=12)tree(s,x,by+1.7,5);
    path('metal',[point(s-5,-36,by+19),point(s-5,0,by-1),point(s-5,36,by+19)],.35);
   }
  }
  // A central civic atrium with vertical garden fins and a high, open sky canopy.
  for(var i=0;i<9;i++){
   var s=4800+i*8;
   path('ivory',[point(s,-35,80),point(s,-18,108),point(s,18,108),point(s,35,80)],.65);
  }
  for(var i=0;i<8;i++){
   var s=4770+i*14,side=i%2?1:-1;
   box('green',2,18+i%3*5,8,s,side*31,42);
   box('copper',1,76,1,s,side*35,5);
  }
  [4430,5230].forEach(function(s){[-25,25].forEach(function(lat){box('stone',2,34,3,s,lat,0)});box('stone',52,2,3,s,0,34);box('light',48,.2,.5,s-1.8,0,33.8)});
  flush('neom-through-city-interior');
  // Tuwaiq-inspired layered limestone escarpment, with an inhabited cliff-edge venue.
  // Three-sided event bowl, terraces and folded canopy; an interpretation, not a surveyed replica.
  var qs=5780,ql=177,qy=ground(ql,qs)+3;
  // Embed the podium in the escarpment; the open side faces the valley.
  box('rock',98,8,112,qs,ql,qy-8);
  [-40,0,40].forEach(function(offset){var y=ground(ql-42,qs+offset);column('rock',qs+offset,ql-42,y,2,Math.max(1,qy-y),2)});
  box('green',46,1,67,qs,ql,qy+.4);
  for(var row=0;row<8;row++){
   var ry=qy+row*1.8;
   box('ivory',4,1.2,76+row*3,qs,ql+26+row*3,ry);
   box('ivory',58+row*6,1.2,3,qs+37+row*3,ql,ry);
   box('ivory',58+row*6,1.2,3,qs-37-row*3,ql,ry);
  }
  for(var i=0;i<10;i++){
   box('copper',4,25,4,qs-48+i*10,ql+54,qy);
   box('metal',35,1.3,9,qs-48+i*10,ql+41,qy+27,Math.sin(i)*.08);
   box('light',.2,12,7,qs-48+i*10,ql+56.1,qy+9);
  }
  // Qiddiya sits in the same mountain terrain, with a valley kept clear for the train.
  var roller=[];for(var i=0;i<=72;i++){var a=i/72*Math.PI*2;roller.push(point(5600+Math.sin(a)*155,-125+Math.cos(a)*65,35+Math.sin(a*3)*18+Math.cos(a)*12))}path('metal',roller,1.1);path('light',roller.map(function(p){return p.clone().add(new T.Vector3(0,.3,0))}),.13);roller.filter(function(_,i){return i%5===0}).forEach(function(p){path('metal',[new T.Vector3(p.x,0,p.z),p],.7)});
  for(var i=0;i<8;i++){var s=5420+i*49,w=18+i%3*5,h=7+i%4*3;
   box('rock',w,h,24,s,48,1);box('glass',w-3,h-2,.5,s-12.3,48,2);
   shape('ivory',new T.CylinderGeometry(w*.65,w*.65,1,6),s,48,h+2,1,1,.8,Math.PI/6);
   for(var col=-2;col<=2;col++)box('copper',.35,h,1,s-14,48+col*4,1);
   palm(s,29,10);
  }
  var ring=[];for(var i=0;i<=48;i++){var a=i/48*Math.PI*2,p=point(5750+Math.cos(a)*27,-90,35+Math.sin(a)*27);ring.push(p);if(i%6===0){path('metal',[point(5750,-90,35),p],.3);box('glass',3,3,3,5750+Math.cos(a)*27,-90,32+Math.sin(a)*27)}}path('stone',ring,.7);path('metal',[point(5734,-90,0),point(5750,-90,35),point(5766,-90,0)],.8);
  for(var s=5900;s<6360;s+=28){palm(s,-26,11);palm(s,26,11);box('stone',8,.6,14,s,27,0);box('stone',8,.6,14,s,-27,0)}
  flush('qiddiya-valley-and-arrival');
  all.traverse(function(o){if(o.isMesh&&!o.material.isShaderMaterial){o.receiveShadow=true;o.castShadow=!o.material.isMeshBasicMaterial;}});
  all.userData.update=function(s,p,fog){waterUniforms.forEach(function(u){u.time.value=p*70;u.fogColor.value.copy(fog)});};
  sets.push({id:'continuous-landscape',s:4400,lat:0,group:all});return sets;
 };
})();
