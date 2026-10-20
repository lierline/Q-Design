// =============================================================================
// Q-Design 차림표(사이드바) 정본 추출기
// =============================================================================
// Q-Atelier 의 `source/components/Sidebar.tsx` 를 «읽어» 차림표의 치수를 뽑고,
// 프레임워크 무관 CSS 한 벌을 만듭니다.
//
//   node tools/extract-nav.mjs
//
// 산출물
//   dist/q-design.nav.json   치수와 그 근거(원본의 어느 줄에서 나왔는가)
//   dist/q-design.nav.css    Q-Sonar · Q-Forge 가 그대로 링크하는 클래스 한 벌
//
// ── 왜 손으로 안 베끼는가 ─────────────────────────────────────────────────────
// 같은 숫자를 세 저장소에 적으면 세 값이 됩니다. 「11px 14px」 하나가 어긋나도
// 나란히 놓았을 때 «다른 제품» 으로 읽힙니다. 그래서 숫자는 여기 한 곳에서만
// 나오고, 원본이 바뀌면 아래 탐침(probe)이 «못 찾았다» 며 웁니다.
//
// ── 탐침의 규칙 ───────────────────────────────────────────────────────────────
// 각 탐침은 지정한 구역 안에서 **정확히 한 번** 맞아야 합니다.
//   0번  원본이 바뀐 것입니다. 값을 옮겨 적지 말고 탐침을 고치세요.
//   2번+ 구역이 너무 넓은 것입니다. 어느 쪽 값인지 모르는 채로 뽑으면 안 됩니다.
// =============================================================================

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, emitDone, CHECK } from './emit.mjs';
import { loadQdValues } from './qd-adapter-values.mjs';
import { read } from './probe.mjs';
import { readRuntimeValues } from './atelier-runtime-values.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const runtime = readRuntimeValues(ROOT);
const OUT = join(ROOT, 'dist');
const SIDEBAR = join(ROOT, 'source', 'components', 'Sidebar.tsx');
const GLOBALS = join(ROOT, 'source', 'css', 'globals.css');
const LOGOUT_HINT = 'LogoutButton → TextAction (글귀 · 오너 결정 2026-09-28)';

const sidebar = read(SIDEBAR);
const globals = read(GLOBALS);
// 2026-10-07 원본 묶음 5(2e56225a)가 차림표 안의 IconBtn 사본을 걷고 공용 IconBtn(components.tsx)을
// 쓰게 했다. 치수(기본 44 = TOUCH.min)는 공용 부품에서, 모서리는 차림표가 넘기는 RAIL_ICON_BTN 에서 읽는다.
const components = read(join(ROOT, 'source', 'components', 'components.tsx'));
const tokensTs = read(join(ROOT, 'source', 'tokens', 'tokens.ts'));
const touch = Object.fromEntries(
  [...slice(tokensTs, 'export const TOUCH = {', '} as const', 'touch').matchAll(/^\s+(\w+):\s*(\d+)/gm)].map(([, k, v]) => [k, Number(v)]),
);
const tokens = JSON.parse(readFileSync(join(OUT, 'q-design.tokens.json'), 'utf8'));
const qd = loadQdValues(ROOT);

// ── 구역 자르기 ──────────────────────────────────────────────────────────────
// 파일 전체에 정규식을 걸면 접힘 상태 값과 펼침 상태 값이 섞입니다.
// (접힌 레일과 펼친 레일이 같은 속성을 다른 값으로 씁니다. 아이콘 18 · 16 이 그렇습니다.)
function slice(text, from, to, what) {
  const a = text.indexOf(from);
  if (a < 0) throw new Error(`구역 시작을 못 찾았습니다 [${what}]: ${from}`);
  const b = text.indexOf(to, a + from.length);
  if (b < 0) throw new Error(`구역 끝을 못 찾았습니다 [${what}]: ${to}`);
  return text.slice(a, b);
}

const Z = {
  // 시작 표지는 «주석에도 나오는 낱말» 이면 안 됩니다. 파일 머리의 설명문에
  // data-coachmark="sidebar" 가 한 번 더 있어, 그것부터 자르면 모바일 서랍
  // wrapper 까지 구역에 들어옵니다 (100dvh 가 두 번 잡혔습니다).
  aside: slice(sidebar, '      data-coachmark="sidebar"\n      className="qa-sidebar-aside"', '{/* Nav: 데스크톱은', 'aside'),
  navEl: slice(sidebar, '<nav\n        ref={navRef}', '{isExpert ? (', 'nav'),
  brand: slice(sidebar, '{/* Logo: flexShrink:0.', '{/* Nav: 데스크톱은', 'brand'),
  itemConst: slice(sidebar, "const NAV_ITEM_PADDING", 'function NavLink(', 'itemConst'),
  // 항목 하나가 네 조각(링크 · 아이콘 · 선택 밑줄 · 배지)이고 조각마다 치수가
  // 있습니다. 한 구역으로 두면 어느 값인지 모르는 채로 뽑게 됩니다.
  itemLink: slice(sidebar, "key={`${href}-${active ? 'active' : 'idle'}`}", '      <span\n        aria-hidden', 'itemLink'),
  itemIcon: slice(sidebar, '      <span\n        aria-hidden', "<span style={{ flex: 1, position: 'relative' }}>", 'itemIcon'),
  // 2026-09-27 «문서 결»(docs/08-paper.md): 왼쪽 금막대 · 오른쪽 금점 대신 글자 밑 짧은 금색 선
  itemMark: slice(sidebar, 'className="qa-nav-active-underline"', '/>', 'itemMark'),
  // 앞에 줄바꿈을 붙입니다. 들여쓰기만 다른 접힘 상태의 같은 줄(8칸)이
  // 6칸짜리 표지를 부분 문자열로 품고 있어, 그것부터 잘려 배지가 둘 잡혔습니다.
  itemBadge: slice(sidebar, '\n      {badge !== undefined && (', '/* ─── Subcomponents', 'itemBadge'),
  group: slice(sidebar, 'function SectionHeader(', '카테고리별 접기', 'group'),
  version: slice(sidebar, '{/* Rule Engine 버전', '{/* Theme + Collapse 행', 'version'),
  theme: slice(sidebar, "              flex: 1,\n              background: 'transparent',", '<span style={{ whiteSpace:', 'theme'),
  foot: slice(sidebar, '{/* Footer (avatar + logout)', '</aside>', 'foot'),
  // 공용 IconBtn 의 시그니처 구역(기본 size). 호버 핸들러 앞에서 끊는다.
  iconBtn: slice(components, 'export function IconBtn(', 'onMouseEnter', 'iconBtn'),
  // 차림표가 공용 IconBtn 에 넘기는 모서리(테마 상자와 같은 값).
  railIconBtn: slice(sidebar, 'const RAIL_ICON_BTN', 'function ChevronIcon(', 'railIconBtn'),
};

// ── 탐침 ─────────────────────────────────────────────────────────────────────
const PROBES = [
  // 레일
  ['rail.width',            Z.aside,  /const?\s*/, null], // 자리표. 아래에서 덮어씁니다
  ['rail.drawerWidth',      Z.aside,  /width: isMobile \? (\d+) : width,/, Number],
  ['rail.padding',          Z.aside,  /padding: isMobile \|\| !collapsed \? '([^']+)' : '[^']+',/, String],
  ['rail.paddingCollapsed', Z.aside,  /padding: isMobile \|\| !collapsed \? '[^']+' : '([^']+)',/, String],
  ['rail.height',           Z.aside,  /height: '(100dvh)',/, String],
  ['rail.borderRightWidth', Z.aside,  /borderRight: `(\d+)px solid \$\{T\.border\}`,/, Number],

  // 로고 블록
  ['brand.logoSize',        Z.brand,  /<Logo size=\{(\d+)\}/, Number],
  ['brand.markSize',        Z.brand,  /<LogoMark size=\{(\d+)\} \/>/, Number],
  ['brand.orgFontSize',     Z.brand,  /fontSize: FS\[(\d+)\],/, qd.font],
  // 조직명도 labelTracking 을 거칩니다(2026-09-09). 한글 회사 이름이 흔합니다.
  ['brand.orgTracking',     Z.brand,  /letterSpacing: labelTracking\([^,]+, ([\d.]+)\),/, Number],

  // nav 스크롤 구역
  ['nav.gap',               Z.navEl,  /gap: collapsed && !isMobile \? 0 : (\d+),/, Number],

  // 항목
  ['item.padding',          Z.itemConst, /const NAV_ITEM_PADDING = '([^']+)';/, String],
  ['item.gap',              Z.itemLink, /gap: S\[([\d.]+)\],/, qd.step],
  ['item.fontSize',         Z.itemLink, /fontSize: FS\[(\d+)\],/, qd.font],
  ['item.tracking',         Z.itemLink, /letterSpacing: ([\d.]+),/, Number],
  ['item.activeWeight',     Z.itemLink, /fontWeight: active \? (\d+) : \d+,/, Number],
  ['item.idleWeight',       Z.itemLink, /fontWeight: active \? \d+ : (\d+),/, Number],
  // 금막대가 차지하던 3px 를 왼쪽 여백으로 돌렸습니다(글자 자리가 그대로입니다).
  ['item.paddingLeft',      Z.itemLink, /paddingLeft: (\d+),/, Number],
  ['item.iconBox',          Z.itemIcon, /width: (\d+),\n          height: \d+,/, Number],
  ['item.iconGlyph',        Z.itemIcon, /<Icon size=\{(\d+)\} strokeWidth=\{[\d.]+\} \/>/, Number],
  ['item.iconStroke',       Z.itemIcon, /<Icon size=\{\d+\} strokeWidth=\{([\d.]+)\} \/>/, Number],
  ['item.markWidth',        Z.itemMark, /width: (\d+),/, Number],
  ['item.markHeight',       Z.itemMark, /height: ([\d.]+),/, Number],
  ['item.markOffset',       Z.itemMark, /bottom: (-?\d+),/, Number],
  ['item.markRadius',       Z.itemMark, /borderRadius: (\d+),/, Number],
  ['item.badgePadding',     Z.itemBadge, /padding: '(\d+px \d+px)',/, String],

  // 묶음 이름표
  ['group.padding',         Z.group,  /padding: '([^']+)',/, String],
  ['group.fontSize',        Z.group,  /fontSize: FS\[(\d+)\],/, qd.font],
  // 2026-09-09 이후 이 자리는 labelTracking 을 거칩니다. 한글 라벨이면 0 이고
  // 라틴이면 아래 값입니다. 정본 CSS 는 `data-hangul` 로 같은 갈래를 만듭니다.
  ['group.tracking',        Z.group,  /letterSpacing: labelTracking\(label, ([\d.]+)\),/, Number],

  // 판 번호 줄
  ['version.padding',       Z.version, /padding: '([^']+)',/, String],
  ['version.fontSize',      Z.version, /fontSize: FS\[(\d+)\],/, qd.font],
  ['version.tracking',      Z.version, /letterSpacing: ([\d.]+),/, Number],

  // 테마 줄
  ['theme.padding',         Z.theme,  /padding: '([^']+)',/, String],
  ['theme.fontSize',        Z.theme,  /fontSize: FS\[(\d+)\],/, qd.font],
  ['theme.tracking',        Z.theme,  /letterSpacing: ([\d.]+),/, Number],
  ['theme.btnSize',         Z.iconBtn, /size = TOUCH\.(\w+),/, (k) => touch[k]],
  // 2026-09-14 오빠 결정 「전체를 다 굴린다」: 발치 상자·아이콘 단추의 모서리를 원본에서 읽는다 (RADIUS.<키> → px).
  ['theme.radius',          Z.theme,  /borderRadius: (QD\.radius|RADIUS\.\w+),/, qd.pixels],
  ['iconBtn.radius',        Z.railIconBtn, /borderRadius: (QD\.radius|RADIUS\.\w+) \}/, qd.pixels],

  // 바닥 계정 블록
  // 2026-10-06 프로필 사진(da7c60f5)이 userId · avatarVersion 을 뒤에 더했다. 펼친 발치(뒤에 <div>)만 잡는다.
  ['foot.avatarSize',       Z.foot,   /<Avatar name=\{userName\} email=\{userEmail\} size=\{(\d+)\}[^\n]*\/>\n              <div/, Number],
  ['foot.nameFontSize',     Z.foot,   /fontSize: FS\[(\d+)\],\n                    color: T\.text,/, qd.font],
  ['foot.metaFontSize',     Z.foot,   /fontSize: FS\[(\d+)\],\n                    color: T\.muted,/, qd.font],
  ['foot.metaTracking',     Z.foot,   /letterSpacing: labelTracking\([^,]+, ([\d.]+)\),/, Number],
];

const spec = {};

function put(path, value) {
  const parts = path.split('.');
  let node = spec;
  for (const p of parts.slice(0, -1)) node = node[p] ??= {};
  node[parts.at(-1)] = value;
}

for (const [path, zone, re, cast] of PROBES) {
  if (!cast) continue; // 자리표
  const hits = [...zone.matchAll(new RegExp(re.source, re.flags + 'g'))];
  if (hits.length !== 1) {
    throw new Error(
      `탐침이 ${hits.length} 번 맞았습니다 (1 이어야 합니다) [${path}]\n` +
        `  ${re}\n` +
        `  원본이 바뀌었으면 탐침을 고치세요. 값을 여기 적어 넣지 마세요.`,
    );
  }
  put(path, cast(hits[0][1]));
}

// 레일 폭만 삼항식이라 따로 뽑습니다.
{
  const m = sidebar.match(/const width = collapsed \? (\d+) : (\d+);/);
  if (!m) throw new Error('레일 폭(const width = collapsed ? A : B)을 못 찾았습니다.');
  put('rail.widthCollapsed', Number(m[1]));
  put('rail.width', Number(m[2]));
}

// 선택 밑줄이 펼쳐지는 움직임은 globals.css 에 있습니다.
{
  const m = globals.match(
    /@keyframes qa-nav-active-underline-in \{([\s\S]*?)\}\n\.qa-nav-active-underline \{\n\s*transform-origin: ([^;]+);\n\s*animation: qa-nav-active-underline-in (\d+)ms (cubic-bezier\([^)]+\)) 1;/,
  );
  if (!m) throw new Error('선택 밑줄의 펼침 키프레임을 못 찾았습니다.');
  put('item.markOrigin', m[2].trim());
  put('item.markMs', Number(m[3]));
  put('item.markEase', m[4]);
  put('item.markKeyframes', m[1].trim().replace(/\s+/g, ' '));
}

// 로그아웃은 «글귀» 입니다(오너 결정 2026-09-28 · 화면 검토 A09 · M99). 전에는 공용 Btn(secondary · sm)
// 상자였는데, 차림표 발치에서 주 동작처럼 무게를 가졌습니다. 원본 LogoutButton 이 보조 동작 글귀(TextAction)를
// 쓰므로 치수를 거기서 읽습니다. LogoutButton 이 TextAction 을 안 쓰게 되면 여기서 멈춥니다(조용히 옛 값을 내지 않게).
{
  const logout = read(join(ROOT, 'source', 'components', 'LogoutButton.tsx'));
  if (!/<TextAction onClick=\{handleLogout\}>/.test(logout)) {
    throw new Error('LogoutButton 이 TextAction 을 쓰지 않습니다. 정본 .qd-rail-logout 을 다시 정해야 합니다.');
  }
  const ta = read(join(ROOT, 'source', 'components', 'TextAction.tsx'));
  const body = slice(ta, 'export function TextAction(', 'export function TextLinkAction(', 'textAction');
  const pad = body.match(/padding: `0 \$\{S\[([\d.]+)\]\}px`,/);
  const fs = qd.property(body, 'fontSize');
  const mh = qd.property(body, 'minHeight');
  if (!pad) throw new Error('TextAction 의 여백을 못 찾았습니다.');
  put('logout.padding', `0 ${qd.space(pad[1])}px`);
  put('logout.fontSize', qd.pixels(fs));
  put('logout.minHeight', qd.pixels(mh));
  put('logout.fontSizeCss', qd.css(fs));
  put('logout.minHeightCss', qd.css(mh));
  put('logout.touchMin', tokens.space.touch.min);
  put('logout.hint', LOGOUT_HINT);
}

// 아바타 원판은 globals.css 의 .qa-avatar 입니다.
{
  const block = slice(globals, '.qa-avatar {', '}', 'avatar');
  const bg = block.match(/background: (color-mix\([^;]+\));/);
  const weight = block.match(/font-weight: (\d+);/);
  if (!bg || !weight) throw new Error('.qa-avatar 의 값을 못 찾았습니다.');
  put('foot.avatarBackground', bg[1]);
  put('foot.avatarWeight', Number(weight[1]));
}

// ── 검증: 뽑은 값이 말이 되는가 ──────────────────────────────────────────────
// 「없으면 undefined 가 CSS 로 새어 나가 조용히 깨진다」를 여기서 막습니다.
const flat = (o, p = '') =>
  Object.entries(o).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [[`${p}${k}`, v]],
  );
for (const [k, v] of flat(spec)) {
  if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) {
    throw new Error(`값이 비었습니다: ${k}`);
  }
}
if (spec.rail.width <= 0 || spec.rail.widthCollapsed <= 0 || spec.rail.widthCollapsed > spec.rail.width) throw new Error('레일 폭의 크기 관계가 올바르지 않습니다.');
if (!/^\d+(?:\.\d+)?px \d+(?:\.\d+)?px$/.test(spec.item.padding)) throw new Error(`항목 여백이 두 CSS 길이가 아닙니다: ${spec.item.padding}`);

// ── CSS 만들기 ───────────────────────────────────────────────────────────────
const C = tokens.color;
const px = (n) => `${n}px`;

// 색 이름은 프로젝트마다 다릅니다(gold · brand · champagne). 그래서 이 파일은
// `--qd-*` 만 읽고, 바닥값으로 Q-Atelier 의 `--qa-*` 를 겁니다. 둘 다 없을 때
// 쓰는 마지막 값은 여기서 tokens.json 을 보고 «생성» 합니다. 손으로 적지 않습니다.
const bind = (name, qa, mode) => `  --qd-${name}: var(--qd-${name}-src, var(--qa-${qa}, ${C[mode][`--qa-${qa}`]}));`;
const BINDINGS = [
  ['surface', 'surface'],
  ['surface2', 'surface2'],
  ['border', 'border'],
  ['text', 'text'],
  ['subtle', 'subtle'],
  ['muted', 'muted'],
  ['accent', 'champagne'],
  ['on-accent', 'on-accent'],
  ['danger', 'red'],
];
const bindBlock = (mode) => BINDINGS.map(([n, qa]) => bind(n, qa, mode)).join('\n');

/*
 * ── 겹침 사다리 ─────────────────────────────────────────────────────────────
 * 2026-09-09 감사(주제 #9). 사다리에 «칸이 없으면» 층은 숫자를 지어냅니다.
 * Q-Atelier 에서 실측한 결과 Z 를 부르는 곳이 3곳이고 raw zIndex 가 58곳이었고,
 * 390px 화면에서 전역 검색 백드롭(100) 위에 햄버거(150)가 남아 있었습니다.
 *
 * 세 제품이 같은 칸을 부르게 하려면 정본이 그 칸들을 «내보내야» 합니다.
 * 값은 tokens.json 에서 옵니다. 여기서 숫자를 적지 않습니다.
 *
 * 🔴 세 번째 인자(고정값)를 반드시 둡니다. `var(--qd-z-drawer-backdrop)` 만 쓰고
 *    값을 못 찾으면 z-index 가 **auto 로 떨어져 층이 통째로 사라집니다.**
 *    두 제품에는 q-design.tokens.css 가 배달되지 않습니다(sync.mjs 의 PARTS 는
 *    nav·list·screen 세 줄뿐입니다). 그래서 이 파일이 스스로 값을 들고 있어야 합니다.
 */
const 케밥 = (k) => k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase());
const zBlock = Object.entries(runtime.Z ?? tokens.z)
  .map(([k, v]) => `  --qd-z-${케밥(k)}: var(--qd-z-${케밥(k)}-src, var(--qa-z-${케밥(k)}, ${v}));`)
  .join('\n');

const css = `/* =============================================================================
   q-design.nav.css · 차림표 정본
   생성물입니다. 손대지 마세요.  node tools/extract-nav.mjs
   원본: Q-Atelier components/Sidebar.tsx
   =============================================================================

   ── 쓰는 법 ────────────────────────────────────────────────────────────────
   1) 이 파일을 프로젝트에 넣고 전역 CSS 에서 링크하거나 @import 합니다.
   2) 색 이름이 다르면 «잇는 줄» 아홉 개만 적습니다:

        :root {
          --qd-surface-src:  var(--color-panel);
          --qd-surface2-src: var(--color-panel2);
          --qd-border-src:   var(--color-line);
          --qd-text-src:     var(--color-ivory);
          --qd-subtle-src:   var(--color-dim);
          --qd-muted-src:    var(--color-faint);
          --qd-accent-src:   var(--color-gold);
          --qd-on-accent-src:var(--color-onaccent);
          --qd-danger-src:   #c97a7a;
        }

   3) 마크업은 아래 뼈대를 그대로 씁니다. 클래스 이름이 곧 계약입니다.

        <aside class="qd-rail">
          <a class="qd-rail-brand"> …로고… <span class="qd-rail-org">회사</span> </a>
          <nav class="qd-rail-nav">
            <div class="qd-nav-group">묶음</div>
            <a class="qd-nav-item is-active">
              <span class="qd-nav-icon">svg</span>
              <span class="qd-nav-label">이름</span>
            </a>
          </nav>
          <div class="qd-rail-version"><span>Q-SONAR</span><b>v1.0.0</b></div>
          <button class="qd-rail-theme"><span>Theme</span><b>● Dark</b></button>
          <div class="qd-rail-foot">
            <div class="qd-rail-user">
              <span class="qd-avatar">R</span>
              <span class="qd-rail-user-text">
                <span class="qd-rail-user-name">이름</span>
                <span class="qd-rail-user-meta">역할 · 등급</span>
              </span>
            </div>
            <button class="qd-rail-logout">로그아웃</button>
          </div>
        </aside>

   ── 한글 자간 ──────────────────────────────────────────────────────────────
   \`.qd-nav-group\` 은 모노 · 대문자 · 넓은 자간입니다(\`.qd-rail-user-meta\` 는 2026-09-28 부터 한글 본문체).
   그 장치는 «라틴 글자 사이» 를 벌리라고 만든 값이라 한글에 걸면 「묶 음」 처럼
   벌어집니다. 한글이 섞인 글에는 \`data-hangul\` 을 붙이세요. 자간과 대문자가
   함께 풀립니다. (Q-Atelier lib/design/tokens.ts 의 labelTracking 과 같은 규칙)
   ============================================================================= */

:root {
${bindBlock('dark')}
  --qd-font-ui: var(--qd-font-ui-src, var(--qd-font-family-ui, inherit));
  /* 모노 사슬도 손으로 안 적습니다. tokens.json 의 값을 그대로 씁니다 ·
     세 제품이 «같은 얼굴» 을 쓰는 것이 이 파일의 목적 중 하나이고, 그 얼굴
     이름을 여기 따로 적으면 그것부터 갈립니다. */
  --qd-font-mono: var(--qd-font-mono-src, var(--qd-font-family-mono, ${tokens.typography.fontFamily.mono}));
  /* 한글 이름표의 어절 공백을 본문 폭으로 되돌리는 값입니다.
     JetBrains Mono 의 공백은 0.6em, Pretendard 는 0.251em 입니다(실측 · 10px 에서
     6px 대 2.51px). 0.6 - 0.35 = 0.25em 이라 본문과 맞습니다.
     🔴 글꼴을 바꾸지 않고 공백만 되돌립니다. 글꼴을 바꾸면 「생산 로트
     LOT-2026-004」 처럼 한글과 코드가 섞인 이름표에서 코드가 모노를 잃습니다.
     제품이 모노를 바꾸면 그 제품에서 --qd-hangul-word-space-src 로 다시 잽니다. */
  --qd-hangul-word-space: var(--qd-hangul-word-space-src, -0.35em);

  /* 겹침 사다리. 위로 갈수록 «가려지면 안 되는 정도» 입니다.
     제품이 자기 층을 이 칸으로 부르면 세 제품의 겹침 순서가 같아집니다.
     한 칸만 다르게 쓰고 싶으면 --qd-z-<칸>-src 로 덮으세요. */
${zBlock}
}

html[data-theme='light'] {
${bindBlock('light')}
}

/* ── 레일 ──────────────────────────────────────────────────────────────────
   스크롤하는 것은 .qd-rail-nav 이지 레일 전체가 아닙니다. 레일을 통째로
   스크롤로 두면 화면이 낮을 때 로고와 바닥 계정 블록이 같이 밀려 올라가
   «푸터가 없는» 것처럼 보입니다 (Q-Atelier 가 M-16 으로 고친 자리입니다). */
.qd-rail {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: ${px(spec.rail.width)};
  /* 레일 위에 무언가 놓인 제품이 있습니다(경고 띠 등). 그만큼 빼지 않으면
     레일 아래 끝이 화면 밖으로 밀려 로그아웃이 잘립니다. 아무것도 없으면 0 입니다.
     쓰는 쪽이 그 높이를 재어 --qd-rail-offset 으로 알려 줍니다. */
  height: calc(${spec.rail.height} - var(--qd-rail-offset, 0px));
  position: sticky;
  top: 0;
  padding: ${spec.rail.padding};
  background: var(--qd-surface);
  border-right: ${px(spec.rail.borderRightWidth)} solid var(--qd-border);
  overflow-x: hidden;
  overflow-y: hidden;
  font-family: var(--qd-font-ui);
}

/* 좁은 화면의 서랍. 여기서는 레일 자체가 스크롤합니다(안쪽에 또 스크롤을 두면
   바깥을 만질 때 안쪽이 잡힙니다). */
.qd-rail--drawer {
  width: ${px(spec.rail.drawerWidth)};
  max-width: 85vw;
  position: relative;
  /* 칸을 명시합니다. Q-Sonar·Q-Forge 는 서랍을 백드롭의 «자식» 으로 두지만
     Q-Atelier 는 형제라, 적지 않으면 세 제품의 뜻이 달라집니다. */
  z-index: var(--qd-z-drawer);
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
.qd-rail--drawer .qd-rail-nav {
  overflow-y: visible;
  flex: 1 0 auto;
}

/* ── 로고 블록 ─────────────────────────────────────────────────────────────── */
.qd-rail-brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  text-decoration: none;
  flex-shrink: 0;
  margin-bottom: 22px;
}
.qd-rail-brand img,
.qd-rail-brand svg {
  display: block;
  height: auto;
  max-width: 100%;
  object-fit: contain;
  user-select: none;
}
/* Q 표식. 폭은 여기서만 정합니다.
   표식을 감싸는 부품(테마별로 두 장을 싣는 등)이 있는 제품도 있어, 폭을
   \`.qd-rail-brand img\` 로 못 박으면 그 안쪽 규칙과 싸웁니다. 감싸개에 이
   클래스를 걸면 안쪽 그림은 100% 로 채우면 됩니다. */
.qd-rail-mark {
  display: block;
  width: ${px(spec.brand.logoSize)};
  flex-shrink: 0;
}
.qd-rail-mark img { width: 100%; }
.qd-rail-org {
  margin-top: 6px;
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.brand.orgFontSize)};
  letter-spacing: ${px(spec.brand.orgTracking)};
  /* 등록한 표기 그대로(오너 결정 2026-09-28). «Demo co.» 가 «DEMO CO.» 로 바뀌어 보였다 */
  text-transform: none;
  color: var(--qd-muted);
  word-break: break-all;
}
.qd-rail-org[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-rail-org--accent { color: var(--qd-accent); }

/* ── 스크롤 구역 ───────────────────────────────────────────────────────────── */
.qd-rail-nav {
  display: flex;
  flex-direction: column;
  gap: ${px(spec.nav.gap)};
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  overscroll-behavior: contain;
}

/* ── 묶음 이름표 ───────────────────────────────────────────────────────────── */
.qd-nav-group {
  padding: ${spec.group.padding};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.group.fontSize)};
  letter-spacing: ${px(spec.group.tracking)};
  text-transform: uppercase;
  color: var(--qd-muted);
  user-select: none;
}
.qd-nav-group[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}

/* ── 항목 ──────────────────────────────────────────────────────────────────
   2026-09-27 «문서 결»(오너 결정 · docs/08-paper.md): 선택 표시는 굵은 글자와 글자 밑 짧은 금색 선입니다.
   종전의 왼쪽 금막대와 오른쪽 금점은 걷었습니다. 막대가 차지하던 자리는 왼쪽 여백으로 돌려
   (padding-left) 글자 자리가 그대로입니다. 모서리는 굴리지 않습니다. */
.qd-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: ${px(spec.item.gap * 4)};
  padding: ${spec.item.padding};
  padding-left: ${px(spec.item.paddingLeft)};
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.item.fontSize)};
  font-weight: ${spec.item.idleWeight};
  letter-spacing: ${spec.item.tracking}px;
  color: var(--qd-subtle);
  background: transparent;
  text-decoration: none;
  transition: background-color 0.12s ease, color 0.12s ease;
}
.qd-nav-item:hover:not(.is-active) {
  background-color: var(--qd-surface2);
  color: var(--qd-text);
}
.qd-nav-item.is-active {
  color: var(--qd-text);
  font-weight: ${spec.item.activeWeight};
  background: var(--qd-surface2);
}
.qd-nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${px(spec.item.iconBox)};
  height: ${px(spec.item.iconBox)};
  flex-shrink: 0;
  color: var(--qd-muted);
}
.qd-nav-icon > svg {
  width: ${px(spec.item.iconGlyph)};
  height: ${px(spec.item.iconGlyph)};
  stroke-width: ${spec.item.iconStroke};
}
.qd-nav-item.is-active .qd-nav-icon { color: var(--qd-accent); }
.qd-nav-label {
  position: relative;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 선택 밑줄. 들어설 때 한 번 왼쪽부터 펼쳐지고 그 뒤로는 가만히 있습니다.
   이름표는 말줄임 때문에 넘친 것을 자릅니다(overflow: hidden). 그래서 선이 들어갈 자리를 아래 안쪽
   여백으로 만들고 같은 만큼 바깥 여백을 줄여, 줄 높이와 글자 자리가 그대로입니다.
   원본은 글자 아래 ${-spec.item.markOffset}px 에 놓인 별도 요소(qa-nav-active-underline)입니다. */
.qd-nav-item.is-active .qd-nav-label {
  padding-bottom: ${px(-spec.item.markOffset)};
  margin-bottom: ${px(spec.item.markOffset)};
}
.qd-nav-item.is-active .qd-nav-label::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: ${px(spec.item.markWidth)};
  height: ${px(spec.item.markHeight)};
  border-radius: ${px(spec.item.markRadius)};
  background: var(--qd-accent);
  transform-origin: ${spec.item.markOrigin};
  animation: qd-nav-mark-in ${spec.item.markMs}ms ${spec.item.markEase} 1;
}
@keyframes qd-nav-mark-in { ${spec.item.markKeyframes} }
@media (prefers-reduced-motion: reduce) {
  .qd-nav-item.is-active .qd-nav-label::after { animation: none; }
}
/* 2026-09-27 걷은 금점의 다리(.qd-nav-dot { display: none })는 2026-09-28 에 지웠습니다.
   받는 세 제품 마크업에서 금점을 모두 걷었습니다(docs/08-paper.md). */

.qd-nav-badge {
  flex-shrink: 0;
  padding: ${spec.item.badgePadding};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.version.fontSize)};
  font-weight: 700;
  line-height: 1.3;
  border-radius: 9999px;
  min-width: 22px;
  text-align: center;
  color: var(--qd-on-accent);
  background: var(--qd-danger);
}

/* 조용한 배지. 「3」 같은 숫자가 아니라 「26일」 처럼 읽는 말이 들어가는 자리입니다.
   빨간 알약으로 만들면 급하지 않은 것이 급해 보이고, 열 칸에 열 개가 켜집니다. */
.qd-nav-badge--quiet {
  background: transparent;
  border: 1px solid var(--qd-border);
  border-radius: ${px(tokens.radius.sm)}; /* 배지 = 6 (2026-09-14, 각진 것은 포털뿐) */
  color: var(--qd-subtle);
  font-weight: 400;
  min-width: 0;
}

/* ── 판 번호 줄 ────────────────────────────────────────────────────────────
   왼쪽에 이름 · 오른쪽에 판. 금은 판 쪽에만 씁니다. */
.qd-rail-version {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  padding: ${spec.version.padding};
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.version.fontSize)};
  letter-spacing: ${px(spec.version.tracking)};
  color: var(--qd-muted);
}
/* 대문자는 «이름» 에만 겁니다. 줄 전체에 걸면 v1.3.0 이 V1.3.0 이 됩니다 -
   판 번호는 사람이 적은 그대로 나와야 합니다 (띄워 찍어 보고 잡은 자리). */
.qd-rail-version > :first-child { text-transform: uppercase; }
/* 자간은 줄 전체(부모)에서 물려받으므로 한글 이름에서는 여기서 함께 풉니다(2026-10-16 · 한글 자간 검사가 잡음) */
.qd-rail-version > :first-child[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}
.qd-rail-version b {
  font-weight: inherit;
  color: var(--qd-accent);
}

/* ── 테마 줄 ──────────────────────────────────────────────────────────────── */
.qd-rail-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
  flex-shrink: 0;
  margin: 12px 0;
}
.qd-rail-theme {
  flex: 1;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spec.theme.padding};
  background: transparent;
  border: 1px solid var(--qd-border);
  border-radius: ${px(spec.theme.radius)};
  color: var(--qd-subtle);
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.theme.fontSize)};
  letter-spacing: ${px(spec.theme.tracking)};
  text-transform: uppercase;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.qd-rail-theme:hover { border-color: var(--qd-accent); color: var(--qd-text); }
.qd-rail-theme b { font-weight: 500; color: var(--qd-accent); }

/* 이 자리는 기준 제품에서 테마 토글이지만, 제품에 따라 «막힘» 같은 상태를
   넣기도 합니다(Q-Sonar 는 발송 막힘). 정본이 톤을 안 열어 주면 제품이
   인라인으로 덮게 되고, 그러면 정본을 안 쓰는 것과 같습니다. */
/* 🔑 --qd-warn 은 q-design.state.css 가 내는데 그 파일을 «모든» 제품이 받지는
      않습니다. 값을 못 찾으면 이 두 줄이 통째로 무효가 되어 톤이 조용히 사라집니다.
      그래서 여기서도 값을 들고 있습니다(Z 사다리와 같은 이유). */
.qd-rail-theme[data-tone='warning'] { border-color: color-mix(in srgb, var(--qd-warn, var(--qa-warning, ${tokens.color.dark['--qa-warning']})) 45%, transparent); }
.qd-rail-theme[data-tone='warning'] b { color: var(--qd-warn, var(--qa-warning, ${tokens.color.dark['--qa-warning']})); }
.qd-rail-theme[data-tone='danger'] { border-color: color-mix(in srgb, var(--qd-danger) 45%, transparent); }
.qd-rail-theme[data-tone='danger'] b { color: var(--qd-danger); }
/* 왼쪽 이름표는 라틴(Theme)이라 자간이 살지만, 오른쪽 값은 한글일 수 있습니다
   (「어둡게」·「밝게」·「기기따름」). 값 쪽만 자간을 풀 수 있게 열어 둡니다 -
   실측에서 Q-Forge 의 그 한 줄이 「어 둡 게」로 벌어져 있었습니다. */
.qd-rail-theme [data-hangul],
.qd-rail-theme b[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
  word-spacing: var(--qd-hangul-word-space);
}

.qd-rail-iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${px(spec.theme.btnSize)};
  height: ${px(spec.theme.btnSize)};
  background: transparent;
  border: 1px solid var(--qd-border);
  border-radius: ${px(spec.iconBtn.radius)};
  color: var(--qd-muted);
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.qd-rail-iconbtn:hover { border-color: var(--qd-accent); color: var(--qd-accent); }

/* ── 바닥 계정 블록 ────────────────────────────────────────────────────────── */
.qd-rail-foot {
  flex-shrink: 0;
  padding-top: 12px;
  border-top: 1px solid var(--qd-border);
}
.qd-rail-user {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  text-decoration: none;
}
.qd-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: ${px(spec.foot.avatarSize)};
  height: ${px(spec.foot.avatarSize)};
  border-radius: 50%;
  background: ${spec.foot.avatarBackground.replace(/--qa-champagne/g, '--qd-accent').replace(/--qa-surface2/g, '--qd-surface2')};
  color: var(--qd-text);
  font-weight: ${spec.foot.avatarWeight};
  /* 🔴 반올림하지 않습니다. 원본(components/Avatar.tsx)이 이렇게 씁니다.

       fontSize: Math.max(11, size * 0.45)

     여기에 Math.round 를 넣었더니 32 x 0.45 = 14.4 가 14 로 깎여서, 원본은
     14.4px 로 그리는데 사본 두 벌만 14px 로 그리고 있었습니다. 0.4px 이라
     눈에는 안 보이지만 «사본이 원본과 다르다» 는 것 자체가 이 정본이 막으려는
     것입니다. tools/diff-rails.mjs 가 세 제품을 다 재게 고치고 나서야
     드러났습니다. */
  font-size: ${px(Math.max(11, spec.foot.avatarSize * 0.45))};
  line-height: 1;
  letter-spacing: 0;
  user-select: none;
}
.qd-rail-user-text { min-width: 0; flex: 1; }
.qd-rail-user-name {
  display: block;
  font-size: ${px(spec.foot.nameFontSize)};
  color: var(--qd-text);
  font-weight: 500;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qd-rail-user-meta {
  display: block;
  margin-top: 3px;
  /* «소유자 · 엔터프라이즈» 처럼 한글이고 적힌 그대로다(오너 결정 2026-09-28 · 전에는 모노 대문자) */
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.foot.metaFontSize)};
  letter-spacing: ${px(spec.foot.metaTracking)};
  text-transform: none;
  color: var(--qd-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qd-rail-user-meta[data-hangul] {
  /* 본문 글꼴이라 한글 좁은 띄어쓰기(-0.35em)는 걸지 않는다. 걸면 «소유자 · 엔터프라이즈» 가 겹친다(2026-09-28) */
  letter-spacing: 0;
}

/* 로그아웃은 «글귀» 입니다(오너 결정 2026-09-28 · 원본 TextAction 과 같은 모양).
   흐린 글자 → 올리면 진한 글자. 테두리 · 바탕이 없어 주 동작과 무게가 갈립니다.
   터치 기기에서는 높이만 44 로 올립니다(원본 qa-touch-44). */
.qd-rail-logout {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  min-height: ${spec.logout.minHeightCss};
  padding: ${spec.logout.padding};
  background: transparent;
  border: 0;
  color: var(--qd-muted);
  font-family: var(--qd-font-ui);
  font-size: ${spec.logout.fontSizeCss};
  font-weight: 400;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease;
}
.qd-rail-logout:hover { color: var(--qd-text); }
@media (pointer: coarse) {
  .qd-rail-logout { min-height: ${px(spec.logout.touchMin)}; }
}

/* ── 좁은 화면 ─────────────────────────────────────────────────────────────
   ${runtime.BP.lg}px 미만은 레일을 감추고 서랍으로 바꿉니다. 그 폭을 프로젝트가 정하지
   않게 여기서 못 박습니다. 각자 정하면 세 제품의 «접히는 순간» 이 달라집니다. */
@media (max-width: ${runtime.BP.lg - 1}px) {
  .qd-rail:not(.qd-rail--drawer) { display: none; }
}

.qd-rail-backdrop {
  position: fixed;
  inset: 0;
  /* 사다리 칸을 부릅니다. 50 은 이 파일이 지어낸 숫자였고, 받는 제품의
     대화상자(60·70·80)보다 아래라 서랍이 열려도 그것들이 위에 남았습니다. */
  z-index: var(--qd-z-drawer-backdrop);
  background: rgba(0, 0, 0, 0.65);
}

@media print {
  .qd-rail, .qd-rail-backdrop { display: none !important; }
}
`;

/*
 * 🔑 만든 것을 «스스로 검사» 합니다.
 *
 * 이 파일이 겹침 순서의 정본이 되려면, 정작 자기 안에 숫자가 남아 있으면 안 됩니다.
 * `:root` 블록 안의 사다리 선언만 숫자를 갖고, 규칙 본문은 var() 로만 부릅니다.
 * 예전에 `.qd-rail-backdrop` 이 50 을 지어내 두었고, 받는 제품의 대화상자(60·70·80)가
 * 서랍 위에 남는 원인이었습니다. 같은 일이 다시 생기면 여기서 멈춥니다.
 */
{
  const 루트끝 = css.indexOf('}', css.indexOf(':root {'));
  const 본문 = css.slice(루트끝);
  const 지어낸것 = [...본문.matchAll(/z-index:\s*\d/g)];
  if (지어낸것.length) {
    throw new Error(
      `정본 CSS 규칙 안에 숫자로 적은 z-index 가 ${지어낸것.length}곳 있습니다.\n` +
        '사다리 칸(var(--qd-z-*))을 부르세요. 맞는 칸이 없으면 tokens.ts 의 Z 에 «만들어» 주세요.',
    );
  }
}

emit(join(OUT, 'q-design.nav.css'), css);
emit(
  join(OUT, 'q-design.nav.json'),
  JSON.stringify(
    {
      $meta: {
        generatedBy: 'tools/extract-nav.mjs',
        source: 'source/components/Sidebar.tsx + source/css/globals.css + source/components/components.tsx + source/components/TextAction.tsx + source/tokens/q-design-contract.ts + patterns/components.css',
        note: '손으로 고치지 마세요. 원본을 고치고 다시 돌리세요.',
      },
      ...spec,
    },
    null,
    2,
  ) + '\n',
);

emitDone('차림표');
if (CHECK) process.exit(process.exitCode ?? 0);

const lines = css.split('\n').length;
console.log(`dist/q-design.nav.css   ${lines} 줄`);
console.log(`dist/q-design.nav.json  치수 ${flat(spec).length} 개`);
console.log('');
console.log('  레일    ' + spec.rail.width + 'px · 패딩 ' + spec.rail.padding + ' · 서랍 ' + spec.rail.drawerWidth + 'px');
console.log('  항목    ' + spec.item.padding + ' · 왼쪽 ' + spec.item.paddingLeft + 'px · ' + spec.item.fontSize + 'px · 선택 밑줄 ' + spec.item.markWidth + 'x' + spec.item.markHeight + 'px');
console.log('  아이콘  자리 ' + spec.item.iconBox + ' · 글리프 ' + spec.item.iconGlyph + ' · 굵기 ' + spec.item.iconStroke);
console.log('  묶음    ' + spec.group.padding + ' · ' + spec.group.fontSize + 'px · 자간 ' + spec.group.tracking);
console.log('  바닥    아바타 ' + spec.foot.avatarSize + ' · 이름 ' + spec.foot.nameFontSize + ' · 메타 ' + spec.foot.metaFontSize);
