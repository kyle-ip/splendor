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
import type { GemColor } from './Board';

type Flyer = {
  id: number;
  color: GemColor;
  x: number;
  y: number;
  dx: number;
  dy: number;
};

type Pop = { id: number; color: GemColor };

type BankTakeFxApi = {
  /** Play take-away FX from a bank stack (player or AI). */
  take: (color: GemColor, opts?: { toward?: 'up' | 'down' | 'out' }) => void;
  /** Staggered take for multiple gems. */
  takeMany: (
    colors: GemColor[],
    opts?: { staggerMs?: number; toward?: 'up' | 'down' | 'out' },
  ) => void;
  isPopping: (color: GemColor) => boolean;
};

const BankTakeFxContext = createContext<BankTakeFxApi | null>(null);

const FLY_MS = 520;
const POP_MS = 420;

function bankEl(color: GemColor): HTMLElement | null {
  return document.querySelector(
    `[data-bank-gem="${color}"]`,
  ) as HTMLElement | null;
}

export function BankTakeFxProvider({ children }: { children: ReactNode }) {
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const idRef = useRef(0);

  const take = useCallback(
    (color: GemColor, opts?: { toward?: 'up' | 'down' | 'out' }) => {
      const el = bankEl(color);
      const rect = el?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      const toward = opts?.toward ?? 'out';
      const dx =
        toward === 'out' ? (Math.random() - 0.5) * 80 : 0;
      const dy =
        toward === 'down' ? 90 : toward === 'up' ? -100 : -70 - Math.random() * 40;

      const flyId = ++idRef.current;
      const popId = ++idRef.current;

      setFlyers((f) => [...f, { id: flyId, color, x, y, dx, dy }]);
      setPops((p) => [...p, { id: popId, color }]);

      window.setTimeout(() => {
        setFlyers((f) => f.filter((x) => x.id !== flyId));
      }, FLY_MS);
      window.setTimeout(() => {
        setPops((p) => p.filter((x) => x.id !== popId));
      }, POP_MS);
    },
    [],
  );

  const takeMany = useCallback(
    (
      colors: GemColor[],
      opts?: { staggerMs?: number; toward?: 'up' | 'down' | 'out' },
    ) => {
      const stagger = opts?.staggerMs ?? 90;
      colors.forEach((c, i) => {
        window.setTimeout(() => take(c, { toward: opts?.toward }), i * stagger);
      });
    },
    [take],
  );

  const isPopping = useCallback(
    (color: GemColor) => pops.some((p) => p.color === color),
    [pops],
  );

  const api = useMemo(
    () => ({ take, takeMany, isPopping }),
    [take, takeMany, isPopping],
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
