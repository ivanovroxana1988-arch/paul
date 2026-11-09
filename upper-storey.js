import {addDome} from './dome.js?v=2';
import {addUpperDetails} from './upper-details.js';
import {addDistantArchitecture} from './distant-architecture.js?v=2';
// Shared upper-storey geometry for the clay study and the full WebGL scene.
// The visible structure, narrow walkways and recessed glazing are separate layers.
export function addUpperStorey({T,scene,mesh,box,pipe,stone,paleStone,metal,brass,root=null,roofRoot=null,simple=false}){
const parent=root||new T.Group();if(!root)scene.add(parent);parent.name='upper-storey';const structure=new T.Group(),walkways=new T.Group(),windows=new T.Group(),roof=roofRoot||new T.Group();parent.add(structure,walkways,windows);if(!roofRoot)parent.add(roof);structure.name='monumental-arcades';walkways.name='upper-walkways';windows.name='recessed-windows';roof.name='radial-roof';
const R=18.5,CZ=-1,base=9.85,outerRadius=23.1,span=Math.PI/4;
function place(parent,angle,r=R,y=base){const g=new T.Group();g.position.set(Math.sin(angle)*r,y,CZ-Math.cos(angle)*r);g.rotation.y=-angle;g.userData.cutFront=g.position.z>2;parent.add(g);return g;}
function openWall(w,h,opening,spring,depth,parent,mat){const r=opening/2,s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();const m=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:simple?16:28}),mat,0,0,-depth/2,parent);m.name='upper-structural-arch';return m;}
function archRing(parent,width,spring,depth,mat){const r=width/2,shape=new T.Shape();shape.absarc(0,spring,r+.38,0,Math.PI,false);shape.lineTo(-r,spring);shape.absarc(0,spring,r,Math.PI,0,true);shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:simple?16:32}),mat,0,0,1.08,parent);}
const glassMat=simple?new T.MeshLambertMaterial({color:'#96aaa5',side:T.DoubleSide}):new T.MeshBasicMaterial({color:'#afc6c4',transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false});
const baySpecs=[];
for(let i=0;i<8;i++){
const angle=Math.PI/8+i*span,width=2*R*Math.tan(span/2),opening=[12.2,11.7,12.5,11.8,12,12.4,11.5,12.3][i],spring=[6.6,7.15,6.7,6.4,7,6.6,7.2,6.5][i],height=14.8;
const bay=place(structure,angle);bay.name='monumental-bay-'+i;openWall(width+.06,height,opening,spring,2.1,bay,stone);archRing(bay,opening,spring,.17,paleStone);
// Deep soffit rings and stone jambs visibly connect the front structure to the gallery behind.
for(const side of [-1,1]){box(.6,spring,2.45,side*(opening/2+.3),spring/2,0,paleStone,bay);box(.9,.3,2.7,side*(opening/2+.3),.15,0,paleStone,bay);}
const back=place(windows,angle,outerRadius);back.name='window-bay-'+i;const backWidth=2*outerRadius*Math.tan(span/2),windowW=13.2,windowSpring=6.5;
openWall(backWidth+.05,14.8,windowW,windowSpring,.65,back,stone);
// Four bays across the rear open onto the deeper gallery. The other windows remain glazed.
if(simple || ![0,1,6,7].includes(i)){
// The glazing itself follows the arch instead of filling a rectangular card in front of it.
const shape=new T.Shape(),r=windowW/2;shape.moveTo(-r,0);shape.lineTo(r,0);shape.lineTo(r,windowSpring);shape.absarc(0,windowSpring,r,0,Math.PI,false);shape.closePath();mesh(new T.ShapeGeometry(shape,24),glassMat,0,0,-.45,back).name='recessed-glazing';
for(let j=-4;j<=4;j++){const x=j*1.32,top=windowSpring+Math.sqrt(Math.max(0,r*r-x*x));pipe([x,.15,-.25],[x,top-.08,-.25],.045,metal,back);}for(const y of [2.2,4.4,6.5,8.7,10.8]){const half=y<=windowSpring?r:Math.sqrt(Math.max(0,r*r-(y-windowSpring)**2));pipe([-half,y,-.24],[half,y,-.24],.035,metal,back);}
}
// Radial walkway segments bridge the depth between arcade and rear window frame.
box(1.15,.24,outerRadius-R+.4,0,.05,-(outerRadius-R)/2,paleStone,bay);for(const side of [-1,1]){pipe([side*.57,.26,.2],[side*.57,1.45,.2],.035,metal,bay);pipe([side*.57,1.45,.2],[side*.57,1.45,-(outerRadius-R)],.035,brass,bay);}
baySpecs.push({angle,frontRadius:R,windowRadius:outerRadius,opening,spring,base});
}
// Continuous massive piers stand between the eight wide structural openings.
for(let i=0;i<8;i++){const a=i*span,g=place(structure,a,R,0);g.name='continuous-pier-'+i;box(1.45,24.65,2.5,0,12.325,0,stone,g);box(1.85,.5,2.85,0,9.65,0,paleStone,g);box(1.9,.4,2.9,0,23.8,0,paleStone,g);if(!simple){for(const y of [4,10.5,18.5,23])box(1.6,.12,2.62,0,y,.02,brass,g);}}
function ring(inner,outer,y,depth,mat,parent){const s=new T.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);s.holes.push(hole);const m=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:simple?48:96}),mat,0,y,CZ,parent);m.rotation.x=-Math.PI/2;m.name='narrow-curved-walkway';return m;}
ring(17.6,19.4,9.6,.35,paleStone,walkways);
for(const y of [10.45,11.12]){const r=mesh(new T.TorusGeometry(17.71,.04,6,simple?96:160),brass,0,y,CZ,walkways);r.rotation.x=Math.PI/2;}
for(let i=0;i<80;i++){const a=i/80*Math.PI*2;pipe([Math.sin(a)*17.71,9.95,CZ-Math.cos(a)*17.71],[Math.sin(a)*17.71,11.2,CZ-Math.cos(a)*17.71],.032,metal,walkways);}
const dome=addDome({T,roof,mesh,box,pipe,metal,brass,paleStone,simple});
// Large rose window set in the right rear layer, behind the structural opening.
const rose=place(windows,3*Math.PI/8,outerRadius,17.5);rose.name='rear-rose-window';const disc=mesh(new T.CircleGeometry(3.5,64),glassMat,0,0,-.1,rose);for(const r of [.8,2.4,3.5])mesh(new T.TorusGeometry(r,.065,6,64),metal,0,0,0,rose);for(let i=0;i<12;i++){const a=i*Math.PI/6;pipe([Math.cos(a)*.8,Math.sin(a)*.8,0],[Math.cos(a)*3.5,Math.sin(a)*3.5,0],.045,metal,rose);}
const details=addUpperDetails({T,structure,walkways,windows,mesh,box,pipe,metal,brass,paleStone,simple});
const distantArchitecture=simple?null:addDistantArchitecture({T,parent,mesh,box,pipe,stone,paleStone,metal,brass,centerZ:CZ});
return {root:parent,structure,walkways,windows,roof,baySpecs,details,dome,distantArchitecture};
}
