// Exact-source review evidence. Unknown expressions remain visible and never become a pass.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { PARTS } from './sync-parts.mjs';
import { centralOutputs, copyProblems } from './audit-coverage-core.mjs';
import { hash, runtimeFiles, cssProperties, scanArguments, jsxStyleAttributes } from './style-arguments-core.mjs';
import { collectAdapterReferences, expressionProof, classExpressionProof, importedReference, localBindings, namedValueBoundary, primaryVariables, reviewedLeafProof, sourceImports } from './atelier-style-proof.mjs';
import { verifiedConsumerReview } from './atelier-style-manual.mjs';
import { verifiedParameterLeaves } from './atelier-parameter-leaves-review.mjs';
import { inactiveExportGroup } from './atelier-inactive-exports.mjs';
const ROOT='D:/Claude/Q-Design', PRODUCT='D:/Claude/Q-Atelier';
const req=createRequire(path.join(PRODUCT,'package.json')),ts=req('typescript'),postcss=req('postcss');
const properties=cssProperties(ts,fs.readFileSync(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts'),'utf8'));
const copies=new Map(centralOutputs(PARTS,'Q-Atelier',PRODUCT).map(part=>[part.path,part]));
const cssFiles=['patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','patterns/components.css','dist/q-design.nav.css','dist/q-design.list.css','dist/q-design.screen.css','patterns/workspace.css','dist/q-design.palette.atelier.css'];
const variables=new Map(),classes=new Map();
for(const file of cssFiles){
  const code=fs.readFileSync(path.join(ROOT,file),'utf8'),sourceHash=hash(code),ast=postcss.parse(code);
  ast.walkDecls(decl=>{if(decl.prop.startsWith('--')&&!variables.has(decl.prop))variables.set(decl.prop,{path:file,line:decl.source.start.line,hash:sourceHash,variable:decl.prop});});
  ast.walkRules(rule=>{for(const match of rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g))if(!classes.has(match[1]))classes.set(match[1],{path:file,line:rule.source.start.line,hash:sourceHash});});
}
const runtimePart=copies.get('lib/design/q-design-runtime.ts');
const runtimeVerified=copyProblems(runtimePart,fs.readFileSync(path.join(ROOT,runtimePart.src),'utf8'),fs.readFileSync(path.join(PRODUCT,runtimePart.path),'utf8')).length===0;
const centralFiles=new Map();
for(const part of copies.values())if(part.path.endsWith('.ts')&&fs.existsSync(path.join(PRODUCT,part.path))){
  const canonical=fs.readFileSync(path.join(ROOT,part.src),'utf8'),actual=fs.readFileSync(path.join(PRODUCT,part.path),'utf8');
  if(!copyProblems(part,canonical,actual).length)centralFiles.set(part.path,{path:part.src,line:1,hash:hash(canonical)});
}
const adapterReferences=collectAdapterReferences({ts,variables,hash,centralFiles,numericFiles:new Set(runtimeVerified?[runtimePart.path]:[]),files:new Map(
  [...new Set(['lib/design/tag-metrics.ts','lib/design/tokens.ts','lib/design/grain.ts','lib/design/hangul-text.tsx','lib/design/segmented-choice.tsx','lib/design/components.tsx','lib/design/q-design-contract.ts','lib/design/q-design-scale.ts','lib/design/main-padding.ts','lib/design/print.ts','lib/design/sticky-inset.ts','lib/export/docx-builder/brand.ts','lib/api/fetch-json.ts','lib/letter-to-file.ts','lib/lot.ts','lib/notifications/kind-display.ts','lib/production/equipment.ts','lib/research/doc-status.ts','lib/research/stage-labels.ts','lib/subscription/plan-policy.ts','lib/vigilance.ts','lib/authorized-rep.ts','app/(app)/m/field-ui.tsx','lib/workflow-states.ts','components/TopHeaderBand.tsx',...fs.readdirSync(path.join(PRODUCT,'lib/labels')).filter(file=>file.endsWith('.ts')&&!file.endsWith('.test.ts')).map(file=>'lib/labels/'+file),...centralFiles.keys()])].map(file=>[file,fs.readFileSync(path.join(PRODUCT,file),'utf8')]))});
// Standalone documents have independent stylesheets. Their selectors must not
// accidentally establish ownership of identically named application classes.
const scopedClasses=new Map();
const addScopedCss=(consumer,css,evidence)=>{
 const map=new Map(classes);postcss.parse(css).walkRules(rule=>{for(const match of rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g))map.set(match[1],evidence);});scopedClasses.set(consumer,map);
};
const simulator=copies.get('public/__sim.html');
if(simulator){const canonical=fs.readFileSync(path.join(ROOT,simulator.src),'utf8'),actual=fs.readFileSync(path.join(PRODUCT,simulator.path),'utf8');
 if(!copyProblems(simulator,canonical,actual).length&&actual.includes('<script src="/__sim.js"></script>'))addScopedCss('public/__sim.js',fs.readFileSync(path.join(ROOT,'patterns/foundation/atelier-simulator.css'),'utf8'),{path:'patterns/foundation/atelier-simulator.css',line:1,hash:hash(fs.readFileSync(path.join(ROOT,'patterns/foundation/atelier-simulator.css'),'utf8'))});
}
if(centralFiles.has('lib/design/q-design-html.ts')){
 const file='patterns/foundation/atelier-html.ts',code=fs.readFileSync(path.join(ROOT,file),'utf8'),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true);
 const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='buildExportStyles'),result=fn?.body?.statements.find(ts.isReturnStatement)?.expression;
 if(result&&ts.isTemplateExpression(result))addScopedCss('lib/export/org-export.ts',result.head.text+result.templateSpans.map(span=>'0'+span.literal.text).join(''),{path:file,line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:hash(code)});
}
if(centralFiles.has('lib/manual/q-design-styles.ts')){
 const route=fs.readFileSync(path.join(PRODUCT,'app/api/manual/download/route.ts'),'utf8'),routeSf=ts.createSourceFile('route.ts',route,ts.ScriptTarget.Latest,true),routeImports=sourceImports(ts,routeSf);
 const imported=routeImports.get('applyManualStyles');
 if(imported?.module==='@/lib/manual/q-design-styles'&&imported.exported==='applyManualStyles'&&route.includes('applyManualStyles(base).replace(PLACEHOLDER, buildWatermark(who))')){
  const file='patterns/foundation/atelier-manual.ts',code=fs.readFileSync(path.join(ROOT,file),'utf8'),css=/MANUAL_CSS = String\.raw`([\s\S]*?)`;/.exec(code)?.[1];
  if(css)addScopedCss('lib/manual/watermark.ts',css,{path:file,line:1,hash:hash(code)});
 }
}
const rules={
  'central-copy':'PARTS source/body/fingerprint equivalence verified before each copied argument is classified.',
  'central-selector':'The exact static class selector has a declaration in a currently hashed central CSS recipe.',
  'canonical-scalar':'The entire scalar value is a sequence of declared central CSS variables or an exact imported object member traced to such variables. Mixed expressions are not inferred. Changed scale-helper semantics or any local shadowing remain unknown.',
  'numeric-adapter':'Direct BP, LAYOUT, ICON or QDRuntime access imports the verified centrally distributed runtime module.',
  'proven-composition':'Every conditional result, template interpolation or object property independently resolves to a central value or an explicit structural keyword. Unknown spreads and authored literal fragments block the entire composition.',
  'font-resource':'Generated font-face declarations identify shipped binary resources; family selection remains controlled by central tokens.',
  'css-structure':'A proven JSX style/CSSProperties object contains a reviewed dimensionless layout, alignment, text wrapping or reset value.',
  'expert-count-data':'The exact spread builds an expert id/email/count record, then sorts it by count; it is not style composition.',
  'data-envelope':'The exact complete binding is a native Date, native HTTP Response or fingerprint-reviewed JSON success/failure envelope. Descendant values and subsequent visual uses are still separately inventoried.',
  'inactive-export-graph':'The explicitly named compatibility exports have no runtime consumers in the freshly parsed application graph. Aliases, namespace escapes, dynamic module loading and indirect references invalidate this proof. This is not central ownership of visible styles.',
  'unknown':'No sufficient exact-source proof exists in this review. Further inspection or centralization is required.',
};
const records=[],fileHashes=[];
const manualReviews = new Map(), currentHashes = new Map();
const currentHash = file => {
  if (!file || path.isAbsolute(file) || file.split(/[\\/]/).includes('..')) return null;
  if (!currentHashes.has(file)) {
    const absolute = path.join(/^(?:source|patterns|dist)\//.test(file) ? ROOT : PRODUCT, file);
    currentHashes.set(file, fs.existsSync(absolute) ? hash(fs.readFileSync(absolute, 'utf8')) : null);
  }
  return currentHashes.get(file);
};
for (const name of ['atelier-profile-grid-review.json','atelier-icon-compatibility-review.json','atelier-size-renderer-review.json','atelier-write-guard-review.json','atelier-module-guard-review.json', 'atelier-nonvisual-binding-review.json', 'atelier-domain-binding-review.json', 'atelier-runtime-binding-review.json', 'atelier-style-spread-review.json', 'atelier-style-bindings-review.json', 'atelier-style-consumer-review.json','atelier-style-prop-flow-review.json','atelier-fold-grid-review.json','atelier-widget-width-review.json','atelier-final-presentation-boundaries.json','atelier-renderer-enum-review.json','atelier-renderer-slot-review.json','atelier-html-content-review.json','atelier-dimension-flow-review.json','atelier-api-output-consumer-review.json','atelier-data-ratio-review.json','atelier-measured-coordinate-review.json','atelier-semantic-palette-review.json','atelier-color-flow-review.json','atelier-watermark-content-review.json','atelier-chart-layout-review.json']) {
  const file = path.join(ROOT, 'reviews', name);
  if (!fs.existsSync(file)) continue;
  for (const entry of JSON.parse(fs.readFileSync(file, 'utf8')).records ?? []) {
    const key = JSON.stringify([entry.path, entry.line, entry.argumentHash]);
    if (manualReviews.has(key)) throw new Error(`Duplicate exact consumer review: ${key}`);
    manualReviews.set(key, entry);
  }
}
const parameterFile=path.join(ROOT,'reviews/atelier-parameter-leaves-review.json');
// Fresh native glyph evidence is separate from archived pre-migration records.
// The normal exact source and evidence checks still apply to each replacement.
const socialGlyphReviews=new Map();
for(const name of ['atelier-social-glyph-review.json','atelier-ring-geometry-review.json'])for(const entry of JSON.parse(fs.readFileSync(path.join(ROOT,'reviews',name),'utf8')).records){
 const key=JSON.stringify([entry.path,entry.line,entry.argumentHash]);
 if(socialGlyphReviews.has(key))throw new Error(`Duplicate social glyph review: ${key}`);
 socialGlyphReviews.set(key,entry);
}
const parameterFlows=fs.existsSync(parameterFile)?JSON.parse(fs.readFileSync(parameterFile,'utf8')).flows:[];
const decide=(decision,ruleId,reason,evidence=[])=>({decision,ruleId,reason,evidence});
const applicationFiles=runtimeFiles(PRODUCT);
const inactiveCompatibility=inactiveExportGroup({ts,root:PRODUCT,files:applicationFiles,target:'lib/design/tokens.ts',names:['TYPE','typeStyle','goldTextStyle']});
for(const file of applicationFiles){
  const code=fs.readFileSync(path.join(PRODUCT,file),'utf8'),sourceHash=hash(code),part=copies.get(file);
  let activeClasses=scopedClasses.get(file)??classes;
  if(file==='lib/export/org-export.ts'){
    const scopeSf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true),binding=sourceImports(ts,scopeSf).get('EXPORT_STYLE');
    if(binding?.module!=='@/lib/design/q-design-html'||binding.exported!=='EXPORT_STYLE'||!code.includes('<style>${EXPORT_STYLE}</style>'))activeClasses=classes;
  }
  fileHashes.push({path:file,hash:sourceHash});
  const verified=part&&copyProblems(part,fs.readFileSync(path.join(ROOT,part.src),'utf8'),code).length===0;
  const iconSource=file.startsWith('components/q-design-icons/')?`dist/react-icons/${path.basename(file)}`:null;
  const iconVerified=iconSource&&fs.existsSync(path.join(ROOT,iconSource))&&hash(fs.readFileSync(path.join(ROOT,iconSource),'utf8'))===sourceHash;
  const styleKeys=new Set(),proofNodes=new Map();let imports=new Map(),sf,locals;
  if(/\.[jt]sx?$/.test(file)){
    sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
    imports=sourceImports(ts,sf);
    locals=localBindings(ts,sf,hash,adapterReferences);
    const visit=node=>{
      if(ts.isPropertyAssignment(node)){
        const line=sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,name=node.name.getText(sf).replace(/^['"]|['"]$/g,''),value=node.initializer.getText(sf);
        proofNodes.set(`object-property:${line}:${name}:${value}`,node.initializer);
        let confirmed=false;
        for(let current=node.parent;current;current=current.parent){
          if(ts.isJsxAttribute(current)){confirmed=jsxStyleAttributes.has(current.name.getText(sf));break;}
          if(ts.isVariableDeclaration(current)&&current.type&&/(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))){confirmed=true;break;}
          if(ts.isAsExpression(current)&&/(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))){confirmed=true;break;}
          if(ts.isFunctionLike(current)&&current.type&&/(?:^|\.)CSSProperties\b/.test(current.type.getText(sf))){confirmed=true;break;}
          if(ts.isFunctionLike(current)||ts.isJsxElement(current)||ts.isJsxSelfClosingElement(current))break;
        }
        if(confirmed)styleKeys.add(`${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.name.getText(sf).replace(/^['"]|['"]$/g,'')}:${node.initializer.getText(sf)}`);
      }
      if(ts.isJsxAttribute(node)&&jsxStyleAttributes.has(node.name.getText(sf))&&node.initializer&&ts.isJsxExpression(node.initializer)&&node.initializer.expression){
        proofNodes.set(`style-expression:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.name.getText(sf)}:${node.initializer.getText(sf)}`,node.initializer.expression);
      }
      if(ts.isJsxAttribute(node)&&node.initializer&&ts.isJsxExpression(node.initializer)&&node.initializer.expression){
        proofNodes.set(`presentation-attribute:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.name.getText(sf)}:${node.initializer.getText(sf)}`,node.initializer.expression);
        if(['className','class'].includes(node.name.getText(sf)))proofNodes.set(`class-expression:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.name.getText(sf)}:${node.initializer.getText(sf)}`,node.initializer.expression);
      }
      if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer){
        proofNodes.set(`named-style-value:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.name.text}:${node.initializer.getText(sf)}`,node.initializer);
      }
      if(ts.isSpreadAssignment(node))proofNodes.set(`object-spread:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:...:${node.expression.getText(sf)}`,node.expression);
      if((ts.isReturnStatement(node)&&node.expression)||(ts.isArrowFunction(node)&&!ts.isBlock(node.body))){const value=ts.isReturnStatement(node)?node.expression:node.body;proofNodes.set(`paint-return:${sf.getLineAndCharacterOfPosition(value.getStart(sf)).line+1}:color:${value.getText(sf)}`,value);}
      if(ts.isTemplateSpan(node))proofNodes.set(`dynamic-style:${sf.getLineAndCharacterOfPosition(node.expression.getStart(sf)).line+1}:embedded-interpolation:${node.expression.getText(sf)}`,node.expression);
      if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken&&/\.style\./.test(node.left.getText(sf))){
        proofNodes.set(`dynamic-style:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1}:${node.left.getText(sf)}:${node.right.getText(sf)}`,node.right);
      }
      ts.forEachChild(node,visit);
    };visit(sf);
  }
  const argumentsFound=scanArguments(file,code,{ts,postcss,properties,owner:part?.src}),reviewedNodes=new WeakMap();
  if(sf){
    const leaves=new Map();
    for(const flow of parameterFlows.filter(flow=>flow.path===file))for(const leaf of verifiedParameterLeaves(flow,currentHash)??[])leaves.set(`${leaf.start}:${leaf.end}:${leaf.text}`,leaf.proof);
    const bind=node=>{if(ts.isIdentifier(node)){const proof=leaves.get(`${node.getStart(sf)}:${node.end}:${node.text}`);if(proof)reviewedNodes.set(node,proof);}ts.forEachChild(node,bind);};bind(sf);
  }
  for(const argument of argumentsFound){
    const node=proofNodes.get(`${argument.kind}:${argument.line}:${argument.property}:${argument.value}`);if(!node)continue;
    const argumentHash=hash(JSON.stringify(argument)),entry=manualReviews.get(JSON.stringify([file,argument.line,argumentHash]));
    const reviewed=verifiedConsumerReview({path:file,sourceHash,argumentHash,line:argument.line},entry,currentHash);
    if(!reviewed)continue;
    const leaf=reviewedLeafProof(argument,reviewed);if(leaf)reviewedNodes.set(node,leaf);
  }
  for(const argument of argumentsFound){
    const {kind,property,value,line}=argument;
    let result;
    const own=[{path:file,line,hash:sourceHash}],scalar=value.trim().replace(/^\{([\s\S]*)\}$/,'$1').replace(/^(['"])([\s\S]*)\1$/,'$2');
    if(verified)result=decide('central-source-verified','central-copy','Complete argument comes from the verified canonical body.',[{path:part.src,line:1,hash:hash(fs.readFileSync(path.join(ROOT,part.src),'utf8'))}]);
    else if(iconVerified)result=decide('central-source-verified','central-copy','Normalized component source matches the generated canonical icon.',[{path:iconSource,line,hash:sourceHash}]);
    else if(file==='app/fonts.css'&&['css-declaration','css-at-rule'].includes(kind))result=decide('font-resource','font-resource','Bundled font resource metadata; no screen-specific typography recipe is inferred.',own);
    else if(kind==='css-at-rule'&&property==='@import'){
      const match=/^['"](\.[^'"]+)['"]$/.exec(value),target=match&&path.posix.normalize(path.posix.join(path.posix.dirname(file),match[1])),copy=target&&copies.get(target);
      if(copy){const canonical=fs.readFileSync(path.join(ROOT,copy.src),'utf8'),actual=fs.readFileSync(path.join(PRODUCT,target),'utf8');if(!copyProblems(copy,canonical,actual).length)result=decide('central-source-verified','central-copy','This exact relative import consumes a fingerprint-verified central stylesheet.',[...own,{path:copy.src,line:1,hash:hash(canonical)}]);}
    }
    else if(kind==='class-utility'&&activeClasses.has(value))result=decide('central-selector','central-selector','This exact class exists in the applicable central recipe.',[activeClasses.get(value)]);
    else if(kind==='class-expression'){
      const proof=classExpressionProof({ts,node:proofNodes.get(`${kind}:${line}:${property}:${value}`),sf,classes:activeClasses,locals});
      if(proof)result=decide('central-selector','central-selector','Each complete selector in every class branch has an exact central declaration; unknown constructed suffixes and caller strings are not inferred.',[...own,...proof.evidence]);
    }
    else if(primaryVariables(scalar,variables)){
      const tokens=primaryVariables(scalar,variables);
      result=decide('token-reference-verified','canonical-scalar','Every complete scalar segment reads a declared central variable.',tokens.map(token=>variables.get(token)));
    }
    if(!result&&runtimeVerified&&/^(?:BP|LAYOUT|ICON|QDRuntime)\.[\w.]+$/.test(scalar)){
      const binding=scalar.split('.')[0];
      const actual=importedReference(scalar,imports,file,adapterReferences);
      if(actual&&(imports.get(binding)?.module==='@/lib/design/q-design-runtime'||imports.get(binding)?.module==='./q-design-runtime'))result=decide('token-reference-verified','numeric-adapter','The declared member comes from the fingerprint-verified numeric UI source.',actual);
    }
    if(!result){const proof=importedReference(scalar,imports,file,adapterReferences);if(proof)result=decide('token-reference-verified','canonical-scalar','Exact import and exported member trace to declared central variables; adapter source and declarations are hashed.',proof);}
    if(!result&&proofNodes.has(`${kind}:${line}:${property}:${value}`)){
      const proof=expressionProof({ts,node:proofNodes.get(`${kind}:${line}:${property}:${value}`),sf,property:kind==='dynamic-style'?property.split('.').at(-1):property,imports,file,references:adapterReferences,variables,locals,reviewedNodes});
      if(proof&&(proof.central||kind==='style-expression'||kind==='dynamic-style'||styleKeys.has(`${line}:${property}:${value}`))){
        const evidence=[...new Map([...own,...proof.evidence].map(item=>[JSON.stringify(item),item])).values()];
        const delegated=evidence.some(item=>item.delegatedReview);
        const geometry=evidence.some(item=>item.dataGeometryReview);
        result=decide(delegated?'delegated-renderer-parameter':geometry?'confirmed-style-composition':proof.central?'token-reference-verified':'structural-behavior','proven-composition',delegated?'All local authored values are independently proven; exact forwarded style parameters retain their separately inventoried caller obligations. This does not approve the caller styles.':geometry?'All authored style values are proven and the exact separately reviewed domain ratio or DOM measurement remains a data boundary, not a centrally owned constant.':'Every result branch and authored value in this expression has independent source proof; no unknown fragment is ignored.',evidence);
      }
    }
    if(!result&&kind==='named-style-value'&&proofNodes.has(`${kind}:${line}:${property}:${value}`)){
      const boundary=namedValueBoundary({ts,node:proofNodes.get(`${kind}:${line}:${property}:${value}`),sf,imports,file,references:adapterReferences,locals});
      if(boundary)result=decide('business-data','data-envelope',boundary.reason,[...own,...boundary.evidence]);
    }
    if(!result&&kind==='object-property'&&styleKeys.has(`${line}:${property}:${value}`)){
      const allowed={flex:/^[01]$/,flexShrink:/^[01]$/,flexGrow:/^[01]$/,alignSelf:/^(?:auto|stretch|center|start|end|flex-start|flex-end)$/,textAlign:/^(?:left|center|right|start|end)$/,textDecoration:/^none$/,resize:/^(?:none|vertical|horizontal)$/,wordBreak:/^(?:normal|break-all|keep-all)$/,overflowWrap:/^(?:normal|break-word|anywhere)$/,placeItems:/^(?:center|start|end|stretch)$/,verticalAlign:/^(?:middle|top|bottom|baseline|text-bottom)$/,fontVariantNumeric:/^tabular-nums$/};
      if(allowed[property]?.test(scalar)||argument.status==='structural-literal')result=decide('structural-behavior','css-structure','Exact value is dimensionless layout/alignment or text-flow behavior in a confirmed style object.',own);
    }
    if(!result&&file==='app/(app)/admin/activity/page.tsx'&&kind==='object-spread'&&value==='v'&&code.includes('.map(([id, v]) => ({ id, ...v }))'))result=decide('business-data','expert-count-data','Spread composes expert id/email/count, followed by count sorting; never passed as a style object.',own);
    if(!result)result=verifiedConsumerReview({path:file,sourceHash,argumentHash:hash(JSON.stringify(argument)),line},manualReviews.get(JSON.stringify([file,line,hash(JSON.stringify(argument))])),currentHash);
    if(!result)result=verifiedConsumerReview({path:file,sourceHash,argumentHash:hash(JSON.stringify(argument)),line},socialGlyphReviews.get(JSON.stringify([file,line,hash(JSON.stringify(argument))])),currentHash);
    if(!result&&kind!=='parse-error'&&file==='lib/design/tokens.ts'&&inactiveCompatibility.inactive&&inactiveCompatibility.ranges.some(range=>line>=range.start&&line<=range.end))result=decide('inactive-compatibility-export','inactive-export-graph','This exact argument is within an unused compatibility export. Its runtime-use graph is rechecked on every review; the immutable token source is preserved.',own);
    if(!result)result=decide('unknown','unknown','No broad filename, numeric-value or single-token exemption is applied.',own);
    records.push({path:file,sourceHash,argumentHash:hash(JSON.stringify(argument)),...argument,originalStatus:argument.status,...result});
  }
}
const counts={};for(const record of records)counts[record.decision]=(counts[record.decision]??0)+1;
const report={version:1,product:'atelier',scope:'Exact static-source argument review. This is not a whole-screen visual conformance certificate. Unknown records remain actionable and no whitelist is inferred.',fileHashes,inactiveCompatibility,rules,counts,records};
fs.writeFileSync(path.join(ROOT,'reviews/atelier-style-decisions.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({files:fileHashes.length,records:records.length,counts},null,2));
