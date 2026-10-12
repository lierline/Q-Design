// The circle and dash geometry derive from independent size/stroke/pct inputs.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Atelier',req=createRequire(repo+'/package.json');
export const ts=req('typescript'),ringPath='lib/design/components.tsx';
const postcss=req('postcss'),read=p=>fs.readFileSync(p,'utf8');
const functionHash='eed76db0253b069ca0e0fbb5c013dfbf5b6630bb7442c5ff99e1b137e7cb61ec';
const properties=cssProperties(ts,read(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts')));
export function inspectRingGeometry(code){
 const sf=ts.createSourceFile(ringPath,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.deepEqual(sf.parseDiagnostics,[]);
 const functions=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ProgressRing');assert.equal(functions.length,1);const fn=functions[0];
 assert.equal(hash(ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf)),functionHash,'ProgressRing arithmetic, defaults or consumer changed');
 // Resolve the actual Math references, including destructured module shadows.
 const program=ts.createProgram([repo+'/'+ringPath],{noLib:true,noResolve:true,noEmit:true,types:[],jsx:ts.JsxEmit.Preserve},{...ts.createCompilerHost({}),getSourceFile:(name,version)=>name.replaceAll('\\','/').endsWith('/'+ringPath)?ts.createSourceFile(name,code,version,true,ts.ScriptKind.TSX):undefined});
 const bound=program.getSourceFile(repo+'/'+ringPath),checker=program.getTypeChecker(),boundFn=bound.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='ProgressRing');
 const check=n=>{if(ts.isIdentifier(n)&&n.text==='Math')assert(!checker.getSymbolAtLocation(n),'Math resolved to authored code');ts.forEachChild(n,check);};check(boundFn);
 const attributes=[];const visit=n=>{
  if(ts.isJsxAttribute(n)&&n.initializer&&n.parent.parent.tagName.getText(sf)==='circle'&&['cx','cy','r','fill','strokeDasharray'].includes(n.name.getText(sf)))attributes.push({line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,property:n.name.getText(sf),value:n.initializer.getText(sf)});
  ts.forEachChild(n,visit);
 };visit(fn);assert.equal(attributes.length,9);return {sf,fn,attributes};
}
export function createRingGeometryReview(){
 const code=read(repo+'/'+ringPath),sourceHash=hash(code),{sf,fn,attributes}=inspectRingGeometry(code),args=scanArguments(ringPath,code,{ts,postcss,properties});
 const flows=JSON.parse(read(root+'/reviews/atelier-dimension-flow-review.json')).flows.filter(f=>f.path===ringPath&&f.component==='ProgressRing');
 assert.deepEqual(flows.map(f=>f.prop).sort(),['size','stroke']);assert(flows.every(f=>f.sourceHash===sourceHash));
 const callers=flows.flatMap(f=>f.callers.map(c=>({path:c.path,line:c.attributeLine??c.line,hash:c.sourceHash})));
 for(const e of callers)assert.equal(hash(read(repo+'/'+e.path)),e.hash,'Stale ring caller');
 const evidence=[...new Map([{path:ringPath,line:sf.getLineAndCharacterOfPosition(fn.getStart(sf)).line+1,hash:sourceHash},{path:'reviews/atelier-dimension-flow-review.json',line:1,hash:hash(read(root+'/reviews/atelier-dimension-flow-review.json'))},...callers].map(e=>[JSON.stringify(e),e])).values()];
 // Evidence paths are resolved by the main reviewer. Keep the reviewed flow
 // catalog in the report, and use source/caller evidence for consumer decisions.
 const consumerEvidence=evidence.filter(e=>!e.path.startsWith('reviews/'));
 const records=attributes.map(a=>{const matches=args.filter(r=>r.line===a.line&&r.property===a.property&&r.value===a.value);assert.equal(matches.length,1);const argument=matches[0];return {path:ringPath,line:a.line,sourceHash,argumentHash:hash(JSON.stringify(argument)),kind:argument.kind,property:a.property,value:a.value,decision:a.property==='fill'?'structural-behavior':'coordinate-boundary',ruleId:'exact-progress-ring-arithmetic',reason:a.property==='fill'?'The inspected stroked circle disables its fill with none. Track and progress stroke colors are separately inventoried.':'This exact SVG coordinate or dash is derived from the inspected size and stroke parameters and clamped pct. cx=cy=size/2, r=(size-stroke)/2, circumference=2πr and dash=pct/100×circumference. Current size/stroke callers and defaults remain independent obligations; this is not central ownership of their values.',evidence:consumerEvidence};});
 return {version:1,scope:'Only nine native circle attributes in the exact ProgressRing renderer. No approval of caller sizes, stroke widths, colors, caption styles or other SVG geometry.',functionHash,evidence,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){const report=createRingGeometryReview(),target=root+'/reviews/atelier-ring-geometry-review.json';if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(read(target)),report,'Stale ring geometry review');console.log(JSON.stringify({records:report.records.length}));}
