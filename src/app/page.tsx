import Landing from '@/components/landing/Landing';
import { datosPortada } from '@/lib/landing/datos';

// Se regenera como máximo cada 5 minutos: los cambios de nombres en el sistema llegan solos a la portada
export const revalidate = 300;

/** Portada del sitio público (la edición y los nombres X2/X4 vienen de la base). */
export default async function Inicio() {
  return <Landing {...await datosPortada()} />;
}
