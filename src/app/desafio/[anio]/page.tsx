import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import PortadaEdicion from '@/components/sitio/edicion/PortadaEdicion';
import Preparacion from '@/components/landing/secciones/Preparacion';
import EquiposEdicion from '@/components/sitio/edicion/EquiposEdicion';
import PruebasEdicion from '@/components/sitio/edicion/PruebasEdicion';
import CronogramaEdicion from '@/components/sitio/edicion/CronogramaEdicion';
import ResultadosPublicos from '@/components/sitio/edicion/ResultadosPublicos';
import CartillaEdicion from '@/components/sitio/edicion/CartillaEdicion';
import { PREGUNTAS_EDICION } from '@/lib/contenido';
import { datosEdicion, resultadosPublicosDisponibles } from '@/lib/landing/edicion';
import { EVENTO } from '@/lib/evento';
import s from '@/components/sitio/pagina.module.css';
import estilosEdicion from '@/components/sitio/edicion/edicion.module.css';

// Refresca la disponibilidad pública poco después de la fecha de cierre del evento.
export const revalidate = 60;

type Props = { params: Promise<{ anio: string }>; searchParams?: Promise<{ evento?: string }> };

const anioDe = (texto: string) => (/^\d{4}$/.test(texto) ? Number(texto) : null);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Desafío ${(await params).anio}` };
}

/** Página de la edición de un año (/desafio-2026): el evento, sus equipos con su alineación, las pruebas y los resultados. */
export default async function PaginaEdicion({ params, searchParams }: Props) {
  const anio = anioDe((await params).anio);
  const eventoId = (await searchParams)?.evento;
  const edicion = anio ? await datosEdicion(anio, eventoId) : null;
  if (!edicion) notFound();
  const esActual = edicion.anio === EVENTO.inicio.getFullYear();
  const mostrarResultados = await resultadosPublicosDisponibles(edicion.eventoId);

  return (
    <PaginaSitio
      etiqueta={`${edicion.anio} · Desafío ${edicion.codigo}`}
      titulo={edicion.nombre}
      intro={esActual
        ? 'Todo sobre la edición de este año: el cronograma, los equipos, sus integrantes y las pruebas. Los resultados se publicarán al finalizar el evento.'
        : `La edición ${edicion.anio}: sus equipos, sus integrantes, las pruebas y los resultados.`}
    >
      {esActual && <PortadaEdicion logo={edicion.logo} nombre={edicion.nombre} equipos={edicion.equipos.length} />}

      {esActual && (
        <nav className={estilosEdicion.indiceEdicion} aria-label="Índice de la edición">
          <span>Ir a</span>
          <a href="#preparacion">Preparación</a>
          <a href="#cronograma">Cronograma y llegada</a>
          <a href="#equipos">Equipos</a>
          <a href="#pruebas">Pruebas</a>
          <a href="#cartilla">Cartilla</a>
          <a href="#preguntas-edicion">Preguntas</a>
          <a href="#resultados">Resultados</a>
        </nav>
      )}

      {esActual && <Preparacion enEdicion />}

      {esActual && <CronogramaEdicion />}

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

      {esActual && <div id="cartilla"><CartillaEdicion /></div>}

      {esActual && (
        <section className={`${s.bloque} ${estilosEdicion.preguntasEdicion}`} aria-labelledby="preguntas-edicion">
          <h2 id="preguntas-edicion">Antes de salir, resuelve tus dudas</h2>
          <p>Información práctica para que cada equipo llegue preparado.</p>
          <div>
            {PREGUNTAS_EDICION.map((pregunta) => (
              <details key={pregunta.pregunta}>
                <summary>{pregunta.pregunta}<span aria-hidden="true" /></summary>
                <p>{pregunta.respuesta}</p>
                <a href={pregunta.enlace.href} target={pregunta.enlace.externo ? '_blank' : undefined} rel={pregunta.enlace.externo ? 'noopener noreferrer' : undefined}>
                  {pregunta.enlace.texto}
                </a>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className={s.bloque} aria-labelledby="resultados" style={{ paddingBottom: 80 }}>
        <h2 id="resultados">Resultados</h2>
        {mostrarResultados ? (
          <>
            <p>Tabla general y resultados de cada prueba, con el tiempo final de cada equipo.</p>
            <ResultadosPublicos eventoId={edicion.eventoId} logos={Object.fromEntries(edicion.equipos.map((e) => [e.id, e.logo]))} />
          </>
        ) : (
          <p className={estilosEdicion.vacio}>Los resultados se publicarán cuando finalice el evento. La clasificación en vivo está disponible dentro del sistema de cronometraje.</p>
        )}
      </section>
    </PaginaSitio>
  );
}
