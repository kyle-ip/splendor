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

const TOAST_MS = 4200;

type ToastItem = { id: number; message: string };

type SoloToastApi = {
  show: (message: string) => void;
};

const SoloToastContext = createContext<SoloToastApi | null>(null);

export function SoloToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const show = useCallback((message: string) => {
    const id = ++idRef.current;
    setToasts((items) => [...items, { id, message }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((x) => x.id !== id));
    }, TOAST_MS);
  }, []);

  const api = useMemo(() => ({ show }), [show]);

  return (
    <SoloToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="solo-toast-stack" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className="solo-toast" role="status">
              {toast.message}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </SoloToastContext.Provider>
  );
}

export function useSoloToast(): SoloToastApi {
  const ctx = useContext(SoloToastContext);
  if (!ctx) {
    throw new Error('useSoloToast must be used within SoloToastProvider');
  }
  return ctx;
}
