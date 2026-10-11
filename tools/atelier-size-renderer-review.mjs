// Prove finite size selectors and their complete numeric/CSS metric paths.
// Caller colors, labels, states and unrelated renderer styles remain separate.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {collectAdapterReferences,sourceImports,importedReference} from './atelier-style-proof.mjs';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';
import {reviewedEnumBodies,verifyEnumBody} from './atelier-renderer-enum-review.mjs';

export const sizeRendererBodies={Tag:reviewedEnumBodies.Tag,Switch:'1685190cc9625735438ee6f3c3136e2b9c2626c96bcc2c2995667e127ad079bc'};
const metricsBody='a1d8146f54b706299ae005d9e0352f0e0763e548fcd76cdb464447d10fe2d0e2';
export function sizeCall(ts,node,sf,name){
 const allowed=name==='Tag'?['xs','sm','md']:name==='Switch'?['sm','md']:null;
 if(!allowed)return null;
 const attrs=node.attributes.properties;
 if(attrs.some(ts.isJsxSpreadAttribute))return null;
 const sizes=attrs.filter(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==='size');
 if(sizes.length>1)return null;
 if(!sizes.length)return name==='Tag'?'sm':'md';
 const init=sizes[0].initializer;
 return init&&ts.isStringLiteral(init)&&allowed.includes(init.text)?init.text:null;
}
export function createSizeRendererReview(product='D:/Claude/Q-Atelier'){
 const root=path.resolve(product,'../Q-Design'),req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
 const files=runtimeFiles(product).filter(f=>/\.[jt]sx?$/.test(f)),texts=new Map(files.map(f=>[f,fs.readFileSync(path.join(product,f),'utf8')]));
 const config=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),options=ts.parseJsonConfigFileContent(config.config,ts.sys,product);
 const program=ts.createProgram(files.map(f=>path.join(product,f)),{...options.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const resolve=n=>{let symbol=checker.getSymbolAtLocation(n);while(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);return symbol;};
 const core='lib/design/components.tsx',metrics='lib/design/tag-metrics.ts',runtime='lib/design/q-design-runtime.ts';
 const sf=program.getSourceFile(path.join(product,core)),targets=new Map(),renderers={};
 const at=(s,n)=>s.getLineAndCharacterOfPosition(n.getStart(s)).line+1;
 const evidence=(file,line=1)=>({path:file,line,hash:hash(texts.get(file)??fs.readFileSync(path.join(root,file),'utf8'))});
 for(const name of ['Tag','Switch']){
  const fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(!fn)throw Error('Missing size renderer '+name);
  verifyEnumBody(ts,fn,sf,sizeRendererBodies[name]);
  targets.set(resolve(fn.name),name);renderers[name]={fn,evidence:evidence(core,at(sf,fn)),callers:[],references:[]};
 }
 const metricsSf=program.getSourceFile(path.join(product,metrics));
 if(hash(ts.createPrinter({removeComments:true}).printFile(metricsSf))!==metricsBody)throw Error('Tag metric implementation needs renewed review');
 const metricsDecl=metricsSf.statements.flatMap(s=>ts.isVariableStatement(s)?[...s.declarationList.declarations]:[]).find(d=>ts.isIdentifier(d.name)&&d.name.text==='TAG_DIMS');
 const metricsSymbol=resolve(metricsDecl.name);
 for(const file of files){
  const source=program.getSourceFile(path.join(product,file));
  const visit=n=>{
   if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
    const name=targets.get(resolve(n.tagName));
    if(name){const size=sizeCall(ts,n,source,name);if(!size)throw Error('Unresolved size caller '+file+':'+at(source,n));renderers[name].callers.push({path:file,line:at(source,n),sourceHash:hash(texts.get(file)),size,consumer:n.getText(source)});}
   }
   if(ts.isIdentifier(n)){
    const symbol=resolve(n),name=targets.get(symbol),parent=n.parent;
    if(name){
     const fn=renderers[name].fn;
     if(n!==fn.name&&!ts.isImportSpecifier(parent)&&!ts.isExportSpecifier(parent)
      &&!((ts.isJsxOpeningElement(parent)||ts.isJsxSelfClosingElement(parent)||ts.isJsxClosingElement(parent))&&parent.tagName===n))throw Error('Non-JSX size renderer use '+file+':'+at(source,n));
     renderers[name].references.push(evidence(file,at(source,n)));
    }
    if(symbol===metricsSymbol){
     const tag=renderers.Tag.fn;
     if(file!==metrics&&!(file===core&&(ts.isImportSpecifier(parent)||n.getStart(source)>=tag.getStart(sf)&&n.end<=tag.end)))throw Error('Unreviewed tag metrics consumer '+file+':'+at(source,n));
    }
   }
   ts.forEachChild(n,visit);
  };visit(source);
 }
 const variables=new Map(),centralFiles=new Map(),copyEvidence=[];
 for(const file of ['patterns/foundation.css','patterns/foundation/atelier-core-values.css']){
  const code=fs.readFileSync(path.join(root,file),'utf8');
  postcss.parse(code).walkDecls(d=>{if(d.prop.startsWith('--'))variables.set(d.prop,{path:file,line:d.source.start.line,hash:hash(code),variable:d.prop});});
 }
 const outputs=centralOutputs(PARTS,'Q-Atelier',product);
 for(const file of [runtime,'app/q-design.foundation.css']){
  const part=outputs.find(p=>p.path===file),canonical=fs.readFileSync(path.join(root,part.src),'utf8'),actual=fs.readFileSync(path.join(product,file),'utf8');
  if(copyProblems(part,canonical,actual).length)throw Error('Central metric source differs '+file);
  copyEvidence.push({path:part.src,line:1,hash:hash(canonical)},{path:file,line:1,hash:hash(actual)});
  if(file===runtime)centralFiles.set(runtime,{path:part.src,line:1,hash:hash(canonical)});
 }
 const globals=texts.get('app/globals.css')??fs.readFileSync(path.join(product,'app/globals.css'),'utf8');
 if(!/@import\s*['"]\.\/q-design\.foundation\.css['"]\s*;/.test(globals)
  ||!/import\s*['"]\.\/globals\.css['"]/.test(texts.get('app/layout.tsx')))throw Error('Shared foundation is not loaded by the root layout');
 copyEvidence.push({path:'app/globals.css',line:1,hash:hash(globals)},evidence('app/layout.tsx'));
 const references=collectAdapterReferences({ts,files:new Map([[runtime,texts.get(runtime)],[metrics,texts.get(metrics)]]),variables,hash,centralFiles,numericFiles:new Set([runtime])});
 const imports=sourceImports(ts,sf),metricEvidence=[];
 const numeric=member=>{
  const ref=importedReference(member,imports,core,references);
  if(!ref||ref[0]?.valueKind!=='number')throw Error('Metric is not an exact central numeric member '+member);
  metricEvidence.push(...ref);
 };
 for(const size of ['xs','sm','md'])for(const field of ['gap','minH','fs','padY','padX','dotSize'])numeric('TAG_DIMS.'+size+'.'+field);
 for(const size of ['sm','md'])for(const field of ['w','h','knob'])numeric('QDRuntime.switch.'+size+'.'+field);
 numeric('QDRuntime.switch.inset');
 const tagVariables=[];
 for(const size of ['xs','sm','md'])for(const suffix of ['gap','min-height','size','padding-y','padding-x','dot-size']){
  const ref=variables.get('--qd-tag-'+size+'-'+suffix);if(!ref)throw Error('Missing declared tag variable '+size+' '+suffix);tagVariables.push(ref);
 }
 const tagValues=new Map([
  ['gap',"tagLength('gap', dims.gap)"],['minHeight',"tagLength('min-height', dims.minH)"],['fontSize',"tagLength('size', dims.fs)"],
  ['padding',"`${tagLength('padding-y', dims.padY)} ${tagLength('padding-x', dims.padX)}`"],['width',"tagLength('dot-size', dims.dotSize)"],['height',"tagLength('dot-size', dims.dotSize)"],
 ]);
 const switchValues=new Map([['width',new Set(['dims.w','dims.knob'])],['height',new Set(['dims.h','dims.knob'])],['left',new Set(['checked ? onLeft : QDRuntime.switch.inset'])]]);
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8')),records=[];
 for(const row of main.records.filter(r=>r.path===core&&r.kind==='object-property')){
  const renderer=Object.entries(renderers).find(([,v])=>row.line>=at(sf,v.fn)&&row.line<=at(sf,{getStart:()=>v.fn.end}));
  if(!renderer)continue;
  const [name,info]=renderer;
  const accepted=name==='Tag'?tagValues.get(row.property)===row.value:switchValues.get(row.property)?.has(row.value);
  if(!accepted)continue;
  if(row.sourceHash!==hash(texts.get(core)))throw Error('Metric argument source changed');
  const all=[info.evidence,evidence(metrics),...metricEvidence,...copyEvidence,...(name==='Tag'?tagVariables:[]),...info.references];
  const proof=[...new Map(all.map(e=>[JSON.stringify(e),e])).values()];
  records.push({path:row.path,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,property:row.property,value:row.value,decision:'token-reference-verified',ruleId:'exact-sized-renderer-metric',reason:name==='Tag'?'Every actual Tag caller uses an explicit reviewed size or its sm default. The pinned helper selects one of 18 declared central CSS variables; all fallback fields trace to the synchronized central numeric source. Color, tier and caller content are outside this proof.':'Every actual Switch caller uses a reviewed size or its md default. The pinned renderer selects only the two central size records, and its thumb offset uses their numeric members and the central inset. The sibling inset key is never treated as a size record.',evidence:proof});
 }
 if(records.length!==11)throw Error('Expected six tag and five switch metric arguments, found '+records.length);
 return {version:1,scope:'Finite actual size selectors and complete central metric expressions only. Source changes, spreads, dynamic size expressions, indirect renderer calls and unreviewed metrics references fail closed.',callers:Object.fromEntries(Object.entries(renderers).map(([name,r])=>[name,r.callers])),records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),file=path.join(root,'reviews/atelier-size-renderer-review.json'),report=createSizeRendererReview();
 const json=JSON.stringify(report,null,2)+'\n';
 if(process.argv.includes('--check')){if(fs.readFileSync(file,'utf8')!==json)throw Error('Size renderer review differs from current sources');}else fs.writeFileSync(file,json);
 console.log(JSON.stringify({callers:Object.fromEntries(Object.entries(report.callers).map(([k,v])=>[k,v.length])),metrics:report.records.length}));
}
