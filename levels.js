// Foreground terrace, glazed lower level and a walkable lateral staircase.
export const PIT={left:-9.6,right:5.4,near:12.5,far:6.2,stairRight:-6.2,depth:4.2};
export function addLevels({T,scene,mesh,box,pipe,stone,paleStone,darkStone,metal,brass,mint}){
const {left,right,near,far,stairRight,depth}=PIT,steps=18,tread=(near-far)/steps,rise=depth/steps;
// One continuous slab reaches the outer galleries and overlaps the exterior
// ground beneath the terrace. Shape y is the negative of world z after rotation.
const shape=new T.Shape();shape.moveTo(-27,-23);shape.lineTo(27,-23);shape.lineTo(27,32);shape.lineTo(-27,32);shape.closePath();
const hole=new T.Path();hole.moveTo(left,-near);hole.lineTo(left,-far);hole.lineTo(right,-far);hole.lineTo(right,-near);hole.closePath();shape.holes.push(hole);
const terrace=mesh(new T.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:false}),stone,0,-.7,0);terrace.rotation.x=-Math.PI/2;terrace.name='terrace-with-open-void';
box(19,.45,10,-2,-depth-.225,9.1,darkStone).name='lower-floor';
// Real masonry underneath the upper terrace, with arches opening into recesses.
function undercroft(x,z){
 const w=3.8,h=depth-.25,r=1.3,spring=1.65,s=new T.Shape();
 s.moveTo(-w/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);
 s.absarc(0,spring,r,Math.PI,0,true);
 s.lineTo(r,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();
 const arch=mesh(new T.ExtrudeGeometry(s,{depth:.65,bevelEnabled:false,curveSegments:20}),paleStone,x,-depth,z-.325);
 arch.name='lower-level-open-arch';
 // Do not put a solid panel behind the arch: this is the passage into the GLB basement.
}
for(const x of [-4.3,-.4,3.5])undercroft(x,far-.1);
box(.65,depth,near-far,left-.325,-depth/2,(near+far)/2,darkStone);box(.65,depth,near-far,right+.325,-depth/2,(near+far)/2,darkStone);
for(let i=0;i<steps;i++){const z=near-(i+.5)*tread,top=-(i+1)*rise;const step=box(stairRight-left-.16,.18,tread+.012,(left+stairRight)/2,top-.09,z,paleStone);step.name='stair-'+i;pipe([left+.12,top+.01,z-tread/2+.035],[stairRight-.12,top+.01,z-tread/2+.035],.012,brass);}
// The glass and its thin metal structure finish flush with the terrace.
// Leave the entire staircase strip open so the lower level is accessible.
const glass=new T.MeshStandardMaterial({color:'#c1e1de',metalness:.12,roughness:.16,transparent:true,opacity:.28,side:T.DoubleSide,depthWrite:false});
const glazing=box(right-stairRight,.10,near-far,(stairRight+right)/2,-.05,(near+far)/2,glass,scene,false);
glazing.name='walkable-glass-floor';glazing.castShadow=false;
const cols=5,rows=3;
for(let i=0;i<=cols;i++){
 const x=stairRight+(right-stairRight)*i/cols;
 const rail=box(.055,.05,near-far,x,-.025,(near+far)/2,metal,scene,false);
 rail.name='glass-floor-flush-frame';
}
for(let i=0;i<=rows;i++){
 const z=far+(near-far)*i/rows;
 const rail=box(right-stairRight,.05,.055,(stairRight+right)/2,-.025,z,metal,scene,false);
 rail.name='glass-floor-flush-frame';
}
for(const x of [-4.3,3.5]){const l=new T.PointLight('#e9b16d',5,6);l.position.set(x,-2.4,far+.4);scene.add(l);box(.1,.5,.1,x,-2.5,far+.15,mint,scene,false);}
function inside(x,z){return x>left&&x<right&&z>far&&z<near;}
// The imported basement extends behind the arched wall. Keep navigation on its
// own -4.2 m floor instead of snapping visitors back to ground level at z=far.
function basementPassable(x,z){
 // Open passage from the photographic basement to the new street-level
 // undercroft and city. The two side mural walls sit outside this lane.
 if(z<=-10.35&&z>=-42&&x>-16.9&&x<16.9){
  // Keep the row of existing y=0 slab supports solid at z=-29.
  for(const cx of [-17,-8.5,0,8.5,17]){
   if(Math.abs(z+29)<.52&&Math.abs(x-cx)<.52)return false;
  }
  return true;
 }
 if(x<=-11.3||x>=7.2||z<=-10.35||z>=13.45)return false;
 // The wall at z=far is structural. Cross it through the three existing arches.
 if(z>5.50&&z<6.55&&x>stairRight&&x<right
    &&![-4.3,-.4,3.5].some(cx=>Math.abs(x-cx)<1.10))return false;
 // Approximate occupied volumes in the GLB: sculptural core and mural partitions.
 if(x>-5.70&&x<1.75&&z>-7.05&&z< -3.25)return false;
 if(x>-6.85&&x< -5.97&&z>-3.95&&z<3.45)return false;
 if(x>5.78&&x<6.57&&z>-4.05&&z<3.70)return false;
 // The low-level steel columns also have a small collision footprint.
 for(const cx of [-6.35,0,6.35])for(const cz of [-7,0]){
  if(Math.abs(x-cx)<.35&&Math.abs(z-cz)<.35)return false;
 }
 return true;
}
// The same x/z area has two floors: the glass at ground level and the room
// below it. Current height disambiguates them while walking down the stairs.
function floorHeight(x,z,currentHeight=0){
 if(inside(x,z)){
  if(x<stairRight){const n=Math.min(steps-1,Math.max(0,Math.floor((near-z)/tread)));return -(n+1)*rise;}
  return currentHeight< -1?-depth:0;
 }
 return currentHeight< -depth/2&&basementPassable(x,z)?-depth:0;
}
function canWalk(x,z,currentHeight=0){const target=floorHeight(x,z,currentHeight);return Math.abs(target-currentHeight)<=.56;}
return {terrace,floorHeight,canWalk,basementPassable,pit:PIT};
}
