/* In-memory demonstration. No network, authentication, storage or production writes. */
'use strict';
const documents = [
  { id: 'DEV-2026-001', title: '설계 입력 검토서', team: '설계팀', due: '2026-10-12', revision: 'rev.03', subtitle: '휴대용 모니터링 장치 · 사용자 요구와 설계 입력', summary: '사용자 요구사항을 설계 입력에 반영한 기록입니다. 측정 환경과 사용 조건의 변경 사항을 확인하고, 각 요구사항에 검증 가능한 기준이 연결되어 있는지 검토합니다.', checks: ['사용 환경과 대상 사용자가 구체적으로 정의되어 있습니다.', '요구사항별 합격 기준과 검증 방법이 연결되어 있습니다.', '미확정 항목의 담당자와 확인 기한이 정해져 있습니다.'], related: ['DEV-2026-002', 'DEV-2026-003'], changes: ['사용 환경과 측정 범위를 보완했습니다.', '사용자 요구사항과 설계 입력의 연결을 정리했습니다.'] },
  { id: 'DEV-2026-002', title: '위험관리 계획서', team: '품질팀', due: '2026-10-13', revision: 'rev.02', subtitle: '휴대용 모니터링 장치 · 위험관리 범위와 책임', summary: '개발 단계별 위험관리 활동과 검토 책임을 정의합니다. 설계 변경에 따른 위험 분석 범위, 평가 기준, 잔여 위험 확인 절차를 함께 검토합니다.', checks: ['위험 분석의 범위와 평가 기준이 일치합니다.', '위험 통제 조치의 검증 책임이 정해져 있습니다.', '설계 변경 시 재평가할 조건이 명확합니다.'], related: ['DEV-2026-001', 'DEV-2026-005'], changes: ['설계 변경 시 재평가 조건을 추가했습니다.', '검토 책임과 산출물을 업데이트했습니다.'] },
  { id: 'DEV-2026-003', title: '설계 검증 계획서', team: '개발팀', due: '2026-10-14', revision: 'rev.01', subtitle: '휴대용 모니터링 장치 · 시험 방법과 합격 기준', summary: '설계 입력을 충족하는지 확인하기 위한 시험 계획입니다. 시험 조건, 표본 구성, 합격 기준을 검토하고 각 시험에서 남겨야 할 근거 기록을 확인합니다.', checks: ['설계 입력마다 검증 시험이 연결되어 있습니다.', '시험 조건과 표본 선정 근거가 기록되어 있습니다.', '합격 기준과 결과 기록 양식이 준비되어 있습니다.'], related: ['DEV-2026-001', 'DEV-2026-006'], changes: ['환경 시험의 표본 구성 근거를 추가했습니다.', '검증 계획 초안을 작성했습니다.'] },
  { id: 'DEV-2026-004', title: '소프트웨어 요구사항 명세서', team: '개발팀', due: '2026-10-15', revision: 'rev.04', subtitle: '측정 데이터 관리 · 기능과 예외 처리', summary: '측정 결과의 저장, 조회, 전송에 필요한 기능을 정의합니다. 통신 중단과 입력 오류 상황에서 표시할 안내 및 복구 동작이 요구사항에 포함되어 있는지 검토합니다.', checks: ['정상 동작과 오류 처리 요구사항이 구분되어 있습니다.', '데이터 저장과 전송 실패 시 복구 동작이 정의되어 있습니다.', '각 요구사항에 식별 번호와 검증 기준이 있습니다.'], related: ['DEV-2026-003', 'DEV-2026-005'], changes: ['연결 중단 시 복구 동작을 구체화했습니다.', '데이터 조회 기능을 보완했습니다.'] },
  { id: 'DEV-2026-005', title: '사용적합성 검토 기록', team: '설계팀', due: '2026-10-16', revision: 'rev.01', subtitle: '사용자 인터페이스 · 관찰 결과와 개선 항목', summary: '대표 작업을 수행하는 과정에서 관찰한 사용상의 어려움을 정리했습니다. 개선 항목이 사용자 요구 및 위험 통제 조치와 연결되어 있는지 확인합니다.', checks: ['관찰한 문제와 발생 조건을 구체적으로 기록했습니다.', '개선 항목별 담당자와 확인 방법이 정해져 있습니다.', '관련 위험 분석과 설계 입력을 함께 검토했습니다.'], related: ['DEV-2026-001', 'DEV-2026-002'], changes: ['알림 확인 단계의 관찰 결과를 추가했습니다.', '사용적합성 검토 초안을 정리했습니다.'] },
  { id: 'DEV-2026-006', title: '설계 출력 목록', team: '설계팀', due: '2026-10-19', revision: 'rev.02', subtitle: '개발 산출물 · 도면과 사양의 연결', summary: '설계 단계에서 생성한 도면, 사양서, 시험 기준의 최신 개정을 정리했습니다. 필요한 산출물이 빠짐없이 연결되어 있고 후속 단계에서 사용할 수 있는지 검토합니다.', checks: ['산출물의 식별 번호와 개정이 최신 상태입니다.', '설계 입력과 출력의 추적 관계가 확인됩니다.', '후속 단계에 전달할 자료의 범위가 명확합니다.'], related: ['DEV-2026-001', 'DEV-2026-003'], changes: ['부품 사양서의 최신 개정을 반영했습니다.', '설계 출력의 분류와 연결을 정리했습니다.'] },
  { id: 'DEV-2026-007', title: '개발 회의록', team: '개발팀', due: '2026-10-08', revision: 'rev.01', done: true, subtitle: '정기 개발 검토 · 결정 사항과 후속 업무', summary: '정기 검토 회의에서 논의한 진행 상황과 결정 사항을 기록했습니다. 후속 업무별 담당자와 기한을 확인했습니다.', checks: ['결정 사항과 논의 내용을 구분했습니다.', '후속 업무의 담당자와 기한을 기록했습니다.', '참조 자료의 최신 개정을 확인했습니다.'], related: ['DEV-2026-006'], changes: ['후속 업무의 담당자를 확정했습니다.', '회의 결과를 작성했습니다.'] },
  { id: 'DEV-2026-008', title: '문서 이관 점검표', team: '품질팀', due: '2026-10-09', revision: 'rev.02', done: true, subtitle: '기술 문서 · 전달 목록과 확인 기록', summary: '다음 개발 단계로 전달할 문서의 구성과 개정을 확인했습니다. 누락된 자료의 보완 여부와 전달 책임을 기록했습니다.', checks: ['전달 대상과 문서 목록을 대조했습니다.', '문서 개정과 첨부 자료를 확인했습니다.', '인수 확인 기록이 연결되어 있습니다.'], related: ['DEV-2026-006', 'DEV-2026-007'], changes: ['문서 전달 목록의 개정을 반영했습니다.', '문서 이관 점검을 완료했습니다.'] },
];
const $ = id => document.getElementById(id);
const reducedPreference = matchMedia('(prefers-reduced-motion: reduce)');
const mobile = matchMedia('(max-width: 720px)');
const records = new Map();
const motionSettings = { speed: 1, off: reducedPreference.matches, variant: new URLSearchParams(location.search).get('motion') === 'current' ? 'current' : 'connected' };
let route = { id: null, mode: 'split' }, lastSelected = null, transitionSerial = 0;
let listPosition = 0;
let layoutAnimation = null, listAnimation = null, layoutScroll = null;
const make = (tag, text, className) => { const node = document.createElement(tag); if (text !== undefined) node.textContent = text; if (className) node.className = className; return node; };
const icon = name => { const node = make('span', undefined, 'qd-icon'); node.dataset.icon = name; node.setAttribute('aria-hidden', 'true'); return node; };
function initializeRecords() {
  for (const old of records.values()) clearTimeout(old.timer);
  records.clear();
  for (const doc of documents) records.set(doc.id, { note: '', savedNote: '', checks: doc.checks.map(() => Boolean(doc.done)), savedChecks: doc.checks.map(() => Boolean(doc.done)), done: Boolean(doc.done), busy: false, feedback: '', error: '', tab: 'content', scroll: 0, splitScroll: 0, events: [], timer: null });
}
initializeRecords();
function dirty(record) { return record.note !== record.savedNote || record.checks.some((value, i) => value !== record.savedChecks[i]); }
function announce(message) { $('announcement').textContent = message; }
function filtered() {
  const query = $('search').value.trim().toLocaleLowerCase('ko-KR');
  return documents.filter(doc => {
    const done = records.get(doc.id).done;
    return `${doc.title} ${doc.id} ${doc.team}`.toLocaleLowerCase('ko-KR').includes(query) && ($('status-filter').value === 'all' || ($('status-filter').value === 'done' ? done : !done));
  }).sort($('sort').value === 'name' ? (a, b) => a.title.localeCompare(b.title, 'ko') : (a, b) => a.due.localeCompare(b.due));
}
function renderList() {
  const scroll = $('list-scroll').scrollTop;
  const focusedId = document.activeElement?.closest('[data-document]')?.dataset.document;
  const result = filtered();
  $('document-list').replaceChildren(...result.map(doc => {
    const record = records.get(doc.id), selected = (route.id || lastSelected) === doc.id;
    const button = make('button', undefined, 'document-row'); button.type = 'button'; button.dataset.document = doc.id;
    button.setAttribute('aria-pressed', String(selected)); button.setAttribute('aria-label', `${doc.title}, ${record.done ? '검토 완료' : '검토 대기'}`);
    const top = make('span', undefined, 'row-top'); const status = make('span', record.done ? '검토 완료' : '검토 대기', 'status'); status.dataset.state = record.done ? 'done' : 'review';
    top.append(make('span', doc.id.replace('DEV-2026-', 'DEV-'), 'mono'), status);
    const bottom = make('span', undefined, 'row-bottom'); bottom.append(make('span', doc.team), make('span', selected ? (route.id ? '열람 중' : '최근 열람') : `${Number(doc.due.slice(5, 7))}월 ${Number(doc.due.slice(8))}일`, selected ? 'row-selected-label' : ''));
    button.append(top, make('strong', doc.title), bottom);
    button.addEventListener('click', () => navigate(doc.id, 'split'));
    button.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault(); const buttons = [...$('document-list').querySelectorAll('button')], index = buttons.indexOf(button);
      const targetIndex = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
      buttons[targetIndex]?.focus();
    });
    return button;
  }));
  $('list-scroll').scrollTop = scroll;
  if (focusedId) $('document-list').querySelector(`[data-document="${focusedId}"]`)?.focus({ preventScroll: true });
  $('list-empty').hidden = result.length > 0; $('result-count').textContent = `${result.length}건`;
  const pending = documents.filter(doc => !records.get(doc.id).done).length;
  $('pending-count').textContent = pending; $('rail-count').textContent = pending;
  $('start-review').disabled = result.length === 0;
  if (route.id) renderPosition();
  updateComparison();
}
function renderPosition() {
  const result = filtered(), index = result.findIndex(doc => doc.id === route.id);
  $('position-label').textContent = index < 0 ? '현재 조건 밖의 문서' : `${index + 1} / ${result.length}`;
}
function animate(node, kind, exit = false) {
  node.getAnimations().forEach(animation => animation.cancel());
  if (motionSettings.off || reducedPreference.matches) return Promise.resolve();
  const duration = ({ detail: 220, focus: 260, back: 180, exit: 120, feedback: 140 })[kind] * motionSettings.speed;
  const frames = exit ? [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(4px)' }] : [{ opacity: 0, transform: `translateY(${kind === 'focus' ? 6 : 4}px)` }, { opacity: 1, transform: 'translateY(0)' }];
  return node.animate(frames, { duration, easing: 'cubic-bezier(.16,1,.3,1)' }).finished.catch(() => {});
}
function saveScroll() { if (route.id) records.get(route.id).scroll = $('detail-scroll').scrollTop; }
// The same live document stays mounted. Only the two grid tracks change size.
// No screenshots, duplicate text, or scaling are used during the comparison.
function finishLayout() {
  if (!layoutAnimation) return;
  const animation = layoutAnimation; layoutAnimation = null;
  if (animation) animation.cancel();
  if (listAnimation) { listAnimation.cancel(); listAnimation = null; }
  delete $('workspace').dataset.connecting;
  $('list-pane').style.removeProperty('width');
  $('article').style.removeProperty('min-height');
  $('list-pane').inert = route.mode === 'focus' && !mobile.matches;
  if (route.mode !== 'focus') $('list-scroll').scrollTop = listPosition;
  if (layoutScroll !== null) { $('detail-scroll').scrollTop = layoutScroll; layoutScroll = null; }
}
function connectLayout(startWidth, targetScroll, startOpacity) {
  const workspace = $('workspace'), list = $('list-pane');
  const splitWidth = parseFloat(getComputedStyle(workspace).getPropertyValue('--review-list-width'));
  const targetWidth = route.mode === 'focus' ? 0 : splitWidth;
  const duration = (route.mode === 'focus' ? 320 : 240) * motionSettings.speed;
  workspace.dataset.connecting = 'true';
  list.style.width = `${splitWidth}px`;
  list.inert = route.mode === 'focus';
  // Set the final geometry to restore reading position before the first frame.
  layoutScroll = targetScroll;
  $('article').style.minHeight = `${$('detail-scroll').clientHeight + targetScroll}px`;
  $('detail-scroll').scrollTop = targetScroll;
  const animation = workspace.animate([
    { gridTemplateColumns: `${startWidth}px minmax(0, 1fr)` },
    { gridTemplateColumns: `${targetWidth}px minmax(0, 1fr)` }
  ], { duration, easing: 'cubic-bezier(.22,1,.36,1)' });
  const concealed = Math.max(0, Math.min(1, 1 - startWidth / splitWidth));
  listAnimation = list.animate([
    { opacity: startWidth < 1 ? 0 : startOpacity, transform: `translateX(${-8 * concealed}px)` },
    { opacity: targetWidth ? 1 : 0, transform: `translateX(${targetWidth ? 0 : -8}px)` }
  ], { duration: targetWidth ? duration : duration * .65, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' });
  layoutAnimation = animation;
  animation.finished.then(() => { if (layoutAnimation === animation) finishLayout(); }).catch(() => {});
}
function urlFor(next) { const url = new URL(location.href); url.hash = next.id ? `${next.mode}/${next.id}` : ''; return url; }
function parseRoute() {
  const [mode, id] = location.hash.slice(1).split('/');
  return documents.some(doc => doc.id === id) ? { id, mode: mode === 'focus' ? 'focus' : 'split' } : { id: null, mode: 'split' };
}
function navigate(id, mode = 'split', fromHistory = false) {
  if (route.id === id && route.mode === mode) return;
  const next = { id, mode: id ? mode : 'split' };
  if (!fromHistory) history.pushState(next, '', urlFor(next));
  applyRoute(next);
}
async function applyRoute(next, initial = false) {
  const serial = ++transitionSerial, previous = { ...route };
  const transitioning = Boolean(layoutAnimation);
  const startWidth = $('list-pane').getClientRects().length ? parseFloat(getComputedStyle($('workspace')).gridTemplateColumns) : 0;
  const startOpacity = Number(getComputedStyle($('list-pane')).opacity);
  const connect = !initial && previous.id && next.id === previous.id && next.mode !== previous.mode && motionSettings.variant === 'connected' && !mobile.matches && !motionSettings.off && !reducedPreference.matches;
  finishLayout();
  $('detail-view').getAnimations().forEach(animation => animation.cancel());
  $('article').getAnimations().forEach(animation => animation.cancel());
  saveScroll();
  if (!transitioning && previous.mode === 'split' && $('list-pane').getClientRects().length) listPosition = $('list-scroll').scrollTop;
  if (previous.id && next.id === previous.id && previous.mode === 'split' && next.mode === 'focus' && !transitioning) records.get(previous.id).splitScroll = $('detail-scroll').scrollTop;
  route = next; if (next.id) lastSelected = next.id;
  if (!next.id && previous.id && !initial) {
    await animate($('detail-view'), 'exit', true);
    if (serial !== transitionSerial) return;
  }
  $('workspace').dataset.mode = next.mode;
  $('workspace').dataset.open = String(Boolean(next.id));
  $('list-pane').inert = next.mode === 'focus' && !mobile.matches;
  $('detail-empty').hidden = Boolean(next.id); $('detail-view').hidden = !next.id;
  $('back-label').textContent = next.mode === 'focus' ? '목록과 함께 보기' : '목록으로';
  renderList();
  updateComparison();
  if (next.mode !== 'focus') $('list-scroll').scrollTop = listPosition;
  if (next.id) {
    const same = previous.id === next.id;
    if (!same || initial) renderDetail();
    const targetScroll = same && previous.mode === 'focus' && next.mode === 'split' ? records.get(next.id).splitScroll : records.get(next.id).scroll;
    $('detail-scroll').scrollTop = targetScroll;
    if (connect) connectLayout(startWidth, targetScroll, startOpacity);
    else if (!initial) animate($('article'), next.mode === 'focus' ? 'focus' : previous.mode === 'focus' ? 'back' : 'detail');
    if (mobile.matches || next.mode === 'focus' || previous.mode === 'focus') $('document-title').focus({ preventScroll: true });
    announce(`${documents.find(doc => doc.id === next.id).title} ${next.mode === 'focus' ? '집중 보기' : '열람'}`);
  } else {
    if (!initial) {
      animate($('detail-empty'), 'back');
      const trigger = $('document-list').querySelector(`[data-document="${lastSelected}"]`);
      (trigger || $('search')).focus({ preventScroll: true });
      announce('목록으로 돌아왔습니다. 검색 조건과 목록 위치가 유지됩니다.');
    }
  }
}
function renderDetail() {
  const doc = documents.find(item => item.id === route.id), record = records.get(route.id);
  $('document-code').textContent = doc.id; $('document-title').textContent = doc.title; $('document-subtitle').textContent = doc.subtitle;
  $('current-document-code').textContent = doc.id; $('current-document-title').textContent = doc.title; $('current-document-title').title = doc.title;
  $('document-team').textContent = doc.team; $('document-revision').textContent = doc.revision;
  $('document-due').textContent = `${Number(doc.due.slice(5, 7))}월 ${Number(doc.due.slice(8))}일`;
  $('document-summary').textContent = doc.summary;
  $('checklist').replaceChildren(...doc.checks.map((text, index) => {
    const label = make('label', undefined, 'check-item'), input = make('input'); input.type = 'checkbox'; input.checked = record.checks[index]; input.disabled = record.done;
    input.addEventListener('change', () => { record.checks[index] = input.checked; record.error = ''; record.feedback = ''; renderReviewState(); });
    label.append(input, make('span', text)); return label;
  }));
  $('related-records').replaceChildren(...doc.related.map(id => {
    const related = documents.find(item => item.id === id); const button = make('button', undefined, 'related-link'); button.type = 'button';
    button.append(make('span', related.title), icon('next')); button.addEventListener('click', () => navigate(id, route.mode)); return button;
  }));
  $('note').value = record.note;
  renderHistory(); setTab(record.tab, false); renderReviewState(); renderPosition();
}
function renderHistory() {
  const doc = documents.find(item => item.id === route.id), record = records.get(route.id);
  const events = [...record.events, ...doc.changes.map((text, index) => ({ date: index ? '2026-10-02' : '2026-10-08', title: index ? '이전 개정' : `${doc.revision} 문서 개정`, text }))];
  $('history-list').replaceChildren(...events.map(event => { const li = make('li'), date = make('time', event.date); li.append(date, make('h3', event.title), make('p', event.text)); return li; }));
}
function setTab(tab, focus = false) {
  if (!route.id) return;
  records.get(route.id).tab = tab;
  for (const item of ['content', 'history']) { const active = tab === item; $(`${item}-tab`).setAttribute('aria-selected', String(active)); $(`${item}-tab`).tabIndex = active ? 0 : -1; $(`${item}-panel`).hidden = !active; }
  if (focus) $(`${tab}-tab`).focus();
}
function nextDocument() {
  const result = filtered(), index = result.findIndex(doc => doc.id === route.id);
  return [...result.slice(index + 1), ...result.slice(0, Math.max(0, index))].find(doc => doc.id !== route.id && !records.get(doc.id).done)
    || documents.find(doc => doc.id !== route.id && !records.get(doc.id).done);
}
function renderReviewState() {
  if (!route.id) return;
  const record = records.get(route.id), changed = dirty(record);
  $('document-status').textContent = record.done ? '검토 완료' : '검토 대기'; $('document-status').dataset.state = record.done ? 'done' : 'review';
  $('check-count').textContent = `${record.checks.filter(Boolean).length} / ${record.checks.length} 확인`;
  $('char-count').textContent = `${record.note.length.toLocaleString()} / 1,200`;
  $('draft-status').textContent = record.busy ? '저장 중' : changed ? '저장하지 않은 변경' : record.feedback ? '저장됨' : record.done ? '검토 완료' : '작성 전';
  $('save-feedback').textContent = record.busy ? '검토 내용을 저장하고 있습니다.' : record.error ? '' : record.feedback || (changed ? '작성한 내용은 문서별로 유지됩니다.' : '검토 내용을 확인해 주세요.');
  $('save-feedback').dataset.kind = record.feedback && !record.busy && !record.error ? 'success' : 'normal';
  $('save-error').textContent = record.error;
  $('save').disabled = record.busy || !changed; $('save').textContent = record.busy ? '저장 중' : record.error ? '다시 저장' : '메모 저장';
  $('complete').disabled = record.busy;
  $('complete').className = `button ${record.done ? 'secondary' : 'primary'}`;
  $('complete').replaceChildren(document.createTextNode(record.done ? '검토 다시 열기' : '검토 완료'), icon(record.done ? 'back' : 'approved'));
  $('next-document').hidden = !record.done; $('next-document').disabled = !nextDocument();
}
function saveReview(complete = false) {
  const id = route.id, record = records.get(id); if (!record || record.busy) return;
  if (complete && record.done) {
    record.done = false; record.feedback = '검토를 다시 열었습니다. (시안)'; record.error = '';
    record.events.unshift({ date: '이번 체험', title: '검토 다시 열기', text: '검토 상태를 대기로 되돌렸습니다.' });
    renderList(); renderDetail(); return;
  }
  if (complete && record.checks.some(value => !value)) {
    record.error = '확인 항목을 모두 검토한 뒤 완료해 주세요.'; setTab('content'); renderReviewState(); $('checklist').querySelector('input:not(:checked)')?.focus(); return;
  }
  const snapshot = { note: record.note, checks: [...record.checks] };
  const fail = $('fail-save').checked; $('fail-save').checked = false;
  record.busy = true; record.error = ''; renderReviewState();
  // Deliberate 650ms simulated response, independent of the animation speed setting.
  record.timer = setTimeout(() => {
    record.busy = false;
    if (fail) record.error = '저장하지 못했습니다. 작성한 내용은 유지됩니다. 다시 저장해 주세요.';
    else {
      record.savedNote = snapshot.note; record.savedChecks = [...snapshot.checks];
      if (complete && !dirty(record)) record.done = true;
      record.feedback = dirty(record) ? '이전 내용을 저장했습니다. 추가 변경은 다시 저장해 주세요.' : complete ? '검토를 완료했습니다. (시안)' : '검토 내용을 저장했습니다. (시안)';
      record.events.unshift({ date: '이번 체험', title: complete && record.done ? '검토 완료' : '검토 내용 저장', text: '예시 화면 안에서 처리한 기록입니다.' });
    }
    renderList();
    if (route.id === id) {
      renderReviewState(); renderHistory(); $('checklist').querySelectorAll('input').forEach(input => { input.disabled = record.done; });
      animate($('save-feedback'), 'feedback');
    } else announce(`${documents.find(doc => doc.id === id).title}: ${record.error || record.feedback}`);
  }, 650);
}
// Query controls preserve an open document even when it falls outside the result set.
for (const id of ['search', 'status-filter', 'sort']) $(id).addEventListener(id === 'search' ? 'input' : 'change', () => { $('list-scroll').scrollTop = 0; listPosition = 0; renderList(); announce(`${filtered().length}건의 문서가 있습니다.`); });
$('clear-filters').addEventListener('click', () => { $('search').value = ''; $('status-filter').value = 'all'; renderList(); $('search').focus(); });
$('start-review').addEventListener('click', () => { const first = filtered().find(doc => !records.get(doc.id).done) || filtered()[0]; if (first) navigate(first.id); });
$('back').addEventListener('click', () => navigate(route.mode === 'focus' ? route.id : null, 'split'));
$('focus-view').addEventListener('click', () => navigate(route.id, 'focus'));
$('note').addEventListener('input', () => { const record = records.get(route.id); record.note = $('note').value; record.error = ''; record.feedback = ''; renderReviewState(); });
// Explicit reading/input gestures take priority over an in-flight layout change.
$('detail-scroll').addEventListener('wheel', finishLayout, { passive: true });
$('detail-scroll').addEventListener('pointerdown', finishLayout);
$('detail-scroll').addEventListener('keydown', event => { if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) finishLayout(); });
$('save').addEventListener('click', () => saveReview()); $('complete').addEventListener('click', () => saveReview(true));
$('next-document').addEventListener('click', () => { const next = nextDocument(); if (next) navigate(next.id, route.mode); });
for (const tab of ['content', 'history']) {
  $(`${tab}-tab`).addEventListener('click', () => setTab(tab));
  $(`${tab}-tab`).addEventListener('keydown', event => { if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setTab(event.key === 'Home' ? 'content' : event.key === 'End' ? 'history' : tab === 'content' ? 'history' : 'content', true); } });
}
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  if (!$('mobile-menu').hidden) { event.preventDefault(); toggleMenu(false); return; }
  if ($('settings').open) { $('settings').open = false; $('settings').querySelector('summary').focus(); return; }
  if (route.id) { event.preventDefault(); navigate(route.mode === 'focus' ? route.id : null, 'split'); }
});
document.addEventListener('click', event => { if (!$('settings').contains(event.target)) $('settings').open = false; });
function updateMotion() {
  finishLayout();
  motionSettings.speed = Number($('motion-speed').value); motionSettings.off = $('reduce-motion').checked;
  const disabled = motionSettings.off || reducedPreference.matches;
  document.documentElement.dataset.motion = disabled ? 'off' : 'on';
  document.documentElement.style.setProperty('--review-ui', `${120 * motionSettings.speed}ms`);
  if (disabled) document.getAnimations().forEach(animation => animation.cancel());
  updateMotionSpec();
  $('slow-motion').setAttribute('aria-pressed', String(motionSettings.speed === 3));
  updateComparison();
}
function updateComparison() {
  for (const variant of ['current', 'connected']) $(`motion-${variant}`).setAttribute('aria-pressed', String(motionSettings.variant === variant));
  $('try-focus').disabled = mobile.matches || !filtered().length && !route.id;
  $('try-focus').textContent = route.mode === 'focus' ? '목록과 함께 보기' : '집중 보기 체험';
  $('compare-description').textContent = mobile.matches ? '폰에서는 목록과 상세를 한 화면씩 봅니다. 폭 전환 비교는 넓은 화면에서 체험하세요.' : motionSettings.off || reducedPreference.matches ? '모션 줄이기 적용 중입니다. 위치를 유지하고 즉시 전환합니다.' : motionSettings.variant === 'connected' ? '목록을 접으며 본문을 넓힙니다. 복귀하면 선택과 읽던 위치가 돌아옵니다.' : '목록을 즉시 접고 본문만 짧게 나타냅니다. 기존 시안의 전환입니다.';
  updateMotionSpec();
}
function updateMotionSpec() {
  const disabled = motionSettings.off || reducedPreference.matches;
  const connected = motionSettings.variant === 'connected';
  $('motion-spec').textContent = disabled ? (reducedPreference.matches ? '기기의 모션 줄이기 설정을 따릅니다.' : '움직임 없이 즉시 전환합니다.') : `상세 ${220 * motionSettings.speed}ms · 집중 보기 ${(connected ? 320 : 260) * motionSettings.speed}ms · 복귀 ${(connected ? 240 : 180) * motionSettings.speed}ms`;
}
for (const variant of ['current', 'connected']) $(`motion-${variant}`).addEventListener('click', () => {
  finishLayout(); $('article').getAnimations().forEach(animation => animation.cancel());
  motionSettings.variant = variant; updateComparison();
  const url = new URL(location.href); url.searchParams.set('motion', variant); history.replaceState(route, '', url);
  announce(`${variant === 'connected' ? '폭이 이어지는 방식' : '현재 방식'} 선택`);
});
$('slow-motion').addEventListener('click', () => { $('motion-speed').value = motionSettings.speed === 3 ? '1' : '3'; updateMotion(); });
$('try-focus').addEventListener('click', () => {
  if (mobile.matches) return;
  if (!route.id) { const first = filtered()[0]; if (!first) return; navigate(first.id); }
  navigate(route.id, route.mode === 'focus' ? 'split' : 'focus');
});
function toggleMenu(open) {
  $('mobile-menu').hidden = !open; $('mobile-menu-toggle').setAttribute('aria-expanded', String(open));
  $('mobile-menu').style.top = `${document.querySelector('.lab-bar').offsetHeight}px`;
  if (open) $('mobile-menu').querySelector('a').focus({ preventScroll: true });
  else $('mobile-menu-toggle').focus({ preventScroll: true });
}
$('mobile-menu-toggle').addEventListener('click', () => toggleMenu($('mobile-menu').hidden));
$('mobile-menu-close').addEventListener('click', () => toggleMenu(false));
$('reduce-motion').checked = reducedPreference.matches;
for (const id of ['motion-speed', 'reduce-motion']) $(id).addEventListener('change', updateMotion);
reducedPreference.addEventListener('change', updateMotion);
$('theme').addEventListener('click', () => { const light = document.documentElement.dataset.theme !== 'light'; document.documentElement.dataset.theme = light ? 'light' : 'dark'; $('theme').textContent = light ? '어두운 화면' : '밝은 화면'; });
$('reset-demo').addEventListener('click', () => {
  initializeRecords(); lastSelected = null; listPosition = 0; $('list-scroll').scrollTop = 0;
  $('search').value = ''; $('status-filter').value = 'all'; $('sort').value = 'due'; $('fail-save').checked = false; $('settings').open = false;
  history.replaceState(null, '', urlFor({ id: null })); route = { id: null, mode: 'split' }; applyRoute(route, true); $('search').focus(); announce('예시 데이터를 초기화했습니다.');
});
window.addEventListener('popstate', () => { applyRoute(parseRoute()); });
mobile.addEventListener('change', () => {
  finishLayout(); updateComparison();
  if (!mobile.matches) { $('mobile-menu').hidden = true; $('mobile-menu-toggle').setAttribute('aria-expanded', 'false'); }
  if (!mobile.matches && route.mode === 'split') $('list-scroll').scrollTop = listPosition;
});
window.addEventListener('resize', () => {
  if (layoutAnimation) finishLayout();
  if (!$('mobile-menu').hidden) $('mobile-menu').style.top = `${document.querySelector('.lab-bar').offsetHeight}px`;
});
const initial = parseRoute(); history.replaceState(initial, '', urlFor(initial));
updateMotion(); applyRoute(initial, true);
