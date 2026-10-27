// =============================================================================
// 정본 CSS 의 한글 자간 검사
// =============================================================================
//   node tools/check-hangul-canon.mjs
//
// 정본 화면 CSS(차림표 · 목록 · 뼈대 · 부품 · 업무 조작)에서 눈에 보이는 자간(0.3px 또는 0.05em 이상)이나
// 대문자를 거는 규칙마다, 같은 클래스에 [data-hangul] 풀림 짝이 있는지 봅니다. 정본 주석이 제품에
// 「한글이 섞이면 data-hangul 을 붙이세요. 자간과 대문자가 함께 풀립니다」 라고 약속하므로, 그 약속이
// 정본 안에서 지켜지는지를 보는 검사입니다. 늘 초록이어야 하는 검사(check.mjs)의 한 걸음입니다.
//
// 🔑 letter-spacing 이 var() 로 오면 변수 정의를 따라가 풉니다(hangul-tracking.mjs). 풀 수 없으면 실패입니다.
// 🔑 제품을 읽지 않습니다. 제품 소스에서 한글이 박힌 자리를 찾는 일은 check-hangul-source.mjs(감사)가 합니다.
// 🔑 제품별 바탕 조립본(dist/q-design.foundation.*.css)은 넣지 않습니다. 로그인 장식 글처럼 라틴 전용 자리가
//    많고, 거기에 어떤 글이 들어가는지는 제품 화면이 정합니다. 그쪽은 감사에서 봅니다.
//
// 통과로 치는 자리
//   · 선택자가 [data-latin] 이나 [data-hangul] 을 이미 단 규칙(한쪽으로 정해 둔 자리)
//   · ::before · ::after 가운데 content 가 숫자 세기(counter)이거나 한글 없는 따옴표 글인 것
//   · 같은 클래스를 단 [data-hangul] 규칙이 자간을 0 · normal 로, 대문자를 none 으로 푸는 것
// 2026-10-16(군살 빼기 4단계)에 만들었고, 처음 돌렸을 때 차림표 판 번호 줄의 이름 칸이 대문자만 풀고
// 부모에게 물려받은 자간 0.6px 은 풀지 않던 것을 잡았습니다(extract-nav 에서 고침).
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cssRules, customProperties, trackingOf, releasesTracking } from './hangul-tracking.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CANON = ['dist/q-design.nav.css', 'dist/q-design.list.css', 'dist/q-design.screen.css', 'patterns/components.css', 'patterns/workspace.css'];
/* 변수 정의는 정본 CSS 전부에서 모읍니다(토큰 · 팔레트 · 바탕 포함) */
const DEFINITION_FILES = [
  ...readdirSync(join(ROOT, 'dist')).filter((name) => name.endsWith('.css')).map((name) => join(ROOT, 'dist', name)),
  ...readdirSync(join(ROOT, 'patterns')).filter((name) => name.endsWith('.css')).map((name) => join(ROOT, 'patterns', name)),
];
const defs = customProperties(DEFINITION_FILES);
const HANGUL = /[가-힣]/;

/** 쉼표로 나뉜 선택자 목록을 괄호 안 쉼표는 두고 나눕니다 */
function splitSelectors(sel) {
  const parts = [];
  let depth = 0, start = 0;
  for (let i = 0; i < sel.length; i++) {
    if (sel[i] === '(') depth++;
    else if (sel[i] === ')') depth--;
    else if (sel[i] === ',' && depth === 0) { parts.push(sel.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(sel.slice(start).trim());
  return parts.filter(Boolean);
}
const classesOf = (sel) => [...sel.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
const hasClass = (sel, name) => new RegExp(`\\.${name.replace(/[-]/g, '\\-')}(?![\\w-])`).test(sel);

const rules = CANON.flatMap((file) => cssRules(readFileSync(join(ROOT, file), 'utf8')).map((rule) => ({ ...rule, file })));
const releases = rules.flatMap((rule) => splitSelectors(rule.sel).filter((sel) => sel.includes('[data-hangul]')).map((sel) => ({ sel, body: rule.body })));

const problems = [];
let tracked = 0, viaVar = 0;
for (const rule of rules) {
  const spacing = /letter-spacing:\s*([^;]+)/.exec(rule.body)?.[1].trim();
  const upper = /text-transform:\s*uppercase/.test(rule.body);
  if (!spacing && !upper) continue;
  const tracking = spacing ? trackingOf(spacing, defs) : { visible: false, unresolved: false, values: [] };
  if (spacing?.includes('var(')) viaVar++;
  for (const sel of splitSelectors(rule.sel)) {
    if (tracking.unresolved) { problems.push(`${rule.file}  ${sel}  letter-spacing: ${spacing} 를 풀 수 없습니다`); continue; }
    if (!tracking.visible && !upper) continue;
    tracked++;
    if (/\[data-(?:latin|hangul)\]/.test(sel)) continue;
    if (/::?(?:before|after)\b/.test(sel)) {
      const content = /content:\s*([^;]+)/.exec(rule.body)?.[1].trim() ?? '';
      if (/^counter\(/.test(content) || (/^(['"]).*\1$/.test(content) && !HANGUL.test(content))) continue;
    }
    const names = classesOf(sel);
    const mine = releases.filter((release) => names.some((name) => hasClass(release.sel, name)));
    const spacingFreed = !tracking.visible || mine.some((release) => {
      const value = /letter-spacing:\s*([^;]+)/.exec(release.body)?.[1].trim();
      return value !== undefined && releasesTracking(value, defs);
    });
    const upperFreed = !upper || mine.some((release) => /text-transform:\s*none/.test(release.body));
    if (spacingFreed && upperFreed) continue;
    const missing = [spacingFreed ? null : `자간 ${spacing}${spacing.includes('var(') ? ' = ' + tracking.values.join(' | ') : ''}`, upperFreed ? null : '대문자'].filter(Boolean);
    problems.push(`${rule.file}  ${sel}  [data-hangul] 풀림 짝이 없습니다: ${missing.join(' · ')}`);
  }
}

/* 어절 공백 줄임(--qd-hangul-word-space)은 고정폭 공백(0.6em)을 본문 폭으로 맞추는 값입니다. 같은 규칙에서
   글꼴을 본문체로 바꾸면 공백이 음수가 되어 낱말이 붙습니다(2026-10-27 Q-Carnet 쪽 넘김 «1-31/총31건»). */
for (const rule of rules) {
  if (!/word-spacing:\s*var\(--qd-hangul-word-space\)/.test(rule.body)) continue;
  const font = /font-family:\s*([^;]+)/.exec(rule.body)?.[1].trim();
  if (font && !/mono/i.test(font)) problems.push(`${rule.file}  ${rule.sel.replace(/\s+/g, ' ')}  글꼴을 ${font} 로 바꾸면서 어절 공백을 줄입니다. word-spacing: normal 로 두십시오`);
}

console.log(`한글 자간 정본 검사: 정본 CSS ${CANON.length}개 · 자간 · 대문자를 거는 선택자 ${tracked}개(var() 로 오는 자간 ${viaVar}곳) · 변수 정의 파일 ${DEFINITION_FILES.length}개`);
if (problems.length) {
  for (const line of problems) console.log('  ✗ ' + line);
  console.log(`  ${problems.length}곳. 생성기에서 [data-hangul] 풀림 규칙을 더하거나, 라틴 전용이면 선택자에 [data-latin] 을 다십시오.`);
  process.exitCode = 1;
} else {
  console.log('  모든 자리에 한글 풀림 짝이 있습니다.');
}
