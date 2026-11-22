'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { mezclarMomentosHero, MOMENTOS_HERO, type MomentoHero } from '@/lib/landing/momentosHero';
import s from '../Landing.module.css';

/** Galería de momentos del evento. En escritorio abre una tarjeta y deja visibles las demás. */
export default function CarruselHero({ onFotoActiva }: { onFotoActiva: (foto: MomentoHero) => void }) {
  const [orden, setOrden] = useState(() => MOMENTOS_HERO.map((_, indice) => indice));
  const [posicion, setPosicion] = useState(0);
  const [pausado, setPausado] = useState(false);
  const momentoActivo = MOMENTOS_HERO[orden[posicion]];

  useEffect(() => {
    setOrden(mezclarMomentosHero());
  }, []);

  useEffect(() => {
    onFotoActiva(momentoActivo);
  }, [momentoActivo, onFotoActiva]);

  useEffect(() => {
    if (pausado || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const intervalo = window.setInterval(() => {
      if (posicion + 1 < orden.length) {
        setPosicion(posicion + 1);
      } else {
        setOrden(mezclarMomentosHero(momentoActivo.src));
        setPosicion(0);
      }
    }, 6500);
    return () => window.clearInterval(intervalo);
  }, [momentoActivo.src, orden, pausado, posicion]);

  return (
    <div
      className={s.galeriaHero}
      role="group"
      aria-label="Momentos del Desafío Tolotá"
      onPointerEnter={() => setPausado(true)}
      onPointerLeave={() => setPausado(false)}
      onFocusCapture={() => setPausado(true)}
      onBlurCapture={() => setPausado(false)}
    >
      {Array.from({ length: 4 }, (_, lugar) => {
        const posicionMomento = (posicion + lugar) % orden.length;
        const indice = orden[posicionMomento];
        const momento = MOMENTOS_HERO[indice];
        const activa = lugar === 0;
        return (
        <button
          key={indice}
          type="button"
          className={`${s.tarjetaHero} ${activa ? s.tarjetaHeroActiva : ''}`}
          aria-label={`${indice + 1} de ${MOMENTOS_HERO.length}: ${momento.titulo}`}
          aria-pressed={activa}
          onClick={() => setPosicion(posicionMomento)}
        >
          <Image
            src={momento.src}
            alt={momento.alt}
            fill
            sizes="(max-width: 900px) 80vw, 28vw"
            className={s.imagenTarjetaHero}
          />
          <span className={s.textoTarjetaHero}>
            <small>MOMENTOS DEL DESAFÍO</small>
            <strong>{momento.titulo}</strong>
          </span>
        </button>
        );
      })}
    </div>
  );
}
