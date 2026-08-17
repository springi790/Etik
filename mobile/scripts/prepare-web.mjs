import { readFile, writeFile, rm, mkdir, cp, copyFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gunzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(here, '..');
const rootDir = resolve(mobileDir, '..');
const outDir = join(mobileDir, 'www');
const nativeAssetsDir = join(mobileDir, 'assets');

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
  'platform-fixes.js',
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
  await mkdir(nativeAssetsDir, {recursive:true});

  const cssData = await readFile(join(rootDir, 'css-data.js'));
  const appData = await readFile(join(rootDir, 'app-data.js'));
  await writeFile(join(outDir, 'styles.css'), decodeEmbedded(cssData, 'styles.css'));
  await writeFile(join(outDir, 'app.js'), decodeEmbedded(appData, 'app.js'));

  for (const file of RUNTIME_FILES) {
    await copyFile(join(rootDir, file), join(outDir, file));
  }
  await cp(join(rootDir, 'assets'), join(outDir, 'assets'), {recursive:true});

  // Fuente de alta resolución para el launcher/splash nativo.
  await sharp(join(rootDir, 'assets', 'icon-512.png'))
    .resize(1024, 1024, {fit:'contain', background:{r:255,g:255,b:255,alpha:0}})
    .png()
    .toFile(join(nativeAssetsDir, 'logo.png'));

  const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  execFileSync(npx, [
    'browserify',
    join(mobileDir, 'node_modules/qrcode/lib/browser.js'),
    '--standalone', 'QRCode',
    '-o', join(outDir, 'qr-engine.js')
  ], {cwd: mobileDir, stdio:'inherit'});

  execFileSync(npx, [
    'browserify',
    join(mobileDir, 'node_modules/lz-string/libs/lz-string.js'),
    '--standalone', 'LZString',
    '-o', join(outDir, 'lz-engine.js')
  ], {cwd: mobileDir, stdio:'inherit'});

  execFileSync(npx, [
    'esbuild',
    join(mobileDir, 'src/native-bridge.js'),
    '--bundle',
    '--format=iife',
    '--platform=browser',
    '--target=chrome120',
    `--outfile=${join(outDir, 'native-bridge.js')}`
  ], {cwd: mobileDir, stdio:'inherit'});

  let html = await readFile(join(rootDir, 'index.html'), 'utf8');
  const oldScripts = [
    '<script src="qr-data.js"></script>',
    '<script src="css-data.js"></script>',
    '<script src="app-data.js"></script>',
    '<script src="boot.js"></script>'
  ].join('\n');
  if (!html.includes(oldScripts)) throw new Error('No se encontró el bloque de arranque de Etik.');
  html = html.replace(oldScripts, '<script src="native-bridge.js?v=22"></script>\n<script src="boot.js?v=22"></script>');

  const branding = [
    '<link rel="icon" href="assets/icon-192.png?v=22" sizes="192x192" type="image/png">',
    '<link rel="apple-touch-icon" href="assets/icon-192.png?v=22">',
    '<link rel="manifest" href="manifest.webmanifest?v=22">',
    '<meta name="theme-color" content="#ffffff">',
    '<meta name="application-name" content="Etik">',
    '<meta name="apple-mobile-web-app-title" content="Etik">'
  ].join('\n');
  if (!html.includes('rel="manifest"')) html = html.replace('</head>', `${branding}\n</head>`);

  html = html.replace(
    '<div class="brand-mark">E</div>',
    '<div class="brand-mark"><img src="assets/icon-192.png?v=22" alt="" style="width:100%;height:100%;object-fit:contain;display:block"></div>'
  );

  await writeFile(join(outDir, 'index.html'), html, 'utf8');
  console.log(`Etik Android web bundle preparado en ${outDir}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
