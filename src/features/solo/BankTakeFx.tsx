import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { gems } from '@/lib/assets';
import type { GemCounts } from '@/types';
import type { GemColor } from './Board';
import { prefersReducedMotion } from './CeremonyFx';

type Flyer = {
  id: number;
  color: GemColor;
  x: number;
  y: number;
  dx: number;
  dy: number;
  durationMs: number;
};

type Pop = { id: number; color: GemColor };

export type BankTakeToward = 'up' | 'down' | 'out';

type TakeOpts = {
  toward?: BankTakeToward;
  /** Prefer seat id when multiple opponents exist. */
  seatId?: number;
  /** Override fly duration (ms). */
  durationMs?: number;
};

type BankTakeFxApi = {
  /** Play take-away FX from a bank stack (player or AI). */
  take: (color: GemColor, opts?: TakeOpts) => void;
  /** Staggered take for multiple gems. */
  takeMany: (colors: GemColor[], opts?: TakeOpts & { staggerMs?: number }) => void;
  /** Fly a gem from hand zone back to its bank stack (spend / return). */
  spend: (color: GemColor, opts?: { fromSeatId?: number }) => void;
  /** Spend each gem that decreased from `before` to `after`. */
  spendDiff: (
    before: GemCounts,
    after: GemCounts,
    opts?: { fromSeatId?: number },
  ) => void;
  isPopping: (color: GemColor) => boolean;
};

const BankTakeFxContext = createContext<BankTakeFxApi | null>(null);

/** Human take / spend — snappy. */
const FLY_PLAYER_MS = 520;
/** AI / opponent take — slow enough to read colors. */
export const BANK_TAKE_AI_FLY_MS = 1100;
export const BANK_TAKE_AI_STAGGER_MS = 380;
const POP_MS = 420;
const REDUCED_MS = 40;

export function bankTakeManyDuration(
  count: number,
  toward: BankTakeToward = 'up',
  staggerMs?: number,
) {
  const stagger =
    staggerMs ??
    (toward === 'up' ? BANK_TAKE_AI_STAGGER_MS : 90);
  const fly = toward === 'up' ? BANK_TAKE_AI_FLY_MS : FLY_PLAYER_MS;
  if (count <= 0) return 0;
  return (count - 1) * stagger + fly;
}

function bankEl(color: GemColor): HTMLElement | null {
  return document.querySelector(
    `[data-bank-gem="${color}"]`,
  ) as HTMLElement | null;
}

function handEl(): HTMLElement | null {
  return document.querySelector('[data-hand-zone]') as HTMLElement | null;
}

function seatTargetEl(seatId?: number): HTMLElement | null {
  if (seatId != null) {
    return document.querySelector(
      `[data-seat-id="${seatId}"]`,
    ) as HTMLElement | null;
  }
  return document.querySelector(
    '[data-seat-target="opponent"]',
  ) as HTMLElement | null;
}

function centerOf(el: HTMLElement | null): { x: number; y: number } | null {
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function BankTakeFxProvider({ children }: { children: ReactNode }) {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const idRef = useRef(0);

  const spawnFlyer = useCallback(
    (
      color: GemColor,
      from: { x: number; y: number },
      to: { x: number; y: number },
      durationMs: number,
    ) => {
      if (prefersReducedMotion()) return;
      const flyId = ++idRef.current;
      setFlyers((f) => [
        ...f,
        {
          id: flyId,
          color,
          x: from.x,
          y: from.y,
          dx: to.x - from.x,
          dy: to.y - from.y,
          durationMs,
        },
      ]);
      window.setTimeout(() => {
        setFlyers((f) => f.filter((x) => x.id !== flyId));
      }, durationMs);
    },
    [],
  );

  const take = useCallback(
    (color: GemColor, opts?: TakeOpts) => {
      if (prefersReducedMotion()) return;

      const el = bankEl(color);
      const from = centerOf(el) ?? {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
      const toward = opts?.toward ?? 'out';
      const durationMs =
        opts?.durationMs ??
        (toward === 'up' ? BANK_TAKE_AI_FLY_MS : FLY_PLAYER_MS);

      let to: { x: number; y: number };
      if (toward === 'down') {
        to = centerOf(handEl()) ?? { x: from.x, y: from.y + 120 };
      } else if (toward === 'up') {
        to =
          centerOf(seatTargetEl(opts?.seatId)) ?? {
            x: from.x,
            y: from.y - 110,
          };
      } else {
        to = {
          x: from.x + (Math.random() - 0.5) * 80,
          y: from.y - 70 - Math.random() * 40,
        };
      }

      const popId = ++idRef.current;
      spawnFlyer(color, from, to, durationMs);
      setPops((p) => [...p, { id: popId, color }]);
      window.setTimeout(() => {
        setPops((p) => p.filter((x) => x.id !== popId));
      }, POP_MS);
    },
    [spawnFlyer],
  );

  const takeMany = useCallback(
    (colors: GemColor[], opts?: TakeOpts & { staggerMs?: number }) => {
      if (prefersReducedMotion()) return;
      const toward = opts?.toward ?? 'out';
      const stagger =
        opts?.staggerMs ??
        (toward === 'up' ? BANK_TAKE_AI_STAGGER_MS : 90);
      colors.forEach((c, i) => {
        window.setTimeout(
          () =>
            take(c, {
              toward: opts?.toward,
              seatId: opts?.seatId,
              durationMs: opts?.durationMs,
            }),
          i * stagger,
        );
      });
    },
    [take],
  );

  const spend = useCallback(
    (color: GemColor, opts?: { fromSeatId?: number }) => {
      if (prefersReducedMotion()) return;
      const from =
        centerOf(handEl()) ??
        centerOf(seatTargetEl(opts?.fromSeatId)) ?? {
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.7,
        };
      const to = centerOf(bankEl(color)) ?? {
        x: from.x,
        y: from.y - 140,
      };
      spawnFlyer(color, from, to, FLY_PLAYER_MS);
      const popId = ++idRef.current;
      setPops((p) => [...p, { id: popId, color }]);
      window.setTimeout(() => {
        setPops((p) => p.filter((x) => x.id !== popId));
      }, POP_MS);
    },
    [spawnFlyer],
  );

  const spendDiff = useCallback(
    (
      before: GemCounts,
      after: GemCounts,
      opts?: { fromSeatId?: number },
    ) => {
      if (prefersReducedMotion()) return;
      const keys = [
        'emerald',
        'sapphire',
        'ruby',
        'diamond',
        'onyx',
        'gold',
      ] as const;
      let delay = 0;
      for (const c of keys) {
        const n = before[c] - after[c];
        for (let i = 0; i < n; i++) {
          window.setTimeout(() => spend(c, opts), delay);
          delay += 60;
        }
      }
    },
    [spend],
  );

  const isPopping = useCallback(
    (color: GemColor) => pops.some((p) => p.color === color),
    [pops],
  );

  const api = useMemo(
    () => ({ take, takeMany, spend, spendDiff, isPopping }),
    [take, takeMany, spend, spendDiff, isPopping],
  );

  return (
    <BankTakeFxContext.Provider value={api}>
      {children}
      {createPortal(
        <>
          {flyers.map((f) => (
            <div
              key={f.id}
              className="bank-take-flyer"
              style={{
                left: f.x,
                top: f.y,
                ['--dx' as string]: `${f.dx}px`,
                ['--dy' as string]: `${f.dy}px`,
                ['--fly-ms' as string]: `${f.durationMs}ms`,
              }}
            >
              <img src={gems[f.color]} alt="" draggable={false} />
              {Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="bank-take-spark"
                  style={{
                    ['--a' as string]: `${i * 60}deg`,
                    backgroundImage: `url(${gems[f.color]})`,
                  }}
                />
              ))}
            </div>
          ))}
        </>,
        document.body,
      )}
    </BankTakeFxContext.Provider>
  );
}

export function useBankTakeFx(): BankTakeFxApi {
  const ctx = useContext(BankTakeFxContext);
  if (!ctx) {
    throw new Error('useBankTakeFx must be used within BankTakeFxProvider');
  }
  return ctx;
}

export function useBankTakeFxOptional(): BankTakeFxApi | null {
  return useContext(BankTakeFxContext);
}

/** Reduced-motion purchase delay (near-instant). */
export const PURCHASE_REDUCED_MS = REDUCED_MS;
