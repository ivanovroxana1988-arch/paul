// A camera-centred background, kept behind the real building geometry.
// Its sun direction is supplied by the same calculation as the shadow light.
export function createVisibleSky({T, scene}) {
  const uniforms = {
    sunDirection: {value: new T.Vector3(0, 1, 0)},
    sunColor: {value: new T.Color('#fff2dc')},
    skyColor: {value: new T.Color('#6d9298')},
    daylight: {value: 1},
    twilight: {value: 0},
    sunVisible: {value: 1}
  };
  const material = new T.ShaderMaterial({
    uniforms, side: T.BackSide, depthWrite: false, depthTest: false,
    fog: false, toneMapped: false,
    vertexShader: `
      varying vec3 skyDirection;
      void main() {
        skyDirection = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 sunDirection, sunColor, skyColor;
      uniform float daylight, twilight, sunVisible;
      varying vec3 skyDirection;
      void main() {
        vec3 direction = normalize(skyDirection);
        float elevation = max(direction.y, 0.0);
        vec3 zenith = mix(skyColor * 0.75, vec3(0.09, 0.24, 0.40), daylight * 0.55);
        vec3 horizon = skyColor * mix(0.83, 1.20, daylight);
        vec3 color = mix(horizon, zenith, smoothstep(0.0, 0.85, elevation));
        float towardSun = max(dot(direction, normalize(sunDirection)), 0.0);
        float sunsetGlow = pow(towardSun, 5.0) * twilight * 0.48;
        float daylightGlow = pow(towardSun, 12.0) * daylight * sunVisible * 0.12;
        float halo = pow(towardSun, 500.0) * sunVisible * 0.25;
        // Slightly enlarged apparent sun for legibility on phone screens.
        float disk = smoothstep(0.99996, 0.99998, towardSun) * sunVisible;
        float aboveHorizon = smoothstep(-0.005, 0.004, direction.y);
        color += sunColor * (sunsetGlow + (daylightGlow + halo) * aboveHorizon);
        color = mix(color, mix(sunColor, vec3(1.0), 0.55), disk * aboveHorizon);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new T.Mesh(new T.SphereGeometry(90, 40, 24), material);
  mesh.name = 'visible-solar-sky';
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  scene.add(mesh);
  return {
    update({direction, color, background, daylight, twilight, altitude}) {
      uniforms.sunDirection.value.set(direction.east, direction.up, direction.south).normalize();
      uniforms.sunColor.value.copy(color);
      uniforms.skyColor.value.copy(background);
      uniforms.daylight.value = daylight;
      uniforms.twilight.value = twilight;
      uniforms.sunVisible.value = T.MathUtils.smoothstep(altitude, -.5, .5);
    },
    follow(camera) { mesh.position.copy(camera.position); },
    mesh,
    dispose() {scene.remove(mesh);mesh.geometry.dispose();material.dispose();}
  };
}
