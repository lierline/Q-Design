// Q-Works 4d9361ae (2026-10-15) changed only the body of one login-form effect: which toast message to show,
// shown one tick later. This newest Maison source layer proves that every complete appearance argument and
// parent-navigation slot outside that body is exact, then reverses only that exact source for historical proofs.
// Any other login source passes through unchanged, so the earlier exact inventory checks reject it.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {backNavigationSlots,beforeClass,afterClass} from './maison-back-navigation.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',file='app/(auth)/login/login-form.tsx',proofPath=root+'/reviews/maison-login-session-notice.json';
const beforeRef='2aff4e23ec3b4bcd622ae39905c5085cfc638c99',afterRef='4d9361aeb054880c5354a79b21390c3a06256ddd';
const normalize=s=>s.replaceAll('\r\n','\n'),show=ref=>normalize(execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}));
let pinned;
function pinnedSources(){return pinned??=(()=>{const before=show(beforeRef),after=show(afterRef);return {before,after,beforeHash:hash(before),afterHash:hash(after)};})();}
export function beforeLoginNoticeSource(p,code){
 if(p!==file)return code;
 const s=pinnedSources(),h=hash(code);
 return h===s.afterHash?s.before:code;
}
// The edit must be one whole-line block that is exactly the body of one effect. Every argument and
// navigation slot outside it must be the same text at the same line, shifted only by the block's growth.
export function proveEffectBodyEdit(before,after){
 const scanTools=(()=>{const req=createRequire(repo+'/package.json'),ts=req('typescript');return {ts,postcss:req('postcss'),properties:cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'))};})();
 const b=normalize(before).split('\n'),a=normalize(after).split('\n');
 let prefix=0;while(prefix<b.length&&prefix<a.length&&b[prefix]===a[prefix])prefix++;
 let suffix=0;while(suffix<b.length-prefix&&suffix<a.length-prefix&&b[b.length-1-suffix]===a[a.length-1-suffix])suffix++;
 const hunk={beforeStart:prefix+1,beforeLines:b.length-prefix-suffix,afterStart:prefix+1,afterLines:a.length-prefix-suffix},shift=hunk.afterLines-hunk.beforeLines;
 assert(hunk.beforeLines>0&&hunk.afterLines>0,'A single replaced block is required');
 assert.equal(a[prefix-1].trim(),'useEffect(() => {','The block must open one effect body');
 assert.equal(a[a.length-suffix].trim(),'}, [initialError]);','The block must close the same effect body');
 const added=a.slice(prefix,a.length-suffix).join('\n');assert(!/className|style\s*[=:]|<[A-Za-z]/.test(added),'The effect body must not carry markup or appearance');
 const toBefore=line=>line<=prefix?line:line>prefix+hunk.afterLines?line-shift:null;
 const scan=code=>scanArguments(file,code,scanTools);
 const afterArguments=scan(after).map(r=>{const line=toBefore(r.line);assert.notEqual(line,null,'No appearance argument may sit inside the effect body');return {...r,line};});
 assert.deepEqual(afterArguments,scan(before),'Every complete appearance argument and its source location must remain exact');
 const slots={};for(const [name,className] of [['legacy',beforeClass],['current',afterClass]]){
  const was=backNavigationSlots(before,file,className),now=backNavigationSlots(after,file,className).map(s=>({...s,line:toBefore(s.line)}));
  assert.deepEqual(now,was,'Parent-navigation slots must remain exact');slots[name]=was.length;
 }
 return {hunk,lineShift:shift,appearanceArguments:afterArguments.length,navigationSlots:slots};
}
export function createLoginNoticeProof(live=fs.readFileSync(repo+'/'+file,'utf8')){
 const s=pinnedSources();assert.equal(hash(live),s.afterHash,'The live login source must be the exact reviewed 4d9361ae source');
 return {version:1,product:'maison',path:file,beforeRef,afterRef,beforeHash:s.beforeHash,afterHash:s.afterHash,...proveEffectBodyEdit(s.before,s.after),
  scope:'Q-Works 4d9361ae changed only the body of one login-form effect (which toast message to show, shown one tick later). Every complete appearance argument and parent-navigation slot outside it is exact, shifted by the recorded line offset. Only this exact after source reverses to the exact before source for historical proofs; any other content passes through and the exact checks reject it. No appearance argument, navigation destination or message wording is approved here.'};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const proof=createLoginNoticeProof();
 if(process.argv.includes('--write'))fs.writeFileSync(proofPath,JSON.stringify(proof,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(proofPath,'utf8')),proof);
 console.log(JSON.stringify({path:file,lineShift:proof.lineShift,appearanceArguments:proof.appearanceArguments,passed:true}));
}
