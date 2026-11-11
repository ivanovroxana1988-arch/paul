import * as T from './vendor/three.module.js';
import {addReferenceWalkway} from './reference-walkway.js?v=1';
import {addReferenceOverheadBridge} from './reference-overhead-bridge.js?v=1';
import {addUpperLevelLandings} from './upper-level-landings.js?v=1';
let renderer;
try{renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});}
catch(error){document.querySelector('#error').style.display='block';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
document.body.appendChild(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color('#30464a');scene.fog=new T.Fog('#30464a',38,90);
const camera=new T.PerspectiveCamera(59,innerWidth/innerHeight,.1,130);
scene.add(new T.HemisphereLight('#bdd8dc','#49372b',2));
const sun=new T.DirectionalLight('#ffda9c',3.1);sun.position.set(-22,33,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;scene.add(sun);
const architecture=new T.Group();scene.add(architecture);
const stone=new T.MeshStandardMaterial({color:'#8c8072',roughness:.93});
for(let i=0;i<8;i++){
 const a=i*Math.PI/4,g=new T.Group();g.position.set(Math.sin(a)*18.5,0,-1-Math.cos(a)*18.5);g.rotation.y=-a;architecture.add(g);
 const pillar=new T.Mesh(new T.BoxGeometry(1.45,24.65,2.5),stone);pillar.position.y=12.325;pillar.castShadow=true;pillar.receiveShadow=true;g.add(pillar);
}
const base=new T.Mesh(new T.CircleGeometry(25,96),new T.MeshStandardMaterial({color:'#4e5149',roughness:.94}));base.rotation.x=-Math.PI/2;base.receiveShadow=true;scene.add(base);
addReferenceWalkway({T,parent:scene,centerZ:-1});
const bridgeRoot=new T.Group();bridgeRoot.position.set(0,18,-8);scene.add(bridgeRoot);const bridgeModel=addReferenceOverheadBridge({T,parent:bridgeRoot});addUpperLevelLandings({T,parent:scene,bridge:bridgeRoot,bridgeModel,centerZ:-1});
let mode='overhead',yaw=1.24,pitch=-.08,azimuth=.72,elevation=.48,bridgeAzimuth=.05,bridgeElevation=-.14,drag=null;
function updateCamera(){
 if(mode==='inside'){
  camera.position.set(0,11.55,-17.43);
  const d=new T.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
  camera.lookAt(camera.position.clone().add(d));
 }else if(mode==='overhead'){
  const distance=35,target=new T.Vector3(0,16.5,-8);
  camera.position.set(target.x+distance*Math.sin(bridgeAzimuth)*Math.cos(bridgeElevation),target.y+distance*Math.sin(bridgeElevation),target.z+distance*Math.cos(bridgeAzimuth)*Math.cos(bridgeElevation));
  camera.lookAt(target);
 }else{
  const distance=37,target=new T.Vector3(0,9.7,-1);
  camera.position.set(target.x+distance*Math.sin(azimuth)*Math.cos(elevation),target.y+distance*Math.sin(elevation),target.z+distance*Math.cos(azimuth)*Math.cos(elevation));
  camera.lookAt(target);
 }
}
function choose(next){mode=next;document.querySelector('#overhead').classList.toggle('active',mode==='overhead');document.querySelector('#inside').classList.toggle('active',mode==='inside');document.querySelector('#overview').classList.toggle('active',mode==='overview');updateCamera();}
document.querySelector('#overhead').onclick=()=>choose('overhead');document.querySelector('#inside').onclick=()=>choose('inside');document.querySelector('#overview').onclick=()=>choose('overview');
renderer.domElement.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag={x:e.clientX,y:e.clientY};if(mode==='inside'){yaw-=dx*.006;pitch=T.MathUtils.clamp(pitch-dy*.005,-1.05,1.05);}else if(mode==='overhead'){bridgeAzimuth-=dx*.006;bridgeElevation=T.MathUtils.clamp(bridgeElevation+dy*.004,-.6,.45);}else{azimuth-=dx*.006;elevation=T.MathUtils.clamp(elevation+dy*.004,.1,1.3);}updateCamera();});
renderer.domElement.addEventListener('pointerup',()=>drag=null);renderer.domElement.addEventListener('pointercancel',()=>drag=null);
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
updateCamera();function animate(){renderer.render(scene,camera);requestAnimationFrame(animate);}requestAnimationFrame(animate);
