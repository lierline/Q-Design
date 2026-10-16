// 산출물 쓰기와 «다시 만들어도 같은가» 검사를 한 길로 합니다(2026-10-16 · 군살 빼기 4단계).
//
//   import { emit, emitDone } from './emit.mjs';
//   emit(path, text);           --check 가 없으면 씁니다. 있으면 저장본과 대조만 합니다.
//   emitDone('차림표');         --check 면 결과를 한 줄로 알리고, 다르면 종료 코드 1 을 둡니다.
//
// 만들기 도구가 저마다 writeFileSync 를 부르면 검사 모드를 따로 짜야 하고, 짜지 않은 도구는
// 산출물이 낡아도 아무도 모릅니다. 쓰는 자리를 이 함수 하나로 모으면 검사가 저절로 따라옵니다.
// 대조는 줄바꿈을 LF 로 맞춘 글자로 합니다(사본 지문과 같은 기준).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const CHECK = process.argv.includes('--check');
const differs = [];
const lf = (text) => text.replace(/\r\n/g, '\n');

export function emit(path, text) {
  if (CHECK) {
    const saved = existsSync(path) ? readFileSync(path, 'utf8') : null;
    if (saved === null || lf(saved) !== lf(text)) differs.push(relative(ROOT, path).replace(/\\/g, '/') + (saved === null ? ' (없음)' : ''));
    return;
  }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
}

export function emitDone(label) {
  if (!CHECK) return;
  if (!differs.length) {
    console.log(`${label}: 다시 만들어도 저장본과 같습니다`);
    return;
  }
  console.log(`${label}: 다시 만들면 달라지는 파일 ${differs.length}개`);
  for (const file of differs) console.log('  ~ ' + file);
  process.exitCode = 1;
}
