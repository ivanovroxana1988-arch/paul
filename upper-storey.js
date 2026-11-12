import {addDome} from './dome.js?v=3';
import {addUpperDetails} from './upper-details.js?v=8';
import {addDistantArchitecture} from './distant-architecture.js?v=4';
import {addReferenceWalkway} from './reference-walkway.js?v=5';
// Shared upper-storey geometry for the clay study and the full WebGL scene.
// The visible structure, narrow walkways and recessed glazing are separate layers.
export function addUpperStorey({T,scene,mesh,box,pipe,stone,paleStone,metal,brass,root=null,roofRoot=null,simple=false}){
const parent=root||new T.Group();if(!root)scene.add(parent);parent.name='upper-storey';const structure=new T.Group(),walkways=new T.Group(),windows=new T.Group(),roof=roofRoot||new T.Group();parent.add(structure,walkways,windows);if(!roofRoot)parent.add(roof);structure.name='monumental-arcades';walkways.name='upper-walkways';windows.name='recessed-windows';roof.name='radial-roof';
const R=18.5,CZ=-1,base=9.85,outerRadius=23.1,span=Math.PI/4;
function place(parent,angle,r=R,y=base){const g=new T.Group();g.position.set(Math.sin(angle)*r,y,CZ-Math.cos(angle)*r);g.rotation.y=-angle;g.userData.cutFront=g.position.z>2;parent.add(g);return g;}
function openWall(w,h,opening,spring,depth,parent,mat){const r=opening/2,s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();const m=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:simple?16:28}),mat,0,0,-depth/2,parent);m.name='upper-structural-arch';return m;}
function archRing(parent,width,spring,depth,mat){const r=width/2,shape=new T.Shape();shape.absarc(0,spring,r+.38,0,Math.PI,false);shape.lineTo(-r,spring);shape.absarc(0,spring,r,Math.PI,0,true);shape.closePath();mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false,curveSegments:simple?16:32}),mat,0,0,1.08,parent);}
const glassMat=simple?new T.MeshLambertMaterial({color:'#96aaa5',side:T.DoubleSide}):new T.MeshBasicMaterial({color:'#afc6c4',transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false});
// Continue the masonry under the upper arches to the ground. Large arched
// openings preserve the routes already present through the galleries.
function groundSupport(parent,angle,radius,width,opening,depth,index,protectCentralPassage=false){
 const g=place(parent,angle,radius,0);g.name='ground-support-'+index;
 const half=width/2, archRadius=opening/2,groundSpring=Math.max(2.9,base-archRadius-.18);
 if(protectCentralPassage){
  // A full jamb here would cross the central open passage. Carry its upper
  // wall on a high tie beam and the outer jamb instead.
  const beam=box(width,1.05,depth,0,base-.525,0,stone,g);beam.name='ground-support-over-central-passage';
  const side=index===0?1:-1,pierWidth=half-archRadius;
  const pier=box(pierWidth,base,depth,side*(archRadius+pierWidth/2),base/2,0,stone,g);
  pier.name='ground-support-outer-pier';
 }else{
  const s=new T.Shape();s.moveTo(-half,0);s.lineTo(-archRadius,0);s.lineTo(-archRadius,groundSpring);
  s.absarc(0,groundSpring,archRadius,Math.PI,0,true);s.lineTo(archRadius,0);s.lineTo(half,0);
  s.lineTo(half,base);s.lineTo(-half,base);s.closePath();
  const support=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:simple?16:28}),stone,0,0,-depth/2,g);
  support.name='ground-support-open-arch';
 }
 return g;
}
// Ground-floor enclosure follows the three right-hand bays marked on the plan.
// The first half joins the existing outer wall of Motion; the last retains a
// central entrance with two open door leaves.
function addMarkedGroundWalls(g,index){
 const r=6.6,spring=Math.max(2.9,base-r-.18),doorHalf=1.4,doorHeight=3.35;
 const s=new T.Shape();
 if(index===1){
  s.moveTo(0,0);s.lineTo(r,0);s.lineTo(r,spring);
  s.absarc(0,spring,r,0,Math.PI/2,false);s.closePath();
 }else{
  s.moveTo(-r,0);
  if(index===3){s.lineTo(-doorHalf,0);s.lineTo(-doorHalf,doorHeight);s.lineTo(doorHalf,doorHeight);s.lineTo(doorHalf,0);}
  s.lineTo(r,0);s.lineTo(r,spring);s.absarc(0,spring,r,0,Math.PI,false);s.closePath();
 }
 const fill=mesh(new T.ExtrudeGeometry(s,{depth:.65,bevelEnabled:false,curveSegments:32}),stone,0,0,-.325,g);
 fill.name='marked-ground-perimeter-wall-'+index;
 if(index!==3)return;
 for(const x of [-doorHalf,doorHalf])box(.10,doorHeight,.14,x,doorHeight/2,.36,metal,g).name='marked-entry-door-frame';
 box(doorHalf*2+.1,.10,.14,0,doorHeight,.36,metal,g).name='marked-entry-door-frame';
 const pane=new T.MeshStandardMaterial({color:'#b9cdc5',metalness:.1,roughness:.22,transparent:true,opacity:.24,side:T.DoubleSide,depthWrite:false});
 for(const side of [-1,1]){
  const leaf=new T.Group();leaf.name='marked-entry-open-door-leaf';leaf.position.set(side*doorHalf,0,.37);leaf.rotation.y=side*1.23;g.add(leaf);
  const mid=-side*doorHalf/2;
  const glass=mesh(new T.PlaneGeometry(doorHalf-.13,doorHeight-.25),pane,mid,doorHeight/2,0,leaf);glass.castShadow=false;
  for(const x of [0,-side*doorHalf])box(.07,doorHeight,.09,x,doorHeight/2,0,metal,leaf);
  for(const y of [.06,doorHeight-.06])box(doorHalf,.08,.09,mid,y,0,metal,leaf);
 }
}
const baySpecs=[];
for(let i=0;i<8;i++){
const angle=Math.PI/8+i*span,width=2*R*Math.tan(span/2),opening=[12.2,11.7,12.5,11.8,12,12.4,11.5,12.3][i],spring=[6.6,7.15,6.7,6.4,7,6.6,7.2,6.5][i],height=14.8;
const bay=place(structure,angle);bay.name='monumental-bay-'+i;openWall(width+.06,height,opening,spring,2.1,bay,stone);archRing(bay,opening,spring,.17,paleStone);
groundSupport(structure,angle,R,width+.06,opening,2.1,i,i===0||i===7);
// Deep soffit rings and stone jambs visibly connect the front structure to the gallery behind.
for(const side of [-1,1]){box(.6,spring,2.45,side*(opening/2+.3),spring/2,0,paleStone,bay);box(.9,.3,2.7,side*(opening/2+.3),.15,0,paleStone,bay);}
const back=place(windows,angle,outerRadius);back.name='window-bay-'+i;const backWidth=2*outerRadius*Math.tan(span/2),windowW=13.2,windowSpring=6.5;
openWall(backWidth+.05,14.8,windowW,windowSpring,.65,back,stone);
const lowerWindow=groundSupport(windows,angle,outerRadius,backWidth+.05,windowW,.65,i,i===0||i===7);
lowerWindow.name='window-ground-support-'+i;
if(!simple && (i===1||i===2||i===3))addMarkedGroundWalls(lowerWindow,i);
// In the machinery bay, a circular rose window is set into a solid arched wall,
// to the left of the winch. The other rear gallery passages stay open.
if(!simple && i===1){
 // The infill must overlap the surrounding masonry in depth and at the
 // edges; a detached plane leaves a visible slit when seen from the lift.
 const r=windowW/2+.06,shape=new T.Shape();
 shape.moveTo(-r,-.03);shape.lineTo(r,-.03);shape.lineTo(r,windowSpring);
 shape.absarc(0,windowSpring,r,0,Math.PI,false);shape.closePath();
 const aperture=new T.Path();aperture.absarc(-3.55,7.65,2.75,0,Math.PI*2,true);
 shape.holes.push(aperture);
 const wall=mesh(new T.ExtrudeGeometry(shape,{depth:.56,bevelEnabled:false,curveSegments:48}),stone,0,0,-.28,back);
 wall.name='machinery-bay-rose-window-wall';
}
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
if(simple){
 ring(17.6,19.4,9.6,.35,paleStone,walkways);
 for(const y of [10.45,11.12]){const r=mesh(new T.TorusGeometry(17.71,.04,6,96),brass,0,y,CZ,walkways);r.rotation.x=Math.PI/2;}
 for(let i=0;i<80;i++){const a=i/80*Math.PI*2;pipe([Math.sin(a)*17.71,9.95,CZ-Math.cos(a)*17.71],[Math.sin(a)*17.71,11.2,CZ-Math.cos(a)*17.71],.032,metal,walkways);}
}else{
 addReferenceWalkway({T,parent:walkways,centerZ:CZ});
}
const dome=addDome({T,roof,mesh,box,pipe,metal,brass,paleStone,simple});
// Rose window: a real circular pane and raised radial ironwork, with a floral
// centre and a stone surround. The glass itself must not cast an opaque shadow.
const rose=place(windows,3*Math.PI/8,outerRadius,17.5);
rose.name='rear-rose-window';
if(!simple)rose.position.add(new T.Vector3(-3.55,0,0).applyAxisAngle(new T.Vector3(0,1,0),-3*Math.PI/8));
const radius=simple?3.5:2.75;
const pane=mesh(new T.CircleGeometry(radius-.025,80),glassMat,0,0,-.40,rose);
pane.name='rose-window-glass';pane.castShadow=false;
for(const [r,t,mat] of [[radius,.17,paleStone],[radius-.18,.065,metal],[radius*.67,.055,metal],[radius*.25,.055,metal],[radius*.075,.05,brass]]){
 const ring=mesh(new T.TorusGeometry(r,t,8,80),mat,0,0,-.20,rose);
 ring.name='rose-window-ring';
}
function roseBar(points,thickness,mat=metal){
 const bar=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(points),24,thickness,6,false),mat,0,0,-.17,rose);
 bar.castShadow=true;return bar;
}
for(let i=0;i<12;i++){
 const a=i*Math.PI/6,c=Math.cos(a),s=Math.sin(a);
 roseBar([new T.Vector3(c*radius*.25,s*radius*.25,0),new T.Vector3(c*(radius-.17),s*(radius-.17),0)],.038);
 const petal=[];
 for(let j=0;j<=24;j++){
  const t=j/24*Math.PI*2,rad=radius*(.38+.14*Math.cos(t)),side=radius*.065*Math.sin(t);
  petal.push(new T.Vector3(c*rad-s*side,s*rad+c*side,0));
 }
 roseBar(petal,.03);
}
const details=addUpperDetails({T,structure,walkways,windows,mesh,box,pipe,metal,brass,paleStone,simple,useReferenceWalkway:!simple});
const distantArchitecture=simple?null:addDistantArchitecture({T,parent,mesh,box,pipe,stone,paleStone,metal,brass,centerZ:CZ});
return {root:parent,structure,walkways,windows,roof,baySpecs,details,dome,distantArchitecture};
}
