import { describe, it, expect } from 'vitest';
import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { SubmitFailureSummary, failureFromResponse } from './components';
import { REPO_ROOT } from '@/lib/test-utils/contract-source';

// =============================================================================
// 제출 실패는 단추 위에 «남는» 요약으로, 초점도 거기로 (2026-10-08)
// =============================================================================
// ui-ux-pro-max 지침 119개 대조에서 남은 빈칸 셋 가운데 하나. 긴 폼이 실패하면 토스트 한 줄이 떴다
// 사라졌고, 낭독기 · 키보드 사용자는 초점이 단추에 남아 아무 데도 못 갔다. 이제 실패는 FormActions
// 바로 앞의 Alert 로 남고(role=alert · tabIndex -1 · 초점 이동), 서버의 fieldErrors 는 칸 아래로 이어진다.
// 초점 이동 자체는 브라우저에서 눌러 쟀다(세션 로그 2026-10-08). 여기서는 markup 과 «폼이 이 길을 쓰는가» 를 지킨다.
//
// (JSX 대신 createElement 를 쓴다. 까닭은 inline-strong.test.tsx 머리 주석과 같다.)
const h = createElement as unknown as (type: unknown, props: unknown, ...children: unknown[]) => ReactElement;

describe('failureFromResponse: API 응답을 실패 요약으로', () => {
  it('message 가 있으면 그것, fieldErrors 는 칸마다 첫 문장만', () => {
    const f = failureFromResponse(
      { error: 'invalid_input', message: '입력값을 확인해 주십시오. (확인할 칸 2개)', issues: { fieldErrors: { title: ['제목을 적으십시오.', '두 번째'], target_value: ['숫자여야 합니다.'] }, formErrors: [] } },
      '저장하지 못했습니다.',
    );
    expect(f.message).toBe('입력값을 확인해 주십시오. (확인할 칸 2개)');
    expect(f.fields).toEqual({ title: '제목을 적으십시오.', target_value: '숫자여야 합니다.' });
  });

  it('message 가 없고 error 가 기계 문자열이면 fallback, 한글 문장이면(옛 API) 그것', () => {
    expect(failureFromResponse({ error: 'invalid_input' }, '등록하지 못했습니다.').message).toBe('등록하지 못했습니다.');
    expect(failureFromResponse({ error: '같은 로트 번호가 이미 있습니다.' }, '등록하지 못했습니다.').message).toBe('같은 로트 번호가 이미 있습니다.');
    expect(failureFromResponse(null, '등록하지 못했습니다.')).toEqual({ message: '등록하지 못했습니다.' });
  });

  it('칸 오류가 없으면 fields 를 만들지 않는다', () => {
    expect(failureFromResponse({ message: '막혔습니다.', issues: { fieldErrors: {}, formErrors: ['x'] } }, 'f')).toEqual({ message: '막혔습니다.' });
  });
});

describe('SubmitFailureSummary: 남는 오류 알림 + 프로그램 초점 자리', () => {
  it('실패가 없으면 아무것도 그리지 않는다', () => {
    expect(renderToStaticMarkup(h(SubmitFailureSummary, { failure: null }))).toBe('');
  });

  it('실패가 있으면 role=alert 안에 요약과 칸 오류 목록, 바깥 상자는 tabIndex -1', () => {
    const out = renderToStaticMarkup(
      h(SubmitFailureSummary, { failure: { message: '저장하지 못했습니다.', fields: { title: '제목을 적으십시오.' } }, fieldIds: { title: 'qo-title' } }),
    );
    expect(out).toMatch(/<div[^>]*\bdata-submit-failure=""[^>]*\btabindex="-1"|<div[^>]*\btabindex="-1"[^>]*\bdata-submit-failure=""/);
    expect(out).toContain('role="alert"');
    expect(out).toContain('저장하지 못했습니다.');
    expect(out).toContain('제목을 적으십시오.');
    // 인라인 outline 으로 초점 고리를 지우지 않는다(계약 ⑳)
    expect(out).not.toMatch(/outline:\s*none/);
  });
});

// 본이 되는 새 기록 폼 아홉: 실패를 토스트로만 알리던 길로 되돌아가지 않는지
const FORMS = [
  'app/(app)/quality-objectives/new/client.tsx',
  'app/(app)/recalls/new/client.tsx',
  'app/(app)/feedback/new/client.tsx',
  'app/(app)/equipment/new/client.tsx',
  'app/(app)/authorized-reps/new/client.tsx',
  'app/(app)/lots/new/client.tsx',
  'app/(app)/device-licenses/new/client.tsx',
  'app/(app)/production-equipment/form.tsx',
  'app/(app)/process-validations/form.tsx',
];

describe('새 기록 폼 아홉은 제출 실패 요약을 쓴다', () => {
  for (const f of FORMS) {
    it(f, () => {
      const src = readFileSync(join(REPO_ROOT, f), 'utf8');
      expect(src).toContain('useSubmitFailure(');
      const summary = src.indexOf('<SubmitFailureSummary');
      const actions = src.indexOf('<FormActions');
      expect(summary).toBeGreaterThan(-1);
      expect(actions).toBeGreaterThan(summary); // 요약은 제출 단추 바로 앞
      expect(src).not.toMatch(/toast\.error\(json/); // 서버 실패를 토스트로만 알리던 옛 길
      expect(src).toMatch(/sf\.clear\(\);/); // 제출 시작에 지난 실패를 지운다
    });
  }
});
