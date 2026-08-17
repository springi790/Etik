(()=>{
  'use strict';

  const $ = (selector, root=document) => root.querySelector(selector);
  const SHARE_BASE = 'https://springi790.github.io/Etik/';
  const QR_SAFE_CHARS = 2800;
  let sharingTemplateId = null;

  const style = document.createElement('style');
  style.textContent = `
    html.etik-native{--etik-safe-top:0px}
    html.etik-native .topbar{
      padding-top:calc(10px + var(--etik-safe-top))!important;
      min-height:calc(64px + var(--etik-safe-top))!important;
    }
    html.etik-native .etik-info-drawer{
      padding-top:var(--etik-safe-top)!important;
    }
    @media(max-width:760px){
      html.etik-native .app{
        grid-template-rows:calc(var(--mobile-top-h) + var(--etik-safe-top)) 1fr!important;
      }
      html.etik-native .topbar{
        height:calc(var(--mobile-top-h) + var(--etik-safe-top))!important;
        min-height:calc(var(--mobile-top-h) + var(--etik-safe-top))!important;
        padding-top:calc(7px + var(--etik-safe-top))!important;
      }
      html.etik-native .mobile-more-menu{
        top:calc(52px + var(--etik-safe-top))!important;
      }
      html.etik-native .etik-info-drawer{
        padding-top:var(--etik-safe-top)!important;
      }
    }
  `;
  document.head.appendChild(style);

  // El historial y las plantillas usan un click sintético en Exportar para capturar
  // el diseño. Conservamos el mensaje cuando el usuario exporta de verdad, pero no
  // mostramos "Diseño exportado" durante esas capturas internas.
  const exportBtn = $('#exportBtn');
  const statusbar = $('#statusbar');
  let syntheticExportAt = 0;
  exportBtn?.addEventListener('click', event => {
    if (!event.isTrusted) syntheticExportAt = Date.now();
  }, true);
  if (statusbar) {
    new MutationObserver(() => {
      if (
        statusbar.textContent.trim() === 'Diseño exportado' &&
        Date.now() - syntheticExportAt < 500
      ) {
        statusbar.classList.remove('show');
      }
    }).observe(statusbar, {childList:true, characterData:true, subtree:true});
  }

  const templateList = $('#etikTplList');
  templateList?.addEventListener('click', event => {
    const share = event.target.closest('[data-a="share"]');
    const card = event.target.closest('.etik-tpl-card');
    if (!share || !card) return;
    sharingTemplateId = card.dataset.id || null;
    setTimeout(refreshShareUi, 0);
  }, true);

  function tplToast(message){
    const toast = $('.etik-tpl-toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(tplToast.t);
    tplToast.t = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function safeName(value){
    return String(value || 'Plantilla Etik')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '-')
      .toLowerCase()
      .slice(0, 80) || 'plantilla-etik';
  }

  function templateFilename(template){
    return `${safeName(template?.name)}.etik`;
  }

  function templateJson(template){
    return JSON.stringify(template, null, 2);
  }

  async function getSharingTemplate(){
    if (!window.EtikTemplates?.list) return null;
    const templates = await window.EtikTemplates.list();
    if (sharingTemplateId) {
      const exact = templates.find(item => item.id === sharingTemplateId);
      if (exact) return exact;
    }
    const visibleName = $('#etikShareName')?.textContent?.trim();
    return templates.find(item => item.name === visibleName) || null;
  }

  function makeCompressedLink(template){
    if (!template) return null;
    const copy = {...template};
    delete copy.id;
    const json = JSON.stringify(copy);
    let payload = null;

    if (window.LZString?.compressToEncodedURIComponent) {
      payload = `z.${window.LZString.compressToEncodedURIComponent(json)}`;
    } else if (window.EtikTemplates?.makeShareLink) {
      return window.EtikTemplates.makeShareLink(template);
    }
    if (!payload) return null;

    const base = window.EtikNative?.isNative ? SHARE_BASE : location.href;
    const url = new URL(base);
    url.search = '';
    url.hash = '';
    url.searchParams.set('etik', payload);
    return url.toString();
  }

  async function copyText(text){
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const area = document.createElement('textarea');
      area.value = text;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      return ok;
    }
  }

  function downloadWeb(template){
    const filename = templateFilename(template);
    const file = new Blob([templateJson(template)], {type:'application/vnd.etik+json'});
    const url = URL.createObjectURL(file);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    return filename;
  }

  async function downloadTemplate(template){
    if (!template) return;
    const filename = templateFilename(template);
    if (window.EtikNative?.isNative && window.EtikNative.saveTemplate) {
      try {
        const result = await window.EtikNative.saveTemplate(filename, templateJson(template));
        tplToast(`Guardado en ${result.displayPath || `Documentos/Etik/${filename}`}`);
        return;
      } catch (error) {
        console.error('Etik native save failed', error);
        tplToast('No se pudo guardar el archivo en Documentos/Etik.');
        return;
      }
    }
    downloadWeb(template);
    tplToast(`Descargado por el navegador: ${filename}`);
  }

  async function shareTemplate(template){
    if (!template) return;
    const filename = templateFilename(template);
    if (window.EtikNative?.isNative && window.EtikNative.shareTemplate) {
      try {
        await window.EtikNative.shareTemplate(filename, templateJson(template), template.name);
        return;
      } catch (error) {
        if (error?.message?.toLowerCase?.().includes('cancel')) return;
        console.error('Etik native share failed', error);
        tplToast('No se pudo abrir el menú de compartir.');
        return;
      }
    }

    const link = makeCompressedLink(template);
    const file = new File([templateJson(template)], filename, {type:'application/vnd.etik+json'});
    try {
      if (navigator.share && navigator.canShare?.({files:[file]})) {
        await navigator.share({title:`Etik · ${template.name}`, text:'Plantilla de Etik', files:[file]});
        return;
      }
      if (navigator.share && link) {
        await navigator.share({title:`Etik · ${template.name}`, text:'Abre esta plantilla en Etik', url:link});
        return;
      }
      downloadWeb(template);
      tplToast(`Tu navegador guardó ${filename}.`);
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error(error);
        tplToast('No se pudo compartir la plantilla.');
      }
    }
  }

  async function showQr(template){
    const link = makeCompressedLink(template);
    if (!link) {
      tplToast('No se pudo crear un enlace para esta plantilla.');
      return;
    }
    if (link.length > QR_SAFE_CHARS) {
      tplToast('La plantilla aún es demasiado grande para un QR. Usa Compartir o el archivo .etik.');
      return;
    }
    if (!window.QRCode?.toCanvas) {
      tplToast('El motor QR todavía no está disponible.');
      return;
    }

    const wrap = $('#etikQrWrap');
    const canvas = $('#etikQrCanvas');
    if (!wrap || !canvas) return;
    try {
      wrap.classList.add('show');
      await window.QRCode.toCanvas(canvas, link, {
        width:240,
        margin:2,
        errorCorrectionLevel:'L'
      });
    } catch (error) {
      console.error('Etik share QR failed', error);
      wrap.classList.remove('show');
      tplToast('El contenido es demasiado grande para generar un QR.');
    }
  }

  async function refreshShareUi(){
    const template = await getSharingTemplate();
    if (!template) return;
    const link = makeCompressedLink(template);
    const qrPossible = !!link && link.length <= QR_SAFE_CHARS;
    const copy = $('#etikCopyLink');
    const qr = $('#etikShowQr');
    const note = $('#etikShareNote');
    if (copy) copy.disabled = !link;
    if (qr) qr.disabled = !qrPossible;
    if (note) {
      if (!link) {
        note.innerHTML = 'Esta plantilla se puede compartir como <strong>archivo .etik</strong>.';
      } else if (qrPossible) {
        note.innerHTML = 'El enlace está <strong>comprimido</strong> y puede compartirse también como QR. No requiere cuenta.';
      } else {
        note.innerHTML = 'El enlace existe, pero la plantilla es demasiado grande para un QR. Usa <strong>Compartir</strong> o <strong>.etik</strong>.';
      }
    }
  }

  const nativeShareBtn = $('#etikNativeShare');
  const downloadBtn = $('#etikDownload');
  const copyLinkBtn = $('#etikCopyLink');
  const qrBtn = $('#etikShowQr');

  if (nativeShareBtn) nativeShareBtn.onclick = async () => shareTemplate(await getSharingTemplate());
  if (downloadBtn) downloadBtn.onclick = async () => downloadTemplate(await getSharingTemplate());
  if (copyLinkBtn) copyLinkBtn.onclick = async () => {
    const template = await getSharingTemplate();
    const link = makeCompressedLink(template);
    if (!link) return tplToast('No se pudo crear el enlace.');
    tplToast(await copyText(link) ? 'Enlace copiado.' : 'No se pudo copiar el enlace.');
  };
  if (qrBtn) qrBtn.onclick = async () => showQr(await getSharingTemplate());

  // Compatibilidad con los nuevos enlaces comprimidos ?etik=z....
  function clearSharedParam(){
    const url = new URL(location.href);
    url.searchParams.delete('etik');
    history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
  }

  async function handleCompressedIncoming(){
    const url = new URL(location.href);
    const raw = url.searchParams.get('etik');
    if (!raw?.startsWith('z.') || !window.LZString || !window.EtikTemplates) return;
    try {
      const json = window.LZString.decompressFromEncodedURIComponent(raw.slice(2));
      if (!json) throw new Error('Enlace vacío');
      const parsed = JSON.parse(json);
      const incoming = window.EtikTemplates.normalize(parsed, 'Plantilla compartida');
      const box = $('#etikTplIncoming');
      const name = $('#etikTplIncomingName');
      const open = $('#etikTplIncomingOpen');
      const save = $('#etikTplIncomingSave');
      const dismiss = $('#etikTplIncomingDismiss');
      if (!box || !open || !save || !dismiss) return;

      if (name) name.textContent = incoming.name;
      box.classList.add('show');
      open.onclick = async () => {
        try {
          await window.EtikTemplates.applyDesign(incoming.design);
          clearSharedParam();
          box.classList.remove('show');
          document.querySelector('#etikTplClose')?.click();
          tplToast('Plantilla compartida abierta.');
        } catch (error) {
          console.error(error);
          tplToast('No se pudo abrir la plantilla compartida.');
        }
      };
      save.onclick = async () => {
        incoming.createdAt = incoming.updatedAt = Date.now();
        await window.EtikTemplates.save(incoming);
        clearSharedParam();
        box.classList.remove('show');
        tplToast('Plantilla compartida guardada.');
      };
      dismiss.onclick = () => {
        clearSharedParam();
        box.classList.remove('show');
      };
      setTimeout(() => window.EtikTemplates.openLibrary(), 120);
    } catch (error) {
      console.error('Compressed Etik link invalid', error);
      tplToast('El enlace de plantilla no es válido.');
    }
  }

  handleCompressedIncoming();

  // Si el panel de compartir se abre por cualquier ruta, recalculamos sus capacidades.
  const sharePanel = $('#etikShare');
  if (sharePanel) {
    new MutationObserver(() => {
      if (sharePanel.classList.contains('open')) setTimeout(refreshShareUi, 0);
    }).observe(sharePanel, {attributes:true, attributeFilter:['class']});
  }
})();
