/* Photographic CC0 surfaces and bounded real-time reflections. See pbr/ATTRIBUTION.json. */
(function(){
 'use strict';
 var mobile=matchMedia('(pointer: coarse)').matches||Math.min(innerWidth,innerHeight)<600;
 var T=THREE,A=window.AAM,loader=new T.TextureLoader(),cache={},refresh=function(){},generation=0;
 function texture(file,color){
  if(cache[file])return cache[file];
  var t=loader.load('pbr/'+file,function(){refresh()},undefined,function(){document.documentElement.dataset.materialFallback='true';refresh()});
  t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=mobile?2:4;t.encoding=color?T.sRGBEncoding:T.LinearEncoding;cache[file]=t;return t;
 }
 function pack(kind){return {color:texture((mobile?'mobile/':'')+kind+'-Diffuse.jpg',true),normal:null,arm:mobile?null:texture(kind+'-arm.jpg',false)}}
 var packs={};
 function surface(mat,kind,meters){
  mat.userData.realSurface={kind:kind,meters:meters};return mat;
 }
 function patchSurface(mat,light){
  var desc=mat.userData.realSurface;if(!desc)return;light=mobile||light;
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
vec4 realSample(sampler2D t){vec3 p=realPosition/realMeters;${terrain?'return texture2D(t,p.xz);':light?'vec3 n=abs(realWorldNormal);vec2 uv=n.y>max(n.x,n.z)?p.xz:(n.x>n.z?p.zy:p.xy);return texture2D(t,uv);':'vec3 w=realWeights();return texture2D(t,p.zy)*w.x+texture2D(t,p.xz)*w.y+texture2D(t,p.xy)*w.z;'}}
`+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`vec3 realAlbedo=realSample(realColor).rgb;
${terrain?'realAlbedo=mix(realAlbedo,realSample(realRock).rgb,smoothstep(7.,34.,realPosition.y)*.8);':''}
diffuseColor.rgb*=pow(mix(vec3(1.),realAlbedo,${terrain?'.48':'.65'}),vec3(2.2));
${light?'':'diffuseColor.rgb*=mix(.88,1.,realSample(realArm).r);'}`);
   if(!light)s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=clamp(roughnessFactor*realSample(realArm).g,.55,1.);');

  };
  mat.customProgramCacheKey=function(){return 'aam-real-v3-'+desc.kind+'-'+light};mat.needsUpdate=true;
 }
 function water(geometry,fallback){
  var low=mobile||innerWidth<700||(navigator.deviceMemory&&navigator.deviceMemory<=2);
  if(low||!T.Water)return new T.Mesh(geometry,fallback);
  // A single HDR-lit surface avoids recursive planar captures during depth/plate rendering.
  var indices=geometry.index.array;for(var i=0;i<indices.length;i+=3){var swap=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=swap;}geometry.index.needsUpdate=true;geometry.computeVertexNormals();
  var normal=texture('water-normal.jpg',false);normal.repeat.set(1/45,1/45);
  var mat=new T.MeshStandardMaterial({color:0x367b83,roughness:.28,metalness:.3,envMapIntensity:.8,normalMap:normal,normalScale:new T.Vector2(.28,.28)});
  var flow={value:0};mat.onBeforeCompile=function(shader){shader.uniforms.realFlow=flow;shader.fragmentShader='uniform float realFlow;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',T.ShaderChunk.normal_fragment_maps.replace(/vUv/g,'(vUv+vec2(realFlow*.002,realFlow*.001))'));
  };mat.customProgramCacheKey=function(){return 'aam-ocean-hdr-v1'};
  var mesh=new T.Mesh(geometry,mat);mesh.userData.realWater=true;mesh.userData.waterFlow=flow;return mesh;
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
  return {update:function(s,sun){waters.forEach(function(w){w.userData.waterFlow.value=s*.012;})}};
 }};
})();

