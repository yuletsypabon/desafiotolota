import { PREGUNTAS } from '@/lib/contenido';
import s from '../Landing.module.css';

/** 06 · Antes de dar el paso: preguntas frecuentes (acordeón nativo, funciona sin JavaScript). */
export default function Preguntas() {
  return (
    <section className={s.seccion} aria-labelledby="preguntas-titulo">
      <div className={s.dosColumnas}>
        <div className={s.reveal}>
          <p className={s.etiqueta}>06 / Antes de dar el paso</p>
          <h2 id="preguntas-titulo" className={s.titulo}>Las dudas,<br />fuera.</h2>
        </div>
        <div className={`${s.acordeon} ${s.reveal} ${s.d1}`}>
          {PREGUNTAS.map((p, i) => (
            <details key={p.pregunta} className={s.vidrio} open={i === 0}>
              <summary>{p.pregunta}<i aria-hidden="true" /></summary>
              <p>{p.respuesta}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
