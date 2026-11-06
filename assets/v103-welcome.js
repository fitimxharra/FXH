(() => {
  const KEY='fxhcam:welcome:v103:seen';
  function hasSeen(){try{return localStorage.getItem(KEY)==='1'}catch{return false}}
  function markSeen(){try{localStorage.setItem(KEY,'1')}catch{}}
  function closeWelcome(){markSeen();document.getElementById('fxhWelcomeV103')?.remove()}
  function mount(){
    if(hasSeen()||document.getElementById('fxhWelcomeV103')) return;
    // The beta feedback form and its confirmation share button are independent.
    if(document.getElementById('fxhBetaModal')) return;
    const root=document.createElement('div');
    root.id='fxhWelcomeV103';
    root.className='fxh-welcome-backdrop';
    root.setAttribute('role','dialog');
    root.setAttribute('aria-modal','true');
    root.setAttribute('aria-labelledby','fxhWelcomeTitle');
    root.innerHTML=`
      <section class="fxh-welcome-card">
        <div class="fxh-welcome-kicker">FXH CAM · PUBLIC BETA</div>
        <h2 id="fxhWelcomeTitle">Make moments timeless.</h2>
        <p class="fxh-welcome-lead">Experience 35mm film, instant photos and VHS recording directly in your browser.</p>
        <ul class="fxh-welcome-points">
          <li><span class="fxh-welcome-icon">●</span><span><b>100% free during Public Beta</b> until 31 December 2026.</span></li>
          <li><span class="fxh-welcome-icon">●</span><span><b>No download or installation required.</b> Just open, shoot and create.</span></li>
          <li><span class="fxh-welcome-icon">●</span><span>Your photos and videos <b>stay on this device</b>. Please download the ones you want to keep.</span></li>
          <li><span class="fxh-welcome-icon">●</span><span>The official app is planned for <b>1 January 2027</b>. Feedback helps us improve it.</span></li>
        </ul>
        <div class="fxh-welcome-actions"><button type="button" class="fxh-welcome-continue">START EXPLORING</button></div>
        <p class="fxh-welcome-note">This introduction is displayed once on this browser.</p>
      </section>`;
    root.querySelector('.fxh-welcome-continue')?.addEventListener('click',closeWelcome);
    document.body.appendChild(root);
  }
  if(document.readyState==='complete') setTimeout(mount,450);
  else window.addEventListener('load',()=>setTimeout(mount,450),{once:true});
})();
