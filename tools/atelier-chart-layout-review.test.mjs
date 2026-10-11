import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {chartSeriesPalette,createChartLayoutReview} from './atelier-chart-layout-review.mjs';
import {hash} from './style-arguments-core.mjs';
import {verifiedConsumerReview} from './atelier-style-manual.mjs';
const root=path.resolve(import.meta.dirname,'..'),product=path.resolve(root,'../Q-Atelier');
const ts=createRequire(path.join(product,'package.json'))('typescript');
function palette(code){
 const file='fixture.tsx',options={noLib:true,jsx:ts.JsxEmit.ReactJSX},sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),host=ts.createCompilerHost(options);
 host.getSourceFile=name=>name===file?sf:undefined;host.fileExists=name=>name===file;host.readFile=name=>name===file?code:undefined;
 const program=ts.createProgram([file],options,host);return chartSeriesPalette(ts,sf,program.getTypeChecker());
}
const fixture="import {T} from '@/lib/design/tokens'; function View(){ return <TimeSeriesChart series={[{color:T.blue,data:[1]},{color:T.green,data:[2]}]}/>; }";

test('palette proof follows the exact imported symbol and rejects shadowed, raw and spread colors',()=>{
 assert.deepEqual(palette(fixture).colors,['T.blue','T.green']);
 assert.throws(()=>palette(fixture.replace('function View(){','function View({T}){')),/exact imported palette/);
 assert.throws(()=>palette(fixture.replace('function View(){','function View(props){ const {T}=props;')),/exact imported palette/);
 assert.throws(()=>palette(fixture.replace('color:T.blue',"color:'#fff'")),/exact imported palette/);
 assert.throws(()=>palette(fixture.replace('color:T.blue','...other,color:T.blue')),/Unknown chart color composition/);
 assert.throws(()=>palette(fixture.replace("@/lib/design/tokens","@/fake-palette")),/Palette binding changed/);
});

test('current exact chart evidence covers all reviewed arguments and fails on changed source or central rule',()=>{
 const report=createChartLayoutReview();assert.equal(report.records.length,35);assert.equal(report.palette.length,2);
 const current=p=>hash(fs.readFileSync(path.join(/^(source|patterns|dist)\//.test(p)?root:product,p),'utf8'));
 const record=report.records.find(r=>r.property==='gridTemplateColumns'),actual={path:record.path,line:record.line,sourceHash:record.sourceHash,argumentHash:record.argumentHash};
 assert(verifiedConsumerReview(actual,record,current));
 assert.equal(verifiedConsumerReview({...actual,argumentHash:hash('other expression')},record,current),null);
 assert.equal(verifiedConsumerReview(actual,record,p=>p==='source/design/chart-layout.ts'?hash('changed spacing'):current(p)),null);
 assert.equal(verifiedConsumerReview(actual,record,p=>p===record.path?hash('changed source'):current(p)),null);
});
