import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
import {PARTS} from './sync-parts.mjs';
import {copyProblems} from './audit-coverage-core.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Atelier',ts=createRequire(product+'/package.json')('typescript');
const source=fs.readFileSync(root+'/patterns/foundation/atelier-manual.ts','utf8'),base=fs.readFileSync(product+'/docs/manual/download-base.html','utf8');
const load=code=>{const module={exports:{}};vm.runInNewContext(ts.transpileModule(code,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports});return module.exports;};

test('canonical manual CSS preserves the existing default output byte-for-byte and is distributed exactly',()=>{
 const part=PARTS.find(p=>p.name==='아뜰리에 설명서 출력 규칙'),copy=fs.readFileSync(product+'/lib/manual/q-design-styles.ts','utf8');
 assert.deepEqual(copyProblems({...part,path:'lib/manual/q-design-styles.ts'},source,copy),[]);
 const api=load(source),record=JSON.parse(fs.readFileSync(root+'/reviews/atelier-manual-style-migration.json','utf8'));
 assert.equal(hash(base),record.baselineHtmlHash);assert.equal(hash(api.MANUAL_CSS),record.baselineCssHash);
 assert.equal(api.applyManualStyles(base),base);assert.equal(api.applyManualStyles(base).match(/<!--WATERMARK-->/g).length,1);
 assert.throws(()=>api.applyManualStyles('<html></html>'),/Expected one/);
 assert.throws(()=>api.applyManualStyles('<style>a</style><style>b</style>'),/Expected one/);
});

test('central manual recipe mutations reach actual output without changing content, screenshots or download authorization',()=>{
 const changed=source.replace('z-index: 50','z-index: 51'),html=load(changed).applyManualStyles(base);
 assert.ok(html.includes('z-index: 51'));assert.notEqual(html,base);
 const body=s=>s.replace(/<style>[\s\S]*?<\/style>/,'<style/>');assert.equal(body(html),body(base));
 const route=fs.readFileSync(product+'/app/api/manual/download/route.ts','utf8');
 assert.ok(route.includes('applyManualStyles(base).replace(PLACEHOLDER, buildWatermark(who))'));
 const record=JSON.parse(fs.readFileSync(root+'/reviews/atelier-manual-style-migration.json','utf8')).edits.find(e=>e.path.endsWith('route.ts'));
 assert.equal(hash(route),record.afterHash);
 const reversed=route.replace(/import \{ applyManualStyles \} from '@\/lib\/manual\/q-design-styles';\r?\n/,'').replace('applyManualStyles(base).replace(PLACEHOLDER, buildWatermark(who))','base.replace(PLACEHOLDER, buildWatermark(who))');
 assert.equal(hash(reversed),record.beforeHash);
});

test('the actual Python download builder reads the same distributed CSS without regenerating content or images',()=>{
 const script='import runpy,sys; m=runpy.run_path(sys.argv[1]); sys.stdout.buffer.write(m["manual_styles"]().encode("utf-8"))';
 const actual=execFileSync('python',['-c',script,product+'/docs/manual/build-v2.py'],{encoding:'utf8',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
 assert.equal(actual,load(source).MANUAL_CSS);
 const builder=fs.readFileSync(product+'/docs/manual/build-v2.py','utf8');
 assert.ok(builder.includes('lambda _: "<style>" + manual_styles() + "</style>"'));
 assert.ok(builder.includes('if args.download:'));
});
