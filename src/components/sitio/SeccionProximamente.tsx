import PaginaSitio from './PaginaSitio';

/** Página provisional de una sección del sitio mientras se construye. */
export default function SeccionProximamente({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return <PaginaSitio etiqueta="Desafío Tolotá · próximamente" titulo={titulo} intro={descripcion} />;
}
