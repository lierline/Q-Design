import test from 'node:test';
import assert from 'node:assert/strict';
import {migrateIconImports} from './maison-icon-handoff.mjs';
test('icon aliases and type slots preserve JSX, callbacks and business payloads',()=>{
 const source=`import { Clock as TimeIcon, type LucideIcon } from 'lucide-react';\nconst payload={status:'Clock',amount:20};\nconst pick=()=>save(payload);\nexport const View=()=> <TimeIcon size={16} aria-label="일정" onClick={pick}/>;`;
 const r=migrateIconImports('fixture.tsx',source,{Clock:'clock'});
 assert.equal(r.after.slice(r.after.indexOf('const payload')),source.slice(source.indexOf('const payload')));
 assert(r.after.includes("import { Clock as TimeIcon } from '@/components/q-design-icons/Clock';"));
 assert(r.after.includes("import type { LucideIcon } from '@/components/q-design-icons/_icon';"));
});
test('unknown, default, namespace and value type imports fail before mutation',()=>{
 for(const source of ["import { Unknown } from 'lucide-react';","import Clock from 'lucide-react';","import * as Icons from 'lucide-react';","import { LucideIcon } from 'lucide-react';"])
  assert.throws(()=>migrateIconImports('fixture.tsx',source,{}));
});
