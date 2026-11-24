import { EVENTO } from '@/lib/evento';
import Foto from '../Foto';
import s from '../Landing.module.css';

/** Explica el propósito del encuentro junto a una foto de equipo. */
export default function Experiencia() {
  return (
    <section id="experiencia" className={`${s.seccion} ${s.experiencia}`} aria-labelledby="experiencia-titulo">
      <div className={s.experienciaPresentacion}>
        <figure className={`${s.experienciaFoto} ${s.reveal}`}>
          <Foto id="proposito" sizes="(max-width: 900px) 100vw, 42vw" />
          <figcaption>Una iglesia, un equipo; un desafío que se vive juntos.</figcaption>
        </figure>
        <div className={`${s.experienciaTexto} ${s.reveal} ${s.d1}`}>
          <p className={s.etiqueta}>Aventura · Fe · Comunidad</p>
          <h2 id="experiencia-titulo" className={s.titulo}>Más que una carrera.<br /><em>Una experiencia que une.</em></h2>
          <p className={s.parrafo}>
            El Desafío Tolotá reúne a jóvenes adventistas en un campamento donde cada equipo representa a su iglesia.
            Durante seis días comparten retos de aventura, estudio bíblico, adoración y vida en comunidad. En {EVENTO.inicio.getFullYear()},
            la cartilla estudia <strong>{EVENTO.tema.nombre.toLocaleUpperCase('es-CO')}</strong>.
          </p>
        </div>
      </div>
    </section>
  );
}
