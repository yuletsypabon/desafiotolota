import Link from 'next/link';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import { ANIO_INICIO, EVENTO } from '@/lib/evento';
import { REDES } from '@/lib/landing/redes';
import { RUTAS, rutaEdicion } from '@/lib/rutas';
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

const REDES_TODAS = [...REDES.principales, ...REDES.secundarias];
const WHATSAPP = REDES_TODAS.find((red) => red.nombre === 'WhatsApp')?.url ?? '';

const COLUMNAS = [
  {
    titulo: 'Conoce el desafío',
    enlaces: [
      { nombre: 'Historia', ruta: '/historia' },
      { nombre: 'Ediciones', ruta: '/ediciones' },
      { nombre: 'Espiritual', ruta: '/espiritual' },
      { nombre: 'Galería', ruta: '/galeria' },
    ],
  },
  {
    titulo: `Evento ${EVENTO.inicio.getFullYear()}`,
    enlaces: [
      { nombre: 'Página del evento', ruta: rutaEdicion(EVENTO.inicio.getFullYear()) },
      { nombre: 'El propósito', ruta: `${RUTAS.inicio}#experiencia` },
      { nombre: 'Pruebas', ruta: `${RUTAS.inicio}#retos` },
      { nombre: 'Recorrido', ruta: `${RUTAS.inicio}#programa` },
    ],
  },
  {
    titulo: 'Participa',
    enlaces: [
      { nombre: 'Inscríbete', ruta: `${RUTAS.inicio}#inscripciones` },
      { nombre: 'Bases y reglamento', ruta: '/recursos#bases' },
      { nombre: 'Cronograma', ruta: `${rutaEdicion(EVENTO.inicio.getFullYear())}#cronograma` },
      { nombre: 'Cronómetro · organización', ruta: RUTAS.cronometro },
    ],
  },
  {
    titulo: '¿Necesitas ayuda?',
    enlaces: [
      { nombre: 'Contacto', ruta: '/contacto' },
      { nombre: 'WhatsApp', ruta: WHATSAPP, externo: true },
      { nombre: 'Ubicación', ruta: EVENTO.mapa, externo: true },
    ],
  },
] as const;

/** Footer del sitio público: marca, navegación agrupada, redes y sede. */
export default function PieSitio() {
  return (
    <footer className={s.pie}>
      <div className={s.columnas}>
        <div className={s.presentacion}>
          <Link className={s.marca} href={RUTAS.inicio} aria-label="Desafío Tolotá, inicio">
            <LogoTolota tamano={46} />
            <b>Desafío Tolotá</b>
          </Link>
          <p className={s.lema}>AVENTURA. ESPIRITUALIDAD. CONOCIMIENTO.</p>
          <p className={s.descripcion}>
            Un reto de aventura, espiritualidad y conocimiento para crecer en equipo.
          </p>
          <Link className={s.boton} href={`${RUTAS.inicio}#inscripciones`}>Inscribe a tu equipo</Link>
        </div>

        {COLUMNAS.map((columna) => (
          <nav key={columna.titulo} className={s.grupo} aria-label={columna.titulo}>
            <p className={s.titulo}>{columna.titulo}</p>
            <ul className={s.lista}>
              {columna.enlaces.map((enlace) => (
                <li key={enlace.nombre}>
                  {'externo' in enlace && enlace.externo ? (
                    <a href={enlace.ruta} target="_blank" rel="noopener noreferrer">{enlace.nombre}</a>
                  ) : (
                    <Link href={enlace.ruta}>{enlace.nombre}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className={s.base}>
        <div className={s.legal}>
          <span>© {ANIO_INICIO}–{new Date().getFullYear()} Desafío Tolotá</span>
          <span>Ministerio de apoyo adventista</span>
        </div>

        <div className={s.redes} aria-label="Redes sociales">
          {REDES_TODAS.map((red) => {
            const Icono = ICONOS[red.nombre];
            return red.url ? (
              <a key={red.nombre} className={s.red} href={red.url} target="_blank" rel="noopener noreferrer" aria-label={red.nombre}>
                <Icono sx={{ fontSize: 18 }} aria-hidden="true" />
              </a>
            ) : null;
          })}
        </div>

        <a className={s.ubicacion} href={EVENTO.mapa} target="_blank" rel="noopener noreferrer">
          <PlaceOutlinedIcon aria-hidden="true" />
          <span>{EVENTO.sede}<small>{EVENTO.lugar}</small></span>
        </a>
      </div>
    </footer>
  );
}
