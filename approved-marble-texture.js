// Paul marble study: the same image and inferred maps as the separate material lab.
// Maps are inferred from albedo; they are artistic approximations, not measured PBR scans.
export function applyApprovedMarble({T,scene,stone,paleStone,darkStone}) {
 const img=new Image();
 img.onload=()=>{
  try {
   const size=768,albedo=document.createElement('canvas');albedo.width=albedo.height=size;
   const context=albedo.getContext('2d',{willReadFrequently:true});context.drawImage(img,0,0,size,size);
   const pixels=context.getImageData(0,0,size,size),height=document.createElement('canvas'),rough=document.createElement('canvas');
   height.width=rough.width=size;height.height=rough.height=size;
   const hc=height.getContext('2d'),rc=rough.getContext('2d'),hi=hc.createImageData(size,size),ri=rc.createImageData(size,size);
   for(let i=0;i<pixels.data.length;i+=4){
    const l=.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2];
    const h=Math.max(0,Math.min(255,128+(l-143)*1.7)),r=Math.max(165,Math.min(247,213+(143-l)*.32));
    for(let c=0;c<3;c++){hi.data[i+c]=h;ri.data[i+c]=r;}hi.data[i+3]=ri.data[i+3]=255;
   }
   hc.putImageData(hi,0,0);rc.putImageData(ri,0,0);
   const offsets=[[.08,.04],[.49,.83],[1.11,.31],[.73,1.28],[1.52,.76]];
   const maps=offsets.map(([x,y])=>{
    const texture=(source,color)=>{const t=new T.CanvasTexture(source);t.wrapS=t.wrapT=T.MirroredRepeatWrapping;t.repeat.set(.48,.48);t.offset.set(x,y);t.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;return t;};
    return {map:texture(albedo,true),bumpMap:texture(height,false),roughnessMap:texture(rough,false)};
   });
   const originals=[stone,paleStone,darkStone],variants=new Map();
   for(const base of originals){
    variants.set(base,maps.map(map=>{
     const material=base.clone();Object.assign(material,map,{bumpScale:.12,roughness:.85,metalness:0});
     // Values correspond to the material lab's initial, user-visible defaults.
     if(base===darkStone)material.color.setRGB(.70,.72,.67);else material.color.setRGB(1,.97,.90);
     material.needsUpdate=true;return material;
    }));
   }
   // Reuse five offsets per color family: adjacent blocks do not restart at the same part of the image.
   let index=0;scene.traverse(object=>{if(!object.isMesh||Array.isArray(object.material))return;const choices=variants.get(object.material);if(!choices)return;object.material=choices[(index++ * 3 + 1)%choices.length];});
  }catch(error){console.warn('Textura de marmură nu a putut fi aplicată; rămâne materialul inițial.',error);}
 };
 img.onerror=()=>console.warn('Textura de marmură nu a putut fi încărcată; rămâne materialul inițial.');
 img.src='./assets/marmura-albedo.png';
}
