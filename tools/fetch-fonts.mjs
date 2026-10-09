// =============================================================================
// 글꼴 내려받기 · self-host 묶음 만들기
// =============================================================================
// Q-Atelier 는 Pretendard 만 self-host 하고 JetBrains Mono 와 Cormorant Garamond 는
// 외부 CDN(Google Fonts)에서 받습니다. 그래서 사내망·오프라인에서는 라벨 글꼴이
// 시스템 monospace 로 떨어져 «mono·대문자·넓은 자간» 라벨 언어가 무너집니다.
//
// 이 스크립트가 두 글꼴을 받아 source/fonts/ 에 넣고, CDN 없이 쓰는 @font-face 를
// dist/q-design.fonts.css 로 만듭니다.
//
//   node tools/fetch-fonts.mjs
//
// 라틴 서브셋(latin · latin-ext)만 받습니다. 한글은 Pretendard 가 담당하므로
// cyrillic·greek·vietnamese 는 필요 없습니다(용량만 늘어납니다).
// 두 글꼴 모두 SIL Open Font License 1.1 이라 재배포가 허용됩니다.
//
// ⚠️ Cormorant 는 italic 을 받지 않습니다. 브랜드 규칙입니다(폴백으로도 기울지 않게).

import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const FONT_DIR = join(ROOT, 'source', 'fonts');
const DIST = join(ROOT, 'dist');

// woff2 를 받으려면 최신 브라우저인 척해야 합니다. 아니면 ttf 가 옵니다.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

const FAMILIES = [
  { name: 'JetBrains Mono', q: 'JetBrains+Mono:wght@400;500;600;700', slug: 'jetbrains-mono' },
  { name: 'Cormorant Garamond', q: 'Cormorant+Garamond:wght@400;500;600;700', slug: 'cormorant-garamond' },
];
const KEEP = new Set(['latin', 'latin-ext']);

mkdirSync(FONT_DIR, { recursive: true });
mkdirSync(DIST, { recursive: true });

const faces = [];
let downloaded = 0;
let skipped = 0;

for (const fam of FAMILIES) {
  const cssUrl = 'https://fonts.googleapis.com/css2?family=' + fam.q + '&display=swap';
  const res = await fetch(cssUrl, { headers: { 'User-Agent': UA } });
  if (!res.ok) {
    console.error('CSS 를 못 받았습니다: ' + fam.name + ' HTTP ' + res.status);
    process.exit(1);
  }
  const css = await res.text();

  // 블록마다 앞에 `/* latin */` 주석이 붙습니다. 그것으로 서브셋을 가릅니다.
  const blocks = css.split('/*').slice(1);
  for (const raw of blocks) {
    const subset = raw.slice(0, raw.indexOf('*/')).trim();
    if (!KEEP.has(subset)) continue;
    const body = raw.slice(raw.indexOf('*/') + 2);
    const weight = (body.match(/font-weight:\s*(\d+)/) || [])[1];
    const style = (body.match(/font-style:\s*(\w+)/) || [])[1] || 'normal';
    const url = (body.match(/url\((https:[^)]+\.woff2)\)/) || [])[1];
    const range = (body.match(/unicode-range:\s*([^;]+);/) || [])[1];
    if (!weight || !url) continue;
    if (style !== 'normal') continue; // italic 은 받지 않습니다 (브랜드 규칙)

    const file = fam.slug + '-' + weight + '-' + subset + '.woff2';
    const dest = join(FONT_DIR, file);
    if (existsSync(dest) && statSync(dest).size > 1000) {
      skipped++;
    } else {
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) {
        console.error('글꼴 파일을 못 받았습니다: ' + file + ' HTTP ' + r.status);
        process.exit(1);
      }
      const buf = Buffer.from(await r.arrayBuffer());
      // woff2 는 'wOF2' 로 시작합니다. 아니면 다른 것을 받은 것입니다.
      if (buf.subarray(0, 4).toString('latin1') !== 'wOF2') {
        console.error('woff2 가 아닙니다: ' + file + ' (앞 4바이트 ' + buf.subarray(0, 4).toString('hex') + ')');
        process.exit(1);
      }
      writeFileSync(dest, buf);
      downloaded++;
    }
    faces.push({ family: fam.name, weight, subset, file, range, size: statSync(dest).size });
  }

  // 한 가족이라도 비면 중단합니다. 총합만 보면 한 가족이 통째로 빠진 묶음이
  // «생성 완료» 로 나와 dist 를 조용히 줄입니다(2026-10-09 Cormorant 65줄 사고).
  if (!faces.some((f) => f.family === fam.name)) {
    const seen = blocks.map((b) => b.slice(0, b.indexOf('*/')).trim()).join(',');
    console.error('받은 글꼴이 없습니다: ' + fam.name + ' (응답 ' + css.length + '자 · 서브셋 ' + (seen || '없음') + ')');
    console.error('  서브셋 이름이나 응답 형식이 바뀌었거나 응답이 일시적으로 달랐을 수 있습니다. dist 는 건드리지 않았습니다.');
    process.exit(1);
  }
}

if (!faces.length) {
  console.error('받은 글꼴이 없습니다. 서브셋 이름이나 응답 형식이 바뀌었을 수 있습니다.');
  process.exit(1);
}

// ── @font-face 묶음 ─────────────────────────────────────────────────────────
// 경로는 dist/ 에서 source/fonts/ 로 갑니다. 다른 곳에 둘 때는 url() 만 고치면 됩니다.
const lines = [
  '/* =============================================================================',
  '   Q-Design 글꼴 · 생성물 (tools/fetch-fonts.mjs)',
  '   =============================================================================',
  '   CDN 없이 쓰는 self-host 묶음입니다. 원본 앱은 JetBrains Mono 를 Google Fonts 에서,',
  '   Cormorant 를 next/font 로 받지만, 사내망·오프라인에서는 그 경로가 막힙니다.',
  '',
  '   쓰는 법: 이 파일을 토큰 CSS 보다 «먼저» 링크하십시오.',
  '     <link rel="stylesheet" href="dist/q-design.fonts.css">',
  '     <link rel="stylesheet" href="dist/q-design.tokens.css">',
  '',
  '   ⚠️ Pretendard 는 이 파일에 없습니다. 아래 @font-face 가 따로 있고',
  '      파일이 2MB 라 필요할 때만 싣도록 분리해 두었습니다.',
  '   ⚠️ Cormorant italic 은 일부러 넣지 않았습니다(브랜드 규칙).',
  '',
  '   라이선스: 세 글꼴 모두 SIL Open Font License 1.1 · source/fonts/NOTICE.md',
  '   ============================================================================= */',
  '',
  '/* ── Pretendard Variable · 본문·헤딩 전부 ──────────────────────────────── */',
  '@font-face {',
  "  font-family: 'Pretendard Variable';",
  "  src: url('../source/fonts/PretendardVariable.woff2') format('woff2-variations');",
  '  font-weight: 45 920;',
  '  font-style: normal;',
  '  font-display: swap;',
  '}',
  '',
];

let lastFamily = '';
for (const f of faces.sort((a, b) => a.family.localeCompare(b.family) || a.weight - b.weight || a.subset.localeCompare(b.subset))) {
  if (f.family !== lastFamily) {
    lastFamily = f.family;
    const role = f.family === 'JetBrains Mono' ? '라벨·배지·코드' : '영문 디스플레이 전용(로그인 히어로)';
    lines.push('/* ── ' + f.family + ' · ' + role + ' ─────────────────────── */');
  }
  lines.push('@font-face {');
  lines.push("  font-family: '" + f.family + "';");
  lines.push("  src: url('../source/fonts/" + f.file + "') format('woff2');");
  lines.push('  font-weight: ' + f.weight + ';');
  lines.push('  font-style: normal;');
  lines.push('  font-display: swap;');
  if (f.range) lines.push('  unicode-range: ' + f.range + ';');
  lines.push('}');
}
lines.push('');
lines.push('/* ── 앱이 기대하는 변수 이름으로 이어 줍니다 ───────────────────────── */');
lines.push('/* 원본은 next/font 가 이 변수들을 주입합니다. self-host 할 때는 여기서 채웁니다. */');
lines.push(':root {');
lines.push("  --qa-font-pretendard: 'Pretendard Variable';");
lines.push("  --qa-font-cormorant: 'Cormorant Garamond';");
lines.push('}');
lines.push('');

writeFileSync(join(DIST, 'q-design.fonts.css'), lines.join('\n'), 'utf8');

const total = faces.reduce((n, f) => n + f.size, 0);
console.log('생성 완료 · dist/q-design.fonts.css');
console.log('  새로 받음 ' + downloaded + '개 · 이미 있음 ' + skipped + '개');
console.log('  @font-face ' + (faces.length + 1) + '개 (Pretendard 포함)');
console.log('  받은 글꼴 합계 ' + Math.round(total / 1024) + 'KB');
for (const fam of FAMILIES) {
  const mine = faces.filter((f) => f.family === fam.name);
  console.log(
    '  ' + fam.name.padEnd(20) + mine.length + '개 · ' +
      Math.round(mine.reduce((n, f) => n + f.size, 0) / 1024) + 'KB · weight ' +
      [...new Set(mine.map((f) => f.weight))].join('/'),
  );
}
