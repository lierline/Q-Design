// Static reinspection of the completed feature migration. No inherited approvals.
import fs from 'node:fs';
const root='D:/Claude/Q-Design';
const review=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8'));
const unknown=review.records.filter(r=>r.decision==='unknown'),groups=new Map(),files=new Map();
for(const row of unknown){
 const key=JSON.stringify([row.kind,row.property,row.value]);
 const entry=groups.get(key)??{kind:row.kind,property:row.property,value:row.value,count:0,examples:[]};
 entry.count++;if(entry.examples.length<3)entry.examples.push({path:row.path,line:row.line});groups.set(key,entry);
 files.set(row.path,(files.get(row.path)??0)+1);
}
const result={scope:'Fresh static unknown candidates after Maison feature handoff. Grouping only, no acceptance or visual certificate.',unknown:unknown.length,groups:[...groups.values()].sort((a,b)=>b.count-a.count),files:[...files].sort((a,b)=>b[1]-a[1])};
fs.writeFileSync(root+'/reviews/maison-handoff-candidates.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({...result,groups:result.groups.slice(0,24),files:result.files.slice(0,14)},null,2));
