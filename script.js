/* NoZero — ZERO EXCUSES. ZERO ZERO DAYS.
   Plain vanilla JS. All data lives in localStorage under "nozero:v1". */
(() => {
  'use strict';

  /* ================= Constants ================= */
  const KEY = 'nozero:v1';
  const SEC = 1000, MIN = 60000, HOUR = 3600000;
  const TARGET = { water: 4000, skill: 5 * HOUR, meditate: 10 * MIN };
  const MAX_WATER = 10000;
  const RING_C = 2 * Math.PI * 52;
  const REWARDS = [
    { id: 'coffee', label: 'Coffee', icon: '☕' },
    { id: 'coke', label: 'Coke', icon: '🥤' },
    { id: 'snacks', label: 'Snacks', icon: '🍿' },
    { id: 'custom', label: 'Custom treat', icon: '✨' }
  ];
  const ACCENTS = ['#ff5a36', '#c6ff3d', '#22d3ee', '#8b5cf6', '#fbbf24', '#f43f5e', '#34d399'];
  const QUOTES = [
    'Discipline is choosing what you want most over what you want now.',
    "You don't need motivation. You need a promise you refuse to break.",
    'Small wins, stacked daily, become an unfair advantage.',
    'The day you skip is the day you teach yourself that skipping is allowed.',
    "Consistency beats intensity when intensity doesn't show up.",
    'Be the person your future self already thanks.',
    'Nobody is coming to save your routine. Build it.',
    'Zero days are a habit. So is showing up. Choose your habit.',
    'Do it tired. Do it bored. Do it anyway.',
    "Your streak is a story of every time you didn't quit.",
    'Comfort asks for tomorrow. Discipline delivers today.',
    'Growth is quiet. It happens in the hours nobody applauds.',
    'Make the promise small enough to keep, then keep it every day.',
    'Excuses are just early quitting dressed in logic.',
    'A thousand ordinary days build an extraordinary life, as long as none of them are zero.',
    'Pressure is temporary. Pride in a kept promise is permanent.',
    'Win the morning, then protect the win.',
    'Who you become is built by what you repeat.',
    "Don't negotiate with the alarm. Don't negotiate with yourself.",
    'Five hours of focus today is a skill you own forever.',
    'Stillness is training. Ten quiet minutes make the loud day manageable.',
    'Hydrate the body, sharpen the mind, keep the promise.',
    "Progress doesn't ask how you feel. It asks if you showed up.",
    'One more day. One more brick. Keep building.',
    'Self-respect is the sum of promises kept to yourself.',
    "Slow days still count. Zero days don't.",
    "Not every day is a victory lap. Every day is a vote for who you're becoming.",
    "Today's discipline is tomorrow's freedom.",
    "Show up before you're ready. Get ready by showing up.",
    "Great isn't a talent. It's a streak."
  ];

  /* ================= Helpers ================= */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
  const pad = n => String(n).padStart(2, '0');
  const root = document.documentElement;
  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const todayKey = () => keyOf(new Date());
  const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
  const dayNum = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  const nextMidnight = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d + 1).getTime(); };

  const fmtClock = ms => { const s = Math.floor(ms / 1000); return pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60); };
  const fmtDur = ms => {
    const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, x = s % 60;
    return h ? `${h}h ${pad(m)}m` : m ? `${m}m ${pad(x)}s` : `${x}s`;
  };
  const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const litres = ml => (ml / 1000).toFixed(2);
  const longDate = d => new Intl.DateTimeFormat(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(d);

  /* ================= State ================= */
  const newTimer = () => ({ elapsed: 0, running: false, startedAt: null, sessions: [], hit: false });
  const emptyDay = () => ({
    bath: false, water: 0, waterLog: [], skill: newTimer(), meditate: newTimer(),
    celebrated: false, completedAt: null, reward: null
  });

  function fixTimer(t) {
    const b = newTimer();
    if (!t || typeof t !== 'object') return b;
    b.elapsed = Math.max(0, +t.elapsed || 0);
    b.running = !!t.running && Number.isFinite(+t.startedAt);
    b.startedAt = b.running ? +t.startedAt : null;
    b.hit = !!t.hit;
    if (Array.isArray(t.sessions)) {
      b.sessions = t.sessions.filter(x => x && Number.isFinite(+x.s) && Number.isFinite(+x.e))
        .map(x => ({ s: +x.s, e: +x.e, ms: Math.max(0, +x.ms || (+x.e - +x.s)) })).slice(-300);
    }
    return b;
  }
  function fixDay(d) {
    const b = emptyDay();
    if (!d || typeof d !== 'object') return b;
    b.bath = !!d.bath;
    b.water = clamp(+d.water || 0, 0, MAX_WATER);
    b.waterLog = Array.isArray(d.waterLog) ? d.waterLog.map(Number).filter(Number.isFinite).slice(-300) : [];
    b.skill = fixTimer(d.skill);
    b.meditate = fixTimer(d.meditate);
    b.celebrated = !!d.celebrated;
    b.completedAt = Number.isFinite(+d.completedAt) ? +d.completedAt : null;
    if (d.reward && typeof d.reward === 'object' && typeof d.reward.label === 'string') {
      b.reward = { id: String(d.reward.id || 'custom').slice(0, 20), label: d.reward.label.slice(0, 60) };
    }
    return b;
  }
  function normalize(p) {
    const s = { version: 1, days: {}, settings: {} };
    if (p && typeof p === 'object') {
      if (p.days && typeof p.days === 'object') {
        for (const k in p.days) if (/^\d{4}-\d{2}-\d{2}$/.test(k)) s.days[k] = fixDay(p.days[k]);
      }
      if (p.settings && typeof p.settings === 'object') s.settings = p.settings;
    }
    s.settings = Object.assign({ theme: 'dark', accent: '#ff5a36', sound: true, customReward: '' }, s.settings);
    if (s.settings.theme !== 'light') s.settings.theme = 'dark';
    if (!/^#[0-9a-fA-F]{6}$/.test(s.settings.accent)) s.settings.accent = '#ff5a36';
    s.settings.sound = !!s.settings.sound;
    s.settings.customReward = String(s.settings.customReward || '').slice(0, 40);
    return s;
  }

  let storageWarned = false;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* fall through */ }
    return normalize(null);
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (e) {
      if (!storageWarned) { storageWarned = true; toast('Storage is blocked — progress will not be saved.'); }
    }
  }

  let state = load();
  let TODAY = todayKey();
  const ensureDay = k => state.days[k] || (state.days[k] = emptyDay());
  const today = () => ensureDay(TODAY);

  /* ================= Goal maths ================= */
  const timerMs = (t, now = Date.now()) => t.elapsed + (t.running ? Math.max(0, now - t.startedAt) : 0);
  function fracs(d, now = Date.now()) {
    return {
      bath: d.bath ? 1 : 0,
      water: clamp(d.water / TARGET.water, 0, 1),
      skill: clamp(timerMs(d.skill, now) / TARGET.skill, 0, 1),
      meditate: clamp(timerMs(d.meditate, now) / TARGET.meditate, 0, 1)
    };
  }
  const goalsDone = (d, now) => { const f = fracs(d, now); return ['bath', 'water', 'skill', 'meditate'].filter(k => f[k] >= 1).length; };
  const isDone = (d, now) => !!d && goalsDone(d, now) === 4;
  const dayPercent = (d, now) => {
    const f = fracs(d, now);
    const avg = (f.bath + f.water + f.skill + f.meditate) / 4;
    return isDone(d, now) ? 100 : Math.min(99, Math.floor(avg * 100));
  };

  function streaks() {
    const keys = Object.keys(state.days).filter(k => isDone(state.days[k])).sort();
    const set = new Set(keys.map(dayNum));
    const t = dayNum(TODAY);
    let cur = 0, n = set.has(t) ? t : t - 1;
    while (set.has(n)) { cur++; n--; }
    let longest = 0, run = 0, prev = null;
    keys.forEach(k => { const x = dayNum(k); run = (prev !== null && x === prev + 1) ? run + 1 : 1; longest = Math.max(longest, run); prev = x; });
    return { cur, longest, total: keys.length, keys };
  }

  /* ================= Timer actions ================= */
  function pauseTimer(t, now) {
    if (!t.running) return;
    const ms = Math.max(0, now - t.startedAt);
    t.elapsed += ms;
    if (ms >= 1000) t.sessions.push({ s: t.startedAt, e: now, ms });
    t.running = false; t.startedAt = null;
  }
  function toggleTimer(name) {
    const d = today(), t = d[name], now = Date.now();
    if (t.running) {
      pauseTimer(t, now);
    } else {
      const other = name === 'skill' ? 'meditate' : 'skill';
      if (d[other].running) {
        pauseTimer(d[other], now);
        toast((other === 'skill' ? 'Skill' : 'Meditation') + ' timer paused — one focus at a time.');
      }
      t.running = true; t.startedAt = now;
    }
    save(); renderAll(); checkComplete();
  }
  async function resetTimer(name) {
    const d = today(), t = d[name];
    if (t.elapsed === 0 && !t.running && !t.sessions.length) return;
    const ok = await confirmDialog({
      title: 'Reset ' + (name === 'skill' ? 'skill' : 'meditation') + ' timer?',
      text: "This clears today's accumulated time and all sessions for this goal.", ok: 'Reset timer'
    });
    if (!ok) return;
    d[name] = newTimer();
    save(); renderAll();
  }

  /* ================= Other actions ================= */
  function toggleBath() {
    const d = today(); d.bath = !d.bath;
    if (d.bath) chime([[660, .12, 0], [880, .18, .1]]);
    save(); renderAll(); checkComplete();
  }
  function addWater(ml) {
    const d = today();
    const add = Math.min(ml, MAX_WATER - d.water);
    if (add <= 0) { toast('That is plenty — 10 L is the daily cap.'); return; }
    const before = d.water;
    d.water += add; d.waterLog.push(add);
    if (before < TARGET.water && d.water >= TARGET.water) { toast('💧 4 L done. Hydration goal crushed.'); chime([[523, .12, 0], [659, .12, .1], [784, .2, .2]]); }
    else chime([[740, .08, 0]]);
    save(); renderAll(); checkComplete();
  }
  function undoWater() {
    const d = today();
    if (!d.waterLog.length) { toast('Nothing to undo.'); return; }
    const last = d.waterLog.pop();
    d.water = Math.max(0, d.water - last);
    save(); renderAll();
  }

  function checkHits(now) {
    const d = today();
    ['skill', 'meditate'].forEach(n => {
      const t = d[n];
      if (!t.hit && timerMs(t, now) >= TARGET[n]) {
        t.hit = true; save();
        if (t.running) {
          toast(n === 'skill' ? '🎯 5 hours of skill work done!' : '🧘 10 minutes of meditation done!');
          chime([[523, .12, 0], [659, .12, .1], [784, .22, .2]]);
        }
      }
    });
  }
  function checkComplete() {
    const d = today();
    if (isDone(d) && !d.celebrated) {
      d.celebrated = true; d.completedAt = Date.now(); save();
      renderStats(); renderCalendar(); renderHistory();
      showCelebration();
    }
  }

  /* ================= Rollover (new day) ================= */
  function rollover() {
    const k = todayKey();
    let changed = false;
    for (const key in state.days) {
      if (key < k) {
        const d = state.days[key];
        ['skill', 'meditate'].forEach(n => {
          if (d[n].running) { pauseTimer(d[n], Math.max(d[n].startedAt, nextMidnight(key))); changed = true; }
        });
      }
    }
    const isNew = k !== TODAY;
    if (isNew) { TODAY = k; ensureDay(k); changed = true; }
    if (changed) save();
    return isNew;
  }

  /* ================= Rendering ================= */
  let lastDone = null;
  let quoteIdx = 0;

  function setQuote(idx, animate) {
    quoteIdx = idx;
    const el = $('#quoteText');
    const apply = () => { el.textContent = '“' + QUOTES[quoteIdx] + '”'; el.classList.remove('swap'); };
    if (animate) { el.classList.add('swap'); setTimeout(apply, 220); } else apply();
  }

  function renderToday(now = Date.now()) {
    const d = today(), f = fracs(d, now), done = goalsDone(d, now), pct = dayPercent(d, now);

    $('#pctText').textContent = pct + '%';
    $('#ringFg').style.strokeDashoffset = String(RING_C * (1 - pct / 100));
    $('#barFill').style.width = pct + '%';
    $('#barTrack').setAttribute('aria-valuenow', String(pct));
    $('#statusText').textContent = done === 4 ? 'All 4 goals complete. 🔥' : `${done} of 4 goals complete`;

    // bath
    const bathBtn = $('#bathBtn');
    bathBtn.setAttribute('aria-pressed', String(d.bath));
    $('#bathLabel').textContent = d.bath ? 'Done. Fresh and unstoppable.' : 'Tap to mark as done';
    setGoal('bath', d.bath ? 'ok' : 'none', d.bath ? 'Done' : 'Pending', d.bath);

    // water
    const wFill = $('#tankFill');
    wFill.style.height = (f.water * 100).toFixed(1) + '%';
    wFill.classList.toggle('empty', d.water === 0);
    $('#waterAmt').textContent = litres(d.water);
    const left = TARGET.water - d.water;
    $('#waterNote').textContent = left > 0 ? `${litres(left)} L to go` : (d.water > TARGET.water ? `Goal hit · +${litres(d.water - TARGET.water)} L extra` : 'Goal hit ✓');
    $('#tank').setAttribute('aria-label', `Water level ${litres(d.water)} of 4 litres`);
    setGoal('water', f.water >= 1 ? 'ok' : d.water > 0 ? 'prog' : 'none', f.water >= 1 ? 'Done' : d.water > 0 ? Math.round(f.water * 100) + '%' : 'Pending', f.water >= 1);
    $('#waterUndo').disabled = !d.waterLog.length;

    // timers
    ['skill', 'meditate'].forEach(n => {
      const t = d[n], ms = timerMs(t, now), fr = f[n], rem = TARGET[n] - ms;
      $('#' + n + 'Time').textContent = fmtClock(ms);
      $('#' + n + 'Bar').style.width = (fr * 100).toFixed(2) + '%';
      $('#' + n + 'Remain').textContent = rem > 0
        ? (n === 'skill' ? fmtDur(Math.ceil(rem / 1000) * 1000) : fmtDur(Math.ceil(rem / 1000) * 1000)) + ' to go'
        : 'Goal reached ✓' + (rem < -1000 ? ' · +' + fmtDur(-rem) + ' extra' : '');
      $('#' + n + 'Toggle').textContent = t.running ? '⏸ Pause' : (ms > 0 ? '▶ Resume' : '▶ Start');
      $('#' + n + 'Reset').disabled = (ms === 0 && !t.sessions.length);
      const state_ = fr >= 1 ? 'ok' : t.running ? 'run' : ms > 0 ? 'prog' : 'none';
      setGoal(n, state_, fr >= 1 ? 'Done' : t.running ? 'Running' : ms > 0 ? Math.round(fr * 100) + '%' : 'Pending', fr >= 1, t.running);
    });

    // title shows live timer
    const run = d.skill.running ? 'skill' : d.meditate.running ? 'meditate' : null;
    document.title = run ? `${fmtClock(timerMs(d[run], now))} · NoZero` : 'NoZero — Zero Excuses. Zero Zero Days.';

    // banner
    const banner = $('#doneBanner');
    banner.hidden = done !== 4;
    if (done === 4) $('#doneReward').textContent = d.reward ? 'Reward: ' + rewardText(d.reward) : 'Pick your reward below ↓';
  }

  function setGoal(name, kind, label, done, running) {
    const card = $('#goal-' + name), chip = $('#chip-' + name);
    card.classList.toggle('done', !!done);
    card.classList.toggle('running', !!running);
    chip.textContent = label;
    chip.className = 'chip' + (kind === 'ok' ? ' ok' : kind === 'run' ? ' run' : kind === 'prog' ? ' prog' : '');
  }

  function renderSessions() {
    const d = today();
    ['skill', 'meditate'].forEach(n => {
      const t = d[n], ol = $('#' + n + 'Sessions');
      const rows = t.sessions.map((s, i) =>
        `<li><span>#${i + 1} · ${esc(fmtTime(s.s))} → ${esc(fmtTime(s.e))}</span><b>${esc(fmtDur(s.ms))}</b></li>`);
      if (t.running) rows.push(`<li class="live"><span>● Running since ${esc(fmtTime(t.startedAt))}</span><b>live</b></li>`);
      ol.innerHTML = rows.length ? rows.join('') : '<li class="empty">No sessions yet</li>';
      ol.scrollTop = ol.scrollHeight;
      $('#' + n + 'Count').textContent = String(t.sessions.length + (t.running ? 1 : 0));
    });
  }

  function renderStats() {
    const s = streaks();
    $('#streakNum').textContent = s.cur;
    $('#longestNum').textContent = s.longest;
    $('#totalNum').textContent = s.total;
    $('#hCur').textContent = s.cur;
    $('#hLong').textContent = s.longest;
    $('#hTotal').textContent = s.total;
    const keys = Object.keys(state.days).sort();
    const first = keys[0];
    const span = first ? dayNum(TODAY) - dayNum(first) + 1 : 1;
    $('#hRate').textContent = Math.round((s.total / Math.max(1, span)) * 100) + '%';
  }

  /* ---- Calendar ---- */
  let view = { y: new Date().getFullYear(), m: new Date().getMonth() };
  let selected = TODAY;

  function renderCalendar() {
    const { y, m } = view;
    $('#calTitle').textContent = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(y, m, 1));
    const grid = $('#calGrid');
    const offset = (new Date(y, m, 1).getDay() + 6) % 7;
    const dim = new Date(y, m + 1, 0).getDate();
    const first = Object.keys(state.days).sort()[0] || TODAY;
    const now = Date.now();
    let html = '';
    for (let i = 0; i < offset; i++) html += '<span class="cal-cell empty"></span>';
    for (let day = 1; day <= dim; day++) {
      const k = y + '-' + pad(m + 1) + '-' + pad(day);
      const rec = state.days[k];
      const future = k > TODAY, isT = k === TODAY;
      const done = rec && isDone(rec, now);
      const pct = rec ? dayPercent(rec, now) : 0;
      const zero = !future && !isT && !done && pct === 0 && k >= first;
      const cls = ['cal-cell'];
      if (future) cls.push('future');
      if (isT) cls.push('today');
      if (done) cls.push('done');
      else if (zero) cls.push('zero');
      if (k === selected) cls.push('sel');
      const label = `${day} ${new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(y, m, 1))}: ${done ? 'promise kept' : future ? 'upcoming' : pct + '% complete'}`;
      html += `<button type="button" class="${cls.join(' ')}" data-key="${k}" style="--p:${pct}" aria-label="${esc(label)}"${future ? ' disabled' : ''}><span>${done ? '✓' : day}</span></button>`;
    }
    grid.innerHTML = html;
    renderDetail();
  }

  function renderDetail() {
    const box = $('#dayDetail');
    const k = selected, d = state.days[k];
    const title = longDate(parseKey(k));
    if (!d) { box.innerHTML = `<h3>${esc(title)}</h3><p class="muted">No record for this day.</p>`; return; }
    const now = Date.now(), done = isDone(d, now), f = fracs(d, now);
    const row = (label, ok, val) => `<li class="${ok ? 'ok' : 'no'}"><span>${label}</span><b>${val}</b></li>`;
    box.innerHTML = `
      <h3>${esc(title)}</h3>
      <span class="chip ${done ? 'ok' : ''}" style="align-self:flex-start">${done ? 'Promise kept' : dayPercent(d, now) + '% complete'}</span>
      <ul class="detail-list">
        ${row('🛁 Bath', d.bath, d.bath ? '✓ Done' : '— Not done')}
        ${row('💧 Water', f.water >= 1, litres(d.water) + ' / 4 L')}
        ${row('🧠 Skill', f.skill >= 1, fmtDur(timerMs(d.skill, now)) + ' / 5h')}
        ${row('🧘 Meditation', f.meditate >= 1, fmtDur(timerMs(d.meditate, now)) + ' / 10m')}
      </ul>
      ${d.reward ? `<p><b>Reward:</b> ${esc(rewardText(d.reward))}</p>` : ''}`;
  }

  function renderHistory() {
    const list = $('#historyList');
    const keys = Object.keys(state.days).filter(k => isDone(state.days[k])).sort().reverse().slice(0, 90);
    if (!keys.length) { list.innerHTML = '<li class="empty-msg">No completed days yet. Today could be the first.</li>'; return; }
    list.innerHTML = keys.map(k => {
      const d = state.days[k];
      return `<li data-key="${k}"><div><div class="h-date">${esc(longDate(parseKey(k)))}</div>
        <div class="h-meta">${litres(d.water)} L · ${esc(fmtDur(timerMs(d.skill)))} skill · ${esc(fmtDur(timerMs(d.meditate)))} meditation</div></div>
        <span class="h-reward">${d.reward ? esc(rewardText(d.reward)) : '✅'}</span></li>`;
    }).join('');
  }

  function renderAll() {
    renderToday(); renderSessions(); renderStats(); renderCalendar(); renderHistory();
    lastDone = isDone(today());
    $('#dateLabel').textContent = longDate(new Date());
  }

  /* ================= Theme & accent ================= */
  function hexToRgb(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s * 100, l * 100];
  }
  function applyAccent() {
    const hex = state.settings.accent, [r, g, b] = hexToRgb(hex), [h, s, l] = rgbToHsl(r, g, b);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    root.style.setProperty('--accent', hex);
    root.style.setProperty('--accent-2', `hsl(${Math.round((h + 38) % 360)} ${Math.round(Math.max(60, s))}% ${Math.round(clamp(l, 50, 62))}%)`);
    root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    root.style.setProperty('--on-accent', lum > 0.58 ? '#0a0a0f' : '#ffffff');
    $$('.swatch').forEach(s_ => s_.classList.toggle('on', s_.dataset.color.toLowerCase() === hex.toLowerCase()));
    $('#accentCustom').value = hex;
  }
  function applyTheme() {
    const t = state.settings.theme;
    root.setAttribute('data-theme', t);
    $('#metaTheme').setAttribute('content', t === 'light' ? '#f4f4f8' : '#09090e');
    $('#themeDark').classList.toggle('on', t === 'dark');
    $('#themeLight').classList.toggle('on', t === 'light');
  }
  function applySound() {
    $('#soundCheck').checked = state.settings.sound;
    $('#celSound').textContent = state.settings.sound ? '🔊' : '🔇';
  }

  /* ================= Sound ================= */
  let actx = null;
  function chime(seq) {
    if (!state.settings.sound) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      actx = actx || new AC();
      if (actx.state === 'suspended') actx.resume();
      const t0 = actx.currentTime;
      seq.forEach(([f, dur, at]) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = 'triangle'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + at);
        g.gain.exponentialRampToValueAtTime(0.16, t0 + at + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
        o.connect(g); g.connect(actx.destination);
        o.start(t0 + at); o.stop(t0 + at + dur + 0.05);
      });
    } catch (e) { /* audio is optional */ }
  }
  const fanfare = () => chime([[523, .18, 0], [659, .18, .15], [784, .18, .3], [1047, .5, .45], [784, .5, .45], [659, .5, .45]]);

  /* ================= Toasts ================= */
  function toast(msg) {
    const box = $('#toasts'), el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg; box.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 450); }, 3200);
  }

  /* ================= Modals ================= */
  const stack = [];
  let lastFocus = null;
  function openModal(el) {
    lastFocus = document.activeElement;
    el.hidden = false; stack.push(el); document.body.classList.add('no-scroll');
    const f = el.querySelector('button:not([data-close]), input, [data-close]');
    if (f) setTimeout(() => f.focus(), 30);
  }
  function closeModal(el) {
    el.hidden = true;
    const i = stack.indexOf(el); if (i > -1) stack.splice(i, 1);
    if (!stack.length) document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus && !stack.length) { try { lastFocus.focus(); } catch (e) { /* ignore */ } }
  }
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape' || !stack.length) return;
    const top = stack[stack.length - 1];
    if (top._dismiss) top._dismiss(); else closeModal(top);
  });
  $$('.modal').forEach(m => m.addEventListener('mousedown', e => {
    if (e.target === m) { if (m._dismiss) m._dismiss(); else closeModal(m); }
  }));
  $$('[data-close]').forEach(b => b.addEventListener('click', () => closeModal(b.closest('.modal'))));

  function confirmDialog({ title, text, ok = 'Confirm' }) {
    return new Promise(res => {
      const m = $('#confirmModal');
      $('#confirmTitle').textContent = title;
      $('#confirmText').textContent = text;
      $('#confirmOk').textContent = ok;
      const finish = v => { $('#confirmOk').onclick = null; $('#confirmCancel').onclick = null; m._dismiss = null; closeModal(m); res(v); };
      $('#confirmOk').onclick = () => finish(true);
      $('#confirmCancel').onclick = () => finish(false);
      m._dismiss = () => finish(false);
      openModal(m);
      $('#confirmCancel').focus();
    });
  }

  /* ================= Confetti ================= */
  const confetti = (() => {
    const c = $('#confetti');
    const ctx = c.getContext ? c.getContext('2d') : null;
    let parts = [], raf = null, spawnUntil = 0, W = 0, H = 0, dpr = 1;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = c.width = Math.floor(innerWidth * dpr); H = c.height = Math.floor(innerHeight * dpr);
    }
    function palette() {
      const a = getComputedStyle(root).getPropertyValue('--accent').trim() || '#ff5a36';
      const b = getComputedStyle(root).getPropertyValue('--accent-2').trim() || '#ffb100';
      return [a, b, '#ffffff', '#ffd166', '#06d6a0', '#ef476f', '#4cc9f0'];
    }
    function burst(x, y, n, ang, spread, power) {
      const cols = palette();
      for (let i = 0; i < n; i++) {
        const a = ang + (Math.random() - .5) * spread, v = power * (.55 + Math.random() * .6);
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, w: (6 + Math.random() * 8) * dpr, h: (4 + Math.random() * 6) * dpr,
          rot: Math.random() * 6.28, vr: (Math.random() - .5) * .35, col: cols[Math.floor(Math.random() * cols.length)], circ: Math.random() < .22 });
      }
    }
    function rain(n) {
      const cols = palette();
      for (let i = 0; i < n; i++) {
        parts.push({ x: Math.random() * W, y: -20 * dpr, vx: (Math.random() - .5) * 2 * dpr, vy: (2 + Math.random() * 3) * dpr,
          w: (6 + Math.random() * 8) * dpr, h: (4 + Math.random() * 6) * dpr, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .25,
          col: cols[Math.floor(Math.random() * cols.length)], circ: Math.random() < .2 });
      }
    }
    function frame(ts) {
      ctx.clearRect(0, 0, W, H);
      if (ts < spawnUntil) rain(reduce ? 1 : 4);
      parts = parts.filter(p => p.y < H + 40 * dpr);
      parts.forEach(p => {
        p.vy += .22 * dpr; p.vx *= .992; p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.fillStyle = p.col;
        if (p.circ) { ctx.beginPath(); ctx.arc(0, 0, p.w / 2.4, 0, 6.28); ctx.fill(); }
        else ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (parts.length || ts < spawnUntil) raf = requestAnimationFrame(frame); else raf = null;
    }
    return {
      start() {
        if (!ctx) return;
        resize(); parts = [];
        const k = reduce ? .3 : 1;
        burst(0, H * .85, Math.floor(110 * k), -Math.PI / 3, .8, 26 * dpr);
        burst(W, H * .85, Math.floor(110 * k), -Math.PI * 2 / 3, .8, 26 * dpr);
        burst(W / 2, H * .5, Math.floor(80 * k), -Math.PI / 2, 2.4, 18 * dpr);
        spawnUntil = performance.now() + 4500;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(frame);
      },
      stop() { if (raf) cancelAnimationFrame(raf); raf = null; parts = []; if (ctx) ctx.clearRect(0, 0, c.width, c.height); },
      resize
    };
  })();
  window.addEventListener('resize', () => { if (!$('#celebrate').hidden) confetti.resize(); });

  /* ================= Celebration & rewards ================= */
  const rewardText = r => { const def = REWARDS.find(x => x.id === r.id); return (def ? def.icon : '🎁') + ' ' + r.label; };

  function renderRewardUI() {
    const d = today();
    $$('#rewardGrid .reward-btn').forEach(b => b.classList.toggle('on', !!d.reward && d.reward.id === b.dataset.reward));
    const input = $('#customReward');
    input.hidden = !(d.reward && d.reward.id === 'custom');
    $('#rewardSaved').textContent = d.reward ? `Locked in: ${rewardText(d.reward)}. Enjoy it — you earned it.` : '';
  }

  function showCelebration() {
    const s = streaks();
    $('#celQuote').textContent = '“' + rand(QUOTES) + '”';
    $('#celStreak').textContent = s.cur > 1 ? `🔥 ${s.cur}-day streak. Don't break the chain.` : '🔥 Day 1 of your streak. The chain starts now.';
    renderRewardUI();
    openModal($('#celebrate'));
    $('#celClose').focus();
    confetti.start(); fanfare();
  }
  function closeCelebration() {
    confetti.stop(); closeModal($('#celebrate'));
    renderToday(); renderCalendar(); renderHistory();
  }
  $('#celebrate')._dismiss = closeCelebration;

  $('#rewardGrid').addEventListener('click', e => {
    const b = e.target.closest('[data-reward]'); if (!b) return;
    const d = today(), id = b.dataset.reward, input = $('#customReward');
    if (id === 'custom') {
      input.hidden = false;
      if (!input.value) input.value = state.settings.customReward || '';
      d.reward = { id: 'custom', label: input.value.trim() || 'Custom treat' };
      renderRewardUI(); input.hidden = false; input.focus();
    } else {
      d.reward = { id, label: REWARDS.find(r => r.id === id).label };
      renderRewardUI();
    }
    chime([[880, .1, 0], [1175, .16, .08]]);
    save();
  });
  $('#customReward').addEventListener('input', e => {
    const v = e.target.value; state.settings.customReward = v.slice(0, 40);
    const d = today(); d.reward = { id: 'custom', label: v.trim() || 'Custom treat' };
    $('#rewardSaved').textContent = `Locked in: ${rewardText(d.reward)}. Enjoy it — you earned it.`;
    save();
  });
  $('#celClose').addEventListener('click', closeCelebration);
  $('#celSound').addEventListener('click', () => { state.settings.sound = !state.settings.sound; save(); applySound(); if (state.settings.sound) chime([[880, .12, 0]]); });
  $('#replayBtn').addEventListener('click', showCelebration);

  /* ================= Settings & data ================= */
  function buildSwatches() {
    $('#swatches').innerHTML = ACCENTS.map(c => `<button type="button" class="swatch" data-color="${c}" style="background:${c}" aria-label="Accent ${c}"></button>`).join('');
  }
  function download(name, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ================= Event wiring ================= */
  function wire() {
    $('#bathBtn').addEventListener('click', toggleBath);
    $$('[data-add]').forEach(b => b.addEventListener('click', () => addWater(+b.dataset.add)));
    $('#waterUndo').addEventListener('click', undoWater);
    ['skill', 'meditate'].forEach(n => {
      $('#' + n + 'Toggle').addEventListener('click', () => toggleTimer(n));
      $('#' + n + 'Reset').addEventListener('click', () => resetTimer(n));
    });

    $('#newQuote').addEventListener('click', () => { let i; do { i = Math.floor(Math.random() * QUOTES.length); } while (i === quoteIdx && QUOTES.length > 1); setQuote(i, true); });

    $('#themeBtn').addEventListener('click', () => { state.settings.theme = state.settings.theme === 'dark' ? 'light' : 'dark'; save(); applyTheme(); });
    $('#themeDark').addEventListener('click', () => { state.settings.theme = 'dark'; save(); applyTheme(); });
    $('#themeLight').addEventListener('click', () => { state.settings.theme = 'light'; save(); applyTheme(); });
    $('#settingsBtn').addEventListener('click', () => openModal($('#settingsModal')));
    $('#swatches').addEventListener('click', e => { const b = e.target.closest('.swatch'); if (!b) return; state.settings.accent = b.dataset.color; save(); applyAccent(); });
    $('#accentCustom').addEventListener('input', e => { state.settings.accent = e.target.value; save(); applyAccent(); });
    $('#soundCheck').addEventListener('change', e => { state.settings.sound = e.target.checked; save(); applySound(); });
    $('#testSound').addEventListener('click', () => { const was = state.settings.sound; state.settings.sound = true; fanfare(); state.settings.sound = was; });

    // calendar
    $('#calPrev').addEventListener('click', () => { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCalendar(); });
    $('#calNext').addEventListener('click', () => { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCalendar(); });
    $('#calToday').addEventListener('click', () => { const n = new Date(); view = { y: n.getFullYear(), m: n.getMonth() }; selected = TODAY; renderCalendar(); });
    $('#calGrid').addEventListener('click', e => { const b = e.target.closest('.cal-cell[data-key]'); if (!b || b.disabled) return; selected = b.dataset.key; renderCalendar(); });
    $('#historyList').addEventListener('click', e => {
      const li = e.target.closest('li[data-key]'); if (!li) return;
      selected = li.dataset.key; const d = parseKey(selected); view = { y: d.getFullYear(), m: d.getMonth() };
      renderCalendar(); $('#calendar').scrollIntoView({ behavior: 'smooth' });
    });

    // data
    $('#exportBtn').addEventListener('click', () => { download(`nozero-backup-${TODAY}.json`, JSON.stringify(state, null, 2)); toast('Backup downloaded.'); });
    $('#importBtn').addEventListener('click', () => $('#importFile').click());
    $('#importFile').addEventListener('change', e => {
      const file = e.target.files && e.target.files[0]; e.target.value = '';
      if (!file) return;
      const rd = new FileReader();
      rd.onload = async () => {
        let parsed;
        try { parsed = JSON.parse(String(rd.result)); } catch (err) { toast('That file is not valid JSON.'); return; }
        if (!parsed || typeof parsed !== 'object' || !parsed.days) { toast('That does not look like a NoZero backup.'); return; }
        const next = normalize(parsed);
        const ok = await confirmDialog({ title: 'Replace all data?', text: `This replaces your current history with the backup (${Object.keys(next.days).length} days).`, ok: 'Import backup' });
        if (!ok) return;
        state = next; ensureDay(TODAY); save(); applyTheme(); applyAccent(); applySound(); renderAll(); toast('Backup imported.');
      };
      rd.readAsText(file);
    });
    $('#resetTodayBtn').addEventListener('click', async () => {
      const ok = await confirmDialog({ title: "Reset today's progress?", text: 'Bath, water, and both timers go back to zero. Your history stays.', ok: 'Reset today' });
      if (!ok) return;
      const old = today(), fresh = emptyDay();
      fresh.celebrated = old.celebrated; fresh.reward = old.reward; fresh.completedAt = old.completedAt;
      state.days[TODAY] = fresh; save(); renderAll(); toast("Today's progress reset.");
    });
    $('#resetAllBtn').addEventListener('click', async () => {
      const ok = await confirmDialog({ title: 'Erase ALL history?', text: 'Every day, streak, session and reward will be permanently deleted. This cannot be undone. Export a backup first if you might want it.', ok: 'Erase everything' });
      if (!ok) return;
      state.days = {}; ensureDay(TODAY); selected = TODAY; save(); renderAll(); toast('All history erased. Fresh start.');
    });

    window.addEventListener('storage', e => { if (e.key === KEY) { state = load(); ensureDay(TODAY); applyTheme(); applyAccent(); applySound(); renderAll(); } });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  }

  /* ================= Tick ================= */
  function tick() {
    if (todayKey() !== TODAY) {
      rollover(); selected = TODAY;
      const n = new Date(); view = { y: n.getFullYear(), m: n.getMonth() };
      setQuote(Math.floor(Math.random() * QUOTES.length), false);
      renderAll(); toast('☀️ New day. Zero is not an option.');
      return;
    }
    const now = Date.now();
    renderToday(now);
    checkHits(now);
    const done = isDone(today(), now);
    if (done !== lastDone) { lastDone = done; renderStats(); renderCalendar(); renderHistory(); }
    checkComplete();
  }

  /* ================= Init ================= */
  buildSwatches();
  applyTheme(); applyAccent(); applySound();
  rollover(); ensureDay(TODAY);
  save();
  setQuote(dayNum(TODAY) % QUOTES.length, false);
  wire();
  renderAll();
  setInterval(tick, 250);

  // Expose a tiny debug hook (read-only helpers) for testing
  window.__nozero = { get state() { return state; }, tick, isDone: k => isDone(state.days[k]), streaks };
})();
