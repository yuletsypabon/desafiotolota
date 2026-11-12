import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CRONOGRAMA, DOCUMENTOS, EQUIPOS_EDICION, GRUPOS, INSCRIPCION, MODALIDADES, PILARES, PREGUNTAS, RETOS } from '../src/lib/contenido';
import { FOTOS } from '../src/lib/landing/fotos';
import { EVENTO } from '../src/lib/evento';

test('contenido: 21 equipos con nombre único y grupo válido', () => {
  assert.equal(EQUIPOS_EDICION.length, 21);
  assert.equal(new Set(EQUIPOS_EDICION.map((e) => e.nombre)).size, EQUIPOS_EDICION.length);
  const grupos = new Set<string>(GRUPOS.map((g) => g.id));
  for (const e of EQUIPOS_EDICION) assert.ok(grupos.has(e.grupo), e.nombre);
  // agrupar no pierde ni duplica equipos
});

test('contenido: cronograma de 6 días seguidos desde el inicio del evento', () => {
  assert.equal(CRONOGRAMA.length, EVENTO.diasCampamento);
  CRONOGRAMA.forEach((d, i) => {
    assert.equal(d.num, 15 + i, `día ${d.dia}`);
    assert.ok(d.actividades.length > 0);
    assert.ok(d.actividades.some((x) => x.destacada), `${d.dia} tiene al menos una actividad destacada`);
  });
});

test('contenido: modalidades, documentos e inscripción', () => {
  assert.deepEqual(MODALIDADES.slice(0, 2).map((m) => m.codigo), ['X2', 'X4']);
  assert.equal(DOCUMENTOS.length, 3);
  assert.equal(INSCRIPCION.pasos.length, 4);
});

test('contenido: portada con retos, pilares y preguntas', () => {
  assert.equal(RETOS.length, 3);
  for (const r of RETOS) assert.ok(r.foto in FOTOS, `la foto "${r.foto}" existe`);
  assert.deepEqual(PILARES.map((p) => p.nombre), ['Aventura', 'Espiritualidad', 'Conocimiento']);
  assert.ok(PREGUNTAS.length >= 3);
  for (const f of Object.values(FOTOS)) assert.ok(f.src === '' || f.src.startsWith('/fotos/'), f.src);
});
