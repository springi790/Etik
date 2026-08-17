import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const target = resolve(process.argv[2] || 'app.js');
let source = await readFile(target, 'utf8');

function replaceRequired(pattern, replacement, label){
  const found = typeof pattern === 'string' ? source.includes(pattern) : pattern.test(source);
  if(!found) throw new Error(`Etik app patch: no se encontró ${label}`);
  source = source.replace(pattern, replacement);
}

replaceRequired(
  /  function renderQr\(qrCanvas,item\)\{[\s\S]*?\n  function drawQrFallback\(qrCanvas\)\{[\s\S]*?\n  \}\n\n  function renderCanvas/,
`  function renderQr(qrHost,item){
    // El QR se renderiza como SVG vectorial para que pueda crecer o reducirse
    // sin deformarse, perder módulos ni quedar recortado por el zoom.
    if(!qrHost) return;
    const token=String(Date.now())+Math.random();
    qrHost.dataset.renderToken=token;
    qrHost.replaceChildren();
    qrHost.style.width='100%';qrHost.style.height='100%';
    qrHost.style.display='grid';qrHost.style.placeItems='center';qrHost.style.overflow='hidden';
    const options={type:'svg',margin:Number(item.qrMargin)||0,errorCorrectionLevel:item.qrEcc||'M',color:{dark:item.color||'#000000',light:'#ffffff'}};
    if(window.QRCode?.toString){
      Promise.resolve(window.QRCode.toString(String(item.content||' '),options)).then(svg=>{
        if(qrHost.dataset.renderToken!==token)return;
        qrHost.innerHTML=svg;
        const node=qrHost.querySelector('svg');
        if(node){
          node.removeAttribute('width');node.removeAttribute('height');node.setAttribute('preserveAspectRatio','xMidYMid meet');
          node.style.width='100%';node.style.height='100%';node.style.display='block';node.style.shapeRendering='crispEdges';
        }
      }).catch(()=>drawQrFallback(qrHost));
    }else drawQrFallback(qrHost);
  }

  function drawQrFallback(qrHost){
    qrHost.replaceChildren();
    const box=document.createElement('div');box.textContent='QR no disponible';
    box.style.cssText='width:100%;height:100%;display:grid;place-items:center;background:#fff;color:#111;font:700 10px Arial;text-align:center';
    qrHost.appendChild(box);
  }

  function renderCanvas`,
  'renderizado QR'
);

replaceRequired(
  "      const q=document.createElement('canvas');content.appendChild(q);requestAnimationFrame(()=>renderQr(q,item));",
  "      const q=document.createElement('div');q.className='qr-render';content.appendChild(q);requestAnimationFrame(()=>renderQr(q,item));",
  'host QR'
);
replaceRequired(
  "            const dw=-dx,dh=-dy,delta=Math.abs(dw)>=Math.abs(dh)?dw:dh;",
  "            const delta=-(dx+dy)/2;",
  'redimensionado QR superior izquierdo'
);
replaceRequired(
  "          const delta=Math.abs(dx)>=Math.abs(dy)?dx:dy;",
  "          const delta=(dx+dy)/2;",
  'redimensionado QR inferior derecho'
);
replaceRequired(
  "        const qrCanvas=item.type==='qr'?el.querySelector('canvas'):null;if(qrCanvas)renderQr(qrCanvas,item);",
  "        // El SVG del QR es vectorial y se adapta automáticamente al nuevo tamaño.",
  'rerender QR durante resize'
);
replaceRequired(
  "      const size=clamp(Math.min(rawW,rawH),1,Math.min(state.width,state.height));",
  "      const maxSize=Math.max(1,Math.min(state.width-item.x,state.height-item.y));\n      const size=clamp(Math.max(rawW,rawH),1,maxSize);",
  'normalización cuadrada QR'
);
replaceRequired(
  "  $('printBtn').addEventListener('click',()=>{state.selectedId=null;renderAll();updatePrintStyle();window.print();});",
`  $('printBtn').addEventListener('click',()=>{
    state.selectedId=null;renderAll();updatePrintStyle();
    if(window.EtikNative?.isNative&&typeof window.EtikNative.printDocument==='function') window.EtikNative.printDocument();
    else window.print();
  });`,
  'impresión'
);

await writeFile(target, source, 'utf8');
console.log(`Etik app patches aplicados a ${target}`);
