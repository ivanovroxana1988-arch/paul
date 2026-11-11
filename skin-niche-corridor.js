// A view-only corridor in the narrow bay to the left of Skin.
// Dimensions and collision bounds are local to the Skin entrance.
export function addSkinNicheCorridor({T,root}) {
  const centerX=-5.55, halfWidth=1.5, spring=3.45, length=13.2, entrance=-.15;
  const group=new T.Group();
  group.name='skin-view-only-corridor';
  group.position.set(centerX,0,entrance);
  root.add(group);

  const wall=new T.MeshStandardMaterial({color:'#364b49',roughness:.96,metalness:.05,side:T.DoubleSide});
  const floor=new T.MeshStandardMaterial({color:'#48514a',roughness:.43,metalness:.25});
  const ribs=new T.MeshStandardMaterial({color:'#4d5550',roughness:.78,metalness:.42,side:T.DoubleSide});
  const trim=new T.MeshStandardMaterial({color:'#806e4c',roughness:.67,metalness:.72});
  const glow=new T.MeshBasicMaterial({color:'#39cdb9'});
  const warm=new T.MeshBasicMaterial({color:'#d9a46f'});
  function mesh(geometry,material,x=0,y=0,z=0){
    const o=new T.Mesh(geometry,material);o.position.set(x,y,z);
    o.castShadow=true;o.receiveShadow=true;group.add(o);return o;
  }
  function box(w,h,d,x,y,z,material){return mesh(new T.BoxGeometry(w,h,d),material,x,y,z);}
  const deck=box(halfWidth*2,.14,length,0,-.07,-length/2,floor);
  deck.name='niche-corridor-floor';
  for(const side of [-1,1]){
    box(.18,spring,length,side*(halfWidth+.09),spring/2,-length/2,wall);
    const strip=box(.045,.055,length-.45,side*(halfWidth-.14),.035,-length/2,glow);
    strip.name='niche-corridor-turquoise-floor-light';strip.castShadow=false;
    for(const z of [-2.6,-6.3,-10.0]){
      const light=new T.PointLight('#42d3c0',3.4,4.4,2);
      light.position.set(side*(halfWidth-.25),.38,z);group.add(light);
    }
  }
  // Continuous vaulted ceiling; the ribs sit beneath the shell.
  const positions=[],indices=[],segments=32;
  for(const z of [0,-length])for(let i=0;i<=segments;i++){
    const a=Math.PI*i/segments;
    positions.push(Math.cos(a)*halfWidth,spring+Math.sin(a)*halfWidth,z);
  }
  for(let i=0;i<segments;i++){
    const a=i,b=i+segments+1;indices.push(a,b,a+1,a+1,b,b+1);
  }
  const ceiling=new T.BufferGeometry();ceiling.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  ceiling.setIndex(indices);ceiling.computeVertexNormals();
  mesh(ceiling,wall).name='niche-corridor-vault';
  function arch(z){
    const s=new T.Shape();s.absarc(0,spring,halfWidth,0,Math.PI,false);
    s.lineTo(-halfWidth+.12,spring);s.absarc(0,spring,halfWidth-.12,Math.PI,0,true);s.closePath();
    const r=mesh(new T.ExtrudeGeometry(s,{depth:.18,bevelEnabled:false,curveSegments:24}),ribs,0,0,z);
    r.name='niche-corridor-arch';
    for(const side of [-1,1])box(.12,spring,.18,side*(halfWidth-.06),spring/2,z+.09,ribs);
  }
  for(const z of [-.2,-2.35,-4.5,-6.65,-8.8,-10.95,-13])arch(z);
  // Dark end wall with a small lit arched feature gives the tunnel a clear end.
  box(halfWidth*2,5.1,.18,0,2.55,-length-.12,wall);
  const door=new T.Shape(),r=.69;door.moveTo(-r,0);door.lineTo(r,0);door.lineTo(r,1.7);
  door.absarc(0,1.7,r,0,Math.PI,false);door.closePath();
  const end=mesh(new T.ShapeGeometry(door,24),warm,0,.05,-length+.02);end.name='niche-corridor-end-light';end.castShadow=false;
  for(const x of [-.7,0,.7])box(.055,2,.04,x,1,-length+.05,trim);
  for(let i=1;i<=8;i++)box(halfWidth*2,.015,.025,0,.009,-i*length/9,trim).castShadow=false;
  return {minX:centerX-halfWidth-.18,maxX:centerX+halfWidth+.18,nearZ:entrance+.30,farZ:entrance-length-.2};
}
