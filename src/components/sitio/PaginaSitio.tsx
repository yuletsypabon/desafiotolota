import type { ReactNode } from 'react';
import MenuSitio from './MenuSitio';
import PieSitio from './PieSitio';
import s from './pagina.module.css';

/** Marco de las páginas del sitio: menú, cabecera (etiqueta, título, introducción), contenido y pie. */
export default function PaginaSitio({ etiqueta, titulo, intro, children }: { etiqueta: string; titulo: string; intro?: ReactNode; children?: ReactNode }) {
  return (
    <div className={s.pagina}>
      <MenuSitio />
      <header className={s.cabecera}>
        <p className={s.eyebrow}>{etiqueta}</p>
        <h1 className={s.titulo}>{titulo}</h1>
        {intro && <p className={s.intro}>{intro}</p>}
      </header>
      {children && <main className={s.contenido}>{children}</main>}
      <PieSitio />
    </div>
  );
}
