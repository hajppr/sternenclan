import { GAME, lockCode, roman } from './config.js';
import { getPlayers, roleTitle } from './players.js';
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
// Katzenauge: Mandelform, außen leicht hochgezogen, Schlitzpupille bleibt innerhalb der Iris
const EYE = {
  lid: 'M-25 0 C-15 -17 15 -17 25 0 C15 17 -15 17 -25 0 Z',
  iris: 'M-22 0 C-13 -15 13 -15 22 0 C13 15 -13 15 -22 0 Z',
  pupil: 'M0 -10 C5.5 -4 5.5 4 0 10 C-5.5 4 -5.5 -4 0 -10 Z',
};
// flip: auf dem Kopf (für Faltkarten-Rückseiten). Gedreht wird innerhalb des SVG –
// eine CSS-Drehung macht die Farbverläufe im PDF kaputt.
function eyes(color = DEFAULT_EYES, flip = false) {
  const id = `eye${eyeId++}`;
  const eye = (cx, tilt) => `
    <g transform="translate(${cx} 22) rotate(${tilt})">
      <path d="${EYE.lid}" fill="#0b0f0d"/>
      <path d="${EYE.iris}" fill="url(#${id})"/>
      <path d="${EYE.iris}" fill="url(#${id}-lid)"/>
      <path d="${EYE.pupil}" fill="#050505"/>
      <circle cx="5" cy="-5" r="2.3" fill="#fff" opacity="0.9"/>
      <circle cx="-4" cy="4" r="1" fill="#fff" opacity="0.5"/>
    </g>`;
  return `
    <svg class="eyes" viewBox="0 0 160 44" aria-hidden="true">
      <defs>
        <radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="22">
          <stop offset="0" stop-color="#fffbe6"/>
          <stop offset="0.3" stop-color="${color}"/>
          <stop offset="0.8" stop-color="${color}"/>
          <stop offset="1" stop-color="#3a2400"/>
        </radialGradient>
        <linearGradient id="${id}-lid" gradientUnits="userSpaceOnUse" x1="0" y1="-12" x2="0" y2="12">
          <stop offset="0" stop-color="#000" stop-opacity="0.5"/>
          <stop offset="0.4" stop-color="#000" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <g ${flip ? 'transform="rotate(180 80 22)"' : ''}>${eye(40, 8)}${eye(120, -8)}</g>
    </svg>`;
}

// Waldsilhouette: Baumspitzen gleichmäßig über die ganze Breite (0–200)
const TREE_HEIGHTS = [11, 15, 7, 19, 10, 16, 8, 18, 12, 14, 9, 17, 10, 13, 6, 15, 11, 18, 9, 14, 7];
const forestSvg = (flip = false) => {
  const step = 200 / TREE_HEIGHTS.length;
  const peaks = TREE_HEIGHTS.map((h, i) => `L${(i * step).toFixed(1)} 26 L${((i + 0.5) * step).toFixed(1)} ${26 - h}`).join(' ');
  return `
  <svg class="forest" viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true">
    <path d="M0 30 ${peaks} L200 26 L200 30 Z" ${flip ? 'transform="rotate(180 100 15)"' : ''}/>
  </svg>`;
};
const forest = forestSvg();

// Kopfleiste im Cover-Stil; color: null = ohne Augen
const band = (title, { color, sub } = {}) => `
  <div class="band">
    ${sub ? `<div class="caps">${sub}</div>` : ''}
    <div class="cover-title">${title}</div>
    ${color === null ? '' : eyes(color)}
  </div>`;

// ---------------------------------------------------------------------------

// Faltkarten: oben Vorderseite, unten Deko-Rückseite. Die Rückseite steht auf dem Kopf,
// damit sie nach dem Knicken richtig herum ist.
// Rückseite steht auf dem Kopf; Schrift einzeln gedreht, Grafiken im SVG gedreht
const backFace = (sub, title) => `
    <div class="face back">
      ${forestSvg(true)}
      <div class="band">
        ${eyes(DEFAULT_EYES, true)}
        <div class="cover-title upside-down">${title}</div>
        <div class="caps upside-down">${sub}</div>
      </div>
    </div>`;

const stationCards = GAME.stations.map((s, i) => ({ s, num: roman(i + 1) })).filter((x, i) => i > 0).map(({ s, num }) => `
  <div class="fold">
    <div class="face front">
      <div class="qr">${qr(`${base}#/s/${s.token}`)}</div>
      <p class="station-name"><span class="num">${num}</span> ${s.title}</p>
      <p class="spurcode">${s.token.toUpperCase()}</p>
    </div>
    ${backFace('Spur des', 'SternenClans')}
  </div>`).join('');

const noPlayers = '<p class="screen-only-inline"><b>Noch keine Kinder eingetragen.</b> Erst in der App unter Spielleitung → „Clan einrichten“ eintragen und speichern (an diesem Gerät).</p>';

const roleCards = !players.length ? noPlayers : players.map(p => {
  const r = GAME.roles[p.role];
  return `
    <div class="card">
      ${band(GAME.clan, { color: EYE_COLORS[p.role] })}
      <div class="body">
        <p class="apprentice" style="--len: ${[...p.apprentice].length}">${p.apprentice}</p>
        <div class="caps role-title">${roleTitle(p)}</div>
        <p class="role-text">${r.text}</p>
        <div class="secret">Geheime Zahl – nur zeigen, wenn der Clan sie braucht:
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
  <div class="fold">
    <div class="face front prey">
      ${band('Beute', { color: null, sub: x.name })}
      <div class="body">
        <img class="prey-photo" src="${x.photo}" alt="${x.name}">
        <div class="letter">${x.letter}</div>
      </div>
    </div>
    ${backFace('Jagdgebiet des', 'SternenClans')}
  </div>`).join('') : '';

// Urkunden: als Fotos 15 × 10 cm (JPG) für den Fotokiosk, siehe certificate.js
const certificates = `
  <p class="screen-only-inline">Jede Urkunde ist ein Foto im Format <b>15 × 10 cm</b> (1800 × 1200 px, 300 dpi) – für den Fotokiosk z. B. bei Rossmann oder Budni.
  <button type="button" id="all-certs">Alle herunterladen</button></p>
  ${players.length ? '' : noPlayers}
  <div class="photos" id="certs">${players.map(() => '<figure class="photo"><div class="photo-wait">Urkunde wird gezeichnet …</div></figure>').join('')}</div>`;

async function renderCertificates() {
  await loadCertificateFonts();
  const figures = [...document.querySelectorAll('#certs .photo')];
  // Jede bekommt reihum eine der Cover-Farbwelten
  const themes = players.map((p, i) => THEMES[i % THEMES.length]);
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
    ${GAME.stations.map((s, i) => `<tr><td><b>${roman(i + 1)}</b></td><td><b>${s.title}</b><br>${s.place}<br>Code ${s.token.toUpperCase()}</td><td>${s.gm.hide}</td><td>${s.gm.prep || ''}</td></tr>`).join('')}
  </table>
  <p style="font-family:sans-serif">Zahlenschloss-Code: <b>${lockCode()}</b> · Spielleitung in der App: <code>${base}#/gm</code> (PIN ${GAME.gmPin})</p>`;

// Abschnitte: Titel, Dateiname für „Als PDF“, Inhalt
const sections = [
  ['spielleitung', 'Spielleitung – nicht den Kindern zeigen!', gmSheet],
  ['qr-karten', 'QR-Karten für die Stationen (ausschneiden, an der gestrichelten Linie knicken, zusammenkleben)', `<div class="folds">${stationCards}</div>`],
  ['rollenkarten', 'Rollenkarten', `<div class="grid two">${roleCards}</div>`],
  ['pfotenschrift', 'Pfotenschrift-Tafel (Station 2, an der Haustür verstecken)', pawTable],
  herbSheet && ['vorrat-der-heilerin', 'Vorrat der Heilerin (Station 7, zur QR-Karte)', herbSheet],
  preyCards && ['beutekarten', 'Beutekarten (Jagdgebiet; ausschneiden, an der gestrichelten Linie knicken, zusammenkleben)', `<div class="folds">${preyCards}</div>`],
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
