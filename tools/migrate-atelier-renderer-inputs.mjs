// Only current, symbol-resolved renderer literals are moved. Business props are excluded.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const ts=createRequire(qa+'/package.json')('typescript');
const report=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8'));
const rows=report.records.filter(r=>r.decision==='unknown'&&r.kind==='presentation-attribute');
const filenames=[...new Set(rows.map(r=>path.join(qa,r.path)))];
const cfg=ts.readConfigFile(qa+'/tsconfig.json',ts.sys.readFile);
const options=ts.parseJsonConfigFileContent(cfg.config,ts.sys,qa).options;
const program=ts.createProgram(filenames,{...options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
const symbol=n=>{let s=checker.getSymbolAtLocation(n);while(s?.flags&ts.SymbolFlags.Alias)s=checker.getAliasedSymbol(s);return s;};
const editsByFile=new Map();
for(const r of rows){
 const sf=program.getSourceFile(path.join(qa,r.path));let attr;
 const walk=n=>{if(ts.isJsxAttribute(n)&&n.name.getText(sf)===r.property&&(n.initializer?.getText(sf)??'true')===r.value&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===r.line)attr=n;ts.forEachChild(n,walk);};walk(sf);
 if(!attr?.initializer)continue;
 const tag=attr.parent.parent.tagName,decls=symbol(tag)?.declarations??[];
 const definition=decls.map(d=>({file:d.getSourceFile().fileName.replaceAll('\\','/'),name:ts.isFunctionDeclaration(d)?d.name?.text:d.name?.getText(d.getSourceFile())}));
 const core=definition.find(d=>d.file===qa+'/lib/design/components.tsx');
 const skeleton=definition.find(d=>d.file===qa+'/components/Skeleton.tsx');
 let group;
 if(core?.name==='Grid'&&r.property==='cols')group='gridColumns';
 if(core?.name==='StatGrid'&&r.property==='minCol')group='statMinColumn';
 if(skeleton&&['Skeleton.KPIGrid','Skeleton.Table'].includes(tag.getText(sf))&&r.property==='cols')group='skeletonColumns';
 if(!group)continue;
 const init=attr.initializer;
 if(!ts.isJsxExpression(init)||!init.expression||!ts.isNumericLiteral(init.expression))continue;
 const value=Number(init.expression.text);
 const allowed={gridColumns:[2,3,4],statMinColumn:[140,160],skeletonColumns:[3,4,5]};
 if(!allowed[group].includes(value))throw Error('Unreviewed renderer choice');
 const before=init.getText(sf),after=`{QDPresentation.rendererInputs.${group}[${value}]}`;
 const records=editsByFile.get(r.path)??[];records.push({start:init.getStart(sf),end:init.end,before,after,definition,property:r.property,line:r.line});editsByFile.set(r.path,records);
}
const write=process.argv.includes('--write'),records=[];
for(const [file,edits] of editsByFile){
 const before=fs.readFileSync(qa+'/'+file,'utf8');let after=before;
 for(const e of edits.sort((a,b)=>b.start-a.start)){if(after.slice(e.start,e.end)!==e.before)throw Error('Source changed');after=after.slice(0,e.start)+e.after+after.slice(e.end);}
 if(!before.includes("import { QDPresentation } from '@/lib/design/q-design-runtime';")){
  const sf=ts.createSourceFile(file,after,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const existing=sf.statements.find(n=>ts.isImportDeclaration(n)&&n.moduleSpecifier.text==='@/lib/design/q-design-runtime');
  if(existing?.importClause?.namedBindings&&ts.isNamedImports(existing.importClause.namedBindings)){
   const bindings=existing.importClause.namedBindings;if(!bindings.elements.some(e=>e.name.text==='QDPresentation'))after=after.slice(0,bindings.end-1)+', QDPresentation '+after.slice(bindings.end-1);
  }else{
   const directives=sf.statements.filter(n=>ts.isExpressionStatement(n)&&ts.isStringLiteral(n.expression));
   const at=directives.at(-1)?.end??0;after=after.slice(0,at)+"\nimport { QDPresentation } from '@/lib/design/q-design-runtime';\n"+after.slice(at);
  }
 }
 const record={path:file,beforeHash:hash(before),afterHash:hash(after),edits};records.push(record);
 if(write){const backup='D:/Claude/tmp/atelier-renderer-input-backup/'+file;fs.mkdirSync(path.dirname(backup),{recursive:true});if(fs.existsSync(backup))throw Error('Existing backup');fs.writeFileSync(backup,before);fs.writeFileSync(qa+'/'+file,after);}
}
const out={version:1,scope:'Exact symbol-resolved finite numeric renderer choices. Central defaults preserve the existing output. No business value, SVG coordinate, unknown renderer or dynamic expression is rewritten.',records};
fs.writeFileSync(write?root+'/reviews/atelier-renderer-input-migration.json':'D:/Claude/tmp/atelier-renderer-input-dry.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({write,files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0),targets:records.map(r=>({path:r.path,edits:r.edits.length}))}));
