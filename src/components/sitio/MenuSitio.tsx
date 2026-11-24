'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';
import { EVENTO } from '@/lib/evento';
import { rutaEdicion } from '@/lib/rutas';
import FlechaAccion from './FlechaAccion';
import LogoTolota from './LogoTolota';
import s from './menu.module.css';

type MenuDesplegable = 'edicion' | 'sobre' | null;

const RUTAS_SOBRE = [
  { texto: 'Quiénes somos', href: '/#que-es' },
  { texto: 'Equipo organizador', href: '/historia#plantel-titulo' },
  { texto: 'Nuestra historia', href: '/historia' },
  { texto: 'Testimonios', href: '/historia#testimonios' },
  { texto: 'Ediciones', href: '/ediciones' },
] as const;

/** Menú público: accesos del evento vigente y páginas institucionales agrupados por contexto. */
export default function MenuSitio({ enPortada = false }: { enPortada?: boolean }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [desplegable, setDesplegable] = useState<MenuDesplegable>(null);
  const baseEdicion = rutaEdicion(EVENTO.inicio.getFullYear());
  const rutasEdicion = [
    { texto: 'Preparación', href: `${baseEdicion}#preparacion` },
    { texto: 'Equipos', href: `${baseEdicion}#equipos` },
    { texto: 'Pruebas', href: `${baseEdicion}#pruebas` },
    { texto: 'Cartilla', href: `${baseEdicion}#cartilla` },
    { texto: 'Resultados', href: `${baseEdicion}#resultados` },
  ];

  useEffect(() => {
    setAbierto(false);
    setDesplegable(null);
  }, [ruta]);

  const alternar = (menu: Exclude<MenuDesplegable, null>) => {
    setDesplegable((actual) => actual === menu ? null : menu);
  };

  const listaDesplegable = (items: readonly { texto: string; href: string }[], id: string) => (
    <div className={s.submenu} id={id} hidden={desplegable !== (id === 'submenu-edicion' ? 'edicion' : 'sobre')}>
      {items.map((item) => <Link href={item.href} key={item.href}>{item.texto}</Link>)}
    </div>
  );

  return (
    <header className={`${s.menu} ${enPortada ? '' : s.solido}`}>
      <Link href={enPortada ? '#top' : '/'} className={s.logo} aria-label="Desafío Tolotá, inicio">
        <LogoTolota tamano={40} prioridad />
        <span>Desafío Tolotá</span>
      </Link>

      <nav className={s.enlaces} aria-label="Navegación principal">
        <Link href="/" className={s.enlace} aria-current={ruta === '/' ? 'page' : undefined}>Inicio</Link>
        <div className={s.grupoMenu}>
          <button type="button" className={`${s.botonDesplegable} ${ruta.startsWith(baseEdicion) ? s.activo : ''}`} aria-expanded={desplegable === 'edicion'} aria-controls="submenu-edicion" onClick={() => alternar('edicion')}>
            Desafío {EVENTO.inicio.getFullYear()} <KeyboardArrowDownRoundedIcon aria-hidden="true" />
          </button>
          {listaDesplegable(rutasEdicion, 'submenu-edicion')}
        </div>
        <Link href="/espiritual" className={s.enlace} aria-current={ruta === '/espiritual' ? 'page' : undefined}>Espiritual</Link>
        <Link href="/recursos" className={s.enlace} aria-current={ruta === '/recursos' ? 'page' : undefined}>Recursos</Link>
        <div className={s.grupoMenu}>
          <button type="button" className={`${s.botonDesplegable} ${ruta === '/historia' || ruta === '/ediciones' ? s.activo : ''}`} aria-expanded={desplegable === 'sobre'} aria-controls="submenu-sobre" onClick={() => alternar('sobre')}>
            Sobre nosotros <KeyboardArrowDownRoundedIcon aria-hidden="true" />
          </button>
          {listaDesplegable(RUTAS_SOBRE, 'submenu-sobre')}
        </div>
        <Link href="/galeria" className={s.enlace} aria-current={ruta === '/galeria' ? 'page' : undefined}>Galería</Link>
      </nav>

      <Link href={`${baseEdicion}#cronograma`} className={s.cta}>Ver cronograma <FlechaAccion /></Link>
      <button className={s.boton} aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={abierto} aria-controls="menu-movil" onClick={() => setAbierto((valor) => !valor)}>
        {abierto ? <CloseIcon /> : <MenuIcon />}
      </button>

      <nav className={s.panel} id="menu-movil" hidden={!abierto} aria-label="Navegación móvil">
        <Link href="/" aria-current={ruta === '/' ? 'page' : undefined}>Inicio</Link>
        <div className={s.grupoMovil}>
          <button type="button" className={s.botonMovil} aria-expanded={desplegable === 'edicion'} aria-controls="submenu-movil-edicion" onClick={() => alternar('edicion')}>
            Desafío {EVENTO.inicio.getFullYear()} <KeyboardArrowDownRoundedIcon aria-hidden="true" />
          </button>
          <div className={s.submenuMovil} id="submenu-movil-edicion" hidden={desplegable !== 'edicion'}>
            {rutasEdicion.map((item) => <Link href={item.href} key={item.href}>{item.texto}</Link>)}
          </div>
        </div>
        <Link href="/espiritual">Espiritual</Link>
        <Link href="/recursos">Recursos</Link>
        <div className={s.grupoMovil}>
          <button type="button" className={s.botonMovil} aria-expanded={desplegable === 'sobre'} aria-controls="submenu-movil-sobre" onClick={() => alternar('sobre')}>
            Sobre nosotros <KeyboardArrowDownRoundedIcon aria-hidden="true" />
          </button>
          <div className={s.submenuMovil} id="submenu-movil-sobre" hidden={desplegable !== 'sobre'}>
            {RUTAS_SOBRE.map((item) => <Link href={item.href} key={item.href}>{item.texto}</Link>)}
          </div>
        </div>
        <Link href="/galeria">Galería</Link>
        <Link href={`${baseEdicion}#cronograma`} onClick={() => setAbierto(false)}>Ver cronograma</Link>
      </nav>
    </header>
  );
}
