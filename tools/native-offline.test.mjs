import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NATIVE_OFFLINE,nativeOfflineHtml,nativeTypographyXml,nativeTypographySwift} from './build-native-offline.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('native offline is self contained and preserves each product retry protocol',()=>{
 for(const config of NATIVE_OFFLINE){
  const html=nativeOfflineHtml(root,config);
  assert.ok(html.includes(`href="${config.scheme}://retry"`));
  assert.ok(html.includes('--qd-copy-word-break: keep-all;'));
  assert.ok(html.includes('var(--qd-control-height)'));
  assert.doesNotMatch(html,/<(?:link|script)[^>]*(?:src|href)=/);
  assert.doesNotMatch(html,/\{\{[A-Z_]+\}\}/);
 }
});
test('native sp/dp resources are derived from mutable central roles',()=>{
 const fixture=fs.mkdtempSync('D:/Claude/tmp/qd-native-type-test-');
 try{
  fs.mkdirSync(path.join(fixture,'patterns'));
  const components=fs.readFileSync(path.join(root,'patterns/components.css'),'utf8');
  assert.ok(components.includes('--qd-control-size: 13px;'));
  fs.writeFileSync(path.join(fixture,'patterns/components.css'),components.replace('--qd-control-size: 13px;','--qd-control-size: 15px;'));
  const before=fs.readFileSync(path.join(root,'patterns/foundation.css'),'utf8');
  const after=before.replace('--qd-native-wordmark-size: 11px;','--qd-native-wordmark-size: 12px;').replace('--qd-native-text-inset: 24px;','--qd-native-text-inset: 28px;');
  fs.writeFileSync(path.join(fixture,'patterns/foundation.css'),after);
  const xml=nativeTypographyXml(fixture);
  assert.match(xml,/>12sp<\/dimen>/);
  assert.match(xml,/>15sp<\/dimen>/);
  assert.match(xml,/>28dp<\/dimen>/);
  const swift=nativeTypographySwift(fixture);
  assert.match(swift,/hintPointSize: CGFloat = 15/);
  assert.match(swift,/wordmarkPointSize: CGFloat = 12/);
  assert.match(swift,/textInset: CGFloat = 28/);
 }finally{
  const target=path.resolve(fixture),boundary=path.resolve('D:/Claude/tmp')+path.sep;
  if(!target.startsWith(boundary)||!path.basename(target).startsWith('qd-native-type-test-'))throw Error('Unsafe test cleanup target');
  fs.rmSync(target,{recursive:true});
 }
});
