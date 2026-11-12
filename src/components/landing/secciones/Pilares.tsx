import Link from 'next/link';
import { PILARES } from '@/lib/contenido';
import Foto from '../Foto';
import s from '../Landing.module.css';

/** Mucho más que un reto: los tres pilares en tarjetas de vidrio sobre la foto del campamento. */
export default function Pilares() {
  return (
    <section className={s.seccion} aria-labelledby="pilares-titulo">
      <div className={s.escena}>
        <Foto id="pilares" />
        <div className={s.veloOscuro} aria-hidden="true" />
        <h2 id="pilares-titulo" className={`${s.tituloPanel} ${s.reveal}`}>Mucho más que un reto</h2>
        <div className={s.pilares}>
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
