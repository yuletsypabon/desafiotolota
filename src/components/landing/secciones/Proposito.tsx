import type { ReactNode } from 'react';
import { EQUIPOS_EDICION } from '@/lib/contenido';
import { ANIO_INICIO, EVENTO } from '@/lib/evento';
import Foto from '../Foto';
import s from '../Landing.module.css';

const CIFRAS: { valor: ReactNode; etiqueta: string }[] = [
  { valor: String(ANIO_INICIO), etiqueta: 'Desde' },
  { valor: <>{EVENTO.numero}<small>.ª</small></>, etiqueta: 'Edición' },
  { valor: String(EQUIPOS_EDICION.length), etiqueta: 'Equipos' },
  { valor: String(EVENTO.diasCampamento), etiqueta: 'Días de campamento' },
  { valor: 'X2 · X4', etiqueta: 'Categorías' },
];

/** 02 · El propósito: qué es el Desafío y sus cifras. */
export default function Proposito() {
  return (
    <section id="experiencia" className={s.seccion} aria-labelledby="proposito-titulo">
      <div className={s.dosColumnas}>
        <div className={s.reveal}>
          <p className={s.etiqueta}>02 / El propósito</p>
          <h2 id="proposito-titulo" className={s.titulo}>
            No es solo<br />llegar más lejos.<br />
            <em>Es descubrir<br />quién va contigo.</em>
          </h2>
          <p className={s.parrafo}>
            El Desafío Tolotá reúne cada año a jóvenes adventistas en un campamento de varios días para competir en pistas de
            obstáculos por fases. Cada equipo representa a su iglesia: aquí cada reto es una oportunidad para crecer y cada
            persona, parte de tu equipo.
          </p>
        </div>
        <figure className={`${s.figura} ${s.reveal} ${s.d1}`}>
          <div className={s.marco}>
            <Foto id="proposito" sizes="(max-width: 900px) 100vw, 45vw" />
          </div>
          <figcaption>Cuerpo en movimiento. Propósito en el corazón.</figcaption>
        </figure>
      </div>
      <dl className={s.cifras}>
        {CIFRAS.map((c, i) => (
          <div key={c.etiqueta} className={`${s.vidrio} ${s.reveal} ${[s.d1, s.d2, s.d3][i % 3]}`}>
            <dt>{c.etiqueta}</dt>
            <dd>{c.valor}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
