'use client';
import { useRef, useState, type CSSProperties } from 'react';
import type { DiaCronograma } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import s from './carrusel.module.css';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/**
 * Cronograma en tarjetas giratorias: el día elegido al frente y los demás abiertos en abanico a los lados, más
 * pequeños y desenfocados. Se cambia de día tocando una tarjeta lateral, con los botones de día de abajo,
 * deslizando el dedo o con las teclas izquierda y derecha.
 * `completo` muestra todas las actividades con su hora; si no, solo las destacadas (para la portada).
 */
export default function CarruselDias({ dias, completo = false }: { dias: DiaCronograma[]; completo?: boolean }) {
  const [activo, setActivo] = useState(0);
  const inicioToque = useRef<number | null>(null);
  const ir = (i: number) => setActivo(Math.max(0, Math.min(dias.length - 1, i)));
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
          const desfase = i - activo;
          const lejos = Math.abs(desfase);
          const actividades = completo ? d.actividades : d.actividades.filter((x) => x.destacada);
          return (
            <article
              key={d.num}
              className={s.carta}
              data-activa={desfase === 0}
              data-oculta={lejos > 2}
              style={{ '--desfase': desfase, '--lejos': Math.min(lejos, 3), zIndex: 20 - lejos } as CSSProperties}
              aria-hidden={desfase !== 0}
              onClick={() => desfase !== 0 && ir(i)}
            >
              <header className={s.cabeza}>
                <span className={s.pildora}>{EVENTO.inicio.getFullYear()}</span>
                <span>Día {i + 1} de {dias.length}</span>
              </header>
              <div className={s.fecha}>
                <b>{d.num}</b>
                <span>{d.dia} · {mes}</span>
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

      <div className={s.dias} role="tablist" aria-label="Elegir día">
        {dias.map((d, i) => (
          <button
            key={d.num}
            type="button"
            role="tab"
            aria-selected={i === activo}
            onClick={() => ir(i)}
          >
            {d.dia} {d.num}
          </button>
        ))}
      </div>
    </div>
  );
}
