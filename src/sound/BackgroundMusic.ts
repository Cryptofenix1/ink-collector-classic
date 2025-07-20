/**
 * Light, pleasant procedural ambient background music for Ink theme.
 * Slow A-minor arpeggio (deep, calm) – free, no assets.
 */

import { ensureContext } from "./SoundManager";

const AM_NOTES = [220, 261.63, 329.63, 440]; // A3, C4, E4, A4
const NOTE_DURATION = 2.2;
const FADE_MS = 400;

export type BackgroundMusicHandle = {
  start: () => void;
  stop: () => void;
  setVolume: (muted: boolean, volume: number) => void;
};

export function createBackgroundMusic(): BackgroundMusicHandle {
  let masterGain: GainNode | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let currentMuted = true;
  let currentVolume = 0.25;
  let noteIndex = 0;

  function getCtx(): AudioContext | null {
    return ensureContext();
  }

  function applyGain(): void {
    if (!masterGain) return;
    masterGain.gain.setValueAtTime(
      currentMuted ? 0 : Math.max(0, Math.min(1, currentVolume)),
      (masterGain.context as AudioContext).currentTime
    );
  }

  function playNote(ctx: AudioContext): void {
    if (!masterGain) return;
    const now = ctx.currentTime;
    const freq = AM_NOTES[noteIndex % AM_NOTES.length];
    noteIndex += 1;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now);
    osc.connect(gain);
    gain.connect(masterGain);
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + FADE_MS / 1000);
    gain.gain.setValueAtTime(0.12, now + NOTE_DURATION - FADE_MS / 1000);
    gain.gain.linearRampToValueAtTime(0, now + NOTE_DURATION);
    osc.start(now);
    osc.stop(now + NOTE_DURATION);
  }

  function tick(): void {
    const ctx = getCtx();
    if (!ctx || !masterGain) return;
    playNote(ctx);
  }

  return {
    start() {
      const ctx = getCtx();
      if (!ctx) return;
      if (masterGain) return; // already started
      masterGain = ctx.createGain();
      masterGain.connect(ctx.destination);
      applyGain();
      noteIndex = 0;
      playNote(ctx);
      intervalId = setInterval(tick, NOTE_DURATION * 1000);
    },
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      masterGain = null;
    },
    setVolume(muted: boolean, volume: number) {
      currentMuted = muted;
      currentVolume = volume;
      applyGain();
    },
  };
}
