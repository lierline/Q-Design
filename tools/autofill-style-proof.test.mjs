import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {autofillStyles,applyAutofillStyles,verifyAutofillStyles} from './autofill-style-proof.mjs';

const postcss=createRequire('D:/Claude/Q-Atelier/package.json')('postcss');
test('autofill rules cover both browser selectors and keep state paint centrally parameterized',()=>{
 const ast=postcss.parse(autofillStyles),rules=[];
 ast.walkRules(r=>rules.push(r));
 const paint=rules.find(r=>r.selector==='html :is(input, textarea):is(:autofill, :-webkit-autofill)');
 assert(paint);const values=Object.fromEntries(paint.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 assert.equal(values['-webkit-text-fill-color'],'var(--qd-autofill-ink)');
 assert.match(values['box-shadow'],/var\(--qd-autofill-cover\).*var\(--qd-autofill-surface\)/);
 assert.equal(values['caret-color'],'var(--qd-accent)');
 const disabled=rules.find(r=>r.selector.endsWith(':disabled')&&r.parent.type==='root');
 assert(disabled.nodes.some(d=>d.prop==='--qd-autofill-ink'&&d.value==='var(--qd-muted)'));
 assert(rules.some(r=>r.selector.endsWith(':focus-visible')&&r.nodes.some(d=>d.prop==='outline'&&d.value.includes('var(--qd-focus-outline-width)'))));
 const forced=[];ast.walkAtRules('media',r=>{if(r.params==='(forced-colors: active)')forced.push(r);});
 assert.equal(forced.length,1);assert.match(forced[0].toString(),/FieldText/);assert.match(forced[0].toString(),/GrayText/);assert.match(forced[0].toString(),/box-shadow: none/);
 assert.doesNotMatch(autofillStyles,/transition\s*:|animation\s*:|#[a-f\d]{3,8}\b/i);
});
test('unrelated source changes cannot inherit the additive correction proof',()=>{
 const source=fs.readFileSync('D:/Claude/Q-Design/patterns/components.css','utf8').replaceAll('\r\n','\n');
 const before=source.includes(autofillStyles)?source.slice(0,-autofillStyles.length):source;
 verifyAutofillStyles(before,applyAutofillStyles(before));
 assert.throws(()=>verifyAutofillStyles(before,applyAutofillStyles(before).replace('--qd-control-height: 44px','--qd-control-height: 60px')),/Only the reviewed/);
 assert.throws(()=>verifyAutofillStyles(before,applyAutofillStyles(before)+'\ninput { display: none; }'),/Only the reviewed/);
});
