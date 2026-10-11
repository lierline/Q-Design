// Exact source ownership for the two existing UIKit presentation components.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
import {COLOR_AUDIT_TARGETS,parseCoverageArgs} from './audit-coverage-imports.mjs';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const IOS_COMPONENTS=Object.freeze([
 {key:'Q-Atelier',product:'atelier',component:'LaunchView',canonical:'patterns/native/ios/LaunchView.swift',generated:'dist/native-components/ios/LaunchView.swift',target:'Q-Atelier-iOS/QAtelier/Sources/LaunchView.swift'},
 {key:'Q-Atelier',product:'atelier',component:'ToastView',canonical:'patterns/native/ios/ToastView.swift',generated:'dist/native-components/ios/ToastView.swift',target:'Q-Atelier-iOS/QAtelier/Sources/ToastView.swift'},
].map(Object.freeze));
const norm=text=>text.replaceAll('\r\n','\n');
export function assertIosSharedRadiusConsumer(text){
 const code=text.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\/\/[^\r\n]*/g,'');
 const assignments=[...code.matchAll(/\blayer\s*\.\s*cornerRadius\s*=\s*([^\r\n;]+)/g)];
 assert.equal(assignments.length,1,'One native toast corner radius consumer required');
 assert.equal(assignments[0][1].trim(),'QDesignGeometry.cornerRadius','Native toast must use the shared corner radius');
}
export function iosComponentSource(text,config){
 assert(IOS_COMPONENTS.includes(config),'Only registered existing iOS components');
 assert(text.includes('import UIKit')&&text.includes(`final class ${config.component}: UIView {`),'Wrong UIKit component identity');
 assert(![...text].some(ch=>[0x2013,0x2014,0x2015].includes(ch.codePointAt(0))),'Forbidden punctuation in native presentation source');
 assert(!text.includes('{{'),'No unresolved source substitutions');
 if(config.component==='ToastView')assertIosSharedRadiusConsumer(text);
 return norm(text);
}
function writePreservingEndings(file,expected){
 const before=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;
 if(before!==null&&norm(before)===expected)return false;
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,before?.includes('\r\n')?expected.replaceAll('\n','\r\n'):expected);return true;
}
export function buildIosComponents(root=ROOT,{check=false,write=false,only=null}={}){
 assert(!(check&&write),'Choose check or write');
 if(only)for(const key of only)assert(COLOR_AUDIT_TARGETS.includes(key),'Unknown product selection: '+key);
 const records=[];
 for(const config of IOS_COMPONENTS){
  const expected=iosComponentSource(fs.readFileSync(path.join(root,config.canonical),'utf8'),config),generated=path.join(root,config.generated),target=path.resolve(root,'..',config.target),selected=!only||only.has(config.key);
  if(check)assert.equal(norm(fs.readFileSync(generated,'utf8')),expected,'Stale generated iOS component: '+config.component);
  else writePreservingEndings(generated,expected);
  if(selected){
   assert(fs.existsSync(target),'Missing registered iOS source: '+config.target);
   if(write)writePreservingEndings(target,expected);
   if(check||write)assert.equal(norm(fs.readFileSync(target,'utf8')),expected,'iOS component differs from its canonical presentation recipe: '+config.component);
  }
  records.push({...config,sourceHash:hash(expected)});
 }
 const report={version:1,scope:'Exact full-source ownership of the two existing Q-Atelier UIKit presentation components. Source equality and propagation are checked, without claiming Swift compilation, installation, or visual conformance. UIKit/CoreText, dynamic type, reduced motion, runtime input and externally referenced palette/font/logo resources remain distinct boundaries. No other product iOS app or native class is included.',records},text=JSON.stringify(report,null,2)+'\n',catalog=path.join(root,'dist/q-design.ios-components.json');
 if(check)assert.equal(fs.readFileSync(catalog,'utf8'),text,'Stale iOS component catalog');else writePreservingEndings(catalog,text);
 return report;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const args=process.argv.slice(2);assert(args.every(arg=>['--check','--write'].includes(arg)||arg.startsWith('--only=')));
 const {only}=parseCoverageArgs(args.filter(arg=>arg.startsWith('--only=')));
 const report=buildIosComponents(ROOT,{check:args.includes('--check'),write:args.includes('--write'),only});
 console.log(JSON.stringify({components:report.records.length,selected:report.records.filter(r=>!only||only.has(r.key)).map(r=>r.component),synchronized:args.includes('--check')||args.includes('--write')}));
}
