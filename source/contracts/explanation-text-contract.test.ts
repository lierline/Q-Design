/**
 * 설명 글귀는 ⓘ 안으로 (2026-10-08 오너 결정 «1번 추천대로 전부»)
 *
 * 화면 코드에 깔려 있던 사용법 문장(«~하십시오» · «~됩니다» · «~입니다»)이 811개였다(2026-10-07 실측 · 그중 날것 633).
 * 사람은 그것을 읽지 않고, 읽는 사람에게는 화면이 글로 덮인다. 그래서 설명은 세 층의 ⓘ 안으로 들어간다:
 *   화면 머리 ⓘ(PageGuide) · 구역 제목 ⓘ(SectionTitleInfo) · 칸 ⓘ(FldRow info= · InfoDot).
 * 화면에 그대로 남는 글은 네 가지뿐이다: 오류 · 경고(Alert · FldError) · 빈 화면 한 줄(EmptyState) ·
 * 다음 할 일 한 줄(NextStep) · 법규 문구(LegalNote).
 *
 * 이 계약은 «JSX 글 노드에 날것으로 놓인 설명 문장» 을 파일별로 세어 기준선과 같은지 본다.
 *   · 설명 문장: 한글로 시작해 입니다 · 십시오 · 됩니다 · 합니다 · 있습니다 · 없습니다 · 주세요 · 하세요 + 마침표로 끝나는 것.
 *   · 날것: 가장 가까운 여는 부품이 아래 WRAPPERS 가 아닌 것. 부품 안(ⓘ 팝업 · Alert · 남겨도 되는 네 가지)은 세지 않는다.
 *     HelpNote 는 «옮기는 중» 이라 아직 부품으로 친다(옮기면 HelpNote 호출 자체가 줄어든다).
 *   · 문자열 속성(title= · placeholder=)과 데이터 파일(page-guides.ts)은 보지 않는다. 공개 약관 · 개인정보 · 오픈소스
 *     고지 화면과 현장 모드 · 전문가 포털은 뺀다.
 * 기준선은 «남아 있는 것» 의 목록이다. 줄어들면 기준선도 줄여야 하고, 늘면 빨강이다. 어긋나면 붙여 넣을 리터럴을 찍어 준다.
 * 근사치 계산이라 100% 는 아니지만, «늘지 않는다» 와 «줄었다» 를 재기에는 충분하다(2026-10-07 손으로 50건 대조 · 오탐 0).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import { codeOnly, REPO_ROOT } from '@/lib/test-utils/contract-source';

/** 남아 있는 날것 설명 문장. 파일 → 개수. 0 이 되면 줄을 지운다. */
const REMAINING: ReadonlyArray<[string, number]> = [
  // 2026-10-08 시작 기준선: 180 파일 · 574 문장. 묶음마다 줄인다. 묶음 1(시안 두 화면): 178 파일 · 568 문장. 설정 카드 ⓘ 뒤 567.
  ['app/(app)/admin/activity/page.tsx', 10],
  ['app/(app)/admin/ai-control/_tabs/Overview.tsx', 1],
  ['app/(app)/admin/core-accuracy/page.tsx', 1],
  ['app/(app)/admin/default-templates/page.tsx', 1],
  ['app/(app)/admin/eval-sets/[id]/review/page.tsx', 6],
  ['app/(app)/admin/eval-sets/page.tsx', 1],
  ['app/(app)/admin/expert-invites/invite-manager.tsx', 2],
  ['app/(app)/admin/expert-invites/page.tsx', 3],
  ['app/(app)/admin/experts/page.tsx', 2],
  ['app/(app)/admin/knowledge/page.tsx', 2],
  ['app/(app)/admin/multi-view/page.tsx', 1],
  ['app/(app)/admin/page.tsx', 1],
  ['app/(app)/admin/permissions-matrix/page.tsx', 2],
  ['app/(app)/admin/q-match-training/page.tsx', 4],
  ['app/(app)/admin/qmatch-quiz/page.tsx', 2],
  ['app/(app)/admin/rule-table/page.tsx', 4],
  ['app/(app)/admin/screening/page.tsx', 2],
  ['app/(app)/admin/validation-evidence/page.tsx', 2],
  ['app/(app)/admin/vigilance/page.tsx', 1],
  ['app/(app)/assessments/[code]/page.tsx', 6],
  ['app/(app)/assessments/page.tsx', 1],
  ['app/(app)/audit-readiness/page.tsx', 3],
  ['app/(app)/audit/filter-bar.tsx', 3],
  ['app/(app)/audits/[id]/client.tsx', 2],
  ['app/(app)/authorized-reps/[id]/client.tsx', 1],
  ['app/(app)/capa/[id]/client.tsx', 7],
  ['app/(app)/cleanroom/[id]/client.tsx', 1],
  ['app/(app)/clinical-evaluations/[id]/client.tsx', 2],
  ['app/(app)/clinical-evaluations/new/client.tsx', 2],
  ['app/(app)/complaints/[id]/client.tsx', 3],
  ['app/(app)/complaints/new/client.tsx', 6],
  ['app/(app)/contracts/[id]/page.tsx', 1],
  ['app/(app)/design-trace/client.tsx', 7],
  ['app/(app)/device-licenses/[id]/client.tsx', 13],
  ['app/(app)/device-licenses/new/client.tsx', 5],
  ['app/(app)/eu-mdr/[id]/client.tsx', 3],
  ['app/(app)/eu-mdr/new/client.tsx', 1],
  ['app/(app)/experts/page.tsx', 1],
  ['app/(app)/fda-510k/[id]/client.tsx', 1],
  ['app/(app)/feedback/[id]/client.tsx', 2],
  ['app/(app)/inbox/[id]/page.tsx', 2],
  ['app/(app)/lots/[id]/client.tsx', 4],
  ['app/(app)/management-reviews/[id]/client.tsx', 6],
  ['app/(app)/messages/page.tsx', 8],
  ['app/(app)/nmpa/[id]/client.tsx', 2],
  ['app/(app)/nonconformances/[id]/dispositions-section.tsx', 1],
  ['app/(app)/pmda/[id]/client.tsx', 2],
  ['app/(app)/pmda/new/client.tsx', 1],
  ['app/(app)/pms/[id]/client.tsx', 3],
  ['app/(app)/pms/new/client.tsx', 1],
  ['app/(app)/products/client.tsx', 1],
  ['app/(app)/products/page.tsx', 1],
  ['app/(app)/qa/qa-workspace-client.tsx', 3],
  ['app/(app)/qms-documents/client.tsx', 4],
  ['app/(app)/quality-objectives/[id]/client.tsx', 7],
  ['app/(app)/ra/ra-workspace-client.tsx', 5],
  ['app/(app)/recalls/[id]/client.tsx', 2],
  ['app/(app)/recalls/new/client.tsx', 3],
  ['app/(app)/reimbursement/client.tsx', 1],
  ['app/(app)/research/[code]/design-requirements/page.tsx', 2],
  ['app/(app)/research/[code]/page.tsx', 1],
  ['app/(app)/research/[code]/profile/page.tsx', 3],
  ['app/(app)/research/[code]/reviews/page.tsx', 6],
  ['app/(app)/research/[code]/settings/page.tsx', 6],
  ['app/(app)/research/new/page.tsx', 3],
  ['app/(app)/research/review/page.tsx', 3],
  ['app/(app)/settings/compliance/compliance-manager.tsx', 5],
  ['app/(app)/settings/compliance/page.tsx', 1],
  ['app/(app)/settings/export/ExportPanel.tsx', 2],
  ['app/(app)/settings/members/member-admin-client.tsx', 2],
  ['app/(app)/settings/members/role-assignee-select.tsx', 1],
  ['app/(app)/settings/members/solo-mode-toggle.tsx', 1],
  ['app/(app)/settings/page.tsx', 10],
  ['app/(app)/settings/templates/page.tsx', 2],
  ['app/(app)/settings/templates/template-manager.tsx', 1],
  ['app/(app)/settings/usage/page.tsx', 5],
  ['app/(app)/settings/usage/PlanMarketCheckout.tsx', 2],
  ['app/(app)/suppliers/[id]/client.tsx', 3],
  ['app/(app)/training/courses/new/client.tsx', 2],
  ['app/(app)/udi/[id]/client.tsx', 1],
  ['app/(app)/udi/new/client.tsx', 5],
  ['app/(app)/vigilance/[id]/client.tsx', 2],
  ['app/(app)/vigilance/new/client.tsx', 4],
  ['app/(auth)/login/page.tsx', 10],
  ['app/(public)/(drafts)/business-info/page.tsx', 3],
  ['app/(public)/(drafts)/privacy/page.tsx', 25],
  ['app/(public)/(drafts)/terms/page.tsx', 34],
  ['app/(public)/open-source/page.tsx', 6],
  ['app/not-found.tsx', 2],
  ['app/onboarding/page.tsx', 5],
  ['app/onboarding/qms-setup/client.tsx', 4],
  ['app/pending-approval/page.tsx', 3],
  ['components/admin/ConditionRulesPanel.tsx', 3],
  ['components/admin/CspReportsPanel.tsx', 2],
  ['components/admin/DocsetActivateSheet.tsx', 1],
  ['components/admin/DocsetEditionsPanel.tsx', 5],
  ['components/admin/DocsetStructurePanel.tsx', 2],
  ['components/admin/DocsetStructureParts.tsx', 4],
  ['components/admin/MemberHandoverDialog.tsx', 1],
  ['components/admin/MfdsPermitDossierPanel.tsx', 3],
  ['components/admin/OrgEditPanel.tsx', 2],
  ['components/admin/TransferMemberDialog.tsx', 3],
  ['components/AiDraftAssist.tsx', 1],
  ['components/AssessmentDocApprovalPanel.tsx', 1],
  ['components/AvatarUploader.tsx', 1],
  ['components/BackwardsPlanner.tsx', 3],
  ['components/calendar/CalendarClient.tsx', 1],
  ['components/CancelAssessmentButton.tsx', 2],
  ['components/capa/CapaSheetsPanel.tsx', 2],
  ['components/ChangeRequestInbox.tsx', 1],
  ['components/DangerZone.tsx', 1],
  ['components/dashboard/ClinicalDashboardView.tsx', 9],
  ['components/dashboard/CustomizableWidgetBoard.tsx', 1],
  ['components/dashboard/GettingStartedChecklist.tsx', 4],
  ['components/dashboard/MedQraftAdminView.tsx', 4],
  ['components/DeleteAssessmentButton.tsx', 2],
  ['components/DesignChangeRequestButton.tsx', 1],
  ['components/DesignReviewPanel.tsx', 3],
  ['components/device-licenses/LicenseSubmissionDocsPanel.tsx', 6],
  ['components/DocChecklistPanel.tsx', 6],
  ['components/DocCommentThread.tsx', 1],
  ['components/DocContentViewer.tsx', 2],
  ['components/DocumentApprovalPanel.tsx', 3],
  ['components/DocumentArtifactPanel.tsx', 4],
  ['components/equipment/EquipmentEventsPanel.tsx', 1],
  ['components/exchange/ExchangePanel.tsx', 2],
  ['components/exchange/LinkPanel.tsx', 5],
  ['components/ExecutionCompletePanel.tsx', 3],
  ['components/ExpertScorePanel.tsx', 1],
  ['components/FieldPhotoGallery.tsx', 1],
  ['components/FinalDecisionPanel.tsx', 3],
  ['components/GlobalSearch.tsx', 2],
  ['components/GraduateProjectAction.tsx', 1],
  ['components/IfuClassifyDrawer.tsx', 2],
  ['components/InquiryButton.tsx', 2],
  ['components/item-classification/MfdsRegisteredProducts.tsx', 2],
  ['components/ItemClassificationPreview.tsx', 9],
  ['components/KeywordReviewModal.tsx', 2],
  ['components/MedqraftTemplateSummary.tsx', 2],
  ['components/ModuleLockedNotice.tsx', 4],
  ['components/OpinionForm.tsx', 1],
  ['components/OwnerProductWorkflow.tsx', 1],
  ['components/OwnerResearchPipeline.tsx', 2],
  ['components/PasskeyCard.tsx', 2],
  ['components/PasskeyOffer.tsx', 1],
  ['components/PendingResearchDocs.tsx', 4],
  ['components/PhoneModeGate.tsx', 1],
  ['components/ProductionYieldPanel.tsx', 2],
  ['components/ProductPickField.tsx', 4],
  ['components/ProductProfileWizard.tsx', 6],
  ['components/PushSubscribeButton.tsx', 2],
  ['components/qms/DefaultDocsPanel.tsx', 2],
  ['components/qms/SheetEditor.tsx', 3],
  ['components/QmsLinkedProcedureModal.tsx', 2],
  ['components/RaProgressPanel.tsx', 3],
  ['components/RaStatusNotice.tsx', 1],
  ['components/RdDocumentFlowPanel.tsx', 3],
  ['components/recalls/RecallConsigneesPanel.tsx', 1],
  ['components/RegulatoryChangesPanel.tsx', 1],
  ['components/ReleaseSignPanel.tsx', 2],
  ['components/RequestReviewButton.tsx', 1],
  ['components/RequirementsDashboard.tsx', 10],
  ['components/research/DesignTransferPanel.tsx', 2],
  ['components/research/DhfIndexPanel.tsx', 2],
  ['components/ResearchChangeRequestsPanel.tsx', 6],
  ['components/SessionExpiryGate.tsx', 2],
  ['components/SessionIdleMonitor.tsx', 1],
  ['components/SignOutEverywhere.tsx', 2],
  ['components/StageProgressionAction.tsx', 2],
  ['components/StageRevertAction.tsx', 1],
  ['components/SubmissionTrackingPanel.tsx', 2],
  ['components/SuggestionDetailModal.tsx', 11],
  ['components/suppliers/SupplierEvalPanel.tsx', 1],
  ['components/suppliers/SupplierItemsPanel.tsx', 1],
  ['components/suppliers/SupplierShipmentsPanel.tsx', 1],
  ['components/TodayQueue.tsx', 2],
  ['components/VaultUnlockGate.tsx', 4],
  ['components/WelcomeFlow.tsx', 4],
];

const SENT = /[가-힣][^<>{}]{8,}?(입니다|십시오|됩니다|합니다|있습니다|없습니다|주세요|하세요)\./g;
/** 이 부품 안의 문장은 날것이 아니다 */
const WRAPPERS = ['HelpNote', 'SectionTitleInfo', 'InfoDot', 'Alert', 'FldError', 'EmptyState', 'NextStep', 'LegalNote', 'Modal', 'Confirm', 'Toast', 'PageGuide', 'FormNote', 'TruncatedNote'];
const SKIP = (rel: string) =>
  rel.startsWith('app/(app)/m/') || rel.startsWith('app/experts/') || rel.startsWith('app/global-error') ||
  /^app\/(terms|privacy|open-source|legal)/.test(rel);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

/** 글 노드 앞 1200자 안에서 가장 가까운 «열려 있는» 부품 이름(닫힌 것은 뺌). info={ … } 프롭 안이면 SectionTitleInfo 로 친다. */
export function wrapperOf(before: string): string | null {
  let best: { name: string; at: number } | null = null;
  for (const w of WRAPPERS) {
    const open = before.lastIndexOf('<' + w);
    if (open < 0) continue;
    const nextChar = before[open + w.length + 1];
    if (nextChar && /[A-Za-z0-9]/.test(nextChar)) continue; // <AlertCircle 같은 다른 이름
    const close = before.lastIndexOf('</' + w);
    if (close > open) continue;
    if (!best || open > best.at) best = { name: w, at: open };
  }
  if (best) return best.name;
  // info={<>…</>} · info={ … } 프롭 안
  const infoAt = before.lastIndexOf('info={');
  if (infoAt >= 0) {
    const tail = before.slice(infoAt);
    let depth = 0;
    for (const c of tail) {
      if (c === '{') depth++;
      else if (c === '}') depth--;
    }
    if (depth > 0) return 'SectionTitleInfo';
  }
  return null;
}

export function countBare(src: string): number {
  const code = codeOnly(src);
  let bare = 0;
  const re = />([^<>{}]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(code))) {
    const sents = m[1].match(SENT);
    if (!sents) continue;
    const before = code.slice(Math.max(0, m.index - 1200), m.index);
    if (wrapperOf(before)) continue;
    bare += sents.length;
  }
  return bare;
}

export function scan(): Map<string, number> {
  const files: string[] = [];
  for (const d of ['components', 'app']) walk(join(REPO_ROOT, d), files);
  const per = new Map<string, number>();
  for (const f of files) {
    const rel = relative(REPO_ROOT, f).replace(/\\/g, '/');
    if (SKIP(rel)) continue;
    const n = countBare(readFileSync(f, 'utf8'));
    if (n > 0) per.set(rel, n);
  }
  return per;
}

function literal(found: Map<string, number>): string {
  return [...found.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, n]) => `  ['${f}', ${n}],`).join('\n');
}

describe('설명 글귀는 ⓘ 안으로(날것 설명 문장은 기준선 이하)', () => {
  const found = scan();
  const expected = new Map(REMAINING);

  it('기준선에 없는 파일에 날것 설명 문장이 생기지 않았다', () => {
    const extra = [...found.entries()].filter(([f]) => !expected.has(f)).map(([f, n]) => `${f} ${n}`);
    if (extra.length) console.log('현재 상태의 기준선:\n' + literal(found));
    expect(extra, '새 설명 문장. 세 층 ⓘ(PageGuide · SectionTitleInfo · FldRow info=)로 넣거나, 남겨도 되는 네 가지(Alert · EmptyState · NextStep · LegalNote)로 쓸 것').toEqual([]);
  });

  it('기준선의 개수가 실제와 같다(줄었으면 기준선도 줄일 것 · 늘었으면 되돌릴 것)', () => {
    const diff: string[] = [];
    for (const [f, exp] of expected) {
      const got = found.get(f) ?? 0;
      if (got !== exp) diff.push(`${f}: 기준선 ${exp} → 실제 ${got}`);
    }
    if (diff.length) console.log('현재 상태의 기준선:\n' + literal(found));
    expect(diff).toEqual([]);
  });

  it('합계는 내려가기만 한다(기록용)', () => {
    let total = 0;
    for (const [, n] of expected) total += n;
    // 2026-10-08 시작 기준선. 묶음마다 이 숫자를 내린다.
    expect(total).toBeLessThanOrEqual(600);
  });

  it('세는 법은 날것을 잡고 부품 안은 지나간다(일부러 깨뜨려 본 것)', () => {
    expect(countBare(`<p>변경 대상을 먼저 고르십시오.</p>`)).toBe(1);
    expect(countBare(`<div>① 빈 양식 다운로드. 시스템에서 직접 작성하지 않아도 됩니다.</div>`)).toBe(1);
    expect(countBare(`<InfoDot label="x">제품을 고르면 정보가 따라옵니다.</InfoDot>`)).toBe(0);
    expect(countBare(`<SectionTitleInfo info={<>순서대로 하십시오.</>}>제목</SectionTitleInfo>`)).toBe(0);
    expect(countBare(`<Alert kind="error">파일만 올릴 수 있습니다.</Alert>`)).toBe(0);
    expect(countBare(`<NextStep>변경 대상을 먼저 고르십시오.</NextStep>`)).toBe(0);
    expect(countBare(`<Alert kind="info">안내입니다.</Alert><p>그 뒤의 날것 문장은 따로 세어야 합니다.</p>`)).toBe(1);
    expect(countBare(`<AlertCircle /><p>다른 이름에 속지 않아야 합니다.</p>`)).toBe(1);
    expect(countBare(`<span>짧음.</span><span>예: 실리콘 A사</span>`)).toBe(0);
  });
});
