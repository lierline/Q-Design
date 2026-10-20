import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {inspectGlobalTypographyLayer,validateTypographyLinks} from './typography-links-core.mjs';
import {composeFoundation,buildFoundation} from './build-foundation.mjs';

const root='D:/Claude/Q-Design';
const postcss=createRequire(import.meta.url)('postcss');
const shared=fs.readFileSync(root+'/patterns/foundation.css','utf8');
const layer=fs.readFileSync(root+'/patterns/typography-links.css','utf8');

test('family role proof rejects frozen names, undeclared master tokens, layout changes and hidden at-rules',()=>{
  validateTypographyLinks(shared,layer,postcss);
  assert.throws(()=>inspectGlobalTypographyLayer(layer.replace('var(--qd-font-family-ui)','Pretendard, sans-serif'),postcss));
  assert.throws(()=>validateTypographyLinks(shared.replaceAll('--qd-font-family-ui:','--missing-ui:'),layer,postcss));
  assert.throws(()=>inspectGlobalTypographyLayer(layer.replace('font-family:','padding: 20px; font-family:'),postcss));
  assert.throws(()=>inspectGlobalTypographyLayer(layer+'\n@supports (display: grid) {}',postcss));
  assert.throws(()=>inspectGlobalTypographyLayer(layer.replace('@media print','@media screen'),postcss));
  assert.throws(()=>inspectGlobalTypographyLayer(layer.replace('html .qd-workspace[data-product]','.qd-workspace[data-product]'),postcss));
});

test('three product foundations keep every prior byte and append the same complete role layer',()=>{
  for(const product of ['atelier','maison','carnet']){
    const recipe='/* untouched local recipe */\n.qd-workspace{--qd-font-ui:local-family}\n';
    const before=composeFoundation(shared,recipe,product);
    assert.equal(composeFoundation(shared,recipe,product,layer),before.trimEnd()+'\n\n'+layer.replaceAll('\r\n','\n').trimEnd()+'\n');
  }
});

test('foundation builds require the shared family layer instead of silently skipping it',()=>{
  const fixture=fs.mkdtempSync('D:/Claude/tmp/qd-typography-required-');
  try{
    fs.mkdirSync(fixture+'/patterns',{recursive:true});
    fs.writeFileSync(fixture+'/patterns/foundation.css',shared);
    fs.copyFileSync(root+'/patterns/components.css',fixture+'/patterns/components.css');
    assert.throws(()=>buildFoundation(fixture,{only:[]}),/typography-links/);
  }finally{assert(fixture.startsWith('D:/Claude/tmp/qd-typography-required-'));fs.rmSync(fixture,{recursive:true,force:true});}
});
