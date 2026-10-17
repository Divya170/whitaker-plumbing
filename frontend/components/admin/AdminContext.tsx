'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

interface Toast {
  id: number;
  msg: string;
  error?: boolean;
}
interface AdminCtx {
  admin: { id: number; email: string; name: string } | null;
  toast: (msg: string, error?: boolean) => void;
  refreshCounts: () => void;
  newCount: number;
}

const Ctx = createContext<AdminCtx>({ admin: null, toast: () => {}, refreshCounts: () => {}, newCount: 0 });
export const useAdmin = () => useContext(Ctx);

export function AdminProvider({
  admin,
  newCount,
  refreshCounts,
  children,
}: {
  admin: AdminCtx['admin'];
  newCount: number;
  refreshCounts: () => void;
  children: React.ReactNode;
}) {
  const [toastState, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const toast = useCallback((msg: string, error = false) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), msg, error });
    timer.current = setTimeout(() => setToast(null), 3800);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Ctx.Provider value={{ admin, toast, refreshCounts, newCount }}>
      {children}
      <div aria-live="polite" role="status">
        {toastState && (
          <div key={toastState.id} className={`toast${toastState.error ? ' toast--err' : ''}`}>
            {toastState.msg}
          </div>
        )}
      </div>
    </Ctx.Provider>
  );
}
