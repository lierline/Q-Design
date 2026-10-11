import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
import {retainToastLayoutEvidence} from './toast-layout-proof.mjs';
import {retainLoadingControlEvidence} from './maison-loading-control-proof.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),repo=path.resolve(root,'../Q-Works');
const ref='260975db2ca1548c442876f6ce2243807bb3b361',file='components/ui/sonner.tsx';
export const maisonToastCopyEdit={before:'        unstyled: true,',after:'        unstyled: true,\n        style: {\n          width: "100%",\n        },'};
export const maisonToastCopyEdits=[maisonToastCopyEdit,{before:'          toast: "group toast qd-toast",',after:'          toast: "group toast qd-toast",\n          content: "min-w-[var(--qd-space-0)]",'},{before:'      className="toaster group"',after:'      className="toaster group"\n      style={{ width: "var(--qd-toast-width)" }}\n      offset={{ top: "var(--qd-toast-inset-top)", right: "var(--qd-toast-inset-right)", bottom: "var(--qd-toast-inset-bottom)", left: "var(--qd-toast-inset-left)" }}\n      mobileOffset={{ top: "var(--qd-toast-inset-top)", right: "var(--qd-toast-inset-right)", bottom: "var(--qd-toast-inset-bottom)", left: "var(--qd-toast-inset-left)" }}'}];
maisonToastCopyEdits[2].after=`      className="toaster group"
      style={{ width: "var(--qd-toast-width)" }}
      offset={{
        top: "var(--qd-toast-inset-top)",
        right: "var(--qd-toast-inset-right)",
        bottom: "var(--qd-toast-inset-bottom)",
        left: "var(--qd-toast-inset-left)",
      }}
      mobileOffset={{
        top: "var(--qd-toast-inset-top)",
        right: "var(--qd-toast-inset-right)",
        bottom: "var(--qd-toast-inset-bottom)",
        left: "var(--qd-toast-inset-left)",
      }}`;
export function applyMaisonToastCopy(source){source=source.replaceAll('\r\n','\n');for(const edit of maisonToastCopyEdits){assert.equal(source.split(edit.before).length,2,'Exact Sonner option replacement');source=source.replace(edit.before,edit.after);}return source;}
export function verifyMaisonToastCopy(before,after){assert.equal(after.replaceAll('\r\n','\n'),applyMaisonToastCopy(before),'Only central Sonner copy bindings may change');}
export function retainedMaisonToastReview(before,after){
 verifyMaisonToastCopy(before,after);
 const review=JSON.parse(execFileSync('git',['show','cf00e72:reviews/maison-style-manual-review.json'],{cwd:root,encoding:'utf8'}));
 const rows=review.records.filter(r=>r.path===file&&r.ruleId==='toaster-marker-class');assert.equal(rows.length,1,'Single exact inert marker review');
 const row=rows[0];assert.equal(row.sourceHash,hash(before));assert.equal(row.line,8);assert.equal(row.value,'toaster');
 const beforeLines=before.replaceAll('\r\n','\n').split('\n'),afterLines=after.replaceAll('\r\n','\n').split('\n');assert.equal(beforeLines[row.line-1],afterLines[row.line-1]);
 row.sourceHash=hash(after);
 for(const evidence of row.evidence)if(evidence.path===file){assert.equal(evidence.hash,hash(before));assert.equal(beforeLines[evidence.line-1],afterLines[evidence.line-1]);evidence.hash=hash(after);}
 const require=createRequire(repo+'/package.json'),ts=require('typescript'),postcss=require('postcss');
 const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(require.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
 const candidates=scanArguments(file,after,{ts,postcss,properties}).filter(a=>(a.kind==='presentation-attribute'&&a.property==='offset')||(a.kind==='object-property'&&a.property==='width'&&a.value==='"100%"')||(a.kind==='object-property'&&a.property==='content'&&a.value==='"min-w-[var(--qd-space-0)]"'));
 assert.equal(candidates.length,3,'Exact new Sonner visual adapter arguments');
 const foundation=fs.readFileSync(root+'/patterns/foundation.css','utf8'),apiPath='node_modules/sonner/dist/index.d.ts',api=fs.readFileSync(repo+'/'+apiPath,'utf8');
 assert(api.includes('offset?: Offset;')&&api.includes('content?: string;'));
 for(const a of candidates){
  const width=a.property==='width';
  const names=a.property==='offset'?['--qd-toast-inset-top','--qd-toast-inset-right','--qd-toast-inset-bottom','--qd-toast-inset-left']:a.property==='content'?['--qd-space-0']:['--qd-toast-width'];
  const evidence=[{path:file,line:a.line,hash:hash(after)},{path:apiPath,line:1,hash:hash(api)},...names.map(name=>{const line=foundation.split('\n').findIndex(s=>s.trim().startsWith(name+':'))+1;assert(line>0);return {path:'patterns/foundation.css',line,hash:hash(foundation)};})];
  if(a.property==='content')evidence.push({path:'patterns/foundation.css',line:1,hash:hash(foundation)});
  review.records.push({path:file,line:a.line,sourceHash:hash(after),argumentHash:hash(JSON.stringify([file,a.line,a.kind,a.property,a.value])),kind:a.kind,property:a.property,value:a.value,decision:width?'structural-behavior':'token-reference-verified',ruleId:'exact-sonner-toast-adapter',reason:width?'The exact toast width is 100% of the centrally sized Sonner stack. This relative fill is not an independent visual dimension.':'Exact pinned Sonner adapter and installed property types. Offset members read the four declared safe-area tokens; the content class supplies the central zero flex minimum. Other caller props and states remain separately inventoried.',evidence});
 }
 return retainLoadingControlEvidence(retainToastLayoutEvidence(review));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}),after=fs.readFileSync(repo+'/'+file,'utf8');verifyMaisonToastCopy(before,after);
 const proof={ref,scope:'Exact default Sonner wrapping, flex minimum and shared safe-area placement bindings. Inert container marker, unstyled mode, existing classes, caller props, timers, dismissal and values are unchanged. Library defaults no longer bypass central copy and width tokens.',records:[{path:file,beforeHash:hash(before),afterHash:hash(after),edits:maisonToastCopyEdits}]};
 const target=root+'/reviews/maison-toast-copy-migration.json',manual=root+'/reviews/maison-style-manual-review.json';
 if(process.argv.includes('--retain'))fs.writeFileSync(manual,JSON.stringify(retainedMaisonToastReview(before,after),null,2)+'\n');
 if(process.argv.includes('--check')){assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),proof);assert.deepEqual(JSON.parse(fs.readFileSync(manual,'utf8')),retainedMaisonToastReview(before,after),'Only the unchanged inert marker may retain evidence');}
 else fs.writeFileSync(target,JSON.stringify(proof,null,2)+'\n');
 console.log('Maison toast copy source and marker proof passed.');
}
