// Exact finite presentation migration. Defaults are preserved; business values
// and measured coordinates remain in their existing consumers.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {hash,runtimeFiles} from './style-arguments-core.mjs';
const root='D:/Claude/Q-Design',qa='D:/Claude/Q-Atelier';
const ts=createRequire(qa+'/package.json')('typescript');
const output=root+'/reviews/atelier-final-visual-rules-migration.json';
if(fs.existsSync(output))throw Error('Historical visual migration already exists');
const files=new Map(),records=[];
const source=file=>{if(!files.has(file)){const code=fs.readFileSync(qa+'/'+file,'utf8');files.set(file,{original:code,code,edits:[],imports:new Set()});}return files.get(file);};
function replace(file,before,after,count=1){const entry=source(file);if(entry.code.split(before).length-1!==count)throw Error(`${file}: expected ${count} exact copies of ${before}`);for(let i=0;i<count;i++){const start=entry.code.indexOf(before);entry.edits.push({start,before,after});entry.code=entry.code.slice(0,start)+after+entry.code.slice(start+before.length);}if(after.includes('QDPresentation.'))entry.imports.add('QDPresentation');}
const rules=[
 ['components/IfuClassifyDrawer.tsx','width="min(480px, 96vw)"','width={QDPresentation.visual.drawer.classificationWidth}'],
 ['components/QuickApproveDrawer.tsx','width="min(480px, 100vw)"','width={QDPresentation.visual.drawer.approvalWidth}'],
 ['app/(app)/admin/ai-control/_tabs/Overview.tsx','Math.max(2, (d.cost / max) * 100)','Math.max(QDPresentation.visual.chart.minimumBarPercent, (d.cost / max) * 100)'],
 ['app/(app)/qms-documents/client.tsx','paddingLeft: depth * 16','paddingLeft: depth * QDPresentation.visual.treeIndent'],
 ['app/experts/inbox/user-menu.tsx','${statusBadge.color} 25%, transparent','${statusBadge.color} ${QDPresentation.visual.statusOutlinePercent}%, transparent'],
 ['app/experts/inbox/user-menu.tsx','${statusBadge.color} 6%, transparent','${statusBadge.color} ${QDPresentation.visual.statusFillPercent}%, transparent'],
 ['app/experts/inbox/user-menu.tsx',"'var(--qd-border-width) solid var(--hairline-strong)'","'var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) var(--hairline-strong)'"],
 ['components/ExpertNotificationsPanel.tsx',"'var(--qd-border-width) solid var(--qd-border)'","'var(--qd-border-width) var(--qd-atelier-border-style-5ed175bd8d) var(--qd-border)'"],
 ['app/experts/portal/signup/page.tsx',"transform: 'rotate(45deg)'",'transform: QDPresentation.visual.rotation.diagonal'],
 ['app/onboarding/qms-setup/client.tsx',"transform: 'translateY(2px)'",'transform: QDPresentation.visual.iconBaselineTransform'],
 ['components/Confirm.tsx',"mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)'",'mounted ? QDPresentation.visual.motion.settled : QDPresentation.visual.motion.confirmHidden'],
 ['components/Toast.tsx',"mounted ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)'",'mounted ? QDPresentation.visual.motion.settled : QDPresentation.visual.motion.toastHidden'],
 ['components/InstallAppPrompt.tsx',"shown ? 'translateY(0)' : 'translateY(16px)'",'shown ? QDPresentation.visual.motion.translateSettled : QDPresentation.visual.motion.installHidden'],
 ['components/InstallAppPrompt.tsx','cubic-bezier(.2,.8,.2,1), opacity ${ANIM_MS}ms ease','${QDPresentation.visual.motion.installEase}, opacity ${ANIM_MS}ms ${QDPresentation.visual.motion.opacityEase}'],
 ['components/ApprovedAdvisoryList.tsx',"opinionsOpen ? 'rotate(180deg)' : 'none'",'opinionsOpen ? QDPresentation.visual.rotation.reverse : QDPresentation.visual.rotation.none'],
 ['components/ApprovedAdvisoryList.tsx',"expanded ? 'rotate(180deg)' : 'none'",'expanded ? QDPresentation.visual.rotation.reverse : QDPresentation.visual.rotation.none'],
 ['components/MatchedRulesList.tsx',"isOpen ? 'rotate(90deg)' : 'rotate(0deg)'",'isOpen ? QDPresentation.visual.rotation.quarter : QDPresentation.visual.rotation.zero'],
 ['components/ReferenceSection.tsx',"open ? 'rotate(180deg)' : 'none'",'open ? QDPresentation.visual.rotation.reverse : QDPresentation.visual.rotation.none'],
 ['components/RevisionRowExpandable.tsx',"open ? 'rotate(90deg)' : 'rotate(0deg)'",'open ? QDPresentation.visual.rotation.quarter : QDPresentation.visual.rotation.zero'],
 ['components/Sidebar.tsx',"dir === 'right' ? 'rotate(180deg)'\n    : dir === 'up' ? 'rotate(90deg)'\n    : dir === 'down' ? 'rotate(-90deg)'",'dir === \'right\' ? QDPresentation.visual.rotation.reverse\n    : dir === \'up\' ? QDPresentation.visual.rotation.quarter\n    : dir === \'down\' ? QDPresentation.visual.rotation.negativeQuarter'],
 ['components/PullToRefresh.tsx','shown - 44','shown - QDPresentation.visual.pull.restOffset'],
 ['components/PullToRefresh.tsx','Math.min(1, shown / 40)','Math.min(1, shown / QDPresentation.visual.pull.fadeDistance)'],
 ['components/PullToRefresh.tsx','Math.round(pull * 4)','Math.round(pull * QDPresentation.visual.pull.degreesPerPixel)'],
 ['components/RdDocumentFlowPanel.tsx','top: menuRect.bottom + 4','top: menuRect.bottom + QDPresentation.visual.menuAnchorGap'],
 ['lib/design/components.tsx','top: tooltipRect.bottom + 6','top: tooltipRect.bottom + QDPresentation.visual.tooltipAnchorGap'],
 ['components/qms/SheetPaper.tsx','Math.floor(94 / b.cols.length)','Math.floor((100 - QDPresentation.visual.paperNumberColumnPercent) / b.cols.length)'],
 ['components/qms/SheetPaper.tsx','width: "var(--qd-atelier-width-fd0294336b)"','width: `${QDPresentation.visual.paperNumberColumnPercent}%`',2],
 ['components/ApprovalChainEditor.tsx',"scrollbarWidth: 'thin'",'scrollbarWidth: QDPresentation.visual.scrollbarWidth'],
 ['components/TimeSeriesChart.tsx','strokeLinejoin="round"','strokeLinejoin={QDPresentation.visual.chart.lineJoin}'],
 ['lib/design/components.tsx','strokeLinecap="round"','strokeLinecap={QDPresentation.visual.ring.lineCap}'],
 ['components/ExpertScorePanel.tsx',"compact ? '10px 12px' : '14px 16px'",'compact ? QDPresentation.visual.panel.compactPadding : QDPresentation.visual.panel.padding'],
 ['components/SubscriptionIndicator.tsx',"? 'min(340px, calc(100vw - 24px))'\n    : '340px'",'? QDPresentation.visual.subscription.mobilePanelWidth\n    : QDPresentation.visual.subscription.panelWidth'],
 ['components/NotificationBell.tsx','const bellTop = isMobile ? 12 : 18;','const bellTop = isMobile ? QDPresentation.visual.header.mobileTop : QDPresentation.visual.header.desktopTop;'],
 ['components/NotificationBell.tsx','const bellRight = isMobile ? 12 : 22;','const bellRight = isMobile ? QDPresentation.visual.header.mobileRight : QDPresentation.visual.header.desktopRight;'],
 ['components/SubscriptionIndicator.tsx','const wrapTop = isMobile ? 12 : 18;','const wrapTop = isMobile ? QDPresentation.visual.header.mobileTop : QDPresentation.visual.header.desktopTop;'],
 ['components/SubscriptionIndicator.tsx','(isCompact ? 52 : isMobile ? 54 : 64) + (isTouch ? 12 : 0)','(isCompact ? QDPresentation.visual.subscription.compactRight : isMobile ? QDPresentation.visual.subscription.mobileRight : QDPresentation.visual.subscription.desktopRight) + (isTouch ? QDPresentation.visual.subscription.touchAllowance : 0)'],
 ['app/(app)/m/field-ui.tsx','const BOTTOM_NAV_HEIGHT = 64;','const BOTTOM_NAV_HEIGHT = QDPresentation.visual.bottomNavHeight;'],
 ['app/(app)/m/process/client.tsx','${bad ? 2 : 1}px','${bad ? QDPresentation.visual.stroke.emphasis : QDPresentation.visual.stroke.normal}px'],
 ['app/(app)/m/receiving/client.tsx','${overSample ? 2 : 1}px','${overSample ? QDPresentation.visual.stroke.emphasis : QDPresentation.visual.stroke.normal}px'],
 ['components/ApprovalRoute.tsx',"${state === 'current' ? 2 : 1.5}px","${state === 'current' ? QDPresentation.visual.stroke.emphasis : QDPresentation.visual.stroke.approvalIdle}px"],
 ['lib/design/components.tsx','${selected ? 3 : 2}px','${selected ? QDPresentation.visual.stroke.selected : QDPresentation.visual.stroke.emphasis}px'],
 ['app/(app)/recalls/[id]/client.tsx','overdue ? 0.08 : 0.25','overdue ? QDRuntime.alpha.tint0_08 : QDRuntime.alpha.tint0_25'],
 ['components/RdDocumentFlowPanel.tsx','iAmApprover && hasApprovalChain ? 1 : 0.4','iAmApprover && hasApprovalChain ? 1 : QDRuntime.alpha.tint0_4'],
 ['components/TeamActivityFeed.tsx','crossRole ? 0.22 : 0.1','crossRole ? QDRuntime.alpha.tint0_22 : QDRuntime.alpha.tint0_1'],
 ['components/SubscriptionIndicator.tsx','isCompact ? 0.6 : 1','isCompact ? QDPresentation.visual.subscription.compactTracking : QDPresentation.visual.subscription.tracking'],
 ['app/(app)/settings/compliance/compliance-manager.tsx','`2fr ${REACHABLE_FINDING_GRADES','`${QDPresentation.visual.summaryLabelTrack} ${REACHABLE_FINDING_GRADES'],
 ['app/(auth)/login/page.tsx',"'opacity var(--qd-motion-normal, 200ms) ease'",'QDPresentation.visual.motion.authOpacity'],
 ['components/AiHelperButton.tsx',"alpha('#000', QDRuntime.alpha.tint0_5)","'var(--qd-backdrop)'"],
 ['components/ChangeImpactDecisionTree.tsx',"alpha('#000', QDRuntime.alpha.tint0_6)","'var(--qd-backdrop)'"],
 ['components/DocumentArtifactPanel.tsx',"alpha('#000', QDRuntime.alpha.tint0_5)","'var(--qd-backdrop)'"],
 ['components/AIQuickAccessFab.tsx',"'calc(env(safe-area-inset-bottom, 0) + var(--qa-fab-bottom, 80px))'",'QDPresentation.visual.fabBottom'],
 ['lib/design/components.tsx','const hue = (c / 100) * 125;','const hue = (c / 100) * QDPresentation.visual.battery.maximumHue;'],
 ['lib/design/components.tsx','hsl(${Math.round(hue)}, 62%, 52%)','hsl(${Math.round(hue)}, ${QDPresentation.visual.battery.saturation}%, ${QDPresentation.visual.battery.lightness}%)'],
 ['lib/design/components.tsx',"transform: 'rotate(-90deg)'",'transform: QDPresentation.visual.rotation.negativeQuarter'],
 ['lib/design/components.tsx','fontSize: size <= 48 ?','fontSize: size <= QDPresentation.visual.ring.captionThreshold ?'],
 ['components/TimeSeriesChart.tsx','const tickFractions = yMax <= 2 ? [0, 1] : [0, 0.5, 1];','const tickFractions = yMax <= QDPresentation.visual.chart.sparseThreshold ? QDPresentation.visual.chart.sparseTicks : QDPresentation.visual.chart.normalTicks;'],
];
for(const[file,before,after,count]of rules){const e=source(file),ending=e.code.includes('\r\n')?'\r\n':'\n';replace(file,before.replaceAll('\n',ending),after.replaceAll('\n',ending),count);}
// These named adapters already exist and retain their exact linguistic/output role.
replace('components/expert/HangulTracking.tsx',"mono ? '-0.35em' : ''","mono ? LABEL.hangulWordSpacing : ''");source('components/expert/HangulTracking.tsx').extraImport="import { LABEL } from '@/lib/design/q-design-labels';";
replace('lib/export/seed-default-templates.ts',"const QATELIER_BRAND_COLOR = '#8a6838';","const QATELIER_BRAND_COLOR = `#${DOC_COLOR.champagne.toLowerCase()}`;");source('lib/export/seed-default-templates.ts').extraImport="import { DOC_COLOR } from '@/lib/design/q-design.doc';";
replace('components/ApprovalDocFile.tsx','background: LIGHT_PALETTE.surface, color: LIGHT_PALETTE.text','background: `#${DOC_COLOR.surface}`, color: `#${DOC_COLOR.ink}`');source('components/ApprovalDocFile.tsx').extraImport="import { DOC_COLOR } from '@/lib/design/q-design.doc';";
replace('components/WelcomeFlow.tsx','...goldTextStyle()','...QDPresentation.visual.goldText');
replace('components/OwnerProductWorkflow.tsx','`linear-gradient(90deg, ${T.champagne}, ${alpha(T.champagne, QDRuntime.alpha.tint0_3)}, transparent)`','workflowDivider(T.champagne, alpha(T.champagne, QDRuntime.alpha.tint0_3))');source('components/OwnerProductWorkflow.tsx').imports.add('workflowDivider');
const visual={drawer:{classificationWidth:'min(480px, 96vw)',approvalWidth:'min(480px, 100vw)'},chart:{minimumBarPercent:2,lineJoin:'round',sparseThreshold:2,sparseTicks:[0,1],normalTicks:[0,.5,1]},treeIndent:16,statusOutlinePercent:25,statusFillPercent:6,rotation:{diagonal:'rotate(45deg)',reverse:'rotate(180deg)',quarter:'rotate(90deg)',negativeQuarter:'rotate(-90deg)',zero:'rotate(0deg)',none:'none'},iconBaselineTransform:'translateY(2px)',motion:{settled:'translateY(0) scale(1)',confirmHidden:'translateY(8px) scale(0.98)',toastHidden:'translateY(-8px) scale(0.98)',translateSettled:'translateY(0)',installHidden:'translateY(16px)',installEase:'cubic-bezier(.2,.8,.2,1)',opacityEase:'ease',authOpacity:'opacity var(--qd-motion-normal, 200ms) ease'},pull:{restOffset:44,fadeDistance:40,degreesPerPixel:4},menuAnchorGap:4,tooltipAnchorGap:6,paperNumberColumnPercent:6,scrollbarWidth:'thin',ring:{lineCap:'round',captionThreshold:48},panel:{compactPadding:'10px 12px',padding:'14px 16px'},subscription:{mobilePanelWidth:'min(340px, calc(100vw - 24px))',panelWidth:'340px',compactRight:52,mobileRight:54,desktopRight:64,touchAllowance:12,compactTracking:.6,tracking:1},header:{mobileTop:12,desktopTop:18,mobileRight:12,desktopRight:22},bottomNavHeight:64,stroke:{normal:1,emphasis:2,approvalIdle:1.5,selected:3},summaryLabelTrack:'2fr',fabBottom:'calc(env(safe-area-inset-bottom, 0) + var(--qa-fab-bottom, 80px))',battery:{maximumHue:125,saturation:62,lightness:52},goldText:{backgroundImage:'linear-gradient(135deg, var(--qa-champagne) 0%, color-mix(in oklab, var(--qa-champagne) 55%, white) 50%, color-mix(in oklab, var(--qa-champagne) 82%, black) 100%)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'},tag:{border:1,lineHeight:1.4,dims:{xs:{minH:20,fs:12,padY:0,padX:6,dotSize:5,gap:4},sm:{minH:24,fs:12,padY:2,padX:8,dotSize:6,gap:4},md:{minH:28,fs:13,padY:4,padX:10,dotSize:7,gap:5}}}};
const tagFile='lib/design/tag-metrics.ts',tag=source(tagFile).code,tagDims=tag.match(/export const TAG_DIMS = \{[\s\S]*?\} as const;/)?.[0];if(!tagDims)throw Error('Missing tag dims');
replace(tagFile,'export const TAG_BORDER = 1;','export const TAG_BORDER = QDPresentation.visual.tag.border;');replace(tagFile,tagDims,'export const TAG_DIMS = QDPresentation.visual.tag.dims;');replace(tagFile,'lineHeight: number = LH.snug','lineHeight: number = QDPresentation.visual.tag.lineHeight',3);
replace(tagFile,"import { S, LH } from './tokens';",'');
// Move authored recipes verbatim. The component keeps its rendering, dynamic IDs,
// optional columns and inline-versus-media precedence behavior.
const coreFile='lib/design/components.tsx',core=source(coreFile).code;
const pageCss=core.match(/const responsiveCss = (`[\s\S]*?`);/)?.[1];
const gridFn=core.match(/function gridTemplateFor\([\s\S]*?\n\}/)?.[0];
const gridRules=core.match(/  const rules: string\[\] = \[\];[\s\S]*?(?=  const hasRules = rules.length > 0;)/)?.[0];
const drawerCss=core.match(/<style>\{(`\s*@keyframes qa-drawer-slide-r[\s\S]*?`)\}<\/style>/)?.[1];
if(!pageCss||!gridFn||!gridRules||!drawerCss)throw Error('Review exact core CSS recipes');
visual.grid={tabletThreshold:3,tabletColumns:2};
replace(coreFile,'const responsiveCss = '+pageCss+';','const responsiveCss = pageHeadingRules(headerClass);');
replace(coreFile,gridFn,'');
replace(coreFile,gridRules,'  const rules = gridRulesFor(className, cols, minCol, responsive);\n');
replace(coreFile,'<style>{'+drawerCss+'}</style>','<style>{drawerMotionRules}</style>');
for(const name of ['pageHeadingRules','gridTemplateFor','gridRulesFor','drawerMotionRules'])source(coreFile).imports.add(name);
const centralRecipes='\nexport function pageHeadingRules(headerClass: string): string { return '+pageCss+'; }\n\nexport '+gridFn+'\n\nexport function gridRulesFor(className: string, cols: number | undefined, minCol: number, responsive?: {base?:number;sm?:number;md?:number;lg?:number;xl?:number}): string[] {\n'+gridRules.replace('cols >= 3','cols >= QDPresentation.visual.grid.tabletThreshold').replace('repeat(2,minmax(0,1fr))','repeat(${QDPresentation.visual.grid.tabletColumns},minmax(0,1fr))')+'  return rules;\n}\n\nexport const drawerMotionRules = '+drawerCss+';\n';
// Narrow AST selection: exactly the recorded local dashed styles and the legacy
// Z import. Do not replace similarly named business values or protected tokens.
const zSource=fs.readFileSync(qa+'/lib/design/tokens.ts','utf8'),zText=zSource.match(/export const Z = (\{[\s\S]*?\}) as const;/)?.[1];if(!zText)throw Error('Missing legacy Z');
const Z={};for(const line of zText.split(/\r?\n/)){const m=line.match(/^\s*(\w+):\s*(\d+),/);if(m)Z[m[1]]=Number(m[2]);}if(Object.keys(Z).length!==16)throw Error('Review Z ladder size');
for(const file of runtimeFiles(qa).filter(file=>/\.[jt]sx?$/.test(file)&&!file.startsWith('lib/design/tokens')&&!file.includes('/q-design'))){
 const code=source(file).code,sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS),changes=[];
 const walk=node=>{if(ts.isPropertyAssignment(node)&&node.name.getText(sf)==='borderStyle'){const visit=value=>{if(ts.isStringLiteralLike(value)&&value.text==='dashed')changes.push([value.getStart(sf),value.getEnd(),"'var(--qd-atelier-border-style-95c01bc47f)'"]);else if(ts.isConditionalExpression(value)){visit(value.whenTrue);visit(value.whenFalse);}};visit(node.initializer);}ts.forEachChild(node,walk);};walk(sf);
 for(const statement of sf.statements)if(ts.isImportDeclaration(statement)&&/\/tokens$/.test(statement.moduleSpecifier.text)&&statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings)){
  const specs=statement.importClause.namedBindings.elements,index=specs.findIndex(e=>e.name.text==='Z'&&!e.propertyName);if(index<0)continue;
  const spec=specs[index],start=index<specs.length-1?spec.getStart(sf):specs[index-1].getEnd(),end=index<specs.length-1?specs[index+1].getStart(sf):spec.getEnd();changes.push([start,end,'']);source(file).imports.add('Z');
 }
 for(const[start,end,after]of changes.sort((a,b)=>b[0]-a[0])){const e=source(file),before=e.code.slice(start,end);e.edits.push({start,before,after});e.code=e.code.slice(0,start)+after+e.code.slice(end);}
}
// Finalize imports after all edits, always after the directive prologue.
for(const[file,e]of files){
 if(!e.edits.length)continue;
 const sf=ts.createSourceFile(file,e.code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const already=new Set();for(const statement of sf.statements)if(ts.isImportDeclaration(statement)&&statement.moduleSpecifier.text.endsWith('/q-design-runtime')&&statement.importClause?.namedBindings&&ts.isNamedImports(statement.importClause.namedBindings))for(const s of statement.importClause.namedBindings.elements)already.add(s.name.text);
 const missing=[...e.imports].filter(name=>!already.has(name)),lines=[];if(missing.length)lines.push(`import { ${missing.join(', ')} } from '@/lib/design/q-design-runtime';`);if(e.extraImport)lines.push(e.extraImport);
 if(lines.length){const at=sf.statements.find(ts.isImportDeclaration)?.getStart(sf)??0,after=lines.join('\n')+'\n';e.edits.push({start:at,before:'',after});e.code=e.code.slice(0,at)+after+e.code.slice(at);}
 records.push({path:file,beforeHash:hash(e.original),afterHash:hash(e.code),edits:e.edits});
}
const runtimePath=root+'/source/design/atelier-runtime.ts',currentRuntime=fs.readFileSync(runtimePath,'utf8'),planPath=root+'/reviews/atelier-final-visual-rules-plan.json';
const previous=fs.existsSync(planPath)?JSON.parse(fs.readFileSync(planPath,'utf8')):null;
const staged=currentRuntime.includes('"visual":')||/export const Z =/.test(currentRuntime);
if(staged&&(!previous||hash(currentRuntime)!==previous.canonicalAfterHash))throw Error('Canonical stage differs from the reviewed plan');
const runtime=staged?previous.canonicalSourceBefore:currentRuntime;
const canonical=runtime.replace('export const QDPresentation = {','export const QDPresentation = {\n  "visual": '+JSON.stringify(visual,null,2).replaceAll('\n','\n  ')+',')+'\nexport const Z = '+JSON.stringify(Z,null,2)+' as const;\n\nexport const workflowDivider = (color: string, faded: string): string => `linear-gradient(90deg, ${color}, ${faded}, transparent)`;\n'+centralRecipes;
if(staged&&hash(canonical)!==hash(currentRuntime))throw Error('Recomputed canonical plan changed');
const plan={version:1,scope:'Exact finite UI display defaults and mathematical output-allocation inputs. Original business conditions, measured coordinates and engine tokens are unchanged. Three legacy black scrims deliberately converge on the canonical backdrop.',visual,Z,canonicalSourceBefore:runtime,canonicalBeforeHash:hash(runtime),canonicalAfterHash:hash(canonical),records};
if(process.argv.includes('--canonical'))fs.writeFileSync(runtimePath,canonical);
if(process.argv.includes('--write')){
 const copy=fs.readFileSync(qa+'/lib/design/q-design-runtime.ts','utf8');if(!staged||!copy.replaceAll('\r\n','\n').endsWith(canonical.replaceAll('\r\n','\n')))throw Error('Sync the exact canonical numeric part before changing product consumers');
 for(const record of records)fs.writeFileSync(qa+'/'+record.path,files.get(record.path).code);fs.writeFileSync(output,JSON.stringify(plan,null,2)+'\n');
}else fs.writeFileSync(root+'/reviews/atelier-final-visual-rules-plan.json',JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({files:records.length,edits:records.reduce((n,r)=>n+r.edits.length,0),canonical:process.argv.includes('--canonical'),write:process.argv.includes('--write')}));
