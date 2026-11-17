// Urban Undercroft Gallery: open side mural walls, readable floor and small props.
// The city-facing axis remains completely open. All geometry sits below the
// original y=0 slab and does NOT replace the imported basement GLB or glass.
import {CITY_GRADE_Y} from './city-layout.js?v=3';

export function addUrbanUndercroft({T,scene,ground}){
  const root=new T.Group();
  root.name='urban-undercroft-gallery';
  scene.add(root);
  const y=CITY_GRADE_Y;
  let seed=241;
  const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
  const box=(name,w,h,d,x,cy,z,mat)=>{
    const m=new T.Mesh(new T.BoxGeometry(w,h,d),mat);
    m.name=name;m.position.set(x,cy,z);
    m.receiveShadow=true;m.castShadow=false;root.add(m);return m;
  };

  // Retain the city-grade mesh as the SINGLE large ground surface. This worn,
  // repeatable concrete texture replaces the featureless flat gray fill.
  const floorCanvas=document.createElement('canvas');
  floorCanvas.width=floorCanvas.height=512;
  const f=floorCanvas.getContext('2d');
  f.fillStyle='#77766e';f.fillRect(0,0,512,512);
  for(let i=0;i<18500;i++){
    const v=65+Math.floor(rnd()*90);
    f.fillStyle='rgba('+v+','+(v-3)+','+(v-8)+','+(.02+rnd()*.11)+')';
    const sz=.4+rnd()*2.5;
    f.fillRect(rnd()*512,rnd()*512,sz,sz);
  }
  f.strokeStyle='rgba(32,31,30,.13)';f.lineWidth=2;
  for(const n of [0,256,511]){
    f.beginPath();f.moveTo(n,0);f.lineTo(n,512);f.stroke();
    f.beginPath();f.moveTo(0,n);f.lineTo(512,n);f.stroke();
  }
  const floorMap=new T.CanvasTexture(floorCanvas);
  floorMap.colorSpace=T.SRGBColorSpace;
  floorMap.wrapS=floorMap.wrapT=T.RepeatWrapping;
  floorMap.repeat.set(.105,.105);
  floorMap.anisotropy=4;
  ground.material.map=floorMap;
  ground.material.color.set('#c3c1bd');
  ground.material.needsUpdate=true;
  ground.userData.concreteRepaired=true;

  const concrete=new T.MeshStandardMaterial({color:'#575751',roughness:.98});
  const concreteEdge=new T.MeshStandardMaterial({color:'#68625d',roughness:.94});
  const steel=new T.MeshStandardMaterial({color:'#383d3d',metalness:.65,roughness:.62});
  const rusty=new T.MeshStandardMaterial({color:'#73564a',metalness:.33,roughness:.88});
  const pale=new T.MeshStandardMaterial({color:'#b8a995',roughness:.85});

  function muralTexture(name,colors,accent){
    const c=document.createElement('canvas');c.width=1024;c.height=512;
    const p=c.getContext('2d');
    p.fillStyle='#3a3b38';p.fillRect(0,0,1024,512);
    // Grain and old tags beneath the principal artwork.
    for(let i=0;i<2400;i++){
      const v=55+Math.floor(rnd()*80);
      p.fillStyle='rgba('+v+','+(v-8)+','+(v-12)+','+(.05+rnd()*.15)+')';
      p.fillRect(rnd()*1024,rnd()*512,1+rnd()*8,1+rnd()*4);
    }
    for(let i=0;i<90;i++){
      p.strokeStyle='rgba(210,208,193,'+(.04+rnd()*.11)+')';
      p.lineWidth=.6+rnd()*2;p.beginPath();
      const x=rnd()*1024,yy=rnd()*512;
      p.moveTo(x,yy);p.lineTo(x+30+rnd()*95,yy+(rnd()-.5)*50);p.stroke();
    }
    // Original abstract spray shapes, not photographs of other artists' work.
    p.lineCap='round';p.lineJoin='round';
    for(let i=0;i<21;i++){
      const x=-100+i*60+rnd()*65, yy=70+rnd()*380;
      p.strokeStyle=colors[i%colors.length];p.globalAlpha=.4+rnd()*.4;
      p.lineWidth=26+rnd()*48;p.beginPath();p.moveTo(x,yy);
      p.bezierCurveTo(x+100,yy-110,x+35,yy+100,x+160,yy-25);
      p.stroke();
    }
    p.globalAlpha=1;
    p.textAlign='center';p.textBaseline='middle';
    p.font='italic 900 155px Arial Black, sans-serif';
    p.lineWidth=24;p.strokeStyle='#151b1b';p.strokeText(name,515,275);
    p.lineWidth=10;p.strokeStyle='#eef0de';p.strokeText(name,515,275);
    p.fillStyle=accent;p.fillText(name,515,275);
    p.font='bold 24px Arial, sans-serif';p.fillStyle='#e5dfd1';
    p.fillText('P A U L   /   N I N J A . S Y S',510,414);
    for(let i=0;i<150;i++){
      const x=rnd()*1024,yy=rnd()*512;
      p.fillStyle=colors[i%colors.length];
      p.globalAlpha=.2+rnd()*.55;
      p.fillRect(x,yy,1+rnd()*4,1+rnd()*10);
    }
    p.globalAlpha=1;
    const tex=new T.CanvasTexture(c);
    tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;
    return tex;
  }

  function wall(side,tag,colors,accent){
    const x=side*20.7,z=-20.9,w=12.0,h=3.36;
    // Wall is parallel to travel toward the city, not across the exit axis.
    box('graffiti-concrete-side-wall-'+tag,.34,h,w,x,y+h/2,z,concrete);
    const muralMaterial=new T.MeshStandardMaterial({
      map:muralTexture(tag,colors,accent),roughness:.95,side:T.DoubleSide
    });
    const painting=new T.Mesh(new T.PlaneGeometry(11.4,2.72),muralMaterial);
    painting.name='original-graffiti-mural-'+tag;
    painting.position.set(x-side*.19,y+1.77,z);
    painting.rotation.y=side===-1?Math.PI/2:-Math.PI/2;
    painting.castShadow=false;painting.receiveShadow=true;root.add(painting);
    box('wall-grunge-base-'+tag,.42,.23,w+.12,x,y+.12,z,concreteEdge);
    const sconce=box('mural-wash-bar-'+tag,.18,.10,4.5,x-side*.32,y+3.06,z,steel);
    sconce.material=steel;
    const glow=box('mural-wash-glow-'+tag,.09,.035,4.1,x-side*.42,y+3.0,z,
      new T.MeshBasicMaterial({color:'#d9c3a5'}));
    glow.castShadow=false;
    const light=new T.PointLight(side===-1?'#ffd3a1':'#a6c7ce',3.6,13,2);
    light.name='urban-mural-light-'+tag;
    light.position.set(x-side*3.6,y+2.6,z);
    light.castShadow=false;root.add(light);
  }
  wall(-1,'NINJA',['#33a5a2','#dc697a','#e6b15e','#7e789a'],'#66d0c0');
  wall(1,'ARTSPACE',['#d27b49','#a74992','#499cbb','#ddbf72'],'#f5b56f');

  // Add visual details to the already present support posts; never move them.
  for(const x of [-17,17]){
    const band=box('painted-existing-column-base',.78,1.15,.78,x,y+.60,-29,
      new T.MeshStandardMaterial({color:x<0?'#327f80':'#9a4f66',roughness:.85}));
    band.userData.decorativeColumnSleeve=true;
    box('column-paint-dark-stripe',.81,.12,.81,x,y+1.11,-29,steel);
  }
  // Urban furniture stays at the edge of the gallery, outside the pedestrian
  // corridor. It carries no extra collision geometry.
  for(const side of [-1,1]){
    const x=side*22.8,z=-17.6;
    box('low-concrete-bench',3,.27,.73,x,y+.58,z,concreteEdge);
    for(const dz of [-.23,.23])
      box('bench-foot',.34,.48,.22,x+side*.8,y+.25,z+dz,concrete);
    for(let i=0;i<4;i++){
      const spray=new T.Mesh(new T.CylinderGeometry(.075,.075,.27,8),i%2?rusty:steel);
      spray.name='spray-can-prop';spray.position.set(x+(i-1.5)*.19,y+.155,z+.25);
      spray.castShadow=false;root.add(spray);
    }
  }
  // Soft under-slab lamps: no expensive shadow maps on mobile.
  const lampColor=new T.MeshBasicMaterial({color:'#f0c790'});
  for(const z of [-13.7,-25.1]){
    const bar=box('warm-overhead-industrial-lamp',4.8,.07,.18,0,-.84,z,lampColor);
    bar.castShadow=false;
    const light=new T.PointLight('#e2d4bf',3.5,15,2);
    light.position.set(0,-1.2,z);
    light.castShadow=false;root.add(light);
  }
  root.userData.pedestrianLane={minX:-16.4,maxX:16.4,minZ:-39,maxZ:-10.4};
  root.userData.streetGrade=y;
  return root;
}
