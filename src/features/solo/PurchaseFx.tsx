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
import type { SoloCard } from '@/data/solo-cards';
import { prefersReducedMotion } from './CeremonyFx';

export type PurchaseBuyer = 'player' | 'automa' | 'ai';

const PURCHASE_MS = 520;
const REDUCED_MS = 40;

type ExitFx = { cardId: string; buyer: PurchaseBuyer };

type Burst = { id: number; x: number; y: number; src: string };

type PurchaseFxApi = {
  run: (cardId: string, buyer: PurchaseBuyer, onDone: () => void) => void;
  isExiting: (cardId: string) => boolean;
  exitBuyer: PurchaseBuyer | null;
  isAnimating: boolean;
};

const PurchaseFxContext = createContext<PurchaseFxApi | null>(null);

function sparkleAtCard(cardId: string, bonusSrc: string, addBurst: (b: Burst) => void) {
  const el = document.querySelector(`[data-solo-card="${cardId}"]`);
  if (!el) return;
  const rect = el.getBoundingClientRect();
  addBurst({
    id: Date.now(),
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    src: bonusSrc,
  });
}

export function PurchaseFxProvider({ children }: { children: ReactNode }) {
  const [exitFx, setExitFx] = useState<ExitFx | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const idRef = useRef(0);

  const addBurst = useCallback((partial: Omit<Burst, 'id'>) => {
    const id = ++idRef.current;
    setBursts((b) => [...b, { ...partial, id }]);
    window.setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 700);
  }, []);

  const run = useCallback(
    (cardId: string, buyer: PurchaseBuyer, onDone: () => void) => {
      if (prefersReducedMotion()) {
        window.setTimeout(onDone, REDUCED_MS);
        return;
      }
      const bonusEl = document.querySelector(
        `[data-solo-card="${cardId}"] [data-solo-card-bonus]`,
      ) as HTMLImageElement | null;
      sparkleAtCard(cardId, bonusEl?.src ?? gems.gold, addBurst);
      setExitFx({ cardId, buyer });
      window.setTimeout(() => {
        setExitFx(null);
        onDone();
      }, PURCHASE_MS);
    },
    [addBurst],
  );

  const isExiting = useCallback(
    (cardId: string) => exitFx?.cardId === cardId,
    [exitFx],
  );

  const api = useMemo(
    () => ({
      run,
      isExiting,
      exitBuyer: exitFx?.buyer ?? null,
      isAnimating: exitFx !== null,
    }),
    [run, isExiting, exitFx],
  );

  return (
    <PurchaseFxContext.Provider value={api}>
      {children}
      {createPortal(
        <>
          {bursts.map((b) => (
            <div
              key={b.id}
              className="drag-sparkle-burst"
              style={{ left: b.x, top: b.y }}
            >
              {Array.from({ length: 8 }).map((_, i) => (
                <span
                  key={i}
                  className="drag-sparkle-bit"
                  style={{
                    ['--a' as string]: `${i * 45}deg`,
                    backgroundImage: `url(${b.src})`,
                  }}
                />
              ))}
            </div>
          ))}
        </>,
        document.body,
      )}
    </PurchaseFxContext.Provider>
  );
}

export function usePurchaseFx(): PurchaseFxApi {
  const ctx = useContext(PurchaseFxContext);
  if (!ctx) {
    throw new Error('usePurchaseFx must be used within PurchaseFxProvider');
  }
  return ctx;
}

export function usePurchaseFxOptional(): PurchaseFxApi | null {
  return useContext(PurchaseFxContext);
}

/** Run purchase animation when provider exists; otherwise apply immediately. */
export function runPurchaseAnimated(
  fx: PurchaseFxApi | null,
  card: SoloCard,
  buyer: PurchaseBuyer,
  onDone: () => void,
) {
  if (fx) {
    fx.run(card.id, buyer, onDone);
  } else {
    onDone();
  }
}
