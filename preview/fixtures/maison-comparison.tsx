import React from 'react';
import { Button } from '@/components/ui/button';
import { QuoteItemsTable, emptyQuoteItem } from '@/app/(app)/purchasing/quote-items-table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { TabButton } from '@/components/shared/view-tabs';
import { AttendeePicker } from '@/components/shared/attendee-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import ComparisonMatrix, { type ComparisonAdapters } from './comparison-matrix';
export const a: ComparisonAdapters = {
  itemRows: () => <><QuoteItemsTable rows={[emptyQuoteItem()]} onChange={() => {}} /><QuoteItemsTable rows={[emptyQuoteItem()]} onChange={() => {}} withRemark /></>,
  secondaryIcon: () => <Button variant="outline" className="qd-control-icon" aria-label="아이콘 보조 동작"><svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" /></svg></Button>,
  button: (text, options = {}) => <Button variant={options.secondary ? 'outline' : 'default'} disabled={options.disabled} onClick={options.onClick}>{text}</Button>,
  field: (_id, label, child, error) => <Field label={label} required error={error}>{child}</Field>,
  input: ({ id: _id, ...props }) => <Input {...props} />,
  select: ({ id: _id, ...props }) => <Select {...props}><option value="draft">작성 중</option><option value="review">검토 중</option></Select>,
  textarea: ({ id: _id, ...props }) => <Textarea {...props} rows={3} />,
  tag: text => <Badge>{text}</Badge>,
  card: child => <Card><CardContent>{child}</CardContent></Card>,
  table: () => <div className="qd-table-scroll"><table className="qd-table"><thead><tr><th>문서</th><th>상태</th></tr></thead><tbody><tr><td>검증 계획</td><td><Badge>검토 중</Badge></td></tr></tbody></table></div>,
  progress: () => <div className="qd-progress" role="progressbar" aria-label="검토 진행률" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100}><span className="qd-progress-fill" style={{ width: '100%', transform: 'scaleX(0.6)' }} /></div>,
  empty: compact => <EmptyState compact={compact} title="등록된 문서가 없습니다" description="문서를 등록하면 이곳에 표시됩니다." />,
  emptyAction: description => <EmptyState title="등록된 문서가 없습니다" description={description ? '문서를 등록하면 이곳에 표시됩니다.' : undefined} action={<Button>문서 등록</Button>} />,
  tabs: () => <div className="qd-tabs"><TabButton active onClick={()=>{}} label="검토 중"/><TabButton active={false} onClick={()=>{}} label="검토 완료"/></div>,
  choice: selected => <button type="button" className={`qd-choice${selected?' qd-choice--selected':''}`} aria-pressed={selected}>문서 선택</button>,
  skeleton: () => <div className="qd-skeleton" aria-hidden style={{height:16,width:'100%'}} />,
  selectionRows: () => <AttendeePicker value={['selected']} onChange={()=>{}} title="심사원" options={[{id:'selected',name:'선택된 검수 사용자'},{id:'available',name:'검수 사용자',hint:'품질보증부'}]} />,
  dialog: (open, close, child) => <Dialog open={open} onOpenChange={value => { if (!value) close(); }}><DialogContent><DialogHeader><DialogTitle>문서 검토</DialogTitle><DialogDescription>검토 내용을 확인하십시오.</DialogDescription></DialogHeader>{child}<DialogFooter><Button variant="outline" onClick={close}>취소</Button><Button onClick={close}>검토 저장</Button></DialogFooter></DialogContent></Dialog>,
};
export default function Fixture() { return <ComparisonMatrix adapters={a} />; }
