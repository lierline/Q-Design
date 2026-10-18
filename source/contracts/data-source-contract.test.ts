/**
 * 데이터 출처는 ⓘ 안에 (2026-10-18 오너 결정 «가 안»)
 *
 * 오너 요청: «기록 관리 같은 화면은 예시 데이터가 없으면 어디서 데이터를 가져오는지 알 수가 없다. 안내 버튼 안에도
 * 그 내용이 들어가면 좋겠다.» 같은 날 전수 점검(627 구역)에서 출처를 제대로 말하는 구역은 43곳(7%)뿐이었고,
 * ⓘ 자체가 없는 구역이 415곳이었다. 그래서 문장을 덧붙이는 대신 공용 부품에 «데이터 출처» 자리를 만들었다
 * (lib/design/components.tsx 의 SourceNote · withSource, PageGuide 의 «데이터는 어디서 오나요?»).
 *
 * 이 계약은 세 가지를 센다. 셋 다 «남아 있는 것» 의 목록이 기준선이고, 묶음마다 줄인다. 늘면 빨강이다.
 *   ① 화면 머리 안내(PAGE_GUIDES)에 dataSource 가 없는 것.
 *   ② 써 두고 어느 화면에도 붙이지 않은 안내(pageId · pageGuideId 로 아무도 부르지 않는 PAGE_GUIDES 항목).
 *   ③ 구역 · 지표 부품(PageHd · Section · SectionCard · SectionTitleInfo · SectionTitle · FormSection · KPI)을
 *      source= 없이 쓴 자리. 파일 → 개수.
 *      · source={null} 은 «데이터를 담지 않는 구역» 이라는 명시적 선언이라 «적었다» 로 센다.
 *      · PageHd 는 같은 폴더에 화면 머리 안내(<PageGuide · pageGuideId=)가 있으면 그쪽 dataSource 가 맡으므로 세지 않는다.
 *      · 칸 ⓘ(Field · FldRow info=)는 세지 않는다. 칸은 대부분 «여기에 직접 적는 값» 이라 구역 출처가 덮는다.
 *      · 기록부(Register)는 부품이 «이 회사가 이 칸에서 직접 적은 줄» 을 기본으로 붙이므로 세지 않는다.
 * 어긋나면 붙여 넣을 리터럴을 찍어 준다. AST 로 세지만 «부품을 썼는가» 만 보므로, 손으로 짠 구역(div 제목)은 못 본다.
 * 그런 자리는 점검 보고(docs/audits/INFO_DOT_DATA_SOURCE_AUDIT_2026-10-18.md)의 목록으로 따로 줄인다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '@/lib/test-utils/contract-source';
import { PAGE_GUIDES } from '@/lib/page-guides';

// ── 기준선 ───────────────────────────────────────────────────────────────────
// 2026-10-18 묶음 1(공용 부품 자리 + 먼저 고칠 안내 10곳): ① 61 안내 · ② 0 · ③ 209 파일 584 자리.
// 묶음마다 줄인다. 셋 다 비면 이 가드는 «새 구역은 처음부터 출처와 함께» 만 지킨다.

/** ① dataSource 가 아직 없는 화면 머리 안내 */
const GUIDES_WITHOUT_SOURCE: readonly string[] = [
  'admin-default-templates',
  'admin-docset-library',
  'admin-q-match-training',
  'admin-qmatch-quiz',
  'assessments',
  'audit',
  'audit-readiness',
  'audits',
  'authorized-reps',
  'calendar',
  'calibration',
  'capa',
  'cleanroom',
  'clinical-evaluations',
  'complaints',
  'dashboard',
  'design-trace',
  'device-licenses',
  'eu-mdr',
  'experts-pool',
  'fda-510k',
  'feedback',
  'inbox',
  'letter-to-file',
  'lots',
  'management-reviews',
  'messages',
  'nmpa',
  'nonconformances',
  'notifications',
  'pmda',
  'pms',
  'process-templates',
  'process-validations',
  'production-equipment',
  'products',
  'qa-workspace',
  'qms-documents',
  'quality-objectives',
  'ra-workspace',
  'recalls',
  'reimbursement',
  'research-changes',
  'research-compliance',
  'research-design-requirements',
  'research-home',
  'research-list',
  'research-new',
  'research-profile',
  'research-reviews',
  'research-risks',
  'research-settings',
  'settings',
  'settings-templates',
  'settings-usage',
  'standards',
  'sterilization',
  'suppliers',
  'training',
  'udi',
  'vigilance',
];

/** ② 써 두고 아무 화면도 부르지 않는 안내 */
const GUIDES_NOT_SHOWN: readonly string[] = [];

/** ③ source= 없이 쓴 구역 · 지표 부품. 파일 → 개수. 0 이 되면 줄을 지운다. */
const PARTS_WITHOUT_SOURCE: ReadonlyArray<[string, number]> = [
  ['app/(app)/admin/activity/page.tsx', 16],
  ['app/(app)/admin/ai-control/_tabs/Models.tsx', 3],
  ['app/(app)/admin/ai-control/_tabs/Overview.tsx', 4],
  ['app/(app)/admin/ai-control/page.tsx', 1],
  ['app/(app)/admin/alias-queue/page.tsx', 1],
  ['app/(app)/admin/core-accuracy/page.tsx', 2],
  ['app/(app)/admin/default-templates/page.tsx', 4],
  ['app/(app)/admin/engine-assumptions/page.tsx', 2],
  ['app/(app)/admin/eval-sets/[id]/review/page.tsx', 2],
  ['app/(app)/admin/eval-sets/page.tsx', 4],
  ['app/(app)/admin/expert-invites/page.tsx', 3],
  ['app/(app)/admin/experts/page.tsx', 8],
  ['app/(app)/admin/knowledge/page.tsx', 3],
  ['app/(app)/admin/mfds-diagnostics/page.tsx', 6],
  ['app/(app)/admin/multi-view/page.tsx', 9],
  ['app/(app)/admin/page.tsx', 9],
  ['app/(app)/admin/permissions-matrix/page.tsx', 6],
  ['app/(app)/admin/q-match-training/page.tsx', 2],
  ['app/(app)/admin/qmatch-quiz/page.tsx', 4],
  ['app/(app)/admin/rule-table/page.tsx', 6],
  ['app/(app)/admin/screening/page.tsx', 9],
  ['app/(app)/admin/subscriptions/page.tsx', 7],
  ['app/(app)/admin/users/page.tsx', 2],
  ['app/(app)/admin/users/users-table-client.tsx', 4],
  ['app/(app)/admin/validation-evidence/page.tsx', 7],
  ['app/(app)/admin/vigilance/page.tsx', 4],
  ['app/(app)/assessments/[code]/page.tsx', 8],
  ['app/(app)/assessments/new/page.tsx', 2],
  ['app/(app)/audit-readiness/client.tsx', 2],
  ['app/(app)/audit/page.tsx', 3],
  ['app/(app)/audits/[id]/client.tsx', 3],
  ['app/(app)/audits/new/client.tsx', 1],
  ['app/(app)/audits/page.tsx', 1],
  ['app/(app)/authorized-reps/[id]/client.tsx', 6],
  ['app/(app)/authorized-reps/new/client.tsx', 1],
  ['app/(app)/authorized-reps/page.tsx', 1],
  ['app/(app)/calibration/[id]/page.tsx', 7],
  ['app/(app)/calibration/page.tsx', 9],
  ['app/(app)/calibration/suggestions/page.tsx', 6],
  ['app/(app)/capa/[id]/client.tsx', 4],
  ['app/(app)/capa/new/client.tsx', 1],
  ['app/(app)/capa/page.tsx', 1],
  ['app/(app)/cleanroom/[id]/client.tsx', 6],
  ['app/(app)/cleanroom/new/client.tsx', 1],
  ['app/(app)/cleanroom/page.tsx', 1],
  ['app/(app)/clinical-evaluations/[id]/client.tsx', 1],
  ['app/(app)/clinical-evaluations/new/client.tsx', 1],
  ['app/(app)/clinical-evaluations/page.tsx', 1],
  ['app/(app)/complaints/[id]/client.tsx', 10],
  ['app/(app)/complaints/new/client.tsx', 1],
  ['app/(app)/complaints/page.tsx', 1],
  ['app/(app)/contracts/[id]/page.tsx', 2],
  ['app/(app)/customer-property/[id]/page.tsx', 2],
  ['app/(app)/design-trace/client.tsx', 1],
  ['app/(app)/device-licenses/[id]/client.tsx', 4],
  ['app/(app)/device-licenses/new/client.tsx', 1],
  ['app/(app)/device-licenses/page.tsx', 1],
  ['app/(app)/equipment/[id]/client.tsx', 5],
  ['app/(app)/equipment/new/client.tsx', 1],
  ['app/(app)/equipment/page.tsx', 1],
  ['app/(app)/eu-mdr/[id]/client.tsx', 6],
  ['app/(app)/eu-mdr/new/client.tsx', 1],
  ['app/(app)/eu-mdr/page.tsx', 1],
  ['app/(app)/experts/page.tsx', 4],
  ['app/(app)/family-link/page.tsx', 1],
  ['app/(app)/fda-510k/[id]/client.tsx', 7],
  ['app/(app)/fda-510k/new/client.tsx', 1],
  ['app/(app)/fda-510k/page.tsx', 1],
  ['app/(app)/feedback/[id]/client.tsx', 4],
  ['app/(app)/feedback/new/client.tsx', 1],
  ['app/(app)/feedback/page.tsx', 1],
  ['app/(app)/glossary/page.tsx', 1],
  ['app/(app)/inbox/[id]/page.tsx', 5],
  ['app/(app)/inbox/page.tsx', 7],
  ['app/(app)/letter-to-file/[id]/client.tsx', 1],
  ['app/(app)/letter-to-file/new/client.tsx', 1],
  ['app/(app)/letter-to-file/page.tsx', 1],
  ['app/(app)/lots/[id]/client.tsx', 8],
  ['app/(app)/lots/new/client.tsx', 1],
  ['app/(app)/lots/page.tsx', 1],
  ['app/(app)/management-reviews/[id]/client.tsx', 5],
  ['app/(app)/management-reviews/new/client.tsx', 1],
  ['app/(app)/management-reviews/page.tsx', 1],
  ['app/(app)/my-actions/page.tsx', 1],
  ['app/(app)/nmpa/[id]/client.tsx', 6],
  ['app/(app)/nmpa/new/client.tsx', 1],
  ['app/(app)/nmpa/page.tsx', 1],
  ['app/(app)/nonconformances/[id]/client.tsx', 5],
  ['app/(app)/nonconformances/[id]/dispositions-section.tsx', 1],
  ['app/(app)/nonconformances/[id]/impact-section.tsx', 1],
  ['app/(app)/nonconformances/new/client.tsx', 1],
  ['app/(app)/nonconformances/page.tsx', 1],
  ['app/(app)/notifications/page.tsx', 7],
  ['app/(app)/pmda/[id]/client.tsx', 6],
  ['app/(app)/pmda/new/client.tsx', 1],
  ['app/(app)/pmda/page.tsx', 1],
  ['app/(app)/pms/[id]/client.tsx', 5],
  ['app/(app)/pms/new/client.tsx', 1],
  ['app/(app)/pms/page.tsx', 1],
  ['app/(app)/process-templates/form.tsx', 3],
  ['app/(app)/process-validations/form.tsx', 3],
  ['app/(app)/process-validations/page.tsx', 1],
  ['app/(app)/production-equipment/form.tsx', 3],
  ['app/(app)/production-equipment/page.tsx', 1],
  ['app/(app)/qa/qa-workspace-client.tsx', 1],
  ['app/(app)/quality-objectives/[id]/client.tsx', 6],
  ['app/(app)/quality-objectives/new/client.tsx', 1],
  ['app/(app)/quality-objectives/page.tsx', 1],
  ['app/(app)/ra/ra-workspace-client.tsx', 2],
  ['app/(app)/recalls/[id]/client.tsx', 8],
  ['app/(app)/recalls/new/client.tsx', 1],
  ['app/(app)/recalls/page.tsx', 1],
  ['app/(app)/research/[code]/page.tsx', 4],
  ['app/(app)/research/[code]/profile/page.tsx', 3],
  ['app/(app)/research/[code]/reviews/page.tsx', 1],
  ['app/(app)/research/[code]/settings/page.tsx', 2],
  ['app/(app)/research/new/page.tsx', 3],
  ['app/(app)/research/research-client.tsx', 1],
  ['app/(app)/settings/compliance/compliance-manager.tsx', 1],
  ['app/(app)/settings/exchange/page.tsx', 1],
  ['app/(app)/settings/export/ExportPanel.tsx', 3],
  ['app/(app)/settings/export/page.tsx', 1],
  ['app/(app)/settings/members/member-admin-client.tsx', 1],
  ['app/(app)/settings/members/page.tsx', 4],
  ['app/(app)/settings/members/solo-mode-toggle.tsx', 1],
  ['app/(app)/settings/page.tsx', 11],
  ['app/(app)/settings/passkeys/page.tsx', 1],
  ['app/(app)/settings/templates/page.tsx', 1],
  ['app/(app)/settings/templates/template-manager.tsx', 4],
  ['app/(app)/settings/usage/page.tsx', 6],
  ['app/(app)/standards/[id]/client.tsx', 7],
  ['app/(app)/standards/new/client.tsx', 1],
  ['app/(app)/standards/page.tsx', 1],
  ['app/(app)/sterilization/[id]/client.tsx', 7],
  ['app/(app)/sterilization/new/client.tsx', 1],
  ['app/(app)/sterilization/page.tsx', 1],
  ['app/(app)/suppliers/[id]/client.tsx', 6],
  ['app/(app)/suppliers/client.tsx', 1],
  ['app/(app)/training/courses/[id]/log/client.tsx', 1],
  ['app/(app)/training/courses/new/client.tsx', 1],
  ['app/(app)/training/records/[id]/page.tsx', 1],
  ['app/(app)/udi/[id]/client.tsx', 6],
  ['app/(app)/udi/page.tsx', 1],
  ['app/(app)/vigilance/[id]/client.tsx', 5],
  ['app/(app)/vigilance/new/client.tsx', 1],
  ['app/(app)/vigilance/page.tsx', 1],
  ['app/pending-approval/page.tsx', 1],
  ['components/admin/ConditionRulesPanel.tsx', 1],
  ['components/admin/CspReportsPanel.tsx', 1],
  ['components/admin/MfdsPermitDossierPanel.tsx', 9],
  ['components/admin/ServiceStatusPanel.tsx', 3],
  ['components/AttachmentManager.tsx', 1],
  ['components/AuditReadinessWidget.tsx', 1],
  ['components/BackwardsPlanner.tsx', 2],
  ['components/calendar/CalendarClient.tsx', 2],
  ['components/capa/CapaSheetsPanel.tsx', 2],
  ['components/ChangeRequestInbox.tsx', 1],
  ['components/complaints/ComplaintInvestigationPanel.tsx', 1],
  ['components/dashboard/ClinicalDashboardView.tsx', 7],
  ['components/dashboard/ExecDashboardView.tsx', 1],
  ['components/dashboard/MedQraftAdminView.tsx', 10],
  ['components/dashboard/ProductionDashboardView.tsx', 7],
  ['components/dashboard/QADashboardView.tsx', 6],
  ['components/dashboard/RADashboardView.tsx', 6],
  ['components/dashboard/RDDashboardView.tsx', 6],
  ['components/DesignReviewPanel.tsx', 1],
  ['components/device-licenses/LicenseSubmissionDocsPanel.tsx', 2],
  ['components/DocChecklistPanel.tsx', 1],
  ['components/equipment/EquipmentCalibrationsPanel.tsx', 1],
  ['components/equipment/EquipmentEventsPanel.tsx', 1],
  ['components/exchange/ExchangePanel.tsx', 4],
  ['components/exchange/LinkPanel.tsx', 4],
  ['components/GlossaryPanel.tsx', 5],
  ['components/GraduateProjectAction.tsx', 1],
  ['components/HubModuleGrid.tsx', 1],
  ['components/InternalReviewQueue.tsx', 1],
  ['components/MarketAccessWidget.tsx', 1],
  ['components/MedqraftTemplateSummary.tsx', 1],
  ['components/MyActionItems.tsx', 1],
  ['components/OwnerProductWorkflow.tsx', 2],
  ['components/OwnerResearchPipeline.tsx', 2],
  ['components/PasskeyCard.tsx', 1],
  ['components/PendingResearchDocs.tsx', 1],
  ['components/ProductionYieldPanel.tsx', 5],
  ['components/ProductProfileWizard.tsx', 2],
  ['components/ProjectComplianceScore.tsx', 1],
  ['components/qms/SheetEditor.tsx', 1],
  ['components/QmsStatusWidget.tsx', 1],
  ['components/RaProgressPanel.tsx', 1],
  ['components/recalls/RecallConsigneesPanel.tsx', 1],
  ['components/recalls/RecallRecordFields.tsx', 2],
  ['components/RegulatoryChangesPanel.tsx', 1],
  ['components/RegulatoryDeadlinesWidget.tsx', 1],
  ['components/RegulatoryPipelineWidget.tsx', 1],
  ['components/RegulatoryRoadmap.tsx', 1],
  ['components/RegulatoryWatchWidget.tsx', 1],
  ['components/ReleaseSignPanel.tsx', 2],
  ['components/ResearchChangeRequestsPanel.tsx', 1],
  ['components/RoleReviewPanel.tsx', 1],
  ['components/RoleWorkspaceKpis.tsx', 1],
  ['components/SignOutEverywhere.tsx', 1],
  ['components/StageProgressionAction.tsx', 1],
  ['components/SubmissionTrackingPanel.tsx', 4],
  ['components/suppliers/SupplierDocsPanel.tsx', 1],
  ['components/suppliers/SupplierEvalPanel.tsx', 1],
  ['components/suppliers/SupplierItemsPanel.tsx', 1],
  ['components/suppliers/SupplierShipmentsPanel.tsx', 1],
  ['components/TeamActivityFeed.tsx', 1],
  ['components/TodayQueue.tsx', 1],
];

// ── 세는 법 ──────────────────────────────────────────────────────────────────

export const SOURCE_PARTS = ['PageHd', 'Section', 'SectionCard', 'SectionTitleInfo', 'SectionTitle', 'FormSection', 'KPI'] as const;

const SKIP = (rel: string) =>
  rel.startsWith('app/global-error') ||
  // 공개 법규 페이지(이용약관 · 개인정보처리방침 · 오픈소스 고지 · 사업자정보)는 데이터를 보여 주는 화면이 아니다.
  /^app\/(terms|privacy|open-source|legal)/.test(rel) ||
  /^app\/\(public\)\/(\(drafts\)\/)?(terms|privacy|open-source|business-info)\//.test(rel);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.next')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

function sourceFiles(): Array<{ rel: string; src: string }> {
  const files: string[] = [];
  for (const d of ['components', 'app']) walk(join(REPO_ROOT, d), files);
  return files
    .map((f) => ({ rel: relative(REPO_ROOT, f).replace(/\\/g, '/'), f }))
    .filter(({ rel }) => !SKIP(rel))
    .map(({ rel, f }) => ({ rel, src: readFileSync(f, 'utf8') }));
}

/** 이 파일에서 source= 없이 쓴 부품 이름들. headCovered 면 PageHd 는 세지 않는다. */
export function partsWithoutSource(src: string, headCovered = false): string[] {
  const sf = ts.createSourceFile('x.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      if ((SOURCE_PARTS as readonly string[]).includes(tag) && !(tag === 'PageHd' && headCovered)) {
        // {...props} 로 넘기는 자리는 호출부가 정하므로 «적었다» 로 본다
        const has = n.attributes.properties.some(
          (a) => ts.isJsxSpreadAttribute(a) || (ts.isJsxAttribute(a) && a.name.getText(sf) === 'source'),
        );
        if (!has) out.push(tag);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

const HEAD_GUIDE = /<PageGuide[\s>]|pageGuideId=/;

export function scanParts(files = sourceFiles()): Map<string, number> {
  // 화면 머리 안내가 있는 폴더(page.tsx 와 같은 폴더의 client 파일이 PageHd 를 그리는 경우가 많다)
  const guidedDirs = new Set(files.filter(({ src }) => HEAD_GUIDE.test(src)).map(({ rel }) => dirname(rel)));
  const per = new Map<string, number>();
  for (const { rel, src } of files) {
    const n = partsWithoutSource(src, guidedDirs.has(dirname(rel))).length;
    if (n > 0) per.set(rel, n);
  }
  return per;
}

export function guidesNotShown(files = sourceFiles()): string[] {
  // <PageGuide pageId="…"> 와 <PageWidgetBoard pageGuideId="…"> 만 «부른다» 로 센다.
  // PageWidgetBoard 의 pageId= 는 위젯 배치 저장 이름이라 안내를 띄우지 않는다.
  const called = new Set<string>();
  const res = [
    /<PageGuide\b[^>]*?\bpageId=(?:\{\s*)?["'`]([a-z0-9-]+)["'`]/g,
    /\bpageGuideId=(?:\{\s*)?["'`]([a-z0-9-]+)["'`]/g,
  ];
  for (const { src } of files) {
    for (const re of res) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) called.add(m[1]);
    }
  }
  return Object.keys(PAGE_GUIDES).filter((id) => !called.has(id)).sort();
}

export function guidesWithoutSource(): string[] {
  return Object.entries(PAGE_GUIDES)
    .filter(([, g]) => !g.dataSource || !g.dataSource.trim())
    .map(([id]) => id)
    .sort();
}

const listLiteral = (ids: string[]) => ids.map((id) => `  '${id}',`).join('\n');
const mapLiteral = (found: Map<string, number>) =>
  [...found.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, n]) => `  ['${f}', ${n}],`).join('\n');

// ── 시험 ─────────────────────────────────────────────────────────────────────

describe('데이터 출처는 ⓘ 안에(기준선 이하)', () => {
  const files = sourceFiles();

  it('① 화면 머리 안내: dataSource 없는 안내가 기준선과 같다', () => {
    const now = guidesWithoutSource();
    if (JSON.stringify(now) !== JSON.stringify([...GUIDES_WITHOUT_SOURCE].sort())) {
      console.log('① 현재 상태의 기준선:\n' + listLiteral(now));
    }
    const extra = now.filter((id) => !GUIDES_WITHOUT_SOURCE.includes(id));
    expect(extra, '새 화면 머리 안내는 dataSource(데이터는 어디서 오나요?)와 함께 쓸 것').toEqual([]);
    const fixed = GUIDES_WITHOUT_SOURCE.filter((id) => !now.includes(id));
    expect(fixed, '출처를 채운 안내는 기준선에서 지울 것').toEqual([]);
  });

  it('② 써 둔 안내는 어느 화면이든 부른다', () => {
    const now = guidesNotShown(files);
    if (JSON.stringify(now) !== JSON.stringify([...GUIDES_NOT_SHOWN].sort())) {
      console.log('② 현재 상태의 기준선:\n' + listLiteral(now));
    }
    const extra = now.filter((id) => !GUIDES_NOT_SHOWN.includes(id));
    expect(extra, '안내를 썼으면 그 화면에 <PageGuide pageId=…> 를 붙일 것(경로로 찾아 주는 곳은 꺼져 있다)').toEqual([]);
    const fixed = GUIDES_NOT_SHOWN.filter((id) => !now.includes(id));
    expect(fixed, '화면에 붙인 안내는 기준선에서 지울 것').toEqual([]);
  });

  it('③ 구역 · 지표 부품: source= 없는 자리가 기준선과 같다', () => {
    const found = scanParts(files);
    const expected = new Map(PARTS_WITHOUT_SOURCE);
    const diff: string[] = [];
    for (const [f, n] of found) if ((expected.get(f) ?? 0) !== n) diff.push(`${f}: 기준선 ${expected.get(f) ?? 0} → 실제 ${n}`);
    for (const [f, n] of expected) if (!found.has(f)) diff.push(`${f}: 기준선 ${n} → 실제 0`);
    if (diff.length) console.log('③ 현재 상태의 기준선:\n' + mapLiteral(found));
    expect(diff, '늘었으면 source= 를 적을 것(데이터 없는 구역은 source={null}) · 줄었으면 기준선도 줄일 것').toEqual([]);
  });

  it('세는 법은 빠진 자리를 잡고 적은 자리는 지나간다(일부러 깨뜨려 본 것)', () => {
    expect(partsWithoutSource(`<Section title="x">a</Section>`)).toEqual(['Section']);
    expect(partsWithoutSource(`<Section title="x" source="이 회사가 적은 줄입니다.">a</Section>`)).toEqual([]);
    expect(partsWithoutSource(`<SectionTitle source={null}>x</SectionTitle>`)).toEqual([]);
    expect(partsWithoutSource(`<KPI label="x" value={1} />`)).toEqual(['KPI']);
    expect(partsWithoutSource(`<PageHd title="x" />`)).toEqual(['PageHd']);
    expect(partsWithoutSource(`<PageHd title="x" />`, true)).toEqual([]);
    expect(partsWithoutSource(`<SectionCardList />`)).toEqual([]);
    expect(partsWithoutSource(`<Section {...p} />`)).toEqual([]);
  });
});
