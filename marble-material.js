// Weathered architectural marble in world coordinates. Shared across separate meshes,
// so it does not restart at each arch block or repeat a rectangular image tile.
// The underlying canvas maps remain the compatibility fallback for non-WebGL viewers.
export function useWeatheredMarble(material) {
  material.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMarbleWorld;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMarbleWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vMarbleWorld;
float marbleHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float marbleNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f*f*(3.0-2.0*f);
  return mix(mix(mix(marbleHash(i), marbleHash(i+vec3(1,0,0)), f.x),
                 mix(marbleHash(i+vec3(0,1,0)), marbleHash(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(marbleHash(i+vec3(0,0,1)), marbleHash(i+vec3(1,0,1)), f.x),
                 mix(marbleHash(i+vec3(0,1,1)), marbleHash(i+vec3(1,1,1)), f.x), f.y), f.z);
}
float marbleFbm(vec3 p) {
  return .57*marbleNoise(p) + .28*marbleNoise(p*2.03+vec3(13.7,4.1,8.3))
       + .15*marbleNoise(p*4.11+vec3(2.4,17.9,5.2));
}`)
      .replace('#include <map_fragment>', `
// World-space multi-scale deposits and irregular, interrupted mineral veins.
vec3 mp = vMarbleWorld;
float macroCloud = marbleFbm(mp * .20 + vec3(4.3, 1.8, 9.2));
float stoneCloud = marbleFbm(mp * .68 + vec3(7.7, 2.6, 3.1));
float warp = marbleFbm(mp * .53 + vec3(15.0, 3.1, 7.2));
float veinField = marbleFbm(mp * vec3(.72, 1.35, .76) + vec3(warp*1.2, 0.0, warp*.8));
float vein = 1.0-smoothstep(.006,.026,abs(veinField-.47));
vein *= smoothstep(.35,.68,stoneCloud);
float grain = marbleNoise(mp * 20.0 + vec3(3.3,8.9,5.4));
float pores = smoothstep(.76,.89,marbleNoise(mp * 32.0 + vec3(2.0,11.0,6.0)));
vec3 base = mix(vec3(.38,.36,.33),vec3(.68,.64,.58),smoothstep(.22,.78,macroCloud));
base *= mix(.79,1.10,stoneCloud);
base *= mix(.89,1.08,grain);
base = mix(base,vec3(.24,.23,.21),vein*.38 + pores*.20);
// Keep tinting of the scene's three existing stone materials and lighting.
diffuseColor.rgb = diffuse * base;`)
      .replace('#include <roughnessmap_fragment>', `
float roughnessFactor = clamp(roughness * mix(.87,1.0,stoneCloud), .68, 1.0);`)
      // A repeated bitmap bump would reintroduce a visible tile on the WebGL path.
      .replace('#include <normal_fragment_maps>', '');
  };
  material.customProgramCacheKey = () => 'weathered-marble-world-v1';
  material.needsUpdate = true;
  return material;
}
