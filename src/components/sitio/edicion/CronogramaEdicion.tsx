'use client';

import { useState } from 'react';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import { CRONOGRAMA } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import CarruselDias from '@/components/sitio/CarruselDias';
import s from './edicion.module.css';

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
const DIAS_COMPLETOS: Record<string, string> = {
  Mar: 'Martes', Mié: 'Miércoles', Jue: 'Jueves', Vie: 'Viernes', Sáb: 'Sábado', Dom: 'Domingo',
};

/** Cronograma completo con el mismo abanico visual de la portada. */
export default function CronogramaEdicion() {
  const [diaActivo, setDiaActivo] = useState(0);
  const dia = CRONOGRAMA[diaActivo];
  const hitos = [
    { dia: CRONOGRAMA[0], etiqueta: 'Recepción' },
    { dia: CRONOGRAMA[1], etiqueta: 'Pruebas físicas' },
    { dia: CRONOGRAMA[4], etiqueta: 'Sábado' },
    { dia: CRONOGRAMA[5], etiqueta: 'Clausura' },
  ];
  const recepcion = CRONOGRAMA[0].actividades.find((actividad) => actividad.que.startsWith('Recepción'));

  return (
    <section id="cronograma" className={s.cronograma} aria-labelledby="cronograma-titulo">
      <div className={s.cronogramaInfo}>
        <p className={s.cronogramaEtiqueta}>Cronograma</p>
        <h2 id="cronograma-titulo">Seis días, una meta</h2>
        <p>Agenda de los participantes. Puede tener ajustes menores; los capitanes reciben los cambios en el evento.</p>
      </div>
      <ol className={s.hitosCronograma} aria-label="Hitos principales del evento">
        {hitos.map(({ dia: hito, etiqueta }) => (
          <li key={etiqueta}>
            <span>{etiqueta}</span>
            <b>{hito.num}</b>
            <small>{hito.dia} · DIC</small>
          </li>
        ))}
      </ol>
      <div className={s.cronogramaCarrusel}>
        <CarruselDias
          dias={CRONOGRAMA}
          activo={diaActivo}
          onSeleccion={setDiaActivo}
          mostrarSelector={false}
        />
      </div>
      <div id="llegada" className={s.llegadaCronograma}>
        <div>
          <p className={s.cronogramaEtiqueta}>Planifica tu llegada</p>
          <h3>{EVENTO.sede}</h3>
          <p>{EVENTO.lugarDetalle}</p>
        </div>
        <p className={s.horarioLlegada}><b>Martes 15 de diciembre</b><span>Recepción de equipos · {recepcion?.hora ?? 'desde las 12:00 m.'}</span></p>
        <a className={s.mapaCronograma} href={EVENTO.mapa} target="_blank" rel="noopener noreferrer">Abrir en Maps <FlechaAccion /></a>
      </div>
      <details className={s.agendaCompleta}>
        <summary>Ver agenda detallada · {dia.dia} {dia.num}</summary>
        <div className={s.agendaVista}>
          <header className={s.agendaDia}>
            <div className={s.agendaFecha}>
              <b>{dia.num}</b>
              <span>{MESES[EVENTO.inicio.getMonth()]}</span>
            </div>
            <p className={s.agendaDiaVertical}>{DIAS_COMPLETOS[dia.dia] ?? dia.dia}</p>
          </header>
          <ol className={s.agendaLista}>
            {dia.actividades.map((actividad) => (
              <li key={`${actividad.hora}-${actividad.que}`} data-destacada={!!actividad.destacada}>
                <time>{actividad.hora}</time>
                <span>{actividad.que}</span>
              </li>
            ))}
          </ol>
        </div>
      </details>
    </section>
  );
}
