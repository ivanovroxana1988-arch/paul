// A mobile GPU can support fewer fragment uniforms than the complete scene's
// lights require. Keep a fixed number of the nearest local lights active on
// those devices, retaining the lights, materials, textures and geometry.
export function createMobileLightBudget({T, scene, renderer, maxPoints = 10, maxSpots = 2}) {
  const gl = renderer.getContext();
  const uniformLimit = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  if (!Number.isFinite(uniformLimit) || uniformLimit > 256) return {enabled: false, update() {}};

  const points = [], spots = [];
  scene.traverse(light => {
    if (!light.visible) return;
    if (light.isPointLight) points.push(light);
    else if (light.isSpotLight) spots.push(light);
  });
  const cameraPosition = new T.Vector3();
  const lightPosition = new T.Vector3();
  let nextUpdate = 0;
  function select(lights, limit) {
    const ranked = lights.map(light => {
      light.getWorldPosition(lightPosition);
      const distance = cameraPosition.distanceTo(lightPosition);
      // Prefer lights whose effective range reaches the visitor's position.
      const range = light.distance || 20;
      return {light, score: distance / Math.max(range, 1)};
    }).sort((a, b) => a.score - b.score);
    ranked.forEach(({light}, index) => { light.visible = index < limit; });
  }
  return {
    enabled: true,
    update(camera, now = 0) {
      if (now < nextUpdate) return;
      nextUpdate = now + 1000;
      camera.getWorldPosition(cameraPosition);
      select(points, maxPoints);
      select(spots, maxSpots);
    }
  };
}
