// Kriegerurkunde als Foto (15 × 10 cm bei 300 dpi = 1800 × 1200 px) für Fotokioske.
// Vollflächig dunkel im Stil der Buchcover, jede Urkunde in einer eigenen Farbwelt.
// Gezeichnet auf Canvas, damit das Bild unabhängig vom Browser genau so aussieht.
import { GAME } from './config.js';

const W = 1800;
const H = 1200;
const SAFE = 60; // Kioske beschneiden manchmal etwas – Schrift bleibt innerhalb

const TITLE = '"Cinzel", Georgia, serif';
const BODY = '"EB Garamond", "Palatino Linotype", Georgia, serif';

// Farbwelten nach den Buchcovern: Himmel oben/unten, Leuchten hinter den Augen, Augenfarbe
export const THEMES = [
  { name: 'Feuer', top: '#5a2410', bottom: '#140805', glow: '#ff8a3a', eyes: '#9be35a' },
  { name: 'Nebel', top: '#3a5266', bottom: '#0c141b', glow: '#8fb3cf', eyes: '#f2a531' },
  { name: 'Sturm', top: '#55524d', bottom: '#1c0d07', glow: '#ff6a1f', eyes: '#ff7a1f' },
  { name: 'Eis', top: '#5f86a3', bottom: '#0e1d2b', glow: '#cfeeff', eyes: '#5fd0ff' },
  { name: 'Dämmerung', top: '#7a3c12', bottom: '#0f2416', glow: '#ffb04a', eyes: '#8ee05a' },
  { name: 'Mitternacht', top: '#45306a', bottom: '#100a1c', glow: '#a98ce0', eyes: '#f5c542' },
  { name: 'Sternenglanz', top: '#3b4866', bottom: '#0b1222', glow: '#f3dcb0', eyes: '#ffa53a' },
  { name: 'Mission', top: '#1e5a9a', bottom: '#081830', glow: '#7fc4ff', eyes: '#ffe14a' },
];

export async function loadCertificateFonts() {
  await Promise.all([
    document.fonts.load(`800 100px ${TITLE}`),
    document.fonts.load(`600 40px ${TITLE}`),
    document.fonts.load(`400 40px ${BODY}`),
    document.fonts.load(`italic 400 40px ${BODY}`),
  ]);
}

function text(ctx, str, x, y, { font, color, spacing = 0, glow, shadow = true } = {}) {
  ctx.save();
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.letterSpacing = `${spacing}px`;
  if (glow) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 30;
    ctx.fillText(str, x, y);
  }
  if (shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.85)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
  }
  ctx.fillText(str, x, y);
  ctx.restore();
}

function wrap(ctx, str, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of str.split(' ')) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  return [...lines, line];
}

// Katzenauge (gleiche Form wie auf den Druckkarten), Maßstab s
function eye(ctx, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  ctx.fillStyle = '#060807';
  ctx.fill(new Path2D('M-24 0 Q0 -19 24 0 Q0 19 -24 0 Z'));
  const iris = ctx.createRadialGradient(0, -2, 0, 0, 0, 22);
  iris.addColorStop(0, '#fffbe6');
  iris.addColorStop(0.35, color);
  iris.addColorStop(1, `${color}99`);
  ctx.fillStyle = iris;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.fill(new Path2D('M-21 0 Q0 -16 21 0 Q0 16 -21 0 Z'));
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#050505';
  ctx.fill(new Path2D('M0 -13 Q4 0 0 13 Q-4 0 0 -13 Z'));
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.beginPath();
  ctx.arc(6, -5, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function forest(ctx, y, h) {
  const heights = [11, 15, 7, 19, 10, 16, 8, 18, 12, 14, 9, 17, 10, 13, 6, 15, 11, 18, 9, 14, 7, 16, 12, 19, 8, 15, 10, 17];
  const step = W / heights.length;
  const base = y + h * 0.8;
  ctx.beginPath();
  ctx.moveTo(0, H);
  heights.forEach((t, i) => {
    ctx.lineTo(i * step, base);
    ctx.lineTo((i + 0.5) * step, base - (t / 20) * h * 0.8);
  });
  ctx.lineTo(W, base);
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = '#050806';
  ctx.fill();
}

function moon(ctx, x, y, r) {
  // Sichel: Vollmond, aus dem ein versetzter Kreis ausgestanzt wird
  const size = Math.ceil(r * 2 + 4);
  const layer = document.createElement('canvas');
  layer.width = layer.height = size;
  const m = layer.getContext('2d');
  m.fillStyle = '#fff3cf';
  m.beginPath();
  m.arc(size / 2, size / 2, r, 0, Math.PI * 2);
  m.fill();
  m.globalCompositeOperation = 'destination-out';
  m.beginPath();
  m.arc(size / 2 + r * 0.5, size / 2 - r * 0.25, r * 0.85, 0, Math.PI * 2);
  m.fill();
  ctx.save();
  ctx.shadowColor = 'rgba(255,245,210,0.85)';
  ctx.shadowBlur = 40;
  ctx.drawImage(layer, x - size / 2, y - size / 2);
  ctx.restore();
}

export function drawCertificate(player, theme = THEMES[0]) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const { name: leader, title } = GAME.leader;

  // Himmel vollflächig, Leuchten hinter den Augen
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, theme.top);
  sky.addColorStop(1, theme.bottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 360, 0, W / 2, 360, 700);
  glow.addColorStop(0, `${theme.glow}55`);
  glow.addColorStop(1, `${theme.glow}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  // dunkle Vignette, damit der Text gut lesbar bleibt
  const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  // Sterne (fester Zufall, damit jede Urkunde gleich aussieht, wenn man sie neu erzeugt)
  let seed = player.warrior.length * 97 + 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  ctx.fillStyle = '#fff';
  for (let i = 0; i < 110; i++) {
    ctx.globalAlpha = 0.3 + rand() * 0.7;
    ctx.beginPath();
    ctx.arc(rand() * W, rand() * H * 0.75, 0.8 + rand() * 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Feine Goldlinie innerhalb des sicheren Bereichs
  ctx.strokeStyle = 'rgba(232,194,106,0.55)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(SAFE, SAFE, W - 2 * SAFE, H - 2 * SAFE, 24);
  ctx.stroke();

  const gold = '#e8c26a';
  const light = '#f5ecd6';

  text(ctx, GAME.clan.toUpperCase(), W / 2, 150, { font: `600 42px ${TITLE}`, color: gold, spacing: 14 });
  text(ctx, 'KRIEGERURKUNDE', W / 2, 262, { font: `800 118px ${TITLE}`, color: gold, spacing: 14, glow: `${theme.glow}aa` });
  eye(ctx, W / 2 - 200, 400, 4, theme.eyes);
  eye(ctx, W / 2 + 200, 400, 4, theme.eyes);
  moon(ctx, W / 2 + 560, 395, 62);

  text(ctx, `Der SternenClan und ${leader}, ${title} des ${GAME.clan}s, verkünden:`, W / 2, 575, { font: `400 46px ${BODY}`, color: light });
  ctx.font = `400 46px ${BODY}`;
  wrap(ctx, `Die Schülerin ${player.apprentice} hat am 4. Dezember die Prüfung des SternenClans bestanden und trägt von nun an den Kriegernamen`, W - 2 * SAFE - 260)
    .forEach((line, i) => text(ctx, line, W / 2, 650 + i * 58, { font: `400 46px ${BODY}`, color: light }));

  text(ctx, player.warrior.toUpperCase(), W / 2, 890, { font: `800 150px ${TITLE}`, color: gold, spacing: 10, glow: `${theme.glow}cc` });
  text(ctx, player.birthday ? 'Alles Gute zum 11. Geburtstag!' : 'Möge der SternenClan deine Pfade erleuchten.', W / 2, 985,
    { font: `italic 400 52px ${BODY}`, color: light });

  forest(ctx, H - 150, 150);

  return canvas;
}

export const certificateFileName = player => `Urkunde-${player.warrior.replace(/[^\wäöüÄÖÜß-]+/g, '_')}.jpg`;
