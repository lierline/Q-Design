// Reviewable one-time migration of literal utility arguments, not business data.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { hash } from './style-arguments-core.mjs';
import { utilityBase } from './maison-style-proof.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Works');
const require=createRequire(path.join(product,'package.json')),ts=require('typescript');
const postcss=require('postcss'),tailwind=require('tailwindcss'),loadConfig=require('tailwindcss/loadConfig');
const selectorParser=createRequire(require.resolve('tailwindcss/package.json'))('postcss-selector-parser');

export function replaceClassLiterals(code,file,replacements){
  const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS),edits=[];
  const visit=node=>{
    if(ts.isStringLiteralLike(node)){
      const start=node.getStart(sf)+1,end=node.end-1,raw=code.slice(start,end);
      let next=raw;
      next=raw.replace(/\S+/g,(token,offset)=>{
        const line=sf.getLineAndCharacterOfPosition(start+offset).line+1;
        const replacement=replacements.find(([old,, ,allowedLine])=>token===old&&line===allowedLine);
        return replacement?.[1]??token;
      });
      if(next!==raw)edits.push({start,end,next});
    }
    ts.forEachChild(node,visit);
  };visit(sf);
  for(const edit of edits.sort((a,b)=>b.start-a.start))code=code.slice(0,edit.start)+edit.next+code.slice(edit.end);
  return{code,count:edits.length};
}

export async function compile(classes){
  const output=await postcss([tailwind({...loadConfig(path.join(product,'tailwind.config.ts')),content:[{raw:classes.join(' '),extension:'html'}]})]).process('@tailwind utilities;',{from:undefined});
  const result=new Map();
  output.root.walkRules(rule=>{
    const names=[];selectorParser(selectors=>selectors.walkClasses(node=>{if(classes.includes(node.value))names.push(node.value);})).processSync(rule.selector);
    for(const name of names){const decls=[];rule.each(node=>{if(node.type==='decl'&&!node.prop.startsWith('--tw-'))decls.push([node.prop,node.value]);});result.set(name,decls);}
  });return result;
}

async function main(){
  const report=JSON.parse(fs.readFileSync(path.join(root,'reviews/maison-style-decisions.json'),'utf8'));
  const sites=report.records.filter(record=>record.kind==='class-utility'&&record.decision!=='central-source-verified'&&/^(?:-?(?:max-|min-)?[wh]|grid-cols|grid-rows|basis|flex|z|align|left)-\[[^\]]+\]$/.test(utilityBase(record.value))&&!record.value.includes('var('));
  const candidates=[...new Set(sites.map(site=>site.value))],compiled=await compile(candidates),entries=[];
  for(const candidate of candidates){
    const base=utilityBase(candidate),decls=compiled.get(candidate);
    if(decls?.length!==1)throw new Error(`Needs manual CSS review: ${candidate}`);
    const[property,value]=decls[0],suffix=value.replaceAll('-','negative-').replaceAll('%','percent').replaceAll('.','-').replace(/[^a-zA-Z0-9-]+/g,'-').replace(/^-|-$/g,'');
    const token=`--qd-maison-${property}-${suffix}`;
    const prefix=base.slice(0,base.indexOf('[')).replace(/^-/,'');
    const replacement=candidate.slice(0,candidate.length-base.length)+`${prefix}[var(${token})]`;
    entries.push({original:candidate,replacement,property,token,value,sites:sites.filter(site=>site.value===candidate).map(site=>({path:site.path,line:site.line,sourceHash:site.sourceHash}))});
  }
  const plan={version:1,scope:'Exact existing layout values become centrally editable variables. Static presentation, not coordinate/data calculations. Responsive variants and current values are preserved.',entries};
  if(!process.argv.includes('--write')){console.log(JSON.stringify(plan,null,2));return;}
  const byFile=new Map();
  for(const entry of entries)for(const site of entry.sites){const items=byFile.get(site.path)??[];items.push([entry.original,entry.replacement,site.sourceHash,site.line]);byFile.set(site.path,items);}
  let changed=0;const writes=[];
  for(const[file,items]of byFile){
    const full=path.join(product,file),code=fs.readFileSync(full,'utf8');
    if(items.some(([, ,sourceHash])=>sourceHash!==hash(code)))throw new Error(`Stale review source: ${file}`);
    const next=replaceClassLiterals(code,file,items);
    if(!next.count)throw new Error(`No exact literal changed: ${file}`);
    const lines=next.code.split('\n');
    for(const[old,replacement,,line]of items)if(!lines[line-1]?.includes(replacement))throw new Error(`Unconverted reviewed class: ${file}:${line} ${old}`);
    writes.push([full,next.code]);changed+=next.count;
  }
  const tokens=new Map(entries.map(entry=>[entry.token,entry.value]));
  const central=path.join(root,'patterns/foundation/maison.css'),original=fs.readFileSync(central,'utf8');
  const block='/* Maison business layout arguments: preserve current values; edit here. */\n:root {\n'+[...tokens].map(([token,value])=>`  ${token}: ${value};`).join('\n')+'\n}\n';
  for(const[full,code]of writes)fs.writeFileSync(full,code);
  fs.writeFileSync(central,original+'\n'+block);
  fs.writeFileSync(path.join(root,'reviews/maison-layout-migration.json'),JSON.stringify(plan,null,2)+'\n');
  console.log(JSON.stringify({files:byFile.size,literals:changed,classes:entries.length,tokens:tokens.size}));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
