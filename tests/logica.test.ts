import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularClasificacion, valorPunto } from '../src/lib/scoring';
import { aplicarPatron, ordenEfectivo } from '../src/lib/orden';
import { fmt, fmtSeg } from '../src/lib/format';

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
  assert.equal(fmt(0), '00:00.00');
  assert.equal(fmt(61_234), '01:01.23');
  assert.equal(fmt(3_725_010), '1:02:05.01');
  assert.equal(fmt(-5), '00:00.00');
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
