// Territoriumskarte mit Nebel: gelöste Stationen und das nächste Ziel sind sichtbar, der Rest liegt im Dunst.
import { TERRITORY } from './territory.js';

const PAD = 110;

// Ausschnitt um die zuletzt gelöste Station und das Ziel (für die kompakte Ansicht)
function focusBox(points) {
  const { width: W, height: H } = TERRITORY;
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  let w = Math.max(Math.max(...xs) - Math.min(...xs) + PAD * 2, 300);
  let h = Math.max(Math.max(...ys) - Math.min(...ys) + PAD * 2, 240);
  // Seitenverhältnis 5:4, damit es auf Tablet und Handy gleich aussieht
  if (w / h > 1.25) h = w / 1.25; else w = h * 1.25;
  w = Math.min(w, W);
  h = Math.min(h, H);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  const x = Math.max(0, Math.min(W - w, cx - w / 2));
  const y = Math.max(0, Math.min(H - h, cy - h / 2));
  return `${x.toFixed(0)} ${y.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`;
}

export function mapSvg({ stations, solved, targetId, compact = false }) {
  const T = TERRITORY;
  const placed = stations.filter(s => s.map);
  const targetIndex = placed.findIndex(s => s.id === targetId);
  const target = placed[targetIndex];
  const done = placed.filter(s => solved[s.id]);

  // Pfotenspur: Lager → gelöste Stationen in Reihenfolge (über ihre Wegpunkte) → Ziel
  const stepsTo = s => [...(s.map.via || []).map(([x, y]) => ({ x, y })), s.map];
  const trail = [T.start, ...placed.slice(0, targetIndex === -1 ? placed.length : targetIndex).filter(s => solved[s.id]).flatMap(stepsTo)];
  const last = trail[trail.length - 1];
  const toPath = points => points.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const trailPath = toPath(trail);
  const nextPath = target ? toPath([last, ...stepsTo(target)]) : '';

  const holes = [
    `<circle cx="${T.start.x}" cy="${T.start.y}" r="85"/>`,
    ...done.map(s => `<circle cx="${s.map.x}" cy="${s.map.y}" r="80"/>`),
    target ? `<circle cx="${target.map.x}" cy="${target.map.y}" r="70"/>` : '',
  ].join('');

  const focusPoints = target ? [last, ...stepsTo(target)] : [last];
  const viewBox = compact ? focusBox(focusPoints) : `0 0 ${T.width} ${T.height}`;

  return `
    <svg class="territory" viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Karte des Territoriums">
      ${T.svg}
      <defs>
        <filter id="m-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
        <filter id="m-cloud" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="4" seed="7"/>
          <feColorMatrix values="0 0 0 0 0.86  0 0 0 0 0.82  0 0 0 0 0.74  0 0 0 1.6 -0.45"/>
        </filter>
        <mask id="m-fog" maskUnits="userSpaceOnUse" x="0" y="0" width="${T.width}" height="${T.height}">
          <rect width="${T.width}" height="${T.height}" fill="white"/>
          <g fill="black" filter="url(#m-blur)">${holes}</g>
        </mask>
      </defs>

      <g mask="url(#m-fog)">
        <rect width="${T.width}" height="${T.height}" fill="#2e2618" opacity="0.88"/>
        <rect width="${T.width}" height="${T.height}" filter="url(#m-cloud)" opacity="0.55"/>
      </g>

      <path d="${trailPath}" fill="none" stroke="#9c2f1a" stroke-width="4" stroke-dasharray="1 11" stroke-linecap="round"/>
      ${target ? `<path class="trail-next" d="${nextPath}" fill="none" stroke="#9c2f1a" stroke-width="3" stroke-dasharray="8 8" stroke-linecap="round"/>` : ''}

      ${done.map(s => `
        <g transform="translate(${s.map.x} ${s.map.y})">
          <circle r="14" fill="#f3e6c4" stroke="#7a5c34" stroke-width="2"/>
          <text text-anchor="middle" dominant-baseline="central" font-size="15">🐾</text>
        </g>`).join('')}

      ${target ? `
        <g transform="translate(${target.map.x} ${target.map.y})">
          <circle class="target-pulse" r="18" fill="none" stroke="#9c2f1a" stroke-width="3"/>
          <circle r="15" fill="#9c2f1a"/>
          <text text-anchor="middle" dominant-baseline="central" font-size="17" fill="#fff6d8" font-family="Georgia, serif" font-weight="bold">?</text>
        </g>` : ''}
    </svg>`;
}
