// Exact-source adjudication. A classification is source evidence, not browser approval.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { PARTS } from './sync-parts.mjs';
import { centralOutputs, copyProblems } from './audit-coverage-core.mjs';
import { hash, runtimeFiles, cssProperties, scanArguments } from './style-arguments-core.mjs';
import { verifiedManualReview } from './maison-style-manual.mjs';
import { finishReview, reviewMode } from './maison-style-output.mjs';
import { embeddedStyleSheets, predicateClassTokens, utilityBase, inlineStyleDependencies, canResolveInlineStyle, importedAttributeTargets, typedStyleDependencies, businessResultBindings, ignoresObjectParameter, explicitlyDiscardedBinding, uniqueConstScalars, conditionalScalarLeaves, importedValueBindings, exportedMemberPaths } from './maison-style-proof.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),PRODUCT=path.resolve(ROOT,'../Q-Works');
const mode=reviewMode(process.argv.slice(2));
const require=createRequire(path.join(PRODUCT,'package.json'));
const ts=require('typescript'),postcss=require('postcss'),tailwind=require('tailwindcss'),loadConfig=require('tailwindcss/loadConfig');
const selectorParser=createRequire(require.resolve('tailwindcss/package.json'))('postcss-selector-parser');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(require.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const copies=new Map(centralOutputs(PARTS,'Q-Works',PRODUCT).map(part=>[part.path,part]));
const cssFiles=['patterns/foundation.css','patterns/foundation/maison.css','patterns/components.css','patterns/workspace.css','dist/q-design.nav.css','dist/q-design.list.css','dist/q-design.screen.css','dist/q-design.palette.maison.css'];
const variables=new Map(),classes=new Map();
function registerCSS(file,code,css=code,line=1){
  const sourceHash=hash(code),ast=postcss.parse(css);
  ast.walkDecls(decl=>{if(decl.prop.startsWith('--')&&!variables.has(decl.prop))variables.set(decl.prop,{path:file,line:line+decl.source.start.line-1,hash:sourceHash,variable:decl.prop});});
  ast.walkRules(rule=>selectorParser(selectors=>selectors.walkClasses(node=>{if(!classes.has(node.value))classes.set(node.value,{path:file,line:line+rule.source.start.line-1,hash:sourceHash});})).processSync(rule.selector));
}
for(const file of cssFiles)registerCSS(file,fs.readFileSync(path.join(ROOT,file),'utf8'));
for(const file of ['patterns/foundation/maison-print.ts','patterns/foundation/maison-print-styles.tsx']){
  const code=fs.readFileSync(path.join(ROOT,file),'utf8');
  for(const sheet of embeddedStyleSheets(code,ts,file))registerCSS(file,code,sheet.css,sheet.line);
}
const sources=runtimeFiles(PRODUCT).map(file=>{const code=fs.readFileSync(path.join(PRODUCT,file),'utf8'),part=copies.get(file);return{file,code,sourceHash:hash(code),part,args:scanArguments(file,code,{ts,postcss,properties,owner:part?.src})};});
const candidates=new Set(sources.flatMap(source=>source.args.filter(arg=>arg.kind==='class-utility').map(arg=>arg.value)));
const generated=(await postcss([tailwind({...loadConfig(path.join(PRODUCT,'tailwind.config.ts')),content:[{raw:[...candidates].join(' '),extension:'html'}]})]).process('@tailwind utilities;',{from:undefined})).root;
const utility=new Map();
generated.walkRules(rule=>{
  const emitted=[];selectorParser(selectors=>selectors.walkClasses(node=>{if(candidates.has(node.value))emitted.push(node.value);})).processSync(rule.selector);
  for(const name of emitted){const declarations=utility.get(name)??[];rule.each(node=>{if(node.type==='decl')declarations.push([node.prop,node.value]);});utility.set(name,declarations);}
});
const verifiedCache=new Map();
const verifiedPart=file=>{if(!verifiedCache.has(file)){const part=copies.get(file);verifiedCache.set(file,Boolean(part&&copyProblems(part,fs.readFileSync(path.join(ROOT,part.src),'utf8'),fs.readFileSync(path.join(PRODUCT,file),'utf8')).length===0));}return verifiedCache.get(file);};
const presetVerified=verifiedPart('lib/design/q-design-tailwind.ts');
const adapterExports={CHART_LABEL_LAYOUT:['lib/design/q-design-chart-layout.ts','@/lib/design/q-design-chart-layout'],qdMaison:['lib/design/q-design-runtime.ts','@/lib/design/q-design-runtime'],qdPrint:['lib/design/q-design-print.ts','@/lib/design/q-design-print'],qdPrintDocumentCss:['lib/design/q-design-print.ts','@/lib/design/q-design-print'],EMAIL_STYLES:['lib/design/q-design-email.ts','@/lib/design/q-design-email'],EMAIL_LAYOUT:['lib/design/q-design-email.ts','@/lib/design/q-design-email']};
const adapterMembers=new Map(Object.values(adapterExports).map(([copy])=>[copy,exportedMemberPaths(ts.createSourceFile(copy,fs.readFileSync(path.join(PRODUCT,copy),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TS),ts)]));
function adapterReference(value,imports){
  const segments=value.split('.'),binding=imports.get(segments[0]);
  if(!binding)return null;
  const definition=adapterExports[binding.exported];
  if(!definition||binding.module!==definition[1]||!verifiedPart(definition[0]))return null;
  const actual=[binding.exported,...segments.slice(1)].join('.');
  return adapterMembers.get(definition[0])?.has(actual)?definition[0]:null;
}
const evidence=(file,line=1)=>({path:file,line,hash:hash(fs.readFileSync(path.join(ROOT,file),'utf8'))});
const themeEvidence=[evidence('patterns/foundation/maison-tailwind.ts')];
const helperAst=file=>ts.createSourceFile(file,fs.readFileSync(path.join(PRODUCT,file),'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
const pageHelpIgnoresSize=ignoresObjectParameter(helperAst('components/shared/page-help.tsx'),ts,'PageHelp','size');
const iconFactory=helperAst('components/q-design-icons/_icon.tsx');
const discardedIconProps=new Set(['strokeWidth','absoluteStrokeWidth'].filter(name=>explicitlyDiscardedBinding(iconFactory,ts,name)));
const decide=(decision,ruleId,reason,proof=[])=>({decision,ruleId,reason,evidence:proof});
const records=[],fileHashes=[],styleGroups=new Map(),typedGroups=new Map();
const manualReviews=new Map();
for(const name of ['maison-style-manual-review.json','maison-style-spread-review.json','maison-style-bindings-review.json','maison-accent-review.json']){
  const file=path.join(ROOT,'reviews',name);if(!fs.existsSync(file))continue;
  for(const entry of JSON.parse(fs.readFileSync(file,'utf8')).records??[]){
    if(manualReviews.has(entry.argumentHash))throw new Error('Duplicate manual candidate: '+entry.argumentHash);
    manualReviews.set(entry.argumentHash,entry);
  }
}
const manualHashCache=new Map(sources.map(source=>[source.file,source.sourceHash]));
const currentManualHash=file=>{
  if(manualHashCache.has(file))return manualHashCache.get(file);
  const base=/^(?:source|patterns|dist)\//.test(file)?ROOT:PRODUCT,full=path.resolve(base,file);
  if(!full.startsWith(base+path.sep)||!fs.existsSync(full))return null;
  const value=hash(fs.readFileSync(full,'utf8'));manualHashCache.set(file,value);return value;
};
for(const {file,code,sourceHash,part,args}of sources){
  fileHashes.push({path:file,hash:sourceHash});
  const verified=part&&copyProblems(part,fs.readFileSync(path.join(ROOT,part.src),'utf8'),code).length===0;
  const iconSource=file.startsWith('components/q-design-icons/')?`dist/react-icons/${path.basename(file)}`:null;
  const iconVerified=iconSource&&fs.existsSync(path.join(ROOT,iconSource))&&hash(fs.readFileSync(path.join(ROOT,iconSource),'utf8'))===sourceHash;
  const styleKeys=new Set(),dataKeys=new Set();let imports=new Map(),predicateTokens=new Set(),attributeTargets=new Map(),resultBindings=new Set(),scalarAliases=new Map();
  if(/\.[jt]sx?$/.test(file)){
    const sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    predicateTokens=predicateClassTokens(sf,ts);
    styleGroups.set(file,inlineStyleDependencies(sf,ts));
    typedGroups.set(file,typedStyleDependencies(sf,ts));
    attributeTargets=importedAttributeTargets(sf,ts);
    resultBindings=businessResultBindings(sf,ts);
    scalarAliases=uniqueConstScalars(sf,ts);
    imports=importedValueBindings(sf,ts);
    const visit=node=>{
      if(ts.isPropertyAssignment(node)||ts.isSpreadAssignment(node)){
        let confirmed=false,dataCall=false;
        for(let current=node.parent;current;current=current.parent){
          if(ts.isJsxAttribute(current)){confirmed=current.name.getText(sf)==='style';break;}
          if(ts.isVariableDeclaration(current)&&current.type&&/(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))){confirmed=true;break;}
          if(ts.isAsExpression(current)&&/(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))){confirmed=true;break;}
          if(ts.isCallExpression(current)&&/^(?:z\.object|JSON\.stringify|NextResponse\.json|Response\.json)$|\.(?:insert|upsert|update|eq|in|select)$/.test(current.expression.getText(sf))){dataCall=true;break;}
          if(ts.isFunctionLike(current)||ts.isJsxElement(current)||ts.isJsxSelfClosingElement(current))break;
        }
        const key=`${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${ts.isPropertyAssignment(node)?node.name.getText(sf).replace(/^['"]|['"]$/g,''): '...'}:${ts.isPropertyAssignment(node)?node.initializer.getText(sf):node.expression.getText(sf)}`;
        if(confirmed)styleKeys.add(key);else if(dataCall)dataKeys.add(key);
      }ts.forEachChild(node,visit);
    };visit(sf);
  }
  for(const arg of args){
    const {kind,property,value,line}=arg,own=[{path:file,line,hash:sourceHash}];let result;
    const scalar=value.trim().replace(/^\{([\s\S]*)\}$/,'$1').replace(/^(['"])([\s\S]*)\1$/,'$2');
    if(kind==='parse-error')result=decide('unknown','parser-failure','Unparsed source requires repair and cannot be approved.',own);
    else if(verified)result=decide('central-source-verified','central-copy','Full argument is distributed from a fingerprint-verified canonical body.',[evidence(part.src)]);
    else if(iconVerified)result=decide('central-source-verified','central-icon','Exact normalized icon/helper source matches the generated canonical output.',[evidence(iconSource)]);
    else if(file==='app/fonts.css'&&['css-declaration','css-at-rule'].includes(kind))result=decide('font-resource','font-resource','Font-face metadata identifies shipped binaries; central family aliases choose the UI face.',own);
    else if(file==='app/globals.css'&&kind==='css-at-rule')result=decide('dependency-entry','style-entry','Import/Tailwind directives activate canonical recipe copies and compiler layers.',own);
    else if(kind==='class-utility'){
      const declarations=utility.get(value);
      if(predicateTokens.has(`${line}:${value}`))result=decide('business-condition','class-predicate','AST proves this literal is a comparison/ternary predicate, not a returned class. Same-line returned-token collisions stay unresolved.',own);
      else if(classes.has(value)&&!declarations?.length)result=decide('central-selector','central-selector','Exact selector exists in the hashed central CSS recipe. Selector presence does not assert active scope or computed appearance.',[classes.get(value)]);
      else if(['group','peer','sr-only','not-sr-only'].includes(value))result=decide('structural-behavior','assistive-selector','State/assistive-visibility utility; clipping pixels serve accessibility rather than visible appearance.',themeEvidence);
      else if(declarations&&presetVerified){
        const refs=[...declarations.flatMap(([,v])=>[...v.matchAll(/var\(\s*(--[\w-]+)/g)].map(m=>m[1]))];
        const missing=refs.filter(name=>!name.startsWith('--tw-')&&!variables.has(name));
        const arbitrary=/\b[\w-]+-\[/.test(utilityBase(value));
        const finite=declarations.filter(([p,v])=>!p.startsWith('--tw-')&&!/var\(/.test(v)&&/(?:[\d.]+(?:px|rem|em|vh|vw|ms|s)\b|#[\da-f]{3,8}\b|rgba?\(|hsla?\()/i.test(v));
        if(missing.length)result=decide('unknown','missing-utility-variable',`Compiled utility references undeclared variables: ${missing.join(', ')}`,themeEvidence);
        else if(arbitrary&&!refs.some(name=>variables.has(name)))result=decide('unknown','arbitrary-utility-literal',`Arbitrary value bypasses the named central theme: ${JSON.stringify(declarations)}`,own);
        else if(refs.some(name=>variables.has(name)))result=decide('central-live-utility','compiled-live-utility',`Actual Tailwind CSS ${hash(JSON.stringify(declarations))} reads declared canonical variables.`,[...themeEvidence,...[...new Set(refs)].filter(name=>variables.has(name)).map(name=>variables.get(name))]);
        else result=decide('central-build-utility','compiled-preset-utility',`Installed Tailwind CSS ${hash(JSON.stringify(declarations))} is generated with the verified central preset. These build-time scales require sync and rebuild; this does not claim live palette linkage.`,themeEvidence);
      }
    }
    if(!result&&/^var\(--[\w-]+(?:,[^()]*)?\)$/.test(scalar)){const name=scalar.match(/^var\((--[\w-]+)/)[1];if(variables.has(name))result=decide('token-reference-verified','canonical-scalar','Complete scalar reads a declared central variable.',[variables.get(name)]);}
    if(!result){const copy=adapterReference(scalar,imports);if(copy)result=decide('token-reference-verified','verified-ts-adapter','Exact named import and declared member read the fingerprint-verified central appearance adapter; shadowed bindings and nonexistent members remain unresolved.',[evidence(copies.get(copy).src),...own]);}
    if(!result&&kind==='object-property'&&styleKeys.has(`${line}:${property}:${value}`)){
      const leaves=conditionalScalarLeaves(value,ts,scalarAliases),proof=[];
      const accepted=leaves&&leaves.every(leaf=>{
        const variable=leaf.match(/^var\((--[\w-]+)\)$/)?.[1];if(variable&&variables.has(variable)){proof.push(variables.get(variable));return true;}
        const copy=adapterReference(leaf,imports);if(copy){proof.push(evidence(copies.get(copy).src));return true;}
        return leaf==='undefined'||(leaf==='0'&&['strokeWidth','opacity','margin','padding','width','height','minWidth','minHeight'].includes(property))||(leaf==='none'&&['borderTop','borderBottom','background','transform'].includes(property));
      });
      if(accepted&&proof.length)result=decide('token-reference-verified','complete-conditional-scalar','All complete value branches resolve through central variables/adapters or an explicit unset/reset branch. Unknown branches and ambiguous aliases prevent this proof.',[...own,...proof]);
    }
    if(!result&&kind==='object-property'&&styleKeys.has(`${line}:${property}:${value}`)){
      const allowed={flex:/^[01]$/,flexShrink:/^[01]$/,flexGrow:/^[01]$/,alignSelf:/^(?:auto|stretch|center|start|end|flex-start|flex-end)$/,textAlign:/^(?:left|center|right|start|end)$/,textDecoration:/^none$/,resize:/^(?:none|vertical|horizontal)$/,wordBreak:/^(?:normal|break-all|keep-all)$/,overflowWrap:/^(?:normal|break-word|anywhere)$/,placeItems:/^(?:center|start|end|stretch)$/,verticalAlign:/^(?:middle|top|bottom|baseline|text-bottom)$/,fontVariantNumeric:/^tabular-nums$/,printColorAdjust:/^exact$/};
      if(allowed[property]?.test(scalar)||arg.status==='structural-literal')result=decide('structural-behavior','confirmed-css-structure','Dimensionless alignment, text flow or reset value in a confirmed JSX/CSSProperties style object.',own);
    }
    if(!result&&dataKeys.has(`${line}:${property}:${value}`))result=decide('business-data','explicit-data-call','AST ancestor is a schema, JSON serialization or database operation; this is not a CSS argument.',own);
    if(!result&&kind==='named-style-value'&&resultBindings.has(`${line}:${property}:${value}`))result=decide('business-data','result-envelope-consumers','Every use of this unique awaited binding reads only data/error/success/ok/status result fields. No direct style, SVG or escaped use was found in its lexical scope.',own);
    if(!result&&kind==='presentation-attribute'){
      const target=attributeTargets.get(`${line}:${property}:${value}`);
      if(target?.module==='@/components/ui/button'&&target.exported==='Button'&&property==='size'&&['sm','default','lg','icon'].includes(scalar))result=decide('delegated-renderer-parameter','button-named-size','Named size selects the actual imported Button adapter. Its class definitions and styles are separately inventoried; this records delegation, not a blanket approval of that renderer.',[...own,{path:'components/ui/button.tsx',line:36,hash:hash(fs.readFileSync(path.join(PRODUCT,'components/ui/button.tsx'),'utf8'))}]);
      if(target?.module==='@/components/shared/pagination'&&['ListPagination','PageSizeSelect'].includes(target.exported)&&['size','page'].includes(property))result=decide('business-data','pagination-row-count','The exact imported pagination renderer consumes this as record count/page arithmetic and query state. It is not a CSS size. Pagination appearance has separate argument records.',[...own,{path:'components/shared/pagination.tsx',line:44,hash:hash(fs.readFileSync(path.join(PRODUCT,'components/shared/pagination.tsx'),'utf8'))}]);
      if(target?.module==='@/components/shared/page-help'&&target.exported==='PageHelp'&&property==='size'&&['sm','md'].includes(scalar)&&pageHelpIgnoresSize)result=decide('compatibility-noop','page-help-ignored-size','The exact imported PageHelp destructures only helpKey; the deprecated size input is not consumed. Its rendered Button size is separately inventoried.',[...own,{path:'components/shared/page-help.tsx',line:36,hash:hash(fs.readFileSync(path.join(PRODUCT,'components/shared/page-help.tsx'),'utf8'))}]);
      if(target?.module.startsWith('@/components/q-design-icons/')&&discardedIconProps.has(property)&&hash(fs.readFileSync(path.join(PRODUCT,'components/q-design-icons/_icon.tsx'),'utf8'))===hash(fs.readFileSync(path.join(ROOT,'patterns/react-icon.tsx'),'utf8')))result=decide('compatibility-noop','phosphor-ignored-stroke','The fingerprint-matched Phosphor factory explicitly discards legacy strokeWidth and absoluteStrokeWidth. Filled outline geometry remains separately owned by canonical icon source.',[...own,evidence('patterns/react-icon.tsx')]);
    }
    if(!result&&kind==='class-expression')result=decide('composed-classes','class-composition','Literal class fragments have individual records; unresolved identifier branches remain separate candidates. This is not proof of runtime appearance.',own);
    if(!result&&kind==='style-call'&&/^(?:cn|clsx|classNames|twMerge)$/.test(property))result=decide('composed-classes','class-call','Class composition call; literal fragments have separate records and unresolved values remain candidates. This does not approve the returned appearance.',own);
    if(!result&&kind==='svg-geometry')result=decide('coordinate-boundary','svg-or-component-coordinate','Coordinate/path value is retained as geometry; visible fill, stroke, type and size arguments are reviewed separately.',own);
    if(!result&&file==='lib/email/templates.ts'&&kind==='dynamic-style'&&/^escape\(/.test(value))result=decide('business-content','escaped-email-copy','HTML-escaped business text or URL; it is not a style declaration.',own);
    const argumentHash=hash(JSON.stringify([file,line,kind,property,value]));
    if(kind!=='parse-error'&&(!result||result.decision==='unknown')){
      const reviewed=verifiedManualReview({path:file,line,sourceHash,argumentHash},manualReviews.get(argumentHash),currentManualHash);
      if(reviewed)result=reviewed;
    }
    if(!result)result=decide('unknown','exact-consumer-review','No blanket filename or token-substring exemption is applied; inspect this exact consumer.',own);
    records.push({path:file,sourceHash,argumentHash,...arg,originalStatus:arg.status,...result});
  }
}
const memberKey=record=>`${record.path}:${record.line}:${record.kind}:${record.property}:${record.value}`;
const memberRecords=new Map(records.map(record=>[memberKey(record),record]));
let changed;
do{changed=false;for(const record of records)if(record.decision==='unknown'&&['style-expression','object-spread'].includes(record.kind)){
  const name=record.value.replace(/^\{(\w+)\}$/,'$1');
  const dependencies=styleGroups.get(record.path)?.get(`${record.line}:${record.value}`)??typedGroups.get(record.path)?.get(name);
  if(dependencies&&canResolveInlineStyle(dependencies,dep=>memberRecords.get(memberKey({...dep,path:record.path})))){Object.assign(record,decide('confirmed-style-composition','resolved-style-object','Every member of this exact inline or unique const CSSProperties object has separate central, structural or coordinate evidence. Unknown spreads or members prevent this classification.',dependencies.flatMap(dep=>memberRecords.get(memberKey({...dep,path:record.path}))?.evidence??[])));changed=true;}
}}while(changed);
const counts={};for(const record of records)counts[record.decision]=(counts[record.decision]??0)+1;
const report={version:1,generatedAt:new Date().toISOString(),product:'maison',scope:'Exact current-source evidence only. Build-time utility ownership and live variable linkage are distinguished. Unknowns remain visible, and no source classification is a visual screen pass.',fileHashes,counts,unknownCount:counts.unknown??0,records};
const outcome=finishReview(report,path.join(ROOT,'reviews'),mode);
console.log(JSON.stringify({mode,files:fileHashes.length,records:records.length,counts,...outcome},null,2));
if(mode==='check'&&!outcome.ok)process.exitCode=1;
