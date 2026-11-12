import type { Metadata, Viewport } from 'next';
// Fuentes incluidas en el proyecto (no se descargan de Google): la app compila y funciona sin internet.
// Anton (títulos), Space Grotesk (texto) e IBM Plex Mono (tiempos del cronómetro).

import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import Providers from '@/components/Providers';
import { MARCA, VARIABLES_CSS } from '@/lib/marca';

export const metadata: Metadata = {
  title: { default: 'DESAFÍO Tolotá', template: '%s · DESAFÍO Tolotá' },
  description: 'Evento anual de obstáculos y campamento juvenil adventista: aventura, espiritualidad y conocimiento.',
};

export const viewport: Viewport = { themeColor: MARCA.fondo, width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" style={VARIABLES_CSS}>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
