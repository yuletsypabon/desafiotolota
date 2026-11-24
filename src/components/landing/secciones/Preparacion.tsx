import Link from 'next/link';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import PlaceOutlinedIcon from '@mui/icons-material/PlaceOutlined';
import BackpackOutlinedIcon from '@mui/icons-material/BackpackOutlined';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import { EVENTO } from '@/lib/evento';
import s from '../Landing.module.css';

const ACCESOS = [
  {
    numero: '01', icono: BackpackOutlinedIcon, titulo: 'Qué llevar',
    texto: 'Lista de campamento, documentos de llegada y manual del participante.',
    href: '/recursos#bases', externo: false, archivo: false,
  },
  {
    numero: '02', icono: PlaceOutlinedIcon, titulo: 'Cómo llegar',
    texto: `${EVENTO.sede}, ${EVENTO.lugarDetalle}. Recepción desde las 12:00 m.`,
    href: EVENTO.mapa, externo: true, archivo: false,
  },
  {
    numero: '03', icono: MenuBookOutlinedIcon, titulo: 'Qué estudiar',
    texto: 'Cartilla Las 7 iglesias en la línea del tiempo y preparación para las estaciones espirituales.',
    href: '/documentos/cartilla-2026-7-iglesias.pdf', externo: false, archivo: true,
  },
] as const;

/** Accesos prácticos para equipos inscritos; sustituye al manifiesto animado. */
export default function Preparacion({ enEdicion = false }: { enEdicion?: boolean } = {}) {
  return (
    <section id={enEdicion ? 'preparacion' : undefined} className={`${s.preparacion} ${enEdicion ? s.preparacionEdicion : ''}`} aria-labelledby="preparacion-titulo">
      <header className={s.preparacionCabecera}>
        <p className={s.etiqueta}>Antes de salir</p>
        <h2 id="preparacion-titulo">Prepárate para el Desafío</h2>
      </header>
      <div className={s.accesosPreparacion}>
        {ACCESOS.map(({ numero, icono: Icono, titulo, texto, href, externo, archivo }) => {
          const contenido = (
            <>
              <span className={s.numeroPreparacion}>{numero}</span>
              <Icono className={s.iconoPreparacion} aria-hidden="true" />
              <h3>{titulo}</h3>
              <p>{texto}</p>
              <span className={s.accionPreparacion}>{externo ? 'Abrir en Maps' : titulo === 'Qué estudiar' ? 'Abrir cartilla' : 'Ver recursos'} <FlechaAccion /></span>
            </>
          );

          return externo ? (
            <a className={s.accesoPreparacion} href={href} target="_blank" rel="noopener noreferrer" key={numero}>
              {contenido}
            </a>
          ) : archivo ? (
            <a className={s.accesoPreparacion} href={href} download key={numero}>
              {contenido}
            </a>
          ) : (
            <Link className={s.accesoPreparacion} href={href} key={numero}>
              {contenido}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
