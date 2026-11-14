import { GAME, lockCode } from './config.js';
import { renderPuzzle } from './puzzles.js';
import { chime, shimmer, fanfare, startMusic, stopMusic, isMusicPlaying, preloadSounds } from './fx.js';
import { getPlayers, savePlayers, clearPlayers, encodeSetup, decodeSetup, roleOrder, suggestNames } from './players.js';
import { mapSvg } from './map.js';
import { hasGeolocation, getGeo, saveGeo, stationGeo, locate, watch, distance, warmth } from './geo.js';

const app = document.getElementById('app');
const HINT_DELAYS = [60, 180, 300]; // Sekunden nach Ankunft, ab denen Tipp 1/2/3 verfügbar ist

// ---------------------------------------------------------------------------
// Spielstand (pro Gerät im Browser gespeichert)
// Im Testmodus nur in der Browser-Sitzung, damit der echte Spielstand unberührt bleibt.
// ---------------------------------------------------------------------------

const PREVIEW_FLAG = 'sternenclan-preview';
const preview = (() => {
  try { return sessionStorage.getItem(PREVIEW_FLAG) === '1'; } catch { return false; }
})();
const store = preview ? sessionStorage : localStorage;
const STATE_KEY = preview ? `${GAME.storageKey}-preview` : GAME.storageKey;

const fresh = () => ({ startedAt: null, solved: {}, hints: {}, arrived: {} });

function load() {
  try {
    return { ...fresh(), ...JSON.parse(store.getItem(STATE_KEY)) };
  } catch {
    return fresh();
  }
}

let state = load();

function save() {
  try { store.setItem(STATE_KEY, JSON.stringify(state)); } catch { /* privater Modus */ }
}

function setPreview(on) {
  try {
    if (on) sessionStorage.setItem(PREVIEW_FLAG, '1');
    else sessionStorage.removeItem(PREVIEW_FLAG);
    sessionStorage.removeItem(`${GAME.storageKey}-preview`);
  } catch { /* egal */ }
}

const stations = GAME.stations;
const byToken = token => stations.find(s => s.token === token.toLowerCase());
const currentIndex = () => {
  const i = stations.findIndex(s => !state.solved[s.id]);
  return i === -1 ? stations.length : i;
};

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

let cleanup = [];
const onLeave = fn => cleanup.push(fn);

function route() {
  cleanup.forEach(fn => fn());
  cleanup = [];
  window.scrollTo(0, 0);

  const [, page, arg] = location.hash.split('/');
  render(page, arg);
  if (preview) drawPreviewBar(page, arg);
}

function render(page, arg) {
  if (page === 's' && arg && byToken(arg)) return viewStation(byToken(arg));
  if (page === 'intro') return viewIntro(Number(arg) || 0);
  if (page === 'scan') return viewScan();
  if (page === 'gm') return viewGM();
  if (page === 'setup' && arg) return viewSetup(arg);
  if (page === 'zeremonie') return viewCeremony(Number(arg) || 0);
  if (page === 'karte') return viewMap();
  if (page === 'witterung' && stations.some(s => s.id === arg)) return viewScent(stations.find(s => s.id === arg));
  return viewHome();
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

function trail(activeId) {
  return `<div class="trail" aria-label="Fortschritt">${stations.map(s => {
    const cls = [state.solved[s.id] && 'done', s.id === activeId && 'here'].filter(Boolean).join(' ');
    return `<span class="${cls}">${state.solved[s.id] ? '🐾' : '·'}</span>`;
  }).join('')}</div>`;
}


// ---------------------------------------------------------------------------
// Startseite
// ---------------------------------------------------------------------------

function viewHome() {
  if (!state.startedAt && !state.prepared && !preview) return viewPrepare();
  if (!state.startedAt) {
    app.innerHTML = `
      <div class="center" style="padding-top:12vh">
        <div class="chip">Für die Schülerinnen des ${GAME.clan}s</div>
        <h1>${GAME.title}</h1>
        <p class="story muted">„${GAME.prophecy}“</p>
        <p style="margin-top:32px"><a class="btn" href="#/intro">Die Prüfung beginnen</a></p>
      </div>`;
    return;
  }

  const ci = currentIndex();
  const current = stations[ci];
  const reachable = current && (ci === 0 || state.arrived[current.id]);
  app.innerHTML = `
    <h1 class="center">${GAME.title}</h1>
    ${trail(current?.id)}
    ${current ? `<a class="card map-card" href="#/karte">${mapSvg({ stations, solved: state.solved, targetId: current.id, compact: true })}</a>` : ''}
    <div class="card">
      <h3>Euer Weg</h3>
      <ul class="path">${stations.map((s, i) => `
        <li>
          <span class="dot">${state.solved[s.id] ? '🐾' : i === ci ? '✨' : '·'}</span>
          <span>${state.solved[s.id] || i === ci ? s.title : '???'}</span>
        </li>`).join('')}
      </ul>
    </div>
    <div class="stack">
      ${reachable ? `<a class="btn block" href="#/s/${current.token}">Weiter: ${current.title}</a>` : ''}
      ${current && !reachable ? `<div class="card"><p class="muted">Letzter Hinweis:</p><p class="story">${stations[ci - 1].next}</p></div>` : ''}
      ${current && !reachable ? scentButton(current) : ''}
      ${current ? `<a class="btn block ${reachable ? 'ghost' : ''}" href="#/scan">📷 Spur scannen</a>` : ''}
      <a class="btn ghost block" href="#/karte">🗺️ Karte des Territoriums</a>
      ${!current ? `<a class="btn block" href="#/zeremonie">⭐ Zur Kriegerzeremonie</a>` : ''}
    </div>`;
}

// ---------------------------------------------------------------------------
// Einleitung
// ---------------------------------------------------------------------------

function viewIntro(step) {
  const slides = [...GAME.intro];
  const last = step >= slides.length;

  if (!last) {
    app.innerHTML = `
      <div class="card" style="margin-top:10vh">
        <div class="chip">Ein Traum von ${GAME.leader.name}</div>
        <p class="story">${slides[step]}</p>
        <div class="row" style="justify-content:flex-end;margin-top:20px">
          <a class="btn" href="#/intro/${step + 1}">Weiter</a>
        </div>
      </div>`;
    return;
  }

  app.innerHTML = `
    <h2 class="center">Die Schülerinnen des ${GAME.clan}s</h2>
    <div class="card">
      <ul class="path">${getPlayers().map(p => {
        const r = GAME.roles[p.role];
        return `<li><span class="dot">✦</span><span><b>${p.apprentice}</b> <span class="muted">(${p.name})</span><br><small class="muted">${r.title} – ${r.text}</small></span></li>`;
      }).join('')}</ul>
    </div>
    <div class="card"><p class="story">„${GAME.prophecy}“</p></div>
    <button class="btn block" id="go">Wir sind bereit!</button>`;
  app.querySelector('#go').onclick = () => {
    state.startedAt = Date.now();
    save();
    location.hash = `#/s/${stations[0].token}`;
  };
}

// ---------------------------------------------------------------------------
// Station
// ---------------------------------------------------------------------------

function viewStation(station) {
  const idx = stations.indexOf(station);
  if (!state.startedAt) state.startedAt = Date.now();
  if (!state.arrived[station.id]) state.arrived[station.id] = Date.now();
  save();

  const prev = stations[idx - 1];
  const skipped = !preview && prev && !state.solved[prev.id];

  app.innerHTML = `
    ${trail(station.id)}
    ${skipped ? `<div class="card"><p class="muted">Moment! Die Prüfung „${prev.title}“ habt ihr noch nicht bestanden. Ihr könnt trotzdem weitermachen – <a href="#/s/${prev.token}" style="color:var(--gold)">oder zurückgehen</a>.</p></div>` : ''}
    <div class="card">
      <div class="chip">📍 ${station.place}</div>
      <h2>${station.title}</h2>
      <p class="story">${station.story}</p>
    </div>
    <div class="card" id="puzzle"></div>
    <div id="after"></div>
    <div id="footer"></div>`;

  const after = app.querySelector('#after');
  const showAfter = () => {
    after.innerHTML = state.solved[station.id] ? successBlock(station) : '';
    if (!state.solved[station.id]) renderHints(after, station);
  };

  renderPuzzle(app.querySelector('#puzzle'), station, {
    footer: app.querySelector('#footer'),
    solved: !!state.solved[station.id],
    state,
    onSolved() {
      if (state.solved[station.id]) return;
      state.solved[station.id] = Date.now();
      save();
      chime();
      navigator.vibrate?.([80, 40, 160]);
      showAfter();
      after.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  });
  showAfter();
}

function successBlock(station) {
  const next = stations[stations.indexOf(station) + 1];
  return `
    <div class="card success">
      <h2>Prüfung bestanden!</h2>
      ${station.digit != null ? `<p class="muted">Ihr habt ein Krallenzeichen erhalten:</p><div class="claw">${station.digit}</div><p class="muted">Merkt es euch gut – der SternenClan verrät es kein zweites Mal!</p>` : ''}
      ${station.next ? `<p class="story" style="margin-top:12px">${station.next}</p>` : ''}
      ${next?.map ? `<a class="map-inline" href="#/karte">${mapSvg({ stations, solved: state.solved, targetId: next.id, compact: true })}</a>` : ''}
      <div class="stack" style="margin-top:16px">
        ${next
          ? `${scentButton(next)}<a class="btn block" href="#/scan">📷 Nächste Spur scannen</a>`
          : `<a class="btn block" href="#/zeremonie">⭐ Zur Kriegerzeremonie</a>`}
      </div>
    </div>`;
}

const scentButton = target => (hasGeolocation && stationGeo(target)
  ? `<a class="btn ghost block" href="#/witterung/${target.id}">🐾 Witterung aufnehmen</a>`
  : '');

// ---------------------------------------------------------------------------
// Karte
// ---------------------------------------------------------------------------

function viewMap() {
  const current = stations[currentIndex()];
  app.innerHTML = `
    <h2 class="center">Territorium des ${GAME.clan}s</h2>
    <div class="card map-card">${mapSvg({ stations, solved: state.solved, targetId: current?.id })}</div>
    <p class="center muted">🐾 bestandene Prüfung · <b style="color:#c4472c">?</b> nächstes Ziel</p>
    <div class="stack">
      ${current ? scentButton(current) : ''}
      <a class="btn block" href="#/scan">📷 Spur scannen</a>
      <a class="btn ghost block" href="#/">Zurück</a>
    </div>`;
}

// ---------------------------------------------------------------------------
// Witterung aufnehmen: heiß/kalt per GPS (ohne Kompass)
// ---------------------------------------------------------------------------

function viewScent(target) {
  const goal = stationGeo(target);
  app.innerHTML = `
    <div class="card center scent" style="margin-top:6vh">
      <div class="chip">Witterung aufnehmen</div>
      <div class="scent-emoji" id="emoji">👃</div>
      <h2 id="label">Schnuppert …</h2>
      <p class="muted" id="detail">Die Spur wird gesucht. Bleibt kurz stehen, das kann draußen einen Moment dauern.</p>
    </div>
    <div class="stack">
      <a class="btn block" href="#/scan">📷 Spur gefunden – scannen</a>
      <a class="btn ghost block" href="#/">Zurück</a>
    </div>`;

  if (!goal || !hasGeolocation) {
    app.querySelector('#label').textContent = 'Keine Witterung';
    app.querySelector('#detail').textContent = 'Für dieses Ziel ist keine Position gespeichert.';
    return;
  }

  let lastLevel = null;
  const stop = watch(pos => {
    const meters = distance(pos, goal);
    const w = warmth(meters);
    app.querySelector('#emoji').textContent = w.emoji;
    app.querySelector('#emoji').style.transform = `scale(${0.8 + w.level * 0.18})`;
    app.querySelector('#label').textContent = w.label;
    app.querySelector('#detail').textContent = pos.acc > 30
      ? `Die Witterung ist schwach (GPS ±${pos.acc} m) – kurz stehen bleiben.`
      : `noch ca. ${Math.round(meters)} m`;
    if (lastLevel != null && w.level > lastLevel) shimmer();
    if (w.level === 5 && lastLevel !== 5) navigator.vibrate?.([100, 60, 100]);
    lastLevel = w.level;
  }, () => {
    app.querySelector('#label').textContent = 'Keine Witterung';
    app.querySelector('#detail').textContent = 'Standort nicht verfügbar. Ist „Standort“ am Tablet eingeschaltet und für Chrome erlaubt?';
  });
  onLeave(stop);
}

function renderHints(root, station) {
  const hints = station.hints || [];
  if (!hints.length) return;

  const box = document.createElement('div');
  box.className = 'card';
  root.append(box);

  const draw = () => {
    const shown = state.hints[station.id] || 0;
    const wait = shown < hints.length
      ? preview ? 0 : Math.max(0, Math.ceil(HINT_DELAYS[Math.min(shown, HINT_DELAYS.length - 1)] - (Date.now() - state.arrived[station.id]) / 1000))
      : 0;
    box.innerHTML = `
      <h3>🌟 Rat des SternenClans</h3>
      ${hints.slice(0, shown).map(h => `<p class="hint">${h}</p>`).join('')}
      ${shown < hints.length
        ? `<button class="btn ghost block" ${wait ? 'disabled' : ''}>${wait ? `Der SternenClan antwortet in ${wait} s …` : `Um Rat bitten (${shown + 1}/${hints.length})`}</button>`
        : ''}`;
    const btn = box.querySelector('button');
    if (btn) btn.onclick = () => {
      state.hints[station.id] = shown + 1;
      save();
      shimmer();
      draw();
    };
  };

  draw();
  const timer = setInterval(() => {
    if (state.solved[station.id]) return clearInterval(timer);
    if (box.querySelector('button[disabled]')) draw();
  }, 1000);
  onLeave(() => clearInterval(timer));
}

// ---------------------------------------------------------------------------
// QR-Scanner (läuft komplett offline über jsQR)
// ---------------------------------------------------------------------------

function tokenFrom(text) {
  const m = String(text).match(/#\/s\/([a-z0-9]+)/i);
  return (m ? m[1] : String(text).trim()).toLowerCase();
}

function goToToken(text) {
  const setup = String(text).match(/#\/setup\/([\w-]+)/);
  if (setup) {
    location.hash = `#/setup/${setup[1]}`;
    return true;
  }
  const station = byToken(tokenFrom(text));
  if (station) location.hash = `#/s/${station.token}`;
  return !!station;
}

function viewScan() {
  app.innerHTML = `
    <h2 class="center">Spur aufnehmen</h2>
    <div class="scanner"><video playsinline muted></video></div>
    <p class="center muted" id="scanmsg">Haltet den QR-Code in den Rahmen.</p>
    <div class="card">
      <form id="manual" class="row">
        <label for="code" class="muted" style="width:100%">Kamera geht nicht? Gebt den Spurcode von der Karte ein:</label>
        <input id="code" autocomplete="off" autocapitalize="off" style="flex:1" placeholder="z. B. ab12">
        <button class="btn">Los</button>
      </form>
      <p class="feedback bad" id="manualmsg"></p>
    </div>
    <a class="btn ghost block" href="#/">Zurück</a>`;

  app.querySelector('#manual').onsubmit = e => {
    e.preventDefault();
    if (!goToToken(app.querySelector('#code').value)) {
      app.querySelector('#manualmsg').textContent = 'Diese Spur kennt der SternenClan nicht.';
    }
  };

  const msg = app.querySelector('#scanmsg');
  startCamera(app.querySelector('video'), {
    onCode: text => {
      if (goToToken(text)) return true;
      msg.textContent = 'Das ist keine Spur des SternenClans …';
      return false;
    },
    onError: text => { msg.textContent = `${text} – nutzt den Spurcode unten.`; },
  });
}

// Kamera starten und QR-Codes lesen, bis onCode(text) true zurückgibt. Stoppt beim Verlassen der Seite.
function startCamera(video, { onCode, onError }) {
  if (!navigator.mediaDevices?.getUserMedia || !window.jsQR) {
    onError('Kamera nicht verfügbar');
    return () => {};
  }

  let stream, raf, stopped = false;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const stop = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach(t => t.stop());
  };

  const tick = () => {
    if (stopped) return;
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      const scale = Math.min(1, 640 / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
      if (code?.data && onCode(code.data)) return stop();
    }
    raf = requestAnimationFrame(tick);
  };

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
    .then(s => {
      if (stopped) return s.getTracks().forEach(t => t.stop());
      stream = s;
      video.srcObject = s;
      video.play();
      tick();
    })
    .catch(() => onError('Kein Kamerazugriff'));

  onLeave(stop);
  return stop;
}

// ---------------------------------------------------------------------------
// Vorbereitung vor dem Spiel: GPS-Punkte und Spielerinnen per QR einlesen, dann starten
// ---------------------------------------------------------------------------

let prepFlash = '';

function applySetup(setup) {
  if (setup.players.length) savePlayers(setup.players);
  if (Object.keys(setup.geo).length) saveGeo({ ...getGeo(), ...setup.geo });
}

function viewPrepare() {
  const gpsCount = Object.keys(getGeo()).length;
  const gpsNeeded = stations.length - 1; // Station 1 ist zu Hause
  const players = getPlayers();
  const custom = players.length > 0;
  const ok = (good, text) => `<span class="${good ? 'ok' : 'warn'}">${good ? '✓' : '!'} ${text}</span>`;

  app.innerHTML = `
    <h2 class="center" style="margin-top:4vh">Vorbereitung</h2>
    <p class="center muted">Nur für die Spielleitung. Danach „Spiel starten“ und das Tablet den Mädchen geben.</p>
    <div class="card prep">
      <h3>1. 📍 GPS-Punkte</h3>
      <p>${ok(gpsCount >= gpsNeeded, gpsCount ? `${gpsCount} von ${gpsNeeded} Verstecken gespeichert` : 'noch keine GPS-Punkte')}</p>
      <button class="btn ghost small" data-scan="gps">📷 GPS-QR scannen</button>
    </div>
    <div class="card prep">
      <h3>2. 🐾 Spielerinnen</h3>
      <p>${ok(custom, custom ? `${players.length} Spielerinnen` : 'noch keine Spielerinnen')}</p>
      ${custom ? `<ul class="prep-list">${players.map(p => `<li>${esc(p.name) || '–'} · ${esc(p.apprentice)} → ${esc(p.warrior)} · ${GAME.roles[p.role]?.title || ''}</li>`).join('')}</ul>` : ''}
      <button class="btn ghost small" data-scan="players">📷 Spielerinnen-QR scannen</button>
    </div>
    <div id="prep-scan"></div>
    <p class="feedback ok center" id="prep-msg">${prepFlash}</p>
    <button class="btn block" id="start">Spiel starten</button>
    <p class="center" style="margin-top:16px"><a class="muted" href="#/gm">Spielleitung</a></p>`;
  prepFlash = '';

  const msg = app.querySelector('#prep-msg');
  let stopScan = null;
  app.querySelectorAll('[data-scan]').forEach(b => {
    b.onclick = () => {
      stopScan?.();
      const box = app.querySelector('#prep-scan');
      box.innerHTML = `
        <div class="card">
          <p class="center muted">${b.dataset.scan === 'gps' ? 'GPS-QR' : 'Spielerinnen-QR'} in den Rahmen halten.</p>
          <div class="scanner"><video playsinline muted></video></div>
          <button class="btn ghost small" id="scan-cancel" style="margin-top:8px">Abbrechen</button>
        </div>`;
      box.scrollIntoView({ behavior: 'smooth' });
      box.querySelector('#scan-cancel').onclick = () => { stopScan?.(); box.innerHTML = ''; };
      msg.className = 'feedback center';
      msg.textContent = '';
      stopScan = startCamera(box.querySelector('video'), {
        onCode: text => {
          const m = String(text).match(/#\/setup\/([\w-]+)/);
          const setup = m && decodeSetup(m[1]);
          if (!setup) {
            msg.className = 'feedback bad center';
            msg.textContent = 'Das ist kein Einrichtungs-QR aus der Spielleitung.';
            return false;
          }
          applySetup(setup);
          const parts = [];
          if (setup.players.length) parts.push(`${setup.players.length} Spielerinnen`);
          if (Object.keys(setup.geo).length) parts.push(`${Object.keys(setup.geo).length} GPS-Punkte`);
          prepFlash = `Eingelesen: ${parts.join(' und ')} ✓`;
          chime();
          setTimeout(route, 0); // nach dem Stoppen der Kamera neu zeichnen
          return true;
        },
        onError: text => {
          msg.className = 'feedback bad center';
          msg.textContent = `${text}. Alternativ den QR mit der Kamera-App scannen.`;
        },
      });
    };
  });

  app.querySelector('#start').onclick = () => {
    const missing = [];
    if (gpsCount < gpsNeeded) missing.push(gpsCount ? `nur ${gpsCount} von ${gpsNeeded} GPS-Punkten` : 'keine GPS-Punkte');
    if (!custom) missing.push('keine Spielerinnen eingelesen');
    if (missing.length && !confirm(`Trotzdem starten? Es fehlen: ${missing.join(', ')}.`)) return;
    state.prepared = Date.now();
    save();
    route();
  };
}

// ---------------------------------------------------------------------------
// Kriegerzeremonie
// ---------------------------------------------------------------------------

function viewCeremony(step) {
  const order = getPlayers();
  const { name: leader, title } = GAME.leader;

  if (step >= order.length) {
    const text = `Der ${GAME.clan} ehrt seine neuen Kriegerinnen! ${order.map(p => p.warrior).join('! ')}!`;
    app.innerHTML = `
      <div class="card ceremony center reveal" style="margin-top:8vh">
        <h1>⭐ ${GAME.clan} ⭐</h1>
        <p class="story">${text}</p>
      </div>`;
    fanfare();
    return;
  }

  const p = order[step];
  const vow = `Ich, ${leader}, ${title} des ${GAME.clan}s, bitte den SternenClan, auf diese Schülerin herabzublicken. Sie hat heute Mut, Klugheit und Treue bewiesen. ${p.apprentice}, versprichst du, das Gesetz der Krieger zu achten und deinen Clan mit deinem Leben zu beschützen?`;
  const naming = `Dann gebe ich dir mit der Kraft des SternenClans deinen Kriegernamen. ${p.apprentice}, von diesem Augenblick an wirst du ${p.warrior} heißen.`;

  app.innerHTML = `
    <div class="card ceremony" style="margin-top:6vh">
      <div class="chip">Kriegerzeremonie ${step + 1}/${order.length} · ${leader} spricht</div>
      <p class="story">${vow}</p>
      <button class="btn" id="promise">„Ich verspreche es!“</button>
      <div id="named"></div>
    </div>`;

  app.querySelector('#promise').onclick = e => {
    e.target.remove();
    fanfare();
    const named = app.querySelector('#named');
    named.innerHTML = `
      <p class="story" style="margin-top:16px">${naming}</p>
      <div class="center reveal">
        <div class="old">${p.apprentice}</div>
        <div class="name">${p.warrior}</div>
      </div>
      <a class="btn block" href="#/zeremonie/${step + 1}">${step + 1 < order.length ? 'Nächste Schülerin' : 'Abschluss'}</a>`;
  };
}

// ---------------------------------------------------------------------------
// Spielleitung (#/gm)
// ---------------------------------------------------------------------------

function answerOf(s) {
  const p = s.puzzle;
  switch (p.type) {
    case 'cipher': return p.message;
    case 'quiz': return p.questions.map(q => q.options[q.answer]).join(' · ');
    case 'number': return p.answer == null ? '<span class="warn">fehlt! (bis dahin zählt jede Zahl)</span>' : `${p.answer} (±${p.tolerance || 0})`;
    case 'owl': return `${p.calls} Rufe`;
    case 'touch': return 'alle Finger gleichzeitig auf das Siegel';
    case 'prey': return p.prey.map(x => x.letter).join('');
    case 'roles': return roleOrder(p.order).map(r => GAME.roles[r].digit).join('');
    case 'match': return p.pairs.map(x => x[1]).join(', ');
    case 'traitor': return `Botschaft ${p.fake + 1} ist falsch`;
    case 'lock': return lockCode();
    default: return '';
  }
}

function viewGM() {
  if (sessionStorage.getItem('gm') !== '1') {
    app.innerHTML = `
      <div class="card" style="margin-top:10vh">
        <h2>Spielleitung</h2>
        <form id="pin" class="row"><input type="password" inputmode="numeric" placeholder="PIN" style="flex:1"><button class="btn">Öffnen</button></form>
      </div>`;
    app.querySelector('#pin').onsubmit = e => {
      e.preventDefault();
      if (e.target.querySelector('input').value === GAME.gmPin) {
        sessionStorage.setItem('gm', '1');
        route();
      }
    };
    return;
  }

  const mins = state.startedAt ? Math.round((Date.now() - state.startedAt) / 60000) : null;
  const geo = getGeo();
  app.innerHTML = `
    <h2>Spielleitung</h2>
    <div class="card">
      <p>Zahlenschloss-Code: <b style="font-size:1.4rem;color:var(--gold)">${lockCode()}</b></p>
      <p>${mins == null ? 'Noch nicht gestartet.' : `Läuft seit ${mins} Minuten.`}</p>
      <div class="row">
        <a class="btn small" href="print.html" target="_blank">🖨️ Druckvorlagen</a>
        ${preview ? '' : '<button class="btn ghost small" id="preview">🧪 Testmodus</button>'}
        <button class="btn ghost small" id="reset" title="Löscht nur den Fortschritt – Namen und GPS-Punkte bleiben">Spielstand zurücksetzen</button>
      </div>
    </div>
    <div class="card" id="clan"></div>
    <div class="card" style="overflow-x:auto">
      <table class="gm-table">
        <tr><th>#</th><th>Station</th><th>Lösung</th><th>${hasGeolocation ? '📍 = beim Ablaufen am Versteck antippen' : ''}</th></tr>
        ${stations.map((s, i) => `
          <tr>
            <td>${i + 1}</td>
            <td><b>${s.title}</b> <span class="muted">(${s.place}, Code <code>${s.token}</code>)</span><br>
              <small>${s.gm.hide}</small>${s.gm.prep ? `<br><small>${s.gm.prep}</small>` : ''}</td>
            <td>${answerOf(s)}</td>
            <td>
              ${hasGeolocation && i > 0 ? `<button class="btn ghost small" data-geo="${s.id}">${geo[s.id] ? `📍 ±${geo[s.id].acc} m` : '📍 Position'}</button>` : ''}
              <a class="btn ghost small" href="#/s/${s.token}">Öffnen</a>
              ${state.solved[s.id] ? '🐾' : `<button class="btn ghost small" data-solve="${s.id}">Lösen</button>`}
            </td>
          </tr>`).join('')}
      </table>
    </div>
    <a class="btn ghost block" href="#/">Zum Spiel</a>
    <p class="muted center" style="font-size:0.8rem;margin-top:24px">Klänge: Waldkauz – W.carter (CC BY 4.0), Wind – Gravity Sound (CC BY 4.0), Fauchen – Zabuhailo (CC0), via Wikimedia Commons. Details: sounds/LIZENZEN.md</p>`;

  app.querySelectorAll('[data-solve]').forEach(b => {
    b.onclick = () => {
      state.solved[b.dataset.solve] = Date.now();
      state.startedAt ||= Date.now();
      save();
      route();
    };
  });
  app.querySelectorAll('[data-geo]').forEach(b => {
    b.onclick = async () => {
      b.disabled = true;
      b.textContent = '📍 suche …';
      try {
        const pos = await locate();
        saveGeo({ ...getGeo(), [b.dataset.geo]: pos });
        route();
      } catch {
        b.disabled = false;
        b.textContent = '📍 kein GPS';
      }
    };
  });
  renderClanEditor(app.querySelector('#clan'));
  app.querySelector('#preview')?.addEventListener('click', () => {
    setPreview(true);
    location.hash = '#/intro';
    location.reload();
  });
  app.querySelector('#reset').onclick = () => {
    if (!confirm('Spielstand (Fortschritt) auf diesem Gerät löschen? Namen und GPS-Punkte bleiben erhalten.')) return;
    state = fresh();
    save();
    route();
  };
}

// ---------------------------------------------------------------------------
// Clan einrichten (Teil der Spielleitung) + Übertragung per Link/QR
// ---------------------------------------------------------------------------

let clanFlash = ''; // Meldung, die nach dem Neuaufbau der Spielleitung angezeigt wird

const esc = v => String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

function renderClanEditor(box) {
  const emptyPlayer = role => ({ name: '', apprentice: '', warrior: '', role });
  const unusedRole = list => Object.keys(GAME.roles).find(r => !list.some(p => p.role === r)) || Object.keys(GAME.roles)[0];
  let players = getPlayers().map(p => ({ ...p }));
  // Noch niemand eingetragen: 4 leere Zeilen mit verschiedenen Rollen
  if (!players.length) for (let n = 0; n < 4; n++) players.push(emptyPlayer(unusedRole(players)));
  const roleOptions = selected => Object.entries(GAME.roles)
    .map(([key, r]) => `<option value="${key}" ${key === selected ? 'selected' : ''}>${r.title}</option>`).join('');

  const draw = (msg = '', bad = false) => {
    box.innerHTML = `
      <h3>Clan einrichten</h3>
      <p class="muted">Wer ist dabei? Gespeichert wird auf diesem Gerät. Danach „QR für die Spielerinnen“ und am Spiel-Tablet scannen.</p>
      ${players.map((p, i) => `
        <div class="player-row" data-i="${i}">
          <input data-f="name" value="${esc(p.name)}" placeholder="Vorname" aria-label="Vorname">
          <input data-f="apprentice" value="${esc(p.apprentice)}" placeholder="Schülerin (…pfote)" aria-label="Schülerinnenname">
          <input data-f="warrior" value="${esc(p.warrior)}" placeholder="Kriegerin" aria-label="Kriegername">
          <select data-f="role" aria-label="Rolle">${roleOptions(p.role)}</select>
          <button class="btn ghost small" data-act="dice" title="Namen vorschlagen">🎲</button>
          <button class="btn ghost small" data-act="del" title="Entfernen">✕</button>
        </div>`).join('')}
      <div class="row" style="margin-top:12px">
        <button class="btn ghost small" data-act="add">+ Mädchen</button>
        <button class="btn ghost small" data-act="clear">🗑 Alle Namen löschen</button>
        <button class="btn small" data-act="save">Speichern</button>
      </div>
      <p class="feedback ${bad ? 'bad' : 'ok'}">${msg}</p>
      <div id="transfer"></div>`;
    drawTransfer(box.querySelector('#transfer'));
  };

  box.addEventListener('input', e => {
    const row = e.target.closest('[data-i]');
    if (!row || !e.target.dataset.f) return;
    const p = players[row.dataset.i];
    p[e.target.dataset.f] = e.target.value.trim();
  });

  box.addEventListener('click', e => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    const i = Number(e.target.closest('[data-i]')?.dataset.i);
    if (act === 'dice') {
      Object.assign(players[i], suggestNames());
      draw();
    } else if (act === 'clear') {
      if (!confirm('Alle Spielerinnen auf diesem Gerät löschen?')) return;
      clearPlayers();
      clanFlash = 'Alle Namen gelöscht.';
      route();
    } else if (act === 'del') {
      players.splice(i, 1);
      draw('Noch nicht gespeichert.');
    } else if (act === 'add') {
      players.push(emptyPlayer(unusedRole(players)));
      draw('Noch nicht gespeichert.');
    } else if (act === 'save') {
      // Komplett leere Zeilen einfach weglassen
      const filled = players.filter(p => p.name || p.apprentice || p.warrior);
      if (!filled.length) return draw('Mindestens ein Mädchen eintragen.', true);
      if (filled.some(p => !p.apprentice || !p.warrior)) return draw('Jede braucht einen Schülerinnen- und einen Kriegernamen (🎲 schlägt welche vor).', true);
      players = filled;
      savePlayers(players);
      clanFlash = `Gespeichert: ${players.length} Schülerinnen.`;
      route(); // Lösungstabelle (Rollen-Code) neu berechnen
    }
  });

  draw(clanFlash);
  clanFlash = '';
}

function setupLink(setup) {
  return `${location.origin}${location.pathname}#/setup/${encodeSetup(setup)}`;
}

function qrSvg(text) {
  if (!window.qrcode) return '';
  const q = qrcode(0, 'L');
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 4, scalable: true });
}

function drawTransfer(el) {
  const players = getPlayers();
  const geo = getGeo();
  const gpsCount = Object.keys(geo).length;
  const fullLink = setupLink({ players, geo });
  el.innerHTML = `
    <div class="row" style="margin-top:12px">
      <button class="btn small" data-qr="players">🐾 QR für die Spielerinnen</button>
      ${gpsCount ? `<button class="btn ghost small" data-qr="gps">📍 QR für die GPS-Punkte (${gpsCount})</button>` : ''}
      <button class="btn ghost small" id="backup">💾 Sicherung herunterladen</button>
    </div>
    <div id="qr-out"></div>`;

  el.querySelectorAll('[data-qr]').forEach(b => {
    b.onclick = () => {
      const isGps = b.dataset.qr === 'gps';
      const link = setupLink(isGps ? { geo } : { players });
      el.querySelector('#qr-out').innerHTML = `
        <p><b>${isGps ? `${gpsCount} GPS-Punkte` : `${players.length} Spielerinnen`}</b> – auf dem Spiel-Tablet im Startbildschirm „Vorbereitung“ scannen
          (oder mit der Kamera-App).${isGps ? '' : ' Vorher „Speichern“ nicht vergessen.'}</p>
        <div class="setup-qr big">${qrSvg(link)}</div>
        <button class="btn ghost small" id="copy">Link kopieren</button>`;
      el.querySelector('#copy').onclick = e => {
        navigator.clipboard?.writeText(link).then(() => { e.target.textContent = 'Kopiert ✓'; });
      };
    };
  });

  el.querySelector('#backup').onclick = () => {
    const date = new Date().toISOString().slice(0, 10);
    const text = [
      `Sicherung ${GAME.title} – ${date}`,
      `Clan: ${players.length} Schülerinnen · GPS-Punkte: ${gpsCount}`,
      '',
      'Wiederherstellen: diesen Link auf dem Spiel-Tablet öffnen und „Übernehmen“ tippen.',
      '',
      fullLink,
      '',
    ].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    a.download = `SternenClan-Sicherung-${date}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
}

function viewSetup(data) {
  const setup = decodeSetup(data);
  if (!setup) {
    app.innerHTML = `<div class="card" style="margin-top:10vh"><h2>Einrichtung</h2><p class="warn">Dieser Einrichtungs-Link ist ungültig.</p><a class="btn ghost" href="#/">Zum Spiel</a></div>`;
    return;
  }
  const gpsCount = Object.keys(setup.geo).length;
  const withClan = setup.players.length > 0;
  app.innerHTML = `
    <div class="card" style="margin-top:10vh">
      <h2>${withClan ? 'Clan übernehmen?' : 'GPS-Punkte übernehmen?'}</h2>
      ${withClan ? `<p>${setup.players.length} Schülerinnen: ${setup.players.map(p => esc(p.apprentice)).join(', ')}</p>` : ''}
      ${gpsCount ? `<p>GPS-Positionen für ${gpsCount} Stationen.</p>` : ''}
      <p class="muted">${withClan ? 'Der bisherige Clan auf diesem Gerät wird ersetzt.' : 'Der Clan auf diesem Gerät bleibt, wie er ist.'} Der Spielstand bleibt erhalten.</p>
      <button class="btn block" id="take">Übernehmen</button>
    </div>`;
  app.querySelector('#take').onclick = () => {
    applySetup(setup);
    location.hash = state.prepared || state.startedAt ? '#/gm' : '#/';
  };
}

// ---------------------------------------------------------------------------
// Testmodus: alle Stationen durchblättern, Lösungen sehen, nichts wird gespeichert
// ---------------------------------------------------------------------------

const previewSteps = [
  { hash: '#/intro', label: 'Einleitung' },
  ...stations.map((s, i) => ({ hash: `#/s/${s.token}`, label: `${i + 1}/${stations.length} ${s.title}`, station: s })),
  { hash: '#/zeremonie', label: 'Kriegerzeremonie' },
];

function drawPreviewBar(page, arg) {
  let bar = document.getElementById('preview-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'preview-bar';
    bar.className = 'preview-bar';
    document.body.append(bar);
  }
  const pos = page === 'intro' ? 0
    : page === 's' && byToken(arg ?? '') ? stations.indexOf(byToken(arg)) + 1
    : page === 'zeremonie' ? previewSteps.length - 1
    : -1;
  const step = previewSteps[pos];
  const prev = previewSteps[pos - 1];
  const next = previewSteps[pos + 1] || (pos === -1 ? previewSteps[0] : null);

  bar.innerHTML = `
    ${prev ? `<a class="btn ghost small" href="${prev.hash}" aria-label="Zurück">◀</a>` : '<span></span>'}
    <div class="preview-info">
      <b>🧪 Testmodus</b> · ${step ? step.label : 'außerhalb der Stationen'}
      ${step?.station ? `<div>Lösung: <b>${answerOf(step.station)}</b></div>` : ''}
      <button class="preview-end" type="button">Testmodus beenden</button>
    </div>
    ${next ? `<a class="btn small" href="${next.hash}" aria-label="Weiter">▶</a>` : '<span></span>'}`;
  bar.querySelector('.preview-end').onclick = () => {
    setPreview(false);
    location.hash = '#/gm';
    location.reload();
  };
}

// ---------------------------------------------------------------------------
// Musik-Schalter (Browser erlauben Ton erst nach dem ersten Antippen)
// ---------------------------------------------------------------------------

const MUSIC_KEY = `${GAME.storageKey}-music`;
const musicWanted = () => {
  try { return localStorage.getItem(MUSIC_KEY) !== 'off'; } catch { return true; }
};
const musicButton = document.getElementById('music');

function updateMusicButton() {
  musicButton.textContent = isMusicPlaying() ? '🎵' : '🔇';
  musicButton.setAttribute('aria-label', isMusicPlaying() ? 'Musik aus' : 'Musik an');
}

musicButton.onclick = e => {
  e.stopPropagation();
  const on = !isMusicPlaying();
  on ? startMusic() : stopMusic();
  try { localStorage.setItem(MUSIC_KEY, on ? 'on' : 'off'); } catch { /* egal */ }
  updateMusicButton();
};

document.addEventListener('pointerdown', function firstTap() {
  document.removeEventListener('pointerdown', firstTap);
  preloadSounds();
  if (musicWanted()) startMusic();
  updateMusicButton();
});
updateMusicButton();

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js');
}

// Browser bitten, Clan, GPS-Punkte und Spielstand nicht automatisch aufzuräumen
navigator.storage?.persist?.();
