// =============================================================================
// 추출 완전성 감사
// =============================================================================
// 「다 뽑았나」에 주장이 아니라 실측으로 답합니다.
// Q-Atelier 원본에서 «디자인을 정의하는 것» 을 축별로 세고, 복사본과 대조합니다.
//
//   node tools/audit-coverage.mjs [Q-Atelier 경로]
//
// 원본 경로가 필요합니다. 기본값 D:/Claude/Q-Atelier.
// 하나라도 누락이면 종료 코드 1 로 실패합니다.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = process.argv[2] || 'D:/Claude/Q-Atelier';

if (!existsSync(SRC)) {
  console.error('원본을 못 찾았습니다: ' + SRC);
  process.exit(2);
}

const SKIP = new Set(['node_modules', '.next', '.git', 'android', 'capacitor-www']);
function walk(dir, test, out = []) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, test, out);
    else if (test(name, p)) out.push(p);
  }
  return out;
}

const read = (p) => readFileSync(p, 'utf8');

/*
 * 🔴 Q-Design 이 «내보낸» 파일은 원본이 아닙니다.
 *    `q-design.doc.ts` · `q-design.print.css` 는 이 저장소에서 나가 원본 안에 앉아 있는
 *    사본입니다. 그것을 「아직 안 뽑았다」로 세면 감사가 언제나 빨간불이 되고,
 *    빨간불이 상수가 되면 «진짜 누락» 이 그 뒤에 숨습니다.
 */
const 내보낸것 = (name) => /^q-design\./.test(name);
const kfIn = (text) => [...text.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);

const results = [];
function check(label, expected, actual, note = '') {
  const missing = [...expected].filter((x) => !actual.has(x));
  results.push({ label, total: expected.size ?? expected.length, missing, note });
}

// ── ① 키프레임 ──────────────────────────────────────────────────────────────
const origKf = new Set();
for (const f of walk(join(SRC, 'app'), (n) => /\.(tsx|css)$/.test(n))) kfIn(read(f)).forEach((k) => origKf.add(k));
for (const f of walk(join(SRC, 'components'), (n) => /\.tsx$/.test(n))) kfIn(read(f)).forEach((k) => origKf.add(k));
for (const f of walk(join(SRC, 'lib'), (n) => /\.tsx$/.test(n))) kfIn(read(f)).forEach((k) => origKf.add(k));

const copyKf = new Set();
for (const d of ['screens', 'css', 'components']) {
  const dir = join(ROOT, 'source', d);
  if (!existsSync(dir)) continue;
  for (const f of walk(dir, (n) => /\.(tsx|css)$/.test(n))) kfIn(read(f)).forEach((k) => copyKf.add(k));
}
check('키프레임', origKf, copyKf);

// ── ② CSS 파일 ──────────────────────────────────────────────────────────────
const origCss = new Set(
  [...walk(join(SRC, 'app'), (n) => /\.css$/.test(n)), ...walk(join(SRC, 'components'), (n) => /\.css$/.test(n))]
    .map((p) => basename(p))
    .filter((n) => !내보낸것(n)),
);
const copyCss = new Set(readdirSync(join(ROOT, 'source', 'css')));
check('CSS 파일', origCss, copyCss);

// ── ③ <style> 블록을 가진 파일 ──────────────────────────────────────────────
// 테스트 파일은 스타일 정의가 아니라 «검사» 이므로 대상이 아닙니다.
const origStyled = new Set(
  ['app', 'components', 'lib']
    .flatMap((r) => walk(join(SRC, r), (n) => /\.tsx$/.test(n) && !/\.test\.tsx$/.test(n)))
    .filter((p) => /<style\b/.test(read(p)))
    .map((p) => p.slice(SRC.length + 1).split('\\').join('/')),
);
const copyStyled = new Set(readdirSync(join(ROOT, 'source', 'screens')).map((n) => n.replace(/__/g, '/')));
check('style 블록 파일', origStyled, copyStyled);

// ── ④ lib/design 전체 ───────────────────────────────────────────────────────
const origDesign = new Set(readdirSync(join(SRC, 'lib', 'design')).filter((n) => !내보낸것(n)));
const copyDesign = new Set([
  ...readdirSync(join(ROOT, 'source', 'tokens')),
  ...readdirSync(join(ROOT, 'source', 'components')),
  ...readdirSync(join(ROOT, 'source', 'contracts')),
  ...readdirSync(join(ROOT, 'source', 'provider')),
]);
check('lib/design 파일', origDesign, copyDesign);

// ── ⑤ 브랜드 자산 ───────────────────────────────────────────────────────────
const origBrand = new Set(
  readdirSync(join(SRC, 'public')).filter((n) => /\.(png|svg|json)$/.test(n) && !/^__/.test(n)),
);
const copyBrand = new Set(readdirSync(join(ROOT, 'source', 'brand')));
check('브랜드 자산', origBrand, copyBrand, 'public/ 의 png·svg·json');

// ── ⑥ 폰트 ──────────────────────────────────────────────────────────────────
// 원본은 Pretendard 만 self-host 합니다. 이 저장소는 JetBrains Mono 와 Cormorant 도
// 파일로 갖고 있으므로(CDN 없이 쓰려고) 복사본이 원본보다 «많은» 것이 정상입니다.
const origFonts = new Set(readdirSync(join(SRC, 'public', 'fonts')));
const copyFontFiles = readdirSync(join(ROOT, 'source', 'fonts'));
const copyFonts = new Set(copyFontFiles);
const extra = copyFontFiles.filter((n) => /\.woff2?$/.test(n) && !origFonts.has(n)).length;
check('폰트', origFonts, copyFonts, '원본 self-host 분 · 추가 self-host ' + extra + '개는 별도');

// ── 검출력 자체 시험 ────────────────────────────────────────────────────────
// 「누락 없음」이 «다 있다» 가 아니라 «내 그물이 아무것도 못 봤다» 일 수 있습니다.
// 있을 리 없는 항목을 기대 목록에 넣어, 감사가 그것을 누락으로 잡는지 먼저 봅니다.
{
  const probe = new Set([...origKf, '__없는키프레임__']);
  const detected = [...probe].filter((x) => !copyKf.has(x));
  if (!detected.includes('__없는키프레임__')) {
    console.error('감사 자체 시험 실패: 없는 항목을 누락으로 못 잡습니다. 결과를 신뢰할 수 없습니다.');
    process.exit(2);
  }
}

// ── ⑦ 제품별 색 커버리지 (2026-09-10 신설) ──────────────────────────────────
// 「디자인 다 뽑았나」에 주장이 아니라 숫자로 답하는 자리입니다.
//
// 🔑 **이름이 아니라 «값» 으로 셉니다.** 산출물이 이름을 바꿔 담기 때문입니다.
//    `q-design.brief.json` 은 `--mq-bg` 를 `surface.bg` 로 담습니다. 이름으로 세면
//    86개가 「빠졌다」고 나오는데 전부 들어 있습니다. 실제로 그렇게 한 번 오판했습니다.
//
// 🔑 **기준은 `dist/` 뿐입니다.** `source/` 는 원본의 사본이라 기준에 넣으면
//    원본 파일이 자기 자신을 증명하고 언제나 100% 가 나옵니다.
//
// 🔑 제품마다 «약속한 범위» 가 다릅니다. Q-Forge 는 Q-Design 을 «골라» 들이기로 한
//    제품이라 고유 팔레트를 갖는 것이 정상입니다. 그런 곳까지 실패로 만들면
//    빨간불이 상수가 되고, 상수가 된 빨간불 뒤에 진짜 누락이 숨습니다.
const PRODUCTS = [
  { name: 'Q-Atelier', repo: SRC, files: ['app/globals.css', 'app/experts/expert-theme.css'], must: true,
    why: 'Q-Design 의 정본. 여기 색이 dist 에 없으면 추출이 덜 된 것입니다' },
  { name: 'MedQraft 문서', repo: 'D:/Claude/MedQraft', files: ['templates/assets/colors_and_type.css'], must: true,
    why: '대외 문서 브랜드. 2026-09-10 부터 정본 범위 안입니다' },
  { name: 'Q-Sonar', repo: 'D:/Claude/Lead-Radar', files: ['src/app/globals.css'], must: true,
    why: '2026-09-10 수렴 완료. Q 계열은 색이 한 벌이어야 합니다' },
  { name: 'Q-Forge', repo: 'D:/Claude/DHR', files: ['app/globals.css'], must: true,
    why: '2026-09-10 수렴 완료. rem 16 · 각진 모서리는 그대로 두되 색은 한 벌입니다' },
  { name: 'MedQraft 홈', repo: 'D:/Claude/MedQraft-Site', files: ['public/styles.css', 'public/assets/insights.css'], must: false,
    why: 'Q 계열이 아닙니다(2026-09-10 결정). 통일 대상은 Q-Atelier·Q-Sonar·Q-Forge 셋뿐입니다. '
       + '다만 실측하면 이 19색은 MedQraft 문서 브랜드보다 Q-Atelier 쪽에 더 가깝습니다(문서 0 : Q 19)' },
];

const HEXRE = /#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const normHex = (h) => {
  let x = h.slice(1).toLowerCase();
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  return '#' + x.slice(0, 6);
};

function headText(repo, path) {
  const r = spawnSync('git', ['-C', repo, 'show', 'HEAD:' + path], { maxBuffer: 32 * 1024 * 1024 });
  return r.status === 0 ? r.stdout.toString('utf8') : null;
}

const distDir = join(ROOT, 'dist');
const distColors = new Set();
for (const f of readdirSync(distDir)) {
  if (!/\.(css|json|ts)$/.test(f)) continue;
  for (const h of read(join(distDir, f)).match(HEXRE) ?? []) distColors.add(normHex(h));
}
if (distColors.size < 50) {
  console.error('dist 에서 색을 ' + distColors.size + '개밖에 못 찾았습니다. 검사가 헛돕니다.');
  process.exit(2);
}

const productRows = [];
for (const p of PRODUCTS) {
  if (!existsSync(join(p.repo, '.git'))) {
    productRows.push({ ...p, skipped: '저장소를 못 찾았습니다: ' + p.repo });
    continue;
  }
  const mine = new Set();
  const unreadable = [];
  for (const f of p.files) {
    const t = headText(p.repo, f);
    if (t === null) { unreadable.push(f); continue; }
    /* «정의» 만 봅니다. var(--x) 로 쓰기만 한 것은 그 제품의 색이 아닙니다. */
    for (const m of t.matchAll(/--[a-zA-Z0-9_-]+\s*:([^;{}]*)[;}]/g)) {
      for (const h of m[1].match(HEXRE) ?? []) mine.add(normHex(h));
    }
  }
  const gap = [...mine].filter((c) => !distColors.has(c)).sort();
  productRows.push({ ...p, total: mine.size, gap, unreadable });
}

/* 검출력 자체 시험: 있을 리 없는 색을 넣어 빠짐으로 잡히는지 봅니다. */
{
  const probe = ['#010203'].filter((c) => !distColors.has(c));
  if (probe.length !== 1) {
    console.error('색 감사 자체 시험 실패: 없는 색을 빠짐으로 못 잡습니다.');
    process.exit(2);
  }
}

// ── 보고 ────────────────────────────────────────────────────────────────────
let failed = 0;
console.log('추출 완전성 감사 · 원본 ' + SRC);
console.log('');
for (const r of results) {
  const n = typeof r.total === 'number' ? r.total : r.total;
  const ok = r.missing.length === 0;
  if (!ok) failed++;
  console.log(
    (ok ? '  OK   ' : '  누락 ') +
      r.label.padEnd(18) +
      String(n).padStart(3) + '개' +
      (ok ? '' : '  ← 빠짐 ' + r.missing.length + ': ' + r.missing.slice(0, 8).join(', ') + (r.missing.length > 8 ? ' 외' : '')) +
      (r.note && ok ? '  (' + r.note + ')' : ''),
  );
}
// ── 제품별 색 커버리지 보고 ────────────────────────────────────────────────
console.log('');
console.log('제품별 색 커버리지 · 기준은 dist/ 의 ' + distColors.size + '색 (이름 아니라 값)');
console.log('');
console.log('  ' + '제품'.padEnd(16) + '정의   담김   빠짐   범위');
let mustFail = 0;
for (const r of productRows) {
  if (r.skipped) { console.log('  ' + r.name.padEnd(16) + r.skipped); continue; }
  const held = r.total - r.gap.length;
  const scope = r.must ? '정본' : '정본 밖';
  if (r.must && r.gap.length) mustFail++;
  console.log(
    '  ' + r.name.padEnd(16) +
    String(r.total).padStart(3) + '  ' + String(held).padStart(5) + '  ' +
    String(r.gap.length).padStart(5) + '   ' + scope,
  );
  if (r.unreadable.length) console.log('      ⚠️ 읽지 못한 파일: ' + r.unreadable.join(', '));
}
console.log('');
for (const r of productRows) {
  if (r.skipped || !r.gap.length) continue;
  console.log('  ' + r.name + ' 에만 있는 색 ' + r.gap.length + '개 · ' + r.why);
  console.log('    ' + r.gap.slice(0, 12).join('  ') + (r.gap.length > 12 ? '  외 ' + (r.gap.length - 12) + '개' : ''));
}
if (mustFail) {
  console.log('');
  console.log('🔴 «정본» 범위인 제품에 빠진 색이 있습니다. 추출이 덜 됐습니다.');
  failed += mustFail;
}

console.log('');
if (failed) {
  console.log('축 ' + failed + '개에 누락이 있습니다.');
  process.exit(1);
}
console.log('누락 없음 · 파일 축 ' + results.length + '개 + 제품 색 축 ' + productRows.length + '개 전부 통과');
console.log('  (「정본 밖」 제품의 고유 색은 빠짐으로 세지 않습니다. 범위는 PRODUCTS 에 이유와 함께 적혀 있습니다)');
