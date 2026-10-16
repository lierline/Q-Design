// 한글 자간 검사 두 개가 함께 쓰는 CSS 풀이(2026-10-16 · 군살 빼기 4단계)
//   check-hangul-canon.mjs   정본 CSS 만 읽는 검사(늘 초록이어야 하는 검사)
//   check-hangul-source.mjs  제품 소스를 훑는 감사(check.mjs --products)
//
// 🔑 letter-spacing 이 var() 로 오면 정본 CSS 의 변수 정의를 따라가 풉니다. 예전 감사는
//    parseFloat('var(--x)') 가 NaN 이라 그 자리를 «자간 없음» 으로 지나쳤습니다.
//    풀 수 없는 값은 unresolved 로 돌려줍니다. 부르는 쪽이 초록으로 칠하지 않게 하려는 것입니다.
import { readFileSync } from 'node:fs';

/* 눈에 보이는 자간. 화면 실측기(check-hangul-live)와 같은 자입니다 */
export const VISIBLE_PX = 0.3;
export const VISIBLE_EM = 0.05;

const stripComments = (css) => css.replace(/\r\n/g, '\n').replace(/\/\*[\s\S]*?\*\//g, '');

/** 중괄호 한 겹짜리 규칙을 { sel, body } 로 펼칩니다. @media 안의 규칙도 안쪽 선택자로 나옵니다 */
export function cssRules(css) {
  const rules = [];
  for (const m of stripComments(css).matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const sel = m[1].trim();
    if (sel && !sel.startsWith('@')) rules.push({ sel, body: m[2] });
  }
  return rules;
}

/** 여러 CSS 파일에서 사용자 정의 속성(--이름)의 값을 모읍니다. 테마마다 값이 다르면 모두 둡니다 */
export function customProperties(files) {
  const defs = new Map();
  for (const file of files) {
    for (const { body } of cssRules(readFileSync(file, 'utf8'))) {
      for (const d of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
        if (!defs.has(d[1])) defs.set(d[1], new Set());
        defs.get(d[1]).add(d[2].trim());
      }
    }
  }
  return defs;
}

/** var() 를 풀어 가능한 값을 모두 돌려줍니다. 정의도 대체값도 없으면 null 이 섞입니다 */
export function resolveValues(value, defs, depth = 0) {
  const m = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\))?[^()]*))?\)/.exec(value);
  if (!m) return [value];
  if (depth > 12) return [null];
  const choices = defs.get(m[1]) ? [...defs.get(m[1])] : m[2] !== undefined ? [m[2].trim()] : [null];
  return choices.flatMap((choice) => (choice === null ? [null] : resolveValues(value.replace(m[0], choice), defs, depth + 1)));
}

/** 한 값이 눈에 보이는 자간인지. 풀린 값 가운데 하나라도 보이면 보이는 것으로 셉니다 */
export function trackingOf(raw, defs) {
  const values = resolveValues(raw, defs);
  const unresolved = values.some((value) => value === null || !/^-?[\d.]+(?:px|em|rem)?$|^normal$/.test(value.replace(/\s*!important$/, '').trim()));
  const visible = values.some((value) => {
    if (value === null) return false;
    const text = value.replace(/\s*!important$/, '').trim();
    return text.endsWith('em') && !text.endsWith('rem') ? parseFloat(text) >= VISIBLE_EM : parseFloat(text) >= VISIBLE_PX;
  });
  return { values, unresolved, visible };
}

/** 자간이 풀렸는지(0 또는 normal) */
export function releasesTracking(raw, defs) {
  return resolveValues(raw, defs).every((value) => value !== null && /^(?:0(?:px|em)?|normal)$/.test(value.replace(/\s*!important$/, '').trim()));
}
