(()=>{
  'use strict';
  const oldBtn=document.getElementById('etikMoreActionsBtn');
  const oldMenu=document.getElementById('etikQuickMenu');
  if(!oldBtn||!oldMenu) return;

  const style=document.createElement('style');
  style.textContent=`
    .etik-quick-backdrop{position:fixed;inset:0;z-index:9998;background:rgba(15,23,42,.26);display:none}
    .etik-quick-backdrop.open{display:block}
    @media(max-width:760px){
      #etikQuickMenu{
        display:grid!important;left:12px!important;right:12px!important;top:auto!important;
        bottom:calc(86px + env(safe-area-inset-bottom,0px));width:auto!important;max-width:none!important;
        gap:7px;padding:10px;border-radius:18px;opacity:0;visibility:hidden;pointer-events:none;
        transform:translateY(18px) scale(.985);transition:opacity .16s ease,transform .18s ease,visibility .18s ease;
        box-shadow:0 18px 60px rgba(0,0,0,.24)
      }
      #etikQuickMenu.open{opacity:1;visibility:visible;pointer-events:auto;transform:none}
      #etikQuickMenu .btn{min-height:50px;font-size:.92rem}
    }
  `;
  document.head.appendChild(style);

  const btn=oldBtn.cloneNode(true);
  const menu=oldMenu.cloneNode(true);
  oldBtn.replaceWith(btn);
  oldMenu.replaceWith(menu);

  if(window.EtikNative?.isNative && !menu.querySelector('#etikCheckUpdates')){
    const update=document.createElement('button');
    update.type='button';update.id='etikCheckUpdates';update.className='btn';
    update.textContent='↻ Buscar actualizaciones';
    menu.appendChild(update);
  }

  const backdrop=document.createElement('div');
  backdrop.id='etikQuickBackdrop';backdrop.className='etik-quick-backdrop';
  document.body.appendChild(backdrop);

  const close=()=>{
    menu.classList.remove('open');backdrop.classList.remove('open');
    btn.setAttribute('aria-expanded','false');
  };
  const position=()=>{
    if(window.matchMedia('(max-width:760px)').matches) return;
    const rect=btn.getBoundingClientRect();
    const width=Math.min(220,window.innerWidth-16);
    menu.style.left=`${Math.max(8,Math.min(window.innerWidth-width-8,rect.right-width))}px`;
    menu.style.top=`${Math.min(window.innerHeight-110,rect.bottom+6)}px`;
  };
  const open=()=>{
    menu.classList.add('open');backdrop.classList.add('open');
    btn.setAttribute('aria-expanded','true');position();
  };

  btn.addEventListener('pointerdown',event=>event.stopPropagation());
  btn.addEventListener('click',event=>{
    event.preventDefault();event.stopPropagation();
    menu.classList.contains('open')?close():open();
  });
  menu.addEventListener('pointerdown',event=>event.stopPropagation());
  menu.addEventListener('click',event=>event.stopPropagation());
  backdrop.addEventListener('pointerdown',close,{passive:true});
  document.addEventListener('keydown',event=>{if(event.key==='Escape')close();});
  screen.orientation?.addEventListener?.('change',close);

  menu.querySelector('#etikSampleVisible')?.addEventListener('click',()=>{close();document.getElementById('sampleBtn')?.click();});
  menu.querySelector('#etikResetVisible')?.addEventListener('click',()=>{close();document.getElementById('newBtn')?.click();});
  menu.querySelector('#etikCheckUpdates')?.addEventListener('click',()=>{close();window.EtikNative?.checkForUpdates?.({silent:false,force:true});});
})();
