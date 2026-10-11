import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { hash } from './style-arguments-core.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'),QA=path.resolve(ROOT,'../Q-Atelier');
const requireQA=createRequire(QA+'/package.json'),ts=requireQA('typescript'),PizZip=requireQA('pizzip');
const ledger=JSON.parse(fs.readFileSync(ROOT+'/reviews/atelier-output-migration.json','utf8'));
const records=new Map(ledger.records.map(r=>[r.path,r]));
const read=file=>fs.readFileSync(path.resolve(QA,file),'utf8');
const followups=JSON.parse(fs.readFileSync(ROOT+'/reviews/atelier-output-followups-migration.json','utf8'));
function reverseFollowup(file,code){
  const record=followups.records.find(entry=>entry.path===file);if(!record)return code;
  assert.equal(hash(code.replaceAll('\r\n','\n')),record.afterHash,file+': latest output source');
  for(const edit of [...record.edits].reverse()){
    assert.equal(code.slice(edit.start,edit.start+edit.after.length),edit.after,file+': exact followup offset');
    code=code.slice(0,edit.start)+edit.before+code.slice(edit.start+edit.after.length);
  }
  assert.equal(hash(code.replaceAll('\r\n','\n')),record.beforeHash,file+': followup original');return code;
}
function original(file){
  const record=records.get(file);if(!record)return read(file);
  let code=reverseFollowup(file,read(file)).replace(/^import \{ QDOutput \} from '@\/lib\/design\/q-design-output';\r?\n/,'');
  let cursor=code.length;
  for(const edit of record.edits){const index=code.lastIndexOf(edit.after,cursor);assert.ok(index>=0,`${file}: missing ${edit.after}`);code=code.slice(0,index)+edit.before+code.slice(index+edit.after.length);cursor=index-1;}
  assert.equal(hash(code),record.beforeHash,`${file}: restored source must match recorded original`);return code;
}
function loader({before=false,output,stubs={}}={}){
  const cache=new Map();
  function load(file){
    file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;
    const module={exports:{}};cache.set(file,module);
    const relative=path.relative(QA,file).replaceAll('\\','/');
    const source=before&&records.has(relative)?original(relative):fs.readFileSync(file,'utf8');
    const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
    const localRequire=name=>{
      if(Object.hasOwn(stubs,name))return stubs[name];
      if(name==='@/lib/design/q-design-output'&&output)return {QDOutput:output};
      if(name.startsWith('@/')||name.startsWith('.')){let next=name.startsWith('@/')?path.resolve(QA,name.slice(2)):path.resolve(path.dirname(file),name);if(!path.extname(next)||!fs.existsSync(next)){if(fs.existsSync(next+'.ts'))next+='.ts';else next+='/index.ts';}return load(next);}
      return requireQA(name);
    };
    vm.runInNewContext(code,{module,exports:module.exports,require:localRequire,Buffer,URL,Request,Response,console,TextEncoder,TextDecoder,Uint8Array,setTimeout,clearTimeout},{filename:file});
    return module.exports;
  }
  return file=>load(path.resolve(QA,file));
}
const canonical=loader()(ROOT+'/source/design/atelier-output.ts').QDOutput;
const markdown='# Main <heading>\n## Secondary\n### Tertiary\n\nPlain & **bold** *italic* `code`\n- bullet <value>\n1. numbered\n---\n| A | B |\n|---|---|\n| 1 | 2 |';
const meta={docName:'Fixture <title>',docCode:'TEST-001',projectTitle:'Example & project',projectCode:'PRJ-001',orgName:'Fixture organization',createdAt:'2026-10-10',toc:true};
function wordXml(buffer){const zip=new PizZip(buffer);return Object.fromEntries(Object.keys(zip.files).filter(name=>/^word\/.*\.xml$/.test(name)).sort().map(name=>[name,zip.file(name).asText().replace(/rId\w+/g,'rId-NORMALIZED')]));}
const template=new PizZip().file('word/document.xml','<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Original template</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>').generate({type:'nodebuffer'});

test('all eleven output edits reconstruct the original source exactly and canonical copy stays current',()=>{
  assert.equal(records.size,11);let count=0;for(const[file,r]of records){original(file);assert.equal(hash(reverseFollowup(file,read(file))),r.afterHash,file);count+=r.edits.length;}assert.equal(count,273);
  const copy=loader()('lib/design/q-design-output.ts').QDOutput;assert.equal(JSON.stringify(copy),JSON.stringify(canonical));
});

test('followup tab geometry and retained legacy palette preserve old values and receive central mutations',async()=>{
  for(const record of followups.records)reverseFollowup(record.path,read(record.path));
  const actual=loader()('lib/export/doc-style.ts').BRAND;
  assert.equal(JSON.stringify(actual),JSON.stringify(followups.definitions.legacyHtmlPalette));
  const output=structuredClone(canonical);output.tabStopTwip.headerFooterRight=8800;output.legacyHtmlPalette.border='123456';
  assert.equal(loader({output})('lib/export/doc-style.ts').BRAND.border,'123456');
  const document=wordXml(await loader({output})('lib/export/docx-builder/index.ts').markdownToDocxBuffer(markdown,meta));
  const related=Object.entries(document).filter(([file])=>/word\/(?:header|footer)\d+\.xml/.test(file));
  assert.ok(related.length>=2);for(const[file,xml]of related)assert.match(xml,/w:pos="8800"/,file);
});
test('actual DOCX builder retains word XML across headings, tables, approval, cover and TOC',async()=>{
  const branding={approvalLine:[{step:'작성',position:'A'},{step:'승인',position:'B'}]};
  const old=await loader({before:true})('lib/export/docx-builder/index.ts').markdownToDocxBuffer(markdown,meta,branding);
  const current=await loader()('lib/export/docx-builder/index.ts').markdownToDocxBuffer(markdown,meta,branding);
  assert.deepEqual(wordXml(current),wordXml(old));
  assert.match(wordXml(current)['word/document.xml'],/성명/);
});
test('electronic signature document preserves all signer fields and word XML',async()=>{
  const args={...meta,generatedAt:'2026-10-10 13:30',records:[{step:'승인',name:'A <person>',role:'QA',signedAt:'2026-10-10 12:30',esignMethod:'mfa',intentConfirmed:true}]};
  const old=await loader({before:true})('lib/export/signature-manifest.ts').buildSignatureManifestDocx(args);
  const current=await loader()('lib/export/signature-manifest.ts').buildSignatureManifestDocx(args);
  assert.deepEqual(wordXml(current),wordXml(old));assert.match(wordXml(current)['word/document.xml'],/A &lt;person&gt;/);
});
test('actual append output retains XML, template geometry and escaped data',async()=>{
  const args=[template,markdown,{noticeText:'Notice <tag> & "quoted"\u0001'}];
  const old=await loader({before:true})('lib/export/merge-into-template.ts').appendMarkdownToTemplate(...args);
  const current=await loader()('lib/export/merge-into-template.ts').appendMarkdownToTemplate(...args);
  assert.deepEqual(wordXml(current),wordXml(old));
  const xml=wordXml(current)['word/document.xml'];assert.match(xml,/w:w="11906" w:h="16838"/);assert.match(xml,/Notice &lt;tag&gt; &amp; &quot;quoted&quot;/);assert.doesNotMatch(xml,/\u0001/);
});
test('central physical typography, border, margin and append palette mutations reach real XML',async()=>{
  const output=structuredClone(canonical);output.fontHalfPoint.vf5ca38f748=25;output.pageMarginInch.v6b86b273ff=1.25;output.borderEighthPoint.v4b227777d4=7;
  output.appendFontHalfPoint.ve29c9c180c=38;output.appendColor.v411198eebf='123456';
  const current=loader({output});
  const doc=wordXml(await current('lib/export/docx-builder/index.ts').markdownToDocxBuffer(markdown,meta));
  assert.match(doc['word/styles.xml'],/<w:sz w:val="25"/);assert.match(doc['word/document.xml'],/w:top="1800"/);assert.match(doc['word/document.xml'],/w:sz="7"/);
  const append=wordXml(await current('lib/export/merge-into-template.ts').appendMarkdownToTemplate(template,'# Heading'))['word/document.xml'];
  assert.match(append,/<w:sz w:val="38"/);assert.match(append,/<w:color w:val="123456"/);
});
function qrRoute(options={}){
  const calls=[];const actualQr=requireQA('qrcode');let user=options.user===false?null:{id:'fixture-user'};
  const query=value=>({select(){return this;},eq(){return this;},async maybeSingle(){return {data:value};}});
  const ResponseStub=class {constructor(body,init){this.body=body;Object.assign(this,init);}static json(body,init){return new this(body,init);}};
  const stubs={'next/server':{NextResponse:ResponseStub},'@/lib/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})},from:()=>query({job_role:'admin'})}),createAdminClient:()=>({from:()=>query({token:'fixture+token',invited_name:'Example'})})},'@/lib/permissions/has-role':{isActiveAdmin:()=>options.admin!==false},'@/lib/email':{appUrl:relative=>'https://example.test'+relative},qrcode:{toBuffer:async(text,config)=>{calls.push({text,config});return actualQr.toBuffer(text,config);}}};
  return {calls,GET:loader({before:options.before,output:options.output,stubs})('app/api/admin/expert-invites/[id]/qr/route.ts').GET};
}
async function qr(options={},query=''){const route=qrRoute(options);const response=await route.GET(new Request('http://localhost/api/qr'+query),{params:Promise.resolve({id:'fixture'})});return {...route,response};}
test('actual QR route preserves pixels and authorization, including bounded custom sizes and themes',async()=>{
  for(const query of ['', '?size=20&theme=dark','?size=4096']){
    const old=await qr({before:true},query),current=await qr({},query);
    assert.equal(current.response.status,200);assert.deepEqual(current.response.body,old.response.body);assert.equal(JSON.stringify(current.calls),JSON.stringify(old.calls));
    assert.match(current.calls[0].text,/invite=fixture%2Btoken$/);
  }
  for(const options of [{user:false},{admin:false}]){const value=await qr(options);assert.equal(value.response.status,options.user===false?401:403);assert.equal(value.calls.length,0);}
});
test('central QR size and palette mutations reach actual PNG encoding without changing security',async()=>{
  const output=structuredClone(canonical);Object.assign(output.qr,{defaultSize:384,margin:4,ink:'#123456',paper:'#f0f0f0'});
  const result=await qr({output});assert.equal(result.response.body.readUInt32BE(16),384);assert.equal(result.response.body.readUInt32BE(20),384);
  assert.equal(result.calls[0].config.margin,4);assert.equal(result.calls[0].config.color.dark,'#123456');assert.equal(result.calls[0].config.errorCorrectionLevel,'H');
});
