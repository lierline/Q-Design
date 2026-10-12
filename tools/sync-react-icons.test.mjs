import test from 'node:test';
import assert from 'node:assert/strict';
import {interfaceIconModules} from './sync-react-icons.mjs';
test('direct modules are inventoried from real syntax, including type slots and aliases',()=>{
 const code=`import { Clock as EventClock } from '@/components/q-design-icons/Clock'; import type { LucideIcon } from '@/components/q-design-icons/_icon'; const text="lucide-react";`;
 assert.deepEqual([...interfaceIconModules('fixture.tsx',code)],['Clock','_icon']);
});
test('legacy imports, exports, dynamic imports, requires and unsafe module paths fail',()=>{
 for(const code of [`import {Clock} from 'lucide-react';`,`export {Clock} from 'lucide-react';`,`const Icons=import('lucide-react');`,`const Icons=require('lucide-react');`,`import {Clock} from '@/components/q-design-icons/../Clock';`])assert.throws(()=>interfaceIconModules('fixture.tsx',code));
});
