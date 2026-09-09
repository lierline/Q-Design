// =============================================================================
// Bx 안쪽 여백 계약
// =============================================================================
// 🔴 2026-08-25 오빠 지적(디자인 통일성). 새로 만든 두 화면에서 상자 글자가 테두리에
//    붙어 있었다. 원인은 **`Bx` 에 기본 padding 이 없다**는 것이다. 호출부가 줘야 한다.
//
//    같은 화면 안에서 기존 상자는 16px, 내가 만든 상자는 0px 이라 나란히 놓였을 때
//    줄이 안 맞았다. 실측: 글자 들여쓰기 17px vs 2px.
//
// 🔑 이런 어긋남은 **컴파일도 되고 테스트도 통과한다.** 눈으로 봐야만 보인다.
//    그래서 새로 만드는 화면만이라도 계약으로 잡는다.
//
// ⚠️ 기존 화면 전체에 소급 적용하지 않는다. `Bx` 274곳 중 69곳이 padding 없이 쓰이는데,
//    그중 상당수는 «의도적으로» 여백 없는 컨테이너다(표·목록 래퍼 등).
//    기본값을 바꾸면 그 69곳이 한꺼번에 움직인다. 새 화면만 지킨다.

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

/** 2026-08-25 이후 만든 화면. 여기 추가하면 그 파일도 계약이 지킨다. */
const GUARDED = [
  'app/(app)/admin/qmatch-quiz/page.tsx',
  'components/admin/ServiceStatusPanel.tsx',
];

describe('Bx 안쪽 여백', () => {
  for (const file of GUARDED) {
    it(`🔑 ${file} 의 모든 Bx 가 padding 을 준다`, () => {
      const src = readFileSync(file, 'utf8');
      // <Bx ...> 여는 태그만 추출(자식 내용은 제외).
      const tags = src.match(/<Bx\b[^>]*>/g) ?? [];
      expect(tags.length, 'Bx 를 하나도 안 쓴다면 이 계약이 헛돈다').toBeGreaterThan(0);
      const naked = tags.filter((t) => !/padding/.test(t));
      expect(
        naked,
        `padding 없는 Bx 가 ${naked.length}개. 글자가 테두리에 붙는다:\n  ${naked.join('\n  ')}`,
      ).toHaveLength(0);
    });
  }

  // 🔴 2026-08-25. 같은 화면 「권한 매트릭스」에서 Alert 3개가 전부 아래 간격 0px 이었다.
  //    다음 요소가 테두리에 붙어 있었는데, 컴파일도 되고 테스트도 통과했다.
  //    호출 101곳 중 손으로 여백을 준 곳은 6곳뿐이었다 → 기본값을 컴포넌트에 넣었다.
  //    🔑 이 계약은 «기본값이 있다» 를 지킨다. 지워지면 95곳이 한꺼번에 다시 붙는다.
  it('🔑 Alert 이 기본 marginBottom 을 갖는다 (없으면 다음 요소가 테두리에 붙는다)', () => {
    const src = readFileSync('lib/design/components.tsx', 'utf8');
    const i = src.indexOf('export function Alert(');
    expect(i, 'Alert 컴포넌트를 못 찾았다. 이름이 바뀌었으면 이 계약도 고칠 것').toBeGreaterThan(-1);
    // ⚠️ 주석을 먼저 걷어낸다. 처음에 안 걷었더니 **내가 쓴 주석 안의 `...style`** 을
    //    코드로 읽고 순서가 뒤집혔다고 틀리게 실패했다. 이 저장소에서 세 번째 같은 함정이다.
    //    🔑 설명을 지우게 만드는 가드는 나쁜 가드다. 가드가 주석을 거르는 게 맞다.
    const fn = src
      .slice(i, i + 3200)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/[^\n]*/g, '');
    // 🔴 처음엔 함수 전체에서 `marginBottom: S[` 를 찾았다. **기본값을 지워도 통과했다.**
    //    Alert 제목 div 에 `marginBottom: S[1]` 이 따로 있어서 그게 걸린 것이다.
    //    일부러 깨뜨려 보지 않았으면 「가드가 있다」고 믿은 채 지나갔다.
    //
    //    🔑 그래서 «루트 style 블록 안» 으로 범위를 좁힌다. 그 블록은 `...style` 로 끝나므로
    //       기본값은 반드시 그 앞에 있어야 하고, 이 한 줄이 «존재» 와 «덮어쓰기 가능» 을 함께 지킨다.
    const spread = fn.indexOf('...style');
    expect(spread, 'Alert 의 루트 style 에 `...style` 이 없다. 호출부가 스타일을 못 바꾼다').toBeGreaterThan(-1);
    const rootStyle = fn.slice(0, spread);
    expect(
      /marginBottom:\s*S\[[\d.]+\]/.test(rootStyle),
      'Alert 의 기본 marginBottom 이 사라졌다(또는 `...style` 뒤로 밀렸다). ' +
        '여백을 안 주는 호출 95곳이 전부 다음 요소에 붙는다.',
    ).toBe(true);
  });

  it('Bx 가 여전히 기본 padding 을 갖지 않는다 (계약의 전제)', () => {
    // 언젠가 Bx 에 기본값이 생기면 이 계약은 불필요해진다. 그때 이 테스트가 알려준다.
    // (기본값이 생겼는데 계약이 남아 있으면 «중복 지정» 을 강요하게 된다.)
    const src = readFileSync('lib/design/components.tsx', 'utf8');
    const fn = src.slice(src.indexOf('export function Bx('), src.indexOf('export function Bx(') + 2600);
    expect(
      /padding:\s*S\[/.test(fn),
      'Bx 에 기본 padding 이 생겼다. 이 계약을 지우고 호출부의 중복 지정을 정리할 것.',
    ).toBe(false);
  });
});
