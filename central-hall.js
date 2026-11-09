// Real 3D masonry visible beyond the central passage between the galleries.
// Positions are local to the passage; the existing building, pier, floors and
// visitor boundaries remain authoritative.
export function addCentralHall({T,scene,frontLayout,stone,paleStone,darkStone,metal,brass}){
  if(!frontLayout)return null;
  const passage=scene.getObjectByName('central-open-passage');
  if(!passage)return null;
  const hall=new T.Group();
  hall.name='central-hall-3d';
  passage.add(hall);
  function box(parent,name,w,h,d,x,y,z,material){
    const o=new T.Mesh(new T.BoxGeometry(w,h,d),material);
    o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  // The existing floor ends behind the entrance. This extends it only in the
  // far background and shares the same floor finish as the atrium.
  box(hall,'central-hall-floor',10,.24,12,0,-.12,-18,stone);

  const specs=[
    {z:-6.5, width:4.8, spring:4.2, depth:.48},
    {z:-10.3,width:5.1, spring:4.15,depth:.55},
    {z:-14.7,width:5.3, spring:4.35,depth:.62},
    {z:-19.0,width:5.0, spring:4.25,depth:.54},
    {z:-23.0,width:4.7, spring:4.1, depth:.50}
  ];
  for(const [i,spec] of specs.entries()){
    const {width,spring,depth,z}=spec, r=width/2, thick=.42;
    const frame=new T.Group();frame.name='central-hall-arch-'+i;
    frame.position.z=z;hall.add(frame);
    const ring=new T.Shape();
    ring.absarc(0,spring,r+thick,0,Math.PI,false);
    ring.lineTo(-r,spring);
    ring.absarc(0,spring,r,Math.PI,0,true);
    ring.closePath();
    const crown=new T.Mesh(new T.ExtrudeGeometry(ring,{depth,bevelEnabled:false,curveSegments:24}),i%3===1?paleStone:stone);
    crown.name='central-hall-vault';crown.position.z=-depth/2;
    crown.castShadow=true;crown.receiveShadow=true;frame.add(crown);
    for(const side of [-1,1]){
      const x=side*(r+thick/2);
      box(frame,'central-hall-pier',thick,spring,depth,x,spring/2,0,stone);
      box(frame,'central-hall-pier-foot',thick+.22,.22,depth+.16,x,.11,0,paleStone);
      box(frame,'central-hall-capital',thick+.16,.18,depth+.14,x,spring-.09,0,paleStone);
    }
  }
  // Side reveals run into the depth between the stone arches; the centre
  // remains open and the sides stay clear of the existing central pier.
  for(const side of [-1,1]){
    box(hall,'central-hall-side-reveal',.24,6.4,17.4,side*3.16,3.2,-15.7,darkStone);
  }
  // Fine structural edges, not a painted backdrop. The centre remains open.
  for(const side of [-1,1]){
    for(const z of [-9.5,-16.0,-22.3]){
      box(hall,'central-hall-side-pilaster',.34,5.8,.54,side*3.45,2.9,z,darkStone);
      box(hall,'central-hall-metal-band',.40,.10,.60,side*3.45,4.6,z,brass);
    }
  }
  // Modest local practical lights. The masonry still responds to the site's
  // existing sun, fog and time-of-day controls.
  const lamp=new T.MeshStandardMaterial({color:'#d9a866',emissive:'#ffb953',emissiveIntensity:1.3,roughness:.8});
  for(const side of [-1,1]){
    for(const z of [-10.3,-19]){
      box(hall,'central-hall-lantern-base',.24,.07,.22,side*3.0,.18,z,brass);
      const glow=box(hall,'central-hall-lantern',.12,.35,.12,side*3.0,.4,z,lamp);
      glow.castShadow=false;
    }
  }
  const light=new T.PointLight('#ffce8d',8,10,2);
  light.name='central-hall-warm-light';light.position.set(0,3,-13.5);hall.add(light);
  return hall;
}
