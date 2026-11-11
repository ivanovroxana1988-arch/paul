import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';

// Self-contained character module. The parent is the left alcove in the hall.
export function createGraffitiArtist({alcove,reducedMotion=false}) {
  const root=new T.Group(); root.name='graffiti-artist-module'; alcove.add(root);
  const drawing=document.createElement('canvas'); drawing.width=1024; drawing.height=512;
  const context=drawing.getContext('2d'); const ink=new T.CanvasTexture(drawing);
  ink.colorSpace=T.SRGBColorSpace;
  const width=2.75,height=1.35,wallX=0,wallY=1.79;
  const painting=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:ink,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  painting.name='graffiti-painted-wall'; painting.position.set(wallX,wallY,-1.955); root.add(painting);
  const selectable=[];
  let model=null,mixer=null,nozzle=null,front=false,previous=null,targetRotation=Math.PI;
  const pointWorld=new T.Vector3();
  new GLTFLoader().load('./characters/artista-graffiti-cu-spray.glb',g=>{
    model=g.scene;model.name='graffiti-artist';
    const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
    model.scale.setScalar(1.82/size.y); model.rotation.y=Math.PI; root.add(model);
    model.updateMatrixWorld(true); const adjusted=new T.Box3().setFromObject(model);
    model.position.set(0,.09-adjusted.min.y,-1.34);
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    // The can is skinned to the hand in the GLB. A vertex on the nozzle
    // follows the same deformation, so the paint starts where the hand moves.
    nozzle=model.getObjectByName('Spray_Nozzle');
    const clip=g.animations.find(a=>a.name==='Graffiti_Paint_Experimental')||g.animations[0];
    if(clip){mixer=new T.AnimationMixer(model);mixer.clipAction(clip).play();mixer.update(0);}
    selectable.push(model);
  },undefined,error=>console.error('Artistul graffiti nu s-a putut încărca:',error));
  function ownsObject(object){for(let o=object;o;o=o.parent)if(o===model&&model)return true;return false;}
  function turn(){if(!model)return;front=!front;targetRotation=front?0:Math.PI;previous=null;}
  function update(dt){
    if(!model)return;
    model.rotation.y=reducedMotion?targetRotation:T.MathUtils.damp(model.rotation.y,targetRotation,7,dt);
    if(!reducedMotion&&mixer)mixer.update(dt);
    if(!reducedMotion&&nozzle?.isSkinnedMesh&&!front&&Math.abs(model.rotation.y-Math.PI)<.03){
      root.updateMatrixWorld(true);nozzle.skeleton.update();nozzle.getVertexPosition(0,pointWorld);nozzle.localToWorld(pointWorld);root.worldToLocal(pointWorld);
      const u=(pointWorld.x-wallX)/width+.5,v=.5-(pointWorld.y-wallY)/height;
      const current={x:u*drawing.width,y:v*drawing.height};
      if(previous&&u>=0&&u<=1&&v>=0&&v<=1){context.lineCap='round';context.lineJoin='round';context.lineWidth=13;context.strokeStyle='rgba(214,72,50,.42)';context.beginPath();context.moveTo(previous.x,previous.y);context.lineTo(current.x,current.y);context.stroke();ink.needsUpdate=true;}
      previous=current;
    }else previous=null;
  }
  return {root,selectable,ownsObject,turn,update};
}
