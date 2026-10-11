'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { FormState } from '@/lib/forms';
import { activateModal } from '@/lib/modal-focus';

/* ---------------------------------------------------------------------------
   정정 팝업

   기록을 고치는 칸은 팝업으로 띄우고, 고쳐지면 스스로 닫는다 (사용자 지시).

   ── 왜 인라인이 아닌가 ────────────────────────────────────────────────────
   줄 아래로 펼치면 뒤의 목록이 통째로 밀려 내려가 방금 보던 자리를 잃는다.
   현장 화면은 숫자판과 사유 타일이 붙어 있어 펼친 높이가 화면을 넘기도 한다.
   고치는 동안은 고칠 것 하나만 보이는 편이 낫다.

   ── 왜 스스로 닫는가 ──────────────────────────────────────────────────────
   열린 채로 두면 방금 고친 값이 그대로 남아 한 번 더 누르기 쉽다. 정정을 두 번
   하면 재고가 두 번 움직인다. 닫아 두면 다시 열어야 하고, 그때는 줄에 새 값이
   이미 적혀 있어 무슨 일이 있었는지 보인다.

   실패했을 때는 닫지 않는다. 무엇이 잘못됐는지 읽고 고쳐 다시 낼 자리가
   있어야 한다.
--------------------------------------------------------------------------- */

export function useDialog(...states: FormState[]) {
  const [open, setOpen] = useState(false);
  const ok = states.some((s) => s.ok);

  useEffect(() => { if (ok) setOpen(false); }, [ok]);

  return { open, setOpen };
}

export function Dialog({
  open, onClose, title, note, children, wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  note?: React.ReactNode;
  children: React.ReactNode;
  /** 숫자판처럼 넓은 것이 들어갈 때 */
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  const titleId = useId();
  const noteId = useId();
  useEffect(() => { setMounted(true); }, []);

  /*
   * 팝업이 떠 있는 동안 뒤 화면이 따라 구르지 않게 한다. 현장에서 손가락으로
   * 밀면 팝업 대신 뒤가 움직여 어디를 보고 있는지 잃는다.
   */
  useEffect(() => {
    if (!open || !mounted || !dialog.current) return;
    return activateModal(dialog.current, () => close.current());
  }, [open, mounted]);

  /*
   * 본문 밖(body)에 그린다.
   *
   * 처음에는 부른 자리에 그대로 그렸는데, 인쇄 이력의 회수 단추가 표의 sticky
   * 칸 안에 있어서 팝업이 머리글 아래로 깔렸다 (사용자 확인). 표 · sticky ·
   * overflow 안에서 부르면 어디서 어떻게 가려질지 부르는 쪽이 알 수 없다.
   * body 로 옮기면 부르는 자리와 무관하게 늘 맨 위에 뜬다.
   *
   * 서버에서는 document 가 없으므로 붙은 뒤에만 그린다.
   */
  if (!open || !mounted) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="qd-dialog-backdrop fixed inset-0 z-[var(--qd-z-overlay)] flex items-start justify-center overflow-y-auto p-[var(--qd-space-4)]"
    >
      {/*
        * 짧으면 화면 가운데, 길면 위에서부터 흐른다. items-center 만 주면 긴
        * 팝업의 위쪽이 화면 밖으로 잘려 닫기 단추에 닿지 못한다.
        */}
        <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId}
             aria-describedby={note ? noteId : undefined} tabIndex={-1} data-layout="sections"
             className={`qd-dialog-content my-auto${wide ? ' qd-dialog-content--wide' : ''}`}>
          <header className="qd-dialog-header">
            <div className="min-w-0">
              <h2 id={titleId} className="qd-dialog-title">{title}</h2>
              {note && <p id={noteId} className="qd-dialog-description mt-1">{note}</p>}
            </div>
            {/* 머리의 닫기는 보조 동작이라 상자가 아니라 글귀다 (화면 검토 C26 · 2026-09-27).
                주 단추만 상자로 선다 */}
            <button type="button" onClick={onClose} className="qd-dialog-close ml-auto">
              닫기
            </button>
          </header>
          <div className="qd-dialog-body">{children}</div>
        </div>
    </div>,
    document.body,
  );
}
