'use client';
import { useState } from 'react';
import useSWR from 'swr';
import { fmt } from '@/lib/format';
import type { ResultadosPublicos } from '@/lib/landing/tiposEdicion';
import s from './edicion.module.css';

const leer = (url: string) => fetch(url, { cache: 'no-store' }).then((r) => {
  if (!r.ok) throw new Error(`Error ${r.status}`);
  return r.json() as Promise<ResultadosPublicos>;
});

/**
 * Tabla general y resultados por prueba, que se actualizan solos cada 10 s mientras se cronometra.
 * Los tres primeros van en un podio con su logo.
 */
export default function ResultadosEnVivo({ eventoId, logos }: { eventoId: string; logos: Record<string, string | null> }) {
  const { data, error } = useSWR(`/api/publico/resultados/${eventoId}`, leer, { refreshInterval: 10_000 });
  const [vista, setVista] = useState('general');

  if (error && !data) return <p className={s.vacio}>No se pudieron cargar los resultados. Se volverá a intentar en unos segundos.</p>;
  if (!data) return <p className={s.vacio}>Cargando resultados…</p>;
  if (!data.general.length) return <p className={s.vacio}>Los resultados aparecerán aquí en cuanto los equipos empiecen a competir.</p>;

  const prueba = data.pruebas.find((p) => p.id === vista);
  const filas = prueba
    ? prueba.filas.map((f) => ({ pos: f.pos, equipoId: f.equipoId, nombre: f.nombre, detalle: '', tiempo: f.finalMs }))
    : data.general.map((g) => ({ pos: g.pos, equipoId: g.equipoId, nombre: g.nombre, detalle: `${g.completadas}/${data.totalPruebas} pruebas`, tiempo: g.totalMs }));
  const podio = filas.slice(0, 3);

  return (
    <div>
      <div className={s.vistas} role="tablist" aria-label="Resultados">
        {[{ id: 'general', nombre: 'General' }, ...data.pruebas.filter((p) => p.filas.length)].map((v) => (
          <button key={v.id} type="button" role="tab" aria-selected={vista === v.id} onClick={() => setVista(v.id)}>{v.nombre}</button>
        ))}
      </div>

      <ol className={s.podio}>
        {podio.map((f) => {
          const logo = logos[f.equipoId];
          return (
            <li key={f.equipoId} data-pos={f.pos}>
              {/* eslint-disable-next-line @next/next/no-img-element -- logos guardados como data URL */}
              {logo ? <img src={logo} alt="" /> : <span className={s.sinLogo}>{f.nombre.charAt(0)}</span>}
              <b>{f.pos}</b>
              <h3>{f.nombre}</h3>
              <time>{fmt(f.tiempo)}</time>
            </li>
          );
        })}
      </ol>
      {filas.length > 3 && (
        <table className={s.tabla}>
          <thead><tr><th>Pos.</th><th>Equipo</th><th>{prueba ? '' : 'Pruebas'}</th><th>Tiempo</th></tr></thead>
          <tbody>
            {filas.slice(3).map((f) => (
              <tr key={f.equipoId}><td>{f.pos}</td><td>{f.nombre}</td><td>{f.detalle}</td><td><time>{fmt(f.tiempo)}</time></td></tr>
            ))}
          </tbody>
        </table>
      )}
      <p className={s.nota}>Se actualiza solo cada 10 segundos.</p>
    </div>
  );
}
