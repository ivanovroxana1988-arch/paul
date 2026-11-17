// Paul's Artspace basement: integrate the glass-aligned GLB without duplicating
// the ground-floor glass, metal frame or existing stair geometry from levels.js.
import { GLTFLoader } from './vendor/loaders/GLTFLoader.js';
import { PIT } from './levels.js';

export const BASEMENT_ASSET = './assets/subsol_paul_geam_parter_v4_web.glb';

export function loadBasementThroughGlass({ T, scene, onLoaded, onError }) {
  const loader = new GLTFLoader();
  // The model was authored in the same X/Z coordinates as levels.js. Its local
  // y=0 is the lower floor, and is positioned at -PIT.depth in the site.
  const onFail = (error) => {
    console.warn('Subsol: GLB unavailable; rest of site remains navigable.', error);
    onError?.(error);
  };
  return loader.load(
    BASEMENT_ASSET,
    ({ scene: basement }) => {
      basement.name = 'paul-basement-photographic-v4';
      basement.position.set(0, -PIT.depth, 0);
      basement.rotation.set(0, 0, 0);
      basement.scale.setScalar(1);
      basement.userData.glassBounds = {
        minX: PIT.stairRight, maxX: PIT.right, minZ: PIT.far, maxZ: PIT.near,
      };
      basement.userData.stairBounds = {
        minX: PIT.left, maxX: PIT.stairRight, minZ: PIT.far, maxZ: PIT.near,
      };
      basement.traverse((part) => {
        if (!part.isMesh) return;
        // The existing levels.js owns collision and the structural glass.
        // Do not turn imported floor, roof or murals into additional blockers.
        const isFloor = part.name.startsWith('FLOOR_');
        const isRoof = part.name.startsWith('ROOF_');
        part.castShadow = !isFloor && !isRoof;
        part.receiveShadow = true;
        part.frustumCulled = true;
      });

      // Local, affordable fill lighting. The existing daylight and two warm
      // stairwell lamps from levels.js remain authoritative.
      for (const [x, y, z, color, intensity, distance] of [
        [-3.4, -1.9, 8.0, '#e6efff', 4.0, 11],
        [3.5, -2.0, 4.0, '#ffdeb6', 3.0, 11],
        [-5.2, -2.2, -3.1, '#f4e6d7', 3.2, 9],
      ]) {
        const lamp = new T.PointLight(color, intensity, distance, 2);
        lamp.position.set(x, y, z);
        lamp.castShadow = false;
        basement.add(lamp);
      }

      // Geometry sanity checks (also useful in the browser console).
      const bounds = new T.Box3().setFromObject(basement);
      if (bounds.max.y >= -0.7) {
        console.warn('Subsol: height overlaps parter; check model placement.', bounds);
      }
      scene.add(basement);
      console.info('Subsol V4 încărcat. Deschiderea geamului și scara sunt păstrate.', bounds);
      onLoaded?.(basement);
    },
    undefined,
    onFail,
  );
}
