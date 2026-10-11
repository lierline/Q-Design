// The native startup renderer has one canonical presentation recipe.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {COLOR_AUDIT_TARGETS,parseCoverageArgs} from './audit-coverage-imports.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const NATIVE_LAUNCHERS=[
 {key:'Q-Atelier',product:'atelier',repo:'Q-Atelier-App',package:'app.medqraft.qatelier',wordmark:'Q-ATELIER'},
 {key:'Q-Works',product:'maison',repo:'Q-Maison-App',package:'app.medqraft.maison',wordmark:'Q-MAISON'},
 {key:'Q-Forge',product:'carnet',repo:'Q-Carnet-App',package:'app.medqraft.carnet',wordmark:'Q-CARNET'},
];
const norm=s=>s.replaceAll('\r\n','\n');
export function renderNativeLauncher(template,config){
 assert(NATIVE_LAUNCHERS.some(c=>c.package===config.package&&c.wordmark===config.wordmark),'Reviewed product identity only');
 assert.equal((template.match(/\{\{QD_NATIVE_PACKAGE\}\}/g)??[]).length,1);
 assert.equal((template.match(/\{\{QD_NATIVE_WORDMARK\}\}/g)??[]).length,3);
 const output=norm(template).replaceAll('{{QD_NATIVE_PACKAGE}}',config.package).replaceAll('{{QD_NATIVE_WORDMARK}}',config.wordmark);
 assert(!output.includes('{{'),'Unknown native recipe placeholder');return output;
}
export function verifyNativeLauncher(expected,actual){assert.equal(norm(actual),expected,'Native startup renderer differs from the canonical recipe');}
export function buildNativeLaunchers(root=ROOT,{check=false,write=false,only=null}={}){
 if(only)for(const key of only)assert(COLOR_AUDIT_TARGETS.includes(key),'Unknown product selection: '+key);
 const templateFile='patterns/native/launch-view.java.tpl',template=fs.readFileSync(root+'/'+templateFile,'utf8'),records=[];
 for(const config of NATIVE_LAUNCHERS){
  const selected=!only||only.has(config.key);
  const output=renderNativeLauncher(template,config),file=`dist/native-launchers/LaunchView.${config.product}.java`,target=`${config.repo}/app/src/main/java/${config.package.replaceAll('.','/')}/LaunchView.java`,actualPath=path.resolve(root,'..',target);
  if(check)verifyNativeLauncher(output,fs.readFileSync(root+'/'+file,'utf8'));
  else{fs.mkdirSync(path.dirname(root+'/'+file),{recursive:true});fs.writeFileSync(root+'/'+file,output);}
  if(selected&&write&&norm(fs.readFileSync(actualPath,'utf8'))!==output)fs.writeFileSync(actualPath,output);
  if(selected&&(check||write))verifyNativeLauncher(output,fs.readFileSync(actualPath,'utf8'));
  records.push({product:config.product,key:config.key,template:templateFile,templateHash:hash(template),generated:file,target,sourceHash:hash(output),identity:{package:config.package,wordmark:config.wordmark}});
 }
 const report={version:1,scope:'Exact native startup recipe ownership. Only package and product wordmark are substituted. Typography, shared canvas and hint strategy continue to consume central resources. Shipped logo/font assets, Android user animation scale, runtime state and other native components are distinct boundaries. This is not installation or visual certification.',records},json=JSON.stringify(report,null,2)+'\n',catalog=root+'/dist/q-design.native-launchers.json';
 if(check)assert.equal(fs.readFileSync(catalog,'utf8'),json,'Native renderer catalog is stale');else fs.writeFileSync(catalog,json);
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.every(a=>['--check','--write'].includes(a)||a.startsWith('--only=')));
 assert(!(args.includes('--check')&&args.includes('--write')));
 const onlyArgs=args.filter(a=>a.startsWith('--only=')),{only}=parseCoverageArgs(onlyArgs),report=buildNativeLaunchers(ROOT,{check:args.includes('--check'),write:args.includes('--write'),only});
 console.log(JSON.stringify({renderers:report.records.length,selected:report.records.filter(r=>!only||only.has(r.key)).map(r=>r.product),synchronized:args.includes('--check')||args.includes('--write')}));
}
