// =============================================================================
// 제품 앱 아이콘 (홈 화면 · 설치 앱 · 파비콘)
// =============================================================================
//   node tools/app-icons.mjs           dist/app-icons 에 만들고, 제품 쪽 파일과 같은지 봅니다
//   node tools/app-icons.mjs --write   제품 저장소의 public 에도 쓰고, 쓴 뒤 다시 읽어 대조합니다
//   node tools/app-icons.mjs --check   아무것도 쓰지 않고 대조만 합니다. 다르면 종료 코드 1
//   (extract-all.mjs 가 부릅니다: 만들기 · --sync · --check 에 각각 대응)
//
// 오너 결정 (2026-09-25): 「똑같이 검은 배경에 Q 만 있으면 헷갈리니까 특성을 넣어 달라」
//   → ② 금속 색 + 상징 틀, 네 제품 모두 (시안 셋 중 고름).
//
//   Q-Atelier  은        원 (옛 아이콘의 금 고리 · 패밀리의 시작)
//   Q-Maison   샴페인 금  집 (공방 · 매장 · 고객까지 거느린 장인의 집)
//   Q-Carnet   구리      수첩과 고무줄 띠 (작업대 옆의 작업 수첩)
//   Q-Sonar    강철 청    음파 (시장이 떠오르기 전에 듣는다)
//
// 오너 결정 (같은 날 이어서): 「외곽 틀을 더 다듬고, Q 위치가 위아래로 안 맞는다」
//   → B. 붓 획 틀 (시안 둘 중 고름). 틀을 Q 처럼 굵고 가는 획으로 그린다: 세로 획 굵게 · 가로 획
//   가늘게 · 음파는 양 끝이 가늘어진다. 수첩 띠는 오른쪽 고무줄에서 왼쪽 제본선으로 옮겼다
//   (Q 를 가운데에 두면 붓 꼬리가 오른쪽 띠에 닿는다).
//
// 🔑 Q 는 네 제품이 같은 크롬 붓 Q 입니다(패밀리 표식 · 화면 속 차림표 · 로그인과 같은 그림).
//    모양은 건드리지 않고 명도를 금속 계단에 대응시켜 색만 바꿉니다. 음영은 원본 그대로 남습니다.
// 🔑 **Q 의 크기와 자리는 네 아이콘이 같습니다**(Q_H · Q_AT 한 벌). 틀은 그 Q 둘레에 같은 중심 ·
//    비슷한 부피로 그립니다. 처음 판은 틀마다 Q 를 따로 맞춰 넣어 집의 Q 가 44 아래 · 작고 수첩의 Q 가
//    16 왼쪽이었습니다(오빠 지적). 틀에 맞춰 Q 를 옮기지 말고 Q 에 맞춰 틀을 그릴 것.
// 🔑 원본 그림은 source/brand/logo-dark.png (Q-Atelier public 의 사본, refresh-source 가 받아 옵니다).
//
// 오너 결정 (2026-09-26): 「PWA 아이콘 설명.. 전체 시스템 동일하게」 → 설치 앱 이름은 제품 이름만,
//   설명은 「… 시스템」 한 줄 (선택지에서 고름 · Login 은 뺌). 설명의 원본은 아래 PRODUCTS 의 tagline 이고,
//   --check 가 각 제품의 taglineIn 파일에 그 글자가 그대로 있는지 봅니다. 윈도 작업 표시줄 풍선 도움말 ·
//   설치 화면에 이름과 함께 나오는 한 줄입니다. 이미 설치한 앱은 설치 때 이름 · 설명을 들고 있습니다.
//
// 오너 결정 (2026-09-26): 「첫 방문 무게 줄이기」 → 화면에 그리는 붓 Q 도 이 도구가 만듭니다(아래 MARKS).
//   로그인 · 차림표의 붓 Q 는 원본 PNG(은 126KB · 검정 286KB)를 그대로 싣고 있었습니다. 화면에서 가장 크게
//   그리는 자리가 120px 라 3배 화면 기준 너비 360px 면 충분하고, WebP 90 으로 26KB · 23KB 가 됩니다
//   (2배 확대 대조에서 붓 끝 가는 획까지 원본과 구별되지 않음). 원본 PNG 는 그대로 둡니다(이 도구의 원본 그림).
//   🔑 설치 앱 아이콘이 아니므로 판 번호(ICON_VERSION) 지문에 넣지 않습니다. 넣으면 붓 Q 를 다시 뽑을 때마다
//      설치된 앱에 쓸데없는 갱신 안내가 뜹니다.
//
// 오너 결정 (2026-09-28): 「깃허브의 맥으로 앱 만들기」 → iOS 앱(Q-Atelier-iOS)의 아이콘도 이 도구가 만듭니다
//   (아래 PRODUCTS 의 native). apple 그림을 1024 그대로 먹색 바탕에 눌러 붙이고 알파를 걷습니다(앱 스토어는
//   투명 채널이 있는 아이콘을 받지 않습니다). 설치 앱(PWA)처럼 주소로 갱신을 알아채는 구조가 아니라서
//   판 번호 지문에 넣지 않습니다. 앱 아이콘은 앱을 새 판으로 올릴 때 바뀝니다.
//
// 오너 결정 (2026-09-29): 「상단 바 색상을 넣을 거라면 각 아이콘에 들어간 색상으로」 → 설치 앱 창의 상단 바
//   (매니페스트 theme_color · 화면의 themeColor)를 아이콘 금속 색으로 칠합니다. 시안 셋(지금 · 짙은 금속 색 · 금속 색
//   그대로) 가운데 **짙은 금속 색**: 틀 선 가운데 금속 색을 먹색 바탕(BG)에 26% 만 섞습니다(아래 titleBarOf).
//   금속 색 그대로는 상단 바가 화면에서 가장 밝은 자리가 되어 본문보다 먼저 눈을 끕니다(오너 「짙은 금속색이 눈을
//   덜 홀릴 거 같은데」). 짙은 쪽은 흰 글자 대비 11.6 ~ 13.8 이고 네 색이 서로 갈립니다(2026-09-29 계산). 밝은
//   테마에서도 같은 색입니다(금을 옅게 하면 크림색이 됩니다). Q-Carnet 은 제조소 회사 색 대신 늘 구리입니다(설치 앱
//   이름에 제조소 이름을 붙이지 않는 것과 같은 결 · 2026-09-26). 이 색은 설치한 앱 창과 폰 브라우저 위쪽에서만
//   보입니다. 폰 앱(안드로이드)은 화면 바탕색을 따로 읽으므로 상관이 없습니다. 동결 중인 Q-Maison · Q-Carnet 에도
//   이 색만은 곧바로 반영했습니다(같은 날 오너 결정 · 동결의 유일한 예외). --check 가 각 제품의 titleBarIn 파일에서
//   상단 바 색 자리를 모두 찾아 원본과 같은지 봅니다.
//
// 오너 지시 (2026-10-09): 「PWA 아이콘 변경 요청: 큐 아뜰리에 · 큐 카르넷 · 큐 메종 순으로」 + 그림 세 장.
//   네 제품은 이제 완성 그림(금속 Q 조형 · 은 = 서류 뭉치 + 펜촉 · 구리 = 수첩 띠 + 펜촉 · 금 = 결속 띠
//   + 펜촉 · 강철 청 = 왼쪽 신호 호 두 겹 + 펜촉, 2026-10-10 코덱스 시안 A 를 오너가 고름)을 그대로 씁니다.
//   붓 Q 에 색을 입히고 틀을 그리던 길은 그림이 없는 제품이 생길 때를 위해 남아 있습니다.
//   원본은 source/brand/app-icon-<제품>.webp(투명 바탕 1254px · PRODUCTS 의 art). 그림의 알파 상자를 잘라
//   먹색 판 가운데 ART_BOX 크기로 앉힙니다(작은 판은 조금 키움). 판 번호 v=4.
//
// ── 크기마다 따로 그립니다 ───────────────────────────────────────────────────
//   any       둥근 먹색 판. 데스크톱 설치 앱 · 작업 표시줄 · 안드로이드가 아닌 곳   192 · 512
//   maskable  판 없이 가득 찬 먹색. 안드로이드가 원 · 둥근 네모로 오려 냅니다.
//             안쪽 지름 80% 원(반지름 204.8) 밖은 잘릴 수 있어 내용을 0.84 로 줄입니다  192 · 512
//   apple     판 없이 가득 찬 먹색. iOS 가 모서리를 스스로 둥글립니다                 180
//             같은 그림을 줄이지 않고 1024 로 두면 iOS 앱 아이콘입니다(아래 native)      1024
//   small     브라우저 탭 · 작업 표시줄의 16 · 24 · 32px. 가는 선과 붓 Q 의 머리카락 획이
//             사라지므로 선을 굵게, Q 획을 부풀려(dilate) 그립니다. 붓 획 틀의 굵고 가는 차이는
//             이 크기에서 안 보이고 가는 획이 먼저 사라지므로, 같은 모양을 고른 굵기로 그립니다  ICO 16 · 32 · 48
//   maskable 은 그린 뒤 안전 원 밖에 먹색이 아닌 점이 있는지 스스로 세어, 있으면 멈춥니다.
//
// ── 확인한 것 (2026-09-25 시안) ──────────────────────────────────────────────
//   금속 색만 바꾼 안은 24px 이하에서 Q 획이 가늘어 색이 거의 안 갈렸습니다. 상징 틀은
//   작은 크기에서도 모양(원 · 오각 · 세로 네모 · 호)으로 갈립니다. 그래서 틀을 넣었습니다.
// =============================================================================

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const APP = 'D:/Claude/Q-Atelier';
const { chromium } = require(APP + '/node_modules/playwright');
const sharp = require(APP + '/node_modules/sharp');

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const OUT = join(ROOT, 'dist', 'app-icons');
const SRC = join(ROOT, 'source', 'brand', 'logo-dark.png');
const write = process.argv.includes('--write');
const checkOnly = process.argv.includes('--check');

const BG = '#0c0c0c'; // 정본 다크 바탕 (--qd-bg) · 세 제품 매니페스트의 background_color 와 같음

/*
 * 받는 곳. 파일 이름은 네 제품이 같습니다(layout · 매니페스트가 같은 이름을 부릅니다).
 * badge 는 알림 표시줄의 단색 표식입니다. 웹 푸시를 쓰는 Q-Atelier 만 받습니다.
 * refs 는 그 제품에서 아이콘 주소를 적는 파일입니다(저장소 뿌리 기준). 아래 판 번호 검사가 봅니다.
 * tagline 은 설치 앱 설명 한 줄의 원본, taglineIn 은 그 글자가 그대로 있어야 하는 파일입니다.
 * Q-Sonar 는 매니페스트가 brand.ts 의 상수를 부르므로 brand.ts 를 봅니다(이름은 brand.ts 에만 두는 계약).
 * marksIn 은 화면용 붓 Q(MARKS)를 그리는 파일입니다. 붓 Q 를 화면에 그리는 제품만 받습니다(Q-Maison 은 안 그림).
 * --check 가 그 파일들이 WebP 두 장을 부르고 옛 PNG 사본을 부르지 않는지 봅니다.
 * native 는 iOS 앱 아이콘(1024 · 알파 없음)을 받는 파일입니다(2026-09-28 · 머리의 오너 결정). iOS 앱이 있는 제품만.
 * titleBarIn 은 설치 앱 창의 상단 바 색(theme_color · themeColor)을 적는 파일입니다(2026-09-29 · 머리의 오너 결정).
 * 값은 금속에서 나오므로(titleBarOf) 여기 적지 않습니다. --check 가 그 파일들의 색 자리가 모두 그 값인지 봅니다.
 */
const PRODUCTS = [
  {
    key: 'atelier', name: 'Q-Atelier', metal: 'silver', frame: 'ring', art: 'app-icon-atelier.webp', root: 'D:/Claude/Q-Atelier', badge: true,
    refs: ['public/manifest.json', 'app/layout.tsx', 'public/sw.js', 'public/offline.html', 'components/InstallAppPrompt.tsx'],
    tagline: '의료기기 개발 · 인허가 시스템', taglineIn: ['public/manifest.json', 'public/offline.html'],
    marksIn: ['components/Logo.tsx', 'components/expert/BrandLogo.tsx'],
    native: ['D:/Claude/Q-Atelier-iOS/QAtelier/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png'],
    titleBarIn: ['public/manifest.json', 'app/layout.tsx', 'app/experts/layout.tsx'],
  },
  {
    key: 'maison', name: 'Q-Maison', metal: 'gold', frame: 'house', art: 'app-icon-maison.webp', root: 'D:/Claude/Q-Works', refs: ['app/manifest.ts', 'app/layout.tsx'],
    tagline: 'ISO 9001 품질경영 시스템', taglineIn: ['app/manifest.ts'],
    marksIn: [], native: [],
    titleBarIn: ['app/manifest.ts', 'app/layout.tsx'],
  },
  {
    key: 'carnet', name: 'Q-Carnet', metal: 'copper', frame: 'notebook', art: 'app-icon-carnet.webp', root: 'D:/Claude/DHR', refs: ['app/manifest.ts', 'app/layout.tsx'],
    tagline: '의료기기 제조기록서 시스템', taglineIn: ['app/manifest.ts'],
    marksIn: ['components/q-mark.tsx'], native: [],
    titleBarIn: ['app/manifest.ts', 'app/layout.tsx'],
  },
  {
    key: 'sonar', name: 'Q-Sonar', metal: 'steel', frame: 'waves', art: 'app-icon-sonar.webp', root: 'D:/Claude/Lead-Radar', refs: ['src/app/manifest.ts', 'src/app/layout.tsx'],
    tagline: '의료기기 잠재고객 발굴 시스템', taglineIn: ['src/lib/brand.ts'],
    marksIn: ['src/components/QMark.tsx'], native: [],
    titleBarIn: ['src/app/manifest.ts', 'src/app/layout.tsx'],
  },
].map((p) => ({ ...p, pub: `${p.root}/public` }));
const NATIVE_ICON = 'ios-app-icon-1024.png';

/*
 * 화면용 붓 Q (2026-09-26 · 머리의 오너 결정). 이름은 받는 세 제품이 같습니다.
 * 원본 그림의 가로세로 비율을 그대로 둡니다(정사각으로 채우면 너비만 주는 자리에서 높이가 달라집니다).
 * 🔑 옛 PNG 사본 이름은 OLD_MARK_PNGS 에 둡니다. marksIn 파일이 이 이름을 부르면 --check 가 잡습니다.
 */
const MARK_PX = 360;
const MARKS = {
  'q-mark-on-dark.webp': join(ROOT, 'source', 'brand', 'logo-dark.png'), // 은색 Q · 어두운 면 위
  'q-mark-on-light.webp': join(ROOT, 'source', 'brand', 'logo-light.png'), // 검정 Q · 밝은 면 위
};
const OLD_MARK_PNGS = ['logo-dark.png', 'logo-light.png', 'logo-mark.png', 'logo-mark-light.png', 'q-mark-on-dark.png', 'q-mark-on-light.png'];

/*
 * 아이콘 판 번호. 제품 코드는 아이콘을 «?v=판 번호» 를 붙여 부릅니다(refs 의 파일들).
 *
 * 🔴 크롬 144(2026-01)부터 설치된 앱은 매니페스트의 아이콘 «주소» 가 바뀔 때만 새 아이콘을 알아챕니다.
 *    주소가 같으면 그림이 달라도 바뀌지 않은 것으로 봅니다(아이콘 주소를 Cache-Control: immutable 처럼
 *    다룹니다 · developer.chrome.com/blog/improvements-to-web-app-updates). 2026-09-25 첫 판과 다듬은 판을
 *    같은 주소로 올렸다가, 설치된 앱에 갱신 안내가 안 뜬다는 것을 이튿날 크롬 문서에서 확인했습니다.
 *    주소가 바뀌면 크롬(PC · 안드로이드)의 설치 앱에 «앱 업데이트 검토» 가 뜹니다. iOS 는 해당 없음(다시 추가).
 * 🔑 그림을 바꾸면 이 값을 올리고 refs 의 «?v=» 도 같이 바꿉니다. 그림이 바뀌었는데 이 값이 그대로면
 *    이 도구가 멈춥니다(dist/app-icons/version.json 과 대조). 그림이 그대로인데 이 값만 올리면 설치 앱에
 *    쓸데없는 갱신 안내가 뜨므로 알립니다.
 */
const ICON_VERSION = '4';
const ICON_NAMES = ['icon-192', 'icon-512', 'icon-192-maskable', 'icon-512-maskable', 'apple-icon', 'badge-96'];

// ── 금속 계단: 명도 L(0..1) → 색. 은은 원본 그대로 ─────────────────────────────
/*
 * 크롬 그림은 명도 중앙값이 0.90 이라 계단의 밝은 끝에 몰립니다. 감마 1.9 로 중간 명도를 내려
 * 금속 색이 서게 합니다(반사광 1.0 은 그대로 1.0). 샴페인 금의 가운데는 패밀리 금 #b8935a 곁입니다.
 */
const GAMMA = 1.9;
const RAMPS = {
  gold: [[0, '#140e07'], [0.22, '#4a3519'], [0.48, '#a88450'], [0.62, '#c9a66b'], [0.8, '#e8d3a6'], [0.93, '#f7ecd4'], [1, '#fffaf0']],
  copper: [[0, '#150a06'], [0.22, '#4c2616'], [0.48, '#a45a36'], [0.62, '#c7784f'], [0.8, '#e8b394'], [0.93, '#f7dccd'], [1, '#fff5ee']],
  steel: [[0, '#070c14'], [0.22, '#1a3350'], [0.48, '#4a7aa8'], [0.62, '#6b97c2'], [0.8, '#a9c6e2'], [0.93, '#dde9f5'], [1, '#ffffff']],
};
/* 틀 선의 금속 결 (위 밝음 → 가운데 → 아래 어둠) */
const STROKE = {
  silver: ['#f4f4f4', '#b9b9b9', '#6d6d6d'],
  gold: ['#f3e2bb', '#c9a66b', '#7a5a2e'],
  copper: ['#f1c6ab', '#c7784f', '#6e3820'],
  steel: ['#d6e6f5', '#5f8fbd', '#274a70'],
};

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/*
 * 설치 앱 창의 상단 바 색 (2026-09-29 · 머리의 오너 결정). 틀 선 가운데 금속 색을 먹색 바탕(BG)에 26% 만 섞습니다.
 * 은 #393939 · 금 #3d3425 · 구리 #3d281d · 강철 #222e3a (흰 글자 대비 11.6 · 12.2 · 13.8 · 13.8).
 * 🔑 금속 색이나 이 비율을 바꾸면 네 제품의 titleBarIn 파일도 같이 바꿉니다. --check 가 어긋남을 잡습니다.
 */
const TITLE_BAR_MIX = 0.26;
function titleBarOf(metal) {
  const m = hex(STROKE[metal][1]);
  const b = hex(BG);
  return '#' + m.map((v, i) => Math.round(b[i] + (v - b[i]) * TITLE_BAR_MIX).toString(16).padStart(2, '0')).join('');
}

function rampAt(stops, t) {
  for (let i = 1; i < stops.length; i++) {
    const [t1, c1] = stops[i];
    const [t0, c0] = stops[i - 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      const a = hex(c0);
      const b = hex(c1);
      return a.map((v, j) => v + (b[j] - v) * k);
    }
  }
  return hex(stops[stops.length - 1][1]);
}

/** 크롬 Q 를 읽어 투명 여백을 걷고, 금속마다 색을 바꾼 PNG 를 돌려줍니다. */
async function metalQs() {
  const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  // 알파가 선 곳의 범위
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  const cw = x1 - x0 + 1;
  const ch = y1 - y0 + 1;
  const crop = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) data.copy(crop, y * cw * 4, ((y + y0) * W + x0) * 4, ((y + y0) * W + x1 + 1) * 4);
  /*
   * 무게중심(알파 가중). 붓 꼬리가 아래 · 오른쪽으로 길게 나가 그림 상자의 가운데는 눈에 보이는
   * 가운데보다 아래 · 오른쪽에 있습니다. 네 아이콘의 Q 를 이 점으로 맞춥니다.
   */
  let m = 0, mx = 0, my = 0;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const a = crop[(y * cw + x) * 4 + 3] / 255;
    m += a; mx += a * x; my += a * y;
  }

  const out = {};
  for (const metal of ['silver', 'gold', 'copper', 'steel']) {
    const buf = Buffer.from(crop);
    if (metal !== 'silver') {
      const lut = [];
      for (let i = 0; i < 256; i++) lut.push(rampAt(RAMPS[metal], Math.pow(i / 255, GAMMA)));
      for (let p = 0; p < buf.length; p += 4) {
        const L = Math.round(0.2126 * buf[p] + 0.7152 * buf[p + 1] + 0.0722 * buf[p + 2]);
        const c = lut[L];
        buf[p] = Math.round(c[0]); buf[p + 1] = Math.round(c[1]); buf[p + 2] = Math.round(c[2]);
      }
    }
    out[metal] = await sharp(buf, { raw: { width: cw, height: ch, channels: 4 } }).png().toBuffer();
  }
  return { png: out, w: cw, h: ch, gx: mx / m, gy: my / m };
}

// ── Q 의 크기와 자리: 네 아이콘 공통 (512 단위) ──────────────────────────────
const Q_H = 216; // 그림 높이
const Q_AT = { x: 256, y: 258 }; // Q 의 무게중심이 올 자리

/** Q 그림 상자. 네 아이콘 · 모든 크기가 이 한 벌을 씁니다 */
function qBox(Q) {
  const s = Q_H / Q.h;
  const x = Q_AT.x - Q.gx * s;
  const y = Q_AT.y - Q.gy * s;
  return `x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(Q.w * s).toFixed(2)}" height="${Q_H}"`;
}

// ── 제품 그림 (2026-10-09 오너 지시): 완성 그림을 그대로 쓰는 제품 ──────────────
/*
 * 그림의 알파 상자를 잘라 긴 변이 ART_BOX 가 되게 줄이고, 상자의 가운데를 판 가운데(256, 256)에 둡니다.
 * 붓 Q 처럼 무게중심으로 맞추지 않습니다. 세 그림이 같은 틀(Q 고리 + 꼬리 + 펜촉)이라 상자 가운데가 서로
 * 같은 자리이고, 꼬리와 서류가 한쪽으로 나가 무게중심을 쓰면 오히려 고리가 어긋납니다.
 */
const ART_BOX = 392;
async function artworks() {
  const out = {};
  for (const p of PRODUCTS.filter((x) => x.art)) {
    const src = join(ROOT, 'source', 'brand', p.art);
    const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    let x0 = W, y0 = H, x1 = -1, y1 = -1;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    }
    const w = x1 - x0 + 1;
    const h = y1 - y0 + 1;
    const png = await sharp(src).extract({ left: x0, top: y0, width: w, height: h }).png().toBuffer();
    out[p.key] = { png, w, h };
  }
  return out;
}
function artBox(art, k = 1) {
  const s = (ART_BOX * k) / Math.max(art.w, art.h);
  const w = art.w * s;
  const h = art.h * s;
  return `x="${(256 - w / 2).toFixed(2)}" y="${(256 - h / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}"`;
}

// ── 틀 기하 (512 단위). 모두 중심 256,256 둘레에 비슷한 부피로 ────────────────
/*
 * 집은 지붕이 위로 솟아 부피가 위로 쏠리므로, 몸통이 Q 를 감싸고 전체 높이의 가운데가 판의
 * 가운데에 오게 했습니다(지붕 꼭짓점 72 · 바닥 440). 수첩은 왼쪽 제본선과 오른쪽 가장자리 사이에
 * Q 가 서도록 제본선을 왼쪽 가장자리에서 30 안쪽에 둡니다.
 */
const RING = { r: 184 };
const HOUSE = { apexY: 72, eaveY: 190, left: 102, right: 410, baseY: 440, r: 16 };
const NOTE = { left: 106, right: 406, top: 72, bottom: 440, r: 24, spine: 136 };
const WAVES = { r1: 158, r2: 198, deg: 40 };

/*
 * 붓 획 틀의 굵기. 세로 획 14 · 가로 획 6 (512 단위). 가는 획을 4.5 로 두었더니 홈 화면 60px 에서
 * 집의 지붕 · 바닥이 흐려져 6 으로 올렸습니다(2026-09-25 시안 실측).
 */
const THICK = 14;
const THIN = 6;

/*
 * 🔴 틀의 결은 userSpaceOnUse 로 겁니다. objectBoundingBox(기본값)로 걸면 폭이 0 인 세로선에서
 *    결을 계산하지 못해 선이 통째로 사라집니다(2026-09-25 첫 시안에서 수첩 띠가 실제로 빠졌습니다).
 */

/** 고른 굵기의 한 줄 틀. 작은 판(16 · 32 · 48)과 알림 표식이 씁니다 */
function frameLine(kind, sw, paint = 'url(#metal)') {
  const st = `fill="none" stroke="${paint}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  if (kind === 'ring') return `<circle cx="256" cy="256" r="${RING.r}" ${st}/>`;
  if (kind === 'house') {
    const { apexY, eaveY, left, right, baseY, r } = HOUSE;
    return `<path d="M${left} ${eaveY} L256 ${apexY} L${right} ${eaveY} L${right} ${baseY - r} Q${right} ${baseY} ${right - r} ${baseY} ` +
      `L${left + r} ${baseY} Q${left} ${baseY} ${left} ${baseY - r} Z" ${st}/>`;
  }
  if (kind === 'notebook') {
    const { left, right, top, bottom, r, spine } = NOTE;
    return `<rect x="${left}" y="${top}" width="${right - left}" height="${bottom - top}" rx="${r}" ${st}/>` +
      `<line x1="${spine}" y1="${top}" x2="${spine}" y2="${bottom}" ${st}/>`;
  }
  if (kind === 'waves') {
    let s = '';
    for (const [r, op] of [[WAVES.r1, 1], [WAVES.r2, 0.55]]) {
      for (const side of [-1, 1]) {
        let a0 = (-WAVES.deg * Math.PI) / 180;
        let a1 = (WAVES.deg * Math.PI) / 180;
        if (side < 0) [a0, a1] = [Math.PI - a1, Math.PI - a0];
        const p = (a) => `${(256 + r * Math.cos(a)).toFixed(2)} ${(256 + r * Math.sin(a)).toFixed(2)}`;
        s += `<path d="M${p(a0)} A${r} ${r} 0 0 1 ${p(a1)}" ${st} opacity="${op}"/>`;
      }
    }
    return s;
  }
  throw new Error(`모르는 틀: ${kind}`);
}

/*
 * 붓 획 틀. 속을 판 도형을 «채웁니다»(선이 아니라 면이라 굵기를 자리마다 다르게 줄 수 있습니다).
 * 붓 Q 처럼 세로 획은 굵고(THICK) 가로 · 비스듬한 획은 가늡니다(THIN).
 */
function frameStroke(kind, thick = THICK, thin = THIN, paint = 'url(#metal)') {
  const fill = `fill="${paint}" fill-rule="evenodd"`;
  const h = thick / 2;
  const t = thin / 2;
  if (kind === 'ring') {
    // 디돈 O: 바깥은 원, 안은 좌우로 더 파인 타원 → 좌우 굵고 위아래 가늚
    const R = RING.r + h;
    const ix = R - thick;
    const iy = R - thin;
    return `<path ${fill} d="M${256 - R} 256 A${R} ${R} 0 1 0 ${256 + R} 256 A${R} ${R} 0 1 0 ${256 - R} 256 Z ` +
      `M${256 - ix} 256 A${ix} ${iy} 0 1 1 ${256 + ix} 256 A${ix} ${iy} 0 1 1 ${256 - ix} 256 Z"/>`;
  }
  if (kind === 'house') {
    const { apexY, eaveY, left, right, baseY, r } = HOUSE;
    const slope = (eaveY - apexY) / (256 - left);
    const norm = Math.sqrt(1 + slope * slope);
    // 지붕은 꼭짓점에서 좌우로 내려갑니다: 가운데에서 떨어진 거리(절댓값)만큼 y 가 커집니다
    const roof = (apex) => (x) => (apex + slope * Math.abs(256 - x)).toFixed(2);
    const house = (l, rr, b, apex, rad) => {
      const y = roof(apex);
      return `M256 ${apex.toFixed(2)} L${rr} ${y(rr)} L${rr} ${b - rad} Q${rr} ${b} ${rr - rad} ${b} ` +
        `L${l + rad} ${b} Q${l} ${b} ${l} ${b - rad} L${l} ${y(l)} Z`;
    };
    const outer = house(left - h, right + h, baseY + t, apexY - t * norm, r);
    const inner = house(left + h, right - h, baseY - t, apexY + t * norm, Math.max(2, r - h));
    return `<path ${fill} d="${outer} ${inner}"/>`;
  }
  if (kind === 'notebook') {
    const { left, right, top, bottom, r, spine } = NOTE;
    const rr = (x0, y0, x1, y1, rad) => `M${x0 + rad} ${y0} L${x1 - rad} ${y0} Q${x1} ${y0} ${x1} ${y0 + rad} ` +
      `L${x1} ${y1 - rad} Q${x1} ${y1} ${x1 - rad} ${y1} L${x0 + rad} ${y1} Q${x0} ${y1} ${x0} ${y1 - rad} ` +
      `L${x0} ${y0 + rad} Q${x0} ${y0} ${x0 + rad} ${y0} Z`;
    const outer = rr(left - h, top - t, right + h, bottom + t, r + h);
    const inner = rr(left + h, top + t, right - h, bottom - t, Math.max(2, r - h));
    // 제본선은 세로 획이라 굵게. 위아래 끝은 표지 안쪽 선에 붙습니다
    return `<path ${fill} d="${outer} ${inner}"/>` +
      `<rect x="${spine - h}" y="${top + t}" width="${thick}" height="${bottom - top - thin}" fill="${paint}"/>`;
  }
  if (kind === 'waves') {
    // 가운데가 굵고 양 끝이 가늘어지는 호(초승달 꼴)
    let s = '';
    for (const [r, op] of [[WAVES.r1, 1], [WAVES.r2, 0.55]]) {
      for (const side of [-1, 1]) {
        const n = 48;
        const w = (d) => t + (h - t) * Math.cos(((d / WAVES.deg) * Math.PI) / 2);
        const at = (d, rad) => {
          const a = (d * Math.PI) / 180;
          return `${(256 + side * rad * Math.cos(a)).toFixed(2)} ${(256 + rad * Math.sin(a)).toFixed(2)}`;
        };
        const pts = [];
        for (let i = 0; i <= n; i++) { const d = -WAVES.deg + (2 * WAVES.deg * i) / n; pts.push(at(d, r + w(d))); }
        for (let i = n; i >= 0; i--) { const d = -WAVES.deg + (2 * WAVES.deg * i) / n; pts.push(at(d, r - w(d))); }
        s += `<path d="M${pts.join(' L')} Z" fill="${paint}" opacity="${op}"/>`;
      }
    }
    return s;
  }
  throw new Error(`모르는 틀: ${kind}`);
}

/*
 * 작은 판은 크기마다 굵기를 따로 정합니다. 붓 Q 의 머리카락 획(512 에서 2~3 단위)은 16px 에서
 * 0.1px 이 되어 사라지므로, 획을 부풀리고(feMorphology dilate) 틀 선을 굵게 하고 내용을 조금 키웁니다.
 * 512 단위 = 16px 에서 32 단위가 1px 입니다.
 */
const SMALL = {
  16: { sw: 44, dilate: 12, scale: 1.1 },
  32: { sw: 28, dilate: 7, scale: 1.08 },
  48: { sw: 20, dilate: 5, scale: 1.06 },
};

function iconSvg(product, Q, variant, px) {
  const small = variant === 'small' ? SMALL[px] : null;
  if (product.art) {
    /*
     * 완성 그림 제품(2026-10-09): 틀 없이 그림만. 작은 판은 그림을 조금 키워(1.12) 고리가 살아남게 합니다.
     * 부풀리기(dilate)는 쓰지 않습니다. 서류 · 펜촉의 밝은 면이 번져 흰 덩어리가 됩니다.
     */
    const art = Q.art[product.key];
    const href = 'data:image/png;base64,' + art.png.toString('base64');
    const img = (k) => `<image href="${href}" ${artBox(art, k)}/>`;
    let body;
    if (variant === 'any') body = `<rect width="512" height="512" rx="112" fill="${BG}"/>${img(1)}`;
    else if (variant === 'apple') body = `<rect width="512" height="512" fill="${BG}"/>${img(1)}`;
    else if (variant === 'maskable') body = `<rect width="512" height="512" fill="${BG}"/>${img(0.84)}`;
    else if (variant === 'small') body = `<rect width="512" height="512" rx="96" fill="${BG}"/>${img(1.12)}`;
    else throw new Error(variant);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">${body}</svg>`;
  }
  const [a, b, c] = STROKE[product.metal];
  const href = 'data:image/png;base64,' + Q.png[product.metal].toString('base64');
  const box = qBox(Q);
  /*
   * 작은 판의 Q: 크롬 그림을 그대로 부풀리면 dilate 가 채널마다 가장 큰 값을 퍼뜨려 반사광이 번지고,
   * 금 · 구리도 거의 흰 Q 가 됩니다(2026-09-25 확대 실측). 제품 색이 틀에만 남으므로, 부풀린 Q 를
   * 흰 가림막으로만 쓰고 그 안을 틀과 같은 금속 결(밝음 → 가운데)로 칠합니다. 음영은 이 크기에서 안 보입니다.
   */
  const qMark = small
    ? `<rect ${box} fill="url(#qmetal)" mask="url(#qmask)"/>`
    : `<image href="${href}" ${box}/>`;
  const frame = small ? frameLine(product.frame, small.sw) : frameStroke(product.frame);
  const content = frame + qMark;
  const defs = `<defs><linearGradient id="metal" gradientUnits="userSpaceOnUse" x1="0" y1="40" x2="180" y2="500">` +
    `<stop offset="0" stop-color="${a}"/><stop offset="0.45" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>` +
    (small
      ? `<linearGradient id="qmetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>` +
        `<filter id="bold" x="-25%" y="-25%" width="150%" height="150%"><feMorphology operator="dilate" radius="${small.dilate}"/>` +
        `<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0"/></filter>` +
        `<mask id="qmask" maskUnits="userSpaceOnUse" x="0" y="0" width="512" height="512"><image href="${href}" ${box} filter="url(#bold)"/></mask>`
      : '') +
    `</defs>`;
  const scaled = (k) => `<g transform="translate(256 256) scale(${k}) translate(-256 -256)">${content}</g>`;
  let body;
  if (variant === 'any') body = `<rect width="512" height="512" rx="112" fill="${BG}"/>${content}`;
  else if (variant === 'apple') body = `<rect width="512" height="512" fill="${BG}"/>${content}`;
  else if (variant === 'maskable') body = `<rect width="512" height="512" fill="${BG}"/>${scaled(0.84)}`;
  else if (variant === 'small') body = `<rect width="512" height="512" rx="96" fill="${BG}"/>${scaled(small.scale)}`;
  else throw new Error(variant);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">${defs}${body}</svg>`;
}

/*
 * 알림 표시줄 표식(badge). 안드로이드는 이 그림의 알파만 씁니다(색은 버림). 금속 음영이 들어가면
 * 반투명 조각이 흐려지므로, 틀과 Q 를 흰색 한 가지로 그립니다.
 */
function badgeSvg(product, Q) {
  if (product.art) {
    // 완성 그림 제품: 그림의 알파를 흰색 한 가지로(안드로이드는 알파만 씀). 가는 펜촉이 사라지지 않게 조금 부풀립니다.
    const art = Q.art[product.key];
    const href = 'data:image/png;base64,' + art.png.toString('base64');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512"><defs>` +
      `<filter id="white" x="-25%" y="-25%" width="150%" height="150%"><feMorphology operator="dilate" radius="5"/>` +
      `<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 0"/></filter></defs>` +
      `<image href="${href}" ${artBox(art, 1.1)} filter="url(#white)"/></svg>`;
  }
  const href = 'data:image/png;base64,' + Q.png.silver.toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512"><defs>` +
    `<filter id="white" x="-25%" y="-25%" width="150%" height="150%"><feMorphology operator="dilate" radius="4"/>` +
    `<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 0"/></filter></defs>` +
    frameLine(product.frame, 26, '#fff') +
    `<image href="${href}" ${qBox(Q)} filter="url(#white)"/></svg>`;
}

/*
 * 안드로이드 원형 오림의 안전 원: 판 한 변의 40% 반지름. 그린 maskable 에서 그 원 밖에 먹색이 아닌
 * 점이 있으면 틀이 잘릴 수 있으므로 멈춥니다. 반투명 가장자리는 허용하도록 문턱을 둡니다.
 */
async function outsideSafeZone(png) {
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;
  const [br, bg, bb] = hex(BG);
  const R = 0.4 * W;
  let n = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x + 0.5 - W / 2;
    const dy = y + 0.5 - H / 2;
    if (dx * dx + dy * dy <= R * R) continue;
    const p = (y * W + x) * C;
    if (Math.max(Math.abs(data[p] - br), Math.abs(data[p + 1] - bg), Math.abs(data[p + 2] - bb)) > 24) n++;
  }
  return n;
}

/*
 * 제품 코드가 아이콘을 지금 판 번호로 부르는가. 주소 꼴(앞에 글자 · 점 · 사선이 붙지 않은 «/이름.png»)만
 * 셉니다. 그래서 「public/icon-192.png」 · 「app/favicon.ico」 같은 설명은 세지 않습니다.
 * 파일마다 부르는 곳이 한 곳도 없으면 그것도 어긋남입니다(파일이 옮겨졌거나 refs 가 낡음).
 */
function checkRefs() {
  const names = ICON_NAMES.map((n) => n.replace(/[-]/g, '\\-')).join('|');
  const re = new RegExp(`(?<![\\w./-])/(?:(?:${names})\\.png|favicon\\.ico)(\\?v=[\\w.-]*)?`, 'g');
  const problems = [];
  let good = 0;
  for (const p of PRODUCTS) {
    for (const rel of p.refs) {
      const file = join(p.root, rel);
      if (!existsSync(file)) { problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 파일이 없습니다`); continue; }
      const text = readFileSync(file, 'utf8');
      let found = 0;
      for (const m of text.matchAll(re)) {
        found++;
        const line = text.slice(0, m.index).split('\n').length;
        if (m[1] === `?v=${ICON_VERSION}`) good++;
        else problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}:${line}  ${m[0]}  (${m[1] ? '다른 판' : '판 번호 없음'} · 지금 판 v=${ICON_VERSION})`);
      }
      if (found === 0) problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 아이콘을 부르는 곳이 없습니다`);
    }
  }
  return { good, problems };
}

/**
 * 설치 앱 설명 한 줄이 제품 쪽 파일에 원본(tagline) 그대로 있는가. 한 제품이 문구를 바꾸면 여기서 드러납니다.
 * 코드 문자열의 «\uXXXX» 는 풀어서 봅니다. Q-Carnet 매니페스트는 설명을 그렇게 적습니다(같은 줄의 · 와 한 모양).
 */
function checkTaglines() {
  const unescape = (s) => s.replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
  const problems = [];
  let good = 0;
  for (const p of PRODUCTS) {
    for (const rel of p.taglineIn) {
      const file = join(p.root, rel);
      if (!existsSync(file)) { problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 파일이 없습니다`); continue; }
      if (unescape(readFileSync(file, 'utf8')).includes(p.tagline)) good++;
      else problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 설명 「${p.tagline}」 이 없습니다`);
    }
  }
  return { good, problems };
}

/** 화면용 붓 Q 두 장. 원본 비율 그대로 너비 MARK_PX 로 줄여 WebP 90 으로 굽습니다. */
async function displayMarks() {
  const out = {};
  for (const [name, src] of Object.entries(MARKS)) {
    out[name] = await sharp(src)
      .resize({ width: MARK_PX, kernel: 'lanczos3' })
      .webp({ quality: 90, alphaQuality: 100, effort: 6 })
      .toBuffer();
  }
  return out;
}

/**
 * 붓 Q 를 그리는 파일(marksIn)이 WebP 두 장을 부르고, 옛 PNG 사본을 부르지 않는가.
 * 한 제품이 옛 PNG 로 되돌아가면 첫 방문에 다시 400KB 가 실립니다.
 */
function checkMarkRefs() {
  const problems = [];
  let good = 0;
  for (const p of PRODUCTS) {
    for (const rel of p.marksIn) {
      const file = join(p.root, rel);
      if (!existsSync(file)) { problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 파일이 없습니다`); continue; }
      /*
       * 주석은 걷고 봅니다. 「옛날에 /logo-dark.png 를 박아 썼다」 같은 사연 주석이 옛 PNG 를 «부르는» 것으로
       * 잡혔습니다(2026-09-26 첫 판 · Q-Atelier BrandLogo.tsx). 줄 주석은 «://» 앞은 건드리지 않습니다(주소 보호).
       */
      const text = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
      const missing = Object.keys(MARKS).filter((n) => !text.includes(`/${n}`));
      const old = OLD_MARK_PNGS.filter((n) => new RegExp(`['"\`(]/${n.replace(/[.-]/g, '\\$&')}`).test(text));
      if (missing.length) problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: ${missing.join(' · ')} 를 부르지 않습니다`);
      if (old.length) problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 옛 PNG(${old.join(' · ')})를 부릅니다`);
      if (!missing.length && !old.length) good++;
    }
  }
  return { good, problems };
}

/**
 * 상단 바 색 자리(theme_color · themeColor)가 titleBarIn 파일마다 있고, 모두 금속에서 나온 색 그대로인가.
 * 값은 따옴표 친 «#rrggbb» 하나여야 합니다. 밝은 테마 · 어두운 테마로 가르는 배열이나 변수 · 함수 호출은
 * 어긋남으로 셉니다(2026-09-29 결정: 두 테마 같은 색 · Q-Carnet 도 회사 색이 아니라 구리).
 * 주석은 걷고 봅니다(「옛날엔 themeColor: '#0c0c0c' 였다」 같은 사연이 걸리지 않게).
 */
function checkTitleBars() {
  const problems = [];
  let good = 0;
  for (const p of PRODUCTS) {
    const want = titleBarOf(p.metal);
    for (const rel of p.titleBarIn) {
      const file = join(p.root, rel);
      if (!existsSync(file)) { problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 파일이 없습니다`); continue; }
      // 여러 줄 주석은 줄바꿈을 남겨 걷습니다(알리는 줄 번호가 파일과 같게).
      const text = readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (c) => c.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
      const slots = [...text.matchAll(/(?:theme_color|themeColor)["']?\s*:\s*([^,\n}]*)/g)];
      if (!slots.length) { problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}: 상단 바 색 자리가 없습니다 (${want} 이어야 합니다)`); continue; }
      let ok = true;
      for (const m of slots) {
        const v = m[1].trim();
        if (v === `'${want}'` || v === `"${want}"`) continue;
        ok = false;
        const line = text.slice(0, m.index).split('\n').length;
        problems.push(`  ❌ ${p.name.padEnd(9)} ${rel}:${line}  ${v || '(값이 다음 줄)'}  (${want} 이어야 합니다)`);
      }
      if (ok) good++;
    }
  }
  return { good, problems };
}

/** ICO: 머리(6) + 항목(16 × n) + PNG 본문. PNG 를 품은 ICO 는 윈도 비스타 이후와 모든 브라우저가 읽습니다. */
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length);
  head.writeUInt16LE(0, 0);
  head.writeUInt16LE(1, 2);
  head.writeUInt16LE(pngs.length, 4);
  let offset = head.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + 16 * i;
    head.writeUInt8(size >= 256 ? 0 : size, e);
    head.writeUInt8(size >= 256 ? 0 : size, e + 1);
    head.writeUInt8(0, e + 2);
    head.writeUInt8(0, e + 3);
    head.writeUInt16LE(1, e + 4);
    head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8);
    head.writeUInt32LE(offset, e + 12);
    offset += buf.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.buf)]);
}

const sha = (b) => createHash('sha256').update(b).digest('hex');

async function main() {
  const Q = await metalQs();
  Q.art = await artworks();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1024, height: 1024 }, deviceScaleFactor: 1 });
  const render = async (svg) => {
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${svg}</body></html>`);
    /*
     * SVG 안의 <image> 는 document.images 에 잡히지 않아 «다 받았나» 를 물을 길이 없습니다.
     * 같은 주소를 Image 로 한 번 더 풀어(decode) 캐시에 올린 뒤, 두 번 그릴 틈을 주고 찍습니다.
     */
    await page.evaluate(async () => {
      const hrefs = [...document.querySelectorAll('image')].map((el) => el.getAttribute('href'));
      await Promise.all(hrefs.map((h) => { const i = new Image(); i.src = h; return i.decode(); }));
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    });
    return page.screenshot({ clip: { x: 0, y: 0, width: 1024, height: 1024 }, omitBackground: true });
  };
  const down = (buf, size) => sharp(buf).resize(size, size, { kernel: 'lanczos3' }).png({ compressionLevel: 9 }).toBuffer();

  const report = [];
  const sheet = [];
  for (const p of PRODUCTS) {
    const any = await render(iconSvg(p, Q, 'any'));
    const apple = await render(iconSvg(p, Q, 'apple'));
    const mask = await render(iconSvg(p, Q, 'maskable'));
    const outside = await outsideSafeZone(mask);
    if (outside > 0) {
      await browser.close();
      console.error(`❌ ${p.name}: 안드로이드 안전 원 밖에 그림이 ${outside} 점 있습니다. 틀을 줄이거나 maskable 배율을 낮추십시오.`);
      process.exit(1);
    }
    const small = {};
    for (const px of [16, 32, 48]) small[px] = await down(await render(iconSvg(p, Q, 'small', px)), px);
    const files = {
      'icon-192.png': await down(any, 192),
      'icon-512.png': await down(any, 512),
      'icon-192-maskable.png': await down(mask, 192),
      'icon-512-maskable.png': await down(mask, 512),
      'apple-icon.png': await sharp(apple).resize(180, 180, { kernel: 'lanczos3' }).flatten({ background: BG }).png({ compressionLevel: 9 }).toBuffer(),
      'favicon.ico': ico([16, 32, 48].map((size) => ({ size, buf: small[size] }))),
    };
    if (p.badge) files['badge-96.png'] = await down(await render(badgeSvg(p, Q)), 96);
    // iOS 앱 아이콘: 줄이지 않은 apple 그림. 판 번호 지문(files)에는 넣지 않습니다(머리의 오너 결정 2026-09-28)
    const native = p.native.length
      ? await sharp(apple).flatten({ background: BG }).removeAlpha().png({ compressionLevel: 9 }).toBuffer()
      : null;
    sheet.push({ p, any, mask, small, files, native });
  }
  await browser.close();

  /*
   * ── 판 번호 지킴 ──────────────────────────────────────────────────────────
   * 그림 한 벌의 지문을 판 번호와 함께 dist/app-icons/version.json 에 적어 둡니다. 다음에 돌릴 때
   * 지문이 달라졌는데 판 번호가 같으면, 설치된 앱이 새 그림을 모르는 채 남으므로 쓰기 전에 멈춥니다.
   */
  const setSha = sha(Buffer.from(sheet
    .flatMap(({ p, files }) => Object.entries(files).map(([name, buf]) => `${p.key}/${name}:${sha(buf)}`))
    .sort().join('\n')));
  const VERSION_FILE = join(OUT, 'version.json');
  const recorded = existsSync(VERSION_FILE) ? JSON.parse(readFileSync(VERSION_FILE, 'utf8')) : null;
  if (recorded && recorded.version === ICON_VERSION && recorded.sha !== setSha) {
    console.error(`❌ 그림이 바뀌었는데 판 번호가 그대로입니다(v=${ICON_VERSION}). 설치된 앱은 주소가 같으면 새 그림을 모릅니다.`);
    console.error('   ICON_VERSION 을 올리고, 네 제품 refs 파일의 «?v=» 도 같은 번호로 바꾼 뒤 다시 돌리십시오.');
    process.exit(1);
  }
  if (recorded && recorded.version !== ICON_VERSION && recorded.sha === setSha) {
    console.log(`⚠️ 그림은 그대로인데 판 번호만 바뀌었습니다(v=${recorded.version} → v=${ICON_VERSION}). 설치 앱에 쓸데없는 갱신 안내가 뜹니다.`);
  }

  for (const { p, files } of sheet) {
    const dir = join(OUT, p.key);
    if (!checkOnly) mkdirSync(dir, { recursive: true });
    for (const [name, buf] of Object.entries(files)) {
      if (!checkOnly) writeFileSync(join(dir, name), buf);
      const target = join(p.pub, name);
      const has = existsSync(target);
      const same = has && sha(readFileSync(target)) === sha(buf);
      if (write && !same) {
        writeFileSync(target, buf);
        /* 쓰기가 성공했다는 것과 같아졌다는 것은 다릅니다. 다시 읽어 대조합니다 */
        if (sha(readFileSync(target)) !== sha(buf)) {
          report.push(`  ❌ 쓴 뒤에도 다름  ${p.name.padEnd(9)} ${name}`);
          continue;
        }
      }
      report.push(`  ${write ? (same ? '그대로' : has ? '갱신  ' : '신규  ') : same ? '같음  ' : has ? '어긋남' : '없음  '}  ${p.name.padEnd(9)} ${name}`);
    }
  }
  if (!checkOnly) writeFileSync(VERSION_FILE, JSON.stringify({ version: ICON_VERSION, sha: setSha }, null, 2) + '\n', 'utf8');

  /*
   * 화면용 붓 Q. 위 판 번호 지문(setSha)이 만들어진 «뒤에» 다룹니다. 설치 앱 아이콘이 아니라서 지문에
   * 넣지 않습니다(머리 주석). 쓰고 · 다시 읽어 대조하는 방식은 아이콘과 같습니다.
   */
  const marks = await displayMarks();
  if (!checkOnly) {
    mkdirSync(join(OUT, 'marks'), { recursive: true });
    for (const [name, buf] of Object.entries(marks)) writeFileSync(join(OUT, 'marks', name), buf);
  }
  for (const p of PRODUCTS.filter((x) => x.marksIn.length)) {
    for (const [name, buf] of Object.entries(marks)) {
      const target = join(p.pub, name);
      const has = existsSync(target);
      const same = has && sha(readFileSync(target)) === sha(buf);
      if (write && !same) {
        writeFileSync(target, buf);
        if (sha(readFileSync(target)) !== sha(buf)) {
          report.push(`  ❌ 쓴 뒤에도 다름  ${p.name.padEnd(9)} ${name}`);
          continue;
        }
      }
      report.push(`  ${write ? (same ? '그대로' : has ? '갱신  ' : '신규  ') : same ? '같음  ' : has ? '어긋남' : '없음  '}  ${p.name.padEnd(9)} ${name}`);
    }
  }

  /*
   * iOS 앱 아이콘(2026-09-28). 판 번호 지문 «뒤에» 다룹니다(지문에 넣지 않음 · 머리의 오너 결정).
   * 받는 파일은 앱 저장소의 아이콘 자리입니다. 쓰고 · 다시 읽어 대조하는 방식은 위와 같습니다.
   */
  for (const { p, native } of sheet) {
    if (!native) continue;
    if (!checkOnly) writeFileSync(join(OUT, p.key, NATIVE_ICON), native);
    for (const target of p.native) {
      const has = existsSync(target);
      const same = has && sha(readFileSync(target)) === sha(native);
      if (write && !same) {
        writeFileSync(target, native);
        if (sha(readFileSync(target)) !== sha(native)) {
          report.push(`  ❌ 쓴 뒤에도 다름  ${p.name.padEnd(9)} iOS 앱 아이콘`);
          continue;
        }
      }
      report.push(`  ${write ? (same ? '그대로' : has ? '갱신  ' : '신규  ') : same ? '같음  ' : has ? '어긋남' : '없음  '}  ${p.name.padEnd(9)} iOS 앱 아이콘 (${target.split('/').slice(-1)[0]})`);
    }
  }

  // 제품 코드가 지금 판 번호로 부르는가 · 설치 앱 설명이 원본과 같은가 · 붓 Q 를 WebP 로 부르는가 · 상단 바가 금속 색인가
  const refs = checkRefs();
  const taglines = checkTaglines();
  const markRefs = checkMarkRefs();
  const titleBars = checkTitleBars();

  if (checkOnly) {
    const drift = report.filter((l) => /어긋남|없음/.test(l));
    console.log(`제품 앱 아이콘 대조: ${report.length - drift.length}/${report.length} 같음 · 판 v=${ICON_VERSION} 주소 ${refs.good}곳 · 설치 앱 설명 ${taglines.good}곳 · 화면 붓 Q ${markRefs.good}곳 · 상단 바 색 ${titleBars.good}곳`);
    if (drift.length) {
      console.log(drift.join('\n'));
      console.log('반영하려면 node tools/app-icons.mjs --write');
    }
    if (refs.problems.length) console.log(refs.problems.join('\n'));
    if (taglines.problems.length) console.log(taglines.problems.join('\n'));
    if (markRefs.problems.length) console.log(markRefs.problems.join('\n'));
    if (titleBars.problems.length) console.log(titleBars.problems.join('\n'));
    process.exit(drift.length || refs.problems.length || taglines.problems.length || markRefs.problems.length || titleBars.problems.length ? 1 : 0);
  }

  // 한 장짜리 견본: 제품마다 둥근 판 · 안드로이드 원형 오림 · 작은 판 48 · 32 · 16 (실제 크기)
  const cell = 200;
  const gap = 24;
  const W = gap + PRODUCTS.length * (cell + gap);
  const H = gap + cell + gap + cell + gap + 48 + gap;
  const layers = [];
  for (const [i, { any, mask, small }] of sheet.entries()) {
    const x = gap + i * (cell + gap);
    layers.push({ input: await down(any, cell), left: x, top: gap });
    const circle = Buffer.from(`<svg width="${cell}" height="${cell}"><circle cx="${cell / 2}" cy="${cell / 2}" r="${cell / 2}" fill="#fff"/></svg>`);
    const masked = await sharp(await down(mask, cell)).composite([{ input: circle, blend: 'dest-in' }]).png().toBuffer();
    layers.push({ input: masked, left: x, top: gap * 2 + cell });
    const row = gap * 3 + cell * 2;
    layers.push({ input: small[48], left: x, top: row });
    layers.push({ input: small[32], left: x + 64, top: row + 16 });
    layers.push({ input: small[16], left: x + 112, top: row + 32 });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: '#3a3a3e' } })
    .composite(layers).png().toFile(join(OUT, 'sheet.png'));

  writeFileSync(join(OUT, 'README.md'), [
    '# 제품 앱 아이콘',
    '',
    '`node tools/app-icons.mjs` 가 만든 산출물입니다. 손으로 고치지 마십시오.',
    '원본 그림은 `source/brand/logo-dark.png`, 규칙과 오너 결정은 `tools/app-icons.mjs` 머리에 있습니다.',
    '',
    '| 제품 | 금속 | 틀 | 상단 바 |',
    '|---|---|---|---|',
    ...PRODUCTS.map((p) => `| ${p.name} | ${{ silver: '은', gold: '샴페인 금', copper: '구리', steel: '강철 청' }[p.metal]} | ${{ ring: '원', house: '집', notebook: '수첩 · 제본선', waves: '음파' }[p.frame]} | \`${titleBarOf(p.metal)}\` |`),
    '',
    `상단 바: 설치 앱 창의 제목 줄 색(theme_color · themeColor). 틀 선 가운데 금속 색을 먹색 바탕 \`${BG}\` 에 ${Math.round(TITLE_BAR_MIX * 100)}% 섞은 색이고, 밝은 테마에서도 같습니다. 받는 곳은 PRODUCTS 의 titleBarIn 입니다.`,
    '',
    '파일: `icon-192.png` `icon-512.png`(둥근 판) · `icon-192-maskable.png` `icon-512-maskable.png`(안드로이드) ·',
    '`apple-icon.png`(180, iOS) · `favicon.ico`(16 · 32 · 48, 굵게 그린 작은 판) · `badge-96.png`(알림 표시줄, Q-Atelier)',
    '',
    '화면용 붓 Q: `marks/q-mark-on-dark.webp`(은색 · 어두운 면 위) · `marks/q-mark-on-light.webp`(검정 · 밝은 면 위).',
    `너비 ${MARK_PX}px · WebP 90 · 원본 비율 그대로. 받는 곳은 붓 Q 를 화면에 그리는 제품(PRODUCTS 의 marksIn)이고, 판 번호와 무관합니다.`,
    '',
    `iOS 앱 아이콘: \`${NATIVE_ICON}\`(1024 · 알파 없음 · apple 그림을 줄이지 않은 것). 받는 곳은 PRODUCTS 의 native(앱 저장소의 아이콘 자리)이고, 판 번호와 무관합니다.`,
    '',
    `제품 코드는 아이콘을 \`?v=${ICON_VERSION}\` 를 붙여 부릅니다. 그림을 바꾸면 판 번호를 올립니다(\`version.json\` 이 지킴).`,
    '',
  ].join('\n'), 'utf8');

  const drift = report.filter((l) => /어긋남|없음/.test(l)).length;
  const broken = report.filter((l) => l.includes('❌')).length;
  console.log(`제품 앱 아이콘 → ${OUT}  (${PRODUCTS.length}개 제품 · 파일 ${report.length}개 · 판 v=${ICON_VERSION})`);
  console.log(report.join('\n'));
  if (!write && drift) console.log(`\n제품 쪽과 다른 파일 ${drift}개. 반영하려면 --write`);
  if (refs.problems.length) {
    console.log(`\n제품 코드의 아이콘 주소가 판 v=${ICON_VERSION} 과 다릅니다:`);
    console.log(refs.problems.join('\n'));
  }
  if (taglines.problems.length) {
    console.log('\n설치 앱 설명이 원본(PRODUCTS 의 tagline)과 다릅니다:');
    console.log(taglines.problems.join('\n'));
  }
  if (markRefs.problems.length) {
    console.log('\n화면용 붓 Q 를 부르는 곳이 어긋났습니다(PRODUCTS 의 marksIn):');
    console.log(markRefs.problems.join('\n'));
  }
  if (titleBars.problems.length) {
    console.log('\n상단 바 색이 금속 색(titleBarOf)과 다릅니다(PRODUCTS 의 titleBarIn):');
    console.log(titleBars.problems.join('\n'));
  }
  if (broken || refs.problems.length || taglines.problems.length || markRefs.problems.length || titleBars.problems.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
