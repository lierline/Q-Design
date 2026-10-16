/* ---------------------------------------------------------------------------
   강조색 한 개에서 나오는 단계들 (계산만 · DB 도 node 도 부르지 않는다)

   ── 왜 lib/brand.ts 에서 떼어 냈는가 (2026-09-14 · 원본 3f8160d 의 방법을 우리 파생에 적용) ──
   파생은 원래 lib/brand.ts 안에 있었다. 그런데 그 파일은 DB 를 부르므로(withActor)
   브라우저에서 부를 수 없다. 회사 표시 화면이 **고른 색에서 무엇이 나오는지 그
   자리에서 보여 주려면** 같은 계산이 화면에도 있어야 한다. 화면이 자기 계산을
   따로 두면 두 벌이 되고 두 벌은 갈라진다. 그래서 계산만 여기로 옮기고
   brand.ts 가 다시 내보낸다. 부르는 자리는 그대로다.

   파생 자체는 우리 것이다(다크 = raiseOn · 라이트 = lowerOn · 어두운 면은 강조색에서
   파생하지 않는다). 원본의 파생(어두운 면까지 강조색에서)은 들이지 않았다.
   check-theme 계약 4 가 이 파일을 본다.
--------------------------------------------------------------------------- */

import { CARNET_PALETTE } from './design/q-design-palette';

function toRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const hex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v)))
    .toString(16).padStart(2, '0')).join('');

/** 흰색 쪽으로 t 만큼 (0=그대로 1=흰색) */
const lighten = ([r, g, b]: [number, number, number], t: number) =>
  hex(r + (255 - r) * t, g + (255 - g) * t, b + (255 - b) * t);

/** 검정 쪽으로 t 만큼 */
const darken = ([r, g, b]: [number, number, number], t: number) =>
  hex(r * (1 - t), g * (1 - t), b * (1 - t));

/** 다른 색 쪽으로 t 만큼. 다크의 옅은 바탕은 흰색이 아니라 «어두운 면» 쪽으로 간다 */
const mix = (a: [number, number, number], b: [number, number, number], t: number) =>
  hex(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);

/** globals.css 의 다크 --dhr-canvas. 옅은 바탕을 섞을 대상 */
const DARK_CANVAS = CARNET_PALETTE.darkCanvas;
/** globals.css 의 다크 --dhr-surface. 카드 위에서도 갈려야 한다 */
const DARK_SURFACE = CARNET_PALETTE.darkSurface;
/*
 * globals.css 의 라이트 --dhr-surface-low.
 *
 * 흰 카드(#ffffff)가 아니라 **가장 어두운 밝은 면** 을 기준으로 잡는다.
 * 흰색 기준으로 내렸더니 5.02 였는데, 강조색 글자가 실제로 앉는 자리 중에는
 * 눌린 칸(#f4f2ee)이 있어 거기서 4.49 로 떨어졌다 (2026-09-09 실측).
 *
 * 대비는 «가장 불리한 자리» 로 잡아야 한다. 평균으로 잡으면 어딘가는 못 넘는다.
 */
const LIGHT_SURFACE = CARNET_PALETTE.lightSurface;

/* ---------------------------------------------------------------------------
   대비를 계산해서 맞춘다 (2026-09-09)

   전에는 "바탕은 아주 밝게 · 글자는 아주 어둡게" 로 고정해 어떤 강조색이 와도
   읽히게 했다. 라이트 한 벌뿐이라 그것으로 됐다.

   다크가 생기면서 그 방법이 무너진다. 제조소가 짙은 자주(#562C8D)를 넣으면
   그 색 자체가 #0c0c0c 위에서 2.2:1 이다. 강조색으로 쓴 글자와 테두리가
   보이지 않는다. 밝기를 미리 정할 수 없으므로 **재서 맞춘다.**

   WCAG 상대휘도로 대비를 구하고, 목표에 닿을 때까지 흰색 쪽으로 한 걸음씩
   민다. 이미 넘으면 손대지 않는다 - 밝은 색을 넣은 제조소의 색을 괜히
   바래게 하지 않는다.
--------------------------------------------------------------------------- */

/** WCAG 상대휘도 */
function luminance([r, g, b]: [number, number, number]): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** 두 색의 대비비 (1 ~ 21) */
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(toRgb(a)), luminance(toRgb(b))];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * `color` 가 `bg` 위에서 `want` 대비를 넘도록 흰색 쪽으로 민다.
 * 흰색까지 가도 못 넘으면 갈 수 있는 데까지만 간다 - 지어내지 않는다.
 */
function raiseOn(color: string, bg: string, want: number): string {
  if (contrast(color, bg) >= want) return color;
  const rgb = toRgb(color);
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = lighten(rgb, t);
    if (contrast(c, bg) >= want) return c;
  }
  return '#ffffff';
}

/**
 * 같은 일을 반대쪽으로. 밝은 바탕에서 안 읽히는 색을 검정 쪽으로 내린다.
 *
 * 다크만 고치고 라이트를 안 고치면 반쪽이다. 샴페인(#b8935a)이 바로 그런
 * 색이다 - 어두운 바탕에서 6.86 인데 흰 바탕에서는 2.34 라, 그 금으로 쓴
 * 글자와 테두리가 라이트에서 사라진다.
 */
function lowerOn(color: string, bg: string, want: number): string {
  if (contrast(color, bg) >= want) return color;
  const rgb = toRgb(color);
  for (let t = 0.05; t <= 1; t += 0.05) {
    const c = darken(rgb, t);
    if (contrast(c, bg) >= want) return c;
  }
  return '#000000';
}

/**
 * 설치 앱이 뜨는 동안의 바탕(매니페스트 background_color). 기본이 다크이므로 어두운 값을 낸다.
 * 상단 바(주소창 · 설치 앱 제목 줄) 색은 2026-09-29 부터 여기서 만들지 않는다. 아이콘 구리색에서
 * 나온 고정값이다(app/layout.tsx 의 viewport 주석).
 */
export function darkTone(color: string): string {
  const source = color.toLowerCase() === DEFAULT_BRAND_COLOR ? CARNET_PALETTE.defaultBrandColor : color;
  return mix(toRgb(source), toRgb(DARK_CANVAS), 0.86);
}
/* ---------------------------------------------------------------------------
   강조색 한 개에서 일곱 단계

   globals.css 가 쓰는 이름 그대로 만든다. 이름은 두 테마가 같고 값만 다르다.

     brand       그 색 (다크에서는 대비까지 올린 값)
     deep        더 눈에 띄는 쪽. 제목 · 눌린 상태
     mid         한 칸 물러난 쪽. 보조
     soft/tint   아주 옅은 바탕
     line        테두리
     pale        비활성

   ── 라이트와 다크는 «반대로» 간다 ────────────────────────────────────────
   라이트에서 옅은 바탕은 흰색 쪽이고 제목은 검정 쪽이다. 다크에서 그대로 두면
   카드 안에 흰 판이 깔리고 제목이 바탕에 묻는다. 그래서 옅은 바탕은 «어두운
   면» 쪽으로 섞고, deep 은 어둡게가 아니라 밝게 간다.

   🔴 내보내는 이름이 `--dhr-*` 인 것이 중요하다. Tailwind 4 의 `@theme inline`
   이 유틸리티를 `var(--dhr-brand)` 로 내보내므로, 예전처럼 `--color-brand` 를
   덮어쓰면 **아무 일도 일어나지 않는다.**
--------------------------------------------------------------------------- */


export function lightVars(color: string): string {
  /* 밝은 바탕에서 읽히는 데까지 내린 값이 이 테마의 강조색이다 */
  const base = lowerOn(color, LIGHT_SURFACE, CARNET_PALETTE.minimumContrast);
  const rgb = toRgb(base);
  return [
    `--dhr-brand:${base}`,
    `--dhr-brand-deep:${darken(rgb, 0.28)}`,
    `--dhr-brand-mid:${lighten(rgb, 0.22)}`,
    `--dhr-brand-soft:${lighten(rgb, 0.94)}`,
    `--dhr-brand-tint:${lighten(rgb, 0.91)}`,
    `--dhr-brand-line:${lighten(rgb, 0.7)}`,
    `--dhr-brand-pale:${lighten(rgb, 0.45)}`,
    /*
     * 🔴 어두운 면은 강조색에서 파생하지 않는다 (2026-09-09).
     *
     * 전에는 강조색을 어둡게 해서 머리띠를 만들었다. 그러면 제조소가 어떤 색을
     * 넣든 그 색의 «흙탕 버전» 이 화면 위쪽 넓은 면에 깔린다. 실제로 금에서
     * 만든 머리띠가 올리브색이 되어 "색상 진짜 너무 후지다" 는 말을 들었다.
     *
     * 면은 중성으로 두고 강조색은 좁은 자리(헤어라인 · 초점 · 지금 있는 자리)
     * 에만 쓴다. globals.css 의 --dhr-indigo* 를 그대로 둔다.
     */
  ].join(';');
}

export function darkVars(color: string): string {
  /* 어두운 바탕에서 읽히는 데까지 올린 값이 이 테마의 강조색이다 */
  const base = raiseOn(color, DARK_CANVAS, CARNET_PALETTE.minimumContrast);
  const rgb = toRgb(base);
  const canvas = toRgb(DARK_CANVAS);
  const surface = toRgb(DARK_SURFACE);
  return [
    `--dhr-brand:${base}`,
    `--dhr-brand-deep:${lighten(rgb, 0.18)}`,
    `--dhr-brand-mid:${darken(rgb, 0.18)}`,
    /* 옅은 «바탕». 흰색이 아니라 어두운 면 쪽으로 섞는다 */
    `--dhr-brand-soft:${mix(rgb, canvas, 0.92)}`,
    `--dhr-brand-tint:${mix(rgb, surface, 0.88)}`,
    `--dhr-brand-line:${mix(rgb, surface, 0.62)}`,
    `--dhr-brand-pale:${mix(rgb, surface, 0.38)}`,
    /* 어두운 면은 강조색에서 파생하지 않는다 (위 lightVars 주석) */
  ].join(';');
}

/** Existing brand declarations remain for paper. Screen defaults come from
 * Q-Design; a manufacturer color adds separate override variables. The historic
 * default is a sentinel so changing Q-Design's default does not require DB edits. */
export const DEFAULT_BRAND_COLOR = '#b8935a';
export function companyBrandVars(color: string, theme: 'dark' | 'light'): string {
  const values = theme === 'dark' ? darkVars(color) : lightVars(color);
  return color.toLowerCase() === DEFAULT_BRAND_COLOR
    ? values
    : `${values};${values.replaceAll('--dhr-brand', '--qd-company-brand')}`;
}


/* ---------------------------------------------------------------------------
   미리보기용: 고른 색에서 두 테마가 각각 무엇을 만드는가
   회사 표시 화면이 이 목록을 그대로 그린다. 저장 뒤 화면을 옮겨 다니지 않아도
   어두운 면 · 밝은 면에 무엇이 깔릴지 그 자리에서 보인다.
--------------------------------------------------------------------------- */
export interface Step { name: string; label: string; value: string }
const STEP_LABEL: Record<string, string> = {
  brand: '강조', deep: '제목 · 눌림', mid: '보조', soft: '옅은 바탕', tint: '바탕', line: '테두리', pale: '비활성',
};
function parseVars(vars: string): Step[] {
  return vars.split(';').filter(Boolean).map((kv) => {
    const [k, v] = kv.split(':');
    const name = k.replace('--dhr-brand', '').replace(/^-/, '') || 'brand';
    return { name, label: STEP_LABEL[name] ?? name, value: v };
  });
}
export function brandSteps(color: string): { dark: Step[]; light: Step[]; darkCanvas: string; lightSurface: string } {
  return { dark: parseVars(darkVars(color)), light: parseVars(lightVars(color)), darkCanvas: DARK_CANVAS, lightSurface: LIGHT_SURFACE };
}
