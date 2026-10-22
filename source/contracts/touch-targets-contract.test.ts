import { readDesignFile } from '@/lib/test-utils/design-source';
/**
 * 터치 화면(패드 · 폰)의 누르는 자리 (2026-09-27 패드 UX 감사)
 *
 * 가상 패드 세로 126화면에서 누르는 자리 44 미만이 1,480곳이었다. 대부분 몇 개의 공용 부품에서 나왔다.
 * 그리고 «터치 화면이면 44» 라는 규칙이 이미 있었는데 한 번도 적용되지 않았다: 공용 Btn 이 minHeight 를
 * 인라인으로 박아(sm 36) 보통 규칙을 이겼다. 그래서 이 계약은 «규칙이 있다» 가 아니라 «이기는 모양이다» 와
 * «부품이 그 이름표를 단다» 를 함께 본다. PC(마우스)는 (hover: none) and (pointer: coarse) 에 안 걸려 그대로다.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import { readSource, REPO_ROOT } from '@/lib/test-utils/contract-source';
import { SCROLL_TABLE_SQUEEZE } from '@/lib/design/components';
import { QDPresentation } from '@/lib/design/q-design-runtime';

// Resolve the parser from its declared owner. A clean pnpm install does not
// expose Next's transitive postcss dependency at the product package root.
const runtimeRequire = createRequire(import.meta.url);
const postcss = createRequire(runtimeRequire.resolve('next/package.json'))('postcss') as {
  parse(source: string): {
    walkRules(selector: string, visit: (rule: {
      walkDecls(visit: (decl: { prop: string; value: string }) => void): void;
    }) => void): void;
  };
};

/** globals.css 에서 터치 화면 블록 하나만 떼어 낸다(주석은 뺀다) */
function touchBlock(): string {
  const css = readDesignFile(join(REPO_ROOT, 'app/globals.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const i = css.indexOf('@media (hover: none) and (pointer: coarse)');
  expect(i, '터치 화면 블록이 없다').toBeGreaterThan(-1);
  let depth = 0;
  for (let j = css.indexOf('{', i); j < css.length; j++) {
    if (css[j] === '{') depth++;
    else if (css[j] === '}' && --depth === 0) return css.slice(i, j + 1);
  }
  throw new Error('터치 화면 블록이 닫히지 않았다');
}

describe('터치 화면 규칙이 인라인을 이긴다', () => {
  const block = touchBlock();

  it('공용 단추(qa-btn · qa-btn-secondary)는 44 를 !important 로 건다(Btn 의 인라인 minHeight 36 을 이기려면)', () => {
    expect(block).toMatch(/\.qa-btn,\s*\.qa-btn-secondary\s*\{\s*min-height:\s*var\(--qd-control-height, 44px\)\s*!important;/);
  });

  it('입력 칸(qa-input)과 qa-touch-44 는 높이 44, qa-touch-44sq 는 가로 · 세로 44', () => {
    expect(block).toMatch(/\.qa-input,\s*\.qa-touch-44\s*\{\s*min-height:\s*var\(--qd-control-height, 44px\)\s*!important;/);
    expect(block).toMatch(/\.qa-touch-44sq\s*\{\s*min-width:\s*var\(--qd-control-height, 44px\)\s*!important;\s*min-height:\s*var\(--qd-control-height, 44px\)\s*!important;/);
  });

  it('운영진 화면 안전망: /admin 아래 개별 단추 · 입력 칸도 44, 스위치 · 체크 · 라디오 · 파일 칸 · 작은 알약은 뺀다', () => {
    expect(block).toMatch(/\.qa-admin-touch button:not\(\.qa-touch-hit\):not\(\[role='switch'\]\):not\(\[role='checkbox'\]\):not\(\[role='radio'\]\)/);
    expect(block).toMatch(/\.qa-admin-touch input:not\(\[type='checkbox'\]\):not\(\[type='radio'\]\):not\(\[type='range'\]\):not\(\[type='hidden'\]\):not\(\[type='file'\]\)/);
    expect(block).toMatch(/\.qa-admin-touch textarea\s*\{\s*min-height:\s*var\(--qd-control-height, 44px\)\s*!important;/);
    // 이름표를 다는 곳이 사라지면 규칙이 있어도 아무것도 안 키운다
    expect(readSource('components/AdminLayoutShell.tsx')).toMatch(/className="qa-admin-touch"/);
  });

  it('qa-touch-hit 은 모양을 두고 누르는 자리만 모자란 만큼 가운데로 44 까지 넓힌다(보이지 않는 ::after)', () => {
    expect(block).toMatch(/\.qa-touch-hit\s*\{\s*position:\s*relative;/);
    // 2026-10-22: 고정 -10px -6px 로는 ⓘ(22×22)가 34×42 에 머물렀다
    expect(block).toMatch(/\.qa-touch-hit::after\s*\{\s*content:\s*'';\s*position:\s*absolute;\s*inset:\s*min\(0px, calc\(\(100% - var\(--qd-control-height, 44px\)\) \/ 2\)\);/);
  });

  it('qa-touch-hit-end 는 줄 끝 단추의 누르는 자리를 오른쪽 끝에 맞춰 왼쪽으로 · 세로는 가운데로 44 까지 넓힌다', () => {
    expect(block).toMatch(/\.qa-touch-hit-end\s*\{\s*position:\s*relative;/);
    const after = /\.qa-touch-hit-end::after\s*\{([^}]*)\}/.exec(block)?.[1] ?? '';
    const half = 'min\\(0px, calc\\(\\(100% - var\\(--qd-control-height, 44px\\)\\) / 2\\)\\)';
    expect(after).toMatch(/content:\s*'';\s*position:\s*absolute;/);
    expect(after).toMatch(new RegExp(`top:\\s*${half};`));
    expect(after).toMatch(/right:\s*0;/);
    expect(after).toMatch(new RegExp(`bottom:\\s*${half};`));
    expect(after).toMatch(/left:\s*min\(0px, calc\(100% - var\(--qd-control-height, 44px\)\)\);/);
  });

  // 2026-10-22 폰 실측: 전문가 포털 「로그인으로 돌아가기」 22 · 비밀번호 보기 24, 빈 화면 「홈으로」 33, 법적 안내 「로그인」 43
  it('전문가 포털 글귀 링크 · 비밀번호 보기 · 빈 화면의 다음 할 일 링크는 모자란 만큼 가운데로 44 까지', () => {
    expect(block).toMatch(/\.expert-portal-root :is\(\.link-gold, \.link-quiet, \.luxe-pw-toggle\)::after,\s*\.qd-empty-hints a::after\s*\{\s*content:\s*'';\s*position:\s*absolute;\s*inset:\s*min\(0px, calc\(\(100% - var\(--qd-control-height, 44px\)\) \/ 2\)\);/);
    // 비밀번호 보기는 칸 안에 absolute 로 선다. relative 로 바꾸면 칸 아래로 밀려난다
    expect(block).not.toMatch(/\.luxe-pw-toggle[^{]*\{\s*position:\s*relative/);
  });

  it('법적 안내 머리 · 바닥과 로그인 칸 링크는 가로도 모자란 만큼 넓힌다(6 보다 덜 넓히지는 않는다)', () => {
    expect(block).toMatch(/\.qa-legal-shell footer a::after\s*\{\s*content:\s*'';\s*position:\s*absolute;\s*inset:\s*-16px min\(-6px, calc\(\(100% - var\(--qd-control-height, 44px\)\) \/ 2\)\);/);
  });
});

describe('공용 부품이 이름표를 단다', () => {
  it.each([
    // 2026-10-07: 검색 단추는 공용 Btn 이 됐다(이름표는 Btn 이 스스로 단다). 남은 것은 검색 칸 · 정렬 둘
    // 2026-10-20: 정렬은 공용 고르기(Sel)가 되어 qa-input 이름표를 든다. qa-input 도 같은 44 규칙(터치 화면 · 640 이하)에 걸린다
    ['components/ListToolbar.tsx', /className="qa-touch-44"/g, 1, '검색 칸'],
    ['components/ListPager.tsx', /className="qa-touch-44"/g, 2, '이전 · 다음 페이지'],
    ['components/NotificationBell.tsx', /className="qa-touch-44sq"/g, 1, '알림 종'],
    ['components/SubscriptionIndicator.tsx', /className="qa-touch-44"/g, 1, '구독 칩'],
    ['components/MyActionsViews.tsx', /className="qa-touch-44"/g, 1, '할 일 탭'],
    // 2026-09-27: 켜고 끄는 선택 칩(ChoiceChip)이 같은 파일에 더해졌다 (화면 검토 A11 · A62)
    ['lib/design/segmented-choice.tsx', /className="qa-touch-44(?: [^"]*)?"/g, 2, '둘 중 고르기 · 선택 칩'],
    ['components/PageGuide.tsx', /className="qa-touch-hit"/g, 1, '이 페이지 사용법'],
    // 2026-10-21: 연계 부서 이름이 허브 링크가 되어(2778f8e1) 화살표를 빗맞히면 다른 화면으로 넘어갔다
    ['components/Sidebar.tsx', /className="qa-touch-hit-end"/g, 1, '부서 줄 펼침 화살표'],
    // 허브 없는 부서 이름(펼치기 단추)은 40 으로 그려져, 줄이 44 가 아니면 화살표의 44 가 옆 줄과 겹친다
    ['components/Sidebar.tsx', /className="qa-touch-44"/g, 1, '허브 없는 부서 이름'],
    // 2026-10-07: «위젯 편집» 토글이 공용 선택 칩(ChoiceChip · qa-touch-44)이 되어 이 파일에는 qa-touch-hit 가 남지 않는다
    ['components/dashboard/CustomizableWidgetBoard.tsx', /className="qa-touch-hit"/g, 0, '위젯 편집(이제 ChoiceChip 이 이름표를 든다)'],
    ['lib/design/components.tsx', /className="qa-touch-44(?: [^"]*)?"/g, 1, '거르기 칩(FilterChip)'],
    // 2026-09-28: 세부 유형 · 변경 사유 알약이 체크 목록이 됐다(화면 검토 A35). 체크 줄도 터치 화면 44
    ['app/(app)/assessments/new/page.tsx', /className="qa-touch-44(?: [^"]*)?"/g, 4, '세부 유형 · 변경 사유 체크 줄 · 영향 없음 · 영향 가능성 있음'],
    // 2026-10-04 폰 화면 재측정(터치 기기로 재야 한다. 마우스 폭만 줄여 재면 이 규칙이 안 걸려 틀린 숫자가 나온다)
    ['components/ListBackLink.tsx', /className="qa-touch-44sq"/g, 1, '목록 위 「← 홈」 글귀(짧은 이름은 폭도 44)'],
    // 2026-10-21: 손으로 짠 «선정 기준» ⓘ 를 공용 ⓘ(InfoDot · qa-touch-hit)로 합쳐 이 파일에는 qa-touch-44sq 가 남지 않는다
    ['components/TodayQueue.tsx', /className="qa-touch-44sq"/g, 0, '오늘 처리할 것 ⓘ(이제 InfoDot 이 든다)'],
    ['components/PendingResearchDocs.tsx', /className="qa-touch-44"/g, 2, '프로젝트 열기 · 미완료 문서 줄'],
    ['components/RegulatoryDeadlinesWidget.tsx', /className="qa-touch-44"/g, 1, '규제 일정 전체 보기'],
    ['app/(app)/admin/page.tsx', /className="qa-touch-44sq"/g, 2, '운영 홈의 이동 글귀(비어 있는 줄 · 허브 탭)'],
    ['app/(app)/admin/page.tsx', /className="qa-touch-44"/g, 1, '운영 홈의 허브 제목 링크'],
    // 2026-10-22 폰 실측(누르는 자리를 elementFromPoint 로 찍어 잼): 여러 화면이 함께 쓰는 작은 링크 · 단추
    ['components/RaStatusNotice.tsx', /className="qa-touch-hit"/g, 1, '「제품 R&D 흐름 열기」(인허가 여섯 화면)'],
    ['components/calendar/CalendarClient.tsx', /className="qa-touch-44 qa-touch-hit"/g, 1, '달 넘기기 ◀ · ▶ · 오늘(폭 31)'],
    ['app/(app)/m/field-ui.tsx', /className="qa-touch-hit"/g, 3, '현장 화면 머리 돌아가기 링크 · 단추(38), 마무리 링크(38)'],
  ])('%s', (file, re, count, what) => {
    expect((readSource(file).match(re) ?? []).length, what).toBe(count);
  });
});

/** 여는 <button …> 태그들. 태그의 끝은 중괄호 깊이가 0 일 때 만나는 첫 '>'(화살표 '=>' 는 건너뛴다) */
function buttonTags(src: string): string[] {
  const tags: string[] = [];
  for (let i = src.indexOf('<button'); i !== -1; i = src.indexOf('<button', i + 1)) {
    const next = src[i + 7];
    const gap = next === ' ' || next === '>' || next === String.fromCharCode(10) || next === String.fromCharCode(13) || next === String.fromCharCode(9);
    if (!gap) continue;
    let depth = 0;
    let k = i + 7;
    for (; k < src.length; k++) {
      const c = src[k];
      if (c === '{') depth++;
      else if (c === '}') depth--;
      else if (c === '>' && depth === 0 && src[k - 1] !== '=') break;
    }
    tags.push(src.slice(i, k + 1));
  }
  return tags;
}

describe('2차: 화면마다 따로 짠 작은 단추도 터치 크기를 단다 (패드 세로 재측정에서 남은 곳이 몰린 파일)', () => {
  it('공용 글귀 단추(TextAction · 42곳에서 씀)는 터치 화면에서 44', () => {
    expect(readSource('components/TextAction.tsx')).toMatch(/className="qa-touch-44(?: [^"]*)?"/);
  });

  it.each([
    'components/RdDocumentFlowPanel.tsx',
    'components/DocumentArtifactPanel.tsx',
    'app/(app)/design-trace/client.tsx',
    'app/(app)/pmda/[id]/client.tsx',
    'app/(app)/device-licenses/[id]/client.tsx',
    'app/(app)/udi/[id]/client.tsx',
    'app/(app)/qms-documents/client.tsx',
    'app/(app)/settings/page.tsx',
  ])('%s 의 단추는 모두 className 을 단다(새 단추가 이름표 없이 들어오면 여기서 걸린다)', (file) => {
    const tags = buttonTags(readSource(file, 'code'));
    expect(tags.length, '단추가 없다(파일을 잘못 읽었다)').toBeGreaterThan(0);
    const bare = tags.filter((t) => !t.includes('className'));
    expect(bare.map((t) => t.slice(0, 80)), '이름표 없는 단추').toEqual([]);
  });
});

describe('크기를 전제로 자리를 잡는 떠 있는 단추(폰 · 패드 세로)', () => {
  it('구독 칩은 터치 화면에서 종이 44 인 만큼(12) 더 왼쪽에 선다(2026-09-27 실제 폰에서 둘이 겹침)', () => {
    const source = readSource('components/SubscriptionIndicator.tsx');
    const expression = /const wrapRight = ([^;]+);/.exec(source)?.[1];
    expect(expression).toBeDefined();
    for (const [isCompact, isMobile, base] of [[true, true, 52], [false, true, 54], [false, false, 64]] as const) {
      for (const isTouch of [false, true]) {
        expect(vm.runInNewContext(expression!, { isCompact, isMobile, isTouch, QDPresentation })).toBe(base + (isTouch ? 12 : 0));
      }
    }
    const changed = { ...QDPresentation, visual: { ...QDPresentation.visual, subscription: { ...QDPresentation.visual.subscription, touchAllowance: 20 } } };
    expect(vm.runInNewContext(expression!, { isCompact: true, isMobile: true, isTouch: true, QDPresentation: changed })).toBe(72);
  });
  it('종 아래 알림 창은 안전 영역과 실제 중앙 제어 높이 및 간격을 따라 연다', () => {
    const raw=readFileSync(join(REPO_ROOT,'components/NotificationBell.tsx'),'utf8');
    const sf=ts.createSourceFile('bell.tsx',raw,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
    let expression='';
    function walk(n:ts.Node){if(ts.isPropertyAssignment(n)&&n.name.getText(sf)==='top'&&n.initializer.getText(sf).includes('var(--qd-control-height)'))expression=n.initializer.getText(sf);ts.forEachChild(n,walk);}walk(sf);
    expect(expression).not.toBe('');
    const variables=new Map<string,string>();
    // Element overrides such as textarea height are outside the notification root scope.
    for(const file of ['app/q-design.components.css','app/q-design.foundation.css'])postcss.parse(readFileSync(join(REPO_ROOT,file),'utf8')).walkRules(':root', rule=>{rule.walkDecls(d=>{if(d.prop.startsWith('--'))variables.set(d.prop,d.value);});});
    function numeric(value:string,safeArea=0){
      for(let i=0;i<12&&value.includes('var(');i++)value=value.replace(/var\((--[\w-]+)(?:,\s*([^)]*))?\)/g,(_,name,fallback)=>variables.get(name)??fallback);
      value=value.replace(/env\(safe-area-inset-top,\s*0px\)/g,String(safeArea)).replace(/calc\(/g,'(').replace(/px/g,'');
      expect(value).toMatch(/^[\d\s+*.()/-]+$/);return vm.runInNewContext(value) as number;
    }
    const top=(touch:boolean)=>vm.runInNewContext(expression,{isMobile:true,isTouch:touch}) as string;
    expect(numeric(top(true))).toBe(12+44+6);
    expect(numeric(top(false))).toBe(12+36+6);
    expect(numeric(top(true),24)).toBe(24+12+44+6);
    variables.set('--qd-control-height','52px');variables.set('--qd-space-1-5','8px');
    expect(numeric(top(true),24)).toBe(24+12+52+8);
    expect(vm.runInNewContext(expression,{isMobile:false,isTouch:false})).toBe('var(--qd-atelier-top-ef7712dd39)');
    expect(variables.get('--qd-atelier-top-ef7712dd39')).toBe('calc(100% + 6px)');
  });
  it('터치 판정은 globals.css 의 터치 규칙과 같은 조건이다', () => {
    expect(readSource('lib/hooks/useBreakpoints.ts')).toMatch(/MQ_TOUCH = '\(hover: none\) and \(pointer: coarse\)'/);
  });
});

describe('표가 옆으로 밀리기 전에 줄여 담는다', () => {
  it('ScrollTable 의 안쪽 최소 폭은 minWidth - SCROLL_TABLE_SQUEEZE(768 폭 패드 세로 본문 712 에 760 표가 들어간다)', () => {
    expect(SCROLL_TABLE_SQUEEZE).toBe(48);
    expect(760 - SCROLL_TABLE_SQUEEZE).toBeLessThanOrEqual(768 - 2 * 28);
    const src = readSource('lib/design/components.tsx');
    expect(src).toMatch(/const innerMin = Math\.max\(0, minWidth - SCROLL_TABLE_SQUEEZE\);/);
    expect(src).toMatch(/className="qa-scroll-table-inner" style=\{\{ minWidth: innerMin \}\}/);
  });
});
