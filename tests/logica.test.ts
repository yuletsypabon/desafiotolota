import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularClasificacion, valorPunto } from '../src/lib/scoring';
import { aplicarPatron, ordenEfectivo } from '../src/lib/orden';
import { fmt, fmtSeg } from '../src/lib/format';
import { intercambiarEnPistas, intercambiarEnSet } from '../src/lib/intercambio';
import { htmlOrdenSalida } from '../src/lib/imprimir';
import { crearToken, leerToken, permitidoCrono } from '../src/lib/sesion';
import { asignacionesLibres } from '../src/lib/asignacion';
import { accionDeBoton } from '../src/lib/gamepad';

const cfg = { penLeveMs: 300, penMediaMs: 500, penGraveMs: 1000, bonPositivoMs: 100 };
const evento = { id: 'ev', nombre: 'Desafío', anio: 2026, ...cfg };
const equipos = [
  { id: 'a', numero: 1, nombre: 'Águila' },
  { id: 'b', numero: 2, nombre: 'Toro' },
  { id: 'c', numero: 3, nombre: 'León' },
];
const pruebas = [
  { id: 'p2', nombre: 'Segunda', estado: 'PENDIENTE' as const, posicion: 1 },
  { id: 'p1', nombre: 'Primera', estado: 'FINALIZADA' as const, posicion: 0 },
];
const r = (id: string, pruebaId: string, equipoId: string, brutoMs: number, detencionesMs = 0) => ({
  id, pruebaId, equipoId, pista: 1, salidaAt: new Date(0), llegadaAt: new Date(brutoMs), brutoMs, detencionesMs,
  detenciones: detencionesMs ? [{ num: 1, dur: detencionesMs }] : [],
});

test('formato de tiempo', () => {
  assert.equal(fmt(0), '00:00:00:00');
  assert.equal(fmt(61_234), '00:01:01:23');
  assert.equal(fmt(3_725_010), '01:02:05:01');
  assert.equal(fmt(-5), '00:00:00:00');
  assert.equal(fmt(22_371), '00:00:22:37'); // trunca, no redondea
  assert.equal(fmtSeg(300), '+0.3s');
  assert.equal(fmtSeg(-100), '-0.1s');
});

test('valor de puntos de disciplina', () => {
  assert.equal(valorPunto('LEVE', cfg), 300);
  assert.equal(valorPunto('GRAVE', cfg), 1000);
  assert.equal(valorPunto('POSITIVO', cfg), -100);
});

test('clasificación por prueba: detenciones, disciplina y empates', () => {
  const c = calcularClasificacion({
    evento, pruebas, equipos,
    resultados: [
      r('1', 'p1', 'a', 60_000, 5_000), // neto 55 000
      r('2', 'p1', 'b', 56_000), // neto 56 000, -100 positivo → 55 900
      r('3', 'p1', 'c', 55_000), // +300 leve +600 (2 leves) → 55 600
    ],
    puntos: [
      { pruebaId: 'p1', equipoId: 'b', tipo: 'POSITIVO' },
      { pruebaId: 'p1', equipoId: 'c', tipo: 'LEVE' },
      { pruebaId: 'p1', equipoId: 'c', tipo: 'LEVE' },
      { pruebaId: 'p2', equipoId: 'a', tipo: 'GRAVE' }, // otra prueba: no afecta p1
    ],
  });
  assert.deepEqual(c.pruebas.map((p) => p.id), ['p1', 'p2'], 'ordenadas por posición');
  const f = c.pruebas[0].filas;
  assert.deepEqual(f.map((x) => [x.equipoId, x.finalMs, x.pos]), [
    ['a', 55_000, 1],
    ['c', 55_600, 2],
    ['b', 55_900, 3],
  ]);
  assert.equal(f[0].netoMs, 55_000);
  assert.equal(f[1].penMs, 600);
});

test('empates comparten posición', () => {
  const c = calcularClasificacion({
    evento, pruebas, equipos,
    resultados: [r('1', 'p1', 'a', 50_000), r('2', 'p1', 'b', 50_000), r('3', 'p1', 'c', 51_000)],
    puntos: [],
  });
  assert.deepEqual(c.pruebas[0].filas.map((x) => x.pos), [1, 1, 3]);
});

test('general acumulada: más pruebas primero, luego menor total', () => {
  const c = calcularClasificacion({
    evento, pruebas, equipos,
    resultados: [
      r('1', 'p1', 'a', 50_000),
      r('2', 'p2', 'a', 70_000), // a: 2 pruebas, 120 000
      r('3', 'p1', 'b', 40_000),
      r('4', 'p2', 'b', 90_000), // b: 2 pruebas, 130 000
      r('5', 'p1', 'c', 10_000), // c: 1 prueba (más rápido, pero incompleto)
    ],
    puntos: [],
  });
  assert.deepEqual(c.general.map((g) => [g.equipoId, g.completadas, g.totalMs, g.pos]), [
    ['a', 2, 120_000, 1],
    ['b', 2, 130_000, 2],
    ['c', 1, 10_000, 3],
  ]);
  assert.equal(c.general[0].porPrueba.p2.pos, 1);
  assert.equal(c.totalPruebas, 2);
});

test('el tiempo final nunca es negativo', () => {
  const c = calcularClasificacion({
    evento, pruebas, equipos,
    resultados: [r('1', 'p1', 'a', 50, 0)],
    puntos: [{ pruebaId: 'p1', equipoId: 'a', tipo: 'POSITIVO' }],
  });
  assert.equal(c.pruebas[0].filas[0].finalMs, 0);
});

test('patrones de orden de salida', () => {
  const b = [1, 2, 3, 4, 5, 6];
  assert.deepEqual(aplicarPatron(b, 'normal'), [1, 2, 3, 4, 5, 6]);
  assert.deepEqual(aplicarPatron(b, 'inv'), [6, 5, 4, 3, 2, 1]);
  assert.deepEqual(aplicarPatron(b, 'mitad'), [4, 5, 6, 1, 2, 3]);
  assert.deepEqual(aplicarPatron(b, 'inter'), [1, 3, 5, 2, 4, 6]);
  for (const n of [0, 1, 2, 5, 6, 7]) {
    const base = Array.from({ length: n }, (_, i) => i);
    const o = aplicarPatron(base, 'centro');
    assert.equal(o.length, n, `centro conserva todos (n=${n})`);
    assert.deepEqual([...o].sort((x, y) => x - y), base);
  }
});

test('orden efectivo agrega equipos nuevos al final por número', () => {
  const eqs = [
    { id: 'x', numero: 3 },
    { id: 'y', numero: 1 },
    { id: 'z', numero: 2 },
  ];
  assert.deepEqual(ordenEfectivo(['z', 'borrado', 'x'], eqs).map((e) => e.id), ['z', 'x', 'y']);
  assert.deepEqual(ordenEfectivo([], eqs).map((e) => e.id), ['y', 'z', 'x']);
});

// ── Corregir pista ─────────────────────────────────────────────

test('corregir pista: intercambia equipos entre pistas y conserva tiempos', () => {
  const lanes = [
    { equipoId: 'a', brutoMs: 1000 },
    { equipoId: 'b', brutoMs: 2000 },
    { equipoId: null, brutoMs: null },
    { equipoId: 'c', brutoMs: 3000 },
  ];
  const r = intercambiarEnPistas(lanes, 'a', 'b');
  assert.deepEqual(r.map((l) => [l.equipoId, l.brutoMs]), [['b', 1000], ['a', 2000], [null, null], ['c', 3000]]);
  // con un equipo que no está en pista (tiempo ya guardado): solo cambia la pista que lo tiene
  const r2 = intercambiarEnPistas(lanes, 'c', 'z');
  assert.equal(r2[3].equipoId, 'z');
  assert.equal(r2[3].brutoMs, 3000);
});

test('corregir pista: intercambia la pertenencia en el conjunto de finalizados', () => {
  assert.deepEqual([...intercambiarEnSet(new Set(['a', 'x']), 'a', 'b')].sort(), ['b', 'x']);
  assert.deepEqual([...intercambiarEnSet(new Set(['a', 'b']), 'a', 'b')].sort(), ['a', 'b']);
  assert.deepEqual([...intercambiarEnSet(new Set(['x']), 'a', 'b')], ['x']);
});

test('orden aleatorio: es una permutación y depende del azar', () => {
  const b = [1, 2, 3, 4, 5, 6];
  const o = aplicarPatron(b, 'azar');
  assert.deepEqual(o.slice().sort(), b);
  assert.deepEqual(b, [1, 2, 3, 4, 5, 6]); // no modifica la lista original
  // con un azar fijo el resultado es reproducible
  assert.deepEqual(aplicarPatron(b, 'azar', () => 0), [2, 3, 4, 5, 6, 1]);
});

// ── Hoja de orden de salida ────────────────────────────────────

test('hoja de orden: lista los equipos en orden y escapa el HTML', () => {
  const html = htmlOrdenSalida({
    evento: 'Desafío 2026',
    prueba: 'Muro',
    equipos: [
      { numero: 3, nombre: 'Halcones', capitan: 'Sofía' },
      { numero: 1, nombre: '<script>x</script>', capitan: null },
    ],
  });
  assert.ok(html.indexOf('Halcones') < html.indexOf('&lt;script&gt;x&lt;/script&gt;'));
  assert.ok(!html.includes('<script>x</script>'));
  assert.ok(html.includes('2 equipos'));
});

// ── Sesión y permisos por rol ──────────────────────────────────

test('sesión: token válido, alterado y vencido', async () => {
  process.env.AUTH_SECRET = 'secreto-de-prueba';
  const t = await crearToken('CRONO');
  assert.equal(await leerToken(t), 'CRONO');
  // Cambiar el rol invalida la firma
  assert.equal(await leerToken(t.replace(/^CRONO/, 'ADMIN')), null);
  // Vence a las 12 horas
  assert.equal(await leerToken(t, Date.now() + 13 * 3600 * 1000), null);
  // Firmado con otro secreto: no sirve
  process.env.AUTH_SECRET = 'otro';
  assert.equal(await leerToken(t), null);
  assert.equal(await leerToken('basura'), null);
  assert.equal(await leerToken(undefined), null);
});

test('permisos del cronometrador', () => {
  const q = (s = '') => new URLSearchParams(s);
  const si = (m: string, r: string, s?: string) => assert.equal(permitidoCrono(m, r, q(s)), true, `${m} ${r}`);
  const no = (m: string, r: string, s?: string) => assert.equal(permitidoCrono(m, r, q(s)), false, `${m} ${r}`);
  // Puede: inicio, cronómetro, resultados y lo que estas pantallas usan
  si('GET', '/');
  si('GET', '/eventos/ev1/cronometro');
  si('GET', '/eventos/ev1/resultados');
  si('GET', '/api/eventos/ev1/equipos');
  si('PUT', '/api/pruebas/p1/resultados');
  si('POST', '/api/pruebas/p1/resultados/intercambiar');
  si('DELETE', '/api/resultados/r1');
  si('GET', '/api/eventos/ev1/exportar', 'tipo=general');
  si('GET', '/api/auth/sesion');
  si('POST', '/api/auth/logout');
  // No puede: fichas, equipos, disciplina, configuración, respaldo, contraseñas
  no('GET', '/eventos/ev1/equipos');
  no('GET', '/eventos/ev1/disciplina');
  no('GET', '/eventos/ev1');
  no('GET', '/respaldo');
  no('GET', '/api/eventos/ev1/exportar', 'tipo=participantes');
  no('PATCH', '/api/participantes/x');
  no('POST', '/api/eventos/ev1/disciplina');
  no('DELETE', '/api/pruebas/p1');
  no('PATCH', '/api/eventos/ev1');
  no('GET', '/api/respaldo');
  no('POST', '/api/sincronizar');
  no('PUT', '/api/auth/claves');
});

test('asignación automática: llena las pistas libres en orden', () => {
  const libre = { equipoId: null, state: 'idle' };
  // Tres pistas libres, cuatro equipos en cola: entran los tres primeros
  assert.deepEqual(asignacionesLibres([libre, libre, libre], ['a', 'b', 'c', 'd']), [[0, 'a'], [1, 'b'], [2, 'c']]);
  // Pista 2 corriendo con a: la libre recibe el siguiente que no esté en pista
  assert.deepEqual(asignacionesLibres([libre, { equipoId: 'a', state: 'run' }], ['a', 'b']), [[0, 'b']]);
  // Sin equipos pendientes: no asigna nada
  assert.deepEqual(asignacionesLibres([libre, libre], []), []);
  // Más pistas que equipos: las sobrantes quedan libres
  assert.deepEqual(asignacionesLibres([libre, libre, libre], ['z']), [[0, 'z']]);
  // Ninguna pista libre
  assert.deepEqual(asignacionesLibres([{ equipoId: 'a', state: 'rdy' }], ['b']), []);
});

test('encoder: cada botón hace lo mismo que en la versión HTML', () => {
  // Botón 1: la pista seleccionada; sin selección, la pista 1
  assert.deepEqual(accionDeBoton(0, 3, 2), { tipo: 'accion', pista: 2 });
  assert.deepEqual(accionDeBoton(0, 3, null), { tipo: 'accion', pista: 0 });
  // Botones 2 y 3: pistas 2 y 3
  assert.deepEqual(accionDeBoton(1, 3, null), { tipo: 'accion', pista: 1 });
  assert.deepEqual(accionDeBoton(2, 3, null), { tipo: 'accion', pista: 2 });
  // Botón 4 solo si hay 4 pistas
  assert.equal(accionDeBoton(3, 3, null), null);
  assert.deepEqual(accionDeBoton(3, 4, null), { tipo: 'accion', pista: 3 });
  // Botones 5–7: detenido en pistas 1–3
  assert.deepEqual(accionDeBoton(4, 3, null), { tipo: 'detenido', pista: 0 });
  assert.deepEqual(accionDeBoton(6, 3, null), { tipo: 'detenido', pista: 2 });
  assert.equal(accionDeBoton(5, 1, null), null);
  assert.equal(accionDeBoton(9, 3, null), null);
});
