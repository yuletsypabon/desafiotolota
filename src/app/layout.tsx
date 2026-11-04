import type { Metadata, Viewport } from 'next';
import { Bebas_Neue, Inter, JetBrains_Mono } from 'next/font/google';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Providers from '@/components/Providers';
import TopBar from '@/components/TopBar';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const mono = JetBrains_Mono({ weight: ['500', '600', '700'], subsets: ['latin'], variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'DESAFÍO Tolotá — Sistema de Cronometraje',
  description: 'Cronometraje, equipos, disciplina y resultados del Desafío Tolotá',
};

export const viewport: Viewport = { themeColor: '#0b0d12', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bebas.variable} ${inter.variable} ${mono.variable}`}>
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
