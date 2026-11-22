import Image from 'next/image';
import { FOTOS, type IdFoto } from '@/lib/landing/fotos';
import s from './Landing.module.css';

/**
 * Foto de fondo que cubre a su contenedor (que debe tener `position: relative`). Sin archivo todavía,
 * muestra un fondo provisional con el tono de la escena.
 */
export default function Foto({
  id, src: fuente, alt: textoAlt, sizes = '100vw', prioridad = false, animarCambio = false, className = '',
}: {
  id: IdFoto;
  src?: string;
  alt?: string;
  /** Ancho que ocupa la foto en pantalla, para que Next sirva el tamaño justo. */
  sizes?: string;
  prioridad?: boolean;
  animarCambio?: boolean;
  className?: string;
}) {
  const foto = FOTOS[id];
  const src = fuente ?? foto.src;
  return (
    <div className={`${s.foto} ${s[`tono_${foto.tono}`]} ${className}`} aria-hidden={!src}>
      {src && <Image key={src} src={src} alt={textoAlt ?? foto.alt} fill sizes={sizes} priority={prioridad}
        className={`${s.fotoImg} ${animarCambio ? s.fotoEntrada : ''}`} />}
    </div>
  );
}
