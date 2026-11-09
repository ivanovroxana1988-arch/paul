// Local reconstruction details read from the five reference views.
// Coordinates are local to each radial gallery: 0 Skin, 1 Canvas, 2 Space, 3 Motion.
export function addLowerArcadeDetails({T,scene,roots,stone,paleStone,metal,brass,simple=false,entranceDetails=true}){
const groups=[],colliders=[],stats={corridorRibs:0,mezzanines:0,cableDrums:0,gears:0,boltedPlates:0};
const wood=simple?new T.MeshLambertMaterial({color:'#929789'}):new T.MeshStandardMaterial({color:'#6d4b2c',roughness:.85});
const paper=simple?new T.MeshLambertMaterial({color:'#dbd9ca',side:T.DoubleSide}):new T.MeshStandardMaterial({color:'#d4c7a6',roughness:1,side:T.DoubleSide});
const cyan=simple?new T.MeshLambertMaterial({color:'#7ca69b'}):new T.MeshBasicMaterial({color:'#46d9bc'});
const amber=simple?new T.MeshLambertMaterial({color:'#c9c5aa'}):new T.MeshBasicMaterial({color:'#ffd197'});
function mesh(g,m,x=0,y=0,z=0,p){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=!simple;o.receiveShadow=true;p.add(o);return o;}
function box(w,h,d,x,y,z,m,p){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p)}
function pipe(a,b,r,m,p){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),simple?6:10),m,0,0,0,p);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function bent(points,r,m,p){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),24,r,simple?6:10,false),m,0,0,0,p)}
const boltGeo=new T.CylinderGeometry(.055,.055,.06,6);function plate(x,y,z,w,h,p){box(w,h,.09,x,y,z,brass,p);for(const side of [-1,1])for(const sy of [-1,1]){const b=mesh(boltGeo,metal,x+side*w*.32,y+sy*h*.3,z+.08,p);b.rotation.x=Math.PI/2;}stats.boltedPlates++;}
function rib(p,z,r=2.65,spring=3.8,thick=.22,m=stone){const s=new T.Shape();s.absarc(0,spring,r+thick,0,Math.PI,false);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth:.25,bevelEnabled:false,curveSegments:simple?12:24}),m,0,0,z,p);for(const side of [-1,1])box(thick,spring,.25,side*(r+thick/2),spring/2,z+.125,m,p);stats.corridorRibs++;}
function lantern(p,x,z){box(.58,.65,.58,x,.325,z,paleStone,p);box(.43,.08,.43,x,.72,z,brass,p);const bulb=mesh(new T.CylinderGeometry(.12,.12,.55,12),amber,x,1.03,z,p);for(let i=0;i<6;i++){const a=i*Math.PI/3,dx=Math.cos(a)*.2,dz=Math.sin(a)*.2;pipe([x+dx,.75,z+dz],[x+dx,1.32,z+dz],.025,metal,p);}const dome=mesh(new T.SphereGeometry(.24,12,8,0,Math.PI*2,0,Math.PI/2),brass,x,1.33,z,p);if(!simple){const light=new T.PointLight('#ffc17d',3,4);light.position.set(x,1.03,z);p.add(light);}}
for(let index=0;index<roots.length;index++){
const p=new T.Group();p.name=['skin-reference-details','canvas-reference-details','space-reference-workshop','motion-reference-mechanics'][index];roots[index].add(p);groups.push(p);
if(entranceDetails)for(const side of [-1,1]){const x=side*3.48;bent([[x,.1,.95],[x,2.1,.95],[x,3.2,.95],[x+side*.12,3.8,.95],[x+side*.12,8.9,.95]],.065,metal,p);for(const y of [.6,3.5,6.4,8.9])plate(x,y,1.03,.55,.24,p);lantern(p,side*3.35,1.15);}
// Longitudinal strips and successive ribs make the opening a corridor with real depth.
if(index===0||index===3){for(const z of [-1.6,-4.5,-7.4,-10.3]){rib(p,z,index===0?2.65:2.55,3.75,.18,index===3?metal:stone);if(index===3){for(const side of [-1,1])plate(side*2.56,3.75,z+.32,.35,.35,p);}}
for(const side of [-1,1]){pipe([side*2.82,.15,-.8],[side*2.82,.15,-11.6],.032,cyan,p);pipe([side*2.82,5.9,-.8],[side*2.82,5.9,-11.6],.035,metal,p);}rib(p,-11.7,1.2,2.4,.12,brass);}
}
// Artwork studio tucked inside the right-of-centre arch.
const studio=groups[2],deck=box(5.5,.2,2.8,0,3.65,-3.4,metal,studio);deck.name='studio-mezzanine';stats.mezzanines++;
for(const x of [-2.48,2.48]){bent([[x,3.53,-2],[x,3.15,-2.15],[x,2.55,-3.1],[x,2.3,-4.7]],.07,brass,studio);pipe([x,3.8,-2.02],[x,4.92,-2.02],.04,metal,studio);}
for(const y of [4.17,4.88])pipe([-2.72,y,-1.99],[2.72,y,-1.99],.04,brass,studio);for(let x=-2.1;x<=2.1;x+=.7)pipe([x,3.8,-1.99],[x,4.9,-1.99],.028,metal,studio);
box(3.4,.14,.8,.6,4.8,-4.2,wood,studio);for(const x of [-.9,2.05])for(const z of [-4.5,-3.9])box(.09,1.05,.09,x,4.2,z,wood,studio);
for(let i=0;i<4;i++){const x=-.1+i*.46;mesh(new T.CylinderGeometry(.1,.1,.25,10),brass,x,4.99,-4.1,studio);for(let j=0;j<4;j++)pipe([x+(j-1.5)*.025,5.08,-4.1],[x+(j-1.5)*.05,5.55+(j%2)*.1,-4.1],.012,wood,studio);}
pipe([2,4.87,-4.3],[2,5.75,-4.3],.03,metal,studio);pipe([2,5.75,-4.3],[1.45,6.1,-4.2],.03,metal,studio);const shade=mesh(new T.ConeGeometry(.25,.2,16,1,true),metal,1.45,6.0,-4.2,studio);shade.rotation.z=Math.PI;mesh(new T.SphereGeometry(.06,8,6),amber,1.45,5.86,-4.2,studio);
// Draped fabric, flat-file cabinet, loose frames, rolls and bucket below the platform.
const drape=mesh(new T.PlaneGeometry(.65,1.4,4,12),paper,1.95,4.5,-1.94,studio);const positions=drape.geometry.attributes.position;for(let i=0;i<positions.count;i++)positions.setZ(i,Math.sin(positions.getX(i)*25)*.05);drape.geometry.computeVertexNormals();
box(1.8,1.25,1.15,2.25,.625,-6.2,metal,studio);for(let i=0;i<5;i++){const y=.17+i*.24;box(1.7,.025,.025,2.25,y,-5.61,brass,studio);box(.3,.035,.06,2.25,y+.1,-5.57,brass,studio);}colliders.push({index:2,minX:1.2,maxX:3.3,minZ:-6.9,maxZ:-5.45});
for(let i=0;i<3;i++){const g=new T.Group();g.position.set(-2.8+i*.32,.05,-5.5-i*.15);g.rotation.x=-.12;g.rotation.z=.06*i;studio.add(g);const w=1.2+i*.25,h=1.7+i*.2;for(const x of [-w/2,w/2])box(.055,h,.07,x,h/2,0,wood,g);for(const y of [0,h])box(w,.055,.07,0,y,0,wood,g);}
for(let i=0;i<4;i++){const roll=mesh(new T.CylinderGeometry(.09,.09,2.1-i*.12,10),paper,-2.7+i*.18,1.04,-7,studio);roll.rotation.z=-.1-i*.04;}mesh(new T.CylinderGeometry(.24,.19,.42,12),metal,-1.85,.21,-6.8,studio);colliders.push({index:2,minX:-3.4,maxX:-1.55,minZ:-7.5,maxZ:-5.2});
// Cable drums, a toothed gear and anchored cables beside Motion's arched tunnel.
const drumMat=simple?new T.MeshLambertMaterial({color:'#b5bca9'}):brass;
const mechanism=new T.Group();mechanism.position.set(3.65,0,1.2);mechanism.name='cable-drum-assembly';groups[3].add(mechanism);box(1.5,7.8,.35,0,3.9,-.1,metal,mechanism);
for(let i=0;i<3;i++){const y=2+i*1.65,drum=mesh(new T.CylinderGeometry(.53,.53,.42,24),drumMat,0,y,.32,mechanism);drum.rotation.x=Math.PI/2;mesh(new T.CircleGeometry(.47,24),drumMat,0,y,.56,mechanism);for(const radius of [.27,.42])mesh(new T.TorusGeometry(radius,.018,4,24),metal,0,y,.58,mechanism);for(let j=0;j<7;j++){const groove=mesh(new T.TorusGeometry(.5,.017,4,24),metal,0,y,.13+j*.055,mechanism);}mesh(new T.CylinderGeometry(.16,.16,.62,12),metal,0,y,.36,mechanism).rotation.x=Math.PI/2;pipe([-.35,y,.55],[-.35,9.4,.55],.023,metal,mechanism);pipe([.35,y,.55],[.35,9.4,.55],.023,metal,mechanism);stats.cableDrums++;}
const gear=new T.Group();gear.position.set(0,7.2,.35);mechanism.add(gear);const outer=mesh(new T.TorusGeometry(.93,.13,6,40),metal,0,0,0,gear);for(let i=0;i<20;i++){const a=i*Math.PI/10;const tooth=box(.18,.24,.25,Math.sin(a)*1.08,Math.cos(a)*1.08,0,metal,gear);tooth.rotation.z=-a;}for(let i=0;i<8;i++){const a=i*Math.PI/4;pipe([Math.sin(a)*.2,Math.cos(a)*.2,0],[Math.sin(a)*.9,Math.cos(a)*.9,0],.07,brass,gear);}mesh(new T.CylinderGeometry(.21,.21,.3,12),brass,0,0,0,gear).rotation.x=Math.PI/2;stats.gears++;
return {groups,colliders,stats};
}
