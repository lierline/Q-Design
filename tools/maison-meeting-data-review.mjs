import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {hash} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',repo='D:/Claude/Q-Works',ref='d96a51695b94db5f3652aba6683bada9989e6430',tool='tools/maison-meeting-data-review.mjs',form='app/(app)/meetings/meeting-form.tsx';
const dependencies=[form,'lib/validators/registers.ts','app/(app)/meetings/actions.ts','tsconfig.json'],ts=createRequire(repo+'/package.json')('typescript');
const fields={action:['task','owner','due_date','done'],agenda:['title','department_ids','detail','discussion','follow_ups'],follow:['department_ids','task'],common:['title','meeting_type','department_id','held_on','issued_on','overview_topics','special_notes','location','attendee_user_ids','agenda_items','action_items','notes']};
const targets=[[167,'a','action'],[167,'p','action'],[172,'a','agenda'],[172,'p','agenda'],[180,'a','agenda'],[182,'f','follow'],[182,'p','follow'],[193,'a','agenda'],[202,'a','agenda'],[211,'a','agenda'],[221,'a','agenda'],[224,'f','follow'],[254,'a','agenda'],[260,'f','follow'],[266,'common','common']];
export function inspectMeetingData(overrides={}){
 const texts=new Map(dependencies.map(p=>[p,overrides[p]??fs.readFileSync(repo+'/'+p,'utf8')]));
 for(const[p,text]of texts)assert.equal(hash(text),hash(execFileSync('git',['show',ref+':'+p],{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024})),'Unreviewed meeting producer or consumer: '+p);
 const config=ts.readConfigFile(repo+'/tsconfig.json',ts.sys.readFile).config,options=ts.parseJsonConfigFileContent(config,ts.sys,repo).options,program=ts.createProgram([repo+'/'+form],{...options,noEmit:true,incremental:false}),checker=program.getTypeChecker(),sf=program.getSourceFile(repo+'/'+form);assert(sf);
 const spreads=[],calls=[];const visit=n=>{if(ts.isSpreadAssignment(n))spreads.push(n);if(ts.isCallExpression(n))calls.push(n);ts.forEachChild(n,visit);};visit(sf);
 const sites=targets.map(([line,value,group])=>{const found=spreads.filter(n=>sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===line&&n.expression.getText(sf)===value);assert.equal(found.length,1);const n=found[0],type=checker.getTypeAtLocation(n.expression);assert(!(type.flags&(ts.TypeFlags.Any|ts.TypeFlags.Unknown)));const keys=checker.getPropertiesOfType(type).map(p=>p.name).sort();assert.deepEqual(keys,[...fields[group]].sort());assert(ts.isObjectLiteralExpression(n.parent));return{line,value,group,keys};});
 for(const name of ['createMeeting','updateMeeting']){
  const call=calls.find(n=>ts.isIdentifier(n.expression)&&n.expression.text===name);assert(call);let symbol=checker.getSymbolAtLocation(call.expression);assert(symbol);if(symbol.flags&ts.SymbolFlags.Alias)symbol=checker.getAliasedSymbol(symbol);assert(symbol.declarations.some(d=>d.getSourceFile().fileName.replaceAll('\\','/').endsWith('/app/(app)/meetings/actions.ts')));
  if(name==='createMeeting')assert.equal(call.arguments[0].getText(sf),'common');else assert.equal(call.arguments[0].getText(sf),'{ id: existing.id, ...common }');
 }
 const actions=texts.get('app/(app)/meetings/actions.ts');assert(actions.includes('schema: meetingSchema'));assert(actions.includes('schema: updateMeetingSchema'));
 for(const property of ['agenda_items','action_items','special_notes','overview_topics','notes'])assert(actions.includes('input.'+property));
 return{texts,sites};
}
export function createMeetingDataReview(){
 const {texts,sites}=inspectMeetingData(),current=JSON.parse(fs.readFileSync(root+'/reviews/maison-style-decisions.json','utf8')),evidence=[...[...texts].map(([p,text])=>({path:p,line:1,hash:hash(text)})),{path:tool,line:1,hash:hash(fs.readFileSync(root+'/'+tool,'utf8'))}];
 const records=sites.map(site=>{const rows=current.records.filter(r=>r.path===form&&r.line===site.line&&r.kind==='object-spread'&&r.value===site.value);assert.equal(rows.length,1);const r=rows[0];return{path:r.path,line:r.line,value:r.value,sourceHash:r.sourceHash,argumentHash:r.argumentHash,decision:'business-data',ruleId:'symbol-resolved-meeting-record-data',reason:'This exact spread composes typed '+site.group+' meeting record fields ('+site.keys.join(', ')+'). The same form submits its common record to symbol-resolved createMeeting and updateMeeting actions, whose pinned schemas and handlers consume the agenda, follow-up and action fields. It does not construct an element style. No other source or spread is approved.',evidence};});
 assert.equal(records.length,15);return{version:1,productRef:ref,scope:'Fifteen exact meeting record spreads. Full producers, types, schemas and actual submit consumers are pinned. No database code is executed.',records};
}
if(path.resolve(process.argv[1]??'')===fileURLToPath(import.meta.url)){const result=createMeetingDataReview(),file=root+'/reviews/maison-meeting-data-review.json';if(process.argv.includes('--write')){assert(!fs.existsSync(file));fs.writeFileSync(file,JSON.stringify(result,null,2)+'\n');}else assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')),result);console.log(JSON.stringify({records:15,passed:true}));}
