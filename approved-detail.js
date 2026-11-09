import {addDome} from './dome.js';
import {addUpperWinch} from './upper-details.js';
import {addLowerArcadeDetails} from './lower-arcades.js';
import {addAtelierEnvironment} from './atelier-detail.js';
import * as T from './vendor/three.module.js';
import {makeSurfaceMaps} from './surface-finish.js';
import {useWeatheredMarble} from './marble-material.js';
export function detailApprovedFrame({scene,model,bays,materials,software=false}){
 const originals=[];model.traverse(o=>{if(o.isMesh)originals.push({o,material:o.material});});
 const textures={};for(const kind of ['stone','marble','metal']){textures[kind]={};for(const [channel,c] of Object.entries(makeSurfaceMaps(kind))){const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.colorSpace=channel==='color'?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;textures[kind][channel]=t;}}
 function pbr(kind,color,roughness,metalness=0){const t=textures[kind];return new T.MeshStandardMaterial({color,map:t?.color,roughnessMap:t?.roughness,bumpMap:t?.height,bumpScale:kind==='marble'?.018:kind==='stone'?.035:.012,roughness,metalness,side:T.DoubleSide});}
 // One marble family is reused by all architectural bays and their trim.
 const stone=pbr('marble','#e8decd',.88),trim=pbr('marble','#f3e8d8',.84),dark=pbr('marble','#82918a',.96),floorStone=pbr('stone','#e2d1b3',1),iron=pbr('metal','#a3aaa1',.95,.3),brass=pbr('metal','#e2b576',.8,.5),ivory=new T.MeshStandardMaterial({color:'#dbd0b8',roughness:.36,metalness:.15,side:T.DoubleSide}),cyan=new T.MeshBasicMaterial({color:'#46d7c2'}),amber=new T.MeshBasicMaterial({color:'#ffcc80'});
 [stone,trim,dark].forEach(useWeatheredMarble);
 const water=new T.MeshPhysicalMaterial({color:'#245e57',roughness:.18,metalness:.1,clearcoat:1,clearcoatRoughness:.12,ior:1.333});
 function canvasTexture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;}
 if(!software)addAtelierEnvironment({T,scene,texture:canvasTexture});
 const waterTex=canvasTexture((c,n)=>{c.fillStyle='#27584f';c.fillRect(0,0,n,n);for(let j=0;j<100;j++){const y=j*n/100;c.strokeStyle=j%3?'#68b7a036':'#dfbd8738';c.lineWidth=1+j%3;c.beginPath();for(let x=0;x<=n;x+=8){const yy=y+Math.sin(x*.035+j)*2;x?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();}});waterTex.wrapS=waterTex.wrapT=T.RepeatWrapping;water.map=waterTex;water.bumpMap=waterTex;water.bumpScale=.012;
 const replacement=new Map([[materials.wall,stone],[materials.edge,trim],[materials.dark,dark],[materials.iron,iron],[materials.waterMat,water],[materials.ivory,ivory]]);
 // Per-face planar UVs prevent shared curved normals from tearing texture mapping.
 for(const {o,material} of originals){if(!replacement.has(material))continue;const isFloor=material===materials.wall&&o.geometry.type==='ExtrudeGeometry'&&Math.abs(o.rotation.x+Math.PI/2)<.001;o.material=isFloor?floorStone:replacement.get(material);if(material===materials.waterMat)continue;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone(),p=geo.attributes.position,uv=new Float32Array(p.count*2),a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);const n=b.clone().sub(a).cross(c.clone().sub(a));const axis=Math.abs(n.y)>Math.abs(n.x)&&Math.abs(n.y)>Math.abs(n.z)?'y':Math.abs(n.x)>Math.abs(n.z)?'x':'z';for(let k=0;k<3;k++){const x=p.getX(i+k),y=p.getY(i+k),z=p.getZ(i+k);uv[(i+k)*2]=(axis==='x'?z:x)*.7;uv[(i+k)*2+1]=(axis==='y'?z:y)*.7;}}geo.setAttribute('uv',new T.BufferAttribute(uv,2));o.geometry=geo;o.castShadow=o.receiveShadow=true;}
 const details=new T.Group();details.name='approved-geometry-details';model.add(details);
 function mesh(g,m,x=0,y=0,z=0,p=details){const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;p.add(o);return o;}
 function box(w,h,d,x,y,z,m=iron,p=details){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);}
 function pipe(a,b,r=.04,m=iron,p=details){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),m,0,0,0,p);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
 function lamp(x,y,z,parent){const g=new T.Group();g.position.set(x,y,z);parent.add(g);mesh(new T.CylinderGeometry(.11,.12,.35,12),amber,0,0,0,g);for(const yy of [-.22,.22])mesh(new T.CylinderGeometry(.19,.19,.065,12),brass,0,yy,0,g);for(let j=0;j<4;j++){const a=j*Math.PI/2;pipe([Math.cos(a)*.15,-.23,Math.sin(a)*.15],[Math.cos(a)*.15,.23,Math.sin(a)*.15],.015,iron,g);}const light=new T.PointLight('#ffc17e',7,5,2);light.position.z=.2;g.add(light);}
 const roof=new T.Group();
 roof.position.y=-4.5;
 details.add(roof);
 addDome({T,roof,mesh,box,pipe,metal:iron,brass,paleStone:trim,simple:software});
 const galleryRoots=[0,1,3,4].map(index=>{
   const [x,z,,,angle]=bays[index];
   const root=new T.Group();
   root.position.set(x,0,z);
   root.rotation.y=angle;
   details.add(root);
   return root;
 });
 addLowerArcadeDetails({T,scene:details,roots:galleryRoots,stone,paleStone:trim,metal:iron,brass,entranceDetails:false});
 const motion=galleryRoots[3],machine=new T.Group();
 machine.position.set(1.2,bays[4][3]+1.25,-.25);
 machine.scale.setScalar(.66);
 motion.add(machine);
 addUpperWinch({T,machine,mesh,box,pipe,metal:iron,brass,paleStone:trim});
 const names=['SKIN','CANVAS',null,'SPACE','MOTION'];
 for(const [i,b] of bays.entries()){const [x,z,w,h,angle]=b,g=new T.Group();g.position.set(x,0,z);g.rotation.y=angle;details.add(g);g.name='detail-bay-'+i;
  for(const side of [-1,1]){const px=side*(w/2+.6);for(const offset of [-.12,.12]){pipe([px+offset,.2,.58],[px+offset,h+1,.58],.055,iron,g);for(const yy of [.5,2.5,5,h+.7]){mesh(new T.CylinderGeometry(.085,.085,.15,8),brass,px+offset,yy,.58,g);}}for(const yy of [.5,2.5,5,h+.7]){box(.52,.19,.1,px,yy,.66,brass,g);for(const dx of [-.18,.18]){const bolt=mesh(new T.CylinderGeometry(.032,.032,.05,6),iron,px+dx,yy,.74,g);bolt.rotation.x=Math.PI/2;}}box(.55,.5,.65,px,.25,.65,trim,g);lamp(px,1.05,.75,g);pipe([px,.2,-.7],[px,2.5,-.7],.025,cyan,g);const up=new T.PointLight('#37cdb6',10,8,2);up.position.set(px,.4,-1);g.add(up);}
  if(names[i]){const tex=canvasTexture((c,s)=>{c.clearRect(0,0,s,s);c.textAlign='center';c.fillStyle='#f4e7c9';c.font='500 66px Arial';c.fillText(names[i],s/2,s*.52);c.fillStyle='#5be1c9';c.font='23px Arial';c.fillText(['TATTOO / BODY','PAINTING',null,'MURALS / SPACE','3D / DIGITAL'][i],s/2,s*.62);});mesh(new T.PlaneGeometry(w*.85,w*.85),new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:T.DoubleSide}),0,3.55,.5,g);}
  if(i===0){const crown=canvasTexture((c,s)=>{c.clearRect(0,0,s,s);c.strokeStyle='#bd315c';c.globalAlpha=.78;c.lineWidth=s*.045;c.lineJoin='round';c.lineCap='round';c.beginPath();c.moveTo(s*.16,s*.75);c.lineTo(s*.25,s*.23);c.lineTo(s*.45,s*.53);c.lineTo(s*.59,s*.14);c.lineTo(s*.7,s*.50);c.lineTo(s*.86,s*.31);c.lineTo(s*.81,s*.75);c.closePath();c.stroke();for(const x of [.36,.51,.68]){c.beginPath();c.arc(s*x,s*.68,s*.018,0,Math.PI*2);c.fillStyle='#bd315c';c.fill();}},512);mesh(new T.PlaneGeometry(1.05,.8),new T.MeshBasicMaterial({map:crown,transparent:true,depthWrite:false,side:T.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1}),-2.1,h-.38,.415,g);}
  // Recessed arched upper glazing: never fills the central ground-floor passage.
  const r=(w+1.3)/2,spring=10.3-r,shape=new T.Shape();shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,spring);shape.absarc(0,spring,r,0,Math.PI,false);shape.closePath();mesh(new T.ShapeGeometry(shape,32),new T.MeshStandardMaterial({color:'#bad1d4',transparent:true,opacity:.16,roughness:.35,side:T.DoubleSide,depthWrite:false}),0,h+1.3,-3.65,g);
 }
 // Woven hanging banners, with intentionally demonstrative ink studies.
 const linen=canvasTexture((c,s)=>{c.fillStyle='#cfc1a0';c.fillRect(0,0,s,s);for(let x=0;x<s;x+=4){c.fillStyle=x%8?'#f4ead525':'#64594325';c.fillRect(x,0,1,s);c.fillRect(0,x,s,1);}c.strokeStyle='#283e35';for(let j=0;j<7;j++){c.lineWidth=1+(j%3);c.beginPath();for(let k=0;k<100;k++){const t=k/99,x=s/2+Math.sin(t*8+j*.16)*(.08+t*.12)*s,y=s*(.1+t*.8);k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}});
 const linenMat=new T.MeshStandardMaterial({map:linen,roughness:1,bumpMap:linen,bumpScale:.005,side:T.DoubleSide});for(const {o,material} of originals){if(!replacement.has(material)&&o.geometry.type==='PlaneGeometry')o.material=linenMat;}
 // Rose frame on the right and small bronze fasteners at railing supports.
 const rose=new T.Group();rose.position.set(12.5,13,-9.7);rose.rotation.y=-.75;details.add(rose);for(const r of [.5,1.7,2.8])mesh(new T.TorusGeometry(r,.045,6,64),brass,0,0,0,rose);for(let j=0;j<12;j++){const a=j*Math.PI/6;pipe([Math.cos(a)*.5,Math.sin(a)*.5,0],[Math.cos(a)*2.8,Math.sin(a)*2.8,0],.027,iron,rose);}
 scene.background.set('#5c7478');const baseLights=scene.children.filter(o=>o.isLight).map(light=>({light,intensity:light.intensity}));baseLights.forEach(({light,intensity})=>light.intensity=intensity*.65);const sun=new T.DirectionalLight('#ffd59b',2.1);sun.position.set(14,22,-6);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,near:1,far:65});sun.shadow.normalBias=.04;details.add(sun);details.add(new T.HemisphereLight('#b8d9e2','#5a4934',.65));
 const finished=originals.map(({o,material})=>({o,clay:material,detail:o.material}));let enabled=true;
 return {setEnabled(value){enabled=value;details.visible=value;baseLights.forEach(({light,intensity})=>light.intensity=intensity*(value?.65:1));scene.environmentIntensity=value?.55:0;finished.forEach(v=>v.o.material=value?v.detail:v.clay);scene.background.set(value?'#5c7478':'#b9c8c8');},update(t){if(enabled&&!software){waterTex.offset.x=t*.003;waterTex.offset.y=t*.001;}},stats:{bays:5,assignedGalleries:4,openPassages:1,lanterns:10}};
}
