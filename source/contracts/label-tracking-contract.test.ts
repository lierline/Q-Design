import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

// =============================================================================
// 라벨 자간 계약: uppercase 라벨의 letterSpacing 은 labelTracking() 을 거칩니다 (2026-09-03 · M-02/M-03)
// =============================================================================
// 공용 컴포넌트의 mono 라벨은 «라틴 대문자» 를 전제로 자간 1~2.2px 을 손으로 적어 두었습니다.
// 한글은 반대입니다. 「오늘  처리할  것」처럼 낱글자로 흩어집니다. 2026-08-21 에 SectionTitle 하나만
// tokens 의 labelTracking(한글이면 0) 으로 바꿨는데, 같은 파일에 같은 꼴이 스물두 곳 더 있었습니다.
//
// 이 계약은 `lib/design/components.tsx` 를 줄 단위로 훑습니다. `textTransform` 이 'uppercase' 인
// 줄 앞뒤 15줄 안에서 `letterSpacing: <양수|'…em'>` 리터럴이 보이면 실패합니다. 기준은 0 입니다.
// (음수 자간은 제목 조이기라 대상이 아닙니다. 앞뒤 모두 보는 이유는 두 속성의 순서가 자리마다
// 다르기 때문입니다.)
//
// 고치는 법: letterSpacing: labelTracking(문구, 값) · textTransform: labelCase(문구).
//
// 🔴 2026-09-09 감사(주제 #7)에서 정정: 종전에 여기 적어 두었던
//    `hasHangul(문구) ? undefined : 'uppercase'` 는 **틀렸습니다.** textTransform 은
//    상속 속성이라 undefined 는 자기 값을 «안 적을» 뿐이고 부모의 uppercase 가
//    그대로 내려옵니다. 실측에서 자기 style 에 textTransform 이 없는 한글 span 이
//    화면에서 uppercase 로 잡혔습니다. 끊으려면 'none' 을 «적어야» 하고,
//    그것이 labelCase() 입니다.

const FILE = 'lib/design/components.tsx';
const WINDOW = 15;

const UPPERCASE_LINE = /textTransform:[^\n]*'uppercase'/;
/** 양수 숫자 또는 '0.12em' 같은 em 문자열입니다. labelTracking( 은 잡지 않습니다. */
const RAW_TRACKING = /letterSpacing:\s*(\d|'\d[^']*em'|"\d[^"]*em")/;

export function rawTrackingNearUppercase(src: string): string[] {
  const lines = src.split(/\r?\n/);
  const out: string[] = [];
  const seen = new Set<number>();
  lines.forEach((line, i) => {
    if (!UPPERCASE_LINE.test(line)) return;
    const from = Math.max(0, i - WINDOW);
    const to = Math.min(lines.length - 1, i + WINDOW);
    for (let j = from; j <= to; j++) {
      if (seen.has(j)) continue;
      if (RAW_TRACKING.test(lines[j])) {
        seen.add(j);
        out.push(`  ${FILE}:${j + 1}  ${lines[j].trim()}  (uppercase ${i + 1}행 근처)`);
      }
    }
  });
  return out;
}

describe('라벨 자간: uppercase 라벨은 labelTracking 을 거칩니다', () => {
  const src = readFileSync(FILE, 'utf8');

  it('uppercase 를 다루는 자리가 여전히 있습니다(계약이 헛돌지 않습니다)', () => {
    /*
     * 🔴 리터럴 'uppercase' 만 세면 안 됩니다. 2026-09-10 에 22곳이 labelCase() 로
     *    바뀌면서 리터럴이 0 이 되었고, **고친 것 때문에 이 검사가 실패했습니다.**
     *    이 검사가 확인하려는 것은 「대상 파일에 대문자 라벨이 아직 있는가」이지
     *    「그 글자가 그대로 적혀 있는가」가 아닙니다. 두 꼴을 함께 셉니다.
     */
    const 리터럴 = src.match(/'uppercase'/g)?.length ?? 0;
    const 함수 = src.match(/labelCase\(/g)?.length ?? 0;
    expect(리터럴 + 함수, `리터럴 ${리터럴} + labelCase ${함수}`).toBeGreaterThan(10);
  });

  it('uppercase 근처의 raw letterSpacing 리터럴이 0 입니다', () => {
    const hits = rawTrackingNearUppercase(src);
    expect(
      hits,
      `한글에 자간이 걸리는 라벨 ${hits.length}곳. letterSpacing: labelTracking(문구, 값) 으로 바꾸고 ` +
        `textTransform 은 hasHangul(문구) ? undefined : 'uppercase' 로 두십시오.\n` +
        hits.join('\n'),
    ).toHaveLength(0);
  });

  it('검출기 자체가 raw 리터럴을 잡습니다(가드가 빈 그물이 아닙니다)', () => {
    const sample = ["        letterSpacing: 1.5,", "        textTransform: 'uppercase',"].join('\n');
    expect(rawTrackingNearUppercase(sample)).toHaveLength(1);
    const fixed = [
      "        letterSpacing: labelTracking(children, 1.5),",
      "        textTransform: labelCase(children),",
    ].join('\n');
    expect(rawTrackingNearUppercase(fixed)).toHaveLength(0);
    // 음수 자간(제목 조이기)은 대상이 아닙니다.
    const tight = ["        letterSpacing: '-0.02em',", "        textTransform: 'uppercase',"].join('\n');
    expect(rawTrackingNearUppercase(tight)).toHaveLength(0);
  });
});
