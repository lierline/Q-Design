import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createMonoFonts,embeddedAtelierMono,monoRoots,monoHash} from './mono-fonts-core.mjs';
const root='D:/Claude/Q-Design',write=process.argv.includes('--write');
assert(process.argv.slice(2).every(a=>['--write','--check'].includes(a)));
const output=createMonoFonts(root),problems=[];
function emit(file,bytes){
 if(fs.existsSync(file)&&monoHash(fs.readFileSync(file))===monoHash(bytes))return;
 if(write){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
 else problems.push(file);
}
emit(root+'/dist/q-design.mono-fonts.css',Buffer.from(output.css));
for(const [product,folder] of Object.entries(monoRoots)){
 for(const asset of output.assets)emit(folder+'/public'+asset.url,asset.bytes);
 emit(folder+'/public/fonts/jetbrains-mono/LICENSE.txt',output.license);
 if(product==='carnet')emit(folder+'/public/fonts/JetBrainsMono-Variable.woff2',output.assets.find(a=>a.file.startsWith('JetBrainsMono-latin.')).bytes);
 if(product==='atelier'){
  const file=folder+'/app/fonts.css',current=fs.readFileSync(file,'utf8');
  const next=embeddedAtelierMono(current,output.css);
  // Preserve existing line endings when the current generated body is already identical.
  if(current.replaceAll('\r\n','\n')!==next.replaceAll('\r\n','\n'))emit(file,Buffer.from(next));
 }
}
assert.equal(problems.length,0,'Mono font distribution is stale: '+problems.join(', '));
console.log(JSON.stringify({products:3,faces:2,bytes:output.assets.reduce((n,a)=>n+a.bytes.length,0),write}));
