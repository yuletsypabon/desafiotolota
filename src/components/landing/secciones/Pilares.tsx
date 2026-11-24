import Link from 'next/link';
import { PILARES } from '@/lib/contenido';
import Foto from '../Foto';
import s from '../Landing.module.css';

/** Qué es Tolotá y sus tres pilares, en una escena compacta sobre una foto de equipo. */
export default function Pilares() {
  return (
    <section id="experiencia" className={s.seccion} aria-labelledby="pilares-titulo">
      <div className={`${s.escena} ${s.pilaresEscena}`}>
        <Foto id="proposito" sizes="100vw" />
        <div className={s.veloOscuro} aria-hidden="true" />
        <header className={`${s.pilaresIntro} ${s.reveal}`}>
          <div>
            <p className={s.etiqueta}>Aventura · Fe · Comunidad</p>
            <h2 id="pilares-titulo" className={s.tituloPanel}>Mucho más que un reto.</h2>
          </div>
          <p className={s.pilaresDescripcion}>
            Tolotá reúne a jóvenes adventistas que representan a su iglesia, enfrentan retos en equipo y viven una experiencia de fe durante el campamento.
          </p>
        </header>
        <div className={`${s.pilares} ${s.reveal} ${s.d1}`}>
          {PILARES.map((p, i) => (
            <article key={p.id} className={`${s.vidrio} ${s.pilar} ${s.reveal} ${[s.d1, s.d2, s.d3][i]}`}>
              <span className={s.pilarNumero} aria-hidden="true">{i + 1}</span>
              <p className={s.etiqueta}>{p.nombre}</p>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
              <Link href={p.enlace.ruta} className={s.enlaceFlecha}>{p.enlace.texto}</Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
