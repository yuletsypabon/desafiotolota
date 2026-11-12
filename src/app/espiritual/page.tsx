import type { Metadata } from 'next';
import SeccionProximamente from '@/components/sitio/SeccionProximamente';

export const metadata: Metadata = { title: 'Espiritual' };

export default function Pagina() {
  return <SeccionProximamente titulo="Espiritual" descripcion="Versículo del día, plan de lectura Reavivados, blog espiritual y biblioteca de cartillas." />;
}
