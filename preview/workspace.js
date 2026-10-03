// Local, illustrative records only. No network calls, credentials or persistence.
const products = {
  atelier: { name: 'Q-Atelier', purpose: '설계와 개발의 기록', prefix: 'DEV', note: '설계 입력과 검증 기록을 함께 확인하면 다음 검토에 필요한 근거를 찾기 쉽습니다.', titles: ['설계 입력 검토서', '위험관리 계획서', '설계 검증 계획서', '소프트웨어 요구사항 명세서', '개발 회의록', '설계 출력 목록'] },
  maison: { name: 'Q-Maison', purpose: '조직과 품질의 기록', prefix: 'QMS', note: '문서 검토를 마친 뒤 교육과 시정조치 기록을 확인해 후속 업무를 이어갑니다.', titles: ['교육 결과 보고서', '시정조치 계획서', '내부감사 점검표', '공급자 평가서', '경영검토 회의록', '문서 관리 절차서'] },
  carnet: { name: 'Q-Carnet', purpose: '생산과 제조의 기록', prefix: 'DHR', note: '제조 기록과 검사 결과를 함께 확인해 로트의 다음 단계를 준비합니다.', titles: ['제조기록 검토서', '수입검사 기록서', '공정검사 기록서', '포장 작업 기록서', '출하검사 기록서', '설비 점검 기록서'] },
};
const statuses = { review: '검토 대기', draft: '작성 중', approved: '승인 완료' };
const states = ['review', 'review', 'draft', 'approved', 'approved', 'draft'];
const $ = id => document.getElementById(id);
let activeProduct = 'atelier';
let records = [];
let returnFocus = null;
const element = (tag, text, className) => {
  const el = document.createElement(tag);
  if (text !== undefined) el.textContent = text;
  if (className) el.className = className;
  return el;
};

function showDocument(record, trigger) {
  returnFocus = trigger;
  $('dialog-title').textContent = record.title;
  $('dialog-description').textContent = `${products[activeProduct].name} · ${record.id}`;
  $('dialog-fields').replaceChildren(...[
    ['문서 상태', statuses[record.state]], ['최근 변경', record.updated], ['담당', '품질 담당자 (예시)'], ['개정', '초안 예시'],
  ].map(([label, value]) => {
    const row = element('div'); row.append(element('dt', label), element('dd', value)); return row;
  }));
  $('dialog-summary').textContent = `${record.title}의 작성 목적, 검토 항목, 관련 기록이 들어가는 자리입니다. 핵심 내용과 문서 상태를 먼저 읽고 세부 근거를 확인합니다.`;
  $('document-dialog').showModal();
}

function rowFor(record, priority = false) {
  const row = element('article', undefined, 'qd-work-row');
  const copy = element('div');
  copy.append(element('h3', record.title));
  const meta = element('p');
  meta.append(element('span', record.id, 'qd-work-code'), document.createTextNode(` · ${priority ? `검토 기한 ${record.due}` : `갱신 ${record.updated}`}`));
  copy.append(meta);
  const actions = element('div', undefined, 'qd-work-actions');
  const status = element('span', statuses[record.state], 'qd-work-status'); status.dataset.state = record.state;
  const button = element('button', '내용 보기', 'qd-work-action'); button.type = 'button';
  button.setAttribute('aria-label', `${record.title} 내용 보기`);
  button.addEventListener('click', () => showDocument(record, button));
  actions.append(status, button); row.append(copy, actions); return row;
}

function renderDocuments() {
  const query = $('search').value.trim().toLocaleLowerCase('ko-KR');
  const state = $('status').value;
  const result = records.filter(record => (state === 'all' || record.state === state) && `${record.title} ${record.id}`.toLocaleLowerCase('ko-KR').includes(query));
  result.sort($('sort').value === 'name' ? (a,b) => a.title.localeCompare(b.title, 'ko') : (a,b) => b.updated.localeCompare(a.updated));
  $('document-list').replaceChildren(...result.map(record => rowFor(record)));
  $('result-count').textContent = `${result.length}건 표시 · 전체 ${records.length}건`;
  $('empty').hidden = result.length !== 0;
}

function switchView(view, focus = true) {
  const next = view === 'documents' ? 'documents' : 'overview';
  $('overview').hidden = next !== 'overview'; $('documents').hidden = next !== 'documents';
  document.querySelectorAll('[data-view]').forEach(link => {
    if (link.dataset.view === next) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (focus) $(`${next}-title`).focus({ preventScroll: true });
}

function selectProduct() {
  activeProduct = $('product').value;
  const product = products[activeProduct];
  document.body.dataset.product = activeProduct;
  $('product-name').textContent = product.name; $('product-purpose').textContent = product.purpose;
  $('product-icon').src = `../dist/app-icons/${activeProduct}/icon-192.png`;
  $('workflow-note').textContent = product.note;
  records = product.titles.map((title, i) => ({ title, id: `${product.prefix}-2026-${String(i + 1).padStart(3,'0')}`, state: states[i], updated: `2026-10-${String(3 - i % 3).padStart(2,'0')}`, due: `10월 ${4 + i}일` }));
  for (const state of Object.keys(statuses)) {
    $(`metric-${state}`).replaceChildren(document.createTextNode(String(records.filter(r => r.state === state).length)), element('span', '건'));
  }
  $('priority-list').replaceChildren(...records.filter(r => r.state === 'review').map(r => rowFor(r, true)));
  $('recent-list').replaceChildren(...[...records].sort((a,b) => b.updated.localeCompare(a.updated)).slice(0,3).map(record => {
    const item = element('div', undefined, 'preview-recent'); const date = element('time', record.updated); date.dateTime = record.updated;
    item.append(element('p', record.title), date); return item;
  }));
  $('search').value = ''; $('status').value = 'all'; $('sort').value = 'recent'; renderDocuments();
}

const params = new URLSearchParams(location.search);
if (Object.hasOwn(products, params.get('product'))) $('product').value = params.get('product');
document.documentElement.dataset.theme = params.get('theme') === 'light' ? 'light' : 'dark';
$('theme').setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'light'));
$('theme').addEventListener('click', () => {
  const light = document.documentElement.dataset.theme !== 'light';
  document.documentElement.dataset.theme = light ? 'light' : 'dark'; $('theme').setAttribute('aria-pressed', String(light));
});
$('product').addEventListener('change', selectProduct);
$('filters').addEventListener('submit', event => event.preventDefault());
$('search').addEventListener('input', renderDocuments);
for (const id of ['status','sort']) $(id).addEventListener('change', renderDocuments);
$('reset').addEventListener('click', () => { $('search').value = ''; $('status').value = 'all'; $('sort').value = 'recent'; renderDocuments(); $('search').focus(); });
document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click', event => {
  event.preventDefault(); const view = link.dataset.view; history.replaceState(null, '', `#${view}`); switchView(view);
}));
window.addEventListener('hashchange', () => {
  const view = location.hash.slice(1);
  // In-page accessibility anchors must not switch the current workspace view.
  if (view === 'overview' || view === 'documents') switchView(view);
});
$('review-all').addEventListener('click', () => { $('search').value = ''; $('status').value = 'review'; renderDocuments(); history.replaceState(null, '', '#documents'); switchView('documents'); });
$('close-dialog').addEventListener('click', () => $('document-dialog').close());
$('document-dialog').addEventListener('close', () => returnFocus?.focus());
selectProduct(); switchView(location.hash.slice(1), false);
