import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
// --check also fails on the 417 unknowns it was built to surface, so it cannot guard staleness
// on its own. This runs the real generator over the live product sources and the registered
// source layers, and requires the saved report and unknown list to be byte-identical.
test('the saved Maison style report is exactly what the generator computes now',()=>{
  const run=spawnSync(process.execPath,['tools/maison-style-review.mjs','--fresh'],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:64*1024*1024});
  assert.equal(run.status,0,run.stdout+run.stderr);
  const outcome=JSON.parse(run.stdout);
  assert.deepEqual({mode:outcome.mode,ok:outcome.ok,fresh:outcome.fresh,changedRecords:outcome.changedRecords,differences:outcome.differences},{mode:'fresh',ok:true,fresh:true,changedRecords:0,differences:[]});
  assert.ok(outcome.files>0&&outcome.records>0,'The generator scanned the product');
});
