import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { publishCarnetStyleReport } from './carnet-style-report.mjs';

function workspace(t) {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'qd-carnet-report-'));
  t.after(()=>fs.rmSync(dir,{recursive:true,force:true}));
  return path.join(dir,'review.json');
}
test('check recomputes unknown count from records and preserves saved report bytes and mtime',t=>{
  const destination=workspace(t);
  fs.writeFileSync(destination,'previous review\n');
  const before=fs.statSync(destination).mtimeMs;
  const result=publishCarnetStyleReport({unknownCount:0,records:[{decision:'unknown'}]},destination,{check:true});
  assert.deepEqual(result,{unknownCount:1,exitCode:1});
  assert.equal(fs.readFileSync(destination,'utf8'),'previous review\n');
  assert.equal(fs.statSync(destination).mtimeMs,before);
});
test('successful check never creates an absent artifact',t=>{
  const destination=workspace(t);
  assert.deepEqual(publishCarnetStyleReport({unknownCount:99,records:[{decision:'central-source-verified'}]},destination,{check:true}),{unknownCount:0,exitCode:0});
  assert.equal(fs.existsSync(destination),false);
});
test('write mode preserves the explicit report output contract',t=>{
  const destination=workspace(t),report={records:[{decision:'unknown'}],unknownCount:1};
  assert.equal(publishCarnetStyleReport(report,destination).exitCode,0);
  assert.deepEqual(JSON.parse(fs.readFileSync(destination,'utf8')),report);
});
