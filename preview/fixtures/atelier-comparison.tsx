import React from 'react';
import { Btn, IconBtn, Bx, Field, In, Sel, Txt, Tag, DataTable, ProgressBar, Modal, EmptyState } from '@/lib/design/components';
import { ChoiceChip } from '@/lib/design/segmented-choice';
import { PageTabs } from '@/components/PageTabs';
import { Skeleton } from '@/components/Skeleton';
import ComparisonMatrix, { type ComparisonAdapters } from './comparison-matrix';
export const a: ComparisonAdapters = {
  secondaryIcon: () => <IconBtn title="아이콘 보조 동작" className="qd-btn--secondary"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" /></svg></IconBtn>,
  button: (text, options = {}) => <Btn p={!options.secondary} disabled={options.disabled} onClick={options.onClick}>{text}</Btn>,
  field: (id, label, child, error) => <Field id={id} label={label} required error={error}>{child}</Field>,
  input: props => <In {...props} />,
  select: props => <Sel {...props} opts={[{ v: 'draft', l: '작성 중' }, { v: 'review', l: '검토 중' }]} />,
  textarea: props => <Txt {...props} rows={3} />,
  tag: text => <Tag>{text}</Tag>,
  card: child => <Bx className="qd-card"><div className="qd-card-content">{child}</div></Bx>,
  table: () => <DataTable ariaLabel="검토 문서" rows={[{ id: 'DOC-001', title: '검증 계획', state: '검토 중' }]} getRowKey={row => row.id} columns={[{ key: 'title', header: '문서', render: row => row.title }, { key: 'state', header: '상태', render: row => <Tag>{row.state}</Tag> }]} />,
  progress: () => <ProgressBar value={60} />,
  empty: compact => <EmptyState compact={compact} title="등록된 문서가 없습니다" description="문서를 등록하면 이곳에 표시됩니다." />,
  emptyAction: description => <EmptyState title="등록된 문서가 없습니다" description={description ? '문서를 등록하면 이곳에 표시됩니다.' : undefined} action={<Btn>문서 등록</Btn>} />,
  emptyHints: () => <EmptyState title="등록된 문서가 없습니다" description="문서를 등록하면 이곳에 표시됩니다." action={<Btn>문서 등록</Btn>} hints={[{label:'문서 목록',href:'/docs'}]} />,
  tabs: () => <PageTabs label="문서 갈래" active="review" tabs={[{key:'review',href:'/review',label:'검토 중'},{key:'done',href:'/done',label:'검토 완료'}]} />,
  choice: selected => <ChoiceChip on={selected} onClick={()=>{}}>문서 선택</ChoiceChip>,
  skeleton: () => <Skeleton height={16} width="100%" />,
  dialog: (open, close, child) => <Modal open={open} onClose={close} title="문서 검토" sub="검토 내용을 확인하십시오." footer={<><Btn p={false} onClick={close}>취소</Btn><Btn onClick={close}>검토 저장</Btn></>}>{child}</Modal>,
};
export default function Fixture() { return <ComparisonMatrix adapters={a} />; }
