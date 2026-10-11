// Inventory authored display copy and wrapping controls. Candidates require
// manual language and pixel review; a source scan is never a screen approval.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ts=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('typescript');
const ignored=new Set(['node_modules','.next','.git','build','.gradle','dist','graft','tests','__tests__','test','docs','reports','reviews','backups','capacitor-www','test-results','test-utils','scripts','db','supabase']);
const products=['Q-Atelier','Q-Works','DHR','Q-Atelier-App','Q-Maison-App','Q-Carnet-App','Q-Atelier-iOS'];
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?(entry.name.startsWith('.')||ignored.has(entry.name)?[]:files(path.join(dir,entry.name))):/\.(?:tsx?|jsx?|html|java|swift|css)$/.test(entry.name)&&! /\.(?:test|spec)\./.test(entry.name)?[path.join(dir,entry.name)]:[]);}
const reports=[];
for(const product of products){
 const base=path.resolve(root,'..',product),rows=[],controls=[];let count=0;
 for(const full of files(base)){
  const code=fs.readFileSync(full,'utf8'),file=path.relative(base,full).replaceAll('\\','/'),sourceHash=hash(code);count++;
  const add=(text,line,kind)=>{
   if(!/[가-힣]/.test(text))return;
   const findings=[];
   if(/[가-힣][ \t]{2,}[가-힣]/.test(text))findings.push('repeated-space');
   if(/[가-힣][\u00a0\u200b\u2060][가-힣]/.test(text))findings.push('nonstandard-separator');
   if(/[가-힣] +(?:\.(?![A-Za-z0-9.])|[,;!?])|[([] +[가-힣]|[가-힣] +[)\]]/.test(text))findings.push('punctuation-spacing');
   if(/작성중|검토중|결재중|심사구분/.test(text))findings.push('ui-term-spacing-candidate');
   if(text.includes('\n'))findings.push('explicit-newline');
   rows.push({file,line,kind,text,sourceHash,findings});
  };
  if(/\.[jt]sx?$/.test(file)){
   const scriptKind=/\.tsx$/.test(file)?ts.ScriptKind.TSX:/\.jsx$/.test(file)?ts.ScriptKind.JSX:/\.js$/.test(file)?ts.ScriptKind.JS:ts.ScriptKind.TS;
   const ast=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,scriptKind);
   const walk=node=>{
    const line=ast.getLineAndCharacterOfPosition(node.getStart()).line+1;
    if(ts.isJsxText(node)){
     // JSX source indentation is collapsed by React. A single-line JSX text
     // keeps literal interior spaces; multiline indentation is not a UI break.
     const text=node.getText();add(text.includes('\n')?text.trim().split(/\r?\n/).map(s=>s.trim()).filter(Boolean).join(' '):text,line,'jsx-text');
    }else if(ts.isStringLiteral(node)||ts.isNoSubstitutionTemplateLiteral(node)||ts.isTemplateHead(node)||ts.isTemplateMiddle(node)||ts.isTemplateTail(node)){
     // Include static strings as review candidates. Their runtime display
     // consumer is not inferred, and operational/data strings are not edited.
     add(node.text,line,'string-candidate');
    }
    if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText()==='br')controls.push({file,line,kind:'explicit-br',sourceHash});
    ts.forEachChild(node,walk);
   };walk(ast);
  }else{
   for(const [index,line]of code.split(/\r?\n/).entries()){
    if(/\.(?:java|swift)$/.test(file))for(const match of line.matchAll(/"((?:\\.|[^"\\])*)"/g))add(match[1],index+1,'native-string');
    if(file.endsWith('.html'))for(const match of line.matchAll(/>([^<>]+)</g))add(match[1],index+1,'html-text');
   }
  }
  for(const [index,line]of code.split(/\r?\n/).entries())if(/\b(?:wordBreak|overflowWrap|whiteSpace|wordSpacing|textWrap)\s*:|\b(?:word-break|overflow-wrap|word-spacing|white-space|hyphens)\s*:|\b(?:break-all|break-words|whitespace-nowrap|whitespace-pre(?:-wrap)?|truncate)\b/.test(line))controls.push({file,line:index+1,kind:'wrapping-control',sourceHash,code:line.trim().slice(0,500)});
 }
 reports.push({product,files:count,texts:rows.length,candidates:rows.filter(row=>row.findings.length),wrappingControls:controls});
}
const report={version:1,scope:'All reachable authored UI text source files in three web products, three active Android wrappers and Atelier iOS. Excludes build outputs, dependencies, tests and historical TWA. Candidate flags are not spelling judgments or browser approvals.',products:reports};
const out=path.join(root,'reviews/text-layout-inventory.json');
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(reports.map(({product,files,texts,candidates,wrappingControls})=>({product,files,texts,candidates:candidates.length,wrappingControls:wrappingControls.length})),null,2));
