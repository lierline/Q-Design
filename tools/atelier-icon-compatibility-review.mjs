// A numeric stroke option is a no-op only on a directly resolved, unchanged
// central Phosphor component. Dynamic icon slots and real SVG strokes remain open.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {hash,runtimeFiles} from './style-arguments-core.mjs';

const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier';
export const ts=createRequire(repo+'/package.json')('typescript');
const factoryBody='c8e9a2eb42836329d43fe9f0eafa344b0a0ab787874dac940f92d6f747d105c4';
const ruleId='exact-ignored-phosphor-stroke-option';
const boundaryPath='reviews/atelier-final-presentation-boundaries.json';
const boundaryRef='c424302';
const baselineBoundaries=()=>JSON.parse(execFileSync('git',['show',boundaryRef+':'+boundaryPath],{cwd:root,encoding:'utf8'}));
const key=row=>JSON.stringify([row.path,row.line,row.argumentHash]);
export function applyIconBoundaryReplacements(report){
 const baseline=baselineBoundaries(),replacement=new Map(report.replacements.map(r=>[key(r),r]));
 return {...baseline,records:baseline.records.map(r=>replacement.get(key(r))??r),supersededRecords:report.supersededRecords};
}
export function verifyIgnoredIconFactory(code){
 const sf=ts.createSourceFile('factory.tsx',code,99,true,ts.ScriptKind.TSX);
 assert.equal(hash(ts.createPrinter({removeComments:true}).printFile(sf)),factoryBody,'Icon factory semantics changed');
}
export function ignoredStrokeAttribute(node,sf,resolveCentralIcon){
 if(!ts.isJsxAttribute(node)||node.name.getText(sf)!=='strokeWidth')return null;
 const expr=node.initializer;
 if(!expr||!ts.isJsxExpression(expr)||!expr.expression||!ts.isNumericLiteral(expr.expression))return null;
 const element=node.parent.parent;
 if(!(ts.isJsxOpeningElement(element)||ts.isJsxSelfClosingElement(element))||element.attributes.properties.some(ts.isJsxSpreadAttribute))return null;
 if(ts.isIdentifier(element.tagName)&&/^[a-z]/.test(element.tagName.text))return null;
 return resolveCentralIcon(element.tagName);
}
export function createIconCompatibilityReview(){
 const canonical='patterns/react-icon.tsx',factory='components/q-design-icons/_icon.tsx';
 const canonicalCode=fs.readFileSync(root+'/'+canonical,'utf8'),factoryCode=fs.readFileSync(repo+'/'+factory,'utf8');
 verifyIgnoredIconFactory(canonicalCode);
 assert.equal(hash(factoryCode),hash(canonicalCode),'Actual icon factory differs from canonical');
 assert.equal(hash(fs.readFileSync(root+'/dist/react-icons/_icon.tsx','utf8')),hash(canonicalCode),'Generated icon factory differs');
 const files=runtimeFiles(repo).filter(f=>/\.[jt]sx?$/.test(f));
 const options={noLib:true,noEmit:true,types:[],skipLibCheck:true,allowJs:true,jsx:ts.JsxEmit.Preserve,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,baseUrl:repo,paths:{'@/*':['./*']}};
 const program=ts.createProgram(files.map(f=>path.join(repo,f)),options),checker=program.getTypeChecker();
 const resolve=n=>{let s=checker.getSymbolAtLocation(n);while(s?.flags&ts.SymbolFlags.Alias)s=checker.getAliasedSymbol(s);return s;};
 const factorySf=program.getSourceFile(path.join(repo,factory));
 const factoryFn=factorySf.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text==='createIcon');
 assert(factoryFn);const factorySymbol=resolve(factoryFn.name);
 const review=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8'));
 const candidates=review.records.filter(r=>(r.decision==='unknown'||r.ruleId===ruleId)&&r.kind==='presentation-attribute'&&r.property==='strokeWidth');
 const records=[],unresolved=[];
 for(const row of candidates){
  const source=fs.readFileSync(repo+'/'+row.path,'utf8'),sf=program.getSourceFile(path.join(repo,row.path));
  assert.equal(row.sourceHash,hash(source),'Stale stroke candidate');
  let attribute;
  const visit=n=>{if(ts.isJsxAttribute(n)&&n.name.getText(sf)==='strokeWidth'&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===row.line&&n.initializer?.getText(sf)===row.value)attribute=n;ts.forEachChild(n,visit);};visit(sf);
  const icon=attribute&&ignoredStrokeAttribute(attribute,sf,tag=>{
   const declarations=resolve(tag)?.declarations??[];
   if(declarations.length!==1||!ts.isVariableDeclaration(declarations[0]))return null;
   const declaration=declarations[0],init=declaration.initializer;
   if(!init||!ts.isCallExpression(init)||resolve(init.expression)!==factorySymbol)return null;
   const file=path.relative(repo,declaration.getSourceFile().fileName).replaceAll('\\','/');
   if(!/^components\/q-design-icons\/[\w-]+\.tsx$/.test(file))return null;
   const generated='dist/react-icons/'+path.basename(file);
   if(!fs.existsSync(root+'/'+generated))return null;
   const actual=fs.readFileSync(repo+'/'+file,'utf8'),central=fs.readFileSync(root+'/'+generated,'utf8');
   if(hash(actual)!==hash(central))return null;
   return {file,generated,hash:hash(actual),name:tag.getText(sf)};
  });
  if(!icon){unresolved.push({path:row.path,line:row.line,value:row.value,reason:'Not a direct, unchanged central icon with a literal numeric stroke option. No exemption granted.'});continue;}
  records.push({path:row.path,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,decision:'compatibility-noop',ruleId,reason:'The actual JSX tag resolves to the unchanged central Phosphor component. The reviewed factory destructures and discards strokeWidth before forwarding SVG props and sets stroke to none. This exact numeric option cannot change the filled icon outline. Size, color, style, SVG paths and other consumer arguments remain separately inventoried.',icon:icon.name,evidence:[{path:row.path,line:row.line,hash:row.sourceHash},{path:canonical,line:1,hash:hash(canonicalCode)},{path:factory,line:1,hash:hash(factoryCode)},{path:icon.file,line:1,hash:icon.hash},{path:icon.generated,line:1,hash:icon.hash}]});
 }
 const baseline=baselineBoundaries(),priorKeys=new Set(baseline.records.map(key));
 const replacements=records.filter(r=>priorKeys.has(key(r)));
 const supersededRecords=baseline.records.filter(r=>replacements.some(next=>key(next)===key(r)));
 return {version:1,boundaryRef,scope:'Exact directly resolved central icon stroke compatibility. Three stale earlier reviews are superseded by fresh resolution, preserving their original evidence in the boundary archive. No approval for dynamic slots, spreads, real SVG strokes or other appearance arguments.',records:records.filter(r=>!priorKeys.has(key(r))),replacements,supersededRecords,unresolved};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createIconCompatibilityReview(),target=root+'/reviews/atelier-icon-compatibility-review.json';
 const boundaries=applyIconBoundaryReplacements(report);
 if(process.argv.includes('--write')){
  fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
  fs.writeFileSync(root+'/'+boundaryPath,JSON.stringify(boundaries,null,2)+'\n');
 }else{
  assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),report,'Stale icon compatibility graph');
  assert.deepEqual(JSON.parse(fs.readFileSync(root+'/'+boundaryPath,'utf8')),boundaries,'Only exact reviewed boundary replacements are allowed');
 }
 console.log(JSON.stringify({approved:report.records.length+report.replacements.length,reproved:report.replacements.length,unresolved:report.unresolved.length}));
}
