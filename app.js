// Куда уходят заявки: бот @ravnovesiecbot (код в E:\Clode\bots\ravnovesie-bot), он пересылает их в Telegram
const ENDPOINT = 'https://ravnovesie-bot.capybaria-bot.workers.dev';
const WA = 'https://wa.me/79955097460';
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
const st = { step: 1, service: '', price: 0, date: '', day: '', time: '' };
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
  st.price = services.find(s => s.name === name)?.price || 0;
  $$('.opt').forEach((b, i) => b.setAttribute('aria-pressed', services[i].name === name));
  $('#e1').textContent = '';
}
$$('[data-pick]').forEach(a => a.addEventListener('click', () => select(a.dataset.pick)));

// дни и время: свободные часы берём у бота (занятое там отмечает Татьяна Борисовна и прошлые заявки).
// Если бот не ответил — показываем все часы на 14 дней по московскому времени
const days = $('#days'), times = $('#times');
const wd = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'], mon = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const hint = t => `<p class="hint">${t}</p>`;
function localDays() {
  const now = new Date(Date.now() + 3 * 3600e3), out = [];  // UTC-поля = время в Москве
  const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  for (let i = 0; out.length < 14; i++) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + i)), free = [];
    for (let h = 10; h <= 21; h++) if (i > 0 || h * 60 >= nowMin + 60) free.push(`${h}:00`);
    if (free.length) out.push({ date: d.toISOString().slice(0, 10), free, busy: [] });
  }
  return out;
}
const label = iso => { const d = new Date(iso + 'T00:00:00Z'); return { num: `${d.getUTCDate()} ${mon[d.getUTCMonth()]}`, wd: wd[d.getUTCDay()] }; };
function renderDays(list) {
  st.date = st.day = st.time = '';
  days.innerHTML = ''; times.innerHTML = hint('Сначала выберите день');
  list.forEach(x => {
    const L = label(x.date), b = document.createElement('button');
    b.type = 'button'; b.className = 'chip'; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = `${L.num}<small>${x.free.length ? L.wd : 'занято'}</small>`;
    if (!x.free.length) b.disabled = true;
    b.onclick = () => pickDay(x, b);
    days.append(b);
  });
}
function pickDay(x, b) {
  const L = label(x.date);
  st.date = x.date; st.day = `${L.num} (${L.wd})`; st.time = '';
  $$('.chip', days).forEach(c => c.setAttribute('aria-pressed', c === b));
  $('#e2').textContent = '';
  times.innerHTML = '';
  const busy = new Set(x.busy);
  [...x.free, ...x.busy].sort((a, b) => parseInt(a) - parseInt(b)).forEach(t => {
    const c = document.createElement('button');
    c.type = 'button'; c.className = 'chip'; c.textContent = t; c.setAttribute('aria-pressed', 'false');
    if (busy.has(t)) { c.disabled = true; c.title = 'Занято'; }
    c.onclick = () => { st.time = t; $$('.chip', times).forEach(y => y.setAttribute('aria-pressed', y === c)); $('#e2').textContent = ''; };
    times.append(c);
  });
}
async function loadSlots() {
  days.innerHTML = hint('Загружаем свободное время…'); times.innerHTML = '';
  try {
    const ctl = new AbortController(); setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(ENDPOINT + '/slots', { signal: ctl.signal, cache: 'no-store' });
    const j = await r.json();
    if (!r.ok || !j.days?.length) throw 0;
    renderDays(j.days);
  } catch { renderDays(localDays()); }
}
loadSlots();

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
  const err = $('#eSend'), msg = $('#msg').value.trim();
  const btn = e.submitter || $('#form [type=submit]'); btn.disabled = true; err.textContent = '';
  try {
    const r = await fetch(ENDPOINT + '/zayavka', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ service: st.service, price: st.price, date: st.date, time: st.time, name, phone, msg }) });
    const j = await r.json().catch(() => ({}));
    if (j.error === 'bad') { btn.disabled = false; $('#e3b').textContent = 'Проверьте номер телефона'; return; }
    if (j.error === 'busy' || j.error === 'slot') {
      // время успели занять (или оно уже прошло) — обновляем часы и возвращаем к выбору
      btn.disabled = false;
      await loadSlots(); go(2);
      $('#e2').textContent = 'Это время только что заняли. Выберите, пожалуйста, другое.';
      return;
    }
    if (!r.ok) throw 0;
    go(4);
  } catch {
    // бот недоступен — предлагаем отправить ту же заявку в WhatsApp, чтобы человек не потерялся
    const text = `Здравствуйте! Хочу записаться: ${st.service}, ${st.day}, ${st.time}. ${name}, ${phone}.${msg ? ' ' + msg : ''}`;
    err.innerHTML = `Не удалось отправить. <a href="${WA}?text=${encodeURIComponent(text)}" target="_blank" rel="noopener">Отправьте заявку в WhatsApp</a> или позвоните: +7 (995) 509-74-60`;
    btn.disabled = false;
  }
});
