(()=>{
  const drawer = document.getElementById('etikInfoDrawer');
  if (!drawer) return;

  const detailsList = [...drawer.querySelectorAll('.etik-menu-card details')];
  if (!detailsList.length) return;

  const style = document.createElement('style');
  style.textContent = `
    #etikInfoDrawer .etik-menu-card details > .etik-menu-card-content{
      display:grid;
      grid-template-rows:0fr;
      padding:0!important;
      opacity:.62;
      transition:grid-template-rows .24s cubic-bezier(.2,.75,.25,1), opacity .18s ease;
    }
    #etikInfoDrawer .etik-menu-card details > .etik-menu-card-content > .etik-accordion-inner{
      min-height:0;
      overflow:hidden;
      padding:0 14px 0;
      transition:padding-bottom .24s cubic-bezier(.2,.75,.25,1);
    }
    #etikInfoDrawer .etik-menu-card details.is-open > .etik-menu-card-content{
      grid-template-rows:1fr;
      opacity:1;
    }
    #etikInfoDrawer .etik-menu-card details.is-open > .etik-menu-card-content > .etik-accordion-inner{
      padding-bottom:15px;
    }
    #etikInfoDrawer .etik-menu-card details > summary::after{
      transform:rotate(0deg)!important;
      transition:transform .22s cubic-bezier(.2,.75,.25,1)!important;
    }
    #etikInfoDrawer .etik-menu-card details.is-open > summary::after{
      transform:rotate(90deg)!important;
    }
    #etikInfoDrawer .etik-menu-card details > summary{
      transition:background-color .18s ease, color .18s ease;
    }
    #etikInfoDrawer .etik-menu-card details.is-open > summary{
      background:rgba(127,127,127,.045);
    }
    @media(max-width:760px){
      #etikInfoDrawer .etik-menu-card details > .etik-menu-card-content > .etik-accordion-inner{
        padding-left:12px;
        padding-right:12px;
      }
      #etikInfoDrawer .etik-menu-card details.is-open > .etik-menu-card-content > .etik-accordion-inner{
        padding-bottom:14px;
      }
    }
    @media(prefers-reduced-motion:reduce){
      #etikInfoDrawer .etik-menu-card details > .etik-menu-card-content,
      #etikInfoDrawer .etik-menu-card details > .etik-menu-card-content > .etik-accordion-inner,
      #etikInfoDrawer .etik-menu-card details > summary::after,
      #etikInfoDrawer .etik-menu-card details > summary{
        transition:none!important;
      }
    }
  `;
  document.head.appendChild(style);

  // Mantener todos los <details> técnicamente abiertos permite animar el contenido.
  // El estado visual y accesible se controla con .is-open y aria-expanded.
  detailsList.forEach((details, index) => {
    const summary = details.querySelector(':scope > summary');
    const content = details.querySelector(':scope > .etik-menu-card-content');
    if (!summary || !content) return;

    const wasOpen = details.hasAttribute('open');

    if (!content.querySelector(':scope > .etik-accordion-inner')) {
      const inner = document.createElement('div');
      inner.className = 'etik-accordion-inner';
      while (content.firstChild) inner.appendChild(content.firstChild);
      content.appendChild(inner);
    }

    details.open = true;
    details.classList.toggle('is-open', wasOpen || index === 0);
    summary.setAttribute('aria-expanded', details.classList.contains('is-open') ? 'true' : 'false');

    summary.addEventListener('click', event => {
      event.preventDefault();
      const shouldOpen = !details.classList.contains('is-open');

      // Solo un apartado puede permanecer abierto a la vez.
      detailsList.forEach(other => {
        if (other === details) return;
        other.classList.remove('is-open');
        other.querySelector(':scope > summary')?.setAttribute('aria-expanded','false');
      });

      details.classList.toggle('is-open', shouldOpen);
      summary.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    });
  });
})();
