import {solarPosition, bucharestParts, bucharestTimeOnSameDay} from './bucharest-sun.js';

// The sun is independent of geometry: new opaque meshes cast shadows and actual
// openings admit it. Transparent glazing should normally have castShadow=false.
export function createSolarLight({T, scene, sun, sky, ambient, fill, onChange = () => {}, onSky = () => {}}) {
  const target = new T.Vector3(0, 6, -1), night = new T.Color('#101d2b'), day = new T.Color('#6d9298');
  // Art-directed clear-sky approximation: low sun is redder because its light
  // travels farther through the atmosphere; actual weather is not sampled.
  const horizon = new T.Color('#ff4930'), gold = new T.Color('#ff984f'), neutral = new T.Color('#fff2dc');
  const horizonSky = new T.Color('#d15b49'), twilightSky = new T.Color('#914e62');
  const blueSky = new T.Color('#b5d7de'), warmSky = new T.Color('#ff9a78');
  const normalAmbient = new T.Color('#d4bd92'), warmAmbient = new T.Color('#f08061');
  const coolFill = new T.Color('#7fb6bf'), warmFill = new T.Color('#e98b72');
  // Start with a well-lit architectural demonstration. The visitor can still choose
  // real Bucharest time, sunrise, sunset or any hour via the existing controls.
  let mode = 'live', selected = 720, previewDate = null, timer = null;
  // Interior exhibition lighting is independent of the astronomical sun.
  // It keeps the building recognizable at night without falsifying the sun/shadows.
  const galleryFill = new T.HemisphereLight('#ffe1bc', '#536774', 1.0);
  scene.add(galleryFill);
  sun.target.position.copy(target); scene.add(sun.target);
  Object.assign(sun.shadow.camera, {left:-39,right:39,top:39,bottom:-39,near:.5,far:140});
  sun.shadow.camera.updateProjectionMatrix();
  const clamp = (x,a,b) => Math.max(a,Math.min(b,x));
  const smooth = (a,b,x) => {const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
  function update(now = new Date()) {
    const date = mode === 'live' ? now : bucharestTimeOnSameDay(previewDate || now,selected);
    const p=solarPosition(date), degrees=p.altitude*180/Math.PI;
    // A continuous twilight transition; direct sunlight is zero below horizon.
    const daylight=smooth(-6,10,degrees), direct=smooth(0,6,degrees);
    // Warmth peaks near the horizon and fades gradually into daylight. Keep a
    // separate, softer afterglow below the horizon without direct sunlight.
    const glow=smooth(-8,-2,degrees)*(1-smooth(5,22,degrees));
    sun.position.set(target.x+p.east*65,target.y+p.up*65,target.z+p.south*65);
    sun.intensity=4.2*direct;
    sun.color.copy(horizon).lerp(gold,smooth(2,14,degrees)).lerp(neutral,smooth(12,35,degrees));
    sky.intensity=.18+1.7*daylight;
    sky.color.copy(blueSky).lerp(warmSky,glow*.72);
    ambient.intensity=.10+.24*daylight;
    ambient.color.copy(normalAmbient).lerp(warmAmbient,glow*.75);
    fill.intensity=.07+.35*daylight;
    galleryFill.intensity=.18+1.05*(1-daylight);
    fill.color.copy(coolFill).lerp(warmFill,glow*.6);
    scene.background.copy(night).lerp(day,daylight);
    // The environment tint is atmospheric ambience, not a reconstruction of
    // the exact sky on this date. Twilight remains softly visible after sunset.
    scene.background.lerp(twilightSky,glow*(1-daylight)*.7);
    scene.background.lerp(horizonSky,glow*daylight*.7);
    if(scene.fog)scene.fog.color.copy(scene.background);
    onSky({direction:p,color:sun.color,background:scene.background,daylight,twilight:glow,altitude:degrees});
    const local=bucharestParts(date), text=`${String(local.hour).padStart(2,'0')}:${String(local.minute).padStart(2,'0')}`;
    onChange({mode,date,time:text,minutes:local.hour*60+local.minute,altitude:degrees,summer:previewDate !== null});
  }
  return {update,setTime(minutes){selected=clamp(Math.round(minutes),0,1439);mode='manual';update();},setSummer(){const year=bucharestParts(new Date()).year;previewDate=new Date(Date.UTC(year,5,21,12));selected=13*60+20;mode='manual';update();},setLive(){previewDate=null;mode='live';update();},start(){update();timer=setInterval(()=>update(),20000);},dispose(){clearInterval(timer);scene.remove(sun.target);}};
}
