// 지표 값 · 이름 글자는 사다리 위에만 선다 (2026-10-27 카르넷 정밀 감사 D1 · D2).
// 전에는 .qd-kpi-value 가 clamp(20px, 16cqw, 40px) 라 칸 폭을 따라 22.88 · 36.72px 처럼 사다리 밖 크기가
// 실제 화면에 나왔다. 지표 값 크기는 토큰 네 개(40 · 32 · 28 · 24)와 그 토큰만 쓴다.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = 'D:/Claude/Q-Design';
const LADDER = new Set([12, 14, 16, 18, 20, 24, 28, 32, 40]);
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

export function kpiSizeViolations(css) {
  const found = [];
  // .qd-kpi-value 규칙 안의 font-size 는 토큰 var(--qd-kpi-size*) 아니면 사다리 px 뿐이다
  for (const m of css.matchAll(/\.qd-kpi-value[^{]*\{([^}]*)\}/g)) {
    for (const d of m[1].matchAll(/font-size:\s*([^;]+);/g)) {
      const v = d[1].trim();
      const token = v.match(/^var\(--qd-kpi-size(?:-[a-z]+)?(?:,\s*(\d+)px)?\)$/);
      const px = v.match(/^(\d+)px$/);
      if (token && (!token[1] || LADDER.has(Number(token[1])))) continue;
      if (px && LADDER.has(Number(px[1]))) continue;
      found.push(`font-size: ${v}`);
    }
  }
  // 토큰 값도 사다리 위
  for (const m of css.matchAll(/(--qd-kpi-size(?:-[a-z]+)?):\s*([^;]+);/g)) {
    const px = m[2].trim().match(/^(\d+)px$/);
    if (!px || !LADDER.has(Number(px[1]))) found.push(`${m[1]}: ${m[2].trim()}`);
  }
  // 칸 폭 단위(cqw)로 글자 크기를 재지 않는다
  for (const m of css.matchAll(/font-size:[^;]*\d+cq[wi][^;]*;/g)) found.push(m[0]);
  return found;
}

test('정본 · 배포 CSS 의 지표 값 크기는 토큰 네 단과 사다리 px 뿐이다', () => {
  const files = ['patterns/components.css', 'patterns/workspace.css', 'dist/q-design.screen.css', 'dist/q-design.components.css'];
  const bad = files.filter((f) => fs.existsSync(path.join(root, f)))
    .flatMap((f) => kpiSizeViolations(read(f)).map((hit) => `${f}: ${hit}`));
  assert.deepEqual(bad, []);
});

test('검사는 cqw 와 사다리 밖 토큰 값을 실제로 잡는다', () => {
  assert.deepEqual(kpiSizeViolations('.qd-kpi-value{font-size:clamp(20px,16cqw,40px);}'),
    ['font-size: clamp(20px,16cqw,40px)', 'font-size:clamp(20px,16cqw,40px);']);
  assert.deepEqual(kpiSizeViolations(':root{--qd-kpi-size-md: 30px;} .qd-kpi-value{font-size:var(--qd-kpi-size-md);}'),
    ['--qd-kpi-size-md: 30px']);
  assert.deepEqual(kpiSizeViolations(':root{--qd-kpi-size: 40px;} .qd-kpi-value{font-size:var(--qd-kpi-size, 40px);} @container (width < 150px){.qd-kpi-value{font-size:var(--qd-kpi-size-sm);}}'), []);
});

test('전체 보기 화면의 지표 이름은 사다리 크기 · 세 줄 간격 안이다', () => {
  const css = read('patterns/workspace.css');
  for (const m of css.matchAll(/\.qd-kpi-label[^{]*\{[^}]*font:\s*\d{3}\s+(\d+)px\/([\d.]+)/g)) {
    assert.ok(LADDER.has(Number(m[1])), `지표 이름 ${m[1]}px`);
    assert.ok(['1', '1.2', '1.4', '1.6'].includes(m[2]), `지표 이름 줄 간격 ${m[2]}`);
  }
});
