// Compiler AST inventory, not a regex exemption or a device rendering certificate.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {NATIVE_LAUNCHERS,buildNativeLaunchers} from './build-native-launcher.mjs';
import {hash} from './style-arguments-core.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const catalog=buildNativeLaunchers(root,{check:true,only:check?null:new Set()});
const executable=process.platform==='win32'?'java.exe':'java',bundled=path.join(os.homedir(),'.bubblewrap','jdk');
const installed=fs.existsSync(bundled)?fs.readdirSync(bundled).filter(n=>n.startsWith('jdk-17')&&fs.existsSync(path.join(bundled,n,'bin',executable))).sort().reverse():[];
const java=process.env.JAVA_HOME?path.join(process.env.JAVA_HOME,'bin',executable):installed.length?path.join(bundled,installed[0],'bin',executable):'java';
const parsed=JSON.parse(execFileSync(java,[root+'/tools/NativeUiArguments.java',...catalog.records.map(r=>check?path.resolve(root,'..',r.target):path.resolve(root,r.generated))],{cwd:root,encoding:'utf8',windowsHide:true,maxBuffer:4*1024*1024}));
const records=parsed.map(raw=>{
 const row={...raw,expression:raw.expression.replaceAll('\r\n','\n')};
 const config=NATIVE_LAUNCHERS.find(c=>c.package===row.package);assert(config);
 const owner=catalog.records.find(r=>r.product===config.product);assert(owner);
 return {product:config.product,path:owner.target,sourceHash:owner.sourceHash,canonical:owner.template,canonicalHash:owner.templateHash,...row,argumentHash:hash(JSON.stringify(row)),classification:row.kind==='method-parameter'?'renderer-or-platform-input':'central-component-expression'};
});
const counts={};for(const row of records)counts[row.kind]=(counts[row.kind]??0)+1;
const report={version:1,scope:'Java compiler AST enumerates literals, initialized variables, assignments, method/constructor arguments and method parameters in all three exact synchronized startup renderers. Source recipe ownership is established by complete file equality, not guessed numeric values. State, user accessibility settings, asset content and platform inputs are not centrally controlled values. Other native classes and installed visual states are outside this inventory.',parser:'JDK compiler parse only, annotation processing disabled',counts,records};
const output=root+'/dist/q-design.native-style-arguments.json',json=JSON.stringify(report,null,2)+'\n';
if(check)assert.equal(fs.readFileSync(output,'utf8'),json,'Native AST inventory is stale');else fs.writeFileSync(output,json);
console.log(JSON.stringify({records:records.length,counts,products:new Set(records.map(r=>r.product)).size}));
