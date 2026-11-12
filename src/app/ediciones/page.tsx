import type { Metadata } from 'next';
import Link from 'next/link';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import { prisma } from '@/lib/prisma';
import { EDICIONES, codigoEdicion } from '@/lib/evento';
import { rutaEdicion } from '@/lib/rutas';
import e from '@/components/sitio/edicion/edicion.module.css';

export const metadata: Metadata = { title: 'Ediciones' };
// Se regenera cada 5 minutos: un evento nuevo en el sistema aparece solo
export const revalidate = 300;

interface Registro {
  anio: number;
  codigo: string;
  nombre: string | null;
  logo: string | null;
  equipos: number | null;
  pruebas: number | null;
  /** Hay datos en el sistema: la tarjeta lleva a la página de esa edición */
  conPagina: boolean;
}

/**
 * Registro de todas las ediciones: las del sistema (con logo, equipos y pruebas, y enlace a su página) y las
 * anteriores al sistema que solo están en la línea de tiempo de lib/evento. De la más reciente a la más antigua.
 */
async function registro(): Promise<Registro[]> {
  const eventos = await prisma.evento
    .findMany({
      orderBy: [{ anio: 'desc' }, { createdAt: 'desc' }],
      select: { anio: true, nombre: true, logo: true, _count: { select: { equipos: true, pruebas: true } } },
    })
    .catch((err) => {
      console.error('Ediciones: no se pudieron leer los eventos', err);
      return [];
    });
  const anios = eventos.map((ev) => ev.anio);
  const porAnio = new Map<number, Registro>();
  for (const ev of eventos) {
    if (porAnio.has(ev.anio)) continue; // si hay varios eventos en un año, el más reciente
    porAnio.set(ev.anio, {
      anio: ev.anio, codigo: codigoEdicion(ev.anio, anios), nombre: ev.nombre, logo: ev.logo,
      equipos: ev._count.equipos, pruebas: ev._count.pruebas, conPagina: true,
    });
  }
  for (const ed of EDICIONES) {
    if (!porAnio.has(ed.anio)) porAnio.set(ed.anio, { anio: ed.anio, codigo: ed.codigo, nombre: ed.nombre, logo: null, equipos: null, pruebas: null, conPagina: false });
  }
  return [...porAnio.values()].sort((a, b) => b.anio - a.anio);
}

export default async function Ediciones() {
  const ediciones = await registro();
  return (
    <PaginaSitio
      etiqueta="Desde 2016"
      titulo="Ediciones"
      intro="El registro de todos los Desafíos que hemos realizado. Entra a cada edición para ver sus equipos, sus pruebas y sus resultados."
    >
      <ul className={e.ediciones} style={{ paddingBottom: 80 }}>
        {ediciones.map((ed) => {
          const contenido = (
            <>
              <div className={e.edicionLogo}>
                {/* eslint-disable-next-line @next/next/no-img-element -- el logo es un data URL guardado en la base */}
                {ed.logo ? <img src={ed.logo} alt="" /> : <span>{ed.codigo}</span>}
              </div>
              <div className={e.edicionTexto}>
                <small>{ed.anio} · Desafío {ed.codigo}</small>
                <h3>{ed.nombre ?? 'Por revelar'}</h3>
                <p>
                  {ed.conPagina
                    ? `${ed.equipos} equipos · ${ed.pruebas} pruebas`
                    : 'Edición anterior al sistema de cronometraje'}
                </p>
              </div>
            </>
          );
          return (
            <li key={ed.anio}>
              {ed.conPagina
                ? <Link href={rutaEdicion(ed.anio)} className={e.edicion}>{contenido}</Link>
                : <div className={e.edicion}>{contenido}</div>}
            </li>
          );
        })}
      </ul>
    </PaginaSitio>
  );
}
