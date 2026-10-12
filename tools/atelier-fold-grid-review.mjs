// Exact reviewed foldGrid consumers. Numeric visual defaults are never approved locally.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {PARTS} from './sync-parts.mjs';
import {centralOutputs,copyProblems} from './audit-coverage-core.mjs';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {collectAdapterReferences,expressionProof,importedReference,localBindings,sourceImports} from './atelier-style-proof.mjs';
import {responsiveProfilePath,assertResponsiveProfile} from './atelier-profile-responsive-source.mjs';

export const REVIEWED_FOLD_GRID='a97993e2adaa3630523b3ca329914e669bc1fe634049dc41c9c0af6af492f802';
export function verifyFoldGridBody(ts,fn,sf){
 if(hash(ts.createPrinter({removeComments:true}).printNode(ts.EmitHint.Unspecified,fn,sf))!==REVIEWED_FOLD_GRID)throw new Error('foldGrid implementation needs renewed semantic review');
}
export function proveFoldGridArguments({ts,call,sf,reference}){
 if(call.arguments.length<2||call.arguments.length>3)return null;
 const [count,gap,options]=call.arguments;
 if(!ts.isNumericLiteral(count)||![2,3].includes(Number(count.text)))return null;
 const central=(node,family)=>{
  if(!new RegExp('^QD'+family+'$').test(node.getText(sf)))return null;
  return reference(node.getText(sf));
 };
 const gapProof=central(gap,'Scale\\.space\\[\\d+(?:\\.\\d+)?\\]');if(!gapProof)return null;
 const inputs=[{name:'columns',value:count.getText(sf),meaning:'Structural maximum track count. The responsive algorithm divides available width by this count, without supplying a visual length.'},{name:'gap',value:gap.getText(sf),meaning:'Central CSS spacing scale; authored pixel gaps are rejected.'}];
 const evidence=[...gapProof];
 if(options){
  if(!ts.isObjectLiteralExpression(options))return null;
  const seen=new Set();
  for(const member of options.properties){
   if(!ts.isPropertyAssignment(member)||!ts.isIdentifier(member.name)||seen.has(member.name.text))return null;
   seen.add(member.name.text);
   const name=member.name.text;
   if(!['min','rowGap'].includes(name))return null;
   const proof=central(member.initializer,name==='min'?'Presentation\\.gridMinColumn\\[\\d+\\]':'Scale\\.space\\[\\d+(?:\\.\\d+)?\\]');
   if(!proof)return null;
   evidence.push(...proof);inputs.push({name,value:member.initializer.getText(sf),meaning:name==='min'?'Minimum column width is imported from the verified canonical numeric presentation source.':'Independent row gap is a central CSS spacing scale reference.'});
  }
 }
 return {inputs,evidence};
}

export function createFoldGridReview(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../Q-Atelier')){
 const qd=path.resolve(root,'../Q-Design'),req=createRequire(path.join(root,'package.json')),ts=req('typescript'),postcss=req('postcss');
 const files=runtimeFiles(root).filter(file=>/\.[jt]sx?$/.test(file)),texts=new Map(files.map(file=>[file,fs.readFileSync(path.join(root,file),'utf8')]));
 const config=ts.readConfigFile(path.join(root,'tsconfig.json'),ts.sys.readFile),parsed=ts.parseJsonConfigFileContent(config.config,ts.sys,root);
 const program=ts.createProgram(files.map(file=>path.join(root,file)),{...parsed.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const resolve=node=>{let symbol=checker.getSymbolAtLocation(node);while(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);return symbol;};
 const line=(sf,node)=>sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1;
 const own=(file,at=1)=>({path:file,line:at,hash:hash(texts.get(file))});
 const helperFile='lib/design/components.tsx',helperSF=program.getSourceFile(path.join(root,helperFile));
 const fn=helperSF.statements.find(node=>ts.isFunctionDeclaration(node)&&node.name?.text==='foldGrid');if(!fn)throw new Error('Missing foldGrid');
 verifyFoldGridBody(ts,fn,helperSF);const helperSymbol=resolve(fn.name);
 const variables=new Map();
 for(const file of ['patterns/foundation.css','patterns/foundation/atelier.css','patterns/foundation/atelier-values.css','patterns/foundation/atelier-core-values.css','patterns/components.css','dist/q-design.palette.atelier.css']){
  const code=fs.readFileSync(path.join(qd,file),'utf8');postcss.parse(code).walkDecls(decl=>{if(decl.prop.startsWith('--')&&!variables.has(decl.prop))variables.set(decl.prop,{path:file,line:decl.source.start.line,hash:hash(code),variable:decl.prop});});
 }
 const copies=new Map(centralOutputs(PARTS,'Q-Atelier',root).map(part=>[part.path,part])),centralFiles=new Map();
 for(const file of ['lib/design/q-design-runtime.ts']){
  const part=copies.get(file);if(!part)throw new Error('Missing central runtime PARTS entry');
  const canonical=fs.readFileSync(path.join(qd,part.src),'utf8');
  if(copyProblems(part,canonical,texts.get(file)).length)throw new Error('Unverified central runtime copy');
  centralFiles.set(file,{path:part.src,line:1,hash:hash(canonical)});
 }
 const refs=collectAdapterReferences({ts,files:new Map(['lib/design/tokens.ts','lib/design/q-design-scale.ts','lib/design/q-design-runtime.ts'].map(file=>[file,texts.get(file)])),variables,hash,numericFiles:new Set(['lib/design/q-design-runtime.ts']),centralFiles});
 const helperImports=sourceImports(ts,helperSF),defaultEvidence=[];
 for(const name of ['QDRuntime.grid.foldMinColumn','QDRuntime.grid.roundingAllowance']){
  const proof=importedReference(name,helperImports,helperFile,refs);if(!proof)throw new Error('Unproven foldGrid numeric default '+name);defaultEvidence.push(...proof);
 }
 const report=JSON.parse(fs.readFileSync(path.join(qd,'reviews/atelier-style-decisions.json'),'utf8')),argumentsByPath=new Map();
 for(const record of report.records){const rows=argumentsByPath.get(record.path)??[];rows.push(record);argumentsByPath.set(record.path,rows);}
 const calls=[],records=new Map(),rejected=[];
 // Resolve whole-program identities before the isolated lexical checker binds
 // source nodes for sibling-property proofs.
 const targetCalls=new Set();
 for(const file of files){const sf=program.getSourceFile(path.join(root,file));if(!sf)continue;const visit=node=>{if(ts.isCallExpression(node)&&resolve(node.expression)===helperSymbol)targetCalls.add(node);ts.forEachChild(node,visit);};visit(sf);}
 for(const file of files){
  const sf=program.getSourceFile(path.join(root,file));if(!sf)continue;
  if(hash(sf.text.replace(/^\uFEFF/,''))!==hash(texts.get(file).replace(/^\uFEFF/,'')))throw new Error('Source changed while scanning '+file);
  const imports=sourceImports(ts,sf),locals=localBindings(ts,sf,hash),sourceHash=hash(texts.get(file));
  const match=(kind,at,value)=>(argumentsByPath.get(file)??[]).find(r=>r.sourceHash===sourceHash&&r.kind===kind&&r.line===at&&r.value===value);
  const visit=node=>{
   if(targetCalls.has(node)){
    // This closed parameterized call has its own exact source, caller and browser
    // proof. Keep the numeric-call catalog strict; do not accept other parameters.
    if(file===responsiveProfilePath&&node.getText(sf)==='foldGrid(cols, QDScale.space[2], { min: QDPresentation.choiceMinColumn[110] })'){assertResponsiveProfile(sf.text);return;}
    const proof=proveFoldGridArguments({ts,call:node,sf,reference:value=>importedReference(value,imports,file,refs)});
    let attribute=node.parent;while(attribute&&!ts.isJsxAttribute(attribute))attribute=attribute.parent;
    if(!proof||!attribute||attribute.name.getText(sf)!=='style'){rejected.push({path:file,line:line(sf,node),value:node.getText(sf),reason:'Unproven call argument or non-style consumer'});return;}
    const evidence=[own(file,line(sf,node)),own(helperFile,line(helperSF,fn)),...defaultEvidence,...proof.evidence];
    const call={path:file,line:line(sf,node),sourceHash,value:node.getText(sf),inputs:proof.inputs,styleLine:line(sf,attribute),context:attribute.parent.parent.getText(sf).slice(0,1200)};
    const add=(record,extra=[])=>{
     if(!record)throw new Error('Current ledger misses exact foldGrid consumer '+file+':'+line(sf,node));
     const entry={path:file,line:record.line,sourceHash,argumentHash:record.argumentHash,value:record.value,decision:'confirmed-style-composition',ruleId:'exact-fold-grid-consumer',reason:'Exact imported foldGrid implementation and all call inputs were reviewed. Maximum columns are structural counts; gap and optional rowGap use the central CSS spacing scale; minimum track width and rounding allowance use the verified canonical numeric presentation source. Other properties of an enclosing style object require independent proof.',evidence:[...new Map([...evidence,...extra].map(item=>[JSON.stringify(item),item])).values()]};
     records.set(JSON.stringify([file,record.line,record.argumentHash]),entry);
    };
    if(ts.isSpreadAssignment(node.parent))add(match('object-spread',line(sf,node.parent),node.getText(sf)));
    const expression=attribute.initializer?.expression;let outer=[];
    if(expression===node)outer=[];
    else if(expression&&ts.isObjectLiteralExpression(expression)){
     for(const member of expression.properties){
      if(ts.isSpreadAssignment(member)&&member.expression===node)continue;
      if(!ts.isPropertyAssignment(member)){outer=null;break;}
      const memberProof=expressionProof({ts,node:member.initializer,sf,property:member.name.getText(sf),imports,file,references:refs,variables,locals});
      if(!memberProof){outer=null;break;}outer.push(...memberProof.evidence);
     }
    }else outer=null;
    if(outer)add(match('style-expression',line(sf,attribute),attribute.initializer.getText(sf)),outer);
    else call.enclosingStyle='Remaining style members need independent review; only the exact foldGrid spread is approved.';
    calls.push(call);
   }
   ts.forEachChild(node,visit);
  };visit(sf);
 }
 return {version:1,scope:'Exact source-bound responsive grid consumers. This is not approval of arbitrary imported helpers, literal gaps, raw minimum widths or subsequent edits.',reviewedHelperHash:REVIEWED_FOLD_GRID,calls,rejected,records:[...records.values()]};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const report=createFoldGridReview(),file=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../reviews/atelier-fold-grid-review.json');
 fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({calls:report.calls.length,records:report.records.length,rejected:report.rejected,outerUnproven:report.calls.filter(c=>c.enclosingStyle).map(c=>({path:c.path,line:c.line}))},null,2));
}
