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
