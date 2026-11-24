import type { Metadata } from 'next';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import HistoriaTimeline from '@/components/sitio/HistoriaTimeline';

export const metadata: Metadata = { title: 'Historia' };

export default function Pagina() {
  return (
    <PaginaSitio
      etiqueta="El recorrido"
      titulo="Nuestra historia"
      intro="Desde 2016, cada edición suma una nueva historia de aventura, fe y comunidad."
    >
      <HistoriaTimeline />
    </PaginaSitio>
  );
}
