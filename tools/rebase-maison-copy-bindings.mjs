// Reinspect exact authored literals against the completed feature handoff.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {copyNodes} from './copy-spacing.mjs';
import {implementationOwners} from './build-component-implementations.mjs';
import {hash} from './style-arguments-core.mjs';
import {createRequire} from 'node:module';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',ref='0b7e83970ce52dc170efbf25e950f310ee338693',serialize=v=>JSON.stringify(v,null,2)+'\n';
const filename=root+'/dist/q-design.copy-bindings.json',before=JSON.parse(fs.readFileSync(filename,'utf8')),after=structuredClone(before),owners=implementationOwners(root),sources=[],actions=[],ambiguous=[];
// Manually inspected branches in the exact pinned handoff source. The new
// improvements approval branch repeats the same display wording twice.
const reviewedTargets=new Map([
 ['app/(app)/improvements/approval-buttons.tsx:141:TemplateHead:0',[161,162]],
 ['components/shared/list-stats.tsx:307:StringLiteral:0',[317]],
]);
const ts=createRequire(product+'/package.json')('typescript');
function literalAnchors(file,code){
 const sf=ts.createSourceFile(file,code,99,true,file.endsWith('x')?4:3),anchors=new Map();
 const visit=n=>{if(ts.isStringLiteralLike(n)||ts.isJsxText(n)||ts.isTemplateHead(n)||ts.isTemplateMiddle(n)||ts.isTemplateTail(n)){
  const chain=[];for(let p=n.parent;p;p=p.parent){if(ts.isPropertyAssignment(p))chain.push('property:'+p.name.getText(sf));if((ts.isVariableDeclaration(p)||ts.isFunctionDeclaration(p)||ts.isMethodDeclaration(p))&&p.name)chain.push(ts.SyntaxKind[p.kind]+':'+p.name.getText(sf));}
  anchors.set(n.getStart(sf),JSON.stringify(chain));
 }ts.forEachChild(n,visit);};visit(sf);return anchors;
}
for(const row of after.files.filter(r=>r.product==='maison')){
 const current=fs.readFileSync(owners.has('maison:'+row.path)?root+'/'+owners.get('maison:'+row.path):product+'/'+row.path,'utf8');
 const pinned=execFileSync('git',['show',ref+':'+row.path],{cwd:product,encoding:'utf8',maxBuffer:32*1024*1024});
 assert.equal(hash(current),hash(pinned),'The copy handoff rebase must inspect the exact committed product source: '+row.path);
 const nodes=copyNodes(row.path,current),bindings=[];sources.push({path:row.path,sourceHash:hash(current)});
 const legacy=execFileSync('git',['show','160c7731e05400259ee75cc49274625b3a667e1a601e:'+row.path],{cwd:product,encoding:'utf8',maxBuffer:32*1024*1024}),oldNodes=copyNodes(row.path,legacy),oldAnchors=literalAnchors(row.path,legacy),newAnchors=literalAnchors(row.path,current);
 for(const binding of row.bindings){
  const exact=nodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal&&n.raw===binding.emitted);
  if(exact){bindings.push(binding);continue;}
  let matches=nodes.filter(n=>n.kind===binding.kind&&n.raw===binding.emitted);
  const oldNode=oldNodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal&&n.raw===binding.emitted);
  if(matches.length>1&&oldNode){const anchored=matches.filter(n=>newAnchors.get(n.start)===oldAnchors.get(oldNode.start));if(anchored.length===1)matches=anchored;}
  if(matches.length>1){
   const lines=reviewedTargets.get(`${row.path}:${binding.line}:${binding.kind}:${binding.ordinal}`);
   if(!lines){ambiguous.push({path:row.path,binding,matches:matches.map(({start,end,...n})=>n)});continue;}
   for(const line of lines){const n=matches.find(n=>n.line===line);assert(n,'Reviewed display branch is missing');const next={...binding,line:n.line,ordinal:n.ordinal};bindings.push(next);actions.push({path:row.path,status:'reviewed-exact-display-branch',before:binding,after:next});}
   continue;
  }
  if(matches.length===1){const n=matches[0],next={...binding,line:n.line,ordinal:n.ordinal};bindings.push(next);actions.push({path:row.path,status:'relocated-exact-literal',before:binding,after:next});}
  else actions.push({path:row.path,status:'retired-absent-literal',before:binding,reason:'The previous exact emitted literal no longer exists after the completed feature migration. It cannot inherit an old binding. Fresh current authored text still receives the normal central copy scan.'});
 }
 const unique=new Map();for(const b of bindings){const key=`${b.line}:${b.kind}:${b.ordinal}`;if(unique.has(key))assert.deepEqual(unique.get(key),b,'Conflicting exact display binding');unique.set(key,b);}row.bindings=[...unique.values()];
}
const proof={version:1,productRef:ref,scope:'Exact current authored literal relocation only. No style approval, changed wording inheritance or product source mutation. Absent old literals are explicitly retired; ambiguous matches block the write. Other product bindings are preserved byte-for-byte as JSON values.',beforeHash:hash(serialize(before)),afterHash:hash(serialize(after)),sources,actions,ambiguous};
fs.writeFileSync(root+'/reviews/maison-copy-handoff-rebase.json',serialize(proof));
console.log(JSON.stringify({files:sources.length,relocated:actions.filter(a=>a.status==='relocated-exact-literal').length,retired:actions.filter(a=>a.status==='retired-absent-literal').length,ambiguous},null,2));
if(process.argv.includes('--write')){assert.equal(ambiguous.length,0,'Ambiguous literal bindings require review');fs.writeFileSync(filename,serialize(after));}
