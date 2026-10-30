import fs from 'node:fs';
import path from 'node:path';
import {applyBindings,termsForFile,copySourceFiles} from './copy-spacing.mjs';
import {implementationOwners} from './build-component-implementations.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works';
const rules=JSON.parse(fs.readFileSync(root+'/patterns/copy-rules.json','utf8'));
const terms=[...rules.terms,...rules.additionalRuleFiles.flatMap(file=>JSON.parse(fs.readFileSync(root+'/'+file,'utf8')).terms)];
const prior=JSON.parse(fs.readFileSync(root+'/dist/q-design.copy-bindings.json','utf8')).files,owners=implementationOwners(root),rows=[];
for(const full of copySourceFiles(product,'maison',owners)){
 const file=path.relative(product,full).replaceAll('\\','/'),canonical=owners.get('maison:'+file),code=fs.readFileSync(canonical?root+'/'+canonical:full,'utf8');
 const old=prior.find(r=>r.product==='maison'&&r.path===file);
 const result=applyBindings(file,code,old?.bindings??[],termsForFile(terms,'maison',file));
 for(const c of result.changes)rows.push({path:file,line:c.line,kind:c.kind,raw:c.raw,emitted:c.emitted});
}
fs.writeFileSync(root+'/reviews/maison-pending-copy.json',JSON.stringify({scope:'Read-only current exact central copy changes awaiting context review.',rows},null,2)+'\n');console.log(JSON.stringify(rows,null,2));
