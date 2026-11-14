(() => {
  'use strict';

  /* =========================== CONFIG =========================== */
  const POOLS = window.REBUS_POOLS;
  const TIERS = [
    { key: 'easy', name: 'Starter' },
    { key: 'medium', name: 'Tricky' },
    { key: 'hard', name: 'Brain-bender' },
  ];
  const EPOCH = Date.UTC(2026, 10, 12);   // Rebusday #1 (local calendar date)
  const MAX_WRONG = 3;
  const MAX_HINTS = 2;
  const KEY = 'rebusday:v1:';
  const TINTS = ['#fdfaf3', '#f5f8fc', '#f9f5fc', '#f3faf5', '#fcf6f1', '#f7f7f2'];

  /* =========================== UTILS ============================ */
  const $ = s => document.querySelector(s);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v ? JSON.parse(v) : d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };
  function hash(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ c, 2654435761);
      h2 = Math.imul(h2 ^ c, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    return h1 >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, r) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const titleCase = s => s.replace(/(^|[\s-])([a-z])/g, (m, p, c) => p + c.toUpperCase());
  const fmtTime = ms => {
    const s = Math.max(0, Math.round(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
  };

  /* ======================== SCHEDULING ========================== */
  function todayIndex() {
    const n = new Date();
    return Math.max(0, Math.round((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - EPOCH) / 864e5));
  }
  const permCache = {};
  const perm = (k, len) => permCache[k] || (permCache[k] = shuffle([...Array(len).keys()], rng(hash('rebusday|' + k))));
  // Each tier walks its pool batch by batch: batch 1 in a shuffled order,
  // then batch 2, and so on (see REBUS_BATCHES in puzzles.js). New batches
  // are only ever appended, so days already played never change. Once
  // every batch is used up, the whole pool is reshuffled for each new
  // cycle. Pools have different sizes, so the same three puzzles don't
  // land on the same day again for a very long time.
  function pickFor(tier, n) {
    const pool = POOLS[tier];
    const marks = ((window.REBUS_BATCHES || {})[tier] || []).filter(m => m > 0 && m < pool.length);
    const bounds = [...new Set([...marks, pool.length])].sort((a, b) => a - b);
    let start = 0;
    for (let b = 0; b < bounds.length; b++) {
      const len = bounds[b] - start;
      if (n < len) return pool[start + perm(b === 0 ? tier + ':0' : tier + ':batch' + (b + 1), len)[n]];
      n -= len;
      start = bounds[b];
    }
    const cycle = 1 + Math.floor(n / pool.length);
    return pool[perm(tier + ':' + cycle, pool.length)[n % pool.length]];
  }
  const puzzlesForDay = d => TIERS.map(t => pickFor(t.key, d));

  /* ========================= RENDERER =========================== */
  const LAYOUTS = ['vert', 'vup', 'grow', 'shrink', 'scatter', 'fall', 'rise', 'wave', 'split', 'ring', 'cross'];
  const EMOJI_RE = /\p{Extended_Pictographic}/u;
  const COLOR_FX = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'gray', 'brown'];

  const SVGNS = 'http://www.w3.org/2000/svg';
  function doodleEl(name, tinted) {
    const d = (window.DOODLES || {})[name];
    if (!d) return null;
    const svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '-6 -6 112 112');
    svg.setAttribute('class', 'dd m');
    svg.setAttribute('aria-hidden', 'true');
    const g = document.createElementNS(SVGNS, 'g');
    g.setAttribute('filter', 'url(#rough)');
    svg.append(g);
    for (let s of d.p) {
      let pre = '*^&#%-=!'.includes(s[0]) ? s[0] : '';
      if (pre) s = s.slice(1);
      const p = document.createElementNS(SVGNS, 'path');
      const accent = { '*': d.c, '^': d.c2, '&': d.c3, '-': d.c }[pre];
      let fill = 'none', stroke = 'currentColor', width = 4.2, filled = false;
      if (pre === '#') { fill = 'currentColor'; filled = true; }
      else if (pre === '%') { fill = '#ffffff'; filled = true; }
      else if (pre && '*^&-'.includes(pre)) { fill = tinted ? 'currentColor' : (accent || '#dddddd'); filled = true; if (tinted) p.setAttribute('fill-opacity', '0.3'); }
      if (pre === '-') stroke = 'none';
      if (pre === '=') { stroke = tinted ? 'currentColor' : d.c; width = 11; }
      if (pre === '!') stroke = d.s || '#2f6fd6';
      p.setAttribute('d', s);
      p.setAttribute('fill', fill);
      p.setAttribute('fill-rule', 'evenodd');
      p.setAttribute('stroke', stroke);
      p.setAttribute('stroke-width', width);
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('pathLength', '1');
      if (filled) p.setAttribute('class', 'fl');
      g.append(p);
    }
    return svg;
  }

  // Stagger the "drawing" of each piece so the rebus sketches itself.
  function schedule(wrap) {
    const segs = [...wrap.querySelectorAll('.seg')];
    const paths = wrap.querySelectorAll('.dd path').length;
    const plain = segs.filter(s => !s.classList.contains('has-dd')).length;
    const k = Math.min(1, 2.2 / Math.max(0.01, paths * 0.1 + plain * 0.14));
    let t = 0.1;
    segs.forEach(s => {
      if (s.classList.contains('has-dd')) {
        s.querySelectorAll('path').forEach(p => { p.style.setProperty('--d', t.toFixed(2) + 's'); t += 0.1 * k; });
        t += 0.06 * k;
      } else {
        s.style.setProperty('--d', t.toFixed(2) + 's');
        t += 0.14 * k;
      }
    });
  }

  function renderRebus(grid, stage, seed, sketch) {
    const r = rng(seed);
    stage.innerHTML = '';
    stage.classList.toggle('sketch', !!sketch && !matchMedia('(prefers-reduced-motion: reduce)').matches);
    const wrap = el('div', 'rb-wrap');
    for (const raw of grid.split('\n')) {
      const row = raw.trim();
      if (row === '---') { wrap.append(el('div', 'rb-rule m')); continue; }
      if (row === '.') { wrap.append(el('div', 'rb-space m')); continue; }
      const rowEl = el('div', 'rb-row');
      for (const tok of row.split(/\s+/)) {
        const t = el('span', 'rb-tok');
        for (const seg of tok.split('+')) t.append(renderSeg(seg, r));
        rowEl.append(t);
      }
      wrap.append(rowEl);
    }
    stage.append(wrap);
    if (stage.classList.contains('sketch')) schedule(wrap);
    fit(stage);
  }

  // Animated effects wrap the piece in a moving host, so they never clash
  // with the sketch-in animation on the piece itself.
  const ANIMS = ['shake', 'spin', 'bounce', 'leap', 'blink', 'wink', 'pop', 'beat', 'swing', 'rock', 'drive', 'zoom',
    'crawl', 'fly', 'buzz', 'sink', 'rising', 'drop', 'drift', 'squeeze', 'squish', 'pushr', 'pushl', 'press', 'roll'];
  function renderSeg(seg, r) {
    const m = seg.match(/^(.*?)(?:\[([\w,]+)\])?$/);
    const fx = m[2] ? m[2].split(',') : [];
    const an = fx.filter(f => ANIMS.includes(f));
    if (!an.length) return renderSegCore(seg, r);
    const rest = fx.filter(f => !ANIMS.includes(f));
    const inner = renderSegCore(m[1] + (rest.length ? `[${rest.join(',')}]` : ''), r);
    const host = el('span', 'an-host an-' + an[0]);
    if (['drop', 'buzz', 'drive', 'blink'].includes(an[0])) host.style.animationDelay = (-r() * 1.6).toFixed(2) + 's';
    host.append(inner);
    return host;
  }

  function renderSegCore(seg, r) {
    const m = seg.match(/^(.*?)(?:\[([\w,]+)\])?$/);
    let text = m[1].replace(/~/g, ' ');
    const fx = m[2] ? m[2].split(',') : [];
    let chars = Array.from(text);
    if (fx.includes('rev')) { chars = chars.reverse(); text = chars.join(''); }

    const s = el('span', 'seg m');
    fx.forEach(f => s.classList.add('fx-' + f));
    if (text.startsWith('@')) {
      const tinted = fx.some(f => COLOR_FX.includes(f));
      const svg = doodleEl(text.slice(1).toLowerCase(), tinted);
      if (svg) {
        s.classList.add('has-dd');
        s.append(svg);
        return s;
      }
    }
    if (EMOJI_RE.test(text)) s.classList.add('emoji');
    if (fx.includes('long')) s.dataset.sx = '1.9';
    if (fx.includes('tall')) s.dataset.sy = '1.9';
    if (fx.includes('squash')) s.dataset.sy = '0.5';

    const letter = c => el('span', 'ch m', c);
    const n = chars.length;
    const layout = fx.find(f => LAYOUTS.includes(f));

    switch (layout) {
      case 'vert':
      case 'vup':
        s.classList.add('lay-col');
        if (layout === 'vup') s.classList.add('rev');
        chars.forEach(c => s.append(letter(c)));
        break;
      case 'grow':
      case 'shrink':
        s.classList.add('lay-row');
        chars.forEach((c, i) => {
          const k = n > 1 ? i / (n - 1) : 1;
          const t = layout === 'grow' ? k : 1 - k;
          const l = letter(c);
          l.style.fontSize = (0.45 + 1.25 * t) + 'em';
          s.append(l);
        });
        break;
      case 'scatter':
        s.classList.add('lay-row');
        chars.forEach((c, i) => {
          const l = letter(c);
          const rot = (r() - 0.5) * 70, dy = (r() - 0.5) * 0.6, dx = (i ? 0.08 + r() * 0.12 : 0);
          l.style.transform = `translateY(${dy}em) rotate(${rot}deg)`;
          l.style.marginLeft = dx + 'em';
          s.append(l);
        });
        break;
      case 'fall':
      case 'rise':
        s.classList.add('lay-row');
        chars.forEach((c, i) => {
          const l = letter(c);
          const dir = layout === 'fall' ? 1 : -1;
          l.style.transform = `translateY(${dir * i * 0.4}em) rotate(${dir * i * 4}deg)`;
          s.append(l);
        });
        break;
      case 'wave':
        s.classList.add('lay-row');
        chars.forEach((c, i) => {
          const l = letter(c);
          l.style.transform = `translateY(${Math.sin(i * 1.1) * 0.25}em)`;
          s.append(l);
        });
        break;
      case 'split': {
        s.classList.add('lay-row');
        const half = Math.ceil(n / 2);
        chars.forEach((c, i) => {
          if (i === half) s.append(el('span', 'gap'));
          s.append(letter(c));
        });
        break;
      }
      case 'ring': {
        s.classList.add('lay-ring');
        const R = Math.max(1.1, n * 0.26);
        s.style.width = s.style.height = (2 * R + 1.1) + 'em';
        chars.forEach((c, i) => {
          const l = letter(c);
          l.style.transform = `translate(-50%,-50%) rotate(${(i * 360) / n}deg) translateY(-${R}em)`;
          s.append(l);
        });
        break;
      }
      case 'cross': {
        s.classList.add('lay-cross');
        const mid = Math.floor((n - 1) / 2);
        s.style.gridTemplateColumns = `repeat(${n}, .86em)`;
        s.style.gridTemplateRows = `repeat(${n}, 1em)`;
        chars.forEach((c, i) => {
          const a = letter(c);
          a.style.gridRow = mid + 1; a.style.gridColumn = i + 1;
          s.append(a);
          if (i !== mid) {
            const b = letter(c);
            b.style.gridColumn = mid + 1; b.style.gridRow = i + 1;
            s.append(b);
          }
        });
        break;
      }
      default:
        s.textContent = text;
    }
    return s;
  }

  // Scale and centre the drawing so whatever was drawn fits the stage.
  function fit(stage) {
    const wrap = stage.querySelector('.rb-wrap');
    if (!wrap) return;
    const sr = stage.getBoundingClientRect();
    if (!sr.width) return;
    // Base size follows the card width, and we only shrink to fit, never
    // grow, so "big" and "small" effects keep their meaning.
    wrap.style.fontSize = Math.round(sr.width / 9.5) + 'px';
    wrap.style.transform = 'none';
    wrap.querySelectorAll('[data-sx],[data-sy]').forEach(e => {
      e.style.transform = 'none'; e.style.margin = '';
      const sx = +e.dataset.sx || 1, sy = +e.dataset.sy || 1;
      const w = e.offsetWidth, h = e.offsetHeight;
      e.style.margin = `${((sy - 1) * h) / 2}px ${((sx - 1) * w) / 2}px`;
      e.style.transform = `scale(${sx}, ${sy})`;
    });
    let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
    wrap.querySelectorAll('.m').forEach(e => {
      const r = e.getBoundingClientRect();
      if (!r.width && !r.height) return;
      L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom);
    });
    if (!isFinite(L)) return;
    const pad = Math.max(14, sr.width * 0.08);
    const s = Math.min(1, (sr.width - 2 * pad) / (R - L), (sr.height - 2 * pad) / (B - T));
    const wr = wrap.getBoundingClientRect();
    const cx = (L + R) / 2, cy = (T + B) / 2;
    wrap.style.transformOrigin = `${cx - wr.left}px ${cy - wr.top}px`;
    wrap.style.transform = `translate(${sr.left + sr.width / 2 - cx}px, ${sr.top + sr.height / 2 - cy}px) scale(${s})`;
  }
  const refitAll = () => document.querySelectorAll('.stage').forEach(fit);

  /* ======================= ANSWER CHECKING ====================== */
  // Only the exact answer counts. Case, spacing and punctuation are ignored
  // ("Back-Fire" = "backfire"), but synonyms, extra words and near-misses
  // are wrong guesses and cost a life.
  function norm(s) {
    return s.toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9]+/g, '');
  }

  /* ========================== STATE ============================= */
  const fresh = () => ({ wrong: [], hints: 0, status: 'playing', ms: 0, run: null, go: false });
  let mode = 'daily';
  let dayNo = 0;
  let puzzles = [];
  let state = null;
  let cur = 0;

  const params = new URLSearchParams(location.search);
  const forcedDay = params.has('day') ? Math.max(1, parseInt(params.get('day'), 10) || 1) - 1 : null;

  function loadDaily() {
    mode = 'daily';
    dayNo = forcedDay ?? todayIndex();
    puzzles = puzzlesForDay(dayNo);
    state = store.get('day:' + dayNo, null);
    if (!state || !Array.isArray(state.p) || state.p.length !== puzzles.length) {
      state = { cur: 0, p: puzzles.map(fresh), t0: Date.now(), t1: null, counted: false };
    }
    state.p.forEach(p => { p.run = null; });
    saveDaily();
    $('#practiceBanner').hidden = true;
    $('#steps').hidden = false;
    $('#dayLabel').textContent = `No. ${dayNo + 1} · ` +
      new Date(EPOCH + dayNo * 864e5).toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
    const tint = TINTS[hash('tint' + dayNo) % TINTS.length];
    document.documentElement.style.setProperty('--stage-tint', tint);
    show(firstUnresolved() ?? state.cur ?? 0, false);
  }
  const saveDaily = () => { if (mode === 'daily') store.set('day:' + dayNo, state); };
  const firstUnresolved = () => { const i = state.p.findIndex(p => p.status === 'playing'); return i < 0 ? null : i; };
  const dayDone = () => mode === 'daily' && state.p.every(p => p.status !== 'playing');

  /* Scoring: the day starts on 1000 points and every slip costs a little.
     The clock starts when you press Play and only runs while a puzzle is on
     screen (it pauses on the start screen or if you leave the page). */
  const SCORE = { start: 1000, wrong: 50, hints: [0, 50, 150], fail: 250, perSec: 1, timeCap: 250 };
  const elapsed = ps => (ps.ms || 0) + (ps.run ? Date.now() - ps.run : 0);
  const timePen = ps => Math.min(SCORE.timeCap, Math.floor(elapsed(ps) / 1000) * SCORE.perSec);
  const penalty = ps => SCORE.wrong * ps.wrong.length + SCORE.hints[Math.min(ps.hints, 2)] +
    (ps.status === 'failed' ? SCORE.fail : 0) + timePen(ps);
  const dayScore = () => Math.max(0, SCORE.start - state.p.reduce((t, p) => t + penalty(p), 0));
  const totalTime = () => state.p.reduce((t, p) => t + elapsed(p), 0);

  function clockPause(ps) {
    if (ps && ps.run) { ps.ms = (ps.ms || 0) + Date.now() - ps.run; ps.run = null; }
  }
  function clockStart() {
    const ps = state.p[cur];
    if (!ps || ps.status !== 'playing') return;
    if (!ps.go) { ps.go = true; }
    if (!ps.run && !document.hidden) { ps.run = Date.now(); saveDaily(); }
    renderScorebar();
  }
  function renderScorebar() {
    const ps = state.p[cur];
    if (!ps) return;
    const clock = $('#clock');
    clock.textContent = '⏱ ' + fmtTime(elapsed(ps));
    clock.classList.toggle('idle', !ps.go && ps.status === 'playing');
    clock.title = 'Time on this puzzle';
    const sc = $('#scoreNow');
    sc.hidden = mode !== 'daily';
    if (mode === 'daily') sc.textContent = `${dayScore()} pts`;
  }
  setInterval(() => { if (state && state.p && state.p[cur] && state.p[cur].run) renderScorebar(); }, 500);
  const square = ps => ps.status === 'solved' ? (ps.wrong.length || ps.hints ? '🟨' : '🟩') : '🟥';

  /* ========================== VIEW ============================== */
  const stageEl = $('#stage'), slotsEl = $('#slots'), guessEl = $('#guess'), formEl = $('#guessForm');

  function show(i, animate = true) {
    if (cur !== i) clockPause(state.p[cur]);
    cur = i;
    // The clock runs whenever a puzzle is on screen (after pressing Play).
    { const ps = state.p[i]; if (ps.status === 'playing' && !ps.run && !document.hidden && $('#start').hidden) { ps.go = true; ps.run = Date.now(); } }
    if (revealArmed) disarmReveal();
    if (mode === 'daily') { state.cur = i; saveDaily(); }
    const pz = puzzles[i], ps = state.p[i];
    guessEl.value = '';
    renderRebus(pz.g, stageEl, hash(pz.a), animate);
    renderSteps();
    renderSlots();
    renderMeta();
    renderPracticeBtn();
    renderScorebar();
    const over = ps.status !== 'playing';
    $('#playArea').hidden = over;
    $('#result').hidden = !over;
    if (over) renderResult();
    else if ($('#start').hidden && matchMedia('(pointer: fine)').matches) guessEl.focus({ preventScroll: true });
  }

  function renderSteps() {
    const nav = $('#steps');
    nav.innerHTML = '';
    if (mode !== 'daily') return;
    TIERS.forEach((t, i) => {
      const ps = state.p[i];
      const b = el('button', 'step');
      b.type = 'button';
      if (i === cur) b.classList.add('active');
      if (ps.status === 'solved') b.classList.add(ps.wrong.length || ps.hints ? 'helped' : 'solved');
      if (ps.status === 'failed') b.classList.add('failed');
      const icon = ps.status === 'solved' ? ' ✓' : ps.status === 'failed' ? ' ✗' : '';
      b.append(document.createTextNode(`${i + 1}. ${t.name}${icon}`));
      b.append(el('small', '', ps.status === 'playing' ? (i === cur ? 'Now playing' : 'Unsolved') : `${fmtTime(elapsed(ps))} · −${penalty(ps)}`));
      b.addEventListener('click', () => show(i));
      nav.append(b);
    });
  }

  // Letter boxes gave away word count and length, so the answer area stays
  // hidden. Kept as a function in case boxes come back as an option.
  function renderSlots() {
    slotsEl.hidden = true;
  }
  function renderSlotsLegacy() {
    const pz = puzzles[cur], ps = state.p[cur];
    const typed = Array.from(guessEl.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
    const over = ps.status !== 'playing';
    slotsEl.innerHTML = '';
    let k = 0;
    const locked = ps.locked || [];
    pz.a.toUpperCase().split(' ').forEach((word, wi) => {
      const w = el('div', 'word');
      if (locked.includes(wi) && !over) w.classList.add('locked');
      let first = true;
      for (const c of Array.from(word)) {
        if (/[A-Z0-9]/.test(c)) {
          const s = el('span', 'slot');
          if (over) { s.textContent = c; s.classList.add(ps.status); }
          else if (typed[k]) { s.textContent = typed[k]; s.classList.add('typed'); }
          else if (locked.includes(wi)) { s.textContent = c; s.classList.add('lock'); }
          else if (ps.hints >= 2 && first) { s.textContent = c; s.classList.add('revealed'); }
          w.append(s);
          k++; first = false;
        } else {
          w.append(el('span', 'punct', c));
          if (c === '-') first = true;
        }
      }
      slotsEl.append(w);
    });
  }

  function renderMeta() {
    const pz = puzzles[cur], ps = state.p[cur];
    const clue = $('#clue');
    clue.hidden = ps.hints < 1 && ps.status === 'playing';
    $('#clueText').textContent = '💡 ' + pz.h;
    const initials = $('#clueInitials');
    initials.hidden = ps.hints < 2 || ps.status !== 'playing';
    initials.textContent = 'First letters: ' + pz.a.split(/[\s-]+/).filter(w => /[a-z0-9]/i.test(w))
      .map(w => w.replace(/[^a-z0-9]/gi, '')[0].toUpperCase() + '…').join('  ');
    const needScratch = !clue.hidden && ps.status === 'playing' && !ps.scratched;
    if (needScratch) initScratch(); else $('#scratch').hidden = true;

    const wl = $('#wrongList');
    wl.innerHTML = '';
    if (ps.status === 'playing') {
      const words = pz.a.toUpperCase().split(' ');
      (ps.locked || []).slice().sort((a, b) => a - b)
        .forEach(i => wl.append(el('span', 'lock-chip', `🔒 word ${i + 1}: ${words[i]}`)));
    }
    ps.wrong.forEach(g => wl.append(el('span', 'wrong-chip', g)));

    const lives = $('#lives');
    lives.innerHTML = '';
    for (let i = 0; i < MAX_WRONG; i++) lives.append(el('span', 'life' + (i < ps.wrong.length ? ' lost' : '')));

    const hb = $('#hintBtn');
    hb.disabled = ps.hints >= MAX_HINTS;
    hb.textContent = ps.hints === 0 ? '💡 Clue' : ps.hints === 1 ? '🔤 First letters' : 'No hints left';
  }

  function renderResult() {
    const pz = puzzles[cur], ps = state.p[cur];
    const t = $('#resultTitle');
    const perfect = ps.status === 'solved' && !ps.wrong.length && !ps.hints;
    t.className = 'result-title ' + (ps.status === 'solved' ? 'good' : 'bad');
    const took = fmtTime(elapsed(ps));
    t.textContent = ps.status === 'solved'
      ? `${perfect ? 'Perfect!' : 'Solved!'} ${took}` + (mode === 'daily' ? ` · −${penalty(ps)} pts` : '')
      : 'The answer was';
    $('#resultAnswer').textContent = titleCase(pz.a);
    $('#resultWhy').textContent = pz.why;
    const next = $('#nextBtn');
    if (mode === 'practice') {
      const left = practiceLeft();
      next.textContent = left ? `Another one → (${left} left today)` : 'Back to today';
    }
    else if (dayDone()) next.textContent = 'See your results';
    else next.textContent = 'Next puzzle →';
  }

  /* ========================= ACTIONS ============================ */
  function submit(e) {
    e.preventDefault();
    const pz = puzzles[cur], ps = state.p[cur];
    if (ps.status !== 'playing') return;
    const raw = guessEl.value.trim();
    const g = norm(raw);
    if (!g) return;
    clockStart();
    if (g === norm(pz.a)) return resolve('solved');
    if (ps.wrong.some(w => norm(w) === g)) { toast('Already tried that one'); return; }

    ps.wrong.push(raw);
    formEl.classList.remove('shake'); void formEl.offsetWidth; formEl.classList.add('shake');
    guessEl.value = '';
    if (ps.wrong.length >= MAX_WRONG) return resolve('failed');

    // Lock in any word that's right and in the right place.
    const clean = w => w.toLowerCase().replace(/[^a-z0-9]/g, '');
    const ansWords = pz.a.split(' ').map(clean);
    const gWords = raw.split(/\s+/).map(clean).filter(Boolean);
    ps.locked = ps.locked || [];
    let gained = 0;
    if (ansWords.length > 1) ansWords.forEach((w, i) => {
      if (gWords[i] === w && !ps.locked.includes(i)) { ps.locked.push(i); gained++; }
    });
    const last = ps.wrong.length === MAX_WRONG - 1 ? ' Last guess!' : '';
    toast(gained ? `Not quite, but ${gained} word${gained > 1 ? 's' : ''} locked in.${last}` : `Not quite.${last}`);
    saveDaily();
    renderSlots(); renderMeta();
  }

  function resolve(status) {
    const ps = state.p[cur];
    clockPause(ps);
    ps.status = status;
    if (status === 'solved') {
      confetti();
      const m = $('#mascot');
      if (m) { m.classList.remove('cheer'); void m.getBoundingClientRect(); m.classList.add('cheer'); }
    }
    if (dayDone() && !state.t1) state.t1 = Date.now();
    saveDaily();
    if (dayDone()) recordDay();
    show(cur, false);
  }

  function hint() {
    const ps = state.p[cur];
    if (ps.status !== 'playing' || ps.hints >= MAX_HINTS) return;
    clockStart();
    ps.hints++;
    saveDaily();
    renderSlots(); renderMeta();
  }

  // Two-tap confirm (browser confirm() dialogs are blocked in embedded frames).
  let revealArmed = null;
  function disarmReveal() {
    clearTimeout(revealArmed); revealArmed = null;
    $('#giveUpBtn').textContent = 'Reveal';
  }
  function giveUp() {
    if (state.p[cur].status !== 'playing') return;
    if (!revealArmed) {
      $('#giveUpBtn').textContent = 'Tap again to reveal';
      revealArmed = setTimeout(disarmReveal, 3000);
      return;
    }
    disarmReveal();
    clockStart();
    resolve('failed');
  }

  function next() {
    if (mode === 'practice') {
      if (!practiceLeft()) {
        toast(`That's all ${PRACTICE_LIMIT} warm-ups for today. More tomorrow!`);
        return loadDaily();
      }
      addPractice();
      return show(puzzles.length - 1);
    }
    const u = firstUnresolved();
    if (u != null) return show(u);
    openStats();
  }

  /* ======================= SCRATCH CARD ========================= */
  const scratchEl = $('#scratch');
  let scratchCtx = null, scratching = false, lastPt = null, moves = 0;
  function initScratch() {
    scratchEl.hidden = false;
    scratchEl.classList.remove('gone');
    const r = $('#clue').getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    scratchEl.width = Math.max(1, Math.round(r.width * dpr));
    scratchEl.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = scratchCtx = scratchEl.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, r.width, r.height);
    g.addColorStop(0, '#d9dde3'); g.addColorStop(0.45, '#f4f6f8'); g.addColorStop(0.55, '#c2c8d0'); g.addColorStop(1, '#e3e6ea');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, r.width, r.height);
    ctx.fillStyle = 'rgba(60,66,80,.18)';
    for (let x = 6; x < r.width; x += 9) for (let y = 6; y < r.height; y += 9) ctx.fillRect(x, y, 1.4, 1.4);
    ctx.fillStyle = '#4a5160';
    ctx.font = '700 13px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('✦ Scratch to reveal your clue ✦', r.width / 2, r.height / 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 26;
  }
  function scratchAt(e) {
    const r = scratchEl.getBoundingClientRect();
    const pt = { x: e.clientX - r.left, y: e.clientY - r.top };
    const ctx = scratchCtx;
    ctx.beginPath();
    ctx.moveTo((lastPt || pt).x, (lastPt || pt).y);
    ctx.lineTo(pt.x + 0.1, pt.y);
    ctx.stroke();
    lastPt = pt;
    if (++moves % 6 === 0) checkScratch();
  }
  function checkScratch() {
    const { width: w, height: h } = scratchEl;
    const data = scratchCtx.getImageData(0, 0, w, h).data;
    let clear = 0, total = 0;
    for (let i = 3; i < data.length; i += 4 * 23) { total++; if (data[i] < 40) clear++; }
    if (clear / total > 0.45) finishScratch();
  }
  function finishScratch() {
    if (scratchEl.hidden || scratchEl.classList.contains('gone')) return;
    scratchEl.classList.add('gone');
    const ps = state.p[cur];
    ps.scratched = true;
    saveDaily();
    setTimeout(() => { scratchEl.hidden = true; }, 400);
  }
  scratchEl.addEventListener('pointerdown', e => {
    scratching = true; lastPt = null;
    scratchEl.setPointerCapture(e.pointerId);
    scratchAt(e);
  });
  scratchEl.addEventListener('pointermove', e => { if (scratching) scratchAt(e); });
  const endScratch = () => { scratching = false; lastPt = null; if (!scratchEl.hidden) checkScratch(); };
  scratchEl.addEventListener('pointerup', endScratch);
  scratchEl.addEventListener('pointercancel', endScratch);
  scratchEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); finishScratch(); } });

  /* ========================= PRACTICE =========================== */
  const PRACTICE_LIMIT = 5;
  const practiceUsed = () => store.get('practice:' + todayIndex(), 0);
  const practiceLeft = () => Math.max(0, PRACTICE_LIMIT - practiceUsed());
  function renderPracticeBtn() {
    const b = $('#practiceBtn');
    if (!b) return;
    b.hidden = mode !== 'daily' || forcedDay != null;
    const left = practiceLeft();
    b.textContent = left ? `Warm up (${left} left today)` : 'Warm-ups used up for today';
    b.disabled = !left;
  }
  function updatePracticeBanner() {
    const left = practiceLeft();
    $('#practiceBanner span').textContent =
      `Warm-up: doesn't count toward your score · ${left} of ${PRACTICE_LIMIT} left today`;
  }
  function startPractice() {
    closeModals();
    if (!practiceLeft()) {
      toast(`You've used today's ${PRACTICE_LIMIT} warm-ups. More tomorrow!`);
      return;
    }
    if (mode === 'daily') { clockPause(state.p[cur]); saveDaily(); }
    mode = 'practice';
    puzzles = []; state = { p: [] };
    $('#practiceBanner').hidden = false;
    $('#steps').hidden = true;
    $('#dayLabel').textContent = 'Warm-up round';
    addPractice();
    show(0);
  }
  // Practice puzzles are a fixed set for each day (seeded by the date), so
  // after a reset the same practice puzzles come round again in the same order.
  // Always the same five warm-ups, kept out of the daily pools so they
  // can't spoil a future day (see REBUS_WARMUPS in puzzles.js).
  const practiceSet = () => window.REBUS_WARMUPS || [];
  function addPractice() {
    const list = practiceSet();
    const pz = list[Math.min(practiceUsed(), list.length - 1)];
    puzzles.push(pz);
    state.p.push(fresh());
    store.set('practice:' + todayIndex(), practiceUsed() + 1);
    updatePracticeBanner();
  }

  /* ========================== STATS ============================= */
  const defaultStats = () => ({ played: 0, streak: 0, max: 0, last: null, dist: [0, 0, 0, 0], perfect: 0, best: 0 });
  function recordDay() {
    if (state.counted || forcedDay != null) return;
    const s = Object.assign(defaultStats(), store.get('stats', {}));
    const solved = state.p.filter(p => p.status === 'solved').length;
    const score = dayScore();
    s.played++;
    s.dist[solved]++;
    if (state.p.every(p => square(p) === '🟩')) s.perfect++;
    s.streak = s.last === dayNo - 1 ? s.streak + 1 : 1;
    s.max = Math.max(s.max, s.streak);
    s.last = dayNo;
    s.best = Math.max(s.best, score);
    state.counted = true;
    store.set('stats', s);
    saveDaily();
    setTimeout(openStats, 1100);
  }

  let countdownTimer = null;
  function openStats() {
    const s = Object.assign(defaultStats(), store.get('stats', {}));
    const streak = s.last != null && s.last >= todayIndex() - 1 ? s.streak : 0;
    const body = $('#statsBody');
    body.innerHTML = '';

    if (mode === 'daily' && dayDone()) {
      const score = dayScore();
      const sum = el('div', 'summary');
      sum.append(el('h2', '', `Rebusday No. ${dayNo + 1}`));
      const big = el('div', 'big-score', String(score));
      big.append(el('small', '', ' / 1000'));
      sum.append(big);
      sum.append(el('div', 'squares', state.p.map(square).join('')));
      sum.append(el('div', 'result-why', `Total time ${fmtTime(totalTime())}`));
      const list = el('ul', 'summary-list');
      state.p.forEach((p, i) => {
        const li = el('li');
        li.append(el('span', 'tier', `${square(p)} ${TIERS[i].name} · ${fmtTime(elapsed(p))}`));
        li.append(el('span', 'ans', titleCase(puzzles[i].a)));
        list.append(li);
      });
      sum.append(list);
      body.append(sum);
    } else {
      body.append(el('h2', '', 'Statistics'));
    }

    body.append(el('h3', '', 'Your stats'));
    const grid = el('div', 'stat-grid');
    [[s.played, 'Played'], [streak, 'Current streak'], [s.max, 'Best streak'], [s.perfect, 'Perfect days']].forEach(([v, l]) => {
      const c = el('div'); c.append(el('b', '', String(v))); c.append(el('span', '', l)); grid.append(c);
    });
    body.append(grid);

    body.append(el('h3', '', 'Puzzles solved per day'));
    const dist = el('div', 'dist');
    const maxD = Math.max(1, ...s.dist);
    const todaySolved = mode === 'daily' && dayDone() ? state.p.filter(p => p.status === 'solved').length : -1;
    [3, 2, 1, 0].forEach(n => {
      const row = el('div', 'dist-row');
      row.append(el('span', '', `${n}/3`));
      const bar = el('div', 'dist-bar' + (n === todaySolved ? ' hi' : ''), String(s.dist[n]));
      bar.style.width = `max(26px, ${(s.dist[n] / maxD) * 100}%)`;
      row.append(bar);
      dist.append(row);
    });
    body.append(dist);

    if (mode === 'daily' && dayDone()) {
      body.append(el('h3', '', 'Next Rebusday in'));
      const cd = el('div', 'countdown');
      body.append(cd);
      const tick = () => {
        const n = new Date();
        const mid = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1);
        cd.textContent = fmtTime(mid - n);
        if (mid - n < 1000 && forcedDay == null) setTimeout(() => location.reload(), 1500);
      };
      tick();
      clearInterval(countdownTimer);
      countdownTimer = setInterval(tick, 1000);

      const acts = el('div', 'modal-actions');
      const share = el('button', 'btn primary', 'Share');
      share.addEventListener('click', doShare);
      const left = practiceLeft();
      const prac = el('button', 'btn ghost', left ? `Warm up (${left} left)` : 'Warm-ups used up');
      prac.disabled = !left;
      prac.addEventListener('click', startPractice);
      acts.append(share, prac);
      body.append(acts);
    } else if (mode === 'practice') {
      const acts = el('div', 'modal-actions');
      const back = el('button', 'btn primary', 'Back to today');
      back.addEventListener('click', () => { closeModals(); loadDaily(); });
      acts.append(back);
      body.append(acts);
    }
    const todayState = store.get('day:' + todayIndex(), null);
    const playedToday = todayState && Array.isArray(todayState.p) && todayState.p.some(p => p.status !== 'playing' || p.wrong.length || p.hints);
    if (forcedDay == null && (playedToday || practiceUsed() > 0)) {
      const reset = el('button', 'link-btn reset-btn', 'Reset today’s puzzles and warm-ups');
      reset.type = 'button';
      reset.addEventListener('click', () => {
        if (reset.dataset.armed) { closeModals(); resetToday(); return; }
        reset.dataset.armed = '1';
        reset.textContent = 'Tap again to reset (your stats are kept)';
      });
      body.append(reset);
    }
    $('#statsModal').showModal();
  }

  // Start today's set and practice again, e.g. to hand the phone to a friend.
  // Stats and streak are untouched: if today already counted, it won't count twice.
  function resetToday() {
    const d = todayIndex();
    const prev = store.get('day:' + d, null);
    store.set('day:' + d, { cur: 0, p: puzzlesForDay(d).map(fresh), t0: Date.now(), t1: null, counted: !!(prev && prev.counted) });
    store.set('practice:' + d, 0);
    loadDaily();
    toast('Fresh start! Today’s puzzles and warm-ups are reset.');
  }

  async function doShare() {
    const score = dayScore();
    const hints = state.p.reduce((t, p) => t + p.hints, 0);
    let text = `Rebusday No. ${dayNo + 1} · ${score}/1000\n${state.p.map(square).join('')}` +
      `\n⏱ ${fmtTime(totalTime())}${hints ? ` · 💡×${hints}` : ''}`;
    if (/^https?:/.test(location.protocol) && window.top === window) text += `\n${location.origin}${location.pathname}`;
    try {
      if (navigator.share && matchMedia('(pointer: coarse)').matches) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard!');
    } catch {
      const ta = el('textarea'); ta.value = text; document.body.append(ta); ta.select();
      try { document.execCommand('copy'); toast('Copied to clipboard!'); } catch { toast('Could not copy'); }
      ta.remove();
    }
  }

  /* ========================== EXTRAS ============================ */
  let toastTimer = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const box = el('div', 'confetti');
    const colors = ['#ff6b4a', '#2e9e57', '#2f6fd6', '#e0b000', '#8a4fd1', '#e8559a'];
    for (let i = 0; i < 36; i++) {
      const c = el('i');
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[i % colors.length];
      c.style.setProperty('--dx', (Math.random() - 0.5) * 200 + 'px');
      c.style.setProperty('--r', Math.random() * 720 + 'deg');
      c.style.animationDelay = Math.random() * 0.25 + 's';
      box.append(c);
    }
    document.body.append(box);
    setTimeout(() => box.remove(), 1900);
  }

  /* ======================== START SCREEN ======================== */
  function openStart() {
    closeModals();
    if (mode !== 'daily') loadDaily();
    else clockPause(state.p[cur]);
    saveDaily();
    const d = todayIndex();
    $('#startDate').textContent = `No. ${d + 1} · ` +
      new Date(EPOCH + d * 864e5).toLocaleDateString(undefined, { timeZone: 'UTC', weekday: 'long', month: 'long', day: 'numeric' });
    const s = Object.assign(defaultStats(), store.get('stats', {}));
    const streak = s.last != null && s.last >= d - 1 ? s.streak : 0;
    const started = state.p.some(p => p.go || p.status !== 'playing' || p.wrong.length || p.hints);
    const play = $('#startPlay'), status = $('#startStatus');
    // Streak text with the hand-drawn fire doodle instead of an emoji.
    const streakLine = (before, after) => {
      status.textContent = before;
      const fire = doodleEl('fire');
      if (fire) { fire.classList.add('streak-fire'); status.append(fire); }
      status.append(` ${streak}-day streak${after}`);
    };
    if (dayDone()) {
      play.textContent = 'See today’s results';
      if (streak) streakLine(`Done for today: ${dayScore()} / 1000 · `, '');
      else status.textContent = `Done for today: ${dayScore()} / 1000`;
    } else if (started) {
      const left = state.p.filter(p => p.status === 'playing').length;
      play.textContent = 'Continue';
      status.textContent = `${dayScore()} pts so far · ${left} puzzle${left > 1 ? 's' : ''} to go`;
    } else {
      play.textContent = 'Play';
      if (streak) streakLine('', '. Keep it going!');
      else status.textContent = 'The clock starts when you press Play.';
    }
    const left = practiceLeft();
    const warm = $('#startWarm');
    warm.textContent = left ? `Warm up (${left} left today)` : 'Warm-ups used up for today';
    warm.disabled = !left;
    document.body.classList.add('on-start');
    $('#start').hidden = false;
  }
  function closeStart() {
    $('#start').hidden = true;
    document.body.classList.remove('on-start');
    window.scrollTo(0, 0);
  }
  function startPlay() {
    closeStart();
    if (dayDone()) { show(cur, false); return openStats(); }
    show(firstUnresolved() ?? cur, true);
  }

  function openHelp() {
    $('#helpModal').showModal();
    document.querySelectorAll('[data-example]').forEach((st, i) => renderRebus(st.dataset.example, st, i + 1, true));
  }
  function closeModals() {
    document.querySelectorAll('dialog[open]').forEach(d => d.close());
    clearInterval(countdownTimer);
  }

  function applyTheme(t) {
    if (t) document.documentElement.dataset.theme = t;
    else delete document.documentElement.dataset.theme;
    const dark = t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171b26' : '#fcf9ee';
  }

  /* ========================== WIRING ============================ */
  formEl.addEventListener('submit', submit);
  guessEl.addEventListener('input', () => { if (guessEl.value.trim()) clockStart(); renderSlots(); });
  $('#hintBtn').addEventListener('click', hint);
  $('#giveUpBtn').addEventListener('click', giveUp);
  $('#practiceBtn').addEventListener('click', startPractice);
  $('#nextBtn').addEventListener('click', next);
  $('#helpBtn').addEventListener('click', openHelp);
  $('#statsBtn').addEventListener('click', openStats);
  $('#backToDaily').addEventListener('click', loadDaily);
  stageEl.addEventListener('click', () => {
    const pz = puzzles[cur];
    if (pz) renderRebus(pz.g, stageEl, hash(pz.a), true);
  });
  $('#themeBtn').addEventListener('click', () => {
    const curDark = document.documentElement.dataset.theme
      ? document.documentElement.dataset.theme === 'dark'
      : matchMedia('(prefers-color-scheme: dark)').matches;
    const t = curDark ? 'light' : 'dark';
    store.set('theme', t);
    applyTheme(t);
  });
  document.querySelectorAll('dialog').forEach(d => {
    d.addEventListener('click', e => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
    d.addEventListener('close', () => clearInterval(countdownTimer));
  });
  let resizeRaf = 0;
  window.addEventListener('resize', () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(refitAll); });
  document.addEventListener('visibilitychange', () => {
    const ps = state && state.p && state.p[cur];
    if (document.hidden) { clockPause(ps); saveDaily(); return; }
    if (mode === 'daily' && forcedDay == null && todayIndex() !== dayNo) return loadDaily();
    if (ps && ps.go && ps.status === 'playing' && !ps.run && $('#start').hidden) { ps.run = Date.now(); renderScorebar(); }
  });
  window.addEventListener('pagehide', () => { clockPause(state && state.p && state.p[cur]); saveDaily(); });

  $('#startPlay').addEventListener('click', startPlay);
  $('#startWarm').addEventListener('click', () => { closeStart(); startPractice(); });
  $('#startHelp').addEventListener('click', openHelp);
  $('#logoHome').addEventListener('click', openStart);

  applyTheme(store.get('theme', null));
  loadDaily();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refitAll);
  store.set('seenHelp', true);
  openStart();

  // Expose for debugging in the console.
  window.Rebusday = { puzzlesForDay, POOLS, renderRebus, startPractice, practiceLeft };
})();
