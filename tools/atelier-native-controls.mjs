import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const qa='D:/Claude/Q-Atelier';
const ts=createRequire(qa+'/package.json')('typescript');
const hash=s=>createHash('sha256').update(s.replaceAll('\r\n','\n')).digest('hex');
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):/\.[jt]sx?$/.test(e.name)&&!/(?:\.test|\.spec|\.d)\.[jt]sx?$/.test(e.name)?[path.join(dir,e.name)]:[]);}
export function scanNativeControls(root=qa){
 const all=['app','components','lib'].flatMap(d=>files(path.join(root,d)));
 const program=ts.createProgram(all,{noLib:true,noResolve:true,allowJs:true,jsx:ts.JsxEmit.Preserve,target:ts.ScriptTarget.Latest});
 const checker=program.getTypeChecker(),controls=[], candidates=new Map(), others=[];
 function resolve(n){let sym=checker.getSymbolAtLocation(n);if(sym?.flags&ts.SymbolFlags.Alias){try{sym=checker.getAliasedSymbol(sym);}catch{}}return sym?.declarations??[];}
 const loc=n=>{const sf=n.getSourceFile();return {path:path.relative(root,sf.fileName).replaceAll('\\','/'),line:sf.getLineAndCharacterOfPosition(n.getStart()).line+1,start:n.getStart(),sourceHash:hash(sf.text)};};
 function tokens(n){const out=[];function v(x){if(ts.isPropertyAccessExpression(x)&&x.expression.getText()==='T'&&['border','borderHi'].includes(x.name.text))out.push(x);else ts.forEachChild(x,v);}v(n);return out;}
 function trace(n,found,unresolved,seen=new Set(),mode='style'){
  if(!n||seen.has(n))return;seen.add(n);
  if(ts.isParenthesizedExpression(n)||ts.isAsExpression(n)||ts.isSatisfiesExpression(n)||ts.isNonNullExpression(n)||ts.isJsxExpression(n)){trace(n.expression,found,unresolved,seen,mode);return;}
  if(mode==='style'&&ts.isBlock(n)){const returns=x=>{if(x!==n&&ts.isFunctionLike(x))return;if(ts.isReturnStatement(x))trace(x.expression,found,unresolved,seen,mode);else ts.forEachChild(x,returns);};returns(n);return;}
  if(ts.isIdentifier(n)){
   const decls=resolve(n);if(!decls.length){unresolved.add(n.getText());return;}
   for(const d of decls){if(d.initializer)trace(d.initializer,found,unresolved,seen,mode);else if(d.body)trace(d.body,found,unresolved,seen,mode);else unresolved.add(n.getText());}return;
  }
  if(ts.isCallExpression(n)){
   if(ts.isIdentifier(n.expression)){const ds=resolve(n.expression);for(const d of ds){if(d.body)trace(d.body,found,unresolved,seen,mode);if(d.initializer)trace(d.initializer,found,unresolved,seen,mode);}if(!ds.length)unresolved.add(n.expression.getText());}
   else unresolved.add(n.expression.getText());return;
  }
  if(ts.isPropertyAssignment(n)&&/^border(?:Color|Top|Bottom|Left|Right|Inline|Block)?$/.test(n.name.getText().replaceAll(/['"]/g,''))){
   for(const t of tokens(n.initializer))found.set(t.getStart()+':'+t.getSourceFile().fileName,{...loc(t),token:t.getText(),property:n.name.getText(),style:n.getText()});return;
  }
  if(mode==='style'&&ts.isPropertyAssignment(n))return;
  if(mode==='style'&&ts.isPropertyAccessExpression(n)){for(const d of resolve(n.name))if(d.initializer)trace(d.initializer,found,unresolved,seen,mode);return;}
  if(mode==='style'&&ts.isConditionalExpression(n)){trace(n.whenTrue,found,unresolved,seen,mode);trace(n.whenFalse,found,unresolved,seen,mode);return;}
  if(mode==='event'&&ts.isBinaryExpression(n)&&n.operatorToken.kind===ts.SyntaxKind.EqualsToken&&/\.style\.border(?:Color|Top|Bottom|Left|Right)?$/.test(n.left.getText()))for(const t of tokens(n.right))found.set(t.getStart()+':'+t.getSourceFile().fileName,{...loc(t),token:t.getText(),property:n.left.getText(),style:n.getText()});
  ts.forEachChild(n,c=>trace(c,found,unresolved,seen,mode));
 }
 for(const file of all){const sf=program.getSourceFile(file);if(!sf)continue;function visit(n){
  if(ts.isJsxOpeningElement(n)||ts.isJsxSelfClosingElement(n)){
   const native=['input','textarea','select'].includes(n.tagName.getText());
   const attrs=n.attributes.properties,style=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.text==='style'),found=new Map(),unresolved=new Set();
   if(style?.initializer)trace(style.initializer,found,unresolved);
   const events=[];for(const a of attrs)if(ts.isJsxAttribute(a)&&['onFocus','onBlur','onMouseEnter','onMouseLeave'].includes(a.name.text)&&a.initializer){const f=new Map();trace(a.initializer,f,new Set(),new Set(),'event');for(const hit of f.values())events.push({...hit,event:a.name.text});}
   const type=attrs.find(a=>ts.isJsxAttribute(a)&&a.name.text==='type')?.initializer?.getText()??'"text"';
   const row={...loc(n),tag:n.tagName.getText(),type,className:attrs.find(a=>ts.isJsxAttribute(a)&&a.name.text==='className')?.initializer?.getText()??null,style:style?.initializer?.getText()??null,unresolved:[...unresolved],borders:[...found.values()],events};if(native)controls.push(row);else if(found.size||events.length)others.push(row);
   if(native)for(const hit of [...row.borders,...events]){const key=hit.path+':'+hit.start;const c=candidates.get(key)??{...hit,consumers:[]};c.consumers.push({path:row.path,line:row.line,tag:row.tag,type:row.type,mode:hit.event??'style'});candidates.set(key,c);}
  }ts.forEachChild(n,visit);
 }visit(sf);}
 for(const c of candidates.values())c.otherConsumers=others.filter(r=>r.borders.some(b=>b.path===c.path&&b.start===c.start)).map(r=>({path:r.path,line:r.line,tag:r.tag}));
 return {version:1,otherControlOverrides:others.filter(r=>['In','Sel','Txt'].includes(r.tag)),scope:'Actual native JSX input/textarea/select in runtime app/components/lib; direct styles and same-program lexical style helpers, with unresolved imports/parameters retained explicitly.',controls,candidates:[...candidates.values()]};
}
if(process.argv[1]&&fileURLToPath(import.meta.url)===path.resolve(process.argv[1])){const report=scanNativeControls(process.argv.find(a=>a.startsWith('--root='))?.slice(7)??qa);const out=process.argv.find(a=>a.startsWith('--out='))?.slice(6);if(out&&process.argv.includes('--check'))throw new Error('--check is read-only; omit --out');if(out)fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check')&&(report.candidates.length||report.otherControlOverrides.length))process.exitCode=1;console.log(JSON.stringify({controls:report.controls.length,candidates:report.candidates.length,files:new Set(report.candidates.map(r=>r.path)).size,unresolved:report.controls.filter(r=>r.unresolved.length).length}));for(const c of report.candidates)console.log(c.path+':'+c.line+' '+c.token+' '+c.property+' -> '+c.consumers.map(x=>x.tag+':'+x.line).join(','));}
