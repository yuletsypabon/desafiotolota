'use client';

import { useState } from 'react';
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

  return (
    <section id="cronograma" className={s.cronograma} aria-labelledby="cronograma-titulo">
      <div className={s.cronogramaInfo}>
        <p className={s.cronogramaEtiqueta}>Cronograma</p>
        <h2 id="cronograma-titulo">Seis días, una meta</h2>
        <p>Agenda de los participantes. Puede tener ajustes menores; los capitanes reciben los cambios en el evento.</p>
      </div>
      <div className={s.cronogramaCarrusel}>
        <CarruselDias
          dias={CRONOGRAMA}
          activo={diaActivo}
          onSeleccion={setDiaActivo}
          mostrarSelector={false}
        />
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
