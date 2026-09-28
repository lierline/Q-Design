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

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { F, FS, S, T } from '@/lib/design/tokens';

export function TextAction({
  children,
  onClick,
  disabled,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  /** 올리면 보이는 설명(잠긴 이유 등) */
  title?: string;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      // 터치 화면에서는 높이 44(globals.css). 테두리 · 바탕이 없는 글자라 모양은 그대로다
      className="qa-touch-44"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: 'none',
        padding: `0 ${S[1]}px`,
        minHeight: 36,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: F.ui,
        fontSize: FS[14],
        color: hover && !disabled ? T.text : T.muted,
        transition: 'color 150ms ease',
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
}: {
  children: ReactNode;
  href: string;
  /** 새 창으로 여는 내려받기 등 */
  target?: '_blank';
}) {
  const [hover, setHover] = useState(false);
  const style = {
    padding: `0 ${S[1]}px`,
    minHeight: 36,
    fontFamily: F.ui,
    fontSize: FS[14],
    color: hover ? T.text : T.muted,
    textDecoration: 'none',
    transition: 'color 150ms ease',
    display: 'inline-flex',
    alignItems: 'center',
  } as const;
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
        className="qa-touch-44"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={style}
      >
        {children}
      </a>
    );
  }
  return (
    <Link
      href={href}
      target={target}
      rel={target ? 'noopener' : undefined}
      className="qa-touch-44"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={style}
    >
      {children}
    </Link>
  );
}
