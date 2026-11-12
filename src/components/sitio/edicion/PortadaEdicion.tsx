'use client';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { EVENTO } from '@/lib/evento';
import { useCuentaRegresiva } from '@/components/landing/hooks/useCuentaRegresiva';
import s from './edicion.module.css';

/** Datos del evento (fecha, lugar, equipos) y cuenta regresiva hasta la llegada de los equipos. */
export default function PortadaEdicion({ logo, nombre, equipos }: { logo: string | null; nombre: string; equipos: number }) {
  const c = useCuentaRegresiva();
  const casillas = [[c.dias, 'Días'], [c.horas, 'Horas'], [c.minutos, 'Min'], [c.segundos, 'Seg']] as const;
  return (
    <section className={s.portada} aria-label="Datos del evento">
      {/* eslint-disable-next-line @next/next/no-img-element -- el logo es un data URL guardado en la base */}
      {logo && <img className={s.logoEvento} src={logo} alt={`Logo de ${nombre}`} />}
      <div>
        <dl className={s.datos}>
          <div><CalendarMonthOutlinedIcon aria-hidden="true" /><dt>Fecha</dt><dd>{EVENTO.fechas}</dd></div>
          <div><PlaceOutlinedIcon aria-hidden="true" /><dt>Lugar</dt><dd>{EVENTO.sede} · {EVENTO.lugar}</dd></div>
          <div><GroupsOutlinedIcon aria-hidden="true" /><dt>Equipos</dt><dd>{equipos} inscritos</dd></div>
        </dl>
        {!c.terminada && (
          <div className={s.reloj} role="timer" aria-label={`Faltan ${c.dias} días para el evento`}>
            {casillas.map(([n, et]) => (
              <div key={et}>
                {/* el reloj cambia entre el servidor y el navegador: es esperado */}
                <b suppressHydrationWarning>{String(n).padStart(2, '0')}</b>
                <span>{et}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
