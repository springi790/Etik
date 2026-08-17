(()=>{
  function loadScript(src){
    return new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src=src;
      script.onload=resolve;
      script.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));
      document.head.appendChild(script);
    });
  }

  function showError(err){
    console.error('Etik boot error',err);
    document.body.innerHTML='<main style="font-family:system-ui;padding:24px"><h1>Etik</h1><p>No se pudo iniciar el editor en este navegador.</p><pre style="white-space:pre-wrap"></pre></main>';
    document.querySelector('pre').textContent=String(err&&err.message||err);
  }

  (async()=>{
    try{
      const style=document.createElement('link');
      style.rel='stylesheet';
      style.href='styles.css?v=21';
      document.head.appendChild(style);

      await loadScript('qr-engine.js?v=21');
      await loadScript('lz-engine.js?v=21');
      await loadScript('app.js?v=21');
      await loadScript('enhancements.js?v=21');
      await loadScript('menu.js?v=21');
      await loadScript('templates.js?v=21');
      await loadScript('profile.js?v=21');
      await loadScript('accordion.js?v=21');
      await loadScript('credits.js?v=21');
      await loadScript('branding-fixes.js?v=21');
      await loadScript('history.js?v=21');
      await loadScript('platform-fixes.js?v=21');

      delete window.__etikCssGzip;
      delete window.__etikQrGzip;
      delete window.__etikAppGzip;
    }catch(err){
      showError(err);
    }
  })();
})();
