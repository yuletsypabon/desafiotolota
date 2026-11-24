'use client';

import { useState, type FormEvent } from 'react';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import useSWR from 'swr';
import { api, fetcher } from '@/lib/client';
import { ANIO_INICIO } from '@/lib/evento';
import s from './testimonios.module.css';

type TestimonioPublico = { id: string; nombre: string; anio: number; comentario: string };

const ANIO_ACTUAL = new Date().getFullYear();
const ANIOS = Array.from({ length: Math.max(1, ANIO_ACTUAL - ANIO_INICIO + 1) }, (_, i) => ANIO_ACTUAL - i);
const POR_PAGINA = 3;

export default function Testimonios() {
  const { data, error, isLoading } = useSWR<TestimonioPublico[]>('/api/publico/testimonios', fetcher);
  const [pagina, setPagina] = useState(0);
  const [nombre, setNombre] = useState('');
  const [anio, setAnio] = useState(ANIO_ACTUAL);
  const [comentario, setComentario] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [sitioWeb, setSitioWeb] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [errorFormulario, setErrorFormulario] = useState('');

  const testimonios = data ?? [];
  const totalPaginas = Math.ceil(testimonios.length / POR_PAGINA);
  const visibles = testimonios.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!consentimiento) return;
    setEnviando(true);
    setMensaje('');
    setErrorFormulario('');
    try {
      await api('/api/publico/testimonios', 'POST', {
        nombre: nombre.trim(), anio, comentario: comentario.trim(), consentimiento, sitioWeb,
      });
      setNombre('');
      setComentario('');
      setConsentimiento(false);
      setSitioWeb('');
      setMensaje('Gracias por compartir tu experiencia. La revisaremos antes de publicarla.');
    } catch (err) {
      setErrorFormulario(err instanceof Error ? err.message : 'No se pudo enviar el comentario. Inténtalo de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section id="testimonios" className={s.seccion} aria-labelledby="testimonios-titulo">
      <header className={s.cabecera}>
        <p className={s.etiqueta}>Voces del Desafío</p>
        <h2 id="testimonios-titulo">Lo que nos llevamos</h2>
        <p>Recuerdos contados por quienes vivieron cada edición.</p>
      </header>

      {isLoading && <p className={s.estado} role="status">Cargando experiencias…</p>}
      {error && <p className={s.estado} role="status">No se pudieron cargar las experiencias. Puedes intentarlo más tarde.</p>}
      {!isLoading && !error && testimonios.length === 0 && (
        <div className={s.vacio}>
          <span aria-hidden="true">“</span>
          <p>Aún no hay experiencias publicadas. Puedes ser la primera persona en compartir la tuya.</p>
        </div>
      )}

      {visibles.length > 0 && (
        <>
          <div className={s.tarjetas} aria-live="polite">
            {visibles.map((testimonio, indice) => (
              <article className={s.tarjeta} key={testimonio.id}>
                <span className={s.comilla} aria-hidden="true">“</span>
                <p className={s.cita}>{testimonio.comentario}</p>
                <footer className={s.autor}>
                  <span className={s.indice}>0{pagina * POR_PAGINA + indice + 1}</span>
                  <span>
                    <strong>{testimonio.nombre}</strong>
                    <small>Desafío {testimonio.anio}</small>
                  </span>
                </footer>
              </article>
            ))}
          </div>
          {totalPaginas > 1 && (
            <nav className={s.controles} aria-label="Páginas de testimonios">
              <button type="button" onClick={() => setPagina((actual) => (actual - 1 + totalPaginas) % totalPaginas)} aria-label="Ver experiencias anteriores"><ArrowBackRoundedIcon aria-hidden="true" /></button>
              <span>{pagina + 1} / {totalPaginas}</span>
              <button type="button" onClick={() => setPagina((actual) => (actual + 1) % totalPaginas)} aria-label="Ver más experiencias"><ArrowForwardRoundedIcon aria-hidden="true" /></button>
            </nav>
          )}
        </>
      )}

      <div className={s.formularioBloque}>
        <div className={s.formularioIntro}>
          <p className={s.etiqueta}>Tu historia también cuenta</p>
          <h3>¿Qué experiencia viviste?</h3>
          <p>Comparte un recuerdo, un aprendizaje o algo que te haya marcado. Tu comentario aparecerá después de ser revisado.</p>
        </div>
        <form className={s.formulario} onSubmit={enviar}>
          <label>
            Nombre o equipo
            <input required minLength={2} maxLength={60} value={nombre} onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
          </label>
          <label>
            Edición
            <select value={anio} onChange={(e) => setAnio(Number(e.target.value))}>
              {ANIOS.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
            </select>
          </label>
          <label className={s.comentarioLabel}>
            Tu experiencia <span>{comentario.length}/600</span>
            <textarea required minLength={20} maxLength={600} rows={5} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Cuéntanos qué significó para ti…" />
          </label>
          <label className={s.trampa} aria-hidden="true" tabIndex={-1}>
            Sitio web
            <input tabIndex={-1} autoComplete="off" value={sitioWeb} onChange={(e) => setSitioWeb(e.target.value)} />
          </label>
          <label className={s.consentimiento}>
            <input type="checkbox" checked={consentimiento} onChange={(e) => setConsentimiento(e.target.checked)} required />
            <span>Autorizo que mi comentario y nombre o equipo aparezcan en esta página si son aprobados.</span>
          </label>
          {mensaje && <p className={s.confirmacion} role="status">{mensaje}</p>}
          {errorFormulario && <p className={s.error} role="alert">{errorFormulario}</p>}
          <button className={s.enviar} type="submit" disabled={enviando || !consentimiento}>
            {enviando ? 'Enviando…' : 'Compartir experiencia'}
          </button>
          <p className={s.privacidad}>No solicitamos correo ni teléfono. Los comentarios pasan por revisión antes de publicarse.</p>
        </form>
      </div>
    </section>
  );
}
