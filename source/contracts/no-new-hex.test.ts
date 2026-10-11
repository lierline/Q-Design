import { readDesignFile } from '@/lib/test-utils/design-source';
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 신규 raw hex 색상 금지 (registry orphan 테스트 패턴)
// =============================================================================
// 색은 lib/design/tokens.ts 의 토큰(DARK/LIGHT_PALETTE → T.* / var(--qa-*)) 이
// SSOT. 소스에 인라인 `#rrggbb` 를 새로 추가하면 토큰 한 곳을 바꿔도 전파가 안 돼
// drift 가 생긴다. 기존 사용량은 광범위(점진 정리 대상)하므로 "0" 이 아니라
// **baseline 동결**: 신규 추가(증가)만 구조적으로 차단한다.
//
// 운영:
//  · hex 를 새로 쓰지 말고 T.* 토큰을 사용 → 통과.
//  · 정당하게 토큰화로 hex 를 줄였으면 BASELINE 을 낮춰 다시 동결(환영).
//  · tokens.ts 만 hex 정의 허용(ALLOWED_FILES).

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const EXTS = ['.ts', '.tsx'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'worktrees']);

// 색만: 8자리(alpha) > 6자리 > 3자리 순(긴 것 우선 매칭).
const HEX = /#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g;

// hex 정의가 허용되는 파일 = 토큰 SSOT 와 «Q-Design 에서 온 생성물».
//
// 🔑 생성물을 여기 넣는 이유: 그 파일의 색은 이 저장소가 «고른» 것이 아니라
//    Q-Design 이 웹 라이트 팔레트에서 파생하고 종이 위 AA 까지 검증해 내보낸 것입니다.
//    손으로 고치면 `q-design-copy.test.ts` 의 지문 대조가 웁니다. 문지기가 다릅니다.
//    ⚠️ 생성물이 아닌 파일을 여기 넣지 마십시오. 그 순간 이 가드가 그 파일을 놓칩니다.
const ALLOWED_FILES = new Set([
  'lib/design/tokens.ts',
  'lib/design/q-design.doc.ts', // Q-Design 생성물 · 지문 계약이 따로 지킵니다
]);

function walk(dir: string): string[] {
  const out: string[] = [];
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      out.push(...walk(full));
    } else if (EXTS.some((e) => full.endsWith(e))) {
      if (/\.test\.tsx?$/.test(full)) continue;
      out.push(full);
    }
  }
  return out;
}

function countHex(): { total: number; byFile: Record<string, number> } {
  const byFile: Record<string, number> = {};
  let total = 0;
  for (const dir of SCAN_DIRS) {
    for (const f of walk(join(ROOT, dir))) {
      const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/');
      if (ALLOWED_FILES.has(rel)) continue;
      const matches = readDesignFile(f, 'utf8').match(HEX);
      if (matches?.length) {
        byFile[rel] = matches.length;
        total += matches.length;
      }
    }
  }
  return { total, byFile };
}

// BASELINE: 현재 hex 사용량 동결(2026-06-13 측정 = 403, NMPA·PMDA 시장 전용 모듈
// 도메인 상태/섹션 색 raw hex 각 9건 = fda510k/eumdr 동형 패턴[의도적 일관]. 직전
// 401[2026-06-12, RA WORKFLOW_COLOR 토큰화 F-09]). 초과 시 실패.
// ※시장 모듈 4종 SECTION_STATUS_META 공유화(중복 제거)는 별도 리팩토링 BACKLOG.
// 참고: 상위 파일(lib/email.ts·lib/research/notify-*.ts)은 이메일 HTML 템플릿이라
// CSS 변수 미지원으로 hex 가 불가피(정당). 이메일 템플릿을 정당히 늘려 초과하면
// 이 값을 조정. 그 외 UI 코드는 hex 대신 T.* 토큰을 써서 baseline 을 넘기지 말 것.
// 412[2026-06-13]: 보완요청 R&D 알림 이메일 템플릿 +9(notify-license-change: 이메일 HTML 정당).
// 452[2026-06-13]: 이메일 알림 디자인 고급화 +40: shell() 프리미엄 재설계(골드 워드마크·
//   그라디언트 헤어라인·라운드 카드·그림자·베이지 푸터) + 전 CTA 골드 그라디언트 통일
//   (email.ts·notify-doc-review·notify-license-change·comments/route). 전부 이메일 HTML(정당).
// 453[2026-06-13]: RA→R&D 요청 유형(kind) 도입: 보완요청 이메일이 유형 라벨을
//   actorName 과 동형으로 #1c1a16 강조 +1(notify-license-change, 이메일 HTML 정당).
// 437[2026-06-15]: 상태색 raw hex 16건 토큰화 −16 (MeetingDetailPanel·ItemClassificationPreview·
//   ProductProfileWizard·ProjectComplianceScore 의 copper/gray/cobalt/gold → var(--qa-state-*) 색동일 /
//   RaProgressPanel·udi·pms 의 #5a9a5a → T.green[라이트 흰 배경 대비 ~2.8:1 WCAG AA 미달 가독성 버그 해소]).
// 331[2026-06-21]: 디자인 토큰 통일 audit −106 (ultracode 5차원 audit→adversarial 검증). STATUS 색맵
//   14파일(fda510k·eumdr·nmpa·pmda·lot·sterilization·clinical-eval·biocompat·udi·standards·iec62304·
//   equipment·cleanroom·authorized-rep) raw hex→T 토큰[#9a948a na 는 대응토큰 부재로 보존] · vault-context
//   var(--qa-*,#fallback) 잉여 hex 제거 · Confirm onAccent. risky(색/모양 실변)는 BACKLOG 육안 박제.
// 337[2026-06-23]: notifySupplementResolved 이메일 템플릿 hex +6 (이메일은 CSS 변수/디자인 토큰
//   불가 → 인라인 hex 필수·기존 이메일 템플릿과 동일 패턴·RR-1a 보완 회신 알림). 앱 UI 아님.
// 347[2026-06-23]: vigilanceReportableEmail 템플릿 hex +10 (D2: 법정기한 Vigilance '항상 이메일'
//   예외. 기존 reviewRequestEmail 과 동일 골드 팔레트·이메일 HTML 정당). 앱 UI 아님.
// 348[2026-06-29]: ★사전존재 +1 임시 동결: main HEAD 에서 이미 baseline 초과 발견(Q-Match Sprint
//   와 무관. 본 Sprint 변경 파일 hex 0건 = stash 격리로 확인). 347 동결[06-23] 이후 어느 커밋이
//   app/components/lib 에 raw hex 1건 추가하고 baseline 미갱신 → 임시 동결. ↓ 342 에서 근본 해소.
// 342[2026-06-29]: ↑348 임시 동결의 근본 해소: user-menu.tsx(전문가 포털 인증 배지) raw hex 6건
//   토큰화 −6. 경위: 2ffa3f20(라이트 대비 보정)이 baseline 갱신 없이 #2f7d4f·#8a6838 라이트 분기
//   + 주석 hex 로 +4 했고, 같은 구간 Drawer 통합(dac24f24)이 −3 한 걸 가려 net +1(→348) 이 됨.
//   해결: expert-theme.css 테마 인지 변수 --status-verified/--status-pending 신설(다크 #82c298·
//   #d8a85a / 라이트 #2f7d4f·#8a6838: 색 무회귀), user-menu 는 var() 만 소비·isLight JS 분기 제거·
//   배지 알파 color-mix. 앱 UI 라 토큰화(이메일 예외와 무관). 348 임시조치 종결.
// 316[2026-09-03]: 감사 배치 M-13: 강조 배경 위 흰 글자 '#fff' 5건 → T.onAccent(ApprovalChainEditor·
//   DeleteAssessmentButton·DevResetButton·DocChecklistPanel·DocumentArtifactPanel. 다크에서 어두운 글자로
//   바뀌어 대비가 삽니다). 실측값으로 재동결(같은 배치의 다른 그룹이 줄인 몫 포함). 흰 글자 리터럴 자체는
//   on-accent-contract.test.ts 가 components/** 에서 0 으로 잠급니다.
// 🔴 2026-09-03: 316 → 326. 조직 내보내기 묶음의 README.html 때문이다
//    (lib/export/org-export.ts). 그 파일은 **고객에게 나가는 독립 HTML 문서**라
//    앱의 CSS-in-JS 토큰을 쓸 수 없다. 메일 본문(lib/email.ts, hex 129개)과 같은
//    성격이고 같은 이유로 raw hex 를 쓴다. 앱 화면에서 늘어난 것은 0개다.
const BASELINE = 326;

describe('디자인 가드: 신규 raw hex 색상 금지', () => {
  it(`소스 hex 리터럴이 baseline(${BASELINE}) 이하`, () => {
    const { total, byFile } = countHex();
    if (total > BASELINE) {
      const top = Object.entries(byFile)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([f, n]) => `  ${f}: ${n}`)
        .join('\n');
      throw new Error(
        `raw hex 리터럴 ${total}개 > baseline ${BASELINE}. ` +
          `신규 색은 lib/design/tokens.ts 의 T.* 토큰을 쓰세요. ` +
          `정당히 줄였으면 BASELINE 을 낮춰 다시 동결.\n상위 파일:\n${top}`,
      );
    }
    expect(total).toBeLessThanOrEqual(BASELINE);
  });
});
