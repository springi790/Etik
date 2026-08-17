(()=>{
  const $ = (selector, root=document) => root.querySelector(selector);

  const style = document.createElement('style');
  style.textContent = `
    /* El PNG ya contiene la identidad visual: no añadir un fondo azul detrás. */
    .brand-mark{
      background:transparent!important;
      color:transparent!important;
      box-shadow:none!important;
      border:none!important;
      border-radius:0!important;
      overflow:visible!important;
      display:grid!important;
      place-items:center!important;
    }
    .brand-mark img{
      width:100%!important;
      height:100%!important;
      object-fit:contain!important;
      border-radius:0!important;
      display:block!important;
    }

    .etik-drawer-logo{
      background:transparent!important;
      color:transparent!important;
      border:none!important;
      border-radius:0!important;
      box-shadow:none!important;
      overflow:visible!important;
      display:grid!important;
      place-items:center!important;
    }
    .etik-drawer-logo img{
      width:100%!important;
      height:100%!important;
      object-fit:contain!important;
      display:block!important;
    }
  `;
  document.head.appendChild(style);

  // Sustituir la antigua E del menú lateral por el PNG real de Etik.
  const drawerLogo = $('.etik-drawer-logo');
  if (drawerLogo) {
    drawerLogo.innerHTML = '<img src="assets/icon-192.png?v=18" alt="Etik">';
  }

  // Asegurar también el PNG en el encabezado aunque el HTML publicado venga de caché.
  const brandMark = $('.brand-mark');
  if (brandMark) {
    let img = brandMark.querySelector('img');
    if (!img) {
      brandMark.textContent = '';
      img = document.createElement('img');
      img.alt = '';
      brandMark.appendChild(img);
    }
    img.src = 'assets/icon-192.png?v=18';
  }

  const borderInput = $('#borderWidth');
  if (!borderInput) return;

  borderInput.defaultValue = '0';

  function emitZeroBorder(){
    // Esperar a que app.js termine de crear y seleccionar el elemento.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (borderInput.disabled || borderInput.closest('#inspector')?.hidden) return;
      borderInput.value = '0';
      borderInput.dispatchEvent(new Event('input', {bubbles:true}));
      borderInput.dispatchEvent(new Event('change', {bubbles:true}));
    }));
  }

  // Elementos que pueden existir perfectamente sin contorno.
  ['#addTextBtn', '#addBarcodeBtn', '#addQrBtn'].forEach(selector => {
    $(selector)?.addEventListener('click', emitZeroBorder);
  });

  // En imágenes, la creación ocurre después de elegir el archivo.
  let pendingNewImage = false;
  $('#addImageBtn')?.addEventListener('click', () => {
    pendingNewImage = true;
  });
  $('#replaceImageBtn')?.addEventListener('click', () => {
    pendingNewImage = false;
  });
  $('#imageFile')?.addEventListener('change', () => {
    if (!pendingNewImage) return;
    pendingNewImage = false;
    emitZeroBorder();
  });
})();
