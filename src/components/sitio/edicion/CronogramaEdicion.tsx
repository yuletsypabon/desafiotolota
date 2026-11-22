'use client';

import { useState } from 'react';
import { CRONOGRAMA } from '@/lib/contenido';
import CarruselDias, { SelectorDias } from '@/components/sitio/CarruselDias';
import s from './edicion.module.css';

/** Cronograma completo con el mismo abanico visual de la portada. */
export default function CronogramaEdicion() {
  const [diaActivo, setDiaActivo] = useState(0);

  return (
    <section id="cronograma" className={s.cronograma} aria-labelledby="cronograma-titulo">
      <div className={s.cronogramaCarrusel}>
        <CarruselDias
          dias={CRONOGRAMA}
          completo
          activo={diaActivo}
          onSeleccion={setDiaActivo}
          mostrarSelector={false}
        />
      </div>
      <div className={s.cronogramaInfo}>
        <h2 id="cronograma-titulo">Cronograma · Seis días, una meta</h2>
        <p>Agenda de los participantes. Puede tener ajustes menores; los capitanes reciben los cambios en el evento.</p>
        <SelectorDias dias={CRONOGRAMA} activo={diaActivo} onSeleccion={setDiaActivo} enIntro />
      </div>
    </section>
  );
}
