// Read-only literal inventory. Candidates require context review, never automatic replacement.
import fs from 'node:fs';
import path from 'node:path';
import {copyNodes,copySourceFiles} from './copy-spacing.mjs';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',pattern=/차림표|거르개|고르개|지어낸|갈라낼|끝나지 않은|기한 지남|기한이 끝|재고선 아래|켜지 않은|종이로|빈 공정|두드려/;
const rows=[];
for(const [product,repo] of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']]){
 const base='D:/Claude/'+repo;
 for(const full of copySourceFiles(base,product)){
  const file=path.relative(base,full).replaceAll('\\','/'),code=fs.readFileSync(full,'utf8');
  for(const node of copyNodes(file,code))if(pattern.test(node.raw))rows.push({product,path:file,sourceHash:hash(code),...node});
 }
}
fs.writeFileSync(root+'/reviews/professional-copy-candidates.json',JSON.stringify({scope:'Read-only authored AST literal candidates. Comments, tests and engine/design sources are excluded. A candidate is not proof of a visible error or permission to modify business codes, official quotations or persisted values.',rows},null,2)+'\n');
console.log(JSON.stringify(rows.map(({product,path,line,raw})=>({product,path,line,text:raw.replace(/\s+/g,' ').slice(0,220)})),null,2));
