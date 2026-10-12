import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
import {compile} from './maison-layout-tokens.mjs';
const root='D:/Claude/Q-Design',product='D:/Claude/Q-Works',req=createRequire(product+'/package.json'),ts=req('typescript');
export function choiceColumnTokens(value){
 const tokens=value.trim().split(/\s+/);if(!tokens.length||tokens.some(t=>!/^(?:(?:sm|md|lg|xl|2xl):)?grid-cols-(?:[1-9]|1[0-2])$/.test(t)))return null;
 return tokens;
}
export async function createMaisonChoiceColumnsReview(){
 const file='components/shared/choice-boxes.tsx',canonical='patterns/component-implementations/maison/'+file;
 const actual=fs.readFileSync(product+'/'+file,'utf8'),owned=fs.readFileSync(root+'/'+canonical,'utf8');assert.equal(hash(actual),hash(owned));
 assert(actual.includes('responsiveChoiceGrid(cols,')&&actual.includes('qd-choice-hit qd-selection-row')&&actual.includes('className="qd-radio"'));
 const config=ts.readConfigFile(product+'/tsconfig.json',ts.sys.readFile),options=ts.parseJsonConfigFileContent(config.config,ts.sys,product),program=ts.createProgram(runtimeFiles(product).filter(f=>/\.[jt]sx?$/.test(f)).map(f=>product+'/'+f),{...options.options,noEmit:true,incremental:false}),checker=program.getTypeChecker();
 const main=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),records=[];
 for(const row of main.records.filter(r=>r.kind==='presentation-attribute'&&r.property==='cols')){
  const sf=program.getSourceFile(product+'/'+row.path);if(!sf)continue;const nodes=[];const visit=n=>{if(ts.isJsxAttribute(n)&&n.name.text==='cols'&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===row.line&&n.initializer?.getText(sf)===row.value)nodes.push(n);ts.forEachChild(n,visit);};visit(sf);if(nodes.length!==1)continue;
  const n=nodes[0];if(!ts.isStringLiteral(n.initializer))continue;const tokens=choiceColumnTokens(n.initializer.text);if(!tokens)continue;
  let symbol=checker.getSymbolAtLocation(n.parent.parent.tagName);if(symbol?.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);
  const decl=symbol?.declarations?.find(ts.isFunctionDeclaration);if(!decl||path.relative(product,decl.getSourceFile().fileName).replaceAll('\\','/')!==file||!['ChoiceBoxes','ChoiceGrid'].includes(decl.name?.text))continue;
  const compiled=await compile(tokens);for(const token of tokens){const count=Number(token.match(/(\d+)$/)[1]);assert.deepEqual(compiled.get(token),[['grid-template-columns',`repeat(${count}, minmax(0, 1fr))`]],'Only relative standard grid tracks may be delegated');}
  assert.equal(hash(fs.readFileSync(product+'/'+row.path,'utf8')),row.sourceHash);
  const evidence=[{path:row.path,line:row.line,hash:row.sourceHash},{path:file,line:decl.getSourceFile().getLineAndCharacterOfPosition(decl.getStart()).line+1,hash:hash(actual)},{path:canonical,line:1,hash:hash(owned)},{path:'patterns/foundation/maison-tailwind.ts',line:1,hash:hash(fs.readFileSync(root+'/patterns/foundation/maison-tailwind.ts','utf8'))},{path:'lib/design/q-design-tailwind.ts',line:1,hash:hash(fs.readFileSync(product+'/lib/design/q-design-tailwind.ts','utf8'))}];
  records.push({path:row.path,line:row.line,sourceHash:row.sourceHash,argumentHash:row.argumentHash,value:row.value,decision:'delegated-renderer-parameter',ruleId:'exact-choice-relative-columns',consumer:file+'#'+decl.name.text,reason:'Exact symbol-resolved canonical choice renderer consumes only named relative grid track counts. Actual Tailwind declarations are verified, including responsive variants. The shared renderer supplies the narrow-screen folding rule; font, shape, hit area and surfaces use central roles. Absolute/arbitrary classes, different renderers and print-table percentages remain unapproved.',tokens,evidence});
 }
 return {version:1,scope:'Exact current named choice-column inputs only. No parameter-name or renderer-wide approval; print geometry and arbitrary classes remain separate candidates.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){
 const report=await createMaisonChoiceColumnsReview(),file=root+'/reviews/maison-choice-columns-review.json';
 if(process.argv.includes('--write'))fs.writeFileSync(file,JSON.stringify(report,null,2)+'\n');else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),report);
 console.log(JSON.stringify({records:report.records.length,passed:true}));
}
