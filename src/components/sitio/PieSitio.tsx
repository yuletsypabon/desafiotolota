import Link from 'next/link';
import { ANIO_INICIO } from '@/lib/evento';
import { REDES } from '@/lib/landing/redes';
import { RUTAS, SECCIONES } from '@/lib/rutas';
import LogoTolota from './LogoTolota';
import s from './pie.module.css';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const ICONOS: Record<string, typeof InstagramIcon> = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  YouTube: YouTubeIcon,
  WhatsApp: WhatsAppIcon,
};

const PARTICIPAR = [
  { nombre: 'Inscribirse', ruta: `${RUTAS.inicio}#inscripciones` },
  { nombre: 'Reglamento', ruta: '/recursos' },
  { nombre: 'Mis fotos', ruta: '/galeria' },
  // Sistema de cronometraje (sin sesión, abre el inicio de sesión)
  { nombre: 'Cronómetro (organizadores)', ruta: RUTAS.cronometro },
];

/** Pie de página del sitio público: marca, redes, secciones y enlaces para participar. */
export default function PieSitio() {
  const redes = [...REDES.principales, ...REDES.secundarias];
  return (
    <footer className={s.pie}>
      <div className={s.columnas}>
        <div>
          <div className={s.marca}>
            <LogoTolota tamano={44} />
            <b>Desafío Tolotá</b>
          </div>
          <p className={s.lema}>Deporte. Fe. Comunidad.</p>
          <p className={s.descripcion}>
            Evento anual de obstáculos y campamento juvenil adventista. Corregimiento de Tolotá, Colombia.
          </p>
          <div className={s.redes}>
            {redes.map((r) => {
              const Icono = ICONOS[r.nombre];
              const icono = (
                <Icono sx={{ fontSize: 18 }} aria-hidden="true" />
              );
              return r.url ? (
                <a key={r.nombre} className={s.red} href={r.url} target="_blank" rel="noopener noreferrer" aria-label={r.nombre}>{icono}</a>
              ) : (
                <span key={r.nombre} className={s.red} title={`${r.nombre} (enlace pendiente)`}>{icono}</span>
              );
            })}
          </div>
        </div>
        <nav aria-label="Secciones">
          <p className={s.titulo}>Secciones</p>
          <ul className={s.lista}>
            <li><Link href={RUTAS.inicio}>Inicio</Link></li>
            {SECCIONES.map((x) => (
              <li key={x.ruta}><Link href={x.ruta}>{x.nombre}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Participar">
          <p className={s.titulo}>Participar</p>
          <ul className={s.lista}>
            {PARTICIPAR.map((x) => (
              <li key={x.nombre}><Link href={x.ruta}>{x.nombre}</Link></li>
            ))}
          </ul>
        </nav>
      </div>
      <div className={s.base}>
        <span>Hechos para ir más allá.</span>
        <span>© {ANIO_INICIO}–{new Date().getFullYear()} Desafío Tolotá · Ministerio de apoyo adventista</span>
      </div>
    </footer>
  );
}
