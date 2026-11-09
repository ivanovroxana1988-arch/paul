// A floor-only material: procedural joints and per-slab texture offsets over
// the approved stone reference. It does not add geometry or alter collisions.
export function applyFloorStone({T,scene}) {
 const image=new T.TextureLoader();
 image.load('./assets/pardoseala-albedo.png',texture=>{
  texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=texture.wrapT=T.MirroredRepeatWrapping;
  texture.anisotropy=4;
  const variants=new Map();
  scene.traverse(object=>{
   if(!object.isMesh || !(object.name==='terrace-with-open-void'||object.name==='central-hall-floor'||object.name==='lower-floor'||object.name==='pool-stone-rim'||object.name.startsWith('stair-')))return;
   const source=object.material;
   if(!source || Array.isArray(source) || !source.isMeshStandardMaterial)return;
   let material=variants.get(source);
   if(!material){
    material=source.clone();
    material.roughness=.72;
    material.metalness=0;
    material.onBeforeCompile=shader=>{
     shader.uniforms.floorStoneTexture={value:texture};
     shader.vertexShader=shader.vertexShader
      .replace('#include <common>','#include <common>\nvarying vec3 vFloorWorld;\nvarying vec3 vFloorNormal;')
      .replace('#include <begin_vertex>','#include <begin_vertex>\nvFloorWorld=(modelMatrix*vec4(transformed,1.0)).xyz;\nvFloorNormal=normalize(mat3(modelMatrix)*normal);');
     shader.fragmentShader=shader.fragmentShader
      .replace('#include <common>',`#include <common>
uniform sampler2D floorStoneTexture;
varying vec3 vFloorWorld;
varying vec3 vFloorNormal;
float floorHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}`)
      .replace('#include <map_fragment>',`#include <map_fragment>
// World-space coordinates keep slab sizes stable even on the large extruded terrace.
float floorTop=smoothstep(.55,.88,abs(normalize(vFloorNormal).y));
vec2 floorPos=vFloorWorld.xz/vec2(1.45,1.10);
float floorRow=floor(floorPos.y);
floorPos.x+=mod(floorRow,2.0)*.38;
vec2 floorCell=floor(floorPos), floorLocal=fract(floorPos);
float floorRandom=floorHash(floorCell);
vec2 floorOffset=vec2(floorRandom,floorHash(floorCell+13.7))*1.6;
vec2 floorUV=floorLocal*.72+floorOffset;
if(floorRandom>.5)floorUV.x=1.0-floorUV.x;
vec3 floorColor=texture2D(floorStoneTexture,floorUV).rgb;
float floorEdge=min(min(floorLocal.x,1.0-floorLocal.x),min(floorLocal.y,1.0-floorLocal.y));
float floorJoint=1.0-smoothstep(.004,.026,floorEdge);
float floorShade=mix(.88,1.10,floorRandom);
floorColor*=floorShade;
floorColor=mix(floorColor,floorColor*.43,floorJoint*.72);
diffuseColor.rgb=mix(diffuseColor.rgb,diffuse*floorColor,floorTop);`)
      .replace('#include <roughnessmap_fragment>',`#include <roughnessmap_fragment>
roughnessFactor=mix(roughnessFactor,mix(.62,.82,floorRandom),floorTop);`)
      .replace('#include <normal_fragment_maps>',`#ifdef USE_BUMPMAP
if(floorTop>.5){
 float floorHeight=dot(floorColor,vec3(.2126,.7152,.0722))*.25-floorJoint*.15;
 normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(floorHeight),dFdy(floorHeight))*.06,faceDirection);
}else{
 normal=perturbNormalArb(-vViewPosition,normal,dHdxy_fwd(),faceDirection);
}
#else
#include <normal_fragment_maps>
#endif`);
    };
    material.customProgramCacheKey=()=> 'paul-floor-stone-v1';
    material.needsUpdate=true;
    variants.set(source,material);
   }
   object.material=material;
  });
 },undefined,()=>console.warn('Textura pardoselii nu a putut fi încărcată; rămâne materialul anterior.'));
}

