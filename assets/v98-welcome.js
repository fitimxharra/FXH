(() => {
  function closeWelcome(){
    document.getElementById('fxhWelcomeV98')?.remove();
  }

  function mount(){
    if(document.getElementById('fxhWelcomeV98')) return;
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
          <li><span class="fxh-welcome-icon">→</span><span>On <b>1 January 2027</b>, FXH CAM moves from Public Beta to its official app release.</span></li>
          <li><span class="fxh-welcome-icon">⌁</span><span>Your photos and videos <b>stay on this device</b>.</span></li>
          <li><span class="fxh-welcome-icon">★</span><span>Your testing and feedback help shape the final FXH CAM release.</span></li>
        </ul>
        <div class="fxh-welcome-actions">
          <button type="button" class="fxh-welcome-continue">CONTINUE TESTING</button>
        </div>
        <p class="fxh-welcome-note">This Public Beta notice appears each time you open FXH CAM.</p>
      </section>`;
    root.querySelector('.fxh-welcome-continue')?.addEventListener('click',closeWelcome);
    document.body.appendChild(root);
  }

  window.addEventListener('load',()=>setTimeout(mount,650));
})();
