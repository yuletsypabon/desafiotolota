'use client';
import { useState, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack,
  TextField, Typography,
} from '@mui/material';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import { api, fetcher, useClasificacion, useEquipos, useSesion } from '@/lib/client';
import { fHora, fmt, fmtSeg, fmtSegundos } from '@/lib/format';
import { ESTADOS } from '@/lib/estados';
import { FUENTE_TEXTO } from '@/lib/marca';
import EquipoAvatar from '@/components/EquipoAvatar';
import Vacio from '@/components/Vacio';
import type { Clasificacion, ClasificacionPrueba } from '@/lib/types';
import { COLORS, FONT_DISPLAY, alfa, superficieVidrio } from '@/theme';

interface AccesoHistorico {
  configurada: boolean;
  autorizado: boolean;
}

interface CorreccionResultado {
  id: string;
  equipoAId: string;
  equipoBId: string;
  motivo: string;
  rol: 'ADMIN' | 'CRONO';
  createdAt: string;
}

type EquipoPodio = { id: string; nombre: string; logo?: string | null; tiempo: string };
type DatoTecnico = { etiqueta: string; valor: string; color?: string };
type EquipoClasificacion = EquipoPodio & { posicion: number; resumen?: string; metricas?: DatoTecnico[] };

/** Mantiene una escala uniforme; la versión tenue funciona como marca de fondo de cada fila. */
function NombreEquipoClasificacion({ nombre, opaco = false }: { nombre: string; opaco?: boolean }) {
  const caracteres = Array.from(nombre).length;
  const fuentePrincipal = caracteres >= 16
    ? { xs: 13, sm: 16, lg: 20 }
    : caracteres >= 12
      ? { xs: 15, sm: 19, lg: 23 }
      : caracteres >= 9
        ? { xs: 17, sm: 22, lg: 26 }
        : { xs: 20, sm: 26, lg: 30 };
  return (
    <Typography component="span" sx={{ display: 'block', width: '100%', minWidth: 0, overflow: 'hidden', py: .08, color: opaco ? alfa(COLORS.text, .23) : COLORS.text, fontFamily: FONT_DISPLAY, fontWeight: 400, fontSize: opaco ? { xs: 22, sm: 32, lg: 36, xl: 56 } : fuentePrincipal, lineHeight: opaco ? .82 : 1.08, letterSpacing: opaco ? '-.045em' : '.005em', textAlign: 'left', textOverflow: 'clip', textShadow: opaco ? 'none' : '0 3px 10px rgba(0,0,0,.55)', whiteSpace: 'nowrap', pointerEvents: opaco ? 'none' : 'auto' }}>
      {nombre.toLocaleUpperCase('es-CO')}
    </Typography>
  );
}

/** Cabecera reutilizable para cada prueba y la acumulada. */
function Podio({
  items, seleccionadoId, onSeleccionar, renderDetalle,
}: {
  items: EquipoPodio[];
  seleccionadoId?: string | null;
  onSeleccionar?: (id: string) => void;
  renderDetalle?: (id: string) => ReactNode;
}) {
  const estilos = {
    1: { color: COLORS.acento, etiqueta: '1.er puesto', numero: '1' },
    2: { color: '#b7c2d1', etiqueta: '2.º puesto', numero: '2' },
    3: { color: '#c9824b', etiqueta: '3.er puesto', numero: '3' },
  } as const;
  const puestos = items.slice(0, 3).map((equipo, indice) => ({ equipo, puesto: (indice + 1) as 1 | 2 | 3 }));
  const podioOrdenado = [2, 1, 3].flatMap((puesto) => puestos.filter((item) => item.puesto === puesto));
  const seleccionado = items.slice(0, 3).find((equipo) => equipo.id === seleccionadoId);
  if (!items.length) return null;

  return (
    <Box component="section" aria-label="Podio" sx={{
      position: 'relative', overflow: 'hidden', mb: 2.5, border: `1px solid ${COLORS.border}`, borderRadius: '22px',
      bgcolor: 'rgba(7,10,13,.76)', backdropFilter: 'blur(16px)',
      backgroundImage: `repeating-linear-gradient(135deg, transparent 0 20px, ${alfa(COLORS.text, .025)} 20px 23px), linear-gradient(135deg, ${alfa(COLORS.acento, .13)}, transparent 48%)`,
      '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: COLORS.acento },
    }}>
      <Box sx={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '84px minmax(0, 1fr)' } }}>
        <Box sx={{ display: { xs: 'none', md: 'grid' }, placeItems: 'center', borderRight: `1px solid ${alfa(COLORS.text, .12)}`, bgcolor: alfa(COLORS.bg, .24) }}>
          <Typography sx={{ color: COLORS.text, fontFamily: FONT_DISPLAY, fontSize: 34, letterSpacing: '.05em', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
            PODIO
          </Typography>
        </Box>
        <Box sx={{ minWidth: 0, p: { xs: 1.25, sm: 2 } }}>
          <Stack direction="row" alignItems="center" spacing={.75} sx={{ pb: 1.25 }}>
            <EmojiEventsOutlinedIcon sx={{ color: COLORS.acento, fontSize: 21 }} />
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: { xs: 18, sm: 21 }, lineHeight: 1.05 }}>Resultados destacados</Typography>
              <Typography variant="caption" color="text.secondary">Los tres mejores tiempos</Typography>
            </Box>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: { xs: .65, sm: 1.25 }, alignItems: 'end' }}>
            {podioOrdenado.map(({ equipo, puesto }) => {
          const estilo = estilos[puesto];
          return (
            <Box component="article" key={equipo.id} aria-label={`${estilo.etiqueta}: ${equipo.nombre}`} role={onSeleccionar ? 'button' : undefined} tabIndex={onSeleccionar ? 0 : undefined}
              onClick={onSeleccionar ? () => onSeleccionar(equipo.id) : undefined}
              onKeyDown={onSeleccionar ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSeleccionar(equipo.id); } } : undefined}
              sx={{
              position: 'relative', minWidth: 0, minHeight: { xs: puesto === 1 ? 226 : 204, sm: puesto === 1 ? 318 : 282 }, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden',
              border: `1px solid ${alfa(estilo.color, puesto === 1 ? .82 : .52)}`, borderRadius: { xs: '12px 12px 14px 14px', sm: '18px 18px 22px 22px' },
              bgcolor: alfa(COLORS.bg, .7), background: `radial-gradient(circle at 68% 19%, ${alfa(estilo.color, puesto === 1 ? .7 : .5)} 0%, ${alfa(estilo.color, .19)} 35%, ${alfa(COLORS.bg, .96)} 78%), linear-gradient(150deg, ${alfa(estilo.color, .16)}, ${alfa(COLORS.bg, .9)} 72%)`,
              boxShadow: puesto === 1 ? `0 16px 38px ${alfa(estilo.color, .2)}` : `0 10px 24px ${alfa(COLORS.bg, .44)}`,
              cursor: onSeleccionar ? 'pointer' : 'default', transition: 'transform .18s ease, border-color .18s ease',
              '&:hover': onSeleccionar ? { transform: 'translateY(-4px)', borderColor: estilo.color } : undefined,
              '&::before': { content: '""', position: 'absolute', inset: 0, pointerEvents: 'none', background: `linear-gradient(180deg, transparent 38%, ${alfa(COLORS.bg, .12)} 62%, ${COLORS.bg} 100%)` },
            }}>
              <Box aria-hidden sx={{ position: 'absolute', zIndex: 0, inset: 0, width: { xs: '76%', sm: '68%' }, pointerEvents: 'none', background: `linear-gradient(90deg, ${alfa(estilo.color, .76)}, ${alfa(estilo.color, .26)} 72%, transparent)`, clipPath: 'polygon(0 0, 78% 0, 100% 50%, 78% 100%, 0 100%)' }} />
              <Typography aria-hidden sx={{ position: 'absolute', zIndex: 1, top: { xs: 42, sm: 54 }, left: { xs: 34, sm: 46 }, color: alfa(COLORS.bg, puesto === 1 ? .7 : .58), fontFamily: FONT_DISPLAY, fontSize: { xs: puesto === 1 ? 150 : 118, sm: puesto === 1 ? 238 : 184 }, lineHeight: .78, letterSpacing: '-.11em' }}>
                {estilo.numero}
              </Typography>
              <Box sx={{ position: 'absolute', zIndex: 1, top: { xs: 32, sm: 42 }, left: '13%', right: '13%', bottom: { xs: 72, sm: 92 }, display: 'grid', placeItems: 'center' }}>
                {equipo.logo ? (
                  <Box component="img" src={equipo.logo} alt={`Logo de ${equipo.nombre}`} sx={{
                    width: '100%', height: '100%', maxWidth: '92%', maxHeight: '108%', objectFit: 'contain', transform: puesto === 1 ? 'translateY(8px) scale(1.13)' : 'translateY(7px) scale(1.05)', filter: 'drop-shadow(0 16px 19px rgba(0,0,0,.62))',
                  }} />
                ) : (
                  <EquipoAvatar nombre={equipo.nombre} size={puesto === 1 ? 104 : 78} />
                )}
              </Box>
              <Box sx={{ position: 'relative', zIndex: 2, p: { xs: .75, sm: 1.15 }, pt: { xs: .9, sm: 1.25 }, background: `linear-gradient(180deg, transparent, ${alfa(COLORS.bg, .92)} 36%)` }}>
                <Typography noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: COLORS.text, fontWeight: 900, fontSize: { xs: puesto === 1 ? 15 : 12, sm: puesto === 1 ? 21 : 16 }, lineHeight: 1.08 }}>{equipo.nombre.toLocaleUpperCase('es-CO')}</Typography>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={.5} sx={{ mt: .65, minWidth: 0 }}>
                  <Typography variant="caption" noWrap sx={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', color: estilo.color, fontWeight: 800, lineHeight: 1, letterSpacing: '.04em' }}>{estilo.etiqueta}</Typography>
                  <Typography noWrap sx={{ flexShrink: 0, px: { xs: .45, sm: .65 }, py: .28, borderRadius: '6px', bgcolor: alfa(estilo.color, .16), color: estilo.color, fontFamily: FUENTE_TEXTO, fontVariantNumeric: 'tabular-nums slashed-zero', fontSize: { xs: 10, sm: puesto === 1 ? 14 : 12 }, fontWeight: 800 }}>{equipo.tiempo}</Typography>
                </Stack>
              </Box>
            </Box>
          );
            })}
          </Box>
          {seleccionado && renderDetalle && <Box sx={{ mt: 1.25 }}>{renderDetalle(seleccionado.id)}</Box>}
        </Box>
      </Box>
    </Box>
  );
}

/** Filas de la clasificación que continúan después del podio sin repetir sus tres destacados. */
function ClasificacionComplementaria({
  items, ocultarIds = [], seleccionadoId, onSeleccionar, renderDetalle,
}: {
  items: EquipoClasificacion[];
  ocultarIds?: string[];
  seleccionadoId?: string | null;
  onSeleccionar?: (id: string) => void;
  renderDetalle?: (id: string) => ReactNode;
}) {
  const restantes = items.filter((equipo) => !ocultarIds.includes(equipo.id));
  if (!restantes.length) return null;

  return (
    <Box component="section" aria-label="Resto de la clasificación" sx={{ mb: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: .5, mb: 1 }}>
        <LeaderboardOutlinedIcon sx={{ color: COLORS.acento, fontSize: 20 }} />
        <Typography sx={{ fontWeight: 800, fontSize: 18 }}>Clasificación completa</Typography>
        <Typography variant="caption" color="text.secondary">Desde el cuarto lugar</Typography>
      </Stack>
      <Stack spacing={.65}>
        {restantes.map((equipo) => (
          <Box key={equipo.id}>
            <Box
              component="article"
              role={onSeleccionar ? 'button' : undefined}
              tabIndex={onSeleccionar ? 0 : undefined}
              onClick={onSeleccionar ? () => onSeleccionar(equipo.id) : undefined}
              onKeyDown={onSeleccionar ? (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSeleccionar(equipo.id); } } : undefined}
              sx={{
                position: 'relative', display: 'grid', alignItems: 'stretch', minHeight: { xs: 72, sm: 86, lg: 112 }, overflow: 'hidden',
                gridTemplateColumns: {
                  xs: '58px minmax(0, 1fr) minmax(110px, auto)',
                  sm: '74px minmax(0, 1fr) minmax(154px, auto)',
                  lg: '74px minmax(440px, 1.1fr) minmax(0, 1.4fr) minmax(154px, auto)',
                  xl: '74px minmax(520px, 1.25fr) minmax(0, 1.25fr) minmax(154px, auto)',
                },
                border: `1px solid ${alfa(COLORS.text, .14)}`, borderRadius: '8px', bgcolor: alfa(COLORS.bg, .86),
                background: `linear-gradient(90deg, ${alfa(COLORS.bg, .74)}, ${alfa(COLORS.bg, .96)})`,
              cursor: onSeleccionar ? 'pointer' : 'default', transition: 'border-color .18s ease, transform .18s ease, background .18s ease',
                '&:hover': onSeleccionar ? { transform: 'translateX(3px)', borderColor: COLORS.acento, background: `linear-gradient(90deg, ${alfa(COLORS.acento, .1)}, ${alfa(COLORS.bg, .94)} 44%)` } : undefined,
                '&::after': { content: '""', position: 'absolute', zIndex: 0, top: 0, bottom: 0, right: 0, width: { xs: 12, sm: 20 }, bgcolor: alfa(COLORS.bg, .88), clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, alignSelf: 'stretch', display: 'grid', placeItems: 'center', color: COLORS.bg, bgcolor: alfa(COLORS.acento, .88), clipPath: 'polygon(0 0, 100% 0, 78% 100%, 0 100%)' }}>
              <Typography sx={{ fontFamily: FONT_DISPLAY, fontSize: { xs: 30, sm: 38 }, lineHeight: 1 }}>{equipo.posicion}º</Typography>
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: { xs: .85, sm: 1.25 }, px: { xs: .8, sm: 1.2 }, bgcolor: alfa(COLORS.bg, .68), borderRight: `1px solid ${alfa(COLORS.acento, .46)}`, clipPath: 'polygon(0 0, 96% 0, 100% 50%, 96% 100%, 0 100%)' }}>
              <Box sx={{ flexShrink: 0, width: { xs: 58, sm: 78 }, height: { xs: 58, sm: 78 }, display: 'grid', placeItems: 'center', borderRight: `1px solid ${alfa(COLORS.text, .14)}` }}>
                {equipo.logo ? (
                  <Box component="img" src={equipo.logo} alt={`Logo de ${equipo.nombre}`} sx={{ width: { xs: 54, sm: 72 }, height: { xs: 54, sm: 72 }, objectFit: 'contain', filter: 'drop-shadow(0 9px 12px rgba(0,0,0,.52))' }} />
                ) : <EquipoAvatar nombre={equipo.nombre} size={56} />}
              </Box>
              <Box minWidth={0} sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'max-content minmax(0, 1fr)' }, alignItems: 'center', columnGap: 1.25, rowGap: .3, py: .45, pr: 1.4, overflow: 'hidden' }}>
                <Box sx={{ minWidth: { xs: 0, lg: 'max-content' } }}>
                  <NombreEquipoClasificacion nombre={equipo.nombre} />
                </Box>
                <Box aria-hidden sx={{ display: 'block', minWidth: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                  <NombreEquipoClasificacion nombre={equipo.nombre} opaco />
                </Box>
                {equipo.resumen && <Typography noWrap variant="caption" color="text.secondary" sx={{ gridColumn: '1 / -1', display: { xs: 'none', sm: 'block', lg: 'none' }, mt: .28, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 11 }}>{equipo.resumen}</Typography>}
              </Box>
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1, display: { xs: 'none', lg: equipo.metricas?.length ? 'grid' : 'none' }, gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', alignSelf: 'stretch', minWidth: 0, bgcolor: alfa(COLORS.bg, .28) }}>
              {equipo.metricas?.map((metrica) => (
                <Box key={metrica.etiqueta} sx={{ minWidth: 0, display: 'grid', alignContent: 'center', gap: .6, px: 1.25, borderLeft: `1px solid ${alfa(COLORS.text, .1)}`, borderTop: `1px solid ${alfa(COLORS.text, .07)}` }}>
                  <Typography noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: alfa(COLORS.text, .8), fontSize: 13, fontWeight: 700, lineHeight: 1 }}>{metrica.etiqueta}</Typography>
                  <Typography noWrap sx={{ overflow: 'hidden', textOverflow: 'ellipsis', color: metrica.color ?? COLORS.text, fontFamily: FUENTE_TEXTO, fontVariantNumeric: 'tabular-nums slashed-zero', fontSize: 17, fontWeight: 800, letterSpacing: '-.015em', lineHeight: 1.15 }}>{metrica.valor}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ position: 'relative', zIndex: 1, alignSelf: 'stretch', display: 'grid', placeItems: 'center', px: { xs: 1, sm: 1.65 }, pr: { xs: 1.3, sm: 2.1 }, bgcolor: COLORS.acento, color: COLORS.bg, clipPath: 'polygon(12% 0, 100% 0, 100% 100%, 0 100%)' }}>
              <Typography sx={{ fontFamily: FUENTE_TEXTO, fontVariantNumeric: 'tabular-nums slashed-zero', fontSize: { xs: 13, sm: 17 }, fontWeight: 800, letterSpacing: '-.015em', whiteSpace: 'nowrap' }}>{equipo.tiempo}</Typography>
            </Box>
            </Box>
            {seleccionadoId === equipo.id && renderDetalle && <Box sx={{ mt: .65 }}>{renderDetalle(equipo.id)}</Box>}
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

function FichaDesglose({ equipo, datos, children, onOcultar }: {
  equipo: string;
  datos: DatoTecnico[];
  children?: ReactNode;
  onOcultar: () => void;
}) {
  return (
    <Box sx={{ ...superficieVidrio, p: { xs: 1.25, sm: 1.75 }, borderRadius: '16px', borderColor: alfa(COLORS.acento, .5), background: `linear-gradient(135deg, ${alfa(COLORS.acento, .12)}, rgba(7,10,13,.74) 44%)` }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} spacing={1} sx={{ mb: 1.25 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" sx={{ color: COLORS.acento, fontWeight: 800, letterSpacing: '.08em' }}>DESGLOSE TÉCNICO</Typography>
          <Typography sx={{ fontWeight: 800, fontSize: { xs: 16, sm: 18 } }}>{equipo.toLocaleUpperCase('es-CO')}</Typography>
        </Box>
        <Button size="small" color="inherit" onClick={onOcultar} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>Ocultar detalle</Button>
      </Stack>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 132px), 1fr))', gap: .75 }}>
        {datos.map((dato) => (
          <Box key={dato.etiqueta} sx={{ minWidth: 0, p: 1, borderRadius: '10px', border: `1px solid ${alfa(COLORS.text, .1)}`, bgcolor: alfa(COLORS.bg, .32) }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>{dato.etiqueta}</Typography>
            <Typography noWrap sx={{ mt: .45, overflow: 'hidden', textOverflow: 'ellipsis', color: dato.color ?? COLORS.text, fontFamily: FUENTE_TEXTO, fontVariantNumeric: 'tabular-nums slashed-zero', fontSize: 14, fontWeight: 800 }}>{dato.valor}</Typography>
          </Box>
        ))}
      </Box>
      {children && <Box sx={{ mt: 1.25 }}>{children}</Box>}
    </Box>
  );
}

type VistaHistorico = 'indice' | 'general' | string;
type LogoEquipo = (id: string) => string | null | undefined;

/** Índice de resultados: una tarjeta por vista, igual a las actividades espirituales. */
function TarjetaHistorico({
  titulo, subtitulo, cantidad, ganador, estado, color, Icono, onAbrir,
}: {
  titulo: string;
  subtitulo: string;
  cantidad: number;
  ganador?: { nombre: string; tiempo: string };
  estado?: ClasificacionPrueba['estado'];
  color: string;
  Icono: typeof TimerOutlinedIcon;
  onAbrir: () => void;
}) {
  const estadoPrueba = estado ? ESTADOS[estado] : null;
  return (
    <Box component="article" sx={{
      ...superficieVidrio, borderRadius: '28px', p: 1.25, display: 'flex', flexDirection: 'column',
      transition: 'transform .2s ease, border-color .2s ease',
      '&:hover': { transform: 'translateY(-4px)', borderColor: alfa(color, .55) },
    }}>
      <Box sx={{
        minHeight: 132, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
        bgcolor: alfa(color, .13), background: `linear-gradient(135deg, ${alfa(color, .28)}, transparent)`,
      }}>
        <Icono sx={{ fontSize: 58, color }} />
        {estadoPrueba ? (
          <Chip size="small" color={estadoPrueba.color} label={estadoPrueba.label} sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }} />
        ) : (
          <Chip size="small" label="ACUMULADA" color="primary" sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }} />
        )}
      </Box>
      <Box sx={{ px: 1.25, pt: 2, pb: 1, flex: 1 }}>
        <Typography component="h2" sx={{ fontWeight: 700, fontSize: 21, lineHeight: 1.25, letterSpacing: '-.01em', overflowWrap: 'anywhere' }}>
          {titulo}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: .75, minHeight: 40 }}>{subtitulo}</Typography>
      </Box>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 1.25, pt: 1, pb: .75 }}>
        <Stack direction="row" spacing={.5} alignItems="center" color="text.secondary">
          <GroupsOutlinedIcon sx={{ fontSize: 18 }} />
          <Typography variant="body2" fontWeight={700}>{cantidad}</Typography>
        </Stack>
        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 138, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ganador ? `1.º ${ganador.nombre.toLocaleUpperCase('es-CO')} · ${ganador.tiempo}` : 'Sin resultados'}
        </Typography>
        <Box sx={{ flex: 1 }} />
        <Button size="small" onClick={onAbrir} sx={{ px: 2.25, bgcolor: 'rgba(255,255,255,.08)', color: 'text.primary', '&:hover': { bgcolor: color, color: COLORS.bg } }}>
          Abrir
        </Button>
      </Stack>
    </Box>
  );
}

function IndiceHistorico({ clas, onAbrirGeneral, onAbrirPrueba }: {
  clas: Clasificacion;
  onAbrirGeneral: () => void;
  onAbrirPrueba: (id: string) => void;
}) {
  const primeroGeneral = clas.general.find((fila) => fila.completadas === clas.totalPruebas) ?? clas.general[0];
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: .5 }}>Resultados del evento</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
        Abre una prueba para consultar su podio, resultados detallados y correcciones registradas.
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 2.5 }}>
        <TarjetaHistorico
          titulo="Clasificación general"
          subtitulo={`${clas.totalPruebas} ${clas.totalPruebas === 1 ? 'prueba configurada' : 'pruebas configuradas'} · tiempos acumulados`}
          cantidad={clas.general.length}
          ganador={primeroGeneral ? { nombre: primeroGeneral.nombre, tiempo: fmt(primeroGeneral.totalMs) } : undefined}
          color={COLORS.acento}
          Icono={LeaderboardOutlinedIcon}
          onAbrir={onAbrirGeneral}
        />
        {clas.pruebas.map((prueba, indice) => {
          const primero = prueba.filas[0];
          return (
            <TarjetaHistorico
              key={prueba.id}
              titulo={`${indice + 1}. ${prueba.nombre}`}
              subtitulo={primero ? `Mejor tiempo: ${fmt(primero.finalMs)}` : 'Aún no hay resultados registrados'}
              cantidad={prueba.filas.length}
              ganador={primero ? { nombre: primero.nombre, tiempo: fmt(primero.finalMs) } : undefined}
              estado={prueba.estado}
              color={COLORS.blue}
              Icono={TimerOutlinedIcon}
              onAbrir={() => onAbrirPrueba(prueba.id)}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function BotonVolver({ onClick }: { onClick: () => void }) {
  return <Button color="inherit" size="small" startIcon={<ArrowBackOutlinedIcon />} onClick={onClick}>Todas las pruebas</Button>;
}

function GeneralHistorico({ clas, logo, onVolver }: { clas: Clasificacion; logo: LogoEquipo; onVolver: () => void }) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const filasClasificacion = clas.general.map((fila) => ({
    id: fila.equipoId,
    nombre: fila.nombre,
    logo: logo(fila.equipoId),
    tiempo: fmt(fila.totalMs),
    posicion: fila.pos,
    resumen: `${fila.completadas}/${clas.totalPruebas} ${clas.totalPruebas === 1 ? 'prueba completada' : 'pruebas completadas'}${fila.puntosPlus > 0 ? ` · +${fila.puntosPlus} pts` : ''}`,
    metricas: [
      { etiqueta: 'Pruebas', valor: `${fila.completadas}/${clas.totalPruebas}` },
      { etiqueta: 'Disciplina', valor: fila.penMs ? fmtSeg(fila.penMs) : '—', color: fila.penMs > 0 ? COLORS.red : fila.penMs < 0 ? COLORS.green : undefined },
      { etiqueta: 'Espiritual', valor: fila.descuentoEspiritualMs > 0 ? `−${fmtSegundos(fila.descuentoEspiritualMs)}` : '—', color: fila.descuentoEspiritualMs > 0 ? COLORS.green : undefined },
      { etiqueta: 'Plus', valor: fila.puntosPlus > 0 ? `+${fila.puntosPlus}` : '—', color: fila.puntosPlus > 0 ? COLORS.acento : undefined },
    ],
  }));
  // La acumulada debe enseñar siempre sus tres líderes actuales, aun durante el evento.
  const filasPodio = filasClasificacion.slice(0, 3);
  const seleccionar = (equipoId: string) => setSeleccionadoId((actual) => actual === equipoId ? null : equipoId);
  const renderDetalle = (equipoId: string) => {
    const fila = clas.general.find((actual) => actual.equipoId === equipoId);
    if (!fila) return null;
    return (
      <FichaDesglose
        equipo={fila.nombre}
        onOcultar={() => setSeleccionadoId(null)}
        datos={[
          { etiqueta: 'Posición', valor: `${fila.pos}º`, color: COLORS.acento },
          { etiqueta: 'Tiempo total', valor: fmt(fila.totalMs), color: COLORS.acento },
          { etiqueta: 'Disciplina', valor: fila.penMs ? fmtSeg(fila.penMs) : 'Sin ajuste', color: fila.penMs > 0 ? COLORS.red : fila.penMs < 0 ? COLORS.green : undefined },
          { etiqueta: 'Descuento espiritual', valor: fila.descuentoEspiritualMs > 0 ? `−${fmtSegundos(fila.descuentoEspiritualMs)}` : 'Sin descuento', color: fila.descuentoEspiritualMs > 0 ? COLORS.green : undefined },
          { etiqueta: 'Puntos Plus', valor: fila.puntosPlus > 0 ? `+${fila.puntosPlus} pts` : '—' },
          { etiqueta: 'Pruebas completadas', valor: `${fila.completadas}/${clas.totalPruebas}` },
        ]}
      >
        <Typography variant="caption" sx={{ display: 'block', mb: .65, color: 'text.secondary', fontWeight: 700, letterSpacing: '.05em' }}>RESULTADOS POR PRUEBA</Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: .65 }}>
          {clas.pruebas.map((prueba) => {
            const resultado = fila.porPrueba[prueba.id];
            return (
              <Box key={prueba.id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, p: .8, borderRadius: '9px', bgcolor: alfa(COLORS.bg, .28), border: `1px solid ${alfa(COLORS.text, .08)}` }}>
                <Typography noWrap variant="caption" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{prueba.nombre}</Typography>
                <Typography noWrap variant="caption" sx={{ color: resultado ? COLORS.acento : 'text.secondary', fontFamily: FUENTE_TEXTO, fontVariantNumeric: 'tabular-nums slashed-zero', fontWeight: 800 }}>{resultado ? `${resultado.pos}º · ${fmt(resultado.finalMs)}` : '—'}</Typography>
              </Box>
            );
          })}
        </Box>
      </FichaDesglose>
    );
  };
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <BotonVolver onClick={onVolver} />
          <Typography variant="h4">Clasificación general</Typography>
        </Box>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Suma de tiempos finales, con detenciones descontadas y disciplina aplicada. Los equipos con más pruebas completadas van primero.
      </Typography>
      {!clas.general.length ? (
        <Vacio icono={<FlagOutlinedIcon />}>Aún no hay tiempos registrados.</Vacio>
      ) : (
        <>
          <Podio items={filasPodio} seleccionadoId={seleccionadoId} onSeleccionar={seleccionar} renderDetalle={renderDetalle} />
          <ClasificacionComplementaria items={filasClasificacion} ocultarIds={filasPodio.map((fila) => fila.id)} seleccionadoId={seleccionadoId} onSeleccionar={seleccionar} renderDetalle={renderDetalle} />
        </>
      )}
      {!!clas.puntosPlus.length && (
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 1 }}>Puntos Plus</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Reconocimientos espirituales registrados. No alteran tiempos ni posiciones.</Typography>
          <Stack direction="row" flexWrap="wrap" gap={.75}>{clas.puntosPlus.map((equipo) => <Chip key={equipo.equipoId} label={`${equipo.numero}. ${equipo.nombre} · +${equipo.puntos} pts`} color="primary" />)}</Stack>
        </Box>
      )}
    </Paper>
  );
}

function PruebaHistorico({ prueba, eventoId, logo, nombreEquipo, correcciones, onVolver }: {
  prueba: ClasificacionPrueba;
  eventoId: string;
  logo: LogoEquipo;
  nombreEquipo: (id: string) => string;
  correcciones?: CorreccionResultado[];
  onVolver: () => void;
}) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null);
  const filasClasificacion = prueba.filas.map((fila) => ({
    id: fila.equipoId,
    nombre: fila.nombre,
    logo: logo(fila.equipoId),
    tiempo: fmt(fila.finalMs),
    posicion: fila.pos,
    resumen: fila.penMs ? `Disciplina ${fmtSeg(fila.penMs)}` : undefined,
    metricas: [
      { etiqueta: 'Bruto', valor: fmt(fila.brutoMs) },
      { etiqueta: 'Detenciones', valor: fila.detencionesMs ? `−${fmt(fila.detencionesMs)}` : '—', color: fila.detencionesMs ? COLORS.detenido : undefined },
      { etiqueta: 'Disciplina', valor: fila.penMs ? fmtSeg(fila.penMs) : '—', color: fila.penMs > 0 ? COLORS.red : fila.penMs < 0 ? COLORS.green : undefined },
      { etiqueta: 'Descuento espiritual', valor: fila.descuentoEspiritualMs > 0 ? `−${fmtSegundos(fila.descuentoEspiritualMs)}` : '—', color: fila.descuentoEspiritualMs > 0 ? COLORS.green : undefined },
    ],
  }));
  const seleccionar = (equipoId: string) => setSeleccionadoId((actual) => actual === equipoId ? null : equipoId);
  const renderDetalle = (equipoId: string) => {
    const fila = prueba.filas.find((actual) => actual.equipoId === equipoId);
    if (!fila) return null;
    return (
      <FichaDesglose
        equipo={fila.nombre}
        onOcultar={() => setSeleccionadoId(null)}
        datos={[
          { etiqueta: 'Posición', valor: `${fila.pos}º`, color: COLORS.acento },
          { etiqueta: 'Pista', valor: fila.pista ? String(fila.pista) : '—' },
          { etiqueta: 'Salida', valor: fHora(fila.salidaAt) },
          { etiqueta: 'Llegada', valor: fHora(fila.llegadaAt) },
          { etiqueta: 'Tiempo bruto', valor: fmt(fila.brutoMs) },
          { etiqueta: 'Detenciones', valor: fila.detencionesMs ? `−${fmt(fila.detencionesMs)}` : '—', color: fila.detencionesMs ? COLORS.detenido : undefined },
          { etiqueta: 'Disciplina', valor: fila.penMs ? fmtSeg(fila.penMs) : 'Sin ajuste', color: fila.penMs > 0 ? COLORS.red : fila.penMs < 0 ? COLORS.green : undefined },
          { etiqueta: 'Puntos espirituales', valor: fila.puntosEspirituales ? String(fila.puntosEspirituales) : '—' },
          { etiqueta: 'Descuento espiritual', valor: fila.descuentoEspiritualMs > 0 ? `−${fmtSegundos(fila.descuentoEspiritualMs)}` : 'Sin descuento', color: fila.descuentoEspiritualMs > 0 ? COLORS.green : undefined },
          { etiqueta: 'Tiempo final', valor: fmt(fila.finalMs), color: COLORS.acento },
        ]}
      />
    );
  };
  return (
    <Paper sx={{ p: { xs: 1.5, sm: 2.5 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ mb: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <BotonVolver onClick={onVolver} />
          <Typography variant="h4">{prueba.nombre}</Typography>
        </Box>
        <Chip size="small" color={ESTADOS[prueba.estado].color} label={ESTADOS[prueba.estado].label} />
        <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=prueba&pruebaId=${prueba.id}`}>CSV</Button>
      </Stack>
      {!prueba.filas.length ? (
        <Vacio icono={<TimerOutlinedIcon />}>Sin tiempos en esta prueba.</Vacio>
      ) : (
        <>
          <Podio items={filasClasificacion} seleccionadoId={seleccionadoId} onSeleccionar={seleccionar} renderDetalle={renderDetalle} />
          <ClasificacionComplementaria items={filasClasificacion} ocultarIds={filasClasificacion.slice(0, 3).map((fila) => fila.id)} seleccionadoId={seleccionadoId} onSeleccionar={seleccionar} renderDetalle={renderDetalle} />
          {!!correcciones?.length && (
            <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ mb: 1 }}>Correcciones registradas</Typography>
              <Stack spacing={.75}>{correcciones.map((correccion) => <Typography key={correccion.id} variant="body2" color="text.secondary"><b>{nombreEquipo(correccion.equipoAId)}</b> ⇄ <b>{nombreEquipo(correccion.equipoBId)}</b> · {correccion.motivo} · {new Date(correccion.createdAt).toLocaleString('es-CO')} · {correccion.rol}</Typography>)}</Stack>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
}

export default function Resultados() {
  const { eventoId } = useParams<{ eventoId: string }>();
  const { rol } = useSesion();
  const { data: acceso, error: errorAcceso, isLoading: cargandoAcceso, mutate: mutarAcceso } = useSWR<AccesoHistorico>(
    rol === 'CRONO' ? '/api/auth/historico' : null,
    fetcher,
  );
  const autorizado = rol === 'ADMIN' || acceso?.autorizado === true;
  const { data: clas } = useClasificacion(autorizado ? eventoId : undefined, 5000);
  const { data: equipos } = useEquipos(eventoId);
  const [vista, setVista] = useState<VistaHistorico>('indice');
  const pr = clas?.pruebas.find((p) => p.id === vista);
  const { data: correcciones } = useSWR<CorreccionResultado[]>(
    autorizado && pr ? `/api/pruebas/${pr.id}/correcciones` : null,
    fetcher,
  );

  if (rol === 'CRONO' && !autorizado) {
    if (cargandoAcceso) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
    if (errorAcceso) return <Alert severity="error">No se pudo verificar el acceso al Histórico: {errorAcceso.message}</Alert>;
    if (acceso && !acceso.configurada) {
      return <Alert severity="warning">El administrador debe configurar la contraseña adicional del Histórico antes de que puedas acceder.</Alert>;
    }
    return <AccesoHistorico onAutorizado={() => mutarAcceso()} />;
  }
  if (!autorizado || !clas) return null;
  const logo = (id: string) => equipos?.find((e) => e.id === id)?.logo;
  const nombreEquipo = (id: string) => equipos?.find((equipo) => equipo.id === id)?.nombre ?? 'Equipo eliminado';

  return (
    <Box>
      <Paper sx={{ p: { xs: 1.5, sm: 2.5 }, mb: 2, borderColor: `${COLORS.acento}55` }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', sm: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
            <EmojiEventsOutlinedIcon sx={{ fontSize: 34, color: COLORS.acento }} />
            <Box>
              <Typography variant="h4">Histórico de resultados</Typography>
              <Typography variant="body2" color="text.secondary">Consulta cada prueba por separado o la clasificación acumulada.</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=general`}>General CSV</Button>
            <Button size="small" color="inherit" startIcon={<DownloadIcon />} href={`/api/eventos/${eventoId}/exportar?tipo=todas`}>Todas CSV</Button>
          </Stack>
        </Stack>
      </Paper>

      {vista === 'indice' ? (
        <IndiceHistorico clas={clas} onAbrirGeneral={() => setVista('general')} onAbrirPrueba={setVista} />
      ) : vista === 'general' ? (
        <GeneralHistorico clas={clas} logo={logo} onVolver={() => setVista('indice')} />
      ) : pr ? (
        <PruebaHistorico
          prueba={pr} eventoId={eventoId} logo={logo} nombreEquipo={nombreEquipo} correcciones={correcciones}
          onVolver={() => setVista('indice')}
        />
      ) : null}
    </Box>
  );
}

function AccesoHistorico({ onAutorizado }: { onAutorizado: () => Promise<unknown> }) {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const desbloquear = async (event: React.FormEvent) => {
    event.preventDefault();
    setEnviando(true);
    setError('');
    try {
      await api('/api/auth/historico', 'POST', { clave });
      setClave('');
      await onAutorizado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo validar la contraseña');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Paper component="form" onSubmit={desbloquear} sx={{ maxWidth: 480, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Stack spacing={2} alignItems="center">
        <LockOutlinedIcon color="primary" sx={{ fontSize: 36 }} />
        <Typography variant="h5" textAlign="center">Acceso al Histórico</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Ingresa la contraseña adicional que configuró el administrador para consultar los resultados.
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
        <TextField
          fullWidth
          autoFocus
          type="password"
          label="Contraseña del Histórico"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          autoComplete="current-password"
        />
        <Button type="submit" fullWidth variant="contained" disabled={!clave || enviando}>
          {enviando ? 'Verificando…' : 'Ver Histórico'}
        </Button>
      </Stack>
    </Paper>
  );
}
