import { S, LH } from './tokens';

// =============================================================================
// Tag 크기 규격 + 높이 계산 SSOT (2026-08-06)
// =============================================================================
// 왜 컴포넌트 밖으로 뺐나:
//
// `Tag` 는 97개 파일이 쓰는 최다 소비 컴포넌트다. 그런데 그 높이가 **무엇으로
// 결정되는지가 코드 어디에도 없었다.** `minHeight` 가 있으니 당연히 그게 지배할
// 것 같지만, md 는 아니다:
//     11.5 × LH.snug(1.4) + padY 4×2 + border 1×2 = 26.1 > minHeight 26
// 즉 **줄간격이 배지 높이를 정한다.** 그래서 `LH.snug` 를 1px 만 만지면 mono 라벨
// 전체(TYPE.mono.lineHeight 도 같은 키를 쓴다)와 md 배지 박스가 «동시에» 움직인다.
// 이 사슬이 보이지 않는 것이 위험의 본질이었다.
//
// 규격을 데이터로 뽑고 계산을 함수로 만들면 `tag-metrics.test.ts` 가 그 사슬을
// 잠글 수 있다. 지배 요인이 바뀌는 순간 테스트가 실패하며 무엇이 움직이는지 알려준다.
//
// ⚠️ 이 값들은 **시각 규격**이다. 바꾸면 픽셀이 실제로 움직인다(값 보존 아님).

/** 테두리 두께(px): 상하 각 1px 이 높이에 더해진다 */
export const TAG_BORDER = 1;

/**
 * 크기별 규격. `padY`/`padX` 를 숫자로 분리해 둔 이유는 높이 계산에 padY 가
 * 필요해서다. `'4px 10px'` 문자열이면 테스트가 파싱해야 하고, 파싱은 틀린다.
 */
export const TAG_DIMS = {
  xs: { minH: 18, fs: 10, padY: 0, padX: 6, dotSize: 5, gap: S[1] },
  sm: { minH: 22, fs: 11, padY: 2, padX: 8, dotSize: 6, gap: S[1] },
  md: { minH: 26, fs: 11.5, padY: 4, padX: 10, dotSize: 7, gap: 5 },
} as const;

export type TagSize = keyof typeof TAG_DIMS;

/** 콘텐츠가 요구하는 높이. 이게 minHeight 를 넘으면 배지가 그만큼 커진다. */
export function tagContentHeight(size: TagSize, lineHeight: number = LH.snug): number {
  const d = TAG_DIMS[size];
  return d.fs * lineHeight + d.padY * 2 + TAG_BORDER * 2;
}

/** 실제 렌더 높이 = max(minHeight, 콘텐츠 높이) */
export function tagHeight(size: TagSize, lineHeight: number = LH.snug): number {
  return Math.max(TAG_DIMS[size].minH, tagContentHeight(size, lineHeight));
}

/**
 * 이 크기의 높이를 «무엇이» 결정하는가.
 * `'minHeight'` = 규격이 지배(안전) · `'lineHeight'` = 줄간격이 지배(LH 변경에 반응).
 */
export function tagHeightDriver(size: TagSize, lineHeight: number = LH.snug): 'minHeight' | 'lineHeight' {
  return tagContentHeight(size, lineHeight) > TAG_DIMS[size].minH ? 'lineHeight' : 'minHeight';
}
