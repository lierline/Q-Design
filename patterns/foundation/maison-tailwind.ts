import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import defaultColors from "tailwindcss/colors";

/**
 * Q-Maison utility canon. Edit this Q-Design source, then sync the stamped copy.
 * Default scales are composed here at build time; screen scales use live Q-Design
 * variables. Categorical palette families retain their established distinctions.
 * Product content paths and plugins stay in the product configuration.
 */
const qDesignMaison: Config = {
  content: [],
  theme: {
    ...defaultTheme,
    colors: {
      inherit: "inherit", current: "currentColor", transparent: "transparent",
      black: defaultColors.black, white: defaultColors.white,
      ...Object.fromEntries(
        ["slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber", "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"].map(name => [name, defaultColors[name as keyof typeof defaultColors]]),
      ),
    },
    /*
     * 줄 간격 · 굵기는 기본값을 덮어쓰고(extend 아님) 정한 값만 남긴다(2026-10-26 오너 결정).
     * 줄 간격은 1 · 1.2 · 1.4 · 1.6, 굵기는 400 · 500 · 600. 없앤 이름(font-bold · leading-normal ·
     * leading-6 같은 숫자)은 클래스가 생기지 않으므로, 제품 계약 시험이 화면 코드에서 막는다.
     */
    lineHeight: Object.fromEntries(
      ["none", "tight", "snug", "relaxed"].map((key) => [key, `var(--qd-leading-${key})`]),
    ),
    fontWeight: Object.fromEntries(
      ["normal", "medium", "semibold"].map((weight) => [weight, `var(--qd-font-weight-${weight})`]),
    ),
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Every standard spacing utility follows the shared scale, including fractions.
      spacing: Object.fromEntries(
        Object.keys(defaultTheme.spacing).map((key) => [
          key,
          key === "px"
            ? "var(--qd-border-width, 1px)"
            : `calc(var(--qd-spacing-unit) * ${Number(key)})`,
        ]),
      ),
      /**
       * 「한 화면」: 대시보드가 스크롤 없이 한 판에 서는 조건
       * (오빠 지시 2026-09-20 「스크롤 없이 한 화면에 다 담아줄 수 있나요?」).
       *
       * 가로만 보면 안 된다: 1280×720 노트북에서 억지로 채우면 달력의 마지막 주가
       * 잘린다. 세로 860 이상일 때만 켜고, 그 아래에서는 전처럼 굴러 내린다.
       */
      screens: {
        onescreen: { raw: "(min-width: 1280px) and (min-height: 860px)" },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          // 채워진 버튼 면 전용: 다크에서 잉크(DEFAULT)와 방향이 갈리기 때문에 분리했다
          surface: "hsl(var(--destructive-surface))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 기존 업무 클래스 이름은 유지하고, 색은 Q-Design 생성 팔레트를 받는다.
        // 고정 테마 의미도 유지한다: forest는 라이트 잉크, cream은 라이트 바탕,
        // forestLogo는 로고의 어두운 면이다. 테마·토큰 대응은 중앙 매핑이 소유한다.
        // alpha-value를 남겨 bg-brand-copper/15 같은 기존 투명도를 보존한다.
        brand: {
          forest: "hsl(var(--qw-legacy-brand-forest) / <alpha-value>)",
          forestDark: "hsl(var(--qw-legacy-brand-forest-dark) / <alpha-value>)",
          forestLight: "hsl(var(--qw-legacy-brand-forest-light) / <alpha-value>)",
          forestPale: "hsl(var(--qw-legacy-brand-forest-pale) / <alpha-value>)",
          forestLogo: "hsl(var(--qw-legacy-brand-forest-logo) / <alpha-value>)",
          copper: "hsl(var(--qw-legacy-brand-copper) / <alpha-value>)",
          copperLight: "hsl(var(--qw-legacy-brand-copper-light) / <alpha-value>)",
          copperDark: "hsl(var(--qw-legacy-brand-copper-dark) / <alpha-value>)",
          cream: "hsl(var(--qw-legacy-brand-cream) / <alpha-value>)",
          whiteGray: "hsl(var(--qw-legacy-brand-white-gray) / <alpha-value>)",
          coolGray: "hsl(var(--qw-legacy-brand-cool-gray) / <alpha-value>)",
          pink: "hsl(var(--qw-legacy-brand-pink) / <alpha-value>)",
          pinkDark: "hsl(var(--qw-legacy-brand-pink-dark) / <alpha-value>)",
          ink: "hsl(var(--qw-legacy-brand-ink) / <alpha-value>)",
        },
        /* 정본 상태색. 테마를 따라가도록 CSS 변수로 받는다.
           `bg-state-green/10` 처럼 투명도 수정자도 그대로 쓸 수 있다. */
        state: {
          green: "hsl(var(--qw-state-green) / <alpha-value>)",
          copper: "hsl(var(--qw-state-copper) / <alpha-value>)",
          red: "hsl(var(--qw-state-red) / <alpha-value>)",
          cobalt: "hsl(var(--qw-state-cobalt) / <alpha-value>)",
          violet: "hsl(var(--qw-state-violet) / <alpha-value>)",
          gray: "hsl(var(--qw-state-gray) / <alpha-value>)",
          gold: "hsl(var(--qw-state-gold) / <alpha-value>)",
        },
        status: {
          draft: "hsl(var(--qw-legacy-status-draft) / <alpha-value>)",
          review: "hsl(var(--qw-legacy-status-review) / <alpha-value>)",
          approved: "hsl(var(--qw-legacy-status-approved) / <alpha-value>)",
          published: "hsl(var(--qw-legacy-status-published) / <alpha-value>)",
          rejected: "hsl(var(--qw-legacy-status-rejected) / <alpha-value>)",
          obsolete: "hsl(var(--qw-legacy-status-obsolete) / <alpha-value>)",
        },
        severity: {
          critical: "hsl(var(--qw-legacy-severity-critical) / <alpha-value>)",
          major: "hsl(var(--qw-legacy-severity-major) / <alpha-value>)",
          minor: "hsl(var(--qw-legacy-severity-minor) / <alpha-value>)",
        },
      },
      /**
       * 판 · 단추 · 입력칸 · 사각 배지는 모두 중앙 모서리를 따른다.
       * 2026-10-11 폰 화면 검토: sm 이름도 별도 6px 대신 같은 10px 규칙이다.
       *
       * shadcn 의 `md = radius - 2px` 를 걷었다. 그 2px 때문에 단추와 입력칸만
       * 판보다 덜 둥글었다(7.375px). 정본은 «작은 조작부까지 전부 10» 이다
       * (오너 결정 2026-09-24).
       */
      borderRadius: {
        none: "0px",
        DEFAULT: "var(--qd-radius)",
        sm: "var(--qd-radius)",
        md: "var(--qd-radius)",
        lg: "var(--qd-radius)",
        xl: "var(--qd-radius)",
        "2xl": "var(--qd-radius)",
        "3xl": "var(--qd-radius)",
        full: "var(--qd-radius-circle, 9999px)",
      },
      fontSize: {
        xs: ["var(--qd-caption-size)", { lineHeight: "var(--qd-leading-xs)" }],
        sm: ["var(--qd-body-size)", { lineHeight: "var(--qd-leading-sm)" }],
        base: ["var(--qd-font-size-16)", { lineHeight: "var(--qd-leading-base)" }],
        lg: ["var(--qd-font-size-18)", { lineHeight: "var(--qd-leading-lg)" }],
        xl: ["var(--qd-font-size-20)", { lineHeight: "var(--qd-leading-xl)" }],
        "2xl": ["var(--qd-font-size-24)", { lineHeight: "var(--qd-leading-2xl)" }],
        "3xl": ["var(--qd-font-size-32)", { lineHeight: "var(--qd-leading-3xl)" }],
        "4xl": ["var(--qd-font-size-40)", { lineHeight: "var(--qd-leading-4xl)" }],
        "5xl": ["var(--qd-font-size-48)", { lineHeight: "var(--qd-leading-display)" }],
        "6xl": ["var(--qd-font-size-60)", { lineHeight: "var(--qd-leading-display)" }],
        "7xl": ["var(--qd-font-size-72)", { lineHeight: "var(--qd-leading-display)" }],
        "8xl": ["var(--qd-font-size-96)", { lineHeight: "var(--qd-leading-display)" }],
        "9xl": ["var(--qd-font-size-128)", { lineHeight: "var(--qd-leading-display)" }],
      },
      // Includes tailwindcss-animate's default duration and transition-[r].
      transitionDuration: {
        DEFAULT: "var(--qd-maison-motion-default)",
      },
      boxShadow: {
        sm: "var(--qd-shadow-sm, none)",
        DEFAULT: "var(--qd-shadow-sm, none)",
        md: "var(--qd-shadow-md, none)",
        lg: "var(--qd-shadow-overlay)",
        xl: "var(--qd-shadow-overlay)",
        "2xl": "var(--qd-shadow-overlay)",
        inner: "var(--qd-shadow-inner, inset 0 2px 4px 0 rgb(0 0 0 / .05))",
      },
      fontFamily: {
        sans: ["var(--qd-font-family-ui)"],
        wordmark: ["var(--qd-font-family-brand)"],
        mono: ["var(--qd-font-family-mono)"],
      },
      letterSpacing: {
        ...Object.fromEntries(
          ["tighter", "tight", "normal", "wide", "wider", "widest"].map(
            (tracking) => [tracking, `var(--qd-tracking-${tracking})`],
          ),
        ),
        wordmark: "var(--qd-brand-tracking, 0.22em)", // 로고 워드마크 비례
        wordmarkLg: "var(--qd-brand-tracking-wide, 0.32em)", // 워드마크 부속 라인
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down var(--qd-motion-normal) ease-out",
        "accordion-up": "accordion-up var(--qd-motion-normal) ease-out",
      },
    },
  },
};

export default qDesignMaison;
