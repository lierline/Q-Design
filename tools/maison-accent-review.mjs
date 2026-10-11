// Exact reviewed KPI palette selectors. No raw color or property-name exemption.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const product=path.resolve(root,'../Q-Works');
export const accentKeys=['green','copper','red','cobalt','violet','gray'];

export function statPalette(ts,code,variables){
 const sf=ts.createSourceFile('stat-accent.ts',code,ts.ScriptTarget.Latest,true),declarations=[];
 const visit=n=>{if(ts.isVariableDeclaration(n)&&n.name.getText(sf)==='STAT_ACCENT')declarations.push(n);ts.forEachChild(n,visit);};visit(sf);
 if(declarations.length!==1||!ts.isObjectLiteralExpression(declarations[0].initializer))throw Error('Missing exact STAT_ACCENT map');
 const entries=declarations[0].initializer.properties.map(p=>{
  if(!ts.isPropertyAssignment(p))throw Error('Unreviewed accent map spread');
  const key=p.name.getText(sf),value=p.initializer;
  if(key==='gray'&&ts.isIdentifier(value)&&value.text==='undefined')return[key,null];
  if(!ts.isStringLiteral(value))throw Error('Non-token accent value');
  const match=/^var\((--qa-state-[a-z]+)\)$/.exec(value.text);
  if(!match||!variables.has(match[1]))throw Error('Unowned accent value '+key);
  return[key,match[1]];
 });
 if(entries.length!==accentKeys.length||accentKeys.some(key=>!entries.some(([name])=>key===name)))throw Error('Accent key contract changed');
 return entries;
}

export function createAccentReview(){
 const req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
 const files=runtimeFiles(product).filter(f=>/\.[jt]sx?$/.test(f));
 const config=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),options=ts.parseJsonConfigFileContent(config.config,ts.sys,product);
 const program=ts.createProgram(files.map(f=>path.join(product,f)),{...options.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const text=file=>fs.readFileSync(path.join(product,file),'utf8'),ev=(file,line=1,central=false)=>({path:file,line,hash:hash(fs.readFileSync(path.join(central?root:product,file),'utf8'))});
 const paletteFile='dist/q-design.palette.maison.css',palette=fs.readFileSync(path.join(root,paletteFile),'utf8'),variables=new Set();
 postcss.parse(palette).walkDecls(d=>{if(d.prop.startsWith('--'))variables.add(d.prop);});
 const aliases=postcss.parse(fs.readFileSync(path.join(root,'patterns/foundation/maison.css'),'utf8'));
 aliases.walkDecls(d=>{const match=/^hsl\(var\((--qw-state-[a-z]+)\)\)$/.exec(d.value);if(d.prop.startsWith('--qa-state-')&&match&&variables.has(match[1]))variables.add(d.prop);});
 const paletteMap=statPalette(ts,text('lib/ui/stat-accent.ts'),variables);
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/maison-style-decisions.json'),'utf8'));
 const candidates=main.records.filter(r=>r.property==='accent'&&r.decision!=='central-source-verified');
 const records=[],rejected=[];
 const sourceEvidence=['lib/ui/stat-accent.ts','components/shared/stat-block.tsx'];
 const allowedObjectFiles=new Set(['components/shared/list-stats.tsx','lib/dashboard/widgets.ts','app/(app)/my-tasks/page.tsx','app/(app)/audit-simulation/verdict-breakdown.tsx']);
 const resolved=n=>{let s=checker.getSymbolAtLocation(n);while(s?.flags&ts.SymbolFlags.Alias)s=checker.getAliasedSymbol(s);return s;};
 const sourcePath=sf=>path.relative(product,sf.fileName).replaceAll('\\','/');
 const allowedType=node=>{if(ts.isStringLiteral(node))return accentKeys.includes(node.text);const type=checker.getTypeAtLocation(node),types=type.isUnion()?type.types:[type];return types.length>0&&types.every(t=>Boolean(t.flags&ts.TypeFlags.StringLiteral)&&accentKeys.includes(t.value));};
 for(const r of candidates){
  const sf=program.getSourceFile(path.join(product,r.path)),ownHash=hash(text(r.path));
  if(ownHash!==r.sourceHash)throw Error('Stale source '+r.path);
  const nodes=[];const visit=n=>{const line=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
   if(line===r.line&&((r.kind==='presentation-attribute'&&ts.isJsxAttribute(n))||(r.kind==='object-property'&&ts.isPropertyAssignment(n)))&&n.name.getText(sf)==='accent'&&n.initializer?.getText(sf)===r.value)nodes.push(n);ts.forEachChild(n,visit);};visit(sf);
  if(nodes.length!==1){rejected.push({...r,why:'not one exact AST argument'});continue;}
  const node=nodes[0],evidence=[ev(r.path,r.line),...sourceEvidence.map(f=>ev(f)),ev(paletteFile,1,true),ev('patterns/foundation/maison.css',242,true),ev('dist/q-design.screen.css',1,true)];
  let reason,consumer;
  if(ts.isJsxAttribute(node)){
   const tag=node.parent.parent.tagName,symbol=resolved(tag),decl=symbol?.declarations?.find(ts.isFunctionDeclaration),file=decl?sourcePath(decl.getSourceFile()):null;
   if(!decl||!['components/shared/stat-block.tsx#StatBlock','components/shared/count-card.tsx#CountCard'].includes(file+'#'+decl.name.text)){rejected.push({...r,why:'unreviewed renderer'});continue;}
   const value=ts.isJsxExpression(node.initializer)?node.initializer.expression:node.initializer;
   if(!allowedType(value)){rejected.push({...r,why:'value type escapes reviewed finite palette'});continue;}
   consumer=file+'#'+decl.name.text;evidence.push(ev(file));
   // These inspected dynamic sources return only the same typed semantic keys.
   for(const f of ['lib/kpi/tier.ts','lib/dashboard/widgets.ts'])if(text(r.path).includes(f==='lib/kpi/tier.ts'?'@/lib/kpi/tier':'@/lib/dashboard/widgets'))evidence.push(ev(f));
   reason='The symbol-resolved '+consumer+' accent is a finite StatAccent selector. StatBlock indexes STAT_ACCENT and writes --qd-kpi-color; all actual values are generated palette variables, with gray intentionally inheriting text. Conditions select a semantic key, not a raw CSS color. The caller, renderer, helper and palette snapshots are independently bound.';
  }else if(allowedObjectFiles.has(r.path)&&ts.isStringLiteral(node.initializer)&&accentKeys.includes(node.initializer.text)){
   consumer=r.path==='lib/dashboard/widgets.ts'?'Widget.accent -> widgetAccent -> dashboard StatBlock':r.path==='components/shared/list-stats.tsx'?'Card.accent -> SPECS.cards -> ListStats StatBlock':r.path.includes('my-tasks')?'cardDefs -> CountCard -> StatBlock':'BOXES -> VerdictBreakdown StatBlock';
   if(r.path==='lib/dashboard/widgets.ts')evidence.push(ev('app/(app)/dashboard/page.tsx',760));
   if(r.path.includes('my-tasks'))evidence.push(ev('components/shared/count-card.tsx',45));
   reason='Inspected typed registration metadata selects a semantic KPI key through '+consumer+'. This exact literal is one of the six STAT_ACCENT keys. Color output is the central generated variable map; business counts, permission conditions and every other object field remain separate candidates.';
  }else if(r.path==='lib/ui/tone-class.ts'&&r.value==='"qd-tag--gold qd-tag--primary"'){
   consumer='TONE_CLASS.accent -> Badge.className';evidence.push(ev('components/shared/badge.tsx',43),ev('dist/q-design.list.css',1,true));
   reason='TONE_CLASS.accent selects the centrally distributed gold and primary tag classes; Badge combines these with qd-tag. This is a class selector, not a CSS accent color literal.';
  }else{rejected.push({...r,why:'unreviewed metadata flow'});continue;}
  records.push({path:r.path,line:r.line,sourceHash:r.sourceHash,argumentHash:r.argumentHash,value:r.value,decision:'token-reference-verified',ruleId:'exact-kpi-accent-selector',reason,evidence:[...new Map(evidence.map(e=>[JSON.stringify(e),e])).values()],consumer});
 }
 return{version:1,scope:'Exact source-bound KPI semantic selector and tag class reviews. New colors, consumer symbols or changed sources require fresh review. No renderer-wide or property-name approval.',paletteMap,records,rejected};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createAccentReview();fs.writeFileSync(path.join(root,'reviews/maison-accent-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length,rejected:report.rejected.map(r=>({path:r.path,line:r.line,value:r.value,why:r.why}))},null,2));
}
