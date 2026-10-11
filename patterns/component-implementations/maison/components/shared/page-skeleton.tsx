/**
 * 화면이 서버에서 오는 동안 자리를 잡아 두는 뼈대.
 *
 * 왜 필요한가 (2026-09-17 실측): 메뉴를 누르고 새 화면이 그려지기까지
 * 0.3~0.8초가 걸리는데, 그동안 **앞 화면이 그대로 남아** 있어서 눌러도
 * 아무 일이 안 일어난 것처럼 보였다. 부적합 목록은 0.61초 동안 대시보드가
 * 그대로였고, 뼈대가 있는 문서함은 0.02초 만에 화면이 바뀌었다.
 * 걸리는 시간은 같은데 한쪽만 «반응한다» 로 읽힌다.
 *
 * 각 화면의 `loading.tsx` 는 여기서 골라 쓰기만 한다. 뼈대를 화면마다 손으로
 * 베끼면 모양을 한 번 고칠 때 스무 곳을 따라다녀야 한다.
 */

/** 글줄 자리 (제목·설명처럼 배경 위에 뜨는 것) */
const line = "qd-skeleton";
/** 덩어리 자리 (표의 줄·카드처럼 테두리가 있는 것) */
const block = "qd-skeleton border";
const control = "qd-skeleton h-[var(--qd-control-height)]";
const compact =
  "qd-skeleton h-[var(--qd-control-height-sm)] qa-touch-44 [@media(pointer:coarse)]:min-h-[var(--qd-control-height)]";

/**
 * 화면 머리: 부제 + 제목 + 설명, 오른쪽에 동작 단추 자리.
 * 실제 화면들이 모두 `PageHead`(정본 `.qd-page-head`)로 시작하므로 같은 뼈대를
 * 쓴다. 막대 · 여백 · 하단선이 정본에서 오니, 내용이 도착해도 머리가 안 움직인다.
 *
 * 대시보드·공장·결재판처럼 본문 모양이 제각각인 화면은 본문을 스스로 그리되
 * **머리는 이걸 쓴다.** 머리 모양이 바뀔 때 고칠 자리를 하나로 둔다.
 */
export function SkeletonHead({ actions = true }: { actions?: boolean }) {
  return (
    <header className="qd-page-head" aria-hidden>
      <div className="qd-page-head-row">
        <div className="qd-page-head-text">
          {/* 줄 높이: 제목 한 줄(32px × 1.1) · 설명 한 줄. 이름표는 번호가 있는 상세에만 있어
              뼈대에서는 비워 둔다(화면 검토 · 오너 결정 2026-09-27 «뜻 있을 때만») */}
          <div className={`h-9 w-52 ${line}`} />
          <div className={`mt-2 h-5 w-72 ${line}`} />
        </div>
        {actions ? <div className={`w-28 ${compact}`} /> : null}
      </div>
    </header>
  );
}

/** 탭 줄 (ViewTabs 를 쓰는 화면용) */
function Tabs({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`h-8 w-24 ${line}`} />
      ))}
    </div>
  );
}

/** 검색·거르개 줄 */
function Filters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className={`w-64 ${control}`} />
      <div className={`w-32 ${control}`} />
      <div className={`w-32 ${control}`} />
    </div>
  );
}

type ListProps = {
  /** 표 줄 수. 화면이 보통 보여 주는 만큼 */
  rows?: number;
  /**
   * 머리 아래 지표 카드 수 (`ListStats` 가 그리는 「지금 어떤가」 넉 장).
   * 🔴 이 자리를 비워 두면 내용이 도착할 때 카드가 끼어들면서 표가 통째로
   * 아래로 밀린다. 뼈대를 붙인 뜻이 반쯤 사라진다. 화면에 카드가 있으면
   * **반드시** 개수를 준다. 실제 화면은 대부분 넉 장이다.
   */
  stats?: number;
  /** 검색·거르개 줄을 그릴지 */
  filters?: boolean;
  /** 탭이 있는 화면이면 탭 개수 */
  tabs?: number;
  /** 머리 오른쪽 단추 자리 */
  actions?: boolean;
};

/** 표로 된 목록 화면 */
export function ListSkeleton({
  rows = 10,
  stats = 0,
  filters = true,
  tabs,
  actions = true,
}: ListProps) {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-5">
      <SkeletonHead actions={actions} />
      {tabs ? <Tabs count={tabs} /> : null}
      {stats > 0 ? (
        <CardGridSkeleton count={stats} columns={4} height="sm" head={false} />
      ) : null}
      {filters ? <Filters /> : null}
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className={`h-12 ${block}`} />
        ))}
      </div>
    </div>
  );
}

type CardGridProps = {
  /** 카드 개수 */
  count?: number;
  /** 카드 높이. 지표 카드는 낮고 내용 카드는 높다 */
  height?: "sm" | "md" | "lg";
  /** 넓은 화면에서 몇 열로 깔릴지 */
  columns?: 3 | 4;
  filters?: boolean;
  actions?: boolean;
  /** 머리를 그릴지. 한 화면에 격자를 두 벌 쌓을 때 아래쪽은 끈다 */
  head?: boolean;
};

const CARD_HEIGHT = { sm: "h-28", md: "h-40", lg: "h-56" } as const;
const CARD_COLUMNS = {
  3: "sm:grid-cols-2 xl:grid-cols-3",
  4: "sm:grid-cols-2 xl:grid-cols-4",
} as const;

/** 카드가 격자로 깔리는 화면 */
export function CardGridSkeleton({
  count = 6,
  height = "md",
  columns = 3,
  filters = false,
  actions = true,
  head = true,
}: CardGridProps) {
  const grid = (
    <section className={`grid gap-4 ${CARD_COLUMNS[columns]}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${CARD_HEIGHT[height]} qd-skeleton border`} />
      ))}
    </section>
  );

  if (!head) return grid;

  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-5">
      <SkeletonHead actions={actions} />
      {filters ? <Filters /> : null}
      {grid}
    </div>
  );
}

type DetailProps = {
  /** 본문 블록 수 */
  blocks?: number;
  /** 오른쪽 곁 단을 그릴지. 상세 화면 대부분이 2:1 로 나뉜다 */
  aside?: boolean;
};

/** 목록에서 한 건 눌러 들어가는 상세 화면 */
export function DetailSkeleton({ blocks = 3, aside = true }: DetailProps) {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-5">
      <SkeletonHead />
      <div
        className={
          aside
            ? "grid gap-5 lg:grid-cols-[var(--qd-maison-grid-template-columns-minmax-0-2fr-minmax-0-1fr)]"
            : "grid gap-5"
        }
      >
        <div className="flex flex-col gap-4">
          {Array.from({ length: blocks }).map((_, i) => (
            <div key={i} className={`h-44 ${block}`} />
          ))}
        </div>
        {aside ? (
          <div className="flex flex-col gap-4">
            <div className={`h-32 ${block}`} />
            <div className={`h-52 ${block}`} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

type FormProps = {
  /** 입력 칸 수 */
  fields?: number;
  /** 아래쪽 저장·취소 단추 줄 */
  submit?: boolean;
};

/**
 * 새로 쓰거나 고치거나 들여오는 화면 (new · edit · import).
 *
 * 🔴 이게 없으면 **바로 위 목록 화면의 뼈대가 내려온다.** Next 의 `loading.tsx`
 * 는 그 아래 모든 화면에 적용되므로, `/nc/loading.tsx` 하나가 `/nc/new` 에도
 * 걸려서 입력 폼 자리에 「지표 카드 넉 장 + 표 열 줄」이 떴다가 사라진다.
 */
export function FormSkeleton({ fields = 6, submit = true }: FormProps) {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-5">
      <SkeletonHead actions={false} />
      <div className="flex flex-col gap-4 rounded-md border bg-card p-5">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className={`h-4 w-24 ${line}`} />
            <div className={`w-full ${control}`} />
          </div>
        ))}
      </div>
      {submit ? (
        <div className="flex justify-end gap-2">
          <div className={`w-20 ${control}`} />
          <div className={`w-24 ${control}`} />
        </div>
      ) : null}
    </div>
  );
}

type TreeProps = {
  /** 가지 수 */
  branches?: number;
};

/** 문서 체계도처럼 세로로 접히는 나무 화면 */
export function TreeSkeleton({ branches = 6 }: TreeProps) {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-5">
      <SkeletonHead />
      <div className="flex flex-col gap-3">
        {Array.from({ length: branches }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className={`h-10 w-full ${block}`} />
            <div className="ml-6 flex flex-col gap-2">
              <div className={`h-8 w-3/4 ${block}`} />
              <div className={`h-8 w-2/3 ${block}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

type BoardProps = {
  /** 칸마다 놓을 카드 수 */
  cards?: number;
};

/**
 * 칸이 가로로 늘어서는 판 (결재 흐름판).
 * 칸 수는 실제 화면이 네 칸 고정(`workflow/page.tsx` 의 `COLUMNS`)이라 여기서도
 * 넷으로 둔다. 칸 수를 받는 자리를 만들어 두면 넘겨도 반영되지 않아
 * (Tailwind 는 `grid-cols-${n}` 을 못 만든다) 나중에 거짓말이 된다.
 */
const BOARD_COLUMNS = 4;

export function BoardSkeleton({ cards = 3 }: BoardProps) {
  return (
    <div role="status" aria-label="불러오는 중" className="flex flex-col gap-5">
      <SkeletonHead />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: BOARD_COLUMNS }).map((_, col) => (
          <div key={col} className="space-y-2">
            <div className={`h-5 w-24 ${line}`} />
            <div className="space-y-2">
              {Array.from({ length: cards }).map((_, row) => (
                <div key={row} className={`h-24 ${block}`} />
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
