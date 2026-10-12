import fs from 'node:fs';import path from 'node:path';import {createRequire} from 'node:module';
import {PARTS} from './sync-parts.mjs';import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';
import {hash,runtimeFiles} from './style-arguments-core.mjs';import {collectAdapterReferences} from './atelier-style-proof.mjs';import {adapterImportClosure} from './atelier-import-closure.mjs';

export function createAtelierProofContext({expanded=false}={}){
 const ROOT='D:/Claude/Q-Design',PRODUCT='D:/Claude/Q-Atelier',req=createRequire(PRODUCT+'/package.json'),ts=req('typescript'),postcss=req('postcss');
 const copies=new Map(centralOutputs(PARTS,'Q-Atelier',PRODUCT).map(part=>[part.path,part]));
 const cssFiles=['patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','patterns/components.css','dist/q-design.nav.css','dist/q-design.list.css','dist/q-design.screen.css','patterns/workspace.css','dist/q-design.palette.atelier.css'];
 const variables=new Map(),classes=new Map();
 for(const file of cssFiles){const code=fs.readFileSync(ROOT+'/'+file,'utf8'),sourceHash=hash(code),ast=postcss.parse(code);ast.walkDecls(decl=>{if(decl.prop.startsWith('--')&&!variables.has(decl.prop))variables.set(decl.prop,{path:file,line:decl.source.start.line,hash:sourceHash,variable:decl.prop});});ast.walkRules(rule=>{for(const match of rule.selector.matchAll(/\.([A-Za-z_][\w-]*)/g))if(!classes.has(match[1]))classes.set(match[1],{path:file,line:rule.source.start.line,hash:sourceHash});});}
 const runtimePart=copies.get('lib/design/q-design-runtime.ts'),runtimeVerified=copyProblems(runtimePart,fs.readFileSync(ROOT+'/'+runtimePart.src,'utf8'),fs.readFileSync(PRODUCT+'/'+runtimePart.path,'utf8')).length===0;
 const centralFiles=new Map();for(const part of copies.values())if(part.path.endsWith('.ts')&&fs.existsSync(PRODUCT+'/'+part.path)){const canonical=fs.readFileSync(ROOT+'/'+part.src,'utf8'),actual=fs.readFileSync(PRODUCT+'/'+part.path,'utf8');if(!copyProblems(part,canonical,actual).length)centralFiles.set(part.path,{path:part.src,line:1,hash:hash(canonical)});}
 const seeds=[...new Set(['lib/design/tag-metrics.ts','lib/design/tokens.ts','lib/design/grain.ts','lib/design/hangul-text.tsx','lib/design/segmented-choice.tsx','lib/design/components.tsx','lib/design/q-design-contract.ts','lib/design/q-design-scale.ts','lib/design/main-padding.ts','lib/design/print.ts','lib/design/sticky-inset.ts','lib/export/docx-builder/brand.ts','lib/api/fetch-json.ts','lib/letter-to-file.ts','lib/lot.ts','lib/notifications/kind-display.ts','lib/production/equipment.ts','lib/research/doc-status.ts','lib/research/stage-labels.ts','lib/subscription/plan-policy.ts','lib/vigilance.ts','lib/authorized-rep.ts','app/(app)/m/field-ui.tsx','lib/workflow-states.ts','components/TopHeaderBand.tsx',...fs.readdirSync(PRODUCT+'/lib/labels').filter(file=>file.endsWith('.ts')&&!file.endsWith('.test.ts')).map(file=>'lib/labels/'+file),...centralFiles.keys()])];
 const candidates=expanded?new Map(runtimeFiles(PRODUCT).filter(p=>/\.[jt]sx?$/.test(p)).map(p=>[p,fs.readFileSync(PRODUCT+'/'+p,'utf8')])):null;
 const files=expanded?adapterImportClosure({ts,files:candidates,seeds}):seeds;
 const references=collectAdapterReferences({ts,variables,hash,centralFiles,numericFiles:new Set(runtimeVerified?[runtimePart.path]:[]),files:new Map(files.map(file=>[file,candidates?.get(file)??fs.readFileSync(PRODUCT+'/'+file,'utf8')]))});
 return {ts,postcss,copies,variables,classes,runtimePart,runtimeVerified,centralFiles,references,adapterFiles:files};
}

export function compositionNodes(ts,sf,record){
 const nodes=[];const visit=n=>{const line=sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1;
  if(record.kind==='object-property'&&ts.isPropertyAssignment(n)&&line===record.line&&n.name.getText(sf).replace(/^['"]|['"]$/g,'')===record.property&&n.initializer.getText(sf)===record.value)nodes.push(n.initializer);
  if(['style-expression','presentation-attribute'].includes(record.kind)&&ts.isJsxAttribute(n)&&line===record.line&&n.name.getText(sf)===record.property&&n.initializer&&ts.isJsxExpression(n.initializer)&&n.initializer.getText(sf)===record.value&&n.initializer.expression)nodes.push(n.initializer.expression);
  ts.forEachChild(n,visit);
 };visit(sf);return nodes;
}
