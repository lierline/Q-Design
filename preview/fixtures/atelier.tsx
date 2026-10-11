import { useState } from 'react';
import { Alert, Btn, Checkbox, DataTable, Drawer, EmptyState, Field, In, InfoDot, Modal, PageHd, ProgressBar, SectionTitle, Sel, Switch, Tag, Txt } from '@/lib/design/components';
import { ChoiceChip, SegmentedChoice } from '@/lib/design/segmented-choice';
import { ConfirmProvider, useConfirm } from '@/components/Confirm';
import { ToastProvider, useToast } from '@/components/Toast';
import { Skeleton } from '@/components/Skeleton';
import { ListPager } from '@/components/ListPager';
import { ListToolbar } from '@/components/ListToolbar';
import { QD } from '@/lib/design/q-design-contract';
import { RibbonBackground } from '@/components/RibbonBackground';
import { QDScale } from '@/lib/design/q-design-scale';

function ComponentGallery() {
  const [dialog, setDialog] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [name, setName] = useState('검증 계획');
  const [notes, setNotes] = useState('공통 디자인 규칙이 적용된 실제 아뜰리에 부품입니다.');
  const [choice, setChoice] = useState('draft');
  const [checked, setChecked] = useState(true);
  const [selected, setSelected] = useState(true);
  const [switchOn, setSwitchOn] = useState(false);
  const [confirmation, setConfirmation] = useState('아직 확인하지 않았습니다.');
  const { confirm } = useConfirm();
  const toast = useToast();
  const rows = [{ id: 'DOC-001', title: '설계 입력 검토', state: '검토 중' }, { id: 'DOC-002', title: '검증 계획', state: '작성 중' }];
  return (
    <main data-testid="atelier-fixture" style={{ maxWidth: 960, margin: '0 auto', padding: QD.space6, display: 'grid', gap: QD.space6, minWidth: 0 }}>
      <section data-testid="foundation-auth" className="qa-auth-page">
        <RibbonBackground intensity="full" />
        <div className="qa-auth-split">
          <aside className="qa-auth-brand">
            <div className="qa-auth-eyebrow">Q-Atelier</div>
            <div className="qa-auth-manifesto">
              <h2 data-testid="foundation-auth-title" className="qa-auth-headline">Quality,<br />documented for<br /><span className="qa-auth-headline-accent">regulation.</span></h2>
              <p className="qa-auth-subhead">Design, evidence and quality in one workspace.</p>
            </div>
            <div className="qa-auth-foot-mark">의료기기 품질의 모든 근거</div>
          </aside>
          <div className="qa-auth-form-wrap"><div className="qa-auth-form-inner">
            <div className="qa-auth-mobile-brand">Q-Atelier</div>
            <div className="qa-auth-desktop-brand"><div className="qa-auth-desktop-brand-title">Q-Atelier</div></div>
            <div className="qa-auth-card" data-testid="foundation-auth-card">
              <h3 style={{ fontSize: QDScale.font[18], margin: `0 0 ${QDScale.space[4]}` }}>로그인</h3>
              <div style={{ display: 'grid', gap: QDScale.space[4] }}>
                <Field id="fixture-auth-email" label="이메일"><In id="fixture-auth-email" data-testid="foundation-auth-input" placeholder="name@example.com" /></Field>
                <Field id="fixture-auth-password" label="비밀번호"><In id="fixture-auth-password" type="password" placeholder="비밀번호" /></Field>
                <Btn>로그인</Btn>
              </div>
            </div>
          </div></div>
        </div>
      </section>
      <PageHd title="아뜰리에 디자인 검증" sub="Q-Design 공통 규칙" />
      <section style={{ display: 'grid', gap: QD.space4 }}>
        <SectionTitle>입력과 선택</SectionTitle>
        <Field id="fixture-name" label="문서 이름" required><In id="fixture-name" value={name} onChange={e => setName(e.target.value)} /></Field>
        <Field id="fixture-error" label="문서 코드" error="문서 코드를 입력해 주세요."><In id="fixture-error" value="" onChange={() => undefined} placeholder="예: DOC-003" /></Field>
        <Field id="fixture-state" label="진행 상태"><Sel id="fixture-state" value={choice} onChange={e => setChoice(e.target.value)} opts={[{ v: 'draft', l: '작성 중' }, { v: 'review', l: '검토 중' }]} /></Field>
        <Field id="fixture-notes" label="설명"><Txt id="fixture-notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></Field>
        <div data-testid="disabled-controls" style={{ display: 'grid', gap: QD.space3 }}>
          <Field id="fixture-disabled-input" label="잠긴 문서 이름"><In id="fixture-disabled-input" disabled value="검토를 마친 문서" /></Field>
          <Field id="fixture-disabled-select" label="잠긴 진행 상태"><Sel id="fixture-disabled-select" disabled value="review" onChange={() => undefined} opts={[{ v: 'review', l: '검토 완료' }]} /></Field>
          <Field id="fixture-disabled-textarea" label="잠긴 검토 의견"><Txt id="fixture-disabled-textarea" disabled value="검토를 완료했습니다." onChange={() => undefined} rows={2} /></Field>
        </div>
        <SegmentedChoice ariaLabel="표시할 문서" value={choice} onChange={setChoice} options={[{ value: 'draft', label: '작성 중' }, { value: 'review', label: '검토 중' }]} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: QD.space3 }}>
          <ChoiceChip on={selected} onClick={() => setSelected(!selected)}>내 문서</ChoiceChip>
          <Checkbox checked={checked} onChange={setChecked}>검토 알림 받기</Checkbox>
          <Switch checked={switchOn} onChange={setSwitchOn} ariaLabel="자동 검토 알림" />
          <Tag>검토 중</Tag>
          <span data-testid="tooltip-host"><InfoDot label="문서 상태 설명">작성 중인 문서는 검토를 요청하면 검토 중으로 바뀝니다.</InfoDot></span>
        </div>
      </section>
      <section style={{ display: 'grid', gap: QD.space4 }}>
        <SectionTitle>목록과 상태</SectionTitle>
        <div data-testid="list-toolbar"><ListToolbar basePath="/atelier/" q="검토" searchIn="문서 이름" page={2} total={250} totalAll={300} sorts={[{ key: 'newest', label: '최신순', col: 'created_at', asc: false }, { key: 'name', label: '이름순', col: 'name', asc: true }]} /></div>
        <DataTable ariaLabel="검토 문서" rows={rows} getRowKey={row => row.id} columns={[
          { key: 'id', header: '코드', width: '100px', render: row => row.id },
          { key: 'title', header: '문서', render: row => row.title },
          { key: 'state', header: '상태', width: '90px', render: row => <Tag>{row.state}</Tag> },
        ]} />
        <div data-testid="list-pager"><ListPager basePath="/atelier/" page={2} total={250} params={{ q: '검토' }} /></div>
        <Alert kind="info" title="검토 안내">문서를 검토한 뒤 다음 단계로 진행할 수 있습니다.</Alert>
        <div aria-label="검토 진행률"><ProgressBar value={60} /></div>
        <Skeleton height={16} width="65%" />
        <EmptyState compact title="추가 문서가 없습니다" description="문서를 추가하면 이곳에 표시됩니다." action={<Btn p={false}>문서 추가</Btn>} />
      </section>
      <section style={{ display: 'grid', gap: QD.space4 }}>
        <SectionTitle>대화상자와 알림</SectionTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: QD.space2 }}>
          <span data-testid="open-dialog"><Btn onClick={() => setDialog(true)}>문서 검토</Btn></span>
          <span data-testid="open-drawer"><Btn p={false} onClick={() => setDrawer(true)}>상세 정보</Btn></span>
          <span data-testid="open-confirm"><Btn p={false} onClick={async () => setConfirmation(await confirm({ title: '검토를 완료할까요?', message: '검토 결과를 확인합니다.', confirmLabel: '검토 완료' }) ? '확인했습니다.' : '취소했습니다.')}>완료 확인</Btn></span>
          <span data-testid="show-toast"><Btn p={false} onClick={() => toast.success('변경 사항을 저장했습니다.', { title: '저장 완료', ttlMs: 15000 })}>저장 알림</Btn></span>
        </div>
        <p data-testid="confirmation-result" style={{ margin: 0 }}>{confirmation}</p>
      </section>
      <Modal open={dialog} onClose={() => setDialog(false)} title="문서 검토" sub="검토 결과를 확인하고 저장해 주세요." footer={<><Btn p={false} onClick={() => setDialog(false)}>취소</Btn><Btn onClick={() => setDialog(false)}>검토 저장</Btn></>}>
        <Field id="fixture-dialog-note" label="검토 의견"><Txt id="fixture-dialog-note" value={notes} onChange={e => setNotes(e.target.value)} rows={3} /></Field>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: QD.space2, marginTop: QD.space4 }}>
          <span data-testid="open-nested-drawer"><Btn p={false} onClick={() => setDrawer(true)}>상세 정보 확인</Btn></span>
          <span data-testid="open-nested-confirm"><Btn p={false} onClick={async () => setConfirmation(await confirm({ title: '검토 결과를 확인할까요?', message: '확인창을 닫아도 문서 검토창은 열린 상태로 남습니다.', confirmLabel: '결과 확인' }) ? '확인했습니다.' : '취소했습니다.')}>검토 결과 확인</Btn></span>
        </div>
        <div hidden><Btn>숨겨진 동작</Btn></div>
      </Modal>
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="문서 상세 정보" sub="DOC-001" footer={<Btn onClick={() => setDrawer(false)}>확인</Btn>}>
        <div style={{ padding: QD.overlayPadding, display: 'grid', gap: QD.space4 }}><Tag>검토 중</Tag><p style={{ margin: 0 }}>{name}</p><Field id="fixture-drawer-note" label="메모"><In id="fixture-drawer-note" value={notes} onChange={e => setNotes(e.target.value)} /></Field></div>
      </Drawer>
    </main>
  );
}

export default function Fixture() {
  return <ConfirmProvider><ToastProvider><ComponentGallery /></ToastProvider></ConfirmProvider>;
}
