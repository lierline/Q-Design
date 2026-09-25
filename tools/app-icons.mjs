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
// 🔑 Q 는 네 제품이 같은 크롬 붓 Q 입니다(패밀리 표식 · 화면 속 차림표 · 로그인과 같은 그림).
//    모양은 건드리지 않고 명도를 금속 계단에 대응시켜 색만 바꿉니다. 음영은 원본 그대로 남습니다.
// 🔑 원본 그림은 source/brand/logo-dark.png (Q-Atelier public 의 사본, refresh-source 가 받아 옵니다).
//
// ── 크기마다 따로 그립니다 ───────────────────────────────────────────────────
//   any       둥근 먹색 판. 데스크톱 설치 앱 · 작업 표시줄 · 안드로이드가 아닌 곳   192 · 512
//   maskable  판 없이 가득 찬 먹색. 안드로이드가 원 · 둥근 네모로 오려 냅니다.
//             안쪽 지름 80% 원(반지름 204.8) 밖은 잘릴 수 있어 내용을 0.84 로 줄입니다  192 · 512
//   apple     판 없이 가득 찬 먹색. iOS 가 모서리를 스스로 둥글립니다                 180
//   small     브라우저 탭 · 작업 표시줄의 16 · 24 · 32px. 가는 선과 붓 Q 의 머리카락 획이
//             사라지므로 선을 굵게, Q 획을 부풀려(dilate) 그립니다                    ICO 16 · 32 · 48
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
 */
const PRODUCTS = [
  { key: 'atelier', name: 'Q-Atelier', metal: 'silver', frame: 'ring', pub: 'D:/Claude/Q-Atelier/public', badge: true },
  { key: 'maison', name: 'Q-Maison', metal: 'gold', frame: 'house', pub: 'D:/Claude/Q-Works/public' },
  { key: 'carnet', name: 'Q-Carnet', metal: 'copper', frame: 'notebook', pub: 'D:/Claude/DHR/public' },
  { key: 'sonar', name: 'Q-Sonar', metal: 'steel', frame: 'waves', pub: 'D:/Claude/Lead-Radar/public' },
];

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
  /*
   * 몸통 원의 가운데: 꼬리(아래 30%)를 빼고 위 70% 의 가로 범위로 잡습니다. 붓 꼬리가 오른쪽으로
   * 길게 나가므로 그림 전체의 가운데에 놓으면 원이 왼쪽으로 치우쳐 보입니다.
   */
  let bx0 = cw, bx1 = -1;
  for (let y = 0; y < Math.floor(ch * 0.7); y++) for (let x = 0; x < cw; x++) {
    if (data[((y + y0) * W + (x + x0)) * 4 + 3] > 127) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; }
  }
  const crop = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) data.copy(crop, y * cw * 4, ((y + y0) * W + x0) * 4, ((y + y0) * W + x1 + 1) * 4);

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
  return { png: out, w: cw, h: ch, bowlCx: (bx0 + bx1) / 2 };
}

// ── 틀과 Q 의 자리 (512 단위) ───────────────────────────────────────────────
/*
 * Q 의 h 는 그림 높이, (cx, cy) 는 «몸통 원의 가운데 · 그림 높이의 가운데» 입니다.
 * 수첩은 오른쪽 고무줄 띠 때문에 Q 를 왼쪽으로 조금 옮기고 줄였습니다(붓 꼬리가 띠에 닿았습니다).
 */
const LAYOUT = {
  ring: { q: { h: 232, cx: 248, cy: 256 } },
  house: { q: { h: 198, cx: 248, cy: 300 } },
  notebook: { q: { h: 212, cx: 232, cy: 258 } },
  waves: { q: { h: 236, cx: 248, cy: 256 } },
};

/*
 * 🔴 틀의 결은 userSpaceOnUse 로 겁니다. objectBoundingBox(기본값)로 걸면 폭이 0 인 세로선(수첩의
 *    고무줄 띠)에서 결을 계산하지 못해 선이 통째로 사라집니다(2026-09-25 시안에서 실제로 빠졌습니다).
 */
function frameSvg(kind, sw, paint = 'url(#metal)') {
  const st = `fill="none" stroke="${paint}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"`;
  if (kind === 'ring') return `<circle cx="256" cy="256" r="186" ${st}/>`;
  if (kind === 'house') return `<path d="M100 212 L256 84 L412 212 L412 432 L100 432 Z" ${st}/>`;
  if (kind === 'notebook') {
    return `<rect x="118" y="74" width="276" height="364" rx="24" ${st}/>` +
      `<line x1="366" y1="74" x2="366" y2="438" ${st}/>`;
  }
  if (kind === 'waves') {
    let s = '';
    for (const [r, op] of [[166, 1], [208, 0.55]]) {
      for (const side of [-1, 1]) {
        let a0 = (-38 * Math.PI) / 180;
        let a1 = (38 * Math.PI) / 180;
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
  const lay = LAYOUT[product.frame].q;
  const small = variant === 'small' ? SMALL[px] : null;
  const sw = small ? small.sw : 9;
  const s = lay.h / Q.h;
  const qw = Q.w * s;
  const qx = lay.cx - Q.bowlCx * s;
  const qy = lay.cy - lay.h / 2;
  const [a, b, c] = STROKE[product.metal];
  const href = 'data:image/png;base64,' + Q.png[product.metal].toString('base64');
  const box = `x="${qx.toFixed(2)}" y="${qy.toFixed(2)}" width="${qw.toFixed(2)}" height="${lay.h}"`;
  /*
   * 작은 판의 Q: 크롬 그림을 그대로 부풀리면 dilate 가 채널마다 가장 큰 값을 퍼뜨려 반사광이 번지고,
   * 금 · 구리도 거의 흰 Q 가 됩니다(2026-09-25 확대 실측). 제품 색이 틀에만 남으므로, 부풀린 Q 를
   * 흰 가림막으로만 쓰고 그 안을 틀과 같은 금속 결(밝음 → 가운데)로 칠합니다. 음영은 이 크기에서 안 보입니다.
   */
  const qMark = small
    ? `<rect ${box} fill="url(#qmetal)" mask="url(#qmask)"/>`
    : `<image href="${href}" ${box}/>`;
  const content = frameSvg(product.frame, sw) + qMark;
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
  const lay = LAYOUT[product.frame].q;
  const s = lay.h / Q.h;
  const href = 'data:image/png;base64,' + Q.png.silver.toString('base64');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512"><defs>` +
    `<filter id="white" x="-25%" y="-25%" width="150%" height="150%"><feMorphology operator="dilate" radius="4"/>` +
    `<feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1.6 0"/></filter></defs>` +
    frameSvg(product.frame, 26, '#fff') +
    `<image href="${href}" x="${(lay.cx - Q.bowlCx * s).toFixed(2)}" y="${(lay.cy - lay.h / 2).toFixed(2)}" width="${(Q.w * s).toFixed(2)}" height="${lay.h}" filter="url(#white)"/></svg>`;
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
    sheet.push({ p, any, mask, small });

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
  await browser.close();

  if (checkOnly) {
    const drift = report.filter((l) => /어긋남|없음/.test(l));
    console.log(`제품 앱 아이콘 대조: ${report.length - drift.length}/${report.length} 같음`);
    if (drift.length) {
      console.log(drift.join('\n'));
      console.log('반영하려면 node tools/app-icons.mjs --write');
    }
    process.exit(drift.length ? 1 : 0);
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
    '| 제품 | 금속 | 틀 |',
    '|---|---|---|',
    ...PRODUCTS.map((p) => `| ${p.name} | ${{ silver: '은', gold: '샴페인 금', copper: '구리', steel: '강철 청' }[p.metal]} | ${{ ring: '원', house: '집', notebook: '수첩 · 고무줄 띠', waves: '음파' }[p.frame]} |`),
    '',
    '파일: `icon-192.png` `icon-512.png`(둥근 판) · `icon-192-maskable.png` `icon-512-maskable.png`(안드로이드) ·',
    '`apple-icon.png`(180, iOS) · `favicon.ico`(16 · 32 · 48, 굵게 그린 작은 판) · `badge-96.png`(알림 표시줄, Q-Atelier)',
    '',
  ].join('\n'), 'utf8');

  const drift = report.filter((l) => /어긋남|없음/.test(l)).length;
  const broken = report.filter((l) => l.includes('❌')).length;
  console.log(`제품 앱 아이콘 → ${OUT}  (${PRODUCTS.length}개 제품 · 파일 ${report.length}개)`);
  console.log(report.join('\n'));
  if (!write && drift) console.log(`\n제품 쪽과 다른 파일 ${drift}개. 반영하려면 --write`);
  if (broken) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
