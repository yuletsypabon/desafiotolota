import type { Metadata, Viewport } from 'next';
// Fuentes incluidas en el proyecto (no se descargan de Google): la app compila y funciona sin internet.
import '@fontsource/bebas-neue/400.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Providers from '@/components/Providers';
import TopBar from '@/components/TopBar';

const fuentes = {
  '--font-bebas': '"Bebas Neue"',
  '--font-inter': '"Inter"',
  '--font-mono': '"JetBrains Mono"',
} as React.CSSProperties;

export const metadata: Metadata = {
  title: 'DESAFÍO Tolotá — Sistema de Cronometraje',
  description: 'Cronometraje, equipos, disciplina y resultados del Desafío Tolotá',
};

export const viewport: Viewport = { themeColor: '#0b0d12', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={fuentes}>
      <body>
        <AppRouterCacheProvider>
          <Providers>
            <TopBar />
            <main>{children}</main>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
