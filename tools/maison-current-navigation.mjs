import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {backNavigationSlots,beforeClass,afterClass} from './maison-back-navigation.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works';
export function createCurrentMaisonNavigation(overrides=new Map()){
 const files=runtimeFiles(product).filter(p=>p.startsWith('app/')&&p.endsWith('.tsx')),records=[],inventory=[];
 for(const file of files){
  const code=overrides.get(file)??fs.readFileSync(product+'/'+file,'utf8');inventory.push([file,hash(code)]);
  if(code.includes(beforeClass))assert.equal(backNavigationSlots(code,file,beforeClass).length,0,'Legacy parent-navigation appearance remains: '+file);
  if(!code.includes(afterClass))continue;
  for(const slot of backNavigationSlots(code,file,afterClass))records.push({path:file,line:slot.line,sourceHash:hash(code),href:slot.href,className:afterClass,consumer:'next/link with ArrowLeft and a visible label'});
 }
 assert(records.length>0,'Current shared navigation consumers must exist');
 const central=fs.readFileSync(root+'/patterns/components.css','utf8'),copy=fs.readFileSync(product+'/app/q-design.components.css','utf8');
 assert(central.includes('.qd-text-action--regular')&&central.includes('var(--qd-control-height)'));
 assert(copy.replaceAll('\r\n','\n').includes(central.replaceAll('\r\n','\n').trim()),'Actual navigation must import the exact central recipes');
 return {version:1,scope:'Current exact parent-navigation text-action consumers after the Maison feature handoff. Complete app source inventory is bound. New PageHead and delegated controls retain their own component contracts; this does not approve unrelated routes or business destinations.',inventoryHash:hash(JSON.stringify(inventory)),centralHash:hash(central),records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=createCurrentMaisonNavigation(),file=root+'/reviews/maison-current-navigation-review.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);
 console.log(JSON.stringify({currentLinks:report.records.length,passed:true}));
}
