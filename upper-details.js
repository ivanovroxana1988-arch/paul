import {addReferenceOverheadBridge} from './reference-overhead-bridge.js?v=1';
import {addUpperLevelLandings} from './upper-level-landings.js?v=2';
// Reference-led upper gallery: all details remain real geometry in clay mode.
export function addUpperDetails({T,structure,walkways,windows,mesh,box,pipe,metal,brass,paleStone,simple,useReferenceWalkway=false}){
const R=18.5,CZ=-1,Y=9.95;
function bay(a,r=R,y=Y,parent=walkways){const g=new T.Group();g.position.set(Math.sin(a)*r,y,CZ-Math.cos(a)*r);g.rotation.y=-a;g.userData.cutFront=g.position.z>2;parent.add(g);return g;}
function bolt(x,y,z,g){const b=mesh(new T.CylinderGeometry(.055,.055,.04,6),brass,x,y,z,g);b.rotation.x=Math.PI/2;}
function plate(x,y,z,g){box(.32,.3,.08,x,y,z,brass,g);if(!simple)for(const dx of [-.1,.1])for(const dy of [-.09,.09])bolt(x+dx,y+dy,z+.05,g);}
// Deck seams, outer rail and riveted post bases, repeated around the rotunda.
if(!useReferenceWalkway){
for(let i=0;i<64;i++){const a=i/64*Math.PI*2,g=bay(a);box(1.4,.025,.045,0,.025,.02,metal,g);for(const x of [-1.05,1.05]){box(.22,.06,.25,x,.05,1.08,brass,g);if(!simple)bolt(x,.09,1.2,g);}}
for(const radius of [17.71,19.29])for(let i=0;i<48;i++){const a=i/48*Math.PI*2,g=bay(a,radius);pipe([0,0,0],[0,1.22,0],.045,metal,g);box(.19,.08,.24,0,.04,0,brass,g);plate(0,.73,.045,g);}
for(const y of [Y+.55,Y+1.2]){const rail=mesh(new T.TorusGeometry(19.29,.045,6,96),brass,0,y,CZ,walkways);rail.rotation.x=Math.PI/2;}
}
// Bundled pipes and wide bolted collars on the structural piers.
for(let i=0;i<8;i++){const g=bay(i*Math.PI/4,18.5,9.85,structure);for(const x of [-.33,0,.33]){pipe([x,0,1.35],[x,14.2,1.35],.1,metal,g);for(const y of [1.1,5.4,10.4,13.5]){const band=mesh(new T.CylinderGeometry(.14,.14,.24,10),brass,x,y,1.35,g);}}for(const y of [1.1,5.4,10.4]){box(1.28,.32,.12,0,y,1.48,brass,g);for(const x of [-.5,.5])bolt(x,y,1.57,g);}}
const paper=simple?paleStone:new T.MeshStandardMaterial({color:'#d2c2a2',roughness:1,side:T.DoubleSide});
// Banners are narrow hanging cloth meshes, with uneven lower hems.
for(const a of [-Math.PI/8,Math.PI/8,5*Math.PI/8]){const g=bay(a,18.1,10.1,structure);pipe([-1.5,7.6,.5],[1.5,7.6,.5],.06,brass,g);pipe([-1.5,7.6,.5],[-1.5,7.6,-1],.08,metal,g);const geo=new T.PlaneGeometry(2.5,6.4,6,12),p=geo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,Math.sin(p.getX(i)*4+y)*.055);if(y< -3)p.setY(i,y+.18*Math.sin(i*3.7));}geo.computeVertexNormals();mesh(geo,paper,0,4.3,.5,g);if(!simple){for(let j=0;j<3;j++){const pts=[];for(let k=0;k<32;k++){const t=k/31;pts.push(new T.Vector3(Math.sin(t*7+j*.3)*(.25+t*.4),6.8-t*5,.58));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,.014,4,false),metal,0,0,0,g);}}}
// A high steel bridge crosses a chord of the circular hall.
const bridge=bay(Math.PI,0,24.65,walkways);bridge.position.z=-8;bridge.rotation.y=0;
if(simple){
box(30,.2,1.65,0,0,0,metal,bridge);for(const side of [-1,1]){box(30,.5,.16,0,-.3,side*.8,metal,bridge);pipe([-15,1.2,side*.8],[15,1.2,side*.8],.045,brass,bridge);pipe([-15,.62,side*.8],[15,.62,side*.8],.035,metal,bridge);for(let i=-15;i<=15;i+=2){pipe([i,0,side*.8],[i,1.25,side*.8],.04,metal,bridge);plate(i,-.28,side*.9,bridge);}}
}else{
 const bridgeModel=addReferenceOverheadBridge({T,parent:bridge});
 addUpperLevelLandings({T,parent:walkways,bridge,bridgeModel,centerZ:CZ});
}
// Dedicated machinery bay: large gear, countergear, rope drum and overhead pulleys.
const machine=bay(3*Math.PI/8,19.4,10.05,walkways);addUpperWinch({T,machine,mesh,box,pipe,metal,brass,paleStone,simple});
// Small drawing alcove beside the rear glazing, kept clear of the circular path.
const studio=bay(-Math.PI/8,21,9.95,windows);studio.name='upper-drawing-alcove';box(3.4,.14,1.05,0,1,-.35,metal,studio);for(const x of [-1.45,1.45])for(const z of [-.75,.05])box(.08,1,.08,x,.5,z,metal,studio);
for(let i=0;i<5;i++){const roll=mesh(new T.CylinderGeometry(.11,.11,1.6,8),paper,1.95+i*.15,.85,-.5,studio);roll.rotation.z=-.15;}
for(const x of [-.8,0,.8])mesh(new T.PlaneGeometry(.65,1.1),paper,x,2,-.95,studio);
for(let i=0;i<5;i++){mesh(new T.CylinderGeometry(.09,.09,.2,8),brass,-.9+i*.25,1.17,-.25,studio);pipe([-.9+i*.25,1.2,-.25],[-.95+i*.25,1.7,-.2],.012,metal,studio);}
return {machine,studio,bridge,stats:{banners:3,gears:2,winches:1,bridges:1,alcoves:1}};
}

export function addUpperWinch({T,machine,mesh,box,pipe,metal,brass,paleStone,simple=false}){
// An anchored wall-mounted winch: the footprint stays at the edge of the gallery.
machine.name='upper-winch-and-gears';
const iron=simple?metal:new T.MeshStandardMaterial({color:'#54473a',metalness:.72,roughness:.68});
const edge=simple?metal:new T.MeshStandardMaterial({color:'#806447',metalness:.77,roughness:.52});
const rope=simple?paleStone:new T.MeshStandardMaterial({color:'#a9926d',roughness:1});
const axle=simple?brass:new T.MeshStandardMaterial({color:'#ad8550',metalness:.8,roughness:.44});
const boltGeo=new T.CylinderGeometry(.055,.055,.045,8);
function bolt(x,y,z,parent=machine){const b=mesh(boltGeo,axle,x,y,z,parent);b.rotation.x=Math.PI/2;}
function strap(x1,y1,x2,y2,z,w=.19){const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy);const b=box(w,l,.13,(x1+x2)/2,(y1+y2)/2,z,edge,machine);b.rotation.z=-Math.atan2(dx,dy);for(const t of [.08,.5,.92])bolt(x1+dx*t,y1+dy*t,z+.09);}
// Steel ledge and uprights connect the assembly visually to the gallery wall.
box(6.4,.22,2.05,0,.1,-.65,iron,machine);
for(const x of [-2.85,2.85]){box(.22,7.7,.25,x,3.85,-1.42,iron,machine);for(const y of [.45,2.7,5,7.2]){box(.38,.32,.09,x,y,-1.24,edge,machine);bolt(x,y,-1.16);}}
function gear(x,y,r,teeth,spokes){
 const g=new T.Group();g.position.set(x,y,-1.04);machine.add(g);
 // Flat annular faces and a deep rim leave the spaces between spokes open.
 const ring=mesh(new T.RingGeometry(r*.73,r*.96,64),edge,0,0,.13,g);ring.material.side=T.DoubleSide;
 mesh(new T.TorusGeometry(r*.86,r*.10,8,64),iron,0,0,0,g);
 for(let i=0;i<teeth;i++){const a=i*Math.PI*2/teeth,tooth=box(r*.12,r*.16,.24,Math.sin(a)*r,Math.cos(a)*r,0,edge,g);tooth.rotation.z=-a;}
 for(let i=0;i<spokes;i++){const a=i*Math.PI*2/spokes;strapInGear(g,Math.sin(a)*r*.2,Math.cos(a)*r*.2,Math.sin(a)*r*.78,Math.cos(a)*r*.78,r*.1);}
 const hub=mesh(new T.CylinderGeometry(r*.22,r*.22,.32,24),axle,0,0,.19,g);hub.rotation.x=Math.PI/2;
 const cap=mesh(new T.CylinderGeometry(r*.12,r*.12,.38,20),iron,0,0,.27,g);cap.rotation.x=Math.PI/2;
 for(let i=0;i<6;i++){const a=i*Math.PI/3;bolt(Math.cos(a)*r*.16,Math.sin(a)*r*.16,.38,g);}
 return g;
}
function strapInGear(g,x1,y1,x2,y2,w){const dx=x2-x1,dy=y2-y1,o=box(w,Math.hypot(dx,dy),.17,(x1+x2)/2,(y1+y2)/2,.02,iron,g);o.rotation.z=-Math.atan2(dx,dy);}
gear(1.05,4.25,2.02,32,8);gear(-1.92,3.55,1.04,18,7);
// Riveted diagonal arm and horizontal braces across the gear face.
strap(-2.55,5.75,2.5,4.25,-.72,.18);strap(2.42,5.9,1.05,2.15,-.68,.23);
// A horizontal winding drum, flanges, bearing blocks and real helical rope.
for(const x of [-1.75,1.75]){
 box(.38,1.35,.65,x,.68,-.08,iron,machine);box(.55,.18,.8,x,.12,-.08,edge,machine);
 const f=mesh(new T.CylinderGeometry(.83,.83,.16,32),edge,x,1.12,-.08,machine);f.rotation.z=Math.PI/2;
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const b=mesh(boltGeo,axle,x+(x<0?-.1:.1),1.12+Math.sin(a)*.65,-.08+Math.cos(a)*.65,machine);b.rotation.z=Math.PI/2;}
}
const drum=mesh(new T.CylinderGeometry(.57,.57,3.45,32),iron,0,1.12,-.08,machine);drum.rotation.z=Math.PI/2;
if(simple){for(let i=0;i<18;i++){const ring=mesh(new T.TorusGeometry(.6,.04,5,24),rope,-1.55+i*.18,1.12,-.08,machine);ring.rotation.y=Math.PI/2;}}
else {const points=[];for(let i=0;i<=700;i++){const t=i/700,a=t*Math.PI*2*25;points.push(new T.Vector3(-1.58+t*3.16,1.12+Math.cos(a)*.60,-.08+Math.sin(a)*.60));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),700,.036,6,false),rope,0,0,0,machine);}
// Overhead pulleys and paired vertical cable runs.
for(const [x,y,r] of [[-2.38,6.65,.43],[-2.45,4.48,.3],[2.5,6.9,.3]]){
 const rim=mesh(new T.TorusGeometry(r,.065,8,32),edge,x,y,-.9,machine);
 const hub=mesh(new T.CylinderGeometry(r*.18,r*.18,.25,16),axle,x,y,-.87,machine);hub.rotation.x=Math.PI/2;
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;pipe([x,y,-.88],[x+Math.sin(a)*r*.85,y+Math.cos(a)*r*.85,-.88],.027,iron,machine);}
 for(const side of [-1,1])pipe([x+side*r*.94,1.4,-.88],[x+side*r*.94,y,-.88],.025,rope,machine);
}
return machine;
}
