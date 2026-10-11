// Diagnostic grammar audit. Unresolved scopes and untyped custom values stay visible.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {inlineStyleDependencies,typedStyleDependencies} from './maison-style-proof.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const require=createRequire(root+'/../Q-Atelier/package.json'),postcss=require('postcss'),ts=require('typescript'),{chromium}=require('playwright');
const products=['atelier','maison','carnet'],sources={};
for(const product of products){
 const files=['patterns/foundation.css','patterns/components.css','patterns/workspace.css',`dist/q-design.foundation.${product}.css`],decls=[];
 for(const file of files)postcss.parse(fs.readFileSync(root+'/'+file,'utf8')).walkDecls(d=>decls.push({file,line:d.source.start.line,property:d.prop,value:d.value}));
 const consumers=new Map();
 const argumentsReport=JSON.parse(fs.readFileSync(root+`/reviews/${product}-style-decisions.json`,'utf8'));
 const exactStyles=new Map(),repo={atelier:'Q-Atelier',maison:'Q-Works',carnet:'DHR'}[product];
 for(const file of new Set(argumentsReport.records.filter(r=>r.kind==='object-property'&&/\.[jt]sx?$/.test(r.path)).map(r=>r.path))){
  const code=fs.readFileSync(path.resolve(root,'../'+repo,file),'utf8'),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS),members=[...inlineStyleDependencies(sf,ts).values(),...typedStyleDependencies(sf,ts).values()].flat();
  exactStyles.set(file,new Set(members.map(m=>JSON.stringify([m.line,m.property,m.value]))));
 }
 for(const d of [...decls,...argumentsReport.records.filter(r=>r.kind==='object-property'&&exactStyles.get(r.path)?.has(JSON.stringify([r.line,r.property,r.value]))).map(r=>({property:r.property.replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value:r.value}))]){
  if(!d.property||d.property.startsWith('--'))continue;
  const scalar=d.value.trim().replace(/^(['"])([\s\S]*)\1$/,'$2').replace(/^\{([\s\S]*)\}$/,'$1');
  const direct=/^var\(\s*(--[\w-]+)(?:\s*,[^()]*)?\s*\)$/.exec(scalar);
  if(direct){const variable=direct[1],list=consumers.get(variable)??new Set();list.add(d.property);consumers.set(variable,list);}
 }
 sources[product]=decls.filter(d=>/\b(?:calc|min|max|clamp)\(/.test(d.value)).map(d=>({...d,properties:d.property.startsWith('--')?[...(consumers.get(d.property)??[])]:[d.property]}));
}
const server=spawn(process.execPath,[root+'/tools/serve-component-workbench.mjs'],{cwd:root,env:{...process.env,QD_AUDIT_PORT:'4831'},windowsHide:true,stdio:['ignore','pipe','pipe']});
await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(Error('Preview server exited '+code)));});
const browser=await chromium.launch({channel:'msedge',headless:true}),records=[];
try{
 for(const product of products){
  const page=await browser.newPage({viewport:{width:390,height:844}});
  await page.goto(`http://127.0.0.1:4831/preview/components/${product}/?theme=dark`);
  const checked=await page.evaluate(rows=>{
   const style=getComputedStyle(document.documentElement);
   return rows.map(row=>{
    let value=row.property.startsWith('--')?style.getPropertyValue(row.property).trim():row.value,unresolved=[];
    for(let i=0;i<20&&/var\(/.test(value);i++){
     const previous=value;
     value=value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g,(_,name,fallback)=>{const replacement=style.getPropertyValue(name).trim()||fallback;if(!replacement){unresolved.push(name);return _;}return replacement;});
     if(previous===value)break;
    }
    const supported=row.properties.filter(p=>CSS.supports(p,value));
    const status=!row.properties.length?'untyped-custom-value':!value||unresolved.length||/var\(/.test(value)?'unresolved-scope':supported.length?'supported':'invalid';
    return {...row,resolvedValue:value,supported,unresolved,status};
   });
  },sources[product]);
  records.push(...checked.map(row=>({product,...row})));await page.close();
 }
}finally{await browser.close();server.kill();}
const counts={};for(const row of records)counts[row.status]=(counts[row.status]??0)+1;
const report={scope:'Diagnostic CSS math grammar in current 390px dark component fixtures. Standard declarations and custom variables with exact known CSS property consumers only. Untyped and unresolved scopes are not passes. This is not browser visual certification or all-screen coverage.',counts,records};
fs.writeFileSync(root+'/reviews/css-math-diagnostic.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({counts,invalid:records.filter(r=>r.status==='invalid')},null,2));
