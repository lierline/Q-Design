// Reviewed residual screen defaults. No engine token or business data is edited.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {hash} from './style-arguments-core.mjs';
const ROOT=path.resolve(import.meta.dirname,'..'),QA=path.resolve(ROOT,'../Q-Atelier'),ts=createRequire(QA+'/package.json')('typescript');
const input=JSON.parse(fs.readFileSync(ROOT+'/reviews/atelier-style-decisions.json','utf8'));
const definitions={
  '--qd-atelier-link-underline-fine':'2px',
  '--qd-atelier-grid-members':'1fr 220px 160px 110px 130px 110px',
  '--qd-atelier-grid-users':'170px 1fr 110px 110px 1fr 200px',
  '--qd-atelier-grid-vigilance':'90px 1fr 120px 150px 100px 90px',
  '--qd-atelier-chart-label-width':'60px','--qd-atelier-chart-summary-width':'50px','--qd-atelier-usage-label-width':'100px',
  '--qd-atelier-glove-target':'64px','--qd-atelier-section-leading':'1.35',
  '--qd-atelier-line-clamp-single':'1','--qd-atelier-line-clamp-double':'2',
  '--qd-atelier-shadow-float':'0 1px 0 rgba(255, 255, 255, 0.06) inset, 0 12px 32px -8px rgba(0, 0, 0, 0.45)',
  '--qd-atelier-shadow-surface':'0 1px 0 rgba(255, 255, 255, 0.05) inset, 0 4px 16px -4px rgba(0, 0, 0, 0.35)',
  '--qd-atelier-risk-ring-geometry':'0 0 0 4px','--qd-atelier-risk-ring-alpha':'13.3333333333%',
  '--qd-atelier-status-glow-geometry':'0 0 12px','--qd-atelier-status-glow-alpha':'50.1960784314%',
  '--qd-atelier-avatar-ring-geometry':'0 0 0 2px',
};
const all=new Map(),record=(file,before,after,role)=>{let r=all.get(file);if(!r){const code=fs.readFileSync(QA+'/'+file,'utf8');r={path:file,beforeHash:hash(code),original:code,code,edits:[]};all.set(file,r);}const at=r.code.indexOf(before);if(at<0)throw Error(file+': missing '+before);r.code=r.code.slice(0,at)+after+r.code.slice(at+before.length);r.edits.push({start:at,before,after,role});};
// These exact property positions are already independently inventoried and are
// screen styles. Reparse to replace only AST expressions, not comments or text.
const selected=input.records.filter(r=>r.decision==='unknown'&&r.kind==='object-property'&&!r.path.startsWith('lib/design/tokens')&&!r.path.startsWith('lib/export/')&&(
  r.property==='textUnderlineOffset'&&/^[23]$/.test(r.value)||r.property==='verticalAlign'&&r.value==='-2'||r.property==='WebkitLineClamp'&&/^[12]$/.test(r.value)));
for(const r of selected){const code=fs.readFileSync(QA+'/'+r.path,'utf8'),sf=ts.createSourceFile(r.path,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let target;const visit=n=>{if(ts.isPropertyAssignment(n)&&n.name.getText(sf)===r.property&&n.initializer.getText(sf)===r.value&&sf.getLineAndCharacterOfPosition(n.getStart(sf)).line+1===r.line)target=n;ts.forEachChild(n,visit);};visit(sf);if(!target)throw Error('stale '+r.path+':'+r.line);const token=r.property==='verticalAlign'?'--qd-atelier-inline-icon-align':r.property==='textUnderlineOffset'?(r.value==='3'?'--qd-atelier-hub-link-underline-offset':'--qd-atelier-link-underline-fine'):(r.value==='1'?'--qd-atelier-line-clamp-single':'--qd-atelier-line-clamp-double');record(r.path,target.getText(sf),`${r.property}: 'var(${token})'`,r.property);}
for(const[file,before,after,role]of[
 ['app/(app)/admin/screening/page.tsx',"const MEMBER_GRID_COLS = '1fr 220px 160px 110px 130px 110px'","const MEMBER_GRID_COLS = 'var(--qd-atelier-grid-members)'",'grid columns'],
 ['app/(app)/admin/users/users-table-client.tsx',"const GRID = '170px 1fr 110px 110px 1fr 200px'","const GRID = 'var(--qd-atelier-grid-users)'",'grid columns'],
 ['app/(app)/admin/vigilance/page.tsx',"const COLS = '90px 1fr 120px 150px 100px 90px'","const COLS = 'var(--qd-atelier-grid-vigilance)'",'grid columns'],
 ['app/(app)/m/field-ui.tsx','export const GLOVE_TARGET = 64',"export const GLOVE_TARGET = 'var(--qd-atelier-glove-target)'",'glove control size'],
 ['lib/design/components.tsx','fontWeight: 700',"fontWeight: 'var(--qd-font-weight-bold)'",'section weight'],
 ['lib/design/components.tsx','lineHeight: 1.35',"lineHeight: 'var(--qd-atelier-section-leading)'",'section leading'],
 ['app/experts/inbox/[id]/page.tsx','`0 0 0 4px ${risk.color}22`','`var(--qd-atelier-risk-ring-geometry) color-mix(in srgb, ${risk.color} var(--qd-atelier-risk-ring-alpha), transparent)`','valid semantic color opacity'],
 ['app/experts/settings/page.tsx','`0 0 12px ${statusInfo.color}80`','`var(--qd-atelier-status-glow-geometry) color-mix(in srgb, ${statusInfo.color} var(--qd-atelier-status-glow-alpha), transparent)`','valid semantic color opacity'],
 ['components/Sidebar.tsx','`0 0 0 2px ${T.surface}`','`var(--qd-atelier-avatar-ring-geometry) ${T.surface}`','avatar ring'],
 ['app/(app)/m/field-ui.tsx','${value ? 2 : 1}px var(--qd-atelier-border-style-5ed175bd8d)','${value ? "var(--qd-border-width-2)" : "var(--qd-border-width)"} var(--qd-atelier-border-style-5ed175bd8d)','choice stroke'],
])record(file,before,after,role);
const repeated=(file,before,after,role)=>{let n=0;while((all.get(file)?.code??fs.readFileSync(QA+'/'+file,'utf8')).includes(before)){record(file,before,after,role);n++;}if(!n)throw Error(file+' missing '+before);};
repeated('app/(app)/admin/subscriptions/page.tsx','`60px repeat(${history.length}, 1fr) 50px`','`var(--qd-atelier-chart-label-width) repeat(${history.length}, 1fr) var(--qd-atelier-chart-summary-width)`','chart static columns');
for(const data of ['history','data'])repeated('app/(app)/settings/usage/page.tsx','`100px repeat(${'+data+'.length}, 1fr)`','`var(--qd-atelier-usage-label-width) repeat(${'+data+'.length}, 1fr)`','usage static label');
for(const file of ['components/AIQuickAccessFab.tsx','components/PullToRefresh.tsx']){repeated(file,'SHADOW.float',"'var(--qd-atelier-shadow-float)'",'floating shadow');if(file.includes('AIQuick'))repeated(file,'SHADOW.surface',"'var(--qd-atelier-shadow-surface)'",'open surface shadow');}
for(const file of ['app/(app)/research/new/page.tsx','components/ProductPickField.tsx','components/SuggestionDetailModal.tsx','components/admin/ConditionRulesPanel.tsx'])repeated(file,'`1px solid ${','`var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) ${','shared border');
for(const file of ['components/AuditReadinessWidget.tsx','components/MarketLockedNotice.tsx','components/RaStatusNotice.tsx'])repeated(file,'minHeight: TOUCH.min',"minHeight: 'var(--qd-control-height)'",'shared touch target');
const records=[...all.values()].map(({path,beforeHash,code,edits})=>({path,beforeHash,afterHash:hash(code),edits}));
console.log(JSON.stringify({files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0),definitions:Object.keys(definitions).length}));
if(process.argv.includes('--write')){
 const manifest=ROOT+'/reviews/atelier-finite-defaults-3-migration.json';if(fs.existsSync(manifest))throw Error('Do not overwrite historical ledger');
 fs.writeFileSync(manifest,JSON.stringify({version:1,records,definitions},null,2)+'\n');
 fs.appendFileSync(ROOT+'/patterns/foundation/atelier-core-values.css','\n/* Exact residual screen defaults from independent consumer review. */\n:root {\n'+Object.entries(definitions).map(([k,v])=>`  ${k}: ${v};`).join('\n')+'\n}\n');
 for(const r of all.values())fs.writeFileSync(QA+'/'+r.path,r.code);
}
