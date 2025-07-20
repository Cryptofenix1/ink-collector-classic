type MusicVolumeControlProps = {
  volume: number;
  onVolumeChange: (value: number) => void;
  muted: boolean;
};

export function MusicVolumeControl({ volume, onVolumeChange, muted }: MusicVolumeControlProps) {
  const displayValue = muted ? 0 : volume;

  return (
    <div className="ink-music-control" title="Background music">
      <span className="ink-music-icon" aria-hidden>
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        value={displayValue * 100}
        onChange={(e) => onVolumeChange(Number(e.target.value) / 100)}
        className="ink-music-slider"
        aria-label="Background music volume"
      />
    </div>
  );
}
