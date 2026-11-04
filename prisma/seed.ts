// Datos de demostración: npm run db:seed
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const anio = new Date().getFullYear();
  const ev = await prisma.evento.create({
    data: {
      anio,
      nombre: `Desafío Tolotá ${anio} (demo)`,
      pruebas: { create: ['Cruce del río', 'Muro', 'Carrera de relevos'].map((nombre, posicion) => ({ nombre, posicion })) },
    },
  });
  const equipos = [
    ['Águila Dorada', 'Juan Pérez', ['María García', 'Carlos López', 'Ana Rodríguez']],
    ['Toro Rojo', 'Pedro Martínez', ['Laura Gómez', 'Diego Torres']],
    ['León de Judá', 'Samuel Ruiz', ['Rebeca Díaz', 'Andrés Mora']],
    ['Halcones', 'Sofía Herrera', ['Mateo Rojas', 'Valentina Cruz']],
  ] as const;
  for (const [i, [nombre, capitan, integrantes]] of equipos.entries()) {
    await prisma.equipo.create({
      data: {
        eventoId: ev.id,
        numero: i + 1,
        nombre,
        capitan,
        participantes: { create: [capitan, ...integrantes].map((n) => ({ nombre: n })) },
      },
    });
  }
  console.log(`Evento demo creado: ${ev.nombre} (${ev.id})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
