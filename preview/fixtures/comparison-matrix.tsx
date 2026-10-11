import React, { useState, type ReactNode } from 'react';

type Control = { id: string; value: string; onChange: (event: any) => void; disabled?: boolean; required?: boolean };
export type ComparisonAdapters = {
  button: (text: string, options?: { secondary?: boolean; disabled?: boolean; onClick?: () => void }) => ReactNode;
  field: (id: string, label: string, child: ReactNode, error?: string) => ReactNode;
  input: (props: Control) => ReactNode;
  select: (props: Control) => ReactNode;
  textarea: (props: Control) => ReactNode;
  tag: (text: string) => ReactNode;
  card: (child: ReactNode) => ReactNode;
  table: () => ReactNode;
  progress: () => ReactNode;
  dialog: (open: boolean, close: () => void, child: ReactNode) => ReactNode;
  empty: (compact: boolean) => ReactNode;
  emptyAction?: (description: boolean) => ReactNode;
  emptyHints?: () => ReactNode;
  selectionRows?: () => ReactNode;
  tabs: () => ReactNode;
  choice: (selected: boolean) => ReactNode;
  skeleton: () => ReactNode;
};

// Only the comparison layout is shared here. Every specimen uses its product adapter.
export default function ComparisonMatrix({ adapters: a }: { adapters: ComparisonAdapters }) {
  const [name, setName] = useState('검증 계획');
  const [status, setStatus] = useState('review');
  const [note, setNote] = useState('검토 내용을 입력합니다.');
  const [dialog, setDialog] = useState(false);
  const control = (id: string, value: string, update: (value: string) => void): Control => ({ id, value, onChange: event => update(event.target.value), required: true });
  return <div className="qd-comparison-matrix" data-testid="comparison-matrix">
    <section><h2>01 버튼</h2><div className="qd-comparison-row">
      <span data-testid="parity-primary">{a.button('저장')}</span>
      <span data-testid="parity-secondary">{a.button('취소', { secondary: true })}</span>
      <span data-testid="parity-disabled-button">{a.button('사용 불가', { disabled: true })}</span>
    </div></section>
    <section><h2>02 입력과 상태</h2><div className="qd-comparison-fields">
      <div data-testid="parity-input">{a.field('parity-name', '문서 이름', a.input(control('parity-name', name, setName)))}</div>
      <div data-testid="parity-error">{a.field('parity-code', '문서 코드', a.input(control('parity-code', '', () => {})), '문서 코드를 입력하십시오.')}</div>
      <div data-testid="parity-disabled-input">{a.field('parity-locked', '잠긴 문서', a.input({ ...control('parity-locked', '검토 완료', () => {}), disabled: true }))}</div>
      <div data-testid="parity-select">{a.field('parity-status', '진행 상태', a.select(control('parity-status', status, setStatus)))}</div>
      <div data-testid="parity-textarea">{a.field('parity-notes', '검토 의견', a.textarea(control('parity-notes', note, setNote)))}</div>
    </div></section>
    <section><h2>03 상태와 카드</h2><div className="qd-comparison-row" data-testid="parity-tag">{a.tag('검토 중')}</div>
      <div data-testid="parity-card">{a.card(<><h3 className="qd-card-title">문서 검토</h3><p className="qd-card-description">입력 내용을 확인하고 검토를 진행합니다.</p></>)}</div>
    </section>
    <section><h2>04 표와 진행률</h2><div data-testid="parity-table">{a.table()}</div><div data-testid="parity-progress">{a.progress()}</div></section>
    <section><h2>05 대화상자</h2><span data-testid="parity-open-dialog">{a.button('문서 검토', { onClick: () => setDialog(true) })}</span></section>
    <section><h2>06 선택과 탭</h2><div className="qd-comparison-row"><span data-testid="parity-choice">{a.choice(false)}</span><span data-testid="parity-choice-selected">{a.choice(true)}</span></div><div data-testid="parity-tabs">{a.tabs()}</div></section>
    <section><h2>07 빈 화면과 로딩</h2><div data-testid="parity-empty">{a.empty(false)}</div><div data-testid="parity-empty-compact">{a.empty(true)}</div><div data-testid="parity-skeleton">{a.skeleton()}</div></section>
    {a.emptyAction && <section><h2>08 빈 화면의 다음 동작</h2><div data-testid="parity-empty-action">{a.emptyAction(true)}</div><div data-testid="parity-empty-title-action">{a.emptyAction(false)}</div></section>}
    {a.emptyHints && <section><h2>09 빈 화면의 안내</h2><div data-testid="parity-empty-hints">{a.emptyHints()}</div></section>}
    {a.selectionRows && <section><h2>10 사람 선택</h2><div data-testid="selection-rows">{a.selectionRows()}</div></section>}
    {a.dialog(dialog, () => setDialog(false), a.field('parity-dialog-note', '검토 의견', a.textarea(control('parity-dialog-note', note, setNote))))}
  </div>;
}
