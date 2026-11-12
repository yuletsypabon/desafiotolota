import type { Metadata } from 'next';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import s from '@/components/sitio/pagina.module.css';
import { CONTACTO } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';

export const metadata: Metadata = { title: 'Contacto' };

export default function Contacto() {
  return (
    <PaginaSitio etiqueta="Contacto" titulo="Hablemos" intro="¿Dudas sobre inscripciones, reglas o logística? Escríbenos.">
      <section className={s.bloque} aria-label="Datos de contacto">
        <div className={s.rejilla}>
          <article className={s.tarjeta}>
            <h3>{CONTACTO.organizador}</h3>
            <p>{CONTACTO.cargo}</p>
            {CONTACTO.whatsapp ? (
              <a className={s.enlace} href={`https://wa.me/${CONTACTO.whatsapp}`} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
            ) : (
              <span className={s.pronto}>WhatsApp disponible pronto</span>
            )}
          </article>
          <article className={s.tarjeta}>
            <h3>Correo</h3>
            <p>Para inscripciones, bases y logística del evento.</p>
            {CONTACTO.email ? (
              <a className={s.enlace} href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
            ) : (
              <span className={s.pronto}>Correo disponible pronto</span>
            )}
          </article>
          <article className={s.tarjeta}>
            <h3>{EVENTO.sede}</h3>
            <p>{EVENTO.lugarDetalle}</p>
            <a className={s.enlace} href={EVENTO.mapa} target="_blank" rel="noopener noreferrer">Ver en el mapa</a>
          </article>
        </div>
      </section>
    </PaginaSitio>
  );
}
