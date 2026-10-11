// Explicit enum-to-renderer boundaries. This does not approve the renderer's other styles.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';

export const reviewedEnumBodies={
 Tag:'f56c39ff5d8ac62e5bbb09cc13a503872fa2682f09a171174703b75265e09a1c',
 SegmentedChoice:'8b455f9ecbb285978c880e2e548c1ccd17a53eecd2d6f9874485881eb2f4085f',
};
export function verifyEnumBody(ts,fn,sf,expected){
 if(hash(ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf))!==expected)throw new Error('Enum renderer implementation requires renewed review');
}
export function enumBoundary(ts,checker,attribute,sf,targets){
 if(!ts.isJsxAttribute(attribute)||!attribute.initializer||!ts.isStringLiteral(attribute.initializer))return null;
 const tag=attribute.parent.parent.tagName;
 let symbol=checker.getSymbolAtLocation(tag);
 while(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);
 const target=targets.get(symbol);if(!target)return null;
 const prop=attribute.name.getText(sf),value=attribute.initializer.text;
 if(target==='Tag'&&prop==='size'&&['xs','sm','md'].includes(value))return {renderer:target,prop,value,decision:'delegated-renderer-parameter'};
 if(target==='SegmentedChoice'&&prop==='font'&&['serif','mono'].includes(value))return {renderer:target,prop,value,decision:'delegated-renderer-parameter'};
 if(target==='SegmentedChoice'&&prop==='fill'&&value==='tint')return {renderer:target,prop,value,decision:'compatibility-noop'};
 return null;
}
export function createRendererEnumReview(product=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const root=path.resolve(product,'../Q-Design'),req=createRequire(path.join(product,'package.json')),ts=req('typescript'),postcss=req('postcss');
 const files=runtimeFiles(product).filter(p=>/\.[jt]sx?$/.test(p)),raw=new Map(files.map(p=>[p,fs.readFileSync(path.join(product,p),'utf8')]));
 const cfg=ts.readConfigFile(path.join(product,'tsconfig.json'),ts.sys.readFile),opts=ts.parseJsonConfigFileContent(cfg.config,ts.sys,product);
 const program=ts.createProgram(files.map(p=>path.join(product,p)),{...opts.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const targets=new Map(),renderers={};
 for(const [file,name] of [['lib/design/components.tsx','Tag'],['lib/design/segmented-choice.tsx','SegmentedChoice']]){
  const sf=program.getSourceFile(path.join(product,file)),fn=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);
  if(!fn)throw new Error('Missing reviewed renderer '+name);
  verifyEnumBody(ts,fn,sf,reviewedEnumBodies[name]);
  targets.set(checker.getSymbolAtLocation(fn.name),name);
  renderers[name]={path:file,line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:hash(raw.get(file))};
 }
 const central=[];
 for(const file of ['patterns/foundation.css','patterns/foundation/atelier-core-values.css']){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  postcss.parse(text).walkDecls(d=>{if(/^--qd-tag-(xs|sm|md)-(min-height|size|padding-y|padding-x|dot-size|gap)$/.test(d.prop)||['--qd-font-family-ui','--qd-font-family-mono'].includes(d.prop))central.push({path:file,line:d.source.start.line,hash:hash(text),variable:d.prop,value:d.value});});
 }
 if(new Set(central.map(x=>x.variable)).size!==20)throw new Error('Central size or font enum target missing');
 const part=centralOutputs(PARTS,'Q-Atelier',product).find(p=>p.path==='app/q-design.foundation.css');
 const canonical=fs.readFileSync(path.join(root,part.src),'utf8'),copy=fs.readFileSync(path.join(product,part.path),'utf8');
 if(copyProblems(part,canonical,copy).length)throw new Error('Central foundation copy differs');
 const copyEvidence=[{path:part.src,line:1,hash:hash(canonical)},{path:part.path,line:1,hash:hash(copy)}];
 const main=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-style-decisions.json'),'utf8'));
 const candidates=main.records.filter(r=>r.kind==='presentation-attribute'&&['size','font','fill'].includes(r.property)&&/^"(?:xs|sm|md|serif|mono|tint)"$/.test(r.value));
 const unique=new Map(candidates.map(r=>[JSON.stringify([r.path,r.line,r.argumentHash]),r])),records=[];
 for(const record of unique.values()){
  const sf=program.getSourceFile(path.join(product,record.path));
  if(hash(raw.get(record.path))!==record.sourceHash)throw new Error('Argument source changed '+record.path);
  const matches=[];
  const visit=n=>{if(ts.isJsxAttribute(n)&&n.name.getText(sf)===record.property&&n.initializer?.getText(sf)===record.value&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===record.line)matches.push(n);ts.forEachChild(n,visit);};visit(sf);
  if(!matches.length)throw new Error('Exact enum argument missing');
  const boundaries=matches.map(n=>enumBoundary(ts,checker,n,sf,targets));
  if(boundaries.some(x=>!x)||boundaries.some(x=>JSON.stringify(x)!==JSON.stringify(boundaries[0])))throw new Error('Enum occurrence has an unreviewed renderer '+record.path+':'+record.line);
  const boundary=boundaries[0],evidence=[{path:record.path,line:record.line,hash:record.sourceHash},renderers[boundary.renderer]];
  let reason;
  if(boundary.renderer==='Tag'){
   reason='The exact imported Tag.size enum indexes TAG_DIMS and constructs --qd-tag-'+boundary.value+'-* CSS references. All six size variables exist in the synchronized central foundation. This approves the selector boundary only, not fallback metrics, color arguments or all Tag styles.';
   evidence.push({path:'lib/design/tag-metrics.ts',line:34,hash:hash(raw.get('lib/design/tag-metrics.ts'))},...central.filter(e=>e.variable.startsWith('--qd-tag-'+boundary.value+'-')),...copyEvidence);
  }else if(boundary.prop==='font'){
   reason='The exact imported SegmentedChoice.font selector chooses QDScale.family.mono or QDScale.family.serif. Those are live central --qd-font-family-mono and --qd-font-family-ui references. Caller overrides and other component arguments require separate proof.';
   evidence.push({path:'lib/design/q-design-scale.ts',line:14,hash:hash(raw.get('lib/design/q-design-scale.ts'))},...central.filter(e=>e.variable.startsWith('--qd-font-family-')),...copyEvidence);
  }else reason='The exact imported SegmentedChoice retains fill in the compatibility type but does not bind, read or forward it. The pinned current function body always uses choiceLook(on); this old tint selector has no runtime effect. A renderer implementation change requires renewed review.';
  records.push({path:record.path,line:record.line,sourceHash:record.sourceHash,argumentHash:record.argumentHash,value:record.value,...boundary,ruleId:'exact-renderer-enum',reason,evidence,matchedOccurrences:matches.length,consumers:matches.map(n=>n.parent.parent.getText(sf))});
 }
 return {version:1,scope:'Exact imported renderer enum and compatibility boundaries. No numeric fallback or complete renderer style approval.',records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createRendererEnumReview();fs.writeFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-renderer-enum-review.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({records:report.records.length,occurrences:report.records.reduce((n,r)=>n+r.matchedOccurrences,0),counts:report.records.reduce((a,r)=>(a[r.renderer+'.'+r.prop]=(a[r.renderer+'.'+r.prop]??0)+r.matchedOccurrences,a),{})},null,2));
}
