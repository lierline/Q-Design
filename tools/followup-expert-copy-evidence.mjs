import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {applyBindings,termsForFile} from './copy-spacing.mjs';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',ref='98421a26375bd0abadc07c81e1bec772c8e322de';
const req=createRequire(repo+'/package.json'),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(req.resolve('typescript').replace(/typescript\.js$/,'lib.dom.d.ts'),'utf8'));
const rules=JSON.parse(fs.readFileSync(root+'/patterns/copy-rules.json','utf8')).terms;
const files=['app/experts/settings/profile-form.tsx','app/experts/portal/signup/page.tsx'],deltas=new Map();
for(const file of files){
 const before=execFileSync('git',['show',ref+':'+file],{cwd:repo,encoding:'utf8'}).replaceAll('\r\n','\n');
 const after=fs.readFileSync(repo+'/'+file,'utf8').replaceAll('\r\n','\n');
 const terms=termsForFile(rules.filter(r=>['expert-career-unit-spacing','expert-specialty-choice-prompt'].includes(r.id)),'atelier',file);
 const expected=applyBindings(file,before,[],terms);
 assert.equal(expected.changes.length,1);assert.equal(after,expected.after,'Unreviewed expert copy change: '+file);
 const oldArgs=new Map(scanArguments(file,before,{ts,postcss,properties}).map(a=>[hash(JSON.stringify(a)),a]));
 const newArgs=new Set(scanArguments(file,after,{ts,postcss,properties}).map(a=>hash(JSON.stringify(a))));
 deltas.set(file,{before,after,oldArgs,newArgs});
}
const retained=[];
for(const name of fs.readdirSync(root+'/reviews').filter(n=>/^atelier-.*\.json$/.test(n)&&!['atelier-style-decisions.json','atelier-route-boundaries.json'].includes(n))){
 const full=root+'/reviews/'+name;let report;try{report=JSON.parse(fs.readFileSync(full,'utf8'));}catch{continue;}
 if(!Array.isArray(report.records))continue;let dirty=false;
 for(const record of report.records){
  const own=deltas.get(record.path);
  if(own&&record.sourceHash===hash(own.before)&&own.oldArgs.has(record.argumentHash)&&own.newArgs.has(record.argumentHash)){
   record.sourceHash=hash(own.after);dirty=true;retained.push({report:name,path:record.path,line:record.line});
  }
  const actual=fs.existsSync(repo+'/'+record.path)?fs.readFileSync(repo+'/'+record.path,'utf8'):null;
  if(!actual||hash(actual)!==record.sourceHash)continue;
  for(const e of record.evidence??[]){const delta=deltas.get(e.path);if(!delta||e.hash!==hash(delta.before))continue;
   if(delta.before.split('\n')[e.line-1]!==delta.after.split('\n')[e.line-1])continue;
   e.hash=hash(delta.after);dirty=true;retained.push({report:name,path:record.path,evidencePath:e.path,line:e.line});
  }
 }
 if(dirty)fs.writeFileSync(full,JSON.stringify(report,null,2)+'\n');
}
fs.writeFileSync(root+'/reviews/followup-expert-copy-evidence.json',JSON.stringify({ref,scope:'Exact two authored copy substitutions. Only identical AST arguments and unchanged evidence lines retain prior decisions. No changed label or new style is approved.',deltas:[...deltas].map(([path,d])=>({path,beforeHash:hash(d.before),afterHash:hash(d.after)})),retained},null,2)+'\n');
console.log(JSON.stringify({verifiedFiles:deltas.size,retained:retained.length}));
