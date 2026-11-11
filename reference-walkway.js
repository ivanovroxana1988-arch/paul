// Reference-led, real 3D gallery walkway. Dimensions are in metres.
// The 1.50 m deck sits just inside the existing structural piers; short
// bridges connect it to the eight radial galleries without cutting a pier.
export function addReferenceWalkway({T,parent,centerZ=-1,simple=false}){
  const root=new T.Group();root.name='reference-metal-gallery-walkway';parent.add(root);
  const inner=15.68,outer=17.18,width=outer-inner,center=(inner+outer)/2,top=9.95,segments=80;

  // Deterministic oxidised iron, with broad mottling, fine grain and warm wear.
  // Geometry, joints, railings and rivets are separately modelled in 3D.
  const size=256,data=new Uint8Array(size*size*4),rough=new Uint8Array(size*size*4);
  let seed=17291;
  const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const p=4*(y*size+x),n=rand(),large=(Math.sin(x*.065)+Math.cos(y*.081)+Math.sin((x+y)*.037))/3;
    const rust=Math.max(0,large-.18)*.36,grain=(n-.5)*13,base=68+large*9+grain;
    data[p]=base+rust*75;data[p+1]=base*.89+rust*24;data[p+2]=base*.75;
    data[p+3]=255;const v=Math.round(163+n*36+rust*40);
    rough[p]=rough[p+1]=rough[p+2]=v;rough[p+3]=255;
  }
  function tex(bytes,color=false){
    const t=new T.DataTexture(bytes,size,size,T.RGBAFormat);
    t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(.26,.26);t.needsUpdate=true;
    t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;
    t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;
    return t;
  }
  const metal=new T.MeshStandardMaterial({map:tex(data,true),roughnessMap:tex(rough),color:'#e6dfd0',metalness:.62,roughness:.75});
  const brass=new T.MeshStandardMaterial({color:'#876539',metalness:.72,roughness:.59});
  const patina=new T.MeshStandardMaterial({color:'#292e2b',metalness:.68,roughness:.75});

  const shape=new T.Shape();shape.absarc(0,0,outer,0,Math.PI*2,false);
  const hole=new T.Path();hole.absarc(0,0,inner,0,Math.PI*2,true);shape.holes.push(hole);
  const floor=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:false,curveSegments:simple?48:128}),metal);
  floor.name='reference-gallery-deck-1-5m';floor.position.set(0,top-.20,centerZ);floor.rotation.x=-Math.PI/2;
  floor.castShadow=true;floor.receiveShadow=true;root.add(floor);

  function horizontalRing(radius,height,tube,material,name){
    const m=new T.Mesh(new T.TorusGeometry(radius,tube,6,simple?64:128),material);
    m.name=name;m.rotation.x=Math.PI/2;m.position.set(0,height,centerZ);m.castShadow=true;root.add(m);return m;
  }
  for(const radius of [inner+.05,outer-.05]){
    horizontalRing(radius,top-.17,.065,patina,'walkway-edge-beam');
  }
  // Both rails are built from round 3D steel. Openings in the outside rail
  // line up with the connecting paths; the inner rail stays continuous.
  const railRadii=[inner+.08,outer-.08],levels=[.27,.69,1.16];
  // Leave a 3 m opening in the inside rail at the lift landing.
  const liftAngle=1.43,liftHalfGap=.095;
  for(const height of levels){
    const geometry=new T.TorusGeometry(railRadii[0],height===1.16?.056:.038,6,128,Math.PI*2-2*liftHalfGap);
    // The torus lies in XY before it is turned onto the floor. Its opening
    // must use the same world angle as the lift and the omitted posts.
    geometry.rotateZ(liftAngle-Math.PI/2+liftHalfGap);
    const rail=new T.Mesh(geometry,metal);rail.name='walkway-inner-handrail';rail.rotation.x=Math.PI/2;rail.position.set(0,top+height,centerZ);rail.castShadow=true;root.add(rail);
  }
  const halfGap=.050,part=(Math.PI*2)/8;
  for(const height of levels)for(let i=0;i<8;i++){
    const gapCenter=(i+.5)*part,start=gapCenter+halfGap,end=(i+1.5)*part-halfGap;
    const geometry=new T.TorusGeometry(railRadii[1],height===1.16?.056:.038,6,simple?12:24,end-start);
    geometry.rotateZ(start-Math.PI/2);
    const rail=new T.Mesh(geometry,metal);rail.name='walkway-outer-handrail';
    rail.rotation.x=Math.PI/2;rail.position.set(0,top+height,centerZ);rail.castShadow=true;root.add(rail);
  }
  // Instancing keeps the rich metal detail affordable on phones.
  const postCount=80,postMatrices=[],clampMatrices=[],baseMatrices=[],seamMatrices=[],rivetMatrices=[];
  const dummy=new T.Object3D();
  function matrixAt(x,y,z,angle=0){
    dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(1,1,1);dummy.updateMatrix();return dummy.matrix.clone();
  }
  const point=(a,r,y)=>[Math.sin(a)*r,y,centerZ-Math.cos(a)*r];
  function nearConnector(a){
    for(let k=0;k<8;k++){
      const c=(k+.5)*part,d=Math.atan2(Math.sin(a-c),Math.cos(a-c));
      if(Math.abs(d)<halfGap+.006)return true;
    }
    return false;
  }
  for(const [edge,radius] of railRadii.entries())for(let i=0;i<postCount;i++){
    const a=i/postCount*Math.PI*2;if(edge===1&&nearConnector(a))continue;
    if(edge===0&&Math.abs(Math.atan2(Math.sin(a-liftAngle),Math.cos(a-liftAngle)))<liftHalfGap)continue;
    let [x,,z]=point(a,radius,0);
    postMatrices.push(matrixAt(x,top+.59,z,-a));clampMatrices.push(matrixAt(x,top+.69,z,-a));
    baseMatrices.push(matrixAt(x,top+.035,z,-a));
  }
  for(let i=0;i<segments;i++){
    const a=i/segments*Math.PI*2,[x,,z]=point(a,center,0);
    seamMatrices.push(matrixAt(x,top+.009,z,-a));
    for(const rr of [inner+.15,outer-.15]){
      for(const offset of [-.035,.035]){
        const [vx,,vz]=point(a+offset/rr,rr,0);rivetMatrices.push(matrixAt(vx,top+.019,vz));
      }
    }
  }
  function instanced(name,geometry,material,matrices,shadow=true){
    const m=new T.InstancedMesh(geometry,material,matrices.length);
    m.name=name;matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.instanceMatrix.needsUpdate=true;
    m.castShadow=shadow;m.receiveShadow=true;root.add(m);return m;
  }
  instanced('walkway-rail-posts',new T.CylinderGeometry(.043,.043,1.18,8),metal,postMatrices);
  instanced('walkway-brass-collars',new T.BoxGeometry(.13,.16,.13),brass,clampMatrices);
  instanced('walkway-post-feet',new T.BoxGeometry(.17,.07,.17),brass,baseMatrices);
  instanced('walkway-plate-joints',new T.BoxGeometry(.025,.012,width-.12),patina,seamMatrices,false);
  instanced('walkway-rivets',new T.CylinderGeometry(.022,.022,.018,7),brass,rivetMatrices,false);

  // Short radial connections to the pre-existing outer galleries.
  for(let i=0;i<8;i++){
    const a=(i+.5)*part,r=(outer+18.5)/2,g=new T.Group();
    g.name='walkway-gallery-connector';g.position.set(Math.sin(a)*r,top-.1,centerZ-Math.cos(a)*r);g.rotation.y=-a;root.add(g);
    const deck=new T.Mesh(new T.BoxGeometry(1.0,.2,18.5-outer+.06),metal);
    deck.name='walkway-connector-deck';deck.castShadow=true;deck.receiveShadow=true;g.add(deck);
  }
  root.userData.dimensions={clearDeckWidth:width,innerRadius:inner,outerRadius:outer,deckTop:top,centerZ};
  root.userData.detailCounts={rivets:rivetMatrices.length,posts:postMatrices.length,connectors:8};
  return root;
}
