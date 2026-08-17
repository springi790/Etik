import { readFile, writeFile, rm, mkdir, cp, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(here, '..');
const rootDir = resolve(mobileDir, '..');
const outDir = join(mobileDir, 'www');

const RUNTIME_FILES = [
  'boot.js',
  'enhancements.js',
  'menu.js',
  'templates.js',
  'profile.js',
  'accordion.js',
  'credits.js',
  'branding-fixes.js',
  'history.js',
  'manifest.webmanifest'
];

function decodeEmbedded(source, target){
  const text = source.toString('utf8');
  const match = text.match(/=\s*["'](.+?)["'];?\s*$/s);
  if (!match) throw new Error(`No se pudo decodificar ${target}`);
  return gunzipSync(Buffer.from(match[1], 'base64'));
}

async function main(){
  await rm(outDir, {recursive:true, force:true});
  await mkdir(outDir, {recursive:true});

  const cssData = await readFile(join(rootDir, 'css-data.js'));
  const appData = await readFile(join(rootDir, 'app-data.js'));
  await writeFile(join(outDir, 'styles.css'), decodeEmbedded(cssData, 'styles.css'));
  await writeFile(join(outDir, 'app.js'), decodeEmbedded(appData, 'app.js'));

  for (const file of RUNTIME_FILES) {
    await copyFile(join(rootDir, file), join(outDir, file));
  }
  await cp(join(rootDir, 'assets'), join(outDir, 'assets'), {recursive:true});

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, [
    'browserify',
    join(mobileDir, 'node_modules/qrcode/lib/browser.js'),
    '--standalone', 'QRCode',
    '-o', join(outDir, 'qr-engine.js')
  ], {cwd: mobileDir, stdio:'inherit'});

  let html = await readFile(join(rootDir, 'index.html'), 'utf8');
  const oldScripts = [
    '<script src="qr-data.js"></script>',
    '<script src="css-data.js"></script>',
    '<script src="app-data.js"></script>',
    '<script src="boot.js"></script>'
  ].join('\n');
  if (!html.includes(oldScripts)) throw new Error('No se encontró el bloque de arranque de Etik.');
  html = html.replace(oldScripts, '<script src="boot.js?v=20"></script>');

  const branding = [
    '<link rel="icon" href="assets/icon-192.png?v=20" sizes="192x192" type="image/png">',
    '<link rel="apple-touch-icon" href="assets/icon-192.png?v=20">',
    '<link rel="manifest" href="manifest.webmanifest?v=20">',
    '<meta name="theme-color" content="#1265d6">',
    '<meta name="application-name" content="Etik">',
    '<meta name="apple-mobile-web-app-title" content="Etik">'
  ].join('\n');
  if (!html.includes('rel="manifest"')) html = html.replace('</head>', `${branding}\n</head>`);

  html = html.replace(
    '<div class="brand-mark">E</div>',
    '<div class="brand-mark"><img src="assets/icon-192.png?v=20" alt="" style="width:100%;height:100%;object-fit:contain;display:block"></div>'
  );

  await writeFile(join(outDir, 'index.html'), html, 'utf8');
  console.log(`Etik Android web bundle preparado en ${outDir}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
