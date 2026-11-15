// GPS-Positionen der Verstecke („Witterung aufnehmen“). Die Spielleitung speichert sie beim Ablaufen der Strecke.
import { GAME } from './config.js';

const KEY = `${GAME.storageKey}-geo`;

export const hasGeolocation = 'geolocation' in navigator;

export function getGeo() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; }
}

export function saveGeo(geo) {
  try { localStorage.setItem(KEY, JSON.stringify(geo)); } catch { /* privater Modus */ }
}

// Position aus der Spielleitung, sonst optional fest aus config.js (station.geo)
export const stationGeo = station => getGeo()[station.id] || station.geo || null;

export function locate() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      p => resolve({ lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
      reject,
      { enableHighAccuracy: true, timeout: 60000, maximumAge: 0 },
    );
  });
}

export function watch(onPosition, onError) {
  const id = navigator.geolocation.watchPosition(
    p => onPosition({ lat: p.coords.latitude, lon: p.coords.longitude, acc: Math.round(p.coords.accuracy) }),
    onError,
    { enableHighAccuracy: true, timeout: 60000, maximumAge: 2000 },
  );
  return () => navigator.geolocation.clearWatch(id);
}

export function distance(a, b) {
  const R = 6371000;
  const rad = d => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const LEVELS = [
  { max: 12, emoji: '🔥', label: 'Hier ist es! Sucht die Spur!' },
  { max: 25, emoji: '🔥', label: 'Heiß!' },
  { max: 50, emoji: '☀️', label: 'Warm' },
  { max: 100, emoji: '🌤️', label: 'Lauwarm' },
  { max: 200, emoji: '🌧️', label: 'Kalt' },
  { max: Infinity, emoji: '❄️', label: 'Eiskalt' },
];

export function warmth(meters) {
  const i = LEVELS.findIndex(l => meters <= l.max);
  return { ...LEVELS[i], level: LEVELS.length - 1 - i };
}

// GPS → Position auf der gezeichneten Karte. Die Karte ist nicht maßstabsgetreu, deshalb:
// grobe Ausrichtung (affine Abbildung über alle Stationen mit GPS-Punkt), danach wird der
// Rest-Versatz der Stationen nach Nähe gewichtet verteilt – an den Stationen stimmt es genau.
export function mapProjector(stations) {
  const pts = stations
    .filter(s => s.map && stationGeo(s))
    .map(s => ({ geo: stationGeo(s), x: s.map.x, y: s.map.y }));
  if (pts.length < 3) return null;

  const lat0 = pts.reduce((a, p) => a + p.geo.lat, 0) / pts.length;
  const lon0 = pts.reduce((a, p) => a + p.geo.lon, 0) / pts.length;
  const kx = 111320 * Math.cos((lat0 * Math.PI) / 180);
  const local = g => [(g.lon - lon0) * kx, (g.lat - lat0) * 110540, 1]; // Meter

  const P = pts.map(p => local(p.geo));
  const fit = key => {
    const N = [0, 1, 2].map(i => [0, 1, 2].map(j => P.reduce((a, r) => a + r[i] * r[j], 0)));
    const b = [0, 1, 2].map(i => P.reduce((a, r, n) => a + r[i] * pts[n][key], 0));
    for (let i = 0; i < 3; i++) for (let j = i + 1; j < 3; j++) {
      const f = N[j][i] / N[i][i];
      N[j] = N[j].map((v, c) => v - f * N[i][c]);
      b[j] -= f * b[i];
    }
    const x = [0, 0, 0];
    for (let i = 2; i >= 0; i--) x[i] = (b[i] - (i < 2 ? N[i][i + 1] * x[i + 1] : 0) - (i < 1 ? N[i][2] * x[2] : 0)) / N[i][i];
    return x;
  };
  const ax = fit('x');
  const ay = fit('y');
  if (![...ax, ...ay].every(Number.isFinite)) return null;
  const affine = r => [ax[0] * r[0] + ax[1] * r[1] + ax[2], ay[0] * r[0] + ay[1] * r[1] + ay[2]];
  const rest = P.map((r, n) => { const [x, y] = affine(r); return [pts[n].x - x, pts[n].y - y]; });

  return geo => {
    const r = local(geo);
    const [x, y] = affine(r);
    let w = 0, dx = 0, dy = 0;
    for (let n = 0; n < P.length; n++) {
      const d2 = (r[0] - P[n][0]) ** 2 + (r[1] - P[n][1]) ** 2;
      if (d2 < 1) return { x: pts[n].x, y: pts[n].y };
      const wn = 1 / d2;
      w += wn; dx += wn * rest[n][0]; dy += wn * rest[n][1];
    }
    return { x: x + dx / w, y: y + dy / w };
  };
}
