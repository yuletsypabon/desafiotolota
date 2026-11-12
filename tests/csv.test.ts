import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLANTILLA_EQUIPOS, decodificarCSV, normalizarFecha, numerosSegunArchivo, parseEquiposCSV } from '../src/lib/csv';

test('CSV de fichas: una fila por participante (Excel en español, con ;)', () => {
  const csv = [
    'N°;Equipo;Capitán;Participante;Nacimiento;Teléfono;Tel. emergencia;Tipo de sangre;Alergias',
    '1;Águila Dorada;Juan;Juan Pérez;15/03/2004;300;301;O+;Ninguna',
    '1;Águila Dorada;;María García;2/11/2005;310;;A+;',
    '2;Toro Rojo;Pedro;Pedro Ruiz;;;;;',
  ].join('\r\n');
  const { filas, errores } = parseEquiposCSV(csv);
  assert.deepEqual(errores, []);
  assert.equal(filas.length, 2);
  const [aguila, toro] = filas;
  assert.equal(aguila.numero, 1);
  assert.equal(aguila.capitan, 'Juan');
  assert.equal(aguila.integrantes.length, 2);
  assert.deepEqual(aguila.integrantes[0], {
    nombre: 'Juan Pérez', fechaNacimiento: '2004-03-15', telefono: '300', contactoTelefono: '301', tipoSangre: 'O+', alergias: 'Ninguna',
  });
  assert.equal(aguila.integrantes[1].fechaNacimiento, '2005-11-02');
  assert.deepEqual(toro.integrantes, [{ nombre: 'Pedro Ruiz' }]);
});

test('CSV de equipos: formato anterior con integrantes separados por ;', () => {
  const { filas } = parseEquiposCSV('num,nombre_equipo,capitan,integrantes\n3,Halcones,Ana,"Ana;Luis | Eva"\n');
  assert.equal(filas[0].nombre, 'Halcones');
  assert.equal(filas[0].numero, 3);
  assert.deepEqual(filas[0].integrantes.map((p) => p.nombre), ['Ana', 'Luis', 'Eva']);
});

test('CSV: la plantilla se puede volver a importar y se leen tildes de Windows-1252', () => {
  const { filas, errores } = parseEquiposCSV(PLANTILLA_EQUIPOS);
  assert.deepEqual(errores, []);
  assert.equal(filas[0].integrantes.length, 2);
  assert.equal(filas[0].integrantes[1].alergias, 'Penicilina');
  assert.equal(decodificarCSV(new Uint8Array([0x41, 0xe1, 0x6e]).buffer), 'Aán'); // "Aán" guardado por Excel
  assert.equal(normalizarFecha('2004-03-15'), '2004-03-15');
});

test('CSV: los equipos se numeran en el orden del archivo', () => {
  assert.deepEqual(numerosSegunArchivo([{}, {}, {}]), [1, 2, 3]);
  assert.deepEqual(numerosSegunArchivo([{ numero: 5 }, {}, { numero: 9 }, {}]), [5, 6, 9, 10]);
  // N° repetido entre equipos (número del integrante, no del equipo): manda el orden del archivo
  assert.deepEqual(numerosSegunArchivo([{ numero: 1 }, { numero: 1 }, { numero: 1 }]), [1, 2, 3]);
  const { filas } = parseEquiposCSV('Equipo,Participante\nZeta,Ana\nAlfa,Luis\nZeta,Eva\nMedio,Sol\n');
  assert.deepEqual(filas.map((f) => f.nombre), ['Zeta', 'Alfa', 'Medio']); // orden de aparición, no alfabético
});
