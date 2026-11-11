/* ============ «Здоровый Дончанин» — демо-прототип. Без сервера: состояние хранится в localStorage ============ */
const $app = document.getElementById('app'), $modal = document.getElementById('modal'), $toast = document.getElementById('toast');
const KEY = 'medcard_demo_v1';
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];

/* ---------- состояние ---------- */
function initState() {
  return { v: 1, logged: false, pid: 'me', appts: seedAppts(), revealed: [], seen: [], read: [],
    syncedAt: TODAY.getTime() + (8 * 60 + 12) * 60000, settings: { push: true, sms: true, email: false, days: 30, kids: true } };
}
let S = (() => { try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.v === 1) return s; } catch (e) { } return initState(); })();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
let menuOpen = false, labFilter = 'all', openDis = {}, nFilter = 'all', bk = newBk();
function newBk() { return { step: 1, spec: null, docId: null, date: null, time: null, reason: '', vacId: null, stageId: null, resched: null, done: null }; }

/* ---------- утилиты ---------- */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const pl = (n, f) => { n = Math.abs(n) % 100; const k = n % 10; if (n > 10 && n < 20) return f[2]; if (k > 1 && k < 5) return f[1]; if (k === 1) return f[0]; return f[2]; };
const fmt = s => { const d = typeof s === 'string' ? parse(s) : s; return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const fmtS = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const dayDiff = s => Math.round((parse(s) - TODAY) / MS_DAY);
function rel(s) {
  const n = dayDiff(s);
  if (n === 0) return 'сегодня'; if (n === 1) return 'завтра'; if (n === -1) return 'вчера';
  if (n > 1) return n <= 60 ? `через ${n} ${pl(n, ['день', 'дня', 'дней'])}` : `через ${Math.round(n / 30)} мес.`;
  return -n <= 60 ? `${-n} ${pl(-n, ['день', 'дня', 'дней'])} назад` : `${Math.round(-n / 30)} мес. назад`;
}
const ageM = b => { const bd = parse(b); let m = (TODAY.getFullYear() - bd.getFullYear()) * 12 + TODAY.getMonth() - bd.getMonth(); if (TODAY.getDate() < bd.getDate()) m--; return m; };
function ageText(b) {
  const m = ageM(b), y = Math.floor(m / 12), r = m % 12, Y = `${y} ${pl(y, ['год', 'года', 'лет'])}`;
  if (y === 0) return `${m} мес.`; if (y >= 7) return Y; return r ? `${Y} ${r} мес.` : Y;
}
const isKid = p => ageM(p.birth) < 216;
const P = () => PROFILES.find(p => p.id === S.pid);
const prof = id => PROFILES.find(p => p.id === id);
const doc = id => DOCTORS.find(d => d.id === id);
const clock = t => { const h = new Date(); return `${pad(h.getHours())}:${pad(h.getMinutes())}`; };
const addMin = (t, m) => { let [h, mm] = t.split(':').map(Number); mm += m; h += Math.floor(mm / 60); mm %= 60; return `${pad(h)}:${pad(mm)}`; };
const num = n => String(n).replace('.', ',');
function whenTxt(ts) { const d = new Date(ts), day = new Date(d); day.setHours(0, 0, 0, 0); const n = Math.round((day - TODAY) / MS_DAY); return `${n === 0 ? 'сегодня' : n === -1 ? 'вчера' : fmt(iso(day))} в ${pad(d.getHours())}:${pad(d.getMinutes())}`; }

const IC = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10', card: 'M4 4h16v16H4zM8 9h8M8 13h8M8 17h5',
  flask: 'M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3', shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM8.5 12l2.5 2.5L16 9.5',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4', bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0',
  syringe: 'M18 2l4 4M17 7l3-3M19 9L8.7 19.3c-1 1-2.5 1-3.4 0l-.6-.6c-1-1-1-2.5 0-3.4L15 5M9 11l4 4M5 19l-3 3M14 4l6 6', user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M17 4.5a3.5 3.5 0 0 1 0 7M19 14a7 7 0 0 1 3 6',
  download: 'M12 3v12M7 11l5 5 5-5M4 20h16', print: 'M7 8V3h10v5M6 17H4v-7h16v7h-2M7 14h10v7H7z', check: 'M5 12l5 5 9-10',
  alert: 'M12 3l10 18H2zM12 10v5M12 18v.5', clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  pin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18',
  chev: 'M9 6l6 6-6 6', sync: 'M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5', doc: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5v.5', heart: 'M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z',
  logout: 'M10 4H4v16h6M15 8l4 4-4 4M19 12H9', share: 'M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 4M15.4 6.5l-6.8 4',
  baby: 'M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM5 21c0-4 3-7 7-7s7 3 7 7', route: 'M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM8 17h6a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h6'
};
const ic = (n, c = '') => `<svg class="i ${c}" viewBox="0 0 24 24"><path d="${IC[n] || IC.info}"/></svg>`;
const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16 27S5 20.5 5 12.8C5 9.6 7.5 7 10.6 7c2.2 0 4.2 1.2 5.4 3.1C17.2 8.2 19.2 7 21.4 7 24.5 7 27 9.6 27 12.8 27 20.5 16 27 16 27z"/><path fill="#0d4cd3" d="M14 10.5h4v2.5h2.5v4H18v2.5h-4V17h-2.5v-4H14z"/></svg>`;
const av = (p, lg) => `<span class="av ${lg ? 'lg' : ''}" style="background:${p.color}">${p.short[0]}</span>`;

function toast(msg, sub = '', cls = '') {
  const el = document.createElement('div'); el.className = 'toast ' + cls; el.innerHTML = `<b>${msg}</b>${sub ? `<small>${sub}</small>` : ''}`;
  $toast.appendChild(el); setTimeout(() => el.remove(), cls === 'sms' ? 6000 : 3500);
}
const go = h => { location.hash = h; };

/* ---------- данные ---------- */
const labsOf = p => {
  const out = [...p.labs];
  p.pending && p.pending.forEach(l => { if (S.revealed.includes(l.id)) out.push({ ...l, date: iso(TODAY), status: 'ready' }); });
  return out.sort((a, b) => b.date.localeCompare(a.date));
};
const pendingOf = p => (p.pending || []).filter(l => !S.revealed.includes(l.id));
const allLabs = () => PROFILES.flatMap(p => labsOf(p).map(l => ({ ...l, pid: p.id })));
const flag = it => { const [, v, , min, max] = it; if (min != null && v < min) return 'low'; if (max != null && v > max) return 'high'; return 'ok'; };
const refTxt = it => { const [, , , min, max] = it; return min != null && max != null ? `${num(min)} – ${num(max)}` : max != null ? `до ${num(max)}` : `от ${num(min)}`; };
function rangeBar(it) {
  const [, v, , min, max] = it, span = min != null && max != null ? max - min : (max ?? min);
  const A = min != null ? min - span * .6 : 0, B = max != null ? max + span * .6 : min + span * 1.6;
  const l = min != null ? (min - A) / (B - A) * 100 : 0, r = max != null ? (max - A) / (B - A) * 100 : 100;
  const pos = Math.max(3, Math.min(97, (v - A) / (B - A) * 100));
  return `<div class="rng"><i class="okz" style="left:${l}%;width:${r - l}%"></i><i class="pt ${flag(it)}" style="left:${pos}%"></i></div>`;
}
const deviations = l => l.items ? l.items.filter(i => flag(i) !== 'ok').length : 0;

const vacBooked = (p, v) => S.appts.find(a => a.status === 'active' && a.pid === p.id && a.vacId === v.id && dayDiff(a.date) >= 0);
const stageBooked = (p, s) => S.appts.find(a => a.status === 'active' && a.pid === p.id && a.stageId === s.id && dayDiff(a.date) >= 0);
const upcoming = pid => S.appts.filter(a => a.status === 'active' && dayDiff(a.date) >= 0 && (!pid || a.pid === pid)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

/* ---------- запись: врачи и слоты ---------- */
const TIMES = []; for (let h = 8; h < 16; h++) TIMES.push(pad(h) + ':00', pad(h) + ':30');
const specsFor = p => Object.entries(SPECS).filter(([, s]) => s.aud === 'b' || (isKid(p) ? s.aud === 'c' : s.aud === 'a')).map(([id, s]) => ({ id, ...s }));
const docsFor = (spec, p) => DOCTORS.filter(d => d.spec === spec && (d.aud === 'b' || d.aud === (isKid(p) ? 'c' : 'a')));
const isBusy = (d, date, t) => hsh(d.id + date + t) % 100 < 42 || S.appts.some(a => a.status === 'active' && a.docId === d.id && a.date === date && a.time === t);
function slots(d, date) {
  const wd = parse(date).getDay(); if (wd === 0) return [];
  return (wd === 6 ? TIMES.filter(t => t < '12:30') : TIMES).filter(t => !isBusy(d, date, t));
}
function nextDates(n = 14) { const o = []; let i = 1; while (o.length < n) { const d = addDays(TODAY, i++); if (d.getDay() !== 0) o.push(iso(d)); } return o; }
function nearest(d) { for (const dt of nextDates(30)) { const s = slots(d, dt); if (s.length) return { date: dt, time: s[0] }; } return null; }
function createAppt(o) {
  const a = { id: 'ap' + Date.now() + Math.floor(Math.random() * 999), status: 'active', created: Date.now(), ...o };
  S.appts.push(a); save(); return a;
}
const apptNo = a => 'Т-' + (hsh(a.id) % 900 + 100);
function autoBook(p) {
  const todo = p.checkup.stages.filter(s => !s.done && !stageBooked(p, s)); if (!todo.length) return 0;
  const pref = (a, b) => (a.clinic === p.clinic ? 0 : 1) - (b.clinic === p.clinic ? 0 : 1);
  for (const date of nextDates(21)) {
    let cursor = '08:00'; const plan = [];
    for (const s of todo) {
      let pick = null;
      for (const d of docsFor(s.spec, p).sort(pref)) { const t = slots(d, date).find(t => t >= cursor); if (t) { pick = { s, d, t }; break; } }
      if (!pick) { plan.length = 0; break; }
      plan.push(pick); cursor = addMin(pick.t, 30);
    }
    if (plan.length === todo.length) { plan.forEach(x => createAppt({ pid: p.id, docId: x.d.id, date, time: x.t, reason: x.s.name, stageId: x.s.id })); return { n: plan.length, date }; }
  }
  todo.forEach(s => { const d = docsFor(s.spec, p).sort(pref)[0], n = nearest(d); if (n) createAppt({ pid: p.id, docId: d.id, date: n.date, time: n.time, reason: s.name, stageId: s.id }); });
  return { n: todo.length, date: null };
}

/* ---------- уведомления ---------- */
function notifs() {
  const out = [], days = S.settings.days;
  PROFILES.forEach(p => {
    if (p.id !== 'me' && !S.settings.kids) return;
    p.vaccines.forEach(v => {
      if (v.status === 'done' || v.status === 'future' || vacBooked(p, v)) return;
      const n = dayDiff(v.due), over = n < 0;
      if (!over && n > days) return;
      out.push({ id: `v:${p.id}:${v.id}`, pid: p.id, type: 'vaccine', level: over ? 'urgent' : 'soon', sort: n,
        title: over ? `Просрочена прививка: ${v.name}` : v.season ? 'Пора сделать сезонную прививку от гриппа' : `Скоро прививка: ${v.name}`,
        text: over ? `${v.dose}. Рекомендованный срок был ${fmt(v.due)} (${rel(v.due)}). Запишитесь в прививочный кабинет — это займёт минуту.`
          : `${v.dose}. Рекомендуемая дата — ${fmt(v.due)} (${rel(v.due)}).`,
        act: { label: 'Записаться на прививку', href: `#/book?spec=vac&pid=${p.id}&vac=${encodeURIComponent(v.id)}&reason=${encodeURIComponent('Вакцинация: ' + v.name)}` } });
    });
    const todo = p.checkup.stages.filter(s => !s.done), free = todo.filter(s => !stageBooked(p, s));
    if (free.length) out.push({ id: `c:${p.id}:${free.length}`, pid: p.id, type: 'checkup', level: 'soon', sort: 40,
      title: isKid(p) ? 'Профилактический осмотр ребёнка' : 'Ежегодная диспансеризация',
      text: `Осталось пройти этапов: ${todo.length} из ${p.checkup.stages.length}, не записано: ${free.length}. Срок — ${p.checkup.deadline}.`,
      act: { label: 'Открыть и записаться', href: '#/checkup?pid=' + p.id } });
    if (isKid(p) && !S.appts.some(a => a.status === 'active' && a.pid === p.id && dayDiff(a.date) >= 0 && doc(a.docId).spec === 'ped'))
      out.push({ id: `s:${p.id}`, pid: p.id, type: 'season', level: 'info', sort: 50, title: 'Сезонный осмотр педиатра',
        text: `Перед сезоном простуд (ноябрь–март) рекомендуем осмотр педиатра: оценка иммунитета, справки в сад или школу.`,
        act: { label: 'Записаться к педиатру', href: `#/book?spec=ped&pid=${p.id}&reason=${encodeURIComponent('Сезонный осмотр')}` } });
  });
  upcoming().forEach(a => {
    const n = dayDiff(a.date), p = prof(a.pid); if (n > 7 || (p.id !== 'me' && !S.settings.kids)) return;
    out.push({ id: `a:${a.id}`, pid: a.pid, type: 'appt', level: n <= 2 ? 'soon' : 'info', sort: n,
      title: `Приём: ${SPECS[doc(a.docId).spec].name} — ${rel(a.date)} в ${a.time}`, text: `${doc(a.docId).name}, каб. ${doc(a.docId).room}. ${CLINICS[doc(a.docId).clinic].name}. Талон ${apptNo(a)}.`,
      act: { label: 'Открыть талон', href: '#/book/my' } });
  });
  PROFILES.forEach(p => {
    if (p.id !== 'me' && !S.settings.kids) return;
    labsOf(p).filter(l => S.revealed.includes(l.id) && !S.seen.includes(l.id)).forEach(l =>
      out.push({ id: `r:${l.id}`, pid: p.id, type: 'result', level: 'ok', sort: -100, title: 'Готов результат: ' + l.title, text: 'Результат загружен из ЕГИСЗ. Ехать в поликлинику за бумагой не нужно.',
        act: { label: 'Посмотреть результат', href: '#/labs/' + l.id } }));
  });
  const w = { ok: 0, urgent: 1, soon: 2, info: 3 };
  return out.sort((a, b) => w[a.level] - w[b.level] || a.sort - b.sort);
}
const unread = () => notifs().filter(n => !S.read.includes(n.id)).length;
const NT = { vaccine: ['syringe', 'Прививки'], checkup: ['shield', 'Осмотры'], season: ['baby', 'Сезонные'], appt: ['calendar', 'Записи'], result: ['flask', 'Результаты'] };
const LV = { urgent: ['bad', 'Просрочено'], soon: ['warn', 'Скоро'], info: ['', 'Информация'], ok: ['ok', 'Новое'] };

/* ---------- каркас ---------- */
const NAV = [['home', 'Главная', 'Главная', 'home'], ['card', 'Медкарта', 'Карточка', 'card'], ['labs', 'Анализы', 'Анализы', 'flask'], ['checkup', 'Диспансеризация', 'Осмотры', 'shield'], ['book', 'Запись к врачу', 'Запись', 'calendar']];
function route() {
  const h = location.hash.replace(/^#\/?/, ''), [path, q] = h.split('?'), [name, ...rest] = path.split('/');
  return { name: name || 'home', sub: rest.join('/'), q: Object.fromEntries(new URLSearchParams(q || '')) };
}
function shell(body, cur) {
  const p = P(), n = unread();
  return `<header class="hdr no-print"><div class="wrap hdr-in">
    <a class="brand" href="#/home"><span class="logo">${LOGO}</span><span><b>Здоровый Дончанин</b><small>Донбасс, данные ЕГИСЗ</small></span></a>
    <nav class="nav">${NAV.map(([r, l]) => `<a href="#/${r}" class="${cur === r ? 'on' : ''}">${l}</a>`).join('')}</nav>
    <div class="hdr-r">
      <a class="ib" href="#/notifications" title="Уведомления">${ic('bell')}${n ? `<span class="dot">${n}</span>` : ''}</a>
      <button class="who" data-act="menu">${av(p)}<span class="n">${p.short}</span>${ic('chev').replace('class="i "', 'class="i" style="transform:rotate(90deg);width:14px"')}</button>
      ${menuOpen ? profileMenu() : ''}
    </div></div></header>
  <main class="wrap">${body}</main>
  <div class="foot no-print">Демонстрационный прототип: все персонажи, данные и «подключение к ЕГИСЗ» вымышлены.<br><a href="#/about">О проекте</a>, <a data-act="reset">Сбросить демо</a></div>
  <nav class="tabbar no-print">${NAV.map(([r, , s, i]) => `<a href="#/${r}" class="${cur === r ? 'on' : ''}">${ic(i)}${s}</a>`).join('')}</nav>`;
}
function profileMenu() {
  return `<div class="menu"><h4>Семья</h4>${PROFILES.map(p => `<button data-act="prof" data-id="${p.id}" class="${p.id === S.pid ? 'on' : ''}">${av(p)}<span><b>${p.short}</b><small style="display:block">${p.rel}, ${ageText(p.birth)}</small></span></button>`).join('')}
  <hr><button data-act="logout">${ic('logout')} Выйти</button></div>`;
}
function loginPage() {
  return `<div class="login"><div class="box"><div class="logo">${LOGO}</div>
  <h1>Здоровый Дончанин</h1><p class="muted" style="margin-top:8px">Вся ваша медицина и медицина ваших детей — в одном месте</p>
  <ul>
    <li><span class="ico">${ic('doc')}</span><span><b>Карточка и результаты онлайн</b><br><small>Анализы приходят в телефон — за бумагой ехать не нужно</small></span></li>
    <li><span class="ico">${ic('calendar')}</span><span><b>Запись без очередей</b><br><small>Выберите врача и время, придёте строго по талону</small></span></li>
    <li><span class="ico">${ic('bell')}</span><span><b>Напоминания о прививках и осмотрах</b><br><small>Для вас и ваших детей — вовремя и без бумажных календарей</small></span></li>
  </ul>
  <button class="btn block" data-act="login">Войти через ЕСИА (демо)</button>
  <p class="muted" style="margin-top:16px;font-size:13px">Демонстрационный прототип. Вход выполняется без пароля, все данные вымышлены.</p></div></div>`;
}

/* ---------- страницы ---------- */
function attnRow(n) {
  const p = prof(n.pid), [lc] = LV[n.level], unr = !S.read.includes(n.id);
  return `<div class="nt ${n.level} ${unr ? 'unread' : ''}"><span class="ico ${lc}">${ic(NT[n.type][0])}</span>
    <div class="body"><div class="meta"><span class="badge ${lc}">${LV[n.level][1]}</span><span class="badge gray">${p.id === 'me' ? 'Вы' : p.short}</span><small>${NT[n.type][1]}</small></div>
    <b>${esc(n.title)}</b><p>${esc(n.text)}</p><a class="btn sm" href="${n.act.href}" data-act="read" data-id="${n.id}">${n.act.label}</a></div></div>`;
}
function ticket(a, actions = true) {
  const d = doc(a.docId), c = CLINICS[d.clinic], p = prof(a.pid);
  return `<div class="ticket"><div class="info"><small class="no">Электронный талон ${apptNo(a)}, ${p.id === 'me' ? 'Вы' : p.short}</small>
    <div class="time">${fmtS(a.date)}, ${WD[parse(a.date).getDay()]}, ${a.time}</div><b>${SPECS[d.spec].name}</b>
    <span>${d.name}</span><small>${ic('pin').replace('class="i "', 'class="i" style="width:14px;height:14px;vertical-align:-2px"')} ${c.name}, каб. ${d.room}<br>${c.addr}</small>
    ${a.reason ? `<small>Цель: ${esc(a.reason)}</small>` : ''}
    ${actions ? `<div class="ticket-actions"><button class="btn sm sec" data-act="resched" data-id="${a.id}">Перенести</button><button class="btn sm ghost" data-act="ics" data-id="${a.id}">В календарь</button><button class="btn sm danger" data-act="cancel" data-id="${a.id}">Отменить</button></div>` : ''}</div>
    <svg class="qr" viewBox="0 0 21 21" shape-rendering="crispEdges">${qr(a.id)}</svg></div>`;
}
function qr(seed) {
  let h = hsh(seed) || 1, r = ''; const rnd = () => { h ^= h << 13; h >>>= 0; h ^= h >>> 17; h ^= h << 5; h >>>= 0; return h; };
  for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
    let dark, fx = x < 7 ? x : x > 13 ? x - 14 : -1, fy = y < 7 ? y : y > 13 ? y - 14 : -1;
    if (fx >= 0 && fy >= 0 && !(x > 13 && y > 13)) dark = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
    else dark = rnd() % 2 === 0;
    if (dark) r += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  return r;
}

function pageHome() {
  const p = P(), hr = new Date().getHours(), hi = hr < 6 ? 'Доброй ночи' : hr < 12 ? 'Доброе утро' : hr < 18 ? 'Добрый день' : 'Добрый вечер';
  const ns = notifs().filter(n => n.level !== 'ok' || true).slice(0, 4), nxt = upcoming(p.id)[0], labs = labsOf(p).slice(0, 3);
  const online = allLabs().length;
  return `<div class="hero"><div><h1>${hi}, ${PROFILES[0].short}</h1><p style="margin-top:8px">Сегодня ${fmt(TODAY)}. ${unread() ? `У вас <b>${unread()}</b> ${pl(unread(), ['напоминание', 'напоминания', 'напоминаний'])} по здоровью семьи.` : 'Всё в порядке — срочных дел нет.'}</p></div>
    <div class="sync">${ic('sync')}<div><b>Данные из ЕГИСЗ</b>Обновлено: ${whenTxt(S.syncedAt)}</div><button class="btn sm white" data-act="sync">Обновить</button></div></div>
  <div class="sp"></div>
  <h2 style="margin-bottom:12px">Семья</h2>
  <div class="fam">${PROFILES.map(x => { const c = notifs().filter(n => n.pid === x.id && n.level !== 'info').length;
    return `<button data-act="prof" data-id="${x.id}" class="${x.id === S.pid ? 'on' : ''}">${av(x, 1)}<span><b>${x.name.split(' ').slice(0, 2).join(' ')}</b><small>${x.rel}, ${ageText(x.birth)}</small><br>${c ? `<span class="badge warn">${ic('bell')} ${c}</span>` : `<span class="badge ok">${ic('check')} Всё в порядке</span>`}</span></button>`; }).join('')}</div>
  <div class="sp"></div>
  <div class="qa">
    <a href="#/book"><span class="ic">${ic('calendar')}</span>Записаться к врачу<small>Без очередей, по талону</small></a>
    <a href="#/labs"><span class="ic">${ic('flask')}</span>Анализы<small>Результаты онлайн</small></a>
    <a href="#/card/vac"><span class="ic">${ic('syringe')}</span>Прививки<small>Календарь ${p.short === 'Ирина' ? 'взрослого' : 'ребёнка'}</small></a>
    <a href="#/checkup"><span class="ic">${ic('shield')}</span>${isKid(p) ? 'Осмотр ребёнка' : 'Диспансеризация'}<small>${p.checkup.stages.filter(s => s.done).length} из ${p.checkup.stages.length} этапов</small></a>
  </div><div class="sp"></div>
  <div class="grid side"><div>
    <div class="card-h"><h2>Требует внимания</h2><a href="#/notifications">Все уведомления</a></div>
    ${ns.length ? ns.map(attnRow).join('') : '<div class="card empty">Нет напоминаний</div>'}
  </div><div class="grid">
    <div class="card"><div class="card-h"><h2>Ближайший приём</h2></div>${nxt ? ticket(nxt, false) : `<div class="empty">Нет записей для ${p.short}<br><br><a class="btn sm" href="#/book">Записаться</a></div>`}</div>
    <div class="card"><div class="card-h"><h2>Последние результаты</h2><a href="#/labs">Все</a></div>
      ${labs.map(l => `<a class="row click" href="#/labs/${l.id}"><span class="ico ${deviations(l) ? 'warn' : 'ok'}">${ic(l.type === 'lab' ? 'flask' : 'doc')}</span><span class="body"><b>${l.title}</b><small>${fmt(l.date)}</small></span>${deviations(l) ? `<span class="badge warn">${deviations(l)} откл.</span>` : '<span class="badge ok">Норма</span>'}</a>`).join('')}</div>
    <div class="card"><div class="stat"><b>${online}</b><span>результатов получено онлайн — без поездок в поликлинику за бумажными бланками</span></div></div>
  </div></div>`;
}

function personHead(p, extra = '') {
  return `<div class="card"><div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${av(p, 1)}<div style="flex:1;min-width:200px"><h2 style="margin:0">${p.name}</h2><p class="muted">${p.sex === 'ж' ? 'Женский' : 'Мужской'}, ${fmt(p.birth)}, ${ageText(p.birth)}</p></div>
  <span class="badge">${ic('sync')} ЕГИСЗ, ${whenTxt(S.syncedAt)}</span>${extra}</div></div>`;
}
function pageCard(sub) {
  const p = P(), tab = sub || 'anam';
  const tabs = `<div class="tabs"><a href="#/card/anam" class="${tab === 'anam' ? 'on' : ''}">Анамнез</a><a href="#/card/vac" class="${tab === 'vac' ? 'on' : ''}">Прививки</a><a href="#/card/dis" class="${tab === 'dis' ? 'on' : ''}">Выписки</a></div>`;
  let body = '';
  if (tab === 'anam') body = `<div class="grid side"><div class="grid">
      <div class="card"><h2>Анамнез жизни</h2><dl class="kv">${p.life.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div>
      <div class="card"><h2>История заболеваний</h2><div class="tl">${p.history.map(h => `<div><b>${h.title}</b> <span class="badge gray">${h.code}</span><br><small>${fmt(h.date)}</small><p>${h.note}</p></div>`).join('')}</div></div></div>
    <div class="grid"><div class="card"><h2>Основные данные</h2><div class="facts">
      <div class="fact"><small>Группа крови</small><b>${p.blood}</b></div><div class="fact"><small>Резус</small><b>${p.rh}</b></div>
      <div class="fact"><small>Рост</small><b>${p.height} см</b></div><div class="fact"><small>Вес</small><b>${num(p.weight)} кг</b></div></div>
      <div class="sp"></div><div class="note"><b>Аллергии:</b> ${p.allergies}</div><div class="sp"></div>
      <div class="note info"><b>Хронические заболевания:</b> ${p.chronic}</div></div>
      <div class="card"><h2>Документы</h2><dl class="kv"><div><dt>Полис ОМС</dt><dd>${p.polis}</dd></div><div><dt>СНИЛС</dt><dd>${p.snils}</dd></div><div><dt>Прикрепление</dt><dd>${p.attach}</dd></div></dl></div></div></div>`;
  if (tab === 'vac') {
    const need = p.vaccines.filter(v => v.status === 'overdue' || v.status === 'planned'), done = p.vaccines.filter(v => v.status === 'done').reverse(), fut = p.vaccines.filter(v => v.status === 'future');
    const vrow = v => { const b = vacBooked(p, v), o = v.status === 'overdue';
      return `<div class="row"><span class="ico ${b ? '' : o ? 'bad' : 'warn'}">${ic('syringe')}</span><div class="body"><b>${v.name}</b><small>${v.dose}, ${o ? `срок был ${fmt(v.due)}` : `рекомендуется ${fmt(v.due)}`} (${rel(v.due)})</small></div>
      <div class="end">${b ? `<span class="badge ok">${ic('check')} Записан: ${fmtS(b.date)}, ${b.time}</span>` : `${o ? '<span class="badge bad">Просрочено</span>' : '<span class="badge warn">Скоро</span>'}<a class="btn sm" href="#/book?spec=vac&vac=${encodeURIComponent(v.id)}&reason=${encodeURIComponent('Вакцинация: ' + v.name)}">Записаться</a>`}</div></div>`; };
    body = `<div class="grid side"><div class="grid">
      <div class="card"><h2>Требуют внимания</h2>${need.length ? need.map(vrow).join('') : '<div class="empty">Все прививки по календарю сделаны</div>'}</div>
      <div class="card"><h2>Сделанные прививки</h2>${done.map(v => `<div class="row"><span class="ico ok">${ic('check')}</span><div class="body"><b>${v.name}</b><small>${v.dose}${v.series ? ', ' + v.series : ''}</small></div><div class="end"><small>${fmtShort(v.date)}</small></div></div>`).join('')}</div></div>
    <div class="grid"><div class="card"><h2>Статистика</h2><div class="facts"><div class="fact"><small>Сделано</small><b>${done.length}</b></div><div class="fact"><small>Впереди</small><b>${need.length + fut.length}</b></div></div>
      <div class="sp"></div><div class="note info">${isKid(p) ? 'Календарь составлен по национальному календарю профилактических прививок. Напоминания придут вам как родителю.' : 'Для взрослых: грипп — ежегодно, АДС-М — каждые 10 лет.'}</div></div>
      ${fut.length ? `<div class="card"><h2>Далее по календарю</h2>${fut.map(v => `<div class="row"><span class="ico gray">${ic('clock')}</span><div class="body"><b>${v.name}</b><small>${v.dose}</small></div><small>${fmt(v.due)}</small></div>`).join('')}</div>` : ''}</div></div>`;
  }
  if (tab === 'dis') body = `<div class="grid">${p.discharges.map(d => `<div class="card"><div class="row click" data-act="tog" data-id="${d.id}" style="border:0;padding:0"><span class="ico">${ic('doc')}</span><div class="body"><b>${d.title}</b><small>${fmt(d.date)}, ${d.org}</small></div><span class="badge gray">${d.code}</span></div>
    ${openDis[d.id] ? `<div class="sp"></div><dl class="kv"><div><dt>Врач</dt><dd>${d.doctor}</dd></div><div><dt>Диагноз</dt><dd>${d.diagnosis} (${d.code})</dd></div><div><dt>Заключение</dt><dd>${d.text}</dd></div><div><dt>Рекомендации</dt><dd><ul style="padding-left:20px">${d.recs.map(r => `<li>${r}</li>`).join('')}</ul></dd></div></dl>
    <div class="sp"></div><div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm sec" data-act="print">${ic('print')} Печать / PDF</button><button class="btn sm ghost" data-act="share">${ic('share')} Показать врачу</button></div>` : ''}</div>`).join('')}</div>`;
  return `<div class="page-h"><div><h1>Медицинская карта</h1><p>Данные подгружены из ЕГИСЗ, обновляются автоматически</p></div></div>${personHead(p)}<div class="sp"></div>${tabs}${body}`;
}
const fmtShort = s => fmt(s);

function pageLabs(sub) {
  if (sub) return pageLabDetail(sub);
  const p = P(), pend = pendingOf(p); let list = labsOf(p);
  if (labFilter !== 'all') list = list.filter(l => l.type === labFilter);
  return `<div class="page-h"><div><h1>Анализы и исследования</h1><p>Результаты приходят сюда автоматически — ехать за бланками не нужно</p></div><button class="btn sec" data-act="sync">${ic('sync')} Обновить из ЕГИСЗ</button></div>
  ${personHead(p)}<div class="sp"></div>
  ${pend.length ? `<div class="card" style="border:1px dashed var(--line-d)"><h2>Результат готовится</h2>${pend.map(l => `<div class="row"><span class="ico">${ic('flask')}</span><div class="body"><b>${l.title}</b><small>Сдан сегодня, ${l.org}</small><div class="bar" style="margin-top:8px"><i style="width:70%"></i></div></div><span class="badge">В работе</span></div>`).join('')}
    <small>Как только лаборатория выпустит результат, он появится здесь, и вы получите уведомление.</small></div><div class="sp"></div>` : ''}
  <div class="chips" style="margin-bottom:16px">${[['all', 'Все'], ['lab', 'Анализы'], ['inst', 'Исследования']].map(([k, l]) => `<button class="chip ${labFilter === k ? 'on' : ''}" data-act="labf" data-val="${k}">${l}</button>`).join('')}</div>
  <div class="card">${list.length ? list.map(l => { const dv = deviations(l); return `<a class="row click" href="#/labs/${l.id}"><span class="ico ${dv ? 'warn' : 'ok'}">${ic(l.type === 'lab' ? 'flask' : 'doc')}</span><div class="body"><b>${l.title}</b><small>${fmt(l.date)}, ${l.org}</small></div><div class="end">${l.type === 'lab' ? (dv ? `<span class="badge warn">${ic('alert')} ${dv} ${pl(dv, ['отклонение', 'отклонения', 'отклонений'])}</span>` : '<span class="badge ok">В норме</span>') : '<span class="badge">Заключение</span>'}</div></a>`; }).join('') : '<div class="empty">Ничего не найдено</div>'}</div>`;
}
function pageLabDetail(id) {
  const l = allLabs().find(x => x.id === id); if (!l) return `<div class="card empty">Результат не найден. <a href="#/labs">К списку</a></div>`;
  const p = prof(l.pid); if (p.id !== S.pid) { S.pid = p.id; save(); }
  if (!S.seen.includes(id)) { S.seen.push(id); save(); }
  const dv = deviations(l);
  const head = `<a href="#/labs" class="no-print">← Все результаты</a><div class="sp"></div><div class="card"><div class="card-h"><div><h1 style="font-size:24px">${l.title}</h1><p class="muted">${p.name}, ${fmt(l.date)}</p></div>${l.type === 'lab' ? (dv ? `<span class="badge warn">${ic('alert')} Отклонений: ${dv}</span>` : '<span class="badge ok">Все показатели в норме</span>') : '<span class="badge">Заключение врача</span>'}</div>
    <dl class="kv"><div><dt>Организация</dt><dd>${l.org}</dd></div><div><dt>Назначил(а)</dt><dd>${l.doctor}</dd></div><div><dt>Источник</dt><dd>ЕГИСЗ, подпись медорганизации проверена</dd></div></dl></div><div class="sp"></div>`;
  const actions = `<div class="sp"></div><div class="no-print" style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sec" data-act="print">${ic('print')} Скачать PDF / печать</button><button class="btn ghost" data-act="share">${ic('share')} Показать врачу</button>
    <a class="btn ghost" href="#/book?spec=${isKid(p) ? 'ped' : 'ther'}&pid=${p.id}&reason=${encodeURIComponent('Консультация по результатам: ' + l.title)}">${ic('calendar')} Записаться по результатам</a></div>`;
  if (l.type === 'inst') return head + `<div class="card"><h2>Описание</h2><dl class="kv">${l.fields.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="sp"></div><div class="note info"><b>Заключение:</b> ${l.conclusion}</div></div>` + actions;
  return head + `<div class="card" style="padding:8px 16px"><table class="tbl"><tr><th>Показатель</th><th>Результат</th><th>Норма</th><th class="mhide" style="width:30%">Шкала</th></tr>
    ${l.items.map(it => { const f = flag(it); return `<tr><td>${it[0]}</td><td><span class="val ${f}">${num(it[1])}</span> <small>${it[2]}</small>${f !== 'ok' ? `<br><span class="badge ${f === 'high' ? 'bad' : 'warn'}">${f === 'high' ? '↑ выше нормы' : '↓ ниже нормы'}</span>` : ''}</td><td class="refc">${refTxt(it)}</td><td class="mhide">${rangeBar(it)}</td></tr>`; }).join('')}</table></div>
    <div class="sp"></div><div class="note">Отметки расставлены автоматически по референсным значениям. Расшифровку и назначения даёт только лечащий врач.</div>` + actions;
}

function pageCheckup(q) {
  if (q.pid && q.pid !== S.pid) { S.pid = q.pid; save(); }
  const p = P(), c = p.checkup, doneN = c.stages.filter(s => s.done).length, pct = Math.round(doneN / c.stages.length * 100), free = c.stages.filter(s => !s.done && !stageBooked(p, s));
  return `<div class="page-h"><div><h1>${isKid(p) ? 'Профилактический осмотр' : 'Диспансеризация'}</h1><p>${c.title}, ${c.period}</p></div></div>${personHead(p)}<div class="sp"></div>
  <div class="grid side"><div class="card"><div class="card-h"><h2>Ваш маршрут</h2><span class="badge ${doneN === c.stages.length ? 'ok' : ''}">${doneN} из ${c.stages.length}</span></div>
    <div class="bar ${pct === 100 ? 'ok' : ''}" style="margin-bottom:16px"><i style="width:${pct}%"></i></div>
    ${c.stages.map(s => { const b = stageBooked(p, s);
      return `<div class="row"><span class="ico ${s.done ? 'ok' : b ? '' : 'gray'}">${ic(s.done ? 'check' : b ? 'calendar' : 'clock')}</span><div class="body"><b>${s.name}</b><small>${s.done ? `Пройдено ${fmt(s.done)}` : s.note}</small></div>
      <div class="end">${s.done ? '<span class="badge ok">Готово</span>' : b ? `<span class="badge">${fmtS(b.date)}, ${b.time}</span><a class="btn sm ghost" href="#/book/my">Талон</a>` : `<a class="btn sm" href="#/book?spec=${s.spec}&pid=${p.id}&stage=${s.id}&reason=${encodeURIComponent(s.name)}">Записаться</a>`}</div></div>`; }).join('')}</div>
  <div class="grid"><div class="card rule"><h2>Всё за один визит</h2><p class="muted" style="margin:8px 0 16px">Подберём ближайший день, когда все оставшиеся кабинеты свободны, и выстроим маршрут по времени — без повторных поездок и очередей.</p>
    <button class="btn block" data-act="autobook" ${free.length ? '' : 'disabled'}>${free.length ? `Записать на ${free.length} ${pl(free.length, ['этап', 'этапа', 'этапов'])}` : 'Всё записано или пройдено'}</button></div>
    <div class="card"><h2>О программе</h2><p class="muted">${c.cadence}</p><div class="sp"></div><div class="note info">Результаты анализов и ЭКГ, пройденные ранее, уже подтянуты из ЕГИСЗ и засчитаны автоматически.</div><div class="sp"></div>
    <small>Срок прохождения: <b>${c.deadline}</b>. Возьмите паспорт и полис ОМС.</small></div>
    <div class="card"><h2>Итог</h2><p class="muted" style="margin-bottom:12px">После последнего этапа здесь появится ${isKid(p) ? 'заключение с группой здоровья и справка в школу' : 'паспорт здоровья с группой здоровья'}.</p><button class="btn sec block" disabled>Получить заключение</button></div></div></div>`;
}

const BSTEPS = ['Специальность', 'Врач', 'Время', 'Подтверждение'];
function pageBook(sub) {
  const p = P(), tabs = `<div class="tabs"><a href="#/book" class="${sub !== 'my' ? 'on' : ''}">Новая запись</a><a href="#/book/my" class="${sub === 'my' ? 'on' : ''}">Мои записи (${upcoming().length})</a></div>`;
  const head = `<div class="page-h"><div><h1>Запись к врачу</h1><p>Выберите время — придёте точно по талону и не будете стоять в очереди</p></div></div>`;
  if (sub === 'my') {
    const up = upcoming(), past = S.appts.filter(a => !(a.status === 'active' && dayDiff(a.date) >= 0)).sort((a, b) => b.date.localeCompare(a.date));
    return head + tabs + `<div class="grid g2">${up.length ? up.map(a => `<div>${ticket(a)}</div>`).join('') : `<div class="card empty" style="grid-column:1/-1">Нет предстоящих записей<br><br><a class="btn" href="#/book">Записаться</a></div>`}</div>
    ${past.length ? `<div class="sp"></div><div class="card"><h2>История</h2>${past.map(a => { const d = doc(a.docId); return `<div class="row"><span class="ico gray">${ic('calendar')}</span><div class="body"><b>${SPECS[d.spec].name}</b><small>${fmt(a.date)}, ${d.name}, ${prof(a.pid).short}</small></div><span class="badge ${a.status === 'cancelled' ? 'bad' : 'gray'}">${a.status === 'cancelled' ? 'Отменено' : 'Состоялся'}</span></div>`; }).join('')}</div>` : ''}`;
  }
  const stp = `<div class="stepper">${BSTEPS.map((s, i) => `<div class="${bk.step === i + 1 ? 'on' : bk.step > i + 1 ? 'done' : ''}">${i + 1}. ${s}</div>`).join('')}</div>`;
  const who = `<div class="note info" style="margin-bottom:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">${av(p)} <span>Запись для: <b>${p.name}</b></span> <small>(сменить — в меню справа вверху)</small></div>`;
  if (bk.step === 5) { const a = S.appts.find(x => x.id === bk.done); return head + `<div class="card" style="max-width:640px;margin:0 auto"><div style="text-align:center;margin-bottom:16px"><span class="ico ok" style="width:56px;height:56px;border-radius:50%;display:inline-grid;place-items:center;background:var(--ok-l);color:var(--ok)">${ic('check')}</span><h2 style="margin-top:12px">Вы записаны</h2><p class="muted">Напоминание придёт за сутки${S.settings.sms ? ' по SMS' : ''}${S.settings.push ? ' и push' : ''}</p></div>${ticket(a)}<div class="sp"></div><div class="note info">Приходите за 10 минут до приёма. Талон можно показать в регистратуре с экрана телефона.</div><div class="sp"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><a class="btn" href="#/book/my">Мои записи</a><button class="btn ghost" data-act="bk-new">Записаться ещё</button></div></div>`; }
  let body = '';
  if (bk.step === 1) body = `<div class="card"><h2>К какому специалисту?</h2><div class="sel">${specsFor(p).map(s => `<button data-act="bk-spec" data-val="${s.id}" class="${bk.spec === s.id ? 'on' : ''}"><span class="ico">${ic(s.id === 'vac' ? 'syringe' : s.id === 'diag' ? 'flask' : 'heart')}</span><span><b>${s.name}</b><br><small>${s.hint}</small></span></button>`).join('')}</div>
    <div class="sp"></div><div class="field"><label>Причина обращения (необязательно)</label><input type="text" id="reason" value="${esc(bk.reason)}" placeholder="Например: консультация по результатам анализов"></div></div>`;
  if (bk.step === 2) {
    const ds = docsFor(bk.spec, p).sort((a, b) => (a.clinic === p.clinic ? 0 : 1) - (b.clinic === p.clinic ? 0 : 1));
    body = `<div class="card"><div class="card-h"><h2>${SPECS[bk.spec].name}: выберите врача</h2><button class="btn sm ghost" data-act="bk-back">Назад</button></div>${ds.map(d => { const n = nearest(d), c = CLINICS[d.clinic];
      return `<div class="row"><span class="ico">${ic('user')}</span><div class="body"><b>${d.name}</b><small>${d.exp ? `Стаж ${d.exp} ${pl(d.exp, ['год', 'года', 'лет'])}, ` : ''}каб. ${d.room}<br>${c.name}, ${c.addr}</small></div>
      <div class="end">${n ? `<small>Ближайшее:<br><b>${fmtS(n.date)}, ${n.time}</b></small><button class="btn sm" data-act="bk-doc" data-val="${d.id}">Выбрать</button>` : '<span class="badge gray">Нет мест</span>'}</div></div>`; }).join('')}</div>`;
  }
  if (bk.step === 3) {
    const d = doc(bk.docId), dates = nextDates(14), sl = bk.date ? slots(d, bk.date) : [];
    body = `<div class="card"><div class="card-h"><h2>Дата и время</h2><button class="btn sm ghost" data-act="bk-back">Назад</button></div><p class="muted" style="margin-bottom:12px">${SPECS[d.spec].name}, ${d.name}, каб. ${d.room}</p>
    <div class="dates">${dates.map(dt => { const dd = parse(dt), n = slots(d, dt).length; return `<button data-act="bk-date" data-val="${dt}" class="${bk.date === dt ? 'on' : ''}" ${n ? '' : 'disabled'}><small>${WD[dd.getDay()]}</small><b>${dd.getDate()}</b><small>${MONTHS[dd.getMonth()].slice(0, 3)}</small></button>`; }).join('')}</div>
    ${bk.date ? `<div class="times">${(parse(bk.date).getDay() === 6 ? TIMES.filter(t => t < '12:30') : TIMES).map(t => `<button data-act="bk-time" data-val="${t}" class="${bk.time === t ? 'on' : ''}" ${sl.includes(t) ? '' : 'disabled'}>${t}</button>`).join('')}</div>` : '<div class="empty">Выберите день</div>'}
    <div class="sp"></div><button class="btn block" data-act="bk-next" ${bk.date && bk.time ? '' : 'disabled'}>Продолжить</button></div>`;
  }
  if (bk.step === 4) {
    const d = doc(bk.docId), c = CLINICS[d.clinic];
    body = `<div class="card" style="max-width:640px"><div class="card-h"><h2>Проверьте запись</h2><button class="btn sm ghost" data-act="bk-back">Назад</button></div><dl class="kv">
      <div><dt>Пациент</dt><dd>${p.name}</dd></div><div><dt>Специалист</dt><dd>${SPECS[d.spec].name}, ${d.name}</dd></div><div><dt>Дата и время</dt><dd>${fmt(bk.date)} (${WD[parse(bk.date).getDay()]}), ${bk.time}</dd></div>
      <div><dt>Место</dt><dd>${c.name}, каб. ${d.room}<br><small>${c.addr}</small></dd></div>${bk.reason ? `<div><dt>Причина</dt><dd>${esc(bk.reason)}</dd></div>` : ''}</dl>
      ${bk.resched ? '<div class="sp"></div><div class="note">Прежняя запись будет отменена автоматически.</div>' : ''}<div class="sp"></div>
      <button class="btn block" data-act="bk-confirm">${bk.resched ? 'Подтвердить перенос' : 'Подтвердить запись'}</button></div>`;
  }
  return head + tabs + who + stp + body;
}

function pageNotifs() {
  const all = notifs(), list = all.filter(n => nFilter === 'all' || n.pid === nFilter), st = S.settings;
  const tg = (k, l, s) => `<div class="sw"><div><b>${l}</b><br><small>${s}</small></div><button class="tg ${st[k] ? 'on' : ''}" data-act="set" data-key="${k}" aria-label="${l}"></button></div>`;
  return `<div class="page-h"><div><h1>Уведомления</h1><p>Напоминания о прививках, осмотрах и приёмах — для вас и ваших детей</p></div><button class="btn sec" data-act="readall">Отметить прочитанными</button></div>
  <div class="grid side"><div>
    <div class="chips" style="margin-bottom:16px"><button class="chip ${nFilter === 'all' ? 'on' : ''}" data-act="nf" data-val="all">Все (${all.length})</button>${PROFILES.map(p => `<button class="chip ${nFilter === p.id ? 'on' : ''}" data-act="nf" data-val="${p.id}">${p.id === 'me' ? 'Мои' : p.short} (${all.filter(n => n.pid === p.id).length})</button>`).join('')}</div>
    ${list.length ? list.map(attnRow).join('') : '<div class="card empty">Новых напоминаний нет</div>'}</div>
  <div class="grid"><div class="card"><h2>Настройки напоминаний</h2>
    ${tg('push', 'Push-уведомления', 'В приложении и на телефоне')}${tg('sms', 'SMS', '+7 949 ••• ••-42')}${tg('email', 'Электронная почта', 'i••••@mail.ru')}${tg('kids', 'Напоминания о детях', 'Прививки и осмотры Мирона и Алисы придут вам как родителю')}
    <div class="sp"></div><b>Напоминать заранее</b><div class="chips" style="margin-top:8px">${[7, 14, 30, 60].map(d => `<button class="chip ${st.days === d ? 'on' : ''}" data-act="days" data-val="${d}">${d} дн.</button>`).join('')}</div>
    <div class="sp"></div><button class="btn sec block" data-act="testpush">Отправить тестовое уведомление</button></div></div></div>`;
}

function pageAbout() {
  const it = (i, t, s) => `<div class="card"><span class="ico" style="margin-bottom:12px">${ic(i)}</span><h3>${t}</h3><p class="muted" style="margin-top:4px">${s}</p></div>`;
  return `<div class="page-h"><div><h1>О проекте</h1><p>Форум молодёжи Донбасса, проект «Здоровый Дончанин»</p></div></div>
  <div class="card rule" style="--rule:var(--bad);margin-bottom:16px"><h2>Проблема</h2><p>Чтобы просто получить результат анализа, приходится стоять в очередях в разные кабинеты, а затем ехать в поликлинику ещё раз — за бумажным бланком. Прививки и осмотры детей легко пропустить, бумажные карты теряются.</p></div>
  <h2 style="margin-bottom:12px">Решение — один личный кабинет</h2>
  <div class="grid g2">${it('card', 'Онлайн-карточка', 'Анамнез жизни и заболеваний, прививки и выписки — в телефоне, всегда под рукой и у врача.')}
  ${it('flask', 'Результаты анализов онлайн', 'Анализы и исследования подгружаются из ЕГИСЗ сами. Поездка за бланком больше не нужна.')}
  ${it('shield', 'Ежегодная диспансеризация', 'Весь маршрут по этапам, статус прохождения и запись на все кабинеты за один визит.')}
  ${it('calendar', 'Запись к врачу', 'Выбор врача, даты и времени, электронный талон: приходите к назначенному часу без очереди.')}
  ${it('bell', 'Умные напоминания', 'О прививках и ежегодных осмотрах. Родители получают напоминания по прививкам детей и сезонным осмотрам педиатра.')}
  ${it('users', 'Семейный доступ', 'Один аккаунт родителя — карточки всех детей с переключением в один клик.')}</div>
  <div class="sp"></div><div class="card"><h2>Как это будет работать в реальности</h2><ul style="padding-left:20px"><li>Вход через ЕСИА, данные — через интеграцию с ЕГИСЗ (медорганизации передают документы с электронной подписью)</li><li>Запись — через регистр расписаний медорганизаций</li><li>Уведомления — push, SMS и e-mail по календарю профилактических прививок и приказам о диспансеризации</li><li>Защита персональных данных по 152-ФЗ</li></ul>
  <div class="sp"></div><div class="note">Это MVP-прототип интерфейса: сервера нет, данные вымышлены, «подключение к ЕГИСЗ» имитируется.</div></div>`;
}

/* ---------- рендер и роутинг ---------- */
function render() {
  if (!S.logged) { $app.innerHTML = loginPage(); return; }
  const r = route(); let body;
  switch (r.name) {
    case 'card': body = pageCard(r.sub); break;
    case 'labs': body = pageLabs(r.sub); break;
    case 'checkup': body = pageCheckup(r.q); break;
    case 'book': body = pageBook(r.sub); break;
    case 'notifications': body = pageNotifs(); break;
    case 'about': body = pageAbout(); break;
    default: body = pageHome();
  }
  const keep = document.activeElement && document.activeElement.id;
  $app.innerHTML = shell(body, r.name === 'notifications' || r.name === 'about' ? '' : r.name);
  const rs = document.getElementById('reason'); if (rs && keep === 'reason') rs.focus();
}
function onHash() {
  const r = route(); menuOpen = false;
  if (r.name === 'book' && (r.q.spec || r.q.pid)) {
    if (r.q.pid) S.pid = r.q.pid;
    bk = newBk(); if (r.q.spec) { bk.spec = r.q.spec; bk.step = 2; }
    bk.reason = r.q.reason || ''; bk.vacId = r.q.vac || null; bk.stageId = r.q.stage || null; save();
    history.replaceState(null, '', '#/book');
  }
  if (r.name === 'book' && !r.sub && bk.step === 5) bk = newBk();
  render(); window.scrollTo(0, 0);
}
window.addEventListener('hashchange', onHash);

/* ---------- синхронизация с ЕГИСЗ ---------- */
function openSync() {
  const steps = ['Подключение к ЕГИСЗ', 'Авторизация через ЕСИА', 'Поиск новых документов', 'Проверка электронной подписи медорганизации', 'Загрузка в вашу карточку'];
  let i = 0, res = null;
  const view = () => `<div class="ov"><div class="modal"><h2 style="margin-bottom:8px">${res ? 'Синхронизация завершена' : 'Обновляем данные из ЕГИСЗ'}</h2><p class="muted" style="margin-bottom:12px">Карточка, анализы, прививки и выписки всех членов семьи</p>
    ${steps.map((s, k) => `<div class="sy ${k < i || res ? 'done' : k === i ? 'cur' : ''}"><span class="st">${k < i || res ? ic('check') : k === i ? ic('sync') : ''}</span>${s}</div>`).join('')}
    ${res ? `<div class="sp"></div>${res.length ? `<div class="note info"><b>Найдено новых документов: ${res.length}</b><br>${res.map(l => `• ${prof(l.pid).short}: ${l.title}`).join('<br>')}</div>` : '<div class="note info">Новых документов нет — у вас всё актуально.</div>'}
    <div class="sp"></div><div style="display:flex;gap:8px"><button class="btn block" data-act="close" data-go="${res.length ? '#/labs/' + res[0].id : ''}">${res.length ? 'Посмотреть' : 'Готово'}</button></div>` : ''}</div></div>`;
  $modal.innerHTML = view();
  const t = setInterval(() => {
    i++;
    if (i >= steps.length) {
      clearInterval(t);
      res = PROFILES.flatMap(p => pendingOf(p).map(l => ({ ...l, pid: p.id })));
      res.forEach(l => S.revealed.push(l.id)); S.syncedAt = Date.now(); save(); render();
      if (res.length) setTimeout(() => toast('Новый результат анализа', `${prof(res[0].pid).short}: ${res[0].title}`), 300);
    }
    $modal.innerHTML = view();
  }, 650);
}

/* ---------- действия ---------- */
document.addEventListener('input', e => { if (e.target.id === 'reason') bk.reason = e.target.value; });
document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (menuOpen && !e.target.closest('.menu') && !(t && t.dataset.act === 'menu')) { menuOpen = false; if (!t || t.dataset.act !== 'prof') render(); }
  if (!t) return;
  const a = t.dataset.act, v = t.dataset.val, id = t.dataset.id;
  switch (a) {
    case 'login': S.logged = true; save(); if (!location.hash) location.hash = '#/home'; render(); break;
    case 'logout': S.logged = false; menuOpen = false; save(); render(); break;
    case 'menu': menuOpen = !menuOpen; render(); break;
    case 'prof': S.pid = id; menuOpen = false; save(); if (bk.step < 5) bk = Object.assign(newBk(), { step: bk.spec && bk.step > 1 ? 1 : bk.step }); render(); break;
    case 'reset': if (confirm('Сбросить демо-данные к исходным?')) { try { localStorage.removeItem(KEY); } catch (e) { } location.hash = ''; location.reload(); } break;
    case 'sync': openSync(); break;
    case 'close': $modal.innerHTML = ''; if (t.dataset.go) go(t.dataset.go); break;
    case 'read': if (!S.read.includes(id)) { S.read.push(id); save(); } break;
    case 'readall': notifs().forEach(n => { if (!S.read.includes(n.id)) S.read.push(n.id); }); save(); render(); break;
    case 'nf': nFilter = v; render(); break;
    case 'set': S.settings[t.dataset.key] = !S.settings[t.dataset.key]; save(); render(); break;
    case 'days': S.settings.days = +v; save(); render(); break;
    case 'testpush': {
      const ch = [S.settings.push && 'push', S.settings.sms && 'SMS', S.settings.email && 'e-mail'].filter(Boolean);
      if (!ch.length) { toast('Включите хотя бы один канал'); break; }
      toast('Здоровый Дончанин: ' + ch.join(', '), 'Напоминание: Мирону пора на ревакцинацию АДС-М. Запишитесь в личном кабинете.', 'sms'); break;
    }
    case 'labf': labFilter = v; render(); break;
    case 'tog': openDis[id] = !openDis[id]; render(); break;
    case 'print': window.print(); break;
    case 'share': toast('Ссылка для врача скопирована', 'Действует 24 часа (демо)'); break;
    case 'autobook': { const r = autoBook(P()); render(); toast(r.date ? `Записано этапов: ${r.n}` : 'Записали на ближайшие свободные дни', r.date ? `Все — ${fmt(r.date)}, маршрут по времени в «Моих записях»` : 'Подробности — в «Моих записях»'); break; }
    case 'bk-spec': bk.spec = v; bk.step = 2; render(); break;
    case 'bk-doc': bk.docId = v; bk.step = 3; bk.date = null; bk.time = null; render(); break;
    case 'bk-date': bk.date = v; bk.time = null; render(); break;
    case 'bk-time': bk.time = v; render(); break;
    case 'bk-next': bk.step = 4; render(); break;
    case 'bk-back': bk.step = Math.max(1, bk.step - 1); render(); break;
    case 'bk-new': bk = newBk(); go('#/book'); render(); break;
    case 'bk-confirm': {
      if (bk.resched) { const o = S.appts.find(x => x.id === bk.resched); if (o) o.status = 'cancelled'; }
      const ap = createAppt({ pid: S.pid, docId: bk.docId, date: bk.date, time: bk.time, reason: bk.reason || SPECS[doc(bk.docId).spec].name, vacId: bk.vacId, stageId: bk.stageId });
      bk.done = ap.id; bk.step = 5; render(); window.scrollTo(0, 0); break;
    }
    case 'cancel': if (confirm('Отменить запись?')) { const x = S.appts.find(z => z.id === id); x.status = 'cancelled'; save(); render(); toast('Запись отменена', 'Место освободилось для других пациентов'); } break;
    case 'resched': { const x = S.appts.find(z => z.id === id); S.pid = x.pid; bk = Object.assign(newBk(), { step: 3, spec: doc(x.docId).spec, docId: x.docId, reason: x.reason, vacId: x.vacId || null, stageId: x.stageId || null, resched: x.id }); save(); go('#/book'); render(); break; }
    case 'ics': {
      const x = S.appts.find(z => z.id === id), d = doc(x.docId), s = x.date.replace(/-/g, '') + 'T' + x.time.replace(':', '') + '00', en = x.date.replace(/-/g, '') + 'T' + addMin(x.time, 30).replace(':', '') + '00';
      const txt = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nDTSTART:${s}\r\nDTEND:${en}\r\nSUMMARY:${SPECS[d.spec].name} — ${d.name}\r\nLOCATION:${CLINICS[d.clinic].name}\\, каб. ${d.room}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
      const el = document.createElement('a'); el.href = URL.createObjectURL(new Blob([txt], { type: 'text/calendar' })); el.download = 'priem.ics'; el.click(); toast('Файл календаря сохранён'); break;
    }
  }
});

if (!location.hash) history.replaceState(null, '', '#/home');
onHash();
