import * as T from '../vendor/three.module.js';

/**
 * Translate authored floor-plan points to the walkable ground-floor mesh.
 * A* never connects the last and first point by an unchecked straight line.
 */
export function createArtistRoute({scene,canWalk,floorHeight,data,showDebug=false}) {
 const raw=Array.isArray(data?.points)?data.points.filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.z)):[];
 if(raw.length<2)throw Error('Parter: sunt necesare cel putin doua puncte valide');
 const cell=.7,xMin=-20,zMin=-24,nx=61,nz=73;
 const id=(i,j)=>j*nx+i;
 const toCell=(x,z)=>[Math.round((x-xMin)/cell),Math.round((z-zMin)/cell)];
 const pos=(i,j)=>[xMin+i*cell,zMin+j*cell];
 const valid=new Uint8Array(nx*nz);
 for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
  const [x,z]=pos(i,j);
  const okay=canWalk(x,z,0)&&Math.abs(floorHeight(x,z))<.2;
  valid[id(i,j)]=okay?1:0;
 }
 function nearest(p){
  const [ix,jz]=toCell(p.x,p.z);let best=-1,bestD=Infinity;
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){
   const k=id(i,j);if(!valid[k])continue;
   const [x,z]=pos(i,j),d=(x-p.x)**2+(z-p.z)**2;
   if(d<bestD){bestD=d;best=k}
  }
  return {node:best,offset:Math.sqrt(bestD)};
 }
 function search(a,b){
  if(a===b)return[a];
  const count=nx*nz,dist=new Float64Array(count).fill(Infinity),parent=new Int32Array(count).fill(-1);
  const closed=new Uint8Array(count),open=[a];dist[a]=0;
  const bx=b%nx,bz=Math.floor(b/nx);
  function h(k){return Math.hypot(k%nx-bx,Math.floor(k/nx)-bz)}
  while(open.length){
   let best=0,score=Infinity;
   for(let t=0;t<open.length;t++){const n=open[t],s=dist[n]+h(n);if(s<score){score=s;best=t}}
   const current=open.splice(best,1)[0];if(current===b){const out=[b];let n=b;while(n!==a&&parent[n]>=0){n=parent[n];out.push(n)}return out.reverse()}
   if(closed[current])continue;closed[current]=1;
   const i=current%nx,j=Math.floor(current/nx);
   for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    const x=i+dx,z=j+dz;if(x<0||x>=nx||z<0||z>=nz)continue;
    const n=id(x,z);if(!valid[n]||closed[n])continue;
    if(dx&&dz&&(!valid[id(i+dx,j)]||!valid[id(i,j+dz)]))continue;
    const nd=dist[current]+Math.hypot(dx,dz);
    if(nd<dist[n]){dist[n]=nd;parent[n]=current;if(!open.includes(n))open.push(n)}
   }
  }
  return null;
 }
 // Every original waypoint remains in sequence. Nearby points map to the same nav cell.
 const mapped=raw.map(nearest);const walked=[];let unreachable=0,adjusted=0;
 for(let k=0;k<mapped.length;k++){
  if(mapped[k].offset>.35)adjusted++;
  if(k===0){walked.push(mapped[k].node);continue}
  const part=search(mapped[k-1].node,mapped[k].node);
  if(!part){unreachable++;continue}
  walked.push(...part.slice(1));
 }
 // Return by exactly the same safe corridor in reverse. Never teleport across the hall.
 walked.push(...walked.slice(0,-1).reverse());
 const ordered=[];for(const k of walked)if(k>=0&&k!==ordered.at(-1))ordered.push(k);
 if(ordered.length<2)throw Error('Nu exista un traseu navigabil');
 const points=ordered.map(k=>{const [x,z]=pos(k%nx,Math.floor(k/nx));return new T.Vector3(x,floorHeight(x,z),z)});
 // Avoid sharp A* zigzags with a very modest position smoothing.
 const curvePoints=points;const lengths=[0];
 for(let i=1;i<curvePoints.length;i++)lengths.push(lengths[i-1]+curvePoints[i].distanceTo(curvePoints[i-1]));
 const total=lengths.at(-1);
 let progress=0;
 const lineGeo=new T.BufferGeometry().setFromPoints(curvePoints.map(p=>new T.Vector3(p.x,p.y+.08,p.z)));
 const line=new T.Line(lineGeo,new T.LineBasicMaterial({color:'#61f1cd',transparent:true,opacity:.7,depthTest:true}));
 line.visible=showDebug;scene.add(line);
 function update(dt,speed=1.1){
  progress=(progress+dt*speed)%total;
  let lo=1,hi=lengths.length-1;while(lo<hi){const m=(lo+hi)>>1;if(lengths[m]<progress)lo=m+1;else hi=m}
  const i=lo,span=lengths[i]-lengths[i-1],t=span?(progress-lengths[i-1])/span:0;
  const p=curvePoints[i-1].clone().lerp(curvePoints[i],t);
  const ahead=curvePoints[Math.min(i+1,curvePoints.length-1)];
  const behind=curvePoints[Math.max(i-1,0)];
  const d=ahead.clone().sub(behind);
  return {position:p,heading:Math.atan2(d.x,d.z),distance:progress,total};
 }
 return {update,setVisible:v=>line.visible=!!v,stats:{originalPoints:raw.length,adjusted,unreachable,travelMeters:total},line};
}
