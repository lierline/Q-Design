'use client';

/*
 * 설치한 앱 창의 제목에 제품 이름이 두 번 나오지 않게 한다
 *
 * 크롬(엣지도 같은 코드)은 설치한 앱 창의 제목을 «앱 이름 - 페이지 제목» 으로 붙인다. 페이지 제목이
 * 앱 이름으로 «시작» 할 때만 그대로 둔다(Chromium web_app_browser_controller.cc 의 GetTitle). 앱 이름은
 * 매니페스트의 name 이고, name 이 없을 때만 short_name 이다(jobs/manifest_to_web_app_install_info_job.cc).
 * 우리 페이지 제목은 「대시보드 · Q-Maison」 처럼 제품 이름을 뒤에 달아서, 앱 창에는
 * 「Q-Maison - 대시보드 · Q-Maison」 이 떴다(오너 지적 2026-09-26).
 *
 * 앱 창에서만 제목 뒤의 제품 이름을 뗀다. 앞의 이름은 크롬이 붙인다. 브라우저 탭은 건드리지 않는다
 * (탭에서는 뒤의 제품 이름이 있어야 어느 제품의 탭인지 보인다). 제품 이름은
 * <meta name="application-name"> 에서 읽는다. 제목 틀(«%s · 제품 이름»)과 같은 값을 받는 자리라,
 * 회사 이름으로 바꿔 쓰는 Q-Carnet 에서도 맞는다.
 *
 * 제목을 제품 이름으로 «시작» 하게 바꾸지 않는 까닭: Q-Carnet 의 앱 이름은 한 줄 소개가 붙어
 * 「이름 · 소개」 로 길어질 수 있다. 그러면 제품 이름으로 시작해도 크롬이 앞에 또 붙인다. 떼기만 하면
 * 어느 제품에서나 맞다. 크롬의 앱 창 제목 전용 표시(<meta name="application-title">)는 아직 시험
 * 기능이라 쓰지 않는다(runtime_enabled_features.json5 의 AppTitle 이 experimental · 2026-09-26 확인).
 *
 * 쓰는 법: 루트 레이아웃에 한 번 둔다(로그인 화면도 앱 창에 뜬다).  <AppWindowTitle />
 */
import { useEffect } from 'react';

/* 페이지 제목과 제품 이름 사이의 이음표: 「 · 」 「: 」 「 | 」 「 - 」 */
const JOINT = String.raw`\s*[·:|-]\s*`;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 앱 창에 둘 제목. 뒤의 제품 이름을 떼고, 제품 이름뿐인 제목은 비운다(비우면 크롬이 앱 이름만 보인다).
 * 제품 이름으로 시작하는 제목(「Q-Atelier · 이용약관」)은 크롬이 그대로 두므로 건드리지 않는다.
 * 공백은 document.title 이 돌려주는 모양대로 한 칸으로 줄인다(안 줄이면 넣은 값과 읽은 값이 갈린다).
 */
export function appWindowTitle(title: string, product: string): string {
  const t = title.replace(/\s+/g, ' ').trim();
  if (!product) return t;
  if (t === product) return '';
  return t.replace(new RegExp(`${JOINT}${escapeRe(product)}$`), '');
}

export function AppWindowTitle() {
  useEffect(() => {
    const tab = window.matchMedia('(display-mode: browser)');
    /* 떼기 전 제목(브라우저 탭으로 돌아가면 되돌린다) · 우리가 넣은 제목 · 그때 읽은 제품 이름 */
    let original: string | null = null;
    let shown: string | null = null;
    let shownFor = '';
    let watch: MutationObserver | null = null;

    const product = () =>
      document.querySelector<HTMLMetaElement>('meta[name="application-name"]')?.content.trim() ?? '';

    function apply() {
      const now = document.title;
      const name = product();
      if (now === shown && name === shownFor) return;
      if (now !== shown) original = now; // 화면이 새 제목을 넣었다
      shown = appWindowTitle(original ?? now, name);
      shownFor = name;
      if (document.title !== shown) document.title = shown;
    }

    function sync() {
      if (!tab.matches) {
        apply();
        if (!watch) {
          /* 화면을 옮기면 Next 가 제목을 새로 넣는다. 제목 · 이름표가 <head> 밖에 서도 잡게 문서 전체를 본다.
             브라우저 탭에서는 붙이지 않으므로 탭의 비용은 없다 */
          watch = new MutationObserver(apply);
          watch.observe(document.documentElement, { subtree: true, childList: true, characterData: true });
        }
        return;
      }
      /* 앱 창에서 브라우저 탭으로 옮겨졌다(크롬의 «Chrome 에서 열기»). 뗀 제목을 되돌린다 */
      watch?.disconnect();
      watch = null;
      if (original !== null && document.title === shown) document.title = original;
      original = shown = null;
      shownFor = '';
    }

    sync();
    tab.addEventListener('change', sync);
    return () => {
      tab.removeEventListener('change', sync);
      watch?.disconnect();
    };
  }, []);

  return null;
}
