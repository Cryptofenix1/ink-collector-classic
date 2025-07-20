import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { InkCollectorGame } from "./components/InkCollectorGame";
import { WalletConnectButton } from "./components/WalletConnectButton";
import { LeaderboardSidebar } from "./components/LeaderboardSidebar";
import { MuteButton } from "./components/MuteButton";
import { MusicVolumeControl } from "./components/MusicVolumeControl";
import { useLeaderboard } from "./hooks/useLeaderboard";
import { createSoundManager } from "./sound/SoundManager";
import { createBackgroundMusic } from "./sound/BackgroundMusic";

const MUTE_STORAGE_KEY = "ink-collector-muted";
const MUSIC_VOLUME_STORAGE_KEY = "ink-collector-music-volume";

function getStoredMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function getStoredMusicVolume(): number {
  if (typeof window === "undefined") return 0.25;
  try {
    const v = localStorage.getItem(MUSIC_VOLUME_STORAGE_KEY);
    if (v == null) return 0.25;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.25;
  } catch {
    return 0.25;
  }
}

function App() {
  const { address, isConnected } = useAccount();
  const { highScore, saveScore, isSaving, savedEntry } = useLeaderboard();
  const [currentScore, setCurrentScore] = useState(0);
  const [nickname, setNickname] = useState("");
  const [muted, setMutedState] = useState(getStoredMuted);
  const [musicVolume, setMusicVolumeState] = useState(getStoredMusicVolume);
  const soundManagerRef = useRef(createSoundManager());
  const musicRef = useRef(createBackgroundMusic());
  const musicStartedRef = useRef(false);

  const setMuted = useCallback((value: boolean) => {
    setMutedState(value);
    try {
      localStorage.setItem(MUTE_STORAGE_KEY, value ? "1" : "0");
    } catch {}
  }, []);

  const setMusicVolume = useCallback((value: number) => {
    setMusicVolumeState(value);
    try {
      localStorage.setItem(MUSIC_VOLUME_STORAGE_KEY, String(value));
    } catch {}
  }, []);

  useEffect(() => {
    soundManagerRef.current.setGetMuted(() => muted);
  }, [muted]);

  useEffect(() => {
    musicRef.current.setVolume(muted, musicVolume);
  }, [muted, musicVolume]);

  const startMusicOnce = useCallback(() => {
    if (musicStartedRef.current) return;
    musicStartedRef.current = true;
    musicRef.current.start();
    musicRef.current.setVolume(muted, musicVolume);
  }, [muted, musicVolume]);

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
  }, []);

  return (
    <div className="app ink-theme" onClick={startMusicOnce} role="presentation">
      <div className="ink-audio-controls">
        <MuteButton muted={muted} onToggle={() => setMuted(!muted)} />
        <MusicVolumeControl
          volume={musicVolume}
          onVolumeChange={(v) => {
            setMusicVolume(v);
            startMusicOnce();
          }}
          muted={muted}
        />
      </div>
      <header className="app-header flex items-center justify-between">
  <div className="ml-24 md:ml-32">
    <h1 className="text-2xl font-bold text-white tracking-wide">Ink Collector</h1>
    <p className="subtitle text-slate-400 text-sm mt-1">Guide the Kraken. Catch the ink. Ink L2.</p>
  </div>
  <WalletConnectButton />
</header>

      <main className="app-main ink-unified-container">
        <div className="ink-game-wrapper">
          <InkCollectorGame
            isWalletConnected={isConnected ?? false}
            walletAddress={address ?? null}
            highScore={highScore}
            onScoreUpdate={handleScoreUpdate}
            nickname={nickname}
            onNicknameChange={setNickname}
            soundManager={soundManagerRef.current}
          />
        </div>
        <LeaderboardSidebar
          highScore={highScore}
          currentScore={currentScore}
          isSaving={isSaving}
          savedEntry={savedEntry}
          onSaveScore={(score) => saveScore(score, nickname || undefined)}
          isWalletConnected={isConnected ?? false}
          walletAddress={address ?? null}
        />
      </main>
      <p className="hint text-slate-500 text-xs mt-3">Use ← → or A / D to move the Kraken.</p>
    </div>
  );
}

export default App;
