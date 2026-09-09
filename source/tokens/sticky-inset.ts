'use client';

// =============================================================================
// sticky-inset: 스크롤 컨테이너의 padding 을 감안한 sticky inset (ui-ux UI-01·UI-02)
// =============================================================================
// 🔴 2026-09-03 실측. `position: sticky` 의 inset(top·bottom)은 «뷰포트» 가 아니라
//    **스크롤 컨테이너의 내용 상자**를 기준으로 잡힙니다. 본문 `main.qa-main-content`
//    는 padding 을 가진 스크롤 컨테이너라, 그 안에서 `top: 0` 은 화면 맨 위가 아니라
//    「화면 위 + padding-top」 에 붙습니다.
//
//    그래서 상단 밴드는 음수 margin 으로 위로 끌어올린 만큼(32px) 다시 아래로
//    밀려 내려가 본문 첫 줄(뒤로가기 링크)을 통째로 덮었고, 현장 모드 저장 바는
//    화면 밑변에서 padding-bottom 만큼 떠서 그 틈으로 폼이 비쳤습니다.
//    실측: 밴드 {top 32, bottom 88} · 본문 첫 줄 {top 56} · 저장 바 {bottom 968}
//    (뷰포트 1600x1000, main padding 32px 40px).
//
// 🔑 값을 손으로 맞추면 «사본» 이 하나 더 생깁니다. main 의 padding 은 화면 폭에
//    따라 세 가지(데스크톱 32 · 패드 100+safe · 폰 128+safe, globals.css 가
//    !important 로 덮음)라, 컴포넌트가 그 숫자를 베끼면 어느 한 층에서 반드시
//    어긋납니다. 그래서 여기서는 **실제 스크롤 컨테이너의 padding 을 읽어** inset
//    을 계산합니다. 아래 stuckTop·stuckBottom 은 그 모델을 그대로 적은 것이고,
//    lib/design/sticky-inset.test.ts 가 세 가지 padding 모두에서 검사합니다.

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { MAIN_PADDING, type EdgePadding } from './main-padding';

export { MAIN_PADDING };
export type { EdgePadding };

/** sticky top inset: 컨테이너 padding-top 만큼 되돌려야 화면 맨 위에 붙습니다. */
export function stickyTopInset(hostPaddingTop: number): number {
  return -hostPaddingTop;
}

/**
 * sticky bottom inset. `reserve` 는 화면 밑변에서 «비워 둘» 높이(예: 모바일 하단 네비)
 * 이며 env() 가 섞일 수 있어 CSS 문자열로 돌려줍니다.
 */
export function stickyBottomInset(hostPaddingBottom: number, reserve: string = '0px'): string {
  return `calc(${reserve} - ${hostPaddingBottom}px)`;
}

/** 모델: 위 inset 으로 sticky 가 실제로 붙는 위(뷰포트 좌표). */
export function stuckTop(hostTop: number, hostPaddingTop: number, inset: number): number {
  return hostTop + hostPaddingTop + inset;
}

/** 모델: 위 inset 으로 sticky 가 실제로 붙는 아래(뷰포트 좌표). */
export function stuckBottom(hostBottom: number, hostPaddingBottom: number, inset: number): number {
  return hostBottom - hostPaddingBottom - inset;
}

/** 이 요소를 담고 있는 스크롤 컨테이너(가장 가까운 overflow-y: auto|scroll). */
export function findScrollHost(el: Element | null | undefined): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const overflowY = getComputedStyle(node).overflowY;
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return node;
    node = node.parentElement;
  }
  return null;
}

/** 계산된 padding 을 px 숫자로. env()·!important·미디어쿼리가 모두 반영된 뒤의 값입니다. */
export function readEdgePadding(el: Element | null | undefined): EdgePadding | null {
  if (!el) return null;
  const cs = getComputedStyle(el);
  return {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };
}

function samePadding(a: EdgePadding, b: EdgePadding): boolean {
  return a.top === b.top && a.right === b.right && a.bottom === b.bottom && a.left === b.left;
}

// SSR 에서는 useLayoutEffect 가 경고를 내므로 서버에서만 useEffect 로 바꿔 답니다.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * ref 요소를 담은 스크롤 컨테이너의 padding 을 실측합니다. 화면 폭이 바뀌면(패드↔폰↔
 * 데스크톱) 다시 잽니다. 첫 페인트는 데스크톱 기본값으로 그리고, 붙자마자 보정합니다.
 */
export function useScrollHostPadding(
  ref: RefObject<HTMLElement | null>,
  fallback: EdgePadding = MAIN_PADDING,
): EdgePadding {
  const [pad, setPad] = useState<EdgePadding>(fallback);
  const padRef = useRef(pad);
  padRef.current = pad;

  useIsomorphicLayoutEffect(() => {
    const host = findScrollHost(ref.current);
    if (!host) return;
    const sync = () => {
      const next = readEdgePadding(host);
      if (next && !samePadding(padRef.current, next)) setPad(next);
    };
    sync();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(sync);
    ro?.observe(host);
    window.addEventListener('resize', sync);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', sync);
    };
  }, [ref]);

  return pad;
}
