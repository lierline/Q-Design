// Check actual notification adapters against each product's installed TS/React types.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targets=[['atelier','Q-Atelier','components/Toast.tsx'],['maison','Q-Works','components/ui/sonner.tsx'],['carnet','DHR','components/toast.tsx']];
function diagnostics(repo,file,replacement){
 const require=createRequire(repo+'/package.json'),ts=require('typescript'),configPath=repo+'/tsconfig.json';
 if(!ts.sys){
  assert(!replacement,'Native compiler regression fixtures need a separate source checkout');
  const packagePath=require.resolve('typescript/package.json'),meta=JSON.parse(fs.readFileSync(packagePath,'utf8')),dir=fs.mkdtempSync(path.join(os.tmpdir(),'qd-feedback-types-')),temporary=path.join(dir,'tsconfig.json');
  try{
   fs.writeFileSync(temporary,JSON.stringify({extends:configPath,files:[path.resolve(repo,file)],include:[],exclude:[],compilerOptions:{noEmit:true,incremental:false}}));
   const result=spawnSync(process.execPath,[path.resolve(path.dirname(packagePath),meta.bin.tsc),'--project',temporary,'--pretty','false'],{cwd:repo,encoding:'utf8',windowsHide:true});
   return {errors:result.status===0?[]:[{code:'native-compiler-failure'}],text:(result.stdout??'')+(result.stderr??'')};
  }finally{fs.unlinkSync(temporary);fs.rmdirSync(dir);}
 }
 const raw=ts.readConfigFile(configPath,ts.sys.readFile);assert(!raw.error);
 const parsed=ts.parseJsonConfigFileContent({...raw.config,files:[file],include:[],exclude:[]},ts.sys,repo,undefined,configPath);assert.equal(parsed.errors.length,0);
 const options={...parsed.options,noEmit:true,incremental:false},host=ts.createCompilerHost(options),getSourceFile=host.getSourceFile;
 if(replacement)host.getSourceFile=(name,version,...args)=>path.resolve(name)===path.resolve(repo,file)?ts.createSourceFile(name,replacement,version,true):getSourceFile(name,version,...args);
 const program=ts.createProgram({rootNames:parsed.fileNames,options,host}),errors=ts.getPreEmitDiagnostics(program).filter(d=>d.category===ts.DiagnosticCategory.Error);
 return {errors,text:ts.formatDiagnosticsWithColorAndContext(errors,{getCanonicalFileName:f=>f,getCurrentDirectory:()=>repo,getNewLine:()=> '\n'})};
}
for(const [product,directory,file]of targets){
 const repo=path.resolve(root,'../'+directory),actual=diagnostics(repo,file);
 if(actual.errors.length){console.error(actual.text);process.exit(1);}
 if(process.argv.includes('--self-test')&&product!=='carnet'){
  const source=fs.readFileSync(repo+'/'+file,'utf8'),anchor=product==='atelier'?'            lineHeight: QDScale.leading.notice,':'          width: "100%",';assert(source.includes(anchor));
  const broken=source.replace(anchor,anchor+'\n          wordBreak: "var(--qd-copy-word-break)",'),control=diagnostics(repo,file,broken);
  assert(control.errors.some(d=>d.code===2322),'Actual CSS enum assignment error must be detected: '+product);
 }
 console.log(product+': actual feedback adapter types passed');
}
