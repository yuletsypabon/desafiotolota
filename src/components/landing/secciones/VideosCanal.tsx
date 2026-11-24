'use client';

import { useRef, useState } from 'react';
import FlechaAccion from '@/components/sitio/FlechaAccion';
import s from '../Landing.module.css';

const VIDEOS = [
  { id: 'c8Pftl-xpMg', titulo: 'Desafío Tolotá 2026', duracion: '2:45', tipo: 'Presentación oficial' },
  { id: 'DxXTGBpcv5c', titulo: 'Día 6 · Desafío X4: La Gran Conquista', duracion: '4:23', tipo: 'Lo más reciente' },
  { id: 'lNMTUEL81tI', titulo: 'Día 5 · Desafío X4: La Gran Conquista', duracion: '9:47', tipo: 'Lo más reciente' },
  { id: 'ywyfXt0Lyn4', titulo: 'Día 4 · Desafío X4: La Gran Conquista 2025', duracion: '8:07', tipo: 'Edición 2025' },
  { id: 'zrqCHMtmOog', titulo: 'Día 3 · Desafío X4: La Gran Conquista 2025', duracion: '9:20', tipo: 'Edición 2025' },
] as const;

/** Video principal con cuatro selecciones del canal oficial en la columna lateral. */
export default function VideosCanal() {
  const [videoActual, setVideoActual] = useState<(typeof VIDEOS)[number]>(VIDEOS[0]);
  const [reproduciendo, setReproduciendo] = useState(false);
  const reproductor = useRef<HTMLDivElement>(null);

  const reproducir = (video: (typeof VIDEOS)[number]) => {
    setVideoActual(video);
    setReproduciendo(true);
    if (video.id !== videoActual.id) {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      reproductor.current?.scrollIntoView({ behavior, block: 'center' });
    }
  };

  return (
    <section className={`${s.seccion} ${s.videos}`} aria-labelledby="videos-titulo">
      <header className={s.videosCabecera}>
        <p className={s.etiqueta}>Así se vive Tolotá</p>
        <h2 id="videos-titulo" className={s.titulo}>Momentos que nos unen.</h2>
        <p className={s.parrafo}>Revive la experiencia del Desafío con los videos del canal oficial.</p>
      </header>

      <div className={s.videosRejilla}>
        <article className={s.videoDestacado}>
          <div className={s.videoPantalla} ref={reproductor}>
            {reproduciendo ? (
              <iframe
                key={videoActual.id}
                src={`https://www.youtube-nocookie.com/embed/${videoActual.id}?autoplay=1&rel=0`}
                title={videoActual.titulo}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                className={s.videoPortada}
                style={{ backgroundImage: `linear-gradient(0deg,rgba(5,5,5,.72),rgba(5,5,5,.08)),url(https://i.ytimg.com/vi/${videoActual.id}/hqdefault.jpg)` }}
                onClick={() => setReproduciendo(true)}
                aria-label={`Reproducir ${videoActual.titulo}`}
              >
                <span className={s.videoPlay} aria-hidden="true">▶</span>
                <span className={s.videoDuracion}>{videoActual.duracion}</span>
              </button>
            )}
          </div>
          <div className={s.videoTexto}>
            <span>{videoActual.tipo}</span>
            <h3>{videoActual.titulo}</h3>
            <p>{videoActual.duracion} · Canal oficial de Desafío Tolotá</p>
          </div>
        </article>

        <div className={s.videosRecientes} aria-label="Videos recientes">
          {VIDEOS.slice(1).map((video) => (
            <button className={s.videoReciente} key={video.id} onClick={() => reproducir(video)}>
              <span
                className={s.videoMiniatura}
                style={{ backgroundImage: `linear-gradient(0deg,rgba(5,5,5,.48),rgba(5,5,5,.04)),url(https://i.ytimg.com/vi/${video.id}/hqdefault.jpg)` }}
                aria-hidden="true"
              >
                <span className={s.videoPlayMini}>▶</span>
                <span className={s.videoDuracion}>{video.duracion}</span>
              </span>
              <span className={s.videoRecienteTexto}>
                <span>{video.tipo}</span>
                <strong>{video.titulo}</strong>
              </span>
            </button>
          ))}
        </div>
      </div>

      <a className={s.videosCanal} href="https://www.youtube.com/@DesafioTolota/videos" target="_blank" rel="noopener noreferrer">
        Ver todos los videos en YouTube <FlechaAccion />
      </a>
    </section>
  );
}
