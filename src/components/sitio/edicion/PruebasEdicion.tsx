import type { PruebaPublica } from '@/lib/landing/tiposEdicion';
import s from './edicion.module.css';

const ESTADO: Record<PruebaPublica['estado'], string> = { PENDIENTE: 'Próximamente', EN_CURSO: 'En curso', FINALIZADA: 'Finalizada' };

/** Pruebas del evento en su orden, con su estado (próximamente, en curso o finalizada). */
export default function PruebasEdicion({ pruebas }: { pruebas: PruebaPublica[] }) {
  if (!pruebas.length) return <p className={s.vacio}>Las pruebas de esta edición se anunciarán pronto.</p>;
  return (
    <ol className={s.pruebas}>
      {pruebas.map((p, i) => (
        <li key={p.id} data-estado={p.estado}>
          <b>{String(i + 1).padStart(2, '0')}</b>
          <h3>{p.nombre}</h3>
          <span>{ESTADO[p.estado]}</span>
        </li>
      ))}
    </ol>
  );
}
