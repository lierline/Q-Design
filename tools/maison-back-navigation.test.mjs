import test from 'node:test';
import assert from 'node:assert/strict';
import {backNavigationSlots,verifyBackNavigation,beforeClass,afterClass} from './maison-back-navigation.mjs';
const code=`import Link from 'next/link';import {ArrowLeft} from '@/components/q-design-icons/ArrowLeft';function Page(){return <Link href="/store" className="${beforeClass}"><ArrowLeft className="h-3.5 w-3.5" /> 매장 판매</Link>}`;
test('only parent-navigation class changes, retaining the complete destination, glyph and label',()=>{
 const after=code.replace(beforeClass,afterClass);assert.equal(verifyBackNavigation(code,after).href,'"/store"');
 for(const wrong of [after.replace('/store','/other'),after.replace('매장 판매','다른 메뉴'),after.replace('h-3.5','h-4'),after+'\n// unrelated'])assert.throws(()=>verifyBackNavigation(code,wrong));
});
test('lookalike modules, local shadows and other element roles cannot inherit parent-navigation proof',()=>{
 for(const wrong of [code.replace('next/link','other/link'),code.replace('Page()','Page(Link:any)'),code.replace('<ArrowLeft','<Search'),code.replace('href="/store"',''),code.replace(' 매장 판매','')])assert.throws(()=>backNavigationSlots(wrong));
 const dynamic=code.replace(' 매장 판매','{isChange?"계약 변경 요청 상세":"계약 검토 상세"}');assert.equal(verifyBackNavigation(dynamic,dynamic.replace(beforeClass,afterClass)).line,1);
});
