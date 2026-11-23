'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import CloseRounded from '@mui/icons-material/CloseRounded';
import ArrowBackIosNewRounded from '@mui/icons-material/ArrowBackIosNewRounded';
import ArrowForwardIosRounded from '@mui/icons-material/ArrowForwardIosRounded';
import s from './galeria.module.css';

const FOTOS = [
  { src: '/fotos/reto-obstaculos.webp', titulo: 'Supera tus límites', descripcion: 'El primer paso también cuenta: avanzar, caer y volver a intentarlo.', categoria: 'Aventura', alt: 'Participantes avanzan por una pista de obstáculos en el campo.' },
  { src: '/fotos/rio-rapidos.webp', titulo: 'Reto en el río', descripcion: 'Una prueba para confiar, coordinarse y cruzar juntos.', categoria: 'Aventura', alt: 'Equipo participante supera una prueba acuática en el río.' },
  { src: '/fotos/reto-equipo-rio.webp', titulo: 'Un equipo, un desafío', descripcion: 'La meta se alcanza mejor cuando nadie se queda atrás.', categoria: 'Equipo', alt: 'Integrantes de un equipo colaboran durante una prueba en el río.' },
  { src: '/fotos/cierre-neumatico.webp', titulo: 'Corre por la meta', descripcion: 'Fuerza y decisión en cada tramo del recorrido.', categoria: 'Aventura', alt: 'Participante corre llevando un neumático durante el desafío.' },
  { src: '/fotos/reto-cartilla.webp', titulo: 'Aprende en el camino', descripcion: 'El conocimiento también hace parte del reto.', categoria: 'Conocimiento', alt: 'Participante consulta la cartilla de estudio del desafío.' },
  { src: '/fotos/espiritual-pergamino.webp', titulo: 'Fe que nos une', descripcion: 'Un espacio para compartir, reflexionar y crecer juntos.', categoria: 'Espiritualidad', alt: 'Participantes leen juntos un mensaje de bienvenida.' },
  { src: '/fotos/equipo-sonriendo.webp', titulo: 'Juntos hasta el final', descripcion: 'La alegría de superar el desafío como equipo.', categoria: 'Equipo', alt: 'Tres integrantes de un equipo avanzan juntos por el campo.' },
  { src: '/fotos/campamento-amanecer.webp', titulo: 'Vida de campamento', descripcion: 'Mañanas que comienzan entre montañas y nuevas historias.', categoria: 'Campamento', alt: 'Carpas en el campamento al amanecer, rodeadas de montañas.' },
] as const;

type Foto = (typeof FOTOS)[number];
const FILTROS = ['Todas', 'Aventura', 'Equipo', 'Espiritualidad', 'Conocimiento', 'Campamento'] as const;
const FORMAS = ['grande', 'mediana', 'pequena', 'pequena', 'pequena', 'franja', 'mini', 'mini'] as const;

/** Mosaico editorial local, con filtros y ampliación accesible de cada foto. */
export default function GaleriaDesafio() {
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todas');
  const [seleccionada, setSeleccionada] = useState<Foto | null>(null);
  const fotos = useMemo(
    () => FOTOS.filter((foto) => filtro === 'Todas' || foto.categoria === filtro),
    [filtro],
  );
  const indiceActual = seleccionada ? fotos.findIndex((foto) => foto.src === seleccionada.src) : -1;

  const mover = (direccion: -1 | 1) => {
    if (indiceActual < 0 || fotos.length < 2) return;
    setSeleccionada(fotos[(indiceActual + direccion + fotos.length) % fotos.length]);
  };

  useEffect(() => {
    if (!seleccionada || fotos.length < 2) return;

    const recorrer = (evento: KeyboardEvent) => {
      if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') return;
      evento.preventDefault();
      setSeleccionada((actual) => {
        if (!actual) return actual;
        const indice = fotos.findIndex((foto) => foto.src === actual.src);
        const direccion = evento.key === 'ArrowRight' ? 1 : -1;
        return fotos[(indice + direccion + fotos.length) % fotos.length];
      });
    };

    window.addEventListener('keydown', recorrer);
    return () => window.removeEventListener('keydown', recorrer);
  }, [seleccionada, fotos]);

  return (
    <section className={s.galeria} aria-label="Fotos del Desafío Tolotá">
      <div className={s.controles}>
        <div className={s.filtros} role="group" aria-label="Filtrar fotos por actividad">
          {FILTROS.map((opcion) => (
            <button
              key={opcion}
              type="button"
              className={s.filtro}
              data-activo={filtro === opcion}
              aria-pressed={filtro === opcion}
              onClick={() => {
                setFiltro(opcion);
                setSeleccionada(null);
              }}
            >
              {opcion}
            </button>
          ))}
        </div>
        <p className={s.cantidad}>{fotos.length} {fotos.length === 1 ? 'momento' : 'momentos'}</p>
      </div>

      <div className={s.mosaico}>
        {fotos.map((foto, indice) => (
          <button
            key={foto.src}
            type="button"
            className={s.tarjeta}
            data-forma={FORMAS[indice % FORMAS.length]}
            aria-label={`Ampliar foto: ${foto.titulo}`}
            onClick={() => setSeleccionada(foto)}
          >
            <Image
              src={foto.src}
              alt={foto.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 42vw"
              className={s.foto}
            />
            <span className={s.sombra} aria-hidden="true" />
          </button>
        ))}
      </div>

      <Dialog
        open={Boolean(seleccionada)}
        onClose={() => setSeleccionada(null)}
        maxWidth="lg"
        fullWidth
        aria-labelledby="galeria-foto-titulo"
        slotProps={{
          paper: {
            className: s.dialogo,
          },
          backdrop: {
            sx: { backgroundColor: 'rgba(0,0,0,.88)', backdropFilter: 'blur(10px)' },
          },
        }}
      >
        {seleccionada && (
          <DialogContent className={s.dialogoContenido}>
            <div className={s.dialogoBarra}>
              <span>{seleccionada.categoria}</span>
              <span>{indiceActual + 1} / {fotos.length}</span>
              <IconButton aria-label="Cerrar foto" onClick={() => setSeleccionada(null)} className={s.cerrar}>
                <CloseRounded />
              </IconButton>
            </div>
            <div className={s.marcoFoto}>
              <Image src={seleccionada.src} alt={seleccionada.alt} fill sizes="90vw" className={s.fotoAmpliada} priority />
              {fotos.length > 1 && (
                <>
                  <IconButton aria-label="Foto anterior" onClick={() => mover(-1)} className={`${s.navegar} ${s.anterior}`}>
                    <ArrowBackIosNewRounded />
                  </IconButton>
                  <IconButton aria-label="Foto siguiente" onClick={() => mover(1)} className={`${s.navegar} ${s.siguiente}`}>
                    <ArrowForwardIosRounded />
                  </IconButton>
                </>
              )}
            </div>
            <Box className={s.pieFoto}>
              <div>
                <span className={s.categoria}>{seleccionada.categoria}</span>
                <h2 id="galeria-foto-titulo">{seleccionada.titulo}</h2>
                <p>{seleccionada.descripcion}</p>
              </div>
              <span className={s.teclas}>Usa ← → para recorrer</span>
            </Box>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
