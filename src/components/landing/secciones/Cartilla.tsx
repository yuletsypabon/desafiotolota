import { EVENTO } from '@/lib/evento';
import Image from 'next/image';
import s from '../Landing.module.css';

/** Presenta el tema de estudio anual y dirige al archivo oficial cuando esté publicado. */
export default function Cartilla() {
  return (
    <section id="cartilla" className={`${s.seccion} ${s.cartilla}`} aria-labelledby="cartilla-titulo">
      <div className={`${s.cartillaMarco} ${s.vidrio}`}>
        <div className={s.cartillaImagen}>
          <Image src="/documentos/cartilla-2026-portada.png" alt="Portada de la cartilla Las 7 iglesias en la línea del tiempo" fill sizes="(max-width: 900px) 100vw, 42vw" style={{ objectFit: 'contain' }} />
          <span className={s.cartillaAnio}>{EVENTO.inicio.getFullYear()} · {EVENTO.tema.nombre.toLocaleUpperCase('es-CO')}</span>
        </div>
        <div className={s.cartillaTexto}>
          <p className={s.etiqueta}>Cartilla de estudio</p>
          <h2 id="cartilla-titulo" className={s.titulo}>Las 7 iglesias<br /><em>en la línea del tiempo.</em></h2>
          <p className={s.parrafo}>
            Recorre las cartas del Apocalipsis, sus períodos y personajes. Durante cada una de las cuatro pruebas físicas
            habrá una estación espiritual: el equipo tendrá dos minutos para responder y cada integrante resolverá una parte.
          </p>
          <div className={s.cartillaAcciones}>
            <a className={s.boton} href="/documentos/cartilla-2026-7-iglesias.pdf" target="_blank" rel="noopener noreferrer">Abrir cartilla</a>
            <a className={s.enlaceFlecha} href="/documentos/cartilla-2026-7-iglesias.pdf" download>Descargar PDF · 23 MB</a>
          </div>
        </div>
      </div>
    </section>
  );
}
