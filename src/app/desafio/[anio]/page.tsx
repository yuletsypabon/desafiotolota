import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import PortadaEdicion from '@/components/sitio/edicion/PortadaEdicion';
import EquiposEdicion from '@/components/sitio/edicion/EquiposEdicion';
import PruebasEdicion from '@/components/sitio/edicion/PruebasEdicion';
import ResultadosEnVivo from '@/components/sitio/edicion/ResultadosEnVivo';
import { datosEdicion } from '@/lib/landing/edicion';
import { EVENTO } from '@/lib/evento';
import s from '@/components/sitio/pagina.module.css';

// Equipos y pruebas se leen de la base y se regeneran cada 5 minutos; los resultados se actualizan en vivo aparte
export const revalidate = 300;

type Props = { params: Promise<{ anio: string }> };

const anioDe = (texto: string) => (/^\d{4}$/.test(texto) ? Number(texto) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Desafío ${(await params).anio}` };
}

/** Página de la edición de un año (/desafio-2026): el evento, sus equipos con su alineación, las pruebas y los resultados. */
export default async function PaginaEdicion({ params }: Props) {
  const anio = anioDe((await params).anio);
  const edicion = anio ? await datosEdicion(anio) : null;
  if (!edicion) notFound();
  const esActual = edicion.anio === EVENTO.inicio.getFullYear();

  return (
    <PaginaSitio
      etiqueta={`${edicion.anio} · Desafío ${edicion.codigo}`}
      titulo={edicion.nombre}
      intro={esActual
        ? 'Todo sobre la edición de este año: los equipos que competirán, sus integrantes, las pruebas y los resultados en vivo.'
        : `La edición ${edicion.anio}: sus equipos, sus integrantes, las pruebas y los resultados.`}
    >
      {esActual && <PortadaEdicion logo={edicion.logo} nombre={edicion.nombre} equipos={edicion.equipos.length} />}

      <section className={s.bloque} aria-labelledby="equipos">
        <h2 id="equipos">Equipos</h2>
        <p>{edicion.equipos.length} equipos. Toca uno para ver a sus integrantes.</p>
        {edicion.equipos.length
          ? <EquiposEdicion equipos={edicion.equipos} />
          : <p>Los equipos se anunciarán pronto.</p>}
      </section>

      <section className={s.bloque} aria-labelledby="pruebas">
        <h2 id="pruebas">Pruebas</h2>
        <p>Los retos de esta edición, en el orden en que se correrán.</p>
        <PruebasEdicion pruebas={edicion.pruebas} />
      </section>

      <section className={s.bloque} aria-labelledby="resultados" style={{ paddingBottom: 80 }}>
        <h2 id="resultados">Resultados</h2>
        <p>Tabla general y resultados de cada prueba, con el tiempo final de cada equipo.</p>
        <ResultadosEnVivo eventoId={edicion.eventoId} logos={Object.fromEntries(edicion.equipos.map((e) => [e.id, e.logo]))} />
      </section>
    </PaginaSitio>
  );
}
