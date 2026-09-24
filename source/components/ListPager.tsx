// =============================================================================
// ListPager: 목록 하단 페이지 이동
// =============================================================================
// 서버 컴포넌트에서 그대로 쓸 수 있도록 **Link 기반**(클라이언트 상태 없음).
// 페이지는 URL 의 `?page=` 하나로만 표현한다. 뒤로가기·새로고침·북마크가 그대로 동작하고,
// 「지금 몇 번째를 보고 있는가」가 주소창에 남는다.
//
// 배경: 2026-08-29 백로그 실사. 목록이 `.limit(200)` 으로 잘려 201번째부터
// **에러 없이** 사라지고 있었다. 페이지가 생기면 「더 있다」는 사실 자체가 화면에 보인다.
// 규칙과 계산은 lib/api/list-page.ts 가 SSOT.

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { S, FS, T, F, LH, RADIUS, ICON } from '@/lib/design/tokens';
import { pageCount, pageWindow, PAGE_SIZE } from '@/lib/api/list-page';

interface ListPagerProps {
  /** 현재 페이지(1-base). clampPage 를 거친 값을 넘긴다. */
  page: number;
  /** DB 에서 센 총 건수. **가져온 배열 길이가 아니다.** */
  total: number;
  /** 현재 경로. 예: '/capa' */
  basePath: string;
  /** page 외에 유지할 쿼리(필터·탭 등). */
  params?: Record<string, string | undefined>;
  size?: number;
  /**
   * 목록의 «위» 인가 «아래» 인가.
   *
   * 아래(기본)는 목록을 닫는 줄이라 윗선과 여백을 갖는다. 위(`top`)는 도구줄의
   * 한 부분이라 그 둘을 빼고, 건수도 그리지 않는다 · 도구줄이 「검색 결과 N건」
   * 처럼 «좁힌 것을 아는» 글로 이미 말하고 있어서 두 번 적으면 갈린다.
   *
   * 🔴 2026-09-09 감사(주제 #11). pager 가 아래에만 있어 2페이지로 가려면 카드
   *    100장(약 8,200px)을 지나야 했다.
   */
  place?: 'top' | 'bottom';
}

function hrefFor(basePath: string, page: number, params?: ListPagerProps['params']) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) {
    if (v !== undefined && v !== '' && k !== 'page') qs.set(k, v);
  }
  if (page > 1) qs.set('page', String(page));
  const q = qs.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function ListPager({
  page,
  total,
  basePath,
  params,
  size = PAGE_SIZE,
  place = 'bottom',
}: ListPagerProps) {
  const 위 = place === 'top';
  const last = pageCount(total, size);
  const win = pageWindow(page, total, size);

  // 한 페이지에 다 들어오면 이동 UI 는 군더더기다. 다만 **총건수는 늘 보여준다**:
  // 「내가 보는 것이 전부인가」에 답이 없으면 목록을 믿을 수 없다.
  const showNav = last > 1;

  const label: React.CSSProperties = {
    fontFamily: F.mono,
    fontSize: FS[11],
    color: T.muted,
    lineHeight: LH.none,
    letterSpacing: 0.4,
    fontVariantNumeric: 'tabular-nums',
  };

  const btn = (enabled: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: S[1],
    padding: '7px 12px',
    minHeight: 36,
    borderRadius: RADIUS.md,
    border: `1px solid ${T.border}`,
    background: 'transparent',
    color: enabled ? T.text : T.muted,
    fontFamily: F.ui,
    fontSize: FS[11],
    lineHeight: LH.none,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    textDecoration: 'none',
    opacity: enabled ? 1 : 0.4,
    pointerEvents: enabled ? 'auto' : 'none',
  });

  return (
    <nav
      aria-label="목록 페이지 이동"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: S[3],
        marginTop: 위 ? 0 : S[5],
        paddingTop: 위 ? 0 : S[4],
        borderTop: 위 ? undefined : `1px solid ${T.border}`,
        justifyContent: 위 ? 'flex-end' : 'space-between',
        flexWrap: 'wrap',
      }}
    >
      {!위 && (
        <span style={label}>
          {win ? `${win.first}-${win.last} / 총 ${total.toLocaleString('ko-KR')}건` : '0건'}
        </span>
      )}

      {showNav && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: S[2] }}>
          <Link
            href={hrefFor(basePath, page - 1, params)}
            style={btn(page > 1)}
            aria-disabled={page <= 1}
            tabIndex={page <= 1 ? -1 : undefined}
          >
            <ChevronLeft size={ICON.sizeXs} strokeWidth={ICON.strokeWidth} aria-hidden />
            이전
          </Link>

          <span style={{ ...label, minWidth: 64, textAlign: 'center' }}>
            {page} / {last}
          </span>

          <Link
            href={hrefFor(basePath, page + 1, params)}
            style={btn(page < last)}
            aria-disabled={page >= last}
            tabIndex={page >= last ? -1 : undefined}
          >
            다음
            <ChevronRight size={ICON.sizeXs} strokeWidth={ICON.strokeWidth} aria-hidden />
          </Link>
        </span>
      )}
    </nav>
  );
}
