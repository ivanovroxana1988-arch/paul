// Layout proposal, not measured survey coordinates. Keep the pool circular and
// offset architectural branches independently. Source dimensions remain explicit.
export const referenceDimensions={walkwayClearWidth:1.5,poolWaterDiameter:10.5,poolRimWidth:.65,poolDepth:.18,archThickness:.8,leftArchOpening:6,leftArchHeight:7.8,centreLeftArchOpening:5.4,sculpture:[8.4,4.6,1.8]};
export function footprintOffset(angle){return 1.15*Math.sin(angle-.4)+.7*Math.cos(2*angle+.65)+.35*Math.sin(3*angle);}
export function applyAsymmetricStudy({T,model,architecture,rooms,upperParts,roof,zones}){
const R=18.5,CZ=-1;
function shiftGroup(g){const r=Math.hypot(g.position.x,g.position.z-CZ);if(r<10)return;const a=Math.atan2(g.position.x,CZ-g.position.z),d=footprintOffset(a);g.position.x+=Math.sin(a)*d;g.position.z-=Math.cos(a)*d;g.userData.layoutRadius=r+d;}
architecture.children.forEach(shiftGroup);rooms.children.forEach(shiftGroup);
for(const z of zones){const d=footprintOffset(z.theta);z.position.x+=Math.sin(z.theta)*d;z.position.z-=Math.cos(z.theta)*d;}
for(const parent of [upperParts.structure,upperParts.windows])for(const g of parent.children)if(g.isGroup)shiftGroup(g);
// Curved surfaces follow the same uneven perimeter. No warp is applied to the
// circular pool, the reference figure, or the sculpture.
model.updateMatrixWorld(true);
for(const parent of [upperParts.walkways,roof]){parent.traverse(o=>{if(!o.isMesh)return;const g=o.geometry.clone(),p=g.attributes.position,inv=o.matrixWorld.clone().invert();for(let i=0;i<p.count;i++){const v=new T.Vector3().fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld),r=Math.hypot(v.x,v.z-CZ);if(r<.01)continue;const a=Math.atan2(v.x,CZ-v.z),weight=Math.min(1,Math.max(0,(r-2.7)/(R-2.7))),d=footprintOffset(a)*weight;v.x*=1+d/r;v.z=CZ+(v.z-CZ)*(1+d/r);v.applyMatrix4(inv);p.setXYZ(i,v.x,v.y,v.z);}p.needsUpdate=true;g.computeVertexNormals();g.computeBoundingSphere();o.geometry=g;});}
}
