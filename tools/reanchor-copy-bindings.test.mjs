import test from 'node:test';
import assert from 'node:assert/strict';
import {reanchorBindings} from './reanchor-copy-bindings.mjs';
const binding={line:1,kind:'StringLiteral',ordinal:0,original:'"이전 문구"',emitted:'"검토 안내"'};
test('exact unique copy can move without changing its original or emitted text',()=>{
  const result=reanchorBindings('a.ts','\n\nconst label="검토 안내";',[binding]);
  assert.deepEqual(result,[{...binding,line:3}]);
});
test('missing or changed text and ambiguous locations remain rejected',()=>{
  for(const code of ['const label="바뀐 안내";','\nconst a="검토 안내";const b="검토 안내";'])assert.throws(()=>reanchorBindings('a.ts',code,[binding]));
});
test('two bindings cannot silently claim one source literal',()=>{
  assert.throws(()=>reanchorBindings('a.ts','const label="검토 안내";',[binding,binding]));
});
