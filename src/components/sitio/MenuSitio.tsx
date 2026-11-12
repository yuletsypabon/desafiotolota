'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import { RUTAS, SECCIONES } from '@/lib/rutas';
import LogoTolota from './LogoTolota';
import s from './menu.module.css';

/**
 * Menú del sitio público. En la portada flota transparente sobre la foto del hero; en las demás páginas queda
 * fijo arriba con fondo. El acceso al sistema de cronometraje está en el pie (es para los organizadores).
 */
export default function MenuSitio({ enPortada = false }: { enPortada?: boolean }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <header className={`${s.menu} ${enPortada ? '' : s.solido}`}>
      <Link href={enPortada ? '#top' : RUTAS.inicio} className={s.logo}>
        <LogoTolota tamano={40} prioridad />
        Desafío Tolotá
      </Link>
      <nav className={s.enlaces} aria-label="Secciones">
        {SECCIONES.map((x) => (
          <Link key={x.ruta} href={x.ruta} className={s.enlace} aria-current={ruta === x.ruta ? 'page' : undefined}>
            {x.nombre}
          </Link>
        ))}
      </nav>
      <Link href={`${RUTAS.inicio}#inscripciones`} className={s.cta}>Inscríbete</Link>
      <button className={s.boton} aria-label="Menú" aria-expanded={abierto} onClick={() => setAbierto((v) => !v)}>
        {abierto ? <CloseIcon /> : <MenuIcon />}
      </button>
      <nav className={s.panel} hidden={!abierto} aria-label="Secciones (menú móvil)">
        {SECCIONES.map((x) => (
          <Link key={x.ruta} href={x.ruta} onClick={() => setAbierto(false)}>{x.nombre}</Link>
        ))}
      </nav>
    </header>
  );
}
