// Walkable helical stair joining the gallery at 9.95 to the overhead bridge.
export function addPlatformStairs({T,scene,metal,brass}){
 const root=new T.Group();root.name='gallery-to-bridge-stairs';scene.add(root);
 const cx=-18,cz=-8,radius=3,width=1.5,bottom=9.95,top=24.65,turns=3,steps=90;
 const angle=t=>-t*turns*Math.PI*2;
 function point(t,r=radius,yOffset=0){const a=angle(t);return new T.Vector3(cx+Math.cos(a)*r,bottom+(top-bottom)*t+yOffset,cz+Math.sin(a)*r);}
 const tread=new T.InstancedMesh(new T.BoxGeometry(width,.14,.69),metal,steps),dummy=new T.Object3D();tread.name='spiral-stair-treads';tread.castShadow=true;tread.receiveShadow=true;
 for(let i=0;i<steps;i++){
  const t=(i+.5)/steps,a=angle(t),p=point(t, radius,-.07);
  dummy.position.copy(p);dummy.rotation.set(0,-a,0);dummy.updateMatrix();tread.setMatrixAt(i,dummy.matrix);
 }
 tread.instanceMatrix.needsUpdate=true;root.add(tread);
 // A continuous mast and narrow spiral stringers carry the individual treads.
 const mast=new T.Mesh(new T.CylinderGeometry(.15,.20,top,12),metal);mast.name='spiral-stair-support';mast.position.set(cx,top/2,cz);mast.castShadow=true;root.add(mast);
 for(const rr of [radius-width/2+.08,radius+width/2-.08]){
  const rail=[];for(let i=0;i<=steps*2;i++)rail.push(point(i/(steps*2),rr,1.05));
  const handrail=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rail),steps*2,.045,6,false),brass);handrail.name='spiral-stair-handrail';handrail.castShadow=true;root.add(handrail);
  const string=[];for(let i=0;i<=steps*2;i++)string.push(point(i/(steps*2),rr,-.18));
  const beam=new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(string),steps*2,.09,6,false),metal);beam.name='spiral-stair-stringer';beam.castShadow=true;root.add(beam);
  for(let i=1;i<steps;i+=3){const p=point(i/steps,rr,.5),post=new T.Mesh(new T.CylinderGeometry(.035,.035,1,6),metal);post.position.copy(p);root.add(post);}
 }
 const samples=[];for(let i=0;i<=180;i++)samples.push(point(i/180,radius,1.85));
 return {root,samples,start:samples[0].clone(),end:samples.at(-1).clone(),top};
}
