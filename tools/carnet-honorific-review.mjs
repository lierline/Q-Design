import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {applyBindings} from './copy-spacing.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/DHR',file='app/(admin)/page.tsx',ref='12d9deb00166911c7f249d7532ebf261774a8661',productRef='579120df7107af56c137f8aac8a56af87849ef91';
const show=(base,pin,p)=>execFileSync('git',['show',pin+':'+p],{cwd:base,encoding:'utf8',maxBuffer:128*1024*1024}),serialize=j=>JSON.stringify(j,null,2)+'\n';
export function deriveHonorific(){
 const rules=JSON.parse(fs.readFileSync(root+'/patterns/professional-carnet-copy.json','utf8')),term=rules.terms.find(t=>t.id==='carnet-user-honorific-spacing');assert.deepEqual(term,{id:'carnet-user-honorific-spacing',from:' 님',to:'님',products:['carnet'],paths:[file]});
 const before=show(repo,productRef,file),prior=JSON.parse(show(root,ref,'dist/q-design.copy-bindings.json')),old=prior.files.find(r=>r.product==='carnet'&&r.path===file);assert(old);
 const result=applyBindings(file,before,[],[term]);assert.equal(result.changes.length,1);assert.equal(result.changes[0].line,465);
 const req=createRequire('D:/Claude/Q-Atelier/package.json'),ts=req('typescript'),postcss=createRequire('D:/Claude/Q-Works/package.json')('postcss'),properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
 assert.deepEqual(scanArguments(file,result.after,{ts,postcss,properties}),scanArguments(file,before,{ts,postcss,properties}),'Every complete style argument must remain unchanged');
 const bindings=structuredClone(prior),target=bindings.files.find(r=>r.product==='carnet'&&r.path===file),change=result.changes[0];assert(!target.bindings.some(r=>r.line===change.line&&r.kind===change.kind&&r.ordinal===change.ordinal));target.bindings.push({line:change.line,kind:change.kind,ordinal:change.ordinal,original:change.original,emitted:change.emitted});
 return {before,after:result.after,prior,bindings,proof:{version:1,scope:'One homepage honorific space is removed by the central authored-copy rule. Every complete style argument and all other product bindings remain exact.',path:file,productRef,reviewRef:ref,beforeHash:hash(before),afterHash:hash(result.after),line:465}};
}
export function inspectHonorific(code=fs.readFileSync(repo+'/'+file,'utf8')){const result=deriveHonorific();assert.equal(hash(code),result.proof.afterHash,'Unreviewed homepage change');assert.deepEqual(JSON.parse(fs.readFileSync(root+'/dist/q-design.copy-bindings.current.json','utf8')).files.filter(r=>r.product==='carnet'),result.bindings.files.filter(r=>r.product==='carnet'));return result;}
export function beforeHonorificBindings(current){const result=inspectHonorific();if(JSON.stringify(current)===JSON.stringify(result.prior))return current;assert.deepEqual(current.files.filter(r=>r.product==='carnet'),result.bindings.files.filter(r=>r.product==='carnet'));const inverse=structuredClone(current),i=inverse.files.findIndex(r=>r.product==='carnet'&&r.path===file);assert(i>=0);inverse.files[i]=result.prior.files.find(r=>r.product==='carnet'&&r.path===file);return inverse;}
export function beforeHonorificReport(current){
 if(current.product!=='carnet')return current;const result=deriveHonorific();if(current.fileHashes.find(r=>r.path===file)?.hash!==result.proof.afterHash)return current;inspectHonorific();
 const old=JSON.parse(show(root,ref,'reviews/carnet-style-decisions.json'));assert.equal(current.records.length,old.records.length);const inverse=structuredClone(current);let changed=0;
 for(const[i,r]of current.records.entries()){const previous=old.records[i];if(r.path!==file){assert.deepEqual(r,previous);continue;}assert.equal(r.sourceHash,result.proof.afterHash);assert.deepEqual({...r,sourceHash:previous.sourceHash},previous);inverse.records[i]=previous;changed++;}assert.equal(changed,108);
 assert.equal(current.fileHashes.length,old.fileHashes.length);for(const[i,r]of current.fileHashes.entries()){const previous=old.fileHashes[i];assert.equal(r.path,previous.path);assert.equal(r.hash,r.path===file?result.proof.afterHash:previous.hash);inverse.fileHashes[i]=previous;}inverse.generatedAt=old.generatedAt;assert.deepEqual(inverse,old);return old;
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 if(process.argv.includes('--write')){const result=deriveHonorific(),current=fs.readFileSync(repo+'/'+file,'utf8');assert([result.proof.beforeHash,result.proof.afterHash].includes(hash(current)));const active=JSON.parse(fs.readFileSync(root+'/dist/q-design.copy-bindings.current.json','utf8')),ca=active.files.filter(r=>r.product==='carnet');assert([result.prior,result.bindings].some(r=>JSON.stringify(r.files.filter(f=>f.product==='carnet'))===JSON.stringify(ca)),'Unreviewed Carnet binding changes');const index=active.files.findIndex(r=>r.product==='carnet'&&r.path===file);assert(index>=0);active.files[index]=result.bindings.files.find(r=>r.product==='carnet'&&r.path===file);fs.writeFileSync(repo+'/'+file,result.after);fs.writeFileSync(root+'/dist/q-design.copy-bindings.current.json',serialize(active));fs.writeFileSync(root+'/reviews/carnet-honorific-review.json',serialize(result.proof));}
 const result=inspectHonorific();assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/carnet-honorific-review.json','utf8')),result.proof);console.log(JSON.stringify({literals:1,styleArgumentsUnchanged:true,passed:true}));
}
