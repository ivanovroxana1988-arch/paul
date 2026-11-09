// Preview-only WebGL diagnostic for the original NINJA.SYS architecture.
// Keeps scene geometry, camera, astronomical sun and current time unchanged.
export function installRenderAudit({T,scene,renderer,camera}) {
  if (new URLSearchParams(location.search).get('renderAudit')!=='1') return null;
  const snapshots=[];let originalFog=scene.fog;
  const panel=document.createElement('section');panel.setAttribute('aria-label','Verificare randare 3D');
  panel.style.cssText='position:fixed;z-index:999999;right:10px;top:34%;width:min(220px,55vw);padding:11px;background:#06181cf2;border:1px solid #9ce1d7;color:#e6f8f4;box-shadow:0 5px 30px #0009;border-radius:10px;font:12px/1.5 Arial, sans-serif';
  panel.innerHTML='<strong style="display:block;margin-bottom:7px">TEST RANDĂRE 3D</strong><div id="audit-buttons" style="display:grid;gap:5px"></div><div id="audit-stats" style="font-size:10px;white-space:pre-line;margin-top:7px;color:#b6d9d4"></div>';
  document.body.appendChild(panel);
  scene.traverse(obj=>{if(obj.isMesh && obj.name!=='visible-solar-sky'){snapshots.push({obj,material:obj.material})}});
  const originalColors=snapshots.map(({obj})=>obj.visible);
  const unlit=new T.MeshBasicMaterial({color:0xe5d7bc,side:T.DoubleSide,depthTest:true,depthWrite:true});
  const wire=new T.MeshBasicMaterial({color:0x91f5d8,wireframe:true,side:T.DoubleSide,depthTest:true});
  const gallery=new T.Group();gallery.name='DIAGNOSTIC_ONLY_gallery_lighting';scene.add(gallery);
  const hemi=new T.HemisphereLight(0xffead0,0x53616b,2.1);gallery.add(hemi);
  for(const [x,y,z,strength] of [[0,10,7,180],[0,13,-10,260],[-11,8,-6,190],[11,8,-6,190],[-4,8,7,120],[4,8,7,120]]){
    const p=new T.PointLight(0xffe9ca,strength,34,2);p.position.set(x,y,z);gallery.add(p);
  }
  gallery.visible=false;
  let selected='normal';
  const vals={normal:'Original',gallery:'Lumini galerie',unlit:'Geometrie fără lumină',wire:'Wireframe'};
  const buttons=panel.querySelector('#audit-buttons');
  for(const [name,label] of Object.entries(vals)){
    const b=document.createElement('button');b.type='button';b.textContent=label;
    b.style.cssText='background:#14332b;border:1px solid #7ba397;color:#e5f6ee;border-radius:6px;padding:8px 5px;text-align:left;font:12px Arial;cursor:pointer';
    b.onclick=()=>apply(name);buttons.appendChild(b);
  }
  function apply(mode){
    selected=mode;gallery.visible=mode==='gallery';scene.fog=(mode==='unlit'||mode==='wire')?null:originalFog;
    snapshots.forEach(({obj,material},i)=>{
      obj.material=mode==='unlit'?unlit:mode==='wire'?wire:material;
      obj.visible=originalColors[i];
    });
    [...buttons.children].forEach((b,i)=>{const active=Object.keys(vals)[i]===selected;b.style.outline=active?'2px solid #71f2c3':'none'});
  }
  apply('normal');
  function stats(){
    let visible=0,mesh=0,triangles=renderer.info.render.triangles,draws=renderer.info.render.calls;
    scene.traverse(o=>{if(o.isMesh){mesh++;if(o.visible)visible++}});
    panel.querySelector('#audit-stats').textContent=
      'Mod: '+vals[selected]+'\n'+
      'Mesh-uri: '+mesh+', vizibile: '+visible+'\n'+
      'GPU draw calls: '+draws+', triunghiuri: '+triangles+'\n'+
      'Texturi GPU: '+renderer.info.memory.textures+'\n'+
      'Context pierdut: '+!!renderer.getContext().isContextLost?.();
  }
  setInterval(stats,1700);setTimeout(stats,650);
  return {apply,stats};
}
