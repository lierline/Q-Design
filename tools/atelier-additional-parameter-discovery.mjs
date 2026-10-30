// Read-only source proof discovery. This never writes the decision inventory.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {hash,jsxStyleAttributes} from './style-arguments-core.mjs';
import {createParameterLeafReview,verifiedParameterLeaves} from './atelier-parameter-leaves-review.mjs';
import {primitiveFlowType} from './atelier-primitive-leaves.mjs';
import {createAtelierProofContext,compositionNodes} from './atelier-proof-context.mjs';
import {expressionProof,localBindings,sourceImports} from './atelier-style-proof.mjs';
import {collectStyleObjectOrigins} from './atelier-style-origins.mjs';
import {supplementaryNodes} from './atelier-supplementary-flows.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier';
const targets=JSON.parse(fs.readFileSync(root+'/reviews/atelier-additional-parameter-targets.json','utf8'));
// The last three candidates need separate selector/caller coverage first.
const eligible=new Set(targets.slice(0,7).map(t=>t.join('#')));
const fresh=createParameterLeafReview(product,targets),context=createAtelierProofContext({expanded:true});
const currentHash=file=>{
 if(!file||path.isAbsolute(file)||file.split(/[\\/]/).includes('..'))return null;
 const full=product+'/'+file;return fs.existsSync(full)?hash(fs.readFileSync(full,'utf8')):null;
};
const byFile=new Map(),changes=[],blocked=[];
const main=JSON.parse(fs.readFileSync(root+'/reviews/atelier-style-decisions.json','utf8'));
for(const flow of fresh.flows){
 const leaves=eligible.has([flow.path,flow.component,flow.prop].join('#'))&&flow.callers.length?verifiedParameterLeaves(flow,currentHash):null;
 if(!leaves){blocked.push({component:flow.component,prop:flow.prop,unindexed:flow.unindexed.length,spreads:flow.unresolvedSpreads.length,references:flow.unresolvedReferences.length});continue;}
 if(!byFile.has(flow.path))byFile.set(flow.path,[]);byFile.get(flow.path).push({flow,leaves});
}
for(const [file,flows] of byFile){
 const code=fs.readFileSync(product+'/'+file,'utf8'),{ts,references,variables}=context,sf=ts.createSourceFile(file,code,99,true,file.endsWith('x')?4:3);
 assert.equal(sf.parseDiagnostics.length,0);
 const locals=localBindings(ts,sf,hash,references),imports=sourceImports(ts,sf),nodes=supplementaryNodes(ts,sf),bindings=new Map();
 for(const {flow,leaves} of flows){
  const type=primitiveFlowType(ts,sf,flow);if(!type)continue;
  if(flow.defaultValue){
   const declarations=[];const find=n=>{if((ts.isFunctionDeclaration(n)||ts.isFunctionExpression(n))&&n.name?.text===flow.component&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===flow.declarationLine)declarations.push(n);ts.forEachChild(n,find);};find(sf);
   assert.equal(declarations.length,1);
   const binding=declarations[0].parameters.flatMap(p=>ts.isObjectBindingPattern(p.name)?p.name.elements:[]).find(b=>b.getText(sf)===flow.binding);
   const initializer=binding?.initializer;
   const proof=initializer&&expressionProof({ts,node:initializer,sf,property:flow.prop,imports,file,references,variables,locals,reviewedNodes:nodes,extendedAliases:true});
   if(!proof?.central)continue;
  }
  for(const leaf of leaves)bindings.set(`${leaf.start}:${leaf.end}:${leaf.text}`,{...leaf.proof,primitiveType:type});
 }
 const bind=n=>{if(ts.isIdentifier(n)){const proof=bindings.get(`${n.getStart(sf)}:${n.end}:${n.text}`);if(proof)nodes.set(n,proof);}ts.forEachChild(n,bind);};bind(sf);
 const origins=collectStyleObjectOrigins({ts,sf,locals,hash});
 const styleContext=(node,row)=>{
  if(row.kind==='style-expression')return true;
  for(let n=node.parent;n;n=n.parent){if(ts.isJsxAttribute(n))return jsxStyleAttributes.has(n.name.getText(sf));if(ts.isFunctionLike(n)||ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n))break;}
  return origins.has(`${row.line}:${row.property}:${row.value}`);
 };
 for(const row of main.records.filter(r=>r.path===file&&r.decision==='unknown'&&['object-property','style-expression','presentation-attribute'].includes(r.kind))){
  const values=compositionNodes(ts,sf,row);if(!values.length)continue;
  const proofs=values.map(node=>expressionProof({ts,node,sf,property:row.property,imports,file,references,variables,locals,reviewedNodes:nodes,extendedAliases:true,numericParameterUnits:true}));
  if(!proofs.every(p=>p&&p.evidence.some(e=>e.delegatedReview)))continue;
  if(!proofs.every(p=>p.central)&&!values.every(n=>styleContext(n,row)))continue;
  const evidence=[...new Map([{path:file,line:row.line,hash:row.sourceHash},...proofs[0].evidence].map(e=>[JSON.stringify(e),e])).values()];
  changes.push({path:file,line:row.line,property:row.property,argumentHash:row.argumentHash,sourceHash:row.sourceHash,value:row.value,evidence});
 }
}
fs.writeFileSync(root+'/reviews/atelier-additional-parameter-discovery.json',JSON.stringify({scope:'Read-only predicted candidates. No decision is changed; whole arguments, exact lexical bindings, separate central default proofs, all caller indexes and every authored branch are required.',baselineHash:hash(JSON.stringify(main,null,2)+'\n'),blocked,changes},null,2)+'\n');
console.log(JSON.stringify({predicted:changes.length,blocked}));
