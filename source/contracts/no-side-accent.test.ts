import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 디자인 가드: 굵은 옆 색 선(side-tab accent) 새로 쓰지 않기 (2026-09-27)
// =============================================================================
// 상자 한쪽에 굵은 색 선을 긋는 강조(`borderLeft: 3px solid …`)는 오너 금지 목록에 2026-09-01 부터 있었다
// («카드 한쪽의 굵은 컬러 보더»). 그런데 아무것도 세지 않아 188곳이 남았고, 결재함 카드도 4px 금색 선이었다.
// 오너 2026-09-27: 「모든 컴포넌트에 왼쪽 강조 라인이 붙어 있는데… 클로드 특유의 디자인 형태라서 다른 디자인 형태를」.
// 대체는 «문서 결»(괘선 목록 · 금색 라벨 강조문 · 요약표)과 결재 화면의 «가로 결재 길»이다.
//
// 기존 사용량은 넓어(점진 정리 대상) «0» 이 아니라 **기준 동결**: 늘어나는 것만 막는다(no-new-hex 와 같은 모양).
//   · 굵기 2px 이상만 센다. 1px 옆 선은 나무 줄 · 칸 구분 같은 구조선일 수 있다.
//   · 줄였으면 BASELINE 을 낮춰 다시 동결한다(환영).
//
// 기록
//   188 [2026-09-27] 첫 동결(결재함 카드의 4px 금색 선을 가로 결재 길로 바꾼 뒤의 실측).
//   180 [2026-09-27] 정본 부품 1차: Bx accent · InfoBox · Alert · KPI 풍선 · EntityRow · 사이드바 선택 표시(둘) · 부서 단추 −8.
//   121 [2026-09-27] 화면 검토 w4(A10 왼쪽 색 띠 걷기 · 판 안의 판 걷기 등)를 위에 합친 뒤 다시 동결.
//   118 [2026-09-27] 문서 결 2차: 대상시장 칸 · §7.3 점수 판과 항목 −3(공용 값 lib/design/grain.ts).
//    84 [2026-09-27] 문서 결 3차: R&D 과제 목록 · 새 과제 · 팀장 검토 · 과제 상세 · 프로파일 · 설정 · 설계 검토와
//                    과제 부품(역산 계획 · 회의 · 필요 문서 · 결재 판 · 단계 진행 · 요구사항 · CR 등) −34.
//    54 [2026-09-27] 문서 결 4차: 변경평가(미리보기 · 결정 나무 · 결재 이력 · 취소 · 삭제 · 의견 · 종결) · 품목 분류 ·
//                    IFU 분류 · 전문가 의견 · 취소된 CAPA · 인허가 상세 · 제출 서류 · 510(k) · EU MDR −30.
//     6 [2026-09-27] 문서 결 5차: 설정 · 적합성 점검 · 관리 화면 · 목록 줄(규제 일정 · 공정 · 생산설비) · 공용 부품
//                    (토스트 · 확인 창 · 위험 구역 · AI 도움 · 달력) · 첫 설정 · 로그인 안내 · 전문가 포털 −48.
//                    남은 6곳은 화면 검토 세션이 고치는 중인 파일(Letter to File · 경영 검토 · NMPA · PMDA 상세 ·
//                    설계 요구사항 · 사람 고르기)이라 그쪽이 끝난 뒤에 걷는다.
//     0 [2026-09-28] 문서 결 6차: 위 6곳(판단 결과 판 · 취소 배너는 테두리 전체 옅은 상태 색, 섹션 목록 · 사람 고르기는
//                    띠만 걷음, 설계입력 들여쓰기는 1px 구조선). 이제 굵은 옆 색 선은 하나도 없다. 새로 쓰면 여기서 빨개진다.
//     0 [2026-09-28] 🔴 거짓 초록이었다: 값이 조건식(`m ? `3px solid …` : …`)이면 틀이 값 첫머리의 숫자만 보아 넷을 못 셌다
//                    (제품 프로파일 띠 · 요구사항 찾은 줄 · 설정 알림 받는 사람 · 검토 요청 댓글). 넷을 걷고 틀이 값 전체를 읽게 했다.
//     0 [2026-09-28] 🔴 또 거짓 초록: 값이 여러 줄에 걸친 조건식이면 틀이 줄 끝에서 끊어 넷을 더 못 셌다(메시지 목록의 고른 대화 ·
//                    조직 옮기기 창 · 역산 일정의 현재 단계 · R&D 문서 카드의 상태 띠). 넷을 걷고, 틀이 줄을 넘어 읽되 주석은 빼게 했다.
//                    같은 선을 다른 말로 긋는 안쪽 그림자(`inset 3px 0 0 …`) · 굵기만 따로 준 옆 선(borderLeftWidth)도 함께 센다.

const ROOT = process.cwd();
const SCAN_DIRS = ['app', 'components', 'lib'];
const EXTS = ['.ts', '.tsx', '.css'];
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'worktrees']);

/**
 * 인라인 스타일(borderLeft · borderRight · borderInlineStart · borderInlineEnd)의 값 한 칸.
 * 다음 속성(`, 이름:`) · `}` 에서 끊는다. 줄을 넘어 읽는다(값을 여러 줄 조건식으로 쓴 곳이 있다).
 * 🔴 값이 조건식(`on ? `3px solid …` : 'none'`)이어도 값 전체에서 굵기를 찾는다. 첫머리 숫자만 보던 틀은 넷을,
 *    줄 끝에서 끊던 틀은 넷을 더 놓쳤다. 주석은 먼저 걷는다(주석 속 예시를 세지 않도록).
 */
const INLINE = /border(?:Left|Right|InlineStart|InlineEnd)\s*:((?:[^,}]|,(?!\s*[A-Za-z_$][\w$]*\s*:))*)/g;
const WIDTH = /(\d+(?:\.\d+)?)px\s+(?:solid|dashed|double)/g;
/** 굵기만 따로 준 옆 선(borderLeftWidth: 3) */
const WIDTH_ONLY = /border(?:Left|Right|InlineStart|InlineEnd)Width\s*:\s*[`'"]?(\d+(?:\.\d+)?)/g;
/** 안쪽 그림자로 긋는 옆 선(`inset 3px 0 0 …`). 첫 값(가로 어긋남)이 2px 이상일 때만 */
const INSET = /inset\s+(-?\d+(?:\.\d+)?)px\s+0(?:px)?\s+0(?:px)?\s/g;
/** CSS(border-left · border-right · 논리 속성) */
const CSS = /border-(?:left|right|inline-start|inline-end)\s*:\s*(\d+(?:\.\d+)?)px\s+(?:solid|dashed|double)/g;

/** 주석 걷기. 주소의 `//`(앞이 `:`)와 따옴표 바로 뒤의 `//` 는 남긴다 */
function stripComments(text: string): string {
  return text.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:\\'"`])\/\/[^\n]*/gm, '$1');
}

/** 굵기 2px 이상 옆 선의 수. 인라인은 값 안에 2px 이상이 하나라도 있으면 한 곳 */
function countIn(text: string, css: boolean): number {
  const inset = (t: string) => [...t.matchAll(INSET)].filter((m) => Math.abs(Number(m[1])) >= 2).length;
  if (css) {
    const t = text.replace(/\/\*[\s\S]*?\*\//g, ' ');
    return [...t.matchAll(CSS)].filter((m) => Number(m[1]) >= 2).length + inset(t);
  }
  const t = stripComments(text);
  const inline = [...t.matchAll(INLINE)].filter((m) => [...m[1].matchAll(WIDTH)].some((w) => Number(w[1]) >= 2)).length;
  const widthOnly = [...t.matchAll(WIDTH_ONLY)].filter((m) => Number(m[1]) >= 2).length;
  return inline + widthOnly + inset(t);
}

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

function countSideAccents(): { total: number; byFile: Record<string, number> } {
  const byFile: Record<string, number> = {};
  let total = 0;
  for (const dir of SCAN_DIRS) {
    for (const f of walk(join(ROOT, dir))) {
      const rel = f.slice(ROOT.length + 1).replace(/\\/g, '/');
      const text = readFileSync(f, 'utf8');
      const n = countIn(text, f.endsWith('.css'));
      if (n) {
        byFile[rel] = n;
        total += n;
      }
    }
  }
  return { total, byFile };
}

const BASELINE = 0;

describe('디자인 가드: 굵은 옆 색 선을 새로 쓰지 않는다', () => {
  it(`굵은 옆 색 선이 기준(${BASELINE}) 이하`, () => {
    const { total, byFile } = countSideAccents();
    const top = Object.entries(byFile)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([f, n]) => `${n} ${f}`)
      .join('\n');
    expect(
      total,
      `굵은 옆 색 선이 ${total}곳(기준 ${BASELINE}). 새로 쓰지 말고 «문서 결»(괘선 · 금색 라벨 강조문 · 요약표)이나 가로 결재 길로. 많은 파일:\n${top}`,
    ).toBeLessThanOrEqual(BASELINE);
  });

  it('세는 틀이 실제로 잡는다(일부러 깨뜨린 예)', () => {
    const inline = "style={{ borderLeft: `3px solid ${T.champagne}` }} borderRight: '2px dashed red' borderLeft: `1px solid ${T.border}`";
    // 값이 조건식이어도 한 곳으로 센다. 1px 조건식 · 옆 선 아닌 속성의 굵기는 세지 않는다
    const cond = "borderLeft: on ? `3px solid ${T.green}` : `3px solid ${T.subtle}`, border: `1px solid ${T.border}`, borderRight: x ? '1px solid a' : 'none', outline: '2px solid b'";
    const css = '.x { border-left: 4px solid var(--gold); } .y { border-right: 1px solid #333; }';
    expect(countIn(inline, false), '1px 구조선은 세지 않는다').toBe(2);
    expect(countIn(cond, false), '조건식 안의 굵은 옆 선').toBe(1);
    expect(countIn(css, true)).toBe(1);
    // 여러 줄 조건식(줄 끝에서 끊던 틀이 놓친 모양) · 주석 속 예시 · 안쪽 그림자 · 굵기만 준 옆 선
    const multi = "borderLeft: isCurrent\n  ? `3px solid ${T.champagne}`\n  : i > 0\n    ? `1px dashed ${T.border}`\n    : 'none',\n  padding: '3px 0',";
    const commented = "borderLeft: 'none', // 예전엔 3px solid 금색\n  padding: 0, /* borderRight: '4px solid red' */ margin: 0";
    const other = "boxShadow: `inset 3px 0 0 ${T.gold}`, ring: 'inset 0 0 0 1px red', borderLeftWidth: 4, borderRightWidth: 1";
    expect(countIn(multi, false), '여러 줄 조건식').toBe(1);
    expect(countIn(commented, false), '주석은 세지 않는다').toBe(0);
    expect(countIn(other, false), '안쪽 그림자 · 굵기만 준 옆 선').toBe(2);
    expect(countIn('.z { box-shadow: inset 4px 0 0 var(--gold); }', true)).toBe(1);
  });
});
