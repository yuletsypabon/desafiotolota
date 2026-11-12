import Link from 'next/link';
import { CRONOGRAMA } from '@/lib/contenido';
import CarruselDias from '@/components/sitio/CarruselDias';
import s from '../Landing.module.css';

/** 05 · El recorrido: los seis días del campamento en tarjetas giratorias, de la llegada a la clausura. */
export default function Recorrido() {
  return (
    <section id="programa" className={s.seccion} aria-labelledby="recorrido-titulo">
      <div className={s.dosColumnas}>
        <div className={`${s.recorridoIntro} ${s.reveal}`}>
          <div>
            <p className={s.etiqueta}>05 / El recorrido</p>
            <h2 id="recorrido-titulo" className={s.titulo}>Seis días fuera<br />de lo ordinario.</h2>
            <p className={s.parrafo}>Del primer paso a la última canción.<br />Una experiencia para vivir con todo.</p>
          </div>
          <div className={s.nota}>
            <p className={s.etiqueta}>Programa orientativo</p>
            <p>Puede tener ajustes menores; los capitanes reciben los cambios en el evento.</p>
            <Link href="/recursos#cronograma" className={s.enlaceFlecha}>Ver cronograma completo</Link>
          </div>
        </div>
        <div className={`${s.reveal} ${s.d1}`}>
          <CarruselDias dias={CRONOGRAMA} />
        </div>
      </div>
    </section>
  );
}
