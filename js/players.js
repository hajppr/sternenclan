// Teilnehmerinnen: Standard aus config.js, überschreibbar in der Spielleitung (#/gm).
// Gespeichert getrennt vom Spielstand, damit „Spiel zurücksetzen“ den Clan nicht löscht.
import { GAME } from './config.js';

const KEY = `${GAME.storageKey}-players`;

export function getPlayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch { /* nichts gespeichert */ }
  return GAME.players;
}

export function savePlayers(players) {
  try { localStorage.setItem(KEY, JSON.stringify(players)); } catch { /* privater Modus */ }
}

export function resetPlayers() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}

// Für den Einrichtungs-Link (#/setup/…): { players, geo } als JSON → base64url und zurück.
export function encodeSetup(setup) {
  const bytes = new TextEncoder().encode(JSON.stringify(setup));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeSetup(text) {
  try {
    const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'));
    const data = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, c => c.charCodeAt(0))));
    const { players, geo = {} } = Array.isArray(data) ? { players: data } : data; // alte Links: nur Spielerinnen
    const validPlayers = Array.isArray(players) && players.length && players.every(p => p.apprentice && p.warrior && GAME.roles[p.role]);
    const validGeo = Object.values(geo).every(g => Number.isFinite(g.lat) && Number.isFinite(g.lon));
    return validPlayers && validGeo ? { players, geo } : null;
  } catch {
    return null;
  }
}

// Rollen-Rätsel: nur Rollen verwenden, die wirklich jemand hat (max. 4 Zeichen).
export function roleOrder(order) {
  const assigned = [...new Set(getPlayers().map(p => p.role))];
  const result = order.filter(r => assigned.includes(r));
  for (const r of assigned) if (result.length < 4 && !result.includes(r)) result.push(r);
  return result;
}

// Namensvorschläge im Warrior-Cats-Stil: Schülerin = Präfix + „pfote“, Kriegerin = Präfix + Suffix.
const PREFIXES = ['Funken', 'Blatt', 'Nebel', 'Stern', 'Mond', 'Sturm', 'Regen', 'Wolken', 'Schnee', 'Bernstein',
  'Distel', 'Farn', 'Rosen', 'Eis', 'Licht', 'Feder', 'Tau', 'Kiesel', 'Efeu', 'Honig', 'Glut', 'Silber', 'Moos', 'Beeren'];
const SUFFIXES = ['herz', 'sturm', 'flug', 'kralle', 'fell', 'pelz', 'schweif', 'blick', 'glanz', 'tatze', 'wind', 'licht'];

const pick = list => list[Math.floor(Math.random() * list.length)];

export function suggestNames(prefix) {
  const p = prefix || pick(PREFIXES);
  return { apprentice: `${p}pfote`, warrior: `${p}${pick(SUFFIXES)}` };
}
