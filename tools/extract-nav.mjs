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

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'dist');
const SIDEBAR = join(ROOT, 'source', 'components', 'Sidebar.tsx');
const GLOBALS = join(ROOT, 'source', 'css', 'globals.css');
const LOGOUT_HINT = 'Btn p={false} sm';

const sidebar = readFileSync(SIDEBAR, 'utf8');
const globals = readFileSync(GLOBALS, 'utf8');
const tokens = JSON.parse(readFileSync(join(OUT, 'q-design.tokens.json'), 'utf8'));

// ── 구역 자르기 ──────────────────────────────────────────────────────────────
// 파일 전체에 정규식을 걸면 접힘 상태 값과 펼침 상태 값이 섞입니다.
// (접힌 레일은 2px 테두리 · 펼친 레일은 3px 입니다. 둘은 다른 값입니다.)
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
  // 항목 하나가 네 조각(링크 · 아이콘 · 점 · 배지)이고 조각마다 fontSize 가
  // 있습니다. 한 구역으로 두면 어느 값인지 모르는 채로 뽑게 됩니다.
  itemLink: slice(sidebar, "key={`${href}-${active ? 'active' : 'idle'}`}", '      <span\n        aria-hidden', 'itemLink'),
  itemIcon: slice(sidebar, '      <span\n        aria-hidden', '<span style={{ flex: 1 }}>', 'itemIcon'),
  itemDot: slice(sidebar, 'className="qa-nav-active-dot"', '{badge !== undefined && (', 'itemDot'),
  // 앞에 줄바꿈을 붙입니다. 들여쓰기만 다른 접힘 상태의 같은 줄(8칸)이
  // 6칸짜리 표지를 부분 문자열로 품고 있어, 그것부터 잘려 배지가 둘 잡혔습니다.
  itemBadge: slice(sidebar, '\n      {badge !== undefined && (', '/* ─── Subcomponents', 'itemBadge'),
  group: slice(sidebar, 'function SectionHeader(', '카테고리별 접기', 'group'),
  version: slice(sidebar, '{/* Rule Engine 버전', '{/* Theme + Collapse 행', 'version'),
  theme: slice(sidebar, "              flex: 1,\n              background: 'transparent',", '<span style={{ whiteSpace:', 'theme'),
  foot: slice(sidebar, '{/* Footer (avatar + logout)', '</aside>', 'foot'),
  iconBtn: slice(sidebar, 'function IconBtn(', 'function ChevronIcon(', 'iconBtn'),
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
  ['brand.orgFontSize',     Z.brand,  /fontSize: FS\[(\d+)\],/, Number],
  // 조직명도 labelTracking 을 거칩니다(2026-09-09). 한글 회사 이름이 흔합니다.
  ['brand.orgTracking',     Z.brand,  /letterSpacing: labelTracking\([^,]+, ([\d.]+)\),/, Number],

  // nav 스크롤 구역
  ['nav.gap',               Z.navEl,  /gap: collapsed && !isMobile \? 0 : (\d+),/, Number],

  // 항목
  ['item.padding',          Z.itemConst, /const NAV_ITEM_PADDING = '([^']+)';/, String],
  ['item.gap',              Z.itemLink, /gap: S\[([\d.]+)\],/, Number],
  ['item.fontSize',         Z.itemLink, /fontSize: FS\[(\d+)\],/, Number],
  ['item.tracking',         Z.itemLink, /letterSpacing: ([\d.]+),/, Number],
  ['item.activeWeight',     Z.itemLink, /fontWeight: active \? (\d+) : \d+,/, Number],
  ['item.idleWeight',       Z.itemLink, /fontWeight: active \? \d+ : (\d+),/, Number],
  ['item.railWidth',        Z.itemLink, /borderLeft: `(\d+)px solid/, Number],
  ['item.iconBox',          Z.itemIcon, /width: (\d+),\n          height: \d+,/, Number],
  ['item.iconGlyph',        Z.itemIcon, /<Icon size=\{(\d+)\} strokeWidth=\{[\d.]+\} \/>/, Number],
  ['item.iconStroke',       Z.itemIcon, /<Icon size=\{\d+\} strokeWidth=\{([\d.]+)\} \/>/, Number],
  ['item.dotSize',          Z.itemDot,  /width: (\d+),/, Number],
  ['item.badgePadding',     Z.itemBadge, /padding: '(\d+px \d+px)',/, String],

  // 묶음 이름표
  ['group.padding',         Z.group,  /padding: '([^']+)',/, String],
  ['group.fontSize',        Z.group,  /fontSize: FS\[(\d+)\],/, Number],
  // 2026-09-09 이후 이 자리는 labelTracking 을 거칩니다. 한글 라벨이면 0 이고
  // 라틴이면 아래 값입니다. 정본 CSS 는 `data-hangul` 로 같은 갈래를 만듭니다.
  ['group.tracking',        Z.group,  /letterSpacing: labelTracking\(label, ([\d.]+)\),/, Number],

  // 판 번호 줄
  ['version.padding',       Z.version, /padding: '([^']+)',/, String],
  ['version.fontSize',      Z.version, /fontSize: FS\[(\d+)\],/, Number],
  ['version.tracking',      Z.version, /letterSpacing: ([\d.]+),/, Number],

  // 테마 줄
  ['theme.padding',         Z.theme,  /padding: '([^']+)',/, String],
  ['theme.fontSize',        Z.theme,  /fontSize: FS\[(\d+)\],/, Number],
  ['theme.tracking',        Z.theme,  /letterSpacing: ([\d.]+),/, Number],
  ['theme.btnSize',         Z.iconBtn, /width: (\d+),\n        height: \d+,/, Number],

  // 바닥 계정 블록
  ['foot.avatarSize',       Z.foot,   /<Avatar name=\{userName\} email=\{userEmail\} size=\{(\d+)\} \/>\n              <div/, Number],
  ['foot.nameFontSize',     Z.foot,   /fontSize: FS\[(\d+)\],\n                    color: T\.text,/, Number],
  ['foot.metaFontSize',     Z.foot,   /fontSize: FS\[(\d+)\],\n                    color: T\.muted,/, Number],
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

// 활성 점의 펄스는 globals.css 에 있습니다.
{
  const m = globals.match(
    /@keyframes qa-nav-active-pulse \{([\s\S]*?)\}\n\.qa-nav-active-dot \{\n\s*animation: qa-nav-active-pulse (\d+)ms (cubic-bezier\([^)]+\)) 1;/,
  );
  if (!m) throw new Error('활성 점 펄스 키프레임을 못 찾았습니다.');
  put('item.dotPulseMs', Number(m[2]));
  put('item.dotPulseEase', m[3]);
  put('item.dotPulseKeyframes', m[1].trim().replace(/\s+/g, ' '));
}

// 로그아웃 단추는 공용 Btn(secondary · sm)입니다. 그 치수를 components.tsx 에서 봅니다.
{
  const comp = readFileSync(join(ROOT, 'source', 'components', 'components.tsx'), 'utf8');
  const pad = comp.match(/padding: sm \? '([^']+)' : '[^']+',/);
  const fs = comp.match(/fontSize: sm \? FS\[(\d+)\] : FS\[\d+\],/);
  const mh = comp.match(/const minHeight = sm \? (\d+) : TOUCH\.min;/);
  if (!pad || !fs || !mh) throw new Error('Btn(sm) 의 치수를 못 찾았습니다.');
  put('logout.padding', pad[1]);
  put('logout.fontSize', Number(fs[1]));
  put('logout.minHeight', Number(mh[1]));
  put('logout.hint', LOGOUT_HINT);

  /*
   * 모서리. 이 단추만 굴립니다.
   *
   * 처음에는 「차림표는 각지게」라 보고 0 을 넣었는데, 띄워 찍어 보니 로그아웃만
   * 굴려져 있었습니다. 항목과 테마 줄은 각지고 이 단추는 10px 입니다 - 저쪽에서
   * 이것만 «공용 단추» 를 그대로 쓰기 때문입니다. 눈으로 안 봤으면 못 잡았습니다.
   */
  const r = globals.match(/\.qa-btn-secondary \{\n\s*border-radius: (\d+)px;/);
  if (!r) throw new Error('.qa-btn-secondary 의 모서리를 못 찾았습니다.');
  put('logout.radius', Number(r[1]));
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
if (spec.rail.width !== 240) throw new Error(`레일 폭이 240 이 아닙니다: ${spec.rail.width}`);
if (spec.item.padding !== '11px 14px') throw new Error(`항목 여백이 바뀌었습니다: ${spec.item.padding}`);

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

const css = `/* =============================================================================
   q-design.nav.css · 차림표 정본
   생성물입니다. 손대지 마세요.  node tools/extract-nav.mjs
   원본: Q-Atelier components/Sidebar.tsx (${new Date().toISOString().slice(0, 10)})
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
              <span class="qd-nav-dot"></span>
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
   \`.qd-nav-group\` 과 \`.qd-rail-user-meta\` 는 모노 · 대문자 · 넓은 자간입니다.
   그 장치는 «라틴 글자 사이» 를 벌리라고 만든 값이라 한글에 걸면 「묶 음」 처럼
   벌어집니다. 한글이 섞인 글에는 \`data-hangul\` 을 붙이세요. 자간과 대문자가
   함께 풀립니다. (Q-Atelier lib/design/tokens.ts 의 labelTracking 과 같은 규칙)
   ============================================================================= */

:root {
${bindBlock('dark')}
  --qd-font-ui: var(--qd-font-ui-src, inherit);
  /* 모노 사슬도 손으로 안 적습니다. tokens.json 의 값을 그대로 씁니다 ·
     세 제품이 «같은 얼굴» 을 쓰는 것이 이 파일의 목적 중 하나이고, 그 얼굴
     이름을 여기 따로 적으면 그것부터 갈립니다. */
  --qd-font-mono: var(--qd-font-mono-src, ${tokens.typography.fontFamily.mono});
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
  text-transform: uppercase;
  color: var(--qd-muted);
  word-break: break-all;
}
.qd-rail-org[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
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
}

/* ── 항목 ──────────────────────────────────────────────────────────────────
   모서리를 굴리지 않습니다. 왼쪽 금막대가 항목 높이를 «꽉» 채워야 눈이 세로로
   훑을 때 걸립니다. 굴린 알약으로 만들면 막대가 안쪽으로 들어가 흐려집니다. */
.qd-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: ${px(spec.item.gap * 4)};
  padding: ${spec.item.padding};
  border-left: ${px(spec.item.railWidth)} solid transparent;
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.item.fontSize)};
  font-weight: ${spec.item.idleWeight};
  letter-spacing: ${spec.item.tracking}px;
  color: var(--qd-subtle);
  background: transparent;
  text-decoration: none;
  transition: background-color 0.12s ease, color 0.12s ease, border-color 0.12s ease;
}
.qd-nav-item:hover:not(.is-active) {
  background-color: var(--qd-surface2);
  color: var(--qd-text);
}
.qd-nav-item.is-active {
  color: var(--qd-text);
  font-weight: ${spec.item.activeWeight};
  background: var(--qd-surface2);
  border-left-color: var(--qd-accent);
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
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 활성 점. 들어설 때 한 번만 뛰고 그 뒤로는 가만히 있습니다. */
.qd-nav-dot {
  width: ${px(spec.item.dotSize)};
  height: ${px(spec.item.dotSize)};
  border-radius: 50%;
  background: var(--qd-accent);
  flex-shrink: 0;
  margin-right: 2px;
  animation: qd-nav-dot-pulse ${spec.item.dotPulseMs}ms ${spec.item.dotPulseEase} 1;
}
@keyframes qd-nav-dot-pulse { ${spec.item.dotPulseKeyframes} }
@media (prefers-reduced-motion: reduce) {
  .qd-nav-dot { animation: none; }
}

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
.qd-nav-dot + .qd-nav-badge { margin-left: 4px; }

/* 조용한 배지. 「3」 같은 숫자가 아니라 「26일」 처럼 읽는 말이 들어가는 자리입니다.
   빨간 알약으로 만들면 급하지 않은 것이 급해 보이고, 열 칸에 열 개가 켜집니다. */
.qd-nav-badge--quiet {
  background: transparent;
  border: 1px solid var(--qd-border);
  border-radius: 0;
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
.qd-rail-version > :first-child[data-hangul] { text-transform: none; }
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
  border-radius: 0;
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

.qd-rail-iconbtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${px(spec.theme.btnSize)};
  height: ${px(spec.theme.btnSize)};
  background: transparent;
  border: 1px solid var(--qd-border);
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
  font-size: ${px(Math.max(11, Math.round(spec.foot.avatarSize * 0.45)))};
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
  font-family: var(--qd-font-mono);
  font-size: ${px(spec.foot.metaFontSize)};
  letter-spacing: ${px(spec.foot.metaTracking)};
  text-transform: uppercase;
  color: var(--qd-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.qd-rail-user-meta[data-hangul] {
  letter-spacing: 0;
  text-transform: none;
}

/* 로그아웃은 공용 secondary 단추(sm)와 같은 치수입니다.
   차림표에서 모서리가 굴려진 것은 이것 하나입니다 - 항목과 테마 줄은 각집니다. */
.qd-rail-logout {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: ${px(spec.logout.minHeight)};
  padding: ${spec.logout.padding};
  background: transparent;
  border: 1px solid var(--qd-border);
  border-radius: ${px(spec.logout.radius)};
  color: var(--qd-subtle);
  font-family: var(--qd-font-ui);
  font-size: ${px(spec.logout.fontSize)};
  font-weight: 500;
  line-height: 1;
  letter-spacing: 0;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 0.15s ease, color 0.15s ease;
}
.qd-rail-logout:hover { border-color: var(--qd-danger); color: var(--qd-danger); }

/* ── 좁은 화면 ─────────────────────────────────────────────────────────────
   1024px 미만은 레일을 감추고 서랍으로 바꿉니다. 그 폭을 프로젝트가 정하지
   않게 여기서 못 박습니다. 각자 정하면 세 제품의 «접히는 순간» 이 달라집니다. */
@media (max-width: 1023px) {
  .qd-rail:not(.qd-rail--drawer) { display: none; }
}

.qd-rail-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.65);
}

@media print {
  .qd-rail, .qd-rail-backdrop { display: none !important; }
}
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'q-design.nav.css'), css, 'utf8');
writeFileSync(
  join(OUT, 'q-design.nav.json'),
  JSON.stringify(
    {
      $meta: {
        generatedBy: 'tools/extract-nav.mjs',
        source: 'source/components/Sidebar.tsx + source/css/globals.css + source/components/components.tsx',
        note: '손으로 고치지 마세요. 원본을 고치고 다시 돌리세요.',
      },
      ...spec,
    },
    null,
    2,
  ) + '\n',
  'utf8',
);

const lines = css.split('\n').length;
console.log(`dist/q-design.nav.css   ${lines} 줄`);
console.log(`dist/q-design.nav.json  치수 ${flat(spec).length} 개`);
console.log('');
console.log('  레일    ' + spec.rail.width + 'px · 패딩 ' + spec.rail.padding + ' · 서랍 ' + spec.rail.drawerWidth + 'px');
console.log('  항목    ' + spec.item.padding + ' · ' + spec.item.fontSize + 'px · 금막대 ' + spec.item.railWidth + 'px · 점 ' + spec.item.dotSize + 'px');
console.log('  아이콘  자리 ' + spec.item.iconBox + ' · 글리프 ' + spec.item.iconGlyph + ' · 굵기 ' + spec.item.iconStroke);
console.log('  묶음    ' + spec.group.padding + ' · ' + spec.group.fontSize + 'px · 자간 ' + spec.group.tracking);
console.log('  바닥    아바타 ' + spec.foot.avatarSize + ' · 이름 ' + spec.foot.nameFontSize + ' · 메타 ' + spec.foot.metaFontSize);
