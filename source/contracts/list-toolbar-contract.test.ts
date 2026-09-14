import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 목록 도구줄 계약 (2026-09-09 감사 · 주제 #11)
// =============================================================================
// ListPager 를 쓰는 목록 21곳 중 19곳이 `page` 하나만 받았다. 100건을 지나 2페이지로
// 가려면 카드 100장(약 8,200px)을 지나야 했다.
//
// 이 계약이 지키는 것은 «부품이 있다» 가 아니라 그 부품이 **자기 약속을 지키는지** 다.
//
// 🔴 실측(2026-09-10 · /capa · 1440x900):
//      ?q=004               검색 결과 2건 · 전체 4건 중
//      ?q=A, B              200 · 「찾은 것 없음」 (쉼표로도 안 깨진다)
//      ?sort=code           001 → 002 → 003 → 004
//      ?sort=id;drop        최신순으로 접힘 (허용목록 밖)
//      sticky               데스크톱 top 24px(밴드 아래) · 모바일 top 120px(main 위)
//
// 🔑 정규식을 쓰지 않는다. 낱말 포함으로만 본다.

const ROOT = process.cwd();
const 도구줄 = 'components/ListToolbar.tsx';
const 페이저 = 'components/ListPager.tsx';

const read = (rel: string) => readFileSync(join(ROOT, rel), 'utf8');

/** 주석을 걷어 낸 코드. 「이렇게 하면 안 된다」고 적은 주석이 걸리면 안 된다 */
function bare(rel: string): string {
  return read(rel)
    .split('/*')
    .map((seg, i) => (i === 0 ? seg : seg.slice(seg.indexOf('*/') + 2)))
    .join('')
    .split(String.fromCharCode(10))
    .filter((l) => !l.trim().startsWith('//'))
    .join(String.fromCharCode(10));
}

describe('목록 도구줄', () => {
  const 코드 = bare(도구줄);

  /*
   * GET form 이라야 JS 없이도 돌고 뒤로가기·북마크가 산다. onSubmit 으로 바꾸면
   * 지금 무엇으로 좁혀 놓았는지가 주소에서 사라진다.
   */
  it('GET form 이다 · 주소가 상태를 든다', () => {
    expect(코드).toContain('method="get"');
    expect(코드).toContain('action={basePath}');
    expect(코드).not.toContain('onSubmit');
  });

  /* 이 둘을 안 실어 보내면 검색 한 번에 탭·필터가 조용히 풀린다 */
  it('q·sort 밖의 쿼리를 hidden 으로 함께 보낸다', () => {
    expect(코드).toContain('type="hidden"');
    expect(코드).toContain('함께보낼것');
  });

  /*
   * 3페이지를 보다 좁히면 있지도 않은 페이지로 간다. page 는 싣지 않아야 1페이지로
   * 돌아간다.
   */
  it('page 는 싣지 않는다', () => {
    const i = 코드.indexOf('함께보낼것');
    const 블록 = 코드.slice(i, 코드.indexOf(';', i));
    expect(블록).toContain("k !== 'page'");
  });

  /* 값을 베끼면 어느 한 층에서 반드시 어긋난다 */
  it('sticky 값을 손으로 적지 않는다', () => {
    expect(코드).toContain('stickyTopInset(pad.top)');
    expect(코드).toContain('TOP_BAND_HEIGHT');
    expect(코드).toContain('zIndex: Z.sticky');
    expect(코드).not.toContain('top: 56');
    expect(코드).not.toContain('zIndex: 100');
  });

  /* 부품을 두 벌로 만들지 않는다 */
  it('건너뛰기는 ListPager 를 그대로 쓴다', () => {
    expect(코드).toContain('<ListPager');
    expect(코드).toContain('place="top"');
  });

  /* 셈은 lib/api/list-page.ts 가 한다 */
  it('구간 계산을 다시 적지 않는다', () => {
    expect(코드).toContain('pageWindow(');
    expect(코드).not.toContain('* size + 1');
  });

  /*
   * 🔴 찾은 것이 0건일 때야말로 「검색 지우기」가 필요하다. 그때 감추면 주소를
   *    손으로 고치거나 목록을 처음부터 다시 여는 수밖에 없다.
   */
  it('좁혀 놓은 것을 푸는 길이 화면에 있다', () => {
    expect(코드).toContain('검색 지우기');
    const i = 코드.indexOf('검색 지우기');
    /* 「좁힘」 하나로만 가린다 · 결과 유무로 가리면 0건에서 사라진다 */
    expect(코드.slice(Math.max(0, i - 400), i)).toContain('{좁힘 && (');
  });

  it('인쇄에서는 되돌린다 · 종이에는 스크롤이 없다', () => {
    expect(코드).toContain('qa-list-toolbar');
    const css = read('app/globals.css');
    expect(css).toContain('.qa-list-toolbar { position: static; }');
    expect(css).toContain('.qa-list-toolbar form { display: none; }');
  });
});

describe('ListPager · 위와 아래', () => {
  const 코드 = bare(페이저);

  it('위쪽에서는 목록을 닫는 줄을 그리지 않는다', () => {
    expect(코드).toContain("place = 'bottom'");
    expect(코드).toContain('위 ? 0 : S[5]');
    expect(코드).toContain('위 ? undefined : `1px solid ${T.border}`');
  });

  /* 두 곳이 같은 건수를 다르게 적으면 사람이 목록을 못 믿는다 */
  it('위쪽에서는 건수를 그리지 않는다 · 도구줄이 이미 말한다', () => {
    expect(코드).toContain('{!위 && (');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 도구줄을 그리는 «모든» 화면을 훑는다
// ─────────────────────────────────────────────────────────────────────────────
// 🔴 첫 판의 이 검사는 `/capa` 한 곳만 읽었다. 두 번째 화면이 shownTotal 을 빠뜨려도
//    초록불이 났다 · 「본다」가 아니라 「한 곳을 본다」였다. 축을 파일 목록으로 바꾼다.

function 화면들(): string[] {
  const 뿌리 = join(ROOT, 'app');
  const 나온다: string[] = [];
  const 걷기 = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const 길 = join(d, e.name);
      if (e.isDirectory()) 걷기(길);
      else if (e.name === 'page.tsx') 나온다.push(길);
    }
  };
  걷기(뿌리);
  return 나온다;
}

/*
 * 도구줄을 «일부러» 안 다는 화면. 이유를 함께 적는다 · 이유가 없으면 «빠뜨린 것» 과
 * «일부러 뺀 것» 을 코드가 구별하지 못한다(table-registry 의 `reach.why` 와 같은 방식).
 *
 * 🔴 이 목록에 이름을 더하는 것만으로 검사를 지날 수 있다. 그러니 더할 때는 이유가
 *    「아직 안 했다」가 아닌지 스스로 물을 것. 「아직」 은 예외가 아니라 빚이다.
 */
const 일부러_뺀_화면: Record<string, string> = {
  'audit': [
    '이미 더 넓은 거르개가 있다 · 제품·액션·기간·검색을 함께 받고(app/(app)/audit/filter-bar.tsx),',
    '해석은 lib 의 parseAuditFilters 하나가 하며 CSV 내보내기 라우트가 같은 규칙을 쓴다.',
    '도구줄을 얹으면 한 화면에 검색칸이 둘이 되고, 좁히는 규칙이 두 벌이 된다.',
  ].join(' '),
};

const 목록화면 = 화면들()
  .map((f) => ({ f, s: readFileSync(f, 'utf8') }))
  .filter((x) => x.s.includes('<ListPager'));
const 도구줄화면 = 목록화면.filter((x) => x.s.includes('<ListToolbar'));

/** 파일 경로에서 화면 이름만. `app/(app)/audit/page.tsx` → `audit` */
function 화면이름(f: string): string {
  const 조각 = f.replace(/\\/g, '/').split('/');
  return 조각[조각.length - 2] ?? f;
}

describe('쓰는 곳이 있다 · 선언만 되고 아무도 안 쓰면 소용없다', () => {
  /*
   * 🔑 비율 자물쇠(「줄지 않는다」)에서 전수(「빠진 곳이 없다」)로 바꿨다.
   *    옮기는 중에는 수를 지켰지만, 끝난 뒤에도 그대로 두면 **새로 만든 목록 화면이**
   *    도구줄 없이 들어와도 아무 소리가 안 난다. 새 화면이 곧 새 사각지대가 된다.
   */
  it('ListPager 를 쓰는 화면은 빠짐없이 도구줄을 그린다', () => {
    expect(목록화면.length).toBeGreaterThan(0);
    const 빠진곳 = 목록화면
      .filter((x) => !x.s.includes('<ListToolbar'))
      .map((x) => 화면이름(x.f))
      .filter((이름) => !(이름 in 일부러_뺀_화면));
    expect(빠진곳).toEqual([]);
  });

  /* 예외 목록이 «죽은 이름» 을 안고 있으면, 그 자리에 새 구멍이 나도 안 보인다 */
  it('일부러 뺀 화면은 실제로 있고, 실제로 도구줄이 없다', () => {
    for (const 이름 of Object.keys(일부러_뺀_화면)) {
      const 그것 = 목록화면.find((x) => 화면이름(x.f) === 이름);
      expect(그것, `${이름} 은 목록 화면이 아니다`).toBeTruthy();
      expect(그것?.s.includes('<ListToolbar')).toBe(false);
      expect(일부러_뺀_화면[이름].length).toBeGreaterThan(40);
    }
  });

  it.each(도구줄화면.map((x) => x.f))(
    '%s · 세는 기준 = 거르는 기준, 사용자 문자열은 .order() 에 안 닿는다',
    (f) => {
      const 화면 = readFileSync(f, 'utf8');
      /* 세는 기준 = 거르는 기준. 좁혀 놓고 «전체» 로 접으면 없는 페이지로 간다 */
      expect(화면).toContain('clampPage(requested, shownTotal)');
      /* 사용자 문자열이 .order() 에 닿지 않는다 */
      expect(화면).toContain('parseSort(sp?.sort, SORTS)');
      expect(화면).toContain('.order(sort.col,');
      expect(화면).not.toContain('.order(sp?.sort');
      /* 좁히는 것과 세는 것이 같은 함수를 지난다 */
      expect(화면).toContain('ilikeOr(SEARCH_COLS, q)');
    },
  );

  /*
   * 🔴 0건일 때 도구줄을 감추면 되돌릴 길이 사라진다. 화면마다 «빈 갈래» 와
   *    «있는 갈래» 두 곳에서 같은 도구줄을 그려야 한다.
   */
  it.each(도구줄화면.map((x) => x.f))(
    '%s · 빈 화면에도 도구줄을 그린다',
    (f) => {
      const 화면 = readFileSync(f, 'utf8');
      const 그린곳 = 화면.split('{도구줄}').length - 1;
      expect(그린곳).toBeGreaterThanOrEqual(2);
    },
  );

  /* 아래 페이저가 «전체» 로 접으면 좁힌 화면에서 없는 페이지로 간다 */
  it.each(도구줄화면.map((x) => x.f))(
    '%s · 아래 페이저도 좁힌 건수로 접고 좁힘을 이어 나른다',
    (f) => {
      const 화면 = readFileSync(f, 'utf8');
      const i = 화면.lastIndexOf('<ListPager');
      const 아래 = 화면.slice(i, i + 400);
      expect(아래).toContain('total={shownTotal}');
      expect(아래).toContain('sort: sort.key');
    },
  );
});
