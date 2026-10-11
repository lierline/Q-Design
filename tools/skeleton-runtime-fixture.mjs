import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {readRuntimeValues} from './atelier-runtime-values.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),product=path.resolve(root,'../Q-Atelier');
// Real renderer declarations are extracted verbatim. No domain initializers,
// credentials, server calls or unrelated renderer stubs are executed.
export function skeletonRenderers(mutate=()=>{}){
 const req=createRequire(product+'/package.json'),ts=req('typescript'),React=req('react'),{renderToStaticMarkup}=req('react-dom/server');
 const read=file=>fs.readFileSync(product+'/'+file,'utf8');
 const load=(code,deps={})=>{const exports={};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:name=>Object.hasOwn(deps,name)?deps[name]:req(name)});return exports;};
 const runtime=readRuntimeValues(root);mutate(runtime);
 const tokens=load(read('lib/design/tokens.ts')),grain=load(read('lib/design/grain.ts'),{'./tokens':tokens,'./q-design-runtime':runtime}),contract=load(read('lib/design/q-design-contract.ts'),{'./tokens':tokens,'./grain':grain}),scale=load(read('lib/design/q-design-scale.ts'),{'./tokens':tokens});
 const deps={'@/lib/design/q-design-runtime':runtime,'@/lib/design/tokens':tokens,'@/lib/design/q-design-contract':contract,'@/lib/design/q-design-scale':scale};
 const source=read('lib/design/components.tsx'),sf=ts.createSourceFile('components.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const functions=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&['Skeleton','SkeletonPanel'].includes(n.name?.text));assert.equal(functions.length,2);
 const core=load("import {QDPresentation} from '@/lib/design/q-design-runtime';import {QDScale} from '@/lib/design/q-design-scale';import {QD} from '@/lib/design/q-design-contract';import {T} from '@/lib/design/tokens';\n"+functions.map(n=>n.getText(sf)).join('\n'),deps);
 const standalone=load(read('components/Skeleton.tsx'),deps).Skeleton;
 return {runtime,core,standalone,render:(component,props={})=>renderToStaticMarkup(React.createElement(component,props))};
}
