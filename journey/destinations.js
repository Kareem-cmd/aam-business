/* Four artistic destination scenes on the same reversible rail. Geometry is batched by material. */
(function(){
 'use strict';
 var T=THREE,A=window.AAM,W=A.world,G=A.G;
 W.destinations=function(){
  var specs=[{id:'jeddah',s:3250,lat:-300},{id:'redsea',s:4050,lat:300},{id:'neom',s:4850,lat:-300},{id:'qiddiya',s:5650,lat:300}];
  var mats={sand:new T.MeshStandardMaterial({color:0xc5a57b,roughness:.92}),stone:new T.MeshStandardMaterial({color:0xeadac1,roughness:.85}),wood:new T.MeshStandardMaterial({color:0x345a64,roughness:.65}),glass:new T.MeshStandardMaterial({color:0x8bc8d5,metalness:.8,roughness:.22}),rock:new T.MeshStandardMaterial({color:0xa26348,roughness:1}),water:new T.MeshStandardMaterial({color:0x087d91,metalness:.55,roughness:.24}),green:new T.MeshStandardMaterial({color:0x2f7360,roughness:.9}),light:new T.MeshBasicMaterial({color:0x94e8cf}),warm:new T.MeshBasicMaterial({color:0xffdba0})};
  Object.keys(mats).forEach(function(k){mats[k].color.convertSRGBToLinear();mats[k].envMapIntensity=.45});
  return specs.map(function(spec){
   var group=new T.Group(),batches={},point=new T.Vector3();W.pt(spec.s,spec.lat,0,point);group.position.set(point.x,0,point.z);
   function add(key,geo){(batches[key]||(batches[key]=[])).push(geo)}
   function box(key,w,h,d,x,y,z,ry){add(key,G.xf(new T.BoxGeometry(w,h,d),x,y+h/2,z,0,ry||0,0))}
   function ball(key,r,x,y,z,sx,sy,sz){add(key,G.xf(new T.SphereGeometry(r,12,8),x,y,z,0,0,0,sx||1,sy||1,sz||1))}
   function tube(key,pts,r){add(key,new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(function(p){return new T.Vector3(p[0],p[1],p[2])})),Math.max(24,pts.length*8),r,6,false))}
   function palm(x,z,h){tube('wood',[[x,1,z],[x+1,h,z]],1);for(var k=0;k<7;k++){var a=k*Math.PI*2/7;tube('green',[[x,h,z],[x+Math.cos(a)*6,h+3,z+Math.sin(a)*6],[x+Math.cos(a)*12,h-3,z+Math.sin(a)*12]],1.3)}}
   function water(){box('water',650,1,650,0,.3,0);for(var i=0;i<16;i++)box('light',20+(i%4)*9,.05,.25,-240+(i*67)%470,1.1,-270+i*34)}
   if(spec.id==='jeddah'){
    water();box('sand',280,3,320,15,0,10);box('stone',290,2,18,0,3,165);
    for(var i=0;i<22;i++){var x=-100+(i%6)*39,z=-100+Math.floor(i/6)*62,h=24+(i%5)*8;box('stone',26,h,30,x,3,z);box('sand',29,2,33,x,h+3,z);for(var j=0;j<3;j++){box('wood',5,h*.65,1.5,x-8+j*8,12,z+16);box('warm',2,4,1.7,x-8+j*8,17,z+17);for(var floor=0;floor<3;floor++)box('stone',6,.6,2,x-8+j*8,13+floor*7,z+17)}}
    for(var n=0;n<9;n++)palm(-110+n*28,145,18+(n%3)*3);
    // Sculptural fountain and corniche, an artistic impression of Jeddah.
    for(var i=0;i<7;i++){var a=i*Math.PI*2/7; tube('light',[[135,2,-110],[135+Math.cos(a)*7,100,-110+Math.sin(a)*7],[135+Math.cos(a)*18,145,-110+Math.sin(a)*18],[135+Math.cos(a)*40,2,-110+Math.sin(a)*40]],.65)}
   }else if(spec.id==='redsea'){
    water();ball('sand',90,-30,0,-15,1.6,.08,1.2);ball('green',60,-30,5,-15,1.5,.08,1);
    for(var n=0;n<24;n++)palm(-85+(n%6)*25,-60+Math.floor(n/6)*28,15+(n%4)*3);
    for(var i=0;i<12;i++){var a=i*.47,x=Math.cos(a)*135,z=Math.sin(a)*135;box('wood',6,1,100,x*.7,4,z*.7,a);box('stone',24,8,20,x,5,z,a);add('sand',G.xf(new T.ConeGeometry(21,9,4),x,17,z,0,a+Math.PI/4,0));box('warm',18,.2,2,x,7,z+11,a)}
    for(var i=0;i<4;i++){var x=-180+i*100;ball('stone',10,x,3,220,1,.25,2.5);tube('wood',[[x,4,220],[x,36,220]],.4);add('stone',G.xf(new T.ConeGeometry(12,28,3),x,22,220,0,0,Math.PI/9))}
   }else if(spec.id==='neom'){
    box('sand',650,3,650,0,-2,0);
    for(var i=0;i<11;i++){var x=-190+i*38;box('glass',35,100,24,x,0,-55);box('glass',35,100,24,x,0,45);box('light',.5,100,25,x+17,0,-55);box('light',.5,100,25,x+17,0,45);box('green',31,1,65,x,1,-5);for(var floor=1;floor<12;floor++){box('wood',35,.35,.3,x,floor*8,-67.2);box('wood',35,.35,.3,x,floor*8,57.2)}}
    for(var i=0;i<9;i++)ball('rock',70,-260+(i%3)*240,10,-230-Math.floor(i/3)*70,1,.8,1);
    tube('light',[[-240,2,110],[-100,3,100],[60,3,110],[230,2,95]],.7);
   }else{
    box('sand',650,2,650,0,-1,0);
    for(var i=0;i<12;i++){var x=-240+i*44,h=65+(i%4)*20;add('rock',G.xf(new T.CylinderGeometry(26,43,h,7),x,h/2,-160,0,i*.41,0,1,1,1.8));add('sand',G.xf(new T.CylinderGeometry(27,29,4,7),x,h,-160,0,i*.41,0,1,1,1.8))}
    var pts=[];for(var i=0;i<=32;i++){var a=i/32*Math.PI*2;pts.push([Math.cos(a)*155,30+Math.sin(a*3)*20+(1+Math.cos(a))*18,Math.sin(a)*100+35])}tube('light',pts,1.4);
    pts.filter(function(_,i){return i%2===0}).forEach(function(p){tube('wood',[[p[0],1,p[2]],p],1)});
    for(var i=0;i<8;i++){box(i%2?'glass':'stone',30,12+(i%3)*8,24,-130+i*38,0,170);add('stone',G.xf(new T.ConeGeometry(24,10,4),-130+i*38,27,170,0,Math.PI/4,0));}
    var ring=[];for(var j=0;j<=40;j++){var a=j/40*Math.PI*2;ring.push([-170+Math.cos(a)*34,42+Math.sin(a)*34,130]);if(j%5===0){tube('wood',[[-170,42,130],ring[ring.length-1]],.45);ball('warm',3,ring[ring.length-1][0],ring[ring.length-1][1]-3,130)}}tube('light',ring,.9);tube('wood',[[-188,1,130],[-170,42,130],[-152,1,130]],1.4);
   }
   Object.keys(batches).forEach(function(key){var mesh=new T.Mesh(G.merge(batches[key]),mats[key]);group.add(mesh)});
   group.visible=false;spec.group=group;return spec;
  });
 };
})();
