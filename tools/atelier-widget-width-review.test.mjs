import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
import {widgetWidthBoundary,createWidgetWidthReview} from './atelier-widget-width-review.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),ts=createRequire(path.resolve(root,'../Q-Atelier/package.json'))('typescript');
function inspect(code){
 const sf=ts.createSourceFile('case.tsx',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),host={...ts.createCompilerHost({}),getSourceFile:file=>file==='case.tsx'?sf:undefined,getCurrentDirectory:()=>'',fileExists:file=>file==='case.tsx',readFile:file=>file==='case.tsx'?code:undefined};
 const program=ts.createProgram(['case.tsx'],{noLib:true,noResolve:true,jsx:ts.JsxEmit.Preserve},host),checker=program.getTypeChecker(),contract=sf.statements.find(n=>ts.isInterfaceDeclaration(n)&&n.name.text==='BoardItem'),width=contract.members[0],found=[];
 const visit=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='width')found.push(widgetWidthBoundary({ts,checker,node:n,sf,boardWidthDeclaration:width,isItemsSink:tag=>tag.getText(sf)==='Board'}));ts.forEachChild(n,visit);};visit(sf);return found;
}
const contract="interface BoardItem {width?:'full'|'half'|'quarter'};";
test('width variants bind to the exact BoardItem property, not an unrelated width with the same text',()=>{
 const [board,data,css]=inspect(contract+"const a:BoardItem={width:'half'};const b={width:'full'};const c=<div style={{width:'full'}}/>;");
 assert.equal(board.exactType,true);assert.equal(data,null);assert.equal(css,null);
});
test('conditional array metadata needs a direct items sink and cannot escape through a nested style property',()=>{
 const [direct,nested]=inspect(contract+"const a=<Board items={[...(ok?[{width:'full' as const}]:[])]}/>;const b=<Board items={[{node:<div style={{width:'full'}}/>}]}/>;");
 assert.equal(direct.directItems,true);assert.equal(nested,null);
});
test('current width metadata, renderer formulas and canonical copy remain exactly source-bound',()=>{
 const actual=createWidgetWidthReview(),saved=JSON.parse(fs.readFileSync(path.join(root,'reviews/atelier-widget-width-review.json'),'utf8'));
 assert.deepEqual(actual,saved,'Changed metadata or renderer source requires review');assert.ok(actual.records.length>0);
 assert.ok(actual.records.every(record=>record.decision==='delegated-renderer-parameter'));
 assert.ok(actual.entries.every(entry=>entry.exactType||entry.directItems));
});
