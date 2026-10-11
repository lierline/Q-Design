import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { hash } from './style-arguments-core.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'),QA=path.resolve(ROOT,'../Q-Atelier');
const ts=createRequire(QA+'/package.json')('typescript');
const manifest=JSON.parse(fs.readFileSync(ROOT+'/reviews/atelier-watermark-migration.json','utf8'));
const record=manifest.records[0],source=fs.readFileSync(QA+'/'+record.path,'utf8');
function evaluate(code,output){
  const module={exports:{}};
  vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>{assert.equal(name,'@/lib/design/q-design-output');return {QDOutput:output};},encodeURIComponent});
  return module.exports;
}
const canonical=evaluate(fs.readFileSync(ROOT+'/source/design/atelier-output.ts','utf8')).QDOutput;
function original(){
  assert.equal(hash(source),record.afterHash);
  let code=source;
  for(const edit of [...record.edits].reverse()){
    assert.equal(code.slice(edit.start,edit.start+edit.after.length),edit.after);
    code=code.slice(0,edit.start)+edit.before+code.slice(edit.start+edit.after.length);
  }
  assert.equal(hash(code),record.beforeHash);return code;
}
const person={name:'Fixture <person> & "quotes"',email:'name@example.test',org:'Org <value>',issuedAt:'2026-10-10 10:30 (KST)'};
const tileSvg=html=>decodeURIComponent(html.match(/data:image\/svg\+xml,([^&]+)&quot;/)[1]);
test('manual watermark centralization retains exact original HTML and encoded SVG',()=>{
  const old=evaluate(original()),current=evaluate(source,canonical);
  for(const who of [person,{...person,org:''},{...person,email:'<script>" & \'',name:'</b><img src=x onerror=1>'}])assert.equal(current.buildWatermark(who),old.buildWatermark(who));
  const copy=evaluate(fs.readFileSync(QA+'/lib/design/q-design-output.ts','utf8')).QDOutput;
  assert.equal(JSON.stringify(copy),JSON.stringify(canonical));
  assert.equal(JSON.stringify(canonical.manualWatermark),JSON.stringify(manifest.definitions));
});
test('all central watermark dimensions, typography and color reach the real SVG',()=>{
  const changed=structuredClone(canonical);
  Object.assign(changed.manualWatermark,{width:500,height:260,textX:12,textY:160,rotationDegrees:-20,fontFamily:'serif',fontSize:17,fill:'#123456'});
  const svg=tileSvg(evaluate(source,changed).buildWatermark(person));
  assert.match(svg,/<svg[^>]+width="500" height="260"/);
  assert.match(svg,/<text x="12" y="160" transform="rotate\(-20 12 160\)" font-family="serif" font-size="17" fill="#123456">/);
  assert.match(svg,/name@example.test/);
});
test('user text and centrally edited string attributes remain XML escaped',()=>{
  const changed=structuredClone(canonical);changed.manualWatermark.fontFamily='x" onload="bad';changed.manualWatermark.fill='"><script>';
  const html=evaluate(source,changed).buildWatermark({...person,email:'"><script>alert(1)</script>&'});
  const svg=tileSvg(html);
  assert.doesNotMatch(svg,/<script>| onload="bad/);
  assert.match(svg,/x&quot; onload=&quot;bad/);
  assert.match(svg,/&lt;script&gt;alert\(1\)&lt;\/script&gt;&amp;/);
  assert.doesNotMatch(html,/<img|<script>/);
});
