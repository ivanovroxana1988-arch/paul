// Two short second-floor galleries physically meet the existing overhead bridge.
// The original model had no floor at this elevation: these are new 3D decks,
// aligned with the bridge and anchored at the nearby structural piers.
export function addUpperLevelLandings({T,parent,bridge,bridgeModel,centerZ=-1}){
  const meta=bridgeModel.userData.dimensions;
  const half=meta.span/2,deckWidth=meta.clearDeckWidth,bow=meta.planCurve;
  const bridgeZ=bridge.position.z,top=bridge.position.y;
  const inner=15.68,outer=17.18,innerRail=inner+.08,outerRail=outer-.08;
  const start=Math.PI/4,end=Math.PI/2;
  const iron=bridgeModel.getObjectByName('overhead-deck-1-5m').material;
  const brass=bridgeModel.getObjectByName('overhead-brass-collars').material;
  const root=new T.Group();root.name='second-floor-bridge-landings';parent.add(root);
  // Centreline of the existing overhead deck, evaluated in its parent's space.
  const centerAt=x=>bridgeZ-bow*(1-(x/half)**2);
  function crossing(edge){
    let lo=0,hi=half;
    for(let i=0;i<45;i++){
      const x=(lo+hi)/2,z=centerAt(x)+edge-centerZ;
      if(Math.hypot(x,z)<innerRail)lo=x;else hi=x;
    }
    const x=(lo+hi)/2,z=centerAt(x)+edge-centerZ;
    return Math.atan2(x,-z);
  }
  // Include the whole bridge deck plus a small clearance at both edges.
  const gapStart=crossing(-deckWidth/2-.07),gapEnd=crossing(deckWidth/2+.07);
  const low=Math.min(gapStart,gapEnd),high=Math.max(gapStart,gapEnd);
  function point(a,r,y){return new T.Vector3(Math.sin(a)*r,y,centerZ-Math.cos(a)*r);}
  function segment(name,a0,a1){
    const outerStart=Math.PI/2-a1,outerEnd=Math.PI/2-a0;
    const shape=new T.Shape();shape.absarc(0,0,outer,outerStart,outerEnd,false);
    shape.lineTo(Math.cos(outerEnd)*inner,Math.sin(outerEnd)*inner);
    shape.absarc(0,0,inner,outerEnd,outerStart,true);shape.closePath();
    const deck=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.20,bevelEnabled:false,curveSegments:32}),iron);
    deck.name=name;deck.position.set(0,top-.20,centerZ);deck.rotation.x=-Math.PI/2;
    deck.castShadow=true;deck.receiveShadow=true;root.add(deck);
  }
  function arc(name,r,y,a0,a1,radius,material){
    const count=Math.max(4,Math.ceil(Math.abs(a1-a0)*28)),pts=[];
    for(let i=0;i<=count;i++)pts.push(point(a0+(a1-a0)*i/count,r,y));
    const o=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),count,radius,6,false),material);
    o.name=name;o.castShadow=true;root.add(o);return o;
  }
  const postMatrices=[],collarMatrices=[],dummy=new T.Object3D();
  function matrixAt(p,a){dummy.position.copy(p);dummy.rotation.set(0,-a,0);dummy.updateMatrix();return dummy.matrix.clone();}
  for(const side of [-1,1]){
    const a0=side>0?start:-end,a1=side>0?end:-start;
    const gap0=side>0?low:-high,gap1=side>0?high:-low;
    const domeGapCenter=side*3*Math.PI/8,domeGapHalf=.05;
    const domeGap0=domeGapCenter-domeGapHalf,domeGap1=domeGapCenter+domeGapHalf;
    segment('second-floor-gallery-deck',a0,a1);
    // Leave one gap at the bridge mouth and another toward the dome walkway.
    for(const height of [.27,.69,1.16]){
      const tube=height===1.16?.05:.035;
      arc('second-floor-inner-rail',innerRail,top+height,a0,gap0,tube,iron);
      arc('second-floor-inner-rail',innerRail,top+height,gap1,a1,tube,iron);
      arc('second-floor-outer-rail',outerRail,top+height,a0,domeGap0,tube,iron);
      arc('second-floor-outer-rail',outerRail,top+height,domeGap1,a1,tube,iron);
    }
    // Flush short deck connects the landing to the existing dome service ring.
    const join=new T.Group();join.name='raised-bridge-dome-connector';
    join.position.copy(point(domeGapCenter,17.39,top-.1));join.rotation.y=-domeGapCenter;root.add(join);
    const joinDeck=new T.Mesh(new T.BoxGeometry(1.5,.20,.62),iron);joinDeck.castShadow=true;joinDeck.receiveShadow=true;join.add(joinDeck);
    for(const x of [-.72,.72]){
      for(const z of [-.27,.27]){const post=new T.Mesh(new T.BoxGeometry(.07,1.16,.07),iron);post.position.set(x,.68,z);join.add(post);}
      for(const y of [.65,1.23]){const rail=new T.Mesh(new T.BoxGeometry(.07,.07,.62),iron);rail.position.set(x,y,0);join.add(rail);}
    }
    // Include posts at the edges of the opening, and keep all other posts clear.
    for(const r of [innerRail,outerRail]){
      const angles=Array.from({length:17},(_,i)=>a0+(a1-a0)*i/16);
      if(r===innerRail)angles.push(gap0,gap1);
      else angles.push(domeGap0,domeGap1);
      for(const a of angles){
        if(r===innerRail&&a>gap0-0.001&&a<gap1+0.001&&Math.abs(a-gap0)>.0001&&Math.abs(a-gap1)>.0001)continue;
        if(r===outerRail&&a>domeGap0&&a<domeGap1)continue;
        postMatrices.push(matrixAt(point(a,r,top+.59),a));
        collarMatrices.push(matrixAt(point(a,r,top+.69),a));
      }
    }
    // Bearing plates finish at the face of the existing pier, without
    // continuing a walkway through the structural column.
    for(const a of [a0,a1]){
      const g=new T.Group();g.name='second-floor-pier-connection';
      const r=(outer+17.25)/2;g.position.copy(point(a,r,top-.12));g.rotation.y=-a;root.add(g);
      const plate=new T.Mesh(new T.BoxGeometry(.48,.20,17.25-outer+.05),brass);
      plate.castShadow=true;plate.receiveShadow=true;g.add(plate);
    }
  }
  // The curved ribs previously ended below the deck in empty space. Put a
  // steel end support just outside each deck edge, from each rib end up to the
  // landing underside. The supports leave the clear walking width unobstructed.
  const ribBottom=top-(.95+2.25+.32),deckUnderside=top-.20;
  for(const endSide of [-1,1])for(const railSide of [-1,1]){
    const x=bridge.position.x+endSide*half,z=bridgeZ+railSide*(deckWidth/2+.08);
    const support=new T.Group();support.name='overhead-end-support';
    support.position.set(x,(ribBottom+deckUnderside)/2,z);root.add(support);
    const column=new T.Mesh(new T.BoxGeometry(.16,deckUnderside-ribBottom,.16),iron);
    column.castShadow=true;column.receiveShadow=true;support.add(column);
    const collar=new T.Mesh(new T.BoxGeometry(.23,.15,.20),brass);
    collar.position.y=-(deckUnderside-ribBottom)/2+.14;support.add(collar);
    const cleat=new T.Mesh(new T.BoxGeometry(.22,.18,.20),brass);
    cleat.position.set(0,-(deckUnderside-ribBottom)/2+.15,-railSide*.08);
    support.add(cleat);
  }
  function instances(name,geometry,material,matrices){
    const o=new T.InstancedMesh(geometry,material,matrices.length);o.name=name;
    matrices.forEach((matrix,i)=>o.setMatrixAt(i,matrix));o.instanceMatrix.needsUpdate=true;
    o.castShadow=true;o.receiveShadow=true;root.add(o);
  }
  instances('second-floor-railing-posts',new T.CylinderGeometry(.04,.04,1.18,8),iron,postMatrices);
  instances('second-floor-post-collars',new T.BoxGeometry(.13,.16,.13),brass,collarMatrices);
  root.userData.connection={deckHeight:top,innerRadius:inner,outerRadius:outer,
    halfBridgeSpan:half,bridgeZ,bridgeWidth:deckWidth,centerZ,innerRail,gap:[low,high]};
  return root;
}
