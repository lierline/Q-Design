import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Alert, Btn, Checkbox, Field, In, ProgressBar, SectionTitle, Sel, Tag, Txt } from './components';
import { ChoiceChip, SegmentedChoice } from './segmented-choice';
import { QD } from './q-design-contract';
import { readSource } from '@/lib/test-utils/contract-source';
import { ListPager } from '@/components/ListPager';
import { ListToolbar } from '@/components/ListToolbar';
import { resolveStyleValues } from '@/lib/test-utils/design-source';

describe('Q-Design runtime adapter', () => {
  it('real controls retain live geometry variables so a canonical CSS change reaches their inline styles', () => {
    const button = renderToStaticMarkup(<Btn>저장</Btn>);
    const input = renderToStaticMarkup(<In value="문서" ro ariaLabel="문서 이름" />);
    const tag = renderToStaticMarkup(<Tag>검토 중</Tag>);
    for (const html of [button, input, tag]) {
      expect(html).toContain(`border-radius:${QD.radius}`);
      expect(html).not.toMatch(/border-radius:(?:6|10)px(?:;|")/);
    }
    for (const html of [button, input]) {
      expect(html).toContain(`min-height:${QD.controlHeight}`);
      expect(html).toContain(`font-size:${QD.controlSize}`);
    }
    expect(input).toContain('border:var(--qd-border-width)');
    expect(resolveStyleValues(input)).toContain(`border:1px solid ${QD.ctl}`);
    expect(button).toContain('qa-btn qd-btn');
  });

  it('pending actions keep an accessible busy state and cannot submit twice', () => {
    const html = renderToStaticMarkup(<Btn pending>저장</Btn>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('처리 중');
  });

  it('real list controls use live control typography and preserve pagination and touch access', () => {
    const toolbar = renderToStaticMarkup(<ListToolbar basePath="/documents" q="plan" searchIn="문서 이름" page={1} total={250} sorts={[{ key: 'newest', label: '최신순', col: 'created_at', asc: false }, { key: 'name', label: '이름순', col: 'name', asc: true }]} />);
    const fields = (toolbar.match(/<(?:input|select)\b[^>]*>/g) ?? []).filter(tag => /name="(?:q|sort)"/.test(tag));
    expect(fields).toHaveLength(2);
    for (const field of fields) {
      expect(field).toContain(`font-size:${QD.controlSize}`);
      expect(field).toContain('class="qa-touch-44"');
    }
    const pager = renderToStaticMarkup(<ListPager basePath="/documents" page={1} total={250} params={{ q: 'plan' }} />);
    const links = pager.match(/<a\b[^>]*>/g) ?? [];
    expect(links).toHaveLength(2);
    for (const link of links) {
      expect(link).toContain('class="qa-touch-44"');
      expect(link).toContain(`font-size:${QD.controlSize}`);
    }
    expect(links[0]).toContain('aria-disabled="true"');
    expect(links[0]).toContain('tabindex="-1"');
    expect(links[1]).toContain('page=2');
    expect(links[1]).toContain('q=plan');
    expect(pager).toContain('총 250건');
  });

  it('disabled input, select and textarea leave state visuals to the canonical CSS', () => {
    const noop = () => undefined;
    const controls = [
      <In key="in" disabled value="문서" />,
      <Sel key="sel" disabled value="draft" onChange={noop} opts={['draft']} />,
      <Sel key="legacy" ro value="draft" onChange={noop} opts={['draft']} />,
      <Txt key="txt" disabled value="검토 의견" onChange={noop} />,
    ];
    for (const control of controls) {
      const html = renderToStaticMarkup(control);
      expect(html).toContain('disabled=""');
      expect(html).not.toMatch(/(?:background|color|cursor|opacity):/);
    }
    const readOnly = renderToStaticMarkup(<In ro value="읽을 수 있는 문서" />);
    expect(readOnly).toContain('readOnly=""');
    expect(readOnly).not.toContain('disabled=""');
    expect(readOnly).toContain(`color:${QD.muted}`);
    const css = readSource('app/q-design.components.css', 'raw'); // Canonical CSS owns the state visuals.
    expect(css).toMatch(/\.qd-input:disabled\s*\{[^}]*background:\s*var\(--qd-bg\)[^}]*color:\s*var\(--qd-muted\)[^}]*cursor:\s*not-allowed/);
  });

  it('invalid fields keep their label, invalid state and error relationship after styling', () => {
    const html = renderToStaticMarkup(<Field id="document-code" label="문서 코드" error="코드를 입력해 주세요."><In id="document-code" value="" onChange={() => undefined} /></Field>);
    expect(html).toContain('for="document-code"');
    expect(html).toContain('aria-invalid="true"');
    const described = html.match(/aria-describedby="([^"]+)"/)?.[1];
    expect(described).toBeTruthy();
    expect(html).toContain(`id="${described}"`);
    expect(html).toContain('role="alert"');
  });

  it('selection styling preserves toggle, checkbox and radio semantics', () => {
    const chip = renderToStaticMarkup(<ChoiceChip on onClick={() => undefined}>내 문서</ChoiceChip>);
    const checkbox = renderToStaticMarkup(<Checkbox checked onChange={() => undefined}>알림</Checkbox>);
    const radio = renderToStaticMarkup(<SegmentedChoice ariaLabel="문서 상태" value="review" onChange={() => undefined} options={[{ value: 'draft', label: '작성 중' }, { value: 'review', label: '검토 중' }]} />);
    expect(chip).toContain('aria-pressed="true"');
    expect(chip).toContain('qa-touch-44 qd-choice');
    expect(checkbox).toMatch(/<input[^>]+class="qd-checkbox"[^>]+checked=""/);
    expect(checkbox).toContain(`min-height:${QD.controlHeight}`);
    expect(radio).toContain('role="radiogroup"');
    expect((radio.match(/role="radio"/g) ?? [])).toHaveLength(2);
    expect((radio.match(/tabindex="0"/g) ?? [])).toHaveLength(1);
    expect(radio).toContain('aria-checked="true"');
  });

  it('status feedback uses the canonical recipe and keeps urgency and progress bounds', () => {
    const alert = renderToStaticMarkup(<Alert kind="error">저장하지 못했습니다.</Alert>);
    expect(alert).toContain('class="qd-notice"');
    expect(alert).toContain('data-kind="error"');
    expect(alert).toContain('role="alert"');
    expect(alert).not.toMatch(/backdrop-filter|border-left|background:/);
    const progress = renderToStaticMarkup(<ProgressBar value={140} ariaLabel="검토 진행률" />);
    expect(progress).toContain('aria-label="검토 진행률"');
    expect(progress).toContain('aria-valuenow="100"');
    expect(progress).toContain('width:100%');
    const title = renderToStaticMarkup(<SectionTitle as="h2">검토 문서</SectionTitle>);
    expect(title).toContain('<h2');
    expect(title).toContain(`font-size:${QD.sectionSize}`);
  });

  it('overlay adapters have no local blur and subscribe to canonical surfaces and stacking', () => {
    for (const file of ['lib/design/components.tsx', 'components/Confirm.tsx', 'components/Toast.tsx', 'components/Coachmark.tsx', 'components/GlobalSearch.tsx']) {
      const src = readSource(file);
      expect(src, file).not.toMatch(/backdropFilter:\s*['"`][^'"`]*blur/);
    }
    const src = readSource('components/Confirm.tsx');
    expect(src).toContain('zIndex: QD.zBlocking');
    expect(src).toContain('background: QD.surface');
    expect(src).toContain('className="qd-dialog-content"');
    expect(QD.zBlocking).toBe('var(--qd-z-blocking, 10001)');
  });

  it('unlayered product CSS cannot restore old radii, mobile input sizes or skeleton gradients', () => {
    const css = readSource('app/globals.css', 'raw'); // CSS 원문을 검사하며 TS 주석 제거를 적용하지 않는다.
    for (const selector of ['.qa-input', '.qa-btn', '.qa-btn-secondary']) {
      const block = css.slice(css.indexOf(`${selector} {`), css.indexOf('}', css.indexOf(`${selector} {`)));
      expect(block, selector).toContain('border-radius: var(--qd-radius, 10px)');
      expect(block, selector).toContain('var(--qd-motion-fast, 160ms)');
    }
    expect(css).toContain('font-size: var(--qd-control-size, 13px) !important');
    expect(css).not.toContain('.qa-skeleton::after');
    expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.qa-skeleton \{ animation: none;/);
  });
});
