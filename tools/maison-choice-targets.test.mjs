import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const product=resolve(root,'../Q-Works');
const require=createRequire(join(product,'package.json'));
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),{JSDOM}=require('jsdom'),postcss=require('postcss');
const files=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(dir,entry.name)):entry.name.endsWith('.tsx')?[join(dir,entry.name)]:[]);
function radios(path){
  const source=readFileSync(path,'utf8'),ast=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),found=[];
  function visit(node){
    if(ts.isJsxSelfClosingElement(node)&&node.tagName.getText(ast)==='input'&&node.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.text==='type'&&a.initializer?.text==='radio'))found.push({node,ast});
    ts.forEachChild(node,visit);
  }visit(ast);return found;
}
function compile(path,imports){
  const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',js)(name=>name in imports?imports[name]:require(name),module,module.exports);
  return module.exports;
}
const simple=({children,...props})=>React.createElement('div',null,children);
const constants=compile(join(product,'lib/capa/sheets.ts'),{});
const choices=compile(join(product,'components/shared/choice-boxes.tsx'),{
 '@/lib/utils/cn':compile(join(product,'lib/utils/cn.ts'),{}),
 '@/lib/ui/choice-grid':compile(join(product,'lib/ui/choice-grid.ts'),{}),
 '@/lib/ui/choice':compile(join(product,'lib/ui/choice.ts'),{}),
});
const checks=compile(join(product,'components/shared/check-chip.tsx'),{
 '@/lib/utils/cn':compile(join(product,'lib/utils/cn.ts'),{}),
 '@/lib/ui/choice':compile(join(product,'lib/ui/choice.ts'),{}),
 '@/components/ui/checkbox':compile(join(product,'components/ui/checkbox.tsx'),{
  '@/lib/utils/cn':compile(join(product,'lib/utils/cn.ts'),{}),
  // Decorative paths have their own icon contract. Keep the actual native input.
  '@/components/q-design-icons/Check':{Check:props=>React.createElement('svg',props)},
  '@/components/q-design-icons/Minus':{Minus:props=>React.createElement('svg',props)},
 }),
});
const CapaHeaderFields=compile(join(product,'app/(app)/capa/sheet-header-fields.tsx'),{
  '@/components/ui/checkbox':{Checkbox:simple},'@/components/ui/field':{Field:simple},'@/components/ui/input':{Input:simple},
  '@/components/ui/select':{Select:simple},'@/components/ui/date-picker':{DatePicker:simple},
  '@/lib/capa/sheets':constants,'./source-doc-picker':{CapaSourceDocPicker:simple},
  '@/components/shared/choice-boxes':choices,
  '@/components/shared/check-chip':checks,
}).CapaHeaderFields;
const value={source:constants.CAPA_SOURCES[0].code,source_other:'',source_ref_id:null,department_id:'',admin_department_id:'',written_on:'2026-10-10',subject:'',identification:''};
function render(disabled=false){return new JSDOM(renderToStaticMarkup(React.createElement(CapaHeaderFields,{value,onChange(){},departments:[],disabled}))).window.document;}

test('every Maison native radio has canonical glyph and a full clickable label, including table choices',()=>{
  let count=0;const sources=new Set();
  for(const path of [...files(join(product,'app')),...files(join(product,'components'))])for(const {node,ast}of radios(path)){
    count++;sources.add(path);
    const inputClass=node.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.text==='className')?.initializer?.getText(ast)??'';
    assert.ok(inputClass.includes('qd-radio'),path+' radio lacks shared appearance');
    let parent=node.parent;while(parent&&!ts.isJsxElement(parent))parent=parent.parent;
    assert.equal(parent?.openingElement.tagName.getText(ast),'label',path+' radio lacks label hit area');
    const labelClass=parent.openingElement.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.text==='className')?.initializer?.getText(ast)??'';
    assert.ok(labelClass.includes('qd-choice-hit'),path+' radio label lacks shared target');
  }
  assert.ok(count>0,'Expected to inspect actual native radios');
  assert(sources.has(join(product,'components/shared/choice-boxes.tsx')),'The shared radio factory must be included in the complete source scan');
});
test('real CAPA header renders labelled native radio choices and a single selected option',()=>{
  const inputs=[...render().querySelectorAll('input[type="radio"]')];
  assert.equal(inputs.length,constants.CAPA_SOURCES.length);
  assert.equal(inputs.filter(input=>input.checked).length,1);
  for(const input of inputs){assert.equal(input.name,'capa-source');assert.ok(input.closest('label.qd-choice-hit')?.textContent.trim());}
});
test('read-only CAPA keeps native disabled semantics for all choices',()=>{
  const inputs=[...render(true).querySelectorAll('input[type="radio"]')];
  assert.ok(inputs.length>0);
  assert.ok(inputs.every(input=>input.disabled));
});
test('choice target and glyph dimensions remain separate shared tokens with theme-aware native chrome',()=>{
  const css=postcss.parse(readFileSync(join(root,'patterns/components.css'),'utf8'));
  const rules=new Map();css.walkRules(rule=>rules.set(rule.selector,Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]))));
  assert.equal(rules.get('.qd-radio').width,'var(--qd-choice-glyph-size)');
  assert.equal(rules.get('.qd-radio').height,'var(--qd-choice-glyph-size)');
  assert.equal(rules.get('.qd-choice-hit')['min-height'],'var(--qd-control-height)');
  assert.equal(rules.get('.qd-choice-hit')['min-width'],'var(--qd-control-height)');
  assert.equal(rules.get('.qd-radio')['accent-color'],'var(--qd-accent)');
  assert.ok(rules.has('.qd-radio:focus-visible'));
  const foundation=postcss.parse(readFileSync(join(root,'patterns/foundation/maison.css'),'utf8'));
  const schemes=[];foundation.walkDecls('color-scheme',decl=>schemes.push([decl.parent.selector,decl.value]));
  assert.ok(schemes.some(([selector,value])=>selector===':root'&&value==='light'));
  assert.ok(schemes.some(([selector,value])=>selector===':root.dark'&&value==='dark'));
});
