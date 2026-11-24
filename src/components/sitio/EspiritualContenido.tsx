'use client';

import Image from 'next/image';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import { useEffect, useState, type FormEvent } from 'react';
import s from './espiritual.module.css';

type Peticion = { id: string; nombre: string | null; peticion: string; oraciones: number; createdAt: string };

export function PresentacionEspiritual() {
  return (
    <section id="presentacion" className={s.presentacion} aria-label="Bienvenida al espacio espiritual">
      <div className={s.fotoPresentacion}>
        <Image src="/fotos/reto-cartilla.webp" alt="Una participante lee la cartilla durante el campamento" fill priority sizes="(max-width: 760px) 100vw, 52vw" />
        <div>
          <span>Fe que se vive en comunidad</span>
          <h2>Crezcamos juntos en la fe</h2>
        </div>
      </div>
      <a className={`${s.tarjetaAcceso} ${s.accesoDevocional}`} href="#devocional">
        <span>LECTURA DE HOY</span><b>Devocional de hoy</b><p>Detente un momento, lee la Palabra y encuentra una idea para llevar a tu día.</p><FlechaAccion />
      </a>
      <a className={`${s.tarjetaAcceso} ${s.accesoOracion}`} href="#oracion">
        <span>ORACIÓN Y CUIDADO</span><b>Muro de oración</b><p>Comparte una petición o acompaña en oración a alguien de la comunidad.</p><FlechaAccion />
      </a>
      <a className={`${s.tarjetaAcceso} ${s.accesoReflexiones}`} href="#reflexiones">
        <span>PARA VOLVER A LEER</span><b>Reflexiones anteriores</b><p>Próximamente, lecturas para seguir creciendo en la fe.</p><FlechaAccion />
      </a>
    </section>
  );
}

export function DevocionalHoy() {
  return (
    <section id="devocional" className={s.devocional} aria-labelledby="devocional-titulo">
      <header className={s.devocionalCabecera}>
        <div>
          <h2 className={s.cita}>Versículo del día · Salmo 55:22</h2>
          <h3 id="devocional-titulo">Una palabra para hoy.</h3>
        </div>
          <span>Reina-Valera 1995</span>
      </header>
      <blockquote className={s.versiculo}>
        <span className={s.versiculoFranja} data-acento="si">“Echa sobre Jehová tu carga</span>
        <span className={s.versiculoFranja}>y él te sostendrá; no dejará para siempre caído al justo.”</span>
      </blockquote>
      <div className={s.devocionalPie}>
        <p>Cuando algo pese demasiado, no tienes que cargarlo a solas. Habla con Dios, busca apoyo en tu comunidad y da el siguiente paso con esperanza.</p>
        <p className={s.pregunta}>Para pensar: ¿qué preocupación puedes compartir hoy en oración?</p>
      </div>
    </section>
  );
}

export function MuroOracion() {
  const [peticiones, setPeticiones] = useState<Peticion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMuro, setErrorMuro] = useState('');
  const [visibilidad, setVisibilidad] = useState<'PRIVADA' | 'PUBLICA'>('PRIVADA');
  const [nombre, setNombre] = useState('');
  const [texto, setTexto] = useState('');
  const [consentimiento, setConsentimiento] = useState(false);
  const [trampa, setTrampa] = useState('');
  const [estadoEnvio, setEstadoEnvio] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [oradas, setOradas] = useState<string[]>([]);

  useEffect(() => {
    let activa = true;
    fetch('/api/publico/oraciones', { cache: 'no-store' })
      .then(async (respuesta) => {
        if (!respuesta.ok) throw new Error('No se pudieron cargar las peticiones.');
        return await respuesta.json() as Peticion[];
      })
      .then((datos) => { if (activa) setPeticiones(datos); })
      .catch((err: unknown) => { if (activa) setErrorMuro(err instanceof Error ? err.message : 'No se pudo cargar el muro.'); })
      .finally(() => { if (activa) setCargando(false); });
    return () => { activa = false; };
  }, []);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setEstadoEnvio('');
    setEnviando(true);
    try {
      const respuesta = await fetch('/api/publico/oraciones', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, peticion: texto, visibilidad, ...(visibilidad === 'PUBLICA' ? { consentimiento } : {}), sitioWeb: trampa }),
      });
      const datos = await respuesta.json() as { error?: string };
      if (!respuesta.ok) throw new Error(datos.error ?? 'No se pudo enviar la petición.');
      setTexto(''); setNombre(''); setConsentimiento(false);
      setEstadoEnvio(visibilidad === 'PUBLICA'
        ? 'Recibimos tu petición. Aparecerá en el muro después de que la organización la revise.'
        : 'Recibimos tu petición privada. Solo la organización podrá verla.');
    } catch (err) {
      setEstadoEnvio(err instanceof Error ? err.message : 'No se pudo enviar la petición.');
    } finally {
      setEnviando(false);
    }
  };

  const orar = async (peticion: Peticion) => {
    try {
      const respuesta = await fetch(`/api/publico/oraciones/${encodeURIComponent(peticion.id)}/orar`, { method: 'POST' });
      const datos = await respuesta.json() as { oraciones?: number; error?: string };
      if (!respuesta.ok) throw new Error(datos.error ?? 'No se pudo registrar tu apoyo.');
      setPeticiones((actuales) => actuales.map((item) => item.id === peticion.id ? { ...item, oraciones: datos.oraciones ?? item.oraciones + 1 } : item));
      setOradas((actuales) => [...actuales, peticion.id]);
    } catch (err) {
      setErrorMuro(err instanceof Error ? err.message : 'No se pudo registrar tu apoyo.');
    }
  };

  return (
    <section id="oracion" className={s.seccionOracion} aria-labelledby="oracion-titulo">
      <header className={s.encabezadoSeccion}>
        <div><p>Oración y cuidado</p><h2 id="oracion-titulo">No tienes que llevarlo a solas.</h2></div>
        <p>Comparte lo que quieras poner en oración. Tú decides si la petición queda solo con el equipo de oración o si solicitas publicarla en el muro.</p>
      </header>
      <div className={s.accionesOracion}>
        <a href="#formulario-oracion">Compartir una petición <FlechaAccion direccion="abajo" /></a>
        <a href="#peticiones">Ver peticiones <FlechaAccion direccion="abajo" /></a>
      </div>
      <div className={s.contenidoOracion}>
        <form id="formulario-oracion" className={s.formularioOracion} onSubmit={enviar}>
          <p className={s.miniEtiqueta}>Comparte con confianza</p>
          <h3>Tu petición</h3>
          <label htmlFor="nombre-peticion">Nombre <span>(opcional)</span></label>
          <input id="nombre-peticion" value={nombre} onChange={(event) => setNombre(event.target.value)} maxLength={60} placeholder="Puedes dejarlo en blanco" autoComplete="name" />
          <label htmlFor="texto-peticion">¿Qué quieres compartir?</label>
          <textarea id="texto-peticion" value={texto} onChange={(event) => setTexto(event.target.value)} required minLength={10} maxLength={600} rows={5} placeholder="Escribe tu petición de oración…" />
          <fieldset>
            <legend>¿Quién puede verla?</legend>
            <label><input type="radio" name="visibilidad" value="PRIVADA" checked={visibilidad === 'PRIVADA'} onChange={() => setVisibilidad('PRIVADA')} /> Solo el equipo de oración</label>
            <label><input type="radio" name="visibilidad" value="PUBLICA" checked={visibilidad === 'PUBLICA'} onChange={() => setVisibilidad('PUBLICA')} /> Solicitar que aparezca en el muro</label>
          </fieldset>
          {visibilidad === 'PUBLICA' && <label className={s.consentimiento}><input type="checkbox" checked={consentimiento} onChange={(event) => setConsentimiento(event.target.checked)} required /> Acepto que la organización revise y publique esta petición. Puede aparecer como anónima.</label>}
          <div className={s.campoTrampa} aria-hidden="true"><label htmlFor="sitio-web-oracion">Deja este campo vacío</label><input id="sitio-web-oracion" tabIndex={-1} autoComplete="off" value={trampa} onChange={(event) => setTrampa(event.target.value)} /></div>
          <button type="submit" disabled={enviando || (visibilidad === 'PUBLICA' && !consentimiento)}>{enviando ? 'Enviando…' : 'Enviar petición'}</button>
          {estadoEnvio && <p className={s.estadoEnvio} role="status">{estadoEnvio}</p>}
        </form>

        <div id="peticiones" className={s.muroPeticiones}>
          <div className={s.muroCabecera}><div><p className={s.miniEtiqueta}>Acompañémonos</p><h3>Peticiones del muro</h3></div><span>{peticiones.length}</span></div>
          {errorMuro && <p className={s.avisoMuro} role="status">{errorMuro}</p>}
          {cargando && <p className={s.avisoMuro}>Cargando peticiones…</p>}
          {!cargando && !peticiones.length && <p className={s.avisoMuro}>Aún no hay peticiones publicadas. Puedes ser la primera persona en compartir una.</p>}
          <div className={s.listaPeticiones}>
            {peticiones.map((peticion) => (
              <article className={s.tarjetaPeticion} key={peticion.id}>
                <p>{peticion.peticion}</p>
                <footer><span>{peticion.nombre?.trim() || 'Anónimo'}</span><button type="button" disabled={oradas.includes(peticion.id)} onClick={() => void orar(peticion)}>{oradas.includes(peticion.id) ? 'Acompañaste en oración' : 'Oré por ti'} <b>{peticion.oraciones}</b></button></footer>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function ReflexionesAnteriores() {
  return (
    <section id="reflexiones" className={s.reflexiones} aria-labelledby="reflexiones-titulo">
      <header className={s.encabezadoSeccion}>
        <div><p>Lecturas para volver</p><h2 id="reflexiones-titulo">Reflexiones anteriores</h2></div>
        <p>Un archivo de lecturas para acompañar la fe, el servicio y la vida en comunidad.</p>
      </header>
      <div className={s.reflexionesVacio}><span aria-hidden="true">✳</span><p>Pronto publicaremos aquí las primeras reflexiones, con su fecha, cita bíblica y una idea para llevar a la semana.</p></div>
    </section>
  );
}
