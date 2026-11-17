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
      // Correct the source GLB's reversed surface orientation without rotating
      // the whole basement: rotation would move the stair and glass opening.
      basement.traverse((part) => {
        if (!part.isMesh) return;
        if (part.name === 'FLOOR_photo_overlay_site_aligned') {
          // The exported photographed floor faces down (-Y). Flip triangle
          // winding so the real walking surface faces the visitor (+Y).
          const geometry = part.geometry.clone();
          if (geometry.index) {
            const indices = geometry.index;
            for (let i = 0; i + 2 < indices.count; i += 3) {
              const tmp = indices.getX(i + 1);
              indices.setX(i + 1, indices.getX(i + 2));
              indices.setX(i + 2, tmp);
            }
            indices.needsUpdate = true;
          } else {
            // Nonindexed fallback, keep every vertex attribute consistent.
            for (const attr of Object.values(geometry.attributes)) {
              if (attr.isInterleavedBufferAttribute) continue;
              for (let i = 0; i + 2 < attr.count; i += 3) {
                for (let c = 0; c < attr.itemSize; c++) {
                  const tmp = attr.getComponent(i + 1, c);
                  attr.setComponent(i + 1, c, attr.getComponent(i + 2, c));
                  attr.setComponent(i + 2, c, tmp);
                }
              }
              attr.needsUpdate = true;
            }
          }
          geometry.computeVertexNormals();
          part.geometry = geometry;
          part.userData.correctedFloorFacing = '+Y';
        }
        if (part.name === 'MURAL_PINK_FRONT_PHOTO') {
          // The pink mural is mounted on the west wall, but its plane was
          // authored facing -X. Seen from the room (+X), the photo was mirrored.
          const geometry = part.geometry.clone();
          const uv = geometry.getAttribute('uv');
          if (uv) {
            for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
            uv.needsUpdate = true;
            part.geometry = geometry;
          }
          part.userData.correctedMuralOrientation = 'viewed-from-center';
        }
      });

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
        // Coordinates are LOCAL to the basement group at world y=-4.2.
        [-3.4, 2.3, 8.0, '#e6efff', 4.0, 11],
        [3.5, 2.2, 4.0, '#ffdeb6', 3.0, 11],
        [-5.2, 2.0, -3.1, '#f4e6d7', 3.2, 9],
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
      console.info('Subsol V4: fețe orientate corect, geamul și scara păstrate.', bounds);
      onLoaded?.(basement);
    },
    undefined,
    onFail,
  );
}
