import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularClasificacion, valorPunto } from '../src/lib/scoring';
import { aplicarPatron, ordenEfectivo } from '../src/lib/orden';
import { fmt, fmtSeg, nombrePropio, nombreYApellido } from '../src/lib/format';
import { intercambiarEnPistas, intercambiarEnSet } from '../src/lib/intercambio';
import { htmlOrdenSalida } from '../src/lib/imprimir';
import { crearToken, crearTokenHistorico, leerToken, leerTokenHistorico, permitidoCrono } from '../src/lib/sesion';
import { asignacionesLibres } from '../src/lib/asignacion';
import { accionDeBoton } from '../src/lib/gamepad';
import { RUTAS, SECCIONES, esRutaPrivada, eventoDeRuta, rutaEdicion } from '../src/lib/rutas';
import { VUELTA_MS, numeroVuelta, progresoVuelta } from '../src/lib/reloj';
import { equiposEnPistas } from '../src/lib/reservas';
import { BLOQUEO_MS, MAX_FALLOS, crearLimite } from '../src/lib/limiteIntentos';
import { EDICIONES, EVENTO, codigoEdicion, cuentaRegresiva, tituloCategoria, tituloEdicion } from '../src/lib/evento';

const cfg = { penLeveMs: 300, penMediaMs: 500, penGraveMs: 1000, bonPositivoMs: 100 };
const evento = { id: 'ev', nombre: 'Desafío', anio: 2026, descuentoEspiritualPorPuntoMs: 0.02, ...cfg };
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

test('puntos espirituales descuentan el tiempo configurado solo al equipo y prueba asignados', () => {
  const c = calcularClasificacion({
    evento, pruebas, equipos,
    resultados: [r('1', 'p1', 'a', 10_000), r('2', 'p1', 'b', 10_000), r('3', 'p2', 'a', 20_000)],
    puntos: [],
    puntajesEspirituales: [
      { pruebaId: 'p1', equipoId: 'a', puntos: 8 },
      { pruebaId: 'p1', equipoId: 'b', puntos: 3 },
      { pruebaId: 'p2', equipoId: 'a', puntos: 100 },
    ],
  });
  const primera = c.pruebas.find((p) => p.id === 'p1')!;
  const segunda = c.pruebas.find((p) => p.id === 'p2')!;
  assert.deepEqual(primera.filas.map((f) => [f.equipoId, f.puntosEspirituales, f.descuentoEspiritualMs, f.finalMs]), [
    ['a', 8, 0.16, 9_999.84],
    ['b', 3, 0.06, 9_999.94],
  ]);
  assert.deepEqual([segunda.filas[0].puntosEspirituales, segunda.filas[0].descuentoEspiritualMs, segunda.filas[0].finalMs], [
    100, 2, 19_998,
  ]);
  assert.equal(c.general.find((f) => f.equipoId === 'a')?.descuentoEspiritualMs, 2.16);
});

test('descuento espiritual configurable también limita el resultado a cero', () => {
  const c = calcularClasificacion({
    evento: { ...evento, descuentoEspiritualPorPuntoMs: 1 },
    pruebas, equipos,
    resultados: [r('1', 'p1', 'a', 50)],
    puntos: [],
    puntajesEspirituales: [{ pruebaId: 'p1', equipoId: 'a', puntos: 100 }],
  });
  assert.equal(c.pruebas[0].filas[0].descuentoEspiritualMs, 100);
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
  assert.ok(html.includes('Equipos en competencia'));
  assert.ok(html.includes('2</span>'));
  assert.ok(html.includes('Hora de salida'));
  assert.ok(html.includes('class="order"'));
  assert.ok(html.includes('print-color-adjust: exact'));
  const vacio = htmlOrdenSalida({ evento: 'Desafío 2026', prueba: 'Muro', equipos: [] });
  assert.ok(vacio.includes('No hay equipos en el orden de salida.'));
});

// ── Sesión y permisos por rol ──────────────────────────────────

test('sesión: token válido, alterado y vencido', async () => {
  process.env.AUTH_SECRET = 'secreto-de-prueba';
  const t = await crearToken('CRONO');
  const historico = await crearTokenHistorico();
  assert.equal(await leerToken(t), 'CRONO');
  assert.equal(await leerTokenHistorico(historico), true);
  assert.equal(await leerTokenHistorico(historico, Date.now() + 3 * 3600 * 1000), false);
  // Cambiar el rol invalida la firma
  assert.equal(await leerToken(t.replace(/^CRONO/, 'ADMIN')), null);
  // Vence a las 12 horas
  assert.equal(await leerToken(t, Date.now() + 13 * 3600 * 1000), null);
  // Firmado con otro secreto: no sirve
  process.env.AUTH_SECRET = 'otro';
  assert.equal(await leerToken(t), null);
  assert.equal(await leerTokenHistorico(historico), false);
  assert.equal(await leerToken('basura'), null);
  assert.equal(await leerToken(undefined), null);
});

test('permisos del cronometrador', () => {
  const q = (s = '') => new URLSearchParams(s);
  const si = (m: string, r: string, s?: string, historico = false) => assert.equal(permitidoCrono(m, r, q(s), historico), true, `${m} ${r}`);
  const no = (m: string, r: string, s?: string, historico = false) => assert.equal(permitidoCrono(m, r, q(s), historico), false, `${m} ${r}`);
  // Puede: inicio, cronómetro y lo que esta pantalla necesita para operar
  si('GET', '/cronometro');
  si('GET', '/cronometro/eventos/ev1/cronometro');
  si('GET', '/cronometro/eventos/ev1/resultados'); // la página solo muestra la puerta de contraseña
  si('GET', '/api/eventos/ev1/equipos');
  si('PUT', '/api/pruebas/p1/resultados');
  si('POST', '/api/pruebas/p1/resultados/intercambiar');
  si('DELETE', '/api/resultados/r1');
  si('GET', '/api/eventos/ev1/clasificacion');
  si('GET', '/api/auth/historico');
  si('POST', '/api/auth/historico');
  si('GET', '/api/eventos/ev1/exportar', 'tipo=general', true);
  si('GET', '/api/auth/sesion');
  si('POST', '/api/auth/logout');
  // Sin clave adicional no puede: histórico ni exportaciones, fichas, equipos, disciplina, configuración, respaldo, contraseñas
  no('GET', '/cronometro/eventos/ev1/equipos');
  no('GET', '/cronometro/eventos/ev1/disciplina');
  no('GET', '/cronometro/eventos/ev1');
  no('GET', '/cronometro/respaldo');
  no('GET', '/api/eventos/ev1/exportar', 'tipo=general');
  no('GET', '/api/eventos/ev1/exportar', 'tipo=participantes');
  no('GET', '/api/eventos/ev1/exportar', 'tipo=participantes', true);
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

test('rutas: el sitio es público y el sistema privado', () => {
  for (const r of ['/', '/historia', '/ediciones', '/galeria', '/login', '/cronometros-viejos']) assert.equal(esRutaPrivada(r), false, r);
  for (const r of ['/cronometro', '/cronometro/respaldo', RUTAS.evento('ev1', 'cronometro'), '/api/eventos']) assert.equal(esRutaPrivada(r), true, r);
  assert.equal(RUTAS.evento('ev1'), '/cronometro/eventos/ev1');
  assert.deepEqual(eventoDeRuta('/cronometro/eventos/ev1/equipos'), { id: 'ev1', seccion: 'equipos' });
  assert.deepEqual(eventoDeRuta('/cronometro/eventos/ev1'), { id: 'ev1', seccion: '' });
  assert.equal(eventoDeRuta('/cronometro'), null);
  // Cada sección del menú tiene su propia ruta, sin repetirse
  assert.equal(new Set(SECCIONES.map((s) => s.ruta)).size, SECCIONES.length);
});

test('evento: cuenta regresiva y ediciones', () => {
  const objetivo = EVENTO.inicio.getTime();
  const c = cuentaRegresiva(objetivo - (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000, objetivo);
  assert.deepEqual(c, { dias: 2, horas: 3, minutos: 4, segundos: 5, terminada: false });
  assert.equal(cuentaRegresiva(objetivo + 1000, objetivo).terminada, true);
  // 15 de diciembre de 2026, 12:00 m. en Colombia (recepción) = 17:00 UTC
  assert.equal(EVENTO.inicio.toISOString(), '2026-12-15T17:00:00.000Z');
  assert.equal(tituloEdicion(EDICIONES[5]), "Desafío X6: Ge'ullah");
  assert.equal(tituloEdicion(EDICIONES[1]), 'Desafío X2');
  assert.equal(EDICIONES.filter((e) => e.proxima).length, 1);
  // El código de la edición sale del año: los conocidos se respetan y cada evento nuevo suma uno
  assert.equal(codigoEdicion(2026, [2024, 2025, 2026]), 'X6');
  assert.equal(codigoEdicion(2027, [2026, 2027]), 'X7');
  assert.equal(codigoEdicion(2028, [2027, 2028]), 'X8');
  assert.equal(codigoEdicion(2029, [2029]), 'X7'); // sin eventos 2027–2028 en la base, 2029 es la siguiente
  assert.equal(tituloEdicion({ codigo: 'X7', nombre: null }), 'Desafío X7');
  assert.equal(tituloCategoria('X2', 'La Travesía'), 'Desafío X2: La Travesía');
  assert.equal(tituloCategoria('X4', '  '), 'Desafío X4: (nombre)');
  assert.equal(tituloCategoria('X4', null), 'Desafío X4: (nombre)');
});


test('reloj: vueltas de 30 min', () => {
  // 15 min = media vuelta; 45 min = media vuelta de la segunda
  assert.equal(progresoVuelta(VUELTA_MS / 2), 0.5);
  assert.equal(progresoVuelta(VUELTA_MS * 1.5), 0.5);
  assert.equal(numeroVuelta(0), 1);
  assert.equal(numeroVuelta(VUELTA_MS + 1), 2);
});

test('nombreYApellido: primer nombre y primer apellido', () => {

  assert.deepEqual(nombreYApellido('Juan Pérez'), { nombre: 'Juan', apellido: 'Pérez' });
  assert.deepEqual(nombreYApellido('Juan Pérez Gómez'), { nombre: 'Juan', apellido: 'Pérez' });
  assert.deepEqual(nombreYApellido('Ana María Rodríguez Gómez'), { nombre: 'Ana', apellido: 'Rodríguez' });
  assert.deepEqual(nombreYApellido('Luis de la Cruz'), { nombre: 'Luis', apellido: 'de la Cruz' });
  assert.deepEqual(nombreYApellido('Pedro'), { nombre: '', apellido: 'Pedro' });
  assert.deepEqual(nombreYApellido(null), { nombre: '', apellido: '' });
});

test('rutas: la edición de este año es la primera sección y es pública', () => {
  assert.equal(rutaEdicion(2026), '/desafio-2026');
  assert.equal(SECCIONES[0].ruta, rutaEdicion(EVENTO.inicio.getFullYear()));
  assert.equal(esRutaPrivada('/desafio-2026'), false);
  assert.equal(esRutaPrivada('/api/publico/resultados/abc'), true); // la API sigue bajo el middleware, que la deja pasar
});

test('reservas: solo cuentan las pistas con equipo cargado', () => {
  const lanes = [
    { equipoId: 'a', state: 'run' }, { equipoId: null, state: 'idle' }, { equipoId: 'b', state: 'rdy' }, { equipoId: 'c', state: 'idle' },
  ];
  assert.deepEqual(equiposEnPistas(lanes), [{ equipoId: 'a', pista: 1 }, { equipoId: 'b', pista: 3 }]);
});

test('límite de intentos: 5 fallos bloquean 5 minutos y un acierto limpia', () => {
  const l = crearLimite();
  for (let i = 0; i < MAX_FALLOS - 1; i++) l.fallo('ip', 1000);
  assert.equal(l.espera('ip', 1000), 0);
  l.fallo('ip', 1000);
  assert.equal(l.espera('ip', 1000), BLOQUEO_MS);
  assert.equal(l.espera('ip', 1000 + BLOQUEO_MS), 0);
  l.acierto('ip');
  l.fallo('ip', 2000);
  assert.equal(l.espera('ip', 2000), 0);
});

test('nombrePropio: mayúscula inicial y partículas en minúscula', () => {
  assert.equal(nombrePropio('jhon NUÑEZ'), 'Jhon Nuñez');
  assert.equal(nombrePropio('luis DE LA cruz'), 'Luis de la Cruz');
  assert.equal(nombrePropio('  ana   maría '), 'Ana María');
  assert.equal(nombrePropio(null), '');
});
