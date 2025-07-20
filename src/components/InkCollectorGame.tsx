import { useEffect, useRef, useState, useCallback } from "react";
import type { SoundManagerHandle } from "../sound/SoundManager";

// ─── Constants ─────────────────────────────────────────────────────────────
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const KRAKEN_WIDTH = 100;
const KRAKEN_HEIGHT = 72;
const DROP_SIZE = 20;
const BASE_DROP_SPEED = 3.2;
const LEVEL_SPEED_FACTOR = 0.1; // +10% drop speed per level
const POINTS_PER_LEVEL = 15;
const MAX_LIVES = 3;
const TICK_MS = 50;
const KRAKEN_MOVE_BASE = 24;
const KRAKEN_MOVE_SLOW = 12;
const KRAKEN_MOVE_BOOST_MULT = 1.5; // +50% when gold boost active
const SPEED_BOOST_DURATION_MS = 7000;
const SLOW_DEBUFF_DURATION_MS = 3000;

export type DropType = "common" | "rare" | "toxic" | "shield";

const DROP_WEIGHTS: Record<DropType, number> = {
  common: 0.62,
  rare: 0.2,
  toxic: 0.1,
  shield: 0.08,
};
const SPAWN_CHANCE_PER_TICK = 0.045;

type Drop = { id: number; x: number; y: number; type: DropType };
type Particle = { id: number; x: number; y: number; type: DropType; createdAt: number };

function pickDropType(): DropType {
  const r = Math.random();
  if (r < DROP_WEIGHTS.common) return "common";
  if (r < DROP_WEIGHTS.common + DROP_WEIGHTS.rare) return "rare";
  if (r < DROP_WEIGHTS.common + DROP_WEIGHTS.rare + DROP_WEIGHTS.toxic) return "toxic";
  return "shield";
}

function createDrop(id: number): Drop {
  const x = Math.random() * (GAME_WIDTH - DROP_SIZE);
  return { id, x, y: -DROP_SIZE, type: pickDropType() };
}

function KrakenSprite({ className, hasBoost }: { className?: string; hasBoost?: boolean }) {
  return (
    <div className={`${className ?? ""} ${hasBoost ? "ink-kraken-boost" : ""}`} aria-hidden>
      <svg viewBox="0 0 100 72" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="50" cy="36" rx="38" ry="28" fill="url(#kraken-body)" />
        <defs>
          <linearGradient id="kraken-body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="50%" stopColor="#5b21b6" />
            <stop offset="100%" stopColor="#3b0764" />
          </linearGradient>
        </defs>
        <ellipse cx="38" cy="28" rx="8" ry="10" fill="#0a0a0f" />
        <ellipse cx="62" cy="28" rx="8" ry="10" fill="#0a0a0f" />
        <circle cx="40" cy="26" r="3" fill="#e9d5ff" />
        <circle cx="64" cy="26" r="3" fill="#e9d5ff" />
        <path d="M22 52 Q10 68 18 70 Q26 72 30 58" stroke="#4c1d95" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M38 58 Q30 72 42 70 Q50 68 46 56" stroke="#5b21b6" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M50 56 Q50 72 58 70 Q66 68 62 56" stroke="#5b21b6" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M78 52 Q90 68 82 70 Q74 72 70 58" stroke="#4c1d95" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export type InkCollectorGameProps = {
  isWalletConnected: boolean;
  walletAddress?: `0x${string}` | null;
  highScore: number;
  onScoreUpdate?: (score: number) => void;
  nickname: string;
  onNicknameChange: (value: string) => void;
  soundManager: SoundManagerHandle;
};

export function InkCollectorGame({
  isWalletConnected,
  walletAddress,
  highScore,
  onScoreUpdate,
  nickname,
  onNicknameChange,
  soundManager,
}: InkCollectorGameProps) {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [krakenX, setKrakenX] = useState(GAME_WIDTH / 2 - KRAKEN_WIDTH / 2);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(MAX_LIVES);
  const [hasShield, setHasShield] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  const [speedBoostEnd, setSpeedBoostEnd] = useState<number | null>(null);
  const [slowDebuffEnd, setSlowDebuffEnd] = useState<number | null>(null);
  const [shakeUntil, setShakeUntil] = useState(0);
  const [canvasScale, setCanvasScale] = useState(1);

  const nextIdRef = useRef(1);
  const particleIdRef = useRef(1);
  const directionRef = useRef(0);
  const moveSpeedRef = useRef(KRAKEN_MOVE_BASE);
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const hasShieldRef = useRef(hasShield);
  hasShieldRef.current = hasShield;

  const effectiveDropSpeed = BASE_DROP_SPEED * (1 + (level - 1) * LEVEL_SPEED_FACTOR);
  const isBoosted = speedBoostEnd != null && Date.now() < speedBoostEnd;
  const isSlowed = slowDebuffEnd != null && Date.now() < slowDebuffEnd;
  const krakenMovePx = isSlowed ? KRAKEN_MOVE_SLOW : isBoosted ? KRAKEN_MOVE_BASE * KRAKEN_MOVE_BOOST_MULT : KRAKEN_MOVE_BASE;
  moveSpeedRef.current = krakenMovePx;

  const spawnParticles = useCallback((x: number, y: number, type: DropType) => {
    const now = Date.now();
    setParticles((prev) => [
      ...prev,
      ...Array.from({ length: 8 }, () => ({ id: particleIdRef.current++, x: x + DROP_SIZE / 2, y: y + DROP_SIZE / 2, type, createdAt: now })),
    ]);
  }, []);

  useEffect(() => {
    if (particles.length === 0) return;
    const t = setTimeout(() => {
      const cutoff = Date.now() - 600;
      setParticles((p) => p.filter((x) => x.createdAt > cutoff));
    }, 650);
    return () => clearTimeout(t);
  }, [particles.length]);

  // Movement Engine
  useEffect(() => {
    if (!isRunning) return;
    const step = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 16, 4);
      lastTimeRef.current = now;
      const move = directionRef.current * moveSpeedRef.current * dt * 0.5;
      if (move !== 0) {
        setKrakenX((x) => Math.max(0, Math.min(GAME_WIDTH - KRAKEN_WIDTH, x + move)));
      }
      rafIdRef.current = requestAnimationFrame(step);
    };
    lastTimeRef.current = performance.now();
    rafIdRef.current = requestAnimationFrame(step);
    return () => { if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current); };
  }, [isRunning]);

  // Keyboard Controls
  useEffect(() => {
    if (!isRunning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") directionRef.current = -1;
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") directionRef.current = 1;
    };
    const handleKeyUp = () => { directionRef.current = 0; };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      directionRef.current = 0;
    };
  }, [isRunning]);

  // Touch Controls
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isRunning) return;
    const touchX = e.touches[0].clientX;
    const mid = window.innerWidth / 2;
    directionRef.current = touchX < mid ? -1 : 1;
  };
  const handleTouchEnd = () => { directionRef.current = 0; };

  // Level & Shake
  useEffect(() => {
    const newLevel = Math.floor(score / POINTS_PER_LEVEL) + 1;
    if (newLevel > level) { setLevel(newLevel); setShakeUntil(Date.now() + 350); }
  }, [score, level]);

  // Game Loop
  useEffect(() => {
    if (!isRunning) return;
    const intervalId = window.setInterval(() => {
      const now = Date.now();
      if (speedBoostEnd != null && now >= speedBoostEnd) setSpeedBoostEnd(null);
      if (slowDebuffEnd != null && now >= slowDebuffEnd) setSlowDebuffEnd(null);

      setDrops((previous) => {
        const updated: Drop[] = [];
        const krakenTop = GAME_HEIGHT - KRAKEN_HEIGHT - 8;
        const krakenBottom = GAME_HEIGHT - 8;
        const groundY = GAME_HEIGHT - DROP_SIZE;

        for (const drop of previous) {
          const newY = drop.y + effectiveDropSpeed;
          const dropCenterX = drop.x + DROP_SIZE / 2;
          const dropBottom = newY + DROP_SIZE;
          const isOverKraken = dropCenterX >= krakenX && dropCenterX <= krakenX + KRAKEN_WIDTH && dropBottom >= krakenTop && dropBottom <= krakenBottom;

          if (isOverKraken) {
            if (drop.type === "rare") {
              soundManager.playRare(); setScore((s) => s + 5); setSpeedBoostEnd(now + SPEED_BOOST_DURATION_MS); spawnParticles(drop.x, drop.y, "rare");
            } else if (drop.type === "toxic") {
              soundManager.playToxic(); setScore((s) => Math.max(0, s - 3)); setSlowDebuffEnd(now + SLOW_DEBUFF_DURATION_MS); setShakeUntil(now + 400); spawnParticles(drop.x, drop.y, "toxic");
              if (hasShieldRef.current) setHasShield(false); else setLives((l) => l - 1);
            } else if (drop.type === "shield") {
              soundManager.playShield(); setHasShield(true); spawnParticles(drop.x, drop.y, "shield");
            } else {
              soundManager.playCommon(); setScore((s) => s + 1); spawnParticles(drop.x, drop.y, "common");
            }
            continue;
          }
          if (newY > groundY) continue;
          updated.push({ ...drop, y: newY });
        }
        if (Math.random() < SPAWN_CHANCE_PER_TICK) updated.push(createDrop(nextIdRef.current++));
        return updated;
      });
    }, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [isRunning, krakenX, effectiveDropSpeed, speedBoostEnd, slowDebuffEnd, spawnParticles, soundManager]);

  useEffect(() => { if (lives <= 0 && isRunning) setIsRunning(false); }, [lives, isRunning]);
  useEffect(() => { onScoreUpdate?.(score); }, [score, onScoreUpdate]);
  useEffect(() => {
    if (shakeUntil <= 0) return;
    const t = setTimeout(() => setShakeUntil(0), 400);
    return () => clearTimeout(t);
  }, [shakeUntil]);

  // Responsive Scale (Fixed for both Mobile & Desktop)
  useEffect(() => {
    const updateScale = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // На мобилках сжимаем по ширине
        const scale = (window.innerWidth - 32) / GAME_WIDTH;
        setCanvasScale(scale);
      } else {
        // На десктопе сжимаем по высоте, как в оригинале
        const maxH = window.innerHeight * 0.8;
        const scale = Math.min(1, maxH / GAME_HEIGHT);
        setCanvasScale(scale);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleStart = () => {
    setScore(0); setLevel(1); setLives(MAX_LIVES); setHasShield(false); setDrops([]);
    setSpeedBoostEnd(null); setSlowDebuffEnd(null); setIsRunning(true);
    setKrakenX(GAME_WIDTH / 2 - KRAKEN_WIDTH / 2);
  };

  const formatAddress = (addr: `0x${string}`) => `${addr.slice(0, 6)}…${addr.slice(-4)}`;
  const boostRemaining = speedBoostEnd != null ? Math.ceil((speedBoostEnd - Date.now()) / 1000) : 0;

  return (
    <div className="ink-game-shell flex flex-col gap-3 flex-1 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <div><span className="text-slate-500 block text-xs">Score</span><span className="text-ink-purple-light font-bold text-lg">{score}</span></div>
          <div><span className="text-slate-500 block text-xs">Level</span><span className="text-ink-purple-glow font-semibold">{level}</span></div>
          <div className="flex items-center gap-1">
            <span className="text-slate-500 text-xs">Lives</span>
            {Array.from({ length: MAX_LIVES }).map((_, i) => (
              <span key={i} className={`inline-block w-3 h-3 rounded-full ${i < lives ? "bg-red-500" : "bg-slate-700"}`} aria-hidden />
            ))}
          </div>
          {hasShield && <span className="text-sky-400 text-xs font-medium">🛡 Shield</span>}
        </div>
        <div className="text-slate-500 text-xs">
          {isWalletConnected && walletAddress ? (
            <>Playing as <span className="text-ink-purple-glow font-mono">{formatAddress(walletAddress)}</span></>
          ) : (
            <span className="text-amber-500/90">Connect wallet to save High Score.</span>
          )}
        </div>
      </div>

      <div
        className="ink-game-canvas-wrapper"
        style={{
          maxHeight: "80vh",
          position: "relative",
          width: GAME_WIDTH * canvasScale,
          height: GAME_HEIGHT * canvasScale,
          overflow: "hidden",
          touchAction: "none", // Предотвращает скролл при игре на телефоне
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div style={{ position: "absolute", left: 0, top: 0, width: GAME_WIDTH, height: GAME_HEIGHT, transform: `scale(${canvasScale})`, transformOrigin: "top left" }}>
          <div className={shakeUntil > Date.now() ? "ink-camera-shake" : ""} style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            <div className="ink-game-area relative rounded-xl overflow-hidden border border-ink-purple/40 ink-game-area-border" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
              
              {drops.map((drop) => (
                <div key={drop.id} className={`ink-drop ink-drop-${drop.type}`} style={{ width: DROP_SIZE, height: DROP_SIZE, transform: `translate(${drop.x}px, ${drop.y}px)` }} />
              ))}

              {particles.map((p) => (
                <div key={p.id} className={`ink-particle ink-particle-${p.type}`} style={{ left: p.x, top: p.y }} />
              ))}

              <div className="ink-kraken absolute left-0 top-0 flex items-center justify-center" style={{ width: KRAKEN_WIDTH, height: KRAKEN_HEIGHT, transform: `translate(${krakenX}px, ${GAME_HEIGHT - KRAKEN_HEIGHT - 8}px)` }}>
                <KrakenSprite className="w-full h-full" hasBoost={isBoosted} />
              </div>

              {isBoosted && <div className="absolute top-2 left-1/2 -translate-x-1/2 text-amber-400 text-xs font-semibold animate-pulse">Speed boost! ({boostRemaining}s)</div>}
              {isSlowed && <div className="absolute top-2 left-1/2 -translate-x-1/2 text-red-400 text-xs font-semibold animate-pulse">Slowed</div>}

              {/* Экран Game Over (из твоей старой версии) */}
              {!isRunning && lives <= 0 && (
                <div className="ink-game-over absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-black/90 backdrop-blur-sm rounded-xl">
                  <h2 className="text-2xl font-bold text-red-400">Game Over</h2>
                  <p className="text-slate-400">Final score: <span className="text-ink-purple-light font-bold">{score}</span></p>
                  <p className="text-slate-500 text-sm">High score (chain): {highScore}</p>
                  <button type="button" onClick={handleStart} className="px-5 py-2 rounded-full bg-ink-purple hover:bg-ink-purple-light text-white font-medium transition">
                    Play again
                  </button>
                </div>
              )}

              {/* Главное меню с Ником (из твоей старой версии) */}
              {!isRunning && lives > 0 && drops.length === 0 && score === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-black/80 backdrop-blur-sm rounded-xl p-4">
                  <h2 className="text-xl font-semibold text-ink-purple-light">Ink Collector</h2>
                  <label className="flex flex-col gap-1.5 w-full max-w-[260px] text-left">
                    <span className="text-slate-400 text-sm">Your nickname</span>
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => onNicknameChange(e.target.value)}
                      placeholder="Enter nickname (optional)"
                      maxLength={24}
                      className="w-full px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-600 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-ink-purple/60 focus:ring-1 focus:ring-ink-purple/40"
                    />
                  </label>
                  <p className="text-slate-400 text-sm text-center max-w-[280px]">
                    Purple = 1 pt. Gold = 5 pts + speed boost. Red = toxic: -3 pts, -1 life. Blue = shield.
                  </p>
                  <p className="text-slate-500 text-xs uppercase tracking-widest mt-2">Tap sides or use A/D to move</p>
                  <button type="button" onClick={handleStart} className="px-5 py-2 rounded-full bg-ink-purple hover:bg-ink-purple-light text-white font-medium transition">
                    Start game
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}