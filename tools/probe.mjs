// =============================================================================
// 탐침 (probe) · 원본에서 값을 «읽어» 오는 공용 기계
// =============================================================================
// extract-nav.mjs 와 extract-list.mjs 가 같이 씁니다. 두 파일이 각자 이 코드를
// 갖고 있으면 한쪽만 고쳐지는 날이 옵니다 - 도구도 사본을 만들면 어긋납니다.
//
// ── 규칙 ─────────────────────────────────────────────────────────────────────
// 각 탐침은 지정한 구역 안에서 **정확히 한 번** 맞아야 합니다.
//   0번  원본이 바뀐 것입니다. 값을 옮겨 적지 말고 탐침을 고치세요.
//   2번+ 구역이 너무 넓은 것입니다. 어느 쪽 값인지 모르는 채로 뽑으면 안 됩니다.
// =============================================================================

import { readFileSync, existsSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { normalizeScaleSyntax, normalizeStyleLiterals } from './qd-adapter-values.mjs';
import { normalizeRuntimeReferences, normalizeTypographyReferences, readRuntimeValues, resolveAtelierMedia } from './atelier-runtime-values.mjs';
import { readOutputValues, resolveAtelierOutputCss } from './atelier-output-values.mjs';

/**
 * 원본 읽기.
 *
 * 🔴 줄바꿈을 LF 로 못 박습니다. 윈도우에서는 같은 파일이 CRLF 로 들어와
 *    있기도 하고(git autocrlf · 파이썬 기본 쓰기 모드), 그러면 여러 줄짜리
 *    구역 표지가 통째로 안 맞습니다. 실제로 `components.tsx` 가 CRLF 라
 *    표지를 하나도 못 찾았습니다 - 「원본이 바뀐 것」 처럼 보이지만 아닙니다.
 */
export function read(path) {
  const text = readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
  if (path.endsWith('.css')) return readSourceCss(path, text);
  const sourceRoot = path.replaceAll('\\', '/').split('/source/')[0];
  return /\.tsx?$/.test(path) ? normalizeScaleSyntax(normalizeStyleLiterals(normalizeTypographyReferences(normalizeRuntimeReferences(text, sourceRoot), sourceRoot), sourceRoot)) : text;
}

export function readSourceCss(path, fallback = readFileSync(path, 'utf8').replace(/\r\n/g, '\n')) {
  const original = { 'globals.css': 'app/globals.css', 'expert-theme.css': 'app/experts/expert-theme.css', 'sheet-paper.css': 'components/qms/sheet-paper.css' }[basename(path)];
  if (!original || !/[\\/]source[\\/]css[\\/]/.test(path)) return fallback;
  const recipe = join(resolve(dirname(path), '..', '..'), 'patterns/foundation/atelier.css');
  if (!existsSync(recipe)) {
    if (/q-design\.foundation\.css/.test(fallback)) throw new Error(`Imported foundation recipe is missing: ${original}`);
    return fallback;
  }
  const rawCss = readFileSync(recipe, 'utf8').replace(/\r\n/g, '\n');
  let css = /qd-bp\(/.test(rawCss) ? resolveAtelierMedia(rawCss, readRuntimeValues(resolve(dirname(path), '..', '..'))) : rawCss;
  if (/qd-output\(/.test(css)) css = resolveAtelierOutputCss(css, readOutputValues(resolve(dirname(path), '..', '..')));
  const start = `/* qd-source-start: ${original} */`;
  const end = `/* qd-source-end: ${original} */`;
  if (css.split(start).length !== 2 || css.split(end).length !== 2) throw new Error(`Missing or duplicated foundation source section: ${original}`);
  const from = css.indexOf(start) + start.length;
  const to = css.indexOf(end);
  if (to < from) throw new Error(`Invalid foundation source section: ${original}`);
  return css.slice(from, to);
}

/**
 * 구역 자르기.
 *
 * 파일 전체에 정규식을 걸면 서로 다른 상태의 값이 섞입니다(접힌 레일 2px ·
 * 펼친 레일 3px 처럼). 표지는 **주석에도 나오는 낱말이면 안 됩니다** - 파일
 * 머리의 설명문부터 잘려 구역이 통째로 어긋납니다.
 */
export function slice(text, from, to, what) {
  const a = text.indexOf(from);
  if (a < 0) throw new Error(`구역 시작을 못 찾았습니다 [${what}]: ${from}`);
  const b = text.indexOf(to, a + from.length);
  if (b < 0) throw new Error(`구역 끝을 못 찾았습니다 [${what}]: ${to}`);
  return text.slice(a, b);
}

/** `'a.b.c'` 경로로 중첩 객체에 값을 넣습니다. */
export function put(obj, path, value) {
  const parts = path.split('.');
  let node = obj;
  for (const p of parts.slice(0, -1)) node = node[p] ??= {};
  node[parts.at(-1)] = value;
}

/** 중첩 객체를 `[경로, 값]` 목록으로 폅니다. 검증과 개수 세기에 씁니다. */
export function flat(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? flat(v, `${prefix}${k}.`)
      : [[`${prefix}${k}`, v]],
  );
}

/**
 * 탐침 목록을 돌려 값을 뽑습니다.
 * 각 항목은 `[경로, 구역, 정규식, 변환]` 입니다.
 */
export function probeAll(probes) {
  const spec = {};
  for (const [path, zone, re, cast] of probes) {
    const hits = [...zone.matchAll(new RegExp(re.source, re.flags + 'g'))];
    if (hits.length !== 1) {
      throw new Error(
        `탐침이 ${hits.length} 번 맞았습니다 (1 이어야 합니다) [${path}]\n` +
          `  ${re}\n` +
          `  원본이 바뀌었으면 탐침을 고치세요. 값을 여기 적어 넣지 마세요.`,
      );
    }
    put(spec, path, cast(hits[0][1]));
  }
  return spec;
}

/**
 * 뽑은 값이 말이 되는가.
 * 「없으면 undefined 가 CSS 로 새어 나가 조용히 깨진다」를 여기서 막습니다.
 */
export function assertFilled(spec) {
  for (const [k, v] of flat(spec)) {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) {
      throw new Error(`값이 비었습니다: ${k}`);
    }
  }
  return spec;
}

/**
 * 색 잇는 줄. 프로젝트마다 색 «이름» 이 다르므로(champagne · gold · brand)
 * 정본은 `--qd-*` 만 읽고, 바닥값으로 Q-Atelier 의 `--qa-*` 를 겁니다.
 * 마지막 바닥값은 tokens.json 에서 «생성» 합니다. 손으로 적지 않습니다.
 */
export function bindingsBlock(colors, mode, pairs) {
  return pairs
    .map(([name, qa]) => `  --qd-${name}: var(--qd-${name}-src, var(--qa-${qa}, ${colors[mode][`--qa-${qa}`]}));`)
    .join('\n');
}

export const px = (n) => `${n}px`;
