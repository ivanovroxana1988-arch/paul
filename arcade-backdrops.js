// A photographic backdrop, placed behind existing 3D openings. It does not
// replace architecture or collide with the visitor, artist, or sunlight rays.
export function addArcadeBackdrops({T,scene,frontLayout,loader=new T.TextureLoader()}) {
  const eligible=scene.children.filter(g=>g.name==='alcove-bay' && !(g.position.x < -16 && g.position.z > 0));
  const backdrops=[];
  loader.load('./assets/fundal-bolta.webp',texture=>{
    texture.colorSpace=T.SRGBColorSpace;
    texture.anisotropy=4;
    const material=new T.MeshBasicMaterial({map:texture,side:T.FrontSide,toneMapped:false});
    function place(parent,width,height,depth,name){
      const backdrop=new T.Mesh(new T.PlaneGeometry(width,height),material);
      backdrop.name=name;
      backdrop.position.set(0,height/2,depth);
      backdrop.castShadow=false;
      backdrop.receiveShadow=false;
      backdrop.userData.decorativeBackdrop=true;
      backdrop.raycast=()=>{};
      parent.add(backdrop);
      backdrops.push(backdrop);
    }
    // These are only the closed, unoccupied alcoves. The graffiti artist uses
    // the excluded alcove; rooms for SKIN, CANVAS, SPACE and MOTION are separate.
    for(const alcove of eligible)place(alcove,4.8,7.1,-1.94,'empty-arcade-backdrop');
  },undefined,()=>console.warn('Fundalul arcadelor nu a putut fi încărcat; păstrăm finisajul original.'));
  return backdrops;
}

