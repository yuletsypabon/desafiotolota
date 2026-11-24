import type { Metadata } from 'next';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import PaginaSitio from '@/components/sitio/PaginaSitio';
import { CONTACTO } from '@/lib/contenido';
import { EVENTO } from '@/lib/evento';
import { rutaEdicion } from '@/lib/rutas';
import s from './contacto.module.css';

export const metadata: Metadata = { title: 'Contacto', description: 'Canales oficiales para hablar con la organización de Desafío Tolotá.' };

const WHATSAPP_OFICIAL = 'https://w.app/ykhizo';

export default function Contacto() {
  return (
    <PaginaSitio
      etiqueta="Estamos aquí para ti"
      titulo="Hablemos"
      intro="¿Tienes una pregunta sobre Desafío Tolotá o quieres ponerte en contacto con la organización? Escríbenos."
    >
      <section className={s.contactoGrid} aria-label="Canales oficiales de contacto">
        <aside className={s.canales}>
          <p className={s.eyebrow}>Canales oficiales</p>
          <h2>Contáctanos.</h2>
          <div className={s.datoContacto}>
            <span>WhatsApp</span><a href={WHATSAPP_OFICIAL} target="_blank" rel="noopener noreferrer">Abrir chat <FlechaAccion /></a>
          </div>
          <div className={s.datoContacto}>
            <span>Correo electrónico</span><a href={`mailto:${CONTACTO.email}`}>{CONTACTO.email}</a>
          </div>
          <div className={s.referenciaContacto}>
            <span>Persona de referencia</span><b>{CONTACTO.organizador}</b><small>{CONTACTO.cargo}</small>
          </div>
        </aside>

        <article className={s.mensajeDirecto}>
          <div>
            <p className={s.eyebrow}>Envíanos un mensaje</p>
            <h2>Cuéntanos cómo podemos ayudarte.</h2>
            <p>Para que tu consulta llegue directamente a la organización, escríbenos por uno de nuestros canales oficiales. No guardamos tus datos en un formulario de la página.</p>
          </div>
          <div className={s.accionesContacto}>
            <a className={s.botonPrincipal} href={WHATSAPP_OFICIAL} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp <FlechaAccion /></a>
            <a className={s.botonSecundario} href={`mailto:${CONTACTO.email}`}>Enviar correo <FlechaAccion /></a>
          </div>
        </article>

        <a className={s.accesoContacto} href="/espiritual#oracion">
          <span>COMUNIDAD DE FE</span><b>Compartir una petición de oración</b><FlechaAccion />
        </a>
        <article className={`${s.accesoContacto} ${s.accesoEvento}`}>
          <span>DESAFÍO {EVENTO.inicio.getFullYear()}</span><b>Finca El Faisán Dorado · Gámbita, Santander</b>
          <a href={`${rutaEdicion(EVENTO.inicio.getFullYear())}#llegada`}>Cómo llegar al evento <FlechaAccion /></a>
        </article>
      </section>
    </PaginaSitio>
  );
}
