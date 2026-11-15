/* FXH CAM v102 Stable — optional PWA updates, never reload while camera is active. */
(()=>{'use strict';
  if(!('serviceWorker' in navigator))return;
  let pending=null,notice=null,armed=false;
  function busy(){return !!document.querySelector('.cameraScreenActive, .videoReviewScreen, .cameraPrimerOverlay, .videoReviewPreview');}
  function remove(){if(notice){notice.remove();notice=null}}
  function show(){
    if(!pending||busy()||document.hidden){remove();return}
    if(notice)return;
    notice=document.createElement('aside');notice.className='fxh-update-notice';
    const label=document.createElement('span');label.textContent='FXH CAM update is ready';
    const button=document.createElement('button');button.type='button';button.textContent='UPDATE';
    button.addEventListener('click',()=>{
      if(busy()){remove();return}
      armed=true;button.disabled=true;button.textContent='UPDATING…';
      pending?.postMessage({type:'FXH_ACTIVATE_UPDATE'});
    });
    notice.append(label,button);document.body.appendChild(notice);
  }
  function watch(reg){
    if(reg.waiting&&navigator.serviceWorker.controller){pending=reg.waiting;show()}
    reg.addEventListener('updatefound',()=>{
      const worker=reg.installing;if(!worker)return;
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller){pending=worker;show()}
      });
    });
  }
  navigator.serviceWorker.ready.then(watch).catch(()=>{});
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(!armed)return;
    if(!busy()){location.reload();return}
    const interval=setInterval(()=>{if(!busy()){clearInterval(interval);location.reload()}},1000);
  });
  setInterval(show,3000);
})();
