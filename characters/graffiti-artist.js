import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/loaders/GLTFLoader.js';

// Self-contained character module. The parent is the left alcove in the hall.
export function createGraffitiArtist({alcove,scene,reducedMotion=false,modelUrl='./characters/graffiti-artist.glb',drawOnWall=true,handOffset=[0,10,-8.2],characterHeight=1.82}) {
  const root=new T.Group(); root.name='graffiti-artist-module'; alcove.add(root);
  const drawing=document.createElement('canvas'); drawing.width=1024; drawing.height=512;
  const context=drawing.getContext('2d'); const ink=new T.CanvasTexture(drawing);
  ink.colorSpace=T.SRGBColorSpace;
  const width=2.75,height=1.35,wallX=0,wallY=1.79;
  const painting=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:ink,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  painting.name='graffiti-painted-wall'; painting.position.set(wallX,wallY,-1.955); if(drawOnWall)root.add(painting);
  const selectable=[];
  let model=null,mixer=null,spray=null,front=false,previous=null,targetRotation=Math.PI,walking=false,walkTime=0,walkYOffset=0;
  let idleAction=null,paintAction=null;
  const gaitBones={};
  const nozzleLocal=new T.Vector3(0,10.5,0),pointWorld=new T.Vector3();
  new GLTFLoader().load(modelUrl,g=>{
    model=g.scene;model.name='graffiti-artist';
    const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
    model.scale.setScalar(characterHeight/size.y); model.rotation.y=Math.PI; root.add(model);
    model.updateMatrixWorld(true); const adjusted=new T.Box3().setFromObject(model);
    model.position.set(0,.09-adjusted.min.y,-1.49);
    walkYOffset=model.position.y;
    model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
    const hand=model.getObjectByName('RightHand');
    if(hand){
      spray=new T.Group();spray.name='graffiti-spray';
      // Hand bone uses centimeters; -Z puts the cylinder on the palm side.
      spray.position.set(...handOffset);
      const metal=new T.MeshStandardMaterial({color:0x9ba19a,metalness:.55,roughness:.38});
      const bottle=new T.Mesh(new T.CylinderGeometry(3,3,16,20),metal);
      const collar=new T.Mesh(new T.CylinderGeometry(2.15,2.6,1.2,20),metal);collar.position.y=8.4;
      const tip=new T.Mesh(new T.CylinderGeometry(.7,.7,1.4,12),new T.MeshStandardMaterial({color:0xd85a42,roughness:.55}));tip.position.y=9.7;
      spray.add(bottle,collar,tip);hand.add(spray);
    }
    const paint=g.animations.find(a=>a.name==='Graffiti_Paint_Experimental');
    const idle=g.animations.find(a=>a.name?.includes('Idle'))||g.animations[0];
    if(paint||idle){mixer=new T.AnimationMixer(model);if(paint){paintAction=mixer.clipAction(paint);paintAction.play()}if(idle){idleAction=mixer.clipAction(idle);idleAction.enabled=true;idleAction.setEffectiveWeight(0);idleAction.play();}}
    for(const boneName of ['LeftUpLeg','RightUpLeg','LeftLeg','RightLeg','LeftArm','RightArm']){
      const b=model.getObjectByName(boneName);if(b)gaitBones[boneName]=b;
    }
    selectable.push(model);
  },undefined,error=>console.error('Artistul graffiti nu s-a putut încărca:',error));
  function ownsObject(object){for(let o=object;o;o=o.parent)if(o===model&&model)return true;return false;}
  function turn(){if(!model||walking)return;front=!front;targetRotation=front?0:Math.PI;previous=null;}
  function startWalking(){
    walking=true;previous=null;if(!model)return;
    scene.add(model); // keep the original painting plane attached to its architectural alcove
    model.position.set(0,walkYOffset,0);
    if(paintAction)paintAction.setEffectiveWeight(0);
    if(idleAction)idleAction.setEffectiveWeight(1);
  }
  function setWalkPose(point,heading){
    if(!model)return;
    if(!walking)startWalking();
    model.position.set(point.x,point.y+walkYOffset,point.z);
    targetRotation=heading;
    const diff=T.MathUtils.euclideanModulo(targetRotation-model.rotation.y+Math.PI,2*Math.PI)-Math.PI;
    model.rotation.y+=diff*.23;
  }
  function hasModel(){return !!model;}
  function getPosition(){return model?.getWorldPosition(new T.Vector3())||null;}
  function update(dt){
    if(!model)return;
    if(!walking)model.rotation.y=reducedMotion?targetRotation:T.MathUtils.damp(model.rotation.y,targetRotation,7,dt);
    if(!reducedMotion&&mixer)mixer.update(dt);
    if(walking){
      if(!reducedMotion){
        walkTime+=dt*7.2;
        const phase=Math.sin(walkTime),opposite=Math.sin(walkTime+Math.PI);
        const l=gaitBones.LeftUpLeg,r=gaitBones.RightUpLeg;
        if(l)l.rotation.x+=phase*.31;
        if(r)r.rotation.x+=opposite*.31;
        if(gaitBones.LeftLeg)gaitBones.LeftLeg.rotation.x+=Math.max(0,-phase)*.34;
        if(gaitBones.RightLeg)gaitBones.RightLeg.rotation.x+=Math.max(0,-opposite)*.34;
        if(gaitBones.LeftArm)gaitBones.LeftArm.rotation.x-=phase*.13;
        if(gaitBones.RightArm)gaitBones.RightArm.rotation.x-=opposite*.09;
      }
      previous=null;return;
    }
    if(drawOnWall&&!reducedMotion&&spray&&!front&&Math.abs(model.rotation.y-Math.PI)<.03){
      root.updateWorldMatrix(true,true);pointWorld.copy(nozzleLocal);spray.localToWorld(pointWorld);root.worldToLocal(pointWorld);
      const u=(pointWorld.x-wallX)/width+.5,v=.5-(pointWorld.y-wallY)/height;
      const current={x:u*drawing.width,y:v*drawing.height};
      if(previous&&u>=0&&u<=1&&v>=0&&v<=1){context.lineCap='round';context.lineJoin='round';context.lineWidth=13;context.strokeStyle='rgba(214,72,50,.42)';context.beginPath();context.moveTo(previous.x,previous.y);context.lineTo(current.x,current.y);context.stroke();ink.needsUpdate=true;}
      previous=current;
    }else previous=null;
  }
  return {root,selectable,ownsObject,turn,update,startWalking,setWalkPose,hasModel,getPosition};
}
