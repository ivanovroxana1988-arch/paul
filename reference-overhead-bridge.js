// Overhead arched steel bridge, kept at the existing bridge position.
// Everything here is 3D geometry; dimensions are scene metres.
export function addReferenceOverheadBridge({T,parent}){
  const root=new T.Group();root.name='reference-overhead-bridge';parent.add(root);
  const half=15,deckWidth=1.50,curve=.62,sections=48;
  function centerZ(x){const u=x/half;return -curve*(1-u*u);}
  // Lightly mottled metal, compatible with the gallery's warm industrial finish.
  const size=128,pixels=new Uint8Array(size*size*4);let seed=98643;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    seed=(1664525*seed+1013904223)>>>0;
    const n=seed/4294967296,cloud=(Math.sin(x*.12)+Math.cos(y*.09)+Math.sin((x+y)*.065))/3;
    const rust=Math.max(0,cloud-.12)*.25,base=82+cloud*8+(n-.5)*14,p=(y*size+x)*4;
    pixels[p]=base+rust*70;pixels[p+1]=base*.88+rust*23;pixels[p+2]=base*.72;pixels[p+3]=255;
  }
  const map=new T.DataTexture(pixels,size,size,T.RGBAFormat);map.colorSpace=T.SRGBColorSpace;
  map.wrapS=map.wrapT=T.RepeatWrapping;map.repeat.set(.35,.35);map.needsUpdate=true;
  map.magFilter=T.LinearFilter;map.minFilter=T.LinearMipmapLinearFilter;map.generateMipmaps=true;
  const iron=new T.MeshStandardMaterial({map,color:'#f0dcca',metalness:.58,roughness:.70});
  const brass=new T.MeshStandardMaterial({color:'#a0804c',metalness:.65,roughness:.58});
  const dark=new T.MeshStandardMaterial({color:'#3e403a',metalness:.67,roughness:.77});

  // Four vertices per section: top/bottom at each side, forming a closed
  // gently curved solid band instead of a flat image or separate cards.
  function band(name,side,thickness,topAt,bottomAt,material){
    const vertices=[],uv=[],indices=[];
    for(let i=0;i<=sections;i++){
      const x=-half+2*half*i/sections,z=centerZ(x)+side,t=topAt(x),b=bottomAt(x);
      vertices.push(x,t,z-thickness/2,x,b,z-thickness/2,x,t,z+thickness/2,x,b,z+thickness/2);
      uv.push(i/sections,0,i/sections,1,i/sections,0,i/sections,1);
    }
    for(let i=0;i<sections;i++){
      const a=i*4,b=a+4;
      indices.push(a,b,a+2,b,b+2,a+2,a+1,a+3,b+1,b+1,a+3,b+3);
      indices.push(a,a+1,b,a+1,b+1,b,a+2,b+2,a+3,a+3,b+2,b+3);
    }
    indices.push(0,2,1,1,2,3);const e=sections*4;indices.push(e,e+1,e+2,e+1,e+3,e+2);
    // Flip winding so the deck's top faces upward and the support sides face out.
    for(let i=0;i<indices.length;i+=3){const v=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=v;}
    const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    const o=new T.Mesh(geometry,material);o.name=name;o.castShadow=true;o.receiveShadow=true;root.add(o);return o;
  }
  band('overhead-deck-1-5m',0,deckWidth,()=>0,()=>-.20,iron);
  for(const side of [-1,1]){
    band('overhead-side-girder',side*.69,.12,()=>-.17,()=>-.87,iron);
    // An actual arched web beneath each edge: raised at its centre and lower
    // at the ends, joined by visible vertical stiffeners.
    const upper=x=>-.95-2.25*(x/half)**2;
    band('overhead-curved-support',side*.66,.14,upper,x=>upper(x)-.32,iron);
    for(const h of [.58,1.16]){
      const pts=[];for(let i=0;i<=36;i++){const x=-half+2*half*i/36;pts.push(new T.Vector3(x,h,centerZ(x)+side*.69));}
      const rail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,h>1?.05:.035,6,false),iron);
      rail.name='overhead-railing';rail.castShadow=true;root.add(rail);
    }
  }
  const scratch=new T.Object3D(),postMatrices=[],braceMatrices=[],clampMatrices=[],rivetMatrices=[],seamMatrices=[];
  function at(x,y,z,rx=0,ry=0,rz=0){
    scratch.position.set(x,y,z);scratch.rotation.set(rx,ry,rz);scratch.scale.set(1,1,1);scratch.updateMatrix();return scratch.matrix.clone();
  }
  for(const side of [-1,1]){
    for(let i=0;i<=24;i++){
      const x=-half+i*30/24,z=centerZ(x)+side*.69;
      postMatrices.push(at(x,.58,z));clampMatrices.push(at(x,.58,z));
    }
    for(let i=0;i<=14;i++){
      const x=-14+i*2,arch=-.95-2.25*(x/half)**2,gap=(-.87)-arch;
      if(gap>.04)braceMatrices.push({matrix:at(x,(arch-.87)/2,centerZ(x)+side*.66),height:gap});
    }
    for(let i=0;i<=30;i++){
      const x=-half+i,z=centerZ(x)+side*.76;
      for(const y of [-.32,-.70])rivetMatrices.push(at(x,y,z,Math.PI/2));
    }
  }
  for(let i=0;i<=36;i++){
    const x=-half+i*30/36,slope=2*curve*x/(half*half);
    seamMatrices.push(at(x,.01,centerZ(x),0,-Math.atan(slope),0));
  }
  function instances(name,geometry,material,matrices,shadow=true){
    const o=new T.InstancedMesh(geometry,material,matrices.length);o.name=name;
    matrices.forEach((matrix,i)=>o.setMatrixAt(i,matrix));o.instanceMatrix.needsUpdate=true;
    o.castShadow=shadow;o.receiveShadow=true;root.add(o);return o;
  }
  instances('overhead-rail-posts',new T.CylinderGeometry(.035,.035,1.16,8),iron,postMatrices);
  instances('overhead-brass-collars',new T.BoxGeometry(.14,.15,.14),brass,clampMatrices);
  instances('overhead-rivets',new T.CylinderGeometry(.022,.022,.018,8),brass,rivetMatrices,false);
  instances('overhead-deck-seams',new T.BoxGeometry(.025,.018,1.42),dark,seamMatrices,false);
  // Braces use per-instance scale to span between the curved support and deck.
  const braceGeometry=new T.BoxGeometry(.09,1,.12),braceList=[];
  for(const item of braceMatrices){
    const p=new T.Vector3(),q=new T.Quaternion(),s=new T.Vector3();item.matrix.decompose(p,q,s);s.y=item.height;
    braceList.push(new T.Matrix4().compose(p,q,s));
  }
  instances('overhead-arch-stiffeners',braceGeometry,iron,braceList);
  // Two subtle practical lamps keep the bridge legible at night while the
  // existing solar simulation continues to determine daylight and shadows.
  const lampMat=new T.MeshStandardMaterial({color:'#e1b36d',emissive:'#ffb45e',emissiveIntensity:.9});
  for(const x of [-13,13]){
    const lamp=new T.Mesh(new T.SphereGeometry(.10,10,8),lampMat);
    lamp.name='overhead-practical-lamp';lamp.position.set(x,-1.02,centerZ(x)+.72);root.add(lamp);
    const light=new T.PointLight('#ffbf78',7,8,2);light.position.copy(lamp.position);light.name='overhead-practical-light';root.add(light);
  }
  root.userData.dimensions={span:30,clearDeckWidth:deckWidth,planCurve:curve};
  return root;
}
