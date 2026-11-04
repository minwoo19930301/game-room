const track = document.querySelector('#card-track');
const cards = [...document.querySelectorAll('.game-card')];
const dots = [...document.querySelectorAll('.dot')];
const toggle = document.querySelector('#motion-toggle');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let active = 0, previewEnabled = !reducedMotion.matches, iframe = null, debounce = 0;

function clearPreview() {
  if (!iframe) return;
  iframe.parentElement.classList.remove('is-ready');
  iframe.remove();
  iframe = null;
}
function showPreview() {
  clearPreview();
  if (!previewEnabled || document.hidden) return;
  const host = cards[active].querySelector('.preview-host');
  iframe = document.createElement('iframe');
  iframe.title = `${cards[active].dataset.name} 미리보기`;
  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
  iframe.src = cards[active].dataset.preview;
  host.append(iframe);
}
window.addEventListener('message', event => {
  if (event.origin !== location.origin || !iframe || event.source !== iframe.contentWindow) return;
  if (event.data?.type === 'game-preview-ready') iframe.parentElement.classList.add('is-ready');
});
function select(index) {
  if (active === index) return;
  active = index;
  cards.forEach((card, i) => card.classList.toggle('is-active', i === active));
  dots.forEach((dot, i) => { dot.classList.toggle('selected', i === active); dot.setAttribute('aria-pressed', String(i === active)); });
  document.querySelector('#page-count').textContent = `${String(active + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
  document.querySelector('#selection-status').textContent = `${cards[active].dataset.name} 선택됨`;
  clearPreview();
  clearTimeout(debounce);
  debounce = setTimeout(showPreview, 180);
}
function nearestCard() {
  const center = track.getBoundingClientRect().left + track.clientWidth / 2;
  let nearest = 0, distance = Infinity;
  cards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    const delta = Math.abs(rect.left + rect.width / 2 - center);
    if (delta < distance) { distance = delta; nearest = index; }
  });
  select(nearest);
}
function go(index) {
  const next = (index + cards.length) % cards.length;
  const card = cards[next], rect = card.getBoundingClientRect(), trackRect = track.getBoundingClientRect();
  track.scrollTo({left: track.scrollLeft + rect.left + rect.width / 2 - trackRect.left - track.clientWidth / 2, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
}
track.addEventListener('scroll', nearestCard, {passive:true});
track.addEventListener('keydown', event => {
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); go(active + (event.key === 'ArrowRight' ? 1 : -1)); }
});
cards.forEach((card, index) => card.querySelector('a').addEventListener('click', event => {
  if (index !== active) { event.preventDefault(); go(index); }
}));
dots.forEach((dot, index) => dot.addEventListener('click', () => go(index)));
document.querySelector('#previous').onclick = () => go(active - 1);
document.querySelector('#next').onclick = () => go(active + 1);
function updateToggle() {
  toggle.setAttribute('aria-pressed', String(previewEnabled));
  toggle.setAttribute('aria-label', `움직이는 미리보기 ${previewEnabled ? '일시정지' : '재생'}`);
  toggle.firstElementChild.textContent = previewEnabled ? 'Ⅱ' : '▷';
}
toggle.onclick = () => { previewEnabled = !previewEnabled; updateToggle(); showPreview(); };
reducedMotion.addEventListener('change', () => { previewEnabled = !reducedMotion.matches; updateToggle(); showPreview(); });
document.addEventListener('visibilitychange', () => document.hidden ? clearPreview() : showPreview());
window.addEventListener('pagehide', clearPreview);
window.addEventListener('resize', () => { go(active); });
updateToggle();
showPreview();
