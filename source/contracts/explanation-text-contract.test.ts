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
 *     (옛 HelpNote 상자는 묶음 6 · 2026-10-08 에 70곳 전부 ⓘ 로 옮기고 부품 자체를 지웠다.)
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
  // 묶음 2(여덟 화면 → 0 · tooltip= 팝업 제외): 170 파일 · 497 문장. 같은 날 «/> 로 닫힌 부품 뒤의 글» 을 날것으로 바로 세게 고쳐 아홉 파일 +11 과 calibration 3 이 드러났다(전부터 있던 날것이지 새로 쓴 글이 아님).
  // 묶음 3(CAPA · 품질목표 · 설계 추적 · 변경평가 상세 · RA 작업대 · 경영검토 · 불만 접수 일곱 → 0 · TooltipBody/Note 제외 · 공개 법규 페이지 68 은 SKIP · 오너 결정 2026-10-08): 158 파일 · 381 문장.
  // 묶음 4(평가셋 검토 · 허가 제출 서류 · 문서 점검 · 제품 프로파일 · 연구 변경 요청 · 코어 학습 · 연구 설정 · 연구 검토 여덟 → 0 · 2026-10-08): 150 파일 · 333 문장.
  // 묶음 5(설정 · 적합성 점검 · 내보내기 · 멤버 관리 · 양식 · 사용량 열한 파일 → 0 · 2026-10-08): 139 파일 · 301 문장.
  // 묶음 6(옛 도움말 상자 HelpNote 70곳 → 화면 머리 · 구역 · 칸 ⓘ, 부품 삭제 · WRAPPERS 에서 뺌 · 2026-10-08): 139 파일 · 301 문장 그대로(상자 안 글은 날것으로 세지 않았으므로 수는 안 바뀐다).
  // 묶음 7(QMS 기록 상세 · 신규 열일곱 파일 → 0: 심사 · 대리인 · 클린룸 · 임상평가 · 불만 · 계약 · 피드백 · 로트 · 처분 · PMS · 회수 · 공급자 · 부작용 보고 · 2026-10-08): 122 파일 · 264 문장.
  // 묶음 8(인허가 상세 · 신규와 목록 스무 파일 → 0: 인허가 등록 · EU MDR · 510(k) · NMPA · PMDA · UDI · 제품 · 통제문서 · 치료재료 · 변경평가 문 · 심사 준비도 · 감사 필터 · 보정 · 외부 전문가 · 검토함 · 교육 과정 · 2026-10-08): 102 파일 · 219 문장.
  // 묶음 9(연구 · 온보딩 · 기타 아홉 파일 → 0: 설계 요구사항 · 프로젝트 홈 · 제품 정보 · 새 아이디어 · 팀장 검토 · 404 · 조직 온보딩 · QMS 세우기 · 가입 승인 대기 · 2026-10-08): 93 파일 · 193 문장.
  // 묶음 10(공용 부품 앞쪽 A~F 스물다섯 파일 → 0: AI 초안 · 결재 판 둘 · 사진 · 역산 계획 · 달력 · 평가 중단 · 삭제 · CAPA 서류 · CR 함 · 계정 삭제 · 위젯 판 · 시작 안내 · 설계검토 · 문서 논의 · 본문 보기 · 서류 판 · 장비 이력 · 자료 교환 · 연동 · 종결 · 전문가 평가 · 현장 사진 · 최종 결정 · 2026-10-08): 68 파일 · 143 문장.
  // 묶음 11(공용 부품 뒤쪽 G~Z 마흔두 파일 → 0: 전역 검색 · 허가 인계 · IFU 분류 · 문의 · 식약처 등재 · 키워드 검토 · 양식 요약 · 업무 잠김 · 전문가 의견 · 소유자 제품 · R&D 파이프라인 · 패스키 둘 · 검토 대기 서류 · 폰 안내 · 수율 · 제품 고르기 · 푸시 둘 · 기본 문서 · 서류 편집 · 절차서 연결 · RA 진척 · RA 안내 · R&D 서류 판 · 회수 거래처 · 규제 변화 · 출하 서명 · 전문가 요청 · 설계 이관 · DHF 목차 · 세션 둘 · 전체 로그아웃 · 단계 진행 · 되돌리기 · 제출 추적 · 공급자 셋 · 오늘 할 일 · 금고 · 환영 · 2026-10-08): 26 파일 · 59 문장. 남은 것은 전부 admin(데모 계정으로 촬영 불가).
  // 묶음 12(운영진 화면 admin 스물여섯 파일 → 0: AI 총괄 한도 · 코어 정확도 · 기본 양식함 · 평가셋 · 전문가 초대 둘 · 전문가 · 지식 베이스 · 조직 한눈에 · 운영 홈 · 권한표 · 라벨 퀴즈 · 룰 표 · 심사 · 검증 기록 · 부작용 사례 · 조건 규칙 · CSP · 문서세트 넷 · 멤버 보관 · 이관 · 식약처 서류 · 조직 편집 · 2026-10-08): 0 파일 · 0 문장. 기준선이 비었다. 새 설명 문장이 생기면 이 가드가 바로 잡는다.
];

const SENT = /[가-힣][^<>{}]{8,}?(입니다|십시오|됩니다|합니다|있습니다|없습니다|주세요|하세요)\./g;
/** 이 부품 안의 문장은 날것이 아니다 */
// TooltipBody 는 KPI 팝업의 본문(tooltip: ( … ) 로 배열에 담길 때는 tooltip={ 로 못 잡는다 · 묶음 3 에서 추가).
const WRAPPERS = ['SectionTitleInfo', 'InfoDot', 'Alert', 'FldError', 'EmptyState', 'NextStep', 'LegalNote', 'Modal', 'Confirm', 'Toast', 'PageGuide', 'FormNote', 'TruncatedNote', 'TooltipBody', 'TooltipNote'];
const SKIP = (rel: string) =>
  rel.startsWith('app/(app)/m/') || rel.startsWith('app/experts/') || rel.startsWith('app/global-error') ||
  /^app\/(terms|privacy|open-source|legal)/.test(rel) ||
  // 공개 법규 페이지(이용약관 · 개인정보처리방침 · 오픈소스 고지 · 사업자정보)는 법규 문구라 ⓘ 로 옮길 글이 아니다(오너 결정 2026-10-08 · 68 문장).
  /^app\/\(public\)\/(\(drafts\)\/)?(terms|privacy|open-source|business-info)\//.test(rel);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.next') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

/** 글 노드 앞 1200자 안에서 가장 가까운 «열려 있는» 부품 이름(닫힌 것은 뺌). info={ … } 프롭 안이면 SectionTitleInfo 로 친다. */
/** `<W …` 가 `/>` 로 끝났는가. 여는 태그 안의 `{ … }` 는 건너뛰며 깊이 0 의 첫 `>` 를 찾는다. 태그가 창 밖에서 닫히면 열린 것으로 본다. */
function selfClosed(src: string, open: number): boolean {
  let depth = 0;
  for (let i = open + 1; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') depth--;
    else if (c === '>' && depth === 0) return src[i - 1] === '/';
  }
  return false;
}

export function wrapperOf(before: string): string | null {
  let best: { name: string; at: number } | null = null;
  for (const w of WRAPPERS) {
    const open = before.lastIndexOf('<' + w);
    if (open < 0) continue;
    const nextChar = before[open + w.length + 1];
    if (nextChar && /[A-Za-z0-9]/.test(nextChar)) continue; // <AlertCircle 같은 다른 이름
    const close = before.lastIndexOf('</' + w);
    if (close > open) continue;
    if (selfClosed(before, open)) continue; // <EmptyState … /> 뒤의 글은 그 부품 안이 아니다(묶음 2 에서 추가)
    if (!best || open > best.at) best = { name: w, at: open };
  }
  if (best) return best.name;
  // info={<>…</>} · info={ … } 프롭 안, 그리고 tooltip={ … } 프롭 안(KPI · MetricCard 의 ⓘ 팝업 · 묶음 2 에서 추가).
  // 둘 다 다른 요소 위로 뜨는 팝업이라 화면에 깔린 글이 아니다.
  for (const [prop, name] of [['info={', 'SectionTitleInfo'], ['tooltip={', 'KPI']] as const) {
    const at = before.lastIndexOf(prop);
    if (at < 0) continue;
    let depth = 0;
    for (const c of before.slice(at)) {
      if (c === '{') depth++;
      else if (c === '}') depth--;
    }
    if (depth > 0) return name;
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
    expect(countBare(`<KPI label="x" tooltip={<KpiNote>가입한 모든 계정을 셉니다.</KpiNote>} /><p>팝업 밖 날것은 따로 세어야 합니다.</p>`)).toBe(1);
    expect(countBare(`<Alert kind="error">파일만 올릴 수 있습니다.</Alert>`)).toBe(0);
    expect(countBare(`<NextStep>변경 대상을 먼저 고르십시오.</NextStep>`)).toBe(0);
    expect(countBare(`<Alert kind="info">안내입니다.</Alert><p>그 뒤의 날것 문장은 따로 세어야 합니다.</p>`)).toBe(1);
    expect(countBare(`<AlertCircle /><p>다른 이름에 속지 않아야 합니다.</p>`)).toBe(1);
    expect(countBare(`<EmptyState compact title="없음" action={<a onClick={() => go()}>x</a>} /><p>닫힌 부품 뒤의 날것은 세어야 합니다.</p>`)).toBe(1);
    expect(countBare(`{ tooltip: (<TooltipBody title="x"><TooltipNote>팝업 본문은 세지 않습니다.</TooltipNote></TooltipBody>) }`)).toBe(0);
    expect(countBare(`<span>짧음.</span><span>예: 실리콘 A사</span>`)).toBe(0);
  });
});
