// A missing custom property invalidates a CSS declaration without a compiler error.
// Inventory all literal definitions, imperative writes and fallback-free Q aliases.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runtimeFiles } from './style-arguments-core.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const reports=[];
for(const [product,repo]of [['atelier','Q-Atelier'],['maison','Q-Works'],['carnet','DHR']]){
 const productRoot=join(root,'..',repo),definitions=new Set(),uses=[];
 for(const path of runtimeFiles(productRoot)){
  const text=readFileSync(join(productRoot,path),'utf8').replace(/\/\*[\s\S]*?\*\//g,comment=>comment.replace(/[^\n]/g,' '));
  for(const match of text.matchAll(/(--qd-[\w-]+)\s*:/g))definitions.add(match[1]);
  for(const match of text.matchAll(/(?:setProperty\(\s*|['"])(--qd-[\w-]+)['"]\s*[, :]/g))definitions.add(match[1]);
  for(const match of text.matchAll(/var\(\s*(--qd-[\w-]+)\s*\)/g))uses.push({path,line:text.slice(0,match.index).split('\n').length,token:match[1]});
 }
 const missing=uses.filter(use=>!definitions.has(use.token));
 reports.push({product,definitions:definitions.size,references:uses.length,missing});
}
writeFileSync(join(root,'dist/q-design.style-bindings.json'),JSON.stringify({version:1,note:'Literal definition existence only. Scoped runtime behavior is checked in the browser. This does not prove every alias is active on every element.',products:reports},null,2)+'\n');
console.log(JSON.stringify(reports.map(({product,definitions,references,missing})=>({product,definitions,references,missing})),null,2));
if(reports.some(report=>report.missing.length))process.exitCode=1;
