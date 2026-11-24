'use client';

import { useState } from 'react';
import Image from 'next/image';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import s from './edicion.module.css';

const IGLESIAS = [
  { nombre: 'Éfeso', pagina: 7, arte: 'efeso' },
  { nombre: 'Esmirna', pagina: 10, arte: 'esmirna' },
  { nombre: 'Pérgamo', pagina: 13, arte: 'pergamo' },
  { nombre: 'Tiatira', pagina: 16, arte: 'tiatira' },
  { nombre: 'Sardis', pagina: 19, arte: 'sardis' },
  { nombre: 'Filadelfia', pagina: 22, arte: 'filadelfia' },
  { nombre: 'Laodicea', pagina: 25, arte: 'laodicea' },
] as const;

const PDF = '/documentos/cartilla-2026-7-iglesias.pdf';

/** Índice manual que conecta cada iglesia con su página ilustrada dentro de la cartilla. */
export default function ExploraIglesias() {
  const [activa, setActiva] = useState(0);
  const iglesia = IGLESIAS[activa];
  const restantes = IGLESIAS.filter((_, indice) => indice !== activa);

  const selector = (indice: number, compacto = false) => {
    const opcion = IGLESIAS[indice];
    return (
      <button
        type="button"
        key={opcion.nombre}
        className={`${s.selectorIglesia} ${compacto ? s.selectorCompacto : ''} ${indice === activa ? s.selectorActivo : ''}`}
        aria-pressed={indice === activa}
        onClick={() => setActiva(indice)}
      >
        <span className={s.selectorNumero}>{String(indice + 1).padStart(2, '0')}</span>
        <span className={s.selectorNombre}>{opcion.nombre}</span>
        {compacto && <span className={s.selectorPagina}>Pág. {opcion.pagina}</span>}
      </button>
    );
  };

  return (
    <section className={s.exploradorIglesias} aria-labelledby="explora-iglesias-titulo">
      <header className={s.exploradorCabecera}>
        <div><p>Cartilla · Apocalipsis</p><h3 id="explora-iglesias-titulo">Explora las siete iglesias</h3></div>
        <p>Elige una iglesia para ver su ilustración y abrir la lectura en la página correspondiente.</p>
      </header>

      <div className={s.exploradorRejilla}>
        <article className={s.iglesiaActiva} aria-live="polite">
          <div className={s.arteIglesia}>
            <Image src={`/documentos/cartilla/iglesias/${iglesia.arte}.webp`} alt={`Ilustración de ${iglesia.nombre} en la cartilla`} fill sizes="(max-width: 760px) 42vw, 24vw" />
            <span>Iglesia {activa + 1}</span>
          </div>
          <div className={s.detalleIglesia}>
            <p className={s.paginaIglesia}>Lectura · página {iglesia.pagina}</p>
            <h4>{iglesia.nombre}</h4>
            <p>Lee el mensaje bíblico dirigido a {iglesia.nombre} y recorre sus personajes, enseñanzas y contexto.</p>
            <a href={`${PDF}#page=${iglesia.pagina}`} target="_blank" rel="noopener noreferrer">
              Abrir capítulo <FlechaAccion />
            </a>
          </div>
        </article>

        <div className={s.selectoresVerticales} role="group" aria-label="Seleccionar otra iglesia">
          {restantes.map((opcion) => selector(IGLESIAS.indexOf(opcion)))}
        </div>
        <div className={s.selectoresMoviles} role="group" aria-label="Seleccionar iglesia">
          {IGLESIAS.map((_, indice) => selector(indice, true))}
        </div>
      </div>
    </section>
  );
}
