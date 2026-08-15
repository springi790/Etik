(async()=>{
  async function ungzip(b64){
    const bin=atob(b64);
    const bytes=new Uint8Array(bin.length);
    for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);

    if(typeof DecompressionStream!=="function"){
      throw new Error("Tu navegador no soporta DecompressionStream");
    }

    const stream=new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));

    // Leer el stream directamente evita el error "Failed to fetch"
    // que algunos navegadores Android pueden lanzar al usar Response(stream).text().
    const reader=stream.getReader();
    const chunks=[];
    let total=0;

    while(true){
      const {done,value}=await reader.read();
      if(done) break;
      chunks.push(value);
      total+=value.byteLength;
    }

    const output=new Uint8Array(total);
    let offset=0;
    for(const chunk of chunks){
      output.set(chunk,offset);
      offset+=chunk.byteLength;
    }

    return new TextDecoder("utf-8").decode(output);
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

    delete window.__etikCssGzip;
    delete window.__etikQrGzip;
    delete window.__etikAppGzip;
  }catch(err){
    console.error("Etik boot error",err);
    document.body.innerHTML='<main style="font-family:system-ui;padding:24px"><h1>Etik</h1><p>No se pudo iniciar el editor en este navegador.</p><pre style="white-space:pre-wrap"></pre></main>';
    document.querySelector("pre").textContent=String(err&&err.message||err);
  }
})();
