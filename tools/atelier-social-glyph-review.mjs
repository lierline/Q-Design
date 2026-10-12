// Exact authored glyphs are distinct from displayed control dimensions.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,scanArguments,cssProperties} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design', product='D:/Claude/Q-Atelier';
const req=createRequire(product+'/package.json');
export const ts=req('typescript');
const postcss=req('postcss');
export const glyphPath='app/(auth)/login/page.tsx';
const functionHash='48eaaa87502dfa690eecbc7139d2fcfb4af15be9b4b392f4a23dc303f4fc6f92';
const read=p=>fs.readFileSync(p,'utf8');
const properties=cssProperties(ts,read(path.join(path.dirname(req.resolve('typescript')),'lib.dom.d.ts')));
const imports={QDPresentation:'@/lib/design/q-design-runtime',QDScale:'@/lib/design/q-design-scale',QDText:'@/lib/design/q-design-labels',T:'@/lib/design/tokens'};
export function inspectSocialGlyphs(code){
 const sf=ts.createSourceFile(glyphPath,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 assert.deepEqual(sf.parseDiagnostics,[]);
 const functions=sf.statements.filter(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='SocialLinks');
 assert.equal(functions.length,1);
 const fn=functions[0];
 const canonical=ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf);
 assert.equal(hash(canonical),functionHash,'SocialLinks behavior, glyph or style changed. Fresh inspection required.');
 const program=ts.createProgram([product+'/'+glyphPath],{noLib:true,noEmit:true,types:[],jsx:ts.JsxEmit.Preserve,moduleResolution:ts.ModuleResolutionKind.Bundler,module:ts.ModuleKind.ESNext},{...ts.createCompilerHost({}),getSourceFile:(name,version)=>name.replaceAll('\\','/').endsWith('/'+glyphPath)?ts.createSourceFile(name,code,version,true,ts.ScriptKind.TSX):undefined});
 const bound=program.getSourceFile(product+'/'+glyphPath), checker=program.getTypeChecker();
 const declarations=new Map();
 for(const statement of bound.statements.filter(ts.isImportDeclaration))for(const el of statement.importClause?.namedBindings?.elements??[]){
  if(el.name.text in imports){assert.equal(statement.moduleSpecifier.text,imports[el.name.text]);assert.equal((el.propertyName??el.name).text,el.name.text);assert(!declarations.has(el.name.text),'Duplicate central import');declarations.set(el.name.text,checker.getSymbolAtLocation(el.name));}
 }
 assert.equal(declarations.size,4);
 const boundFn=bound.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text==='SocialLinks');
 const check=n=>{if(ts.isIdentifier(n)&&declarations.has(n.text))assert(checker.getSymbolAtLocation(n)===declarations.get(n.text),'Shadowed central input');ts.forEachChild(n,check);};check(boundFn);
 const attributes=[];
 const visit=n=>{
  if(ts.isJsxAttribute(n)&&n.initializer){
   const element=n.parent.parent,tag=element.tagName.getText(sf),prop=n.name.getText(sf);
   const geometry=['viewBox','d','rx','x','y','cx','cy','r'].includes(prop);
   const paint=['fill','stroke'].includes(prop);
   const innerDimension=tag==='rect'&&['width','height'].includes(prop);
   if(['svg','path','rect','circle'].includes(tag)&&(geometry||paint||innerDimension)){
    assert(ts.isStringLiteral(n.initializer),'Only exact static inner glyph attributes qualify');
    attributes.push({line:sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1,property:prop,value:n.initializer.getText(sf),tag,geometry:geometry||innerDimension});
   }
  }
  ts.forEachChild(n,visit);
 };visit(fn);
 assert.equal(attributes.length,19);
 return {sf,fn,canonical,attributes};
}
export function createSocialGlyphReview(){
 const code=read(product+'/'+glyphPath),sourceHash=hash(code),inspection=inspectSocialGlyphs(code);
 const argumentsFound=scanArguments(glyphPath,code,{ts,postcss,properties});
 const inputs=['lib/design/q-design-runtime.ts','lib/design/q-design-scale.ts','lib/design/q-design-labels.ts','lib/design/tokens.ts'];
 const evidence=[{path:glyphPath,line:inspection.sf.getLineAndCharacterOfPosition(inspection.fn.getStart(inspection.sf)).line+1,hash:sourceHash},...inputs.map(p=>({path:p,line:1,hash:hash(read(product+'/'+p))}))];
 const runtime=read(root+'/source/design/atelier-runtime.ts');
 assert(read(product+'/lib/design/q-design-runtime.ts').replaceAll('\r\n','\n').endsWith(runtime.replaceAll('\r\n','\n')),'Central runtime copy changed');
 evidence.push({path:'source/design/atelier-runtime.ts',line:1,hash:hash(runtime)});
 const records=inspection.attributes.map(attr=>{
  const matches=argumentsFound.filter(r=>r.line===attr.line&&r.property===attr.property&&r.value===attr.value);
  assert.equal(matches.length,1,'Exact raw argument required');const argument=matches[0];
  return {path:glyphPath,line:attr.line,sourceHash,argumentHash:hash(JSON.stringify(argument)),kind:argument.kind,property:attr.property,value:attr.value,tag:attr.tag,decision:attr.geometry?'coordinate-boundary':'structural-behavior',ruleId:'exact-authored-social-glyph',reason:attr.geometry?'This exact attribute is an internal coordinate of the inspected 24-unit authored SVG glyph. Displayed size and stroke use QDPresentation; the link radius uses QDScale. The glyph coordinate is not the screen control radius.':'This exact native SVG paint value is none or currentColor. The inspected link inherits T.muted and changes to T.champagne on hover. This is paint transport or a reset, not an independently authored color.',evidence};
 });
 return {version:1,scope:'SocialLinks only. No approval of other SVGs, GitHub sign-in glyphs, caller styles, class names or arbitrary coordinates. Two old inner-rect reviews remain archived; this fresh record takes effect only with current whole-source evidence.',functionHash,records};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createSocialGlyphReview(),target=root+'/reviews/atelier-social-glyph-review.json';
 if(process.argv.includes('--write'))fs.writeFileSync(target,JSON.stringify(report,null,2)+'\n');
 else assert.deepEqual(JSON.parse(read(target)),report,'Stale social glyph proof');
 console.log(JSON.stringify({records:report.records.length,geometry:report.records.filter(r=>r.decision==='coordinate-boundary').length}));
}
