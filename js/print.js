import { GAME, lockCode } from './config.js';
import { getPlayers } from './players.js';

const players = getPlayers();

const base = new URL('./', location.href).href;
document.getElementById('base').textContent = base;

function qr(text) {
  const q = qrcode(0, 'M');
  q.addData(text);
  q.make();
  return q.createSvgTag({ cellSize: 4, margin: 2, scalable: true });
}

const stationCards = GAME.stations.filter((s, i) => i > 0).map(s => `
  <div class="card">
    <p class="title">🐾 Spur des SternenClans 🐾</p>
    <div class="qr">${qr(`${base}#/s/${s.token}`)}</div>
    <p class="code">Spurcode: ${s.token.toUpperCase()}</p>
  </div>`).join('');

const roleCards = players.map(p => {
  const r = GAME.roles[p.role];
  return `
    <div class="card">
      <p class="title">${GAME.clan}</p>
      <div class="symbol">${r.symbol}</div>
      <p><b>${p.apprentice}</b><br>${r.title}</p>
      <p class="small">${r.text}</p>
      <p class="small">Deine geheime Zahl – erst zeigen, wenn der Clan sie braucht:</p>
      <div class="digit">${r.digit}</div>
    </div>`;
}).join('');

const preyStation = GAME.stations.find(s => s.puzzle.type === 'prey');
const preyCards = preyStation ? preyStation.puzzle.prey.map(x => `
  <div class="card">
    <div class="symbol">${x.symbol}</div>
    <p>${x.name}</p>
    <div class="letter">${x.letter}</div>
  </div>`).join('') : '';

const certificates = players.map(p => `
  <div class="certificate">
    <p>Der SternenClan und ${GAME.leader.name}, ${GAME.leader.title} des ${GAME.clan}s, verkünden:</p>
    <p>Die Schülerin <b>${p.apprentice}</b> hat am 4. Dezember die Prüfung des SternenClans bestanden<br>und trägt von nun an den Kriegernamen</p>
    <div class="warrior">${p.warrior}</div>
    <p>${p.birthday ? 'Alles Gute zum 11. Geburtstag!' : 'Möge der SternenClan deine Pfade erleuchten.'}</p>
    <p style="font-size:2rem">🐾 ⭐ 🌙</p>
  </div>`).join('');

const gmSheet = `
  <table class="gm">
    <tr><th>#</th><th>Station</th><th>Versteck</th><th>Vorbereitung</th></tr>
    ${GAME.stations.map((s, i) => `<tr><td>${i + 1}</td><td><b>${s.title}</b><br>${s.place}<br>Code ${s.token.toUpperCase()}</td><td>${s.gm.hide}</td><td>${s.gm.prep || ''}</td></tr>`).join('')}
  </table>
  <p style="font-family:sans-serif">Zahlenschloss-Code: <b>${lockCode()}</b> · Spielleitung in der App: <code>${base}#/gm</code> (PIN ${GAME.gmPin})</p>`;

document.getElementById('out').innerHTML = `
  <section><h1>Spielleitung – nicht den Kindern zeigen!</h1>${gmSheet}</section>
  <section><h2>QR-Karten für die Stationen</h2><div class="grid three">${stationCards}</div></section>
  <section><h2>Rollenkarten</h2><div class="grid three">${roleCards}</div></section>
  ${preyCards ? `<section><h2>Beutekarten (Jagdgebiet)</h2><div class="grid three">${preyCards}</div></section>` : ''}
  <section><h2>Kriegerurkunden (in die Truhe)</h2>${certificates}</section>
  <section><h2>Start-QR (für Einladung oder Tisch)</h2><div class="grid three"><div class="card"><p class="title">${GAME.title}</p><div class="qr">${qr(base)}</div></div></div></section>`;
