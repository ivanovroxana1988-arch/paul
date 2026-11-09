import {applyApprovedMarble} from './approved-marble-texture.js?v=1';
import {applyFloorStone} from './floor-stone-material.js?v=2';
// Deterministic fallback maps. Geometry and navigation are unaffected.
export function makeSurfaceMaps(kind,size=512){
 let seed=kind==='stone'?839:kind==='marble'?973:147;const rnd=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
 const canvases=['color','roughness','height'].map(()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;});
 const [albedo,rough,height]=canvases.map(c=>c.getContext('2d'));const images=canvases.map(c=>c.getContext('2d').createImageData(size,size));
 const lattice=Array.from({length:64},()=>rnd());
 function noise(x,y){const u=x/size*8,v=y/size*8,ix=Math.floor(u),iy=Math.floor(v),a=u-ix,b=v-iy;const at=(i,j)=>lattice[((j+8)%8)*8+(i+8)%8];return (at(ix,iy)*(1-a)+at(ix+1,iy)*a)*(1-b)+(at(ix,iy+1)*(1-a)+at(ix+1,iy+1)*a)*b;}
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const n=noise(x,y),grain=rnd(),p=(y*size+x)*4;let rgb,r,h;
 if(kind==='marble'){
 // Periodic domain and layered cloudy veining keep the repeating material seamless.
 const tau=Math.PI*2,u=x/size*tau,v=y/size*tau;
 const warp=Math.sin(u*2+Math.sin(v*3)*.7)+Math.sin(v*2-u)*.65;
 const broad=Math.sin(u*3+v*2+warp*1.4),fine=Math.sin(u*7+v*5+warp*2.2);
 const vein=Math.pow(Math.max(0,1-Math.abs(broad+.12*fine)*9),3);
 const whiteVein=Math.pow(Math.max(0,1-Math.abs(Math.sin(u*2-v*3+warp))*18),3);
 const base=178+n*31+warp*4+(grain-.5)*12;
 const shade=base-vein*31+whiteVein*18;
 rgb=[shade*1.04,shade*.99,shade*.90];r=195+grain*26+vein*17;h=133+(n-.5)*18-vein*8+(grain-.5)*5;
 if(grain<.003){rgb=rgb.map(v=>v*.78);h=100;}
 }
 else if(kind==='stone'){const v=154+n*64+(grain-.5)*26;rgb=[v,v*.92,v*.79];r=216+grain*35;h=125+(n-.5)*45+(grain-.5)*28;if(grain<.012){rgb=rgb.map(v=>v*.5);h=55;}}
 else{const oxide=Math.max(0,(n-.4)*2.4),v=61+grain*18;rgb=[v+oxide*83,v+oxide*29,v-oxide*13];r=103+oxide*115+grain*22;h=112+oxide*45+grain*12;}
 for(let k=0;k<3;k++){images[0].data[p+k]=rgb[k];images[1].data[p+k]=r;images[2].data[p+k]=h;}images.forEach(im=>im.data[p+3]=255);}
 [albedo,rough,height].forEach((c,i)=>c.putImageData(images[i],0,0));
 if(kind==='stone')for(let i=0;i<16;i++){let x=rnd()*size,y=rnd()*size;for(const [c,col] of [[albedo,'#514c4055'],[height,'#343434'],[rough,'#fafafa']]){c.strokeStyle=col;c.lineWidth=.6+rnd();c.beginPath();c.moveTo(x,y);for(let j=0;j<7;j++)c.lineTo(x+=(rnd()-.48)*14,y+=rnd()*13);c.stroke();}}
 return {color:canvases[0],roughness:canvases[1],height:canvases[2]};
}
export function finishSurfaces({T,scene,stone,paleStone,darkStone,metal,brass,waterMat,roots}){
 const make=kind=>{const maps=makeSurfaceMaps(kind);return Object.fromEntries(Object.entries(maps).map(([key,canvas])=>{const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(kind==='stone'?2:1,kind==='stone'?2:1);t.colorSpace=key==='color'?T.SRGBColorSpace:T.NoColorSpace;t.anisotropy=4;return [key,t];}));};
 const originalStone=make('stone'),s=make('marble'),m=make('metal');
 // Keep the named walkable floors on the previous finish while architecture shares marble.
 const oldFloors=new Map();for(const mat of [stone,paleStone,darkStone]){const old=mat.clone();Object.assign(old,{map:originalStone.color,roughnessMap:originalStone.roughness,bumpMap:originalStone.height,bumpScale:.055,roughness:1});old.color.set(mat===darkStone?'#7d8177':mat===paleStone?'#f5e7d0':'#ded8c9');oldFloors.set(mat,old);}
 scene.traverse(o=>{if(o.isMesh&&(o.name==='terrace-with-open-void'||o.name==='lower-floor'||o.name.startsWith('stair-'))&&oldFloors.has(o.material))o.material=oldFloors.get(o.material);});
 // Replace only named floors after the texture loads; the original is the fallback.
 applyFloorStone({T,scene});
 for(const mat of [stone,paleStone,darkStone]){Object.assign(mat,{map:s.color,roughnessMap:s.roughness,bumpMap:s.height,bumpScale:.006,roughness:.94});mat.color.set(mat===darkStone?'#939b91':mat===paleStone?'#fff0d9':'#f1e8da');mat.needsUpdate=true;}
 // Install only after all existing walls and arches are present; keep the fallback if the image fails.
 applyApprovedMarble({T,scene,stone,paleStone,darkStone});
 for(const mat of [metal,brass]){Object.assign(mat,{map:m.color,roughnessMap:m.roughness,bumpMap:m.height,bumpScale:.018,roughness:mat===brass?.72:.95,metalness:mat===brass?.8:.65});mat.color.set(mat===brass?'#e5b46f':'#8c9692');mat.needsUpdate=true;}
 // Periodic normal field: a full wavelength at the texture edges prevents seams.
 const n=256,data=new Uint8Array(n*n*4);for(let y=0;y<n;y++)for(let x=0;x<n;x++){const p=(y*n+x)*4,a=x/n*Math.PI*2,b=y/n*Math.PI*2;const v=new T.Vector3(.22*Math.cos(a*4+b*3)+.08*Math.cos(a*11-b*7),.17*Math.sin(b*5-a*2),1).normalize();data[p]=(v.x*.5+.5)*255;data[p+1]=(v.y*.5+.5)*255;data[p+2]=(v.z*.5+.5)*255;data[p+3]=255;}
 const normal=new T.DataTexture(data,n,n);normal.wrapS=normal.wrapT=T.RepeatWrapping;normal.magFilter=T.LinearFilter;normal.minFilter=T.LinearMipmapLinearFilter;normal.generateMipmaps=true;normal.repeat.set(3,3);normal.needsUpdate=true;
 Object.assign(waterMat,{normalMap:normal,normalScale:new T.Vector2(.24,.24),metalness:.05,roughness:.12,ior:1.333,clearcoat:1,clearcoatRoughness:.08,envMapIntensity:1.65});waterMat.color.set('#225b54');waterMat.needsUpdate=true;
 // Local practical lights, without extra shadow maps.
 for(const root of roots)for(const side of [-1,1]){const lamp=new T.PointLight('#ffc47e',12,6,2);lamp.position.set(side*3.2,2,.8);root.add(lamp);const uplight=new T.PointLight('#35cdbb',9,8,2);uplight.position.set(side*2.7,.4,-5);root.add(uplight);}
 scene.environmentIntensity=.7;
 return {update(time){normal.offset.set(time*.006,time*.003);},maps:{stone:s,metal:m}};
}

