import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {TextureLoader, RepeatWrapping, SRGBColorSpace, Mesh, PlaneGeometry, MeshStandardMaterial} from './vendor/three.module.js';
import {addBucharestLandscape} from './bucharest-landscape.js?v=4';
import {CITY_OFFSET_Z,CITY_SCALE_XZ,CITY_SCALE_Y} from './city-layout.js?v=2';

// Map3D's exported city is merged by facade type for mobile devices.
// The map is placed beyond the north-facing exterior windows, not in the hall.
export function addBucharestView({scene}) {
  const loader = new GLTFLoader();
  const textureLoader = new TextureLoader();
  const litMaterials = new Set();
  let nightLevel = 0;
  function facadeTexture(path) {
    const texture = textureLoader.load(path, undefined, undefined,
      error => console.warn('Nu s-a putut încărca textura fațadei:', error));
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    return texture;
  }
  const facades = {
    plaster: facadeTexture('./assets/oras-fatada-fotorealista.jpg'),
    balconies: facadeTexture('./assets/oras-fatada-rezidentiala.jpg'),
    brick: facadeTexture('./assets/oras-caramida.png'),
    concrete: facadeTexture('./assets/oras-fatada-beton-foto.jpg'),
    blue_glass: facadeTexture('./assets/oras-sticla-fotorealista.jpg'),
    grey_glass: facadeTexture('./assets/oras-sticla-gri-detaliata.jpg')
  };
  // Each mask lights only selected window panes; black areas stay unlit.
  const windowLights = {
    plaster: facadeTexture('./assets/city-lights-plaster.png'),
    balconies: facadeTexture('./assets/city-lights-balconies.png'),
    brick: facadeTexture('./assets/city-lights-brick.png'),
    concrete: facadeTexture('./assets/city-lights-concrete.png'),
    blue_glass: facadeTexture('./assets/city-lights-blue.png'),
    grey_glass: facadeTexture('./assets/city-lights-grey.png')
  };
  loader.load('./assets/bucuresti-variate.glb', gltf => {
    const city = gltf.scene;
    city.name = 'bucharest-map3d-exterior';
    // The model's ground is at y=0, the same height as the atrium ground floor.
    city.scale.set(CITY_SCALE_XZ, CITY_SCALE_Y, CITY_SCALE_XZ);
    city.position.set(0, 0, CITY_OFFSET_Z);
    city.traverse(object => {
      if (!object.isMesh) return;
      object.castShadow = false;
      object.receiveShadow = false;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        material.fog = false;
        if (facades[material.name]) material.map = facades[material.name];
        if (windowLights[material.name] && material.emissive) {
          material.emissive.set('#ffffff');
          material.emissiveMap = windowLights[material.name];
          material.emissiveIntensity = nightLevel;
          litMaterials.add(material);
        }
        material.needsUpdate = true;
      }
    });
    scene.add(city);
    // Extend the ground under the terrace so there is no sky-visible gap.
    // Keep the far edge and the buildings in place; the surface sits below the terrace.
    const ground = new Mesh(new PlaneGeometry(104, 114), new MeshStandardMaterial({
      color: '#77766d', roughness: 1, metalness: 0
    }));
    ground.name = 'bucharest-exterior-ground';
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(-1, -.02, CITY_OFFSET_Z + 7);
    ground.receiveShadow = false;
    scene.add(ground);
    // Small pitched roof accents are merged into one mesh and stay within the
    // footprints of suitable low-rise buildings.
    loader.load('./assets/oras-acoperisuri.glb', result => {
      const roofs=result.scene;roofs.name='bucharest-roof-details';
      roofs.scale.set(CITY_SCALE_XZ,CITY_SCALE_Y,CITY_SCALE_XZ);roofs.position.set(0,0,CITY_OFFSET_Z);
      roofs.traverse(object=>{
        if(!object.isMesh)return;
        object.castShadow=false;object.receiveShadow=false;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        for(const material of materials)material.fog=false;
      });
      scene.add(roofs);
    },undefined,error=>console.warn('Nu s-au putut încărca detaliile acoperișurilor:',error));
    addBucharestLandscape({scene});
  }, undefined, error => console.warn('Nu s-a putut încărca vederea exterioară:', error));
  return {
    setSolarAltitude(degrees) {
      // Fade in during civil twilight and go fully dark in daylight.
      const t = Math.max(0, Math.min(1, (2 - degrees) / 8));
      nightLevel = t * t * (3 - 2 * t) * 1.3;
      for (const material of litMaterials) material.emissiveIntensity = nightLevel;
    }
  };
}
