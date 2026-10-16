// 2026-10-16(군살 빼기 4단계): 쓰는 함수만 남겼습니다. hash(여러 생성기의 지문)와 runtimeFiles(업무 아이콘을
// 가져오는 곳 감사)입니다. 제품 스타일 인자를 훑던 스캐너(scanArguments 등)는 1단계에서 장부 도구와 함께
// 쓰는 곳이 없어졌습니다. 옛 판은 꼬리표 archive/before-slim-2026-10-16 에 있습니다.
import { readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';
export const hash = text => createHash('sha256').update(text.replaceAll('\r\n', '\n')).digest('hex');
const portable = path => path.replaceAll('\\', '/');
const ignored = new Set(['node_modules', '.next', '.git', 'tests', 'test', '__tests__', '__fixtures__']);
export function runtimeFiles(root) {
  const files = [];
  function walk(dir) {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory() && !ignored.has(entry.name)) walk(path);
      else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|css|html|svg)$/.test(entry.name) && !/\.(?:test|spec|stories|d)\.[cm]?[jt]sx?$/.test(entry.name)) files.push(portable(relative(root, path)));
    }
  }
  for (const dir of ['app', 'components', 'lib', 'src', 'public']) walk(join(root, dir));
  for (const file of ['tailwind.config.ts', 'tailwind.config.js', 'next.config.ts', 'next.config.mjs']) if (existsSync(join(root, file))) files.push(file);
  return files.sort();
}
