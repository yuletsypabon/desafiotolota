import type { Metadata } from 'next';
import SeccionProximamente from '@/components/sitio/SeccionProximamente';

export const metadata: Metadata = { title: 'Historia' };

export default function Pagina() {
  return <SeccionProximamente titulo="Historia" descripcion="Desde 2017, edición por edición: la historia del Desafío Tolotá." />;
}
