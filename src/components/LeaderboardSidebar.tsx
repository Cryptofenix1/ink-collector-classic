import { useCallback, useMemo } from "react";

/** Mock leaderboard entries for a full-looking UI (address / name + rating) */
export const mockLeaderboardData: { address: string; rating: number }[] = [
  { address: "Greamka.eth", rating: 1236 },
  { address: "maxicrypto", rating: 442 },
  { address: "Anton", rating: 285 },
  { address: "investZone", rating: 108 },
  { address: "Lera", rating: 71 },
];

type LeaderboardEntry = { address: string; rating: number };

/**
 * Sidebar showing high score from simulated Ink L2 contract.
 * Save button disabled when wallet not connected; tooltip explains why.
 * Merges mock data with user's saved entry so it appears on the list.
 */
type LeaderboardSidebarProps = {
  highScore: number;
  currentScore: number;
  isSaving: boolean;
  savedEntry: LeaderboardEntry | null;
  onSaveScore: (score: number) => Promise<unknown>;
  isWalletConnected: boolean;
  walletAddress?: `0x${string}` | null;
};

export function LeaderboardSidebar({
  highScore,
  currentScore,
  isSaving,
  savedEntry,
  onSaveScore,
  isWalletConnected,
}: LeaderboardSidebarProps) {
  const handleSave = useCallback(() => {
    if (!isWalletConnected || currentScore <= 0) return;
    onSaveScore(currentScore);
  }, [isWalletConnected, currentScore, onSaveScore]);

  const saveDisabled = !isWalletConnected || currentScore <= 0 || isSaving;

  const leaderboardList = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();
    mockLeaderboardData.forEach((e) => map.set(`${e.address}|${e.rating}`, e));
    if (savedEntry) {
      map.set(`${savedEntry.address}|${savedEntry.rating}`, savedEntry);
    }
    return [...map.values()].sort((a, b) => b.rating - a.rating).slice(0, 10);
  }, [savedEntry]);

  return (
    <aside className="ink-leaderboard flex flex-col gap-4 rounded-xl border border-ink-purple/30 bg-ink-black/80 p-4 min-w-0 shrink-0 md:w-[220px]">
      <h3 className="text-sm font-semibold text-ink-purple-light border-b border-ink-purple/30 pb-2">
        Ink L2 Leaderboard
      </h3>
      <div className="flex flex-col gap-1 text-sm">
        <div className="flex justify-between text-slate-400">
          <span>High score (chain)</span>
          <span className="font-mono font-bold text-ink-purple-glow">{highScore}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>This run</span>
          <span className="font-mono text-white">{currentScore}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-xs text-slate-500 font-medium">Top players</span>
        <ul className="flex flex-col gap-1.5 list-none p-0 m-0">
          {leaderboardList.map((entry, i) => {
            const isYou =
              savedEntry &&
              entry.address === savedEntry.address &&
              entry.rating === savedEntry.rating;
            return (
              <li
                key={`${entry.address}-${entry.rating}-${i}`}
                className={`flex items-center justify-between text-xs py-1 px-2 rounded-md border ${
                  isYou
                    ? "bg-ink-purple/20 border-ink-purple/50"
                    : "bg-slate-800/50 border-slate-700/50"
                }`}
              >
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="text-slate-400 font-mono shrink-0">{i + 1}.</span>
                  <span className="text-slate-200 truncate" title={entry.address}>
                    {entry.address}
                  </span>
                  {isYou && (
                    <span className="shrink-0 text-ink-purple-glow font-medium">(You)</span>
                  )}
                </span>
                <span className="font-mono font-semibold text-ink-purple-glow shrink-0 ml-2">
                  {entry.rating}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {!isWalletConnected && (
        <p className="text-xs text-amber-500/90" role="status">
          Connect wallet to save your High Score on the Ink chain.
        </p>
      )}
      <p className="text-xs text-slate-500">
        Scores are saved to the Ink chain. This demo simulates the write; in production
        use Wagmi <code className="bg-slate-800 px-1 rounded">useWriteContract</code> to
        call the leaderboard contract.
      </p>
      <button
        type="button"
        onClick={handleSave}
        disabled={saveDisabled}
        title={!isWalletConnected ? "Connect wallet to save your High Score on the Ink chain." : undefined}
        className="mt-auto w-full py-2 rounded-lg bg-ink-purple hover:bg-ink-purple-light disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
      >
        {isSaving ? "Saving…" : "Save score to Ink"}
      </button>
    </aside>
  );
}
