import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { readSource } from '@/lib/test-utils/contract-source';
import { Collapse } from './components';

// 접힌 묶음의 안쪽은 «낭독기에서 숨고 + 초점도 못 받아야» 한다.
// 종전에는 aria-hidden 만 있어서, 닫힌 묶음 안의 단추(내려받기 · 미리 보기)가 tab 으로 계속 잡혔다
// (낭독기에는 안 보이는데 초점만 들어가는 상태. 2026-10-02 검토 지적).

describe('Collapse', () => {
  it('닫혀 있으면 aria-hidden 과 inert 를 함께 단다', () => {
    const html = renderToStaticMarkup(
      <Collapse open={false}>
        <button type="button">안쪽 단추</button>
      </Collapse>,
    );
    expect(html).toMatch(/aria-hidden="true"/);
    expect(html).toMatch(/\binert(=""|\s|>)/);
  });

  it('열려 있으면 둘 다 달지 않는다', () => {
    const html = renderToStaticMarkup(
      <Collapse open>
        <button type="button">안쪽 단추</button>
      </Collapse>,
    );
    expect(html).not.toMatch(/aria-hidden="true"/);
    expect(html).not.toMatch(/\binert\b/);
  });
});

describe('보조 동작 글귀(TextAction)에 낭독 이름이 있다', () => {
  const textAction = readSource('components/TextAction.tsx');
  const panel = readSource('components/qms/DefaultDocsPanel.tsx');

  it('TextAction 은 label 을 aria-label 로 내보낸다', () => {
    expect(textAction).toMatch(/label\?: string/);
    expect(textAction).toMatch(/aria-label=\{label\}/);
  });

  it('기본 문서 목록의 반복 단추(내려받기 · 미리 보기 · 양식 보기)는 대상 이름을 단다', () => {
    const labelled = panel.match(/label=\{`/g) ?? [];
    expect(labelled.length).toBeGreaterThanOrEqual(4);
    expect(panel).toMatch(/label=\{`미리 보기: \$\{name\}`\}/);
  });
});
