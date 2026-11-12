import Image from 'next/image';
import { FOTOS, type IdFoto } from '@/lib/landing/fotos';
import s from './Landing.module.css';

/**
 * Foto de fondo que cubre a su contenedor (que debe tener `position: relative`). Sin archivo todavía,
 * muestra un fondo provisional con el tono de la escena.
 */
export default function Foto({
  id, sizes = '100vw', prioridad = false, className = '',
}: {
  id: IdFoto;
  /** Ancho que ocupa la foto en pantalla, para que Next sirva el tamaño justo. */
  sizes?: string;
  prioridad?: boolean;
  className?: string;
}) {
  const foto = FOTOS[id];
  return (
    <div className={`${s.foto} ${s[`tono_${foto.tono}`]} ${className}`} aria-hidden={!foto.src}>
      {foto.src && <Image src={foto.src} alt={foto.alt} fill sizes={sizes} priority={prioridad} className={s.fotoImg} />}
    </div>
  );
}
