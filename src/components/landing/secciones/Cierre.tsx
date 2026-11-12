'use client';
import Link from 'next/link';
import { INSCRIPCION } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import Foto from '../Foto';
import { useCuentaRegresiva } from '../hooks/useCuentaRegresiva';
import s from '../Landing.module.css';

/** 07 · Tu historia empieza aquí: inscripción y cuenta regresiva hasta el inicio del evento. */
export default function Cierre() {
  const c = useCuentaRegresiva();
  const casillas = [[c.dias, 'Días'], [c.horas, 'Horas'], [c.minutos, 'Min'], [c.segundos, 'Seg']] as const;
  const formulario = INSCRIPCION.url || '/recursos#inscripcion';

  return (
    <section id="inscripciones" className={s.seccion} aria-labelledby="cierre-titulo">
      <div className={s.cierre}>
        <Foto id="cierre" />
        <div className={s.veloOscuro} aria-hidden="true" />
        <div className={`${s.cierreTexto} ${s.reveal}`}>
          <p className={s.etiqueta}>07 / Tu historia empieza aquí</p>
          <h2 id="cierre-titulo" className={s.titulo}>El siguiente<br />paso lo das tú.</h2>
          <p className={s.parrafo}>No esperes a no tener miedo.<br />Atrévete a avanzar con fe.</p>
          <p className={`${s.etiqueta} ${s.cierreEdicion}`}>Desafío {EVENTO.edicion} · {EVENTO.fechas}</p>
        </div>
        <div className={`${s.vidrio} ${s.cierreAccion} ${s.reveal} ${s.d1}`}>
          <h3 className={s.tituloPanel}>¿Te sumas al reto?</h3>
          {c.terminada ? (
            <p className={s.parrafo}>¡El Desafío {EVENTO.edicion} está en marcha!</p>
          ) : (
            <div className={s.reloj} role="timer" aria-label={`Faltan ${c.dias} días para el Desafío ${EVENTO.edicion}`}>
              {casillas.map(([n, et]) => (
                <div key={et}>
                  {/* el reloj cambia entre el servidor y el navegador: es esperado */}
                  <b suppressHydrationWarning>{String(n).padStart(2, '0')}</b>
                  <span>{et}</span>
                </div>
              ))}
            </div>
          )}
          <p className={s.parrafo}>
            El capitán inscribe al equipo con los datos de todos los integrantes.
            {INSCRIPCION.cierre && <> Inscripciones hasta el {INSCRIPCION.cierre}.</>}
          </p>
          <Link className={`${s.boton} ${s.botonAncho}`} href={formulario}>Inscribe a tu equipo</Link>
          <Link className={`${s.botonContorno} ${s.botonAncho}`} href="/contacto">Avísame cuando abran</Link>
        </div>
      </div>
    </section>
  );
}
