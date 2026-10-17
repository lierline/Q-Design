import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Grid } from './components';
import { BP } from './q-design-runtime';
import { responsiveColumns } from './q-design-responsive';

// =============================================================================
// Grid 배선 잠금: 클래스 룰이 인라인을 이깁니다 (2026-09-03 · M-06)
// =============================================================================
// `<Grid cols={4}>` 는 «데스크톱에서 4열» 이라고 주석에 적혀 있었지만, 실제로는 @media 룰과
// 인라인 `gridTemplateColumns` 를 함께 내보냈고 인라인이 언제나 이겼습니다. 즉 룰은 한 번도 적용된
// 적이 없고 24곳이 전부 auto-fit 으로만 놓였습니다. 컴파일도 되고 화면도 «그럴듯해서» 오래 살았습니다.
//
// 여기서는 SSR 마크업으로 사실을 고정합니다: 룰이 있으면 (1) 기본 템플릿이 룰 맨 앞에 같은 클래스
// 룰로 들어가고 (2) @media 룰이 뒤따르며 (3) div 의 style 에는 grid-template-columns 가 없습니다.
// 룰이 없으면 종전대로 인라인입니다.
//
// (vitest 의 JSX 변환은 vitest.config.ts 의 oxc 설정에 기댑니다. tsconfig 는 jsx: preserve 입니다.)

function gridDivStyle(html: string): string {
  const m = html.match(/<div class="qa-grid-[^"]+" style="([^"]*)"/);
  expect(m, `Grid div 를 찾지 못했습니다:\n${html}`).not.toBeNull();
  return m![1];
}

function styleTag(html: string): string {
  const m = html.match(/<style>([\s\S]*?)<\/style>/);
  expect(m, `<style> 가 없습니다:\n${html}`).not.toBeNull();
  return m![1];
}

describe('Grid: 룰이 인라인을 이깁니다', () => {
  it('CSS 간격 값을 숫자로 바꾸거나 px 를 덧붙이지 않는다', () => {
    expect(gridDivStyle(renderToStaticMarkup(<Grid gap="var(--qd-space-3, 12px)">x</Grid>)))
      .toContain('gap:var(--qd-space-3, 12px)');
    expect(gridDivStyle(renderToStaticMarkup(<Grid gap={12}>x</Grid>))).toContain('gap:12px');
  });

  it('cols={4}: @media (min-width:1024px) 룰이 있고 인라인 grid-template-columns 가 없습니다', () => {
    const html = renderToStaticMarkup(
      <Grid cols={4}>
        <div>a</div>
        <div>b</div>
      </Grid>,
    );
    const css = styleTag(html);
    expect(css).toContain(`@media (min-width:${BP.lg}px)`);
    expect(css).toContain(responsiveColumns(4));
    // 태블릿(≥768) 2열 룰도 함께 나갑니다(cols≥3).
    expect(css).toContain(`@media (min-width:${BP.md}px)`);
    const style = gridDivStyle(html);
    expect(style).toContain('display:grid');
    expect(style).not.toContain('grid-template-columns');
  });

  it('기본 템플릿 룰이 룰 맨 앞에 있어 뒤의 breakpoint 룰이 덮어씁니다', () => {
    const html = renderToStaticMarkup(<Grid cols={3}>x</Grid>);
    const css = styleTag(html);
    const baseEnd = css.indexOf('}@media (min-width:768px)');
    expect(baseEnd).toBeGreaterThan(0);
    expect(css.slice(0, baseEnd)).toContain(responsiveColumns());
  });

  it('cols={1} 도 데스크톱 1열 룰을 냅니다(auto-fit 여러 열이 아닙니다)', () => {
    const html = renderToStaticMarkup(<Grid cols={1}>x</Grid>);
    const css = styleTag(html);
    expect(css).toContain(`@media (min-width:${BP.lg}px)`);
    expect(css).toContain(responsiveColumns(1));
    expect(css).not.toContain(`@media (min-width:${BP.md}px)`);
    expect(gridDivStyle(html)).not.toContain('grid-template-columns');
  });

  it('responsive: base 룰이 기본 템플릿 룰 «뒤» 에 와서 이깁니다', () => {
    const html = renderToStaticMarkup(<Grid responsive={{ base: 2, lg: 4 }}>x</Grid>);
    const css = styleTag(html);
    const base = css.indexOf(responsiveColumns());
    const two = css.indexOf(responsiveColumns(2));
    expect(base).toBeGreaterThanOrEqual(0);
    expect(two).toBeGreaterThan(base);
    expect(gridDivStyle(html)).not.toContain('grid-template-columns');
  });

  it('룰이 없으면(cols·responsive 없음) 종전대로 인라인입니다', () => {
    const html = renderToStaticMarkup(<Grid>x</Grid>);
    expect(html).not.toContain('<style');
    expect(gridDivStyle(html)).toContain('grid-template-columns:' + responsiveColumns());
  });

  it('호출부 style 의 gridTemplateColumns 는 그대로 존중합니다(명시적 의도)', () => {
    const html = renderToStaticMarkup(
      <Grid cols={4} style={{ gridTemplateColumns: '1fr 2fr' }}>
        x
      </Grid>,
    );
    expect(gridDivStyle(html)).toContain('grid-template-columns:1fr 2fr');
  });
});
