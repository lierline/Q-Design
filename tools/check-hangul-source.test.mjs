import test from 'node:test';
import assert from 'node:assert/strict';
import { 훑기 } from './check-hangul-source.mjs';

// 정본 클래스는 «그 요소 자신» 에 자간을 겁니다(.qd-pager-page[data-hangul] 로 풂). 자식은 물려받고, 형제는 받지 않습니다.
const 클래스 = ['qd-label', 'qd-pager-page', 'qd-table'];
const 글들 = (src) => 훑기(src, 클래스).map((h) => h.글);

test('클래스가 붙은 요소가 닫힌 뒤의 형제 글자는 잡지 않는다', () => {
  // 2026-10-22: 여는 태그부터 400자를 훑던 때는 「다음」 을 .qd-pager-page «안» 이라고 잡았다(세 제품 8곳 전부 이 꼴)
  const src = `<nav>
  <span className="qd-pager-page">{page} / {pages}</span>
  <Link href={next} className="qd-pager-btn">다음</Link>
</nav>`;
  assert.deepEqual(글들(src), []);
});

test('클래스가 붙은 요소 안에 박힌 한글은 깊이와 상관없이 잡는다', () => {
  const src = `<p className="qd-label">구역 <b>이름</b></p>`;
  assert.deepEqual(글들(src), ['구역', '이름']);
  assert.deepEqual(훑기(src, 클래스).map((h) => h.태그), ['p', 'b']);
});

test('그 요소에 data-hangul · data-latin 이 있으면 통과하고, 글을 담은 태그의 표시도 받아 준다', () => {
  assert.deepEqual(글들(`<p className="qd-label" data-hangul="">구역 이름</p>`), []);
  assert.deepEqual(글들(`<p className="qd-label" data-latin>구역 이름</p>`), []);
  assert.deepEqual(글들(`<p className="qd-label"><span data-hangul>구역</span></p>`), []);
});

test('className 이 식이어도 보고, 한글 변종 · 이름이 이어진 다른 클래스는 건너뛴다', () => {
  assert.deepEqual(글들(`<p className={cn('qd-label', on && 'is-on')}>구역</p>`), ['구역']);
  assert.deepEqual(글들(`<p className="qd-label qd-label--hangul">구역</p>`), []);
  assert.deepEqual(글들(`<div className="qd-table-scroll"><span>머리</span></div>`), []);
});

test('줄 번호는 한글 글자가 시작하는 줄이다', () => {
  const src = `<div>\n  <p className="qd-label">\n    구역\n  </p>\n</div>`;
  assert.deepEqual(훑기(src, 클래스).map((h) => h.줄), [3]);
});
