import type { Metadata } from 'next';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import { PresentacionEspiritual, DevocionalHoy, MuroOracion, ReflexionesAnteriores } from '@/components/sitio/EspiritualContenido';

export const metadata: Metadata = {
  title: 'Espiritual',
  description: 'Devocionales, peticiones de oración y reflexiones para crecer juntos en la fe.',
};

export default function PaginaEspiritual() {
  return (
    <PaginaSitio
      etiqueta="Comunidad de fe"
      titulo="Crezcamos juntos en la fe"
      intro="Lee la Palabra, comparte una petición de oración y encuentra reflexiones para tu día a día."
    >
      <DevocionalHoy />
      <PresentacionEspiritual />
      <MuroOracion />
      <ReflexionesAnteriores />
    </PaginaSitio>
  );
}
