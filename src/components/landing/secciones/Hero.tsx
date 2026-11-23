'use client';
import { useState } from 'react';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { EVENTO, tituloEdicion } from '@/lib/evento';
import { MOMENTOS_HERO, type MomentoHero } from '@/lib/landing/momentosHero';
import { rutaEdicion } from '@/lib/rutas';
import type { EdicionPortada } from '@/lib/landing/datos';
import Foto from '../Foto';
import CarruselHero from './CarruselHero';
import { useCuentaRegresiva } from '../hooks/useCuentaRegresiva';
import s from '../Landing.module.css';

/** 01 · Portada: edición (del próximo evento en la base), nombre del evento, fecha y lugar, llamado a inscribirse y cuenta regresiva. */
export default function Hero({ edicion }: { edicion: EdicionPortada }) {
  const c = useCuentaRegresiva();
  const [fotoFondo, setFotoFondo] = useState<MomentoHero>(MOMENTOS_HERO[0]);
  const casillas = [[c.dias, 'Días'], [c.horas, 'Horas'], [c.minutos, 'Min'], [c.segundos, 'Seg']] as const;

  return (
    <section id="top" className={s.hero}>
      <Foto id="hero" src={fotoFondo.src} alt={fotoFondo.alt} prioridad animarCambio className={s.fotoHero} />
      <div className={s.velo} aria-hidden="true" />
      <div className={s.heroContenido}>
        <p className={s.chipEdicion}>
          <b>{edicion.anio}</b> {tituloEdicion(edicion)}
        </p>
        <h1 className={s.heroTitulo}>
          Desafío<br />
          <em>Tolotá.</em>
        </h1>
        <p className={s.heroTexto}>
          Pon a prueba tu destreza en la pista de obstáculos y tus conocimientos bíblicos. Vive un campamento juvenil adventista
          para superar retos en equipo y crecer juntos en la fe.
        </p>
        <dl className={s.datos}>
          <div>
            <CalendarMonthOutlinedIcon aria-hidden="true" />
            <dt>Fecha</dt>
            <dd>15 al 21 de diciembre de {EVENTO.inicio.getFullYear()}</dd>
          </div>
          <div>
            <PlaceOutlinedIcon aria-hidden="true" />
            <dt>Lugar</dt>
            <dd>{EVENTO.sede}</dd>
          </div>
        </dl>
        <div className={s.acciones}>
          <a className={s.boton} href="#inscripciones">Inscribe a tu equipo</a>
          <a className={s.botonContorno} href={`${rutaEdicion(EVENTO.inicio.getFullYear())}#cronograma`}>Ver cronograma</a>
        </div>
      </div>
      <CarruselHero onFotoActiva={setFotoFondo} />
      {!c.terminada && (
        <div className={s.relojHero} role="timer" aria-label={`Faltan ${c.dias} días para el Desafío ${EVENTO.edicion}`}>
          {casillas.map(([n, et]) => (
            <div key={et}>
              {/* el reloj cambia entre el servidor y el navegador: es esperado */}
              <b suppressHydrationWarning>{String(n).padStart(2, '0')}</b>
              <span>{et}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
