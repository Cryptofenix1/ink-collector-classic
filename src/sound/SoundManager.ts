/**
 * Simple SoundManager using Web Audio API.
 * Generates free, synth-like sounds: blip for common, power-up for gold, thud for toxic.
 */

type GetMuted = () => boolean;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  return (window as unknown as { __inkAudioContext?: AudioContext }).__inkAudioContext ?? null;
}

function setAudioContext(ctx: AudioContext | null): void {
  if (typeof window === "undefined") return;
  (window as unknown as { __inkAudioContext?: AudioContext }).__inkAudioContext = ctx ?? undefined;
}

export function ensureContext(): AudioContext | null {
  let ctx = getAudioContext();
  if (ctx?.state === "closed") {
    setAudioContext(null);
    ctx = null;
  }
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      setAudioContext(ctx);
    } catch {
      return null;
    }
  }
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

/** Short synth blip for common drop (sine, quick decay) */
function playCommonSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(523.25, now);
  osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.05);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.15, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  osc.start(now);
  osc.stop(now + 0.12);
}

/** Rising power-up for gold drop (sweep up) */
function playRareSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(392, now);
  osc.frequency.exponentialRampToValueAtTime(988, now + 0.2);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
  osc.start(now);
  osc.stop(now + 0.35);
}

/** Low thud for toxic drop (low frequency burst) */
function playToxicSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(80, now);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.15);
}

/** Shield: soft chime */
function playShieldSound(ctx: AudioContext): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(440, now);
  osc.frequency.exponentialRampToValueAtTime(554.37, now + 0.08);
  osc.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.start(now);
  osc.stop(now + 0.15);
}

export type SoundManagerHandle = {
  playCommon: () => void;
  playRare: () => void;
  playToxic: () => void;
  playShield: () => void;
  getMuted: () => boolean;
  setGetMuted: (fn: GetMuted) => void;
};

export function createSoundManager(): SoundManagerHandle {
  let getMuted: GetMuted = () => false;

  const play = (fn: (ctx: AudioContext) => void) => {
    if (getMuted()) return;
    const ctx = ensureContext();
    if (!ctx) return;
    try {
      fn(ctx);
    } catch {
      // ignore
    }
  };

  return {
    playCommon: () => play(playCommonSound),
    playRare: () => play(playRareSound),
    playToxic: () => play(playToxicSound),
    playShield: () => play(playShieldSound),
    getMuted: () => getMuted(),
    setGetMuted: (fn) => {
      getMuted = fn;
    },
  };
}
