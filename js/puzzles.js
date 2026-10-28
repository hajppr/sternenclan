// Rätseltypen. Jeder Typ bekommt den Container, die Station und ctx = { solved, state, onSolved }.
import { GAME } from './config.js';
import { hiss, owlCalls } from './fx.js';
import { roleOrder, getPlayers } from './players.js';

const TRY_AGAIN = [
  'Hmm, das stimmt noch nicht.',
  'Der SternenClan schweigt … versucht es noch einmal.',
  'Fast! Schaut noch einmal genau hin.',
  'Eine echte Kriegerin gibt nicht auf!',
];

const norm = s => String(s).toLowerCase()
  .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
  .replace(/[^a-z0-9]/g, '');

const shuffle = arr => arr.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map(x => x[1]);

function fail(el, feedback, text, { silent = false } = {}) {
  if (!silent) {
    hiss();
    navigator.vibrate?.(120);
  }
  feedback.className = 'feedback bad';
  feedback.textContent = text || TRY_AGAIN[Math.floor(Math.random() * TRY_AGAIN.length)];
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
}

function answerForm(el, { question, check, onSolved, numeric }) {
  el.insertAdjacentHTML('beforeend', `
    <form class="stack answer-form" data-answer>
      <label class="story">${question}</label>
      <input ${numeric ? 'inputmode="numeric"' : ''} autocomplete="off" autocapitalize="off" spellcheck="false">
      <button class="btn block">Prüfen</button>
      <p class="feedback"></p>
    </form>`);
  const form = el.querySelector('[data-answer]');
  form.onsubmit = e => {
    e.preventDefault();
    const value = form.querySelector('input').value;
    if (!value.trim()) return;
    if (check(value)) onSolved();
    else fail(form, form.querySelector('.feedback'));
  };
}

// Eingabefelder für einzelne Zeichen (Geheimschrift, Beute, Rollen-Code).
// words: [[{ label, expected }]] – jede innere Liste ist ein Wort.
function slotInput(el, words, { numeric = false, onSolved }) {
  el.insertAdjacentHTML('beforeend', `
    <div class="slots">${words.map(w => `
      <div class="word">${w.map(c => `
        <label class="slot">
          <span class="glyph">${c.label}</span>
          <input maxlength="1" ${numeric ? 'inputmode="numeric"' : 'autocapitalize="characters"'} autocomplete="off" spellcheck="false" aria-label="${c.label}">
        </label>`).join('')}
      </div>`).join('')}
    </div>
    <p class="feedback center"></p>`);

  const expected = words.flat().map(c => String(c.expected).toUpperCase());
  const inputs = [...el.querySelectorAll('.slot input')];
  const feedback = el.querySelector('.feedback');

  const check = () => {
    if (inputs.some(i => !i.value)) return;
    let ok = true;
    inputs.forEach((input, i) => {
      const right = input.value.toUpperCase() === expected[i];
      input.classList.toggle('right', right);
      input.classList.toggle('wrong', !right);
      ok &&= right;
    });
    if (ok) onSolved();
    else fail(el.querySelector('.slots'), feedback, 'Die roten Zeichen stimmen noch nicht.');
  };

  inputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      input.value = input.value.slice(-1).toUpperCase();
      input.classList.remove('right', 'wrong');
      if (input.value && inputs[i + 1]) inputs[i + 1].focus();
      check();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !input.value && inputs[i - 1]) inputs[i - 1].focus();
    });
  });
}

// Info liegt ausgedruckt bei der Station – in der App nur als zugeklappte Notlösung ganz unten auf der Seite
function paperFallback(ctx, html) {
  ctx.footer.innerHTML = `
    <details class="paper-fallback">
      <summary class="muted">Pergament verloren? Hier anzeigen</summary>
      ${html}
    </details>`;
  return '';
}

export const herbList = info => `
  <div class="parchment" style="cursor:default">
    <b>Vorrat der Heilerin</b>
    <ul class="herbs">${info.map(([name, use]) => `<li><b>${name}</b> – ${use}</li>`).join('')}</ul>
  </div>`;

// ---------------------------------------------------------------------------

export const PAW_SCRIPT = {
  A: '🌙', B: '⭐', C: '🍃', D: '🔥', E: '🐾', F: '💧', G: '🌲', H: '🐭', I: '🪶',
  J: '🦉', K: '🐟', L: '🌸', M: '❄️', N: '☀️', O: '🍂', P: '🐦', Q: '🌿', R: '🪨',
  S: '🦊', T: '🐇', U: '🌰', V: '🍄', W: '⚡', X: '🌊', Y: '🐿️', Z: '🦔',
};

const types = {
  cipher(el, p, ctx) {
    el.innerHTML = `<h3>Pfotenschrift</h3><p>${p.question}</p>`;
    const words = p.message.toUpperCase().split(/\s+/).map(w => [...w].map(ch => ({ label: PAW_SCRIPT[ch] || ch, expected: ch })));
    slotInput(el, words, { onSolved: ctx.onSolved });
    const table = `<div class="keytable">${Object.entries(PAW_SCRIPT).map(([l, g]) => `<div>${g}<b>${l}</b></div>`).join('')}</div>`;
    el.insertAdjacentHTML('beforeend', p.printed
      ? `<p class="paper-note">📜 Schaut auf eure Pfotenschrift-Tafel!</p>${paperFallback(ctx, table)}`
      : `<details style="margin-top:12px" open><summary class="muted">Pfotenschrift-Tafel</summary>${table}</details>`);
  },

  quiz(el, p, ctx) {
    const picks = p.questions.map(() => null);
    el.innerHTML = `<h3>Clan-Wissen</h3>${p.questions.map((q, qi) => `
      <div class="stack" style="margin-bottom:18px" data-q="${qi}">
        <p class="story" style="margin:0">${qi + 1}. ${q.q}</p>
        ${q.options.map((o, oi) => `<button class="btn ghost option" data-o="${oi}">${o}</button>`).join('')}
      </div>`).join('')}
      <button class="btn block" id="check">Prüfen</button>
      <p class="feedback"></p>`;

    el.querySelectorAll('[data-q]').forEach(block => {
      const qi = Number(block.dataset.q);
      block.querySelectorAll('[data-o]').forEach(btn => {
        btn.onclick = () => {
          picks[qi] = Number(btn.dataset.o);
          block.querySelectorAll('[data-o]').forEach(b => b.classList.remove('picked', 'wrong'));
          btn.classList.add('picked');
        };
      });
    });

    el.querySelector('#check').onclick = () => {
      const feedback = el.querySelector('.feedback');
      if (picks.includes(null)) return fail(el.querySelector('#check'), feedback, 'Beantwortet erst alle Fragen.', { silent: true });
      const wrong = picks.map((pick, i) => pick !== p.questions[i].answer);
      if (!wrong.includes(true)) return ctx.onSolved();
      wrong.forEach((w, i) => w && el.querySelector(`[data-q="${i}"] .picked`)?.classList.add('wrong'));
      fail(el.querySelector('#check'), feedback, `${wrong.filter(w => !w).length} von ${picks.length} richtig. Die rot markierten stimmen noch nicht.`);
    };
  },

  number(el, p, ctx) {
    el.innerHTML = `<h3>Kriegerblick</h3>`;
    answerForm(el, {
      question: p.question,
      numeric: true,
      onSolved: ctx.onSolved,
      check: v => p.answer == null || Math.abs(Number(v) - p.answer) <= (p.tolerance || 0),
    });
  },

  owl(el, p, ctx) {
    el.innerHTML = `
      <h3>Ruf der Eule</h3>
      <button class="btn block" id="listen">👂 Lauschen</button>`;
    const listen = el.querySelector('#listen');
    listen.onclick = () => {
      const ms = owlCalls(p.calls);
      listen.disabled = true;
      listen.textContent = '🦉 Psst … zählt mit!';
      setTimeout(() => {
        listen.disabled = false;
        listen.textContent = '👂 Noch einmal lauschen';
      }, ms);
    };
    answerForm(el, {
      question: p.question,
      numeric: true,
      onSolved: ctx.onSolved,
      check: v => Number(v) === p.calls,
    });
  },

  prey(el, p, ctx) {
    el.innerHTML = `<h3>Jagdtraining</h3><p>${p.question}</p>`;
    slotInput(el, [p.prey.map(x => ({ label: x.symbol, expected: x.letter }))], { onSolved: ctx.onSolved });
  },

  roles(el, p, ctx) {
    el.innerHTML = `
      <h3>Der Krallen-Code</h3>
      <p>${p.question}</p>`;
    slotInput(el, [roleOrder(p.order).map(r => ({ label: GAME.roles[r].symbol, expected: GAME.roles[r].digit }))], { numeric: true, onSolved: ctx.onSolved });
  },

  match(el, p, ctx) {
    const herbs = p.info.map(([name]) => name);
    el.innerHTML = `
      <h3>Kräuterkunde</h3>
      ${p.printed
        ? `<p class="paper-note">📜 Lest im Vorrat der Heilerin nach!</p>${paperFallback(ctx, herbList(p.info))}`
        : herbList(p.info)}
      <div class="stack" style="margin-top:18px">${p.pairs.map(([patient], i) => `
        <div>
          <p style="margin:0 0 6px">${patient}</p>
          <select data-i="${i}">
            <option value="">– Kraut wählen –</option>
            ${shuffle(herbs).map(h => `<option>${h}</option>`).join('')}
          </select>
        </div>`).join('')}
      </div>
      <button class="btn block" id="check" style="margin-top:16px">Heilen!</button>
      <p class="feedback"></p>`;

    el.querySelector('#check').onclick = () => {
      const selects = [...el.querySelectorAll('select')];
      const feedback = el.querySelector('.feedback');
      if (selects.some(s => !s.value)) return fail(el.querySelector('#check'), feedback, 'Jede Katze braucht ein Kraut.', { silent: true });
      const right = selects.filter(s => s.value === p.pairs[s.dataset.i][1]).length;
      if (right === selects.length) return ctx.onSolved();
      fail(el.querySelector('#check'), feedback, `${right} von ${selects.length} Katzen geht es besser. Die anderen brauchen ein anderes Kraut.`);
    };
  },

  traitor(el, p, ctx) {
    el.innerHTML = `
      <h3>Wer lügt?</h3>
      <p>Tippt auf die Botschaft, die vom SchattenClan stammt.</p>
      ${p.messages.map((m, i) => `<button class="parchment" data-i="${i}">„${m}“<small>– SternenClan?</small></button>`).join('')}
      <p class="feedback"></p>`;
    const feedback = el.querySelector('.feedback');
    el.querySelectorAll('[data-i]').forEach(card => {
      card.onclick = () => {
        if (Number(card.dataset.i) !== p.fake) {
          card.classList.add('wrong');
          return fail(card, feedback, 'Nein – diese Botschaft klingt wirklich nach dem SternenClan.');
        }
        card.classList.add('right');
        feedback.className = 'feedback ok';
        feedback.textContent = p.reason;
        setTimeout(ctx.onSolved, 1200);
      };
    });
  },

  // Alle legen gleichzeitig einen Finger auf das Tablet (Multitouch)
  touch(el, p, ctx) {
    const need = Math.min(Math.max(getPlayers().length, 1), 10);
    el.innerHTML = `
      <h3>Gemeinsam heben</h3>
      <p>${p.question}</p>
      <div class="touchstone" id="stone"><span id="count">0 / ${need}</span></div>
      <p class="feedback center"></p>
      <p class="center"><button class="btn ghost small" id="fallback" hidden>Klappt nicht? Gemeinsam „Hauruck!“ rufen und hier tippen</button></p>`;
    const stone = el.querySelector('#stone');
    const count = el.querySelector('#count');
    const feedback = el.querySelector('.feedback');
    const fingers = new Set();
    let holdTimer;

    const update = () => {
      count.textContent = `${Math.min(fingers.size, need)} / ${need}`;
      stone.style.setProperty('--glow', fingers.size / need);
      clearTimeout(holdTimer);
      if (fingers.size >= need) {
        feedback.className = 'feedback center ok';
        feedback.textContent = 'Haltet fest …';
        holdTimer = setTimeout(() => {
          stone.classList.add('lifted');
          ctx.onSolved();
        }, 1500);
      } else {
        feedback.textContent = fingers.size ? `Noch ${need - fingers.size} Pfote${need - fingers.size > 1 ? 'n' : ''}!` : '';
        feedback.className = 'feedback center';
      }
    };
    stone.addEventListener('pointerdown', e => {
      e.preventDefault();
      fingers.add(e.pointerId);
      stone.setPointerCapture?.(e.pointerId);
      update();
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => stone.addEventListener(type, e => {
      if (fingers.delete(e.pointerId)) update();
    }));
    stone.addEventListener('contextmenu', e => e.preventDefault());

    setTimeout(() => { el.querySelector('#fallback').hidden = false; }, 30000);
    el.querySelector('#fallback').onclick = ctx.onSolved;
  },

  lock(el, p, ctx) {
    const digits = GAME.stations.filter(s => s.digit != null);
    el.innerHTML = `
      <h3>Eure Krallenzeichen</h3>
      <div class="bigsymbols">${digits.map(s => `<span title="${s.title}">${ctx.state.solved[s.id] ? s.digit : '?'}</span>`).join('')}</div>
      ${digits.some(s => !ctx.state.solved[s.id]) ? '<p class="muted center">Ein paar Zeichen fehlen noch – vielleicht habt ihr eine Prüfung übersprungen?</p>' : ''}
      <p class="center">Stellt das Zahlenschloss auf diesen Code und öffnet die Truhe.</p>
      ${ctx.solved ? '' : '<button class="btn block" id="open">Die Truhe ist offen!</button>'}`;
    el.querySelector('#open')?.addEventListener('click', ctx.onSolved);
  },
};

export function renderPuzzle(el, station, ctx) {
  const p = station.puzzle;
  if (ctx.solved && p.type !== 'lock') {
    el.innerHTML = '<p class="center" style="margin:0">🐾 Diese Prüfung habt ihr bestanden.</p>';
    return;
  }
  types[p.type](el, p, ctx);
}
