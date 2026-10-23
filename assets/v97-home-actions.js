
(() => {
  const SHARE_URL='https://app.fitimxharra.com';
  let deferredPrompt=null;

  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;

  function removeOld(){
    ['fxhHomeShareCard','fxhBetaDock','fxhBetaInline'].forEach(id=>document.getElementById(id)?.remove());
  }

  async function installApp(){
    if(standalone()) return;
    if(deferredPrompt){
      try{
        deferredPrompt.prompt();
        const result=await deferredPrompt.userChoice.catch(()=>null);
        if(result?.outcome==='accepted') mount();
        return;
      }catch(e){console.warn('Install prompt failed',e)}
    }
    const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
    alert(isiOS
      ? 'To install FXH CAM: tap Share in Safari, then choose “Add to Home Screen”.'
      : 'To install FXH CAM: open the browser menu and choose “Install app” or “Add to Home screen”.');
  }

  async function shareApp(){
    const data={title:'FXH CAM',text:'Try FXH CAM — analog 35mm, Polaroid and VHS in your browser.',url:SHARE_URL};
    try{
      if(navigator.share){await navigator.share(data);return}
      if(navigator.clipboard){await navigator.clipboard.writeText(SHARE_URL);alert('FXH CAM link copied.');return}
    }catch(e){ if(e?.name==='AbortError') return; }
    window.prompt('Copy and share this link:',SHARE_URL);
  }

  function mount(){
    removeOld();
    const start=document.querySelector('.analog-start');
    if(!start) return;
    let bar=document.getElementById('fxhV97HomeActions');
    if(!bar){
      bar=document.createElement('div');
      bar.id='fxhV97HomeActions';
      bar.setAttribute('aria-label','Install or share FXH CAM');
      const install=document.createElement('button');
      install.type='button';
      install.className='fxh-v97-install';
      install.textContent='↓ INSTALL APP';
      install.addEventListener('click',installApp);
      const share=document.createElement('button');
      share.type='button';
      share.className='fxh-v97-share';
      share.textContent='↗ SHARE';
      share.addEventListener('click',shareApp);
      bar.append(install,share);
    }
    if(standalone()) bar.querySelector('.fxh-v97-install')?.remove();
    if(start.nextElementSibling!==bar) start.insertAdjacentElement('afterend',bar);
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;mount()});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;mount()});
  window.addEventListener('load',()=>{setTimeout(mount,350);setTimeout(mount,1400)});

  const observer=new MutationObserver(()=>{
    clearTimeout(window.__fxhV97MountTimer);
    window.__fxhV97MountTimer=setTimeout(mount,120);
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
