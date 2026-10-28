// Musik und Klänge. Naturgeräusche (Eule, Wind, Fauchen, Miau) sind echte Aufnahmen aus sounds/
// (Lizenzen: sounds/LIZENZEN.md), Melodien sind gezupfte Saiten (Karplus-Strong), alles mit Waldhall.
// Fehlt eine Aufnahme, springt ein synthetischer Ersatzklang ein.

// ---------------------------------------------------------------------------
// Audio-Grundgerüst
// ---------------------------------------------------------------------------

const MUSIC_VOLUME = 0.35;
const SAMPLES = { owl1: 'sounds/owl1.m4a', owl2: 'sounds/owl2.m4a', wind: 'sounds/wind.m4a', hiss: 'sounds/hiss.m4a', meow: 'sounds/meow.m4a' };

let audio, sfxBus, musicBus;
const samples = {};

function ctx() {
  if (!audio) {
    audio = new (window.AudioContext || window.webkitAudioContext)();
    const reverb = audio.createConvolver();
    reverb.buffer = forestReverb(2.6);
    reverb.connect(audio.destination);

    sfxBus = audio.createGain();
    sfxBus.connect(audio.destination);
    const sfxSend = audio.createGain();
    sfxSend.gain.value = 0.35;
    sfxBus.connect(sfxSend).connect(reverb);

    musicBus = audio.createGain();
    musicBus.gain.value = 0;
    musicBus.connect(audio.destination);
    const musicSend = audio.createGain();
    musicSend.gain.value = 0.6;
    musicBus.connect(musicSend).connect(reverb);

    loadSamples();
  }
  if (audio.state === 'suspended') audio.resume();
  return audio;
}

function loadSamples() {
  Object.entries(SAMPLES).forEach(([name, url]) => {
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(data => audio.decodeAudioData(data))
      .then(buffer => { samples[name] = buffer; })
      .catch(e => console.debug('Klang nicht geladen', name, e));
  });
}

// Raumklang: abklingendes Rauschen als Impulsantwort – klingt nach offenem Wald
function forestReverb(seconds) {
  const length = Math.floor(audio.sampleRate * seconds);
  const ir = audio.createBuffer(2, length, audio.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3.5;
  }
  return ir;
}

function safe(fn) {
  return (...args) => {
    try { fn(...args); } catch (e) { console.debug('Audio nicht verfügbar', e); }
  };
}

function play(buffer, when, { gain = 1, to = sfxBus, rate = 1, loop = false } = {}) {
  const src = audio.createBufferSource();
  const g = audio.createGain();
  src.buffer = buffer;
  src.loop = loop;
  src.playbackRate.value = rate;
  g.gain.value = gain;
  src.connect(g).connect(to);
  src.start(when);
  return src;
}

function tone(freq, start, { dur = 1, type = 'sine', vol = 0.15, attack = 0.02, to = sfxBus, glide } = {}) {
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

// Gezupfte Saite (Karplus-Strong): klingt wie Harfe/Kalimba statt wie Synthesizer
const plucks = {};
function pluck(freq, seconds = 2.5) {
  const key = Math.round(freq);
  if (plucks[key]) return plucks[key];
  const sr = audio.sampleRate;
  const length = Math.floor(sr * seconds);
  const buffer = audio.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);
  const period = Math.round(sr / freq);
  const ring = new Float32Array(period);
  for (let i = 0; i < period; i++) ring[i] = Math.random() * 2 - 1;
  for (let i = 1; i < period; i++) ring[i] = (ring[i] + ring[i - 1]) / 2; // weicher Anschlag
  for (let i = 0, idx = 0; i < length; i++) {
    const next = (idx + 1) % period;
    out[i] = ring[idx];
    ring[idx] = 0.4985 * (ring[idx] + ring[next]);
    idx = next;
  }
  return (plucks[key] = buffer);
}

function harp(notes, { spacing = 0.09, gain = 0.3, to = sfxBus } = {}) {
  const now = ctx().currentTime + 0.02;
  notes.forEach((f, i) => play(pluck(f), now + i * spacing, { gain, to }));
}

// ---------------------------------------------------------------------------
// Klänge
// ---------------------------------------------------------------------------

// Richtig: fröhliches Miau, dahinter leise die aufsteigende Harfe
export const chime = safe(() => {
  const now = ctx().currentTime;
  if (samples.meow) {
    play(samples.meow, now, { gain: 0.5 });
    setTimeout(() => harp([587.33, 739.99, 880, 1174.66, 1479.98], { gain: 0.18 }), 350);
    return;
  }
  harp([587.33, 739.99, 880, 1174.66, 1479.98], { gain: 0.32 });
});

// Falsch: Katzenfauchen (nur der Fauch-Teil der Aufnahme, etwas leiser)
export const hiss = safe(() => {
  const now = ctx().currentTime;
  if (samples.hiss) return play(samples.hiss, now, { gain: 0.5 });
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
});

// Tipp: zwei leise hohe Saiten
export const shimmer = safe(() => harp([1760, 2349.32], { spacing: 0.12, gain: 0.14 }));

// Zeremonie: Harfen-Glissando über zwei Oktaven mit Grundton
export const fanfare = safe(() => {
  harp([293.66, 369.99, 440, 587.33, 739.99, 880, 1174.66, 1479.98], { spacing: 0.07, gain: 0.3 });
  harp([146.83], { gain: 0.45 });
});

// ---------------------------------------------------------------------------
// Hintergrundmusik: Wind, leise Flächen, gezupfte Töne, ab und zu ein Waldkauz
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
let windSources = [];

function startWind() {
  const now = audio.currentTime;
  if (samples.wind) {
    // zwei versetzte Schleifen, damit die Ein-/Ausblendungen der Aufnahme nicht auffallen
    const half = samples.wind.duration / 2;
    windSources = [play(samples.wind, now, { gain: 0.5, to: musicBus, loop: true }),
      play(samples.wind, now + half, { gain: 0.5, to: musicBus, loop: true })];
    return;
  }
  const src = noise();
  src.loop = true;
  const filter = audio.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 500;
  filter.Q.value = 0.8;
  const gain = audio.createGain();
  gain.gain.value = 0.12;
  src.connect(filter).connect(gain).connect(musicBus);
  src.start();
  windSources = [src];
}

function padChord(i) {
  const start = audio.currentTime + 0.05;
  const filter = audio.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 700;
  filter.connect(musicBus);
  CHORDS[i % CHORDS.length].forEach(f => {
    [-5, 5].forEach(detune => {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = f;
      osc.detune.value = detune;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.03, start + 3);
      gain.gain.setValueAtTime(0.03, start + CHORD_SECONDS - 1);
      gain.gain.linearRampToValueAtTime(0, start + CHORD_SECONDS + 2.5);
      osc.connect(gain).connect(filter);
      osc.start(start);
      osc.stop(start + CHORD_SECONDS + 3);
    });
  });
}

let owlQuietUntil = 0; // Hintergrund-Eule schweigt, während beim Rätsel gezählt wird

function owl() {
  if (Date.now() < owlQuietUntil) return;
  const now = audio.currentTime;
  if (samples.owl1) {
    play(Math.random() < 0.5 ? samples.owl1 : samples.owl2, now, { gain: 0.25, to: musicBus, rate: 0.97 + Math.random() * 0.06 });
    return;
  }
  [0, 0.55].forEach(t => tone(420, now + t, { dur: 0.45, vol: 0.06, attack: 0.08, glide: 360, to: musicBus }));
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
  loop(() => play(pluck(SPARKLE[Math.floor(Math.random() * SPARKLE.length)]), audio.currentTime, { gain: 0.07, to: musicBus }), 3000, 8000);
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
  windSources.forEach(src => src.stop(now + 1.1));
  windSources = [];
});

export const isMusicPlaying = () => playing;

// Aufnahmen schon beim ersten Antippen laden, auch wenn die Musik aus ist
export const preloadSounds = safe(() => ctx());

// Rätsel „Ruf der Eule“: n Waldkauz-Rufe mit unregelmäßigen Pausen im Wind. Gibt die Dauer in ms zurück.
export function owlCalls(n) {
  try {
    ctx();
    const now = audio.currentTime + 0.3;
    const clips = [samples.owl1, samples.owl2].filter(Boolean);
    let t = 0;
    for (let i = 0; i < n; i++) {
      if (clips.length) {
        const clip = clips[i % clips.length];
        play(clip, now + t, { gain: 0.9, rate: 0.98 + Math.random() * 0.04 });
        t += clip.duration + 0.6 + Math.random() * 1.2;
      } else {
        tone(390, now + t, { dur: 0.75, vol: 0.22, attack: 0.12, glide: 330 });
        t += 1 + Math.random() * 1.1;
      }
    }
    if (samples.wind) {
      const w = play(samples.wind, now - 0.3, { gain: 0.35 });
      w.stop(now + t + 0.5);
    }
    owlQuietUntil = Date.now() + (t + 1) * 1000 + 60000;
    return (t + 1) * 1000;
  } catch (e) {
    console.debug('Audio nicht verfügbar', e);
    return 0;
  }
}

// Im Hintergrund (Bildschirm aus) Audio pausieren – spart Akku
document.addEventListener('visibilitychange', () => {
  if (!audio) return;
  if (document.hidden) audio.suspend();
  else audio.resume();
});
