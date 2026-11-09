// Foreground terrace, an open lower level and a walkable lateral staircase.
export const PIT={left:-9.6,right:5.4,near:12.5,far:6.2,stairRight:-6.2,depth:4.2};
export function addLevels({T,scene,mesh,box,pipe,stone,paleStone,darkStone,metal,brass,mint}){
const {left,right,near,far,stairRight,depth}=PIT,steps=18,tread=(near-far)/steps,rise=depth/steps;
const shape=new T.Shape();shape.moveTo(-21,-23);shape.lineTo(21,-23);shape.lineTo(21,27);shape.lineTo(-21,27);shape.closePath();
const hole=new T.Path();hole.moveTo(left,-near);hole.lineTo(left,-far);hole.lineTo(right,-far);hole.lineTo(right,-near);hole.closePath();shape.holes.push(hole);
const terrace=mesh(new T.ExtrudeGeometry(shape,{depth:.7,bevelEnabled:false}),stone,0,-.7,0);terrace.rotation.x=-Math.PI/2;terrace.name='terrace-with-open-void';
box(19,.45,10,-2,-depth-.225,9.1,darkStone).name='lower-floor';
// Real masonry underneath the upper terrace, with arches opening into recesses.
function undercroft(x,z){const w=3.8,h=depth-.25,r=1.3,spring=1.65,s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(-r,0);s.lineTo(-r,spring);s.absarc(0,spring,r,Math.PI,0,true);s.lineTo(r,0);s.lineTo(w/2,0);s.lineTo(w/2,h);s.lineTo(-w/2,h);s.closePath();mesh(new T.ExtrudeGeometry(s,{depth:.65,bevelEnabled:false,curveSegments:20}),paleStone,x,-depth,z-.325);box(w,h,.3,x,-depth+h/2,z-1.7,darkStone);}
for(const x of [-4.3,-.4,3.5])undercroft(x,far-.1);
box(.65,depth,near-far,left-.325,-depth/2,(near+far)/2,darkStone);box(.65,depth,near-far,right+.325,-depth/2,(near+far)/2,darkStone);box(right-left,.55,.7,(left+right)/2,-.275,near+.35,paleStone);
for(let i=0;i<steps;i++){const z=near-(i+.5)*tread,top=-(i+1)*rise;const step=box(stairRight-left-.16,.18,tread+.012,(left+stairRight)/2,top-.09,z,paleStone);step.name='stair-'+i;pipe([left+.12,top+.01,z-tread/2+.035],[stairRight-.12,top+.01,z-tread/2+.035],.012,brass);}
// Low parapets guard the overlook; a gap on the left is the top of the staircase.
const ledgeLeft=stairRight+.1;box(right-ledgeLeft,.82,.48,(right+ledgeLeft)/2,.41,near+.28,stone);box(right-ledgeLeft,.12,.65,(right+ledgeLeft)/2,.88,near+.28,paleStone);
for(const x of [right+.2,left-.2]){pipe([x,.95,near],[x,.95,far],.045,brass);for(let z=far;z<=near;z+=1.2)pipe([x,.02,z],[x,.95,z],.035,metal);}
for(const x of [left+.12,stairRight-.12]){pipe([x,1.05,near],[x,-depth+1.05,far],.04,brass);for(let i=0;i<=steps;i+=3){const z=near-i*tread,y=-i*rise;pipe([x,y,z],[x,y+1.05,z],.03,metal);}}
for(const x of [-4.3,3.5]){const l=new T.PointLight('#e9b16d',5,6);l.position.set(x,-2.4,far+.4);scene.add(l);box(.1,.5,.1,x,-2.5,far+.15,mint,scene,false);}
function inside(x,z){return x>left&&x<right&&z>far&&z<near;}
function floorHeight(x,z){if(!inside(x,z))return 0;if(x<stairRight){const n=Math.min(steps-1,Math.floor((near-z)/tread));return -(n+1)*rise;}return -depth;}
function canWalk(x,z,currentHeight){const target=floorHeight(x,z);if((target<-.1||currentHeight<-.55)&&Math.abs(target-currentHeight)>.56)return false;if(z>near-.12&&z<near+.65&&x>ledgeLeft-.2&&x<right+.45)return false;return true;}
return {terrace,floorHeight,canWalk,pit:PIT};
}
