'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { Alert, Snackbar, type AlertColor } from '@mui/material';

type ToastFn = (msg: string, sev?: AlertColor) => void;
const Ctx = createContext<ToastFn>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [st, setSt] = useState<{ open: boolean; msg: string; sev: AlertColor }>({ open: false, msg: '', sev: 'success' });
  const toast = useCallback<ToastFn>((msg, sev = 'success') => setSt({ open: true, msg, sev }), []);
  return (
    <Ctx.Provider value={toast}>
      {children}
      <Snackbar
        open={st.open}
        autoHideDuration={3500}
        onClose={() => setSt((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={st.sev} variant="filled" onClose={() => setSt((s) => ({ ...s, open: false }))}>
          {st.msg}
        </Alert>
      </Snackbar>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

/** Ejecuta una acción async mostrando error en toast. Devuelve true si salió bien. */
export function useRun() {
  const toast = useToast();
  return useCallback(
    async (fn: () => Promise<unknown>, okMsg?: string) => {
      try {
        await fn();
        if (okMsg) toast(okMsg);
        return true;
      } catch (e) {
        toast(e instanceof Error ? e.message : 'Error', 'error');
        return false;
      }
    },
    [toast],
  );
}
