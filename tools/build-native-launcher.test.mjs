import fs from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';
import os from 'node:os';
import path from 'node:path';
import {NATIVE_LAUNCHERS,renderNativeLauncher,verifyNativeLauncher,buildNativeLaunchers} from './build-native-launcher.mjs';
const root='D:/Claude/Q-Design',template=fs.readFileSync(root+'/patterns/native/launch-view.java.tpl','utf8');
test('all three actual renderers match the full canonical component, including lifecycle and accessibility',()=>{
 assert.equal(buildNativeLaunchers(root,{check:true}).records.length,3);
 assert.equal(buildNativeLaunchers(root,{check:true,only:new Set(['Q-Atelier'])}).records.length,3);
 assert.equal(buildNativeLaunchers(root,{check:true,only:new Set(['Q-Sonar'])}).records.length,3);
 for(const config of NATIVE_LAUNCHERS){
  const output=renderNativeLauncher(template,config);
  assert(output.includes('Settings.Global.ANIMATOR_DURATION_SCALE'));
  assert(output.includes('getResources().getDimension(R.dimen.qd_native_wordmark_size)'));
  assert(output.includes('R.integer.qd_native_hint_break_strategy'));
  verifyNativeLauncher(output,output);
  const duration=/INTRO_MS = (\d+)/.exec(output);assert(duration);
  assert.throws(()=>verifyNativeLauncher(output,output.replace(duration[0],'INTRO_MS = '+(Number(duration[1])+1))));
 }
});
test('unknown or incomplete identity substitutions cannot become native component copies',()=>{
 assert.throws(()=>renderNativeLauncher(template,{...NATIVE_LAUNCHERS[0],wordmark:'OTHER'}));
 assert.throws(()=>renderNativeLauncher(template+'{{UNREVIEWED}}',NATIVE_LAUNCHERS[0]));
 assert.throws(()=>renderNativeLauncher(template.replace('{{QD_NATIVE_PACKAGE}}',''),NATIVE_LAUNCHERS[0]));
 assert.throws(()=>buildNativeLaunchers(root,{check:true,only:new Set(['unknown'])}));
});

test('one recipe edit regenerates all three native source copies and stale copies fail the gate',()=>{
 const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'qd-native-propagation-')),fixtureRoot=path.join(workspace,'Q-Design'),files=[],dirs=new Set([workspace]);
 const write=(file,content)=>{
  const resolved=path.resolve(file);assert(resolved.startsWith(path.resolve(workspace)+path.sep));
  let dir=path.dirname(resolved);
  while(dir!==workspace){dirs.add(dir);dir=path.dirname(dir);}
  fs.mkdirSync(path.dirname(resolved),{recursive:true});fs.writeFileSync(resolved,content);files.push(resolved);
 };
 try{
  const duration=/INTRO_MS = (\d+)/.exec(template);assert(duration);
  const edited=template.replace(duration[0],'INTRO_MS = '+(Number(duration[1])+1));
  write(path.join(fixtureRoot,'patterns/native/launch-view.java.tpl'),edited);
  for(const config of NATIVE_LAUNCHERS){
   write(path.join(workspace,config.repo,'app/src/main/java',config.package.replaceAll('.','/'),'LaunchView.java'),renderNativeLauncher(template,config));
  }
  buildNativeLaunchers(fixtureRoot);
  for(const config of NATIVE_LAUNCHERS)files.push(path.join(fixtureRoot,'dist/native-launchers',`LaunchView.${config.product}.java`));
  files.push(path.join(fixtureRoot,'dist/q-design.native-launchers.json'));
  dirs.add(path.join(fixtureRoot,'dist/native-launchers'));dirs.add(path.join(fixtureRoot,'dist'));
  assert.throws(()=>buildNativeLaunchers(fixtureRoot,{check:true}));
  buildNativeLaunchers(fixtureRoot,{write:true});
  assert.equal(buildNativeLaunchers(fixtureRoot,{check:true}).records.length,3);
  for(const config of NATIVE_LAUNCHERS){
   const actual=fs.readFileSync(path.join(workspace,config.repo,'app/src/main/java',config.package.replaceAll('.','/'),'LaunchView.java'),'utf8');
   assert.equal(actual,renderNativeLauncher(edited,config));
   assert(actual.includes('INTRO_MS = '+(Number(duration[1])+1)));
  }
 }finally{
  for(const file of new Set(files))if(fs.existsSync(file))fs.unlinkSync(file);
  for(const dir of [...dirs].sort((a,b)=>b.length-a.length))if(fs.existsSync(dir))fs.rmdirSync(dir);
 }
});
