import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {NATIVE_OFFLINE,nativeOfflineHtml,nativeTypographyXml,nativeTypographySwift,assertNativeHintConsumer,nativePaletteXml,nativePaletteSwift,assertNativeBackgroundConsumer} from './build-native-offline.mjs';
import {readInputs} from './build-palette.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

test('editing the shared palette changes Android and iOS default canvases without independent color literals',()=>{
 const inputs=structuredClone(readInputs(root));
 inputs[2].shared.dark['--qa-bg']='#080808';
 inputs[2].shared.light['--qa-bg']='#ffffff';
 assert.match(nativePaletteXml(root,inputs),/<color name="qd_native_bg_dark">#080808<\/color>/);
 assert.match(nativePaletteXml(root,inputs),/<color name="qd_native_bg_light">#ffffff<\/color>/);
 assert.match(nativePaletteSwift(root,inputs),/backgroundDark: UInt32 = 0x080808/);
 assert.match(nativePaletteSwift(root,inputs),/backgroundLight: UInt32 = 0xffffff/);
 const light='<resources><color name="app_bg">@color/qd_native_bg_light</color><color name="splash_light">@color/qd_native_bg_light</color></resources>';
 const dark='<resources><color name="app_bg">@color/qd_native_bg_dark</color></resources>';
 assertNativeBackgroundConsumer(light,dark);
 for(const bad of [light.replace('@color/qd_native_bg_light','#FAF9F6'),'<!--'+light+'-->',light+light])assert.throws(()=>assertNativeBackgroundConsumer(bad,dark),/central canvas/);
 assert.throws(()=>assertNativeBackgroundConsumer(light,dark.replace('@color/qd_native_bg_dark','#0C0C0C')),/central canvas/);
});

test('native startup consumers cannot fall back to an independent enum or a comment-only reference',()=>{
 const call='.setBreakStrategy(getResources().getInteger(R.integer.qd_native_hint_break_strategy))';
 assertNativeHintConsumer('builder'+call+';');
 for(const source of ['builder.setBreakStrategy(1);','builder.setBreakStrategy(Layout.BREAK_STRATEGY_HIGH_QUALITY);','// '+call,'builder'+call+'.setBreakStrategy(0);'])assert.throws(()=>assertNativeHintConsumer(source),/central break strategy/);
});
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
  const nativeRules=JSON.parse(fs.readFileSync(path.join(root,'patterns/native-text-rules.json'),'utf8'));
  fs.writeFileSync(path.join(fixture,'patterns/native-text-rules.json'),JSON.stringify({...nativeRules,androidHintBreakStrategy:'balanced'}));
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
  assert.match(xml,/<integer name="qd_native_hint_break_strategy">2<\/integer>/);
  const swift=nativeTypographySwift(fixture);
  assert.match(swift,/hintPointSize: CGFloat = 15/);
  assert.match(swift,/wordmarkPointSize: CGFloat = 12/);
  assert.match(swift,/textInset: CGFloat = 28/);
  fs.writeFileSync(path.join(fixture,'patterns/native-text-rules.json'),JSON.stringify({...nativeRules,androidHintBreakStrategy:'unsupported'}));
  assert.throws(()=>nativeTypographyXml(fixture),/Unsupported native hint break strategy/);
 }finally{
  const target=path.resolve(fixture),boundary=path.resolve('D:/Claude/tmp')+path.sep;
  if(!target.startsWith(boundary)||!path.basename(target).startsWith('qd-native-type-test-'))throw Error('Unsafe test cleanup target');
  fs.rmSync(target,{recursive:true});
 }
});
