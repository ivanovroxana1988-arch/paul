// Furnish the extended Skin gallery in room-local coordinates.
// The wall finish and ink studies are procedural; the furniture is 3D geometry.
export function addSkinWorkstation({T,root}) {
 const group=new T.Group();group.name='skin-industrial-workstation';root.add(group);
 const mat=(color,roughness=.8,metalness=0)=>new T.MeshStandardMaterial({color,roughness,metalness});
 const iron=mat('#292e2e',.62,.48),edge=mat('#1b2020',.7,.36),wood=mat('#b18b61',.86),paper=mat('#e5dbc9'),glow=new T.MeshBasicMaterial({color:'#fff0d4'}),seat=mat('#303639',.68,.14);
 const mesh=(geo,m,x,y,z)=>{const o=new T.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;group.add(o);return o;};
 const box=(w,h,d,x,y,z,m)=>mesh(new T.BoxGeometry(w,h,d),m,x,y,z);
 function pipe(a,b,r,m){const av=new T.Vector3(...a),bv=new T.Vector3(...b),o=mesh(new T.CylinderGeometry(r,r,av.distanceTo(bv),8),m,0,0,0);o.position.copy(av.clone().add(bv).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),bv.sub(av).normalize());return o;}
 function canvasTexture(draw,w=1024,h=512){const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;draw(canvas.getContext('2d'),w,h);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=4;return texture;}
 const brick=canvasTexture((c,w,h)=>{c.fillStyle='#69534a';c.fillRect(0,0,w,h);let seed=17;const random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);for(let y=0;y<h;y+=34){for(let x=(Math.floor(y/34)%2?-64:0);x<w;x+=128){let n=Math.floor(random()*22);c.fillStyle=`rgb(${100+n},${65+n},${54+n})`;c.fillRect(x+2,y+2,124,29);for(let k=0;k<13;k++){c.fillStyle='rgba(220,190,160,.07)';c.fillRect(x+random()*125,y+random()*30,random()*25,1);}}}});
 const wall=mesh(new T.PlaneGeometry(16.3,5.6),new T.MeshStandardMaterial({map:brick,roughness:1,side:T.DoubleSide}),-3.58,3.15,-9.8);wall.rotation.y=Math.PI/2;wall.name='skin-brick-workstation-wall';
 // One continuous timber worktop, black drawer pedestals and handles.
 box(.86,.13,15.3,-3.08,1.1,-10.25,wood).name='skin-long-worktop';
 for(const z of [-17.35,-13.0,-8.6,-3.9]){box(.86,1.02,.94,-3.05,.55,z,iron);for(let j=0;j<4;j++){const y=.22+j*.23;box(.018,.018,.76,-2.61,y,z,edge);box(.036,.045,.24,-2.58,y+.1,z,mat('#a6a39a',.4,.7));}}
 // Original illustrative studies, framed along the wall above the desk.
 for(let k=0;k<10;k++){
  const image=canvasTexture((c,w,h)=>{c.fillStyle=k%3===0?'#d1c4af':'#e2ddd1';c.fillRect(0,0,w,h);c.strokeStyle=k%2?'#343b38':'#514942';c.lineWidth=3;for(let j=0;j<12;j++){c.beginPath();for(let i=0;i<120;i++){const t=i/119,angle=t*Math.PI*(3+k%3)+j*.18,r=(.08+.19*Math.sin(t*Math.PI))*(1+j*.02);const x=w*(.5+Math.sin(angle)*r),y=h*(.08+t*.84);i?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}},256,320);
  const z=-3.5-k*1.46,h=k%3===0?1.38:1.08,w=k%3===0?1.03:.83,y=2.6+(k%2)*.28;
  box(.10,h+.12,w+.12,-3.48,y,z,edge);const print=mesh(new T.PlaneGeometry(w,h),new T.MeshStandardMaterial({map:image,roughness:1,side:T.DoubleSide}),-3.415,y,z);print.rotation.y=Math.PI/2;
 }
 // Containers and tools on the worktop.
 for(let i=0;i<16;i++){const z=-3.3-i*.91;mesh(new T.CylinderGeometry(.105,.08,.25,12),i%2?iron:paper,-3.11,1.285,z);for(let j=0;j<3;j++)pipe([-3.11+(j-1)*.035,1.36,z],[-3.11+(j-1)*.055,1.71+(j%2)*.12,z+.025],.012,wood);}
 // Two desk chairs, tucked to the wall so the center of the room stays clear.
 const colliders=[{minX:-3.7,maxX:-2.35,minZ:-18.1,maxZ:-2.5}];
 for(const z of [-15.3,-10.2,-5.25]){
  mesh(new T.CylinderGeometry(.08,.08,.65,12),iron,-2.15,.37,z);box(.72,.13,.68,-2.15,.77,z,seat);box(.12,.8,.68,-2.48,1.22,z,seat);
  for(let i=0;i<5;i++){const a=i*Math.PI*2/5;pipe([-2.15,.07,z],[-2.15+Math.cos(a)*.42,.06,z+Math.sin(a)*.42],.035,iron);}
  colliders.push({minX:-2.57,maxX:-1.72,minZ:z-.43,maxZ:z+.43});
 }
 // Industrial pendant lights and ceiling pipe, as in the reference.
 pipe([-3.1,7.3,-2.3],[-3.1,7.3,-18.1],.055,iron);
 for(const z of [-3.8,-7.4,-11,-14.6,-17.7]){pipe([-3.1,7.3,z],[-3.1,6.35,z],.022,edge);mesh(new T.ConeGeometry(.43,.42,20,1,true),iron,-3.1,6.14,z);const lamp=mesh(new T.CircleGeometry(.33,20),glow,-3.1,5.93,z);lamp.rotation.x=-Math.PI/2;const light=new T.PointLight('#ffd9a7',10,7,2);light.position.set(-2.75,5.8,z);group.add(light);}
 return {colliders};
}
