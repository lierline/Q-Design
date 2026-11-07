import { useState } from 'react';
import Toasts from '@/components/toast';
import { Dialog } from '@/components/dialog';
import { Empty, Msg, Panel, Progress, Tag, Warnings, Caution, Stat } from '@/components/ui';
import { Table, Th, Td } from '@/components/table';
import InfoTip from '@/components/info-tip';
import StatDetail from '@/components/stat-detail';
import NumPad, { PresetPicker } from '@/components/num-pad';
import AdminChrome from '@/app/(admin)/chrome';
import { StatStrip } from '@/components/shell';
import Ribbon from '@/components/ribbon';
import Watermark from '@/components/watermark';

export default function Fixture() {
  const [open, setOpen] = useState(false);
  const [toastState, setToastState] = useState<{ error: string } | undefined>();
  return (
    <AdminChrome
      groups={[{ label: '운영', items: [{ href: '/', label: '생산 기록', icon: 'production' }, { href: '/settings', label: '설정', icon: 'settings' }] }]}
      brand={<div className="p-5 font-semibold">Q-Carnet</div>}
      find={<button className="qd-text-action" type="button">개체 번호 찾기</button>}
      aside={<p className="p-4 text-xs text-muted">품질 관리</p>}
      foot={<div className="p-4 text-xs text-muted">공통 컴포넌트 검토</div>}
    >
    <div className="space-y-6">
      <Toasts states={[toastState]} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className="qd-text-action" data-testid="show-toast-korean" onClick={() => setToastState({ error: '새 버전이 준비되었습니다. 새로고침하면 적용됩니다.' })}>한국어 알림 줄바꿈</button>
        <button type="button" className="qd-text-action" data-testid="show-toast-identifier" onClick={() => setToastState({ error: 'QD_COPY_WRAPPING_IDENTIFIER_ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789_ABCDEFGHIJKLMNOPQRSTUVWXYZ_0123456789' })}>긴 식별자 알림</button>
      </div>
      <section className="carnet-auth" data-testid="foundation-auth">
        <Ribbon intensity="full" />
        <aside className="login-brand">
          <div className="login-eyebrow">Q-Carnet</div>
          <div className="relative flex flex-1 flex-col justify-center">
            <h2 className="login-headline" data-testid="foundation-auth-title">Every lot,<br />recorded as<br /><span className="login-headline-accent">made.</span></h2>
            <p className="login-subhead">Device history records, on paper and on screen.</p>
          </div>
          <div className="login-tagline">제조 이력을 한곳에</div>
        </aside>
        <div className="login-form-wrap"><div className="carnet-auth-form relative z-[1]">
          <h3 className="mb-6 text-lg font-semibold">Q-Carnet</h3>
          <div className="login-card" data-testid="foundation-auth-card">
            <label className="login-field-label" htmlFor="foundation-account">사번</label>
            <input id="foundation-account" className="login-field" data-testid="foundation-auth-input" placeholder="사번 입력" />
            <button type="button" className="login-submit mt-4">로그인</button>
          </div>
        </div></div>
        <Watermark text="검토 계정 001 · 2026-10-10 12:00" />
      </section>
      <header className="qd-page-head">
        <div className="qd-page-head-row">
          <div className="qd-page-head-text"><h1 className="qd-page-head-title">생산 기록</h1></div>
          <div className="qd-page-head-actions">
            <button type="button" className="qd-btn qd-btn--primary" data-testid="open-dialog" onClick={() => setOpen(true)}>기록 검토</button>
          </div>
        </div>
      </header>

      <StatStrip items={[{ label: '발행된 기록', value: 12, unit: '건', href: '#records', detail: '최근 발행된 기록 12건입니다.', hint: '정정 이력 포함' }, { label: '검토 대기', value: 3, unit: '건', detail: '서면 대조가 필요한 기록 3건입니다.' }]} />

      {/* 머리말 단계: 쪽 제목(h1) 다음에 판 제목(h3)이 바로 오면 한 단계를 건너뛴다(2026-11-04 감사 38번). 묶음 이름(h2)을 먼저 둔다 */}
      <h2 className="qd-section-title">공용 부품</h2>
      <Panel title="입력과 선택" bodyClassName="p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="qd-field-label" data-hangul="">로트번호</span><input className="qd-input" placeholder="로트번호 입력" aria-label="로트번호" /></label>
          <label><span className="qd-field-label" data-hangul="">잠긴 기록</span><input className="qd-input" disabled value="P2608-0004" readOnly /></label>
          <label><span className="qd-field-label" data-hangul="">처리 상태</span><select className="qd-input" aria-label="처리 상태"><option>검토 중</option><option>발행됨</option></select></label>
          <label><span className="qd-field-label" data-hangul="">메모</span><textarea className="qd-input" placeholder="검토 내용을 입력하십시오" aria-label="메모" /></label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button className="qd-btn qd-btn--secondary" type="button">목록 보기</button>
          <button className="qd-btn qd-btn--primary" disabled type="button">저장</button>
          <label className="qd-choice-hit"><input className="qd-checkbox" type="checkbox" /> 기록 확인</label>
          <InfoTip label="로트 정보">로트번호는 작업 지시 발행 시 채번 규칙에 따라 부여됩니다. 등록된 기록은 정정 이력과 함께 보관됩니다.</InfoTip>
          <Tag tone="ok">발행됨</Tag><Tag tone="warn">검토 중</Tag><Tag tone="danger">확인 필요</Tag>
        </div>
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2">
        <Panel title="안내와 진행" bodyClassName="p-4 space-y-3">
          <Msg state={{ error: '입력한 로트번호를 확인하십시오.' }} />
          <Msg state={{ ok: true, message: '검토 내용이 저장되었습니다.' }} />
          <Warnings items={[{ kind: '유효기간', detail: '입고 자재의 사용 기한을 확인하십시오.' }]} />
          <Caution>발행한 기록의 수정은 정정 사유를 남겨야 합니다.</Caution>
          <Progress done={3} total={5} width="10rem" />
        </Panel>
        <Panel title="지표와 빈 상태" bodyClassName="p-4 space-y-3">
          <div className="relative"><Stat label="진행 중 공정" value={3} unit="건" /><StatDetail title="진행 중 공정">절단 1건, 포장 2건</StatDetail></div>
          <Empty compact hint="새 작업 지시를 발행하면 이곳에 표시됩니다.">등록된 작업이 없습니다.</Empty>
          <div className="qd-skeleton h-4 w-40" aria-label="불러오는 중" />
        </Panel>
      </div>

      <Panel title="기록 목록">
        <Table><thead><tr><Th>로트번호</Th><Th>상태</Th><Th right>수량</Th></tr></thead><tbody><tr><Td mono>P2608-0004</Td><Td><Tag tone="ok">발행됨</Tag></Td><Td right>1,200</Td></tr></tbody></Table>
      </Panel>

      <Panel title="현장 조작" bodyClassName="touch p-4">
        <div className="grid gap-6 sm:grid-cols-2">
          <NumPad name="quantity" label="처리 수량" max={100} />
          <PresetPicker name="reason" label="정정 사유" presets={['수량 확인', '입력 정정']} />
        </div>
      </Panel>

      <Dialog open={open} onClose={() => setOpen(false)} title="기록 검토" note="검토 내용을 확인한 뒤 저장하십시오.">
        <form onSubmit={(event) => { event.preventDefault(); setOpen(false); }}>
          <label><span className="qd-field-label" data-hangul="">검토 메모</span><input className="qd-input" aria-label="검토 메모" /></label>
          <div className="qd-dialog-actions mt-4">
            <button type="button" className="qd-text-action" onClick={() => setOpen(false)}>취소</button>
            <button type="submit" className="qd-btn qd-btn--primary">검토 저장</button>
          </div>
        </form>
      </Dialog>
    </div>
    </AdminChrome>
  );
}
