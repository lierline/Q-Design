import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import {nativePaletteRoles,ANDROID_NATIVE_COLORS,assertNativePaletteAliases,assertIosPaletteConsumers} from './native-palette-roles.mjs';
import {nativePaletteXml,nativePaletteSwift} from './build-native-offline.mjs';
import {readInputs} from './build-palette.mjs';
const root='D:/Claude/Q-Design',rules=JSON.parse(fs.readFileSync(root+'/patterns/native/palette.json','utf8'));
function fixture(run){
 const workspace=fs.mkdtempSync('D:/Claude/tmp/qd-native-palette-test-'),dir=path.join(workspace,'patterns/native'),file=path.join(dir,'palette.json');fs.mkdirSync(dir,{recursive:true});
 try{return run(workspace,data=>fs.writeFileSync(file,JSON.stringify(data)));}finally{fs.unlinkSync(file);fs.rmdirSync(dir);fs.rmdirSync(path.dirname(dir));fs.rmdirSync(workspace);}
}
test('editing central native roles reaches all three Android palettes and existing iOS appearance without sharing product metals',()=>fixture((workspace,write)=>{
 const updated=structuredClone(rules);updated.shared.mutedOnLight='#665544';updated.shared.toastSurface='#202122';updated.shared.toastText='#ffffff';updated.shared.toastOpacity=0.9;
 for(const [product,color] of [['atelier','#112233'],['maison','#445566'],['carnet','#778899']])updated.products[product].loadingAccent=color;
 write(updated);const inputs=readInputs(root);
 for(const product of ['atelier','maison','carnet']){
  const xml=nativePaletteXml(workspace,inputs,product),roles=nativePaletteRoles(workspace,product);
  assert(xml.includes('<color name="qd_native_muted_on_light">#665544</color>'));
  for(const [key,name] of Object.entries(ANDROID_NATIVE_COLORS))assert(xml.includes(`<color name="qd_native_${name}">${roles[key]}</color>`));
 }
 const swift=nativePaletteSwift(workspace,inputs);assert(swift.includes('loadingAccent: UInt32 = 0x112233'));assert(swift.includes('toastSurface: UInt32 = 0x202122'));assert(swift.includes('toastText: UInt32 = 0xffffff'));assert(swift.includes('toastOpacity: CGFloat = 0.9'));
}));
test('incomplete profiles, unregistered products and invalid values cannot create native styles',()=>fixture((workspace,write)=>{
 for(const alter of [d=>{d.products.other=d.products.atelier;},d=>{delete d.shared.mutedOnLight;},d=>{d.products.atelier.loadingAccent='url(secret)';},d=>{d.shared.toastOpacity=1.1;},d=>{d.shared.toastOpacity='0.94';},d=>{d.version=2;}]){const changed=structuredClone(rules);alter(changed);write(changed);assert.throws(()=>nativePaletteRoles(workspace,'atelier'));}
 write(rules);assert.throws(()=>nativePaletteRoles(workspace,'other'));
}));
test('every existing Android native color consumer uses one central alias, not a literal or comment-only reference',()=>{
 for(const repo of ['Q-Atelier-App','Q-Maison-App','Q-Carnet-App'])assertNativePaletteAliases(fs.readFileSync('D:/Claude/'+repo+'/app/src/main/res/values/colors.xml','utf8'));
 const xml='<resources>'+Object.values(ANDROID_NATIVE_COLORS).map(name=>`<color name="${name}">@color/qd_native_${name}</color>`).join('')+'</resources>';assertNativePaletteAliases(xml);
 assert.throws(()=>assertNativePaletteAliases('<!--'+xml+'-->'));assert.throws(()=>assertNativePaletteAliases(xml+ '<color name="ic_bg">@color/qd_native_ic_bg</color>'));assert.throws(()=>assertNativePaletteAliases(xml.replace('@color/qd_native_loading_accent','#b8935a')));
});
test('existing iOS palette, glint and toast consumers retain exact generated role references',()=>{
 const dir='D:/Claude/Q-Atelier-iOS/QAtelier/Sources/',palette=fs.readFileSync(dir+'Palette.swift','utf8'),launch=fs.readFileSync(dir+'LaunchView.swift','utf8'),toast=fs.readFileSync(dir+'ToastView.swift','utf8');assertIosPaletteConsumers(palette,launch,toast);
 assert.throws(()=>assertIosPaletteConsumers(palette.replace('UIColor(rgb: QDesignPalette.loadingAccent)','UIColor(rgb: 0xB8935A)'),launch,toast));
 assert.throws(()=>assertIosPaletteConsumers(palette,launch.replace('CGFloat(QDesignPalette.launchGlint & 0xFF) / 255.0','0xEC / 255.0'),toast));
 assert.throws(()=>assertIosPaletteConsumers(palette,launch,toast.replace('QDesignNativeAppearance.toastOpacity','0.94')));
 assert.throws(()=>assertIosPaletteConsumers(palette,launch,toast.replace('label.textColor = UIColor(rgb: QDesignPalette.toastText)','// label.textColor = UIColor(rgb: QDesignPalette.toastText)')));
});
