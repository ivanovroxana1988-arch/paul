import {FIVE_ARCADES} from './arcade-layout.js';
import * as T from './vendor/three.module.js';
// Fixed-camera composition study. Explicit geometry; no generated image backdrop.
export function makeFrame(){
const scene=new T.Scene();scene.background=new T.Color('#b9c8c8');const model=new T.Group();scene.add(model);
const wall=new T.MeshLambertMaterial({color:'#b5b0a1',side:T.DoubleSide}),edge=new T.MeshLambertMaterial({color:'#d3c8af'}),dark=new T.MeshLambertMaterial({color:'#666e69'}),iron=new T.MeshLambertMaterial({color:'#525c58'}),waterMat=new T.MeshLambertMaterial({color:'#497d77'}),ivory=new T.MeshLambertMaterial({color:'#e0d3b6',side:T.DoubleSide});
function mesh(g,m,x=0,y=0,z=0,parent=model){const o=new T.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o;}
function box(w,h,d,x,y,z,m=wall,p=model){return mesh(new T.BoxGeometry(w,h,d),m,x,y,z,p);}
function pipe(a,b,r=.04,m=iron,p=model){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),m,0,0,0,p);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
function arch(parent,w,total,depth,mat=wall){const r=w/2,spring=total-r;for(const side of [-1,1])box(.95,spring,depth,side*(r+.475),spring/2,0,mat,parent);for(let i=0;i<20;i++){const a=i*Math.PI/20,b=(i+1)*Math.PI/20,s=new T.Shape();s.absarc(0,spring,r+.8,a,b,false);s.lineTo(r*Math.cos(b),spring+r*Math.sin(b));s.absarc(0,spring,r,b,a,true);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:3}),i%4===0?edge:mat,0,0,-depth/2,parent);}return spring;}
// Five openings: forward side wings; three recessed, inward-facing middle bays.
// Placement is a proposal based on the user's annotated silhouette, not a survey.
const bays=FIVE_ARCADES;
const bayNames=['skin-portal','canvas-portal','central-open-passage','space-portal','motion-portal'];
const upperLayers=[];

for(const [i,b] of bays.entries()){const [x,z,w,h,a]=b,g=new T.Group();g.name=bayNames[i];g.userData.openPassage=i===2;g.position.set(x,0,z);g.rotation.y=a;model.add(g);arch(g,w,h,.8);for(const side of [-1,1]){box(.3,8.6,5,side*(w/2+.9),4.3,-2.3,dark,g);pipe([side*(w/2+.6),0,.5],[side*(w/2+.6),9,.5],.085,iron,g);}box(w+2.1,.45,2.4,0,h+1,0,edge,g);box(w+1.8,.65,.8,0,h+.45,0,wall,g);for(const y of [h+1.65,h+2.2])pipe([-w/2-.9,y,1],[w/2+.9,y,1],.035,iron,g);for(let j=0;j<9;j++){const px=-(w/2+.9)+j*(w+1.8)/8;pipe([px,h+1.25,1],[px,h+2.25,1],.028,iron,g);}const upper=new T.Group();upper.position.set(0,h+1.3,-1.2);g.add(upper);upperLayers.push(upper);arch(upper,w+1.3,10.3,1,wall);for(let j=-3;j<=3;j++)pipe([j,0,-2.4],[j,9.2,-2.4],.035,iron,upper);}
// Behind the first arcade, the rooms recede instead of being opaque portal cards.
for(const [i,b] of bays.entries()){const [x,z,,,a]=b,g=new T.Group();g.position.set(x-Math.sin(a)*5.2,0,z-Math.cos(a)*5.2);g.rotation.y=a;g.name=i===2?'central-passage-depth':'gallery-depth-'+i;model.add(g);arch(g,3.4,5.6,.5,dark);}
// Circular reflecting pool and a genuinely open undercroft in front of it.
const floorShape=new T.Shape();floorShape.moveTo(-24,-23);floorShape.lineTo(24,-23);floorShape.lineTo(24,12);floorShape.lineTo(7,12);floorShape.lineTo(7,7.8);floorShape.lineTo(-9,7.8);floorShape.lineTo(-9,14);floorShape.lineTo(-24,14);floorShape.closePath();const poolHole=new T.Path();poolHole.absarc(0,-1,5.9,0,Math.PI*2,true);floorShape.holes.push(poolHole);const floor=mesh(new T.ExtrudeGeometry(floorShape,{depth:.4,bevelEnabled:false}),wall,0,0,0);floor.rotation.x=-Math.PI/2;
const pool=mesh(new T.CircleGeometry(5.25,96),waterMat,0,.12,-1);pool.rotation.x=-Math.PI/2;const rim=mesh(new T.RingGeometry(5.25,5.9,96),edge,0,.3,-1);rim.rotation.x=-Math.PI/2;
const base=mesh(new T.CylinderGeometry(5.9,5.9,.6,96,1,true),wall,0,0,-1);
const under=new T.Group();under.position.set(0,-4,7.8);model.add(under);arch(under,7,3.5,1,wall);box(30,.3,28,0,-4.2,-1,dark);
box(6.1,1.3,.65,6,1,10.2,wall);box(.65,1.3,3,-9,1,10,wall);
// Two curved gallery edges, independently placed and at different heights.
function balcony(a0,a1,r,y,cx,cz){const pts=[];for(let i=0;i<=48;i++){const a=a0+(a1-a0)*i/48;pts.push([cx+Math.sin(a)*r,y,cz-Math.cos(a)*r]);}for(let i=0;i<48;i++){const p=pts[i],q=pts[i+1],mid=p.map((v,k)=>(v+q[k])/2),len=new T.Vector3(...p).distanceTo(new T.Vector3(...q)),o=box(len+.03,.25,1.5,...mid,edge);o.rotation.y=-Math.atan2(q[2]-p[2],q[0]-p[0]);}for(const h of [.6,1.2])for(let i=0;i<48;i++)pipe([pts[i][0],y+h,pts[i][2]],[pts[i+1][0],y+h,pts[i+1][2]],.035);for(let i=0;i<=48;i+=3)pipe(pts[i],[pts[i][0],y+1.25,pts[i][2]],.03);}
balcony(-1.3,.4,16.5,9.8,-.8,-.3);balcony(-.55,1.2,18.3,17.8,.7,-1.4);
// Sculpture proxy kept to the dimensioned 8.4m high envelope, not a finished asset.
const sculpture=new T.Group();sculpture.name='sculpture-envelope-proxy';model.add(sculpture);sculpture.position.set(0,.6,-1);for(let k=0;k<3;k++){const p=[],idx=[],N=100,M=10;for(let i=0;i<=N;i++){const t=i/N,a=t*5.4+k*Math.PI*2/3,r=Math.sin(Math.PI*t)*2.15,w=Math.sin(Math.PI*t)*1.25+.025;for(let j=0;j<=M;j++){const v=j/M-.5;p.push(Math.cos(a)*r+Math.cos(a+.9)*v*w,t*8.4+v*.4,Math.sin(a)*r*.42+Math.sin(a+.9)*v*w*.7);}}for(let i=0;i<N;i++)for(let j=0;j<M;j++){if(i>12&&i<90&&j>3&&j<7&&Math.sin(i*.13+k)>.3)continue;const n=i*(M+1)+j;idx.push(n,n+M+1,n+1,n+1,n+M+1,n+M+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(p,3));geo.setIndex(idx);geo.computeVertexNormals();mesh(geo,ivory,0,0,0,sculpture);}pipe([0,9,-1],[0,24,-1],.025);
for(const [x,y,z] of [[-7.2,11.5,-6.4],[8.6,12,-8]]){mesh(new T.PlaneGeometry(2.1,6),new T.MeshLambertMaterial({color:'#d3ccb8',side:T.DoubleSide}),x,y,z);pipe([x-1.3,y+3.2,z],[x+1.3,y+3.2,z],.045);}
scene.add(new T.AmbientLight('#ffffff',.8));const sun=new T.DirectionalLight('#fff2d5',1.4);sun.position.set(14,22,6);scene.add(sun);const fill=new T.DirectionalLight('#aac7c7',.3);fill.position.set(-10,5,-10);scene.add(fill);
const camera=new T.PerspectiveCamera(53,16/9,.1,100);camera.position.set(0,3.15,16.7);camera.lookAt(0,5.5,-5.5);return {scene,camera,model,bays,bayNames,upperLayers,materials:{wall,edge,dark,iron,waterMat,ivory}};}
