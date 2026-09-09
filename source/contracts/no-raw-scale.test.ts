import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 스케일 토큰 baseline 동결 (no-new-hex.test 패턴 확장)
// =============================================================================
// 디자인 SSOT 5단계 로드맵 4단계. 색(hex)에 이어 **타이포·간격·상태색**의 raw
// 리터럴을 baseline 으로 동결한다. 색과 마찬가지로 SSOT 는 lib/design/tokens.ts:
//   · fontSize      → TYPE.* / typeStyle()      (raw px·rem 금지)
//   · padding/margin/gap → S[*]                 (raw px 금지, 0 제외)
//   · 상태색        → STATE.*                    (raw var(--qa-state-*) 금지)
// raw 리터럴을 새로 추가하면 토큰 한 곳을 바꿔도 전파가 안 돼 drift 가 생긴다.
// 기존 사용량이 광범위(점진 정리=로드맵 5단계 codemod)하므로 "0" 이 아니라
// **baseline 동결**: 신규 증가만 구조적으로 차단한다.
//
// 운영:
//  · raw 값 대신 TYPE.*/S[*]/STATE.* 토큰을 쓰면 → 통과.
//  · 정당하게 토큰화로 줄였으면 BASELINE 을 낮춰 다시 동결(환영).
//  · tokens.ts 만 정의 허용(ALLOWED_*): 토큰 SSOT.

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const EXTS = ['.ts', '.tsx'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'worktrees']);

const TOKENS_SSOT = 'lib/design/tokens.ts';

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

const sourceFiles = (): { rel: string; text: string }[] => {
  const files: { rel: string; text: string }[] = [];
  for (const dir of SCAN_DIRS) {
    for (const f of walk(join(ROOT, dir))) {
      const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/');
      files.push({ rel, text: readFileSync(f, 'utf8') });
    }
  }
  return files;
};

// raw fontSize 리터럴: `fontSize: 14` / `'14px'` / `'0.9rem'`. 토큰(TYPE.·F.·
// 식별자)로 시작하면 매칭 안 됨. tokens.ts(TYPE 정의)만 허용.
//
// 🔴 2026-08-21: **삼항 뒤의 raw 값이 이 가드를 통과하고 있었다.**
// `fontSize: sm ? 10.5 : 11.5`(공용 Btn)는 `fontSize:` 다음이 식별자 `sm` 이라
// 매칭되지 않았다. 그래서 **모든 버튼**이 0.5 어긋난 크기로 오래 살아남았고,
// 「글씨 크기가 들쑥날쑥」의 큰 몫이 거기였다(오빠 지적). FS 토큰 치환으로도
// 닿지 않는 자리라 가드가 유일한 문지기였는데, 그 문지기가 못 보고 있었다.
//   → `?` 를 건너뛰고 그 뒤의 숫자도 본다. `sm ? FS[11] : FS[12]` 처럼 **토큰을
//     쓰는 삼항은 여전히 통과**한다(`?` 뒤가 숫자가 아니므로).
const FONT_RE = /fontSize:\s*(?:[^,;}\n]*\?\s*)?['"]?[0-9]/g;

// raw lineHeight 리터럴: `lineHeight: 1.6` / `'1.6'`. LH.* 토큰은 매칭 안 됨(식별자).
// 2026-08-06 신설: 세 축(fontSize·spacing·상태색) 중 **lineHeight 만 가드가 없었고**,
// 정확히 그 축에서 「같은 12px 문장이 1.5~1.8 로 갈리는」 드리프트가 났다. 585곳을
// LH.* 로 접은 직후 실측치로 동결한다.
const LINEHEIGHT_RE = /lineHeight:\s*['"]?[0-9]/g;

// raw spacing 리터럴: padding/margin/gap 계열에 숫자 리터럴. 0(무간격)은 제외.
// S[*] 토큰은 매칭 안 됨(대괄호·식별자).
const SPACING_RE =
  /\b(?:padding|margin|gap|rowGap|columnGap)(?:Top|Right|Bottom|Left|Inline|Block|InlineStart|InlineEnd|BlockStart|BlockEnd)?:\s*['"]?(-?[0-9]+(?:\.[0-9]+)?)/g;

// raw 상태색: 인라인 var(--qa-state-*). STATE.* 토큰으로 대체 대상.
const STATE_RE = /var\(--qa-state-/g;

function countMatches(re: RegExp, allow: (rel: string) => boolean) {
  const byFile: Record<string, number> = {};
  let total = 0;
  for (const { rel, text } of sourceFiles()) {
    if (allow(rel)) continue;
    const m = text.match(re);
    if (m?.length) {
      byFile[rel] = m.length;
      total += m.length;
    }
  }
  return { total, byFile };
}

function countSpacing(allow: (rel: string) => boolean) {
  const byFile: Record<string, number> = {};
  let total = 0;
  for (const { rel, text } of sourceFiles()) {
    if (allow(rel)) continue;
    let n = 0;
    for (const m of text.matchAll(SPACING_RE)) {
      if (m[1] === '0') continue; // 무간격은 위반 아님
      n++;
    }
    if (n) {
      byFile[rel] = n;
      total += n;
    }
  }
  return { total, byFile };
}

function report(label: string, total: number, baseline: number, byFile: Record<string, number>, hint: string) {
  const top = Object.entries(byFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([f, n]) => `  ${f}: ${n}`)
    .join('\n');
  return (
    `${label} raw 리터럴 ${total}개 > baseline ${baseline}. ${hint} ` +
    `정당히 줄였으면 BASELINE 을 낮춰 다시 동결.\n상위 파일:\n${top}`
  );
}

// BASELINE: 2026-07-01 측정값 동결(디자인 SSOT 로드맵 4단계). 초과 시 실패.
// 로드맵 5단계(섹션 단위 codemod)로 raw→토큰 치환할 때마다 이 값을 낮춰 재동결.
//   · fontSize 60: ★5단계 2차: app·components·lib 전면 FS[n] 값보존 스윕 완료
//     (2983→79, 시각0·FS[..]는 FONT_RE 회피). +2026-07-02: tokens import 없던 4파일
//     (assessments/page·settings/compliance/page·ExpertVaultAccess·ExpertNotificationsPanel
//     = 19건) FS 래핑 완료 → 79→60(시각0·값보존). 잔여 60 = experts 포털(app/experts/*·
//     Cormorant 독립 브랜딩·의도적 제외) + (app)/experts·admin/experts 관리페이지(별도 스코프).
//     ⬜ mono/serif 의미 승격(TYPE)은 육안 필요분이라 별도.
//   · spacing 1423: ★5단계 3차: bare 숫자 padding/margin/gap **3754건 → S[key]** 값보존
//     스윕(5177→1423, 시각0·값→S키 매핑·S 7키 확장 6.5/7/7.5/9/11/14/18). 잔여 1423 =
//     문자열 shorthand('8px 12px' template 필요)·홀수 서브그리드(1/3/5/7/9/11)·음수·experts
//     포털·tokens import 없던 11파일. ⬜ shorthand·홀수는 별도(스냅=시각변경 육안 필요).
//   · 상태색 0: ★5단계 1차 완료(2026-07-01): 인라인 var(--qa-state-*) 60건 전부 STATE.*
//     로 치환(doc-status-labels·workflow-states·14파일). 이제 신규 raw 상태색 0건 강제.
// 2026-08-21 재동결 60→66: 값이 늘어난 것이 아니라 **정규식이 넓어져 원래 있던 것이
// 보이기 시작한 것**이다(위 FONT_RE 참조: 삼항 뒤 raw 를 못 보고 있었다).
// 새로 보인 6곳은 전부 정수 분기(`isManual ? 14 : 13` 등)라 크기 «표류» 가 아니고
// 의도적 위계다. 토큰 밖이라는 점만 남겨 두고 이번 라운드에서는 건드리지 않는다.
const BASELINE_FONT = 66;
// 2026-07-12 재동결 1423→1442: CI 가 lint 상시 실패로 vitest 를 못 돌리던 기간(감사 H7)에
//   신규 기능들이 raw spacing 19개를 토큰(S[*]) 대신 리터럴로 추가 → 가드가 못 잡음.
//   H7(CI 게이트 복구)으로 드러났으나 이 19개 소재 파악·토큰화는 디자인 로드맵 5단계
//   codemod 범위(보안 수정과 무관)라 현 실측치로 재동결: 이후 신규 증가는 계속 차단.
//   ⬜ BACKLOG: 1442→축소(raw spacing 토큰화).
// 🔴 2026-09-03 재동결 1442→1448: 조직 내보내기 묶음의 README.html 때문이다
//    (lib/export/org-export.ts). **고객에게 나가는 독립 HTML 문서**라 앱의
//    CSS-in-JS 스케일 토큰을 쓸 수 없다. 메일 본문(lib/email.ts)과 같은 성격이다.
//    앱 화면(ExportPanel.tsx)에서 늘어난 것은 0개다: S[*] 스케일을 그대로 썼다.
const BASELINE_SPACING = 1448;
const BASELINE_STATE = 0;
// lineHeight 52: ★2026-08-06 codemod 직후 실측 동결. 사다리 값 585곳(1·1.2·1.3·1.4·1.5·
//   1.55·1.6·1.7)을 LH.* 로 값보존 치환(시각 0). 잔여 52 의 내역:
//     · app/experts/* 9: Cormorant 독립 브랜딩(FONT_RE 와 같은 이유로 의도적 제외)
//     · 사다리 밖 표류값: 1.05·1.1·1.12·1.25·1.35·1.45·1.65·1.75·1.8·1.9.
//       접으면 «픽셀이 실제로 움직인다»(예: 1.65→1.6 은 14px 기준 0.7px/줄). 값보존이
//       아니므로 육안 확인이 필요해 별도 라운드로 남긴다.
//     · 문자열 '56px'(minHeight 짝 수직중앙정렬)·0(flex 아이콘 디센더 제거): 스케일 밖
//     · components.tsx:266 주석 1: 정규식이 주석을 구분 못 한다(치환은 라인단위로 회피).
//   ⬜ BACKLOG: 1.65(17곳)·1.05(TYPE.display 축) 정리 후 재동결.
const BASELINE_LINEHEIGHT = 52;

describe('디자인 가드: 스케일 토큰 baseline 동결', () => {
  it(`raw fontSize 가 baseline(${BASELINE_FONT}) 이하`, () => {
    const { total, byFile } = countMatches(FONT_RE, (rel) => rel === TOKENS_SSOT);
    if (total > BASELINE_FONT) {
      throw new Error(report('fontSize', total, BASELINE_FONT, byFile, 'lib/design/tokens.ts 의 TYPE.* / typeStyle() 를 쓰세요.'));
    }
    expect(total).toBeLessThanOrEqual(BASELINE_FONT);
  });

  it(`raw lineHeight 가 baseline(${BASELINE_LINEHEIGHT}) 이하`, () => {
    const { total, byFile } = countMatches(LINEHEIGHT_RE, (rel) => rel === TOKENS_SSOT);
    if (total > BASELINE_LINEHEIGHT) {
      throw new Error(report('lineHeight', total, BASELINE_LINEHEIGHT, byFile, 'lib/design/tokens.ts 의 LH.* 를 쓰세요.'));
    }
    expect(total).toBeLessThanOrEqual(BASELINE_LINEHEIGHT);
  });

  it(`raw spacing(padding/margin/gap) 가 baseline(${BASELINE_SPACING}) 이하`, () => {
    const { total, byFile } = countSpacing((rel) => rel === TOKENS_SSOT);
    if (total > BASELINE_SPACING) {
      throw new Error(report('spacing', total, BASELINE_SPACING, byFile, 'lib/design/tokens.ts 의 S[*] 스케일을 쓰세요.'));
    }
    expect(total).toBeLessThanOrEqual(BASELINE_SPACING);
  });

  it(`raw var(--qa-state-*) 가 baseline(${BASELINE_STATE}) 이하`, () => {
    const { total, byFile } = countMatches(STATE_RE, (rel) => rel === TOKENS_SSOT);
    if (total > BASELINE_STATE) {
      throw new Error(report('상태색', total, BASELINE_STATE, byFile, 'lib/design/tokens.ts 의 STATE.* 를 쓰세요.'));
    }
    expect(total).toBeLessThanOrEqual(BASELINE_STATE);
  });
});

// =============================================================================
// 페이지 셸 폭 가드: LAYOUT 토큰 (2026-08-06 디자인 심층 감사)
// =============================================================================
// 배경: 생성폼 25개가 maxWidth 720 을 손으로 반복하고, 상세는 800·820·840·860·880
// 으로 5종 분화해 있었다. 사이드바로 화면을 옮길 때마다 본문 컬럼이 20~40px 씩
// 덜컹거려, 「목록으로」 백링크와 제목의 시작 x좌표가 화면마다 달라졌다.
//
// 이 가드는 **LAYOUT 에 등록된 값**(520·720·820·1140)의 raw 사용만 막는다.
// 그 밖의 값(프로그레스바 220·말줄임 280·필드 320 같은 지역 캡)은 자유: 셸이 아니다.
// baseline 이 아니라 **0 유지**인 이유: 이번 라운드에서 43파일을 전부 토큰으로
// 옮겼으므로 신규 유입만 막으면 된다.
const LAYOUT_VALUES = [520, 720, 820, 1140];
// 페이지 셸이 아닌 «다른 축»이라 의도적으로 raw 를 유지하는 곳.
const SHELL_EXEMPT = [
  // 산문 measure: 설명 문단의 가독폭. 폼 폭과 함께 움직이면 안 된다.
  'app/(app)/research/[code]/settings/page.tsx',
];

describe('디자인 가드: 페이지 셸 폭은 LAYOUT 토큰', () => {
  it('LAYOUT 에 등록된 폭(520·720·820·1140)을 raw 로 쓰지 않는다', () => {
    const offenders: string[] = [];
    for (const { rel, text: src } of sourceFiles()) {
      if (rel === 'lib/design/tokens.ts') continue;
      if (SHELL_EXEMPT.some((e) => rel.endsWith(e))) continue;
      // 별도 테마(전문가 포털)는 자체 스케일: 대상 아님
      if (rel.includes('app/experts/') || rel.includes('components/expert/')) continue;
      for (const v of LAYOUT_VALUES) {
        // ⚠️ 템플릿 리터럴 안에서는 `\\s` 로 써야 정규식 \s 가 된다.
        //    `\s` 로 쓰면 이스케이프가 소비돼 «s 문자»가 되고, 가드가 영원히 통과한다
        //    (2026-08-06 역검증에서 실제로 이 함정에 빠졌다. 가드는 반드시 «일부러 위반을
        //     넣어 실패하는지» 확인할 것).
        const re = new RegExp(`maxWidth:\\s*${v}(?![0-9])`, 'g');
        const hits = src.match(re);
        if (hits) offenders.push(`${rel}: maxWidth: ${v} ×${hits.length}`);
      }
    }
    expect(
      offenders,
      `페이지 셸 폭은 LAYOUT.* 를 쓰세요 (mobile/form/detail/wide).\n` +
        `지역 캡(프로그레스바·필드 폭 등)이라면 LAYOUT 에 없는 값을 쓰거나 SHELL_EXEMPT 에 등록하세요.\n` +
        offenders.join('\n'),
    ).toEqual([]);
  });
});
