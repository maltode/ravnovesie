// Куда уходят заявки. Пока пусто: заявка не отправляется, показываем сообщение «позвоните».
const ENDPOINT = '';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// меню
const nav = $('#nav'), menu = $('#menu');
menu.addEventListener('click', () => { const o = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', o); });
$$('#nav a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded', false); }));

// вкладки услуг
function showPanel(id) {
  $$('.tab').forEach(t => t.setAttribute('aria-selected', t.dataset.panel === id));
  $$('.panel').forEach(p => p.hidden = p.id !== 'p-' + id);
}
$$('.tab').forEach(t => t.addEventListener('click', () => showPanel(t.dataset.panel)));
$$('[data-tab]').forEach(a => a.addEventListener('click', () => showPanel(a.dataset.tab)));
$$('[data-pick]').forEach(a => a.addEventListener('click', () => {
  if (a.dataset.pick === 'Соляная пещера') showPanel('cave');
}));

// «первая встреча»: фото меняется вместе с шагом
const beats = $$('.beat'), pics = $$('.story-pic img');
if ('IntersectionObserver' in window && beats.length) {
  const bo = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const i = +e.target.dataset.i;
    beats.forEach((b, k) => b.classList.toggle('on', k === i));
    pics.forEach((p, k) => p.classList.toggle('on', k === i));
  }), { rootMargin: '-40% 0px -40% 0px' });
  beats.forEach(b => bo.observe(b));
}

// мягкий сдвиг фото на первом экране
const hero = $('.hero');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  addEventListener('scroll', () => { if (scrollY < 1200) hero.style.setProperty('--py', scrollY * 0.25); }, { passive: true });
}

// смена фото на фоне первого экрана
const bgs = $$('.hero-bg img');
if (bgs.length > 1 && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  let bi = 0;
  setInterval(() => { bgs[bi].classList.remove('on'); bi = (bi + 1) % bgs.length; bgs[bi].classList.add('on'); }, 3000);
}

// появление при прокрутке
const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .12 }) : null;
$$('.rv').forEach(el => io ? io.observe(el) : el.classList.add('in'));

// липкая кнопка скрывается у формы записи
const cta = $('#cta'), zapis = $('#zapis');
let nearForm = false;
const syncCta = () => cta.classList.toggle('hide', nearForm || scrollY < 500);
if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { nearForm = e.isIntersecting; syncCta(); }).observe(zapis);
addEventListener('scroll', syncCta, { passive: true }); syncCta();

// данные заявки держим в объекте
const st = { step: 1, service: '', day: '', time: '' };
const opts = $('#opts');
const services = $$('details.srv').map(d => ({ name: d.dataset.name, price: +d.dataset.price }));
services.push({ name: 'Соляная пещера', price: 700 });
const fmt = n => n.toLocaleString('ru-RU') + ' ₽';
services.forEach(s => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'opt'; b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `<span>${s.name}</span><small>${fmt(s.price)}</small>`;
  b.onclick = () => select(s.name);
  opts.append(b);
});
function select(name) {
  st.service = name;
  $$('.opt').forEach((b, i) => b.setAttribute('aria-pressed', services[i].name === name));
  $('#e1').textContent = '';
}
$$('[data-pick]').forEach(a => a.addEventListener('click', () => select(a.dataset.pick)));

// дни: ближайшие 14, часы 10–21 (приём 10:00–22:00)
const days = $('#days'), times = $('#times');
const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'], mon = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
for (let i = 0; i < 14; i++) {
  const d = new Date(); d.setDate(d.getDate() + i);
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', 'false');
  b.innerHTML = `${d.getDate()} ${mon[d.getMonth()]}<small>${wd[d.getDay()]}</small>`;
  b.onclick = () => { st.day = `${d.getDate()} ${mon[d.getMonth()]} (${wd[d.getDay()]})`; $$('.chip', days).forEach(x => x.setAttribute('aria-pressed', x === b)); $('#e2').textContent = ''; };
  days.append(b);
}
for (let h = 10; h <= 21; h++) {
  const t = `${h}:00`, b = document.createElement('button');
  b.type = 'button'; b.className = 'chip'; b.textContent = t; b.setAttribute('aria-pressed', 'false');
  b.onclick = () => { st.time = t; $$('.chip', times).forEach(x => x.setAttribute('aria-pressed', x === b)); $('#e2').textContent = ''; };
  times.append(b);
}

function go(n) {
  st.step = n;
  $$('.step').forEach(s => s.classList.toggle('on', +s.dataset.s === n));
  $$('.prog span').forEach((s, i) => s.classList.toggle('on', i < Math.min(n, 3)));
  if (n === 4) $('.prog').style.display = 'none';
}
function valid(n) {
  if (n === 1 && !st.service) { $('#e1').textContent = 'Выберите услугу'; return false; }
  if (n === 2 && (!st.day || !st.time)) { $('#e2').textContent = 'Выберите день и время'; return false; }
  return true;
}
$$('[data-next]').forEach(b => b.onclick = () => valid(st.step) && go(st.step + 1));
$$('[data-prev]').forEach(b => b.onclick = () => go(st.step - 1));

$('#form').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('#name').value.trim(), phone = $('#phone').value.trim();
  const digits = phone.replace(/\D/g, '');
  $('#e3a').textContent = name ? '' : 'Укажите имя';
  $('#e3b').textContent = digits.length >= 10 ? '' : 'Проверьте номер телефона';
  $('#e3c').textContent = $('#agree').checked ? '' : 'Нужно согласие';
  if (!name || digits.length < 10 || !$('#agree').checked) return;
  if ($('[name=site]').value) return;
  const err = $('#eSend');
  if (!ENDPOINT) { err.textContent = 'Приём заявок пока не подключён. Позвоните: +7 (995) 509-74-60'; return; }
  const btn = e.submitter; btn.disabled = true; err.textContent = '';
  try {
    const r = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service: st.service, day: st.day, time: st.time, name, phone, msg: $('#msg').value.trim() }) });
    if (!r.ok) throw 0;
    go(4);
  } catch { err.textContent = 'Не удалось отправить. Позвоните: +7 (995) 509-74-60'; btn.disabled = false; }
});
