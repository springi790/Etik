(async()=>{
  async function ungzip(b64){
    const bin=atob(b64);
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
    if(typeof DecompressionStream!=="function") throw new Error("Tu navegador no soporta DecompressionStream");
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"));
    return await new Response(stream).text();
  }
  try{
    const [css,qr,app]=await Promise.all([
      ungzip(window.__etikCssGzip),
      ungzip(window.__etikQrGzip),
      ungzip(window.__etikAppGzip)
    ]);
    const style=document.createElement("style");
    style.textContent=css;
    document.head.appendChild(style);
    (0,eval)(qr);
    (0,eval)(app);
    delete window.__etikCssGzip; delete window.__etikQrGzip; delete window.__etikAppGzip;
  }catch(err){
    console.error("Etik boot error",err);
    document.body.innerHTML='<main style="font-family:system-ui;padding:24px"><h1>Etik</h1><p>No se pudo iniciar el editor en este navegador.</p><pre style="white-space:pre-wrap"></pre></main>';
    document.querySelector("pre").textContent=String(err&&err.message||err);
  }
})();
