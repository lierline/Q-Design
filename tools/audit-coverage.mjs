// =============================================================================
// 추출 완전성 감사
// =============================================================================
// 「다 뽑았나」에 주장이 아니라 실측으로 답합니다.
// Q-Atelier 원본에서 «디자인을 정의하는 것» 을 축별로 세고, 복사본과 대조합니다.
//
//   node tools/audit-coverage.mjs [Q-Atelier 경로] [--only=Q-Atelier,Q-Works,Q-Forge]
//
// 원본 경로가 필요합니다. 기본값 D:/Claude/Q-Atelier.
// 하나라도 누락이면 종료 코드 1 로 실패합니다.

import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PARTS, PRODUCTS as 받는제품 } from './sync-parts.mjs';
import { centralOutputs, copyProblems, isTestSource, keyframesIn, slash } from './audit-coverage-core.mjs';
import { canonicalPatternPaths, colorSet, committedCssGraph, HEXRE, normHex, parseCoverageArgs } from './audit-coverage-imports.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const options = parseCoverageArgs(process.argv.slice(2));
const SRC = resolve(options.source);

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
const central = centralOutputs(PARTS, 'Q-Atelier', 'D:/Claude/Q-Atelier');
const centralPaths = new Set(central.map(part => part.path));
/* 판 파일(2026-10-16)도 sync.mjs 가 써서 원본 안에 앉힌 파일입니다. 뽑아 올 원본이 아닙니다. */
centralPaths.add(받는제품['Q-Atelier'].version);
const sourcePath = path => slash(relative(SRC, path));
const nativeRuntime = path => !centralPaths.has(sourcePath(path)) && !isTestSource(sourcePath(path));
const kfIn = keyframesIn;

const results = [];
function check(label, expected, actual, note = '') {
  const missing = [...expected].filter((x) => !actual.has(x));
  results.push({ label, total: expected.size ?? expected.length, missing, note });
}

// ── ① 키프레임 ──────────────────────────────────────────────────────────────
const origKf = new Set();
for (const f of walk(join(SRC, 'app'), (n, p) => /\.(tsx|css)$/.test(n) && nativeRuntime(p))) kfIn(read(f)).forEach((k) => origKf.add(k));
for (const f of walk(join(SRC, 'components'), (n, p) => /\.tsx$/.test(n) && nativeRuntime(p))) kfIn(read(f)).forEach((k) => origKf.add(k));
for (const f of walk(join(SRC, 'lib'), (n, p) => /\.tsx$/.test(n) && nativeRuntime(p))) kfIn(read(f)).forEach((k) => origKf.add(k));

const copyKf = new Set();
for (const d of ['screens', 'css', 'components']) {
  const dir = join(ROOT, 'source', d);
  if (!existsSync(dir)) continue;
  for (const f of walk(dir, (n) => /\.(tsx|css)$/.test(n))) kfIn(read(f)).forEach((k) => copyKf.add(k));
}
check('제품 키프레임', origKf, copyKf, '제품 소유 런타임 원본만 집계');

// Q-Design owns these files. Audit their outgoing copies instead of requiring a return snapshot.
const centralExpected = new Set();
const centralActual = new Set();
const centralKf = new Set();
const centralCopyKf = new Set();
for (const part of central) {
  centralExpected.add(part.path);
  const source = existsSync(join(ROOT, part.src)) ? read(join(ROOT, part.src)) : null;
  const copy = existsSync(join(SRC, part.path)) ? read(join(SRC, part.path)) : null;
  const problems = copyProblems(part, source, copy);
  if (!problems.length) centralActual.add(part.path);
  else console.error('중앙 사본 불일치: ' + part.path + ' (' + problems.join(', ') + ')');
  for (const name of kfIn(source ?? '')) centralKf.add(part.path + '#' + name);
  for (const name of kfIn(copy ?? '')) centralCopyKf.add(part.path + '#' + name);
}
check('Q-Design 배포 사본', centralExpected, centralActual, 'PARTS의 정확한 경로, 정본 본문과 지문 대조');
check('Q-Design 키프레임', centralKf, centralCopyKf, '중앙 소유 규칙은 역추출하지 않고 배포 사본에서 검사');

// ── ② CSS 파일 ──────────────────────────────────────────────────────────────
const origCss = new Set(
  [...walk(join(SRC, 'app'), (n) => /\.css$/.test(n)), ...walk(join(SRC, 'components'), (n) => /\.css$/.test(n))]
    .filter(nativeRuntime)
    .map((p) => basename(p))
    /*
     * app/fonts.css 는 뺀다(2026-09-26). 원본의 scripts/fonts/build-fonts.mjs 가 Pretendard 공식 꾸러미에서 만든
     * @font-face 목록(92조각)이라 디자인 규칙이 없다. 글꼴은 이 저장소의 source/fonts · dist/q-design.fonts.css 가
     * 담고, 원본이 싣는 글꼴 «종류» 는 아래 ⑥ 이 센다.
     */
    .filter((n) => n !== 'fonts.css'),
);
const copyCss = new Set(readdirSync(join(ROOT, 'source', 'css')));
check('CSS 파일', origCss, copyCss);

// ── ③ <style> 블록을 가진 파일 ──────────────────────────────────────────────
// 테스트 파일은 스타일 정의가 아니라 «검사» 이므로 대상이 아닙니다.
const origStyled = new Set(
  ['app', 'components', 'lib']
    .flatMap((r) => walk(join(SRC, r), (n, p) => /\.tsx$/.test(n) && nativeRuntime(p)))
    .filter((p) => /<style\b/.test(read(p)))
    .map((p) => p.slice(SRC.length + 1).split('\\').join('/')),
);
const copyStyled = new Set(readdirSync(join(ROOT, 'source', 'screens')).map((n) => n.replace(/__/g, '/')));
check('style 블록 파일', origStyled, copyStyled);

// ── ④ lib/design 전체 ───────────────────────────────────────────────────────
const origDesign = new Set(readdirSync(join(SRC, 'lib', 'design')).filter((n) => nativeRuntime(join(SRC, 'lib', 'design', n))));
const copyDesign = new Set([
  ...readdirSync(join(ROOT, 'source', 'tokens')),
  ...readdirSync(join(ROOT, 'source', 'components')),
  ...readdirSync(join(ROOT, 'source', 'contracts')),
  ...readdirSync(join(ROOT, 'source', 'provider')),
]);
check('lib/design 런타임', origDesign, copyDesign, '테스트는 런타임 수에 포함하지 않음. 커밋 전 새 런타임 파일은 계속 누락으로 표시');

// ── ⑤ 브랜드 자산 ───────────────────────────────────────────────────────────
const origBrand = new Set(
  readdirSync(join(SRC, 'public')).filter((n) => /\.(png|svg|json)$/.test(n) && !/^__/.test(n)),
);
const copyBrand = new Set(readdirSync(join(ROOT, 'source', 'brand')));
check('브랜드 자산', origBrand, copyBrand, 'public/ 의 png·svg·json');

// ── ⑥ 폰트 ──────────────────────────────────────────────────────────────────
// 이름이 아니라 «글꼴 종류» 로 셉니다(2026-09-26). 원본은 이제 Pretendard 를 공식 조각판 92조각
// (public/fonts/pretendard-<판>/)으로, JetBrains Mono 를 이 저장소의 그 파일(public/fonts/jetbrains-mono/)로
// 싣습니다. 이 저장소는 Pretendard 를 조각 전의 온전한 한 파일로 갖고 있어 파일 이름이 서로 다릅니다.
// Cormorant 는 원본이 next/font/google 로 받아 public 에 없고, 이 저장소에만 파일이 있는 것이 정상입니다.
const fontFamily = (n) =>
  /pretendard/i.test(n) ? 'Pretendard' : /jetbrains/i.test(n) ? 'JetBrains Mono' : /cormorant/i.test(n) ? 'Cormorant Garamond' : n;
const origFonts = new Set(readdirSync(join(SRC, 'public', 'fonts')).map(fontFamily));
const copyFontFiles = readdirSync(join(ROOT, 'source', 'fonts')).filter((n) => /\.woff2?$/.test(n));
const copyFonts = new Set(copyFontFiles.map(fontFamily));
const extra = [...copyFonts].filter((f) => !origFonts.has(f));
check('폰트', origFonts, copyFonts, '원본이 싣는 글꼴 종류 · 이 저장소에만 있는 것: ' + (extra.join(', ') || '없음'));

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
// 🔑 **기준은 `dist/`와 PARTS가 실제 배포하는 `patterns/` 정본입니다.**
//    `source/` 는 원본의 사본이라 기준에 넣으면 자기 자신을 증명하게 됩니다.
//    중앙 소유 patterns의 fallback 색은 dist 중복 파일 없이 직접 배포됩니다.
//
// 🔑 제품마다 «약속한 범위» 가 다릅니다. Q-Forge 는 Q-Design 을 «골라» 들이기로 한
//    제품이라 고유 팔레트를 갖는 것이 정상입니다. 그런 곳까지 실패로 만들면
//    빨간불이 상수가 되고, 상수가 된 빨간불 뒤에 진짜 누락이 숨습니다.
const PRODUCTS = [
  { name: 'Q-Atelier', repo: SRC, files: ['app/globals.css', 'app/experts/expert-theme.css'], must: true,
    why: 'Q-Design 의 정본. 여기 색이 중앙 배포 정본에 없으면 추출이 덜 된 것입니다' },
  { name: 'MedQraft 문서', repo: 'D:/Claude/MedQraft Docs', files: ['templates/assets/colors_and_type.css'], must: true,
    why: '대외 문서 브랜드. 2026-09-10 부터 정본 범위 안입니다' },
  { name: 'Q-Sonar', repo: 'D:/Claude/Lead-Radar', files: ['src/app/globals.css'], must: true,
    why: '2026-09-10 수렴 완료. Q 계열은 색이 한 벌이어야 합니다' },
  { name: 'Q-Forge', repo: 'D:/Claude/DHR', files: ['app/globals.css'], must: true,
    why: '2026-09-10 수렴 완료. rem 16 · 각진 모서리는 그대로 두되 색은 한 벌입니다' },
  { name: 'MedQraft 홈', repo: 'D:/Claude/MedQraft-Site', files: ['public/styles.css', 'public/assets/insights.css'], must: false,
    why: 'Q 계열이 아닙니다(2026-09-10 결정). 통일 대상은 Q-Atelier·Q-Sonar·Q-Forge 셋뿐입니다. '
       + '다만 실측하면 이 19색은 MedQraft 문서 브랜드보다 Q-Atelier 쪽에 더 가깝습니다(문서 0 : Q 19)' },
];

const distDir = join(ROOT, 'dist');
const distTexts = readdirSync(distDir).filter(file => /\.(css|json|ts)$/.test(file)).map(file => read(join(distDir, file)));
const distCount = colorSet(distTexts).size;
if (distCount < 50) {
  console.error('dist 에서 색을 ' + distCount + '개밖에 못 찾았습니다. 검사가 헛돕니다.');
  process.exit(2);
}
const patternPaths = canonicalPatternPaths(PARTS);
const distributionColors = colorSet([...distTexts, ...patternPaths.map(path => read(join(ROOT, path)))]);

const productRows = [];
for (const p of PRODUCTS) {
  if (options.only && !options.only.has(p.name)) continue;
  if (!existsSync(join(p.repo, '.git'))) {
    productRows.push({ ...p, skipped: '저장소를 못 찾았습니다: ' + p.repo });
    continue;
  }
  const mine = new Set();
  const unreadable = [];
  let css = new Map();
  try { css = committedCssGraph(p.repo, p.files); }
  catch (error) { unreadable.push(error.message); }
  for (const t of css.values()) {
    /* «정의» 만 봅니다. var(--x) 로 쓰기만 한 것은 그 제품의 색이 아닙니다. */
    for (const m of t.matchAll(/--[a-zA-Z0-9_-]+\s*:([^;{}]*)[;}]/g)) {
      for (const h of m[1].match(HEXRE) ?? []) mine.add(normHex(h));
    }
  }
  const gap = [...mine].filter((c) => !distributionColors.has(c)).sort();
  productRows.push({ ...p, total: mine.size, gap, unreadable });
}

/* 검출력 자체 시험: 있을 리 없는 색을 넣어 빠짐으로 잡히는지 봅니다. */
{
  const probe = ['#010203'].filter((c) => !distributionColors.has(c));
  if (probe.length !== 1) {
    console.error('색 감사 자체 시험 실패: 없는 색을 빠짐으로 못 잡습니다.');
    process.exit(2);
  }
}

// ── 보고 ────────────────────────────────────────────────────────────────────
let failed = 0;
console.log('추출 완전성 감사 · 원본 ' + SRC);
console.log('제품 작업트리와 보관본의 항목 대조입니다. 정본 산출물 재현과 사본 대조는 check.mjs, 커밋 내용 대조는 refresh-source --check가 맡습니다.');
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
console.log('제품별 색 커버리지 · 중앙 배포 정본 ' + distributionColors.size + '색 (dist/ + PARTS가 배포하는 patterns/ ' + patternPaths.length + '개 파일)');
console.log('커밋된 HEAD의 로컬 CSS import를 포함한 HEX 사용자 속성 정의만 대조합니다. 전체 테마 일치 검사가 아닙니다.');
console.log('현재 세 제품의 HEX·RGB·HSL 팔레트는 build-palette --check(check.mjs 의 한 걸음)가 검사합니다.');
if (options.only) console.log('선택한 제품 색 범위: ' + [...options.only].join(', ') + ' (Atelier 파일 감사 ' + results.length + '개 축은 계속 검사)');
if (options.only?.has('Q-Works')) console.log('Q-Works의 HSL 채널은 이 기존 HEX 감사 목록에 없습니다. 제품 팔레트·컴포넌트 검사 결과를 확인해야 합니다.');
console.log('');
console.log('  ' + '제품'.padEnd(16) + '정의   담김   빠짐   범위');
let mustFail = 0;
for (const r of productRows) {
  if (r.skipped) { console.log('  ' + r.name.padEnd(16) + r.skipped); if (r.must) mustFail++; continue; }
  const held = r.total - r.gap.length;
  const scope = r.must ? '정본' : '정본 밖';
  if (r.must && (r.gap.length || r.unreadable.length || r.total === 0)) mustFail++;
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
