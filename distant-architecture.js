// Additional architecture behind the central upper openings. The meshes start
// above the ground-floor rooms and leave the central passage and navigation intact.
export function addDistantArchitecture({T,parent,mesh,box,pipe,stone,paleStone,metal,brass,centerZ}) {
  const root=new T.Group();
  root.name='distant-central-architecture';
  parent.add(root);

  function bay(angle,radius,name){
    const g=new T.Group();
    g.name=name;
    g.position.set(Math.sin(angle)*radius,0,centerZ-Math.cos(angle)*radius);
    g.rotation.y=-angle;
    root.add(g);
    return g;
  }
  // An open stone arch, modelled with a real soffit and piers, not a flat image.
  function arch(g,width,spring,thickness,depth,base,material){
    const r=width/2,s=new T.Shape();
    s.absarc(0,spring,r+thickness,0,Math.PI,false);
    s.lineTo(-r,spring);
    s.absarc(0,spring,r,Math.PI,0,true);
    s.closePath();
    const crown=mesh(new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:32}),material,0,0,-depth/2,g);
    crown.name='distant-arch-soffit';
    for(const side of [-1,1]){
      const pier=box(thickness,spring-base,depth,side*(r+thickness/2),(spring+base)/2,0,material,g);
      pier.name='distant-arch-pier';
      box(thickness+.18,.22,depth+.18,side*(r+thickness/2),spring-.11,0,paleStone,g);
    }
  }

  // A farther arcade catches the light through the openings behind the bridge.
  for(const [index,a] of [-1.02,-.62,-.235,.235,.62,1.02].entries()){
    const g=bay(a,31.2,'rear-gallery-arch-'+index);
    const width=[10.8,11.2,11.7,11.7,11.1,10.5][index];
    const spring=[15.3,15.8,16,16.2,15.8,15.4][index];
    arch(g,width,spring,.65,1.0,9.9,stone);
    // Thin inner edge brings out the depth of the stone arch.
    arch(g,width,spring,.13,.16,10.0,paleStone);
  }

  // Partial annulus: 1.5 m wide, curved in plan, placed BEHIND the existing
  // balcony and above the rooms. Its rails follow the actual curve.
  const radius=26.25, halfWidth=.75, start=-1.10, end=1.10, y=14.55;
  const shape=new T.Shape();
  shape.absarc(0,0,radius+halfWidth,Math.PI/2-end,Math.PI/2-start,false);
  shape.lineTo(Math.cos(Math.PI/2-start)*(radius-halfWidth),Math.sin(Math.PI/2-start)*(radius-halfWidth));
  shape.absarc(0,0,radius-halfWidth,Math.PI/2-start,Math.PI/2-end,true);
  shape.closePath();
  const deck=mesh(new T.ExtrudeGeometry(shape,{depth:.32,bevelEnabled:false,curveSegments:48}),stone,0,y,centerZ,root);
  deck.name='rear-curved-bridge-1-5m';
  deck.rotation.x=-Math.PI/2;
  function point(a,r,h){return [Math.sin(a)*r,h,centerZ-Math.cos(a)*r];}
  for(const r of [radius-halfWidth+.08,radius+halfWidth-.08]){
    for(const height of [y+.65,y+1.25])for(let i=0;i<36;i++){
      const a=start+(end-start)*i/36,b=start+(end-start)*(i+1)/36;
      pipe(point(a,r,height),point(b,r,height),.035,brass,root);
    }
    for(let i=0;i<=20;i++){
      const a=start+(end-start)*i/20;
      pipe(point(a,r,y+.3),point(a,r,y+1.3),.033,metal,root);
    }
  }
  // Arched supports connect the bridge to the lower rear gallery.
  for(const [index,a] of [-1.02,-.62,-.235,.235,.62,1.02].entries()){
    const g=bay(a,radius,'bridge-support-arch-'+index);
    arch(g,8.2,10.2,.36,.6,9.9,stone);
  }
  return root;
}
