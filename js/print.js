import { GAME, lockCode } from './config.js';
import { getPlayers } from './players.js';
import { PAW_SCRIPT } from './puzzles.js';
import { drawCertificate, loadCertificateFonts, certificateFileName, THEMES } from './certificate.js';

const players = getPlayers();

const base = new URL('./', location.href).href;
document.getElementById('base').textContent = base;

// Tinte-sparen-Schalter (nur Ansicht, wird im Browser gemerkt)
const eco = document.getElementById('eco');
try { eco.checked = localStorage.getItem('print-eco') === '1'; } catch { /* egal */ }
const applyEco = () => {
  document.body.classList.toggle('eco', eco.checked);
  try { localStorage.setItem('print-eco', eco.checked ? '1' : '0'); } catch { /* egal */ }
};
eco.onchange = applyEco;
applyEco();

function qr(text) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

// Augenfarbe je Rolle – wie die Katzen auf den Buchcovern
const EYE_COLORS = {
  heilerin: '#7ccf5f', jaegerin: '#f0a830', kaempferin: '#ff7a2a',
  faehrte: '#e9d145', waechterin: '#5d8dff', seherin: '#79d4ff',
};
const DEFAULT_EYES = '#e3b341';

let eyeId = 0;
function eyes(color = DEFAULT_EYES) {
  const id = `eye${eyeId++}`;
  const eye = cx => `
    <g transform="translate(${cx} 22)">
      <path d="M-24 0 Q0 -19 24 0 Q0 19 -24 0 Z" fill="#0b0f0d"/>
      <path d="M-21 0 Q0 -16 21 0 Q0 16 -21 0 Z" fill="url(#${id})"/>
      <path d="M0 -13 Q4 0 0 13 Q-4 0 0 -13 Z" fill="#050505"/>
      <circle cx="6" cy="-5" r="2.4" fill="#fff" opacity="0.9"/>
    </g>`;
  return `
    <svg class="eyes" viewBox="0 0 160 44" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" cx="50%" cy="45%" r="60%">
          <stop offset="0" stop-color="#fffbe6"/>
          <stop offset="0.35" stop-color="${color}"/>
          <stop offset="1" stop-color="${color}" stop-opacity="0.55"/>
        </radialGradient>
      </defs>
      ${eye(40)}${eye(120)}
    </svg>`;
}

// Waldsilhouette: Baumspitzen gleichmäßig über die ganze Breite (0–200)
const TREE_HEIGHTS = [11, 15, 7, 19, 10, 16, 8, 18, 12, 14, 9, 17, 10, 13, 6, 15, 11, 18, 9, 14, 7];
const forest = (() => {
  const step = 200 / TREE_HEIGHTS.length;
  const peaks = TREE_HEIGHTS.map((h, i) => `L${(i * step).toFixed(1)} 26 L${((i + 0.5) * step).toFixed(1)} ${26 - h}`).join(' ');
  return `
  <svg class="forest" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 30 ${peaks} L200 26 L200 30 Z"/>
  </svg>`;
})();

// Kopfleiste im Cover-Stil; color: null = ohne Augen
const band = (title, { color, sub } = {}) => `
  <div class="band">
    ${sub ? `<div class="caps">${sub}</div>` : ''}
    <div class="cover-title">${title}</div>
    ${color === null ? '' : eyes(color)}
  </div>`;

// ---------------------------------------------------------------------------

const stationCards = GAME.stations.filter((s, i) => i > 0).map(s => `
  <div class="card">
    ${band('Spur des SternenClans', { color: null })}
    <div class="body">
      <div class="qr">${qr(`${base}#/s/${s.token}`)}</div>
      <p class="spurcode">${s.token.toUpperCase()}</p>
    </div>
    ${forest}
  </div>`).join('');

const roleCards = players.map(p => {
  const r = GAME.roles[p.role];
  return `
    <div class="card">
      ${band(GAME.clan, { color: EYE_COLORS[p.role] })}
      <div class="body">
        <div class="symbol">${r.symbol}</div>
        <p class="apprentice">${p.apprentice}</p>
        <div class="caps role-title">${r.title}</div>
        <p class="role-text">${r.text}</p>
        <div class="secret">Deine geheime Zahl – erst zeigen, wenn der Clan sie braucht:
          <div class="digit">${r.digit}</div>
        </div>
      </div>
      ${forest}
    </div>`;
}).join('');

// Aushänge: ganze A4-Seite, hell (werden zu Hause gedruckt)
const sheetHead = (title, sub) => `
  <header class="sheet-head">
    <div class="caps">${sub}</div>
    <div class="cover-title">${title}</div>
    <div class="divider"><span>🐾</span></div>
  </header>`;

const pawTable = `
  <div class="sheet">
    ${sheetHead('Die Pfotenschrift', `des ${GAME.clan}s`)}
    <p class="lead">Jedes Zeichen steht für einen Buchstaben.</p>
    <div class="pawgrid">${Object.entries(PAW_SCRIPT).map(([l, g]) => `<div><span>${g}</span><b>${l}</b></div>`).join('')}</div>
  </div>`;

const herbStation = GAME.stations.find(s => s.puzzle.type === 'match');
const herbSheet = herbStation ? `
  <div class="sheet half">
    ${sheetHead('Vorrat der Heilerin', 'Das Wissen der Kräuter')}
    <ul class="herbs">${herbStation.puzzle.info.map(([name, use]) => `<li><b>${name}</b><span>${use}</span></li>`).join('')}</ul>
  </div>` : '';

const preyStation = GAME.stations.find(s => s.puzzle.type === 'prey');
const preyCards = preyStation ? preyStation.puzzle.prey.map(x => `
  <div class="card square">
    ${band('Beute', { color: null, sub: x.name })}
    <div class="body">
      <div class="symbol">${x.symbol}</div>
      <div class="letter">${x.letter}</div>
    </div>
    ${forest}
  </div>`).join('') : '';

// Urkunden: als Fotos 15 × 10 cm (JPG) für den Fotokiosk, siehe certificate.js
const certificates = `
  <p class="screen-only-inline">Jede Urkunde ist ein Foto im Format <b>15 × 10 cm</b> (1800 × 1200 px, 300 dpi) – für den Fotokiosk z. B. bei Rossmann oder Budni.
  <button type="button" id="all-certs">Alle herunterladen</button></p>
  <div class="photos" id="certs">${players.map(() => '<figure class="photo"><div class="photo-wait">Urkunde wird gezeichnet …</div></figure>').join('')}</div>`;

async function renderCertificates() {
  await loadCertificateFonts();
  const figures = [...document.querySelectorAll('#certs .photo')];
  // Geburtstagskind: „Feuer“ (erster Band), die anderen bekommen die übrigen Cover-Farbwelten
  let next = 1;
  const themes = players.map(p => (p.birthday ? THEMES[0] : THEMES[next++ % THEMES.length] || THEMES[1]));
  const links = await Promise.all(players.map(async (p, i) => {
    const canvas = drawCertificate(p, themes[i]);
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
    const url = URL.createObjectURL(blob);
    figures[i].innerHTML = `<img src="${url}" alt="Urkunde ${p.warrior}"><a class="download" href="${url}" download="${certificateFileName(p)}">⬇ ${certificateFileName(p)}</a>`;
    return figures[i].querySelector('a');
  }));
  document.getElementById('all-certs').onclick = () => links.forEach((a, i) => setTimeout(() => a.click(), i * 400));
}

const gmSheet = `
  <table class="gm">
    <tr><th>#</th><th>Station</th><th>Versteck</th><th>Vorbereitung</th></tr>
    ${GAME.stations.map((s, i) => `<tr><td>${i + 1}</td><td><b>${s.title}</b><br>${s.place}<br>Code ${s.token.toUpperCase()}</td><td>${s.gm.hide}</td><td>${s.gm.prep || ''}</td></tr>`).join('')}
  </table>
  <p style="font-family:sans-serif">Zahlenschloss-Code: <b>${lockCode()}</b> · Spielleitung in der App: <code>${base}#/gm</code> (PIN ${GAME.gmPin})</p>`;

// Abschnitte: Titel, Dateiname für „Als PDF“, Inhalt
const sections = [
  ['spielleitung', 'Spielleitung – nicht den Kindern zeigen!', gmSheet],
  ['qr-karten', 'QR-Karten für die Stationen', `<div class="grid">${stationCards}</div>`],
  ['rollenkarten', 'Rollenkarten', `<div class="grid">${roleCards}</div>`],
  ['pfotenschrift', 'Pfotenschrift-Tafel (Station 2, an der Haustür verstecken)', pawTable],
  herbSheet && ['vorrat-der-heilerin', 'Vorrat der Heilerin (Station 7, zur QR-Karte)', herbSheet],
  preyCards && ['beutekarten', 'Beutekarten (Jagdgebiet)', `<div class="grid">${preyCards}</div>`],
  ['urkunden', 'Kriegerurkunden (in die Truhe)', certificates],
  ['start-qr', 'Start-QR (für Einladung oder Tisch)', `<div class="grid"><div class="card">${band(GAME.title, { color: null })}<div class="body"><div class="qr">${qr(base)}</div></div>${forest}</div></div>`],
].filter(Boolean);

document.getElementById('out').innerHTML = sections.map(([id, title, html]) => `
  <section id="${id}">
    <h2>${title} <button type="button" class="pdf" data-pdf="${id}">📄 Als PDF</button></h2>
    ${html}
  </section>`).join('');

// „Als PDF“: Druckdialog nur mit diesem Abschnitt (Ziel „Als PDF speichern“ wählen)
document.querySelectorAll('[data-pdf]').forEach(btn => {
  btn.onclick = () => {
    const id = btn.dataset.pdf;
    document.body.dataset.only = id;
    document.getElementById(id).classList.add('only');
    document.title = `SternenClan-${id}`; // wird zum Dateinamen des PDFs
    window.print();
  };
});
window.addEventListener('afterprint', () => {
  delete document.body.dataset.only;
  document.querySelectorAll('section.only').forEach(s => s.classList.remove('only'));
  document.title = 'Druckvorlagen SternenClan';
});

renderCertificates();
