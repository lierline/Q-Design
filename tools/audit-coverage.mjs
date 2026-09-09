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
  [...walk(join(SRC, 'app'), (n) => /\.css$/.test(n)), ...walk(join(SRC, 'components'), (n) => /\.css$/.test(n))].map((p) => basename(p)),
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
const origDesign = new Set(readdirSync(join(SRC, 'lib', 'design')));
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
console.log('');
if (failed) {
  console.log('축 ' + failed + '개에 누락이 있습니다.');
  process.exit(1);
}
console.log('누락 없음 · 축 ' + results.length + '개 전부 통과');
