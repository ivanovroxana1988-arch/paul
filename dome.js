// Reference-led dome with an open central oculus, two service walkways,
// sixteen principal ribs and individually curved glazing sectors. Units: metres.
export function addDome({T,roof,mesh,box,pipe,metal,brass,paleStone,simple=false}){
const R=18.5,CZ=-1,base=24.65,inner=2.7,rise=6.8,count=16;
const structure=new T.Group(),glazing=new T.Group(),service=new T.Group();roof.add(structure,glazing,service);structure.name='dome-radial-structure';glazing.name='dome-curved-glazing';service.name='dome-service-walkways';
// The shared pipe helper disables shadows for performance. The dome's service
// pipes and railings need them so the solar shadow follows their real geometry.
const shadowPipe=(...args)=>{const p=pipe(...args);p.castShadow=!simple;return p;};
const yAt=r=>base+rise*Math.sqrt(Math.max(0,1-(r/R)**2));
const pt=(r,a)=>new T.Vector3(Math.sin(a)*r,yAt(r),CZ-Math.cos(a)*r);
function tube(name,pts,r,mat,parent=structure){const o=mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,r,simple?5:8,false),mat,0,0,0,parent);o.name=name;return o;}
function circle(radius,y,thick,mat,parent=structure){const o=mesh(new T.TorusGeometry(radius,thick,6,96),mat,0,y,CZ,parent);o.rotation.x=Math.PI/2;return o;}
function collar(r,a){const p=pt(r,a),o=box(.55,.22,.5,p.x,p.y,p.z,brass,structure);o.rotation.y=-a;if(!simple)for(const dx of [-.18,.18])for(const dz of [-.15,.15]){const bolt=mesh(new T.CylinderGeometry(.035,.035,.08,6),metal,p.x+dx,p.y+.14,p.z+dz,structure);}}
for(let i=0;i<count;i++){const a=i/count*Math.PI*2,pts=Array.from({length:33},(_,j)=>pt(inner+(R-inner)*j/32,a));tube('principal-dome-rib',pts,.16,metal);for(const r of [4.5,8,12,16,18.4])collar(r,a);}
for(const r of [inner,4.5,8,12,16,18.5])circle(r,yAt(r),r===inner?.16:.07,r===inner?brass:metal);
// Fine framing: curved meridians and latitude bars beneath the glass.
for(let i=0;i<count*3;i++){if(i%3===0)continue;const a=i/(count*3)*Math.PI*2;tube('glazing-meridian',Array.from({length:25},(_,j)=>pt(4.5+(R-4.5)*j/24,a)),.024,brass);}
for(let r=5.5;r<18.4;r+=1.05)circle(r,yAt(r),.023,brass);
const glass=simple?new T.MeshLambertMaterial({color:'#aac5ca',transparent:true,opacity:.18,side:T.DoubleSide,depthWrite:false}):new T.MeshPhysicalMaterial({color:'#a9cddb',roughness:.28,metalness:.02,transparent:true,opacity:.22,side:T.DoubleSide,depthWrite:false});
// Geometry has curvature in both radial and circumferential directions.
for(let i=0;i<count;i++){const positions=[],uv=[],indices=[],nr=12,na=6,a0=i/count*Math.PI*2,a1=(i+1)/count*Math.PI*2;for(let j=0;j<=nr;j++)for(let k=0;k<=na;k++){const r=4.5+(R-4.5)*j/nr,a=a0+(a1-a0)*k/na,p=pt(r,a);positions.push(p.x,p.y+.035,p.z);uv.push(k/na,j/nr);}for(let j=0;j<nr;j++)for(let k=0;k<na;k++){const n=j*(na+1)+k;indices.push(n,n+na+1,n+1,n+1,n+na+1,n+na+2);}const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();mesh(geo,glass,0,0,0,glazing,false).name='curved-glass-sector-'+i;}
function walkway(r,width,y,name){const s=new T.Shape();s.absarc(0,0,r+width/2,0,Math.PI*2,false);const h=new T.Path();h.absarc(0,0,r-width/2,0,Math.PI*2,true);s.holes.push(h);const o=mesh(new T.ExtrudeGeometry(s,{depth:.14,bevelEnabled:false,curveSegments:64}),metal,0,y,CZ,service);o.rotation.x=-Math.PI/2;o.name=name;for(const rr of [r-width/2,r+width/2]){circle(rr,y+1.05,.035,brass,service);circle(rr,y+.52,.026,metal,service);for(let i=0;i<32;i++){const a=i*Math.PI/16,x=Math.sin(a)*rr,z=CZ-Math.cos(a)*rr;shadowPipe([x,y,z],[x,y+1.1,z],.028,metal,service);}}}
walkway(4.05,.9,yAt(4.05)-.35,'oculus-service-ring');walkway(18.1,1,base-.2,'dome-perimeter-walkway');
const lightMat=new T.MeshBasicMaterial({color:'#ffd18a'});for(let i=0;i<16;i++){const a=i*Math.PI/8,p=pt(4.05,a),lamp=box(.28,.08,.18,p.x,p.y-.46,p.z,lightMat,service);lamp.rotation.y=-a;}
// Curved pipe bundles join the roof ribs to the vertical wall services.
for(let i=0;i<8;i++){const a=i*Math.PI/4;for(let k=-1;k<=1;k++){const pts=[new T.Vector3(Math.sin(a)*18.6,base-4,CZ-Math.cos(a)*18.6),...Array.from({length:15},(_,j)=>pt(18.5-j*.35,a+k*.006))];tube('wall-to-dome-service-pipe',pts,.045,metal);}}
return {structure,glazing,service,stats:{principalRibs:count,glazingSectors:count,serviceRings:2,oculusDiameter:inner*2,baseDiameter:R*2}};
}
