// Relocate exact literals only. Missing, edited or ambiguous text is never approved.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {copyNodes} from './copy-spacing.mjs';
import {implementationOwners} from './build-component-implementations.mjs';
const root=path.resolve(import.meta.dirname,'..');
export function reanchorBindings(file,code,bindings){
  const nodes=copyNodes(file,code),used=new Set();
  return bindings.map(binding=>{
    let node=nodes.find(n=>n.line===binding.line&&n.kind===binding.kind&&n.ordinal===binding.ordinal&&n.raw===binding.emitted);
    if(!node){
      const matches=nodes.filter(n=>n.kind===binding.kind&&n.raw===binding.emitted);
      if(matches.length!==1)throw Error(`Missing or ambiguous unchanged copy: ${file}:${binding.line}`);
      [node]=matches;
    }
    if(used.has(node.start))throw Error(`Duplicate copy binding: ${file}:${node.line}`);
    used.add(node.start);
    return {...binding,line:node.line,ordinal:node.ordinal};
  });
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  if(process.argv.length!==3||!['--write','--check'].includes(process.argv[2]))throw Error('Use --write or --check');
  const file=root+'/dist/q-design.copy-bindings.current.json',before=fs.readFileSync(file,'utf8'),report=JSON.parse(before),owners=implementationOwners(root),repos={atelier:'Q-Atelier',maison:'Q-Works',carnet:'DHR'};
  let moved=0;
  for(const row of report.files){
    const canonical=owners.get(row.product+':'+row.path)??row.canonical;
    const source=canonical?path.join(root,canonical):path.join(root,'..',repos[row.product],row.path);
    const next=reanchorBindings(row.path,fs.readFileSync(source,'utf8'),row.bindings);
    moved+=next.filter((b,i)=>b.line!==row.bindings[i].line||b.ordinal!==row.bindings[i].ordinal).length;
    row.bindings=next;
  }
  if(process.argv[2]==='--check'&&moved)throw Error(`Copy locations need reanchoring: ${moved}`);
  if(process.argv[2]==='--write'&&moved)fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({files:report.files.length,moved}));
}
