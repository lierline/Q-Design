import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
export const ANDROID_NATIVE_COLORS=Object.freeze({iconBackground:'ic_bg',loadingAccent:'loading_accent',loadingAccentBright:'loading_accent_bright',mutedOnDark:'muted_on_dark',launchGlint:'launch_glint',mutedOnLight:'muted_on_light'});
const products=['atelier','maison','carnet'],profileKeys=['loadingAccent','loadingAccentBright','mutedOnDark','launchGlint'],sharedKeys=['iconBackground','mutedOnLight','toastSurface','toastText','toastOpacity'];
const exactKeys=(value,keys)=>{assert(value&&typeof value==='object'&&!Array.isArray(value),'Native palette object required');assert.deepEqual(Object.keys(value).sort(),[...keys].sort(),'Unknown or missing native palette field');};
export function nativePaletteRoles(root,product){
 assert(products.includes(product),'Unknown native product');
 const data=JSON.parse(fs.readFileSync(path.join(root,'patterns/native/palette.json'),'utf8'));
 exactKeys(data,['version','scope','shared','products']);assert.equal(data.version,1);assert(typeof data.scope==='string'&&data.scope.trim());
 exactKeys(data.shared,sharedKeys);exactKeys(data.products,products);
 for(const key of products)exactKeys(data.products[key],profileKeys);
 for(const [key,value] of Object.entries(data.shared))if(key!=='toastOpacity')assert(/^#[\da-f]{6}$/i.test(value),'Native color must be six-digit hex');
 for(const profile of Object.values(data.products))for(const value of Object.values(profile))assert(/^#[\da-f]{6}$/i.test(value),'Native color must be six-digit hex');
 assert(typeof data.shared.toastOpacity==='number'&&Number.isFinite(data.shared.toastOpacity)&&data.shared.toastOpacity>=0&&data.shared.toastOpacity<=1,'Native opacity must be finite and between zero and one');
 return {...data.shared,...data.products[product]};
}
const cleanXml=xml=>xml.replace(/<!--[\s\S]*?-->/g,'');
export function assertNativePaletteAliases(xml){
 for(const name of Object.values(ANDROID_NATIVE_COLORS)){
  const values=[...cleanXml(xml).matchAll(new RegExp(`<color\\s+name=["']${name}["']\\s*>([^<]+)</color>`,'g'))];
  assert.equal(values.length,1,'One native palette consumer required: '+name);assert.equal(values[0][1].trim(),'@color/qd_native_'+name,'Native color must use central resource: '+name);
 }
}
const cleanSwift=source=>source.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\r\n]*/g,'');
// Palette.swift 는 앱이 직접 쓰는 파일이라 이 검사는 감사(check.mjs --products)에서 돕니다.
export function assertIosPaletteFields(palette){
 const paletteCode=cleanSwift(palette);
 for(const [field,role] of [['accent','loadingAccent'],['accentBright','loadingAccentBright'],['mutedOnDark','mutedOnDark'],['mutedOnLight','mutedOnLight']]){
  const declarations=[...paletteCode.matchAll(new RegExp(`^\\s*static let ${field} = ([^\\r\\n]+)`,'gm'))];
  assert.equal(declarations.length,1,'One iOS palette field required: '+field);assert.equal(declarations[0][1].trim(),`UIColor(rgb: QDesignPalette.${role})`,'iOS palette must use generated role: '+field);
 }
}
export function assertIosPaletteConsumers(palette,launch,toast){
 assertIosPaletteFields(palette);assertIosAppearanceConsumers(launch,toast);
}
// LaunchView · ToastView 는 Q-Design 이 만들어 내보내는 사본이라 Q-Design 쪽 출력만 보면 됩니다.
export function assertIosAppearanceConsumers(launch,toast){
 const clean=cleanSwift;
 const launchCode=clean(launch);
 for(const [field,expression] of [['r','CGFloat((QDesignPalette.launchGlint >> 16) & 0xFF) / 255.0'],['g','CGFloat((QDesignPalette.launchGlint >> 8) & 0xFF) / 255.0'],['b','CGFloat(QDesignPalette.launchGlint & 0xFF) / 255.0']]){
  const declarations=[...launchCode.matchAll(new RegExp(`^\\s*let ${field}: CGFloat = ([^\\r\\n]+)`,'gm'))];assert.equal(declarations.length,1,'One iOS glint channel required');assert.equal(declarations[0][1].trim(),expression,'iOS glint must use generated color');
 }
 const toastCode=clean(toast);
 for(const [field,expression] of [['backgroundColor','UIColor(rgb: QDesignPalette.toastSurface).withAlphaComponent(QDesignNativeAppearance.toastOpacity)'],['label.textColor','UIColor(rgb: QDesignPalette.toastText)']]){
  const escaped=field.replaceAll('.','\\.'),assignments=[...toastCode.matchAll(new RegExp(`^\\s*${escaped} = ([^\\r\\n]+)`,'gm'))];assert.equal(assignments.length,1,'One iOS appearance consumer required');assert.equal(assignments[0][1].trim(),expression,'iOS toast must use generated appearance');
 }
}
