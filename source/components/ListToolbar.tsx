'use client';

// =============================================================================
// ListToolbar: 목록 «위» 의 도구줄 (2026-09-09 감사 · 주제 #11)
// =============================================================================
// ListPager 를 쓰는 목록 21곳 중 19곳이 `page` 하나만 받았다. 검색도 필터도 정렬도
// 없어서 100건을 지나 2페이지로 가려면 카드 100장(72px 카드 + 10px 간격 = 약
// 8,200px)을 지나야 했다. 「좁힐 방법이 없다」가 아니라 **좁힐 자리가 화면에 없었다.**
//
// 🔑 GET form 이다. `<form method="get">` 이라 JS 없이도 돌고, 뒤로가기·새로고침·
//    북마크가 그대로 산다. 지금 무엇으로 좁혀 놓았는지가 주소창에 남는다 ·
//    ListPager 와 같은 규칙이다.
//
// 🔑 판정과 계산은 lib/api/list-page.ts 가 SSOT 다. 여기서 다시 적지 않는다.
//    sticky inset 도 lib/design/sticky-inset.ts 와 TopHeaderBand 에서 읽는다 ·
//    두 값(밴드 높이 56 · 컨테이너 padding)을 베끼면 어느 한 층에서 반드시 어긋난다.

import { useRef } from 'react';
import { Search } from 'lucide-react';
import { ListPager } from '@/components/ListPager';
import { TOP_BAND_HEIGHT } from '@/components/TopHeaderBand';
import { PAGE_SIZE, pageWindow, type SortOption } from '@/lib/api/list-page';
import { useBreakpoints } from '@/lib/hooks/useBreakpoints';
import { stickyTopInset, useScrollHostPadding } from '@/lib/design/sticky-inset';
import { F, FS, LH, RADIUS, S, T, Z, labelTracking, labelCase } from '@/lib/design/tokens';

/*
 * 찾기 단추의 글. 네 제품이 「찾기」 · 「검색」 · 「조회하기」 로 갈려 있던 것을 오너가
 * 「검색」 으로 통일했다(2026-09-25 · Q-Design 감사 22). 찾기 칸 안내(「… 검색」)와도 같은 말이다.
 */
const 검색글 = '검색';

interface ListToolbarProps {
  /** 현재 경로. 예: '/capa' */
  basePath: string;
  /** 지금 걸린 검색어(parseQuery 를 거친 값). */
  q: string;
  /** 검색이 훑는 것을 사람 말로. 예: '코드·제목'. 이름표와 도움말에 함께 쓴다. */
  searchIn: string;
  /** 현재 페이지(clampPage 를 거친 값). */
  page: number;
  /** 지금 시야의 총 건수. **가져온 배열 길이가 아니다.** */
  total: number;
  /** 검색을 걸지 «않았을 때» 의 총 건수. 주면 「전체 N건 중」을 함께 적는다. */
  totalAll?: number;
  /** 정렬 갈래. 하나뿐이면 고르는 자리를 아예 그리지 않는다. */
  sorts?: readonly SortOption[];
  /** 지금 걸린 정렬(parseSort 를 거친 값). */
  sort?: SortOption;
  /** q·sort·page 밖에서 유지해야 하는 쿼리(탭·필터 등). */
  params?: Record<string, string | undefined>;
  size?: number;
}

export function ListToolbar({
  basePath,
  q,
  searchIn,
  page,
  total,
  totalAll,
  sorts,
  sort,
  params,
  size = PAGE_SIZE,
}: ListToolbarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pad = useScrollHostPadding(ref);
  const { isMobile } = useBreakpoints();

  const win = pageWindow(page, total, size);
  const 좁힘 = q.length > 0;
  const 셈 = !win
    ? 좁힘
      ? '찾은 것 없음'
      : '0건'
    : 좁힘 && totalAll !== undefined
      ? `검색 결과 ${total.toLocaleString('ko-KR')}건 · 전체 ${totalAll.toLocaleString('ko-KR')}건 중`
      : `${win.first}-${win.last} / 총 ${total.toLocaleString('ko-KR')}건`;

  /*
   * q 와 sort 는 이 폼이 직접 실어 보낸다. 나머지는 hidden 으로 함께 보낸다 ·
   * 안 그러면 검색 한 번에 탭·필터가 조용히 풀린다.
   *
   * page 는 «싣지 않는다». 검색어를 바꾸면 1페이지로 돌아가는 것이 맞다 ·
   * 3페이지를 보다 좁히면 있지도 않은 페이지로 간다.
   */
  const 함께보낼것 = Object.entries(params ?? {}).filter(
    ([k, v]) => v !== undefined && v !== '' && k !== 'q' && k !== 'sort' && k !== 'page',
  );

  /* 한글이 섞인 글(「검색 지우기」 · 「총 57건」)은 자간 0 (오너 규칙 「한글이면 자간 0」) */
  const 라벨 = (text: string): React.CSSProperties => ({
    fontFamily: F.mono,
    fontSize: FS[11],
    color: T.muted,
    lineHeight: LH.none,
    letterSpacing: labelTracking(text, 0.4),
    fontVariantNumeric: 'tabular-nums',
  });

  const 칸: React.CSSProperties = {
    height: 36,
    minWidth: 0,
    padding: `0 ${S[3]}px 0 32px`,
    borderRadius: RADIUS.md,
    border: `1px solid ${T.border}`,
    background: T.surface,
    color: T.text,
    fontFamily: F.ui,
    fontSize: FS[12],
  };

  return (
    <div
      ref={ref}
      /*
       * 인쇄에서는 되돌린다. 종이에는 스크롤이 없어서 sticky 가 첫 장에만 남고
       * 나머지 장에서는 자리만 차지한다. globals.css 의 @media print 가 본다.
       */
      className="qa-list-toolbar"
      style={{
        position: 'sticky',
        /* 밴드가 있는 데스크톱에서는 그 아래에 선다. 모바일에는 밴드가 없다. */
        top: stickyTopInset(pad.top) + (isMobile ? 0 : TOP_BAND_HEIGHT),
        /* 밴드(Z.header)보다 아래, 본문보다 위 */
        zIndex: Z.sticky,
        background: T.bg,
        paddingTop: S[2],
        paddingBottom: S[3],
        marginBottom: S[1],
      }}
    >
      <form
        method="get"
        action={basePath}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: S[2],
          flexWrap: 'wrap',
        }}
      >
        {함께보낼것.map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}

        <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flex: '1 1 220px' }}>
          <Search
            size={14}
            strokeWidth={1.75}
            aria-hidden
            style={{ position: 'absolute', left: 10, color: T.muted, pointerEvents: 'none' }}
          />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder={`${searchIn} 검색`}
            aria-label={`${searchIn} 검색`}
            style={{ ...칸, flex: 1 }}
          />
        </span>

        {sorts && sorts.length > 1 && (
          <select
            name="sort"
            defaultValue={sort?.key ?? sorts[0].key}
            aria-label="정렬"
            style={{ ...칸, padding: `0 ${S[3]}px`, flex: '0 0 auto' }}
          >
            {sorts.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        )}

        <button
          type="submit"
          style={{
            height: 36,
            padding: `0 ${S[4]}px`,
            borderRadius: RADIUS.md,
            border: `1px solid ${T.border}`,
            background: 'transparent',
            color: T.text,
            fontFamily: F.ui,
            fontSize: FS[11],
            lineHeight: LH.none,
            letterSpacing: labelTracking(검색글, 1.2),
            textTransform: labelCase(검색글),
            cursor: 'pointer',
            flex: '0 0 auto',
          }}
        >
          {검색글}
        </button>

        {/*
          🔑 좁혀 놓은 것을 «푸는 길» 이 화면에 있어야 한다. 주소를 손으로 고치게
             두면 사람은 목록을 처음부터 다시 연다.
        */}
        {좁힘 && (
          <a
            href={basePath}
            style={{ ...라벨('검색 지우기'), textDecoration: 'underline', flex: '0 0 auto' }}
          >
            검색 지우기
          </a>
        )}

        <span style={{ ...라벨(셈), marginLeft: 'auto', flex: '0 0 auto' }}>{셈}</span>
      </form>

      {/*
        건너뛰기는 ListPager 를 그대로 쓴다. 부품을 두 벌로 만들지 않는다 ·
        목록 «아래» 에도 같은 것이 있어 두 곳의 셈이 갈리면 사람이 못 믿는다.
      */}
      <ListPager
        page={page}
        total={total}
        basePath={basePath}
        params={{ ...params, q: q || undefined, sort: sort?.key }}
        size={size}
        place="top"
      />
    </div>
  );
}
