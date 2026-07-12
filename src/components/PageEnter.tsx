import { useEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/** Fade/slide content in on route change; scroll to top */
export function PageEnter({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
