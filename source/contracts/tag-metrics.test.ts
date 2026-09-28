import { describe, it, expect } from 'vitest';
import { TAG_DIMS, TAG_BORDER, tagContentHeight, tagHeight, tagHeightDriver } from './tag-metrics';
import { LH } from './tokens';

// =============================================================================
// Tag 높이 사슬 잠금 (2026-08-06)
// =============================================================================
// `LH.snug` 는 두 곳에 걸려 있다. `TYPE.mono.lineHeight`(모든 mono 라벨)와
// `Tag`(97파일). 그리고 md 배지는 minHeight 가 아니라 **lineHeight 가 높이를
// 결정한다**. 즉 줄간격 토큰 하나를 만지면 라벨 줄간격과 배지 박스가 동시에
// 움직이는데, 그 사슬이 코드 어디에도 드러나 있지 않았다.
//
// 이 테스트는 값을 «옳다»고 주장하지 않는다. **현재 사실을 고정**한다:
// 지배 요인이 바뀌면 실패하면서 "무엇이 움직이는지"를 알려주는 것이 목적이다.
// 그래서 디자인을 의도적으로 바꿀 때는 이 기대값을 함께 고쳐야 한다(그게 신호다).

describe('Tag 높이: 무엇이 높이를 결정하는가', () => {
  it('크기별 지배 요인이 고정돼 있다', () => {
    const driver = Object.fromEntries(
      (Object.keys(TAG_DIMS) as (keyof typeof TAG_DIMS)[]).map((k) => [k, tagHeightDriver(k)]),
    );
    expect(
      driver,
      `Tag 의 «높이를 정하는 것»이 바뀌었습니다.\n` +
        `minHeight → lineHeight 로 넘어갔다면, 이제 LH.snug 를 바꿀 때마다 배지 박스가\n` +
        `움직입니다(97파일 영향). 반대 방향이면 배지가 규격대로 고정된 것이니 환영.\n` +
        `의도한 변경이면 이 기대값을 고치세요.`,
    ).toEqual({ xs: 'minHeight', sm: 'minHeight', md: 'lineHeight' });
  });

  // ── 브라우저 실측 대조 (2026-08-06, Chromium / dev 서버) ──────────────────
  // 같은 스타일을 DOM 으로 재현해 getBoundingClientRect().height 를 쟀다:
  //     xs 18.000 · sm 22.000 · md **26.094**
  // 여기 계산(16.0 / 21.4 / 26.1)과 지배 관계가 정확히 일치한다. md 의 0.006px
  // 차이는 브라우저 line box 반올림이며 결론(minHeight 를 넘는다)은 같다.
  // → 이 파일의 산수는 «실제 렌더»와 맞는 것이 실증됐다.

  // ── 2026-09-28 글자 12 · 12 · 13 으로 올림(보조 글씨 최소 12px · 오너 결정) ─────────────
  // 높이를 정하는 쪽은 그대로 두었다: xs · sm 은 minHeight(20 · 24), md 는 줄 높이(28.2 > 28).
  // 위 브라우저 실측은 옛 값(10 · 11 · 11.5) 때의 기록이다. 새 값은 정본 12px 화면 측정에서 다시 쟀다.

  it('md 는 minHeight 를 0.2px 이긴다. 이 여유가 사라지면 지배가 뒤집힌다', () => {
    expect(tagContentHeight('md')).toBeCloseTo(28.2, 5);
    expect(TAG_DIMS.md.minH).toBe(28);
    // 여유가 아주 얇다는 사실 자체가 위험 신호다. 기록으로 남긴다.
    expect(tagContentHeight('md') - TAG_DIMS.md.minH).toBeLessThan(0.5);
  });

  it('sm 은 여유가 1.2px 이다(minHeight 가 높이를 정한다)', () => {
    // 12 × 1.4 + 2×2 + 1×2 = 22.8 vs minHeight 24
    expect(tagContentHeight('sm')).toBeCloseTo(22.8, 5);
    expect(TAG_DIMS.sm.minH - tagContentHeight('sm')).toBeLessThan(1.5);
  });

  it('실제 렌더 높이 = max(minHeight, 콘텐츠)', () => {
    expect(tagHeight('xs')).toBe(20);
    expect(tagHeight('sm')).toBe(24);
    expect(tagHeight('md')).toBeCloseTo(28.2, 5);
  });

  it('LH.snug 를 올리면 세 크기 모두 lineHeight 지배로 넘어간다', () => {
    // 「이 토큰을 만지면 무슨 일이 나는가」를 코드로 보여준다.
    const bigger = LH.snug + 0.3;
    expect(tagHeightDriver('xs', bigger)).toBe('lineHeight');
    expect(tagHeightDriver('sm', bigger)).toBe('lineHeight');
    expect(tagHeightDriver('md', bigger)).toBe('lineHeight');
  });

  it('규격 자체가 온전하다 (paddingY 분리가 값을 안 바꿨는지)', () => {
    expect(TAG_BORDER).toBe(1);
    expect(TAG_DIMS.xs).toMatchObject({ minH: 20, fs: 12, padY: 0, padX: 6, dotSize: 5, gap: 4 });
    expect(TAG_DIMS.sm).toMatchObject({ minH: 24, fs: 12, padY: 2, padX: 8, dotSize: 6, gap: 4 });
    expect(TAG_DIMS.md).toMatchObject({ minH: 28, fs: 13, padY: 4, padX: 10, dotSize: 7, gap: 5 });
    // 보조 글씨 최소 12px (오너 결정 2026-09-27)
    for (const d of Object.values(TAG_DIMS)) expect(d.fs).toBeGreaterThanOrEqual(12);
  });
});
