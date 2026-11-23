import type { Metadata } from 'next';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import GaleriaDesafio from '@/components/sitio/galeria/GaleriaDesafio';

export const metadata: Metadata = {
  title: 'Galería',
  description: 'Momentos de aventura, equipo y fe vividos en el Desafío Tolotá.',
};

export default function PaginaGaleria() {
  return (
    <PaginaSitio
      etiqueta="Momentos que nos forman"
      titulo="Galería"
      intro="Cada edición deja historias que merecen volver a vivirse. Explora los momentos de aventura, equipo y fe del Desafío."
    >
      <GaleriaDesafio />
    </PaginaSitio>
  );
}
