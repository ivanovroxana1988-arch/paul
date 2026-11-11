import {GLTFLoader} from './vendor/loaders/GLTFLoader.js';
import {InstancedMesh, Object3D, Color, MeshStandardMaterial, TextureLoader,
  PlaneGeometry, CircleGeometry, DoubleSide, SRGBColorSpace} from './vendor/three.module.js';
import {mergeGeometries} from './vendor/utils/BufferGeometryUtils.js';
import {CITY_OFFSET_Z,CITY_SCALE_XZ,CITY_SCALE_Y} from './city-layout.js?v=2';

// Map3D street centerlines and a compact set of trees/green spaces. Roads and
// foliage are independent of the building meshes and use only three draw calls.
export function addBucharestLandscape({scene}) {
  const scale=CITY_SCALE_XZ, offsetZ=CITY_OFFSET_Z;
  new GLTFLoader().load('./assets/oras-strazi.glb', gltf => {
    const roads=gltf.scene;
    roads.name='bucharest-streets';
    roads.scale.set(CITY_SCALE_XZ,CITY_SCALE_Y,CITY_SCALE_XZ);
    roads.position.set(0,0,offsetZ);
    roads.traverse(object=>{if(object.isMesh){object.castShadow=false;object.receiveShadow=false;}});
    scene.add(roads);
  }, undefined, error => console.warn('Nu s-au putut încărca străzile:', error));

  fetch('./assets/oras-copaci.json').then(response=>{
    if(!response.ok)throw new Error('Datele pentru vegetație nu sunt disponibile');
    return response.json();
  }).then(({trees,parks=[]})=>{
    // Sparse, varied clusters make the open lots legible as small green spaces.
    const greenery=new InstancedMesh(new CircleGeometry(1,12),
      new MeshStandardMaterial({color:'#ffffff',roughness:1}),parks.length);
    greenery.name='bucharest-green-spaces';
    const greens=['#657855','#6c7c59','#748267'];
    const temp=new Object3D(),color=new Color();
    parks.forEach(([x,z,rx,rz,tone],i)=>{
      temp.position.set(x*scale,.004,offsetZ+z*scale);
      temp.rotation.set(-Math.PI/2,0,(i*1.7)%6.28);
      temp.scale.set(rx*scale,rz*scale,1);temp.updateMatrix();
      greenery.setMatrixAt(i,temp.matrix);greenery.setColorAt(i,color.set(greens[tone%greens.length]));
    });
    greenery.instanceMatrix.needsUpdate=true;if(greenery.instanceColor)greenery.instanceColor.needsUpdate=true;
    greenery.castShadow=false;greenery.receiveShadow=false;scene.add(greenery);

    const allTrees=trees.slice();
    parks.forEach(([x,z,rx,rz,tone],i)=>{
      for(let j=0;j<3;j++) {
        const angle=i*2.17+j*2.09;
        allTrees.push([x+Math.cos(angle)*rx*.44,z+Math.sin(angle)*rz*.44,8+(i+j)%6,3+(j%2)*.5,(i+j+tone)%6]);
      }
    });
    // Two crossed, alpha-cut photographic planes give the trees natural leaf
    // silhouettes while the two faces share one instanced draw call.
    const treeTexture=new TextureLoader().load('./assets/arbore-oras-fotografic.png');
    treeTexture.colorSpace=SRGBColorSpace;treeTexture.anisotropy=4;
    const front=new PlaneGeometry(1,1);front.translate(0,.5,0);
    const side=front.clone();side.rotateY(Math.PI/2);
    const treeGeometry=mergeGeometries([front,side]);front.dispose();side.dispose();
    const treeMaterial=new MeshStandardMaterial({map:treeTexture,color:'#ffffff',
      side:DoubleSide,alphaTest:.36,roughness:1});
    const naturalTrees=new InstancedMesh(treeGeometry,treeMaterial,allTrees.length);
    naturalTrees.name='bucharest-trees';
    const foliage=['#ffffff','#f1f0e8','#e5e9dd','#f7f3e9','#e9ede5','#f2efe0'];
    allTrees.forEach(([x,z,h,r,tone],i)=>{
      const height=h*.15,width=Math.max(r*scale*2.25,height*.72);
      temp.position.set(x*scale,0,offsetZ+z*scale);temp.rotation.set(0,(i*.73)%Math.PI,0);
      temp.scale.set(width,height,width);temp.updateMatrix();naturalTrees.setMatrixAt(i,temp.matrix);
      naturalTrees.setColorAt(i,color.set(foliage[tone%foliage.length]));
    });
    naturalTrees.instanceMatrix.needsUpdate=true;if(naturalTrees.instanceColor)naturalTrees.instanceColor.needsUpdate=true;
    naturalTrees.computeBoundingSphere();naturalTrees.castShadow=false;naturalTrees.receiveShadow=false;scene.add(naturalTrees);
  }).catch(error=>console.warn('Nu s-a putut încărca vegetația:',error));
}
