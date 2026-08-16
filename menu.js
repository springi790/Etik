(()=>{
  const $ = (sel, root=document) => root.querySelector(sel);
  const topbar = $('.topbar');
  const brand = $('.brand');
  if (!topbar || !brand || $('#etikHamburgerBtn')) return;

  const style = document.createElement('style');
  style.textContent = `
    .etik-hamburger-btn{
      width:42px;height:42px;min-width:42px;padding:0!important;
      display:grid!important;place-items:center;border-radius:11px;
      background:transparent!important;flex:0 0 auto
    }
    .etik-hamburger-icon{width:19px;display:grid;gap:4px}
    .etik-hamburger-icon span{display:block;height:2px;border-radius:999px;background:currentColor}
    .etik-drawer-backdrop{
      position:fixed;inset:0;background:rgba(0,0,0,.38);z-index:12000;
      opacity:0;pointer-events:none;transition:opacity .18s ease
    }
    .etik-drawer-backdrop.open{opacity:1;pointer-events:auto}
    .etik-info-drawer{
      position:fixed;z-index:12001;left:0;top:0;bottom:0;
      width:min(390px,90vw);background:var(--paper,#fff);color:var(--ink,#171717);
      box-shadow:18px 0 50px rgba(0,0,0,.2);transform:translateX(-102%);
      transition:transform .22s ease;display:flex;flex-direction:column;
      padding-top:env(safe-area-inset-top,0px)
    }
    .etik-info-drawer.open{transform:translateX(0)}
    .etik-drawer-head{
      min-height:68px;padding:12px 14px;display:flex;align-items:center;gap:11px;
      border-bottom:1px solid var(--line,#ddd);flex:0 0 auto
    }
    .etik-drawer-logo{
      width:42px;height:42px;border-radius:12px;display:grid;place-items:center;
      background:#1265d6;color:white;font-weight:900;font-size:1.25rem
    }
    .etik-drawer-title{min-width:0;flex:1}
    .etik-drawer-title strong{display:block;font-size:1.04rem}
    .etik-drawer-title span{display:block;color:var(--muted,#6d6d6d);font-size:.76rem;margin-top:2px}
    .etik-drawer-close{
      width:38px;height:38px;min-width:38px;padding:0!important;border-radius:10px;
      display:grid!important;place-items:center;font-size:1.25rem
    }
    .etik-drawer-scroll{overflow:auto;padding:12px 12px 24px;overscroll-behavior:contain}
    .etik-menu-card{
      border:1px solid var(--line,#ddd);border-radius:14px;background:var(--paper,#fff);
      margin-bottom:10px;overflow:hidden
    }
    .etik-menu-card details{margin:0}
    .etik-menu-card summary{
      list-style:none;cursor:pointer;padding:14px 14px;display:flex;align-items:center;
      gap:10px;font-weight:800;min-height:50px
    }
    .etik-menu-card summary::-webkit-details-marker{display:none}
    .etik-menu-card summary::after{content:'›';margin-left:auto;font-size:1.25rem;transition:transform .16s ease}
    .etik-menu-card details[open] summary::after{transform:rotate(90deg)}
    .etik-menu-card-content{padding:0 14px 15px;font-size:.86rem;line-height:1.48;color:var(--ink,#171717)}
    .etik-menu-card-content p{margin:0 0 10px}
    .etik-menu-card-content p:last-child{margin-bottom:0}
    .etik-help-steps{margin:8px 0 12px;padding-left:20px}
    .etik-help-steps li{margin:0 0 8px}
    .etik-help-note{
      padding:10px 11px;border-radius:10px;background:rgba(18,101,214,.08);
      border:1px solid rgba(18,101,214,.18);font-size:.8rem
    }
    .etik-help-subtitle{font-weight:850;margin:13px 0 6px!important}
    .etik-menu-link{
      display:flex;align-items:center;justify-content:space-between;gap:10px;
      padding:10px 11px;margin-top:8px;border:1px solid var(--line,#ddd);
      border-radius:10px;text-decoration:none;color:inherit;font-weight:700
    }
    .etik-menu-link span:last-child{opacity:.55}
    .etik-contact-row{
      display:flex;align-items:center;gap:11px;padding:11px;border:1px solid var(--line,#ddd);
      border-radius:11px;margin-top:8px;text-decoration:none;color:inherit
    }
    .etik-contact-icon{
      width:34px;height:34px;display:grid;place-items:center;border-radius:9px;
      background:rgba(127,127,127,.09);font-weight:900;flex:0 0 auto
    }
    .etik-contact-row strong{display:block;font-size:.86rem}
    .etik-contact-row small{display:block;color:var(--muted,#6d6d6d);margin-top:2px;word-break:break-all}
    @media(max-width:760px){
      .topbar{gap:8px!important;padding-left:10px!important}
      .etik-hamburger-btn{width:40px;height:40px;min-width:40px;border-radius:10px}
      .etik-info-drawer{width:min(360px,92vw)}
      .etik-drawer-head{min-height:64px;padding:10px 12px}
      .etik-drawer-scroll{padding:10px 10px 22px}
      .etik-menu-card summary{padding:13px 12px}
      .etik-menu-card-content{padding:0 12px 14px}
    }
  `;
  document.head.appendChild(style);

  const hamburger = document.createElement('button');
  hamburger.type = 'button';
  hamburger.id = 'etikHamburgerBtn';
  hamburger.className = 'btn etik-hamburger-btn';
  hamburger.setAttribute('aria-label','Abrir menú de Etik');
  hamburger.setAttribute('aria-expanded','false');
  hamburger.innerHTML = '<span class="etik-hamburger-icon" aria-hidden="true"><span></span><span></span><span></span></span>';
  topbar.insertBefore(hamburger, brand);

  const backdrop = document.createElement('div');
  backdrop.id = 'etikDrawerBackdrop';
  backdrop.className = 'etik-drawer-backdrop';
  document.body.appendChild(backdrop);

  const drawer = document.createElement('aside');
  drawer.id = 'etikInfoDrawer';
  drawer.className = 'etik-info-drawer';
  drawer.setAttribute('aria-hidden','true');
  drawer.innerHTML = `
    <div class="etik-drawer-head">
      <div class="etik-drawer-logo">E</div>
      <div class="etik-drawer-title">
        <strong>Etik</strong>
        <span>Diseñador de etiquetas</span>
      </div>
      <button class="btn etik-drawer-close" id="etikDrawerClose" type="button" aria-label="Cerrar menú">×</button>
    </div>
    <div class="etik-drawer-scroll">
      <div class="etik-menu-card">
        <details open>
          <summary>ⓘ Acerca de Etik</summary>
          <div class="etik-menu-card-content">
            <p><strong>Etik</strong> sirve para diseñar etiquetas personalizadas directamente desde el navegador y prepararlas para impresión en medidas reales.</p>
            <p>Puedes agregar y editar texto, imágenes, códigos QR, códigos de barras Code 128, líneas y recuadros; además puedes mover, redimensionar, centrar, rotar, cambiar tipografías y configurar el tamaño físico de la etiqueta.</p>
            <div class="etik-help-note">Los diseños se trabajan visualmente en el lienzo. Antes de imprimir, revisa que el ancho y alto en milímetros coincidan con el material de tu impresora.</div>
          </div>
        </details>
      </div>

      <div class="etik-menu-card">
        <details>
          <summary>🖨 Instrucciones de impresión</summary>
          <div class="etik-menu-card-content">
            <p class="etik-help-subtitle">Impresión general</p>
            <ol class="etik-help-steps">
              <li>En <strong>Etiqueta</strong>, configura el ancho y alto reales de tu etiqueta.</li>
              <li>Conecta o agrega la impresora al sistema operativo usando Bluetooth, USB, Wi‑Fi o la app/servicio del fabricante.</li>
              <li>En Etik toca <strong>Imprimir</strong> y elige la impresora desde el diálogo de impresión del dispositivo.</li>
              <li>Usa escala <strong>100 % / tamaño real</strong> cuando esté disponible y evita opciones como “ajustar a página”.</li>
            </ol>

            <p class="etik-help-subtitle">Zebra en Android</p>
            <ol class="etik-help-steps">
              <li>Instala y configura <strong>Zebra Print</strong> o la solución Zebra compatible con tu modelo.</li>
              <li>Agrega la impresora por red, Bluetooth, NFC o el método disponible para tu equipo.</li>
              <li>Cuando la impresora esté agregada al servicio de impresión, abre Etik y toca <strong>Imprimir</strong>.</li>
              <li>Selecciona la Zebra en el diálogo de impresión de Android y confirma tamaño, orientación y escala.</li>
            </ol>
            <div class="etik-help-note">Zebra indica que Zebra Print puede imprimir contenido del navegador y que las impresoras agregadas aparecen como opciones dentro del diálogo de impresión del sistema.</div>

            <p class="etik-help-subtitle">Zebra Browser Print</p>
            <p>Para flujos desde navegador, Zebra Browser Print permite trabajar con impresoras locales. En escritorio, Zebra documenta conectividad por red y USB; en Android, conectividad por red y Bluetooth.</p>
            <a class="etik-menu-link" href="https://www.zebra.com/la/es/support-downloads/software/printer-software/browser-print.html" target="_blank" rel="noopener noreferrer"><span>Soporte oficial de Browser Print</span><span>↗</span></a>
            <a class="etik-menu-link" href="https://docs.zebra.com/us/en/software/zebra-print-ug/zebra-print-user-guide.html" target="_blank" rel="noopener noreferrer"><span>Guía oficial de Zebra Print</span><span>↗</span></a>

            <p class="etik-help-subtitle">Otras impresoras</p>
            <p>Para Brother, Epson, DYMO, impresoras térmicas genéricas u otras marcas, instala primero su app, controlador o servicio de impresión. Si la impresora aparece en el diálogo de impresión del navegador, Etik puede enviarle el diseño mediante ese flujo.</p>
            <div class="etik-help-note">La compatibilidad exacta depende del modelo de impresora, navegador, sistema operativo y servicio de impresión instalado.</div>
          </div>
        </details>
      </div>

      <div class="etik-menu-card">
        <details>
          <summary>✉ Contacto</summary>
          <div class="etik-menu-card-content">
            <p>Información de contacto y desarrollo del proyecto.</p>
            <a class="etik-contact-row" href="https://github.com/springi790" target="_blank" rel="noopener noreferrer">
              <span class="etik-contact-icon">GH</span>
              <span><strong>GitHub</strong><small>@springi790</small></span>
            </a>
            <a class="etik-contact-row" href="https://github.com/springi790/Etik" target="_blank" rel="noopener noreferrer">
              <span class="etik-contact-icon">E</span>
              <span><strong>Repositorio de Etik</strong><small>springi790/Etik</small></span>
            </a>
          </div>
        </details>
      </div>
    </div>
  `;
  document.body.appendChild(drawer);

  const closeBtn = $('#etikDrawerClose');
  let previousOverflow = '';

  function openDrawer(){
    previousOverflow = document.body.style.overflow;
    drawer.classList.add('open');
    backdrop.classList.add('open');
    drawer.setAttribute('aria-hidden','false');
    hamburger.setAttribute('aria-expanded','true');
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => closeBtn?.focus());
  }

  function closeDrawer(){
    drawer.classList.remove('open');
    backdrop.classList.remove('open');
    drawer.setAttribute('aria-hidden','true');
    hamburger.setAttribute('aria-expanded','false');
    document.body.style.overflow = previousOverflow;
  }

  hamburger.addEventListener('click', openDrawer);
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
  });
})();
