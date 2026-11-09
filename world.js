import {FIVE_ARCADES} from './arcade-layout.js';
import {createGraffitiArtist} from './characters/graffiti-artist.js';
import {createArtistRoute} from './characters/artist-route.js';
import * as T from './vendor/three.module.js';
import {finishSurfaces} from './surface-finish.js?v=3';
import {addAtelierDetail} from './atelier-detail.js';
import {buildRotunda,ROTUNDA_RADIUS,ROTUNDA_CENTER_Z} from './rotunda.js?v=5';
import {addLevels} from './levels.js';
import {addLowerArcadeDetails} from './lower-arcades.js';
import {createSolarLight} from './solar/solar-light.js?v=7';
import {createVisibleSky} from './solar/visible-sky.js?v=2';
const $=s=>document.querySelector(s),canvas=$('#world'),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
const frontLayout=document.body.dataset.layout==='five-arcades'?FIVE_ARCADES:null;
const roomLayout=frontLayout&&[frontLayout[0],frontLayout[1],frontLayout[3],frontLayout[4]];
let renderer;try{renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(error){$('#loader').style.display='none';$('#error').hidden=false;throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
const scene=new T.Scene();scene.background=new T.Color('#344c50');scene.fog=new T.FogExp2('#344749',.017);const camera=new T.PerspectiveCamera(59,innerWidth/innerHeight,.1,120);camera.position.set(0,3.8,15.8);let yaw=0,pitch=.07;camera.rotation.order='YXZ';
let seed=39;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
function texture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
const stoneTex=texture((c,s)=>{c.fillStyle='#827b6b';c.fillRect(0,0,s,s);for(let i=0;i<45000;i++){const v=80+rand()*100;c.fillStyle=`rgba(${v},${v*.94},${v*.81},${rand()*.4})`;const n=rand()*3;c.fillRect(rand()*s,rand()*s,n,n)}for(let y=0;y<s;y+=128){c.fillStyle='#3e40352b';c.fillRect(0,y,s,3);for(let x=(y/128%2)*128;x<s;x+=256)c.fillRect(x,y,3,128)}for(let i=0;i<20;i++){c.strokeStyle='#41463826';c.lineWidth=rand()*4;c.beginPath();let x=rand()*s,y=rand()*s;c.moveTo(x,y);c.lineTo(x+rand()*30-15,y+rand()*70);c.stroke()}});stoneTex.wrapS=stoneTex.wrapT=T.RepeatWrapping;stoneTex.repeat.set(2,2);
const stone=new T.MeshStandardMaterial({map:stoneTex,color:'#b0a491',roughness:.93,bumpMap:stoneTex,bumpScale:.075});const darkStone=stone.clone();darkStone.color.set('#6d6e60');const paleStone=stone.clone();paleStone.color.set('#c2af94');const metal=new T.MeshStandardMaterial({color:'#393e37',metalness:.8,roughness:.62});const brass=new T.MeshStandardMaterial({color:'#91734b',metalness:.78,roughness:.43});const mint=new T.MeshBasicMaterial({color:'#61ebcf'});const warm=new T.MeshBasicMaterial({color:'#ffcc84'});
function mesh(geometry,material,x=0,y=0,z=0,parent=scene,shadow=true){const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=shadow;m.receiveShadow=true;parent.add(m);return m;}
function box(w,h,d,x,y,z,mat=stone,parent=scene,shadow=true){return mesh(new T.BoxGeometry(w,h,d),mat,x,y,z,parent,shadow)}
function cylinder(r1,r2,h,x,y,z,mat=metal,parent=scene,segments=12){return mesh(new T.CylinderGeometry(r1,r2,h,segments),mat,x,y,z,parent)}
function pipe(a,b,r=.055,mat=metal,parent=scene){const av=new T.Vector3(...a),bv=new T.Vector3(...b),m=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),mat,0,0,0,parent,false);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(...b).sub(new T.Vector3(...a)).normalize());return m}
function curve(points,r,mat,parent=scene){return mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),80,r,8,false),mat,0,0,0,parent)}
const sky=new T.HemisphereLight('#b5d7de','#4a3925',2.15),ambient=new T.AmbientLight('#d4bd92',.32);scene.add(sky,ambient);const sun=new T.DirectionalLight('#ffd69a',4.2);sun.castShadow=true;
// A denser single shadow map makes the narrow dome ribs more visible. Keep the
// original resolution on low-memory devices and never exceed the GPU limit.
const shadowSize=Math.min(renderer.capabilities.maxTextureSize,(navigator.deviceMemory && navigator.deviceMemory<=4)?2048:3072);sun.shadow.mapSize.set(shadowSize,shadowSize);sun.shadow.bias=-.00025;sun.shadow.normalBias=.015;scene.add(sun);const fill=new T.DirectionalLight('#7fb6bf',.7);fill.position.set(-18,12,-16);scene.add(fill);
const visibleSky=createVisibleSky({T,scene});visibleSky.follow(camera);
const solar=createSolarLight({T,scene,sun,sky,ambient,fill,onSky:state=>visibleSky.update(state),onChange:state=>{const range=$('#sunTime');range.value=state.minutes;$('#sunClock').textContent=state.time;$('#sunMode').textContent=state.summer?'21 IUNIE · BUCUREȘTI':state.mode==='live'?'ORA REALĂ · BUCUREȘTI':'ORA ALEASĂ · BUCUREȘTI';$('#sunLive').setAttribute('aria-pressed',String(state.mode==='live'));$('#sunSummer').setAttribute('aria-pressed',String(state.summer));}});
$('#sunToggle').addEventListener('click',()=>{const panel=$('#sunPanel');panel.hidden=!panel.hidden;$('#sunToggle').setAttribute('aria-expanded',String(!panel.hidden));});
$('#sunTime').addEventListener('input',e=>{solar.setTime(Number(e.target.value));$('#sunHint').textContent='Apasă „Privește soarele” pentru ora selectată.';});
$('#sunLive').addEventListener('click',()=>{solar.setLive();$('#sunHint').textContent='Apasă „Privește soarele” pentru ora reală.';});
$('#sunSummer').addEventListener('click',()=>{solar.setSummer();$('#sunHint').textContent='Apasă „Privește soarele” ca să-l vezi prin cupolă.';});
solar.start();
// The floor, openings and all architecture are actual meshes.
const levels=addLevels({T,scene,mesh,box,pipe,stone,paleStone,darkStone,metal,brass,mint});
const poolBase=cylinder(5.1,5.2,.55,0,.08,-1,paleStone,scene,96);const waterMat=new T.MeshPhysicalMaterial({color:'#174c47',metalness:.62,roughness:.15,transparent:true,opacity:.88,clearcoat:1});const water=mesh(new T.CircleGeometry(4.65,96),waterMat,0,.39,-1);water.rotation.x=-Math.PI/2;
const rim=mesh(new T.TorusGeometry(4.93,.17,12,96),paleStone,0,.4,-1);rim.name='pool-stone-rim';rim.rotation.x=Math.PI/2;const poolLight=mesh(new T.TorusGeometry(4.66,.025,6,96),mint,0,.42,-1,scene,false);poolLight.rotation.x=Math.PI/2;
const ripples=[];for(let i=0;i<7;i++){const m=mesh(new T.RingGeometry(.98,1,96),new T.MeshBasicMaterial({color:'#81cbb9',transparent:true,opacity:.12,side:T.DoubleSide}),0,.41,-1,scene,false);m.rotation.x=-Math.PI/2;ripples.push(m)}
// Main arcade: voussoirs, piers, spandrels and deep walk-through openings.
function arch(parent,width=6,spring=4.5,depth=1.5,mat=stone,cap=true){const r=width/2;box(.95,spring,depth,-r-.475,spring/2,0,mat,parent);box(.95,spring,depth,r+.475,spring/2,0,mat,parent);for(let i=0;i<15;i++){const a=i*Math.PI/15,b=(i+1)*Math.PI/15-.012;const s=new T.Shape();s.absarc(0,spring,r+.85,a,b,false);s.lineTo(r*Math.cos(b),spring+r*Math.sin(b));s.absarc(0,spring,r,b,a,true);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:3}),i%3===0?paleStone:mat,0,0,-depth/2,parent)}if(cap)box(width+2,1.2,depth,0,spring+r+1.3,0,mat,parent);for(const x of [-r-.48,r+.48]){box(1.23,.25,depth+.22,x,.2,0,paleStone,parent);box(1.18,.28,depth+.2,x,spring-.1,0,paleStone,parent)}}
const zoneData=[{id:'skin',name:'SKIN',index:'01 / BODY',x:-12,color:'#cba982',text:'Tatuaje și body art. Un desen care devine parte din tine.'},{id:'canvas',name:'CANVAS',index:'02 / ART',x:-4,color:'#74b1aa',text:'Pictură și ilustrație. Culoare, textură și povești în straturi.'},{id:'space',name:'SPACE',index:'03 / SPACE',x:4,color:'#c88c64',text:'Murale și intervenții artistice. Lucrări care schimbă un loc.'},{id:'motion',name:'MOTION',index:'04 / DIGITAL',x:12,color:'#6f86b6',text:'Artă digitală, obiecte 3D și experimente în mișcare.'}];
function textPlane(text,x,y,z,width=5,size=70,color='#dcdfce',parent=scene){const tex=texture((c,s)=>{c.clearRect(0,0,s,s);c.textAlign='center';c.textBaseline='middle';c.font=`500 ${size}px Arial`;c.fillStyle=color;c.fillText(text,s/2,s/2)},512);return mesh(new T.PlaneGeometry(width,width),new T.MeshBasicMaterial({map:tex,transparent:true,side:T.DoubleSide,depthWrite:false}),x,y,z,parent,false)}
const roomRoots=[];
zoneData.forEach((z,i)=>{z.originalX=z.x;if(roomLayout){const [x,depth,,,angle]=roomLayout[i];Object.assign(z,{worldX:x,worldZ:depth,theta:-angle});return;}z.theta=[-3,-1,1,3][i]*Math.PI/8;z.worldX=ROTUNDA_RADIUS*Math.sin(z.theta);z.worldZ=ROTUNDA_CENTER_Z-ROTUNDA_RADIUS*Math.cos(z.theta);});
if(frontLayout){
 const markers=document.querySelectorAll('#map svg > g');
 zoneData.forEach((zone,index)=>markers[index]?.setAttribute('transform',
   'translate('+(160+zone.worldX*4.5)+' '+(145+zone.worldZ*4.5)+') rotate('+(zone.theta*180/Math.PI)+')'));
}
function zonePoint(z,x,y,depth){const c=Math.cos(-z.theta),sn=Math.sin(-z.theta);return new T.Vector3(z.worldX+c*x+sn*depth,y,z.worldZ-sn*x+c*depth);}
function roomLocal(z,x,depth){const dx=x-z.worldX,dz=depth-z.worldZ,c=Math.cos(-z.theta),sn=Math.sin(-z.theta);return {x:c*dx-sn*dz,z:sn*dx+c*dz};}
function attachRoom(index,children){const root=roomRoots[index];for(const child of children)root.attach(child);}
const clickable=[];zoneData.forEach((zone,i)=>{const roomStart=scene.children.length;const group=new T.Group();group.position.set(zone.x,0,-13);scene.add(group);const spec=roomLayout?.[i];arch(group,spec?.[2]??[6.4,5.8,6.1,6.3][i],spec?spec[3]-spec[2]/2:[5.65,4.35,4.6,5.4][i],spec?.[2]? .8:[1.7,1.35,1.5,1.6][i],stone,false);if(i===0){const crown=texture((c,s)=>{c.clearRect(0,0,s,s);c.strokeStyle='#bd315c';c.globalAlpha=.8;c.lineWidth=s*.045;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(s*.16,s*.75);c.lineTo(s*.25,s*.23);c.lineTo(s*.45,s*.53);c.lineTo(s*.59,s*.14);c.lineTo(s*.70,s*.50);c.lineTo(s*.86,s*.31);c.lineTo(s*.81,s*.75);c.closePath();c.stroke();for(const x of [.36,.51,.68]){c.beginPath();c.arc(s*x,s*.68,s*.018,0,Math.PI*2);c.fillStyle='#bd315c';c.fill();}});const crownY=spec?spec[3]-.35:8.3;mesh(new T.PlaneGeometry(1.05,.8),new T.MeshBasicMaterial({map:crown,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),-2.1,crownY,(spec?.[2]?.4:.86)+.02,group,false);}const sign=textPlane(zone.name,0,4.5,.8,5.5,67,'#efe4c8',group);textPlane(zone.index,0,3.72,.8,5,17,'#63e7c7',group);textPlane(['◉','✕','♜','◇'][i],0,5.7,.8,3,115,'#63e7c7',group);const target=box(5.8,7,.12,0,3.5,.15,new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}),group,false);target.userData.zone=zone.id;clickable.push(target);
for(const dx of [-3.08,3.08])box(.04,3,.05,zone.x+dx,1.6,-12.22,mint,scene,false);const light=new T.PointLight('#4cf1cf',10,8,2);light.position.set(zone.x,.5,-12);scene.add(light);
// Real rooms extend behind the arcade.
box(.4,8,12,zone.x-3.8,4,-20,darkStone);box(.4,8,12,zone.x+3.8,4,-20,darkStone);box(7.7,8,.5,zone.x,4,-26,darkStone);box(7.4,.2,12,zone.x,-.02,-20,paleStone);const roomLight=new T.PointLight('#ffce8e',35,15,1.5);roomLight.position.set(zone.x,5.8,-21);scene.add(roomLight);box(2,.035,.4,zone.x,7.7,-20,warm,scene,false);textPlane(zone.name,zone.x,6,-25.72,6,72,'#a9bca8');const children=scene.children.slice(roomStart);const root=new T.Group();root.name='gallery-'+zone.id;root.position.set(zone.x,0,-13);scene.add(root);roomRoots.push(root);attachRoom(i,children);});
// The perimeter is a rotunda: tangent doorway bays, a circular balcony and radial roof ribs.
buildRotunda({T,scene,mesh,box,pipe,curve,stone,paleStone,darkStone,metal,brass,mint,zoneData,roomRoots,frontLayout});
// Sculpture: three twisting perforated ribbons built from a parametric surface.
const sculpture=new T.Group();sculpture.position.set(0,1.5,-1);scene.add(sculpture);const ivory=new T.MeshStandardMaterial({color:'#dfca9f',metalness:.65,roughness:.29,side:T.DoubleSide});const sculptureGlow=new T.MeshStandardMaterial({color:'#348b7e',emissive:'#43cfb1',emissiveIntensity:.7,metalness:.6,roughness:.2});
for(let k=0;k<3;k++){const vertices=[],indices=[],N=140,M=9;for(let i=0;i<=N;i++){const t=i/N,y=t*12,angle=t*Math.PI*2.1+k*Math.PI*2/3,rad=Math.sin(t*Math.PI)*2.5+.25;for(let j=0;j<=M;j++){const v=j/M-.5,w=Math.sin(t*Math.PI)*1.3+.05;vertices.push(Math.cos(angle)*rad+Math.cos(angle+.7)*v*w,y+v*.6,Math.sin(angle)*rad+Math.sin(angle+.7)*v*w)}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){if(i>12&&i<126&&Math.sin(i*.16+k)>0.45&&j>2&&j<6)continue;const a=i*(M+1)+j,b=a+M+1;indices.push(a,b,a+1,b,b+1,a+1)}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,k===1?sculptureGlow:ivory,0,0,0,sculpture);const pts=[];for(let i=0;i<=100;i++){const t=i/100,a=t*Math.PI*2.1+k*Math.PI*2/3,r=Math.sin(t*Math.PI)*2.5+.25;pts.push([Math.cos(a)*r,t*12,Math.sin(a)*r])}curve(pts,.065,ivory,sculpture)}pipe([0,14,-1],[0,30.35,-1],.025,metal);cylinder(.35,.5,.5,0,.65,-1,brass);const glowLight=new T.PointLight('#56dcc1',15,10);glowLight.position.set(0,4,-1);scene.add(glowLight);
// Fabric banners, procedural ink marks and hanging brass poles.
function inkTexture(type){return texture((c,s)=>{c.fillStyle='#cabd9e';c.fillRect(0,0,s,s);for(let i=0;i<12000;i++){c.fillStyle=rand()>.5?'#483c2014':'#fff8d812';c.fillRect(rand()*s,rand()*s,1,8)}c.strokeStyle='#273b35';c.lineCap='round';for(let k=0;k<14;k++){c.lineWidth=1+rand()*5;c.beginPath();for(let i=0;i<70;i++){const t=i/69,a=t*Math.PI*(3+type)+k*.12,x=s/2+Math.sin(a)*(50+t*100),y=50+t*(s-100);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}c.fillStyle='#2c7060';c.font='22px Arial';c.textAlign='center';c.fillText('N / S',s/2,s-20)},512)}
const banners=[];for(const side of [-1,1]){const mat=new T.MeshStandardMaterial({map:inkTexture(side===1?2:1),roughness:1,side:T.DoubleSide});const b=mesh(new T.PlaneGeometry(2.6,7,12,28),mat,side*9.2,11.5,-5);b.rotation.y=side*.12;banners.push(b);pipe([side*9.2-1.6,15.1,-5],[side*9.2+1.6,15.1,-5],.06,brass);pipe([side*9.2,15.1,-5],[side*9.2,22,-5],.018,metal)}
// Original placeholder guide and cat, made from 3D volumes, not a billboard.
const fabricTex=texture((c,s)=>{c.fillStyle='#a68f68';c.fillRect(0,0,s,s);for(let i=0;i<s;i+=8){c.strokeStyle='#4b3f2860';c.lineWidth=2;c.beginPath();c.moveTo(i,0);c.lineTo(i,s);c.stroke();c.beginPath();c.moveTo(0,i);c.lineTo(s,i);c.stroke()}},128);fabricTex.wrapS=fabricTex.wrapT=T.RepeatWrapping;fabricTex.repeat.set(3,3);const cloth=new T.MeshStandardMaterial({map:fabricTex,roughness:1,color:'#c7b897'}),eye=new T.MeshStandardMaterial({color:'#141d18',roughness:.25});
const guide=new T.Group();guide.position.set(2.7,.95,12.8);guide.rotation.y=-.2;scene.add(guide);function ball(x,y,z,rx,ry,rz,mat,parent){const m=mesh(new T.SphereGeometry(1,24,16),mat,x,y,z,parent);m.scale.set(rx,ry,rz);return m}ball(0,1,0,.39,.54,.28,cloth,guide);ball(0,1.85,0,.61,.56,.46,cloth,guide);for(const s of [-1,1]){ball(s*.2,.46,.12,.18,.38,.2,cloth,guide);ball(s*.48,1.05,0,.14,.4,.14,cloth,guide).rotation.z=s*.18;ball(s*.23,1.95,.4,.07,.07,.04,eye,guide)}curve([[-.21,1.65,.42],[0,1.58,.46],[.21,1.65,.42]],.014,eye,guide);box(.25,.4,.12,0,1.05,.27,brass,guide);const cat=new T.Group();cat.position.set(3.7,.95,12.8);cat.rotation.y=-.2;scene.add(cat);ball(0,.48,0,.28,.45,.23,eye,cat);ball(0,.97,0,.27,.25,.23,eye,cat);for(const side of [-1,1]){mesh(new T.ConeGeometry(.12,.28,3),eye,side*.17,1.22,0,cat);ball(side*.1,1,.21,.025,.035,.02,mint,cat)}curve([[.15,.35,0],[.65,.18,.04],[.8,.35,.1],[.7,.55,.15]],.04,eye,cat);
// Each gallery contains physical exhibits. These are clearly labelled concept studies.
function abstractArt(style){return texture((c,s)=>{c.fillStyle=['#e6dbc1','#152f30','#ceab78','#192531'][style];c.fillRect(0,0,s,s);c.lineCap='round';for(let j=0;j<30;j++){c.strokeStyle=['#243a31','#67b9a2','#753c28','#9ba8ca'][style];c.globalAlpha=.2+rand()*.6;c.lineWidth=1+rand()*(style===0?4:24);c.beginPath();for(let i=0;i<=60;i++){const t=i/60,a=t*8+j*.1,x=s/2+Math.sin(a)*(20+j*7),y=30+t*(s-60);i?c.lineTo(x,y):c.moveTo(x,y)}c.stroke()}c.globalAlpha=1;c.font='14px Arial';c.fillStyle='#b0b9a0';c.fillText('N/S — STUDIU VIZUAL',25,s-25)},512)}
const galleryObjects=[];zoneData.forEach((zone,i)=>{const artStart=scene.children.length;const artMat=new T.MeshStandardMaterial({map:abstractArt(i),roughness:.85});if(i===3){for(let n=0;n<3;n++){const x=zone.x+(n-1)*2;cylinder(.65,.75,1.1,x,.5,-21,stone);const o=mesh(n===0?new T.TorusKnotGeometry(.55,.15,100,12,2,3):n===1?new T.IcosahedronGeometry(.7,0):new T.OctahedronGeometry(.8),n===1?sculptureGlow:ivory,x,2,-21);galleryObjects.push(o)}}else{for(let n=0;n<3;n++){const x=zone.x+(n-1)*2.2;box(1.9,3.1,.18,x,3,-25.55,brass);mesh(new T.PlaneGeometry(1.72,2.92),artMat,x,3,-25.43);const spot=new T.SpotLight('#ffdb9f',16,8,Math.PI/6,.6,1);spot.position.set(x,6,-22);spot.target.position.set(x,3,-25.5);scene.add(spot,spot.target)}for(const side of [-1,1]){const p=mesh(new T.PlaneGeometry(3,3.6),artMat,zone.x+side*3.55,3,-21);p.rotation.y=-side*Math.PI/2}}textPlane('CONCEPT STUDIES',zone.x,1,-25.7,5,17,'#91bca8');attachRoom(i,scene.children.slice(artStart));});
const details=addAtelierDetail({T,scene,mesh,box,cylinder,pipe,curve,textPlane,texture,stone,paleStone,darkStone,metal,brass,mint,sculpture,ivory,sculptureGlow,waterMat,attachSkin:children=>attachRoom(0,children)});
roomRoots.forEach((root,i)=>{root.position.set(zoneData[i].worldX,0,zoneData[i].worldZ);root.rotation.y=-zoneData[i].theta;});
const lowerParts=addLowerArcadeDetails({T,scene,roots:roomRoots,stone,paleStone,metal,brass});
const surfaceFinish=finishSurfaces({T,scene,stone,paleStone,darkStone,metal,brass,waterMat,roots:roomRoots});
// The dark alcove immediately to the left of SKIN in the reference view.
const graffitiAlcove=scene.children.find(o=>o.name==='alcove-bay'&&o.position.x< -16&&o.position.z>0);
const graffiti=graffitiAlcove?createGraffitiArtist({alcove:graffitiAlcove,scene,reducedMotion:reduced}):null;
// The route is a user-drawn 268-point plan from the conceptual floor map.
// Reproject through A* to the ACTUAL walkable NINJA.SYS floor: pool, void and wall colliders are excluded.
let artistRoute=null;
if(graffiti&&!reduced){
 fetch('./data/parter.json').then(r=>{if(!r.ok)throw Error('Parter route HTTP '+r.status);return r.json()})
 .then(data=>{
   artistRoute=createArtistRoute({scene,data,canWalk:walkAllowed,floorHeight:levels.floorHeight,showDebug:new URLSearchParams(window.location.search).has('artistRoute')});
   console.info('Artist graffiti: traseu recalculat din planul conceptual pentru arhitectura NINJA.SYS',artistRoute.stats);
 }).catch(e=>console.error('Traseul artistului nu este disponibil:',e));
}
scene.updateMatrixWorld(true);
// Dust suspended in the light.
const dustGeo=new T.BufferGeometry(),dustPositions=[];for(let i=0;i<600;i++)dustPositions.push((rand()-.5)*38,rand()*22,(rand()-.5)*38);dustGeo.setAttribute('position',new T.Float32BufferAttribute(dustPositions,3));const dust=new T.Points(dustGeo,new T.PointsMaterial({color:'#ffe5b2',size:.025,transparent:true,opacity:.4,depthWrite:false}));scene.add(dust);
// Camera navigation: click-to-travel, drag-to-look, keyboard and touch movement.
let lastWalkZone=null,travel=null,touring=false,tourTime=0,low=false,drag=null,moved=false;const keys=new Set(),touchKeys=new Set();const location=$('#location');
function hideIntro(){$('#welcome').classList.add('leaving');$('#crosshair').hidden=false;}
function setLook(target){const d=target.clone().sub(camera.position);yaw=Math.atan2(-d.x,-d.z);pitch=Math.atan2(d.y,Math.hypot(d.x,d.z));}
function routeTo(pos){
 const from=camera.position.clone(),to=new T.Vector3(...pos),points=[from];
 if(camera.position.y<1.2&&levels.floorHeight(from.x,from.z)<0){points.push(new T.Vector3(-7.9,-2.35,6.35));for(let i=0;i<=18;i++){const z=6.35+(12.45-6.35)*i/18;points.push(new T.Vector3(-7.9,levels.floorHeight(-7.9,z)+1.85,z));}points.push(new T.Vector3(-7.9,1.85,13.25));}
 const currentRoom=zoneData.find(z=>{const p=roomLocal(z,from.x,from.z);return Math.abs(p.x)<3.5&&p.z<0&&p.z> -13;});
 if(currentRoom)points.push(zonePoint(currentRoom,0,1.85,3));
 const routeRadius=frontLayout?9:17;
 const last=points.at(-1),startAngle=Math.atan2(last.x,last.z-ROTUNDA_CENTER_Z),endAngle=Math.atan2(to.x,to.z-ROTUNDA_CENTER_Z),delta=T.MathUtils.euclideanModulo(endAngle-startAngle+Math.PI,Math.PI*2)-Math.PI;
 points.push(new T.Vector3(Math.sin(startAngle)*routeRadius,1.85,Math.cos(startAngle)*routeRadius+ROTUNDA_CENTER_Z));
 const count=Math.ceil(Math.abs(delta)/.2);for(let i=1;i<=count;i++){const a=startAngle+delta*i/count;points.push(new T.Vector3(Math.sin(a)*routeRadius,1.85,Math.cos(a)*routeRadius+ROTUNDA_CENTER_Z));}
 const targetRoom=zoneData.find(z=>{const p=roomLocal(z,to.x,to.z);return Math.abs(p.x)<3.5&&p.z<0&&p.z> -13;});
 if(targetRoom)points.push(zonePoint(targetRoom,0,1.85,3));points.push(to);
 const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+points[i].distanceTo(points[i-1]));return {points,lengths,total:lengths.at(-1)};
}

function go(pos,look,after){hideIntro();touring=false;$('#tour').setAttribute('aria-pressed','false');const route=routeTo(pos);travel={route,from:camera.position.clone(),to:new T.Vector3(...pos),start:performance.now(),duration:reduced?0:Math.max(1800,route.total*95),look:new T.Vector3(...look),fromYaw:yaw,fromPitch:pitch,after};keys.clear();touchKeys.clear();}
// Choose a walkable viewpoint with a direct line to the real sun. Transparent
// glazing stays visible but does not count as an opaque obstruction.
$('#sunView').addEventListener('click',()=>{
 const direction=sun.position.clone().sub(sun.target.position).normalize();
 const hint=$('#sunHint');
 if(direction.y<=0){hint.textContent='La ora aleasă, soarele este sub orizont. Alege o oră de zi.';return;}
 scene.updateMatrixWorld(true);
 const candidates=[[-6.5,-4],[6.5,-4],[-6.5,2],[6.5,2],[0,-8],[-8,-1],[8,-1]];
 const ray=new T.Raycaster();
 let viewpoint=null;
 for(const [x,z] of candidates){
   if(!walkAllowed(x,z,0))continue;
   const point=new T.Vector3(x,levels.floorHeight(x,z)+1.85,z);
   ray.set(point,direction);ray.near=.05;ray.far=90;
   const blocked=ray.intersectObjects(scene.children,true).some(hit=>{
     const o=hit.object;if(!o.isMesh||o===visibleSky.mesh||!o.visible)return false;
     const materials=Array.isArray(o.material)?o.material:[o.material];
     return materials.some(m=>m&&m.visible!==false&&!(m.transparent&&m.opacity<.9));
   });
   if(!blocked){viewpoint=point;break;}
 }
 if(!viewpoint){hint.textContent='Din locurile accesibile verificate, clădirea ascunde soarele la ora aceasta. Încearcă o zi de vară la 13:20.';return;}
 const look=viewpoint.clone().addScaledVector(direction,40);
 hint.textContent='Am orientat privirea spre poziția soarelui pentru ora aleasă.';
 $('#zoneInfo').hidden=true;go(viewpoint.toArray(),look.toArray());
});
// Navigate to the walkable side of the alcove and face the artist directly.
function findGraffitiArtist(){
 if(!graffitiAlcove)return;
 graffitiAlcove.updateWorldMatrix(true,false);
 const moving=graffiti?.getPosition();
 const from=moving?new T.Vector3(moving.x+2.2,moving.y+1.85,moving.z+3.5):graffitiAlcove.localToWorld(new T.Vector3(0,1.85,3.7));
 const look=moving?new T.Vector3(moving.x,moving.y+1.2,moving.z):graffitiAlcove.localToWorld(new T.Vector3(0,1.45,-1.49));
 $('#zoneInfo').hidden=true;$('#map').hidden=true;$('#mapToggle').setAttribute('aria-expanded','false');
 go(from.toArray(),look.toArray(),()=>{location.textContent='ATRIUM / ARTIST GRAFFITI';});
}
$('#findArtist').addEventListener('click',findGraffitiArtist);
function openStudy(index){const study=details.studies[index];$('#studyImage').src=study.image;$('#studyTitle').textContent=study.title;$('#studyText').textContent=study.description;$('#studyDialog').showModal();keys.clear();touchKeys.clear();}
$('#studyClose').onclick=()=>$('#studyDialog').close();document.querySelectorAll('[data-study]').forEach(b=>b.onclick=()=>openStudy(Number(b.dataset.study)));
$('#studyDialog').addEventListener('close',()=>canvas.focus());
function showZone(z){lastWalkZone=z.id;$('#skinActions').hidden=z.id!=='skin';$('#zoneNumber').textContent=z.index;$('#zoneTitle').textContent=z.name;$('#zoneText').textContent=z.text;$('#zoneInfo').hidden=false;location.textContent=`${z.name} / GALERIE`;document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.zone===z.id));}
function visit(id){const z=zoneData.find(z=>z.id===id);$('#map').hidden=true;$('#mapToggle').setAttribute('aria-expanded','false');$('#zoneInfo').hidden=true;go(zonePoint(z,0,1.85,-4.5).toArray(),zonePoint(z,0,3,-12).toArray(),()=>showZone(z));}
document.querySelectorAll('[data-zone]').forEach(b=>b.onclick=()=>visit(b.dataset.zone));$('#enter').onclick=()=>{go([8.8,1.85,7.8],[0,5,-5]);canvas.focus()};function reset(){ $('#zoneInfo').hidden=true;document.querySelectorAll('nav button').forEach(b=>b.classList.remove('active'));location.textContent='ATRIUM / INTRARE';go([0,3.8,15.8],[0,5.2,-8]);}$('#home').onclick=e=>{e.preventDefault();reset()};$('#reset').onclick=()=>{reset();$('#map').hidden=true;$('#mapToggle').setAttribute('aria-expanded','false')};$('#zoneClose').onclick=()=>$('#zoneInfo').hidden=true;$('#mapToggle').onclick=()=>{const m=$('#map');m.hidden=!m.hidden;$('#mapToggle').setAttribute('aria-expanded',String(!m.hidden))};$('#mapClose').onclick=()=>{$('#map').hidden=true;$('#mapToggle').setAttribute('aria-expanded','false')};$('#tour').onclick=()=>{hideIntro();travel=null;touring=!touring;tourTime=0;$('#tour').setAttribute('aria-pressed',String(touring));$('#zoneInfo').hidden=true;};$('#quality').onclick=()=>{low=!low;renderer.setPixelRatio(low?1:Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=!low;dust.visible=!low;$('#quality').textContent=low?'Calitate: economică':'Calitate: ridicată';$('#quality').setAttribute('aria-pressed',String(low))};
const movementKeys=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];window.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if($('#studyDialog').open||e.target.closest('input,button,a,select,textarea'))return;if(movementKeys.includes(k)){e.preventDefault();keys.add(k);hideIntro();travel=null;touring=false;$('#tour').setAttribute('aria-pressed','false')}if(k==='escape'){travel=null;keys.clear();touchKeys.clear();$('#zoneInfo').hidden=true;$('#map').hidden=true;$('#mapToggle').setAttribute('aria-expanded','false')}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();touchKeys.clear();drag=null});
canvas.addEventListener('pointerdown',e=>{canvas.focus();drag={x:e.clientX,y:e.clientY,id:e.pointerId};moved=false;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>2)moved=true;if(moved){travel=null;touring=false;$('#tour').setAttribute('aria-pressed','false');yaw-=dx*.004;pitch=T.MathUtils.clamp(pitch-dy*.003,-1.1,1.1);}drag.x=e.clientX;drag.y=e.clientY});const ray=new T.Raycaster(),mouse=new T.Vector2();canvas.addEventListener('pointerup',e=>{if(drag&&!moved){mouse.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([...clickable,...details.selectable,...(graffiti?.selectable||[])],true)[0];if(hit){if(graffiti?.ownsObject(hit.object))graffiti.turn();else if(hit.object.userData.study!==undefined)openStudy(hit.object.userData.study);else if(hit.object.userData.zone)visit(hit.object.userData.zone)}}drag=null});canvas.addEventListener('pointercancel',()=>drag=null);
document.querySelectorAll('[data-move]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();hideIntro();travel=null;touring=false;$('#tour').setAttribute('aria-pressed','false');touchKeys.add(b.dataset.move);b.setPointerCapture(e.pointerId)});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>touchKeys.delete(b.dataset.move));});
function walkAllowed(x,z,ground=0){
 if(!levels.canWalk(x,z,ground))return false;
 if(Math.hypot(x,z-ROTUNDA_CENTER_Z)<5.5)return false;
 for(const b of lowerParts.colliders){const p=roomLocal(zoneData[b.index],x,z);if(p.x>b.minX&&p.x<b.maxX&&p.z>b.minZ&&p.z<b.maxZ)return false;}
 const skin=roomLocal(zoneData[0],x,z),oldX=skin.x+zoneData[0].originalX,oldZ=skin.z-13;
 if(details.colliders.some(b=>oldX>b.minX&&oldX<b.maxX&&oldZ>b.minZ&&oldZ<b.maxZ))return false;
 for(const room of zoneData){const p=roomLocal(room,x,z);if(Math.abs(p.x)<2.7&&p.z<=1&&p.z> -11.7)return true;}
 if(Math.abs(x)<3.5&&z>16&&z<21)return true;
 return Math.hypot(x,z-ROTUNDA_CENTER_Z)<ROTUNDA_RADIUS-1;
}

let last=performance.now(),clock=0;function animate(now){const dt=Math.min((now-last)/1000,.04);last=now;clock+=dt;
if(travel){const t=travel.duration?Math.min((now-travel.start)/travel.duration,1):1,u=t*t*(3-2*t);const dist=u*travel.route.total;let segment=1;while(segment<travel.route.lengths.length-1&&travel.route.lengths[segment]<dist)segment++;const prev=travel.route.lengths[segment-1],span=travel.route.lengths[segment]-prev;camera.position.lerpVectors(travel.route.points[segment-1],travel.route.points[segment],span?(dist-prev)/span:1);const d=travel.look.clone().sub(travel.to),ty=Math.atan2(-d.x,-d.z),tp=Math.atan2(d.y,Math.hypot(d.x,d.z));let diff=T.MathUtils.euclideanModulo(ty-travel.fromYaw+Math.PI,Math.PI*2)-Math.PI;yaw=travel.fromYaw+diff*u;pitch=T.MathUtils.lerp(travel.fromPitch,tp,u);if(t===1){const cb=travel.after;travel=null;cb?.()}}
else if(touring){tourTime+=dt;const a=frontLayout?Math.sin(tourTime*.12)*1.15:tourTime*.12;camera.position.set(Math.sin(a)*17,3.3+Math.sin(a*.7)*.6,Math.cos(a)*17-1);setLook(new T.Vector3(0,6,-1));location.textContent='ATRIUM / TUR';}
else if(!$('#studyDialog').open){const forward=Number(keys.has('w')||keys.has('arrowup')||touchKeys.has('forward'))-Number(keys.has('s')||keys.has('arrowdown')||touchKeys.has('back'));const side=Number(keys.has('d')||keys.has('arrowright')||touchKeys.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||touchKeys.has('left'));if(forward||side){const len=Math.hypot(forward,side),speed=dt*4.5/len,dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*speed,dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*speed;if(walkAllowed(camera.position.x+dx,camera.position.z,Math.min(0,camera.position.y-1.85)))camera.position.x+=dx;if(walkAllowed(camera.position.x,camera.position.z+dz,Math.min(0,camera.position.y-1.85)))camera.position.z+=dz;camera.position.y=T.MathUtils.lerp(camera.position.y,levels.floorHeight(camera.position.x,camera.position.z)+1.85,.45);const z=zoneData.find(z=>{const p=roomLocal(z,camera.position.x,camera.position.z);return Math.abs(p.x)<3&&p.z< -2;});location.textContent=z?`${z.name} / GALERIE`:camera.position.y<0?'NIVEL INFERIOR / EXPLORARE':'ATRIUM / EXPLORARE';if(z&&lastWalkZone!==z.id)showZone(z);if(!z)lastWalkZone=null;}}
camera.rotation.set(pitch,yaw,0);if(!reduced){surfaceFinish.update(clock);details.update(clock);sculpture.rotation.y=Math.sin(clock*.1)*.16;sculpture.position.y=1.5+Math.sin(clock*.6)*.12;galleryObjects.forEach((m,i)=>{m.rotation.y=clock*(.12+i*.05);m.rotation.x=Math.sin(clock*.3)*.15});ripples.forEach((m,i)=>{const t=((clock*.08+i/7)%1);m.scale.setScalar(.4+t*4.2);m.material.opacity=(1-t)*.15});banners.forEach((b,k)=>{const p=b.geometry.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);p.setZ(i,Math.sin(y*.8+clock*.65+k)*.07*(3.5-y)/7)}p.needsUpdate=true;b.geometry.computeVertexNormals()});dust.rotation.y=clock*.008;guide.rotation.y=-.2+Math.sin(clock*.4)*.05;}
if(frontLayout)camera.position.y=Math.max(camera.position.y,levels.floorHeight(camera.position.x,camera.position.z)+1.65);
if(artistRoute&&graffiti?.hasModel()&&!reduced){
 const pose=artistRoute.update(dt,1.05);graffiti.setWalkPose(pose.position,pose.heading);
}
graffiti?.update(dt);
$('#mapDot').setAttribute('cx',String(160+camera.position.x*4.5));$('#mapDot').setAttribute('cy',String(145+(camera.position.z-ROTUNDA_CENTER_Z)*4.5));visibleSky.follow(camera);renderer.render(scene,camera);requestAnimationFrame(animate)}
// Optional read-only runtime diagnostics: append ?diagnostic=1 to the URL.
if(new URLSearchParams(window.location.search).get('diagnostic')==='1'){
 const audit=document.createElement('output');audit.id='scene-diagnostic';
 audit.style.cssText='position:fixed;z-index:9999;bottom:12px;left:12px;max-width:calc(100vw - 24px);padding:12px 14px;border:1px solid #8addc1;background:#071516eE;color:#c9f6e8;font:12px/1.55 monospace;white-space:pre-wrap;pointer-events:none;border-radius:8px';
 document.body.appendChild(audit);
 let assetStatus='verificare...';const faults=[];
 window.addEventListener('error',ev=>{if(faults.length<3)faults.push((ev.message||'error').slice(0,140))});
 window.addEventListener('unhandledrejection',ev=>{if(faults.length<3)faults.push(String(ev.reason).slice(0,140))});
 Promise.all(['assets/marmura-albedo.png','assets/pardoseala-albedo.png','assets/paul-upper-segment-v1.glb','characters/graffiti-artist.glb'].map(url=>
   fetch(url,{method:'HEAD',cache:'no-store'}).then(r=>r.ok).catch(()=>false)
 )).then(items=>{assetStatus=items.filter(Boolean).length+'/4 fișiere accesibile'});
 const writeAudit=()=>{
  let meshes=0,visible=0,lit=0;
  scene.traverse(o=>{if(o.isMesh){meshes++;if(o.visible)visible++;const mats=Array.isArray(o.material)?o.material:[o.material];if(mats.some(m=>m&&m.isMeshStandardMaterial))lit++}});
  const gl=renderer.getContext(),lost=gl.isContextLost?.()||false;
  audit.textContent='NINJA.SYS / DIAGNOSTIC\n'+
   'Mod solar: '+($('#sunMode')?.textContent||'necunoscut')+'\n'+
   'Mesh-uri: '+meshes+' (vizibile '+visible+', cu material iluminat '+lit+')\n'+
   'Desenări GPU: '+renderer.info.render.calls+', triunghiuri: '+renderer.info.render.triangles+'\n'+
   'Texturi GPU: '+renderer.info.memory.textures+'; context pierdut: '+lost+'\n'+
   'Resurse: '+assetStatus+
   (faults.length?'\nERORI: '+faults.join('; '):'');
 };
 setInterval(writeAudit,1800);setTimeout(writeAudit,800);
}
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});if(new URLSearchParams(window.location.search).get('artist')==='1')requestAnimationFrame(findGraffitiArtist);renderer.render(scene,camera);$('#loader').style.opacity='0';setTimeout(()=>$('#loader').remove(),650);requestAnimationFrame(animate);
