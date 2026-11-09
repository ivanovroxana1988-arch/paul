import {applyAsymmetricStudy,referenceDimensions} from './asymmetric-study.js';
import * as T from './vendor/three.module.js';
import {addLevels} from './levels.js';
import {addUpperStorey} from './upper-storey.js';
import {addLowerArcadeDetails} from './lower-arcades.js';
export function makeBlockout(){
const scene=new T.Scene();scene.background=new T.Color('#e7e8e3');const model=new T.Group();model.name='blockout';scene.add(model);
const wall=new T.MeshLambertMaterial({color:'#cccfc8',side:T.FrontSide}),trim=new T.MeshLambertMaterial({color:'#e5e5dc',side:T.FrontSide}),floor=new T.MeshLambertMaterial({color:'#aeb5ae',side:T.FrontSide}),lower=new T.MeshLambertMaterial({color:'#7c8d89',side:T.FrontSide}),iron=new T.MeshLambertMaterial({color:'#727e77'}),poolMat=new T.MeshLambertMaterial({color:'#92bdb2',side:T.FrontSide});
const mesh=(g,m,x=0,y=0,z=0,parent=model)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;};const box=(w,h,d,x,y,z,m=wall,parent=model)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z,parent);
function pipe(a,b,r=.04,m=iron,parent=model){const p=new T.Vector3(...a),q=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,p.distanceTo(q),6),m,0,0,0,parent);o.position.copy(p.clone().add(q).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),q.sub(p).normalize());return o;}
const architecture=new T.Group(),upper=new T.Group(),roof=new T.Group(),rooms=new T.Group();model.add(architecture,upper,roof,rooms);const R=18.5,CZ=-1,step=Math.PI/8,width=2*R*Math.tan(step/2),zones=[],roomParents=[];
function facade(w,h,opening,spring,depth,parent,mat=wall){const r=opening/2,s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();return mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12}),mat,0,0,-depth/2,parent);}
function bay(angle,y,parent){const g=new T.Group();g.position.set(Math.sin(angle)*R,y,CZ-Math.cos(angle)*R);g.rotation.y=-angle;parent.add(g);return g;}
for(let i=0;i<16;i++){const angle=i*step,signed=Math.atan2(Math.sin(angle),Math.cos(angle)),which=[-3,-1,1,3].findIndex(k=>Math.abs(signed-k*step)<.001),g=bay(angle,0,architecture);g.userData.front=i>4&&i<12;
const opening=which>=0?[6,5.4,6.1,6.3][which]:4.8,spring=which>=0?[4.8,4.35,4.6,5.4][which]:4.7;
facade(width+.03,9.55,opening,spring,.8,g);const r=opening/2;for(const side of [-1,1])box(.36,spring,.15,side*(r+.18),spring/2,.78,trim,g);
if(which>=0){const group=bay(angle,0,rooms);roomParents[which]=group;for(const side of [-1,1])box(.35,8,12,side*3.65,4,-6.6,wall,group);box(7.6,.2,12,0,-.08,-6.6,floor,group);box(7.6,8,.35,0,4,-12.6,wall,group);zones.push({name:['SKIN','CANVAS','SPACE','MOTION'][which],position:new T.Vector3(Math.sin(angle)*R,5,CZ-Math.cos(angle)*R),theta:angle});}
else if(i!==8)box(width,8,.3,0,4,-1.8,lower,g);
}
const lowerParts=addLowerArcadeDetails({T,scene:model,roots:roomParents,stone:wall,paleStone:trim,metal:iron,brass:iron,simple:true});
const upperParts=addUpperStorey({T,scene:model,mesh,box,pipe,stone:wall,paleStone:trim,metal:iron,brass:iron,root:upper,roofRoot:roof,simple:true});
const levels=addLevels({T,scene:model,mesh,box,pipe,stone:floor,paleStone:trim,darkStone:lower,metal:iron,brass:iron,mint:poolMat});
mesh(new T.CylinderGeometry(5.9,5.9,.5,64,1,true),trim,0,.15,CZ);const rim=mesh(new T.RingGeometry(5.25,5.9,64),trim,0,.43,CZ);rim.rotation.x=-Math.PI/2;const water=mesh(new T.CircleGeometry(5.25,64),poolMat,0,.25,CZ);water.rotation.x=-Math.PI/2;const sculpture=new T.Group();model.add(sculpture);sculpture.position.set(0,.55,CZ);
for(let k=0;k<2;k++){const p=[],idx=[],n=48;for(let i=0;i<=n;i++){const t=i/n,a=t*5.8+k*Math.PI,r=.15+Math.sin(t*Math.PI)*2.5;for(const w of [-.28,.28])p.push(Math.cos(a)*(r+w),t*12,Math.sin(a)*(r+w));if(i<n){const j=i*2;idx.push(j,j+2,j+1,j+2,j+3,j+1)}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(idx);g.computeVertexNormals();mesh(g,new T.MeshLambertMaterial({color:'#b4bbae',side:T.DoubleSide}),0,0,0,sculpture);}
// Fit the placeholder sculpture to the dimensioned envelope (height, width, depth).
const sb=new T.Box3().setFromObject(sculpture),ss=sb.getSize(new T.Vector3());sculpture.scale.set(4.6/ss.x,8.4/ss.y,1.8/ss.z);
applyAsymmetricStudy({T,model,architecture,rooms,upperParts,roof,zones});
// A 1.7 unit reference figure on the overlook, to judge architectural scale.
const figure=new T.Group();figure.position.set(2.7,.95,12.8);model.add(figure);mesh(new T.CylinderGeometry(.19,.24,1.1,8),iron,0,.75,0,figure);mesh(new T.SphereGeometry(.22,10,8),iron,0,1.5,0,figure);
scene.add(new T.AmbientLight('#ffffff',.6));const light=new T.DirectionalLight('#fff8e8',.75);light.position.set(-8,22,15);scene.add(light);const fill=new T.DirectionalLight('#d3e3de',.25);fill.position.set(15,10,-12);scene.add(fill);
// Subdivide long faces so vector depth sorting does not let a large floor or wall
// triangle cover nearer architecture. The blockout uses no texture coordinates.
function subdivide(geometry){const p=geometry.attributes.position,index=geometry.index,output=[];function tri(a,b,c,depth=0){const ab=a.distanceToSquared(b),bc=b.distanceToSquared(c),ca=c.distanceToSquared(a);if(Math.max(ab,bc,ca)>5.76&&depth<12){if(ab>=bc&&ab>=ca){const m=a.clone().add(b).multiplyScalar(.5);tri(a,m,c,depth+1);tri(m,b,c,depth+1);}else if(bc>=ca){const m=b.clone().add(c).multiplyScalar(.5);tri(a,b,m,depth+1);tri(a,m,c,depth+1);}else{const m=c.clone().add(a).multiplyScalar(.5);tri(a,b,m,depth+1);tri(m,b,c,depth+1);}}else output.push(...a.toArray(),...b.toArray(),...c.toArray());}const n=index?index.count:p.count;for(let i=0;i<n;i+=3){const ids=[0,1,2].map(k=>index?index.getX(i+k):i+k);tri(...ids.map(id=>new T.Vector3().fromBufferAttribute(p,id)));}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(output,3));g.computeVertexNormals();return g;}
model.traverse(o=>{if(o.isMesh)o.geometry=subdivide(o.geometry);});
scene.updateMatrixWorld(true);return {scene,model,architecture,upper,roof,rooms,levels,zones,sculpture,figure,upperParts,lowerParts,referenceDimensions};
}
