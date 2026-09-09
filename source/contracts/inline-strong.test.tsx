import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InlineStrong } from './components';

// =============================================================================
// InlineStrong + 영향 평가 초안의 평문 계약 (2026-09-03 · M-05)
// =============================================================================
// 변경요청 영향 평가의 AI 초안이 `**굵게**` 를 섞어 보내면 ImpactBox 가 별표를 그대로 찍었습니다.
// 두 겹으로 막습니다: 서버(impact-suggest)가 프롬프트로 평문을 요구하고 응답에서 ** 를 걷어내며,
// 화면은 이미 저장된 본문을 위해 ** 만 <strong> 으로 받습니다.
//
// (JSX 대신 createElement 를 씁니다. vitest 의 JSX 변환은 vitest.config.ts 의 oxc 설정에 기댑니다.)

const render = (text: string) => renderToStaticMarkup(h(InlineStrong, { text }));

describe('InlineStrong', () => {
  it('**굵게** 만 <strong> 으로 바꿉니다', () => {
    expect(render('안전성에 **새 위해요인** 이 생깁니다.')).toBe(
      '안전성에 <strong>새 위해요인</strong> 이 생깁니다.',
    );
  });

  it('기호가 없으면 그대로입니다', () => {
    expect(render('추가 검토 필요')).toBe('추가 검토 필요');
  });

  it('짝이 안 맞는 ** 는 손대지 않습니다', () => {
    expect(render('**열린 채')).toBe('**열린 채');
  });

  it('여러 개도 순서대로입니다', () => {
    expect(render('**a** 와 **b**')).toBe('<strong>a</strong> 와 <strong>b</strong>');
  });

  it('다른 마크다운(#, -)은 해석하지 않습니다', () => {
    expect(render('# 제목 - 항목')).toBe('# 제목 - 항목');
  });
});

describe('impact-suggest 서버 쪽 평문 계약', () => {
  const src = readFileSync('app/api/research/[code]/change-requests/impact-suggest/route.ts', 'utf8');

  it('프롬프트가 마크다운 기호 없이 평문을 요구합니다', () => {
    expect(src).toMatch(/마크다운 기호\(\*\*, #, -\) 없이 평문/);
  });

  it('clampField 가 ** 를 걷어냅니다', () => {
    const fn = src.match(/function clampField[\s\S]*?\n\}/)?.[0] ?? '';
    expect(fn, 'clampField 를 찾지 못했습니다').not.toBe('');
    expect(fn).toMatch(/replace\(\/\\\*\\\*\/g, ''\)/);
  });
});
