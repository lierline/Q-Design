import React from 'react';
import { Panel, Tag, Progress, Empty } from '@/components/ui';
import { Table, Th, Td } from '@/components/table';
import { Dialog } from '@/components/dialog';
import ComparisonMatrix, { type ComparisonAdapters } from './comparison-matrix';
const a: ComparisonAdapters = {
  button: (text, options = {}) => <button className={`qd-btn qd-btn--${options.secondary ? 'secondary' : 'primary'}`} type="button" disabled={options.disabled} onClick={options.onClick}>{text}</button>,
  field: (id, label, child, error) => <div><label className="qd-field-label" htmlFor={id} data-hangul="">{label}<span aria-hidden="true" style={{ color: 'var(--qd-danger)', marginLeft: 2 }}>*</span></label>{error ? React.cloneElement(child as React.ReactElement<any>, { 'aria-invalid': true, 'aria-describedby': `${id}-error` }) : child}{error && <p className="qd-field-error" id={`${id}-error`} role="alert">{error}</p>}</div>,
  input: props => <input className="qd-input" {...props} />,
  select: props => <select className="qd-input" {...props}><option value="draft">작성 중</option><option value="review">검토 중</option></select>,
  textarea: props => <textarea className="qd-input" {...props} rows={3} />,
  tag: text => <Tag>{text}</Tag>,
  card: child => <Panel bodyClassName="qd-card-content">{child}</Panel>,
  table: () => <Table><thead><tr><Th>문서</Th><Th>상태</Th></tr></thead><tbody><tr><Td>검증 계획</Td><Td><Tag>검토 중</Tag></Td></tr></tbody></Table>,
  progress: () => <Progress done={3} total={5} />,
  empty: compact => <Empty compact={compact} hint="문서를 등록하면 이곳에 표시됩니다.">등록된 문서가 없습니다</Empty>,
  tabs: () => <nav className="qd-tabs" aria-label="문서 갈래"><a href="/review" className="qd-tab qd-tab--active" aria-current="page">검토 중</a><a href="/done" className="qd-tab">검토 완료</a></nav>,
  choice: selected => <button type="button" className={`qd-choice${selected?' qd-choice--selected':''}`} aria-pressed={selected}>문서 선택</button>,
  skeleton: () => <div className="qd-skeleton" aria-hidden style={{height:16,width:'100%'}} />,
  dialog: (open, close, child) => <Dialog open={open} onClose={close} title="문서 검토" note="검토 내용을 확인하십시오.">{child}<div className="qd-dialog-actions">{a.button('취소', { secondary: true, onClick: close })}{a.button('검토 저장', { onClick: close })}</div></Dialog>,
};
export default function Fixture() { return <ComparisonMatrix adapters={a} />; }
