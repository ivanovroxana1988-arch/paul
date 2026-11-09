import * as T from './vendor/three.module.js';
import {SoftwareRenderer} from './software-renderer.js';
import {makeFrame} from './frame-model.js';
const host=document.querySelector('#render'),{scene,camera,model,upperLayers}=makeFrame();let renderer,software=false;try{renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;}catch{renderer=new SoftwareRenderer();software=true;}host.append(renderer.domElement);function render(){renderer.setSize(1280,720);camera.updateProjectionMatrix();renderer.render(scene,camera);document.querySelector('#status').textContent=software?'— randare CPU':'— WebGL';}render();document.querySelector('#download').onclick=()=>{const a=document.createElement('a');a.href=renderer.domElement.toDataURL('image/png');a.download='paul-cadru-geometrie-01.png';a.click();};

const planCamera=new T.OrthographicCamera(-27,27,15.1875,-15.1875,.1,100);planCamera.position.set(0,50,-7);planCamera.up.set(0,0,-1);planCamera.lookAt(0,0,-7);
document.querySelector('#plan').onclick=()=>{upperLayers.forEach(o=>o.visible=false);model.traverse(o=>{if(o.name==='sculpture-envelope-proxy')o.visible=false;});renderer.render(scene,planCamera);document.querySelector('#status').textContent='— plan: 2 volume avansate, 3 arcade retrase';};
document.querySelector('#perspective').onclick=()=>{upperLayers.forEach(o=>o.visible=true);model.traverse(o=>{if(o.name==='sculpture-envelope-proxy')o.visible=true;});render();};
