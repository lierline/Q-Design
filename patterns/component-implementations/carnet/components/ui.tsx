import Link from 'next/link';
import { Lock } from '@/components/q-design-icons/Lock';
import { ChevronRight } from '@/components/q-design-icons/ChevronRight';
import InfoTip from '@/components/info-tip';
import type { FormState } from '@/lib/forms';

/* ---------------------------------------------------------------------------
   공용 조각

   화면마다 카드와 표를 다시 만들면 여백과 글자 크기가 조금씩 어긋난다.
   여기 있는 것만 쓰고, 여기서 안 되면 여기를 고친다.

   판정성 문구를 쓰지 않는다 (§10). "적합", "이상 없음" 같은 말은 이 시스템이
   할 수 있는 말이 아니다. 상태와 수치만 보여 준다.
--------------------------------------------------------------------------- */

/* 서버 액션 결과 표시. 성공도 실패도 같은 자리에 나온다. */
export function Msg({ state, className = '' }: { state: FormState; className?: string }) {
  if (state.error) {
    return (
      <p
        role="alert"
        data-tone="error"
        className={`qd-notice mt-2.5 ${className}`}
      >
        <span aria-hidden className="mt-px shrink-0 font-semibold">!</span>
        <span>{state.error}</span>
      </p>
    );
  }
  if (state.ok && state.message) {
    return (
      <p
        role="status"
        data-tone="success"
        className={`qd-notice mt-2.5 ${className}`}
      >
        <span aria-hidden className="mt-px shrink-0 font-semibold text-ok">&#10003;</span>
        <span>{state.message}</span>
      </p>
    );
  }
  return null;
}

/*
 * 화면 머리는 PageShell 하나로 낸다 (components/shell.tsx).
 *
 * PageTitle · PageHead 를 여기 두었더니 구역 레이아웃이 하나를 내고 화면이 또
 * 하나를 내서 제목이 두 겹, 설명문이 두 개가 되었다. 화면마다 어느 쪽이 이
 * 화면의 이름인지 읽는 사람이 판단해야 했다. 낼 곳을 하나로 줄인다.
 */

/*
 * 🔴 장 이름표(MagHead · 큰 번호 · 영문 라벨 · 굵은 제목 · 사라지는 금선)를 걷었다
 *    (오너 결정 2026-09-25). 설정 첫 화면의 장 둘만 쓰던 것을 원본처럼 판 밖 정본 구역
 *    이름(.qd-section-title)으로 바꾸었다. 화면을 장으로 나눌 때도 아래 Panel 의 이름 ·
 *    정본 구역 이름을 쓴다(check-nav 4g).
 */

/*
 * 판의 이름은 판 «밖» 에 선다 (정본 `.qd-section-title` · 2026-09-24 정본 확장).
 *
 * 전에는 판 안 머리(.section-head)에 14px 굵은 제목 · 구분선 · 사라지는 금선을
 * 그렸다. 원본(Q-Atelier)은 판 위에 금색 모노 10px 구역 이름을 세우고 판은 내용만
 * 담는다. 네 제품을 나란히 찍었을 때 이 자리가 제품마다 달라 정본으로 올렸다(오너
 * 결정 「정본을 늘려 모두 맞추기」). 글꼴 · 크기 · 색 · 아래 여백은 정본이 준다.
 *
 * 이 제품에만 있는 것은 부제(note)와 머리 줄의 단추 · 설명 i 다. 이름과 한 묶음으로
 * 판 위에 둔다 - 머리 줄이 있으면 이름은 --flush 로 여백을 내려놓고, 그 여백은
 * 머리 줄(.panel-head)이 대신 준다(값은 정본과 같게 · check-nav 4f 가 대조).
 *
 * className 은 자리 잡기(격자 칸 · 높이)라 가장 바깥에, bodyClassName 은 판 안의
 * 여백 · 배치 · 상태 색이라 판에 붙는다. 이름이 없는 판은 둘이 같은 요소다.
 */
export function Panel({
  title, titleAs: Title = 'h2', note, info, action, children, className = '', bodyClassName = '',
}: {
  title?: string;
  /**
   * 이름의 제목 수준. 기본은 h2 (2026-11-04 · impeccable 감사 16번). 화면 이름이 h1 이고 판은 그
   * 아래 첫 단계라, 기본이 h3 이면 h1 다음에 바로 h3 가 와 단계를 건너뛰었다(15화면). 모양은 정본
   * `.qd-section-title` 이 쥐므로 수준을 바꿔도 같다. 판 안의 작은 제목만 h3 로 내린다.
   */
  titleAs?: 'h2' | 'h3';
  note?: React.ReactNode;
  /** 용어 풀이 · 주의 같은 «설명». 판 오른쪽 위의 i 에 접혀 있다가 올리거나 누르면 뜬다 (오빠 지시 2026-09-15) */
  info?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  /** 자리 잡기(격자 칸 · 높이)만. 가장 바깥에 붙는다 */
  className?: string;
  /** 판 안(여백 · flex · 상태 색). 판에 붙는다 */
  bodyClassName?: string;
}) {
  const frame = `qd-panel card overflow-hidden ${bodyClassName}`.trim();
  const row = Boolean(note || action || info);
  if (!title && !row) {
    return <section className={`${frame} ${className}`.trim()}>{children}</section>;
  }

  const name = title && (
    <Title className={`qd-section-title${row ? ' qd-section-title--flush' : ''}`}
           data-hangul={tagHangul(title)}>
      {title}
    </Title>
  );

  return (
    /* 격자 안에서 옆 판과 높이를 맞추도록 판이 남는 높이를 채운다(grow) */
    <section className={`flex min-w-0 flex-col ${className}`.trim()}>
      {row ? (
        <header className="panel-head">
          <div className="min-w-0">
            {name}
            {note && <p className="mt-1.5 text-xs leading-relaxed text-muted">{note}</p>}
          </div>
          {(info || action) && (
            <div className="ml-auto flex shrink-0 items-center gap-2">
              {action}
              {info && <InfoTip label={`${title ?? '이 판'} 설명`}>{info}</InfoTip>}
            </div>
          )}
        </header>
      ) : name}
      <div className={`${frame} grow`}>{children}</div>
    </section>
  );
}

/* TableWrap 은 걷었다 (2026-10-28). 표는 components/table.tsx 의 Table 하나로 만든다. 표를 만드는 길이 셋
   (Table · 날것 qd-table · TableWrap)이라 열 폭 규칙이 표마다 갈렸다 */

export function Empty({ children, hint, compact = false, reset }: {
  children: React.ReactNode; hint?: React.ReactNode;
  /**
   * 걸러서 빈 목록이면 «조건 풀기» 를 준다 (우리 규칙 I7 · 2026-10-27 감사 U7).
   * 처음이라 빈 것과 찾아서 없는 것은 다른 화면이다. 후자에 등록 안내를 내면 걸러 놓은 줄 모르고 등록하러 간다.
   */
  reset?: { href: string; label?: string };
  /**
   * 한 화면에 판이 여럿인 자리(현황 · 상세 · 판 안의 한 구역)는 좁은 꼴이다.
   * 목록 화면의 목록이 통째로 빈 자리만 넉넉한 꼴(여백 96)로 둔다 - 원본 EmptyState 와 같은 갈래.
   */
  compact?: boolean;
}) {
  return (
    /*
     * 빈 상태의 글자를 한 단계씩 올렸다 (2026-09-08).
     *
     * 전에는 본문이 faint 이고 안내가 `faint/80` 이었다. **무엇을 해야 하는지
     * 알려 주는 줄이 화면에서 제일 안 읽히는 글자**였다 - 흰 바탕에서 3.23,
     * 캔버스에서 2.95 로 AA 근처에도 못 갔다.
     *
     * 본문을 muted, 안내를 faint 로 올린다. 안내가 본문보다 조용한 차례는
     * 그대로이고 둘 다 읽힌다 (5.17 · 4.74).
     *
     * ── hint 를 비워 두지 않는다 (2026-09-08) ──────────────────────────
     * 39곳 중 6곳에만 안내가 붙어 있었다. 나머지는 "없습니다" 로 끝났고,
     * **빈 DB 로 시작하는 제조소가 첫날 보는 화면이 그것들이다.** 어디로
     * 가면 채워지는지를 화면이 말하지 않으면 §2.0 이 종이 위에만 남는다.
     *
     * 안내에 적는 것은 **그 칸이 어디서 채워지는가**다. 판정을 적지 않는다 -
     * "이상 없음" · "정상" 은 §8.5 가 금지한다. 비어 있다는 사실만 말하고
     * 다음 걸음을 가리킨다.
     *
     * 거르개가 있는 화면은 두 경우를 갈라 적는다. 거른 결과가 빈 것과 아직
     * 아무것도 없는 것에 같은 문장을 내면, 걸러 놓은 줄 모르고 등록하러 간다.
     *
     * ── 짜임은 정본 `.qd-empty` 다 (2026-09-24 · 정본 확장) ─────────────────
     * 원본 EmptyState 와 같이 판 하나 · 가운데 · 조용한 제목 · 한 줄 설명. 안내는
     * 설명 자리(.qd-empty-desc)에 그대로 산다. 크기 · 여백 · 색은 정본이 준다
     * (제목 subtle · 설명 muted 는 이 제품의 muted · faint 에 이어져 위 대비 그대로).
     *
     * 빈 목록 자체가 판이다. 판(Panel) 안에 놓이면 겉 판이 선 · 면을 이미 그리므로
     * 빈 목록은 제 선을 내려놓는다(globals.css · 판 안 판을 만들지 않는다).
     */
    <div className={`qd-empty${compact ? ' qd-empty--compact' : ''}`}>
      <p className="qd-empty-title">{children}</p>
      {hint && <p className="qd-empty-desc">{hint}</p>}
      {reset && (
        <p className="qd-empty-actions">
          <Link href={reset.href} className="qd-text-action">{reset.label ?? '조건 풀기'}</Link>
        </p>
      )}
    </div>
  );
}

/**
 * 읽기 전용 칸의 이름과 값. 이름은 입력칸 이름표와 같은 정본 `.qd-field-label` 이다
 * (2026-09-24) - 같은 화면에서 쓰는 칸과 읽는 칸의 이름이 다른 글꼴로 서지 않게.
 * 칸 격자(`.qd-fields`) 안에 놓는다. 긴 값(비고 · 사유)은 `wide` 로 줄 끝까지 쓴다.
 */
export function Field({
  label, children, wide = false,
}: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'qd-field qd-field-wide' : 'qd-field'}>
      <div className="qd-field-label" data-hangul={tagHangul(label)}>{label}</div>
      <div className="text-sm text-ink">{children}</div>
    </div>
  );
}

/** 숫자 하나를 크게 보여 주는 칸. 현황과 요약 줄에 쓴다. */
export function Stat({
  label, value, unit, tone = 'ink', href,
}: {
  label: string; value: React.ReactNode; unit?: string;
  tone?: 'ink' | 'brand' | 'warn' | 'danger' | 'info'; href?: string;
}) {
  const color = {
    ink: 'text-ink', brand: 'text-brand', warn: 'text-warn',
    danger: 'text-danger', info: 'text-info',
  }[tone];

  const body = (
    <>
      <div className="qd-kpi-label" data-hangul={tagHangul(label)}>{label}</div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={`qd-kpi-value tnum ${color}`}>{value}</span>
        {unit && <span className="qd-kpi-unit">{unit}</span>}
      </div>
    </>
  );

  if (!href) return <div className="qd-kpi">{body}</div>;
  return (
    <a href={href} className="qd-kpi qd-kpi--link">
      {body}
    </a>
  );
}

/*
 * 배지는 정본 `.qd-tag` 다 (2026-09-24 · 통일 감사).
 *
 * 전에는 Pretendard 11px 700 에 색 면을 깔았다(.chip). 네 제품을 나란히 재 보니
 * 이것만 굵은 산세리프라 표 안에서 배지만 다른 물건으로 보였다. 정본은 모노 ·
 * 헤어라인 테두리 · 모서리 6 이고, 크기 · 글꼴은 거기서 온다 - 여기에 다시 적지 않는다.
 *
 * 뜻(ok · warn …)은 이 제품의 말이고 색 이름(green · copper …)은 정본의 말이다.
 * 둘을 잇는 곳이 여기 하나다. 색 값은 globals.css 의 `--qa-state-*` 가 이 제품의
 * 상태색(두 테마 모두 판 위 4.5 이상)을 잇는다. 설정의 강조색이 바뀌면 brand 도 따라간다.
 */
const TONE: Record<string, string> = {
  ok: 'qd-tag--green',
  warn: 'qd-tag--copper',
  danger: 'qd-tag--red',
  info: 'qd-tag--cobalt',
  brand: 'qd-tag--gold',
  /* 한 단계 무거운 층. 정본의 primary 는 채움이 아니라 옅은 면 + 진한 테두리다 */
  solid: 'qd-tag--gold qd-tag--primary',
  quiet: 'qd-tag--gray',
  faint: 'qd-tag--tertiary',
  /* 흔한 끝 상태(종료 · 출고 · 종결 · 회수). 회색 알약에 점만 - 초록은 판정에만 (lib/forms.ts 색 사전 · 2026-10-27) */
  done: 'qd-tag--gray',
};

/** 뜻이 있는 상태에만 점을 붙인다 */
const DOT = new Set(['ok', 'warn', 'danger', 'info', 'brand', 'done']);

/**
 * 정본 배지는 라틴 자간(1px)이 기본이라 한글이면 `data-hangul` 로 푼다. 글이 아닌
 * 것(숫자와 글이 섞인 조각 등)은 한글로 본다 - 이 제품의 배지는 거의 다 한글이다.
 */
export const tagHangul = (n: React.ReactNode) =>
  typeof n === 'string' && !/[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(n) ? undefined : '';

/**
 * 상태 조각.
 *
 * 색만으로 상태를 말하면 색을 구별하지 못하는 사람에게는 아무 표시도 없는 것과
 * 같다. 뜻이 있는 상태에는 점을 하나 붙여 모양으로도 갈리게 한다.
 * 중립(quiet · faint)에는 붙이지 않는다 - 붙이면 모든 조각이 똑같아진다.
 */
export function Tag({
  tone = 'quiet', dot, className = '', children,
}: {
  tone?: keyof typeof TONE | string;
  /** 상태가 아닌 이름표(「나」 · 역할 이름)는 점을 끈다. 안 주면 뜻이 있는 색에만 붙는다 */
  dot?: boolean;
  /** 자리 잡기(여백 · 줄어듦 · 물려받는 굵기 끊기)만. 크기 · 색은 정본이 정한다 */
  className?: string;
  children: React.ReactNode;
}) {
  const withDot = dot ?? DOT.has(tone);
  return (
    <span className={`qd-tag qd-tag--sm ${TONE[tone] ?? TONE.quiet} ${className}`.trim()}
          data-hangul={tagHangul(children)}>
      {withDot && <span aria-hidden className="qd-tag-dot" />}
      {children}
    </span>
  );
}

/* 경고 묶음. 차단이 아니라 표시다 (§2 "경고만"). */
export function Warnings({ items }: { items: { kind: string; detail: string }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="qd-notice block" data-tone="warning" role="note">
      <p className="text-[length:var(--qd-font-size-12)] font-semibold text-warn">확인하고 진행하십시오</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((w, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-ink">
            <span className="qd-tag qd-tag--sm qd-tag--copper qd-tag--primary mt-px shrink-0"
                  data-hangul={tagHangul(w.kind)}>{w.kind}</span>
            <span>{w.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/*
 * 잠긴 칸의 표시 (화면 검토 C16 · 2026-09-27).
 *
 * 발행 뒤 바꿀 수 없는 값을 흰 입력칸 + [저장] 으로 그려 두었더니, 눌러 보기 전까지
 * 고칠 수 있는지 몰랐다(누르면 DB 가 거절한다). 잠긴 값은 읽는 글로 두고 이 표시를
 * 곁에 붙인다. 모양(자물쇠)과 글이 함께 말한다 - 색만으로 말하지 않는다.
 */
export function LockMark({ children }: { children?: React.ReactNode }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
      <Lock className="size-3.5" />
      {children}
    </span>
  );
}

/*
 * 이동 글귀 (2026-10-27 오빠 결정 «F» · 정본 `.qd-text-action--go`).
 *
 * 판 머리 · 안내 문구 옆에 홀로 서서 다른 화면으로 가는 글귀(「전체 보기」 「생산으로」 「감사 추적」).
 * 전에는 화면마다 금색 링크(text-xs font-semibold text-brand)를 손으로 짰다. 먹색 · 굵기 600 ·
 * 올렸을 때 밑줄은 정본이 쥐고, 여기서는 끝 꺾쇠만 붙인다. 줄마다 되풀이되는 열기 · 고치기와
 * 취소 · 뒤로에는 쓰지 않는다(다 진하면 다시 같은 무게가 된다).
 * native: 인쇄 화면처럼 <a> 로 거는 자리.
 */
export function GoLink({ href, children, native = false }: {
  href: string;
  children: React.ReactNode;
  native?: boolean;
}) {
  const body = <>{children}<ChevronRight className="size-3.5" /></>;
  return native
    ? <a href={href} className="qd-text-action qd-text-action--go">{body}</a>
    : <Link href={href} className="qd-text-action qd-text-action--go">{body}</Link>;
}

/* 되돌릴 수 없는 조작 앞에 두는 안내. */
export function Caution({ children }: { children: React.ReactNode }) {
  return (
    <p className="qd-notice" data-tone="neutral" role="note">
      {children}
    </p>
  );
}

/* ---------------------------------------------------------------------------
   잘린 목록 알림

   목록에 상한을 두면 화면이 빨라지지만, 자른 사실을 적지 않으면 보는 사람은
   그것이 전부인 줄 안다. 조용한 잘림은 "다 봤다"로 읽힌다.

   상한에 닿았을 때만 나온다. 닿지 않았으면 아무것도 그리지 않는다.
--------------------------------------------------------------------------- */
/*
 * 🔴 2026-09-09 감사(주제 #4). 종전 서명은 `{ shown, cap }` 이었고, 저장소 전체에서
 *    **한 곳에서만** 불렸다. 이유는 상한 숫자가 두 곳에 적히기 때문이다:
 *    질의문의 `limit 200` 과 화면의 `cap={200}` 이 같은 사실의 사본 둘이다.
 *    옮겨 붙일 때마다 사본이 늘어나므로 아무도 옮기지 않았고, 목록 열아홉이
 *    잘린 줄 모르는 채 「다 봤다」로 읽혔다.
 *
 * 🔑 `total` 을 받는다. 화면이 상한 숫자를 알 필요가 없어져 사본이 사라진다.
 *    총건수는 질의문이 `count(*) over ()::int as total_rows` 로 함께 낸다.
 *    LIMIT 보다 먼저 계산되므로 진짜 총건수이고, WHERE 절을 두 번 안 적어도 된다.
 *
 * 🔑 글도 바뀐다. 「최근 200건만 보이고 있습니다」는 «얼마나 못 보고 있는지» 를
 *    말하지 않는다. 「전체 743건 중 200건」이라야 남은 543건을 짐작할 수 있다.
 */
/* ---------------------------------------------------------------------------
   진행 막대 (원본 7eb7e9d 의 기능 · 2026-09-14 들여옴)

   목록을 열어 놓고 묻는 것은 늘 하나다 - **이 배치가 어디쯤인가.** 숫자만
   적어도 되지만(4/12) 숫자는 견줘야 뜻이 산다. 길이가 다른 막대 여섯 개를
   보는 쪽이 여섯 쌍의 분수를 머릿속에서 견주는 것보다 빠르다.
   빠르다 · 늦다를 말하지 않는다. 끝난 공정 수를 전체로 나눈 값일 뿐이고
   숫자를 나란히 적어 막대가 무엇을 줄인 것인지 늘 보이게 한다.
   채움은 강조색 한 가지(원본의 기울기는 이 저장소의 디자인 규칙 밖).
--------------------------------------------------------------------------- */
export function Progress({ done, total, width = 'var(--qd-carnet-progress-width)' }: {
  done: number; total: number; width?: string;
}) {
  if (total <= 0) return null;
  const pct = Math.max(0, Math.min(100, (done / total) * 100));
  return (
    <span className="inline-flex items-center gap-2">
      <span className="qd-progress shrink-0" role="progressbar" aria-label="공정 진행"
            aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.max(0, Math.min(total, done))}
            style={{ width }}>
        <span className="qd-progress-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="tnum text-xs text-muted">
        <b className={done === total ? 'text-brand' : 'text-ink'}>{done}</b>/{total}
      </span>
    </span>
  );
}

/*
 * 목록 아래 건수 줄 (화면 검토 C46 · 2026-09-27). Q-Atelier · Q-Maison 목록은 끝에
 * «1-4 / 총 4건» 을 두는데 이 제품의 생산 · 자재 로트 목록에는 없었다. 정본 쪽 이동 줄
 * (.qd-pager · .qd-pager-count)의 건수 칸을 그대로 쓴다. 총건수는 질의가 total_rows 로 낸다.
 */
export function ListCount({ shown, total }: { shown: number; total: number }) {
  if (!total) return null;
  return (
    <nav className="qd-pager" data-layout="contained" aria-label="목록 건수">
      <span className="qd-pager-count" data-hangul="">
        1-{shown.toLocaleString('ko-KR')} / 총 {total.toLocaleString('ko-KR')}건
      </span>
    </nav>
  );
}

export function Truncated({ shown, total, hint }: {
  shown: number; total: number; hint?: React.ReactNode;
}) {
  if (!total || shown >= total) return null;
  return (
    <p className="qd-panel card px-4 py-2.5 text-xs leading-relaxed text-muted">
      전체 <b className="tnum text-ink">{total.toLocaleString('ko-KR')}</b>건 중{' '}
      <b className="tnum text-ink">{shown.toLocaleString('ko-KR')}</b>건입니다.
      {hint ? <> {hint}</> : ' 찾는 것이 없으면 위에서 걸러 내거나 검색하십시오.'}
    </p>
  );
}
