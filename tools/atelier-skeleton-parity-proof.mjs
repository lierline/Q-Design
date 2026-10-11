// Two exact loading-height changes. Unchanged manual decisions are retained
// only after checking the original complete source and each lexical argument.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const product=path.resolve(root,'../Q-Atelier'),target='lib/design/components.tsx';
const req=createRequire(product+'/package.json'),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
export const changes=[['h = QDPresentation.skeletonHeight[12],','h = QDPresentation.skeletonHeight[14],'],['h={QDPresentation.skeletonHeight[10]}','h={QDPresentation.skeletonHeight[12]}']];
const norm=text=>text.replaceAll('\r\n','\n');
export function verifySkeletonBodies(before,after){
 before=norm(before);after=norm(after);
 assert.equal(hash(before),'04171dbf840569763bc305b0242e13aa9aa9ad4bdf21c356d519a19a68dff5a8');
 let expected=before;
 for(const [old,next]of changes){assert.equal(expected.split(old).length-1,1);expected=expected.replace(old,next);}
 assert.equal(after,expected,'Only the two reviewed Skeleton height expressions may change');
 return {before,after,beforeHash:hash(before),afterHash:hash(after)};
}
export function skeletonBodies(){
 const before=fs.readFileSync(root+'/reviews/fixtures/atelier-skeleton-components-before.tsx','utf8');
 const canonical=fs.readFileSync(root+'/patterns/component-implementations/atelier/'+target,'utf8');
 assert.equal(norm(fs.readFileSync(product+'/'+target,'utf8')),norm(canonical));
 return verifySkeletonBodies(before,canonical);
}
function contextNodes(code,line,text){
 const sf=ts.createSourceFile(target,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),compact=s=>s.replace(/\s+/g,' ').trim(),found=[];
 const visit=n=>{const a=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,b=sf.getLineAndCharacterOfPosition(n.end).line+1,full=compact(n.getText(sf));if(a<=line&&b>=line&&(full===compact(text)||text.length===240&&full.startsWith(compact(text))))found.push(full);ts.forEachChild(n,visit);};visit(sf);return found.sort();
}
export function retainSkeletonEvidence(input,bodies=skeletonBodies()){
 const {before,after,beforeHash,afterHash}=verifySkeletonBodies(bodies.before,bodies.after),review=structuredClone(input);
 const scan=code=>new Map(scanArguments(target,code,{ts,postcss,properties}).map(a=>[hash(JSON.stringify(a)),a]));
 const oldArgs=scan(before),newArgs=scan(after),oldLines=before.split('\n'),newLines=after.split('\n');
 for(const row of review.records??[]){
  if(row.path===target){
   assert.equal(row.sourceHash,beforeHash);const old=oldArgs.get(row.argumentHash);assert(old,'Review must identify a real original argument');
   assert.deepEqual(newArgs.get(row.argumentHash),old,'Changed arguments cannot inherit prior decisions');
   for(const c of row.consumerContext??[]){const original=contextNodes(before,c.line,c.text);assert(original.length,'Original consumer context must resolve');assert.deepEqual(contextNodes(after,c.line,c.text),original,'Complete consumer AST must remain unchanged, including truncated inventory contexts');}
   row.sourceHash=afterHash;
  }
  for(const e of row.evidence??[])if(e.path===target){
   assert.equal(e.hash,beforeHash);assert(Number.isInteger(e.line)&&e.line>0);
   assert.equal(oldLines[e.line-1],newLines[e.line-1],'Changed source lines need new evidence');e.hash=afterHash;
  }
 }
 return review;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv.slice(2);assert(mode.length===1&&['--write','--check'].includes(mode[0]));const bodies=skeletonBodies();
 const files=['atelier-style-consumer-review','atelier-style-bindings-review','atelier-data-ratio-review'],writes=[];
 for(const name of files){
  const file=root+'/reviews/'+name+'.json',proofFile=root+'/reviews/'+name+'-skeleton-revalidation.json',current=JSON.parse(fs.readFileSync(file,'utf8'));
  if(mode[0]==='--write'){
   const after=retainSkeletonEvidence(current,bodies),records=[];
   current.records.forEach((before,index)=>{if(JSON.stringify(before)!==JSON.stringify(after.records[index]))records.push({index,before,after:after.records[index]});});
   const beforeReportHash=hash(JSON.stringify(current,null,2)+'\n'),afterReportHash=hash(JSON.stringify(after,null,2)+'\n');
   writes.push([proofFile,JSON.stringify({version:1,path:target,beforeHash:bodies.beforeHash,afterHash:bodies.afterHash,beforeReportHash,afterReportHash,records},null,2)+'\n'],[file,JSON.stringify(after,null,2)+'\n']);console.log(name+': '+records.length+' unchanged argument reviews retained');
  }else{
   const proof=JSON.parse(fs.readFileSync(proofFile,'utf8'));assert.equal(proof.beforeHash,bodies.beforeHash);assert.equal(proof.afterHash,bodies.afterHash);assert.equal(hash(JSON.stringify(current,null,2)+'\n'),proof.afterReportHash);
   const reconstructed=structuredClone(current);for(const item of proof.records){assert.deepEqual(current.records[item.index],item.after);reconstructed.records[item.index]=item.before;}
   assert.equal(hash(JSON.stringify(reconstructed,null,2)+'\n'),proof.beforeReportHash);assert.deepEqual(retainSkeletonEvidence(reconstructed,bodies),current);
  }
 }
 for(const [file,json]of writes)fs.writeFileSync(file,json);
 console.log('Two Skeleton height expressions and exact unchanged manual evidence verified.');
}
