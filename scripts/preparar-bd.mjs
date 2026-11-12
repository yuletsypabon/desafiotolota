// Crea la base de datos local (la de DATABASE_URL) si todavía no existe.
// Uso: node --env-file=.env scripts/preparar-bd.mjs
import { PrismaClient } from '@prisma/client';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('✖ Falta DATABASE_URL en el archivo .env');
  process.exit(1);
}

const u = new URL(url);
const nombre = decodeURIComponent(u.pathname.slice(1));
if (!/^[A-Za-z0-9_]+$/.test(nombre)) {
  console.error(`✖ Nombre de base de datos no válido: "${nombre}" (usa solo letras, números y _)`);
  process.exit(1);
}
if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(u.hostname)) {
  console.log(`ℹ DATABASE_URL apunta a ${u.hostname} (no es local): no se crea nada.`);
  process.exit(0);
}

// El nombre va dentro de un CREATE DATABASE: solo letras, números y guion bajo (evita inyección de SQL)
if (!/^[A-Za-z_][A-Za-z0-9_]{0,62}$/.test(nombre)) {
  console.error(`El nombre de la base "${nombre}" no es válido: usa solo letras, números y guion bajo.`);
  process.exit(1);
}

// Conectarse a la base "postgres" (siempre existe) para poder crear la otra
u.pathname = '/postgres';
const admin = new PrismaClient({ datasourceUrl: u.toString() });
try {
  const filas = await admin.$queryRaw`SELECT 1 FROM pg_database WHERE datname = ${nombre}`;
  if (filas.length) {
    console.log(`✔ La base de datos "${nombre}" ya existe.`);
  } else {
    await admin.$executeRawUnsafe(`CREATE DATABASE "${nombre}"`);
    console.log(`✔ Base de datos "${nombre}" creada.`);
  }
} catch (e) {
  console.error('✖ No se pudo conectar a PostgreSQL en este computador.');
  console.error('  ¿Está instalado y encendido? ¿La contraseña de DATABASE_URL es la correcta?');
  console.error('  Detalle:', e.message?.split('\n').slice(-1)[0] ?? e);
  process.exit(1);
} finally {
  await admin.$disconnect();
}
