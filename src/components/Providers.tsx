'use client';
import type { ReactNode } from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';
import { SWRConfig } from 'swr';
import { theme } from '@/theme';
import { ToastProvider } from './Toast';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SWRConfig value={{ revalidateOnFocus: true, shouldRetryOnError: false }}>
        <ToastProvider>{children}</ToastProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
