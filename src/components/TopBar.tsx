'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cerrarSesion, useEventos, useSesion, useUltimoEvento } from '@/lib/client';
import { ROL_LABEL } from '@/lib/sesion';
import LogoTolota from '@/components/sitio/LogoTolota';
import { RUTAS, eventoDeRuta } from '@/lib/rutas';
import s from './topbar.module.css';

/** Secciones de un evento; las de administrador no las ve el cronometrador. */
const SECCIONES_EVENTO = [
  { segmento: 'cronometro', nombre: 'Cronometraje', soloAdmin: false },
  { segmento: 'equipos', nombre: 'Equipos', soloAdmin: true },
  { segmento: 'disciplina', nombre: 'Disciplina', soloAdmin: true },
  { segmento: 'espiritual', nombre: 'Espiritual', soloAdmin: true },
  { segmento: 'resultados', nombre: 'Histórico', soloAdmin: false },
  { segmento: '', nombre: 'Configuración', soloAdmin: true },
];

/**
 * Barra superior del sistema, con el mismo estilo que el menú del sitio: logo a la izquierda, secciones centradas
 * (subrayado amarillo en la activa) y, a la derecha, el rol y «Salir».
 */
export default function TopBar() {
  const pathname = usePathname();
  const { rol } = useSesion();
  const evento = eventoDeRuta(pathname);
  // Fuera de un evento, las secciones llevan al último evento abierto (o al más reciente si ese ya no existe)
  const { data: eventos } = useEventos();
  const ultimo = useUltimoEvento(evento?.id);
  const destino = evento?.id ?? (eventos?.some((e) => e.id === ultimo) ? ultimo : eventos?.[0]?.id) ?? null;
  const secciones = SECCIONES_EVENTO.filter((x) => !x.soloAdmin || rol === 'ADMIN');

  return (
    <header className={s.barra}>
      <Link href={RUTAS.inicio} className={s.logo}>
        <LogoTolota tamano={36} />
        Desafío Tolotá
      </Link>

      <nav className={s.enlaces} aria-label="Secciones del sistema">
        <Link href={RUTAS.cronometro} className={s.enlace} aria-current={pathname === RUTAS.cronometro ? 'page' : undefined}>
          Eventos
        </Link>
        {secciones.map((x) =>
          destino ? (
            <Link
              key={x.nombre}
              href={RUTAS.evento(destino, x.segmento)}
              className={s.enlace}
              aria-current={evento && evento.seccion === x.segmento ? 'page' : undefined}
            >
              {x.nombre}
            </Link>
          ) : (
            <span key={x.nombre} className={`${s.enlace} ${s.desactivado}`} aria-disabled="true" title="Crea un evento para acceder a esta sección">
              {x.nombre}
            </span>
          ),
        )}
      </nav>

      <div className={s.acciones}>
        {rol && (
          <>
            <span className={s.rol}>{ROL_LABEL[rol]}</span>
            <button type="button" className={s.salir} onClick={cerrarSesion}>Salir</button>
          </>
        )}
      </div>
    </header>
  );
}
