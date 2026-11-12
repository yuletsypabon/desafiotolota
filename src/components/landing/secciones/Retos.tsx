import { RETOS } from '@/lib/contenido';
import Foto from '../Foto';
import s from '../Landing.module.css';

/** 03 · Los retos: tres tarjetas con foto de fondo. Las categorías X2/X4 llevan el nombre del año (base de datos). */
export default function Retos({ nombreX2, nombreX4 }: { nombreX2: string | null; nombreX4: string | null }) {
  // Solo los nombres que ya estén definidos en el sistema (sin «(nombre)» de relleno)
  const categorias = [nombreX2, nombreX4].filter(Boolean).join(' · ');
  return (
    <section id="retos" className={s.seccion} aria-labelledby="retos-titulo">
      <div className={`${s.cabeceraFila} ${s.reveal}`}>
        <div>
          <p className={s.etiqueta}>03 / Los retos</p>
          {/* En una sola línea en pantallas anchas; en celular se parte donde haga falta */}
          <h2 id="retos-titulo" className={`${s.titulo} ${s.tituloLinea}`}>Sal de tu zona. Entra en el reto.</h2>
        </div>
      </div>
      <div className={s.retos}>
        {RETOS.map((r, i) => (
          <article key={r.titulo} className={`${s.reto} ${s.reveal} ${[s.d1, s.d2, s.d3][i]}`}>
            <Foto id={r.foto} sizes="(max-width: 900px) 100vw, 33vw" />
            <span className={`${s.vidrio} ${s.retoNumero}`}>{String(i + 1).padStart(2, '0')}</span>
            <div className={s.retoTexto}>
              <p className={s.etiqueta}>{r.etiqueta}</p>
              <h3>{r.titulo}</h3>
              <p>{r.texto}</p>
              {r.foto === 'equipo' && categorias && <p className={s.retoCategorias}>{categorias}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
