import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { StatusBar, Style } from '@capacitor/status-bar';

const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();

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

async function applySafeArea(){
  if (!isNative) return;
  document.documentElement.classList.add('etik-native', `etik-${platform}`);
  let top = 0;
  try {
    await StatusBar.show();
    await StatusBar.setStyle({style:Style.Dark});
    // Android moderno fuerza edge-to-edge. Conservamos overlay y compensamos
    // con la altura real reportada por el plugin.
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
  saveTemplate,
  shareTemplate,
  refreshSafeArea:applySafeArea
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applySafeArea, {once:true});
} else {
  applySafeArea();
}
window.addEventListener('orientationchange', () => setTimeout(applySafeArea, 120), {passive:true});
window.addEventListener('resize', () => {
  clearTimeout(applySafeArea.t);
  applySafeArea.t = setTimeout(applySafeArea, 180);
}, {passive:true});
