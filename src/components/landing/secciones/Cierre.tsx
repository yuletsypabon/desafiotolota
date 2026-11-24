import Link from 'next/link';
import { INSCRIPCION } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import { REDES } from '@/lib/landing/redes';
import Foto from '../Foto';
import s from '../Landing.module.css';

/** 07 · Cierre de la portada; la única cuenta regresiva se mantiene en el hero. */
export default function Cierre() {
  const whatsapp = REDES.secundarias.find((red) => red.nombre === 'WhatsApp')?.url ?? '/contacto';
  const edicionFutura = EVENTO.inicio.getFullYear() > new Date().getFullYear();

  return (
    <section id="inscripciones" className={s.seccion} aria-labelledby="cierre-titulo">
      <div className={s.cierre}>
        <Foto id="cierre" />
        <div className={s.veloOscuro} aria-hidden="true" />
        <div className={`${s.cierreTexto} ${s.reveal}`}>
          <h2 id="cierre-titulo" className={s.titulo}>El siguiente<br />paso lo das tú.</h2>
          <p className={s.parrafo}>No esperes a no tener miedo.<br />Atrévete a avanzar con fe.</p>
          <p className={`${s.etiqueta} ${s.cierreEdicion}`}>Desafío {EVENTO.edicion} · {EVENTO.fechas}</p>
        </div>
        <div className={`${s.vidrio} ${s.cierreAccion} ${s.reveal} ${s.d1}`}>
          {edicionFutura ? (
            <>
              <h3 className={s.tituloPanel}>¿Te sumas al reto?</h3>
              <p className={s.parrafo}>
                El capitán inscribe al equipo con los datos de todos los integrantes.
                {INSCRIPCION.cierre && <> Inscripciones hasta el {INSCRIPCION.cierre}.</>}
              </p>
              <Link className={`${s.boton} ${s.botonAncho}`} href={INSCRIPCION.url || '/recursos#inscripcion'}>Inscribe a tu equipo</Link>
              <Link className={`${s.botonContorno} ${s.botonAncho}`} href="/contacto">Avísame cuando abran</Link>
            </>
          ) : (
            <>
              <h3 className={s.tituloPanel}>Prepara a tu equipo</h3>
              <p className={s.parrafo}>
                Revisa la información oficial del evento y confirma con la organización los documentos que debes llevar.
              </p>
              <Link className={`${s.boton} ${s.botonAncho}`} href={INSCRIPCION.url || '/recursos#inscripcion'}>
                Inscribe a tu equipo
              </Link>
              <a className={`${s.botonContorno} ${s.botonAncho}`} href={whatsapp} target="_blank" rel="noopener noreferrer">Contactar por WhatsApp</a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
