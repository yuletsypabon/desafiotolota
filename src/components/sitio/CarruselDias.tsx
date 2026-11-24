'use client';
import { useRef, useState, type CSSProperties } from 'react';
import type { DiaCronograma } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import s from './carrusel.module.css';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DIAS_COMPLETOS: Record<string, string> = {
  Mar: 'Martes', Mié: 'Miércoles', Jue: 'Jueves', Vie: 'Viernes', Sáb: 'Sábado', Dom: 'Domingo',
};

export function SelectorDias({
  dias, activo, onSeleccion, enIntro = false,
}: {
  dias: DiaCronograma[];
  activo: number;
  onSeleccion: (indice: number) => void;
  enIntro?: boolean;
}) {
  return (
    <div className={`${s.dias} ${enIntro ? s.diasEnIntro : ''}`} role="tablist" aria-label="Elegir día">
      {dias.map((d, i) => (
        <button
          key={d.num}
          type="button"
          role="tab"
          aria-selected={i === activo}
          aria-label={`${DIAS_COMPLETOS[d.dia] ?? d.dia} ${d.num}`}
          onClick={() => onSeleccion(i)}
        >
          <span className={s.diaAbreviado} aria-hidden={enIntro}>{d.dia}</span>
          {enIntro && <span className={s.diaCompleto} aria-hidden="true">{DIAS_COMPLETOS[d.dia] ?? d.dia}</span>}
          <strong>{d.num}</strong>
        </button>
      ))}
    </div>
  );
}

/**
 * Cronograma en tarjetas giratorias: el día elegido al frente y los demás abiertos en abanico a los lados, más
 * pequeños y desenfocados. Se cambia de día tocando una tarjeta lateral, con los botones de día de abajo,
 * deslizando el dedo o con las teclas izquierda y derecha.
 * `completo` muestra todas las actividades con su hora; si no, solo las destacadas (para la portada).
 */
export default function CarruselDias({
  dias, completo = false, activo: activoExterno, onSeleccion, mostrarSelector = true,
}: {
  dias: DiaCronograma[];
  completo?: boolean;
  activo?: number;
  onSeleccion?: (indice: number) => void;
  mostrarSelector?: boolean;
}) {
  const [activoInterno, setActivoInterno] = useState(0);
  const activo = activoExterno ?? activoInterno;
  const inicioToque = useRef<number | null>(null);
  const ir = (i: number) => {
    if (dias.length === 0) return;
    const siguiente = ((i % dias.length) + dias.length) % dias.length;
    if (activoExterno === undefined) setActivoInterno(siguiente);
    onSeleccion?.(siguiente);
  };
  const mes = MESES[EVENTO.inicio.getMonth()];

  return (
    <div
      className={`${s.carrusel} ${completo ? s.completo : ''}`}
      role="region"
      aria-roledescription="carrusel"
      aria-label="Cronograma por días"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') ir(activo - 1);
        if (e.key === 'ArrowRight') ir(activo + 1);
      }}
      onPointerDown={(e) => (inicioToque.current = e.clientX)}
      onPointerUp={(e) => {
        if (inicioToque.current === null) return;
        const dx = e.clientX - inicioToque.current;
        inicioToque.current = null;
        if (Math.abs(dx) > 40) ir(activo + (dx < 0 ? 1 : -1));
      }}
    >
      <div className={s.escena}>
        {dias.map((d, i) => {
          const distanciaDirecta = i - activo;
          const desfase = distanciaDirecta > dias.length / 2
            ? distanciaDirecta - dias.length
            : distanciaDirecta < -dias.length / 2
              ? distanciaDirecta + dias.length
              : distanciaDirecta;
          const lejos = Math.abs(desfase);
          const actividades = completo && desfase === 0
            ? d.actividades
            : d.actividades.filter((x) => x.destacada);
          return (
            <article
              key={d.num}
              className={s.carta}
              data-activa={desfase === 0}
              data-oculta={lejos > 2}
              style={{
                '--desfase': desfase,
                '--lejos': Math.min(lejos, 3),
                '--elevacion': `${lejos * 14}px`,
                zIndex: 40 - lejos,
              } as CSSProperties}
              aria-hidden={desfase !== 0}
              onClick={() => desfase !== 0 && ir(i)}
            >
              <header className={s.cabeza}>
                <span className={s.pildora}>{EVENTO.inicio.getFullYear()}</span>
                <span>Día {i + 1} de {dias.length}</span>
              </header>
              <div className={s.fecha}>
                <div className={s.fechaEncabezado}>
                  <b>{d.num}</b>
                  <span className={s.fechaMes}>{mes}</span>
                </div>
              {completo && <span className={s.fechaDiaCompleto}>{DIAS_COMPLETOS[d.dia] ?? d.dia}</span>}
              </div>
              <h3>{d.titulo}</h3>
              <p className={s.resumen}>{d.resumen}</p>
              <ul className={s.actividades}>
                {actividades.map((x) => (
                  <li key={x.hora + x.que} data-destacada={!!x.destacada}>
                    <time>{x.hora}</time>
                    <span>{x.que}</span>
                  </li>
                ))}
              </ul>
              <footer className={s.pie}>Desafío {EVENTO.edicion} · {EVENTO.sede}</footer>
            </article>
          );
        })}
      </div>

      {mostrarSelector && <SelectorDias dias={dias} activo={activo} onSeleccion={ir} />}
    </div>
  );
}
