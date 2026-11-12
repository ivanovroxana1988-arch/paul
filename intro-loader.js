// Keep the opening film and the actual scene load in step, without making
// unavailable video or browser autoplay restrictions prevent access.
(()=>{
 const loader=document.querySelector('#loader');
 const video=document.querySelector('#introVideo');
 const status=document.querySelector('#introStatus');
 const skip=document.querySelector('#skipVideo');
 const params=new URLSearchParams(window.location.search);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches&&params.get('intrare')!=='1';
 let sceneReady=false,filmDone=reduced||params.get('artist')==='1',started=false,finished=false;
 function reveal(){
  if(finished||!sceneReady||!filmDone)return;
  finished=true;video.pause();loader.style.opacity='0';loader.style.pointerEvents='none';
  setTimeout(()=>loader.remove(),650);
 }
 function stopFilm(){filmDone=true;video.pause();status.textContent=sceneReady?'BINE AI VENIT':'SE ÎNCARCĂ ATELIERUL';reveal();}
 window.artspaceSceneReady=()=>{sceneReady=true;if(video.ended)filmDone=true;reveal();};
 skip.addEventListener('click',stopFilm);
 video.addEventListener('playing',()=>{started=true;boot();});
 video.addEventListener('ended',()=>{filmDone=true;status.textContent=sceneReady?'BINE AI VENIT':'SE ÎNCARCĂ ATELIERUL';reveal();});
 video.addEventListener('error',stopFilm);
 if(filmDone){video.pause();video.hidden=true;}else{
  const play=video.play();if(play&&typeof play.catch==='function')play.catch(stopFilm);
  // If video cannot start, the site is still usable as soon as the scene is ready.
  setTimeout(()=>{if(!started&&!filmDone)stopFilm();},5000);
 }
 // Give the browser a chance to start the film before heavy scene setup.
 // A timeout guarantees that a slow or blocked video can never prevent loading.
 let booted=false;
 function boot(){
  if(booted)return;booted=true;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   import('./world.js?v=mobile-light-budget-1').catch(()=>{
    video.pause();loader.style.display='none';document.querySelector('#error').hidden=false;
   });
  }));
 }
 if(filmDone)boot();else setTimeout(boot,1500);
})();
