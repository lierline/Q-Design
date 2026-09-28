// =============================================================================
// 보조 글씨 최소 12px (오너 결정 2026-09-27 · 화면 검토 M77 · M43 · 세 제품 정본)
// =============================================================================
// 차림표 묶음 이름 · 표 머리 · 지표 이름표 · 제목 위 글 · 배지가 10 ~ 11px 에 흐린 색이라,
// 노트북으로 결재하는 대표 · 부서장이 읽기 어려웠다. 2026-09-28 에 화면 코드의 12px 미만
// 2,178곳(FS[8] ~ FS[11]) · 손으로 적은 CSS 27곳을 12px 로 올렸다. 이 계약은 다시 들어오는 것을 막는다.
//
// 화면 밖은 뺀다: 메일 본문(메일 앱이 글자 크기를 정한다) · 인쇄 지면(종이 규격이 따로 있다).
// 정본(Q-Design)이 이 저장소의 부품에서 크기를 뽑으므로, 여기가 12 이상이면 Q-Maison · Q-Carnet 의
// 차림표 · 목록 · 뼈대도 따라 12 이상이 된다(Q-Sonar 는 오너 결정으로 뺐다 · Q-Design sync-parts HOLD).

import { describe, expect, it } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { REPO_ROOT as ROOT, readSource } from '@/lib/test-utils/contract-source';

function sources(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(join(ROOT, dir))) {
    const rel = `${dir}/${f}`;
    if (f === 'node_modules' || f.startsWith('.')) continue;
    if (statSync(join(ROOT, rel)).isDirectory()) sources(rel, out);
    else if (/\.(ts|tsx|css)$/.test(f) && !/\.test\.tsx?$/.test(f)) out.push(rel);
  }
  return out;
}

/** 화면이 아닌 곳: 메일 본문을 짓는 파일(글자 크기는 메일 앱 몫) */
const NOT_SCREEN: Record<string, string> = {
  'lib/email.ts': '메일 본문',
  'lib/research/notify-doc-review.ts': '메일 본문',
  'lib/research/notify-license-change.ts': '메일 본문',
  'app/api/research/[code]/comments/route.ts': '메일 본문(댓글 알림)',
};

const FILES = [...sources('app'), ...sources('components'), ...sources('lib')].filter(
  (f) => !NOT_SCREEN[f] && !/(^|\/)print\//.test(f),
);

describe('화면 글자는 12px 이상', () => {
  it('크기 토큰 FS[8] · FS[9] · FS[10] · FS[11] 을 쓰지 않는다', () => {
    const hits: string[] = [];
    for (const f of FILES) {
      if (!/\.tsx?$/.test(f)) continue;
      const code = readSource(f, 'code');
      for (const m of code.matchAll(/FS\[(8|9|10|11)\]/g)) hits.push(`${f} ${m[0]}`);
    }
    expect(hits, '보조 글씨도 FS[12] 이상입니다(오너 결정 2026-09-27)').toEqual([]);
  });

  it('손으로 적은 12px 미만(fontSize: 10 · font-size: 10px 등)이 없다', () => {
    const hits: string[] = [];
    for (const f of FILES) {
      const code = readSource(f, f.endsWith('.css') ? 'raw' : 'code'); // CSS 는 주석 규칙이 달라 원문 그대로 본다
      for (const m of code.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)) {
        if (Number(m[1]) < 12) hits.push(`${f} ${m[0]}`);
      }
      for (const m of code.matchAll(/fontSize:\s*(\d+(?:\.\d+)?)(?=\s*[,}\n])/g)) {
        if (Number(m[1]) < 12) hits.push(`${f} ${m[0]}`);
      }
    }
    expect(hits, '보조 글씨도 12px 이상입니다(오너 결정 2026-09-27)').toEqual([]);
  });

  it('rem 프리셋(TYPE.caption · TYPE.mono)은 쓰는 자리에서 12px 이상으로 덮는다', () => {
    // 이 앱의 뿌리 글자가 14px 라 TYPE.caption(0.8125rem)은 11.4px, TYPE.mono(0.6875rem)는 9.6px 다.
    // 프리셋은 lib/design/tokens.ts 에 있는데 그 파일은 요구사항 엔진의 검증 근거라(validation-manifest)
    // 디자인 한 줄로 엔진 재검증을 부르지 않으려고 고치지 않았다. 쓰는 줄에서 fontSize 를 덮는다.
    const hits: string[] = [];
    for (const f of FILES) {
      if (!/\.tsx?$/.test(f)) continue;
      const code = readSource(f, 'code');
      for (const line of code.split('\n')) {
        if (/\.\.\.TYPE\.(caption|mono)\b/.test(line) && !/fontSize:\s*FS\[(1[2-9]|[2-9]\d)\]/.test(line)) {
          hits.push(`${f}: ${line.trim().slice(0, 80)}`);
        }
      }
    }
    expect(hits, 'TYPE.caption · TYPE.mono 뒤에 fontSize: FS[12] 이상을 같은 줄에 두십시오').toEqual([]);
  });

  it('빼 둔 파일이 아직 있다(없어졌으면 목록에서 뺀다)', () => {
    for (const f of Object.keys(NOT_SCREEN)) {
      expect(() => statSync(join(ROOT, f)), f).not.toThrow();
    }
  });
});
