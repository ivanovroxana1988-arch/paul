// The exterior terrain follows the former basement floor, now the site's street grade.
// It is separate from the architectural slab at y=0: that slab becomes an upper-level terrace.
// Its hole prevents ground material from covering the photographed basement floor.
import {CITY_GRADE_Y} from './city-layout.js?v=3';

export function addExteriorStreetGrade({T,scene,stone,darkStone}){
  const root=new T.Group();
  root.name='new-street-grade-at-basement-level';
  scene.add(root);

  // X/Z footprint of the exterior plot. Shape uses (x,-z) because it is rotated
  // into the horizontal plane. City ground begins at z about -28.
  const shape=new T.Shape();
  shape.moveTo(-58,30);
  shape.lineTo(58,30);
  shape.lineTo(58,-70);
  shape.lineTo(-58,-70);
  shape.closePath();

  // Remove only the actual GLB floor footprint, not the entire building envelope.
  // The old oversized 52m cavity produced a huge blue void below the columns.
  // GLB photo floor spans x=-13.8..13.8, z=-10.6..13.5.
  // Slight overlap lies BELOW the GLB photo and hides the seam.
  const cavity=new T.Path();
  cavity.moveTo(-13.70,10.50);
  cavity.lineTo(-13.70,-13.42);
  cavity.lineTo(13.70,-13.42);
  cavity.lineTo(13.70,10.50);
  cavity.closePath();
  shape.holes.push(cavity);

  const groundMaterial=new T.MeshStandardMaterial({
    color:'#77766d', roughness:1, metalness:0, side:T.DoubleSide,
  });
  const grade=new T.Mesh(new T.ShapeGeometry(shape),groundMaterial);
  grade.name='site-ground-at-new-street-level';
  grade.rotation.x=-Math.PI/2;
  // Close to the city terrain at y=grade+.02 but just below GLB photo at grade+.03.
  grade.position.y=CITY_GRADE_Y+.014;
  grade.receiveShadow=false;
  grade.castShadow=false;
  root.add(grade);

  // The existing y=0 floor is now elevated over the street. Continue a small
  // set of perimeter structural supports down to grade, leaving passages open
  // rather than closing the new ground floor with artificial solid walls.
  const supportMaterial=darkStone.clone();
  supportMaterial.color.set('#8b8479');
  const supportGeometry=new T.BoxGeometry(.66,-CITY_GRADE_Y,.66);
  const supports=new T.Group();
  supports.name='old-parter-slab-to-street-supports';
  for(const x of [-25.9,25.9])for(const z of [-29,-19,-9,1,11,21]){
    const p=new T.Mesh(supportGeometry,supportMaterial);
    p.position.set(x,CITY_GRADE_Y/2,z);
    p.castShadow=false;
    p.receiveShadow=true;
    supports.add(p);
  }
  for(const z of [-29,22])for(const x of [-17,-8.5,0,8.5,17]){
    const p=new T.Mesh(supportGeometry,supportMaterial);
    p.position.set(x,CITY_GRADE_Y/2,z);
    p.castShadow=false;p.receiveShadow=true;
    supports.add(p);
  }
  root.add(supports);
  root.userData.streetY=CITY_GRADE_Y;
  root.userData.upperParterY=0;
  return {root,grade,supports,streetY:CITY_GRADE_Y};
}
