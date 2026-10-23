
(() => {
  const KEY='fxhcam:v98:welcomeSeen';
  let deferredPrompt=null;
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone===true;

  function markSeen(){ try{localStorage.setItem(KEY,'1')}catch{} }
  function seen(){ try{return localStorage.getItem(KEY)==='1'}catch{return false} }

  async function installApp(){
    if(standalone()) return closeWelcome(true);
    if(deferredPrompt){
      try{
        deferredPrompt.prompt();
        const result=await deferredPrompt.userChoice.catch(()=>null);
        if(result?.outcome==='accepted') closeWelcome(true);
        return;
      }catch(e){console.warn('Welcome install prompt failed',e)}
    }
    const isiOS=/iphone|ipad|ipod/i.test(navigator.userAgent||'');
    alert(isiOS
      ? 'To install FXH CAM: tap Share in Safari, then choose “Add to Home Screen”.'
      : 'To install FXH CAM: open your browser menu and choose “Install app” or “Add to Home screen”.');
  }

  function closeWelcome(save=true){
    if(save) markSeen();
    document.getElementById('fxhWelcomeV98')?.remove();
  }

  function mount(){
    if(seen() || document.getElementById('fxhWelcomeV98')) return;
    const root=document.createElement('div');
    root.id='fxhWelcomeV98';
    root.className='fxh-welcome-backdrop';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.setAttribute('aria-labelledby','fxhWelcomeTitle');
    root.innerHTML=`
      <section class="fxh-welcome-card">
        <div class="fxh-welcome-kicker">FXH CAM · PUBLIC BETA</div>
        <h2 id="fxhWelcomeTitle">Make moments timeless.</h2>
        <p class="fxh-welcome-lead">Turn your phone into a 35mm camera, instant Polaroid and VHS recorder.</p>
        <ul class="fxh-welcome-points">
          <li><span class="fxh-welcome-icon">●</span><span><b>Free Public Beta</b> until 31 December 2026.</span></li>
          <li><span class="fxh-welcome-icon">⌁</span><span>Your photos and videos <b>stay on this device</b>.</span></li>
          <li><span class="fxh-welcome-icon">★</span><span>Your testing and feedback help shape the final FXH CAM release.</span></li>
        </ul>
        <div class="fxh-welcome-actions">
          <button type="button" class="fxh-welcome-install">INSTALL APP</button>
          <button type="button" class="fxh-welcome-continue">CONTINUE TESTING</button>
        </div>
        <p class="fxh-welcome-note">This welcome screen is shown only once on this browser/device.</p>
      </section>`;
    root.querySelector('.fxh-welcome-install')?.addEventListener('click',installApp);
    root.querySelector('.fxh-welcome-continue')?.addEventListener('click',()=>closeWelcome(true));
    if(standalone()) root.querySelector('.fxh-welcome-install')?.remove();
    document.body.appendChild(root);
  }

  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e});
  window.addEventListener('appinstalled',()=>{deferredPrompt=null;closeWelcome(true)});
  window.addEventListener('load',()=>setTimeout(mount,650));
})();
