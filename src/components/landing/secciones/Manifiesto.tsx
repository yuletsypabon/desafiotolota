import { MANIFIESTO } from '@/lib/contenido';
import s from '../Landing.module.css';

/** Franja amarilla que se desplaza sin parar hacia la derecha. Las frases van dos veces para que el bucle no se note. */
export default function Manifiesto() {
  // Cada copia repite las frases para cubrir pantallas anchas
  const frases = (copia: number) =>
    [...MANIFIESTO, ...MANIFIESTO, ...MANIFIESTO].map((f, i) => (
      <li key={`${copia}-${i}`}>
        {f}
        <span aria-hidden="true">/</span>
      </li>
    ));

  return (
    <section className={s.manifiesto} aria-label={`Manifiesto: ${MANIFIESTO.join(', ')}`}>
      <div className={s.manifiestoPista} aria-hidden="true">
        <ul>{frases(0)}</ul>
        <ul>{frases(1)}</ul>
      </div>
    </section>
  );
}
