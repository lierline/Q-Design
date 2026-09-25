'use client';

/*
 * 인쇄는 늘 밝은 색으로 (오너 결정 2026-09-25)
 *
 * 다크 테마로 화면을 인쇄하면 브라우저가 바탕색을 빼므로 흰 종이에 상아색 글자만 남는다
 * (2026-09-25 인쇄 모드 실측: 세 제품 목록의 표 글자가 흰 종이 대비 1.19).
 * 원본은 인쇄에서 색 이름(--qa-*)을 종이 값으로 덮어 이 일이 없다(같은 실측 17.73).
 * 다른 제품들은 색 이름이 제각각이라 그 방법을 그대로 쓸 수 없다.
 *
 * 그래서 인쇄하는 동안만 테마 표시를 밝은 쪽으로 돌렸다가, 인쇄가 끝나면 되돌린다. 제품마다
 * 이미 가진 밝은 팔레트를 그대로 쓰므로 색 값을 다시 적지 않는다. 테마 표시는 두 가지를 본다.
 *   <html data-theme="dark">  원본과 같은 방식
 *   <html class="dark">       shadcn 식
 * 이 파일에는 제품 이름을 적지 않는다(제품마다 «이름은 한 곳에만» 계약이 있다). 어느 제품이 어느
 * 방식인지는 Q-Design tools/sync-parts.mjs 와 docs/20 에 있다.
 *
 * 브라우저 인쇄(Ctrl+P · 인쇄 단추)도, 크롬의 PDF 만들기도 인쇄 직전 · 직후에 알림을 보낸다
 * (2026-09-25 크롬 PDF 로 확인: 직전에 바꾼 테마로 찍히고, 끝나면 원래대로 돌아온다).
 *
 * except: 이 선택자에 맞는 요소가 있는 화면에서는 아무것도 하지 않는다. 종이 서식이 스스로
 * 밝은 팔레트를 쥐고 있는 화면(제조기록서의 .sheet 같은 것)을 건드리지 않기 위한 자리다.
 *
 * 쓰는 법: 앱 셸에 한 번 둔다.  <PrintLight />  ·  기록서 서식이 있으면 <PrintLight except=".sheet" />
 * Q-Design docs/20 「화면을 종이로」.
 */
import { useEffect } from 'react';

export function PrintLight({ except }: { except?: string }) {
  useEffect(() => {
    const html = document.documentElement;
    let restore: (() => void) | null = null;

    function toLight() {
      if (restore) return;
      if (except && document.querySelector(except)) return;
      const theme = html.getAttribute('data-theme');
      const darkClass = html.classList.contains('dark');
      const darkAttr = theme !== null && theme !== 'light';
      if (!darkClass && !darkAttr) return;
      const scheme = html.style.colorScheme;
      if (darkClass) html.classList.remove('dark');
      if (theme !== null && theme !== 'light') html.setAttribute('data-theme', 'light');
      html.style.colorScheme = 'light';
      restore = () => {
        if (darkClass) html.classList.add('dark');
        if (theme !== null && theme !== 'light') html.setAttribute('data-theme', theme);
        html.style.colorScheme = scheme;
      };
    }
    function back() {
      restore?.();
      restore = null;
    }

    window.addEventListener('beforeprint', toLight);
    window.addEventListener('afterprint', back);
    return () => {
      window.removeEventListener('beforeprint', toLight);
      window.removeEventListener('afterprint', back);
      back();
    };
  }, [except]);

  return null;
}
