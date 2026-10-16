// =============================================================================
// 인라인 스타일 색인 생성기
// =============================================================================
// Q-Atelier 는 스타일을 인라인 style 객체로 쓰기 때문에, 키프레임·호버·미디어쿼리는
// 컴포넌트 안의 <style> 블록으로 들어갑니다.
// **globals.css 만 보면 키프레임의 절반 이상이 안 보입니다** (46종 중 27종이 인라인).
//
//   node tools/extract-inline-styles.mjs
//
// ⚠️ CSS 를 «조립» 하지 않습니다. 형태가 두 가지(백틱 직접 · 변수 참조)이고
//    클래스 이름에 런타임 id 가 섞이며 ${...} 보간이 들어 있어, 조립하면 틀립니다.
//    대신 **어디에 무엇이 있는지** 색인을 만들고, 원본은 source/screens/ 에 둡니다.
//
// 이 스크립트는 source/screens/ 의 복사본만 읽으므로 이 폴더로 재생성이 됩니다.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { emit, emitDone, CHECK } from './emit.mjs';
import { readRuntimeTemplate } from './atelier-runtime-values.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SCREENS = join(ROOT, 'source', 'screens');
const CSS_DIR = join(ROOT, 'source', 'css');
const runtimeSource = readFileSync(join(ROOT, 'source/design/atelier-runtime.ts'), 'utf8');
const recipes = new Set([...runtimeSource.matchAll(/export function (\w+)\([^)]*\): string \{ return `/g)].map(match => match[1]));
const staticRecipes = new Map([...runtimeSource.matchAll(/export const (\w+) = `([^`]*?)`;/g)].map(match => [match[1], match[2]]));

// 파일명이 평탄화되어 있습니다: app__(auth)__login__page.tsx → app/(auth)/login/page.tsx
const unflatten = (name) => name.replace(/__/g, '/');

const files = readdirSync(SCREENS).filter((f) => /\.tsx$/.test(f));
if (!files.length) {
  console.error('source/screens/ 가 비었습니다. 복사가 안 된 것 같습니다.');
  process.exit(1);
}

const rows = [];
const inlineKf = new Set();
for (const name of files) {
  const source = readFileSync(join(SCREENS, name), 'utf8');
  const linked = [];
  for (const imported of source.matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]@\/lib\/design\/q-design-runtime['"]/g)) {
    for (const entry of imported[1].split(',')) {
      const match = entry.trim().match(/^(\w+)(?:\s+as\s+(\w+))?$/);
      if (match && recipes.has(match[1]) && new RegExp('\\b' + (match[2] ?? match[1]) + '\\s*\\(').test(source)) {
        linked.push(readRuntimeTemplate(ROOT, match[1]));
      }
      if (match && staticRecipes.has(match[1]) && new RegExp('<style\\b[^>]*>\\s*\\{\\s*' + (match[2] ?? match[1]) + '\\s*\\}').test(source)) {
        linked.push(staticRecipes.get(match[1]));
      }
    }
  }
  // Inspect only canonical CSS recipes explicitly imported and called by this screen.
  const text = [source, ...linked].join('\n');
  const kf = [...text.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  const classes = [...text.matchAll(/^\s*\.([a-z][a-z0-9-]{2,})\s*[,{]/gm)].map((m) => m[1]);
  const mediaCount = (text.match(/@media[^{]*\{/g) || []).length;
  const styleTags = (source.match(/<style\b/g) || []).length;
  kf.forEach((k) => inlineKf.add(k));
  rows.push({
    path: unflatten(name),
    keyframes: [...new Set(kf)].sort(),
    classes: [...new Set(classes)].sort(),
    media: mediaCount,
    styleTags,
  });
}

// CSS 파일 쪽 키프레임
const cssKf = new Set();
for (const f of readdirSync(CSS_DIR).filter((n) => /\.css$/.test(n))) {
  const text = readFileSync(join(CSS_DIR, f), 'utf8');
  for (const m of text.matchAll(/@keyframes\s+([a-zA-Z0-9_-]+)/g)) cssKf.add(m[1]);
}

// ── 검증: 전수를 봤는가 ──────────────────────────────────────────────────────
// 「가드가 있다」는 「전수를 본다」가 아닙니다. 색인이 실제로 무언가를 잡았는지,
// 그리고 아는 만큼 잡았는지 확인하고 아니면 실패시킵니다.
const problems = [];
if (inlineKf.size === 0) problems.push('인라인 키프레임을 한 개도 못 찾았습니다 (정규식이 빈 그물일 수 있습니다)');
if (rows.every((r) => r.styleTags === 0)) problems.push('<style> 태그를 한 개도 못 찾았습니다');
const withoutAny = rows.filter((r) => r.keyframes.length === 0 && r.classes.length === 0 && r.media === 0);
if (withoutAny.length === rows.length) problems.push('모든 파일에서 아무 규칙도 못 뽑았습니다');
if (problems.length) {
  console.error('색인 검증 실패:\n  ' + problems.join('\n  '));
  process.exit(1);
}

const total = new Set([...inlineKf, ...cssKf]);
const onlyInline = [...inlineKf].filter((k) => !cssKf.has(k)).sort();

const lines = [];
lines.push('# 인라인 스타일 색인');
lines.push('');
lines.push('생성물입니다. `node tools/extract-inline-styles.mjs` 로 다시 만듭니다.');
lines.push('');
lines.push('컴포넌트의 인라인 CSS와 해당 파일이 직접 가져와 호출하는 중앙 CSS 규칙을 함께 색인합니다.');
lines.push('중앙 규칙은 `source/design/atelier-runtime.ts`에서 읽습니다. CSS 파일만 읽으면 이 규칙이 빠집니다.');
lines.push('');
lines.push('| | 개수 |');
lines.push('|---|---:|');
lines.push('| 키프레임 전체 | **' + total.size + '종** |');
lines.push('| CSS 파일에 있는 것 | ' + cssKf.size + '종 |');
lines.push('| 인라인에만 있는 것 | **' + onlyInline.length + '종** |');
lines.push('| `<style>` 을 가진 파일 | ' + rows.filter((r) => r.styleTags > 0).length + '개 |');
lines.push('');
lines.push('원본은 `source/screens/` 에 있습니다 (경로의 `/` 를 `__` 로 바꾼 이름).');
lines.push('');
lines.push('## 인라인에만 있는 키프레임');
lines.push('');
lines.push(onlyInline.map((k) => '`' + k + '`').join(' · '));
lines.push('');
lines.push('## 파일별');
lines.push('');
lines.push('| 파일 | 키프레임 | 클래스 | @media |');
lines.push('|---|---|---|---:|');
for (const r of rows.sort((a, b) => b.keyframes.length - a.keyframes.length || a.path.localeCompare(b.path))) {
  lines.push(
    '| `' + r.path + '` | ' +
      (r.keyframes.map((k) => '`' + k + '`').join(' ') || '없음') + ' | ' +
      (r.classes.length ? r.classes.slice(0, 6).map((c) => '`.' + c + '`').join(' ') + (r.classes.length > 6 ? ' 외 ' + (r.classes.length - 6) : '') : '없음') +
      ' | ' + r.media + ' |',
  );
}
lines.push('');

emit(join(ROOT, 'dist', 'inline-styles-index.md'), lines.join('\n'));

emitDone('인라인 색인');
if (CHECK) process.exit(process.exitCode ?? 0);

console.log('생성 완료 · dist/inline-styles-index.md');
console.log('  파일 ' + rows.length + '개 · 키프레임 전체 ' + total.size + '종 (CSS ' + cssKf.size + ' · 인라인 전용 ' + onlyInline.length + ')');
