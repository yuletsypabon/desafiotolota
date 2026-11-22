'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CRONOGRAMA } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import { rutaEdicion } from '@/lib/rutas';
import CarruselDias, { SelectorDias } from '@/components/sitio/CarruselDias';
import s from '../Landing.module.css';

/** 05 · El recorrido: los seis días del campamento en tarjetas giratorias, de la llegada a la clausura. */
export default function Recorrido() {
  const [diaActivo, setDiaActivo] = useState(0);

  return (
    <section id="programa" className={s.seccion} aria-labelledby="recorrido-titulo">
      <div className={s.recorridoComposicion}>
        <div className={s.recorridoCabecera}>
          <div className={`${s.recorridoTexto} ${s.reveal}`}>
            <p className={s.etiqueta}>05 / El recorrido</p>
            <h2 id="recorrido-titulo" className={s.titulo}>Seis días fuera<br />de lo ordinario.</h2>
            <SelectorDias dias={CRONOGRAMA} activo={diaActivo} onSeleccion={setDiaActivo} enIntro />
            <p className={s.parrafo}>Del primer paso a la última canción.<br />Una experiencia para vivir con todo.</p>
            <div className={`${s.nota} ${s.reveal} ${s.d1}`}>
              <p className={s.etiqueta}>Programa orientativo</p>
              <p>Puede tener ajustes menores; los capitanes reciben los cambios en el evento.</p>
              <Link href={`${rutaEdicion(EVENTO.inicio.getFullYear())}#cronograma`} className={s.enlaceFlecha}>Ver cronograma completo</Link>
            </div>
          </div>
        </div>
        <div className={s.recorridoCarrusel}>
          <CarruselDias dias={CRONOGRAMA} activo={diaActivo} onSeleccion={setDiaActivo} mostrarSelector={false} />
        </div>
      </div>
    </section>
  );
}
