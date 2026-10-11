import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import os from 'node:os';
import path from 'node:path';
import {IOS_COMPONENTS,iosComponentSource,buildIosComponents} from './build-ios-components.mjs';
const root='D:/Claude/Q-Design';
test('both existing UIKit components match the full canonical source and external platform boundaries remain visible',()=>{
 assert.equal(buildIosComponents(root,{check:true}).records.length,2);
 assert.equal(buildIosComponents(root,{check:true,only:new Set(['Q-Works','Q-Forge'])}).records.length,2);
 const launch=fs.readFileSync(root+'/'+IOS_COMPONENTS[0].canonical,'utf8');
 assert(launch.includes('UIAccessibility.isReduceMotionEnabled'));assert(launch.includes('QDesignTypography.hintPointSize'));assert(launch.includes('Palette.mutedOnDark'));assert(launch.includes('CTLineCreateWithAttributedString'));
 const toast=fs.readFileSync(root+'/'+IOS_COMPONENTS[1].canonical,'utf8');
 assert(toast.includes('label.adjustsFontForContentSizeCategory = true'));assert(toast.includes('UIAccessibility.post(notification: .announcement, argument: text)'));
});
test('unknown component identities, incomplete source and forbidden punctuation are rejected',()=>{
 const config=IOS_COMPONENTS[0],source=fs.readFileSync(root+'/'+config.canonical,'utf8');
 assert.throws(()=>iosComponentSource(source,{...config,component:'OTHER'}));
 assert.throws(()=>iosComponentSource(source.replace('final class LaunchView: UIView {','final class Another: UIView {'),config));
 assert.throws(()=>iosComponentSource(source+'{{UNREVIEWED}}',config));
 assert.throws(()=>iosComponentSource(source+String.fromCodePoint(0x2014),config));
 assert.throws(()=>buildIosComponents(root,{check:true,write:true}));
 assert.throws(()=>buildIosComponents(root,{check:true,only:new Set(['unknown'])}));
});
test('canonical style edits reach their exact UIKit source, stale source fails and unrelated product selection preserves it',()=>{
 const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'qd-ios-components-')),fixtureRoot=path.join(workspace,'Q-Design'),files=[],dirs=new Set([workspace]);
 const write=(file,text)=>{
  const full=path.resolve(file);assert(full.startsWith(path.resolve(workspace)+path.sep));
  let dir=path.dirname(full);while(dir!==workspace){dirs.add(dir);dir=path.dirname(dir);}
  fs.mkdirSync(path.dirname(full),{recursive:true});fs.writeFileSync(full,text);files.push(full);
 };
 try{
  for(const config of IOS_COMPONENTS){
   const source=fs.readFileSync(root+'/'+config.canonical,'utf8').replaceAll('\r\n','\n');
   const edited=config.component==='ToastView'?source.replace('layer.cornerRadius = 10','layer.cornerRadius = 12'):source.replace('static let introMs = 1200.0','static let introMs = 1250.0');
   assert.notEqual(edited,source);write(path.join(fixtureRoot,config.canonical),edited);write(path.join(workspace,config.target),source.replaceAll('\n','\r\n'));
   files.push(path.join(fixtureRoot,config.generated));let dir=path.dirname(path.join(fixtureRoot,config.generated));while(dir!==workspace){dirs.add(dir);dir=path.dirname(dir);}
  }
  files.push(path.join(fixtureRoot,'dist/q-design.ios-components.json'));
  buildIosComponents(fixtureRoot);assert.throws(()=>buildIosComponents(fixtureRoot,{check:true}));
  const before=IOS_COMPONENTS.map(c=>fs.readFileSync(path.join(workspace,c.target)));
  buildIosComponents(fixtureRoot,{write:true,only:new Set(['Q-Works','Q-Forge'])});
  IOS_COMPONENTS.forEach((c,i)=>assert.deepEqual(fs.readFileSync(path.join(workspace,c.target)),before[i]));
  buildIosComponents(fixtureRoot,{write:true,only:new Set(['Q-Atelier'])});assert.equal(buildIosComponents(fixtureRoot,{check:true}).records.length,2);
  for(const config of IOS_COMPONENTS){const actual=fs.readFileSync(path.join(workspace,config.target),'utf8');assert(actual.includes('\r\n'));assert(!/(?<!\r)\n/.test(actual));assert.equal(actual.replaceAll('\r\n','\n'),fs.readFileSync(path.join(fixtureRoot,config.canonical),'utf8'));}
  const unchanged=IOS_COMPONENTS.map(c=>fs.readFileSync(path.join(workspace,c.target)));
  buildIosComponents(fixtureRoot,{write:true});IOS_COMPONENTS.forEach((c,i)=>assert.deepEqual(fs.readFileSync(path.join(workspace,c.target)),unchanged[i]));
  const generated=path.join(fixtureRoot,IOS_COMPONENTS[1].generated);fs.appendFileSync(generated,'// stale\n');assert.throws(()=>buildIosComponents(fixtureRoot,{check:true}));
 }finally{
  for(const file of new Set(files))if(fs.existsSync(file))fs.unlinkSync(file);
  for(const dir of [...dirs].sort((a,b)=>b.length-a.length))if(fs.existsSync(dir))fs.rmdirSync(dir);
 }
});
