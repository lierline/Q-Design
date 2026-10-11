import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {readOutputValues,resolveAtelierOutputCss} from './atelier-output-values.mjs';
import {buildFoundation} from './build-foundation.mjs';
import {reverseFinalVisualRules} from './atelier-migration-inverse.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'),QA=path.resolve(ROOT,'../Q-Atelier');
const ts=createRequire(QA+'/package.json')('typescript');
const ledger=JSON.parse(fs.readFileSync(ROOT+'/reviews/atelier-final-output-layout-migration.json','utf8'));
const read=file=>fs.readFileSync(QA+'/'+file,'utf8');
function evaluate(source,stubs={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:name=>{assert.ok(Object.hasOwn(stubs,name),name);return stubs[name];},...stubs.globals});return module.exports;}
const canonicalOutput=readOutputValues(ROOT);
const canonicalRuntime=evaluate(fs.readFileSync(ROOT+'/source/design/atelier-runtime.ts','utf8'));
test('all eight source edits preserve non-presentation source and distributed canonical defaults',()=>{
  assert.equal(ledger.records.length,8);
  for(const record of ledger.records){let code=reverseFinalVisualRules(record.path,read(record.path));assert.equal(hash(code),record.afterHash,record.path);for(const edit of [...record.edits].reverse()){assert.equal(code.slice(edit.start,edit.start+edit.after.length),edit.after,record.path);code=code.slice(0,edit.start)+edit.before+code.slice(edit.start+edit.after.length);}assert.equal(hash(code),record.beforeHash,record.path);}
  for(const[name,value]of Object.entries(ledger.outputDefinitions))assert.deepEqual(canonicalOutput[name],value);
  for(const[name,value]of Object.entries(ledger.runtimeDefinitions))assert.equal(JSON.stringify(canonicalRuntime.QDPresentation[name]),JSON.stringify(value));
  assert.equal(JSON.stringify(evaluate(read('lib/design/q-design-output.ts')).QDOutput),JSON.stringify(canonicalOutput));
  assert.equal(JSON.stringify(evaluate(read('lib/design/q-design-runtime.ts'))),JSON.stringify(canonicalRuntime));
});
test('actual JPEG canvas receives central background while crop, size, encoder and cleanup are unchanged',async()=>{
  const sf=ts.createSourceFile('AvatarUploader.tsx',read('components/AvatarUploader.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const fn=sf.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name.text==='toSquareJpeg');assert.ok(fn);
  const output=structuredClone(canonicalOutput);output.avatarJpeg.background='#123456';
  const calls=[],ctx={fillRect(...v){calls.push(['fill',this.fillStyle,...v]);},drawImage(...v){calls.push(['draw',...v.slice(1)]);}};
  const canvas={getContext:()=>ctx,toBlob(callback,...args){calls.push(['encode',...args]);callback({fixture:true});}};
  const globals={QDOutput:output,AVATAR_SIZE_PX:256,URL:{createObjectURL:()=>'/fixture',revokeObjectURL:url=>calls.push(['revoke',url])},Image:class{naturalWidth=600;naturalHeight=400;set src(value){this.onload();}},document:{createElement:tag=>{assert.equal(tag,'canvas');return canvas;}}};
  const actual=evaluate('export '+fn.getText(sf),{globals});assert.equal((await actual.toSquareJpeg({})).fixture,true);
  assert.deepEqual(calls,[['fill','#123456',0,0,256,256],['draw',100,0,400,400,0,0,256,256],['encode','image/jpeg',0.85],['revoke','/fixture']]);
  assert.equal(canvas.width,256);assert.equal(canvas.height,256);
});
test('main padding numeric fallback follows central configuration without converting geometry to CSS strings',()=>{
  const runtime={...canonicalRuntime,QDPresentation:structuredClone(canonicalRuntime.QDPresentation)};runtime.QDPresentation.mainPadding={top:36,right:44,bottom:28,left:40};
  const actual=evaluate(read('lib/design/main-padding.ts'),{'./q-design-runtime':runtime});
  assert.deepEqual(actual.MAIN_PADDING,runtime.QDPresentation.mainPadding);
  assert.equal(typeof actual.MAIN_PADDING.top,'number');
});
test('actual foundation build and print-fit calculation share mutable physical dimensions',()=>{
  const fixture=fs.mkdtempSync(path.resolve(ROOT,'../tmp/atelier-output-css-'));
  try{
    for(const file of ['patterns/foundation.css','patterns/components.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','source/design/atelier-runtime.ts']){fs.mkdirSync(path.dirname(fixture+'/'+file),{recursive:true});fs.copyFileSync(ROOT+'/'+file,fixture+'/'+file);}
    const output=structuredClone(canonicalOutput);Object.assign(output.print,{paperWidthMm:220,paperHeightMm:300,mainPadXpx:4,mainPadYpx:28});output.print.marginMm={top:20,right:17,bottom:24,left:19};
    fs.writeFileSync(fixture+'/source/design/atelier-output.ts','export const QDOutput = '+JSON.stringify(output)+' as const;');
    buildFoundation(fixture,{only:['atelier']});
    const css=fs.readFileSync(fixture+'/dist/q-design.foundation.atelier.css','utf8');
    assert.match(css,/@page\s*\{\s*margin: 20mm 17mm 24mm 19mm;\s*size: 220mm 300mm;/);
    assert.match(css,/padding: 28px 4px !important/);assert.match(css,/left: 19mm;\s*right: 17mm;/);
    assert.doesNotMatch(css,/qd-output\(/);
    const actual=evaluate(read('lib/design/print.ts'),{'./q-design-output':{QDOutput:output}});
    const width=Math.floor(((220-17-19)/25.4)*96)-8;assert.equal(actual.PRINT_CONTENT_W,width);
    assert.ok(actual.printZoom(900)*900<=width);assert.equal(actual.printZoom(width),1);
  }finally{const resolved=path.resolve(fixture),parent=path.resolve(ROOT,'../tmp');assert.equal(path.dirname(resolved),parent);assert.ok(path.basename(resolved).startsWith('atelier-output-css-'));fs.rmSync(resolved,{recursive:true,force:true});}
});
test('physical output marker rejects unknown or nonnumeric inputs',()=>{
  assert.throws(()=>resolveAtelierOutputCss('x:qd-output(print.missing,mm)',canonicalOutput),/Unknown/);
  assert.throws(()=>resolveAtelierOutputCss('x:qd-output(avatarJpeg.background,px)',canonicalOutput),/Unsupported/);
  assert.throws(()=>resolveAtelierOutputCss('x:qd-output(print.marginMm,mm)',canonicalOutput),/Unknown/);
});
