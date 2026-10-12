import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createMonoFonts,embeddedAtelierMono,monoRoots,monoHash,unicodeIntervals} from './mono-fonts-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
const root='D:/Claude/Q-Design',read=fs.readFileSync;
function altered(file,change){return(p,...args)=>{const value=read(p,...args);return path.resolve(p)===path.resolve(root,file)?change(value):value;};}
test('the same actual mono faces and whole licensed bytes reach all three products, including the existing Atelier embedded declarations',()=>{
 const output=createMonoFonts();assert.equal(output.assets.length,2);
 for(const folder of Object.values(monoRoots)){
  for(const asset of output.assets)assert.equal(monoHash(read(folder+'/public'+asset.url)),asset.hash);
  assert.equal(monoHash(read(folder+'/public/fonts/jetbrains-mono/LICENSE.txt')),monoHash(output.license));
 }
 const qa=read(monoRoots.atelier+'/app/fonts.css','utf8');assert.equal(embeddedAtelierMono(qa,output.css),qa);
 assert.equal(monoHash(read(monoRoots.carnet+'/public/fonts/JetBrainsMono-Variable.woff2')),output.assets.find(a=>a.file.startsWith('JetBrainsMono-latin.')).hash);
 const part=PARTS.find(p=>p.src==='dist/q-design.mono-fonts.css');assert(part&&part.layer===false);
 for(const folder of [monoRoots.maison,monoRoots.carnet]){
  assert.deepEqual(copyProblems(part,output.css,read(folder+'/app/q-design.mono-fonts.css','utf8')),[]);
  assert(/import\s+['"]\.\/q-design\.mono-fonts\.css['"]/.test(read(folder+'/app/layout.tsx','utf8')));
 }
});
test('a changed family, range, subset, weight, source path, extra field, missing license or damaged cached binary cannot receive a passing mono manifest',()=>{
 const model='patterns/mono-fonts.json';
 for(const mutate of [m=>m.family='Other Font',m=>m.weightRange='100 900',m=>m.style='italic',m=>m.faces.reverse(),m=>m.faces[0].source='../../private.woff2',m=>m.faces[0].unicodeRange='U+FFFF',m=>m.unusedStyle=7]){
  assert.throws(()=>createMonoFonts(root,altered(model,text=>{const m=JSON.parse(text);mutate(m);return JSON.stringify(m);})));
 }
 assert.throws(()=>createMonoFonts(root,altered('source/fonts/JetBrainsMono.LICENSE.txt',()=>Buffer.from('unlicensed'))));
 assert.throws(()=>createMonoFonts(root,altered('source/fonts/jetbrains-mono-400-latin.woff2',b=>{const copy=Buffer.from(b);copy[100]^=1;return copy;})));
 assert.throws(()=>unicodeIntervals('U+20-10'));assert.throws(()=>unicodeIntervals('U+110000'));
});
test('Atelier registration preserves every Pretendard byte and rejects extra trailing rules or a missing second mono face',()=>{
 const css=createMonoFonts().css,qa=read(monoRoots.atelier+'/app/fonts.css','utf8');
 assert.throws(()=>embeddedAtelierMono(qa+'body { color: red; }',css));
 const last=qa.lastIndexOf('@font-face');assert.throws(()=>embeddedAtelierMono(qa.slice(0,last),css));
 const next=embeddedAtelierMono(qa,css.replace('font-display: swap','font-display: block'));
 const first=qa.indexOf('@font-face {\n  font-family: \'JetBrains Mono\'');assert(first>0);
 assert.equal(next.slice(0,first),qa.slice(0,first));
});
test('the actual Atelier check mode does not require the external generator module to exist',()=>{
 const source=monoRoots.atelier+'/scripts/fonts/build-fonts.mjs',temp=monoRoots.atelier+'/scripts/fonts/.qdesign-independent-font-check.mjs';
 assert(!fs.existsSync(temp));const code=read(source,'utf8'),url='file:///D:/Claude/Q-Design/tools/mono-fonts-core.mjs';assert.equal(code.split(url).length,2);
 fs.writeFileSync(temp,code.replace(url,'file:///D:/Claude/Q-Design/tools/nonexistent-mono-generator.mjs'));
 try{const result=spawnSync(process.execPath,[temp,'--check'],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);assert(result.stdout.includes('@font-face 94'));}finally{fs.unlinkSync(temp);}
});
