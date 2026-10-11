import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {runtimeFiles} from './style-arguments-core.mjs';
import {reverseFiniteThird} from './atelier-migration-inverse.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const require=createRequire(qa+'/package.json'),ts=require('typescript'),postcss=require('postcss');
const read=p=>fs.readFileSync(p,'utf8');
const hash=s=>createHash('sha256').update(s.replaceAll('\r\n','\n')).digest('hex');
const manifest=JSON.parse(read(root+'/reviews/atelier-opaque-surfaces-migration.json'));
function declarations(){const vars=new Map();for(const f of ['patterns/components.css','patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css'])postcss.parse(read(root+'/'+f)).walkDecls(d=>{if(d.prop.startsWith('--')&&d.parent.type==='rule'&&d.parent.selector.split(',').some(s=>s.trim()===':root'))vars.set(d.prop,d.value);});return vars;}
function resolve(value,vars){for(let i=0;i<12;i++){const next=value.replace(/var\((--[\w-]+)\)/g,(_,name)=>{assert.ok(vars.has(name),'missing '+name);return vars.get(name);});if(next===value)return value;value=next;}throw Error('cyclic CSS');}
function header(isMobile){const exports={},react=require('react');
 const runtime={};vm.runInNewContext(ts.transpileModule(read(qa+'/lib/design/q-design-runtime.ts'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports:runtime,require});
 const deps={'react':{...react,useRef:()=>({current:null})},'@/lib/design/q-design-runtime':runtime,'@/lib/design/tokens':{T:{bg:'var(--qa-bg)'}},'@/lib/design/sticky-inset':{stickyTopInset:n=>-n,useScrollHostPadding:()=>({top:32,left:40,right:40,bottom:32})},'@/lib/hooks/useBreakpoints':{useBreakpoints:()=>({isMobile})}};
 const output=ts.transpileModule(read(qa+'/components/TopHeaderBand.tsx'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 vm.runInNewContext(output,{exports,require:name=>deps[name]??require(name)});return exports.TopHeaderBand;
}
test('mobile header covers the scrolled page without trapping child overlays or intercepting control clicks',()=>{
 const child={originalChildren:true},element=header(true)({children:child});
 const [plane,children]=element.props.children;
 assert.equal(children,child);assert.equal(plane.props.className,'qa-mobile-top-band');assert.equal(plane.props['aria-hidden'],'true');assert.equal(plane.props.style.zIndex,'var(--qd-atelier-mobile-header-layer)');
 const ast=postcss.parse(read(root+'/patterns/foundation/atelier.css'));
 const rule=ast.nodes.find(n=>n.type==='rule'&&n.selector==='.qa-mobile-top-band');
 const css=Object.fromEntries(rule.nodes.filter(n=>n.type==='decl').map(n=>[n.prop,n.value]));
 assert.equal(css.position,'fixed');assert.equal(css['pointer-events'],'none');assert.equal(css.background,'var(--qd-bg)');assert.equal(css.height,'var(--qd-atelier-mobile-header-height)');
 assert.ok(ast.nodes.some(n=>n.type==='atrule'&&n.name==='media'&&n.params==='print'&&n.toString().includes('.qa-mobile-top-band { display: none; }')));
});
test('desktop header preserves measured sticky offset, layout flow and child identity',()=>{
 const child={originalChildren:true},element=header(false)({children:child});
 assert.equal(element.props.children,child);assert.equal(element.props.style.top,-32);assert.equal(element.props.style.position,'sticky');assert.equal(element.props.style.margin,'-32px -40px 0 -40px');assert.equal(element.props.style.height,56);
});

test('mobile controls stay above the opaque band and below drawers while desktop layers are retained',()=>{
 const vars=declarations(),expressions=[];
 for(const name of ['BackButton','Sidebar','NotificationBell','SubscriptionIndicator']){
  const sf=ts.createSourceFile(name,read(qa+'/components/'+name+'.tsx'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  function visit(n){if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='zIndex'&&n.initializer.getText(sf).includes('--qd-atelier-mobile-control-layer'))expressions.push({name,expression:n.initializer.getText(sf)});ts.forEachChild(n,visit);}visit(sf);
 }
 assert.deepEqual(expressions.map(e=>e.name).sort(),['BackButton','NotificationBell','Sidebar','SubscriptionIndicator','SubscriptionIndicator'].sort());
 const tokenSource=ts.createSourceFile('tokens.ts',read(qa+'/lib/design/tokens.ts'),ts.ScriptTarget.Latest,true),layers={};
 function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(tokenSource)==='Z'){const value=ts.isAsExpression(n.initializer)?n.initializer.expression:n.initializer;assert.ok(ts.isObjectLiteralExpression(value));for(const p of value.properties)if(ts.isPropertyAssignment(p)&&ts.isNumericLiteral(p.initializer))layers[p.name.getText(tokenSource)]=Number(p.initializer.text);}ts.forEachChild(n,walk);}walk(tokenSource);
 const band=Number(resolve('var(--qd-atelier-mobile-header-layer)',vars));
 for(const {name,expression} of expressions){
  const actual=vm.runInNewContext(expression,{isMobile:true});
  const layer=Number(resolve(actual,vars));assert.ok(layer>band,name+' visible above band');assert.ok(layer<layers.drawerBackdrop,name+' below modal backdrop');
  if(name==='NotificationBell'||name==='SubscriptionIndicator')assert.equal(Number(resolve(vm.runInNewContext(expression,{isMobile:false}),vars)),name==='NotificationBell'?89:90);
  const changed=new Map(vars);changed.set('--qd-atelier-mobile-control-layer','550');assert.equal(Number(resolve(actual,changed)),550);
 }
});
test('mobile content and header share central height and safe area, and common changes propagate',()=>{
 const vars=declarations(),css=read(root+'/patterns/foundation/atelier.css');
 const before=resolve('var(--qd-atelier-mobile-header-height)',vars);assert.ok(before.includes('env(safe-area-inset-top, 0px)'));assert.match(before,/44px/);assert.match(before,/64px/);
 vars.set('--qd-control-height','52px');vars.set('--qd-space-3','16px');vars.set('--qd-mobile-header-height','72px');
 const changed=resolve('var(--qd-atelier-mobile-header-height)',vars);assert.match(changed,/52px/);assert.match(changed,/72px/);assert.match(changed,/16px \* 2/);
 assert.equal(resolve('var(--qd-atelier-top-02a3a6bea5)',vars),'calc(env(safe-area-inset-top, 0px) + 16px)');
 assert.equal((css.match(/padding: var\(--qd-atelier-mobile-header-height\)/g)??[]).length,2);
 assert.ok(css.includes('padding-top: var(--qd-atelier-mobile-header-height) !important'));
 for(const file of ['components/NotificationBell.tsx','components/SubscriptionIndicator.tsx'])assert.ok(read(qa+'/'+file).includes('var(--qd-atelier-mobile-control-top)'));
});
test('a textarea-only height override cannot become the mobile header control baseline',()=>{
 const vars=declarations(),ast=postcss.parse(read(root+'/patterns/components.css'));
 const textarea=ast.nodes.find(n=>n.type==='rule'&&n.selector==='textarea.qd-input');
 assert.ok(textarea.nodes.some(d=>d.prop==='--qd-control-height'&&d.value==='var(--qd-textarea-min-height)'));
 assert.equal(resolve('var(--qd-textarea-min-height)',vars),'80px');
 assert.equal(resolve('var(--qd-control-height)',vars),'44px');
});
test('backdrop and surface filters are centrally none and no live inline backdrop blur remains',()=>{
 const vars=declarations();assert.equal(vars.get('--qd-backdrop-filter'),'none');assert.equal(vars.get('--qd-surface-filter'),'none');
 const raw=[];
 for(const file of runtimeFiles(qa).filter(f=>/\.[jt]sx?$/.test(f))){
  const source=read(qa+'/'+file),sf=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
  function visit(n){if(ts.isPropertyAssignment(n)&&/^(?:backdropFilter|WebkitBackdropFilter)$/.test(n.name.getText(sf))&&ts.isStringLiteralLike(n.initializer)&&/blur\(/.test(n.initializer.text))raw.push(file);ts.forEachChild(n,visit);}visit(sf);
 }
 assert.deepEqual(raw,[]);
 for(const file of manifest.files){const source=read(qa+'/'+file.path);for(const match of source.matchAll(/(?:backdropFilter|WebkitBackdropFilter): '(var\(--qd-(?:backdrop|surface)-filter\))'/g))assert.equal(resolve(match[1],vars),'none');}
 vars.set('--qd-surface-filter','opacity(1)');assert.equal(resolve('var(--qd-surface-filter)',vars),'opacity(1)');
 assert.equal((read(qa+'/components/dashboard/CustomizableWidgetBoard.tsx').match(/background: T.surface,/g)??[]).length>=2,true);
 assert.ok(read(qa+'/app/experts/inbox/user-menu.tsx').includes("background: 'var(--ink)',"));
});
test('inverse of the precise appearance changes reproduces every earlier source hash',()=>{
 for(const file of manifest.files){let current=reverseFiniteThird(file.path,read(qa+'/'+file.path));assert.equal(hash(current),file.afterHash,file.path+' current');
  for(const change of manifest.changes.filter(c=>c.path===file.path).reverse()){
   assert.equal(current.split(change.after).length-1,change.count,file.path+' replacement count');current=current.replaceAll(change.after,change.before);
  }
  assert.equal(hash(current),file.beforeHash,file.path+' handlers and data unchanged');
 }
});
