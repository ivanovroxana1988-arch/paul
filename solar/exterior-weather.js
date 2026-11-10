// Weather particles live outside the building envelope. Above the glazed dome,
// particles remain outside too; no rain or snow is generated in the atrium.
export function createExteriorWeather({T,scene,reducedMotion=false}) {
  const count=reducedMotion?350:1100, positions=new Float32Array(count*6), seeds=[];
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.BufferAttribute(positions,3).setUsage(T.DynamicDrawUsage));
  const material=new T.LineBasicMaterial({color:'#c9dce3',transparent:true,opacity:.55,depthWrite:false,fog:false});
  const particles=new T.LineSegments(geometry,material);particles.name='exterior-weather';particles.frustumCulled=false;particles.visible=false;scene.add(particles);
  for(let i=0;i<count;i++) {const a=Math.random()*Math.PI*2, radius=36+Math.random()*39;seeds.push({x:Math.cos(a)*radius,z:-1+Math.sin(a)*radius,y:Math.random()*66,phase:Math.random()*6.28});}
  let state=null, elapsed=0;
  function update(dt) {
    if(!state || !particles.visible) return;
    elapsed+=dt;const snow=state.hasSnow && !state.hasRain;
    const speed=snow?2.1:16, length=snow?.18:1.5;
    const direction=state.windDirection*Math.PI/180, drift=Math.min(state.wind/40,.7);
    for(let i=0;i<count;i++) {const s=seeds[i], y=(s.y-elapsed*speed%66+66)%66, sway=snow?Math.sin(elapsed*.7+s.phase)*.45:0, x=s.x+sway,z=s.z;
      const j=i*6;positions[j]=x;positions[j+1]=y;positions[j+2]=z;positions[j+3]=x+Math.sin(direction)*drift*length;positions[j+4]=y-length;positions[j+5]=z+Math.cos(direction)*drift*length;
    }
    geometry.attributes.position.needsUpdate=true;
  }
  return {setWeather(next){state=next;particles.visible=!!next&&(next.hasRain||next.hasSnow||next.rain>.05||next.snow>.05);if(next){const snow=next.hasSnow&&!next.hasRain;material.color.set(snow?'#f5f8f8':'#c9dce3');material.opacity=snow?.78:.48;const amount=snow?next.snow:next.rain;geometry.setDrawRange(0,Math.min(count,Math.max(200,Math.round(300+amount*210)))*2);}},update,dispose(){scene.remove(particles);geometry.dispose();material.dispose();}};
}
