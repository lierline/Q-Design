const search = document.getElementById('icon-search');
const grid = document.getElementById('icon-grid');
const count = document.getElementById('icon-count');
const theme = document.getElementById('theme');
let icons = [];
function setTheme(light) {
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  theme.setAttribute('aria-pressed', String(light));
  theme.textContent = light ? '어두운 화면' : '밝은 화면';
}
setTheme(new URLSearchParams(location.search).get('theme') === 'light');
theme.addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'light'));
function render() {
  const query = search.value.trim().toLowerCase();
  const matches = icons.filter(icon => `${icon.id} ${icon.label} ${icon.group}`.toLowerCase().includes(query));
  grid.replaceChildren(...matches.map(icon => {
    const cell = document.createElement('div'); cell.className = 'icon-cell';
    const glyph = document.createElement('span'); glyph.className = 'qd-icon qd-icon--lg'; glyph.dataset.icon = icon.id; glyph.setAttribute('aria-hidden', 'true');
    const label = document.createElement('strong'); label.textContent = icon.label;
    const name = document.createElement('code'); name.textContent = icon.id;
    cell.append(glyph, label, name); return cell;
  }));
  count.textContent = `${matches.length}종 표시 · 전체 ${icons.length}종`;
  document.getElementById('icon-empty').hidden = matches.length !== 0;
}
search.addEventListener('input', render);
fetch('../dist/q-design.icons.json').then(response => {
  if (!response.ok) throw new Error('Catalog unavailable');
  return response.json();
}).then(catalog => { icons = catalog.icons; render(); }).catch(() => {
  count.textContent = '아이콘 목록을 불러오지 못했습니다. 페이지를 새로고침하십시오.';
});
