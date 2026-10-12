// Only exact, symbol-resolved parent-navigation Link class attributes change.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {createCurrentMaisonNavigation} from './maison-current-navigation.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Works');
const ts=createRequire(product+'/package.json')('typescript');
export const beforeClass='inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-brand-forestDark';
export const afterClass='qd-text-action qd-text-action--regular w-fit';
export const baseline='8d7a97e7816303ffc658fa3e291f6fabdea0df2e';
const norm=s=>s.replaceAll('\r\n','\n'),manifestFile=root+'/reviews/maison-back-navigation-migration.json';
export function backNavigationSlots(code,file='f.tsx',className=beforeClass){
 const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);assert.equal(sf.parseDiagnostics.length,0);
 const host={getSourceFile:n=>n===file?sf:undefined,getDefaultLibFileName:()=>'',writeFile(){},getCurrentDirectory:()=>'',getDirectories:()=>[],fileExists:n=>n===file,readFile:()=>code,getCanonicalFileName:n=>n,useCaseSensitiveFileNames:()=>true,getNewLine:()=> '\n'};
 const checker=ts.createProgram([file],{noLib:true,noResolve:true},host).getTypeChecker(),slots=[];
 const visit=n=>{
  if(ts.isJsxAttribute(n)&&n.name.getText(sf)==='className'&&n.initializer&&ts.isStringLiteral(n.initializer)&&n.initializer.text===className){
   const opening=n.parent.parent,element=opening.parent;assert(ts.isJsxOpeningElement(opening)&&ts.isJsxElement(element));
   const declarations=checker.getSymbolAtLocation(opening.tagName)?.declarations??[];assert.equal(declarations.length,1);
   const declaration=declarations[0];assert(ts.isImportClause(declaration)&&declaration.name);assert.equal(declaration.parent.moduleSpecifier.text,'next/link');
   const href=opening.attributes.properties.find(p=>ts.isJsxAttribute(p)&&p.name.getText(sf)==='href');assert(href?.initializer);
   const icons=element.children.filter(ts.isJsxSelfClosingElement);assert.equal(icons.length,1);assert.equal(icons[0].tagName.getText(sf),'ArrowLeft');
   assert(element.children.some(c=>ts.isJsxText(c)&&c.text.trim()||ts.isJsxExpression(c)&&c.expression),'Navigation needs a visible label or an expression');
   slots.push({start:n.initializer.getStart(sf),end:n.initializer.end,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,before:n.initializer.getText(sf),after:'"'+afterClass+'"',href:href.initializer.getText(sf),element:element.getText(sf)});
  }
  ts.forEachChild(n,visit);
 };visit(sf);return slots;
}
export function verifyBackNavigation(before,after,file='f.tsx'){
 const slots=backNavigationSlots(before,file);assert.equal(slots.length,1,'One inspected parent-navigation link per source');
 const edit=slots[0],expected=before.slice(0,edit.start)+edit.after+before.slice(edit.end);
 assert.equal(after,expected,'Only the exact parent-navigation class may change');
 const current=backNavigationSlots(after,file,afterClass);assert.equal(current.length,1);assert.equal(current[0].href,edit.href);assert.equal(current[0].line,edit.line);
 return edit;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const mode=process.argv.slice(2);assert(mode.length===1&&['--write','--check'].includes(mode[0]));
 const original=file=>norm(execFileSync('git',['show',baseline+':'+file],{cwd:product,encoding:'utf8',maxBuffer:10*1024*1024}));
 if(mode[0]==='--write'){
  assert(!fs.existsSync(manifestFile),'Never overwrite the approved migration');const writes=[],records=[];
  for(const file of runtimeFiles(product).filter(p=>p.startsWith('app/')&&p.endsWith('.tsx'))){
   const actual=fs.readFileSync(product+'/'+file,'utf8'),before=norm(actual);if(!before.includes(beforeClass))continue;
   const slots=backNavigationSlots(before,file);if(!slots.length)continue;assert.equal(before,original(file),'Owner changes require a fresh baseline');
   assert.equal(slots.length,1);const edit=slots[0],after=before.slice(0,edit.start)+edit.after+before.slice(edit.end);verifyBackNavigation(before,after,file);
   records.push({path:file,beforeHash:hash(before),afterHash:hash(after),line:edit.line,start:edit.start,before:edit.before,after:edit.after,href:edit.href});
   writes.push([product+'/'+file,actual.includes('\r\n')?after.replaceAll('\n','\r\n'):after]);
  }
  assert.equal(records.length,144);assert.equal(new Set(records.map(r=>r.path)).size,144);
  const manifest={version:1,baseline,scope:'144 exact parent-navigation Links use existing shared text-action and regular-height recipes. Destinations, labels, icons, form values, permissions and all other code are unchanged. Recipe ownership is not approval of unrelated controls.',records};
  // Validate every source before writing any product file.
  for(const [file,code]of writes)fs.writeFileSync(file,code);fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');
 }else{
  const manifest=JSON.parse(fs.readFileSync(manifestFile,'utf8'));assert.equal(manifest.baseline,baseline);assert.equal(manifest.records.length,144);
  for(const r of manifest.records){assert(/^app\/[^\\]+\.tsx$/.test(r.path)&&!r.path.split('/').includes('..'));
   const before=original(r.path),after=norm(execFileSync('git',['show','160c7731e05400259ee75cc49274625b3a667e1a601e:'+r.path],{cwd:product,encoding:'utf8',maxBuffer:10*1024*1024}));assert.equal(hash(before),r.beforeHash);assert.equal(hash(after),r.afterHash);
   const edit=verifyBackNavigation(before,after,r.path);for(const key of ['line','start','before','after','href'])assert.equal(edit[key],r[key]);
  }
 }
 if(mode[0]==='--check'){
  const report=createCurrentMaisonNavigation();assert.deepEqual(JSON.parse(fs.readFileSync(root+'/reviews/maison-current-navigation-review.json','utf8')),report);
  console.log('Historical migration: 144 exact class edits. Current handoff source: '+report.records.length+' exact shared navigation consumers.');
 }else console.log('144 exact parent-navigation links use the central text-action recipe.');
}
