import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type DragEvent,
} from 'react';
import { gems } from '@/lib/assets';
import type { TakeColor } from './Board';

type DragKind = 'gem' | 'card';

type DragPayload =
  | { kind: 'gem'; color: TakeColor }
  | { kind: 'card'; cardId: string };

type DragFxState = {
  active: boolean;
  kind: DragKind | null;
  label: string | null;
  src: string | null;
  overHand: boolean;
  overReserve: boolean;
};

type Burst = { id: number; x: number; y: number; src: string };

type DragFxApi = {
  beginGemDrag: (e: DragEvent, color: TakeColor) => void;
  beginCardDrag: (e: DragEvent, cardId: string, previewSrc?: string) => void;
  setOverHand: (v: boolean) => void;
  setOverReserve: (v: boolean) => void;
  endDrag: () => void;
  sparkleAt: (el: HTMLElement | null, src?: string) => void;
  state: DragFxState;
};

const DragFxContext = createContext<DragFxApi | null>(null);

function hideNativeGhost(e: DragEvent) {
  const ghost = document.createElement('div');
  ghost.style.width = '1px';
  ghost.style.height = '1px';
  ghost.style.opacity = '0';
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 0, 0);
  requestAnimationFrame(() => ghost.remove());
}

export function DragFxProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DragFxState>({
    active: false,
    kind: null,
    label: null,
    src: null,
    overHand: false,
    overReserve: false,
  });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [bursts, setBursts] = useState<Burst[]>([]);
  const payloadRef = useRef<DragPayload | null>(null);
  const idRef = useRef(0);

  const endDrag = useCallback(() => {
    payloadRef.current = null;
    setState({
      active: false,
      kind: null,
      label: null,
      src: null,
      overHand: false,
      overReserve: false,
    });
  }, []);

  const beginGemDrag = useCallback((e: DragEvent, color: TakeColor) => {
    e.dataTransfer.setData('application/x-splendor-gem', color);
    e.dataTransfer.effectAllowed = 'move';
    hideNativeGhost(e);
    payloadRef.current = { kind: 'gem', color };
    setPos({ x: e.clientX, y: e.clientY });
    setState({
      active: true,
      kind: 'gem',
      label: color,
      src: gems[color],
      overHand: false,
      overReserve: false,
    });
  }, []);

  const beginCardDrag = useCallback(
    (e: DragEvent, cardId: string, previewSrc?: string) => {
      e.dataTransfer.setData('application/x-splendor-card', cardId);
      e.dataTransfer.effectAllowed = 'move';
      hideNativeGhost(e);
      payloadRef.current = { kind: 'card', cardId };
      setPos({ x: e.clientX, y: e.clientY });
      setState({
        active: true,
        kind: 'card',
        label: cardId,
        src: previewSrc ?? null,
        overHand: false,
        overReserve: false,
      });
    },
    [],
  );

  const setOverHand = useCallback((v: boolean) => {
    setState((s) => (s.active ? { ...s, overHand: v } : s));
  }, []);

  const setOverReserve = useCallback((v: boolean) => {
    setState((s) => (s.active ? { ...s, overReserve: v } : s));
  }, []);

  const sparkleAt = useCallback((el: HTMLElement | null, src?: string) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const id = ++idRef.current;
    setBursts((b) => [
      ...b,
      {
        id,
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        src: src ?? gems.gold,
      },
    ]);
    window.setTimeout(() => {
      setBursts((b) => b.filter((x) => x.id !== id));
    }, 700);
  }, []);

  useEffect(() => {
    if (!state.active) return;
    const onMove = (e: DragEvent | MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
    };
    const onEnd = () => endDrag();
    window.addEventListener('drag', onMove as EventListener);
    window.addEventListener('dragover', onMove as EventListener);
    window.addEventListener('dragend', onEnd);
    window.addEventListener('drop', onEnd);
    return () => {
      window.removeEventListener('drag', onMove as EventListener);
      window.removeEventListener('dragover', onMove as EventListener);
      window.removeEventListener('dragend', onEnd);
      window.removeEventListener('drop', onEnd);
    };
  }, [state.active, endDrag]);

  const api = useMemo(
    () => ({
      beginGemDrag,
      beginCardDrag,
      setOverHand,
      setOverReserve,
      endDrag,
      sparkleAt,
      state,
    }),
    [
      beginGemDrag,
      beginCardDrag,
      setOverHand,
      setOverReserve,
      endDrag,
      sparkleAt,
      state,
    ],
  );

  return (
    <DragFxContext.Provider value={api}>
      {children}
      {state.active && state.src && (
        <div
          className={`drag-ghost ${state.kind === 'card' ? 'drag-ghost-card' : 'drag-ghost-gem'} ${
            state.overHand || state.overReserve ? 'drag-ghost-hot' : ''
          }`}
          style={{
            left: pos.x,
            top: pos.y,
          }}
        >
          {state.kind === 'gem' ? (
            <img src={state.src} alt="" className="w-16 h-16 object-contain" />
          ) : (
            <div className="drag-ghost-card-face">
              {state.src ? (
                <img src={state.src} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <span className="font-display text-splendor-velvet text-lg">◇</span>
              )}
            </div>
          )}
        </div>
      )}
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
    </DragFxContext.Provider>
  );
}

export function useDragFx(): DragFxApi {
  const ctx = useContext(DragFxContext);
  if (!ctx) {
    throw new Error('useDragFx must be used within DragFxProvider');
  }
  return ctx;
}

/** Optional hook when provider may be absent */
export function useDragFxOptional(): DragFxApi | null {
  return useContext(DragFxContext);
}
