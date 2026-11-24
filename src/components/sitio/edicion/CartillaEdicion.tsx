import Image from 'next/image';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import ExploraIglesias from './ExploraIglesias';
import s from './edicion.module.css';

const PDF = '/documentos/cartilla-2026-7-iglesias.pdf';

/** Cartilla oficial de 2026; cada acceso abre la página donde empieza el capítulo en el PDF. */
export default function CartillaEdicion() {
  return (
    <section className={s.cartillaEdicion} aria-labelledby="cartilla-edicion-titulo">
      <div className={s.cartillaPortada}>
        <Image
          src="/documentos/cartilla-2026-portada.png"
          alt="Portada de la cartilla Las 7 iglesias en la línea del tiempo"
          fill
          sizes="(max-width: 760px) 100vw, 38vw"
          style={{ objectFit: 'contain' }}
        />
        <span>Cartilla de estudio · 2026</span>
      </div>
      <div className={s.cartillaContenido}>
        <p className={s.cartillaEtiqueta}>Ge’ullah · Material oficial</p>
        <h2 id="cartilla-edicion-titulo">Las 7 iglesias <em>en la línea del tiempo</em></h2>
        <p className={s.cartillaDescripcion}>
          Estudien en equipo las cartas del Apocalipsis, sus períodos y personajes. En cada una de las cuatro pruebas físicas habrá una estación espiritual; tendrán dos minutos para responder y cada integrante resolverá una parte.
        </p>
        <div className={s.cartillaAccionesEdicion}>
          <a href={PDF} target="_blank" rel="noopener noreferrer">Abrir cartilla <FlechaAccion /></a>
          <a href={PDF} download>Descargar PDF · 23 MB <FlechaAccion direccion="abajo" /></a>
        </div>
      </div>
      <ExploraIglesias />
      <details className={s.estacionesEspirituales}>
        <summary>¿Cómo funcionan las estaciones espirituales?</summary>
        <p>Durante cada prueba física, el equipo llega a una estación bíblica. Tiene dos minutos para resolver el ejercicio en conjunto; cada integrante participa respondiendo una parte. La preparación se hace con la cartilla oficial.</p>
      </details>
    </section>
  );
}
