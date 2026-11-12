import type { Metadata } from 'next';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import CarruselDias from '@/components/sitio/CarruselDias';
import s from '@/components/sitio/pagina.module.css';
import { CRONOGRAMA, DOCUMENTOS, INSCRIPCION } from '@/lib/contenido';

export const metadata: Metadata = { title: 'Recursos' };

export default function Recursos() {
  return (
    <PaginaSitio
      etiqueta="Bases, cronograma e inscripciones"
      titulo="Recursos"
      intro="Todo lo que tu equipo necesita para prepararse: las bases oficiales, la agenda de los seis días y cómo inscribirse."
    >
      <section id="bases" className={s.bloque} aria-labelledby="bases-titulo">
        <h2 id="bases-titulo">Bases y reglamento</h2>
        <p>Descarga o consulta en línea los documentos oficiales del evento. Léelos con tu equipo antes de llegar.</p>
        <div className={s.rejilla}>
          {DOCUMENTOS.map((d) => (
            <article key={d.titulo} className={s.tarjeta}>
              <h3>{d.titulo}</h3>
              <p>{d.desc}</p>
              {d.url ? (
                <a className={s.enlace} href={d.url} target="_blank" rel="noopener noreferrer">Ver documento</a>
              ) : (
                <span className={s.pronto}>Disponible pronto</span>
              )}
            </article>
          ))}
        </div>
      </section>

      <section id="cronograma" className={s.bloque} aria-labelledby="cronograma-titulo">
        <h2 id="cronograma-titulo">Cronograma · Seis días, una meta</h2>
        <p>Agenda de los participantes. Puede tener ajustes menores; los capitanes reciben los cambios en el evento.</p>
        <CarruselDias dias={CRONOGRAMA} completo />
      </section>

      <section id="inscripcion" className={s.bloque} aria-labelledby="inscripcion-titulo">
        <h2 id="inscripcion-titulo">¿Tu iglesia acepta el desafío?</h2>
        <p>
          La inscripción la hace el capitán de cada equipo a través del formulario oficial.
          {INSCRIPCION.cierre && <> Cierre de inscripciones: <strong>{INSCRIPCION.cierre}</strong>.</>}
        </p>
        <ol className={s.pasos}>
          {INSCRIPCION.pasos.map((p) => <li key={p}>{p}</li>)}
        </ol>
        {INSCRIPCION.url ? (
          <a className={s.enlace} href={INSCRIPCION.url} target="_blank" rel="noopener noreferrer">Ir al formulario</a>
        ) : (
          <span className={s.pronto}>Formulario disponible pronto</span>
        )}
      </section>
    </PaginaSitio>
  );
}
