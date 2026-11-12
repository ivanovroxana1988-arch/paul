export function addAtelierEnvironment({T,scene,texture}){
const envFaces=Array.from({length:6},(_,i)=>texture((c,s)=>{const g=c.createLinearGradient(0,0,0,s);g.addColorStop(0,i===2?'#dcebe7':'#9bb9ba');g.addColorStop(.42,'#b4b4a0');g.addColorStop(.6,'#7c735d');g.addColorStop(1,i===3?'#252c25':'#3a473d');c.fillStyle=g;c.fillRect(0,0,s,s);if(i!==2&&i!==3){c.fillStyle='#ffdfae';c.fillRect(s*.12,s*.1,s*.1,s*.42);c.fillRect(s*.76,s*.08,s*.14,s*.5);c.fillStyle='#7bc7bf';c.fillRect(s*.4,s*.45,s*.2,s*.08)}},128).image);
const env=new T.CubeTexture(envFaces);env.colorSpace=T.SRGBColorSpace;env.needsUpdate=true;scene.environment=env;scene.environmentIntensity=.55;
}
// Geometry and materials for the first finished section: entry, pool and Skin.
// All display drawings are original procedural concept studies, not Paul's portfolio.
export function addAtelierDetail({T,scene,mesh,box,cylinder,pipe,curve,textPlane,texture,stone,paleStone,darkStone,metal,brass,mint,sculpture,ivory,sculptureGlow,waterMat,attachSkin}){
const colliders=[],selectable=[],animated=[];
// Broad sky, warm windows and dark ground give reflective materials something to reflect.
addAtelierEnvironment({T,scene,texture});ivory.roughness=.25;ivory.metalness=.55;sculptureGlow.emissiveIntensity=.28;waterMat.envMapIntensity=1.25;
// Subtle contact occlusion, rather than floating architecture.
const contactTex=texture((c,s)=>{const g=c.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);g.addColorStop(0,'rgba(9,15,11,.65)');g.addColorStop(.55,'rgba(9,15,11,.3)');g.addColorStop(1,'rgba(9,15,11,0)');c.fillStyle=g;c.fillRect(0,0,s,s)},128);
function contact(x,z,w,d){const m=mesh(new T.PlaneGeometry(w,d),new T.MeshBasicMaterial({map:contactTex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1}),x,.015,z,scene,false);m.rotation.x=-Math.PI/2;return m}
contact(0,-1,13,13);
// A recessed pool edge, bronze joints and a physical waterline.
const black=new T.MeshStandardMaterial({color:'#142720',roughness:.7,metalness:.35});
const ring=mesh(new T.TorusGeometry(5.03,.065,8,96),brass,0,.53,-1);ring.rotation.x=Math.PI/2;
for(let i=0;i<32;i++){const a=i/32*Math.PI*2;pipe([Math.cos(a)*4.82,.51,Math.sin(a)*4.82-1],[Math.cos(a)*5.12,.51,Math.sin(a)*5.12-1],.008,black)}
for(let i=0;i<3;i++){const disc=mesh(new T.RingGeometry(5.25+i*.09,5.27+i*.09,96),black,0,.015,-1,scene,false);disc.rotation.x=-Math.PI/2;}
// The entrance has its own threshold and ironwork, so looking behind is meaningful.
for(const side of [-1,1]){box(7,10,1.4,side*8.5,5,22,darkStone);box(1.1,11,1.9,side*4.5,5.5,22,paleStone);box(1.5,.35,2.1,side*4.5,.15,22,paleStone);box(7,.25,3,side*8.5,.05,21,stone);}
box(10,.6,1.8,0,10.6,22,paleStone);for(const side of [-1,1]){const gate=new T.Group();gate.position.set(side*4,0,21.9);gate.rotation.y=side*.65;scene.add(gate);for(let j=0;j<8;j++)pipe([side*-j*.42,.2,0],[side*-j*.42,8.8,0],.035,metal,gate);pipe([0,.4,0],[-side*3.1,.4,0],.06,metal,gate);pipe([0,6,0],[-side*3.1,6,0],.06,metal,gate);}
textPlane('NINJA.SYS',0,9.3,21.1,7,65,'#d9c9a6').rotation.y=Math.PI;
// Framed, warm practical lamps at the entry and at the Skin threshold.
const amber=new T.MeshBasicMaterial({color:'#ffd394'});
function lantern(x,y,z){const group=new T.Group();group.position.set(x,y,z);scene.add(group);box(.42,.12,.42,0,-.35,0,brass,group);box(.42,.1,.42,0,.35,0,brass,group);box(.28,.6,.28,0,0,0,amber,group,false);for(const dx of [-.18,.18])for(const dz of [-.18,.18])pipe([dx,-.3,dz],[dx,.3,dz],.025,metal,group);pipe([0,.42,0],[0,.72,0],.03,brass,group);const l=new T.PointLight('#ffbc72',6,5,2);l.position.set(x,y,z);scene.add(l)}
for(const x of [-4.5,4.5])lantern(x,3.6,20.8);const skinFrontStart=scene.children.length;for(const x of [-15.35,-8.65])lantern(x,3,-11.9);
// Skin's own layered stone threshold, neon inlay and discreet brass identifier.
box(6.2,.12,1.9,-12,.02,-12.1,paleStone);box(5.75,.025,.06,-12,.095,-11.2,mint,scene,false);
const signMat=new T.MeshStandardMaterial({color:'#344a3c',metalness:.65,roughness:.5});box(2.3,.65,.08,-12,2.8,-12.15,signMat);textPlane('TATTOO / BODY ART',-12,2.8,-12.09,2.2,27,'#dfd6bc');
// Subtle crown graffiti on the masonry; flat texture, real location in the world.
const crownTex=texture((c,s)=>{c.scale(.5,.5);c.strokeStyle='#34bfa0';c.lineWidth=10;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(115,350);c.lineTo(100,150);c.lineTo(195,245);c.lineTo(260,115);c.lineTo(320,245);c.lineTo(405,150);c.lineTo(385,350);c.lineTo(115,350);c.stroke();c.beginPath();c.moveTo(110,385);c.lineTo(390,385);c.stroke()},256);
mesh(new T.PlaneGeometry(1.2,1.2),new T.MeshBasicMaterial({map:crownTex,transparent:true,depthWrite:false}),-15.5,2.1,-12.25,scene,false);
attachSkin(scene.children.slice(skinFrontStart));
// A circular plinth lets the suspended sculpture feel composed from every angle.
for(let i=0;i<3;i++){const r=.85+i*.25;const t=mesh(new T.TorusGeometry(r,.025,8,64),i===1?mint:brass,0,.72+i*.06,-1);t.rotation.x=Math.PI/2;}
const orbit=mesh(new T.TorusGeometry(3.4,.018,6,128),brass,0,7,-1);orbit.rotation.x=.9;orbit.rotation.z=.35;
const skinRoomStart=scene.children.length;
// Ink station: real chair, arm rest, desk, task light, equipment and sheets.
const upholstery=new T.MeshStandardMaterial({color:'#1f2b25',roughness:.77,metalness:.12});const paper=new T.MeshStandardMaterial({color:'#e2d4b7',roughness:.96,side:T.DoubleSide});const steel=new T.MeshStandardMaterial({color:'#8d9d91',metalness:.85,roughness:.24});
const station=new T.Group(),chairX=-10.8;station.position.set(chairX,0,-21);station.rotation.y=.28;scene.add(station);
cylinder(.65,.78,.12,0,.06,0,metal,station,32);cylinder(.1,.13,.75,0,.45,0,steel,station);box(.85,.18,1.05,0,.92,0,upholstery,station);const back=box(.85,.18,1.3,0,1.25,-.95,upholstery,station);back.rotation.x=-.5;box(.58,.16,.35,0,1.64,-1.6,upholstery,station);const leg=box(.8,.15,.75,0,.72,.82,upholstery,station);leg.rotation.x=.4;for(const side of [-1,1]){pipe([side*.55,.85,-.2],[side*.55,1.15,-.2],.035,steel,station);box(.24,.09,.72,side*.55,1.19,-.1,upholstery,station);}colliders.push({minX:chairX-1.1,maxX:chairX+1.1,minZ:-23,maxZ:-19.6});contact(chairX,-21,3,4);
// The former trolley occupied the left wall; that wall now hosts the continuous workstation.
// A wall desk with layered sketch sheets and a physical roll of paper.
box(1.2,.13,3,-9.1,1.1,-21.5,paleStone);for(const z of [-22.6,-20.4])pipe([-9.15,.05,z],[-9.15,1.05,z],.06,metal);for(let i=0;i<4;i++){const sheet=mesh(new T.PlaneGeometry(.55,.78),paper,-9.12+i*.025,1.18+i*.004,-21+i*.12,scene,false);sheet.rotation.x=-Math.PI/2;sheet.rotation.z=i*.09;}const roll=cylinder(.15,.15,.8,-9.1,1.32,-22.4,paper,scene,24);roll.rotation.z=Math.PI/2;colliders.push({minX:-9.8,maxX:-8.35,minZ:-23.1,maxZ:-19.7});
textPlane('THE INK ROOM',-12,6.1,-31.18,6,51,'#b8c2ac');textPlane('DESIGN / PLACEMENT / DETAIL',-12,5.55,-31.15,6,18,'#6ec7b1');
// Three distinct ink studies can be inspected without moving through the scene.
function study(kind){return texture((c,s)=>{c.fillStyle='#e6d9bc';c.fillRect(0,0,s,s);c.strokeStyle='#24372e';c.lineCap='round';c.lineJoin='round';if(kind===0){for(let k=0;k<7;k++){c.lineWidth=k%2?1.3:2.7;c.beginPath();for(let i=0;i<=160;i++){const t=i/160,a=t*Math.PI*5+k*.16,r=25+95*Math.sin(t*Math.PI);const x=s/2+Math.sin(a)*r,y=65+t*(s-130);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke();}}else if(kind===1){c.translate(s/2,s/2);for(let k=0;k<12;k++){c.rotate(Math.PI/6);c.lineWidth=1.7;c.beginPath();c.moveTo(0,15);c.bezierCurveTo(110,90,70,180,0,190);c.bezierCurveTo(-70,180,-110,90,0,15);c.stroke()}c.beginPath();c.arc(0,0,36,0,Math.PI*2);c.stroke();c.setTransform(1,0,0,1,0,0);}else{for(let j=0;j<22;j++){c.lineWidth=1.6;c.beginPath();for(let i=0;i<=100;i++){const t=i/100,x=80+t*(s-160),y=160+j*8+Math.sin(t*6.28+j*.12)*50;i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}}c.fillStyle='#466958';c.textAlign='center';c.font='12px Arial';c.fillText('N/S — CONCEPT STUDY 0'+(kind+1),s/2,s-30)},512)}
const studies=[];for(let i=0;i<3;i++){const map=study(i),x=-12+(i-1)*2.2;const material=new T.MeshStandardMaterial({map,roughness:.93});const m=mesh(new T.PlaneGeometry(1.72,2.92),material,x,3,-30.88);m.userData.study=i;selectable.push(m);studies.push({title:['Organic flow','Radial bloom','Contour waves'][i],description:['Linie organică și ritm vertical.','Simetrie radială și spațiu negativ.','Contururi suprapuse și mișcare.'][i],image:map.image.toDataURL('image/png')});textPlane('0'+(i+1)+' / STUDIU',x,1.3,-30.88,1.8,22,'#9ab5a1');}
attachSkin(scene.children.slice(skinRoomStart));
return {colliders,selectable,studies,update(t){orbit.rotation.y=Math.sin(t*.13)*.3;}};
}
