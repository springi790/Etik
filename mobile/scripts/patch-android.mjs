import { readFile, writeFile, copyFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const mobileDir = resolve(here, '..');
const packageJson = JSON.parse(await readFile(join(mobileDir, 'package.json'), 'utf8'));
const versionName = packageJson.version;

function versionCodeFrom(version){
  const match = String(version).match(/^(\d+)\.(\d+)\.(\d+)(?:-(alpha|beta|rc)\.(\d+))?$/i);
  if(!match) throw new Error(`Versión Android no compatible: ${version}`);
  const major=Number(match[1]), minor=Number(match[2]), patch=Number(match[3]);
  const stage=(match[4]||'stable').toLowerCase();
  const n=Number(match[5]||0);
  const stageCode = stage==='alpha' ? Math.min(n,49) : stage==='beta' ? 50+Math.min(n,29) : stage==='rc' ? 80+Math.min(n,18) : 99;
  return major*1_000_000 + minor*10_000 + patch*100 + stageCode;
}

const versionCode=versionCodeFrom(versionName);
const androidDir=join(mobileDir,'android');
const gradlePath=join(androidDir,'app','build.gradle');
let gradle=await readFile(gradlePath,'utf8');
gradle=gradle.replace(/versionCode\s+\d+/,`versionCode ${versionCode}`);
gradle=gradle.replace(/versionName\s+["'][^"']+["']/,`versionName "${versionName}"`);
await writeFile(gradlePath,gradle,'utf8');

const manifestPath=join(androidDir,'app','src','main','AndroidManifest.xml');
let manifest=await readFile(manifestPath,'utf8');
if(!manifest.includes('android.permission.REQUEST_INSTALL_PACKAGES')){
  manifest=manifest.replace(/(<manifest[^>]*>)/,`$1\n    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />`);
}
await writeFile(manifestPath,manifest,'utf8');

const activityPath=join(androidDir,'app','src','main','java','io','github','springi790','etik','MainActivity.java');
await mkdir(dirname(activityPath),{recursive:true});
await copyFile(join(mobileDir,'native','MainActivity.java'),activityPath);

console.log(`Etik Android ${versionName} · versionCode ${versionCode} · integración nativa aplicada`);
