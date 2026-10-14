/* Photographic CC0 surfaces and bounded real-time reflections. See pbr/ATTRIBUTION.json. */
(function(){
 'use strict';
 var T=THREE,A=window.AAM,loader=new T.TextureLoader(),cache={},refresh=function(){},generation=0;
 function texture(file,color){
  if(cache[file])return cache[file];
  var t=loader.load('pbr/'+file,function(){refresh()},undefined,function(){document.documentElement.dataset.materialFallback='true';refresh()});
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;t.encoding=color?T.sRGBEncoding:T.LinearEncoding;cache[file]=t;return t;
 }
 function pack(kind){return {color:texture(kind+'-Diffuse.jpg',true),normal:texture(kind+'-nor_gl.jpg',false),arm:texture(kind+'-arm.jpg',false)}}
 var packs={};
 function surface(mat,kind,meters){
  mat.userData.realSurface={kind:kind,meters:meters};return mat;
 }
 function patchSurface(mat,light){
  var desc=mat.userData.realSurface;if(!desc)return;
  var key=desc.kind==='terrain'?'sand':desc.kind,p=packs[key]||(packs[key]=pack(key));
  var terrain=desc.kind==='terrain',rock=terrain?(packs.rock||(packs.rock=pack('rock'))):p;
  mat.map=null;mat.bumpMap=null;mat.bumpScale=0;mat.roughness=.94;mat.metalness=0;
  var previous=mat.onBeforeCompile;
  mat.onBeforeCompile=function(s){
   if(previous)previous.call(mat,s);
   Object.assign(s.uniforms,{realColor:{value:p.color},realNormal:{value:p.normal},realArm:{value:p.arm},realRock:{value:rock.color},realMeters:{value:desc.meters}});
   s.vertexShader='varying vec3 realPosition; varying vec3 realWorldNormal;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nrealPosition=(modelMatrix*vec4(position,1.)).xyz;realWorldNormal=normalize(mat3(modelMatrix)*normal);');
   s.fragmentShader=`varying vec3 realPosition; varying vec3 realWorldNormal;
uniform sampler2D realColor,realNormal,realArm,realRock; uniform float realMeters;
vec3 realWeights(){vec3 w=pow(abs(normalize(realWorldNormal)),vec3(6.));return w/max(.001,w.x+w.y+w.z);}
vec4 realSample(sampler2D t){vec3 p=realPosition/realMeters;vec3 w=realWeights();return texture2D(t,p.zy)*w.x+texture2D(t,p.xz)*w.y+texture2D(t,p.xy)*w.z;}
`+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 realAlbedo=realSample(realColor).rgb;
${terrain?'realAlbedo=mix(realAlbedo,realSample(realRock).rgb,smoothstep(7.,34.,realPosition.y)*.8);':''}
diffuseColor.rgb*=pow(realAlbedo,vec3(2.2));
diffuseColor.rgb*=mix(.78,1.,realSample(realArm).r);`);
   s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*realSample(realArm).g,.55,1.);');
   if(!light)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
vec3 rp=realPosition/realMeters,rw=realWeights(),rn=normalize(realWorldNormal);
vec3 nx=texture2D(realNormal,rp.zy).xyz*2.-1.;vec3 ny=texture2D(realNormal,rp.xz).xyz*2.-1.;vec3 nz=texture2D(realNormal,rp.xy).xyz*2.-1.;
vec3 detail=normalize(vec3(nx.z*sign(rn.x),nx.y,nx.x)*rw.x+vec3(ny.x,ny.z*sign(rn.y),ny.y)*rw.y+vec3(nz.x,nz.y,nz.z*sign(rn.z))*rw.z);
normal=normalize(mix(normal,mat3(viewMatrix)*detail,.16));`);
  };
  mat.customProgramCacheKey=function(){return 'aam-real-v1-'+desc.kind+'-'+light};mat.needsUpdate=true;
 }
 function water(geometry,fallback){
  var low=innerWidth<700||(navigator.deviceMemory&&navigator.deviceMemory<=2);
  if(low||!T.Water)return new T.Mesh(geometry,fallback);
  // Water.js expects its plane normal along local Z. Rotate geometry and mesh inversely.
  geometry.translate(0,.45,0);geometry.rotateX(Math.PI/2);
  var w=new T.Water(geometry,{textureWidth:512,textureHeight:256,waterNormals:texture('water-normal.jpg',false),sunDirection:new T.Vector3(-.42,.2,-.885).normalize(),sunColor:0xffcf9f,waterColor:0x167c82,distortionScale:1.25,fog:true,side:T.DoubleSide});
  w.rotation.x=-Math.PI/2;w.position.y=-.45;w.userData.realWater=true;
  var m=w.material;
  m.vertexShader='varying float shoreDistance;\n'+m.vertexShader;
  m.vertexShader=m.vertexShader.replace('mirrorCoord = modelMatrix','shoreDistance=uv.x;\nmirrorCoord = modelMatrix');
  m.fragmentShader='varying float shoreDistance;\n'+m.fragmentShader;
  m.fragmentShader=m.fragmentShader.replace('float rf0 = 0.3;','float rf0 = 0.0204;');
  m.fragmentShader=m.fragmentShader.replace('vec3 outgoingLight = albedo;',`vec3 shallow=vec3(.025,.25,.23);float depth=smoothstep(0.,150.,shoreDistance);
vec3 outgoingLight=mix(mix(shallow,waterColor,depth)*.48,albedo,.82);
float foam=(1.-smoothstep(.8,3.8,shoreDistance+sin(worldPosition.z*.18-time)*1.1))*.22;
outgoingLight=mix(outgoingLight,vec3(.48,.57,.5),foam);`);
  m.fragmentShader=m.fragmentShader.replace('#include <tonemapping_fragment>','#include <tonemapping_fragment>\n#include <encodings_fragment>');
  var capture=w.onBeforeRender,last=-1e6;
  w.onBeforeRender=function(renderer,scene,camera){
   var now=performance.now();if(now-last<120)return;
   last=now;capture.call(w,renderer,scene,camera);
  };
  return w;
 }
 A.realism={surface:surface,water:water,install:function(scene,renderer,light,invalidate){
  var own=++generation,seen=new Set(),waters=[];refresh=invalidate;
  scene.traverse(function(o){
   if(o.userData.realWater)waters.push(o);
   (o.material?[].concat(o.material):[]).forEach(function(m){if(seen.has(m))return;seen.add(m);patchSurface(m,light);
    if(m.isMeshStandardMaterial&&m.userData.realGlass){m.roughness=.17;m.metalness=.35;m.envMapIntensity=.9;}
   });
  });
  new T.RGBELoader().setDataType(T.HalfFloatType).load('pbr/dusk-sky.hdr',function(hdr){
   if(own!==generation){hdr.dispose();return;}
   var pm=new T.PMREMGenerator(renderer),target=pm.fromEquirectangular(hdr),old=scene.environment;
   scene.environment=target.texture;hdr.dispose();pm.dispose();if(old)old.dispose();
   document.documentElement.dataset.realEnvironment='ready';invalidate();
  },undefined,function(){document.documentElement.dataset.realEnvironment='fallback';invalidate()});
  return {update:function(s,sun){waters.forEach(function(w){var u=w.material.uniforms;u.time.value=s*.012;u.sunColor.value.copy(sun.color).multiplyScalar(Math.min(1.2,sun.intensity));})}};
 }};
})();
