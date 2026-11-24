import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import { prisma } from '@/lib/prisma';
import { codigoEdicion, EVENTO } from '@/lib/evento';
import { rutaEdicion } from '@/lib/rutas';
import e from '@/components/sitio/edicion/edicion.module.css';

export const metadata: Metadata = { title: 'Ediciones del Desafío' };
export const revalidate = 300;

type EventoRegistro = {
  id: string;
  anio: number;
  nombre: string;
  logo: string | null;
  equipos: number;
  pruebas: number;
};

type EdicionArchivo = {
  id: string;
  anio: number;
  nombre: string;
  descripcion: string;
  logo: string | null;
  periodo?: string;
};

// Nombres y recuerdos ya registrados en la línea del tiempo. Las dos ediciones de 2019
// permanecen separadas; sus periodos se señalan como pendientes en vez de inventar fechas.
const ARCHIVO: EdicionArchivo[] = [
  { id: '2016', anio: 2016, nombre: 'Reto y Aventura', descripcion: 'El inicio del recorrido de Desafío Tolotá.', logo: '/marca/ediciones/desafio-2016.png' },
  { id: '2017', anio: 2017, nombre: 'Sobreviviendo', descripcion: 'Campamento Desafío X4 · FEJA Barbosa.', logo: '/marca/ediciones/desafio-2017.png' },
  { id: '2019-travesia', anio: 2019, nombre: 'Travesía Campestre', descripcion: 'Una edición con identidad de aventura y recorrido campestre.', logo: '/marca/ediciones/desafio-2019-travesia-campestre.png', periodo: 'Periodo de 2019 por confirmar' },
  { id: '2019-guia', anio: 2019, nombre: 'Guía Extremo', descripcion: 'Una segunda edición registrada durante 2019.', logo: '/marca/ediciones/desafio-2019-guia-extremo.png', periodo: 'Periodo de 2019 por confirmar' },
  { id: '2022', anio: 2022, nombre: 'Guerreros del fin', descripcion: 'Desafío X4 · Tolotá Sur.', logo: '/marca/ediciones/desafio-2022.png' },
  { id: '2023', anio: 2023, nombre: 'Jesús X4 Élite', descripcion: 'Rumbo a la eternidad.', logo: '/marca/ediciones/desafio-2023.png' },
  { id: '2024', anio: 2024, nombre: 'Tiempo de guerra', descripcion: 'Desafío Tolotá · edición X4.', logo: '/marca/ediciones/desafio-2024.png' },
  { id: '2025', anio: 2025, nombre: 'La Gran Conquista', descripcion: 'Desafío X4 · diciembre de 2025.', logo: '/marca/ediciones/desafio-2025.png' },
];

async function cargarEventos(): Promise<EventoRegistro[]> {
  return prisma.evento.findMany({
    orderBy: [{ anio: 'desc' }, { createdAt: 'desc' }],
    select: { id: true, anio: true, nombre: true, logo: true, _count: { select: { equipos: true, pruebas: true } } },
  }).then((eventos) => eventos.map((evento) => ({
    id: evento.id,
    anio: evento.anio,
    nombre: evento.nombre,
    logo: evento.logo,
    equipos: evento._count.equipos,
    pruebas: evento._count.pruebas,
  }))).catch((error: unknown) => {
    console.error('Ediciones: no se pudieron leer los eventos', error);
    return [];
  });
}

function logoEdicion(logo: string | null, nombre: string, clase: string) {
  if (!logo) return <span className={e.logoPendiente} aria-label={`Escudo de ${nombre} pendiente`}>DT</span>;
  return logo.startsWith('/')
    ? <Image src={logo} alt={`Escudo ${nombre}`} fill sizes="(max-width: 760px) 72vw, 28vw" className={clase} />
    : <img src={logo} alt={`Escudo ${nombre}`} className={clase} />; // eslint-disable-line @next/next/no-img-element -- los logos del sistema son data URLs
}

export default async function Ediciones() {
  const eventos = await cargarEventos();
  // La edición más reciente registrada ocupa el espacio destacado. Al crear 2027, se promueve sin editar esta página.
  const destacada = eventos[0];
  const anioDestacado = destacada?.anio ?? EVENTO.inicio.getFullYear();
  const codigoDestacado = codigoEdicion(anioDestacado, eventos.map((evento) => evento.anio));
  const nombreBase = destacada?.nombre?.replace(/^Desafío\s+X\d+\s*[:·–-]?\s*/i, '').trim();
  const nombreDestacado = destacada
    ? `Desafío ${codigoDestacado}${nombreBase ? ` · ${nombreBase}` : ''}`
    : 'Desafío X6 · Ge’ullah';
  const logoDestacado = destacada?.logo ?? '/marca/ediciones/desafio-2026.png';

  const eventosAnteriores = eventos.slice(1);
  const aniosConEvento = new Set(eventos.map((evento) => evento.anio));
  const archivoVisible = ARCHIVO.filter((edicion) => !aniosConEvento.has(edicion.anio));
  // Si una edición antigua está registrada, se muestran todos sus eventos por separado, incluidos los del mismo año.
  const anteriores = [
    ...eventosAnteriores.map((evento) => ({
      id: evento.id,
      anio: evento.anio,
      nombre: evento.nombre,
      descripcion: `${evento.equipos} equipos · ${evento.pruebas} pruebas registradas.`,
      logo: evento.logo ?? ARCHIVO.find((archivo) => archivo.anio === evento.anio)?.logo ?? null,
      periodo: undefined,
      href: `${rutaEdicion(evento.anio)}?evento=${encodeURIComponent(evento.id)}`,
      dinamica: true,
    })),
    ...archivoVisible.map((edicion) => ({
      ...edicion,
      href: '/historia',
      dinamica: false,
    })),
  ].sort((a, b) => b.anio - a.anio || (a.dinamica === b.dinamica ? a.id.localeCompare(b.id) : a.dinamica ? -1 : 1));

  const hrefDestacada = destacada
    ? `${rutaEdicion(anioDestacado)}?evento=${encodeURIComponent(destacada.id)}`
    : rutaEdicion(anioDestacado);

  return (
    <PaginaSitio etiqueta="Desde 2016" titulo="Ediciones del Desafío" intro="Cada edición tiene su propia historia. Explora el recorrido de Tolotá desde 2016.">
      <section className={e.edicionesPagina} aria-label="Recorrido por las ediciones">
        <div className={e.edicionesRejilla}>
          <article className={`${e.edicionFicha} ${e.edicionDestacada}`}>
            <Image src="/fotos/hero-bosque.webp" alt="Bosque de campamento al amanecer" fill priority sizes="(max-width: 760px) 100vw, 66vw" className={e.fondoEdicion} />
            <div className={e.veloEdicion} />
            <div className={e.cuerpoEdicion}>
              <span className={e.etiquetaEdicion}>Edición destacada · {anioDestacado}</span>
              <h2>{nombreDestacado}</h2>
              <p>{anioDestacado === 2026 ? '15 al 20 de diciembre · Finca El Faisán Dorado · Gámbita, Santander' : 'Fechas y sede por confirmar'}</p>
              <Link href={hrefDestacada} className={e.botonEdicion}>Ver edición {anioDestacado}<FlechaAccion /></Link>
            </div>
            <div className={e.logoDestacado}>{logoEdicion(logoDestacado, nombreDestacado, e.logoEdicion)}</div>
          </article>

          {anteriores.map((edicion) => (
            <article className={e.edicionFicha} key={edicion.id}>
              <Link href={edicion.href} className={e.enlaceFicha} aria-label={`Ver historia de ${edicion.nombre}, ${edicion.anio}`}>
                <div className={e.logoArchivo}>
                  {logoEdicion(edicion.logo, edicion.nombre, e.logoEdicion)}
                  <span className={e.anioArchivo}>{edicion.anio}</span>
                </div>
                <div className={e.cuerpoEdicion}>
                  {edicion.periodo && <span className={e.periodoEdicion}>{edicion.periodo}</span>}
                  <h3>{edicion.nombre}</h3>
                  <p>{edicion.descripcion}</p>
                  <span className={e.detalleEdicion}>{edicion.dinamica ? 'Ver datos de la edición' : 'Ver recorrido histórico'}<FlechaAccion /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>
    </PaginaSitio>
  );
}
