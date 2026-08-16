(()=>{
  const drawerScroll = document.querySelector('#etikInfoDrawer .etik-drawer-scroll');
  if (!drawerScroll || document.getElementById('etikCredits')) return;

  const style = document.createElement('style');
  style.textContent = `
    .etik-credits{
      margin:20px 4px 2px;
      padding:16px 10px 4px;
      border-top:1px solid var(--line,#ddd);
      text-align:center;
      color:var(--muted,#727272);
      font-size:.68rem;
      line-height:1.55;
      letter-spacing:.015em;
      user-select:none;
    }
    .etik-credits strong{
      color:var(--ink,#171717);
      font-weight:750;
    }
    .etik-credits a{
      color:inherit;
      text-decoration:none;
      font-weight:700;
    }
    .etik-credits a:hover{text-decoration:underline}
    .etik-credits-model{opacity:.9}
    .etik-credits-year{margin-top:4px;opacity:.72;font-size:.64rem;letter-spacing:.08em}
    @media(max-width:760px){
      .etik-credits{margin-top:16px;padding-top:14px;font-size:.66rem}
    }
  `;
  document.head.appendChild(style);

  const footer = document.createElement('footer');
  footer.id = 'etikCredits';
  footer.className = 'etik-credits';
  footer.setAttribute('aria-label','Créditos de Etik');
  footer.innerHTML = `
    <div><strong>Core development</strong> by <a href="https://github.com/springi790" target="_blank" rel="noopener noreferrer">@springi790</a></div>
    <div class="etik-credits-model"><strong>UI/UX design assistance</strong> by GPT-5.6 Sol · OpenAI</div>
    <div class="etik-credits-year">© 2026 ETIK</div>
  `;

  drawerScroll.appendChild(footer);
})();
