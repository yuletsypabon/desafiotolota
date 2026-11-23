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
        <h2 id="recorrido-titulo" className={`${s.titulo} ${s.recorridoTitulo}`}>Seis días fuera de lo ordinario.</h2>
        <div className={`${s.recorridoCabecera} ${s.reveal}`}>
          <SelectorDias dias={CRONOGRAMA} activo={diaActivo} onSeleccion={setDiaActivo} enIntro />
          <Link href={`${rutaEdicion(EVENTO.inicio.getFullYear())}#cronograma`} className={`${s.enlaceFlecha} ${s.recorridoEnlace}`}>
            Ver cronograma completo
          </Link>
        </div>
        <div className={s.recorridoCarrusel}>
          <CarruselDias dias={CRONOGRAMA} activo={diaActivo} onSeleccion={setDiaActivo} mostrarSelector={false} />
        </div>
      </div>
    </section>
  );
}
