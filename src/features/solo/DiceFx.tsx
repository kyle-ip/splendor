import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const ROLL_MS = 1050;
const SETTLE_MS = 420;

type DiceFxApi = {
  run: (value: number, onDone: () => void) => void;
  isAnimating: boolean;
  displayValue: number | null;
};

const DiceFxContext = createContext<DiceFxApi | null>(null);

const PIP_CELLS: Record<number, [number, number][]> = {
  1: [[1, 1]],
  2: [
    [0, 0],
    [2, 2],
  ],
  3: [
    [0, 0],
    [1, 1],
    [2, 2],
  ],
  4: [
    [0, 0],
    [0, 2],
    [2, 0],
    [2, 2],
  ],
  5: [
    [0, 0],
    [0, 2],
    [1, 1],
    [2, 0],
    [2, 2],
  ],
  6: [
    [0, 0],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 2],
  ],
};

function DicePips({ value }: { value: number }) {
  const cells = PIP_CELLS[value] ?? PIP_CELLS[1];
  return (
    <div className="dice-pip-grid" aria-hidden>
      {Array.from({ length: 9 }).map((_, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const on = cells.some(([r, c]) => r === row && c === col);
        return (
          <span key={i} className="dice-pip-cell">
            {on ? <span className="dice-pip" /> : null}
          </span>
        );
      })}
    </div>
  );
}

function DiceRollOverlay({
  value,
  onComplete,
}: {
  value: number;
  onComplete: () => void;
}) {
  const [display, setDisplay] = useState(1);
  const [settling, setSettling] = useState(false);

  useEffect(() => {
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setDisplay(value);
      setSettling(true);
      const doneTimer = window.setTimeout(() => onComplete(), 120);
      return () => window.clearTimeout(doneTimer);
    }

    let ticks = 0;
    const interval = window.setInterval(() => {
      ticks += 1;
      setDisplay(1 + Math.floor(Math.random() * 6));
      if (ticks >= 16) window.clearInterval(interval);
    }, 48);

    const settleTimer = window.setTimeout(() => {
      window.clearInterval(interval);
      setDisplay(value);
      setSettling(true);
    }, ROLL_MS);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, ROLL_MS + SETTLE_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(settleTimer);
      window.clearTimeout(doneTimer);
    };
  }, [value, onComplete]);

  return (
    <div className="dice-roll-scrim" aria-hidden>
      <div className="dice-roll-overlay">
        <div className={`dice-roll-stage ${settling ? 'is-settling' : 'is-rolling'}`}>
          <div className="dice-roll-cube-wrap">
            <div className={`dice-roll-face ${settling ? 'is-settled' : ''}`}>
              <DicePips value={display} />
            </div>
          </div>
          <div className="dice-roll-shockwave" />
          <div className="dice-roll-orbit">
            {Array.from({ length: 8 }).map((_, i) => (
              <span
                key={i}
                className="dice-roll-orbit-bit"
                style={{ ['--i' as string]: i }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function DiceFxProvider({ children }: { children: ReactNode }) {
  const [roll, setRoll] = useState<{
    value: number;
    onDone: () => void;
  } | null>(null);

  const run = useCallback((value: number, onDone: () => void) => {
    setRoll({ value, onDone });
  }, []);

  const handleComplete = useCallback(() => {
    setRoll((current) => {
      if (current?.onDone) {
        queueMicrotask(current.onDone);
      }
      return null;
    });
  }, []);

  const api = useMemo(
    () => ({
      run,
      isAnimating: roll !== null,
      displayValue: roll?.value ?? null,
    }),
    [roll, run],
  );

  return (
    <DiceFxContext.Provider value={api}>
      {children}
      {roll &&
        createPortal(
          <DiceRollOverlay value={roll.value} onComplete={handleComplete} />,
          document.body,
        )}
    </DiceFxContext.Provider>
  );
}

export function useDiceFx(): DiceFxApi {
  const ctx = useContext(DiceFxContext);
  if (!ctx) {
    throw new Error('useDiceFx must be used within DiceFxProvider');
  }
  return ctx;
}
