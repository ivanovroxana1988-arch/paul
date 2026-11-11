import {addUpperStorey} from './upper-storey.js?v=18';
// A circular hall, with radial galleries and a continuous annular balcony.
export const ROTUNDA_RADIUS=18.5;
export const ROTUNDA_CENTER_Z=-1;
export function buildRotunda({T,scene,mesh,box,pipe,curve,stone,paleStone,darkStone,metal,brass,mint,zoneData,roomRoots,frontLayout}){
const R=ROTUNDA_RADIUS,CZ=ROTUNDA_CENTER_Z,bays=16,step=Math.PI*2/bays,width=2*R*Math.tan(step/2),arcadeDepth=1.35;
function facade(parent,w,h,opening,spring,depth,mat=stone){
 const s=new T.Shape(),r=opening/2;
 // Follow the doorway as part of one concave contour; a hole touching the floor
 // would be invalid for polygon triangulation and could accidentally seal the opening.
 s.moveTo(-w/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();
 const wall=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:28}),mat,0,0,-depth/2,parent);wall.name='wall-with-arch-opening';return wall;
}
function archTrim(parent,w,spring){const r=w/2;for(let i=0;i<13;i++){const a=i*Math.PI/13,b=(i+1)*Math.PI/13-.013,s=new T.Shape();s.absarc(0,spring,r+.42,a,b,false);s.lineTo(Math.cos(b)*r,spring+Math.sin(b)*r);s.absarc(0,spring,r,b,a,true);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth:.2,bevelEnabled:false,curveSegments:4}),i%4===0?paleStone:stone,0,0,.72,parent);}for(const side of [-1,1]){box(.4,spring,.2,side*(r+.2),spring/2,.82,paleStone,parent);box(.65,.28,.36,side*(r+.2),.15,.82,paleStone,parent);}}
function groupAt(a,y=0){const g=new T.Group();g.position.set(Math.sin(a)*R,y,CZ-Math.cos(a)*R);g.rotation.y=-a;scene.add(g);return g;}
for(let i=0;i<bays;i++){
 const angle=i*step,signed=Math.atan2(Math.sin(angle),Math.cos(angle)),selected=zoneData.findIndex(z=>Math.abs(z.theta-signed)<.001);
 if(frontLayout && Math.abs(signed)<=3*step+.001)continue;
 // The upper storey places its eight continuous piers on alternate
 // ground-floor bay axes. These bays get a plain backing wall.
 if(i%2===0){
   const g=groupAt(angle);
   g.name='solid-pier-bay-'+i;
   box(width+.025,9.55,.45,0,4.775,-2.2,darkStone,g);
   continue;
 }
 if(selected>=0){const local=new T.Group();roomRoots[selected].add(local);const outer=selected===0||selected===3;facade(local,width+.025,9.55,[6.4,5.8,6.1,6.3][selected],[5.65,4.35,4.6,5.4][selected],[1.7,1.35,1.5,1.6][selected]);}
 else {const g=groupAt(angle);g.name='alcove-bay';facade(g,width+.025,9.55,4.8,4.7,arcadeDepth,darkStone);archTrim(g,4.8,4.7);box(width,8,.45,0,4,-2.2,darkStone,g);box(width,.15,2.5,0,0,-1.2,stone,g);box(.06,1.8,.06,-2.33,.95,.86,mint,g,false);box(.06,1.8,.06,2.33,.95,.86,mint,g,false);}
}
if(frontLayout){
 const fronts=frontLayout.map(([x,z,w,h,angle],index)=>{
   const roomIndex=[0,1,-1,2,3][index];
   const root=roomIndex<0?new T.Group():roomRoots[roomIndex];
   if(roomIndex<0){
     root.name='central-open-passage';
     root.position.set(x,0,z);
     root.rotation.y=angle;
     scene.add(root);
     archTrim(root,w,h-w/2);
   }
   const facadeWidth=w+1.9;
   facade(root,facadeWidth,9.55,w,h-w/2,.8).position.z=roomIndex<0?0:-.4;
   return {x,z,angle,half:facadeWidth/2};
 });
 // Return walls close the gaps between adjacent fronts without filling the openings.
 const edge=(front,side)=>[front.x+side*front.half*Math.cos(front.angle),front.z-side*front.half*Math.sin(front.angle)];
 for(let index=0;index<fronts.length-1;index++){
   const [x1,z1]=edge(fronts[index],1),[x2,z2]=edge(fronts[index+1],-1);
   const join=box(Math.hypot(x2-x1,z2-z1)+.12,9.55,.8,(x1+x2)/2,4.775,(z1+z2)/2,stone,scene);
   join.rotation.y=-Math.atan2(z2-z1,x2-x1);
 }
}
const upperParts=addUpperStorey({T,scene,mesh,box,pipe,stone,paleStone,metal,brass});

return {radius:R,bays,centerZ:CZ,upperParts};
}
