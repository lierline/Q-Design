// Run proposed coverage against the existing classifiers without changing live inputs.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',scanner=fs.readFileSync(root+'/tools/style-arguments-core.mjs','utf8');
const needle="'connectorColor', 'chipColor', 'iconColor', 'dotColor']);";
assert.equal(scanner.split(needle).length,2);
const proposed=scanner.replace(needle,"'connectorColor', 'chipColor', 'iconColor', 'dotColor', 'tone']);");
const coreURL='data:text/javascript;base64,'+Buffer.from(proposed).toString('base64');
const summary=[];
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7).split(',')??['atelier','maison','carnet'];
assert(only.every(p=>['atelier','maison','carnet'].includes(p)));
for(const product of only){
 const source=root+'/tools/'+product+'-style-review.mjs',temporary=root+'/tools/.tone-style-preview-'+product+'.mjs';
 const code=fs.readFileSync(source,'utf8'),oldName='reviews/'+product+'-style-decisions.json',newName='reviews/tone-proposed-'+product+'-style-decisions.json';
 assert(code.includes("'./style-arguments-core.mjs'"));
 const oldBasename=product+'-style-decisions.json',newBasename='tone-proposed-'+product+'-style-decisions.json';
 const publish="const outcome=finishReview(report,path.join(ROOT,'reviews'),mode);";
 if(product==='maison')assert.equal(code.split(publish).length,2);else assert.equal(code.split(oldBasename).length,2);
 assert(!fs.existsSync(temporary),'Do not overwrite a pre-existing temporary script');
 let executable=code.replaceAll("'./style-arguments-core.mjs'",JSON.stringify(coreURL));
 executable=product==='maison'?executable.replace(publish,"fs.writeFileSync(path.join(ROOT,'"+newName+"'),JSON.stringify(report,null,2)+'\\n'); const outcome={preview:true,unknownCount:report.unknownCount};"):executable.replace(oldBasename,newBasename);
 fs.writeFileSync(temporary,executable);
 try{
  const result=spawnSync(process.execPath,[temporary],{cwd:root,stdio:'inherit',windowsHide:true});
  assert.equal(result.status,0,'Proposed classifier run failed for '+product);
 }finally{fs.unlinkSync(temporary);}
 const before=JSON.parse(fs.readFileSync(root+'/'+oldName,'utf8')),after=JSON.parse(fs.readFileSync(root+'/'+newName,'utf8'));
 const oldKeys=new Set(before.records.map(r=>JSON.stringify([r.path,r.argumentHash])));
 const retained=after.records.filter(r=>oldKeys.has(JSON.stringify([r.path,r.argumentHash]))),added=after.records.filter(r=>!oldKeys.has(JSON.stringify([r.path,r.argumentHash])));
 assert.deepEqual(retained,before.records,'No earlier full decision may change in this discovery run');
 summary.push({product,sourceHash:hash(code),beforeScannerHash:hash(scanner),proposedScannerHash:hash(proposed),beforeReportHash:hash(JSON.stringify(before,null,2)+'\n'),newArguments:added.length,counts:added.reduce((out,r)=>(out[r.decision]=(out[r.decision]??0)+1,out),{}),added});
}
fs.writeFileSync(root+'/reviews/tone-proposed-classification-'+only.join('-')+'.json',JSON.stringify({scope:'Discovery only, not accepted decisions or live inventory changes. Existing full rows must remain exact. Newly accepted baseline-classifier decisions still require consumer validation before live registration.',products:summary},null,2)+'\n');
console.log(JSON.stringify(summary.map(({product,newArguments,counts})=>({product,newArguments,counts}))));
