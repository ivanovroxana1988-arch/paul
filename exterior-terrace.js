// An open-air stone terrace outside the north-facing ground-floor arch.
export function addExteriorTerrace({T,scene,mesh,box,stone,paleStone,darkStone}){
 const root=new T.Group();root.name='bucharest-outdoor-terrace';scene.add(root);
 // A continuous angled approach links the central passage to the outer arch.
 const approach=new T.Shape();approach.moveTo(.8,17);approach.lineTo(2.8,17);approach.lineTo(6.5,31.8);approach.lineTo(4.5,31.8);approach.closePath();
 const walkway=mesh(new T.ExtrudeGeometry(approach,{depth:.28,bevelEnabled:false}),stone,0,-.26,0,root);
 walkway.rotation.x=-Math.PI/2;walkway.name='terrace-stone-approach';
 const deck=box(12,.28,8.6,6,-.12,-35.5,stone,root);deck.name='outdoor-terrace-paving';
 // The low, solid stone parapet and its broad coping echo the reference image.
 const parapet=box(12,.72,.55,6,.36,-39.55,stone,root);parapet.name='terrace-front-stone-parapet';
 const coping=box(12.12,.12,.72,6,.78,-39.55,paleStone,root);coping.name='terrace-parapet-stone-cap';
 for(const x of [0,12]){
  const side=box(.48,.72,6.2,x,.36,-36.2,stone,root);side.name='terrace-side-parapet';
  const cap=box(.62,.12,6.3,x,.78,-36.2,paleStone,root);cap.name='terrace-side-stone-cap';
 }
 // Shallow joints make the floor read as large weathered stone slabs.
 for(let x=1.5;x<12;x+=1.5){const joint=box(.018,.006,7.9,x,.023,-35.3,darkStone,root);joint.name='terrace-paving-joint';}
 for(let z=-38.8;z< -31.7;z+=1.5){const joint=box(11.8,.006,.018,6,.023,z,darkStone,root);joint.name='terrace-paving-joint';}
 function walkable(x,z){
   const t=(-z-17)/14.8;
   const onApproach=t>=0&&t<=1.04&&Math.abs(x-(1.8+3.7*Math.min(1,t)))<=.82;
   const onTerrace=x>=.35&&x<=11.65&&z>=-39.15&&z<=-31.2;
   return onApproach||onTerrace;
 }
 return {root,walkable};
}
