import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const APP_VERSION = '1.0.0-alpha.5';
const APP_VERSION_CODE = 1000005;
const UPDATE_MANIFEST_URL = 'https://raw.githubusercontent.com/springi790/Etik/main/android-update.json';
let lastUpdateCheck = 0;

function safeFilename(value){
  return String(value || 'plantilla-etik.etik')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 100);
}

async function ensureDirectory(path, directory){
  try {
    await Filesystem.mkdir({path, directory, recursive:true});
  } catch (error) {
    const message = String(error?.message || '').toLowerCase();
    if (!message.includes('exist')) throw error;
  }
}

async function saveTemplate(filename, content){
  const file = safeFilename(filename);
  await ensureDirectory('Etik', Directory.Documents);
  const result = await Filesystem.writeFile({
    path:`Etik/${file}`,
    data:content,
    directory:Directory.Documents,
    encoding:Encoding.UTF8
  });
  return {
    uri:result.uri,
    displayPath:`Documentos/Etik/${file}`
  };
}

async function shareTemplate(filename, content, title='Plantilla Etik'){
  const file = safeFilename(filename);
  await ensureDirectory('etik-share', Directory.Cache);
  const written = await Filesystem.writeFile({
    path:`etik-share/${file}`,
    data:content,
    directory:Directory.Cache,
    encoding:Encoding.UTF8
  });
  const uri = written.uri || (await Filesystem.getUri({
    path:`etik-share/${file}`,
    directory:Directory.Cache
  })).uri;

  return Share.share({
    title:`Etik · ${title}`,
    text:'Plantilla de Etik',
    files:[uri],
    dialogTitle:'Compartir plantilla de Etik'
  });
}

function printDocument(){
  if (isNative && platform === 'android' && window.EtikAndroid?.printPage) {
    window.EtikAndroid.printPage();
    return true;
  }
  window.print();
  return false;
}

function requestUpdateInstall(url){
  if (!url) return false;
  if (isNative && platform === 'android' && window.EtikAndroid?.downloadAndInstallUpdate) {
    window.EtikAndroid.downloadAndInstallUpdate(String(url));
    return true;
  }
  window.open(String(url), '_blank', 'noopener');
  return false;
}

function toast(message){
  const bar=document.getElementById('statusbar');
  if(!bar) return;
  bar.textContent=message;
  bar.classList.add('show');
  clearTimeout(toast.t);
  toast.t=setTimeout(()=>bar.classList.remove('show'),2600);
}

function ensureUpdateUi(){
  if(document.getElementById('etikUpdateModal')) return document.getElementById('etikUpdateModal');
  const style=document.createElement('style');
  style.textContent=`
    .etik-update-modal{position:fixed;inset:0;z-index:20050;display:none;place-items:center;padding:20px;background:rgba(15,23,42,.38);backdrop-filter:blur(4px)}
    .etik-update-modal.open{display:grid}
    .etik-update-card{width:min(430px,100%);background:var(--paper,#fff);color:var(--ink,#171717);border:1px solid var(--line,#ddd);border-radius:22px;padding:20px;box-shadow:0 22px 70px rgba(0,0,0,.28)}
    .etik-update-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}.etik-update-head img{width:46px;height:46px;object-fit:contain}.etik-update-head h2{font-size:1.15rem;margin:0}.etik-update-head p{margin:2px 0 0;color:var(--muted,#68707b);font-size:.78rem}
    .etik-update-notes{font-size:.88rem;line-height:1.5;margin:12px 0 16px;padding:12px;border-radius:14px;background:rgba(18,101,214,.07);border:1px solid rgba(18,101,214,.18)}
    .etik-update-actions{display:grid;grid-template-columns:1fr 1.35fr;gap:9px}.etik-update-actions button{min-height:46px}
    .etik-update-hint{margin:12px 2px 0;color:var(--muted,#68707b);font-size:.72rem;line-height:1.4}
  `;
  document.head.appendChild(style);
  const modal=document.createElement('div');
  modal.id='etikUpdateModal';modal.className='etik-update-modal';modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
  modal.innerHTML=`<div class="etik-update-card">
    <div class="etik-update-head"><img src="assets/icon-192.png" alt=""><div><h2>Nueva versión de Etik</h2><p id="etikUpdateVersions"></p></div></div>
    <div class="etik-update-notes" id="etikUpdateNotes">Hay una actualización disponible.</div>
    <div class="etik-update-actions"><button class="btn" id="etikUpdateLater" type="button">Más tarde</button><button class="btn primary" id="etikUpdateNow" type="button">Actualizar</button></div>
    <p class="etik-update-hint">La primera vez Android puede pedir permiso para instalar actualizaciones desde Etik. La instalación siempre requiere la confirmación del sistema.</p>
  </div>`;
  document.body.appendChild(modal);
  document.getElementById('etikUpdateLater')?.addEventListener('click',()=>modal.classList.remove('open'));
  return modal;
}

function showUpdate(manifest){
  const modal=ensureUpdateUi();
  const versions=document.getElementById('etikUpdateVersions');
  const notes=document.getElementById('etikUpdateNotes');
  const now=document.getElementById('etikUpdateNow');
  if(versions) versions.textContent=`${APP_VERSION} → ${manifest.version}`;
  if(notes) notes.textContent=manifest.notes || 'Incluye correcciones y mejoras para Etik Android.';
  if(now){
    now.onclick=()=>{
      modal.classList.remove('open');
      toast('Preparando actualización de Etik…');
      requestUpdateInstall(manifest.apkUrl);
    };
  }
  modal.classList.add('open');
}

async function checkForUpdates({silent=true,force=false}={}){
  if(!isNative || platform!=='android') return {available:false,reason:'not-android'};
  const now=Date.now();
  if(!force && now-lastUpdateCheck<60_000) return {available:false,reason:'recent'};
  lastUpdateCheck=now;
  try{
    const res=await fetch(`${UPDATE_MANIFEST_URL}?t=${now}`,{cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const manifest=await res.json();
    const remoteCode=Number(manifest.versionCode)||0;
    if(remoteCode>APP_VERSION_CODE && manifest.apkUrl){
      showUpdate(manifest);
      return {available:true,manifest};
    }
    if(!silent) toast(`Etik ${APP_VERSION} está actualizado.`);
    return {available:false,manifest};
  }catch(error){
    console.warn('Etik update check failed',error);
    if(!silent) toast('No se pudo comprobar actualizaciones.');
    return {available:false,error};
  }
}

async function applySafeArea(){
  if (!isNative) return;
  document.documentElement.classList.add('etik-native', `etik-${platform}`);
  let top = 0;
  try {
    await StatusBar.show();
    await StatusBar.setStyle({style:Style.Dark});
    try { await StatusBar.setOverlaysWebView({overlay:true}); } catch {}
    const info = await StatusBar.getInfo();
    top = Math.max(0, Number(info?.height) || 0);
  } catch (error) {
    console.warn('Etik status bar setup skipped', error);
  }
  document.documentElement.style.setProperty('--etik-safe-top', `${top}px`);
}

window.EtikNative = Object.freeze({
  isNative,
  platform,
  version:APP_VERSION,
  versionCode:APP_VERSION_CODE,
  saveTemplate,
  shareTemplate,
  printDocument,
  requestUpdateInstall,
  checkForUpdates,
  refreshSafeArea:applySafeArea
});

function initNativeUi(){
  applySafeArea();
  if(isNative && platform==='android') setTimeout(()=>checkForUpdates({silent:true}),1500);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNativeUi, {once:true});
} else {
  initNativeUi();
}
window.addEventListener('orientationchange', () => setTimeout(applySafeArea, 120), {passive:true});
window.addEventListener('resize', () => {
  clearTimeout(applySafeArea.t);
  applySafeArea.t = setTimeout(applySafeArea, 180);
}, {passive:true});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible' && Date.now()-lastUpdateCheck>10*60_000) checkForUpdates({silent:true});
});
