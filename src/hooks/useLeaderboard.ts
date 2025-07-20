import { useState, useCallback } from "react";

export type LeaderboardEntry = { address: string; rating: number };

/**
 * Simulated on-chain leaderboard for Ink L2.
 * In production: replace with useReadContract(abi, 'highScore') and
 * useWriteContract(abi, 'submitScore', [score]) from Wagmi.
 */
const STORAGE_KEY = "ink-collector-high-score";
const STORAGE_KEY_ENTRY = "ink-collector-my-entry";
const INITIAL_HIGH = 0;

function getStoredHighScore(): number {
  if (typeof window === "undefined") return INITIAL_HIGH;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v != null ? Math.max(0, parseInt(v, 10)) : INITIAL_HIGH;
  } catch {
    return INITIAL_HIGH;
  }
}

function getStoredEntry(): LeaderboardEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(STORAGE_KEY_ENTRY);
    if (!v) return null;
    const parsed = JSON.parse(v) as LeaderboardEntry;
    return parsed && typeof parsed.address === "string" && typeof parsed.rating === "number" ? parsed : null;
  } catch {
    return null;
  }
}

export function useLeaderboard() {
  const [highScore, setHighScore] = useState(getStoredHighScore);
  const [savedEntry, setSavedEntry] = useState<LeaderboardEntry | null>(getStoredEntry);
  const [isSaving, setIsSaving] = useState(false);

  const saveScore = useCallback(async (score: number, nickname?: string) => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    const prev = getStoredHighScore();
    const next = Math.max(prev, score);
    const displayName = (nickname ?? "").trim() || "Player";
    const entry: LeaderboardEntry = { address: displayName, rating: score };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
        localStorage.setItem(STORAGE_KEY_ENTRY, JSON.stringify(entry));
      } catch {}
    }
    setHighScore(next);
    setSavedEntry(entry);
    setIsSaving(false);
    return next;
  }, []);

  return { highScore, saveScore, isSaving, savedEntry };
}
