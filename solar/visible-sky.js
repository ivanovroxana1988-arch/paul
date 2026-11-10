// Full-screen procedural sky: directions come from the camera, not a faceted dome.
// Its sun direction is supplied by the same calculation as the shadow light.
export function createVisibleSky({T, scene}) {
  const uniforms = {
    sunDirection: {value: new T.Vector3(0, 1, 0)},
    sunColor: {value: new T.Color('#fff2dc')},
    skyColor: {value: new T.Color('#6d9298')},
    daylight: {value: 1},
    twilight: {value: 0},
    sunVisible: {value: 1},
    cloudCover: {value: 0},
    cloudTime: {value: 0},
    inverseProjection: {value: new T.Matrix4()},
    cameraRotation: {value: new T.Matrix3()}
  };
  const material = new T.ShaderMaterial({
    uniforms, side: T.FrontSide, depthWrite: false, depthTest: false,
    fog: false, toneMapped: false,
    vertexShader: `
      varying vec2 screenPosition;
      void main() {
        screenPosition = position.xy;
        gl_Position = vec4(position.xy, 1.0, 1.0);
      }
    `,
    fragmentShader: `
      precision highp float;
      uniform vec3 sunDirection, sunColor, skyColor;
      uniform float daylight, twilight, sunVisible, cloudCover, cloudTime;
      uniform mat4 inverseProjection;
      uniform mat3 cameraRotation;
      varying vec2 screenPosition;
      float hash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float noise3(vec3 p) {
        vec3 i=floor(p), f=fract(p); f=f*f*f*(f*(f*6.0-15.0)+10.0);
        return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
                   mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
      }
      void main() {
        vec4 view = inverseProjection * vec4(screenPosition, 1.0, 1.0);
        vec3 direction = normalize(cameraRotation * (view.xyz / view.w));
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
        vec3 cloudPos=direction*4.2+vec3(cloudTime*0.003,0.0,cloudTime*0.0015);
        float warp=noise3(cloudPos+vec3(7.1,3.2,1.4))-0.5;
        cloudPos += vec3(warp,-warp*0.4,warp*0.7) * 0.55;
        float n=noise3(cloudPos)*0.58+noise3(cloudPos*2.03)*0.28+noise3(cloudPos*4.07)*0.14;
        float threshold=0.72-cloudCover*0.36;
        float clouds=smoothstep(threshold-0.10,threshold+0.14,n)*smoothstep(0.0,0.12,cloudCover);
        vec3 cloudColor=mix(vec3(0.10,0.13,0.18),vec3(0.71,0.74,0.76),daylight);
        color=mix(color,cloudColor,clouds*0.9);
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `
  });
  const mesh = new T.Mesh(new T.PlaneGeometry(2, 2), material);
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
    setWeather(weather) { uniforms.cloudCover.value = weather ? weather.clouds : 0; },
    tick(dt) { uniforms.cloudTime.value += dt; },
    follow(camera) {
      camera.updateMatrixWorld();
      uniforms.inverseProjection.value.copy(camera.projectionMatrixInverse);
      uniforms.cameraRotation.value.setFromMatrix4(camera.matrixWorld);
    },
    mesh,
    dispose() {scene.remove(mesh);mesh.geometry.dispose();material.dispose();}
  };
}
