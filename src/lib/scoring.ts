// Cálculo de tiempos y clasificaciones. Funciones puras (sin BD) para poder probarlas.
import type {
  Clasificacion,
  Detencion,
  EstadoPrueba,
  FilaGeneral,
  FilaPrueba,
  PenalizacionCfg,
  TipoPunto,
} from './types';

export function valorPunto(tipo: TipoPunto, cfg: PenalizacionCfg): number {
  switch (tipo) {
    case 'LEVE':
      return cfg.penLeveMs;
    case 'MEDIA':
      return cfg.penMediaMs;
    case 'GRAVE':
      return cfg.penGraveMs;
    case 'POSITIVO':
      return -cfg.bonPositivoMs;
  }
}

export function sumaDetenciones(d: Detencion[]): number {
  return d.reduce((a, x) => a + (x.dur || 0), 0);
}

/** Asigna posiciones con empates (1, 2, 2, 4…) a una lista ya ordenada. */
function posiciones<T>(lista: T[], clave: (x: T) => string): number[] {
  const out: number[] = [];
  lista.forEach((x, i) => {
    out.push(i > 0 && clave(x) === clave(lista[i - 1]) ? out[i - 1] : i + 1);
  });
  return out;
}

interface Input {
  evento: { id: string; nombre: string; anio: number; descuentoEspiritualPorPuntoMs?: number } & PenalizacionCfg;
  pruebas: { id: string; nombre: string; estado: EstadoPrueba; posicion: number }[];
  equipos: { id: string; numero: number; nombre: string }[];
  resultados: {
    id: string;
    pruebaId: string;
    equipoId: string;
    pista: number | null;
    salidaAt: Date | string;
    llegadaAt: Date | string;
    brutoMs: number;
    detencionesMs: number;
    detenciones: unknown;
  }[];
  puntos: { pruebaId: string; equipoId: string; tipo: TipoPunto }[];
  puntajesEspirituales?: { pruebaId: string; equipoId: string; puntos: number }[];
}

export function calcularClasificacion(input: Input): Clasificacion {
  const { evento } = input;
  const eqMap = new Map(input.equipos.map((e) => [e.id, e]));

  // penalización por prueba+equipo
  const pen = new Map<string, number>();
  for (const p of input.puntos) {
    const k = `${p.pruebaId}|${p.equipoId}`;
    pen.set(k, (pen.get(k) || 0) + valorPunto(p.tipo, evento));
  }
  const puntosEspirituales = new Map<string, number>();
  for (const p of input.puntajesEspirituales ?? []) {
    const k = `${p.pruebaId}|${p.equipoId}`;
    puntosEspirituales.set(k, (puntosEspirituales.get(k) || 0) + p.puntos);
  }
  const descuentoPorPunto = input.evento.descuentoEspiritualPorPuntoMs ?? 0.02;

  const pruebasOrd = [...input.pruebas].sort((a, b) => a.posicion - b.posicion);

  const pruebas = pruebasOrd.map((pr) => {
    const filas: FilaPrueba[] = input.resultados
      .filter((r) => r.pruebaId === pr.id && eqMap.has(r.equipoId))
      .map((r) => {
        const eq = eqMap.get(r.equipoId)!;
        const detenciones = Array.isArray(r.detenciones) ? (r.detenciones as Detencion[]) : [];
        const netoMs = Math.max(0, r.brutoMs - r.detencionesMs);
        const penMs = pen.get(`${pr.id}|${r.equipoId}`) || 0;
        const puntosEspiritualesEquipo = puntosEspirituales.get(`${pr.id}|${r.equipoId}`) || 0;
        const descuentoEspiritualMs = Math.round(puntosEspiritualesEquipo * descuentoPorPunto * 1000) / 1000;
        return {
          pos: 0,
          equipoId: r.equipoId,
          numero: eq.numero,
          nombre: eq.nombre,
          resultadoId: r.id,
          pista: r.pista,
          salidaAt: new Date(r.salidaAt).toISOString(),
          llegadaAt: new Date(r.llegadaAt).toISOString(),
          brutoMs: r.brutoMs,
          detencionesMs: r.detencionesMs,
          detenciones,
          penMs,
          puntosEspirituales: puntosEspiritualesEquipo,
          descuentoEspiritualMs,
          netoMs,
          finalMs: Math.max(0, Math.round((netoMs + penMs - descuentoEspiritualMs) * 1000) / 1000),
        };
      })
      .sort((a, b) => a.finalMs - b.finalMs || a.numero - b.numero);
    const pos = posiciones(filas, (f) => f.finalMs.toFixed(3));
    filas.forEach((f, i) => (f.pos = pos[i]));
    return { id: pr.id, nombre: pr.nombre, estado: pr.estado, posicion: pr.posicion, filas };
  });

  // General acumulada: suma de tiempos finales. Más pruebas completadas va primero.
  const acc = new Map<string, FilaGeneral>();
  for (const pr of pruebas) {
    for (const f of pr.filas) {
      let g = acc.get(f.equipoId);
      if (!g) {
        g = {
          pos: 0, equipoId: f.equipoId, numero: f.numero, nombre: f.nombre,
          completadas: 0, totalMs: 0, penMs: 0, descuentoEspiritualMs: 0, porPrueba: {},
        };
        acc.set(f.equipoId, g);
      }
      g.completadas++;
      g.totalMs = Math.round((g.totalMs + f.finalMs) * 1000) / 1000;
      g.penMs += f.penMs;
      g.descuentoEspiritualMs = Math.round((g.descuentoEspiritualMs + f.descuentoEspiritualMs) * 1000) / 1000;
      g.porPrueba[pr.id] = { finalMs: f.finalMs, pos: f.pos };
    }
  }
  const general = [...acc.values()].sort(
    (a, b) => b.completadas - a.completadas || a.totalMs - b.totalMs || a.numero - b.numero,
  );
  const gpos = posiciones(general, (g) => `${g.completadas}|${g.totalMs}`);
  general.forEach((g, i) => (g.pos = gpos[i]));

  return {
    evento: { id: evento.id, nombre: evento.nombre, anio: evento.anio },
    totalPruebas: pruebas.length,
    pruebas,
    general,
  };
}
