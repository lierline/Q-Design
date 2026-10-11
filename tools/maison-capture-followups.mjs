import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const product=resolve(root,'../Q-Works');
const dir=join(root,'reviews/maison-pages/screens');
const sha=value=>createHash('sha256').update(value).digest('hex');
const captures=readdirSync(dir).filter(x=>x.endsWith('.json')).map(file=>({file,...JSON.parse(readFileSync(join(dir,file),'utf8'))}));
const reviews=JSON.parse(readFileSync(join(root,'reviews/maison-pages-visual-review.json'),'utf8')).reviews;
const targets=JSON.parse(readFileSync(join(root,'reviews/maison-pages-targets.json'),'utf8')).targets;
const latestReviews=reviews.filter(row=>existsSync(join(root,'reviews',row.image))&&sha(readFileSync(join(root,'reviews',row.image)))===row.sha256);
const fixtureFile=join(root,'reviews/maison-pages-quality-fixture.json');
const qualityFixture=existsSync(fixtureFile)?JSON.parse(readFileSync(fixtureFile,'utf8')):null;
const horizontalRequirements={
  '/inspections/incoming':'공정 흐름의 오른쪽 후속 단계 전체',
  '/kpi/evaluations':'평가 계획 목록의 오른쪽 숨은 열. 이 별칭 경로는 /kpi에 도착하므로 실제 KPI 목록 안 평가계획 표를 확인',
  '/nc':'부적합품 목록의 담당자 오른쪽 숨은 열',
  '/objectives/[id]':'KPI 기록 이력 표 오른쪽 열과 접힌 1건. 실제 URL은 /kpi/[id]?from=objectives',
  '/production':'재고 공정 흐름의 오른쪽 후속 단계',
  '/purchasing/orders/new':'발주내역 RowsEditor의 비고 및 오른쪽 후속 열',
  '/purchasing/quotes/new':'견적품목 RowsEditor의 금액 및 오른쪽 후속 열',
  '/qc-charts/new':'관리항목 RowsEditor의 주기·계측기·기록문서·책임부서와 행 끝 행동',
  '/qc-charts/[id]':'관리항목 5행의 주기·계측기·기록문서·책임부서와 행 끝 행동',
  '/recalls':'리콜 목록의 미회수 및 오른쪽 후속 열',
};
const evidence=path=>({path,sha256:sha(readFileSync(join(product,path)))});
const blocked=captures.filter(c=>/품질 책임자 · 품질 팀장만 작성합니다/.test(c.body||''));
const report={
  version:1,generatedAt:new Date().toISOString(),
  scope:'Current saved real-browser DOM is searched for explicit permission-denied states and redirect outcomes; horizontal follow-ups come from direct pixel observations bound to the current image SHA. Not a blanket all-state or all-role pass.',
  summary:{savedDomCaptures:captures.length,currentShaVisualReviews:latestReviews.length,explicitPermissionBlockedRoutes:new Set(blocked.map(c=>c.route)).size,horizontalObservedRoutes:Object.keys(horizontalRequirements).length},
  roleFollowups:blocked.map(c=>({route:c.route,url:c.actualURL,observedRole:c.role,observedState:'permission-notice-only',capture:'reviews/maison-pages/screens/'+c.file,
    expectedBodyIndicator:'회수 검토 개요',suggestedAccount:'qd-audit-quality@q-maison.local',requiredRole:'recalls:create permission AND menu /recalls write AND quality business seat',
    requiredBusinessSeat:"Active users.job_title='quality_manager', OR active QA department manager, OR active QA member with job_title in team_leader/division_head/quality_manager/executive",
    preparedAccountState:{method:'Read-only transaction in local Docker supabase_db_q-works during this review; no remote access or mutations',accountsChecked:['dev@q-maison.local','qd-audit-quality@q-maison.local','qd-audit-reviewer@q-maison.local','qd-audit-executive@q-maison.local','qd-audit-operator@q-maison.local'],jobTitle:null,jobRank:null,qualityManagerSeat:false,qualityReviewerSeat:false,ceoSeat:false,note:'Role names alone do not confer the business seat. Complete the dedicated local quality fixture with its intended quality_manager job_title before normal login. Do not bypass the route guard.'},
    fixtureCompletion:qualityFixture?{evidence:'reviews/maison-pages-quality-fixture.json',completedAt:qualityFixture.completedAt,after:qualityFixture.states.find(s=>s.phase==='after'),note:'The preparedAccountState above is the observed pre-completion snapshot. Normal-login form capture is still a separate requirement.'}:null,
    evidence:[evidence('app/(app)/recalls/new/page.tsx'),evidence('lib/recalls/rules.ts'),evidence('lib/recalls/seat.ts'),evidence('supabase/migrations/20260831061426_approval_qualification.sql'),evidence('supabase/migrations/20260904052542_improvement_attachments_and_approval.sql')]})),
  horizontalFollowups:Object.entries(horizontalRequirements).map(([route,requiredView])=>{const own=latestReviews.filter(r=>r.route===route&&r.result==='visible-region-reviewed');const c=captures.find(c=>c.route===route);return{route,url:c?.actualURL??targets.find(t=>t.route===route)?.url,role:c?.role??'SaaS_Admin',requiredView,action:'Scroll the inner horizontal container to its far right and capture the actual visible rows. For a long table, inspect all vertical row segments. No submit, deletion, approval, or document dispatch.',evidence:own.map(r=>({image:r.image,sha256:r.sha256,observations:r.observations})),status:own.length?'needs-additional-horizontal-state':'recheck-current-image-sha'};}),
  note:'Only one explicit blocked form was found in current saved DOM. Existing draft/submitted/approved forms, input errors, modal states, hidden panels, and other roles are independent coverage axes. Document permission prose and legal text were not counted as access failures. Known route aliases and the already verified initial-password account redirect are not permission failures.',
};
writeFileSync(join(root,'reviews/maison-pages-followups.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
