// Retain only pre-existing style arguments after the exact display-only edit.
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createRequire} from 'node:module';
import {formatProductCopy} from './copy-spacing.mjs';import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root=path.resolve(import.meta.dirname,'..'),repo=path.resolve(root,'../Q-Works'),file='app/(app)/settings/roles/permission-matrix.tsx',ref='a74d7ab64bba6b2f2bd7dbcbf6ba7fc7c8f60f1c';
const read=p=>fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');
const before=execFileSync('git',['show',`${ref}:${file}`],{cwd:repo,encoding:'utf8'}).replaceAll('\r\n','\n');
const expected=await formatProductCopy(repo,file,before.replace('import { saveRolePermissions } from "./actions";','import { saveRolePermissions } from "./actions";\nimport { formatPermissionDescription } from "@/lib/design/q-design-permission-copy";').replace('<span>{p.description ?? p.code}</span>','<span>{formatPermissionDescription(p.description ?? p.code)}</span>').replace('aria-label={`${r.name}: ${p.description ?? p.code} ${','aria-label={`${r.name}: ${formatPermissionDescription(p.description ?? p.code)} ${'));
const after=read(path.join(repo,file));assert.equal(hash(after),hash(expected),'Unreviewed permission matrix change');
const req=createRequire(path.join(repo,'package.json')),ts=req('typescript'),postcss=req('postcss'),properties=cssProperties(ts,read(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts')));
const oldArgs=scanArguments(file,before,{ts,postcss,properties}),newArgs=scanArguments(file,after,{ts,postcss,properties});
assert.equal(oldArgs.length,newArgs.length);oldArgs.forEach((old,i)=>assert.deepEqual([old.kind,old.property,old.value],[newArgs[i].kind,newArgs[i].property,newArgs[i].value],'Visual argument changed'));
const key=a=>hash(JSON.stringify([file,a.line,a.kind,a.property,a.value]));
const mapping=new Map(oldArgs.map((a,i)=>[key(a),newArgs[i]]));const retained=[];
for(const name of ['maison-style-manual-review.json','maison-style-spread-review.json','maison-style-bindings-review.json','maison-accent-review.json']){
 const full=path.join(root,'reviews',name),report=JSON.parse(read(full));let dirty=false;
 for(const r of report.records??[]){if(r.path!==file||r.sourceHash!==hash(before))continue;const arg=mapping.get(r.argumentHash);if(!arg)continue;
  r.argumentHash=key(arg);r.line=arg.line;r.sourceHash=hash(after);
  for(const e of r.evidence??[])if(e.path===file&&e.hash===hash(before)){
   const oldLine=before.split('\n')[e.line-1],lines=after.split('\n'),matches=lines.flatMap((line,i)=>line===oldLine?[i+1]:[]);
   if(matches.length===1){e.line=matches[0];e.hash=hash(after);}
  }
  retained.push({report:name,argumentHash:r.argumentHash,line:r.line});dirty=true;
 }
 if(dirty&&process.argv.includes('--write'))fs.writeFileSync(full,JSON.stringify(report,null,2)+'\n');
}
const report={scope:'Existing argument sequence is unchanged after an exact display-only formatter import and two text/ARIA calls. Permission codes, grant conditions, callbacks, persistence and all visual arguments are byte-identical before formatting.',ref,path:file,beforeHash:hash(before),afterHash:hash(after),verifiedArgumentCount:oldArgs.length,retained};
if(process.argv.includes('--write'))fs.writeFileSync(path.join(root,'reviews/permission-copy-evidence.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({verifiedArguments:oldArgs.length,retained:retained.length}));
