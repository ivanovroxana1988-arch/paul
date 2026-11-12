// Third storey: the straight rear and side perimeter follows the marked plan.
// The inset curved edge keeps the existing glass dome and its service ring open.
export function addThirdFloor({T,scene,mesh,box,stone,paleStone,metal,pipe}){
 const root=new T.Group();root.name='third-floor';scene.add(root);
 const base=24.65,back=-31,front=-10,half=26,centerZ=-1,inner=19.3;
 const cross=Math.sqrt(inner*inner-(front-centerZ)**2);
 const slab=new T.Shape();slab.moveTo(-half,-front);slab.lineTo(-cross,-front);
 // Curve around the rear half of the dome, without covering its glass.
 const a0=Math.atan2(-(front-centerZ),-cross),a1=Math.atan2(-(front-centerZ),cross);
 for(let i=1;i<=64;i++){const a=a0+(a1-a0)*i/64;slab.lineTo(inner*Math.cos(a),-centerZ+inner*Math.sin(a));}
 slab.lineTo(half,-front);slab.lineTo(half,-back);slab.lineTo(-half,-back);slab.closePath();
 const floor=mesh(new T.ExtrudeGeometry(slab,{depth:.32,bevelEnabled:false,curveSegments:64}),stone,0,base-.32,0,root);
 floor.rotation.x=-Math.PI/2;floor.name='third-floor-deck';
 function archedWall(name,length,opening,spring,x,z,angle){
  const h=6.8,r=opening/2,s=new T.Shape();s.moveTo(-length/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(length/2,0);s.lineTo(length/2,h);s.lineTo(-length/2,h);s.closePath();
  const g=new T.Group();g.name=name;g.position.set(x,base,z);g.rotation.y=angle;root.add(g);
  mesh(new T.ExtrudeGeometry(s,{depth:.65,bevelEnabled:false,curveSegments:40}),stone,0,0,-.325,g).name=name+'-wall';
  const trim=new T.Shape();trim.absarc(0,spring,r+.22,0,Math.PI,false);trim.lineTo(-r,spring);trim.absarc(0,spring,r,Math.PI,0,true);trim.closePath();
  mesh(new T.ExtrudeGeometry(trim,{depth:.08,bevelEnabled:false,curveSegments:40}),paleStone,0,0,.33,g).name=name+'-arch';
 }
 archedWall('third-floor-central-arch',half*2,6.8,3.0,0,back,0);
 archedWall('third-floor-left-arch',front-back,5.8,3.1,-half,(front+back)/2,Math.PI/2);
 archedWall('third-floor-right-arch',front-back,5.8,3.1,half,(front+back)/2,Math.PI/2);
 // A glazed double door sits inside the existing central arch. It opens out
 // onto a real deck at the same level, instead of ending at the facade.
 const portal=new T.Group();portal.name='third-floor-terrace-door';portal.position.set(0,base,back);root.add(portal);
 const glass=new T.MeshStandardMaterial({color:'#b5d2cd',metalness:.12,roughness:.2,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false});
 const doorHalf=1.4,doorHeight=2.85,archHalf=3.4;
 function member(w,h,d,x,y,z){return box(w,h,d,x,y,z,metal,portal);}
 for(const x of [-archHalf,-doorHalf,doorHalf,archHalf])member(.08,3,.11,x,1.5,.02);
 member(archHalf*2,.09,.11,0,3,.02);
 for(const side of [-1,1]){
  const panel=mesh(new T.PlaneGeometry(archHalf-doorHalf-.08,2.93),glass,side*(archHalf+doorHalf)/2,1.49,.01,portal,false);panel.name='terrace-door-fixed-glass';panel.castShadow=false;
 }
 const transom=new T.Shape();transom.moveTo(-archHalf,3);transom.absarc(0,3,archHalf,Math.PI,0,true);transom.closePath();
 mesh(new T.ShapeGeometry(transom,40),glass,0,0,.01,portal,false).name='terrace-door-arched-glass';
 const leaves=[];
 for(const side of [-1,1]){
  const leaf=new T.Group();leaf.name='terrace-door-leaf';leaf.position.set(side*doorHalf,0,0);portal.add(leaf);
  const cx=-side*doorHalf/2;
  const panel=mesh(new T.PlaneGeometry(doorHalf-.10,doorHeight-.12),glass,cx,doorHeight/2,.01,leaf,false);panel.castShadow=false;
  for(const x of [0,-side*doorHalf])box(.075,doorHeight,.09,x,doorHeight/2,0,metal,leaf);
  for(const y of [.04,doorHeight-.04])box(doorHalf,.08,.09,cx,y,0,metal,leaf);
  box(.07,.28,.12,-side*(doorHalf-.16),1.1,.08,paleStone,leaf);
  leaves.push({leaf,side});
 }
 let doorOpen=true;
 function setDoorOpen(value){doorOpen=!!value;for(const {leaf,side} of leaves)leaf.rotation.y=doorOpen?-side*1.2:0;}
 setDoorOpen(true);
 // A bordered terrace and brackets connect to the rear perimeter wall.
 const terraceDepth=8,terraceHalf=6,terraceEnd=back-terraceDepth;
 const terrace=box(terraceHalf*2,.32,terraceDepth,0,base-.16,(back+terraceEnd)/2,stone,root);terrace.name='third-floor-terrace-deck';
 const borderHeight=1.1;
 for(const x of [-terraceHalf,terraceHalf]){
  const border=box(.25,borderHeight,terraceDepth,x,base+borderHeight/2,(back+terraceEnd)/2,paleStone,root);border.name='third-floor-terrace-border';
  pipe([x,base-3.8,back+.1],[x,base-.25,terraceEnd+.25],.16,metal,root).name='third-floor-terrace-bracket';
 }
 box(terraceHalf*2+.25,borderHeight,.25,0,base+borderHeight/2,terraceEnd,paleStone,root).name='third-floor-terrace-border';
 // Vertical supports join the new perimeter and slab all the way to the ground.
 for(const x of [-half,half])for(const z of [back,front]){
  const p=box(.8,base,.8,x,base/2,z,stone,root);p.name='third-floor-ground-support';
 }
 // Guardrail along the open edge overlooking the dome and atrium.
 const path=[];for(let i=0;i<=64;i++){const a=a0+(a1-a0)*i/64;path.push([inner*Math.cos(a),centerZ-inner*Math.sin(a)]);}
 for(let i=0;i<path.length-1;i++){const [x,z]=path[i],[nx,nz]=path[i+1];pipe([x,base+1.1,z],[nx,base+1.1,nz],.04,metal,root);}
 for(let i=0;i<path.length;i+=4){const [x,z]=path[i];pipe([x,base,z],[x,base+1.1,z],.04,metal,root);}
 function walkable(x,z){
  const interior=x> -half+.55&&x<half-.55&&z>back+.55&&z<front-.55&&Math.hypot(x,z-centerZ)>inner+.35;
  const threshold=doorOpen&&Math.abs(x)<doorHalf-.23&&z>=back-.65&&z<=back+.55;
  const outdoor=Math.abs(x)<terraceHalf-.45&&z>terraceEnd+.45&&z<back-.65;
  return interior||threshold||outdoor;
 }
 return {root,base,walkable,setDoorOpen,isDoorOpen:()=>doorOpen,isOnTerrace:(x,z)=>Math.abs(x)<terraceHalf&&z<back-.65&&z>terraceEnd};
}
