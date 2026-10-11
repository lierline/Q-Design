import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require=createRequire(new URL('../../Q-Atelier/package.json',import.meta.url));
const postcss=require('postcss');
const read=p=>fs.readFileSync(new URL(p,import.meta.url),'utf8');
const css=postcss.parse(read('../patterns/foundation/atelier.css'));
function declarations(selector){const found=[];css.walkRules(r=>{if(r.selectors.includes(selector))found.push(r);});assert.equal(found.length,1,selector);return Object.fromEntries(found[0].nodes.filter(n=>n.type==='decl').map(d=>[d.prop,d.value]));}
test('expert profile and editorial inputs share opaque controls and mutable boundary tokens',()=>{
  const boxed=declarations(".expert-portal-root input[type='email']");
  const editorial=declarations('.expert-portal-root .luxe-input');
  assert.equal(boxed.background,'var(--qd-surface)');assert.equal(editorial.background,'var(--qd-surface)');
  assert.equal(boxed.border,'var(--qd-border-width) solid var(--qd-ctl)');
  assert.equal(editorial['border-bottom'],boxed.border);
  assert.equal(boxed['min-height'],'var(--qd-control-height)');
  const tokens={'--qd-border-width':'2px','--qd-ctl':'#447788','--qd-surface':'#123456','--qd-control-height':'48px'};
  const resolve=value=>value.replace(/var\((--[\w-]+)\)/g,(_,name)=>tokens[name]);
  assert.equal(resolve(boxed.border),'2px solid #447788');assert.equal(resolve(editorial['border-bottom']),'2px solid #447788');
  assert.equal(resolve(boxed.background),'#123456');assert.equal(resolve(boxed['min-height']),'48px');
});
test('keyboard focus cannot be removed by the more specific editorial input rule',()=>{
  const focus=declarations('.expert-portal-root input:focus-visible');
  assert.equal(focus.outline,'var(--qd-focus-outline-width) solid var(--qd-accent)');
  assert.equal(focus['outline-offset'],'var(--qd-space-1)');
  assert.equal(declarations('.expert-portal-root .luxe-input:focus').outline,undefined);
  assert.equal(declarations('.expert-portal-root input:focus').background,'var(--qd-surface2)');
  for(const page of ['login','forgot','reset'])assert.match(read(`../../Q-Atelier/app/experts/portal/${page}/page.tsx`),/className="luxe-input(?: luxe-input-pw)?"/);
  const profile=read('../../Q-Atelier/app/experts/settings/profile-form.tsx');
  for(const tag of ['input','select','textarea'])assert.match(profile,new RegExp('<'+tag+'\\b'));
});

test('the real invitation heading keeps Korean words together while long names can wrap',()=>{
  const title=declarations('.expert-portal-root .display-1');
  assert.equal(title['word-break'],'keep-all');
  assert.equal(title['overflow-wrap'],'break-word');
  assert.notEqual(title['white-space'],'nowrap');
  const invitation=read('../../Q-Atelier/app/experts/portal/page.tsx');
  assert.match(invitation,/<h1 className="display-1[^\"]*"[\s\S]*?<span className="accent">\{name\}<\/span> 님을/);
});

test('expert form fields and actions remain visible throughout their short common motion',()=>{
  for(const selector of ['.luxe-form-eyebrow','.luxe-input-group','.luxe-submit','.luxe-form-meta']){
    const normal=[];css.walkRules(r=>{if(r.selectors.includes('.expert-portal-root '+selector)&&r.parent.type==='root')normal.push(r)});
    assert.equal(normal.length,1,selector);
    const d=Object.fromEntries(normal[0].nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
    assert.equal(d.opacity,'1',selector);
    assert.equal(d.animation,'qa-luxe-form-settle var(--qd-motion-fast) var(--qd-ease)',selector);
  }
  assert.equal(declarations('.expert-portal-root .luxe-input-group.delay-1')['animation-delay'],'0s');
  assert.equal(declarations('.expert-portal-root .luxe-input-group.delay-2')['animation-delay'],'0s');
  const frames=[];css.walkAtRules('keyframes',r=>{if(r.params==='qa-luxe-form-settle')frames.push(r)});
  assert.equal(frames.length,1);frames[0].walkDecls(d=>assert.notEqual(d.prop,'opacity'));
  assert.equal(declarations('.expert-portal-root .luxe-submit:disabled').opacity,'0.4');
  const reduced=[];css.walkAtRules('media',r=>{if(r.params==='(prefers-reduced-motion: reduce)')r.walkRules(s=>{if(s.selectors.includes('.expert-portal-root .luxe-submit'))reduced.push(s)})});
  assert.equal(reduced.length,1);
  assert.ok(reduced[0].nodes.some(n=>n.prop==='animation'&&n.value==='none'&&n.important));
  assert.ok(reduced[0].nodes.some(n=>n.prop==='opacity'&&n.value==='1'&&!n.important),'disabled specificity must keep its dimming in reduced motion');
});
