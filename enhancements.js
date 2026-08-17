(()=>{
  const $ = (sel, root=document) => root.querySelector(sel);
  const rotationInput = $('#rotation');
  const newBtn = $('#newBtn');
  const sampleBtn = $('#sampleBtn');

  const style = document.createElement('style');
  style.textContent = `
    .canvas-toolbar{position:relative}
    .etik-more-actions-wrap{margin-left:auto;display:flex;align-items:center;flex:0 0 auto}
    .etik-more-actions-btn{
      width:40px;height:40px;min-width:40px;min-height:40px;padding:0!important;
      display:grid!important;place-items:center;font-size:1.35rem;line-height:1;border-radius:10px
    }
    .etik-quick-menu{
      position:fixed;z-index:9999;display:none;width:min(220px,calc(100vw - 16px));
      padding:7px;background:var(--paper,#fff);border:1px solid var(--line,#ddd);
      border-radius:12px;box-shadow:0 12px 36px rgba(0,0,0,.18)
    }
    .etik-quick-menu.open{display:grid;gap:6px}
    .etik-quick-menu .btn{width:100%;min-height:42px;text-align:left;justify-content:flex-start;padding:9px 11px}
    .etik-quick-menu .danger{color:#b42318;border-color:#d7a29d}
    .etik-rotation-tools{margin-top:10px;padding:10px;border:1px solid var(--line,#d9d9d9);border-radius:10px;background:rgba(127,127,127,.04)}
    .etik-rotation-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px;font-size:.78rem;font-weight:700}
    .etik-rotation-value{font-variant-numeric:tabular-nums;white-space:nowrap}
    .etik-rotation-range{width:100%;min-height:36px;accent-color:var(--accent,#111)}
    .etik-rotation-actions{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-top:7px}
    .etik-rotation-actions .btn{padding:9px 5px;min-width:0;font-size:.72rem}
    .etik-template-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
    .etik-mobile-rotate{white-space:nowrap}
    @media(max-width:760px){
      .canvas-toolbar{padding-right:8px!important}
      .etik-more-actions-wrap{margin-left:auto}
      .etik-more-actions-btn{width:38px;height:38px;min-width:38px;min-height:38px;border-radius:9px}
      .etik-rotation-tools{padding:12px}
      .etik-rotation-range{min-height:46px}
      .etik-rotation-actions .btn{min-height:42px;font-size:.78rem}
      .etik-template-actions{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  function loadSample(){
    if (sampleBtn) sampleBtn.click();
  }

  function resetLabel(){
    if (newBtn) newBtn.click();
  }

  // Un solo acceso compacto en la barra del lienzo. No crea una fila nueva.
  const canvasToolbar = $('.canvas-toolbar');
  if (canvasToolbar && !$('#etikMoreActionsBtn')) {
    const wrap = document.createElement('div');
    wrap.className = 'etik-more-actions-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'etikMoreActionsBtn';
    btn.className = 'btn etik-more-actions-btn';
    btn.textContent = '⋮';
    btn.title = 'Plantilla y reinicio';
    btn.setAttribute('aria-label','Plantilla y reinicio');
    btn.setAttribute('aria-expanded','false');
    wrap.appendChild(btn);
    canvasToolbar.appendChild(wrap);

    const menu = document.createElement('div');
    menu.id = 'etikQuickMenu';
    menu.className = 'etik-quick-menu';
    menu.innerHTML = `
      <button class="btn soft" id="etikSampleVisible" type="button">✨ Plantilla de prueba</button>
      <button class="btn danger" id="etikResetVisible" type="button">↺ Reiniciar etiqueta</button>
    `;
    document.body.appendChild(menu);

    const closeMenu = () => {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded','false');
    };
    const positionMenu = () => {
      const rect = btn.getBoundingClientRect();
      const width = Math.min(220, window.innerWidth - 16);
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, rect.right - width));
      menu.style.left = `${left}px`;
      menu.style.top = `${Math.min(window.innerHeight - 110, rect.bottom + 6)}px`;
    };

    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      const opening = !menu.classList.contains('open');
      if (opening) {
        menu.classList.add('open');
        positionMenu();
        btn.setAttribute('aria-expanded','true');
      } else {
        closeMenu();
      }
    });
    menu.addEventListener('click', event => event.stopPropagation());
    $('#etikSampleVisible')?.addEventListener('click', () => { closeMenu(); loadSample(); });
    $('#etikResetVisible')?.addEventListener('click', () => { closeMenu(); resetLabel(); });
    document.addEventListener('click', closeMenu);
    // En Android aparecen pequeños eventos resize por la barra de estado, notch
    // y cambios de viewport. No deben cerrar el menú apenas se abre. Solo lo
    // cerramos cuando cambia de verdad el ancho (rotación/pantalla dividida).
    let quickMenuWidth=window.innerWidth;
    window.addEventListener('resize',()=>{
      const width=window.innerWidth;
      if(Math.abs(width-quickMenuWidth)>24){ quickMenuWidth=width;closeMenu(); }
    },{passive:true});
  }

  // Las mismas acciones siguen disponibles dentro de la sección Plantilla.
  if (sampleBtn) {
    sampleBtn.textContent = '✨ Cargar plantilla de prueba';
    const hint = sampleBtn.parentElement?.querySelector('.hint');
    if (hint) hint.textContent = 'Carga una plantilla editable de ejemplo o reinicia la etiqueta para empezar desde cero.';

    if (!$('#clearAllBtn')) {
      const wrap = document.createElement('div');
      wrap.className = 'etik-template-actions';
      sampleBtn.parentNode.insertBefore(wrap, sampleBtn);
      wrap.appendChild(sampleBtn);

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.id = 'clearAllBtn';
      clearBtn.className = 'btn danger';
      clearBtn.textContent = '↺ Reiniciar etiqueta';
      clearBtn.title = 'Borrar todos los elementos y empezar desde cero';
      clearBtn.addEventListener('click', resetLabel);
      wrap.appendChild(clearBtn);
    }
  }

  // También se conservan en el menú móvil general.
  const mobileMenu = $('#mobileMoreMenu');
  if (mobileMenu) {
    if (!$('#mobileSampleQuick')) {
      const sampleQuick = document.createElement('button');
      sampleQuick.type = 'button';
      sampleQuick.id = 'mobileSampleQuick';
      sampleQuick.className = 'btn';
      sampleQuick.textContent = '✨ Plantilla de prueba';
      sampleQuick.addEventListener('click', loadSample);
      mobileMenu.appendChild(sampleQuick);
    }
    if (!$('#mobileClearQuick')) {
      const clearQuick = document.createElement('button');
      clearQuick.type = 'button';
      clearQuick.id = 'mobileClearQuick';
      clearQuick.className = 'btn danger';
      clearQuick.textContent = '↺ Reiniciar etiqueta';
      clearQuick.addEventListener('click', resetLabel);
      mobileMenu.appendChild(clearQuick);
    }
  }

  if (!rotationInput) return;

  function normalizeAngle(value){
    let n = Number(value) || 0;
    while (n > 180) n -= 360;
    while (n < -180) n += 360;
    return Math.round(n);
  }

  function emitRotation(value){
    const n = normalizeAngle(value);
    rotationInput.value = String(n);
    rotationInput.dispatchEvent(new Event('input', {bubbles:true}));
    rotationInput.dispatchEvent(new Event('change', {bubbles:true}));
    syncRotationUi();
  }

  const rotationRow = rotationInput.closest('.row2');
  const rotationTools = document.createElement('div');
  rotationTools.className = 'etik-rotation-tools';
  rotationTools.innerHTML = `
    <div class="etik-rotation-head">
      <span>Girar elemento</span>
      <span class="etik-rotation-value" id="etikRotationValue">0°</span>
    </div>
    <input class="etik-rotation-range" id="etikRotationRange" type="range" min="-180" max="180" step="1" value="0" aria-label="Rotación del elemento">
    <div class="etik-rotation-actions">
      <button class="btn" type="button" data-etik-rotate="-90">↶ 90°</button>
      <button class="btn" type="button" data-etik-rotate="-15">−15°</button>
      <button class="btn soft" type="button" data-etik-rotation-reset>0°</button>
      <button class="btn" type="button" data-etik-rotate="15">+15°</button>
      <button class="btn" type="button" data-etik-rotate="90">↷ 90°</button>
    </div>
  `;
  if (rotationRow && !$('#etikRotationRange')) rotationRow.insertAdjacentElement('afterend', rotationTools);

  const range = $('#etikRotationRange');
  const valueLabel = $('#etikRotationValue');

  function syncRotationUi(){
    const current = normalizeAngle(rotationInput.value);
    if (range && document.activeElement !== range) range.value = String(current);
    if (valueLabel) valueLabel.textContent = `${current}°`;
    const disabled = rotationInput.disabled || rotationInput.closest('#inspector')?.hidden;
    if (range) range.disabled = !!disabled;
    rotationTools.querySelectorAll('button').forEach(btn => btn.disabled = !!disabled);
  }

  range?.addEventListener('input', () => emitRotation(range.value));
  rotationTools.querySelectorAll('[data-etik-rotate]').forEach(btn => {
    btn.addEventListener('click', () => emitRotation((Number(rotationInput.value)||0) + Number(btn.dataset.etikRotate)));
  });
  $('[data-etik-rotation-reset]', rotationTools)?.addEventListener('click', () => emitRotation(0));
  rotationInput.addEventListener('input', syncRotationUi);
  rotationInput.addEventListener('change', syncRotationUi);

  const mobileBar = $('#mobileSelectionBar');
  if (mobileBar && !$('#mobileRotateBtn')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'mobileRotateBtn';
    btn.className = 'etik-mobile-rotate';
    btn.textContent = '↻ 90°';
    btn.setAttribute('aria-label','Girar elemento 90 grados');
    btn.addEventListener('click', () => emitRotation((Number(rotationInput.value)||0) + 90));
    const duplicate = $('#mobileDuplicateBtn');
    mobileBar.insertBefore(btn, duplicate || null);
  }

  const toolbarGroup = $('.canvas-toolbar .group:last-child');
  if (toolbarGroup && !$('#rotateQuickBtn')) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'rotateQuickBtn';
    btn.className = 'btn';
    btn.textContent = '↻ Girar 90°';
    btn.addEventListener('click', () => emitRotation((Number(rotationInput.value)||0) + 90));
    toolbarGroup.appendChild(btn);
  }

  const inspector = $('#inspector');
  if (inspector) new MutationObserver(syncRotationUi).observe(inspector, {attributes:true, attributeFilter:['hidden']});
  const layerList = $('#layerList');
  if (layerList) new MutationObserver(() => requestAnimationFrame(syncRotationUi)).observe(layerList, {childList:true, subtree:true, attributes:true});

  syncRotationUi();
})();
