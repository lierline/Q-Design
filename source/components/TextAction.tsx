'use client';

// =============================================================================
// TextAction: 보조 동작(닫기 · 되돌리기 · 더 보기)을 «글귀» 로 그린다
// =============================================================================
// 오너 취향(2026-09-14): 보조 동작은 상자 단추가 아니라 글귀만. 상자 단추는 주 동작(저장 · 승인)에만
// 두어야 무게가 갈린다. BackButton(「← 뒤로」)과 같은 모양이다: 흐린 색 → 올리면 진한 색,
// 높이 36px(터치 기기에서는 globals.css 규칙이 44px 로 끌어올린다).
//
// TextLinkAction 은 같은 모양의 «링크» 다(화면 검토 A11 · A63 · 2026-09-27). 양식 바닥의 «취소» 가
// `<Link><Btn p={false}>취소</Btn></Link>` 상자로 여러 화면에 있었다. 가는 곳이 주소면 이것을 쓴다.
// 안내 문구 · 구역 머리 옆에 홀로 선 이동 글귀는 go 를 붙인다(먹색 · 굵기 600 · 끝 꺾쇠, 2026-10-27 오너 결정 «F»).

import { QDText } from '@/lib/design/q-design-labels';
import { QDScale } from '@/lib/design/q-design-scale';
import { QDPresentation } from '@/lib/design/q-design-runtime';
import { ChevronRight } from '@/components/q-design-icons/ChevronRight';
import { useState, type ReactNode, type Ref } from 'react';
import Link from 'next/link';
import { F, S, T } from '@/lib/design/tokens';
import { QD } from '@/lib/design/q-design-contract';

export function TextAction({
  children,
  onClick,
  disabled,
  title,
  danger,
  expanded,
  hasPopup,
  label,
  ref,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** 올리면 보이는 설명(잠긴 이유 등) */
  title?: string;
  /** 누르면 메뉴 · 창이 열리는 글귀(낭독기에 aria-haspopup 으로 알린다) */
  hasPopup?: 'menu' | 'dialog';
  /** 메뉴 자리를 잡거나 초점을 되돌릴 때 글귀 상자가 필요하면(React 19: ref 는 보통 prop) */
  ref?: Ref<HTMLButtonElement>;
  /**
   * 되돌릴 수 없는 동작(삭제 등): 빨간 글귀. 테두리 · 바탕은 없고 올리면 밑줄이 선다
   * (빨간 테 상자 단추를 걷었다 · 화면 검토 A11 · 2026-09-28)
   */
  danger?: boolean;
  /** 접고 펴는 단추면 지금 펼쳐져 있는가(낭독기에 aria-expanded 로 알린다) */
  expanded?: boolean;
  /**
   * 낭독기가 읽을 이름. 같은 글귀(「내려받기」 「미리 보기」)가 한 화면에 수십 줄 반복되면 낭독기 목록에서
   * 단추를 구별할 수 없다. 대상까지 적어 준다(예: 「품질매뉴얼 내려받기」). 보이는 글귀가 앞에 와야 한다
   * (음성 조종이 «내려받기» 라고 말해도 이어지게).
   */
  label?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={label}
      aria-expanded={expanded}
      aria-haspopup={hasPopup}
      // 터치 화면에서는 높이 44(globals.css). 테두리 · 바탕이 없는 글자라 모양은 그대로다
      className="qa-touch-44 qd-text-action"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: 'none',
        padding: `0 ${QDScale.space[1]}`,
        minHeight: QD.controlHeightSm,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: QDScale.family.ui,
        fontSize: QD.controlSize,
        color: danger ? T.red : hover && !disabled ? T.text : T.muted,
        textDecoration: danger && hover && !disabled ? QDText.textDecoration.v9c3ff05cab : QDText.textDecoration.v30a0924a33,
        textUnderlineOffset: 'var(--qd-atelier-hub-link-underline-offset)',
        opacity: danger && disabled ? "var(--qd-atelier-opacity-520d3a5350)" : "var(--qd-atelier-opacity-dc43f5a623)",
        transition: `color ${QD.motionFast}`,
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      {children}
    </button>
  );
}

export function TextLinkAction({
  children,
  href,
  target,
  onClick,
  label,
  go,
}: {
  children: ReactNode;
  href: string;
  /** 새 창으로 여는 내려받기 등 */
  target?: '_blank';
  /** 누르면 함께 할 일(폰 서랍을 닫는 등). 이동은 href 가 한다 */
  onClick?: () => void;
  /**
   * 낭독기가 읽을 이름. 줄마다 같은 글귀(「보기」 「조치」)가 되풀이되는 목록에서 대상까지 적는다
   * (TextAction 의 label 과 같은 뜻 · 보이는 글귀가 앞에 오게 · 2026-10-20 대시보드 A)
   */
  label?: string;
  /**
   * 이동 글귀: 안내 문구 · 구역 머리 옆에 홀로 서서 다른 화면으로 가는 글귀(「변경평가 목록으로」 「전체 보기」 「N건 더」).
   * 흐린 글귀는 옆 설명 문장과 구별되지 않았다(2026-10-27 오너 지적). 색 · 굵기 · 올렸을 때 밑줄은 정본
   * `.qd-text-action--go` 가 쥐고, 여기서는 끝 꺾쇠만 붙인다. 줄마다 되풀이되는 열기 · 보기와 취소 · 뒤로에는 쓰지 않는다.
   */
  go?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const style = {
    padding: `0 ${QDScale.space[1]}`,
    minHeight: QD.controlHeightSm,
    fontFamily: QDScale.family.ui,
    fontSize: QD.controlSize,
    ...(go ? {} : { color: hover ? T.text : T.muted, textDecoration: 'none' }),
    transition: `color ${QD.motionFast}`,
    display: 'inline-flex',
    alignItems: 'center',
  } as const;
  const className = go ? 'qa-touch-44 qd-text-action qd-text-action--go' : 'qa-touch-44 qd-text-action';
  const body = go ? <>{children}<ChevronRight size={QDPresentation.iconSize[14]} aria-hidden /></> : children;
  /*
   * 내려받기 같은 API 주소(/api/…)는 next/link 로 걸면 화면에 보일 때 미리 불러오기(prefetch)가
   * 그 주소를 부른다(문서를 만들어 버린다). API 주소는 보통 <a> 로 건다.
   * 전자우편(mailto:)도 화면 이동이 아니라 보통 <a> 다 (화면 검토 A39 · 2026-09-27).
   */
  if (href.startsWith('/api/') || href.startsWith('mailto:')) {
    return (
      <a
        href={href}
        target={target}
        rel={target ? 'noopener' : undefined}
        aria-label={label}
        className={className}
        onClick={onClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={style}
      >
        {body}
      </a>
    );
  }
  return (
    <Link
      href={href}
      target={target}
      rel={target ? 'noopener' : undefined}
      aria-label={label}
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={style}
    >
      {body}
    </Link>
  );
}
