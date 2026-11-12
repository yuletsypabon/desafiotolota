import type { Metadata } from 'next';
import SeccionProximamente from '@/components/sitio/SeccionProximamente';

export const metadata: Metadata = { title: 'Galería' };

export default function Pagina() {
  return <SeccionProximamente titulo="Galería" descripcion="Fotos de cada edición del Desafío." />;
}
