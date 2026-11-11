import {addReferenceOverheadBridge} from './reference-overhead-bridge.js?v=1';
import {addUpperLevelLandings} from './upper-level-landings.js?v=2';
// Reference-led upper gallery: all details remain real geometry in clay mode.
export function addUpperDetails({T,structure,walkways,windows,mesh,box,pipe,metal,brass,paleStone,simple}){
const R=18.5,CZ=-1,Y=9.95;
function bay(a,r=R,y=Y,parent=walkways){const g=new T.Group();g.position.set(Math.sin(a)*r,y,CZ-Math.cos(a)*r);g.rotation.y=-a;g.userData.cutFront=g.position.z>2;parent.add(g);return g;}
function bolt(x,y,z,g){const b=mesh(new T.CylinderGeometry(.055,.055,.04,6),brass,x,y,z,g);b.rotation.x=Math.PI/2;}
function plate(x,y,z,g){box(.32,.3,.08,x,y,z,brass,g);if(!simple)for(const dx of [-.1,.1])for(const dy of [-.09,.09])bolt(x+dx,y+dy,z+.05,g);}
// Deck seams, outer rail and riveted post bases, repeated around the rotunda.
for(let i=0;i<64;i++){const a=i/64*Math.PI*2,g=bay(a);box(1.4,.025,.045,0,.025,.02,metal,g);for(const x of [-1.05,1.05]){box(.22,.06,.25,x,.05,1.08,brass,g);if(!simple)bolt(x,.09,1.2,g);}}
for(const radius of [17.71,19.29])for(let i=0;i<48;i++){const a=i/48*Math.PI*2,g=bay(a,radius);pipe([0,0,0],[0,1.22,0],.045,metal,g);box(.19,.08,.24,0,.04,0,brass,g);plate(0,.73,.045,g);}
for(const y of [Y+.55,Y+1.2]){const rail=mesh(new T.TorusGeometry(19.29,.045,6,96),brass,0,y,CZ,walkways);rail.rotation.x=Math.PI/2;}
// Bundled pipes and wide bolted collars on the structural piers.
for(let i=0;i<8;i++){const g=bay(i*Math.PI/4,18.5,9.85,structure);for(const x of [-.33,0,.33]){pipe([x,0,1.35],[x,14.2,1.35],.1,metal,g);for(const y of [1.1,5.4,10.4,13.5]){const band=mesh(new T.CylinderGeometry(.14,.14,.24,10),brass,x,y,1.35,g);}}for(const y of [1.1,5.4,10.4]){box(1.28,.32,.12,0,y,1.48,brass,g);for(const x of [-.5,.5])bolt(x,y,1.57,g);}}
const paper=simple?paleStone:new T.MeshStandardMaterial({color:'#d2c2a2',roughness:1,side:T.DoubleSide});
// Banners are narrow hanging cloth meshes, with uneven lower hems.
for(const a of [-Math.PI/8,Math.PI/8,5*Math.PI/8]){const g=bay(a,18.1,10.1,structure);pipe([-1.5,7.6,.5],[1.5,7.6,.5],.06,brass,g);pipe([-1.5,7.6,.5],[-1.5,7.6,-1],.08,metal,g);const geo=new T.PlaneGeometry(2.5,6.4,6,12),p=geo.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,Math.sin(p.getX(i)*4+y)*.055);if(y< -3)p.setY(i,y+.18*Math.sin(i*3.7));}geo.computeVertexNormals();mesh(geo,paper,0,4.3,.5,g);if(!simple){for(let j=0;j<3;j++){const pts=[];for(let k=0;k<32;k++){const t=k/31;pts.push(new T.Vector3(Math.sin(t*7+j*.3)*(.25+t*.4),6.8-t*5,.58));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),36,.014,4,false),metal,0,0,0,g);}}}
// A high steel bridge crosses the atrium above the arcade crowns.
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
machine.name='upper-winch-and-gears';box(5.8,.22,2.3,0,.1,-.5,metal,machine);
function gear(x,y,r,teeth){const g=new T.Group();g.position.set(x,y,-1.25);machine.add(g);mesh(new T.TorusGeometry(r*.83,r*.13,6,48),metal,0,0,0,g);for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2,m=box(r*.15,r*.24,.3,Math.sin(a)*r,Math.cos(a)*r,0,brass,g);m.rotation.z=-a;}for(let i=0;i<6;i++){const a=i*Math.PI/3;pipe([0,0,0],[Math.sin(a)*r*.8,Math.cos(a)*r*.8,0],r*.065,metal,g);}const hub=mesh(new T.CylinderGeometry(r*.2,r*.2,.5,16),brass,0,0,.15,g);hub.rotation.x=Math.PI/2;return g;}
gear(.95,4.1,2.05,28);gear(-1.95,3.35,1.05,18);
for(const x of [-1.7,1.7]){box(.28,2.1,.4,x,1.05,.15,metal,machine);const flange=mesh(new T.CylinderGeometry(.85,.85,.18,24),brass,x,1.35,.15,machine);flange.rotation.z=Math.PI/2;}
const drum=mesh(new T.CylinderGeometry(.6,.6,3.3,24),metal,0,1.35,.15,machine);drum.rotation.z=Math.PI/2;
const rope=simple?paleStone:new T.MeshStandardMaterial({color:'#a38e6b',roughness:1});for(let i=0;i<22;i++){const ring=mesh(new T.TorusGeometry(.63,.045,5,24),rope,-1.55+i*.145,1.35,.15,machine);ring.rotation.y=Math.PI/2;}
for(const x of [-2.4,2.4]){pipe([x,0,-1],[x,7,-1],.1,metal,machine);const pulley=mesh(new T.TorusGeometry(.42,.085,6,24),brass,x,6.3,-.6,machine);pipe([x-.32,1.5,-.55],[x-.32,8,-.55],.025,rope,machine);pipe([x+.32,1.5,-.55],[x+.32,8,-.55],.025,rope,machine);}
}
