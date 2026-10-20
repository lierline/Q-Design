/**
 * 데이터 출처는 ⓘ 안에 (2026-10-18 오너 결정 «가 안»)
 *
 * 오너 요청: «기록 관리 같은 화면은 예시 데이터가 없으면 어디서 데이터를 가져오는지 알 수가 없다. 안내 버튼 안에도
 * 그 내용이 들어가면 좋겠다.» 같은 날 전수 점검(627 구역)에서 출처를 제대로 말하는 구역은 43곳(7%)뿐이었고,
 * ⓘ 자체가 없는 구역이 415곳이었다. 그래서 문장을 덧붙이는 대신 공용 부품에 «데이터 출처» 자리를 만들었다
 * (lib/design/components.tsx 의 SourceNote · withSource, PageGuide 의 «데이터는 어디서 오나요?»).
 *
 * 이 계약은 세 가지를 센다. 셋 다 «남아 있는 것» 의 목록이 기준선이고, 묶음마다 줄인다. 늘면 빨강이다.
 *   ① 화면 머리 안내(PAGE_GUIDES)에 dataSource 가 없는 것.
 *   ② 써 두고 어느 화면에도 붙이지 않은 안내(pageId · pageGuideId 로 아무도 부르지 않는 PAGE_GUIDES 항목).
 *   ③ 구역 · 지표 부품(PageHd · Section · SectionCard · SectionTitleInfo · SectionTitle · FormSection · KPI)을
 *      source= 없이 쓴 자리. 파일 → 개수.
 *      · source={null} 은 «데이터를 담지 않는 구역» 이라는 명시적 선언이라 «적었다» 로 센다.
 *      · PageHd 는 같은 폴더에 화면 머리 안내(<PageGuide · pageGuideId=)가 있으면 그쪽 dataSource 가 맡으므로 세지 않는다.
 *      · 칸 ⓘ(Field · FldRow info=)는 세지 않는다. 칸은 대부분 «여기에 직접 적는 값» 이라 구역 출처가 덮는다.
 *      · 기록부(Register)는 부품이 «이 회사가 이 칸에서 직접 적은 줄» 을 기본으로 붙이므로 세지 않는다.
 * 어긋나면 붙여 넣을 리터럴을 찍어 준다. AST 로 세지만 «부품을 썼는가» 만 보므로, 손으로 짠 구역(div 제목)은 못 본다.
 * 그런 자리는 점검 보고(docs/audits/INFO_DOT_DATA_SOURCE_AUDIT_2026-10-18.md)의 목록으로 따로 줄인다.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { REPO_ROOT } from '@/lib/test-utils/contract-source';
import { PAGE_GUIDES } from '@/lib/page-guides';

// ── 기준선 ───────────────────────────────────────────────────────────────────
// 2026-10-18 묶음 1(공용 부품 자리 + 먼저 고칠 안내 10곳): ① 61 안내 · ② 0 · ③ 209 파일 584 자리.
// 2026-10-18 묶음 2(QMS 기록): ① 49 안내 · ② 0 · ③ 168 파일 504 자리.
// 2026-10-18 묶음 3(생산 · 장비): ① 39 안내 · ② 0 · ③ 144 파일 427 자리.
// 2026-10-18 묶음 4(시판 후 · 인허가): ① 25 안내 · ② 0 · ③ 100 파일 319 자리.
// 2026-10-18 묶음 5(연구 · 공용): ① 7 안내 · ② 0 · ③ 46 파일 184 자리.
// 2026-10-18 묶음 6(운영진 · 설정): ① 0 · ② 0 · ③ 0. 셋 다 비었다. 이제 이 가드는 «새 안내 · 새 구역은 처음부터 출처와 함께» 를 지킨다.

/** ① dataSource 가 아직 없는 화면 머리 안내 */
const GUIDES_WITHOUT_SOURCE: readonly string[] = [];

/** ② 써 두고 아무 화면도 부르지 않는 안내 */
const GUIDES_NOT_SHOWN: readonly string[] = [];

/** ③ source= 없이 쓴 구역 · 지표 부품. 파일 → 개수. 0 이 되면 줄을 지운다. */
const PARTS_WITHOUT_SOURCE: ReadonlyArray<[string, number]> = [];

// ── 세는 법 ──────────────────────────────────────────────────────────────────

export const SOURCE_PARTS = ['PageHd', 'Section', 'SectionCard', 'SectionTitleInfo', 'SectionTitle', 'FormSection', 'KPI'] as const;

const SKIP = (rel: string) =>
  rel.startsWith('app/global-error') ||
  // 공개 법규 페이지(이용약관 · 개인정보처리방침 · 오픈소스 고지 · 사업자정보)는 데이터를 보여 주는 화면이 아니다.
  /^app\/(terms|privacy|open-source|legal)/.test(rel) ||
  /^app\/\(public\)\/(\(drafts\)\/)?(terms|privacy|open-source|business-info)\//.test(rel);

function walk(dir: string, out: string[]) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.next')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.tsx$/.test(name) && !/\.test\.tsx$/.test(name)) out.push(p);
  }
}

function sourceFiles(): Array<{ rel: string; src: string }> {
  const files: string[] = [];
  for (const d of ['components', 'app']) walk(join(REPO_ROOT, d), files);
  return files
    .map((f) => ({ rel: relative(REPO_ROOT, f).replace(/\\/g, '/'), f }))
    .filter(({ rel }) => !SKIP(rel))
    .map(({ rel, f }) => ({ rel, src: readFileSync(f, 'utf8') }));
}

/** 이 파일에서 source= 없이 쓴 부품 이름들. headCovered 면 PageHd 는 세지 않는다. */
export function partsWithoutSource(src: string, headCovered = false): string[] {
  const sf = ts.createSourceFile('x.tsx', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const out: string[] = [];
  const visit = (n: ts.Node) => {
    if (ts.isJsxOpeningElement(n) || ts.isJsxSelfClosingElement(n)) {
      const tag = n.tagName.getText(sf);
      if ((SOURCE_PARTS as readonly string[]).includes(tag) && !(tag === 'PageHd' && headCovered)) {
        // {...props} 로 넘기는 자리는 호출부가 정하므로 «적었다» 로 본다
        const has = n.attributes.properties.some(
          (a) => ts.isJsxSpreadAttribute(a) || (ts.isJsxAttribute(a) && a.name.getText(sf) === 'source'),
        );
        if (!has) out.push(tag);
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);
  return out;
}

const HEAD_GUIDE = /<PageGuide[\s>]|pageGuideId=/;

export function scanParts(files = sourceFiles()): Map<string, number> {
  // 화면 머리 안내가 있는 폴더(page.tsx 와 같은 폴더의 client 파일이 PageHd 를 그리는 경우가 많다)
  const guidedDirs = new Set(files.filter(({ src }) => HEAD_GUIDE.test(src)).map(({ rel }) => dirname(rel)));
  const per = new Map<string, number>();
  for (const { rel, src } of files) {
    const n = partsWithoutSource(src, guidedDirs.has(dirname(rel))).length;
    if (n > 0) per.set(rel, n);
  }
  return per;
}

export function guidesNotShown(files = sourceFiles()): string[] {
  // <PageGuide pageId="…"> 와 <PageWidgetBoard pageGuideId="…"> 만 «부른다» 로 센다.
  // PageWidgetBoard 의 pageId= 는 위젯 배치 저장 이름이라 안내를 띄우지 않는다.
  const called = new Set<string>();
  const res = [
    /<PageGuide\b[^>]*?\bpageId=(?:\{\s*)?["'`]([a-z0-9-]+)["'`]/g,
    /\bpageGuideId=(?:\{\s*)?["'`]([a-z0-9-]+)["'`]/g,
  ];
  for (const { src } of files) {
    for (const re of res) {
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) called.add(m[1]);
    }
  }
  return Object.keys(PAGE_GUIDES).filter((id) => !called.has(id)).sort();
}

export function guidesWithoutSource(): string[] {
  return Object.entries(PAGE_GUIDES)
    .filter(([, g]) => !g.dataSource || !g.dataSource.trim())
    .map(([id]) => id)
    .sort();
}

const listLiteral = (ids: string[]) => ids.map((id) => `  '${id}',`).join('\n');
const mapLiteral = (found: Map<string, number>) =>
  [...found.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([f, n]) => `  ['${f}', ${n}],`).join('\n');

// ── 시험 ─────────────────────────────────────────────────────────────────────

describe('데이터 출처는 ⓘ 안에(기준선 이하)', () => {
  const files = sourceFiles();

  it('① 화면 머리 안내: dataSource 없는 안내가 기준선과 같다', () => {
    const now = guidesWithoutSource();
    if (JSON.stringify(now) !== JSON.stringify([...GUIDES_WITHOUT_SOURCE].sort())) {
      console.log('① 현재 상태의 기준선:\n' + listLiteral(now));
    }
    const extra = now.filter((id) => !GUIDES_WITHOUT_SOURCE.includes(id));
    expect(extra, '새 화면 머리 안내는 dataSource(데이터는 어디서 오나요?)와 함께 쓸 것').toEqual([]);
    const fixed = GUIDES_WITHOUT_SOURCE.filter((id) => !now.includes(id));
    expect(fixed, '출처를 채운 안내는 기준선에서 지울 것').toEqual([]);
  });

  it('② 써 둔 안내는 어느 화면이든 부른다', () => {
    const now = guidesNotShown(files);
    if (JSON.stringify(now) !== JSON.stringify([...GUIDES_NOT_SHOWN].sort())) {
      console.log('② 현재 상태의 기준선:\n' + listLiteral(now));
    }
    const extra = now.filter((id) => !GUIDES_NOT_SHOWN.includes(id));
    expect(extra, '안내를 썼으면 그 화면에 <PageGuide pageId=…> 를 붙일 것(경로로 찾아 주는 곳은 꺼져 있다)').toEqual([]);
    const fixed = GUIDES_NOT_SHOWN.filter((id) => !now.includes(id));
    expect(fixed, '화면에 붙인 안내는 기준선에서 지울 것').toEqual([]);
  });

  it('③ 구역 · 지표 부품: source= 없는 자리가 기준선과 같다', () => {
    const found = scanParts(files);
    const expected = new Map(PARTS_WITHOUT_SOURCE);
    const diff: string[] = [];
    for (const [f, n] of found) if ((expected.get(f) ?? 0) !== n) diff.push(`${f}: 기준선 ${expected.get(f) ?? 0} → 실제 ${n}`);
    for (const [f, n] of expected) if (!found.has(f)) diff.push(`${f}: 기준선 ${n} → 실제 0`);
    if (diff.length) console.log('③ 현재 상태의 기준선:\n' + mapLiteral(found));
    expect(diff, '늘었으면 source= 를 적을 것(데이터 없는 구역은 source={null}) · 줄었으면 기준선도 줄일 것').toEqual([]);
  });

  it('세는 법은 빠진 자리를 잡고 적은 자리는 지나간다(일부러 깨뜨려 본 것)', () => {
    expect(partsWithoutSource(`<Section title="x">a</Section>`)).toEqual(['Section']);
    expect(partsWithoutSource(`<Section title="x" source="이 회사가 적은 줄입니다.">a</Section>`)).toEqual([]);
    expect(partsWithoutSource(`<SectionTitle source={null}>x</SectionTitle>`)).toEqual([]);
    expect(partsWithoutSource(`<KPI label="x" value={1} />`)).toEqual(['KPI']);
    expect(partsWithoutSource(`<PageHd title="x" />`)).toEqual(['PageHd']);
    expect(partsWithoutSource(`<PageHd title="x" />`, true)).toEqual([]);
    expect(partsWithoutSource(`<SectionCardList />`)).toEqual([]);
    expect(partsWithoutSource(`<Section {...p} />`)).toEqual([]);
  });
});
