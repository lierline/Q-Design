import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {scanNativeControls} from './atelier-native-controls.mjs';
import {reversePostNativeControls} from './atelier-migration-inverse.mjs';
const qa='D:/Claude/Q-Atelier',qd='D:/Claude/Q-Design',require=createRequire(qa+'/package.json');
const ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
const read=p=>fs.readFileSync(p,'utf8'),hash=s=>createHash('sha256').update(s.replaceAll('\r\n','\n')).digest('hex');
const manifest=JSON.parse(read(qd+'/reviews/atelier-native-control-migration.json'));
const before=JSON.parse(read(qd+'/reviews/atelier-native-controls-before.json'));
function load(source,globals={}){const exports={};vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,{exports,require,...globals});return exports;}
function parse(p,s=read(qa+'/'+p)){return ts.createSourceFile(p,s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);}
function inverse(row){let s=reversePostNativeControls(row.path,read(qa+'/'+row.path));assert.equal(hash(s),row.afterHash,row.path);for(const e of [...row.edits].reverse()){assert.equal(s.slice(e.start,e.start+e.after.length),e.after);s=s.slice(0,e.start)+e.before+s.slice(e.start+e.after.length);}assert.equal(hash(s),row.beforeHash,row.path+' unchanged non-style logic');return s;}

test('every native outline change has an exact consumer proof and preserves directives, callbacks and non-style source',()=>{
 assert.equal(manifest.summary.outlineDefinitions,71);assert.equal(manifest.summary.classes,89);
 for(const row of manifest.records){inverse(row);const sf=parse(row.path);assert.deepEqual(sf.parseDiagnostics,[]);if(sf.statements.some(n=>ts.isExpressionStatement(n)&&ts.isStringLiteral(n.expression)&&n.expression.text==='use client'))assert.equal(sf.statements[0].expression.text,'use client');for(const e of row.edits){assert.ok(['control-outline','shared-control-class'].includes(e.kind));if(e.kind==='control-outline'){assert.ok(e.consumers.every(c=>['input','select','textarea'].includes(c.tag)));assert.ok(e.after.includes('var(--qd-ctl)'));}}}
 assert.ok(before.candidates.every(c=>c.otherConsumers.length===0));
});

test('AST gate follows actual native style helpers and ignores card/Btn dividers and unused local objects',()=>{
 const tempRoot='D:/Claude/tmp',dir=fs.mkdtempSync(path.join(tempRoot,'qd-native-'));try{for(const d of ['app','components','lib'])fs.mkdirSync(path.join(dir,d));fs.writeFileSync(path.join(dir,'app','test.tsx'),[
 'const T={border:"divider",borderHi:"dividerHi",red:"red",champagne:"gold"};',
 'const base={border:`1px solid ${T.border}`};',
 'function field(){const unused={border:T.borderHi};return {...base,color:"inherit"};}',
 'const card={border:`1px solid ${T.border}`};',
 'const style={border:"var(--qd-ctl)"};',
 'export function Test(){return <><div style={card}/><Btn style={card}/><input style={field()}/><textarea style={{border:`1px solid ${true?T.red:T.border}`}}/><select style={style}/></>;}'].join('\n'));
 const out=scanNativeControls(dir);assert.equal(out.controls.length,3);assert.equal(out.candidates.length,2);assert.ok(out.candidates.every(c=>c.token==='T.border'));assert.ok(out.candidates.every(c=>c.otherConsumers.length===0));assert.equal(out.controls.find(c=>c.tag==='input').borders.length,1);
 }finally{assert.equal(path.resolve(path.dirname(dir)),path.resolve(tempRoot));assert.ok(path.basename(dir).startsWith('qd-native-'));fs.rmSync(dir,{recursive:true,force:true});}
});

test('all 303 actual native controls and forwarded In/Sel/Txt styles have no remaining divider outline',()=>{
 const after=scanNativeControls();assert.equal(after.controls.length,303);assert.equal(after.candidates.length,0);assert.equal(after.otherControlOverrides.length,0);
 const unresolved=after.controls.filter(r=>r.unresolved.length);assert.equal(unresolved.length,1);assert.equal(unresolved[0].path,'lib/design/components.tsx');assert.deepEqual(unresolved[0].unresolved,['style']);
 const native=after.controls.filter(r=>r.path==='app/(app)/research/[code]/reviews/page.tsx');assert.equal(native.length,3);for(const c of native){assert.match(c.className,/qa-input qd-input/);assert.match(c.style,/var\(--qd-ctl\)/);}
});

test('selected, dirty and rejection colours survive; the unselected outline follows the central control token',()=>{
 const cases=[['app/(app)/audit/filter-bar.tsx','selectedProduct'],['app/(app)/audit/filter-bar.tsx','selectedAction'],['app/(app)/settings/members/owner-member-editor.tsx','gradeDirty'],['app/(app)/settings/members/owner-member-editor.tsx','orgRoleDirty'],['components/AssessmentDocApprovalPanel.tsx','signAction'],['app/(app)/m/field-ui.tsx','value']];
 const T={champagne:'#aa8844',red:'#c97a7a',border:'#ddd',borderHi:'#bbb'};
 for(const [file,flag] of cases){const old=parse(file,inverse(manifest.records.find(r=>r.path===file))),now=parse(file);function find(sf){let value;function walk(n){if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='border'&&n.initializer.getText(sf).includes(flag)&&n.initializer.getText(sf).includes('qd-border-width'))value=n.initializer.getText(sf);ts.forEachChild(n,walk);}walk(sf);assert.ok(value,file);return value;}
  const a=find(old),b=find(now),active=flag==='signAction'?'reject':true,inactive=flag==='signAction'?'approve':false;
  assert.equal(vm.runInNewContext(a,{T,[flag]:active}),vm.runInNewContext(b,{T,[flag]:active}),file+' semantic active branch');
  const neutral=vm.runInNewContext(b,{T,[flag]:inactive});assert.match(neutral,/var\(--qd-ctl\)/);assert.notEqual(neutral.replace('var(--qd-ctl)','#123456'),neutral.replace('var(--qd-ctl)','#abcdef'));
 }
});

test('real reviews native elements keep editable values and callbacks with shared focus/disabled/placeholder classes',()=>{
 const file='app/(app)/research/[code]/reviews/page.tsx',sf=parse(file),nodes=[];function walk(n){if((ts.isJsxSelfClosingElement(n)||ts.isJsxElement(n))&&['input','select','textarea'].includes((ts.isJsxElement(n)?n.openingElement:n).tagName.getText(sf)))nodes.push(n);ts.forEachChild(n,walk);}walk(sf);assert.equal(nodes.length,3);
 const T={surface:'#111',text:'#eee'},changes=[];
 const tokens=load(read(qa+'/lib/design/tokens.ts'));const QDScale=load(read(qa+'/lib/design/q-design-scale.ts'),{require:n=>n==='./tokens'?tokens:require(n)}).QDScale;
 const globals={T,QDScale,raTextareaRef:{current:null},commentText:'First',setCommentText:v=>changes.push(v),target:'comment',kind:'correction',SUPPLEMENT_KIND_META:{},selectedDocId:'',setSelectedDocId:v=>changes.push(v),supplementDocs:[],getRegistryDoc:()=>null,replyText:'Reply',setReplyText:v=>changes.push(v),isReviewReq:false};
 for(const n of nodes){const {Control}=load('export function Control(){return ('+n.getText(sf)+');}',globals);const el=Control();assert.match(el.props.className,/qa-input qd-input/);assert.match(el.props.style.border,/var\(--qd-ctl\)/);el.props.onChange({target:{value:'edited'}});const html=renderToStaticMarkup(el);assert.match(html,/qa-input qd-input/);assert.match(html,/border:var\(--qd-border-width\) var\(--qd-atelier-border-style-5ed175bd8d\) var\(--qd-ctl\)/);}
 assert.deepEqual(changes,['edited','edited','edited']);
 const css=read(qd+'/patterns/components.css'),foundation=read(qd+'/patterns/foundation/atelier.css');assert.match(css,/\.qd-input::placeholder\s*\{[^}]*var\(--qd-muted\)/);assert.match(css,/\.qd-input:disabled/);assert.match(foundation,/\.qa-input:focus-visible/);
});

test('class-only role assignment selects receive the canonical control box without changing permission or option semantics',()=>{
 const postcss=require('postcss'),ast=postcss.parse(read(qd+'/patterns/foundation/atelier.css'));
 const rule=ast.nodes.find(n=>n.type==='rule'&&n.selector==='.qa-input');assert.ok(rule);const declarations=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 assert.equal(declarations['min-height'],'var(--qd-control-height)');assert.equal(declarations.padding,'var(--qd-space-2) var(--qd-space-3)');assert.equal(declarations.background,'var(--qd-surface)');assert.match(declarations.border,/var\(--qd-ctl\)/);assert.equal(declarations['font-size'],'var(--qd-control-size)');assert.ok(rule.nodes.every(n=>!n.important),'local inline scenario overrides remain supported');
 const resolve=(s,vars)=>s.replace(/var\((--[^)]+)\)/g,(_,key)=>vars[key]??key);assert.equal(resolve(declarations['min-height'],{'--qd-control-height':'48px'}),'48px');assert.equal(resolve(declarations.padding,{'--qd-space-2':'12px','--qd-space-3':'16px'}),'12px 16px');
 const file='app/(app)/settings/members/role-assignee-select.tsx',sf=parse(file),component=sf.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='RoleAssigneeSelect');assert.ok(component);
 const tokens=load(read(qa+'/lib/design/tokens.ts'));const QDScale=load(read(qa+'/lib/design/q-design-scale.ts'),{require:n=>n==='./tokens'?tokens:require(n)}).QDScale;
 const {RoleAssigneeSelect}=load(component.getText(sf),{QDScale,T:tokens.T,LABEL:{ra:'RA 담당',qa:'QA 담당'},useState:React.useState,useToast:()=>({success(){},error(){}}),InfoDot:()=>null,roleFamily:r=>r});
 const props={orgId:'local-only',initial:{},members:[{user_id:'ra1',full_name:'RA One',job_roles:['ra']},{user_id:'qa1',full_name:'QA One',job_roles:['qa']}],canEdit:true};const html=renderToStaticMarkup(React.createElement(RoleAssigneeSelect,props));assert.equal((html.match(/<select[^>]*class="qa-input"/g)??[]).length,2);assert.match(html,/RA One/);assert.match(html,/QA One/);assert.doesNotMatch(html,/<select[^>]*disabled/);
 const locked=renderToStaticMarkup(React.createElement(RoleAssigneeSelect,{...props,canEdit:false}));assert.equal((locked.match(/<select[^>]*disabled/g)??[]).length,2);
 const synced=postcss.parse(read(qa+'/app/q-design.foundation.css')).nodes.find(n=>n.type==='rule'&&n.selector==='.qa-input');assert.equal(synced.nodes.find(n=>n.prop==='min-height').value,'var(--qd-control-height)');
});
