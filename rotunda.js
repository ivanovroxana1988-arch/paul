import {addUpperStorey} from './upper-storey.js?v=lift-right-1';
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
// Entrance inspired by the arched iron-and-glass door in the opening film.
// It sits inside an existing blind alcove, leaving the central passage free.
function entranceDoor(parent){
 const door=new T.Group();door.name='entrance-arched-iron-door';door.position.z=-1.91;parent.add(door);
 const iron=new T.MeshStandardMaterial({color:'#202d2b',metalness:.8,roughness:.43});
 const glass=new T.MeshStandardMaterial({color:'#526d69',metalness:.3,roughness:.32,emissive:'#243a37',emissiveIntensity:.22,side:T.DoubleSide});
 const w=1.75, spring=4.2, top=6.15;
 const outline=new T.Shape();outline.moveTo(-w,0);outline.lineTo(w,0);outline.lineTo(w,spring);outline.quadraticCurveTo(w,5.3,0,top);outline.quadraticCurveTo(-w,5.3,-w,spring);outline.closePath();
 mesh(new T.ShapeGeometry(outline,24),glass,0,.04,0,door,false);
 const bar=(a,b,r=.035,mat=iron)=>pipe([a[0],a[1],.045],[b[0],b[1],.045],r,mat,door);
 const curveEdge=(side)=>{const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push([side*w*(1-t*t),spring+(top-spring)*t,.045]);}curve(pts,.075,iron,door);};
 bar([-w,0],[-w,spring],.085);bar([w,0],[w,spring],.085);curveEdge(-1);curveEdge(1);bar([-w,.08],[w,.08],.07);bar([0,0],[0,top],.07);
 // A dense iron lattice, carefully clipped to the pointed arch silhouette.
 const inside=(x,y)=>{if(y<.08||y>top||Math.abs(x)>w)return false;if(y<=spring)return true;return Math.abs(x)<=w*(1-Math.pow((y-spring)/(top-spring),2));};
 for(const x of [-1.3,-.88,-.44,.44,.88,1.3]){let ymax=spring+(top-spring)*Math.sqrt(Math.max(0,1-Math.abs(x)/w));bar([x,.1],[x,ymax],.025);}
 for(const y of [.65,1.35,2.05,2.75,3.45,4.15,4.85,5.45]){const half=y<=spring?w:w*(1-Math.pow((y-spring)/(top-spring),2));bar([-half,y],[half,y],.026);}
 for(const slope of [-1,1])for(let offset=-4;offset<=8;offset+=.72){let start=null,prev=null;for(let i=0;i<=160;i++){const x=-w+2*w*i/160,y=offset+slope*x,valid=inside(x,y);if(valid&&!start)start=[x,y];if(!valid&&start){bar(start,prev,.022);start=null;}if(valid)prev=[x,y];}if(start)bar(start,prev,.022);}
 for(const x of [-.19,.19]){const knob=mesh(new T.SphereGeometry(.065,12,8),brass,x,2.35,.13,door);knob.name='door-handle';}
 // Warm suspended lantern, as in the film, is local to the doorway.
 pipe([0,8.8,.6],[0,7.55,.6],.025,metal,parent);
 const lamp=new T.MeshStandardMaterial({color:'#ffd397',emissive:'#ffb958',emissiveIntensity:1.15});
 const lantern=mesh(new T.CylinderGeometry(.12,.18,.48,6),lamp,0,7.27,.6,parent,false);lantern.name='entrance-lantern';
 const glow=new T.PointLight('#ffc37f',20,8,2);glow.position.set(0,7.2,1);parent.add(glow);
}
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
 else {const g=groupAt(angle);g.name='alcove-bay';facade(g,width+.025,9.55,4.8,4.7,arcadeDepth,darkStone);archTrim(g,4.8,4.7);box(width,8,.45,0,4,-2.2,darkStone,g);box(width,.15,2.5,0,0,-1.2,stone,g);if(i===7)entranceDoor(g);else {box(.06,1.8,.06,-2.33,.95,.86,mint,g,false);box(.06,1.8,.06,2.33,.95,.86,mint,g,false);}}
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
