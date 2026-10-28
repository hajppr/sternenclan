// Vorlesen (Sprachausgabe des Geräts) sowie Musik und Klänge – alles per Web Audio
// erzeugt, also offline und ohne Audiodateien oder Lizenzen.

const synth = window.speechSynthesis;

function germanVoice() {
  const voices = synth?.getVoices() || [];
  return voices.find(v => v.lang === 'de-DE' && v.localService) || voices.find(v => v.lang?.startsWith('de'));
}

export const canSpeak = !!synth;

export function speak(text, { whisper = false } = {}) {
  if (!synth) return;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'de-DE';
  u.voice = germanVoice() || null;
  u.rate = whisper ? 0.75 : 0.9;
  u.pitch = whisper ? 1.25 : 1;
  // Musik leiser, solange gesprochen wird
  u.onstart = () => duck(true);
  u.onend = u.onerror = () => duck(false);
  synth.speak(u);
}

export function stopSpeaking() {
  synth?.cancel();
  duck(false);
}

// ---------------------------------------------------------------------------
// Audio-Grundgerüst
// ---------------------------------------------------------------------------

const MUSIC_VOLUME = 0.35;
let audio, sfxBus, musicBus;

function ctx() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    sfxBus = audio.createGain();
    sfxBus.connect(audio.destination);
    musicBus = audio.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(audio.destination);
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function safe(fn) {
  return (...args) => {
    try { fn(...args); } catch (e) { console.debug('Audio nicht verfügbar', e); }
  };
}

function tone(freq, start, { dur = 1, type = 'triangle', vol = 0.15, attack = 0.02, to = sfxBus, glide } = {}) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (glide) osc.frequency.exponentialRampToValueAtTime(glide, start + dur);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(vol, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(to);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

let noiseBuffer;
function noise() {
  if (!noiseBuffer) {
    noiseBuffer = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = audio.createBufferSource();
  src.buffer = noiseBuffer;
  return src;
}

// ---------------------------------------------------------------------------
// Klänge
// ---------------------------------------------------------------------------

// Richtig: aufsteigendes Glockenspiel
export const chime = safe(() => {
  const now = ctx().currentTime;
  [659.25, 783.99, 1046.5, 1318.5, 1568].forEach((f, i) => {
    tone(f, now + i * 0.11, { dur: 1.4, vol: 0.16 });
    tone(f * 2, now + i * 0.11, { dur: 0.6, vol: 0.03, type: 'sine' });
  });
});

// Falsch: kurzes Katzenfauchen + tiefer Ton
export const hiss = safe(() => {
  const now = ctx().currentTime;
  const src = noise();
  const filter = audio.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 2500;
  const gain = audio.createGain();
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.22, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
  src.connect(filter).connect(gain).connect(sfxBus);
  src.start(now, Math.random());
  src.stop(now + 0.55);
  tone(196, now + 0.05, { dur: 0.5, vol: 0.12, glide: 147 });
});

// Tipp: kurzer Sternenschimmer
export const shimmer = safe(() => {
  const now = ctx().currentTime;
  [1760, 2093, 2637, 2093].forEach((f, i) => tone(f, now + i * 0.06, { dur: 0.7, vol: 0.05, type: 'sine' }));
});

// Zeremonie: kleine Fanfare
export const fanfare = safe(() => {
  const now = ctx().currentTime;
  const notes = [[523.25, 0], [659.25, 0.18], [783.99, 0.36], [1046.5, 0.6]];
  notes.forEach(([f, t]) => {
    tone(f, now + t, { dur: t === 0.6 ? 2.2 : 0.5, vol: 0.14, type: 'sawtooth', attack: 0.03 });
    tone(f / 2, now + t, { dur: t === 0.6 ? 2.2 : 0.5, vol: 0.08 });
  });
  [1318.5, 1568, 2093].forEach((f, i) => tone(f, now + 0.8 + i * 0.12, { dur: 1.5, vol: 0.05, type: 'sine' }));
});

// ---------------------------------------------------------------------------
// Hintergrundmusik: Wind, langsame Akkorde, Sternenfunkeln, ab und zu eine Eule
// ---------------------------------------------------------------------------

// D-Moll, B-Dur, F-Dur, C-Dur – ruhig und ein bisschen geheimnisvoll
const CHORDS = [
  [146.83, 220.0, 293.66, 349.23],
  [116.54, 233.08, 293.66, 349.23],
  [174.61, 220.0, 261.63, 349.23],
  [130.81, 196.0, 261.63, 329.63],
];
const SPARKLE = [587.33, 659.25, 880, 1046.5, 1174.66, 1318.5];
const CHORD_SECONDS = 9;

let playing = false;
let timers = [];
let wind;

function startWind() {
  const src = noise();
  src.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 500;
  filter.Q.value = 0.8;
  const lfo = audio.createOscillator();
  const lfoGain = audio.createGain();
  lfo.frequency.value = 0.07;
  lfoGain.gain.value = 300;
  lfo.connect(lfoGain).connect(filter.frequency);
  const gain = audio.createGain();
  gain.gain.value = 0.12;
  src.connect(filter).connect(gain).connect(musicBus);
  src.start();
  lfo.start();
  wind = [src, lfo];
}

function padChord(i) {
  const start = audio.currentTime + 0.05;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.connect(musicBus);
  CHORDS[i % CHORDS.length].forEach(f => {
    [-4, 4].forEach(detune => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'triangle';
      osc.frequency.value = f;
      osc.detune.value = detune;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.035, start + 3);
      gain.gain.setValueAtTime(0.035, start + CHORD_SECONDS - 1);
      gain.gain.linearRampToValueAtTime(0, start + CHORD_SECONDS + 2.5);
      osc.connect(gain).connect(filter);
      osc.start(start);
      osc.stop(start + CHORD_SECONDS + 3);
    });
  });
}

function owl() {
  const now = audio.currentTime;
  [0, 0.55].forEach(t => tone(420, now + t, { dur: 0.45, vol: 0.06, type: 'sine', attack: 0.08, glide: 360, to: musicBus }));
}

function loop(fn, minMs, maxMs) {
  const next = () => {
    const id = setTimeout(() => {
      if (!playing) return;
      safe(fn)();
      next();
    }, minMs + Math.random() * (maxMs - minMs));
    timers.push(id);
  };
  next();
}

export const startMusic = safe(() => {
  if (playing) return;
  ctx();
  playing = true;
  startWind();
  let chord = 0;
  padChord(chord++);
  const id = setInterval(() => playing && safe(padChord)(chord++), CHORD_SECONDS * 1000);
  timers.push(id);
  loop(() => tone(SPARKLE[Math.floor(Math.random() * SPARKLE.length)], audio.currentTime, { dur: 2.5, vol: 0.025, type: 'sine', to: musicBus }), 2500, 7000);
  loop(owl, 25000, 60000);
  musicBus.gain.cancelScheduledValues(audio.currentTime);
  musicBus.gain.linearRampToValueAtTime(MUSIC_VOLUME, audio.currentTime + 3);
});

export const stopMusic = safe(() => {
  if (!playing) return;
  playing = false;
  timers.forEach(id => { clearTimeout(id); clearInterval(id); });
  timers = [];
  const now = audio.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(musicBus.gain.value, now);
  musicBus.gain.linearRampToValueAtTime(0, now + 1);
  const [src, lfo] = wind;
  src.stop(now + 1.1);
  lfo.stop(now + 1.1);
});

export const isMusicPlaying = () => playing;

const duck = safe(down => {
  if (!playing || !audio) return;
  const now = audio.currentTime;
  musicBus.gain.cancelScheduledValues(now);
  musicBus.gain.setValueAtTime(musicBus.gain.value, now);
  musicBus.gain.linearRampToValueAtTime(down ? MUSIC_VOLUME * 0.25 : MUSIC_VOLUME, now + 0.4);
});

// Im Hintergrund (Bildschirm aus) Audio pausieren – spart Akku
document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else audio.resume();
});
