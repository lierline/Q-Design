// 표 열 폭 규칙 «표 하나에 늘어나는 열 하나» (2026-10-28 오너 결정 · 카르넷 표 41개 실측).
// 열 폭을 아무도 정하지 않으면 남는 폭이 «가장 긴 글 열» 로 흘러 표마다 생김새가 갈린다. 정본 .qd-table 이
// 늘어나는 열(data-grow="N" · 없으면 첫 열) 하나만 남는 폭을 주고 나머지는 글 폭으로 세운다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = 'D:/Claude/Q-Design';
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

export function tableGrowGaps(css) {
  const gaps = [];
  if (!css.includes('.qd-table:not(.qd-table--editable) > :is(thead, tbody, tfoot) > tr > :is(th, td) { width: 1%; white-space: nowrap; }')) gaps.push('나머지 열이 글 폭(width 1% · nowrap)이 아니다');
  for (let n = 1; n <= 12; n++) {
    if (!css.includes(`.qd-table[data-grow="${n}"]:not(.qd-table--editable) > :is(thead, tbody, tfoot) > tr > :is(th, td):nth-child(${n})`)) gaps.push(`data-grow="${n}" 이 없다`);
  }
  if (!css.includes(':not([data-grow]):not(:has(.qd-col-grow)) > :is(thead, tbody, tfoot) > tr > :is(th, td):first-child')) gaps.push('표시 없는 표의 첫 열이 늘어나지 않는다');
  if (!css.includes(':is(.qd-col-grow, .qd-table-description, [colspan])')) gaps.push('.qd-col-grow · 설명 열 · 합친 칸이 줄바꿈하지 않는다');
  if (!/--qd-table-grow-min-width:\s*8em/.test(css)) gaps.push('늘어나는 열의 바닥 8em 이 없다');
  // 둘째 결 «기록 · 수치»(data-grow="0" · 2026-10-28): 어느 열도 늘지 않아야 남는 폭이 모든 열에 같은 몫으로 간다
  if (/\[data-grow="0"\][^{]*\{[^}]*width:\s*auto/.test(css)) gaps.push('data-grow="0" 에 늘어나는 열이 걸려 있다(둘째 결이 깨짐)');
  if (!css.includes('data-grow="0"')) gaps.push('둘째 결 data-grow="0" 의 설명이 없다');
  return gaps;
}

test('정본 · 배포 CSS 에 «늘어나는 열 하나» 규칙이 1 ~ 12 까지 다 있고, data-grow="0"(고른 펼침)에는 늘어나는 열이 없다', () => {
  const files = ['patterns/components.css', 'dist/q-design.components.css'].filter((f) => fs.existsSync(path.join(root, f)));
  assert.ok(files.length >= 1);
  assert.deepEqual(files.flatMap((f) => tableGrowGaps(read(f)).map((g) => `${f}: ${g}`)), []);
});
