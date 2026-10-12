import test from 'node:test';
import assert from 'node:assert/strict';
import {copyNodes} from './copy-spacing.mjs';
import {relocateIconCopyBindings} from './maison-icon-copy-bindings.mjs';
test('changed import paths cannot displace or alter exact visible copy bindings',()=>{
 const before=`import {Clock,Plus} from 'lucide-react';\nconst View=()=> <p>작성 중</p>;`,after=`import {Clock} from '@/components/q-design-icons/Clock';\nimport {Plus} from '@/components/q-design-icons/Plus';\nconst View=()=> <p>작성 중</p>;`;
 const n=copyNodes('fixture.tsx',before).find(n=>n.kind==='JsxText');
 const binding={line:n.line,kind:n.kind,ordinal:n.ordinal,original:'작성중',emitted:n.raw};
 assert.equal(relocateIconCopyBindings('fixture.tsx',before,after,[binding])[0].line,3);
 assert.throws(()=>relocateIconCopyBindings('fixture.tsx',before,after.replace('작성 중','작성 완료'),[binding]));
 assert.throws(()=>relocateIconCopyBindings('fixture.tsx',before,after,[{...binding,line:9}]));
});
