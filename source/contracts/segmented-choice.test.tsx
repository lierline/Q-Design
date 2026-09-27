import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { SegmentedChoice, nextEnabledIndex, rovingIndex, type SegmentedOption } from './segmented-choice';

// =============================================================================
// SegmentedChoice: 라디오 의미와 roving tabindex 잠금 (2026-09-03 · M-08)
// =============================================================================
// 여덟 화면의 세그먼트 버튼이 «버튼 나열» 이라 스크린리더가 선택 상태를 읽지 못했습니다.
// SSR 마크업으로 (1) radiogroup/radio/aria-checked 가 있고 (2) 정확히 하나만 tabindex=0 이며
// (3) disabled 항목은 aria-disabled 로 표시되는 것을 고정합니다. 화살표 이동은 DOM 이벤트가
// 필요해 순수 함수(nextEnabledIndex)로 따로 잽니다.

const OPTS: ReadonlyArray<SegmentedOption<'a' | 'b' | 'c'>> = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', disabled: true, title: '잠김' },
  { value: 'c', label: 'C' },
];

function attrs(html: string, re: RegExp): string[] {
  return [...html.matchAll(re)].map((m) => m[1]);
}

describe('SegmentedChoice 마크업', () => {
  it('radiogroup 안에 radio 셋, 골라진 것만 aria-checked=true', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={OPTS} value="c" onChange={() => {}} ariaLabel="보기" />,
    );
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="보기"');
    expect(attrs(html, /role="(radio)"/g)).toHaveLength(3);
    expect(attrs(html, /aria-checked="(true|false)"/g)).toEqual(['false', 'false', 'true']);
  });

  it('roving tabindex: 골라진 항목만 0, 나머지는 -1', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={OPTS} value="c" onChange={() => {}} ariaLabel="보기" />,
    );
    expect(attrs(html, /tabindex="(-?\d)"/g)).toEqual(['-1', '-1', '0']);
  });

  it('선택이 없으면 첫 활성 항목이 tabindex=0 (비활성은 Tab 순서에서 빠짐)', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={[OPTS[1], OPTS[0], OPTS[2]]} value={null} onChange={() => {}} ariaLabel="보기" />,
    );
    expect(attrs(html, /tabindex="(-?\d)"/g)).toEqual(['-1', '0', '-1']);
  });

  it('disabled 항목은 disabled + aria-disabled + title 을 내보낸다', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={OPTS} value="a" onChange={() => {}} ariaLabel="보기" />,
    );
    expect(html).toMatch(/aria-disabled="true"[^>]*disabled=""|disabled=""[^>]*aria-disabled="true"/);
    expect(html).toContain('title="잠김"');
  });

  it('readOnly 는 aria-readonly 로 드러난다', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={OPTS} value="a" onChange={() => {}} ariaLabel="보기" readOnly />,
    );
    expect(html).toContain('aria-readonly="true"');
  });

  it('sub 가 있으면 두 번째 줄이 렌더된다', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={[{ value: 'x', label: '사망', sub: '7일' }]} value="x" onChange={() => {}} ariaLabel="심각도" />,
    );
    expect(html).toContain('7일');
  });

  // 화면 검토 A11 · A38 · A62 (2026-09-27): 골라진 칸이 주 단추와 같은 채운 면이라 단추처럼 보였다
  it('골라진 칸은 채운 면이 아니라 짙은 테두리 + 체크다 (뜻 색은 면으로 깔리지 않는다)', () => {
    const html = renderToStaticMarkup(
      <SegmentedChoice options={OPTS} value="c" onChange={() => {}} ariaLabel="보기" color="#ff0000" />,
    );
    expect(html.match(/✓/g)).toHaveLength(1);
    expect(html).not.toMatch(/background:#ff0000/i);
  });
});

describe('화살표 이동 규칙 (nextEnabledIndex · rovingIndex)', () => {
  it('오른쪽: 비활성을 건너뛰고, 끝에서는 처음으로 감는다', () => {
    expect(nextEnabledIndex(OPTS, 0, 1)).toBe(2);
    expect(nextEnabledIndex(OPTS, 2, 1)).toBe(0);
  });

  it('왼쪽: 비활성을 건너뛰고, 처음에서는 끝으로 감는다', () => {
    expect(nextEnabledIndex(OPTS, 2, -1)).toBe(0);
    expect(nextEnabledIndex(OPTS, 0, -1)).toBe(2);
  });

  it('Home/End 는 범위 밖 from 으로 호출된다: -1 에서 +1 은 첫 활성, length 에서 -1 은 마지막 활성', () => {
    expect(nextEnabledIndex(OPTS, -1, 1)).toBe(0);
    expect(nextEnabledIndex(OPTS, OPTS.length, -1)).toBe(2);
  });

  it('전부 비활성이면 null (무한 루프 없이)', () => {
    expect(nextEnabledIndex([{ disabled: true }, { disabled: true }], 0, 1)).toBeNull();
    expect(nextEnabledIndex([], 0, 1)).toBeNull();
  });

  it('rovingIndex: 골라진 것이 비활성이면 첫 활성 항목으로 떨어진다', () => {
    expect(rovingIndex(OPTS, 'b')).toBe(0);
    expect(rovingIndex(OPTS, 'c')).toBe(2);
    expect(rovingIndex([{ value: 'z', label: 'Z', disabled: true }], 'z')).toBeNull();
  });
});
