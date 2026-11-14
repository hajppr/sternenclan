// Mitspielende Kinder: werden in der Spielleitung (#/gm) eingetragen, es gibt keine Standardnamen.
// Gespeichert getrennt vom Spielstand, damit „Spielstand zurücksetzen“ den Clan nicht löscht.
import { GAME } from './config.js';

const KEY = `${GAME.storageKey}-players`;

export function getPlayers() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch { /* nichts gespeichert */ }
  return [];
}

export function clearPlayers() {
  try { localStorage.removeItem(KEY); } catch { /* egal */ }
}

export function savePlayers(players) {
  try { localStorage.setItem(KEY, JSON.stringify(players)); } catch { /* privater Modus */ }
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
    const { players = [], geo = {} } = Array.isArray(data) ? { players: data } : data; // alte Links: nur Spielerinnen
    // players darf leer sein (Link nur mit GPS-Punkten) – dann bleibt der Clan auf dem Gerät unverändert.
    const validPlayers = Array.isArray(players) && players.every(p => p.apprentice && p.warrior && GAME.roles[p.role]);
    const validGeo = Object.values(geo).every(g => Number.isFinite(g.lat) && Number.isFinite(g.lon));
    const hasContent = players.length || Object.keys(geo).length;
    return validPlayers && validGeo && hasContent ? { players, geo } : null;
  } catch {
    return null;
  }
}

// Rollen-Rätsel: nur Rollen verwenden, die wirklich jemand hat (max. 4 Zeichen).
export function roleOrder(order) {
  const assigned = [...new Set(getPlayers().map(p => p.role))];
  if (!assigned.length) return order.slice(0, 4); // noch kein Clan (z. B. Testmodus)
  const result = order.filter(r => assigned.includes(r));
  for (const r of assigned) if (result.length < 4 && !result.includes(r)) result.push(r);
  return result;
}

// Geschlecht: p.gender = 'w' | 'm' (fehlt = 'w', alte Einträge)
export const isMale = p => p?.gender === 'm';
export const gw = (p, w, m) => (isMale(p) ? m : w);

// Rollentitel für eine Person (Heilerin / Heiler)
export const roleTitle = p => {
  const r = GAME.roles[p.role];
  return r ? (isMale(p) ? r.m || r.title : r.title) : '';
};

// Rollentitel fürs Rollen-Rätsel: nach denen, die die Rolle haben (gemischt: „Jägerin/Jäger“)
export function roleLabel(key) {
  const r = GAME.roles[key];
  const holders = getPlayers().filter(p => p.role === key);
  const hasM = holders.some(isMale), hasW = holders.some(p => !isMale(p));
  if (hasM && hasW) return `${r.title}/${r.m}`;
  return hasM ? r.m : r.title;
}

// Sammelbegriff für die ganze Gruppe: nur Mädchen → w, nur Jungen → m, gemischt → beides
export function groupWord(w, m) {
  const ps = getPlayers();
  const hasM = ps.some(isMale), hasW = ps.some(p => !isMale(p));
  if (hasM && hasW) return `${w} und ${m}`;
  return hasM ? m : w;
}

// Namensvorschläge im Warrior-Cats-Stil: Schulname = Präfix + „pfote“, Kriegername = Präfix + Suffix.
const PREFIXES = {
  both: ['Funken', 'Blatt', 'Nebel', 'Stern', 'Mond', 'Sturm', 'Regen', 'Wolken', 'Schnee', 'Bernstein',
    'Distel', 'Farn', 'Eis', 'Licht', 'Kiesel', 'Glut', 'Silber', 'Moos'],
  w: ['Rosen', 'Feder', 'Tau', 'Efeu', 'Honig', 'Beeren', 'Blüten', 'Lilien'],
  m: ['Fels', 'Eichen', 'Dornen', 'Aschen', 'Falken', 'Donner', 'Flammen', 'Bären'],
};
const SUFFIXES = {
  both: ['herz', 'sturm', 'flug', 'kralle', 'fell', 'pelz', 'schweif', 'blick', 'tatze', 'wind', 'licht'],
  w: ['glanz', 'blüte', 'feder'],
  m: ['zahn', 'pranke', 'kralle'],
};

const pick = list => list[Math.floor(Math.random() * list.length)];

export function suggestNames(prefix, gender = 'w') {
  const g = gender === 'm' ? 'm' : 'w';
  const p = prefix || pick([...PREFIXES.both, ...PREFIXES[g]]);
  return { apprentice: `${p}pfote`, warrior: `${p}${pick([...SUFFIXES.both, ...SUFFIXES[g]])}` };
}
