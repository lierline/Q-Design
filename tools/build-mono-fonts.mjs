import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createMonoFonts,embeddedAtelierMono,monoRoots,monoHash} from './mono-fonts-core.mjs';
// 2026-10-16(군살 빼기 결정 3): 제품 파일은 동기화(extract-all --sync)에서만 씁니다.
//   --write           Q-Design dist 의 글꼴 선언만 씁니다(만들기 걸음). 제품에 갈 파일은 세어 알리기만 합니다
//   --write-products  제품 public 의 글꼴 · 라이선스와 Q-Atelier 글꼴 CSS 만 씁니다(내보내기 걸음)
//   --check (기본)     둘 다 보고, 낡았으면 실패합니다
// --only=atelier,maison,carnet 으로 제품을 고릅니다(다른 세션이 일하는 제품 폴더를 비켜 가기 위해).
const root='D:/Claude/Q-Design',args=process.argv.slice(2),MODES=['--write','--write-products','--check'];
const modes=args.filter(a=>MODES.includes(a)),onlyArg=args.find(a=>a.startsWith('--only='));
assert(modes.length<=1&&args.every(a=>MODES.includes(a)||a.startsWith('--only=')),'Use --write, --write-products or --check and optional --only=atelier,maison,carnet.');
const mode=modes[0]??'--check',only=onlyArg?new Set(onlyArg.slice(7).split(',')):null;
assert(!only||[...only].every(p=>p in monoRoots),'Unknown --only product: '+onlyArg);
const output=createMonoFonts(root),problems=[],waiting=[];
function emit(file,bytes,target){
 if(fs.existsSync(file)&&monoHash(fs.readFileSync(file))===monoHash(bytes))return;
 const mine=mode==='--write'&&target==='dist'||mode==='--write-products'&&target==='product';
 if(mine){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,bytes);}
 else if(mode==='--write'&&target==='product')waiting.push(file);
 else problems.push(file);
}
emit(root+'/dist/q-design.mono-fonts.css',Buffer.from(output.css),'dist');
for(const [product,folder] of Object.entries(monoRoots)){
 if(only&&!only.has(product))continue;
 for(const asset of output.assets)emit(folder+'/public'+asset.url,asset.bytes,'product');
 emit(folder+'/public/fonts/jetbrains-mono/LICENSE.txt',output.license,'product');
 if(product==='carnet')emit(folder+'/public/fonts/JetBrainsMono-Variable.woff2',output.assets.find(a=>a.file.startsWith('JetBrainsMono-latin.')).bytes,'product');
 if(product==='atelier'){
  const file=folder+'/app/fonts.css',current=fs.readFileSync(file,'utf8');
  const next=embeddedAtelierMono(current,output.css);
  // Preserve existing line endings when the current generated body is already identical.
  if(current.replaceAll('\r\n','\n')!==next.replaceAll('\r\n','\n'))emit(file,Buffer.from(next),'product');
 }
}
assert.equal(problems.length,0,'Mono font distribution is stale: '+problems.join(', '));
console.log(JSON.stringify({products:only?only.size:3,faces:2,bytes:output.assets.reduce((n,a)=>n+a.bytes.length,0),mode,...(waiting.length?{productFilesForSync:waiting.length}:{})}));
