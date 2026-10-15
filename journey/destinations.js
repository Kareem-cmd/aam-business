/* Continuous coastal landscape. All positions are measured along the same rail as the train. */
(function(){
 'use strict';
 var T=THREE,A=window.AAM,W=A.world,G=A.G,M=A.M,ss=M.sstep;
 function coast(s){return -245+90*ss(3400,3800,s)-600*ss(4400,5350,s)-700*ss(5350,6000,s)+18*Math.sin(s*.007);}
 function ground(lat,s){
  var beach=ss(coast(s),coast(s)+30,lat),edge=ss(90,280,Math.abs(lat));
  var ridge=(55+65*(.5+.5*Math.sin(s*.006)))*Math.pow(.5+.5*Math.sin(lat*.009+s*.0015),2);
  var mountains=ss(4300,5200,s)*edge*(ridge+38*M.fbm(lat*.009,1,s*.007,3));
  var cliffEdge=124+Math.sin(s*.018)*9+Math.sin(s*.043)*3;
  var cliff=ss(5300,5420,s)*(1-ss(6040,6160,s))*ss(cliffEdge,cliffEdge+24,lat)*42;
  return -1.5+beach*(1.5+Math.max(0,mountains))+cliff;
 }
 W.destinations=function(){
  var low=matchMedia('(pointer: coarse)').matches||Math.min(innerWidth,innerHeight)<600;
  var all=new T.Group(),sets=[],waterUniforms=[],batches={},rng=M.rng?M.rng(58):null;
  function rand(n){var v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)}
  function tex(type){var c=document.createElement('canvas');c.width=c.height=512;var x=c.getContext('2d');x.fillStyle=type==='glass'?'#254451':'#cbb99c';x.fillRect(0,0,512,512);
   if(type==='glass'){for(var r=0;r<20;r++)for(var col=0;col<10;col++){x.fillStyle=['#30505f','#426675','#274856','#728183'][Math.floor(rand(r*10+col)*4)];x.fillRect(col*51+2,r*25+2,47,21);if(rand(r*91+col)>.84){x.fillStyle='#ccb68c';x.fillRect(col*51+6,r*25+5,35,12)}}}
   else {for(var n=0;n<18000;n++){var a=rand(n);x.fillStyle=a>.5?'rgba(60,44,30,.045)':'rgba(255,248,222,.09)';x.fillRect(rand(n+3)*512,rand(n+19)*512,2,2)}for(var row=0;row<20;row++){x.fillStyle='rgba(66,46,33,.1)';x.fillRect(0,row*26,512,1)}}
   var t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;
  }
  var sandTex=tex('stone'),glassTex=tex('glass');
  function mat(color,extra){return new T.MeshStandardMaterial(Object.assign({color:M.lin(color),roughness:.8,envMapIntensity:.5},extra||{}))}
  var materials={stone:mat('#d8c8ad',{map:sandTex}),plaster:mat('#c1b295',{map:sandTex}),sand:mat('#bd9669',{map:sandTex}),wood:mat('#4c655b'),dark:mat('#172b32'),glass:mat('#658d9d',{map:glassTex,metalness:.18,roughness:.5,envMapIntensity:.25}),rock:mat('#a57956',{map:sandTex}),green:mat('#547355',{side:T.DoubleSide,vertexColors:true}),metal:mat('#678489',{metalness:.65,roughness:.3}),light:new T.MeshBasicMaterial({color:M.lin('#b3eadb')}),warm:new T.MeshBasicMaterial({color:M.lin('#e6bd7b')})};
  function flush(name){var group=new T.Group();Object.keys(batches).forEach(function(k){
   var bins={};batches[k].forEach(function(g){g.computeBoundingBox();var z=(g.boundingBox.min.z+g.boundingBox.max.z)*.5,key=Math.floor(-z/520);(bins[key]||(bins[key]=[])).push(g)});
   Object.keys(bins).forEach(function(key){var geo=G.merge(bins[key]);geo.computeBoundingSphere();var mesh=new T.Mesh(geo,materials[k]);mesh.name=name+'-'+k+'-'+key;group.add(mesh)});
  });batches={};group.name=name;all.add(group);return group}
  function add(k,g){if(k==='green'&&!g.attributes.color){var colors=new Float32Array(g.attributes.position.count*3);colors.fill(1);g.setAttribute('color',new T.BufferAttribute(colors,3));}(batches[k]||(batches[k]=[])).push(g)}
  function box(k,w,h,d,s,lat,y,rot){var p=new T.Vector3();W.pt(s,lat,0,p);add(k,G.xf(new T.BoxGeometry(w,h,d),p.x,y+h/2,p.z,0,W.yaw(s)+(rot||0),0))}
  function path(k,pts,r){add(k,new T.TubeGeometry(new T.CatmullRomCurve3(pts),Math.max(10,pts.length*(low?2:5)),r,low?4:5,false))}
  function point(s,lat,y){var p=new T.Vector3();W.pt(s,lat,0,p);p.y=y;return p}
  // Regional landmarks are authored silhouettes; shared materials keep them in a few draw calls.
  materials.ivory=mat('#ece2ca',{map:sandTex,roughness:.72});
  materials.copper=mat('#937049',{metalness:.5,roughness:.48});
  materials.mirror=mat('#aac1cc',{metalness:.78,roughness:.22,envMapIntensity:.75});
  materials.interior=mat('#284a59',{map:glassTex,metalness:.12,roughness:.64});
  materials.pool=mat('#2c9da2',{metalness:.25,roughness:.2});
  if(A.realism){['stone','plaster','ivory'].forEach(function(k){A.realism.surface(materials[k],'plaster',4)});A.realism.surface(materials.rock,'rock',12);A.realism.surface(materials.sand,'sand',15);['glass','interior'].forEach(function(k){materials[k].userData.realGlass=true});materials.mirror.color.copy(M.lin('#b9c4c6'));materials.mirror.roughness=.12;materials.mirror.metalness=.8;materials.mirror.envMapIntensity=.75;}
  materials.coral=mat('#d5c3a2',{roughness:.92});materials.chalk=mat('#eee8d8',{roughness:.9});
  materials.timber=mat('#665341',{roughness:.85});materials.teal=mat('#3b6259',{roughness:.83});
  materials.glazing=mat('#385362',{roughness:.28,metalness:.15,envMapIntensity:.65});
  materials.limestone=mat('#b99b78',{roughness:.95});materials.strata=mat('#8e7357',{roughness:1});
  if(A.realism){A.realism.surface(materials.coral,'plaster',3);A.realism.surface(materials.limestone,'rock',28);}
  // Fixed face separation: recess glazing, project frames; no coplanar decals.
  function heritageHouse(s,lat,w,d,floors,variant){
   var side=lat>0?1:-1,angle=-side*Math.PI/2,ca=Math.cos(angle),sa=Math.sin(angle),base=ground(lat,s),h=floors*4.8;
   function b(k,bw,bh,bd,x,y,z){box(k,bw,bh,bd,s+x*sa+z*ca,lat+x*ca-z*sa,base+y,angle)}
   var wall=variant%3===0?'chalk':(variant%3===1?'coral':'plaster'),wood=variant%2?'timber':'teal';
   b(wall,w,h,d,0,0,0);b('coral',w+.65,.45,d+.65,0,h,0);
   // Roof parapet is a hollow rim, not another intersecting solid box.
   b(wall,w,1.3,.5,0,h+.45,-d/2);b(wall,w,1.3,.5,0,h+.45,d/2);
   b(wall,.5,1.3,d,-w/2,h+.45,0);b(wall,.5,1.3,d,w/2,h+.45,0);
   b('dark',3,3.5,.18,0,.15,-d/2-.13);b(wood,3.8,.3,1.2,0,3.8,-d/2-.5);
   var bays=variant%3===0?2:3;
   for(var f=1;f<floors;f++)for(var j=0;j<bays;j++){
    var x=(j-(bays-1)/2)*(w/(bays+.4)),y=f*4.8;
    b(wood,3.1,3.7,1.45,x,y,-d/2-.65);b('dark',2.6,3,.12,x,y+.3,-d/2-1.44);
    for(var sl=-2;sl<=2;sl++)b(wood,.14,3.1,.16,x+sl*.48,y+.25,-d/2-1.57);
    for(var sl=0;sl<3;sl++)b(wood,2.8,.13,.18,x,y+.5+sl*1.05,-d/2-1.6);
    b(wood,3.5,.28,1.9,x,y+3.7,-d/2-.75);b(wood,.2,3.7,1.7,x-1.55,y,-d/2-.8);b(wood,.2,3.7,1.7,x+1.55,y,-d/2-.8);
   }
   if(variant%3===1){b('timber',w*.7,.25,d*.55,0,h+3,1);for(var x of [-w*.3,w*.3])b('timber',.25,2.6,.25,x,h+.45,1);}
   if(variant%4===0){b('coral',w*.45,2.5,d*.35,w*.2,h+.45,d*.2);}
  }
  function shape(k,g,s,lat,y,sx,sy,sz,rot){var p=point(s,lat,y);add(k,G.xf(g,p.x,p.y,p.z,0,W.yaw(s)+(rot||0),0,sx||1,sy||1,sz||1))}
  function ellipsoid(k,s,lat,y,rx,ry,rz,half){shape(k,new T.SphereGeometry(1,k==='green'?6:(low?16:24),k==='green'?4:(low?8:12),0,Math.PI*2,0,half?Math.PI/2:Math.PI),s,lat,y,rx,ry,rz)}
  function column(k,s,lat,y,r,h,top){shape(k,new T.CylinderGeometry(top===undefined?r:top,r,h,12),s,lat,y+h/2)}
  function arch(s,lat,y,r,k){var pts=[];for(var a=0;a<=16;a++){var t=a/16*Math.PI;pts.push(point(s,lat+Math.cos(t)*r,y+Math.sin(t)*r))}path(k||'ivory',pts,.35)}
  function tree(s,lat,y,h){
   column('timber',s,lat,y,.16,h*.65,.08);
   var crown=new T.IcosahedronGeometry(1,1),pos=crown.attributes.position;
   for(var v=0;v<pos.count;v++){var x=pos.getX(v),cy=pos.getY(v),z=pos.getZ(v),r=1+.13*Math.sin(x*9+z*7+cy*5);pos.setXYZ(v,x*r,cy*r,z*r);}
   crown.computeVertexNormals();G.colorize(crown,function(x,cy,z){var v=.72+.23*(cy+1)*.5;return [v*.86,v,v*.8]});
   materials.green.vertexColors=true;shape('green',crown,s,lat,y+h*.76,h*.33,h*.42,h*.3);
  }
  function palm(s,lat,h){var y=ground(lat,s);path('wood',[point(s,lat,y),point(s+1,lat+1,y+h)],.45);
   for(var n=0;n<9;n++){var angle=n*Math.PI*2/9,base=point(s,lat,y+h);var blade=G.grid(low?4:7,2,function(u,v,o){var reach=u*7.5,half=Math.sin(Math.PI*u)*.75,cross=(v*2-1)*half;o[0]=base.x+Math.cos(angle)*reach-Math.sin(angle)*cross;o[1]=base.y+Math.sin(Math.PI*u)*1.6-u*u*3.2-Math.abs(cross)*.3;o[2]=base.z+Math.sin(angle)*reach+Math.cos(angle)*cross;});add('green',blade);}

  }
  // A continuous terrain strip replaces disconnected rectangular display bases.
  for(var start=2700;start<7600;start+=600){
   for(var band=0;band<3;band++){
    var terrain=G.grid(low?(band===1?24:16):(band===1?36:28),low?24:48,function(u,v,o){var s=start+v*600;
     var bounds=[coast(s),80,270,1800],lat=bounds[band]+(bounds[band+1]-bounds[band])*u,p=point(s,lat,ground(lat,s));o[0]=p.x;o[1]=p.y;o[2]=p.z;});
    G.colorize(terrain,function(x,y,z,nx,ny){var cliff=(1-ss(.45,.85,ny))*ss(5300,5450,-z),stripe=.92+.08*Math.sin(y*.65+Math.sin(z*.012));
     return [.89-cliff*.2,.79-cliff*.22,.64-cliff*.22].map(function(c){return c*(1-cliff+cliff*stripe)});});
    var tm=mat('#ffffff',{vertexColors:true});if(A.realism)A.realism.surface(tm,'terrain',55);all.add(new T.Mesh(terrain,tm));
   }
  }
  // A single coast-following ocean, with depth colour, soft foam, waves and view-dependent reflection.
  var ocean=G.grid(low?20:52,low?100:250,function(u,v,o){var s=2500+v*5400,lat=coast(s)-u*5000;var p=point(s,coast(s),-.45);o[0]=p.x-u*5000;o[1]=p.y;o[2]=p.z;},{uvFn:function(u,v,o,k){return k===0?u*5000:v*5400}});
  var wu={time:{value:0},fogColor:{value:new T.Color('#728b9a')},fogDensity:{value:.0005}};waterUniforms.push(wu);
  var water=new T.ShaderMaterial({uniforms:wu,side:T.DoubleSide,extensions:{derivatives:true},vertexShader:`varying vec3 world;varying float shore;uniform float time;void main(){vec3 p=position;shore=uv.x;float strength=smoothstep(0.,40.,shore);p.y+=strength*(sin(p.x*.045+time*.45)*.28+sin(p.z*.065+p.x*.021-time*.3)*.17);world=p;gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}`,fragmentShader:`varying vec3 world;varying float shore;uniform float time;uniform vec3 fogColor;uniform float fogDensity;void main(){vec3 V=normalize(cameraPosition-world);float a=world.x*.033+world.z*.019+time*.6;float b=world.z*.041-world.x*.024-time*.4;vec3 N=normalize(vec3(cos(a)*.035+sin(b*.73)*.025,1.,sin(b)*.03+cos(a*.63)*.02));float fres=pow(1.-max(dot(N,V),0.),4.);vec3 c=mix(vec3(.018,.29,.29),vec3(.012,.085,.16),smoothstep(0.,180.,shore));c=mix(c,vec3(.39,.56,.62),fres*.65);float spec=pow(max(dot(reflect(normalize(vec3(-.4,-.8,-.3)),N),V),0.),45.);c+=vec3(.9,.75,.48)*spec*.18;float foam=(1.-smoothstep(1.,6.,shore+sin(world.z*.14+time)*1.8))*.55;c=mix(c,vec3(.72,.81,.74),foam);float fog=1.-exp(-pow(length(cameraPosition-world)*fogDensity,2.));gl_FragColor=vec4(mix(c,fogColor,min(.92,fog)),1.);}`});
  all.add(A.realism?A.realism.water(ocean,water):new T.Mesh(ocean,water));
  // Al Balad: staggered courtyard houses, street-facing rawashin and varied rooflines.
  for(var i=0;i<36;i++){
   var side=i%2?-1:1,s=2730+Math.floor(i/2)*42,lat=side*(46+(i%5===0?12:0));
   heritageHouse(s,lat,15+rand(i)*6,18+rand(i+5)*7,3+(i%4),i);
   if(i%4===0)heritageHouse(s+9,side*91,21,25,3+(i%3),i+2);
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
  // One contemporary waterfront tower: a continuous silhouette, podium and curtain wall.
  var profile=[];for(var j=0;j<=12;j++)profile.push(new T.Vector2(18-j*.72,5+j*10));
  shape('glazing',new T.LatheGeometry(profile,low?18:28),3470,115,0,1,1,.72);
  box('coral',53,5,41,3470,115,0);box('glazing',43,4,32,3470,115,5);
  for(var j=1;j<24;j++){var y=5+j*5,r=18-(y-5)*.072;shape('metal',new T.CylinderGeometry(r+.12,r+.12,.18,low?18:28,1,true),3470,115,y,1,1,.72);}
  for(var j=0;j<12;j++){var ang=j*Math.PI/6,pts=[];for(var k=0;k<=6;k++){var y=5+k*20,r=18-k*1.44;pts.push(point(3470+Math.sin(ang)*r*.72,115+Math.cos(ang)*r,y))}path('ivory',pts,.16);}
  for(var s=2750;s<3650;s+=28){palm(s,-25,10+(s%3));box('stone',5,.5,9,s,-26,ground(-26,s));}
  [-1,1].forEach(function(side){for(var s=2740;s<3480;s+=30){
   box('coral',10,.24,29.8,s,side*32,.12);
   if(Math.floor(s/30)%3===0){box('timber',3,.45,1,s,side*33,.5);box('stone',1,1.2,1,s+5,side*33,.36);}
  }});
  flush('continuous-jeddah-streets');
  // Corniche paving follows the shoreline rather than sitting on a square platform.
  var walk=G.grid(3,180,function(u,v,o){var s=2750+v*1700,lat=coast(s)+15+u*12;var p=point(s,lat,ground(lat,s)+.25);o[0]=p.x;o[1]=p.y;o[2]=p.z;});all.add(new T.Mesh(walk,materials.stone));
  for(var s=3000;s<4450;s+=36){var lat=coast(s)+34;palm(s,lat,12);box('metal',.25,6,.25,s,lat+5,ground(lat+5,s));box('warm',1.4,.18,.8,s,lat+5,ground(lat+5,s)+6)}
  // Fountain spray is a volume of fine droplets, not glowing wire arches.
  var drops=[];for(var i=0;i<900;i++){var t=rand(i),a=rand(i+909)*Math.PI*2,rad=(1-t)*19,p=point(3210+Math.sin(a)*rad,coast(3210)-35+Math.cos(a)*rad,1+t*80);drops.push(p.x,p.y,p.z)}
  var dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(drops,3));all.add(new T.Points(dg,new T.PointsMaterial({color:0xc9dfdc,size:.65,transparent:true,opacity:.6,depthWrite:false,map:A.tex('dot')})));
  // Shebara-inspired polished shells alternate with timber beach pavilions.
  for(var i=0;i<12;i++){var s=3700+i*55,lat=coast(s)-42-(i%3)*19;
   box('timber',25,.55,27,s,lat,2.1);
   var shell=new T.SphereGeometry(1,low?20:28,low?10:14,0,Math.PI*2,.0,Math.acos(-1/3));
   shape('mirror',shell,s,lat,8,12,6,10);
   // Glazing is below the metal shell rim, with a continuous visible frame.
   shape('glazing',new T.CylinderGeometry(11.2,11.2,3.2,low?20:28,1,true),s,lat,4.08,1,1,10/12);
   shape('metal',new T.CylinderGeometry(11.32,11.32,.25,low?20:28,1,true),s,lat,5.85,1,1,10/12);
   box('pool',10,.12,5,s-10.5,lat,2.46);
   var span=coast(s)-lat+22;box('timber',span,.45,2.2,s+8,(lat+coast(s)+22)/2,2.1);
   [-8,8].forEach(function(x){column('metal',s-8,lat+x,-2,.3,4.1);column('metal',s+8,lat+x,-2,.3,4.1)});
   if(i%3===0){var inland=coast(s)+58,y=ground(inland,s);box('coral',27,4,18,s,inland,y);box('glazing',24,3,.3,s-9.2,inland,y+.3);
    shape('timber',new T.ConeGeometry(19,5,4),s,inland,y+6,1,1,.7,Math.PI/4);}
  }
  flush('coastal-promenade-and-resorts');
  // NEOM is aligned to the track: two facades, a clear central corridor, interior terraces and overhead bridges.
  for(var i=0;i<26;i++){var s=4450+i*30;[-1,1].forEach(function(side){
   var h=92+12*Math.sin(i*.3),lat=side*49;
   box('mirror',24,h,29.2,s,side*50,1);
   // Recessed inner neighbourhoods: distinct voids, bridges, gardens and occupied floor plates.
   box('glazing',.7,h-4,28,s,side*37.2,2);
   box('metal',.4,h,1,s-14.4,side*36.6,1);
   for(var f=0;f<8;f++){
    var y=5+f*11,depth=5+rand(i*71+f*13+side)*9;
    if((i+f+(side>0?1:0))%4===0)continue;
    var center=side*(36-depth/2);
    box('ivory',depth,1.1,22,s,center,y);
    box('metal',.25,1.4,22,s,side*(36-depth),y+1.1);
    box('glazing',.35,7,18,s,side*35.8,y+1.3);
    for(var pane=-1;pane<=1;pane++)box('metal',.32,7,.25,s+pane*6,side*35.45,y+1.3);
    if((i+f)%3===0){
     box('stone',3,1.1,12,s+3,side*(37-depth),y+1.2);
     box('green',2.5,.45,11.5,s+3,side*(37-depth),y+2.35);
     tree(s+5,side*(37-depth),y+2.8,4);
    }
    if(f%2===0)box('warm',.12,.12,17,s,side*(36.15-depth),y+.6);
   }
   box('ivory',14,1.5,24,s,side*26,2);box('green',5,.7,17,s,side*25,3.5);
   if(i%2===0){palm(s,side*28,8);box('warm',.3,.2,18,s,side*21,4)}
  });
   if(i%7===2){
    var by=39+(i%3)*9;
    box('ivory',74,1.2,9,s,0,by);box('green',62,.35,4.5,s,0,by+1.3);
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
  var footing=Math.min(ground(ql-49,qs-56),ground(ql-49,qs+56),ground(ql+49,qs-56),ground(ql+49,qs+56))-3;
  box('limestone',98,qy-footing,112,qs,ql,footing);
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
  var roller=[];for(var i=0;i<=72;i++){var a=i/72*Math.PI*2;var rs=5600+Math.sin(a)*155,rl=-125+Math.cos(a)*65;roller.push(point(rs,rl,Math.max(35+Math.sin(a*3)*18+Math.cos(a)*12,ground(rl,rs)+12)))}var coasterCurve=new T.CatmullRomCurve3(roller.slice(0,-1),true);add('metal',new T.TubeGeometry(coasterCurve,low?160:240,.65,5,true));roller.filter(function(_,i){return i%5===0}).forEach(function(p){path('metal',[new T.Vector3(p.x,0,p.z),p],.7)});
  // Valley visitor pavilions: shaded low roofs, deep glazing, grounded plinths.
  for(var i=0;i<5;i++){var s=5420+i*80,w=22+i%3*4,lat=54,y=ground(lat,s);
   box('limestone',w,6,22,s,lat,y);box('glazing',w-3,4,.35,s-11.3,lat,y+.8);
   box('timber',w+5,.5,27,s,lat,y+6.1);
   for(var col=-2;col<=2;col++)box('copper',.35,6.5,.5,s-13,lat+col*4,y);
   palm(s,30,10);
  }
  // Rotating rim and upright gondolas use a small number of shared geometries/materials.
  var park=new T.Group(),wheelBase=point(5810,-75,35);park.position.copy(wheelBase);park.rotation.y=W.yaw(5810);all.add(park);
  var rim=new T.Group();park.add(rim);
  rim.add(new T.Mesh(new T.TorusGeometry(27,.65,6,low?48:64),materials.ivory));
  for(var j=0;j<8;j++){var angle=j*Math.PI/4;
   rim.add(new T.Mesh(G.bar([0,0,0],[27*Math.cos(angle),27*Math.sin(angle),0],.28),materials.metal));
  }
  [-6,6].forEach(function(z){[-14,14].forEach(function(x){park.add(new T.Mesh(G.bar([x,-35,z],[0,0,z],1),materials.ivory))})});
  var cabins=[],cabinGeo=new T.BoxGeometry(3.3,2.7,2.8),roofGeo=new T.BoxGeometry(3.7,.25,3.2);
  for(var j=0;j<8;j++){var cabin=new T.Group();cabin.add(new T.Mesh(cabinGeo,materials.glazing));var roof=new T.Mesh(roofGeo,materials.copper);roof.position.y=1.5;cabin.add(roof);park.add(cabin);cabins.push(cabin);}
  var coasterCars=[],bodyGeo=new T.BoxGeometry(2.2,.85,3.5),seatGeo=new T.BoxGeometry(1.8,.7,.35);
  for(var j=0;j<4;j++){var car=new T.Group(),body=new T.Mesh(bodyGeo,materials.warm);body.position.y=1;car.add(body);
   [-.85,.65].forEach(function(z){var seat=new T.Mesh(seatGeo,materials.teal);seat.position.set(0,1.65,z);car.add(seat);});
   all.add(car);coasterCars.push(car);
  }
  var rideClock=0,rideLast=null;
  function animateRides(time,active){
   if(rideLast!==null&&active)rideClock+=Math.min(.1,Math.max(0,time-rideLast));rideLast=time;
   var phase=rideClock*.12;rim.rotation.z=phase;
   cabins.forEach(function(c,j){var a=phase+j*Math.PI/4;c.position.set(27*Math.cos(a),27*Math.sin(a)-1.8,0);});
   coasterCars.forEach(function(c,j){var u=((rideClock/38-j*.006)%1+1)%1,p=coasterCurve.getPointAt(u),t=coasterCurve.getTangentAt(u);c.position.copy(p);c.lookAt(p.clone().add(t));});
  }
  for(var s=5900;s<6360;s+=28){palm(s,-26,11);palm(s,26,11);box('stone',8,.6,14,s,27,0);box('stone',8,.6,14,s,-27,0)}
  flush('qiddiya-valley-and-arrival');
  all.traverse(function(o){if(o.isMesh&&!o.material.isShaderMaterial){o.receiveShadow=true;o.castShadow=!o.material.isMeshBasicMaterial;}});
  all.userData.update=function(s,p,fog,time,active){animateRides(time||0,!!active);waterUniforms.forEach(function(u){u.time.value=p*70;u.fogColor.value.copy(fog)});};
  sets.push({id:'continuous-landscape',s:4400,lat:0,group:all});return sets;
 };
})();

