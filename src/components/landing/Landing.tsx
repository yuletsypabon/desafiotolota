'use client';
import { useRef } from 'react';
import MenuSitio from '@/components/sitio/MenuSitio';
import PieSitio from '@/components/sitio/PieSitio';
import { useReveal } from './hooks/useReveal';
import Cierre from './secciones/Cierre';
import Espiritual from './secciones/Espiritual';
import Hero from './secciones/Hero';
import Manifiesto from './secciones/Manifiesto';
import Pilares from './secciones/Pilares';
import Preguntas from './secciones/Preguntas';
import Proposito from './secciones/Proposito';
import QueEs from './secciones/QueEs';
import Recorrido from './secciones/Recorrido';
import Retos from './secciones/Retos';
import type { EdicionPortada } from '@/lib/landing/datos';
import s from './Landing.module.css';

export interface DatosLanding {
  /** Edición que anuncia el hero (próximo evento de la base) */
  edicion: EdicionPortada;
  /** "Desafío X2: La Travesía"; null mientras el evento no tenga ese nombre */
  nombreX2: string | null;
  /** "Desafío X4: …"; null mientras el evento no tenga ese nombre */
  nombreX4: string | null;
}

/**
 * Portada: secciones numeradas con fotos de fondo (diseño de Figma).
 * Hero · Manifiesto · Propósito · Pilares · ¿Qué es? · Retos · Espiritual · Recorrido · Preguntas · Cierre.
 */
export default function Landing({ edicion, nombreX2, nombreX4 }: DatosLanding) {
  const raiz = useRef<HTMLDivElement>(null);
  useReveal(raiz, s.in, s.animado);

  return (
    <div ref={raiz} className={s.landing}>
      <MenuSitio enPortada />
      <main>
        <Hero edicion={edicion} />
        <Manifiesto />
        <Proposito />
        <Pilares />
        <QueEs />
        <Retos nombreX2={nombreX2} nombreX4={nombreX4} />
        <Espiritual />
        <Recorrido />
        <Preguntas />
        <Cierre />
      </main>
      <PieSitio />
    </div>
  );
}
