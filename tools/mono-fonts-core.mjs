import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {verifyFontCache,assertWoff2} from './font-cache.mjs';
export const monoRoots={atelier:'D:/Claude/Q-Atelier',maison:'D:/Claude/Q-Works',carnet:'D:/Claude/DHR'};
export const monoHash=bytes=>createHash('sha256').update(bytes).digest('hex');
export function unicodeIntervals(value){
 return value.split(',').map(token=>{const match=/^\s*U\+([0-9A-F]+)(?:-([0-9A-F]+))?\s*$/.exec(token);assert(match,'Invalid Unicode interval');const lo=parseInt(match[1],16),hi=parseInt(match[2]??match[1],16);assert(lo<=hi&&hi<=0x10ffff);return[lo,hi];});
}
export function createMonoFonts(root='D:/Claude/Q-Design',read=fs.readFileSync){
 verifyFontCache(root,{read});
 const model=JSON.parse(read(path.join(root,'patterns/mono-fonts.json'),'utf8'));
 assert.deepEqual(Object.keys(model).sort(),['version','family','weightRange','style','display','license','faces'].sort());
 assert.equal(model.version,1);assert.equal(model.family,'JetBrains Mono');
 assert.equal(model.style,'normal');assert.equal(model.display,'swap');assert.equal(model.weightRange,'400 800');
 assert.deepEqual(model.faces.map(f=>f.subset),['latin','latin-ext']);
 const cached=read(path.join(root,'dist/q-design.fonts.css'),'utf8'),assets=[],blocks=[];
 for(const face of model.faces){
  assert.deepEqual(Object.keys(face).sort(),['subset','source','unicodeRange'].sort());
  assert.equal(face.source,`source/fonts/jetbrains-mono-400-${face.subset}.woff2`);
  assert(/^U\+[0-9A-F,-]+(?:,\s*U\+[0-9A-F,-]+)*$/.test(face.unicodeRange));
  const bytes=read(path.join(root,face.source));assertWoff2(bytes,face.source);
  // These cached weight requests are the same variable font, not four static faces.
  for(const weight of [400,500,600,700])assert.equal(monoHash(read(path.join(root,`source/fonts/jetbrains-mono-${weight}-${face.subset}.woff2`))),monoHash(bytes));
  const faces=[...cached.matchAll(/@font-face\s*\{([^}]+)\}/g)].filter(m=>m[1].includes(`../${face.source}`));assert.equal(faces.length,1);
  assert(faces[0][1].includes(`font-family: '${model.family}'`));
  const ranges=unicodeIntervals(/unicode-range:\s*([^;]+);/.exec(faces[0][1])?.[1]??'');
  for(const [lo,hi] of unicodeIntervals(face.unicodeRange))assert(ranges.some(([a,b])=>lo>=a&&hi<=b),'Output Unicode selection must remain inside the verified cached face');
  const file=`JetBrainsMono-${face.subset}.${monoHash(bytes).slice(0,8)}.woff2`,url='/fonts/jetbrains-mono/'+file;
  assets.push({source:face.source,file,url,hash:monoHash(bytes),bytes});
  blocks.push(["@font-face {",`  font-family: '${model.family}';`,`  font-style: ${model.style};`,`  font-display: ${model.display};`,`  font-weight: ${model.weightRange};`,`  src: url('${url}') format('woff2');`,`  unicode-range: ${face.unicodeRange};`,'}'].join('\n'));
 }
 assert.equal(model.license,'source/fonts/JetBrainsMono.LICENSE.txt');
 const license=read(path.join(root,model.license));
 assert(license.toString('utf8').includes('Copyright 2020 The JetBrains Mono Project Authors'));
 assert(license.toString('utf8').includes('SIL OPEN FONT LICENSE Version 1.1'));
 return{model,css:blocks.join('\n\n')+'\n',assets,license};
}
export function embeddedAtelierMono(code,css){
 const faces=[...code.matchAll(/@font-face\s*\{[^}]*\}/g)].filter(m=>/font-family:\s*'JetBrains Mono'/.test(m[0]));
 assert.equal(faces.length,2);assert(/^\s*$/.test(code.slice(faces[1].index+faces[1][0].length)));
 assert(/^\s*$/.test(code.slice(faces[0].index+faces[0][0].length,faces[1].index)));
 return code.slice(0,faces[0].index)+css;
}
