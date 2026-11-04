import 'server-only';
import type { Prisma, TipoPunto } from '@prisma/client';
import { prisma } from './prisma';

export const RESPALDO_VERSION = 1;

/** Respaldo completo (todas las tablas, con IDs) */
export async function exportarTodo() {
  const eventos = await prisma.evento.findMany({
    orderBy: { anio: 'asc' },
    include: {
      pruebas: { include: { resultados: true, puntos: true } },
      equipos: { include: { participantes: true } },
    },
  });
  return { app: 'desafio-tolota', version: RESPALDO_VERSION, exportadoEn: new Date().toISOString(), eventos };
}

type Respaldo = Awaited<ReturnType<typeof exportarTodo>>;

/** Restaura un respaldo propio. Si un evento con el mismo ID existe, se reemplaza. */
export async function importarRespaldo(data: Respaldo) {
  let eventos = 0;
  await prisma.$transaction(
    async (tx) => {
      for (const ev of data.eventos) {
        const { pruebas, equipos, ...evData } = ev;
        await tx.evento.deleteMany({ where: { id: ev.id } });
        await tx.evento.create({ data: { ...evData, createdAt: new Date(evData.createdAt), updatedAt: new Date() } });
        for (const { participantes, ...e } of equipos) {
          await tx.equipo.create({ data: { ...e, eventoId: ev.id } });
          if (participantes.length) await tx.participante.createMany({ data: participantes });
        }
        for (const { resultados, puntos, ...p } of pruebas) {
          await tx.prueba.create({ data: { ...p, eventoId: ev.id } });
          if (resultados.length)
            await tx.resultado.createMany({
              data: resultados.map((r) => ({ ...r, detenciones: r.detenciones as Prisma.InputJsonValue })),
            });
          if (puntos.length) await tx.puntoDisciplina.createMany({ data: puntos });
        }
        eventos++;
      }
    },
    { timeout: 60_000 },
  );
  return { eventos };
}

// ─────────────────────────────────────────────────────────────
// Migración desde la versión HTML anterior (localStorage "dt_*")
// ─────────────────────────────────────────────────────────────
/* eslint-disable @typescript-eslint/no-explicit-any */
interface Legacy {
  equipos?: any[];
  participantes?: any[];
  historico?: any[];
  disciplina?: any[];
  eventos?: any[];
}

export function esLegacy(d: any): boolean {
  if (!d || typeof d !== 'object' || Array.isArray(d.eventos?.[0]?.equipos)) return false;
  return ['dt_equipos', 'dt_historico', 'equipos', 'historico'].some((k) => k in d);
}

function normalizarLegacy(d: any): Legacy {
  const g = (k: string) => d['dt_' + k] ?? d[k] ?? [];
  return {
    equipos: g('equipos'),
    participantes: g('participantes'),
    historico: g('historico'),
    disciplina: g('disciplina'),
    eventos: g('eventos'),
  };
}

const TIPO: Record<string, TipoPunto> = { l: 'LEVE', m: 'MEDIA', g: 'GRAVE', p: 'POSITIVO' };

export async function importarLegacy(raw: any) {
  const L = normalizarLegacy(raw);
  const anios = new Set<number>();
  L.equipos!.forEach((e) => anios.add(parseInt(e.ano) || 2026));
  L.historico!.forEach((h) => anios.add(parseInt(h.anio) || 2026));
  L.eventos!.forEach((e) => anios.add(parseInt(e.anio)));

  const resumen = { eventos: 0, pruebas: 0, equipos: 0, participantes: 0, resultados: 0, puntos: 0, omitidos: 0 };

  await prisma.$transaction(
    async (tx) => {
      const pruebaMap = new Map<string, { id: string; eventoId: string }>(); // id legacy -> nuevo

      for (const anio of [...anios].filter(Boolean).sort()) {
        const cfg = L.eventos!.find((e) => parseInt(e.anio) === anio);
        const hs = L.historico!.filter((h) => (parseInt(h.anio) || 2026) === anio).sort((a, b) => a.ts - b.ts);
        const ev = await tx.evento.create({
          data: {
            anio,
            nombre: cfg?.nombre || hs[0]?.eventoNombre || `Desafío Tolotá ${anio}`,
            logo: cfg?.logo || hs[0]?.eventoLogo || null,
          },
        });
        resumen.eventos++;

        // Pruebas: configuración + las guardadas en histórico
        const defs: { id: string; nombre: string }[] = [...(cfg?.pruebas ?? [])];
        for (const h of hs) if (!defs.some((p) => p.id === h.id)) defs.push({ id: h.id, nombre: h.nombre });
        for (const [i, p] of defs.entries()) {
          const h = hs.find((x) => x.id === p.id);
          const nueva = await tx.prueba.create({
            data: { eventoId: ev.id, nombre: p.nombre || `Prueba ${i + 1}`, posicion: i, estado: h ? 'FINALIZADA' : 'PENDIENTE' },
          });
          pruebaMap.set(p.id, { id: nueva.id, eventoId: ev.id });
          resumen.pruebas++;
        }

        // Equipos del año (+ los que aparezcan en resultados aunque no existan)
        const eqMap = new Map<string, string>(); // nombre -> id
        const crearEquipo = async (nombre: string, numero: number | null, capitan?: string, logo?: string) => {
          if (eqMap.has(nombre)) return eqMap.get(nombre)!;
          const e = await tx.equipo.create({
            data: { eventoId: ev.id, nombre, numero: numero ?? eqMap.size + 1, capitan: capitan || null, logo: logo || null },
          });
          eqMap.set(nombre, e.id);
          resumen.equipos++;
          return e.id;
        };
        const eqsAnio = L.equipos!.filter((e) => (parseInt(e.ano) || 2026) === anio && e.nombre);
        for (const e of eqsAnio) await crearEquipo(e.nombre, parseInt(e.num) || null, e.capitan, e.logo);

        // Participantes: fichas completas + integrantes sin ficha
        for (const e of eqsAnio) {
          const eqId = eqMap.get(e.nombre)!;
          const fichas = L.participantes!.filter((p) => p.equipoNombre === e.nombre && (parseInt(p.ano) || 2026) === anio);
          const nombres = new Set<string>();
          for (const p of fichas) {
            await tx.participante.create({
              data: {
                equipoId: eqId,
                nombre: p.nombre,
                fechaNacimiento: p.fnac || null,
                telefono: p.telefono || null,
                email: p.email || null,
                residencia: p.residencia || null,
                profesion: p.profesion || null,
                contactoNombre: p.contactoNombre || null,
                contactoParentesco: p.contactoParentesco || null,
                contactoTelefono: p.contactoTel || null,
                tipoSangre: p.sangre || null,
                alergias: p.alergias || null,
                enfermedades: p.enfermedades || null,
                medicamentos: p.medicamentos || null,
                limitaciones: p.limitaciones || null,
                observaciones: p.observaciones || null,
              },
            });
            nombres.add(String(p.nombre).toLowerCase());
            resumen.participantes++;
          }
          const sinFicha = (e.integrantes ?? []).filter((n: string) => n && !nombres.has(n.toLowerCase()));
          if (sinFicha.length) {
            await tx.participante.createMany({ data: sinFicha.map((nombre: string) => ({ equipoId: eqId, nombre })) });
            resumen.participantes += sinFicha.length;
          }
        }

        // Resultados
        for (const h of hs) {
          const pr = pruebaMap.get(h.id)!;
          for (const r of h.resultados ?? []) {
            if (!r.equipo) continue;
            const eqId = await crearEquipo(r.equipo, null, r.capitan);
            const lleg = r.lTs || r.ts || h.ts;
            const sal = r.sTs || (lleg ? lleg - (r.bruto || 0) : h.ts);
            await tx.resultado.upsert({
              where: { pruebaId_equipoId: { pruebaId: pr.id, equipoId: eqId } },
              create: {
                pruebaId: pr.id,
                equipoId: eqId,
                salidaAt: new Date(sal),
                llegadaAt: new Date(lleg),
                brutoMs: Math.round(r.bruto || 0),
                detencionesMs: Math.round(r.descDet || 0),
                detenciones: (r.detenciones ?? []) as Prisma.InputJsonValue,
              },
              update: {},
            });
            resumen.resultados++;
          }
        }

        // Disciplina: sólo los puntos asociados a una prueba conocida de este año
        for (const d of L.disciplina!) {
          const pr = pruebaMap.get(d.pruebaId);
          if (!pr || pr.eventoId !== ev.id) continue;
          const eqId = eqMap.get(d.equipoNombre);
          if (!eqId || !TIPO[d.tipo]) continue;
          let participanteId: string | null = null;
          if (d.aplica && d.aplica !== 'equipo') {
            const p = await tx.participante.findFirst({ where: { equipoId: eqId, nombre: d.aplica }, select: { id: true } });
            participanteId = p?.id ?? null;
          }
          await tx.puntoDisciplina.create({
            data: {
              pruebaId: pr.id,
              equipoId: eqId,
              participanteId,
              tipo: TIPO[d.tipo],
              descripcion: d.desc || null,
              hora: d.hora || null,
              createdAt: d.ts ? new Date(d.ts) : undefined,
            },
          });
          resumen.puntos++;
        }
      }
      resumen.omitidos = L.disciplina!.filter((d) => !pruebaMap.has(d.pruebaId)).length;
    },
    { timeout: 120_000 },
  );
  return resumen;
}
