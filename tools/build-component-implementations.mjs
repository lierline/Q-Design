// Exact implementation ownership, independent from per-argument styling decisions.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {hash} from './style-arguments-core.mjs';
import {COLOR_AUDIT_TARGETS,parseCoverageArgs} from './audit-coverage-imports.mjs';
import {PRODUCTS} from './sync-parts.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ts=createRequire(import.meta.url)('typescript');
const identity={atelier:{key:'Q-Atelier',repo:'Q-Atelier'},maison:{key:'Q-Works',repo:'Q-Works'},carnet:{key:'Q-Forge',repo:'DHR'}};
const norm=s=>s.replaceAll('\r\n','\n');
export function checkedImplementationPath(file){
 assert(typeof file==='string'&&/^(?:components|lib\/design)\/[^\\]+\.tsx$/.test(file));
 assert(!file.split('/').some(segment=>['','..','.'].includes(segment)),'Implementation path cannot escape its reviewed product scope');
 return file;
}
export function implementationOwners(root=ROOT){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'patterns/component-implementations.json'),'utf8'));
 assert.equal(manifest.version,1);assert.equal(manifest.products.length,3);
 const products=new Set(),owners=new Map();
 for(const config of manifest.products){
  assert.deepEqual({key:config.key,repo:config.repo},identity[config.product]);assert(!products.has(config.product));products.add(config.product);
  for(const raw of config.files){const file=checkedImplementationPath(raw),key=config.product+':'+file;assert(!owners.has(key));owners.set(key,`patterns/component-implementations/${config.product}/${file}`);}
 }
 return owners;
}
function exportsFor(file,code,ownedPaths,defaultExports,attachedRenderers){
 const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);assert.equal(sf.parseDiagnostics.length,0,'Canonical component syntax must parse: '+file);
 const exports=[];
 for(const n of sf.statements){
  assert(!ts.isExportAssignment(n),'Default assignment exports need a separate public API review: '+file);
  if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.DefaultKeyword)){
   assert(ts.isFunctionDeclaration(n)&&n.name?.text===defaultExports[file],'Default export must be the explicitly reviewed named renderer: '+file);
   exports.push({name:'default',localName:n.name.text,kind:'value'});continue;
  }
  if(ts.isExportDeclaration(n)){
   let reexportFrom;
   if(n.moduleSpecifier){
    assert(ts.isStringLiteral(n.moduleSpecifier)&&n.moduleSpecifier.text.startsWith('.'),'External component re-exports need separate review');
    reexportFrom=path.posix.normalize(path.posix.join(path.posix.dirname(file),n.moduleSpecifier.text+'.tsx'));
    assert(ownedPaths.has(reexportFrom),'Component re-export must refer to another explicitly owned implementation: '+file);
   }
   assert(n.exportClause&&ts.isNamedExports(n.exportClause));
   for(const spec of n.exportClause.elements)exports.push({name:spec.name.text,kind:n.isTypeOnly||spec.isTypeOnly?'type':'value',...(reexportFrom?{reexportFrom}:{} )});
  }else if(n.modifiers?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){
   if(ts.isVariableStatement(n)){for(const decl of n.declarationList.declarations){assert(ts.isIdentifier(decl.name));exports.push({name:decl.name.text,kind:'value'});}}
   else if(n.name&&ts.isIdentifier(n.name))exports.push({name:n.name.text,kind:ts.isInterfaceDeclaration(n)||ts.isTypeAliasDeclaration(n)?'type':'value'});
   else throw Error('Unnamed component exports need explicit review: '+file);
  }
 }
 assert.equal(new Set(exports.map(e=>e.name)).size,exports.length,'Duplicate component export');
 const publicValues=new Set(exports.filter(e=>e.kind==='value').map(e=>e.localName??e.name));
 const attached=[];
 const inspectAttachment=n=>{
  if(!ts.isBinaryExpression(n)||n.operatorToken.kind!==ts.SyntaxKind.EqualsToken){ts.forEachChild(n,inspectAttachment);return;}
  const {left,right}=n;
  if(!(ts.isPropertyAccessExpression(left)||ts.isElementAccessExpression(left))||!ts.isIdentifier(left.expression)||!publicValues.has(left.expression.text)){ts.forEachChild(n,inspectAttachment);return;}
  assert(ts.isExpressionStatement(n.parent)&&n.parent.parent===sf,'Nested public component attachments need separate review: '+file);
  assert(ts.isPropertyAccessExpression(left),'Computed public component attachments need separate review: '+file);
  const owner=left.expression.text,member=left.name.text;
  // Existing React display names are metadata, never renderers or public slots.
  if(member==='displayName'&&(ts.isStringLiteral(right)||(ts.isPropertyAccessExpression(right)&&right.name.text==='displayName')))return;
  assert(ts.isFunctionExpression(right)&&right.name,'Public component attachment must be a reviewed named renderer: '+file);
  attached.push({owner,member,localName:right.name.text,line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1});
  ts.forEachChild(right,inspectAttachment);
 };inspectAttachment(sf);
 assert.deepEqual(attached.map(({line,...api})=>api),attachedRenderers,'Every attached public renderer needs explicit ownership review: '+file);
 return {exports,...(attached.length?{attachedRenderers:attached}:{})};
}
function templateFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?templateFiles(path.join(dir,entry.name)):entry.name.endsWith('.tsx')?[path.join(dir,entry.name)]:[]);}
// 2026-10-22: the product version file records what Q-Design last shipped for each owned file.
// A product file that matches neither the canonical nor that record was edited in the product.
// Without a record (no version file yet, or a fixture) the old overwrite behavior stays.
function recordedImplementations(root,config){
 const file=path.resolve(root,'..',config.repo,PRODUCTS[config.key].version);
 if(!fs.existsSync(file))return null;
 const list=JSON.parse(fs.readFileSync(file,'utf8')).implementations;
 return Array.isArray(list)?new Map(list.map(p=>[p.file,p.sha256])):null;
}
const ADOPT_HINT='Adopt into Q-Design: node tools/build-component-implementations.mjs --adopt --only=<product> · or discard in the product: git checkout -- <file>';
// Product-first emergency fixes come back here the same day. Only committed product content is adopted.
export function adoptComponentImplementations(root=ROOT,{only=null}={}){
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'patterns/component-implementations.json'),'utf8')),adopted=[];
 for(const config of manifest.products){
  if(only&&!only.has(config.key))continue;
  const repo=path.resolve(root,'..',config.repo),recorded=recordedImplementations(root,config);
  for(const raw of config.files){
   const file=checkedImplementationPath(raw),canonical=path.join(root,'patterns/component-implementations',config.product,file);
   const shown=spawnSync('git',['-C',repo,'show','HEAD:'+file],{encoding:'utf8',maxBuffer:64<<20});
   assert.equal(shown.status,0,'Cannot read committed product file: '+config.repo+'/'+file);
   const head=norm(shown.stdout),source=norm(fs.readFileSync(canonical,'utf8'));
   assert.equal(norm(fs.readFileSync(path.join(repo,file),'utf8')),head,'Commit the product change before adopting: '+config.repo+'/'+file);
   if(head===source)continue;
   if(recorded?.has(file))assert.equal(hash(source),recorded.get(file),'Canonical also changed since the last sync; merge by hand: '+config.repo+'/'+file);
   fs.writeFileSync(canonical,head);adopted.push(config.repo+'/'+file);
  }
 }
 return adopted;
}
export function buildComponentImplementations(root=ROOT,{check=false,write=false,only=null}={}){
 assert(!(check&&write));
 if(only)for(const key of only)assert(COLOR_AUDIT_TARGETS.includes(key),'Unknown product selection');
 const manifestPath='patterns/component-implementations.json',manifestText=fs.readFileSync(path.join(root,manifestPath),'utf8'),manifest=JSON.parse(manifestText);
 assert.equal(manifest.version,1);assert.equal(manifest.products.length,3);
 const seen=new Set(),records=[],prepared=[];
 for(const config of manifest.products){
  assert.deepEqual({key:config.key,repo:config.repo},identity[config.product],'Only reviewed product identity is allowed');assert(!seen.has(config.product));seen.add(config.product);
  const selected=!only||only.has(config.key),unique=new Set(),ownedPaths=new Set(config.files.map(checkedImplementationPath));
  const recorded=selected&&write?recordedImplementations(root,config):null;
  const defaultExports=config.defaultExports??{};
  for(const [file,name]of Object.entries(defaultExports))assert(ownedPaths.has(file)&&/^[A-Za-z_$][\w$]*$/.test(name),'Default renderer needs an owned file and explicit local name');
  const attachedRenderers=config.attachedRenderers??{};
  for(const [file,entries]of Object.entries(attachedRenderers)){
   assert(ownedPaths.has(file)&&Array.isArray(entries)&&entries.length,'Attached renderers need an owned file and explicit entries');
   const keys=new Set();for(const entry of entries){
    assert.deepEqual(Object.keys(entry).sort(),['localName','member','owner']);
    for(const value of Object.values(entry))assert(typeof value==='string'&&/^[A-Za-z_$][\w$]*$/.test(value));
    const key=entry.owner+'.'+entry.member;assert(!keys.has(key),'Duplicate attached public renderer');keys.add(key);
   }
  }
  if((check||write)&&selected&&config.product==='maison'){
   const actualFiles=fs.readdirSync(path.resolve(root,'..',config.repo,'components/ui')).filter(f=>f.endsWith('.tsx')).map(f=>'components/ui/'+f).sort();
   assert.deepEqual(actualFiles,config.files.filter(file=>file.startsWith('components/ui/')).sort(),'New UI primitive file needs ownership and role review before adoption');
  }
  for(const raw of config.files){
   const file=checkedImplementationPath(raw);assert(!unique.has(file));unique.add(file);
   const canonical=`patterns/component-implementations/${config.product}/${file}`,source=norm(fs.readFileSync(path.join(root,canonical),'utf8')),actual=path.resolve(root,'..',config.repo,file);
   const target=`${config.repo}/${file}`,api=exportsFor(file,source,ownedPaths,defaultExports,attachedRenderers[file]??[]);
   if(selected&&(check||write)){
    const rawBefore=fs.readFileSync(actual,'utf8');
    prepared.push({actual,target,source,before:norm(rawBefore),newline:rawBefore.includes('\r\n')?'\r\n':'\n',recorded:recorded&&recorded.get(file)});
   }
   records.push({product:config.product,key:config.key,path:file,target,canonical,sourceHash:hash(source),...api});
  }
 }
 const authored=templateFiles(path.join(root,'patterns/component-implementations')).map(file=>path.relative(root,file).replaceAll('\\','/')).sort();
 assert.deepEqual(authored,records.map(r=>r.canonical).sort(),'Every canonical UI implementation needs an explicit ownership entry');
 // Parse every template and inspect all selected targets before changing any app.
 const touched=write?prepared.filter(item=>item.before!==item.source&&item.recorded!==null&&hash(item.before)!==item.recorded):[];
 if(touched.length)throw Error('Product edited shared component files; refusing to overwrite: '+touched.map(item=>item.target).join(', ')+'. '+ADOPT_HINT);
 for(const item of prepared){
  if(write&&item.before!==item.source)fs.writeFileSync(item.actual,item.source.replaceAll('\n',item.newline));
  assert.equal(norm(fs.readFileSync(item.actual,'utf8')),item.source,'Product implementation differs from canonical: '+item.target);
 }
 const report={version:1,manifest:manifestPath,manifestHash:hash(manifestText),scope:'Exact source ownership of explicitly reviewed product primitives. Shared CSS and token rules remain the family appearance authority. State, props, callbacks, preferences, caller styles and imported domain data are separate inputs. No argument decision or visual certification is inferred from a filename or full-file match.',records};
 const json=JSON.stringify(report,null,2)+'\n',output=path.join(root,'dist/q-design.component-implementations.json');
 if(check)assert.equal(fs.readFileSync(output,'utf8'),json,'Component implementation catalog is stale');else{fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,json);}
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.every(a=>['--check','--write','--adopt'].includes(a)||a.startsWith('--only=')));
 assert(args.filter(a=>!a.startsWith('--only=')).length<=1,'Use one of --check, --write, --adopt');
 const {only}=parseCoverageArgs(args.filter(a=>a.startsWith('--only=')));
 if(args.includes('--adopt'))console.log(JSON.stringify({adopted:adoptComponentImplementations(ROOT,{only})}));
 const report=buildComponentImplementations(ROOT,{check:args.includes('--check'),write:args.includes('--write'),only});
 console.log(JSON.stringify({files:report.records.length,products:new Set(report.records.map(r=>r.product)).size,exports:report.records.reduce((n,r)=>n+r.exports.length,0),attachedRenderers:report.records.reduce((n,r)=>n+(r.attachedRenderers?.length??0),0),selectedFiles:report.records.filter(r=>!only||only.has(r.key)).length,synchronized:args.includes('--check')||args.includes('--write')}));
}
