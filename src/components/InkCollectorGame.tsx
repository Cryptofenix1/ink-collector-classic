import { useEffect, useRef, useState } from "react";

const GAME_WIDTH = 480;
const GAME_HEIGHT = 640;
const KRAKEN_WIDTH = 100;
const KRAKEN_HEIGHT = 64;
const DROP_SIZE = 18;
const DROP_SPEED = 4;
const MAX_MISSED = 5;

type Drop = {
  id: number;
  x: number;
  y: number;
};

function createDrop(id: number): Drop {
  const x = Math.random() * (GAME_WIDTH - DROP_SIZE);
  return { id, x, y: -DROP_SIZE };
}

export function InkCollectorGame() {
  const [drops, setDrops] = useState<Drop[]>([]);
  const [krakenX, setKrakenX] = useState(GAME_WIDTH / 2 - KRAKEN_WIDTH / 2);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);

  const nextIdRef = useRef(1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isRunning) return;

      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        setKrakenX((x) => Math.max(0, x - 28));
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        setKrakenX((x) => Math.min(GAME_WIDTH - KRAKEN_WIDTH, x + 28));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = window.setInterval(() => {
      setDrops((previous) => {
        const updated: Drop[] = [];
        let caught = 0;
        let missedThisTick = 0;

        for (const drop of previous) {
          const newY = drop.y + DROP_SPEED;

          const groundY = GAME_HEIGHT - DROP_SIZE;
          const isBelowGround = newY > groundY;

          const krakenTop = GAME_HEIGHT - KRAKEN_HEIGHT - 8;
          const krakenBottom = GAME_HEIGHT - 8;
          const krakenLeft = krakenX;
          const krakenRight = krakenX + KRAKEN_WIDTH;

          const dropCenterX = drop.x + DROP_SIZE / 2;
          const dropBottom = newY + DROP_SIZE;

          const isOverKrakenHorizontally =
            dropCenterX >= krakenLeft && dropCenterX <= krakenRight;
          const hitsKraken =
            isOverKrakenHorizontally &&
            dropBottom >= krakenTop &&
            dropBottom <= krakenBottom;

          if (hitsKraken) {
            caught += 1;
            continue;
          }

          if (isBelowGround) {
            missedThisTick += 1;
            continue;
          }

          updated.push({ ...drop, y: newY });
        }

        const shouldSpawn = Math.random() < 0.04;
        if (shouldSpawn) {
          const id = nextIdRef.current++;
          updated.push(createDrop(id));
        }

        if (caught > 0) {
          setScore((current) => current + caught);
        }
        if (missedThisTick > 0) {
          setMissed((current) => current + missedThisTick);
        }

        return updated;
      });
    }, 50);

    return () => window.clearInterval(intervalId);
  }, [isRunning, krakenX]);

  useEffect(() => {
    if (missed >= MAX_MISSED && isRunning) {
      setIsRunning(false);
    }
  }, [missed, isRunning]);

  const handleReset = () => {
    setScore(0);
    setMissed(0);
    setDrops([]);
    setIsRunning(true);
    setKrakenX(GAME_WIDTH / 2 - KRAKEN_WIDTH / 2);
  };

  return (
    <div className="game-shell">
      <div className="game-hud">
        <div className="hud-item">
          <span className="label">Ink captured</span>
          <span className="value">{score}</span>
        </div>
        <div className="hud-item">
          <span className="label">Spilled</span>
          <span className="value">
            {missed} / {MAX_MISSED}
          </span>
        </div>
      </div>

      <div
        className="game-area"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        {drops.map((drop) => (
          <div
            key={drop.id}
            className="ink-drop"
            style={{
              width: DROP_SIZE,
              height: DROP_SIZE,
              transform: `translate(${drop.x}px, ${drop.y}px)`,
            }}
          />
        ))}

        <div
          className="kraken"
          style={{
            width: KRAKEN_WIDTH,
            height: KRAKEN_HEIGHT,
            transform: `translate(${
              krakenX
            }px, ${GAME_HEIGHT - KRAKEN_HEIGHT - 8}px)`,
          }}
        >
          <span className="kraken-eyes" />
          <span className="kraken-tentacles" />
        </div>

        {!isRunning && (
          <div className="game-over">
            <h2>Ink Spilled</h2>
            <p>You missed too many drops.</p>
            <button type="button" onClick={handleReset}>
              Play again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

