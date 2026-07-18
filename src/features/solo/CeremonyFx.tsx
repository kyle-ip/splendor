import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { noblePortraitUrl } from '@/lib/assets';

export type CeremonyToward = 'player' | 'opponent';
export type CeremonySeat = CeremonyToward | number;

type NobleFlyer = {
  id: number;
  nobleId: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  src: string | undefined;
};

type PrestigeTick = {
  id: number;
  x: number;
  y: number;
};

type WinBurst = {
  id: number;
  won: boolean;
};

type CeremonyFxApi = {
  /** Arc noble tile toward a seat, then optional prestige +3 tick. */
  nobleVisit: (
    nobleId: number,
    toward: CeremonySeat,
    onDone?: () => void,
  ) => void;
  /** Brief pulse on the active seat (turn change). */
  turnPulse: (toward?: CeremonySeat) => void;
  /** Short endgame celebration overlay. */
  winCelebrate: (won: boolean, seat?: CeremonySeat) => void;
  isAnimating: boolean;
};

const CeremonyFxContext = createContext<CeremonyFxApi | null>(null);

const NOBLE_MS = 680;
const WIN_MS = 1600;
const TURN_MS = 900;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function seatEl(toward: CeremonySeat): HTMLElement | null {
  if (typeof toward === 'number') {
    return document.querySelector(
      `[data-seat-id="${toward}"]`,
    ) as HTMLElement | null;
  }
  return document.querySelector(
    `[data-seat-target="${toward}"]`,
  ) as HTMLElement | null;
}

function prestigeEl(toward: CeremonySeat): HTMLElement | null {
  if (typeof toward === 'number') {
    return document.querySelector(
      `[data-prestige-seat="${toward}"]`,
    ) as HTMLElement | null;
  }
  return document.querySelector(
    `[data-prestige="${toward}"]`,
  ) as HTMLElement | null;
}

function fallbackTarget(toward: CeremonySeat): { x: number; y: number } {
  if (toward === 'player' || toward === 0) {
    return { x: window.innerWidth / 2, y: window.innerHeight * 0.75 };
  }
  return { x: window.innerWidth * 0.75, y: window.innerHeight * 0.2 };
}

export function CeremonyFxProvider({ children }: { children: ReactNode }) {
  const [flyer, setFlyer] = useState<NobleFlyer | null>(null);
  const [ticks, setTicks] = useState<PrestigeTick[]>([]);
  const [winBurst, setWinBurst] = useState<WinBurst | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const idRef = useRef(0);

  const showPrestigeTick = useCallback((toward: CeremonySeat) => {
    const pEl = prestigeEl(toward);
    const pRect = pEl?.getBoundingClientRect();
    if (!pRect) return;
    const tickId = ++idRef.current;
    setTicks((t) => [
      ...t,
      {
        id: tickId,
        x: pRect.left + pRect.width / 2,
        y: pRect.top,
      },
    ]);
    pEl?.classList.add('prestige-pulse');
    window.setTimeout(() => {
      pEl?.classList.remove('prestige-pulse');
      setTicks((t) => t.filter((x) => x.id !== tickId));
    }, 700);
  }, []);

  const nobleVisit = useCallback(
    (nobleId: number, toward: CeremonySeat, onDone?: () => void) => {
      if (prefersReducedMotion()) {
        onDone?.();
        return;
      }

      const from =
        (document.querySelector(
          `[data-noble-id="${nobleId}"]`,
        ) as HTMLElement | null) ??
        (document.querySelector('[data-noble-id]') as HTMLElement | null);
      const to = seatEl(toward);
      const fromRect = from?.getBoundingClientRect();
      const toRect = to?.getBoundingClientRect();
      const fallback = fallbackTarget(toward);

      const x = fromRect
        ? fromRect.left + fromRect.width / 2
        : window.innerWidth / 2;
      const y = fromRect
        ? fromRect.top + fromRect.height / 2
        : window.innerHeight * 0.35;
      const tx = toRect ? toRect.left + toRect.width / 2 : fallback.x;
      const ty = toRect ? toRect.top + toRect.height / 2 : fallback.y;

      const flyId = ++idRef.current;
      setFlyer({
        id: flyId,
        nobleId,
        x,
        y,
        dx: tx - x,
        dy: ty - y,
        src: noblePortraitUrl(nobleId),
      });

      window.setTimeout(() => {
        setFlyer((f) => (f?.id === flyId ? null : f));
        showPrestigeTick(toward);
        onDone?.();
      }, NOBLE_MS);
    },
    [showPrestigeTick],
  );

  const turnPulse = useCallback((toward: CeremonySeat = 'player') => {
    if (prefersReducedMotion()) return;
    const el = seatEl(toward);
    if (!el) return;
    el.classList.add('seat-turn-pulse');
    setPulsing(true);
    window.setTimeout(() => {
      el.classList.remove('seat-turn-pulse');
      setPulsing(false);
    }, TURN_MS);
  }, []);

  const winCelebrate = useCallback((won: boolean, seat?: CeremonySeat) => {
    if (prefersReducedMotion()) return;
    const id = ++idRef.current;
    setWinBurst({ id, won });
    const target = seat ?? (won ? 'player' : 'opponent');
    const el = seatEl(target);
    el?.classList.add('seat-win-glow');
    window.setTimeout(() => {
      setWinBurst((w) => (w?.id === id ? null : w));
      el?.classList.remove('seat-win-glow');
    }, WIN_MS);
  }, []);

  const api = useMemo(
    () => ({
      nobleVisit,
      turnPulse,
      winCelebrate,
      isAnimating: flyer !== null || pulsing,
    }),
    [nobleVisit, turnPulse, winCelebrate, flyer, pulsing],
  );

  return (
    <CeremonyFxContext.Provider value={api}>
      {children}
      {createPortal(
        <>
          {flyer && (
            <div
              key={flyer.id}
              className="noble-visit-flyer"
              style={{
                left: flyer.x,
                top: flyer.y,
                ['--dx' as string]: `${flyer.dx}px`,
                ['--dy' as string]: `${flyer.dy}px`,
              }}
            >
              <div className="noble-visit-tile">
                {flyer.src ? (
                  <img src={flyer.src} alt="" draggable={false} />
                ) : (
                  <span className="font-display text-2xl text-[#faf4e8]">3</span>
                )}
                <span className="noble-visit-vp">+3</span>
              </div>
            </div>
          )}
          {ticks.map((t) => (
            <div
              key={t.id}
              className="prestige-tick"
              style={{ left: t.x, top: t.y }}
            >
              +3
            </div>
          ))}
          {winBurst && (
            <div
              className={`win-celebrate ${winBurst.won ? 'win-celebrate--won' : 'win-celebrate--lost'}`}
              aria-hidden
            >
              {Array.from({ length: 12 }).map((_, i) => (
                <span
                  key={i}
                  className="win-celebrate-bit"
                  style={{ ['--a' as string]: `${i * 30}deg` }}
                />
              ))}
            </div>
          )}
        </>,
        document.body,
      )}
    </CeremonyFxContext.Provider>
  );
}

export function useCeremonyFx(): CeremonyFxApi {
  const ctx = useContext(CeremonyFxContext);
  if (!ctx) {
    throw new Error('useCeremonyFx must be used within CeremonyFxProvider');
  }
  return ctx;
}

export function useCeremonyFxOptional(): CeremonyFxApi | null {
  return useContext(CeremonyFxContext);
}

/** Fire win celebration once when `active` becomes true. */
export function useWinCelebrateOnce(
  active: boolean,
  won: boolean,
  seat?: CeremonySeat,
) {
  const fx = useCeremonyFxOptional();
  const fired = useRef(false);
  useEffect(() => {
    if (!active) {
      fired.current = false;
      return;
    }
    if (fired.current || !fx) return;
    fired.current = true;
    fx.winCelebrate(won, seat);
  }, [active, won, seat, fx]);
}

/**
 * Pulse seat when the turn identity changes (skip first mount).
 * Pass a stable key like `${turn}-${seat}` — avoid phase noise.
 */
export function useTurnPulseOnChange(
  key: string | number | null | undefined,
  toward: CeremonySeat = 'player',
) {
  const fx = useCeremonyFxOptional();
  const prev = useRef<string | number | null | undefined>(undefined);
  useEffect(() => {
    if (key == null || !fx) return;
    if (prev.current === undefined) {
      prev.current = key;
      return;
    }
    if (prev.current === key) return;
    prev.current = key;
    fx.turnPulse(toward);
  }, [key, toward, fx]);
}
