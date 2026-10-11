// Read-only source adjudication. These concrete gaps remain unresolved until a later exact migration.
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {runtimeFiles} from './style-arguments-core.mjs';
import {hash} from './style-arguments-core.mjs';
const ROOT='D:/Claude/Q-Design',QA='D:/Claude/Q-Atelier';
const specs=[
 ['components/IfuClassifyDrawer.tsx','width="min(480px, 96vw)"','Actual Drawer width prop owns a fixed maximum and viewport proportion locally.'],
 ['components/QuickApproveDrawer.tsx','width="min(480px, 100vw)"','Actual Drawer width prop owns a fixed maximum and viewport proportion locally.'],
 ['app/(app)/admin/ai-control/_tabs/Overview.tsx','Math.max(2, (d.cost / max) * 100)','Chart minimum visible bar percentage is a fixed presentation floor; preserve actual cost ratio.'],
 ['app/(app)/qms-documents/client.tsx','paddingLeft: depth * 16','Tree indent unit is a fixed UI spacing policy; depth remains document data.'],
 ['app/experts/inbox/user-menu.tsx','${statusBadge.color} 25%, transparent','Status outline tint percentage is local.'],
 ['app/experts/inbox/user-menu.tsx','${statusBadge.color} 6%, transparent','Status background tint percentage is local.'],
 ['app/experts/portal/signup/page.tsx',"transform: 'rotate(45deg)'",'Auth decorative mark orientation is a fixed visual value.'],
 ['app/onboarding/qms-setup/client.tsx',"transform: 'translateY(2px)'",'Fixed icon baseline adjustment belongs to the central recipe.'],
 ['components/Confirm.tsx',"mounted ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.98)'",'Confirmation entrance orientation, displacement and scale are authored visual states.'],
 ['components/Toast.tsx',"mounted ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.98)'",'Toast entrance orientation, displacement and scale are authored visual states.'],
 ['components/InstallAppPrompt.tsx',"shown ? 'translateY(0)' : 'translateY(16px)'",'Installation prompt entrance displacement is local.'],
 ['components/InstallAppPrompt.tsx','cubic-bezier(.2,.8,.2,1), opacity ${ANIM_MS}ms ease','Installation motion duration already central, but both authored easing curves are local.'],
 ['components/ApprovedAdvisoryList.tsx',"opinionsOpen ? 'rotate(180deg)' : 'none'",'Expanded opinion chevron orientation is local.'],
 ['components/ApprovedAdvisoryList.tsx',"expanded ? 'rotate(180deg)' : 'none'",'Expanded advisory chevron orientation is local.'],
 ['components/MatchedRulesList.tsx',"isOpen ? 'rotate(90deg)' : 'rotate(0deg)'",'Disclosure chevron orientation is local.'],
 ['components/ReferenceSection.tsx',"open ? 'rotate(180deg)' : 'none'",'Disclosure chevron orientation is local.'],
 ['components/RevisionRowExpandable.tsx',"open ? 'rotate(90deg)' : 'rotate(0deg)'",'Revision disclosure chevron orientation is local.'],
 ['components/PullToRefresh.tsx','shown - 44','Pull indicator resting offset is a fixed visual default, distinct from measured touch displacement.'],
 ['components/PullToRefresh.tsx','Math.min(1, shown / 40)','Pull indicator fade distance is a fixed presentation default.'],
 ['components/PullToRefresh.tsx','Math.round(pull * 4)','Pull indicator degrees per pixel is a fixed presentation conversion.'],
 ['components/RdDocumentFlowPanel.tsx','top: menuRect.bottom + 4','Measured menu anchor is runtime geometry; its fixed visual gap belongs centrally.'],
 ['lib/design/components.tsx','top: tooltipRect.bottom + 6','Measured KPI tooltip anchor is runtime geometry; its fixed visual gap belongs centrally.'],
 ['components/qms/SheetPaper.tsx','Math.floor(94 / b.cols.length)','Printable column allocation reserves a fixed six-percent number column; centralize the allocation together.'],
 ['components/ApprovalDocFile.tsx','background: LIGHT_PALETTE.surface, color: LIGHT_PALETTE.text','Document preview uses fixed light paper colors from protected tokens; provide the same light-paper role from canonical output values.'],
 ['components/WelcomeFlow.tsx','...goldTextStyle()','Gold text renderer calls a protected legacy helper whose gradient recipe is not Q-Design owned; connect a central equivalent without editing tokens.ts.'],
 ['components/ApprovalChainEditor.tsx',"scrollbarWidth: 'thin'",'Scrollbar visual thickness choice should read a central visual parameter.'],
 ['components/TimeSeriesChart.tsx','strokeLinejoin="round"','Polyline corner stroke appearance is fixed locally.'],
 ['lib/design/components.tsx','strokeLinecap="round"','Progress ring linecap appearance is fixed locally.'],
 ['lib/design/tag-metrics.ts','export const TAG_DIMS','Tag numeric fallback and box-metric model still use local display defaults; move the equivalent numeric config centrally while preserving physical calculations.'],
 ['components/ExpertScorePanel.tsx',"compact ? '10px 12px' : '14px 16px'",'Named panel padding contains two local visual variants.'],
 ['components/SubscriptionIndicator.tsx',"? 'min(340px, calc(100vw - 24px))'",'Named responsive panel width contains fixed local maximum and viewport gutter.'],
 ['components/Sidebar.tsx',"dir === 'right' ? 'rotate(180deg)'",'Directional chevron helper owns three fixed rotations.'],
 ['components/OwnerProductWorkflow.tsx','`linear-gradient(90deg, ${T.champagne}','Workflow divider gradient direction and recipe are locally authored.'],
 ['components/NotificationBell.tsx','const bellTop =','Responsive header bell inset recipe still contains local fixed offsets.'],
 ['components/NotificationBell.tsx','const bellRight =','Responsive header bell horizontal inset recipe still contains local fixed offsets.'],
 ['components/SubscriptionIndicator.tsx','const wrapTop =','Responsive subscription indicator vertical inset recipe still contains local fixed offsets.'],
 ['components/SubscriptionIndicator.tsx','const wrapRight =','Responsive subscription indicator horizontal offsets still contain local fixed spacing.'],
 ['app/(app)/m/field-ui.tsx','const BOTTOM_NAV_HEIGHT = 64;','Field action bar reservation default is a UI layout value; measured inset remains runtime.'],
 ['lib/export/seed-default-templates.ts',"const QATELIER_BRAND_COLOR = '#8a6838'",'Blank DOCX templates override the canonical document accent with a local color; traced through buildDocx branding.brandColor.'],
 ['app/(app)/research/[code]/profile/page.tsx','className="animate-spin"','The loading icon requests spin, but no loaded canonical or product selector defines it. Connect an explicit central motion class with reduced-motion handling.'],
 ['components/FinalJudgmentPanel.tsx','className="animate-spin"','The loading icon requests spin, but no loaded canonical or product selector defines it. Connect an explicit central motion class with reduced-motion handling.'],
 ['app/(app)/m/process/client.tsx','${bad ? 2 : 1}px','Conditional native card border width. Use central normal and emphasis width values.'],
 ['app/(app)/m/receiving/client.tsx','${overSample ? 2 : 1}px','Conditional native card border width. Use central normal and emphasis width values.'],
 ['components/ApprovalRoute.tsx',"${state === 'current' ? 2 : 1.5}px",'Approval marker border width depends on presentation state; both defaults belong in Q-Design.'],
 ['lib/design/components.tsx','${selected ? 3 : 2}px','StageTimeline selection border widths.'],
 ['app/(app)/recalls/[id]/client.tsx','overdue ? 0.08 : 0.25','Conditional tint ratios; existing QDRuntime alpha values provide identical defaults.'],
 ['components/RdDocumentFlowPanel.tsx','iAmApprover && hasApprovalChain ? 1 : 0.4','Conditional approval tint ratios; the condition itself is business state.'],
 ['components/TeamActivityFeed.tsx','crossRole ? 0.22 : 0.1','Conditional activity tint ratios.'],
 ['components/SubscriptionIndicator.tsx','isCompact ? 0.6 : 1','Latin label tracking values; Hangul remains governed by LABEL.hangulTracking.'],
 ['app/(app)/settings/compliance/compliance-manager.tsx',"`2fr ${REACHABLE_FINDING_GRADES",'Fixed summary-track proportion preceding dynamic business-grade columns.'],
 ['app/(auth)/login/page.tsx',"'opacity var(--qd-motion-normal, 200ms) ease'",'The duration is central; the local easing/transition recipe is still authored here.'],
 ['components/AiHelperButton.tsx',"alpha('#000', QDRuntime.alpha.tint0_5)",'Modal scrim has a local black color; use shared Q-Design backdrop.'],
 ['components/ChangeImpactDecisionTree.tsx',"alpha('#000', QDRuntime.alpha.tint0_6)",'Modal scrim has a local black color; use shared Q-Design backdrop.'],
 ['components/DocumentArtifactPanel.tsx',"alpha('#000', QDRuntime.alpha.tint0_5)",'Modal scrim has a local black color; use shared Q-Design backdrop.'],
 ['components/AIQuickAccessFab.tsx','var(--qa-fab-bottom, 80px)','Mobile fallback is local; desktop override already lives in canonical CSS.'],
 ['components/expert/HangulTracking.tsx',"mono ? '-0.35em' : ''",'Use the existing central LABEL.hangulWordSpacing, retaining the DOM comparison and observer behavior.'],
 ['lib/design/components.tsx','const hue = (c / 100) * 125;','Battery status color maximum hue. The percent scaling is data math.'],
 ['lib/design/components.tsx','hsl(${Math.round(hue)}, 62%, 52%)','Battery status saturation and lightness are fixed display parameters.'],
 ['lib/design/components.tsx',"transform: 'rotate(-90deg)'",'Progress ring start orientation is a presentation default.'],
 ['lib/design/components.tsx','fontSize: size <= 48 ?','Progress ring caption/control switch threshold is a presentation rule.'],
 ['lib/design/components.tsx','@keyframes qa-drawer-slide-r','Static drawer keyframes remain authored in the product; move exact recipe to central foundation.'],
 ['lib/design/components.tsx','const responsiveCss = `','Page heading CSS-rule composition is product-owned, although its dimension variables are central.'],
 ['lib/design/components.tsx','function gridTemplateFor(','Grid CSS-rule composition and tablet 2-column policy remain product-owned.'],
 ['components/TimeSeriesChart.tsx','const tickFractions = yMax <= 2 ? [0, 1] : [0, 0.5, 1];','Finite chart tick-placement policy; actual point positions remain data-derived geometry.'],
];
const records=specs.map(([path,needle,reason])=>{const code=fs.readFileSync(QA+'/'+path,'utf8'),start=code.indexOf(needle);if(start<0||code.indexOf(needle,start+needle.length)>=0)throw Error('Expected exact unique pending source: '+path+' '+needle);return {path,line:code.slice(0,start).split('\n').length,sourceHash:hash(code),expression:needle,decision:'pending-centralization',reason};});
const ts=createRequire(QA+'/package.json')('typescript');
for(const file of runtimeFiles(QA).filter(file=>/\.[jt]sx?$/.test(file)&&!file.startsWith('lib/design/tokens')&&!file.includes('/q-design'))){
 const code=fs.readFileSync(QA+'/'+file,'utf8'),sf=ts.createSourceFile(file,code,ts.ScriptTarget.Latest,true,file.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const legacyZ=sf.statements.some(n=>ts.isImportDeclaration(n)&&/\/tokens$/.test(n.moduleSpecifier.text)&&n.importClause?.namedBindings&&ts.isNamedImports(n.importClause.namedBindings)&&n.importClause.namedBindings.elements.some(e=>e.name.text==='Z'&&!e.propertyName));
 const walk=node=>{
  if(legacyZ&&ts.isPropertyAccessExpression(node)&&node.expression.getText(sf)==='Z')records.push({path:file,line:sf.getLineAndCharacterOfPosition(node.getStart(sf)).line+1,sourceHash:hash(code),expression:node.getText(sf),decision:'pending-centralization',family:'legacy-layer-scale',reason:'Actual UI layer directly consumes the protected legacy numeric ladder. Move its UI import to an equivalent Q-Design-owned scale; do not change protected tokens.'});
  if(ts.isPropertyAssignment(node)&&node.name.getText(sf)==='borderStyle'){
   const visit=value=>{if(ts.isStringLiteralLike(value)&&value.text==='dashed')records.push({path:file,line:sf.getLineAndCharacterOfPosition(value.getStart(sf)).line+1,sourceHash:hash(code),expression:value.getText(sf),decision:'pending-centralization',family:'stroke-style',reason:'Actual visible outline style should consume the existing canonical dashed stroke token.'});else if(ts.isConditionalExpression(value)){visit(value.whenTrue);visit(value.whenFalse);}};visit(node.initializer);
  }
  ts.forEachChild(node,walk);
 };walk(sf);
}
fs.writeFileSync(ROOT+'/reviews/atelier-pending-finite-review.json',JSON.stringify({version:1,note:'Confirmed gaps only, not an exhaustive completed review. No entry is counted as conforming. This report deliberately leaves subsequent product edits pending while remaining candidates are traced.',records},null,2)+'\n');
console.log(JSON.stringify({confirmedPending:records.length,files:new Set(records.map(record=>record.path)).size}));
