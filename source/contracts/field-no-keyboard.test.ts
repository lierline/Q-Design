import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// =============================================================================
// 현장 모드 가드: 화면 키보드를 띄우는 입력이 없어야 한다
// =============================================================================
// 🗣 오빠 지시(2026-08-20):
//   「현장 모드는 패드로 사용하게 될 거고 장갑 낀 손으로 터치 형태만이 가능한 게
//    일반적임. … 현장 모드는 절대 키보드를 누르는 경우는 없게끔 해야 함.」
//
// 클린룸에서 장갑을 낀 채 화면 키보드를 두드리는 일은 일어나지 않는다. 대신
//   ① 관리자가 데스크톱에서 정의한 것을 «고르고»(PickList·ChoiceGroup·칩)
//   ② 숫자는 «숫자판»(NumPad)으로
//   ③ 식별번호는 «스캐너»(ScanField: inputMode="none")로
// 받는다.
//
// 이 규칙은 화면을 하나 더 만들 때 조용히 깨진다. `<input>` 하나 넣는 것이
// 너무 쉽기 때문이다. 그래서 «있으면 실패» 로 못박는다.
//
// 허용하는 것:
//   · type="button" / "checkbox" / "radio" / "file": 누르거나 고르는 것
//   · type="date" / "time": 패드의 기본 선택기는 휠이라 키보드가 뜨지 않는다
//   · inputMode="none": 물리 스캐너 입력은 받고 화면 키보드는 띄우지 않는다
//
// 막는 것: 그 밖의 모든 `<input>` 과 모든 `<textarea>`.

const FIELD_DIR = join(process.cwd(), 'app', '(app)', 'm');

function tsxFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...tsxFiles(p));
    else if (name.endsWith('.tsx')) out.push(p);
  }
  return out;
}

/** `<input ... >` 여는 태그를 통째로 집는다(속성이 여러 줄에 걸쳐 있어도). */
function inputTags(src: string): string[] {
  return [...src.matchAll(/<input\b[\s\S]*?>/g)].map((m) => m[0]);
}

const ALLOWED_TYPES = ['button', 'checkbox', 'radio', 'file', 'date', 'time', 'hidden'];

describe('현장 모드 가드: 화면 키보드를 띄우는 입력이 없다', () => {
  const files = tsxFiles(FIELD_DIR);

  it('검사 대상 파일을 실제로 찾았다', () => {
    // 경로가 바뀌어 0개를 훑고도 «통과» 하는 것이 가장 나쁘다(2026-08-20 대비 가드에서
    // 실제로 그런 거짓 통과를 한 번 만들었다).
    expect(files.length).toBeGreaterThan(4);
  });

  it('<textarea> 가 없다. 장갑 낀 손은 문장을 칠 수 없다', () => {
    const bad = files.filter((f) => /<textarea\b/.test(readFileSync(f, 'utf8')));
    expect(
      bad.map((f) => f.replace(process.cwd(), '')),
      '\n서술이 필요하면 «현상 선택 + 사진» 으로 바꾸거나, 데스크톱의 일로 넘기십시오.',
    ).toEqual([]);
  });

  it('<input> 은 누르거나(button·checkbox·file) 고르거나(date) 스캔(inputMode="none")만 한다', () => {
    const bad: string[] = [];
    for (const f of files) {
      for (const tag of inputTags(readFileSync(f, 'utf8'))) {
        if (/inputMode=["']none["']/.test(tag)) continue;
        const type = tag.match(/type=["'](\w+)["']/)?.[1];
        if (type && ALLOWED_TYPES.includes(type)) continue;
        bad.push(`${f.replace(process.cwd(), '')}: ${tag.replace(/\s+/g, ' ').slice(0, 90)}`);
      }
    }
    expect(
      bad,
      [
        '',
        '현장 모드에 화면 키보드를 띄우는 입력이 생겼습니다.',
        '  · 숫자   → NumPad + NumDisplay',
        '  · 식별번호 → ScanField (inputMode="none" · HID 스캐너)',
        '  · 그 밖의 값 → 관리자가 데스크톱에서 정의하고 현장은 PickList 로 고른다',
        '',
      ].join('\n'),
    ).toEqual([]);
  });
});
